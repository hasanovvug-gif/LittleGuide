# Промпт для Arena AI (battle mode) — «Кормление» и «Передача»

Арена сравнивает две анонимные модели глазами, поэтому просить надо **работающий прототип**,
а не описание раскладки. Вставлять английскую часть целиком, одним сообщением.

---

## EN — вставлять это

Build a single self-contained HTML file: an interactive prototype of two mobile screens for an
existing parenting app. No frameworks, no build step, no external JS. Inline all CSS and JS.
Google Fonts are allowed (Literata for headings, Manrope for body) with system fallbacks.
Show both screens side by side as 390 x 844 phone frames, and put a light/dark toggle at the top
that switches both at once.

**The app.** LittleGuide, a companion for a parent of a child aged 0 to 1. Fully offline: no
accounts, no cloud, all data on the phone. It never judges the parent and never shows norms,
targets or "your baby sleeps too little". It only reflects what the parent recorded.
The mood is warm, quiet, unhurried. A night lamp, not a fitness tracker.

**Palette, type and shape are fixed. Use exactly these and invent no new colors.**
Light "Soft Light": bg #FBF6F1 · card #FFFFFF · chip #F2E7DE · accent #E8A184 ·
accent text #C9714B · text #463B33 · secondary #8A7A6D · hairline #EFE4DA.
Dark "Quiet Night" (not an inversion, its own balance): bg #15171C · deep bg #0F1115 ·
card #1E2128 · chip #22262E · accent #E0A264 · text #EDE8E0 · secondary #9AA0AB · hairline #262A32.
Corner radii 12 / 16 / 20 / 26. Minimum tap target 44px, primary action 52 to 64px.

**The brief in one line:** every screen in this app is currently the same shape, a card with a list
and a section header. It reads as competent and completely forgettable. These two screens carry real
emotion and each needs its own visual identity. Surprise me with structure and motion,
not with new colors.

**SCREEN 1, "Feeding".** Feeding is an event in time, not an interval. There is deliberately no
start/stop timer: the parent is holding a baby and gets exactly one tap.
- One primary action, "Fed". A single tap records it at the current moment. Make the tap feel
  physical. It must actually work in the prototype and add a real mark to the day.
- The hero of the screen: time since the last feeding, counting up live, e.g. "2 h 15 min ago".
  This is the reason the parent opens the screen. It must tick continuously, not jump once a minute.
- Retro entry chips for a feeding that already happened: just now / 15 min / 30 min / 1 h ago.
- Type chosen after the record exists, not before: breast, bottle, solid food.
  Bottle adds an amount in ml. Solid food adds a short note of what was eaten.
- Today's feedings placed on a time axis so the rhythm and the gaps between them read at a glance.
  Not a list of rows.
- Day navigation: today / yesterday / earlier.
Seed the prototype with a believable day: roughly 6 feedings, mixed types, one bottle with ml,
one solid-food note.

**SCREEN 2, "Handover".** A note the parent hands to whoever is staying with the child: partner,
grandmother, babysitter. It should feel like something handed over, not like a settings page.
- "Right now", generated from recorded data: asleep since when and for how long, or awake;
  last feeding with its type; today's totals.
- Four fields the parent fills once: allergies and restrictions · how to put the child down ·
  what soothes them · important phone numbers. Empty fields must never produce empty headings.
- A share action that hands the whole thing over as plain text. In the prototype, show the exact
  text that would be shared.
- A quiet "updated <date>" stamp.

**Motion is a requirement, not decoration.** Every animation must earn its place and must actually
run in the prototype. Worth exploring: the "time since" number growing continuously; the physical
response to the "Fed" tap; today's marks arriving in sequence on entry; the "Right now" block
breathing gently to show the data is live rather than a snapshot. Honour prefers-reduced-motion.
Nothing may loop forever in a way that pulls the eye at 3 a.m.

**Constraints.** No advice, no norms, no evaluation of the child or the parent. No AI, no network,
no login. Legible one-handed, in the dark, with a baby in the other arm.

At the very bottom of the page, outside the phone frames, add a short note listing each animation
with its trigger and what it communicates, and one line on what you deliberately chose not to do.

---

## RU — тот же текст, для понимания

Собери один самодостаточный HTML: интерактивный прототип двух мобильных экранов существующего
приложения для родителей. Без фреймворков и сборки, весь CSS и JS инлайном. Google Fonts можно
(Literata для заголовков, Manrope для текста) с системным фолбэком. Оба экрана рядом рамками
390 x 844, сверху переключатель светлая/тёмная, меняющий сразу оба.

**Приложение.** LittleGuide, компаньон родителя ребёнка 0–1 года. Полностью офлайн: без аккаунтов
и облака, все данные на телефоне. Не оценивает родителя, не показывает норм и «ваш ребёнок мало
спит», только отражает записанное. Настроение тёплое, тихое, неторопливое: ночник, не фитнес-трекер.

**Палитра, шрифты и форма зафиксированы, новых цветов не изобретать.**
Светлая «Мягкий свет»: фон #FBF6F1 · карточка #FFFFFF · плашка #F2E7DE · акцент #E8A184 ·
акцентный текст #C9714B · текст #463B33 · вторичный #8A7A6D · линия #EFE4DA.
Тёмная «Тихая ночь» (не инверсия, свой баланс): фон #15171C · глубокий #0F1115 · карточка #1E2128 ·
плашка #22262E · акцент #E0A264 · текст #EDE8E0 · вторичный #9AA0AB · линия #262A32.
Радиусы 12/16/20/26. Цель нажатия минимум 44px, главное действие 52–64px.

**Суть брифа одной строкой:** сейчас все экраны одной формы — карточка со списком и заголовком
секции, грамотно и полностью забываемо. Эти два экрана несут настоящую эмоцию, у каждого должно
быть своё лицо. Удиви структурой и движением, а не новыми цветами.

**ЭКРАН 1 «Кормление».** Кормление — событие во времени, не интервал. Таймера старт/стоп
намеренно нет: у родителя ребёнок на руках и ровно один тап.
Одна главная кнопка «Покормили», тап пишет запись сейчас и должен ощущаться физически, в прототипе
реально работать и добавлять отметку на день · герой экрана — сколько прошло с прошлого кормления,
растёт вживую («2 ч 15 мин назад»), тикает непрерывно, а не прыгает раз в минуту · чипы ретро-ввода
«только что / 15 мин / 30 мин / час назад» · тип выбирается ПОСЛЕ записи: грудь, бутылочка, прикорм;
у бутылочки объём в мл, у прикорма короткая заметка что ел · кормления дня на временной оси, чтобы
ритм и промежутки читались с одного взгляда, а не списком строк · переключение дней.
Наполнить правдоподобным днём: около 6 кормлений, разные типы, одна бутылочка с мл, одна заметка о прикорме.

**ЭКРАН 2 «Передача».** Памятка тому, кто остаётся с ребёнком: партнёру, бабушке, няне. Должна
ощущаться как то, что передают из рук в руки, а не как страница настроек.
Блок «Сейчас» из записанных данных: спит с какого времени и сколько либо не спит, последнее
кормление с типом, итоги дня · четыре поля, заполняемые один раз: аллергии и что нельзя, как
укладывать, что успокаивает, важные телефоны (пустые поля не дают пустых заголовков) · отправка
всего простым текстом, в прототипе показать точный текст, который уйдёт · тихая пометка «обновлено».

**Движение — требование, а не украшение,** и в прототипе должно реально работать. У каждой анимации
свой смысл. Уважать prefers-reduced-motion, ничто не должно бесконечно дёргать глаз в три часа ночи.

**Ограничения.** Никаких советов, норм и оценок ребёнка или родителя. Ни AI, ни сети, ни логина.
Читаемо одной рукой, в темноте, со вторым ребёнком на руках.

Внизу страницы, вне рамок телефонов, короткой запиской перечислить каждую анимацию с триггером
и смыслом, и одной строкой — что решил сознательно не делать.
