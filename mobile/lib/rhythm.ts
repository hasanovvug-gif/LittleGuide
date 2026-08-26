import { dayKey } from '@/lib/age';
import type { FeedType, RhythmEvent, RhythmKind } from '@/store/useAppStore';

export type RhythmError = 'endBeforeStart' | 'future' | 'overlap' | 'zeroLength';

/** Ночь — 20:00–08:00 местного времени, решение владельца 26.08. Никаких оценок норм сна. */
const NIGHT_START_HOUR = 20;
const NIGHT_END_HOUR = 8;

/** Открытая запись при любом подсчёте считается интервалом [start, now]. */
function effectiveEnd(e: RhythmEvent, now: number): number {
  return e.end ?? now;
}

/** Полуоткрытые интервалы [start, end) — касание концами пересечением не считается. */
function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function clip(start: number, end: number, from: number, to: number): [number, number] | null {
  const s = Math.max(start, from);
  const e = Math.min(end, to);
  return s < e ? [s, e] : null;
}

/**
 * Границы локальных суток через `Date` + `setHours(0,0,0,0)`, а не `from + 24h`:
 * в сутки перехода на летнее/зимнее время их 23 или 25 часов, и константа разъехалась бы
 * с местной полночью.
 */
export function dayBounds(key: string): { from: number; to: number } {
  const [y, m, d] = key.split('-').map(Number);
  const from = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
  const to = new Date(y, m - 1, d + 1, 0, 0, 0, 0).getTime();
  return { from, to };
}

/**
 * Проверка одной записи (готовой к сохранению) на конфликт с остальным ритмом.
 * `now` — параметр, а не `Date.now()` внутри: иначе не пересчитать открытую запись
 * и легко словить рассинхрон с мемоизацией, завязанной на `rhythm`.
 * `excludeId` — сама редактируемая запись не участвует в проверке пересечений с собой.
 */
export function validateRhythmEvent(
  input: { kind: RhythmKind; start: number; end: number | null },
  rhythm: RhythmEvent[],
  now: number,
  excludeId?: string,
): RhythmError | null {
  if (input.start > now) return 'future';
  if (input.end !== null) {
    if (input.end > now) return 'future';
    if (input.end < input.start) return 'endBeforeStart';
    if (input.end === input.start) return 'zeroLength';
  }
  const end = input.end ?? now;
  for (const e of rhythm) {
    if (e.id === excludeId) continue;
    if (e.kind !== input.kind) continue;
    if (overlaps(input.start, end, e.start, effectiveEnd(e, now))) return 'overlap';
  }
  return null;
}

/**
 * Санитайзер импортированного/восстановленного ритма — единственная дверь, через которую
 * проходит массив `rhythm` из чужого файла. Пункты и порядок пунктов — из спека 7б, менять
 * порядок нельзя: каждый следующий шаг предполагает, что предыдущий уже вычистил свою грязь.
 */
export function sanitizeRhythm(raw: RhythmEvent[], now: number): RhythmEvent[] {
  // 1–2: конец раньше начала или любая точка интервала в будущем — запись не восстановима.
  let out = raw.filter(
    (e) => (e.end === null || e.end >= e.start) && e.start <= now && (e.end === null || e.end <= now),
  );

  // 3: дубли id — иначе update/remove через map/filter тронут несколько записей одним тапом.
  const seenIds = new Set<string>();
  out = out.filter((e) => {
    if (seenIds.has(e.id)) return false;
    seenIds.add(e.id);
    return true;
  });

  // 4: несколько открытых записей одного вида — открытой остаётся самая свежая по start.
  const latestOpenId = new Map<RhythmKind, string>();
  const latestOpenStart = new Map<RhythmKind, number>();
  for (const e of out) {
    if (e.end !== null) continue;
    const cur = latestOpenStart.get(e.kind);
    if (cur === undefined || e.start > cur) {
      latestOpenStart.set(e.kind, e.start);
      latestOpenId.set(e.kind, e.id);
    }
  }
  out = out.filter((e) => e.end !== null || latestOpenId.get(e.kind) === e.id);

  // 5: пересечения одноимённых записей — более поздняя по start отбрасывается. Идём по
  // возрастанию start и берём запись, только если она не задевает уже принятую того же вида.
  const bySt = [...out].sort((a, b) => a.start - b.start);
  const accepted: RhythmEvent[] = [];
  for (const e of bySt) {
    const eEnd = effectiveEnd(e, now);
    const clash = accepted.some((a) => a.kind === e.kind && overlaps(e.start, eEnd, a.start, effectiveEnd(a, now)));
    if (!clash) accepted.push(e);
  }

  // 6: лента и .find() последнего кормления рассчитаны на убывающий порядок.
  return accepted.sort((a, b) => b.start - a.start);
}

/** Кормления считаются по дню НАЧАЛА, а не по пересечению — иначе кормление через полночь
 *  попало бы в счётчик обоих дней. «6 кормлений» = 6 начатых. */
export function feedingsOfDay(rhythm: RhythmEvent[], key: string): RhythmEvent[] {
  return rhythm.filter((e) => e.kind === 'feeding' && dayKey(new Date(e.start)) === key);
}

/** Записи, пересекающие выбранный день, — для ленты (не для итоговых цифр). */
export function eventsIntersectingDay(rhythm: RhythmEvent[], key: string, now: number, kind: RhythmKind): RhythmEvent[] {
  const { from, to } = dayBounds(key);
  return rhythm.filter((e) => e.kind === kind && overlaps(e.start, effectiveEnd(e, now), from, to));
}

/** Запись пересекает полночь — в ленте она одна, с пометкой «через ночь». */
export function crossesMidnight(e: RhythmEvent, now: number): boolean {
  return dayKey(new Date(e.start)) !== dayKey(new Date(effectiveEnd(e, now)));
}

/** Сумма пересечений снов с сутками. Сон 21:30→06:10 даёт 2:30 у одного дня и 6:10 у другого. */
export function sleepMsOfDay(rhythm: RhythmEvent[], key: string, now: number): number {
  const { from, to } = dayBounds(key);
  let sum = 0;
  for (const e of rhythm) {
    if (e.kind !== 'sleep') continue;
    const seg = clip(e.start, effectiveEnd(e, now), from, to);
    if (seg) sum += seg[1] - seg[0];
  }
  return sum;
}

export type SleepSegment = { from: number; to: number; crossesNight: boolean };

/**
 * Отрезки снов для полосы суток, обрезанные по границам суток. `crossesNight` — исходная
 * запись выходит за пределы этих суток (кусок вчерашней или сегодняшней ночи), а не про
 * ночной интервал 20:00–08:00 — это для визуальной пометки обрезанного края на полосе.
 */
export function sleepSegmentsOfDay(rhythm: RhythmEvent[], key: string, now: number): SleepSegment[] {
  const { from, to } = dayBounds(key);
  const segments: SleepSegment[] = [];
  for (const e of rhythm) {
    if (e.kind !== 'sleep') continue;
    const end = effectiveEnd(e, now);
    const seg = clip(e.start, end, from, to);
    if (!seg) continue;
    segments.push({ from: seg[0], to: seg[1], crossesNight: e.start < from || end > to });
  }
  return segments.sort((a, b) => a.from - b.from);
}

export type SleepSummary = { nightMs: number; dayMs: number; count: number };

/**
 * Итог дня для Сна: «ночью X · днём Y в N снах». Ночь/день режут КАЖДЫЙ обрезанный по
 * суткам отрезок ещё раз по 08:00/20:00 внутри тех же суток — так граница остаётся
 * локальной для дня и не требует оглядки на соседние сутки.
 */
export function sleepSummaryOfDay(rhythm: RhythmEvent[], key: string, now: number): SleepSummary {
  const segments = sleepSegmentsOfDay(rhythm, key, now);
  const [y, m, d] = key.split('-').map(Number);
  const morningEnd = new Date(y, m - 1, d, NIGHT_END_HOUR, 0, 0, 0).getTime();
  const eveningStart = new Date(y, m - 1, d, NIGHT_START_HOUR, 0, 0, 0).getTime();

  // Отрезок уже обрезан по суткам (seg.from ≥ 00:00, seg.to ≤ следующая полночь), поэтому
  // достаточно порезать его ещё раз по двум границам без оглядки на соседние сутки.
  let nightMs = 0;
  let dayMs = 0;
  for (const seg of segments) {
    const preMorning = Math.min(seg.to, morningEnd);
    if (preMorning > seg.from) nightMs += preMorning - seg.from;

    const dayStart = Math.max(seg.from, morningEnd);
    const dayEnd = Math.min(seg.to, eveningStart);
    if (dayEnd > dayStart) dayMs += dayEnd - dayStart;

    const postEvening = Math.max(seg.from, eveningStart);
    if (seg.to > postEvening) nightMs += seg.to - postEvening;
  }
  return { nightMs, dayMs, count: segments.length };
}

export const FEED_TYPES: FeedType[] = ['breast', 'bottle', 'solid'];

/** Пороги полоски «забытый таймер» — без пушей и без оценок про ребёнка, только про таймер. */
export const STUCK_SLEEP_MS = 5 * 60 * 60 * 1000;
export const STUCK_FEEDING_MS = 90 * 60 * 1000;
