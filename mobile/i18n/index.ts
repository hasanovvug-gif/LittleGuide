import { ru, type Dict } from './ru';
import { ua } from './ua';
import { en } from './en';
import type { Lang } from '@/content/types';
import { useAppStore } from '@/store/useAppStore';

const dicts: Record<Lang, Dict> = { ru, ua, en };

export function dict(lang: Lang): Dict {
  return dicts[lang] ?? ru;
}

export function useT(): Dict {
  const lang = useAppStore((s) => s.settings.language);
  return dict(lang);
}

export type { Lang, Dict };
