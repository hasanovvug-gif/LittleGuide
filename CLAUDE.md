# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Команды разработки

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера (порт 3000)
npm run dev

# Сборка для продакшна
npm run build

# Предпросмотр сборки
npm run preview
```

Переменные окружения: создать `.env.local` с ключом `GEMINI_API_KEY`. В `vite.config.ts` оба `process.env.API_KEY` и `process.env.GEMINI_API_KEY` маппятся на одно значение из этой переменной.

## Архитектура

**Стек:** Vite + React 19 + TypeScript, без бэкенда. Все данные хранятся в `localStorage` под ключом `mamaPapaUser` (тип `UserState`).

**Точка входа:** `index.tsx` → `App.tsx`. App управляет глобальным состоянием (`userState`, `activeTab`) и рендерит компоненты через `switch(activeTab)`.

### Два API-клиента в `services/geminiService.ts`

- `getFreeAI()` — использует `GEMINI_API_KEY`, модель `gemini-3.1-flash-lite-preview`. Для чата, активностей, квестов, рецептов, фото-идей, саммари дневника.
- `getPaidAI()` — использует `API_KEY` (тот же `GEMINI_API_KEY`), модель `gemini-3.1-flash-image-preview`. Для генерации изображений: иллюстрации к сказкам, арт-студия (scribble-to-art, coloring pages), магическое редактирование фото.

Все функции сервиса принимают `language` и возвращают контент на нужном языке (`uk` / `ru` / `en`).

### Мультиязычность

`i18n.ts` — инициализация i18next с тремя языками (`uk`, `ru`, `en`). Все строки интерфейса через `useTranslation()`. Язык AI-контента синхронизирован с `i18n.language`.

### Структура данных (`types.ts`)

Центральный тип — `UserState`: имя родителя, имя ребёнка, дата рождения, флаг онбординга, кастомные навигационные элементы, стрики, квесты, дневниковые записи, сон, пищевые предпочтения.

Возраст ребёнка вычисляется в месяцах в `App.tsx` из `childBirthDate` — это значение передаётся в Gemini для персонализации контента.

### Навигация

Layout с нижним таб-баром. Три средних кнопки настраиваемые (`customNavItems` в UserState, дефолт: `['food', 'diary', 'chat']`). Фиксированы только `home` (первая) и `menu` (последняя). Компонент `ToolsMenu` — страница со всеми разделами + настройка навигации.

### Интеграция с AI Studio

`window.aistudio?.hasSelectedApiKey()` — проверка ключа при запуске. Если запущено вне AI Studio — пропускается. Логика в начале `App.tsx`.

### Миграция данных localStorage

При загрузке `App.tsx` проверяет и мигрирует устаревшие данные (добавляет `customNavItems` если отсутствует). При смене дня сбрасывает `isCompletedToday` у квестов и стрик если пропущен день.
