import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/i18n';
import { useAppStore } from '@/store/useAppStore';
import { fill, questionForWeek } from '@/content';
import { AiFailure, aiEnabled, askConsent, generateSummary } from '@/lib/ai';
import { formatDayStamp, weekIndex } from '@/lib/age';
import { mediaUri } from '@/lib/media';
import { typography as t } from '@/constants/theme';
import { Card, Eyebrow } from '@/components/ui';
import { AudioNote } from '@/components/AudioNote';
import { DiaryComposer } from '@/components/DiaryComposer';

export default function DiaryScreen() {
  const theme = useTheme();
  const tr = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [slicing, setSlicing] = useState(false);

  const child = useAppStore((s) => s.child)!;
  const lang = useAppStore((s) => s.settings.language);
  const diary = useAppStore((s) => s.diary);
  const capsule = useAppStore((s) => s.capsule);
  const addEntry = useAppStore((s) => s.addDiaryEntry);
  const removeEntry = useAppStore((s) => s.removeDiaryEntry);
  const consent = useAppStore((s) => s.settings.aiConsent);
  const setSettings = useAppStore((s) => s.setSettings);

  const wIndex = weekIndex(child.birth);
  const question = questionForWeek(lang, wIndex);
  const answeredThisWeek = capsule.some((c) => c.weekIndex === wIndex);
  const monthAnswers = useMemo(
    () => capsule.filter((c) => c.text.length > 0 && sameMonth(c.ts)),
    [capsule],
  );
  const answersThisMonth = monthAnswers.length;

  // Срез собирается раз в месяц и только когда все четыре ответа на месте.
  const sliceDone = diary.some((e) => e.kind === 'slice' && sameMonth(e.ts));
  const canSlice = aiEnabled && answersThisMonth >= 4 && !sliceDone && !slicing;

  async function onSlice() {
    if (!canSlice) return;
    if (!consent) {
      if (!(await askConsent(tr.ai))) return;
      setSettings({ aiConsent: true });
    }
    setSlicing(true);
    try {
      const entries = monthAnswers.map((c) => c.text).reverse();
      const { text } = await generateSummary(child.name, entries, lang);
      await addEntry({ kind: 'slice', text });
    } catch (e) {
      const code = e instanceof AiFailure ? e.code : 'failed';
      Alert.alert(tr.diary.monthSlice, code === 'rate_limited' ? tr.story.busy : tr.story.failed, [
        { text: tr.common.ok },
      ]);
    } finally {
      setSlicing(false);
    }
  }

  function confirmRemove(entryId: string) {
    Alert.alert(tr.diary.deleteEntry, tr.diary.deleteEntryBody, [
      { text: tr.common.cancel, style: 'cancel' },
      { text: tr.common.delete, style: 'destructive', onPress: () => void removeEntry(entryId) },
    ]);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: 24, paddingBottom: 32, gap: 20 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[t.h2, { color: theme.text }]}>{tr.diary.title}</Text>

      <Card theme={theme}>
        <Eyebrow color={theme.accentText}>{tr.diary.questionLabel}</Eyebrow>
        <Text style={[t.h3, { color: theme.text }]}>{fill(question.text, child.name)}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable
            onPress={() => router.push('/capsule')}
            disabled={answeredThisWeek}
            style={{
              height: theme.hit, paddingHorizontal: 20, borderRadius: theme.radius.sm,
              backgroundColor: answeredThisWeek ? theme.chip : theme.accent,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={[t.button, { color: answeredThisWeek ? theme.captionWarm : theme.onAccent }]}>
              {answeredThisWeek ? tr.diary.answered : tr.diary.answer}
            </Text>
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={{
                  width: 8, height: 8, borderRadius: 4,
                  backgroundColor: i < answersThisMonth ? theme.accent : theme.line,
                }}
              />
            ))}
          </View>
        </View>

        {canSlice || slicing ? (
          <Pressable
            onPress={onSlice}
            disabled={slicing}
            style={{
              height: theme.hit, borderRadius: theme.radius.sm, backgroundColor: theme.chip,
              alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
            }}
          >
            {slicing ? <ActivityIndicator color={theme.captionWarm} /> : null}
            <Text style={[t.button, { color: theme.captionWarm }]}>{tr.diary.makeSlice}</Text>
          </Pressable>
        ) : null}
      </Card>

      <DiaryComposer theme={theme} />

      {diary.length === 0 ? (
        <Text style={[t.caption, { color: theme.caption }]}>{tr.diary.empty}</Text>
      ) : (
        <View style={{ gap: 16 }}>
          {diary.map((e) => (
            <Pressable
              key={e.id}
              onLongPress={() => confirmRemove(e.id)}
              delayLongPress={400}
              style={{ flexDirection: 'row', gap: 14 }}
            >
              <Text style={[t.caption, { color: theme.caption, width: 46, fontVariant: ['tabular-nums'] }]}>
                {formatDayStamp(e.ts)}
              </Text>
              <View style={{ flex: 1, gap: 6 }}>
                {e.kind !== 'note' ? (
                  <Eyebrow color={theme.captionWarm}>{kindLabel(e.kind, tr)}</Eyebrow>
                ) : null}
                {e.text ? <Text style={[t.body, { color: theme.text }]}>{e.text}</Text> : null}
                {e.photo ? (
                  <Image
                    source={{ uri: mediaUri(e.photo) }}
                    style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: theme.radius.md, backgroundColor: theme.chip }}
                    resizeMode="cover"
                  />
                ) : null}
                {e.audio ? (
                  <View style={{ alignSelf: 'flex-start' }}>
                    <AudioNote name={e.audio} theme={theme} />
                  </View>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function sameMonth(ts: number): boolean {
  const d = new Date(ts);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
}

function kindLabel(kind: string, tr: ReturnType<typeof useT>): string {
  if (kind === 'activity') return tr.today.activityLabel;
  if (kind === 'capsule') return tr.diary.questionLabel;
  if (kind === 'story') return tr.story.title;
  if (kind === 'slice') return tr.diary.monthSlice;
  return '';
}
