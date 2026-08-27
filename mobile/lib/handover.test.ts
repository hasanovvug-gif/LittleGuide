import { ru } from '@/i18n/ru';
import type { Handover, RhythmEvent } from '@/store/useAppStore';
import { buildHandoverText } from './handover';

const NOW = new Date(2026, 0, 15, 10, 0, 0).getTime(); // 15.01.2026, 10:00 — фиксированная точка отсчёта
const child = { name: 'Марта', birth: '2025-06-01' };
const emptyHandover: Handover = { allergies: '', sleep: '', comfort: '', contacts: '', updated: null };

function sleepEvent(startOffsetMs: number, endOffsetMs: number | null): RhythmEvent {
  return { id: 'r1', kind: 'sleep', start: NOW - startOffsetMs, end: endOffsetMs === null ? null : NOW - endOffsetMs };
}

describe('buildHandoverText', () => {
  test('спит сейчас — показывает время начала и длительность', () => {
    const rhythm: RhythmEvent[] = [sleepEvent(80 * 60_000, null)]; // уснул 1 ч 20 мин назад, ещё спит
    const text = buildHandoverText({ child, rhythm, handover: emptyHandover }, NOW, ru);

    expect(text).toContain(ru.handover.sleepingSince);
    expect(text).not.toContain(ru.handover.notSleepingNow);
  });

  test('не спит — показывает статус без длительности', () => {
    const rhythm: RhythmEvent[] = [sleepEvent(5 * 60 * 60_000, 4 * 60 * 60_000)]; // закончил спать час назад
    const text = buildHandoverText({ child, rhythm, handover: emptyHandover }, NOW, ru);

    expect(text).toContain(ru.handover.notSleepingNow);
    expect(text).not.toContain(ru.handover.sleepingSince);
  });

  test('нет ни одной записи вообще — не падает, показывает пустые статусы и нулевую сводку', () => {
    const text = buildHandoverText({ child, rhythm: [], handover: emptyHandover }, NOW, ru);

    expect(text).toContain(ru.handover.notSleepingNow);
    expect(text).toContain(ru.handover.noFeedingYet);
    // Сводка дня всё равно печатается, просто с нулями — как на экранах Сна и Кормления.
    expect(text).toContain(ru.handover.feedingsCount.replace('{n}', '0'));
    // Пустых заголовков инструкций быть не должно.
    expect(text).not.toContain(ru.handover.allergiesLabel);
  });

  test('все инструкции пустые — ни один заголовок раздела не попадает в текст', () => {
    const rhythm: RhythmEvent[] = [sleepEvent(30 * 60_000, null)];
    const text = buildHandoverText({ child, rhythm, handover: emptyHandover }, NOW, ru);

    expect(text).not.toContain(ru.handover.allergiesLabel);
    expect(text).not.toContain(ru.handover.sleepLabel);
    expect(text).not.toContain(ru.handover.comfortLabel);
    expect(text).not.toContain(ru.handover.contactsLabel);
  });

  test('заполненные инструкции — непустые поля попадают в текст со своими заголовками', () => {
    const handover: Handover = { allergies: 'Орехи', sleep: 'Покачать', comfort: '', contacts: '', updated: NOW };
    const text = buildHandoverText({ child, rhythm: [], handover }, NOW, ru);

    expect(text).toContain(ru.handover.allergiesLabel);
    expect(text).toContain('Орехи');
    expect(text).toContain(ru.handover.sleepLabel);
    expect(text).toContain('Покачать');
    // Пустое поле «Что успокаивает» не должно оставить свой заголовок в тексте.
    expect(text).not.toContain(ru.handover.comfortLabel);
    expect(text).not.toContain(ru.handover.contactsLabel);
  });

  test('кормление через полночь — попадает в «последнее», но не в сегодняшний счётчик', () => {
    // Начато вчера 23:50, закончено сегодня 00:10 — считается по дню НАЧАЛА (feedingsOfDay).
    const start = new Date(2026, 0, 14, 23, 50, 0).getTime();
    const end = new Date(2026, 0, 15, 0, 10, 0).getTime();
    const rhythm: RhythmEvent[] = [{ id: 'f1', kind: 'feeding', start, end, feedType: 'bottle' }];
    const text = buildHandoverText({ child, rhythm, handover: emptyHandover }, NOW, ru);

    // Последнее кормление всё равно показано — оно единственное в ленте.
    expect(text).toContain(ru.handover.lastFeeding);
    expect(text).toContain(ru.rhythmCard.feedBottle);
    // Но в сегодняшнюю сводку (день = 15.01) оно не попало — начато 14.01.
    expect(text).toContain(ru.handover.feedingsCount.replace('{n}', '0'));
  });

  test('без ребёнка — заголовок без имени, функция не падает', () => {
    const text = buildHandoverText({ child: null, rhythm: [], handover: emptyHandover }, NOW, ru);
    expect(text.startsWith(ru.handover.shareTitle)).toBe(true);
    expect(text).not.toContain('—');
  });
});
