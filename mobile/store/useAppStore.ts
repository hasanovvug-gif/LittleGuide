import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { Lang } from '@/content/types';
import { dayKey, monthKey } from '@/lib/age';
import { deleteMedia, isSafeMediaName, pruneMedia } from '@/lib/media';
import { FEED_TYPES, sanitizeRhythm, validateRhythmEvent, type RhythmError } from '@/lib/rhythm';

const STORAGE_KEY = 'littleguide.v1';
// v2 → v3: новое поле feedType. v3 → v4: новый раздел handover. Оставить версию прежней
// нельзя по тому же прецеденту — старая сборка приняла бы новый бэкап и молча выбросила
// handover в normalize() на первом же persist. Честный отказ на файле из будущего лучше
// тихой потери инструкций для того, кто остался с ребёнком.
export const SCHEMA_VERSION = 4;

export type Child = { name: string; birth: string };
export type ThemeSetting = 'auto' | 'day' | 'night';
export type Settings = { theme: ThemeSetting; language: Lang; aiConsent: boolean; pinnedTabs: string[] };

export type RhythmKind = 'sleep' | 'feeding';
export type FeedType = 'breast' | 'bottle' | 'solid';
export type RhythmEvent = {
  id: string;
  kind: RhythmKind;
  start: number;
  end: number | null;
  /** Только для kind='feeding'. У сна и у старых записей — undefined, в ленте без метки. */
  feedType?: FeedType;
};
export type { RhythmError };

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

/** Памятка для того, кто остаётся с ребёнком. Только факты, которые вписал родитель — никаких оценок. */
export type Handover = {
  allergies: string;   // аллергии и что нельзя
  sleep: string;        // как укладывать
  comfort: string;      // любимое / что успокаивает
  contacts: string;     // важные телефоны
  updated: number | null;
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
  handover: Handover;
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
  updateRhythm: (id: string, patch: { start?: number; end?: number | null; feedType?: FeedType }) => RhythmError | null;
  addRhythmManual: (kind: RhythmKind, start: number, end: number | null, feedType?: FeedType) => RhythmError | null;
  removeRhythm: (id: string) => void;
  addDiaryEntry: (entry: Omit<DiaryEntry, 'id' | 'ts'> & { ts?: number }) => Promise<void>;
  removeDiaryEntry: (id: string) => Promise<void>;
  answerCapsule: (weekIndex: number, questionId: string, text: string) => void;
  skipCapsule: (weekIndex: number, questionId: string) => void;
  saveStory: (story: Omit<SavedStory, 'id' | 'ts'>) => string;
  setHandover: (patch: Partial<Omit<Handover, 'updated'>>) => void;
  exportPayload: () => Persisted;
  replaceAll: (parsed: Persisted) => Promise<void>;
  reset: () => void;
};

/** Список известных id разделов для валидации pinnedTabs — синхронно с constants/sections.ts. */
const PINNABLE_IDS = ['sleep', 'feeding', 'diary', 'story', 'handover'];
const DEFAULT_PINNED_TABS = ['sleep', 'feeding', 'diary'];

const emptyHandover: Handover = { allergies: '', sleep: '', comfort: '', contacts: '', updated: null };

const emptyState: Persisted = {
  version: SCHEMA_VERSION,
  child: null,
  settings: { theme: 'auto', language: 'ru', aiConsent: false, pinnedTabs: DEFAULT_PINNED_TABS },
  marks: {},
  skips: {},
  rhythm: [],
  diary: [],
  capsule: [],
  stories: [],
  handover: emptyHandover,
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
    handover: state.handover,
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
  const pinnedTabs = (v: unknown): string[] => {
    if (!Array.isArray(v)) return DEFAULT_PINNED_TABS;
    const known = Array.from(new Set(v.filter((x): x is string => typeof x === 'string' && PINNABLE_IDS.includes(x))));
    // Слотов ровно три — лишнее обрезаем; если после чистки не осталось ни одного
    // известного id (битый или чужой файл), это и есть та самая «кривизна» — дефолт.
    return known.length > 0 ? known.slice(0, 3) : DEFAULT_PINNED_TABS;
  };
  // Отсутствующий или неполный handover (старый бэкап schema < 4) → дефолт с пустыми строками,
  // а не отказ всего файла — это единственное новое поле версии 4.
  const handover = (v: unknown): Handover => {
    const h = v && typeof v === 'object' ? (v as Partial<Handover>) : {};
    const updated = typeof h.updated === 'number' && Number.isInteger(h.updated) && h.updated <= Date.now() ? h.updated : null;
    return { allergies: str(h.allergies, 500), sleep: str(h.sleep, 500), comfort: str(h.comfort, 500), contacts: str(h.contacts, 500), updated };
  };

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
      pinnedTabs: pinnedTabs(r.settings?.pinnedTabs),
    },
    marks: rec(r.marks),
    skips: rec(r.skips),
    // sanitizeRhythm — не только приводит типы, но и санирует сам ритм (будущее время,
    // end < start, дубли id, лишние открытые записи, пересечения): бэкап приходит извне
    // и может нести что угодно, минуя любые новые валидаторы формы.
    rhythm: sanitizeRhythm(
      arr<RhythmEvent>(r.rhythm)
        .filter((e) => e && typeof e.start === 'number' && (e.kind === 'sleep' || e.kind === 'feeding'))
        .slice(0, LIMITS.rhythm)
        .map((e) => ({
          id: str(e.id, 40) || id('r'),
          kind: e.kind,
          start: e.start,
          end: typeof e.end === 'number' ? e.end : null,
          feedType: e.kind === 'feeding' && FEED_TYPES.includes(e.feedType as FeedType) ? (e.feedType as FeedType) : undefined,
        })),
      Date.now(),
    ),
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
    handover: handover(r.handover),
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
    // Закрываем только самую свежую по start — раньше `map` по всем открытым закрывал их
    // разом, а нескольким открытым записям одного вида взяться неоткуда, кроме старого бага.
    const rhythm = get().rhythm;
    let latest: RhythmEvent | null = null;
    for (const e of rhythm) {
      if (e.kind === kind && e.end === null && (!latest || e.start > latest.start)) latest = e;
    }
    if (!latest) return;
    const targetId = latest.id;
    set({ rhythm: rhythm.map((e) => (e.id === targetId ? { ...e, end: Date.now() } : e)) });
    persist(get());
  },

  updateRhythm: (rhythmId, patch) => {
    const rhythm = get().rhythm;
    const target = rhythm.find((e) => e.id === rhythmId);
    if (!target) return null;

    const next = {
      kind: target.kind,
      start: patch.start ?? target.start,
      end: patch.end !== undefined ? patch.end : target.end,
    };
    const now = Date.now();
    const err = validateRhythmEvent(next, rhythm, now, rhythmId);
    if (err) return err;

    // feedType — только у кормления: правка сна не должна протащить тип еды в запись сна.
    const feedType = target.kind === 'feeding'
      ? (patch.feedType !== undefined ? patch.feedType : target.feedType)
      : undefined;
    let updated = rhythm.map((e) => (e.id === rhythmId ? { ...e, ...next, feedType } : e));
    // Правка start сдвигает место записи в убывающем порядке — экран кормления ищет
    // последнее кормление через .find() по этому порядку, честная пересортировка обязательна.
    if (patch.start !== undefined) updated = [...updated].sort((a, b) => b.start - a.start);
    set({ rhythm: updated });
    persist(get());
    return null;
  },

  addRhythmManual: (kind, start, end, feedType) => {
    const rhythm = get().rhythm;
    const now = Date.now();
    const err = validateRhythmEvent({ kind, start, end }, rhythm, now);
    if (err) return err;

    const event: RhythmEvent = { id: id('r'), kind, start, end, feedType: kind === 'feeding' ? feedType : undefined };
    set({ rhythm: [event, ...rhythm].sort((a, b) => b.start - a.start) });
    persist(get());
    return null;
  },

  removeRhythm: (rhythmId) => {
    set({ rhythm: get().rhythm.filter((e) => e.id !== rhythmId) });
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

  setHandover: (patch) => {
    set({ handover: { ...get().handover, ...patch, updated: Date.now() } });
    persist(get());
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
      handover: s.handover,
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
