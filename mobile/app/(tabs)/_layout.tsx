import { Redirect, Tabs } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/i18n';
import { useAppStore } from '@/store/useAppStore';
import { IconDiary, IconRhythm, IconStory, IconToday } from '@/components/Icon';
import { fonts } from '@/constants/theme';

export default function TabsLayout() {
  const theme = useTheme();
  const t = useT();
  const child = useAppStore((s) => s.child);

  if (!child) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tabActive,
        tabBarInactiveTintColor: theme.tabIdle,
        sceneStyle: { backgroundColor: theme.bg },
        tabBarStyle: {
          backgroundColor: theme.bg,
          borderTopColor: theme.line,
          borderTopWidth: 1,
          height: 84,
          paddingTop: 10,
        },
        tabBarLabelStyle: { fontFamily: fonts.sansMedium, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t.tabs.today, tabBarIcon: ({ color }) => <IconToday color={color} /> }}
      />
      <Tabs.Screen
        name="rhythm"
        options={{ title: t.tabs.rhythm, tabBarIcon: ({ color }) => <IconRhythm color={color} /> }}
      />
      <Tabs.Screen
        name="diary"
        options={{ title: t.tabs.diary, tabBarIcon: ({ color }) => <IconDiary color={color} /> }}
      />
      <Tabs.Screen
        name="story"
        options={{ title: t.tabs.story, tabBarIcon: ({ color }) => <IconStory color={color} /> }}
      />
    </Tabs>
  );
}
