import type { Activity, BundledStory, CapsuleQuestion, Lang, Leap, WeekEntry, Weather } from './types';
import { weeks as ruWeeks, weekFallback } from './ru/weeks';
import { activities as ruActivities } from './ru/activities';
import { leaps as ruLeaps, stormNote as ruStormNote } from './ru/leaps';
import { questions as ruQuestions } from './ru/questions';
import { bundledStories as ruStories } from './ru/stories';

type Pack = {
  weeks: WeekEntry[];
  activities: Activity[];
  leaps: Leap[];
  questions: CapsuleQuestion[];
  stories: BundledStory[];
  stormNote: string;
};

const ru: Pack = {
  weeks: ruWeeks,
  activities: ruActivities,
  leaps: ruLeaps,
  questions: ruQuestions,
  stories: ruStories,
  stormNote: ruStormNote,
};

// ⚠️ ua и en пока указывают на ru — переводы контент-паков остаток этапа 2.
// UI-строки при этом переведены полностью (см. i18n/).
const packs: Record<Lang, Pack> = { ru, ua: ru, en: ru };

export function pack(lang: Lang): Pack {
  return packs[lang] ?? ru;
}

export function weekEntry(lang: Lang, week: number): WeekEntry {
  return pack(lang).weeks.find((w) => w.week === week) ?? weekFallback;
}

export function activitiesForWeek(lang: Lang, week: number): Activity[] {
  const list = pack(lang).activities.filter((a) => week >= a.from && week <= a.to);
  return list.length > 0 ? list : pack(lang).activities;
}

/** Активность дня: детерминированно от даты — одна и та же весь день, без рандома при перерисовке. */
export function activityOfDay(lang: Lang, week: number, dayKey: string, skips = 0): Activity {
  const list = activitiesForWeek(lang, week);
  let seed = skips;
  for (let i = 0; i < dayKey.length; i++) seed = (seed * 31 + dayKey.charCodeAt(i)) % 100000;
  return list[seed % list.length];
}

export function leapForWeek(lang: Lang, week: number): Leap | null {
  return pack(lang).leaps.find((l) => week >= l.week && week < l.week + l.span) ?? null;
}

export function weatherForWeek(lang: Lang, week: number): Weather {
  const leap = leapForWeek(lang, week);
  if (leap) return 'storm';
  const near = pack(lang).leaps.find((l) => week === l.week - 1);
  return near ? 'cloudy' : 'calm';
}

export function questionForWeek(lang: Lang, weekIndex: number): CapsuleQuestion {
  const list = pack(lang).questions;
  return list[weekIndex % list.length];
}

export function bundledStories(lang: Lang): BundledStory[] {
  return pack(lang).stories;
}

export function stormNote(lang: Lang): string {
  return pack(lang).stormNote;
}

export function fill(text: string, name: string): string {
  return text.replace(/\{name\}/g, name);
}
