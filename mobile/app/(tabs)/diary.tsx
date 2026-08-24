import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/i18n';
import { useAppStore } from '@/store/useAppStore';
import { fill, questionForWeek } from '@/content';
import { formatDayStamp, weekIndex } from '@/lib/age';
import { typography as t, fonts } from '@/constants/theme';
import { Card, Eyebrow } from '@/components/ui';
import { IconPlus } from '@/components/Icon';

export default function DiaryScreen() {
  const theme = useTheme();
  const tr = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');

  const child = useAppStore((s) => s.child)!;
  const lang = useAppStore((s) => s.settings.language);
  const diary = useAppStore((s) => s.diary);
  const capsule = useAppStore((s) => s.capsule);
  const addEntry = useAppStore((s) => s.addDiaryEntry);

  const wIndex = weekIndex(child.birth);
  const question = questionForWeek(lang, wIndex);
  const answeredThisWeek = capsule.some((c) => c.weekIndex === wIndex);
  const answersThisMonth = useMemo(
    () => capsule.filter((c) => c.text.length > 0 && sameMonth(c.ts)).length,
    [capsule],
  );

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
          <View style={{ flexDirection: 'row', gap: 5 }}>
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
      </Card>

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={tr.diary.placeholder}
          placeholderTextColor={theme.caption}
          multiline
          style={{
            flex: 1, minHeight: theme.hit, maxHeight: 120, borderRadius: theme.radius.md,
            backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line,
            paddingHorizontal: 14, paddingVertical: 12,
            fontFamily: fonts.sans, fontSize: 14, color: theme.text,
          }}
        />
        <Pressable
          onPress={() => {
            const text = draft.trim();
            if (!text) return;
            addEntry({ kind: 'note', text });
            setDraft('');
          }}
          style={{
            width: theme.hit, height: theme.hit, borderRadius: theme.radius.md,
            backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center',
          }}
        >
          <IconPlus color={theme.onAccent} />
        </Pressable>
      </View>

      {diary.length === 0 ? (
        <Text style={[t.caption, { color: theme.caption }]}>{tr.diary.empty}</Text>
      ) : (
        <View style={{ gap: 16 }}>
          {diary.map((e) => (
            <View key={e.id} style={{ flexDirection: 'row', gap: 14 }}>
              <Text style={[t.caption, { color: theme.caption, width: 46, fontVariant: ['tabular-nums'] }]}>
                {formatDayStamp(e.ts)}
              </Text>
              <View style={{ flex: 1, gap: 3 }}>
                {e.kind !== 'note' ? (
                  <Eyebrow color={theme.captionWarm}>{kindLabel(e.kind, tr)}</Eyebrow>
                ) : null}
                <Text style={[t.body, { color: theme.text }]}>{e.text}</Text>
              </View>
            </View>
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
