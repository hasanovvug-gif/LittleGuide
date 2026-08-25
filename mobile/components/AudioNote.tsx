import { Pressable, Text, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useT } from '@/i18n';
import { mediaUri } from '@/lib/media';
import { typography as t, type Theme } from '@/constants/theme';
import { IconPause, IconPlay, IconTrash } from '@/components/Icon';

/** Голосовая заметка: кнопка «играть» и длительность. Крестик — только в композере. */
export function AudioNote({ name, theme, onRemove }: {
  name: string;
  theme: Theme;
  onRemove?: () => void;
}) {
  const tr = useT();
  const player = useAudioPlayer(mediaUri(name) ?? null);
  const status = useAudioPlayerStatus(player);
  const playing = status.playing;
  const total = status.duration || 0;
  const left = Math.max(0, Math.round(total - (status.currentTime || 0)));

  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        height: 44, paddingHorizontal: 12, borderRadius: theme.radius.md,
        backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line,
      }}
    >
      <Pressable
        onPress={() => {
          if (playing) {
            player.pause();
          } else {
            // После конца дорожки плеер стоит в хвосте: без перемотки повтор не начнётся.
            if (total > 0 && status.currentTime >= total - 0.05) player.seekTo(0);
            player.play();
          }
        }}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={tr.diary.voice}
      >
        {playing ? <IconPause size={18} color={theme.accentText} /> : <IconPlay size={18} color={theme.accentText} />}
      </Pressable>
      <Text style={[t.caption, { color: theme.captionWarm, fontVariant: ['tabular-nums'] }]}>
        {formatSeconds(playing ? left : total)}
      </Text>
      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={8} accessibilityRole="button" accessibilityLabel={tr.diary.removeAttachment}>
          <IconTrash size={14} color={theme.caption} />
        </Pressable>
      ) : null}
    </View>
  );
}

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
