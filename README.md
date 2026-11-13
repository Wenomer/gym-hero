# Gym Hero

Личный дневник тренировок: силовые (подходы, вес, повторы) и бассейн (круги по 25 или 50 м).
Установленное PWA, работает на телефоне как приложение. Боевой адрес: <https://gym-hero.pages.dev>.

## Как устроено

| Часть | Что это |
|---|---|
| `public/index.html` | всё приложение: один файл, чистый JS без сборки |
| `public/auth-core.js`, `auth-ui.js`, `jsqr.js` | клиент входа из auth-kit (ключ, код, QR-сканер, пасскей, карточка «Вы вошли как…») |
| `functions/api/[[path]].js` | API на Cloudflare Pages Functions поверх D1 (оборудование, упражнения, шаблоны, тренировки, подходы) |
| `functions/api/auth-kit.js` | серверный клиент auth-kit |
| `functions/api/claim.js`, `functions/api/passkey/[[path]].js` | вход по одноразовому коду и по пасскею |
| `migrations/` | схема в общей D1 `looneyhome_database` (таблицы с префиксом `gym_hero_`), миграции только вперёд |
| `wrangler.toml` | проект Pages, база `DB` (общая D1 `looneyhome_database`) и привязка `VAULT` к сервису auth-kit |

Данные лежат в общей D1 `looneyhome_database` в таблицах `gym_hero_*`, у каждой записи есть `user_id`, и человек видит только свои. Старая база `gym-hero` оставлена как резерв.

## Вход и доступ

Ключи, пользователи и роли хранит отдельный сервис **auth-kit** (`../auth-kit`), здесь ключей нет. API на каждый запрос спрашивает у него по привязке `VAULT`, чей ключ пришёл (`Authorization: Bearer gh_…`).
Ключ показывается один раз в админке auth-kit. Ключ имперсонации («смотреть как другой человек») бывает только для чтения: приложение прячет всё, что меняет данные, а API отвечает 403.

Файлы `functions/api/auth-kit.js`, `claim.js`, `passkey/[[path]].js` и `public/auth-core.js`, `auth-ui.js`, `jsqr.js`, `jsqr.LICENSE` это **эталонные файлы** из auth-kit. Их копируют без изменений из закоммиченного HEAD auth-kit и не правят здесь, правила в `../auth-kit/INTEGRATION.md`.

## Команды

Нужен Node и вход в Cloudflare (`npx wrangler login`).

```bash
npm install            # wrangler
npm run dev            # локальный сервер Pages (http://localhost:8788)
npm run deploy         # выкат в прод
npm run db:migrate:local   # миграции в локальную D1
npm run db:migrate         # миграции в общую боевую D1 (до деплоя кода, по одному сервису за раз)
npm run db:backup          # выгрузить общую боевую D1 в ~/d1-backups/ (делать перед каждой миграцией)
```

Локально без запущенного auth-kit привязка `VAULT` недоступна, и API отвечает 500 `no_vault_binding`. Для отладки интерфейса удобнее всего временный мок сервера на `/api/*`, а в проде всё проверяется на самом `gym-hero.pages.dev`.

## Заметки

- Номер сборки (`BUILD` в `public/index.html`) виден внизу настроек. Его поднимают при каждом выкате, чтобы отличать новую версию от закешированной.
- На iPhone PWA кеширует страницу отдельно от Safari: после обновления иконки или входа PWA иногда нужно удалить с экрана «Домой» и добавить заново.
- Пасскей создаётся и работает только на боевом домене `gym-hero.pages.dev`, на превью-адресах вида `<хэш>.gym-hero.pages.dev` нет.
- Заголовки и CSP лежат в `public/_headers`.
