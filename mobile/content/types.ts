/** Схема офлайн-паков. Всё лежит в бандле, приложение работает в авиарежиме. */

export type Lang = 'ru' | 'ua' | 'en';

/** Неделя жизни: «14-я неделя. Мир становится объёмным». */
export type WeekEntry = {
  week: number;
  title: string;
  note: string;
};

/** Активность дня. Карточка одна: игра + факт «почему это работает». */
export type Activity = {
  id: string;
  from: number;      // с какой недели жизни
  to: number;        // по какую включительно
  minutes: number;
  title: string;
  text: string;
  why: string;       // «что сейчас с мозгом» — объясняет именно эту игру
};

/** Погода недели. Гроза = скачок роста. */
export type Weather = 'calm' | 'cloudy' | 'storm';

export type Leap = {
  week: number;      // неделя начала
  span: number;      // сколько недель длится
  title: string;
  note: string;
};

/** Готовая сказка в бандле — экран работает без интернета с первого запуска. */
export type BundledStory = {
  id: string;
  title: string;
  minutes: number;
  text: string;
};

/** Вопрос недели для капсулы дневника. */
export type CapsuleQuestion = {
  id: string;
  text: string;      // {name} подставляется
};
