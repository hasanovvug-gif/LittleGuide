# littleguide-ai — прокси к Gemini

Приложение никогда не ходит в Gemini напрямую: ключ из собранного бандла достаёт любой желающий.
Воркер держит ключ у себя и отдаёт наружу только текст.

## Endpoints

| Метод | Путь | Тело | Ответ |
|-------|------|------|-------|
| POST | `/v1/story` | `{childName, dayContext, lang}` | `{title, text}` |
| POST | `/v1/activity` | `{childName, weeks, lang}` | `{title, body, minutes, whyTitle, whyBody}` |
| POST | `/v1/summary` | `{childName, entries[], lang}` | `{text}` |

Заголовки: `x-app-token` (общий токен приложения), `x-install-id` (ключ лимита).
Ошибки: `401 unauthorized` · `429 rate_limited` · `422 blocked` (safety-фильтр) ·
`502 upstream_error` · `503 upstream_unavailable`. Приложение на любую ошибку падает
на бандловые сказки — сеть не является условием работы.

## Локальный запуск

```bash
cd worker && npm install
printf 'GEMINI_API_KEY=…\nAPP_TOKEN=dev\n' > .dev.vars   # .dev.vars в git не попадает
npm run dev
```

## Деплой

```bash
npx wrangler login
npx wrangler deploy
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put APP_TOKEN
```

Адрес воркера и тот же APP_TOKEN прописываются в `mobile/app.json` → `extra.aiProxyUrl`
и `extra.aiAppToken`.

⚠️ `extra` попадает в бандл в открытом виде: `aiAppToken` — не секрет, а фильтр от случайного
сканирования. Настоящая защита от перерасхода — лимиты воркера и то, что на ключе Gemini
не включён биллинг.
