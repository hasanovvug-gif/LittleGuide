import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useT, type Dict } from '@/i18n';
import { useAppStore, type FeedType, type RhythmEvent } from '@/store/useAppStore';
import { dayKey, formatDuration, formatHoursMinutes } from '@/lib/age';
import {
  crossesMidnight,
  dayBounds,
  eventsIntersectingDay,
  feedingsOfDay,
  STUCK_FEEDING_MS,
} from '@/lib/rhythm';
import { typography as t } from '@/constants/theme';
import { Card, Eyebrow } from '@/components/ui';
import { DayStrip, Row, dayLabel, useTicker } from '@/components/rhythm-shared';
import { RhythmCard, StuckTimerBanner } from '@/components/RhythmCard';
import { IconArrowLeft, IconArrowRight, IconPlus } from '@/components/Icon';

function feedTypeLabel(feedType: FeedType | undefined, tr: Dict): string | undefined {
  if (feedType === 'breast') return tr.rhythmCard.feedBreast;
  if (feedType === 'bottle') return tr.rhythmCard.feedBottle;
  if (feedType === 'solid') return tr.rhythmCard.feedSolid;
  return undefined;
}

/** Ритм показывает цифры и НЕ интерпретирует их: без «мало спит», норм и порогов. */
export default function FeedingScreen() {
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

  const openFeeding = rhythm.find((e) => e.kind === 'feeding' && e.end === null);
  const now = useTicker(Boolean(openFeeding));
  const isToday = dayOffset === 0;

  const selectedDate = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() - dayOffset);
    return d;
  }, [now, dayOffset]);
  const selectedKey = dayKey(selectedDate);
  const selectedLabel = dayLabel(lang, selectedDate, tr.rhythm.today, tr.rhythm.yesterday);

  const { from, to } = useMemo(() => dayBounds(selectedKey), [selectedKey]);
  // Кормления считаются по дню НАЧАЛА, а не по пересечению — иначе через полночь попали бы в оба дня.
  const todayCount = useMemo(() => feedingsOfDay(rhythm, selectedKey).length, [rhythm, selectedKey]);
  const ribbon = useMemo(() => eventsIntersectingDay(rhythm, selectedKey, now, 'feeding'), [rhythm, selectedKey, now]);
  const feedingTimes = useMemo(() => ribbon.map((e) => e.start), [ribbon]);

  // «Последнее X назад» — от реального сейчас, не завязано на выбранный день и не ищет только
  // среди сегодняшних записей: иначе сразу после полуночи показывало бы «сегодня не кормили».
  const lastCompletedFeeding = useMemo(() => rhythm.find((e) => e.kind === 'feeding' && e.end !== null) ?? null, [rhythm]);

  const stuck = isToday && openFeeding && now - openFeeding.start > STUCK_FEEDING_MS ? openFeeding : null;

  function onBannerChip(minutes: number) {
    if (!stuck) return;
    updateRhythm(stuck.id, { end: Date.now() - minutes * 60_000 });
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.bgDeep }}
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: 24, paddingBottom: 32, gap: 18 }}
      >
        <Text style={[t.h2, { color: theme.text }]}>{tr.feeding.title}</Text>

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

        <DayStrip theme={theme} from={from} to={to} feedingTimes={feedingTimes} />

        {stuck ? (
          <StuckTimerBanner
            theme={theme}
            tr={tr}
            text={tr.rhythmCard.stuckFeeding.replace('{time}', formatHoursMinutes(now - stuck.start))}
            onPressChip={onBannerChip}
            onPressText={() => setCardTarget(stuck)}
          />
        ) : null}

        {isToday ? (
          <Card theme={theme} style={{ backgroundColor: theme.cardSoft, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[t.label, { color: theme.text }]}>{tr.feeding.title}</Text>
              <Text style={[t.caption, { color: theme.caption }]}>
                {openFeeding
                  ? formatDuration(now - openFeeding.start)
                  : lastCompletedFeeding
                    ? `${tr.feeding.lastFeeding} ${formatDuration(Date.now() - (lastCompletedFeeding.end ?? Date.now()), true, tr.common)} ${tr.feeding.ago}`
                    : tr.feeding.noFeeding}
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
                {openFeeding ? tr.feeding.stopFeeding : tr.feeding.startFeeding}
              </Text>
            </Pressable>
          </Card>
        ) : null}

        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Eyebrow color={theme.caption}>{selectedLabel}</Eyebrow>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={[t.caption, { color: theme.textSecondary }]}>{`${todayCount} ${tr.rhythm.summaryFeedings}`}</Text>
              <Pressable onPress={() => setCardTarget('new')} hitSlop={8} style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}>
                <IconPlus size={18} color={theme.accentText} />
              </Pressable>
            </View>
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
                feedLabel={feedTypeLabel(e.feedType, tr)}
                crossedLabel={crossesMidnight(e, now) ? tr.rhythm.throughNight : undefined}
                onPress={() => setCardTarget(e)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {cardTarget ? (
        <RhythmCard theme={theme} tr={tr} kind="feeding" target={cardTarget} onClose={() => setCardTarget(null)} />
      ) : null}
    </>
  );
}
