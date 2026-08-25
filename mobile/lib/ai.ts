import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { Lang } from '@/content/types';

/**
 * Тонкий клиент к воркеру-прокси. Приложение обязано работать без него:
 * любая ошибка здесь означает «читайте готовые сказки», а не сломанный экран.
 */

const INSTALL_KEY = 'littleguide.installId';
const TIMEOUT = 30_000;

type Extra = { aiProxyUrl?: string; aiAppToken?: string };
const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const aiEnabled = Boolean(extra.aiProxyUrl);

let installId: string | null = null;

async function getInstallId(): Promise<string> {
  if (installId) return installId;
  const stored = await AsyncStorage.getItem(INSTALL_KEY);
  if (stored) {
    installId = stored;
    return stored;
  }
  const fresh = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(INSTALL_KEY, fresh);
  installId = fresh;
  return fresh;
}

/** Коды, которые приложение различает: всё остальное — просто «не получилось». */
export type AiError = 'offline' | 'rate_limited' | 'blocked' | 'failed';

export class AiFailure extends Error {
  constructor(public code: AiError) {
    super(code);
  }
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  if (!extra.aiProxyUrl) throw new AiFailure('offline');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(`${extra.aiProxyUrl}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-app-token': extra.aiAppToken ?? '',
        'x-install-id': await getInstallId(),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const code = res.status === 429 ? 'rate_limited' : res.status === 422 ? 'blocked' : 'failed';
      throw new AiFailure(code);
    }
    return (await res.json()) as T;
  } catch (e) {
    throw e instanceof AiFailure ? e : new AiFailure('offline');
  } finally {
    clearTimeout(timer);
  }
}

export type AiStory = { title: string; text: string };
export type AiActivity = { title: string; body: string; minutes: number; whyTitle: string; whyBody: string };

export function generateStory(childName: string, dayContext: string, lang: Lang): Promise<AiStory> {
  return post<AiStory>('/v1/story', { childName, dayContext, lang });
}

export function generateActivity(childName: string, weeks: number, lang: Lang): Promise<AiActivity> {
  return post<AiActivity>('/v1/activity', { childName, weeks, lang });
}

export function generateSummary(childName: string, entries: string[], lang: Lang): Promise<{ text: string }> {
  return post<{ text: string }>('/v1/summary', { childName, entries, lang });
}

/** Минуты чтения — по объёму текста, чтобы карточка сказки выглядела как бандловая. */
export function readingMinutes(text: string): number {
  return Math.max(2, Math.round(text.split(/\s+/).length / 130));
}

/**
 * Согласие на отправку текста наружу. Apple (5.1.2) требует спросить до первой передачи
 * персональных данных в сторонний AI и назвать, что и куда уходит.
 */
export function askConsent(texts: { consentTitle: string; consentBody: string; allow: string; later: string }): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(texts.consentTitle, texts.consentBody, [
      { text: texts.later, style: 'cancel', onPress: () => resolve(false) },
      { text: texts.allow, onPress: () => resolve(true) },
    ]);
  });
}
