import type { Dict } from '@/i18n';
import type { Child, Handover, RhythmEvent } from '@/store/useAppStore';
import { dayKey, formatClock, formatDuration } from '@/lib/age';
import { feedingsOfDay, sleepSummaryOfDay } from '@/lib/rhythm';

/** Подпись типа кормления для последней записи — та же карта строк, что у экрана Кормления. */
export function feedTypeLabel(feedType: RhythmEvent['feedType'], t: Dict): string | undefined {
  if (feedType === 'breast') return t.rhythmCard.feedBreast;
  if (feedType === 'bottle') return t.rhythmCard.feedBottle;
  if (feedType === 'solid') return t.rhythmCard.feedSolid;
  return undefined;
}

/**
 * Текст памятки для того, кто остаётся с ребёнком. Раздел «Сейчас» строится только из
 * готовых хелперов lib/rhythm.ts и lib/age.ts — своей арифметики по интервалам здесь нет.
 * `now` — параметр, а не Date.now() внутри: экран передаёт тот же живой тик, что и Сон,
 * иначе снятый на паузе текст и показанная на экране цифра разойдутся.
 */
export function buildHandoverText(
  args: { child: Child | null; rhythm: RhythmEvent[]; handover: Handover },
  now: number,
  t: Dict,
): string {
  const { child, rhythm, handover } = args;
  const h = t.handover;
  const lines: string[] = [];

  lines.push(child ? `${h.shareTitle} — ${child.name}` : h.shareTitle);
  lines.push('');
  lines.push(h.now);

  const openSleep = rhythm.find((e) => e.kind === 'sleep' && e.end === null);
  lines.push(
    openSleep
      ? `${h.sleepingSince} ${formatClock(openSleep.start)} · ${formatDuration(now - openSleep.start, true, t.common)}`
      : h.notSleepingNow,
  );

  // Лента отсортирована по убыванию start (см. store/useAppStore.ts) — первая запись
  // kind='feeding' и есть самая свежая, открытая она или уже закрытая.
  const lastFeeding = rhythm.find((e) => e.kind === 'feeding');
  if (lastFeeding) {
    const type = feedTypeLabel(lastFeeding.feedType, t);
    lines.push(type ? `${h.lastFeeding} ${formatClock(lastFeeding.start)} · ${type}` : `${h.lastFeeding} ${formatClock(lastFeeding.start)}`);
  } else {
    lines.push(h.noFeedingYet);
  }

  const todayKey = dayKey(new Date(now));
  const summary = sleepSummaryOfDay(rhythm, todayKey, now);
  const feedingsToday = feedingsOfDay(rhythm, todayKey).length;
  lines.push(
    `${h.todaySummary} ${h.sleepNight} ${formatDuration(summary.nightMs, true, t.common)} · ${h.sleepDay} ${formatDuration(summary.dayMs, true, t.common)} · ${h.feedingsCount.replace('{n}', String(feedingsToday))}`,
  );

  // Пустые поля инструкций в текст не попадают — нет смысла слать памятку с пустыми заголовками.
  const fields: { label: string; value: string }[] = [
    { label: h.allergiesLabel, value: handover.allergies.trim() },
    { label: h.sleepLabel, value: handover.sleep.trim() },
    { label: h.comfortLabel, value: handover.comfort.trim() },
    { label: h.contactsLabel, value: handover.contacts.trim() },
  ];
  for (const field of fields) {
    if (!field.value) continue;
    lines.push('');
    lines.push(field.label);
    lines.push(field.value);
  }

  return lines.join('\n');
}
