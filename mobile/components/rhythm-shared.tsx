import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import type { RhythmEvent } from '@/store/useAppStore';
import { formatClock, formatDuration } from '@/lib/age';
import { typography as t, type Theme } from '@/constants/theme';

/** Тикает раз в секунду только пока таймер запущен. Общее для Сна и Кормления. */
export function useTicker(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

const LOCALES: Record<string, string> = { ru: 'ru-RU', ua: 'uk-UA', en: 'en-GB' };

/** Дата подписывается языком приложения, а не языком телефона. */
export function todayLabel(lang: string): string {
  return new Date().toLocaleDateString(LOCALES[lang] ?? 'ru-RU', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

/**
 * Строка ленты. Вынесена из компонента: вложенное объявление пересоздаёт строку
 * на каждом тике. Список уже отфильтрован по одному виду события — подпись вида не нужна.
 */
export function Row({ event, now, theme, runningLabel }: {
  event: RhythmEvent; now: number; theme: Theme; runningLabel: string;
}) {
  const running = event.end === null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 32 }}>
      <Text style={[t.caption, { color: theme.caption, width: 46, fontVariant: ['tabular-nums'] }]}>
        {formatClock(event.start)}
      </Text>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: running ? theme.accent : theme.line }} />
      <Text style={[t.caption, { color: running ? theme.accentText : theme.textSecondary, flex: 1, textAlign: 'right' }]}>
        {running ? runningLabel : formatDuration((event.end ?? now) - event.start, true)}
      </Text>
    </View>
  );
}
