import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/i18n';
import { eventsOfDay, markedDaysThisMonth, useAppStore } from '@/store/useAppStore';
import { activitiesForWeek, activityOfDay, fill, leapForWeek, stormNote, weatherForWeek, weekEntry } from '@/content';
import { aiEnabled, askConsent, generateActivity, type AiActivity } from '@/lib/ai';
import { dayKey, formatDuration, weeksSince } from '@/lib/age';
import { typography as t, fonts, type Theme } from '@/constants/theme';
import { Card, Eyebrow } from '@/components/ui';
import { useMinuteTicker } from '@/components/rhythm-shared';
import { IconCheck, IconChevron, IconCloud, IconDots } from '@/components/Icon';
import { SECTION_GROUPS, SECTIONS, type Section } from '@/constants/sections';

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
  const rhythm = useAppStore((s) => s.rhythm);
  const pinnedTabs = useAppStore((s) => s.settings.pinnedTabs);

  // Раньше Дом вообще не тикал и брал Date.now() прямо в рендере: при открытом сне цифра
  // застывала, а после полуночи «сегодня» оставалось вчерашним, пока экран не перемонтируют.
  // Минутный тик достаточен — секундная точность Дому не нужна, это не работающий таймер.
  const openRhythm = rhythm.some((e) => e.end === null);
  const now = useMinuteTicker(openRhythm);
  const today = useMemo(() => dayKey(new Date(now)), [now]);

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

  const todayRhythm = useMemo(() => eventsOfDay(rhythm, today), [rhythm, today]);
  const sleptMs = todayRhythm
    .filter((e) => e.kind === 'sleep')
    .reduce((sum, e) => sum + ((e.end ?? now) - e.start), 0);
  const feedings = todayRhythm.filter((e) => e.kind === 'feeding').length;

  function togglePin(section: Section) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const title = section.title(tr);

    if (pinnedTabs.includes(section.id)) {
      Alert.alert(title, undefined, [
        { text: tr.common.cancel, style: 'cancel' },
        {
          text: tr.home.unpin,
          style: 'destructive',
          onPress: () => setSettings({ pinnedTabs: pinnedTabs.filter((id) => id !== section.id) }),
        },
      ]);
      return;
    }

    if (pinnedTabs.length < 3) {
      Alert.alert(title, undefined, [
        { text: tr.common.cancel, style: 'cancel' },
        { text: tr.home.pinBottom, onPress: () => setSettings({ pinnedTabs: [...pinnedTabs, section.id] }) },
      ]);
      return;
    }

    // Уже три закреплённых — второй Alert спрашивает, кого убрать, чтобы освободить место.
    Alert.alert(
      tr.home.swapTitle,
      tr.home.swapBody.replace('{tile}', title),
      [
        ...pinnedTabs.map((pinnedId) => {
          const pinnedSection = SECTIONS.find((s) => s.id === pinnedId);
          return {
            text: pinnedSection ? pinnedSection.title(tr) : pinnedId,
            onPress: () =>
              setSettings({ pinnedTabs: [...pinnedTabs.filter((id) => id !== pinnedId), section.id] }),
          };
        }),
        { text: tr.common.cancel, style: 'cancel' as const },
      ],
    );
  }

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

      {todayRhythm.length > 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Pressable onPress={() => router.push('/sleep')} hitSlop={8}>
            <Text style={[t.caption, { color: theme.textSecondary }]}>
              {tr.rhythm.summarySleep}{' '}
              <Text style={{ fontFamily: fonts.sansMedium, color: theme.text }}>{formatDuration(sleptMs, true, tr.common)}</Text>
            </Text>
          </Pressable>
          <Text style={[t.caption, { color: theme.caption }]}>·</Text>
          <Pressable onPress={() => router.push('/feeding')} hitSlop={8}>
            <Text style={[t.caption, { color: theme.textSecondary }]}>
              <Text style={{ fontFamily: fonts.sansMedium, color: theme.text }}>{feedings}</Text>{' '}
              {tr.rhythm.summaryFeedings}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={{ gap: 22 }}>
        {SECTION_GROUPS.map((group) => {
          const items = SECTIONS.filter((s) => s.group === group.id);
          if (items.length === 0) return null;
          return (
            <View key={group.id} style={{ gap: 12 }}>
              <Eyebrow color={theme.captionWarm}>{group.label(tr)}</Eyebrow>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {items.map((section) => (
                  <Tile
                    key={section.id}
                    section={section}
                    title={section.title(tr)}
                    pinned={pinnedTabs.includes(section.id)}
                    theme={theme}
                    onPress={() => router.push(section.route)}
                    onLongPress={() => togglePin(section)}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

/** Плитка раздела на Доме. Вынесена наружу: вложенное объявление теряет состояние жеста на каждом рендере. */
function Tile({ section, title, pinned, theme, onPress, onLongPress }: {
  section: Section; title: string; pinned: boolean; theme: Theme; onPress: () => void; onLongPress: () => void;
}) {
  const Icon = section.icon;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      style={{
        width: '47%',
        backgroundColor: theme.card,
        borderRadius: theme.radius.lg,
        padding: 16,
        gap: 10,
        minHeight: 92,
      }}
    >
      {pinned ? (
        <View
          style={{
            position: 'absolute', top: 12, right: 12,
            width: 7, height: 7, borderRadius: 4, backgroundColor: theme.accent,
          }}
        />
      ) : null}
      <Icon size={22} color={theme.accentText} />
      <Text style={[t.label, { color: theme.text }]}>{title}</Text>
    </Pressable>
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
