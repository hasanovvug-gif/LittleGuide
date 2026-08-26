import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import type { RhythmEvent } from '@/store/useAppStore';
import type { SleepSegment } from '@/lib/rhythm';
import { dayKey, formatClock, formatDuration } from '@/lib/age';
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

/**
 * Раз в минуту, только пока где-то есть открытая запись — для Дома: без тика он был
 * заморожен на времени открытия приложения и после полуночи показывал вчерашние сутки.
 * Секундная точность здесь не нужна, Дом не крутит таймер посекундно.
 */
export function useMinuteTicker(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

const LOCALES: Record<string, string> = { ru: 'ru-RU', ua: 'uk-UA', en: 'en-GB' };

/**
 * Подпись выбранных суток: «Сегодня» / «Вчера» / полная дата для всего, что раньше.
 * Раньше формат был жёстко привязан к `new Date()` — при просмотре прошлого дня подпись
 * всё равно показывала сегодняшнюю дату.
 */
export function dayLabel(lang: string, date: Date, todayStr: string, yesterdayStr: string): string {
  const key = dayKey(date);
  if (key === dayKey()) return todayStr;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (key === dayKey(y)) return yesterdayStr;
  return date.toLocaleDateString(LOCALES[lang] ?? 'ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
}

type DurationUnits = { hours: string; minutesShort: string };

/**
 * Строка ленты. Вынесена из компонента: вложенное объявление пересоздаёт строку
 * на каждом тике. Список уже отфильтрован по одному виду события — подпись вида не нужна.
 * Тап открывает карточку правки — это главный вход в ретро-редактирование.
 */
export function Row({ event, now, theme, runningLabel, units, feedLabel, crossedLabel, onPress }: {
  event: RhythmEvent;
  now: number;
  theme: Theme;
  runningLabel: string;
  units: DurationUnits;
  feedLabel?: string;
  crossedLabel?: string;
  onPress: () => void;
}) {
  const running = event.end === null;
  const note = [feedLabel, crossedLabel].filter(Boolean).join(' · ');
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}>
      <Text style={[t.caption, { color: theme.caption, width: 46, fontVariant: ['tabular-nums'] }]}>
        {formatClock(event.start)}
      </Text>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: running ? theme.accent : theme.line }} />
      <View style={{ flex: 1, alignItems: 'flex-end', gap: 2 }}>
        <Text style={[t.caption, { color: running ? theme.accentText : theme.textSecondary }]}>
          {running ? runningLabel : formatDuration((event.end ?? now) - event.start, true, units)}
        </Text>
        {note ? <Text style={[t.caption, { color: theme.caption, fontSize: 11 }]}>{note}</Text> : null}
      </View>
    </Pressable>
  );
}

const STRIP_H = 36;
const STRIP_W = 1000;

/**
 * Полоса суток, общая для Сна и Кормления: сон — тёмные блоки на светлой дорожке,
 * кормления — вертикальные засечки. `from`/`to` — фактические границы суток (не 24ч
 * константа): в переходные сутки DST их 23 или 25 часов, и масштаб обязан это учитывать.
 */
export function DayStrip({ theme, from, to, sleepSegments, feedingTimes }: {
  theme: Theme;
  from: number;
  to: number;
  sleepSegments?: SleepSegment[];
  feedingTimes?: number[];
}) {
  const span = Math.max(1, to - from);
  const x = (ts: number) => ((ts - from) / span) * STRIP_W;

  return (
    <Svg width="100%" height={STRIP_H} viewBox={`0 0 ${STRIP_W} ${STRIP_H}`}>
      <Rect x={0} y={0} width={STRIP_W} height={STRIP_H} rx={STRIP_H / 2} fill={theme.chip} />
      {sleepSegments?.map((seg, i) => {
        const x1 = x(seg.from);
        const width = Math.max(x(seg.to) - x1, 3);
        return <Rect key={i} x={x1} y={0} width={width} height={STRIP_H} rx={STRIP_H / 2} fill={theme.accent} />;
      })}
      {feedingTimes?.map((ts, i) => (
        <Rect key={i} x={Math.max(0, x(ts) - 2)} y={5} width={4} height={STRIP_H - 10} rx={2} fill={theme.accentText} />
      ))}
    </Svg>
  );
}
