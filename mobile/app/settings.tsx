import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/i18n';
import { useAppStore, type ThemeSetting } from '@/store/useAppStore';
import type { Lang } from '@/content/types';
import { typography as t, type Theme } from '@/constants/theme';
import { Eyebrow } from '@/components/ui';

export default function SettingsScreen() {
  const theme = useTheme();
  const tr = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const settings = useAppStore((s) => s.settings);
  const child = useAppStore((s) => s.child);
  const setSettings = useAppStore((s) => s.setSettings);

  const themeOptions: { key: ThemeSetting; label: string }[] = [
    { key: 'auto', label: tr.settings.themeAuto },
    { key: 'day', label: tr.settings.themeDay },
    { key: 'night', label: tr.settings.themeNight },
  ];
  const langOptions: { key: Lang; label: string }[] = [
    { key: 'ru', label: 'Русский' },
    { key: 'ua', label: 'Українська' },
    { key: 'en', label: 'English' },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 24, paddingBottom: 40, gap: 26 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[t.h2, { color: theme.text }]}>{tr.settings.title}</Text>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={[t.caption, { color: theme.captionWarm }]}>{tr.common.close}</Text>
        </Pressable>
      </View>

      <View style={{ gap: 12 }}>
        <Eyebrow color={theme.captionWarm}>{tr.settings.theme}</Eyebrow>
        {themeOptions.map((o) => (
          <Row key={o.key} label={o.label} active={settings.theme === o.key} onPress={() => setSettings({ theme: o.key })} theme={theme} />
        ))}
      </View>

      <View style={{ gap: 12 }}>
        <Eyebrow color={theme.captionWarm}>{tr.settings.language}</Eyebrow>
        {langOptions.map((o) => (
          <Row key={o.key} label={o.label} active={settings.language === o.key} onPress={() => setSettings({ language: o.key })} theme={theme} />
        ))}
      </View>

      {child ? (
        <View style={{ gap: 8 }}>
          <Eyebrow color={theme.captionWarm}>{tr.settings.child}</Eyebrow>
          <Text style={[t.body, { color: theme.textSecondary }]}>
            {`${child.name} · ${new Date(child.birth).toLocaleDateString(settings.language === 'ua' ? 'uk-UA' : settings.language === 'en' ? 'en-GB' : 'ru-RU')}`}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

/** Вынесен из компонента: вложенное объявление пересоздаёт строку на каждом рендере. */
function Row({ label, active, onPress, theme }: {
  label: string; active: boolean; onPress: () => void; theme: Theme;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        minHeight: theme.hit, borderRadius: theme.radius.md, paddingHorizontal: 16,
        justifyContent: 'center',
        backgroundColor: active ? theme.chip : theme.card,
        borderWidth: 1, borderColor: active ? theme.accent : theme.line,
      }}
    >
      <Text style={[t.label, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}
