import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/**
 * Фото и голосовые дневника лежат в `documentDirectory/media/`, а в записи хранится
 * **только имя файла**, не абсолютный путь.
 *
 * Так сделано намеренно: на iOS путь к контейнеру приложения содержит UUID, который меняется
 * при переустановке, — сохранённый `file:///.../Documents/...` после восстановления указывает
 * в никуда. Старая веб-версия теряла аудио ровно по этой причине, повторять не будем.
 */
export const MEDIA_DIR = 'media';
export const STAGING_DIR = 'media.incoming';
const PREVIOUS_DIR = 'media.previous';

/** Длинная сторона фото. Больше не нужно: снимок открывают на телефоне, а не печатают. */
const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.8;

/** Читая чужой файл, дописывать в него нельзя ничего, кроме этого. */
const NAME_RE = /^[a-z0-9_]{1,64}\.(jpg|m4a)$/;

/** Размер чанка при копировании: синхронный `writeBytes` держит JS-поток, поэтому режем. */
const CHUNK = 512 * 1024;

/**
 * Единственная дверь для имён, пришедших из файла восстановления.
 * `Paths.join` нормализует `..`, но не запрещает его, поэтому проверяем сами:
 * иначе чужой backup сможет прочитать или удалить файл за пределами media/.
 */
export function isSafeMediaName(name: unknown): name is string {
  return typeof name === 'string' && NAME_RE.test(name);
}

export function mediaDir(): Directory {
  return ensure(MEDIA_DIR);
}

export function stagingDir(): Directory {
  return ensure(STAGING_DIR);
}

/** Имя файла → абсолютный URI для `<Image>` и плеера. Резолвится каждый раз заново. */
export function mediaUri(name: string | undefined): string | undefined {
  if (!isSafeMediaName(name)) return undefined;
  return new File(mediaDir(), name).uri;
}

export function mediaSize(name: string): number {
  const f = new File(mediaDir(), name);
  return f.exists ? (f.size ?? 0) : 0;
}

/** Ужимает снимок и кладёт в media/. Возвращает имя файла. */
export async function savePhoto(
  asset: { uri: string; width: number; height: number },
  baseName: string,
): Promise<string> {
  const ctx = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > MAX_SIDE) {
    ctx.resize(asset.width >= asset.height ? { width: MAX_SIDE } : { height: MAX_SIDE });
  }
  const rendered = await ctx.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });

  const dest = new File(mediaDir(), `${baseName}.jpg`);
  if (dest.exists) dest.delete();
  const tmp = new File(saved.uri);
  tmp.copy(dest);
  safeDelete(tmp);
  return dest.name;
}

/** Переносит записанное аудио из кэша в media/. Расширение фиксировано — см. NAME_RE. */
export function saveAudio(sourceUri: string, baseName: string): string {
  const src = new File(sourceUri);
  const dest = new File(mediaDir(), `${baseName}.m4a`);
  if (dest.exists) dest.delete();
  src.copy(dest);
  safeDelete(src);
  return dest.name;
}

export function deleteMedia(...names: (string | undefined)[]): void {
  for (const name of names) {
    if (!isSafeMediaName(name)) continue;
    safeDelete(new File(mediaDir(), name));
  }
}

/** Имена всех файлов в media/ — нужны экспорту и уборке осиротевших файлов. */
export function listMedia(dir: Directory = mediaDir()): string[] {
  return dir
    .list()
    .filter((item): item is File => item instanceof File)
    .map((f) => f.name)
    .filter(isSafeMediaName);
}

/** Удаляет файлы, на которые не ссылается ни одна запись: иначе мусор копится вечно. */
export function pruneMedia(referenced: Set<string>): number {
  let removed = 0;
  for (const name of listMedia()) {
    if (!referenced.has(name)) {
      safeDelete(new File(mediaDir(), name));
      removed += 1;
    }
  }
  return removed;
}

/**
 * Подменяет media/ на подготовленный staging одним движением: переименование каталога
 * почти атомарно, а копирование файлов по одному оставило бы дневник в полусобранном виде.
 * Старый каталог не удаляется сразу — его возвращает `rollbackMedia()`, если дальше что-то упало.
 */
export function swapInStaging(): void {
  const current = new Directory(Paths.document, MEDIA_DIR);
  const previous = new Directory(Paths.document, PREVIOUS_DIR);
  const staged = new Directory(Paths.document, STAGING_DIR);
  if (previous.exists) previous.delete();
  if (current.exists) current.move(previous);
  staged.move(current);
}

export function rollbackMedia(): void {
  const current = new Directory(Paths.document, MEDIA_DIR);
  const previous = new Directory(Paths.document, PREVIOUS_DIR);
  if (!previous.exists) return;
  if (current.exists) current.delete();
  previous.move(current);
}

export function dropPreviousMedia(): void {
  const previous = new Directory(Paths.document, PREVIOUS_DIR);
  if (previous.exists) previous.delete();
}

export function clearStaging(): void {
  const staged = new Directory(Paths.document, STAGING_DIR);
  if (staged.exists) staged.delete();
}

export function freeDiskSpace(): number {
  return Paths.availableDiskSpace;
}

export { CHUNK as MEDIA_CHUNK };

function ensure(name: string): Directory {
  const dir = new Directory(Paths.document, name);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

function safeDelete(file: File): void {
  try {
    if (file.exists) file.delete();
  } catch {
    // файл мог исчезнуть сам — это не повод ронять экран
  }
}
