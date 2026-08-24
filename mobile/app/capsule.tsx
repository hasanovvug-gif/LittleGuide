import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/i18n';
import { useAppStore } from '@/store/useAppStore';
import { fill, questionForWeek } from '@/content';
import { weekIndex } from '@/lib/age';
import { typography as t, fonts } from '@/constants/theme';
import { Eyebrow } from '@/components/ui';

/** Вопрос недели — 30 секунд, одна строка. Пропуск ничего не ломает и не обнуляет. */
export default function CapsuleScreen() {
  const theme = useTheme();
  const tr = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');

  const child = useAppStore((s) => s.child)!;
  const lang = useAppStore((s) => s.settings.language);
  const capsule = useAppStore((s) => s.capsule);
  const answer = useAppStore((s) => s.answerCapsule);
  const skip = useAppStore((s) => s.skipCapsule);

  const wIndex = weekIndex(child.birth);
  const question = questionForWeek(lang, wIndex);
  const answeredThisMonth = capsule.filter((c) => c.text.length > 0 && sameMonth(c.ts)).length;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top + 20, paddingHorizontal: 24, gap: 24 }}>
      <View style={{ flexDirection: 'row', gap: 5, justifyContent: 'flex-end' }}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i < answeredThisMonth ? theme.accent : theme.line }}
          />
        ))}
      </View>

      <View style={{ gap: 10 }}>
        <Eyebrow color={theme.captionWarm}>
          {`${tr.today.weekLabel} ${wIndex} · ${tr.diary.capsuleCounter.replace('{n}', String(Math.min(answeredThisMonth + 1, 4)))}`}
        </Eyebrow>
        <Text style={[t.h2, { color: theme.text }]}>{fill(question.text, child.name)}</Text>
        <Text style={[t.body, { color: theme.textSecondary }]}>{tr.diary.capsuleHint}</Text>
      </View>

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={tr.diary.placeholder}
        placeholderTextColor={theme.caption}
        multiline
        autoFocus
        style={{
          minHeight: 110, borderRadius: theme.radius.lg, backgroundColor: theme.card,
          borderWidth: 1, borderColor: theme.line, padding: 16,
          fontFamily: fonts.sans, fontSize: 15, lineHeight: 23, color: theme.text,
        }}
      />

      <View style={{ gap: 12 }}>
        <Pressable
          onPress={() => {
            const value = text.trim();
            if (!value) return;
            answer(wIndex, question.id, value);
            router.back();
          }}
          style={{
            height: theme.bigHit, borderRadius: theme.radius.md, backgroundColor: theme.accent,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={[t.button, { color: theme.onAccent }]}>{tr.diary.save}</Text>
        </Pressable>
        <Pressable
          onPress={() => { skip(wIndex, question.id); router.back(); }}
          style={{ minHeight: theme.hit, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={[t.caption, { color: theme.captionWarm }]}>{tr.diary.skip}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function sameMonth(ts: number): boolean {
  const d = new Date(ts);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
}
