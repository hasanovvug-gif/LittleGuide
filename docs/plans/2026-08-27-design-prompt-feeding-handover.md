# Промпт для дизайна: «Кормление» и «Передача»

Ниже — самодостаточный промпт. Вставлять целиком, ничего не дописывая.
Английская версия — основная (модели на ней сильнее в дизайне), русская — тот же текст,
чтобы было видно, что именно отправляешь.

---

## EN — вставлять это

You are designing two screens for an existing iOS/Android app. Do not redesign the whole app —
these two screens must feel like they belong to it, while having more character than the rest.

**The app.** LittleGuide: a companion for parents of a child aged 0–1. Fully offline, no accounts,
no cloud — all data lives on the phone. It never judges the parent and never shows norms,
targets, or "your baby sleeps too little". It only reflects what the parent recorded.
Built with Expo / React Native; animation via react-native-reanimated. Phone screens only, no tablet.

**Existing design language (keep it, don't replace it).**
Two themes, and the dark one is not an inversion of the light one.
Light "Soft Light": bg #FBF6F1, card #FFFFFF, chip #F2E7DE, accent #E8A184, accent text #C9714B,
text #463B33, secondary text #8A7A6D, hairline #EFE4DA.
Dark "Quiet Night": bg #15171C, deep bg #0F1115, card #1E2128, chip #22262E, accent #E0A264,
text #EDE8E0, secondary text #9AA0AB, hairline #262A32.
Headings use a serif (Literata), body uses a humanist sans (Manrope).
Corner radii 12 / 16 / 20 / 26. Minimum touch target 44pt light, 48pt dark; primary action 52–64pt.
The mood is warm, quiet, unhurried — a night lamp, not a fitness tracker.

**The problem to solve.** Every screen in this app is currently the same shape: a card, a list,
a section header. It reads as competent and completely forgettable. These two screens carry
real emotion and should each have their own visual identity — while still using the palette,
type and radii above. Surprise me with structure, not with new colors.

---

**SCREEN 1 — "Feeding".**

Design principle to respect: feeding is an EVENT IN TIME, not an interval. There is deliberately
no start/stop timer — the parent is holding a baby and gets exactly one tap.

The screen must carry:
- One primary action: "Fed". A single tap writes the record at the current moment.
- The hero of the screen: how long since the last feeding, counting up live (e.g. "2 h 15 min ago").
  This is the reason the parent opens this screen at all.
- Retro entry for a feeding that already happened: quick chips "just now / 15 min / 30 min / 1 h ago".
- Type, chosen after the record exists, not before: breast · bottle · solid food.
- Bottle adds an amount in ml. Solid food adds a short free-text note (what was eaten —
  parents re-read this when checking for reactions to a new product).
- The day as a whole: the feedings of today placed on a time axis, so the rhythm and the gaps
  between them are visible at a glance. Not a list of rows.
- Navigation between days (today / yesterday / earlier).

**SCREEN 2 — "Handover".**

A note the parent hands to whoever is staying with the child — partner, grandmother, babysitter.
It must feel like something you hand over, not like a settings page.

The screen must carry:
- "Right now", generated automatically from what the app already recorded: asleep since when and
  for how long (or awake), the last feeding with its type, and today's totals.
- Four fields the parent fills once and rarely changes: allergies and restrictions ·
  how to put the child down · what soothes them · important phone numbers.
  Empty fields must not produce empty headings anywhere.
- A share action that hands the whole thing off as plain text through the system share sheet
  (it lands in WhatsApp or Telegram).
- A quiet "updated <date>" stamp.

---

**Motion — this is a requirement, not decoration. Every animation must earn its place.**
Name each one and say what it communicates. Directions worth exploring:
the "time since last feeding" number growing continuously rather than jumping once a minute;
the response to the "Fed" tap being felt physically; today's marks arriving in sequence on entry;
the "Right now" block breathing gently to show the data is live rather than a snapshot.
Respect prefers-reduced-motion. Nothing may loop forever in a way that pulls the eye at 3 a.m.

**Constraints.**
No advice, no norms, no evaluation of the child or the parent. No AI, no network, no login.
Legible one-handed, in the dark, with a baby in the other arm. Both themes fully specified.

**What to give me back:**
1. The concept for each screen in two or three sentences — what makes it *this* screen and not a generic card list.
2. The layout described block by block, top to bottom, with real spacing and type sizes.
3. Every animation: trigger, duration, easing, what it communicates.
4. Both themes specified in the palette above.
5. Whatever you decided NOT to do, and why.

If you can produce a visual — a single self-contained HTML file with inline CSS, both screens,
phone width 390pt, light and dark side by side, working animations — do that as well.

---

## RU — тот же текст, для понимания

Ты проектируешь два экрана существующего приложения под iOS/Android. Не переделывай приложение
целиком: эти два экрана должны остаться его частью, но иметь больше характера, чем остальные.

**Приложение.** LittleGuide — компаньон для родителя ребёнка 0–1 года. Полностью офлайн,
без аккаунтов и облака, все данные на телефоне. Никогда не оценивает родителя, не показывает
нормы и «ваш ребёнок мало спит» — только отражает то, что родитель записал.
Expo / React Native, анимации на reanimated. Только телефон.

**Существующий язык (сохранить, не заменять).** Две темы, тёмная — не инверсия светлой.
Светлая «Мягкий свет»: фон #FBF6F1, карточка #FFFFFF, плашка #F2E7DE, акцент #E8A184,
акцентный текст #C9714B, текст #463B33, вторичный #8A7A6D, линия #EFE4DA.
Тёмная «Тихая ночь»: фон #15171C, глубокий #0F1115, карточка #1E2128, плашка #22262E,
акцент #E0A264, текст #EDE8E0, вторичный #9AA0AB, линия #262A32.
Заголовки — антиква Literata, текст — гротеск Manrope. Радиусы 12/16/20/26.
Цель нажатия минимум 44pt (светлая) и 48pt (тёмная), главное действие 52–64pt.
Настроение: тёплое, тихое, неторопливое. Ночник, а не фитнес-трекер.

**Задача, которую надо решить.** Сейчас все экраны одинаковой формы: карточка, список, заголовок
секции. Выглядит грамотно и полностью забываемо. Эти два экрана несут настоящую эмоцию, и у каждого
должно быть своё лицо — но в рамках палитры, шрифтов и радиусов выше. Удиви структурой, не новыми цветами.

**ЭКРАН 1 — «Кормление».** Принцип: кормление — это СОБЫТИЕ ВО ВРЕМЕНИ, а не интервал.
Таймера «старт/стоп» намеренно нет: у родителя ребёнок на руках и ровно один тап.
Нужны: одна главная кнопка «Покормили» (тап = запись сейчас) · герой экрана — сколько прошло
с прошлого кормления, растёт вживую («2 ч 15 мин назад»), ради этой цифры экран и открывают ·
ретро-ввод чипами «только что / 15 мин / 30 мин / час назад» · тип выбирается ПОСЛЕ записи:
грудь · бутылочка · прикорм · у бутылочки объём в мл, у прикорма короткая заметка что ел
(её перечитывают, проверяя реакцию на новый продукт) · кормления дня на временной оси, чтобы
были видны ритм и промежутки, а не список строк · переключение дней.

**ЭКРАН 2 — «Передача».** Памятка тому, кто остаётся с ребёнком: партнёру, бабушке, няне.
Должна ощущаться как то, что передают из рук в руки, а не как страница настроек.
Нужны: блок «Сейчас» автоматически из уже записанного (спит с какого времени и сколько либо
не спит, последнее кормление с типом, итоги дня) · четыре поля, которые родитель заполняет один
раз: аллергии и что нельзя · как укладывать · что успокаивает · важные телефоны (пустые поля
не должны давать пустых заголовков) · отправка всего этого простым текстом через системный шаринг
(уходит в WhatsApp или Telegram) · тихая пометка «обновлено <дата>».

**Движение — требование, а не украшение.** У каждой анимации назвать смысл. Направления:
цифра «сколько прошло» растёт непрерывно, а не прыгает раз в минуту; отклик на «Покормили»
ощущается физически; отметки дня появляются по очереди при входе; блок «Сейчас» мягко дышит,
показывая, что данные живые. Уважать prefers-reduced-motion. Ничто не должно бесконечно
дёргать глаз в три часа ночи.

**Ограничения.** Никаких советов, норм и оценок ребёнка или родителя. Ни AI, ни сети, ни логина.
Читаемо одной рукой, в темноте, со вторым ребёнком на руках. Обе темы прописать полностью.

**Что вернуть:** 1) концепцию каждого экрана в 2–3 предложениях — что делает его именно этим
экраном, а не универсальным списком карточек · 2) раскладку по блокам сверху вниз с реальными
отступами и кеглями · 3) каждую анимацию: триггер, длительность, кривая, смысл · 4) обе темы
в палитре выше · 5) то, что решил НЕ делать, и почему.
Если можешь дать картинку — один самодостаточный HTML с инлайновым CSS, оба экрана,
ширина 390pt, светлая и тёмная рядом, работающие анимации — сделай и это.
