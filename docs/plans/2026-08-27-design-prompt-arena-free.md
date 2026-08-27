# Промпт для Arena — полная свобода дизайна, все шесть разделов

Ни палитры, ни шрифтов, ни раскладки. Задано только что за приложение, что должно уметь
и планка качества. Вставлять английскую часть одним сообщением.

---

## EN — вставлять это

Build a single self-contained HTML file: an interactive prototype of a whole mobile app, six
screens. No frameworks, no build step, no external JS. Inline all CSS and JS. Google Fonts allowed.
Lay the screens out as 390 x 844 phone frames, in rows, all visible on one page.

Make it look like a top-tier 2026 mobile app. Show me what you are actually capable of visually.
Every visual decision is yours: palette, typography, composition, shape, texture, iconography,
motion, the shape of the navigation itself. I am deliberately not giving you a design system.
Do not default to the safe generic look of a template landing page. The six screens must read as
one designed product, not six unrelated exercises.

**The app.** A companion for a parent of a child aged 0 to 1. Fully offline: no accounts, no cloud,
all data lives on the phone. Used one-handed, often in the dark, often at 3 a.m., with a baby in
the other arm. It never judges the parent, never shows norms or targets, never says "your baby
sleeps too little". It only reflects what the parent recorded. That is the one product rule.
Everything about how it looks and feels is up to you.

---

**1. HOME.** The entry point and the hub.
- The child's current week of life, and one thing worth doing today with them, which can be marked
  as done or swapped for another.
- A glanceable summary of today: how much the child slept, how many feedings.
- A way into every other section. Only three sections sit in the bottom navigation at a time and
  the parent chooses which; the rest live here. How that choice is expressed is your call.

**2. SLEEP.** Sleep is an interval, so here a start/stop timer is right.
- Start "asleep", end "awake", in one tap each.
- While it runs, how long the child has been asleep, live.
- The whole day as a shape: when the sleeps happened, night versus day, a sleep crossing midnight
  belonging partly to both days.
- Fix a sleep after the fact without typing a time, and edit or delete a past record.
- Totals for the day, and movement between days.

**3. FEEDING.** Feeding is an event in time, not an interval, so there is deliberately NO timer here.
- Record "fed" in a single tap, at the current moment.
- Live, instantly: how long since the last feeding. This is why the parent opens this screen.
- Log a feeding that happened a little while ago, without typing a time.
- The kind: breast, bottle or solid food. A bottle carries an amount in ml. Solid food carries a
  short note of what was eaten, which parents re-read when checking for reactions to a new product.
- The rhythm of the whole day at a glance: when the feedings happened, how big the gaps were.

**4. DIARY.** The memory of the year.
- Free entries: a line of text, a photo, a voice note.
- One question a week, answered in a single line. Four answers make a monthly slice worth re-reading.
- Activities the parent marked done on Home appear here on their own.
- Everything is stored on the phone, and can be exported to a single file and restored from it.

**5. BEDTIME STORY.** The only part that talks to the outside world.
- The parent types or taps a few things that happened today, and a story for tonight is written
  from them, starring their child by name.
- Generation takes time, can fail, and can be unavailable offline. The waiting, the failure and the
  offline state all need to feel calm rather than broken, because this is used at bedtime.
- Stories are kept in a library and re-read. Anything written by AI is visibly marked as such and
  can be reported.
- Before anything is ever sent out, the parent gives explicit consent once, and can withdraw it.

**6. HANDOVER.** A note the parent hands to whoever stays with the child: partner, grandmother, sitter.
- The child's state right now, generated automatically from what was already recorded: asleep since
  when and for how long or awake, the last feeding and its kind, today's totals.
- Four things the parent writes once and rarely changes: allergies and restrictions, how to put the
  child down, what soothes them, important phone numbers. Empty ones must leave no empty headings.
- Hand all of it over as plain text in one action. Show the exact text that would be shared.

---

**Motion matters.** Animations must actually run in the prototype and must mean something rather
than decorate. Honour prefers-reduced-motion, and nothing may loop forever in a way that pulls the
eye in the middle of the night.

The prototype must genuinely work where it counts: the record buttons record, elapsed time ticks,
navigation moves between screens, the screens respond. Seed it with a believable day: about six
feedings of mixed kinds with one bottle in ml and one solid-food note, three or four sleeps
including one that crosses midnight, a couple of diary entries, two stories in the library.
If your design has a light and a dark mode, include a toggle.

At the bottom of the page, outside the phone frames, in a few lines: the idea behind your visual
direction, what makes the navigation work, each animation and what it communicates, and what you
deliberately chose not to do.

---

## RU — тот же текст, для понимания

Собери один самодостаточный HTML: интерактивный прототип целого мобильного приложения, шесть
экранов. Без фреймворков и сборки, весь CSS и JS инлайном. Google Fonts можно. Экраны рамками
390 x 844, рядами, все видны на одной странице.

Сделай так, как выглядит топовое мобильное приложение 2026 года. Покажи, на что ты реально способна
визуально. Все визуальные решения твои: палитра, типографика, композиция, форма, фактура, иконки,
движение, сама форма навигации. Дизайн-систему я намеренно не даю. Не скатывайся в безопасный
шаблонный вид лендинга. Шесть экранов должны читаться как один спроектированный продукт,
а не шесть отдельных упражнений.

**Приложение.** Компаньон родителя ребёнка 0–1 года. Полностью офлайн: без аккаунтов и облака,
все данные на телефоне. Пользуются одной рукой, часто в темноте, часто в три часа ночи, со вторым
ребёнком на руках. Никогда не оценивает родителя, не показывает норм и целей, не говорит «ваш
ребёнок мало спит». Только отражает записанное. Это единственное продуктовое правило.

**1. ДОМ.** Точка входа и хаб. Текущая неделя жизни ребёнка и одно дело на сегодня, которое можно
отметить сделанным или заменить другим · сводка дня одним взглядом: сколько спал, сколько кормлений ·
вход во все остальные разделы. Внизу одновременно только три раздела, и родитель сам выбирает какие,
остальные живут здесь; как выразить этот выбор — твоё решение.

**2. СОН.** Сон — интервал, поэтому здесь таймер старт/стоп уместен. Одним тапом «уснул», одним
«проснулся» · пока идёт, вживую видно сколько спит · весь день формой: когда были сны, ночь против
дня, сон через полночь принадлежит частично обоим дням · записать сон задним числом, не вводя время
руками, и отредактировать или удалить прошлую запись · итоги дня и переключение дней.

**3. КОРМЛЕНИЕ.** Событие во времени, не интервал, поэтому таймера здесь намеренно НЕТ.
Записать «покормили» одним тапом в текущий момент · вживую: сколько прошло с прошлого кормления,
ради этого экран и открывают · записать недавнее кормление, не вводя время · тип: грудь, бутылочка,
прикорм; у бутылочки объём в мл, у прикорма короткая заметка что ел (её перечитывают, проверяя
реакцию на новый продукт) · ритм всего дня с одного взгляда: когда были кормления и промежутки.

**4. ДНЕВНИК.** Память года. Свободные записи: строка текста, фото, голосовая заметка · один вопрос
в неделю, ответ в одну строку; четыре ответа складываются в месячный срез, который приятно
перечитать · отмеченные на Доме активности попадают сюда сами · всё хранится на телефоне,
выгружается одним файлом и восстанавливается из него.

**5. СКАЗКА НА НОЧЬ.** Единственная часть, которая обращается наружу. Родитель пишет или отмечает
несколько вещей, случившихся сегодня, и из них пишется сказка на эту ночь с его ребёнком по имени ·
сочинение занимает время, может не получиться и недоступно без интернета: ожидание, неудача и офлайн
должны ощущаться спокойно, а не поломкой, потому что это используют перед сном · сказки хранятся
в библиотеке и перечитываются, всё написанное ИИ явно помечено и на него можно пожаловаться ·
перед первой отправкой данных наружу родитель даёт явное согласие и может его отозвать.

**6. ПЕРЕДАЧА.** Памятка тому, кто остаётся с ребёнком: партнёру, бабушке, няне. Состояние ребёнка
сейчас, автоматически из записанного: спит с какого времени и сколько либо не спит, последнее
кормление и его тип, итоги дня · четыре вещи, которые родитель пишет один раз: аллергии и что
нельзя, как укладывать, что успокаивает, важные телефоны (пустые не оставляют пустых заголовков) ·
отдать всё простым текстом одним действием, показав точный текст, который уйдёт.

**Движение важно.** Анимации должны реально работать и что-то значить, а не украшать. Уважать
prefers-reduced-motion, ничто не должно бесконечно дёргать глаз посреди ночи.

Прототип должен по-настоящему работать там, где это важно: кнопки записи записывают, время тикает,
навигация переключает экраны. Наполнить правдоподобным днём: около шести кормлений разных типов,
одна бутылочка с мл, одна заметка о прикорме, три-четыре сна включая один через полночь, пара
записей в дневнике, две сказки в библиотеке. Есть светлая и тёмная тема — сделай переключатель.

Внизу страницы, вне рамок телефонов, в несколько строк: идея визуального направления, за счёт чего
работает навигация, каждая анимация и её смысл, и что ты сознательно решила не делать.
