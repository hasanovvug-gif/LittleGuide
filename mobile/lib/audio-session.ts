import { setAudioModeAsync } from 'expo-audio';

/**
 * Режим аудиосессии для воспроизведения голосовых.
 *
 * Без него iOS оставляет приложению категорию по умолчанию (`soloAmbient`), а её глушит
 * боковой переключатель «беззвучно»: плеер идёт по дорожке, таймер тикает, звука нет.
 * Раньше режим ставился только в конце записи — поэтому свежезаписанная заметка звучала,
 * а после перезапуска приложения та же заметка играла молча.
 */
let recording = false;

/** Пока идёт запись, режим держит композер: `allowsRecording: false` останавливает диктофон. */
export function markRecording(on: boolean): void {
  recording = on;
}

export function applyPlaybackAudioMode(): void {
  if (recording) return;
  void setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
}
