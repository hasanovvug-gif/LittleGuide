import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/i18n';
import { useAppStore, type RhythmEvent } from '@/store/useAppStore';
import { dayKey, formatClock, formatDuration, formatHoursMinutes } from '@/lib/age';
import {
  crossesMidnight,
  dayBounds,
  eventsIntersectingDay,
  sleepSegmentsOfDay,
  sleepSummaryOfDay,
  STUCK_SLEEP_MS,
} from '@/lib/rhythm';
import { typography as t, fonts } from '@/constants/theme';
import { Card, Eyebrow } from '@/components/ui';
import { DayStrip, Row, dayLabel, useTicker } from '@/components/rhythm-shared';
import { RhythmCard, StuckTimerBanner } from '@/components/RhythmCard';
import { IconArrowLeft, IconArrowRight, IconPlus } from '@/components/Icon';

/** Ритм показывает цифры и НЕ интерпретирует их: без «мало спит», норм и порогов. */
export default function SleepScreen() {
  const theme = useTheme();
  const tr = useT();
  const insets = useSafeAreaInsets();

  const lang = useAppStore((s) => s.settings.language);
  const rhythm = useAppStore((s) => s.rhythm);
  const start = useAppStore((s) => s.startRhythm);
  const stop = useAppStore((s) => s.stopRhythm);
  const updateRhythm = useAppStore((s) => s.updateRhythm);

  const [dayOffset, setDayOffset] = useState(0);
  const [cardTarget, setCardTarget] = useState<RhythmEvent | 'new' | null>(null);

  const openSleep = rhythm.find((e) => e.kind === 'sleep' && e.end === null);
  const now = useTicker(Boolean(openSleep));
  const isToday = dayOffset === 0;

  const selectedDate = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() - dayOffset);
    return d;
  }, [now, dayOffset]);
  const selectedKey = dayKey(selectedDate);
  const selectedLabel = dayLabel(lang, selectedDate, tr.rhythm.today, tr.rhythm.yesterday);

  const { from, to } = useMemo(() => dayBounds(selectedKey), [selectedKey]);
  const segments = useMemo(() => sleepSegmentsOfDay(rhythm, selectedKey, now), [rhythm, selectedKey, now]);
  const summary = useMemo(() => sleepSummaryOfDay(rhythm, selectedKey, now), [rhythm, selectedKey, now]);
  const ribbon = useMemo(() => eventsIntersectingDay(rhythm, selectedKey, now, 'sleep'), [rhythm, selectedKey, now]);

  // Массив отсортирован по start убывающе — первая завершённая запись и есть самая свежая.
  const lastCompletedSleep = useMemo(() => rhythm.find((e) => e.kind === 'sleep' && e.end !== null) ?? null, [rhythm]);
  const notSleepingMs = isToday && !openSleep && lastCompletedSleep ? now - (lastCompletedSleep.end ?? now) : null;

  // Полоска о забытом таймере — только пока смотрим сегодня, как и крупная карточка таймера.
  const stuck = isToday && openSleep && now - openSleep.start > STUCK_SLEEP_MS ? openSleep : null;

  function onBannerChip(minutes: number) {
    if (!stuck) return;
    updateRhythm(stuck.id, { end: Date.now() - minutes * 60_000 });
  }

  const summaryText = `${tr.sleep.nightPart} ${formatDuration(summary.nightMs, true, tr.common)} · ${tr.sleep.dayPart} ${formatDuration(summary.dayMs, true, tr.common)} ${tr.sleep.inSleepsCount.replace('{n}', String(summary.count))}`;

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.bgDeep }}
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: 24, paddingBottom: 32, gap: 18 }}
      >
        <Text style={[t.h2, { color: theme.text }]}>{tr.sleep.title}</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => setDayOffset((v) => v + 1)} hitSlop={10} style={{ minWidth: 32, minHeight: 32, alignItems: 'flex-start', justifyContent: 'center' }}>
            <IconArrowLeft size={18} color={theme.captionWarm} />
          </Pressable>
          <Text style={[t.caption, { color: theme.caption }]}>{selectedLabel}</Text>
          <Pressable
            onPress={() => setDayOffset((v) => Math.max(0, v - 1))}
            disabled={isToday}
            hitSlop={10}
            style={{ minWidth: 32, minHeight: 32, alignItems: 'flex-end', justifyContent: 'center', opacity: isToday ? 0.3 : 1 }}
          >
            <IconArrowRight size={18} color={theme.captionWarm} />
          </Pressable>
        </View>

        <DayStrip theme={theme} from={from} to={to} sleepSegments={segments} />

        {stuck ? (
          <StuckTimerBanner
            theme={theme}
            tr={tr}
            text={tr.rhythmCard.stuckSleep.replace('{time}', formatHoursMinutes(now - stuck.start))}
            onPressChip={onBannerChip}
            onPressText={() => setCardTarget(stuck)}
          />
        ) : null}

        {isToday ? (
          <Card theme={theme} style={{ backgroundColor: theme.card, gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', minHeight: 18 }}>
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
              {openSleep
                ? `${tr.sleep.startSleep.toLowerCase()} ${formatClock(openSleep.start)}`
                : notSleepingMs !== null
                  ? `${tr.sleep.notSleeping} ${formatDuration(notSleepingMs, true, tr.common)}`
                  : ' '}
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
                {openSleep ? tr.sleep.stopSleep : tr.sleep.startSleep}
              </Text>
            </Pressable>
          </Card>
        ) : null}

        <Text style={[t.caption, { color: theme.textSecondary }]}>{summaryText}</Text>

        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Eyebrow color={theme.caption}>{selectedLabel}</Eyebrow>
            <Pressable onPress={() => setCardTarget('new')} hitSlop={8} style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}>
              <IconPlus size={18} color={theme.accentText} />
            </Pressable>
          </View>

          {ribbon.length === 0 ? (
            <Text style={[t.caption, { color: theme.caption }]}>{tr.rhythm.empty}</Text>
          ) : (
            ribbon.map((e) => (
              <Row
                key={e.id}
                event={e}
                now={now}
                theme={theme}
                units={tr.common}
                runningLabel={tr.rhythm.running}
                crossedLabel={crossesMidnight(e, now) ? tr.rhythm.throughNight : undefined}
                onPress={() => setCardTarget(e)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {cardTarget ? (
        <RhythmCard theme={theme} tr={tr} kind="sleep" target={cardTarget} onClose={() => setCardTarget(null)} />
      ) : null}
    </>
  );
}
