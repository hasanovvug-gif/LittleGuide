import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { Lang } from '@/content/types';
import { dayKey, monthKey } from '@/lib/age';
import { deleteMedia, isSafeMediaName, pruneMedia } from '@/lib/media';

const STORAGE_KEY = 'littleguide.v1';
export const SCHEMA_VERSION = 2;

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
  /** Имя файла в media/, НЕ абсолютный путь — см. комментарий в lib/media.ts. */
  photo?: string;
  audio?: string;
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
  addDiaryEntry: (entry: Omit<DiaryEntry, 'id' | 'ts'> & { ts?: number }) => Promise<void>;
  removeDiaryEntry: (id: string) => Promise<void>;
  answerCapsule: (weekIndex: number, questionId: string, text: string) => void;
  skipCapsule: (weekIndex: number, questionId: string) => void;
  saveStory: (story: Omit<SavedStory, 'id' | 'ts'>) => string;
  exportPayload: () => Persisted;
  replaceAll: (parsed: Persisted) => Promise<void>;
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

function snapshot(state: Persisted): Persisted {
  return {
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
}

/** Обычная запись: дебаунс гасит шквал при таймерах ритма. */
function persist(state: Persisted) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot(state))).catch(() => {});
  }, 250);
}

/**
 * Запись без дебаунса и без проглоченной ошибки. Нужна там, где на диске уже появился
 * или исчез файл: если приложение убьют в эти 250 мс, запись и медиа разойдутся.
 */
async function persistNow(state: Persisted): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot(state)));
}

function id(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Нормализация при импорте. Файл приходит извне, поэтому здесь не «привести к типу»,
 * а **не пустить внутрь мусор**: чужая или битая запись не должна ни ронять приложение,
 * ни протащить имя файла с `..` в путь (см. `isSafeMediaName`).
 */
export function normalize(raw: unknown): Persisted | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<Persisted>;
  if (typeof r.version !== 'number') return null;
  // Файл из будущей версии читать нечем — лучше честно отказаться, чем потерять половину полей.
  if (r.version > SCHEMA_VERSION) return null;

  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  const rec = (v: unknown): Record<string, never> => (v && typeof v === 'object' ? (v as Record<string, never>) : {});
  const str = (v: unknown, max: number): string => (typeof v === 'string' ? v.slice(0, max) : '');
  const media = (v: unknown): string | undefined => (isSafeMediaName(v) ? v : undefined);

  return {
    version: SCHEMA_VERSION,
    child: r.child && typeof r.child.name === 'string'
      ? { name: str(r.child.name, 80), birth: str(r.child.birth, 40) }
      : null,
    settings: {
      theme: (['auto', 'day', 'night'] as const).includes(r.settings?.theme as ThemeSetting)
        ? (r.settings!.theme as ThemeSetting)
        : 'auto',
      language: (['ru', 'ua', 'en'] as const).includes(r.settings?.language as Lang) ? (r.settings!.language as Lang) : 'ru',
      // Согласие на отправку данных наружу из чужого файла НЕ наследуется — спрашиваем заново.
      aiConsent: false,
    },
    marks: rec(r.marks),
    skips: rec(r.skips),
    rhythm: arr<RhythmEvent>(r.rhythm)
      .filter((e) => e && typeof e.start === 'number' && (e.kind === 'sleep' || e.kind === 'feeding'))
      .slice(0, LIMITS.rhythm)
      .map((e) => ({ id: str(e.id, 40) || id('r'), kind: e.kind, start: e.start, end: typeof e.end === 'number' ? e.end : null })),
    diary: arr<DiaryEntry>(r.diary)
      .filter((e) => e && typeof e.ts === 'number' && DIARY_KINDS.includes(e.kind))
      .slice(0, LIMITS.diary)
      .map((e) => ({
        id: str(e.id, 40) || id('d'),
        ts: e.ts,
        kind: e.kind,
        text: str(e.text, 4000),
        photo: media(e.photo),
        audio: media(e.audio),
      })),
    capsule: arr<CapsuleAnswer>(r.capsule)
      .filter((e) => e && typeof e.text === 'string' && typeof e.ts === 'number')
      .slice(0, LIMITS.capsule)
      .map((e) => ({
        id: str(e.id, 40) || id('c'),
        weekIndex: typeof e.weekIndex === 'number' ? e.weekIndex : 0,
        questionId: str(e.questionId, 60),
        text: str(e.text, 1000),
        ts: e.ts,
      })),
    stories: arr<SavedStory>(r.stories)
      .filter((e) => e && typeof e.text === 'string' && typeof e.ts === 'number')
      .slice(0, LIMITS.stories)
      .map((e) => ({
        id: str(e.id, 40) || id('s'),
        title: str(e.title, 200),
        text: str(e.text, 20000),
        minutes: typeof e.minutes === 'number' ? e.minutes : 3,
        ts: e.ts,
        source: e.source === 'ai' ? 'ai' : 'bundled',
      })),
  };
}

const DIARY_KINDS: DiaryKind[] = ['note', 'activity', 'capsule', 'story', 'slice'];

/** Потолки на случай подсунутого файла-бомбы: миллион записей положит телефон на гидрации. */
const LIMITS = { rhythm: 100_000, diary: 100_000, capsule: 10_000, stories: 10_000 };

export const useAppStore = create<State>((set, get) => ({
  ...emptyState,
  hasHydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = normalize(JSON.parse(raw));
        if (parsed) {
          set({ ...parsed });
          // Уборка сирот — только когда дневник прочитался. Если бы хранилище оказалось
          // битым и мы решили прибраться, prune снёс бы все фото разом.
          const alive = new Set<string>();
          for (const e of parsed.diary) {
            if (e.photo) alive.add(e.photo);
            if (e.audio) alive.add(e.audio);
          }
          try { pruneMedia(alive); } catch { /* уборка не повод падать на старте */ }
        }
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

  addDiaryEntry: async (entry) => {
    const full: DiaryEntry = { id: id('d'), ts: entry.ts ?? Date.now(), ...entry };
    set({ diary: [full, ...get().diary] });
    // Файл уже лежит на диске, поэтому запись состояния не откладываем: иначе после
    // убийства приложения в эти 250 мс останется фото, на которое никто не ссылается.
    if (full.photo || full.audio) await persistNow(get());
    else persist(get());
  },

  removeDiaryEntry: async (entryId) => {
    const gone = get().diary.find((e) => e.id === entryId);
    set({ diary: get().diary.filter((e) => e.id !== entryId) });
    // Сначала фиксируем состояние, потом трогаем диск. Обратный порядок при обрыве оставил бы
    // запись, ссылающуюся на удалённый файл; так в худшем случае остаётся сирота — её уберёт prune.
    await persistNow(get());
    if (gone) deleteMedia(gone.photo, gone.audio);
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

  /** Полная замена состояния. Медиа к этому моменту уже подменены — см. lib/backup.ts. */
  replaceAll: async (parsed) => {
    set({ ...parsed });
    await persistNow(get());
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
