import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/i18n';
import { eventsOfDay, useAppStore } from '@/store/useAppStore';
import { formatClock, formatDuration } from '@/lib/age';
import { typography as t, fonts } from '@/constants/theme';
import { Card, Eyebrow } from '@/components/ui';
import { Row, todayLabel, useTicker } from '@/components/rhythm-shared';

/** Ритм показывает цифры и НЕ интерпретирует их: без «мало спит», норм и порогов. */
export default function SleepScreen() {
  const theme = useTheme();
  const tr = useT();
  const insets = useSafeAreaInsets();

  const lang = useAppStore((s) => s.settings.language);
  const rhythm = useAppStore((s) => s.rhythm);
  const start = useAppStore((s) => s.startRhythm);
  const stop = useAppStore((s) => s.stopRhythm);

  const openSleep = rhythm.find((e) => e.kind === 'sleep' && e.end === null);
  const now = useTicker(Boolean(openSleep));

  const todaySleep = useMemo(
    () => eventsOfDay(rhythm).filter((e) => e.kind === 'sleep'),
    [rhythm],
  );
  const sleptMs = todaySleep.reduce((sum, e) => sum + ((e.end ?? now) - e.start), 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bgDeep }}
      contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: 24, paddingBottom: 32, gap: 20 }}
    >
      <View style={{ gap: 4 }}>
        <Text style={[t.h2, { color: theme.text }]}>{tr.sleep.title}</Text>
        <Text style={[t.caption, { color: theme.caption }]}>{todayLabel(lang)}</Text>
      </View>

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
          {openSleep ? `${tr.sleep.startSleep.toLowerCase()} ${formatClock(openSleep.start)}` : ' '}
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

      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Eyebrow color={theme.caption}>{tr.rhythm.todayLabel}</Eyebrow>
          <Text style={[t.caption, { color: theme.textSecondary }]}>
            {`${tr.rhythm.summarySleep} ${formatDuration(sleptMs, true)}`}
          </Text>
        </View>

        {todaySleep.length === 0 ? (
          <Text style={[t.caption, { color: theme.caption }]}>{tr.rhythm.empty}</Text>
        ) : (
          todaySleep.map((e) => <Row key={e.id} event={e} now={now} theme={theme} runningLabel={tr.rhythm.running} />)
        )}
      </View>
    </ScrollView>
  );
}
