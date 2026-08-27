import { useState } from 'react';
import { Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/i18n';
import { useAppStore, type Handover } from '@/store/useAppStore';
import { dayKey, formatClock, formatDayStamp, formatDuration } from '@/lib/age';
import { feedingsOfDay, sleepSummaryOfDay } from '@/lib/rhythm';
import { buildHandoverText, feedTypeLabel } from '@/lib/handover';
import { typography as t, fonts, type Theme } from '@/constants/theme';
import { Card, Eyebrow } from '@/components/ui';
import { useTicker } from '@/components/rhythm-shared';

type FieldKey = 'allergies' | 'sleep' | 'comfort' | 'contacts';

/** Ритм показывает цифры и НЕ интерпретирует их: без «мало спит», норм и порогов. */
export default function HandoverScreen() {
  const theme = useTheme();
  const tr = useT();
  const insets = useSafeAreaInsets();

  const child = useAppStore((s) => s.child);
  const rhythm = useAppStore((s) => s.rhythm);
  const handover = useAppStore((s) => s.handover);
  const setHandover = useAppStore((s) => s.setHandover);

  // Черновики полей — своё состояние на экран, чтобы не сохранять на каждое нажатие
  // (см. onBlur ниже). Экран монтируется уже после гидрации стора (см. app/_layout.tsx),
  // так что начальное значение всегда настоящее, а не пустая заглушка.
  const [drafts, setDrafts] = useState<Record<FieldKey, string>>({
    allergies: handover.allergies,
    sleep: handover.sleep,
    comfort: handover.comfort,
    contacts: handover.contacts,
  });

  function onBlurField(key: FieldKey) {
    const value = drafts[key];
    // Ничего не поменялось — не трогаем updated, иначе просто уйти с фокуса поля
    // выглядело бы как правка инструкций.
    if (value === handover[key]) return;
    setHandover({ [key]: value } as Pick<Handover, FieldKey>);
  }

  const openSleep = rhythm.find((e) => e.kind === 'sleep' && e.end === null);
  // Тот же живой тик, что у Сна: карточка «Сейчас» не должна застывать, пока таймер идёт.
  const now = useTicker(Boolean(openSleep));

  // Лента отсортирована по убыванию start — первая запись нужного вида и есть самая свежая.
  const lastFeeding = rhythm.find((e) => e.kind === 'feeding');
  const todayKey = dayKey(new Date(now));
  const summary = sleepSummaryOfDay(rhythm, todayKey, now);
  const feedingsToday = feedingsOfDay(rhythm, todayKey).length;

  function onShare() {
    void Share.share({ message: buildHandoverText({ child, rhythm, handover }, Date.now(), tr) }).catch(() => {
      // Отмена шаринга пользователем — не ошибка, ничего не показываем.
    });
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: 24, paddingBottom: 32, gap: 18 }}
    >
      <Text style={[t.h2, { color: theme.text }]}>{tr.handover.title}</Text>
      <Text style={[t.caption, { color: theme.textSecondary }]}>{tr.handover.subtitle}</Text>

      <Card theme={theme} style={{ gap: 10 }}>
        <Eyebrow color={theme.captionWarm}>{tr.handover.now}</Eyebrow>
        <Text style={[t.body, { color: theme.text }]}>
          {openSleep
            ? `${tr.handover.sleepingSince} ${formatClock(openSleep.start)} · ${formatDuration(now - openSleep.start, true, tr.common)}`
            : tr.handover.notSleepingNow}
        </Text>
        <Text style={[t.body, { color: theme.text }]}>
          {lastFeeding
            ? `${tr.handover.lastFeeding} ${formatClock(lastFeeding.start)}${feedTypeLabel(lastFeeding.feedType, tr) ? ` · ${feedTypeLabel(lastFeeding.feedType, tr)}` : ''}`
            : tr.handover.noFeedingYet}
        </Text>
        <Text style={[t.caption, { color: theme.textSecondary }]}>
          {`${tr.handover.todaySummary} ${tr.handover.sleepNight} ${formatDuration(summary.nightMs, true, tr.common)} · ${tr.handover.sleepDay} ${formatDuration(summary.dayMs, true, tr.common)} · ${tr.handover.feedingsCount.replace('{n}', String(feedingsToday))}`}
        </Text>
      </Card>

      <View style={{ gap: 14 }}>
        <Eyebrow color={theme.captionWarm}>{tr.handover.instructions}</Eyebrow>

        <Field
          theme={theme}
          label={tr.handover.allergiesLabel}
          placeholder={tr.handover.allergiesPlaceholder}
          value={drafts.allergies}
          onChangeText={(v) => setDrafts((d) => ({ ...d, allergies: v }))}
          onBlur={() => onBlurField('allergies')}
        />
        <Field
          theme={theme}
          label={tr.handover.sleepLabel}
          placeholder={tr.handover.sleepPlaceholder}
          value={drafts.sleep}
          onChangeText={(v) => setDrafts((d) => ({ ...d, sleep: v }))}
          onBlur={() => onBlurField('sleep')}
        />
        <Field
          theme={theme}
          label={tr.handover.comfortLabel}
          placeholder={tr.handover.comfortPlaceholder}
          value={drafts.comfort}
          onChangeText={(v) => setDrafts((d) => ({ ...d, comfort: v }))}
          onBlur={() => onBlurField('comfort')}
        />
        <Field
          theme={theme}
          label={tr.handover.contactsLabel}
          placeholder={tr.handover.contactsPlaceholder}
          value={drafts.contacts}
          onChangeText={(v) => setDrafts((d) => ({ ...d, contacts: v }))}
          onBlur={() => onBlurField('contacts')}
        />

        {handover.updated !== null ? (
          <Text style={[t.caption, { color: theme.caption }]}>
            {`${tr.handover.updated} ${formatDayStamp(handover.updated)} ${formatClock(handover.updated)}`}
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={onShare}
        style={{
          height: theme.bigHit, borderRadius: theme.radius.md,
          backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Text style={[t.button, { color: theme.onAccent }]}>{tr.handover.share}</Text>
      </Pressable>
    </ScrollView>
  );
}

/** Одно поле инструкции. Вынесено наружу: вложенное объявление пересоздаёт TextInput
 *  на каждом рендере и теряет фокус/курсор — та же ловушка, что уже была с DateBox/Row. */
function Field({ theme, label, placeholder, value, onChangeText, onBlur }: {
  theme: Theme;
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  onBlur: () => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={[t.label, { color: theme.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={theme.caption}
        multiline
        style={{
          minHeight: 80, borderRadius: theme.radius.md,
          backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line,
          paddingHorizontal: 14, paddingVertical: 12,
          fontFamily: fonts.sans, fontSize: 14, color: theme.text,
          textAlignVertical: 'top',
        }}
      />
    </View>
  );
}
