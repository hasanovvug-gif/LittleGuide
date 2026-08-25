import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/i18n';
import { eventsOfDay, useAppStore } from '@/store/useAppStore';
import { formatDuration } from '@/lib/age';
import { typography as t } from '@/constants/theme';
import { Card, Eyebrow } from '@/components/ui';
import { Row, todayLabel, useTicker } from '@/components/rhythm-shared';

/** Ритм показывает цифры и НЕ интерпретирует их: без «мало спит», норм и порогов. */
export default function FeedingScreen() {
  const theme = useTheme();
  const tr = useT();
  const insets = useSafeAreaInsets();

  const lang = useAppStore((s) => s.settings.language);
  const rhythm = useAppStore((s) => s.rhythm);
  const start = useAppStore((s) => s.startRhythm);
  const stop = useAppStore((s) => s.stopRhythm);

  const openFeeding = rhythm.find((e) => e.kind === 'feeding' && e.end === null);
  const now = useTicker(Boolean(openFeeding));

  const todayFeeding = useMemo(
    () => eventsOfDay(rhythm).filter((e) => e.kind === 'feeding'),
    [rhythm],
  );
  const lastFeeding = todayFeeding.find((e) => e.end !== null);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bgDeep }}
      contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: 24, paddingBottom: 32, gap: 20 }}
    >
      <View style={{ gap: 4 }}>
        <Text style={[t.h2, { color: theme.text }]}>{tr.feeding.title}</Text>
        <Text style={[t.caption, { color: theme.caption }]}>{todayLabel(lang)}</Text>
      </View>

      <Card theme={theme} style={{ backgroundColor: theme.cardSoft, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[t.label, { color: theme.text }]}>{tr.feeding.title}</Text>
          <Text style={[t.caption, { color: theme.caption }]}>
            {openFeeding
              ? formatDuration(now - openFeeding.start)
              : lastFeeding
                ? `${tr.feeding.lastFeeding} ${formatDuration(Date.now() - (lastFeeding.end ?? 0), true)} ${tr.feeding.ago}`
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

      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Eyebrow color={theme.caption}>{tr.rhythm.todayLabel}</Eyebrow>
          <Text style={[t.caption, { color: theme.textSecondary }]}>
            {`${todayFeeding.length} ${tr.rhythm.summaryFeedings}`}
          </Text>
        </View>

        {todayFeeding.length === 0 ? (
          <Text style={[t.caption, { color: theme.caption }]}>{tr.rhythm.empty}</Text>
        ) : (
          todayFeeding.map((e) => <Row key={e.id} event={e} now={now} theme={theme} runningLabel={tr.rhythm.running} />)
        )}
      </View>
    </ScrollView>
  );
}
