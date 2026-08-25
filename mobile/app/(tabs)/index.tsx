import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/i18n';
import { markedDaysThisMonth, useAppStore } from '@/store/useAppStore';
import { activitiesForWeek, activityOfDay, fill, leapForWeek, stormNote, weatherForWeek, weekEntry } from '@/content';
import { aiEnabled, askConsent, generateActivity, type AiActivity } from '@/lib/ai';
import { dayKey, weeksSince } from '@/lib/age';
import { typography as t, fonts } from '@/constants/theme';
import { Card, Eyebrow } from '@/components/ui';
import { IconCheck, IconChevron, IconCloud, IconDots } from '@/components/Icon';

export default function TodayScreen() {
  const theme = useTheme();
  const tr = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [whyOpen, setWhyOpen] = useState(false);
  const [aiActivity, setAiActivity] = useState<AiActivity | null>(null);
  const [busy, setBusy] = useState(false);

  const child = useAppStore((s) => s.child)!;
  const lang = useAppStore((s) => s.settings.language);
  const marks = useAppStore((s) => s.marks);
  const skips = useAppStore((s) => s.skips);
  const markDone = useAppStore((s) => s.markActivityDone);
  const skipActivity = useAppStore((s) => s.skipActivity);
  const consent = useAppStore((s) => s.settings.aiConsent);
  const setSettings = useAppStore((s) => s.setSettings);

  const today = dayKey();
  const week = weeksSince(child.birth);
  const entry = weekEntry(lang, week);
  const weather = weatherForWeek(lang, week);
  const leap = leapForWeek(lang, week);
  const activity = useMemo(
    () => activityOfDay(lang, week, today, skips[today] ?? 0),
    [lang, week, today, skips],
  );

  // Бандловые игры этой недели кончились — только тогда просим новую у воркера.
  const poolSize = useMemo(() => activitiesForWeek(lang, week).length, [lang, week]);
  const poolExhausted = (skips[today] ?? 0) >= poolSize;

  const card = aiActivity
    ? { id: `ai_${today}`, minutes: aiActivity.minutes, title: aiActivity.title, text: aiActivity.body, why: aiActivity.whyBody, ai: true }
    : { id: activity.id, minutes: activity.minutes, title: activity.title, text: fill(activity.text, child.name), why: activity.why, ai: false };

  async function onAnother() {
    if (busy) return;
    if (!aiEnabled || !poolExhausted) {
      setAiActivity(null);
      skipActivity();
      return;
    }
    if (!consent) {
      if (!(await askConsent(tr.ai))) {
        skipActivity();
        return;
      }
      setSettings({ aiConsent: true });
    }
    setBusy(true);
    try {
      setAiActivity(await generateActivity(child.name, week, lang));
    } catch {
      // Экран не ругается на отсутствие сети: молча возвращаемся к бандловым играм.
      setAiActivity(null);
      skipActivity();
    } finally {
      setBusy(false);
    }
  }

  const doneToday = marks[today] !== undefined;
  const marked = markedDaysThisMonth(marks);

  const weatherText =
    weather === 'storm' ? tr.today.weather.storm : weather === 'cloudy' ? tr.today.weather.cloudy : tr.today.weather.calm;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: 24, paddingBottom: 32, gap: 22 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 34, height: 34, borderRadius: 17, backgroundColor: theme.chip,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: fonts.sansSemi, fontSize: 13, color: theme.captionWarm }}>
              {child.name.trim().slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <Text style={[t.label, { color: theme.text }]}>{child.name}</Text>
        </View>
        <Pressable
          onPress={() => router.push('/settings')}
          hitSlop={12}
          style={{ width: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <IconDots color={theme.captionWarm} />
        </Pressable>
      </View>

      <View style={{ gap: 8 }}>
        <Eyebrow color={theme.captionWarm}>{`${week} ${tr.today.weekLabel}`}</Eyebrow>
        <Text style={[t.h1, { color: theme.text }]}>{entry.title}</Text>
        <Text style={[t.body, { color: theme.textSecondary }]}>{fill(entry.note, child.name)}</Text>
      </View>

      <View
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          backgroundColor: theme.chip, borderRadius: theme.radius.md, paddingVertical: 13, paddingHorizontal: 16,
        }}
      >
        <IconCloud color={theme.captionWarm} />
        <Text style={{ fontFamily: fonts.sans, fontSize: 13.5, color: theme.name === 'day' ? '#7C6455' : theme.textSecondary }}>
          {weatherText}
        </Text>
      </View>

      {leap ? (
        <View style={{ gap: 6, paddingHorizontal: 2 }}>
          <Text style={[t.label, { color: theme.text }]}>{leap.title}</Text>
          <Text style={[t.caption, { color: theme.textSecondary, lineHeight: 20 }]}>
            {leap.note} {stormNote(lang)}
          </Text>
        </View>
      ) : null}

      <Card theme={theme}>
        <Eyebrow color={theme.accentText}>
          {`${tr.today.activityLabel} · ${card.minutes} ${tr.today.minutes}${card.ai ? ` · ${tr.story.aiMark}` : ''}`}
        </Eyebrow>
        <Text style={[t.h3, { color: theme.text }]}>{card.title}</Text>
        <Text style={[t.body, { color: theme.textSecondary }]}>{card.text}</Text>

        <Pressable
          onPress={() => setWhyOpen((v) => !v)}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 14, marginTop: 2, minHeight: 44,
          }}
        >
          <Text style={{ fontFamily: fonts.sans, fontSize: 13.5, color: theme.captionWarm }}>{tr.today.why}</Text>
          <IconChevron color={theme.caption} open={whyOpen} />
        </Pressable>

        {whyOpen ? (
          <Text style={[t.body, { color: theme.textSecondary }]}>{card.why}</Text>
        ) : null}

        <Pressable
          onPress={() => !doneToday && markDone(card.id, card.title)}
          style={{
            height: theme.bigHit, borderRadius: theme.radius.md,
            backgroundColor: doneToday ? theme.chip : theme.accent,
            alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9,
          }}
        >
          <IconCheck color={doneToday ? theme.captionWarm : theme.onAccent} />
          <Text style={[t.button, { color: doneToday ? theme.captionWarm : theme.onAccent }]}>
            {doneToday ? tr.today.doneMark : tr.today.done}
          </Text>
        </Pressable>

        {!doneToday ? (
          <Pressable onPress={onAnother} disabled={busy} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
            {busy ? <ActivityIndicator color={theme.captionWarm} /> : null}
            <Text style={[t.caption, { color: theme.captionWarm }]}>{tr.today.another}</Text>
          </Pressable>
        ) : null}
      </Card>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {lastSevenDays().map((key) => (
            <View
              key={key}
              style={{
                width: 7, height: 7, borderRadius: 4,
                backgroundColor: marks[key] ? theme.accent : theme.line,
              }}
            />
          ))}
        </View>
        <Text style={[t.caption, { color: theme.caption }]}>{`${marked} ${tr.today.markedDays}`}</Text>
      </View>
    </ScrollView>
  );
}

function lastSevenDays(): string[] {
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(dayKey(d));
  }
  return out;
}
