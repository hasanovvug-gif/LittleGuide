import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/i18n';
import { eventsOfDay, useAppStore, type RhythmEvent } from '@/store/useAppStore';
import { formatClock, formatDuration } from '@/lib/age';
import { typography as t, fonts, type Theme } from '@/constants/theme';
import { Card, Eyebrow } from '@/components/ui';

/** Ритм показывает цифры и НЕ интерпретирует их: без «мало спит», норм и порогов. */
export default function RhythmScreen() {
  const theme = useTheme();
  const tr = useT();
  const insets = useSafeAreaInsets();

  const lang = useAppStore((s) => s.settings.language);
  const rhythm = useAppStore((s) => s.rhythm);
  const start = useAppStore((s) => s.startRhythm);
  const stop = useAppStore((s) => s.stopRhythm);

  const openSleep = rhythm.find((e) => e.kind === 'sleep' && e.end === null);
  const openFeeding = rhythm.find((e) => e.kind === 'feeding' && e.end === null);
  const now = useTicker(Boolean(openSleep || openFeeding));

  const today = eventsOfDay(rhythm);
  const sleptMs = today
    .filter((e) => e.kind === 'sleep')
    .reduce((sum, e) => sum + ((e.end ?? now) - e.start), 0);
  const feedings = today.filter((e) => e.kind === 'feeding').length;
  const lastFeeding = today.find((e) => e.kind === 'feeding' && e.end !== null);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bgDeep }}
      contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: 24, paddingBottom: 32, gap: 20 }}
    >
      <View style={{ gap: 4 }}>
        <Text style={[t.h2, { color: theme.text }]}>{tr.rhythm.title}</Text>
        <Text style={[t.caption, { color: theme.caption }]}>{todayLabel(lang)}</Text>
      </View>

      <Card theme={theme} style={{ backgroundColor: theme.card, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[t.label, { color: theme.text }]}>{tr.rhythm.sleep}</Text>
          {openSleep ? <Text style={[t.caption, { color: theme.accentText }]}>{tr.rhythm.running}</Text> : null}
        </View>

        <Text
          style={{
            fontFamily: fonts.serif, fontSize: 44, color: theme.text,
            fontVariant: ['tabular-nums'], letterSpacing: -0.5,
          }}
        >
          {openSleep ? formatDuration(now - openSleep.start) : '00:00'}
        </Text>
        <Text style={[t.caption, { color: theme.caption }]}>
          {openSleep ? `${tr.rhythm.startSleep.toLowerCase()} ${formatClock(openSleep.start)}` : ' '}
        </Text>

        <Pressable
          onPress={() => (openSleep ? stop('sleep') : start('sleep'))}
          style={{
            height: theme.bigHit, borderRadius: theme.radius.md,
            backgroundColor: openSleep ? theme.accent : theme.chip,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={[t.button, { color: openSleep ? theme.onAccent : theme.text }]}>
            {openSleep ? tr.rhythm.stopSleep : tr.rhythm.startSleep}
          </Text>
        </Pressable>
      </Card>

      <Card theme={theme} style={{ backgroundColor: theme.cardSoft, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[t.label, { color: theme.text }]}>{tr.rhythm.feeding}</Text>
          <Text style={[t.caption, { color: theme.caption }]}>
            {openFeeding
              ? formatDuration(now - openFeeding.start)
              : lastFeeding
                ? `${tr.rhythm.lastFeeding} ${formatDuration(Date.now() - (lastFeeding.end ?? 0), true)} ${tr.rhythm.ago}`
                : tr.rhythm.noFeeding}
          </Text>
        </View>
        <Pressable
          onPress={() => (openFeeding ? stop('feeding') : start('feeding'))}
          style={{
            height: theme.bigHit, borderRadius: theme.radius.md,
            backgroundColor: openFeeding ? theme.accent : theme.chip,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={[t.button, { color: openFeeding ? theme.onAccent : theme.text }]}>
            {openFeeding ? tr.rhythm.stopFeeding : tr.rhythm.startFeeding}
          </Text>
        </Pressable>
      </Card>

      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Eyebrow color={theme.caption}>{tr.rhythm.todayLabel}</Eyebrow>
          <Text style={[t.caption, { color: theme.textSecondary }]}>
            {`${tr.rhythm.summarySleep} ${formatDuration(sleptMs, true)} · ${feedings} ${tr.rhythm.summaryFeedings}`}
          </Text>
        </View>

        {today.length === 0 ? (
          <Text style={[t.caption, { color: theme.caption }]}>{tr.rhythm.empty}</Text>
        ) : (
          today.map((e) => (
            <Row key={e.id} event={e} now={now} theme={theme} labels={tr.rhythm} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

/** Вынесен из компонента: вложенное объявление пересоздаёт строку на каждом тике. */
function Row({ event, now, theme, labels }: {
  event: RhythmEvent; now: number; theme: Theme; labels: { sleep: string; feeding: string; running: string };
}) {
  const running = event.end === null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 32 }}>
      <Text style={[t.caption, { color: theme.caption, width: 46, fontVariant: ['tabular-nums'] }]}>
        {formatClock(event.start)}
      </Text>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: running ? theme.accent : theme.line }} />
      <Text style={[t.caption, { color: theme.text, flex: 1 }]}>
        {event.kind === 'sleep' ? labels.sleep : labels.feeding}
      </Text>
      <Text style={[t.caption, { color: running ? theme.accentText : theme.textSecondary }]}>
        {running ? labels.running : formatDuration((event.end ?? now) - event.start, true)}
      </Text>
    </View>
  );
}

/** Тикает раз в секунду только пока таймер запущен. */
function useTicker(active: boolean): number {
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
function todayLabel(lang: string): string {
  return new Date().toLocaleDateString(LOCALES[lang] ?? 'ru-RU', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}
