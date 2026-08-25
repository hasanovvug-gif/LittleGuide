import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { Lang } from '@/content/types';
import { dayKey, monthKey } from '@/lib/age';

const STORAGE_KEY = 'littleguide.v1';
export const SCHEMA_VERSION = 1;

export type Child = { name: string; birth: string };
export type ThemeSetting = 'auto' | 'day' | 'night';
export type Settings = { theme: ThemeSetting; language: Lang; aiConsent: boolean };

export type RhythmKind = 'sleep' | 'feeding';
export type RhythmEvent = { id: string; kind: RhythmKind; start: number; end: number | null };

export type DiaryKind = 'note' | 'activity' | 'capsule' | 'story' | 'slice';
export type DiaryEntry = {
  id: string;
  ts: number;
  kind: DiaryKind;
  text: string;
  photoUri?: string;
  audioUri?: string;
};

export type CapsuleAnswer = { id: string; weekIndex: number; questionId: string; text: string; ts: number };
export type SavedStory = {
  id: string;
  title: string;
  text: string;
  minutes: number;
  ts: number;
  source: 'bundled' | 'ai';
};

export type Persisted = {
  version: number;
  child: Child | null;
  settings: Settings;
  marks: Record<string, string>;   // dayKey -> activityId
  skips: Record<string, number>;   // dayKey -> сколько раз просили другую игру
  rhythm: RhythmEvent[];
  diary: DiaryEntry[];
  capsule: CapsuleAnswer[];
  stories: SavedStory[];
};

type State = Persisted & {
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  setChild: (child: Child) => void;
  setSettings: (patch: Partial<Settings>) => void;
  markActivityDone: (activityId: string, title: string) => void;
  skipActivity: () => void;
  startRhythm: (kind: RhythmKind) => void;
  stopRhythm: (kind: RhythmKind) => void;
  addDiaryEntry: (entry: Omit<DiaryEntry, 'id' | 'ts'> & { ts?: number }) => void;
  removeDiaryEntry: (id: string) => void;
  answerCapsule: (weekIndex: number, questionId: string, text: string) => void;
  skipCapsule: (weekIndex: number, questionId: string) => void;
  saveStory: (story: Omit<SavedStory, 'id' | 'ts'>) => string;
  exportPayload: () => Persisted;
  importPayload: (payload: unknown) => boolean;
  reset: () => void;
};

const emptyState: Persisted = {
  version: SCHEMA_VERSION,
  child: null,
  settings: { theme: 'auto', language: 'ru', aiConsent: false },
  marks: {},
  skips: {},
  rhythm: [],
  diary: [],
  capsule: [],
  stories: [],
};

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function persist(state: State) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const payload: Persisted = {
      version: SCHEMA_VERSION,
      child: state.child,
      settings: state.settings,
      marks: state.marks,
      skips: state.skips,
      rhythm: state.rhythm,
      diary: state.diary,
      capsule: state.capsule,
      stories: state.stories,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {});
  }, 250);
}

function id(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Нормализация при импорте: чужой или старый файл не должен ронять приложение. */
export function normalize(raw: unknown): Persisted | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<Persisted>;
  if (typeof r.version !== 'number') return null;
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  const rec = (v: unknown): Record<string, never> => (v && typeof v === 'object' ? (v as Record<string, never>) : {});
  return {
    version: SCHEMA_VERSION,
    child: r.child && typeof r.child.name === 'string' ? { name: r.child.name, birth: String(r.child.birth) } : null,
    settings: {
      theme: (['auto', 'day', 'night'] as const).includes(r.settings?.theme as ThemeSetting)
        ? (r.settings!.theme as ThemeSetting)
        : 'auto',
      language: (['ru', 'ua', 'en'] as const).includes(r.settings?.language as Lang) ? (r.settings!.language as Lang) : 'ru',
      // Согласие на AI из чужого файла не наследуется: спрашиваем заново.
      aiConsent: r.settings?.aiConsent === true,
    },
    marks: rec(r.marks),
    skips: rec(r.skips),
    rhythm: arr<RhythmEvent>(r.rhythm).filter((e) => e && typeof e.start === 'number'),
    diary: arr<DiaryEntry>(r.diary).filter((e) => e && typeof e.ts === 'number'),
    capsule: arr<CapsuleAnswer>(r.capsule).filter((e) => e && typeof e.text === 'string'),
    stories: arr<SavedStory>(r.stories).filter((e) => e && typeof e.text === 'string'),
  };
}

export const useAppStore = create<State>((set, get) => ({
  ...emptyState,
  hasHydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = normalize(JSON.parse(raw));
        if (parsed) set({ ...parsed });
      }
    } catch {
      // повреждённое хранилище не должно блокировать запуск
    } finally {
      set({ hasHydrated: true });
    }
  },

  setChild: (child) => { set({ child }); persist(get()); },

  setSettings: (patch) => { set({ settings: { ...get().settings, ...patch } }); persist(get()); },

  markActivityDone: (activityId, title) => {
    const key = dayKey();
    const marks = { ...get().marks, [key]: activityId };
    const entry: DiaryEntry = { id: id('d'), ts: Date.now(), kind: 'activity', text: title };
    set({ marks, diary: [entry, ...get().diary] });
    persist(get());
  },

  skipActivity: () => {
    const key = dayKey();
    const skips = { ...get().skips, [key]: (get().skips[key] ?? 0) + 1 };
    set({ skips });
    persist(get());
  },

  startRhythm: (kind) => {
    const open = get().rhythm.find((e) => e.kind === kind && e.end === null);
    if (open) return;
    const event: RhythmEvent = { id: id('r'), kind, start: Date.now(), end: null };
    set({ rhythm: [event, ...get().rhythm] });
    persist(get());
  },

  stopRhythm: (kind) => {
    const rhythm = get().rhythm.map((e) => (e.kind === kind && e.end === null ? { ...e, end: Date.now() } : e));
    set({ rhythm });
    persist(get());
  },

  addDiaryEntry: (entry) => {
    const full: DiaryEntry = { id: id('d'), ts: entry.ts ?? Date.now(), ...entry };
    set({ diary: [full, ...get().diary] });
    persist(get());
  },

  removeDiaryEntry: (entryId) => {
    set({ diary: get().diary.filter((e) => e.id !== entryId) });
    persist(get());
  },

  answerCapsule: (weekIndex, questionId, text) => {
    const answer: CapsuleAnswer = { id: id('c'), weekIndex, questionId, text, ts: Date.now() };
    const entry: DiaryEntry = { id: id('d'), ts: Date.now(), kind: 'capsule', text };
    set({ capsule: [answer, ...get().capsule], diary: [entry, ...get().diary] });
    persist(get());
  },

  skipCapsule: (weekIndex, questionId) => {
    const answer: CapsuleAnswer = { id: id('c'), weekIndex, questionId, text: '', ts: Date.now() };
    set({ capsule: [answer, ...get().capsule] });
    persist(get());
  },

  saveStory: (story) => {
    const full: SavedStory = { id: id('s'), ts: Date.now(), ...story };
    set({ stories: [full, ...get().stories] });
    persist(get());
    return full.id;
  },

  exportPayload: () => {
    const s = get();
    return {
      version: SCHEMA_VERSION,
      child: s.child,
      settings: s.settings,
      marks: s.marks,
      skips: s.skips,
      rhythm: s.rhythm,
      diary: s.diary,
      capsule: s.capsule,
      stories: s.stories,
    };
  },

  importPayload: (payload) => {
    const parsed = normalize(payload);
    if (!parsed) return false;
    set({ ...parsed });
    persist(get());
    return true;
  },

  reset: () => { set({ ...emptyState }); persist(get()); },
}));

/** Сколько дней отмечено в текущем месяце. Пропуск не обнуляет — стрика с обнулением здесь нет. */
export function markedDaysThisMonth(marks: Record<string, string>): number {
  const m = monthKey();
  return Object.keys(marks).filter((k) => k.startsWith(m)).length;
}

export function eventsOfDay(rhythm: RhythmEvent[], key = dayKey()): RhythmEvent[] {
  return rhythm.filter((e) => dayKey(new Date(e.start)) === key);
}
