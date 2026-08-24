// Две темы LittleGuide. Токены сняты с канваса 2.0 (design/canvas/*.dc.html).
// «Мягкий свет» — день, «Тихая ночь» — ночь. Ночная не инверсия светлой: свои цели нажатия.

export type ThemeName = 'day' | 'night';

export type Theme = {
  name: ThemeName;
  bg: string;
  bgDeep: string;      // Ритм и чтение сказки уходят глубже
  card: string;
  cardSoft: string;
  chip: string;        // плашки
  accent: string;
  onAccent: string;
  accentText: string;
  text: string;
  textSecondary: string;
  caption: string;
  captionWarm: string;
  line: string;
  tabActive: string;
  tabIdle: string;
  radius: { sm: number; md: number; lg: number; xl: number };
  hit: number;         // минимальная цель нажатия
  bigHit: number;      // крупные кнопки ритма
};

export const dayTheme: Theme = {
  name: 'day',
  bg: '#FBF6F1',
  bgDeep: '#FBF6F1',
  card: '#FFFFFF',
  cardSoft: '#FFFFFF',
  chip: '#F2E7DE',
  accent: '#E8A184',
  onAccent: '#5E3021',
  accentText: '#C9714B',
  text: '#463B33',
  textSecondary: '#8A7A6D',
  caption: '#A9968A',
  captionWarm: '#B08A76',
  line: '#EFE4DA',
  tabActive: '#D98668',
  tabIdle: '#C0AC9C',
  radius: { sm: 12, md: 16, lg: 20, xl: 26 },
  hit: 44,
  bigHit: 52,
};

export const nightTheme: Theme = {
  name: 'night',
  bg: '#15171C',
  bgDeep: '#0F1115',
  card: '#1E2128',
  cardSoft: '#1A1D23',
  chip: '#22262E',
  accent: '#E0A264',
  onAccent: '#2A1B0A',
  accentText: '#E0A264',
  text: '#EDE8E0',
  textSecondary: '#9AA0AB',
  caption: '#5A6069',
  captionWarm: '#6C7280',
  line: '#262A32',
  tabActive: '#E0A264',
  tabIdle: '#5A6069',
  radius: { sm: 12, md: 16, lg: 20, xl: 26 },
  hit: 48,
  bigHit: 64,
};

// Literata вместо Newsreader: у Newsreader нет кириллицы, ru/ua падали в системный гротеск.
export const fonts = {
  serif: 'Literata_400Regular',
  serifMedium: 'Literata_500Medium',
  sans: 'Manrope_400Regular',
  sansMedium: 'Manrope_500Medium',
  sansSemi: 'Manrope_600SemiBold',
};

export const typography = {
  eyebrow: { fontFamily: fonts.sansSemi, fontSize: 11, letterSpacing: 1.1 },
  h1: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 35 },
  h2: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 30 },
  h3: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 26 },
  body: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 22 },
  bodyLg: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 24 },
  label: { fontFamily: fonts.sansMedium, fontSize: 14 },
  caption: { fontFamily: fonts.sans, fontSize: 13 },
  button: { fontFamily: fonts.sansSemi, fontSize: 15 },
};
