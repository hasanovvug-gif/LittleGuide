import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/i18n';
import { useAppStore } from '@/store/useAppStore';
import { bundledStories, fill } from '@/content';
import { typography as t, fonts } from '@/constants/theme';
import { Card, Eyebrow } from '@/components/ui';
import { IconStory } from '@/components/Icon';

/**
 * Экран «Сказка». В бандле десять готовых сказок — библиотека работает офлайн
 * с первого запуска. Генерация через Worker подключается на этапе 5.
 */
export default function StoryScreen() {
  const theme = useTheme();
  const tr = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [day, setDay] = useState('');

  const child = useAppStore((s) => s.child)!;
  const lang = useAppStore((s) => s.settings.language);
  const saved = useAppStore((s) => s.stories);

  const library = [
    ...saved.map((s) => ({ id: s.id, title: s.title, minutes: s.minutes, ai: s.source === 'ai' })),
    ...bundledStories(lang).map((s) => ({ id: s.id, title: fill(s.title, child.name), minutes: s.minutes, ai: false })),
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: 24, paddingBottom: 32, gap: 20 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[t.h2, { color: theme.text }]}>{tr.story.title}</Text>

      <Card theme={theme}>
        <Eyebrow color={theme.accentText}>{tr.story.dayLabel}</Eyebrow>
        <TextInput
          value={day}
          onChangeText={setDay}
          placeholder={tr.story.placeholder}
          placeholderTextColor={theme.caption}
          multiline
          style={{
            minHeight: 64, fontFamily: fonts.sans, fontSize: 15, lineHeight: 23, color: theme.text,
          }}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {tr.story.chips.map((chip) => (
            <Pressable
              key={chip}
              onPress={() => setDay((v) => (v ? `${v}, ${chip.toLowerCase()}` : chip))}
              style={{
                height: theme.hit, paddingHorizontal: 16, borderRadius: theme.radius.sm,
                backgroundColor: theme.chip, alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: fonts.sans, fontSize: 13.5, color: theme.name === 'day' ? '#7C6455' : theme.textSecondary }}>
                {chip}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          disabled
          style={{
            height: theme.bigHit, borderRadius: theme.radius.md, backgroundColor: theme.chip,
            alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9,
          }}
        >
          <IconStory size={19} color={theme.captionWarm} />
          <Text style={[t.button, { color: theme.captionWarm }]}>{tr.story.generate}</Text>
        </Pressable>
        <Text style={[t.caption, { color: theme.caption }]}>{tr.story.offlineHint}</Text>
      </Card>

      <View style={{ gap: 14 }}>
        <Eyebrow color={theme.caption}>{tr.story.library}</Eyebrow>
        {library.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => router.push({ pathname: '/read/[id]', params: { id: s.id } })}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 56,
              backgroundColor: theme.cardSoft, borderRadius: theme.radius.lg, padding: 14,
            }}
          >
            <View
              style={{
                width: 40, height: 40, borderRadius: 20, backgroundColor: theme.chip,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <IconStory size={18} color={theme.captionWarm} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: fonts.serif, fontSize: 17, color: theme.text }}>{s.title}</Text>
              <Text style={[t.caption, { color: theme.caption }]}>
                {`${s.minutes} ${tr.story.minutes}${s.ai ? ` · ${tr.story.aiMark}` : ''}`}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
