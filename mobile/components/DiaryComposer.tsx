import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  IOSOutputFormat,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  type RecordingOptions,
} from 'expo-audio';
import { useT } from '@/i18n';
import { useAppStore } from '@/store/useAppStore';
import { deleteMedia, mediaUri, savePhoto, saveAudio } from '@/lib/media';
import { typography as t, fonts, type Theme } from '@/constants/theme';
import { IconCamera, IconMic, IconPlus, IconStop, IconTrash } from '@/components/Icon';
import { AudioNote } from '@/components/AudioNote';
import { markRecording } from '@/lib/audio-session';

/**
 * Композер записи: текст, одно фото и одна голосовая заметка.
 *
 * Вложения кладутся в media/ сразу при выборе, а не в момент отправки, — иначе временный URI
 * из пикера успевает протухнуть. Если запись в итоге не отправили, файл убирается за собой.
 */
/**
 * Голосовая заметка — это речь, а не музыка. Пресет HIGH_QUALITY (стерео 128 кбит/с) даёт
 * почти мегабайт на минуту: год ежедневных заметок — под 350 МБ, и всё это ляжет в файл
 * восстановления. Моно 32 кбит/с звучит для голоса так же, а весит вшестеро меньше.
 */
const VOICE_PRESET: RecordingOptions = {
  extension: '.m4a',
  sampleRate: 22050,
  numberOfChannels: 1,
  bitRate: 32000,
  android: { outputFormat: 'mpeg4', audioEncoder: 'aac' },
  ios: {
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: 64,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: { mimeType: 'audio/webm', bitsPerSecond: 32000 },
};

/** Потолок одной заметки. Забытый включённым микрофон не должен родить файл на гигабайт. */
const MAX_SECONDS = 180;

export function DiaryComposer({ theme }: { theme: Theme }) {
  const tr = useT();
  const addEntry = useAppStore((s) => s.addDiaryEntry);

  const [draft, setDraft] = useState('');
  const [photo, setPhoto] = useState<string | undefined>();
  const [audio, setAudio] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const recorder = useAudioRecorder(VOICE_PRESET);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  // Состояние записи держим в state, а не в ref: ref не вызывает перерисовку,
  // и кнопка с таймером просто не переключались бы.
  const [recording, setRecording] = useState(false);

  // Незавершённые вложения не должны пережить размонтирование экрана.
  const pending = useRef<{ photo?: string; audio?: string }>({});
  pending.current = { photo, audio };
  useEffect(() => () => {
    if (tick.current) clearInterval(tick.current);
    deleteMedia(pending.current.photo, pending.current.audio);
  }, []);

  async function pickPhoto(fromCamera: boolean) {
    // Разрешение спрашиваем только у камеры. Системный выбор фото отдаёт ровно один файл
    // и доступа ко всей галерее не требует — Google прямо просит не запрашивать широкие
    // photo permissions там, где хватает системного пикера.
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(tr.diary.addPhoto, tr.diary.photoDenied, [{ text: tr.common.ok }]);
        return;
      }
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 1 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;

    setBusy(true);
    try {
      const name = await savePhoto(
        { uri: asset.uri, width: asset.width, height: asset.height },
        `p_${Date.now().toString(36)}`,
      );
      deleteMedia(photo);
      setPhoto(name);
    } finally {
      setBusy(false);
    }
  }

  function onPhotoPress() {
    Alert.alert(tr.diary.addPhoto, undefined, [
      { text: tr.diary.fromCamera, onPress: () => void pickPhoto(true) },
      { text: tr.diary.fromLibrary, onPress: () => void pickPhoto(false) },
      { text: tr.common.cancel, style: 'cancel' },
    ]);
  }

  async function beginRecording() {
    markRecording(true);
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  }

  async function startRecording() {
    // Сначала просто пробуем писать: iOS сам показывает системный запрос при первом обращении
    // к микрофону. Спрашивать разрешение заранее нельзя — в Expo Go этот промис не резолвится
    // вовсе, и кнопка навсегда зависает без единого следа.
    try {
      await beginRecording();
    } catch {
      try {
        const perm = await requestRecordingPermissionsAsync();
        if (!perm.granted) {
          markRecording(false);
          Alert.alert(tr.diary.voice, tr.diary.micDenied, [{ text: tr.common.ok }]);
          return;
        }
        await beginRecording();
      } catch (e) {
        markRecording(false);
        Alert.alert(tr.diary.voice, String(e), [{ text: tr.common.ok }]);
        return;
      }
    }
    setElapsed(0);
    setRecording(true);
    tick.current = setInterval(() => {
      setElapsed((v) => {
        if (v + 1 >= MAX_SECONDS) void stopRecording();
        return v + 1;
      });
    }, 1000);
  }

  async function stopRecording() {
    if (tick.current) {
      clearInterval(tick.current);
      tick.current = null;
    }
    setRecording(false);
    try {
      await recorder.stop();
    } catch (e) {
      console.warn('[voice] stop failed', e);
    }
    // Запись на iOS остаётся активной сессией и глушит плеер — возвращаем режим воспроизведения.
    markRecording(false);
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    const uri = recorder.uri;
    if (!uri) return;
    deleteMedia(audio);
    setAudio(saveAudio(uri, `a_${Date.now().toString(36)}`));
  }

  function submit() {
    const text = draft.trim();
    if (!text && !photo && !audio) return;
    void addEntry({ kind: 'note', text, photo, audio });
    // Снимаем вложения с уборки ДО очистки состояния: уход с экрана сразу после отправки
    // иначе удалил бы файлы уже сохранённой записи.
    pending.current = {};
    setDraft('');
    setPhoto(undefined);
    setAudio(undefined);
  }

  const ready = draft.trim().length > 0 || !!photo || !!audio;

  return (
    <View style={{ gap: 10 }}>
      {photo || audio ? (
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          {photo ? (
            <View>
              <Image
                source={{ uri: mediaUri(photo) }}
                style={{ width: 64, height: 64, borderRadius: theme.radius.sm, backgroundColor: theme.chip }}
              />
              <Pressable
                onPress={() => { deleteMedia(photo); setPhoto(undefined); }}
                hitSlop={10}
                style={{
                  position: 'absolute', top: -6, right: -6, width: 24, height: 24,
                  borderRadius: 12, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <IconTrash size={13} color={theme.captionWarm} />
              </Pressable>
            </View>
          ) : null}
          {audio ? (
            <AudioNote
              name={audio}
              theme={theme}
              onRemove={() => { deleteMedia(audio); setAudio(undefined); }}
            />
          ) : null}
        </View>
      ) : null}

      {recording ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accent }} />
          <Text style={[t.caption, { color: theme.captionWarm, fontVariant: ['tabular-nums'] }]}>
            {`${tr.diary.recording} · ${formatElapsed(elapsed)}`}
          </Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={tr.diary.placeholder}
          placeholderTextColor={theme.caption}
          multiline
          style={{
            flex: 1, minHeight: theme.hit, maxHeight: 120, borderRadius: theme.radius.md,
            backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line,
            paddingHorizontal: 14, paddingVertical: 12,
            fontFamily: fonts.sans, fontSize: 14, color: theme.text,
          }}
        />
        <Round theme={theme} onPress={onPhotoPress} disabled={busy || recording} label={tr.diary.photo}>
          {busy ? <ActivityIndicator color={theme.captionWarm} /> : <IconCamera color={theme.captionWarm} />}
        </Round>
        <Round
          theme={theme}
          onPress={() => void (recording ? stopRecording() : startRecording())}
          disabled={busy}
          active={recording}
          label={tr.diary.voice}
        >
          {recording ? <IconStop size={18} color={theme.onAccent} /> : <IconMic color={theme.captionWarm} />}
        </Round>
        <Round theme={theme} onPress={submit} disabled={!ready || recording} filled label={tr.diary.save}>
          <IconPlus color={theme.onAccent} />
        </Round>
      </View>
    </View>
  );
}

function Round({ theme, onPress, children, disabled, filled, active, label }: {
  theme: Theme;
  onPress: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  filled?: boolean;
  active?: boolean;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: theme.hit, height: theme.hit, borderRadius: theme.radius.md,
        alignItems: 'center', justifyContent: 'center',
        opacity: disabled ? 0.45 : 1,
        backgroundColor: filled || active ? theme.accent : theme.card,
        borderWidth: filled || active ? 0 : 1,
        borderColor: theme.line,
      }}
    >
      {children}
    </Pressable>
  );
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
