const DAY = 24 * 60 * 60 * 1000;

/** Ключ дня в локальном времени — им же метятся отметки активностей. */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function monthKey(d: Date = new Date()): string {
  return dayKey(d).slice(0, 7);
}

/** Полных недель жизни на сегодня. */
export function weeksSince(birthISO: string, now: Date = new Date()): number {
  const birth = new Date(birthISO);
  if (Number.isNaN(birth.getTime())) return 0;
  const days = Math.floor((now.getTime() - birth.getTime()) / DAY);
  return Math.max(0, Math.floor(days / 7));
}

/** Порядковый номер недели с рождения — им выбирается вопрос капсулы. */
export function weekIndex(birthISO: string, now: Date = new Date()): number {
  return weeksSince(birthISO, now);
}

export function formatDuration(ms: number, short = false): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (short) return h > 0 ? `${h} ч ${m} мин` : `${m} мин`;
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function formatClock(ts: number): string {
  const d = new Date(ts);
  return `${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}`;
}

export function formatDayStamp(ts: number): string {
  const d = new Date(ts);
  return `${`${d.getDate()}`.padStart(2, '0')}.${`${d.getMonth() + 1}`.padStart(2, '0')}`;
}
