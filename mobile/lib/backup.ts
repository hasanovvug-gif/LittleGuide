import { Directory, File, Paths } from 'expo-file-system';
import type { Persisted } from '@/store/useAppStore';
import { SCHEMA_VERSION, normalize } from '@/store/useAppStore';
import {
  MEDIA_CHUNK,
  clearStaging,
  dropPreviousMedia,
  freeDiskSpace,
  isSafeMediaName,
  listMedia,
  mediaDir,
  rollbackMedia,
  stagingDir,
  swapInStaging,
} from '@/lib/media';

/**
 * Формат `.lgbackup` — свой, без сжатия, и это осознанно: JPEG и m4a уже сжаты, а zip
 * потянул бы либо сборку всего архива в памяти (год фото — сотни мегабайт, телефон ляжет),
 * либо нативную библиотеку и потерю Expo Go на разработке.
 *
 * Раскладка файла:
 *   "LGBK1\n"                 6 байт, метка формата
 *   000000001234"\n"          13 байт: длина манифеста, дополненная нулями
 *   <манифест JSON, utf8>
 *   <медиафайлы подряд, в порядке манифеста>
 *
 * Длины и md5 каждого файла лежат в манифесте, а суммарный размер сверяется с реальным:
 * оборванная закачка не пройдёт проверку и не затрёт дневник.
 */
const MAGIC = 'LGBK1\n';
const LEN_DIGITS = 12;
const HEADER_BYTES = MAGIC.length + LEN_DIGITS + 1;
const CONTAINER_VERSION = 1;
const APP_TAG = 'littleguide';

/** Потолок манифеста: сам JSON без медиа не бывает большим, а 64 МБ строки положат телефон. */
const MAX_MANIFEST = 64 * 1024 * 1024;

export type MediaRecord = { name: string; size: number; md5: string | null };
export type Manifest = {
  container: number;
  app: string;
  created: number;
  schema: number;
  media: MediaRecord[];
  data: Persisted;
};

export type BackupInfo = {
  uri: string;
  manifest: Manifest;
  parsed: Persisted;
  mediaBytes: number;
  /** Смещение, с которого начинаются медиа. Считается по длине манифеста из заголовка. */
  mediaOffset: number;
};

export type Progress = (done: number, total: number) => void;

// ─────────────────────────────── экспорт ───────────────────────────────

export async function writeBackup(data: Persisted, onProgress?: Progress): Promise<File> {
  const referenced = new Set<string>();
  for (const entry of data.diary) {
    if (entry.photo) referenced.add(entry.photo);
    if (entry.audio) referenced.add(entry.audio);
  }
  // В файл кладём только то, на что ссылается дневник: осиротевшие файлы туда не тянем.
  const names = listMedia().filter((n) => referenced.has(n));

  const media: MediaRecord[] = names.map((name) => {
    const f = new File(mediaDir(), name);
    const info = f.info({ md5: true });
    return { name, size: f.size ?? 0, md5: info.md5 ?? null };
  });
  const mediaBytes = media.reduce((sum, m) => sum + m.size, 0);

  const manifest: Manifest = {
    container: CONTAINER_VERSION,
    app: APP_TAG,
    created: Date.now(),
    schema: SCHEMA_VERSION,
    media,
    data,
  };
  const manifestBytes = encode(JSON.stringify(manifest));
  const header = encode(MAGIC + String(manifestBytes.length).padStart(LEN_DIGITS, '0') + '\n');

  const needed = header.length + manifestBytes.length + mediaBytes;
  if (freeDiskSpace() < needed * 1.1) throw new BackupError('no_space');

  const dir = new Directory(Paths.cache);
  const partial = new File(dir, `backup-${Date.now().toString(36)}.partial`);
  if (partial.exists) partial.delete();
  partial.create({ overwrite: true });

  let written = 0;
  const handle = partial.open();
  try {
    handle.writeBytes(header);
    handle.writeBytes(manifestBytes);
    for (const record of media) {
      const src = new File(mediaDir(), record.name);
      const reader = src.open();
      try {
        let left = record.size;
        while (left > 0) {
          const take = Math.min(MEDIA_CHUNK, left);
          handle.writeBytes(reader.readBytes(take));
          left -= take;
          written += take;
          onProgress?.(written, mediaBytes);
          await yieldToUi();
        }
      } finally {
        reader.close();
      }
    }
  } catch (e) {
    handle.close();
    safeDelete(partial);
    throw e;
  }
  handle.close();

  const name = fileName(data);
  const dest = new File(dir, name);
  if (dest.exists) dest.delete();
  partial.move(dest);
  return dest;
}

// ─────────────────────────────── импорт ───────────────────────────────

/** Читает и проверяет заголовок. Состояние приложения при этом не трогается. */
export async function inspectBackup(uri: string): Promise<BackupInfo> {
  const file = new File(uri);
  if (!file.exists) throw new BackupError('unreadable');
  const total = file.size ?? 0;
  if (total < HEADER_BYTES) throw new BackupError('not_ours');

  const handle = file.open();
  let manifest: Manifest;
  let manifestLength: number;
  try {
    const head = decode(handle.readBytes(HEADER_BYTES));
    if (!head.startsWith(MAGIC)) throw new BackupError('not_ours');
    manifestLength = Number(head.slice(MAGIC.length, MAGIC.length + LEN_DIGITS));
    if (!Number.isInteger(manifestLength) || manifestLength <= 0 || manifestLength > MAX_MANIFEST) {
      throw new BackupError('damaged');
    }
    manifest = JSON.parse(decode(handle.readBytes(manifestLength))) as Manifest;
  } catch (e) {
    handle.close();
    throw e instanceof BackupError ? e : new BackupError('damaged');
  }
  handle.close();

  if (manifest?.app !== APP_TAG) throw new BackupError('not_ours');
  if (manifest.container !== CONTAINER_VERSION) throw new BackupError('too_new');
  if (typeof manifest.schema !== 'number' || manifest.schema > SCHEMA_VERSION) throw new BackupError('too_new');
  if (!Array.isArray(manifest.media)) throw new BackupError('damaged');

  const seen = new Set<string>();
  let mediaBytes = 0;
  for (const record of manifest.media) {
    if (!isSafeMediaName(record?.name)) throw new BackupError('damaged');
    if (seen.has(record.name)) throw new BackupError('damaged');
    if (!Number.isInteger(record.size) || record.size < 0) throw new BackupError('damaged');
    seen.add(record.name);
    mediaBytes += record.size;
  }

  // Главная проверка на обрыв: файл обязан быть ровно той длины, которую обещает манифест.
  if (total !== HEADER_BYTES + manifestLength + mediaBytes) throw new BackupError('damaged');

  const parsed = normalize(manifest.data);
  if (!parsed) throw new BackupError('damaged');

  // Ссылка на файл, которого в контейнере нет, — это битая картинка в ленте.
  // Лучше показать запись без вложения, чем пустой прямоугольник.
  for (const entry of parsed.diary) {
    if (entry.photo && !seen.has(entry.photo)) entry.photo = undefined;
    if (entry.audio && !seen.has(entry.audio)) entry.audio = undefined;
  }

  return { uri, manifest, parsed, mediaBytes, mediaOffset: HEADER_BYTES + manifestLength };
}

/**
 * Раскладывает медиа во временный каталог, и только когда всё сошлось — подменяет media/
 * и отдаёт состояние наверх. Порядок важен: сначала каталоги, потом хранилище.
 * Обратный порядок при сбое оставил бы в хранилище новый дневник поверх старых файлов —
 * то есть потерю старых записей. Здесь худший случай — откат к тому, что было.
 */
export async function stageBackup(info: BackupInfo, onProgress?: Progress): Promise<void> {
  if (freeDiskSpace() < info.mediaBytes * 1.2) throw new BackupError('no_space');

  clearStaging();
  const staged = stagingDir();
  const file = new File(info.uri);
  const handle = file.open();
  let done = 0;
  try {
    handle.offset = info.mediaOffset;

    for (const record of info.manifest.media) {
      const dest = new File(staged, record.name);
      dest.create({ overwrite: true });
      const writer = dest.open();
      try {
        let left = record.size;
        while (left > 0) {
          const take = Math.min(MEDIA_CHUNK, left);
          writer.writeBytes(handle.readBytes(take));
          left -= take;
          done += take;
          onProgress?.(done, info.mediaBytes);
          await yieldToUi();
        }
      } finally {
        writer.close();
      }
      if (record.md5 && dest.info({ md5: true }).md5 !== record.md5) throw new BackupError('damaged');
    }
  } catch (e) {
    handle.close();
    clearStaging();
    throw e instanceof BackupError ? e : new BackupError('damaged');
  }
  handle.close();
}

/** Вызывается после успешного `stageBackup`. Возвращает откат, если запись состояния упала. */
export function commitMedia(): void {
  swapInStaging();
}

export function undoMedia(): void {
  rollbackMedia();
  clearStaging();
}

export function finishMedia(): void {
  dropPreviousMedia();
}

export class BackupError extends Error {
  constructor(readonly code: 'not_ours' | 'damaged' | 'too_new' | 'no_space' | 'unreadable') {
    super(code);
  }
}

function fileName(data: Persisted): string {
  const child = (data.child?.name ?? 'littleguide').replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 24) || 'littleguide';
  const d = new Date();
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return `LittleGuide-${child}-${stamp}.lgbackup`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function encode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function decode(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/** Синхронные read/writeBytes держат JS-поток: без паузы между чанками экран замирает. */
function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function safeDelete(file: File): void {
  try {
    if (file.exists) file.delete();
  } catch {
    // нечего чистить
  }
}
