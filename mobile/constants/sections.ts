import type { ComponentType } from 'react';
import { IconDiary, IconFeeding, IconHandover, IconSleep, IconStory } from '@/components/Icon';
import type { Dict } from '@/i18n';

export type SectionId = 'sleep' | 'feeding' | 'diary' | 'story' | 'handover';
export type SectionGroupId = 'daily' | 'development';

export type Section = {
  id: SectionId;
  group: SectionGroupId;
  icon: ComponentType<{ size?: number; color: string }>;
  title: (t: Dict) => string;
  route: '/sleep' | '/feeding' | '/diary' | '/story' | '/handover';
};

/**
 * Декларативный список плиток Дома. Новый раздел — одна строка здесь.
 * Пустая группа сама не отрисуется — index.tsx фильтрует SECTION_GROUPS по наличию элементов.
 */
export const SECTIONS: Section[] = [
  { id: 'sleep', group: 'daily', icon: IconSleep, title: (t) => t.tabs.sleep, route: '/sleep' },
  { id: 'feeding', group: 'daily', icon: IconFeeding, title: (t) => t.tabs.feeding, route: '/feeding' },
  { id: 'diary', group: 'daily', icon: IconDiary, title: (t) => t.tabs.diary, route: '/diary' },
  { id: 'handover', group: 'daily', icon: IconHandover, title: (t) => t.tabs.handover, route: '/handover' },
  { id: 'story', group: 'development', icon: IconStory, title: (t) => t.tabs.story, route: '/story' },
];

export const SECTION_GROUPS: { id: SectionGroupId; label: (t: Dict) => string }[] = [
  { id: 'daily', label: (t) => t.home.groupDaily },
  { id: 'development', label: (t) => t.home.groupDevelopment },
];
