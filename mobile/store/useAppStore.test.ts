import { normalize, SCHEMA_VERSION, useAppStore } from './useAppStore';

describe('handover — переход схемы 3 → 4', () => {
  test('exportPayload → normalize сохраняет заполненные инструкции (round-trip .lgbackup)', () => {
    // exportPayload() — то, что settings.tsx кладёт в файл через writeBackup(). Если сюда
    // забыть добавить handover, инструкции тихо не попадут в бэкап, хотя normalize() их примет.
    useAppStore.setState({
      child: { name: 'Марта', birth: '2025-06-01' },
      handover: { allergies: 'Орехи', sleep: 'Покачать 10 мин', comfort: 'Плед', contacts: 'Мама +380', updated: Date.now() },
    });

    const exported = useAppStore.getState().exportPayload();
    expect(exported).toHaveProperty('handover');

    const normalized = normalize(exported);
    expect(normalized).not.toBeNull();
    expect(normalized!.handover).toEqual(useAppStore.getState().handover);
  });

  test('живое обновление: файл schema 3 (без handover) проходит normalize с сохранёнными rhythm/diary/feedType', () => {
    // Так выглядит реальный .lgbackup двух живых тестировщиков до этого этапа — поля handover
    // в нём нет вообще, а не пустой объект. normalize() не должен споткнуться и не должен
    // потерять то, что уже было записано в schema 3.
    const legacyV3 = {
      version: 3,
      child: { name: 'Марта', birth: '2025-06-01' },
      settings: { theme: 'auto', language: 'ru', aiConsent: false, pinnedTabs: ['sleep', 'feeding', 'diary'] },
      marks: { '2026-01-14': 'a1' },
      skips: {},
      rhythm: [
        { id: 'r1', kind: 'feeding', start: Date.now() - 3_600_000, end: Date.now() - 3_000_000, feedType: 'bottle' },
        { id: 'r2', kind: 'sleep', start: Date.now() - 7_200_000, end: Date.now() - 5_400_000 },
      ],
      diary: [{ id: 'd1', ts: Date.now() - 100_000, kind: 'note', text: 'Гуляли в парке' }],
      capsule: [],
      stories: [],
    };

    const normalized = normalize(legacyV3);

    expect(normalized).not.toBeNull();
    expect(normalized!.version).toBe(SCHEMA_VERSION);
    expect(normalized!.rhythm).toHaveLength(2);
    expect(normalized!.rhythm.find((e) => e.kind === 'feeding')?.feedType).toBe('bottle');
    expect(normalized!.diary).toHaveLength(1);
    expect(normalized!.diary[0].text).toBe('Гуляли в парке');
    // Отсутствующий handover → дефолт с пустыми строками, а не отказ всего файла.
    expect(normalized!.handover).toEqual({ allergies: '', sleep: '', comfort: '', contacts: '', updated: null });
  });
});
