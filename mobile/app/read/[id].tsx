import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/i18n';
import { useAppStore } from '@/store/useAppStore';
import { bundledStories, fill } from '@/content';
import { typography as t, fonts } from '@/constants/theme';
import { Eyebrow } from '@/components/ui';

const REPORT_EMAIL = 'hello@littleguide.app';

/** Чтение сказки. Ночью фон уходит глубже — экран не светит в темноте. */
export default function ReadStoryScreen() {
  const theme = useTheme();
  const tr = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const child = useAppStore((s) => s.child)!;
  const lang = useAppStore((s) => s.settings.language);
  const saved = useAppStore((s) => s.stories);

  const fromSaved = saved.find((s) => s.id === id);
  const fromBundle = bundledStories(lang).find((s) => s.id === id);
  const story = fromSaved
    ? { title: fromSaved.title, text: fromSaved.text, ai: fromSaved.source === 'ai' }
    : fromBundle
      ? { title: fill(fromBundle.title, child.name), text: fill(fromBundle.text, child.name), ai: false }
      : null;

  if (!story) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bgDeep, alignItems: 'center', justifyContent: 'center' }}>
        <Pressable onPress={() => router.back()} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={[t.body, { color: theme.textSecondary }]}>{tr.common.close}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bgDeep }}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 26, paddingBottom: insets.bottom + 40, gap: 20 }}
    >
      <Pressable onPress={() => router.back()} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text style={[t.caption, { color: theme.captionWarm }]}>{tr.common.close}</Text>
      </Pressable>

      <Text style={{ fontFamily: fonts.serif, fontSize: 28, lineHeight: 34, color: theme.text }}>{story.title}</Text>

      <Text style={{ fontFamily: fonts.serif, fontSize: 19, lineHeight: 32, color: theme.text }}>{story.text}</Text>

      <View style={{ gap: 10, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 16 }}>
        {story.ai ? <Eyebrow color={theme.caption}>{tr.story.aiMark}</Eyebrow> : null}
        <Pressable
          onPress={() =>
            Alert.alert(tr.story.report, REPORT_EMAIL, [{ text: tr.common.ok }])
          }
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={[t.caption, { color: theme.captionWarm }]}>{tr.story.report}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
