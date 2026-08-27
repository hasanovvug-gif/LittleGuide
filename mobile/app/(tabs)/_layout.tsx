import { Redirect, Tabs } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/i18n';
import { useAppStore } from '@/store/useAppStore';
import { IconDiary, IconFeeding, IconHandover, IconHome, IconSleep, IconStory } from '@/components/Icon';
import { fonts } from '@/constants/theme';

export default function TabsLayout() {
  const theme = useTheme();
  const t = useT();
  const child = useAppStore((s) => s.child);
  const pinnedTabs = useAppStore((s) => s.settings.pinnedTabs);

  if (!child) return <Redirect href="/onboarding" />;

  // Порядок вкладок в баре = порядок объявления ниже, а не порядок закрепления —
  // так навигатор не пересоздаётся при каждом пере-закреплении. Незакреплённые
  // прячутся через href: null (экран остаётся доступен по router.push, просто без иконки внизу).
  const pinned = (id: string) => pinnedTabs.includes(id);

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
        options={{ title: t.tabs.home, tabBarIcon: ({ color }) => <IconHome color={color} /> }}
      />
      <Tabs.Screen
        name="sleep"
        options={{
          title: t.tabs.sleep,
          tabBarIcon: ({ color }) => <IconSleep color={color} />,
          href: pinned('sleep') ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="feeding"
        options={{
          title: t.tabs.feeding,
          tabBarIcon: ({ color }) => <IconFeeding color={color} />,
          href: pinned('feeding') ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: t.tabs.diary,
          tabBarIcon: ({ color }) => <IconDiary color={color} />,
          href: pinned('diary') ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="story"
        options={{
          title: t.tabs.story,
          tabBarIcon: ({ color }) => <IconStory color={color} />,
          href: pinned('story') ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="handover"
        options={{
          title: t.tabs.handover,
          tabBarIcon: ({ color }) => <IconHandover color={color} />,
          href: pinned('handover') ? undefined : null,
        }}
      />
    </Tabs>
  );
}
