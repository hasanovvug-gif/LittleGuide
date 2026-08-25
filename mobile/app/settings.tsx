import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/i18n';
import { useAppStore, type ThemeSetting } from '@/store/useAppStore';
import { aiEnabled } from '@/lib/ai';
import {
  BackupError,
  commitMedia,
  finishMedia,
  inspectBackup,
  stageBackup,
  undoMedia,
  writeBackup,
} from '@/lib/backup';
import type { Lang } from '@/content/types';
import { typography as t, type Theme } from '@/constants/theme';
import { Eyebrow } from '@/components/ui';

export default function SettingsScreen() {
  const theme = useTheme();
  const tr = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const settings = useAppStore((s) => s.settings);
  const child = useAppStore((s) => s.child);
  const setSettings = useAppStore((s) => s.setSettings);
  const exportPayload = useAppStore((s) => s.exportPayload);
  const replaceAll = useAppStore((s) => s.replaceAll);
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

  async function onExport() {
    setBusy('export');
    try {
      const file = await writeBackup(exportPayload());
      // shareAsync не отличает «сохранил» от «передумал», поэтому об успехе не рапортуем —
      // просто отдаём файл и молчим.
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/octet-stream' });
      }
    } catch (e) {
      Alert.alert(tr.settings.backup, backupMessage(e, tr.settings.exportFailed, tr.settings.noSpace), [{ text: tr.common.ok }]);
    } finally {
      setBusy(null);
    }
  }

  async function onImport() {
    const picked = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (picked.canceled) return;
    const uri = picked.assets[0]?.uri;
    if (!uri) return;

    setBusy('import');
    try {
      const info = await inspectBackup(uri);
      setBusy(null);
      // Замена необратима, поэтому сначала показываем, ЧТО именно приедет.
      const media = info.manifest.media.length;
      const body = tr.settings.importConfirmBody
        .replace('{child}', info.parsed.child?.name ?? '—')
        .replace('{entries}', String(info.parsed.diary.length))
        .replace('{media}', String(media));
      Alert.alert(tr.settings.importConfirm, body, [
        { text: tr.common.cancel, style: 'cancel' },
        {
          text: tr.settings.importReplace,
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusy('import');
              try {
                await stageBackup(info);
                commitMedia();
                try {
                  await replaceAll(info.parsed);
                } catch (e) {
                  undoMedia();
                  throw e;
                }
                finishMedia();
                Alert.alert(tr.settings.backup, tr.settings.importDone, [{ text: tr.common.ok }]);
              } catch (e) {
                Alert.alert(tr.settings.backup, backupMessage(e, tr.settings.importFailed, tr.settings.noSpace), [{ text: tr.common.ok }]);
              } finally {
                setBusy(null);
              }
            })();
          },
        },
      ]);
    } catch (e) {
      setBusy(null);
      Alert.alert(tr.settings.backup, backupMessage(e, tr.settings.importFailed, tr.settings.noSpace), [{ text: tr.common.ok }]);
    }
  }

  const themeOptions: { key: ThemeSetting; label: string }[] = [
    { key: 'auto', label: tr.settings.themeAuto },
    { key: 'day', label: tr.settings.themeDay },
    { key: 'night', label: tr.settings.themeNight },
  ];
  const langOptions: { key: Lang; label: string }[] = [
    { key: 'ru', label: 'Русский' },
    { key: 'ua', label: 'Українська' },
    { key: 'en', label: 'English' },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 24, paddingBottom: 40, gap: 26 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[t.h2, { color: theme.text }]}>{tr.settings.title}</Text>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={[t.caption, { color: theme.captionWarm }]}>{tr.common.close}</Text>
        </Pressable>
      </View>

      <View style={{ gap: 12 }}>
        <Eyebrow color={theme.captionWarm}>{tr.settings.theme}</Eyebrow>
        {themeOptions.map((o) => (
          <Row key={o.key} label={o.label} active={settings.theme === o.key} onPress={() => setSettings({ theme: o.key })} theme={theme} />
        ))}
      </View>

      <View style={{ gap: 12 }}>
        <Eyebrow color={theme.captionWarm}>{tr.settings.language}</Eyebrow>
        {langOptions.map((o) => (
          <Row key={o.key} label={o.label} active={settings.language === o.key} onPress={() => setSettings({ language: o.key })} theme={theme} />
        ))}
      </View>

      {aiEnabled ? (
        <View style={{ gap: 12 }}>
          <Eyebrow color={theme.captionWarm}>{tr.ai.consentLabel}</Eyebrow>
          <Row
            label={settings.aiConsent ? tr.ai.consentOn : tr.ai.consentOff}
            active={settings.aiConsent}
            onPress={() => setSettings({ aiConsent: !settings.aiConsent })}
            theme={theme}
          />
          <Text style={[t.caption, { color: theme.caption }]}>{tr.ai.consentBody}</Text>
        </View>
      ) : null}

      <View style={{ gap: 12 }}>
        <Eyebrow color={theme.captionWarm}>{tr.settings.backup}</Eyebrow>
        <Row
          label={busy === 'export' ? tr.settings.exporting : tr.settings.export}
          active={false}
          onPress={() => void onExport()}
          theme={theme}
          busy={busy === 'export'}
          disabled={busy !== null}
        />
        <Row
          label={busy === 'import' ? tr.settings.importing : tr.settings.import}
          active={false}
          onPress={() => void onImport()}
          theme={theme}
          busy={busy === 'import'}
          disabled={busy !== null}
        />
        <Text style={[t.caption, { color: theme.caption }]}>{tr.settings.backupHint}</Text>
      </View>

      {child ? (
        <View style={{ gap: 8 }}>
          <Eyebrow color={theme.captionWarm}>{tr.settings.child}</Eyebrow>
          <Text style={[t.body, { color: theme.textSecondary }]}>
            {`${child.name} · ${new Date(child.birth).toLocaleDateString(settings.language === 'ua' ? 'uk-UA' : settings.language === 'en' ? 'en-GB' : 'ru-RU')}`}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

/** Вынесен из компонента: вложенное объявление пересоздаёт строку на каждом рендере. */
function Row({ label, active, onPress, theme, busy, disabled }: {
  label: string; active: boolean; onPress: () => void; theme: Theme; busy?: boolean; disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        minHeight: theme.hit, borderRadius: theme.radius.md, paddingHorizontal: 16,
        flexDirection: 'row', alignItems: 'center', gap: 10,
        opacity: disabled && !busy ? 0.5 : 1,
        backgroundColor: active ? theme.chip : theme.card,
        borderWidth: 1, borderColor: active ? theme.accent : theme.line,
      }}
    >
      {busy ? <ActivityIndicator color={theme.captionWarm} /> : null}
      <Text style={[t.label, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}

/** Причину отказа показываем словами: «файл не подходит» ничего не объясняет. */
function backupMessage(e: unknown, fallback: string, noSpace: string): string {
  if (e instanceof BackupError && e.code === 'no_space') return noSpace;
  return fallback;
}
