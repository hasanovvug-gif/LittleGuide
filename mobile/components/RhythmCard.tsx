import { useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { typography as t, fonts, type Theme } from '@/constants/theme';
import type { Dict } from '@/i18n';
import { dayKey, formatClock, formatDayStamp } from '@/lib/age';
import { useAppStore, type FeedType, type RhythmEvent, type RhythmKind, type RhythmError } from '@/store/useAppStore';
import { IconTrash } from '@/components/Icon';

/** Три чипа «−15 / −30 / −1 ч» — общий набор для карточки правки и полоски забытого таймера. */
export const OFFSET_CHIPS: { minutes: number; key: 'minus15' | 'minus30' | 'minus1h' }[] = [
  { minutes: 15, key: 'minus15' },
  { minutes: 30, key: 'minus30' },
  { minutes: 60, key: 'minus1h' },
];

const FEED_OPTIONS: { key: FeedType; labelKey: 'feedBreast' | 'feedBottle' | 'feedSolid' }[] = [
  { key: 'breast', labelKey: 'feedBreast' },
  { key: 'bottle', labelKey: 'feedBottle' },
  { key: 'solid', labelKey: 'feedSolid' },
];

function errorMessage(err: RhythmError, tr: Dict): string {
  if (err === 'endBeforeStart') return tr.rhythmCard.errorEndBeforeStart;
  if (err === 'future') return tr.rhythmCard.errorFuture;
  if (err === 'overlap') return tr.rhythmCard.errorOverlap;
  return tr.rhythmCard.errorZeroLength;
}

/**
 * Карточка правки — главное в этапе 7б: тап по строке ленты или «+» открывает её, три чипа
 * закрывают главный случай «вспомнил через двадцать минут» одним тапом, тап по времени —
 * системное колесо для точного случая. `target: 'new'` — пустая карточка ручного добавления.
 */
export function RhythmCard({ theme, tr, kind, target, onClose }: {
  theme: Theme;
  tr: Dict;
  kind: RhythmKind;
  target: RhythmEvent | 'new';
  onClose: () => void;
}) {
  const updateRhythm = useAppStore((s) => s.updateRhythm);
  const addRhythmManual = useAppStore((s) => s.addRhythmManual);
  const removeRhythm = useAppStore((s) => s.removeRhythm);

  const isNew = target === 'new';
  const [start, setStart] = useState(() => (isNew ? Date.now() : target.start));
  const [hasEnd, setHasEnd] = useState(() => (isNew ? false : target.end !== null));
  const [end, setEnd] = useState(() => (isNew ? Date.now() : (target.end ?? Date.now())));
  const [feedType, setFeedType] = useState<FeedType | undefined>(() => (isNew ? undefined : target.feedType));
  const [error, setError] = useState<RhythmError | null>(null);
  const [wheelFor, setWheelFor] = useState<'start' | 'end' | null>(null);

  const startLabel = kind === 'sleep' ? tr.sleep.startSleep : tr.rhythmCard.feedingStart;
  const endLabel = kind === 'sleep' ? tr.sleep.stopSleep : tr.rhythmCard.feedingEnd;

  function applyOffset(field: 'start' | 'end', minutes: number) {
    const value = Date.now() - minutes * 60_000;
    if (field === 'start') setStart(value);
    else { setHasEnd(true); setEnd(value); }
    setError(null);
  }

  function pickedTime(field: 'start' | 'end', ts: number) {
    const clamped = Math.min(ts, Date.now());
    if (field === 'start') setStart(clamped);
    else { setHasEnd(true); setEnd(clamped); }
    setError(null);
  }

  /** Android не умеет единое колесо даты+времени — просим дату, потом время, тем же онClose. */
  function openWheel(field: 'start' | 'end') {
    const current = field === 'start' ? start : end;
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: new Date(current),
        mode: 'date',
        maximumDate: new Date(),
        onChange: (_e, pickedDate) => {
          if (!pickedDate) return;
          DateTimePickerAndroid.open({
            value: pickedDate,
            mode: 'time',
            onChange: (_e2, pickedTimeValue) => {
              if (!pickedTimeValue) return;
              const merged = new Date(pickedDate);
              merged.setHours(pickedTimeValue.getHours(), pickedTimeValue.getMinutes(), 0, 0);
              pickedTime(field, merged.getTime());
            },
          });
        },
      });
      return;
    }
    setWheelFor((v) => (v === field ? null : field));
  }

  function save() {
    const finalEnd = hasEnd ? end : null;
    const finalFeedType = kind === 'feeding' ? feedType : undefined;
    const err = isNew
      ? addRhythmManual(kind, start, finalEnd, finalFeedType)
      : updateRhythm(target.id, { start, end: finalEnd, feedType: finalFeedType });
    if (err) { setError(err); return; }
    onClose();
  }

  function confirmDelete() {
    if (isNew) return;
    Alert.alert(tr.rhythmCard.deleteConfirmTitle, tr.rhythmCard.deleteConfirmBody, [
      { text: tr.common.cancel, style: 'cancel' },
      { text: tr.common.delete, style: 'destructive', onPress: () => { removeRhythm(target.id); onClose(); } },
    ]);
  }

  const errorText = error ? errorMessage(error, tr) : null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        {/* Пустой onPress глушит всплытие тапа изнутри карточки к фону-закрывашке. */}
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: theme.card, borderTopLeftRadius: theme.radius.xl, borderTopRightRadius: theme.radius.xl,
            maxHeight: '85%',
          }}
        >
          <ScrollView contentContainerStyle={{ padding: 22, gap: 18 }}>
            <Text style={[t.h3, { color: theme.text }]}>
              {isNew ? tr.rhythmCard.addTitle : tr.rhythmCard.editTitle}
            </Text>

            <TimeField
              theme={theme} tr={tr} label={startLabel} value={start}
              onPressChip={(m) => applyOffset('start', m)} onPressTime={() => openWheel('start')}
            />
            {wheelFor === 'start' && Platform.OS === 'ios' ? (
              <DateTimePicker
                value={new Date(start)} mode="datetime" display="spinner" maximumDate={new Date()}
                onChange={(_e, d) => d && pickedTime('start', d.getTime())}
              />
            ) : null}

            <TimeField
              theme={theme} tr={tr} label={endLabel} value={hasEnd ? end : null}
              onPressChip={(m) => applyOffset('end', m)} onPressTime={() => openWheel('end')}
            />
            {wheelFor === 'end' && Platform.OS === 'ios' ? (
              <DateTimePicker
                value={new Date(hasEnd ? end : Date.now())} mode="datetime" display="spinner" maximumDate={new Date()}
                onChange={(_e, d) => d && pickedTime('end', d.getTime())}
              />
            ) : null}

            {kind === 'feeding' ? (
              <View style={{ gap: 10 }}>
                <Text style={[t.label, { color: theme.text }]}>{tr.rhythmCard.feedTypeLabel}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {FEED_OPTIONS.map((o) => {
                    const active = feedType === o.key;
                    return (
                      <Pressable
                        key={o.key}
                        onPress={() => setFeedType(active ? undefined : o.key)}
                        style={{
                          flex: 1, height: theme.hit, borderRadius: theme.radius.md,
                          backgroundColor: active ? theme.accent : theme.chip,
                          alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Text style={[t.button, { color: active ? theme.onAccent : theme.text }]}>{tr.rhythmCard[o.labelKey]}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {errorText ? <Text style={[t.caption, { color: theme.accentText }]}>{errorText}</Text> : null}

            <Pressable
              onPress={save}
              style={{ height: theme.bigHit, borderRadius: theme.radius.md, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={[t.button, { color: theme.onAccent }]}>{tr.rhythmCard.save}</Text>
            </Pressable>

            {!isNew ? (
              <Pressable
                onPress={confirmDelete}
                style={{ minHeight: theme.hit, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }}
              >
                <IconTrash size={16} color={theme.captionWarm} />
                <Text style={[t.caption, { color: theme.captionWarm }]}>{tr.common.delete}</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Строка времени: подпись, значение (тап — колесо), три чипа быстрого сдвига от текущего момента. */
function TimeField({ theme, tr, label, value, onPressChip, onPressTime }: {
  theme: Theme;
  tr: Dict;
  label: string;
  value: number | null;
  onPressChip: (minutes: number) => void;
  onPressTime: () => void;
}) {
  const showDay = value !== null && dayKey(new Date(value)) !== dayKey();
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[t.label, { color: theme.text }]}>{label}</Text>
        <Pressable onPress={onPressTime} hitSlop={8} style={{ minHeight: 32, justifyContent: 'center' }}>
          <Text style={{ fontFamily: fonts.sansSemi, fontSize: 20, color: theme.text, fontVariant: ['tabular-nums'] }}>
            {value !== null ? `${formatClock(value)}${showDay ? ` · ${formatDayStamp(value)}` : ''}` : '—:—'}
          </Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {OFFSET_CHIPS.map((o) => (
          <Pressable
            key={o.minutes}
            onPress={() => onPressChip(o.minutes)}
            style={{ flex: 1, height: theme.hit, borderRadius: theme.radius.md, backgroundColor: theme.chip, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={[t.button, { color: theme.text }]}>{tr.rhythmCard[o.key]}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/**
 * Полоска о забытом таймере — без пушей. Чипы закрывают открытую запись на now-offset сразу,
 * тап по тексту открывает полную карточку для точного случая (порог в 5ч/90мин чипами на
 * −15/−30/−1ч почти никогда не перекрыть одним тапом).
 */
export function StuckTimerBanner({ theme, text, tr, onPressChip, onPressText }: {
  theme: Theme;
  text: string;
  tr: Dict;
  onPressChip: (minutes: number) => void;
  onPressText: () => void;
}) {
  return (
    <View style={{ backgroundColor: theme.chip, borderRadius: theme.radius.lg, padding: 14, gap: 10 }}>
      <Pressable onPress={onPressText}>
        <Text style={[t.caption, { color: theme.captionWarm }]}>{text}</Text>
      </Pressable>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {OFFSET_CHIPS.map((o) => (
          <Pressable
            key={o.minutes}
            onPress={() => onPressChip(o.minutes)}
            style={{ flex: 1, height: theme.hit, borderRadius: theme.radius.md, backgroundColor: theme.card, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={[t.button, { color: theme.text }]}>{tr.rhythmCard[o.key]}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
