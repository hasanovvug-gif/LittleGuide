import {
  activityPrompt, activitySchema, storyPrompt, storySchema, summaryPrompt, type Lang,
} from './prompts';

/**
 * Прокси к Gemini. Единственная причина существования — ключ не должен лежать
 * в приложении: из собранного бандла его достаёт любой желающий.
 * Приложение без воркера остаётся полностью рабочим, поэтому здесь нет ни базы,
 * ни аккаунтов — только проверка токена, лимит и один запрос к модели.
 */

export type Env = {
  GEMINI_API_KEY: string;
  APP_TOKEN: string;
  MODEL?: string;
  RATE_BURST: RateLimiter;   // всплеск: несколько запросов в минуту с одного устройства
  RATE_GLOBAL: RateLimiter;  // общий потолок на всех: 60 запросов в минуту
};

type RateLimiter = { limit: (opts: { key: string }) => Promise<{ success: boolean }> };

const DEFAULT_MODEL = 'gemini-3.1-flash-lite';
const LANGS: Lang[] = ['ru', 'ua', 'en'];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const fail = (code: string, status: number) => json({ error: code }, status);

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method !== 'POST') return fail('method_not_allowed', 405);

    const path = new URL(req.url).pathname;
    if (!['/v1/story', '/v1/activity', '/v1/summary'].includes(path)) return fail('not_found', 404);

    if (req.headers.get('x-app-token') !== env.APP_TOKEN) return fail('unauthorized', 401);

    // Ключ лимита — installId устройства; подделать его тривиально, поэтому вторым
    // ключом идёт IP: вместе они отсекают и болтливое приложение, и один жадный клиент.
    const installId = (req.headers.get('x-install-id') ?? '').slice(0, 64) || 'anon';
    const ip = req.headers.get('cf-connecting-ip') ?? 'unknown';
    // Сбой лимитера закрывает дверь, а не открывает: без счётчика в Gemini не ходим.
    try {
      const burst = await env.RATE_BURST.limit({ key: `${installId}:${ip}` });
      if (!burst.success) return fail('rate_limited', 429);
      const global = await env.RATE_GLOBAL.limit({ key: 'global' });
      if (!global.success) return fail('busy', 429);
    } catch {
      return fail('rate_limited', 429);
    }

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return fail('bad_request', 400);
    }

    const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
    const childName = str(body.childName, 40) || '…';
    const lang = LANGS.includes(body.lang as Lang) ? (body.lang as Lang) : 'ru';

    let prompt: string;
    let schema: unknown = null;

    if (path === '/v1/story') {
      const dayContext = str(body.dayContext, 600);
      if (!dayContext) return fail('bad_request', 400);
      prompt = storyPrompt(childName, dayContext, lang);
      schema = storySchema;
    } else if (path === '/v1/activity') {
      const weeks = typeof body.weeks === 'number' ? Math.min(260, Math.max(0, Math.floor(body.weeks))) : 0;
      prompt = activityPrompt(childName, weeks, lang);
      schema = activitySchema;
    } else {
      const entries = Array.isArray(body.entries)
        ? body.entries.filter((e): e is string => typeof e === 'string').slice(0, 40).map((e) => e.slice(0, 300))
        : [];
      if (entries.length === 0) return fail('bad_request', 400);
      prompt = summaryPrompt(childName, entries, lang);
    }

    return callGemini(env, prompt, schema, path === '/v1/summary');
  },
};

async function callGemini(env: Env, prompt: string, schema: unknown, plainText: boolean): Promise<Response> {
  const model = env.MODEL || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const payload: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: schema
      ? { responseMimeType: 'application/json', responseSchema: schema, temperature: 1 }
      : { temperature: 1 },
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    return fail('upstream_unavailable', 503);
  }

  if (!res.ok) {
    // 429 у Gemini — исчерпан бесплатный тир; приложению это тот же «попробуйте позже».
    return fail(res.status === 429 ? 'rate_limited' : 'upstream_error', res.status === 429 ? 429 : 502);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    promptFeedback?: { blockReason?: string };
  };

  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';

  // Детская тематика иногда цепляет safety-фильтр: ответа нет, и это не сбой сети.
  if (data.promptFeedback?.blockReason || !text) return fail('blocked', 422);

  if (plainText) return json({ text });

  // Схема задана запросом, но ответ модели всё равно проверяем: пустое поле дойдёт до экрана.
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const ok = Object.values(parsed).every((v) =>
      (typeof v === 'string' && v.trim().length > 0) || (typeof v === 'number' && Number.isFinite(v)));
    if (!ok || Object.keys(parsed).length === 0) return fail('bad_upstream_json', 502);
    return json(parsed);
  } catch {
    return fail('bad_upstream_json', 502);
  }
}
