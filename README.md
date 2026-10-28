# Лабораторная работа №4

Фронтенд системы учёта студентов, перенесённый с чистых HTML + CSS + JS (лаб. 3, папка `lab3_2`)
на Angular 22 + RxJS. Бэкенд — REST API из лаб. 3 (Jakarta EE, WildFly, PostgreSQL, JWT) без изменений
в логике. Всё приложение собирается и запускается в Docker Compose, фронтенд раздаёт Nginx.

## Запуск

Нужен только Docker (с плагином Compose). Из корня проекта:

```
docker compose up --build
```

Ручная настройка не нужна: у всех параметров есть значения по умолчанию.
Бэкенд стартует около 20–40 секунд (строка `WFLYSRV0025 ... started` в логе), до этого фронтенд
открывается, но на запросы к API показывает «Сервер недоступен».

- Приложение: http://localhost:8080/
- Swagger UI: http://localhost:8080/swagger.html
- Администратор: `admin` / `change-me-please`

Запуск в фоне: `docker compose up --build -d`, логи: `docker compose logs -f backend`.

Остановка:

```
docker compose stop          # остановить контейнеры
docker compose down          # удалить контейнеры (база сохраняется в томе pgdata)
docker compose down -v       # удалить контейнеры вместе с базой
```

## Настройки

Параметры окружения вынесены из кода в переменные. Чтобы поменять их, скопируйте `.env.example` в `.env`
в корне проекта и задайте свои значения:

| Переменная               | По умолчанию          | Назначение                                   |
|--------------------------|-----------------------|----------------------------------------------|
| `APP_PORT`               | `8080`                | порт на хосте, на котором открывается сайт   |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | `students` | база PostgreSQL                           |
| `JWT_SECRET`             | dev-строка            | ключ подписи JWT, не короче 32 символов      |
| `JWT_ACCESS_TTL_MINUTES` | `15`                  | время жизни access-токена                    |
| `JWT_REFRESH_TTL_DAYS`   | `7`                   | время жизни refresh-токена                   |
| `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | `admin` ... | администратор, создаётся при первом старте |

Адрес бэкенда для Nginx задаётся переменной `BACKEND_URL` сервиса `frontend` в `docker-compose.yml`
(по умолчанию `http://backend:8080`). Nginx подставляет её в конфиг при старте контейнера
(`frontend/nginx/default.conf.template`, механизм `envsubst` образа nginx).
Для быстрой проверки обновления токенов можно поставить `JWT_ACCESS_TTL_MINUTES=1`.

Если база уже была создана с другим паролем, после смены `DB_USER`/`DB_PASSWORD` нужен `docker compose down -v`.

## Как устроен запуск

```
браузер ──► frontend (nginx:80, наружу APP_PORT)
              ├─ /            статические файлы Angular, для любых путей SPA отдаётся index.html
              ├─ /api/...     proxy_pass ──► backend (WildFly:8080) ──► db (PostgreSQL:5432)
              └─ /swagger.html, /openapi ──► backend
```

- `frontend/Dockerfile` — многоэтапная сборка: этап `node:24-slim` ставит зависимости (`npm ci`)
  и собирает Angular (`ng build`), второй этап `nginx:stable-alpine` получает только папку `dist/lab4/browser`
  и шаблон конфига. Node.js и исходники в итоговый образ не попадают.
- `backend/Dockerfile` — тоже многоэтапная: Maven собирает `students.war`, WildFly его запускает.
- Все сервисы в одной сети Compose и обращаются друг к другу по имени сервиса (`backend`, `db`).
  Наружу открыт только порт Nginx, поэтому фронтенд и API на одном origin — CORS не нужен.
- Nginx отдаёт заголовки безопасности (CSP, `X-Frame-Options`, `X-Content-Type-Options`),
  кэширует статику с хешами в именах и не кэширует `index.html`.

## Режим разработки

`docker-compose_dev.yml` поднимает dev-сервер Angular (`ng serve`) с горячей перезагрузкой
внутри контейнера, бэкенд, базу и отдельный Nginx на 80 порту:

```
docker compose -f docker-compose_dev.yml up --build
```

Сайт: http://localhost/. Контейнер фронтенда работает от пользователя `1000:1000`, поэтому
созданные им файлы (`node_modules`, `.angular`) принадлежат пользователю хоста, а не root.

Без Docker фронтенд собирается так (нужен Node.js 22+):

```
cd frontend/lab4
npm ci
npx ng build        # результат в dist/lab4/browser
```

## Структура

```
docker-compose.yml          запуск всего приложения
docker-compose_dev.yml      режим разработки
.env.example                пример настроек
backend/                    REST API лаб. 3 (старый фронтенд из src/main/webapp убран, остался Swagger UI)
frontend/
  Dockerfile                multi-stage: сборка Angular + nginx
  Dockerfile_dev            образ с Angular CLI для разработки
  nginx/default.conf.template  конфиг Nginx: статика, SPA-fallback, прокси /api
  lab4/                     Angular-проект
    src/app/
      app.routes.ts         маршруты и guards
      app.config.ts         провайдеры: роутер, HttpClient с interceptor, восстановление сессии
      core/                 всё, что не про отображение
        models.ts           типы предметной области (Student, User, ...)
        students.api.ts, users.api.ts, auth.service.ts   HTTP-клиенты
        auth.store.ts       глобальное состояние (Angular Signals): пользователь, токены
        notice.store.ts     глобальные уведомления
        auth.interceptor.ts подстановка токена, обновление по refresh-токену при 401
        guards.ts           authGuard, adminGuard, guestGuard
        rx.ts               переиспользуемая реактивная логика на RxJS
        errors.ts           перевод ошибок HTTP в понятные сообщения
        validators.ts       клиентская валидация форм
      components/           переиспользуемые компоненты (форма, карточки, фильтры, пагинация, ...)
      pages/                страницы, привязанные к маршрутам
nginx/nginx.conf            Nginx для режима разработки
lab3_2/                     лаб. 3 целиком (исходный фронтенд на чистом JS) — для сравнения
```

## Маршруты

| Путь                  | Доступ        | Что делает                                            |
|-----------------------|---------------|-------------------------------------------------------|
| `/`                   | все           | главная                                               |
| `/login`              | гости         | вход                                                  |
| `/register`           | гости         | регистрация (после неё вход выполняется автоматически)|
| `/profile`            | вошедшие      | профиль, права, срок действия токена, выход           |
| `/students`           | вошедшие      | список: поиск, фильтры, сортировка, пагинация         |
| `/students/:id`       | вошедшие      | досье студента, выгрузка в JSON, удаление (ADMIN)     |
| `/students/new`       | ADMIN         | добавление                                            |
| `/students/:id/edit`  | ADMIN         | редактирование (отправляются только изменённые поля, PATCH) |
| `/users`              | ADMIN         | учетные записи: имя, почта, роль, пароль              |
| `**`                  | все           | страница 404                                          |

Гость, открывший защищённую страницу, попадает на `/login?returnUrl=...` и после входа возвращается обратно.
Пользователь с ролью USER не видит кнопок изменения, а на страницы администратора его не пускает `adminGuard`.
Даже если обойти проверки на клиенте, бэкенд ответит 403 — интерфейс покажет сообщение об этом.

## Как выполнены требования

**Компоненты.** Страницы (`pages/`) собирают экран из компонентов (`components/`).
Данные идут через `input()` (например `StudentCard [student]`, `Pagination [page] [totalPages]`,
`StudentForm [student] [busy] [serverErrors]`), события — через `output()` (`(apply)`, `(pageChange)`,
`(submitted)`, `(save)`). Локальное состояние — сигналы внутри компонентов (`showFilters`, `showExtra`,
`confirmId`, `editing`). Жизненный цикл — `ngOnChanges` в `StudentForm`, `FilterPanel`, `UserCard`
(заполнение формы при смене входных данных), `DestroyRef` / `takeUntilDestroyed` для отписки.
Условный рендеринг — `@if / @else / @for ... @empty`. Маршрутизация — Angular Router, параметр `:id`
приходит в компонент как input (`withComponentInputBinding`).

**Глобальное состояние.** `AuthStore` на Angular Signals: `user`, `accessToken`, `refreshToken`
и вычисляемые `isLoggedIn`, `isAdmin`. Им пользуются navbar, guards, interceptor и страницы.
`NoticeStore` — общая очередь уведомлений.

**RxJS** (`core/rx.ts` + места использования):
- `searchText()` — оператор для строки поиска: `map(trim)`, `debounceTime(400)`, `distinctUntilChanged()`.
- `loadWith()` — оператор загрузки: `switchMap` отменяет устаревший HTTP-запрос, `startWith` даёт
  состояние загрузки, `catchError` превращает ошибку в данные, `scan` сохраняет прошлые данные на время загрузки.
- `Action` — класс для отправки форм: `Subject` + `exhaustMap` (повторные нажатия игнорируются, пока
  запрос идёт), сигнал `busy` для блокировки кнопки, `share()` для общего результата.
- Список студентов: состояние запроса хранится в URL; `queryParamMap` → `map` → `distinctUntilChanged`
  → `combineLatest` с потоком перезагрузки → `loadWith` → `toSignal`. Поиск, фильтры, сортировка и
  страницы просто меняют URL, поэтому работают кнопки «назад/вперёд» и ссылка на отфильтрованный список.
- Interceptor: `catchError` на 401 → `refresh()` (одна общая операция обновления через `shareReplay`,
  даже если упало несколько запросов сразу) → `switchMap` повторяет исходный запрос с новым токеном.
- Регистрация: `register` → `switchMap` → `login` → `switchMap` → `/me`.

**Ошибки и загрузка.** `errors.ts` переводит ответ в понятный текст: 0 / 502 / 503 / 504 —
сервер недоступен, 401 — нужна авторизация (или сессия истекла — тогда выход и переход на `/login`),
403 — недостаточно прав, 404 — студент не найден, 409 — уже существует, 422 — текст ошибки
и подсказки у конкретных полей формы, 500 — внутренняя ошибка. Индикатор загрузки (`app-loader`),
полупрозрачная таблица во время обновления, кнопки «Сохранение...» и блокировка форм.
Если при открытии сайта бэкенд недоступен, сессия не сбрасывается: пользователь берётся из access-токена,
а на страницах видна ошибка с кнопкой «Повторить».

**Валидация.** Reactive Forms с теми же правилами, что на сервере: ИСУ — положительное целое,
ФИО — минимум два слова, группа `P3223`, общежитие и комната — положительные, дата заселения — от сегодня
до +6 месяцев (при редактировании только если дата изменена), заметка до 500 символов; имя пользователя
`[A-Za-z0-9_]{3,32}`, почта, пароль 8+ символов и не больше 72 байт, совпадение паролей.
В фильтрах числовые поля проверяются до отправки, чтобы не получать 400 от сервера.

## Что поменялось в заготовке

- Шаблон Angular дописан; страница `regeister` переименована в `register`, шаблонные `*.spec.ts` удалены.
- Бюджет размера стилей компонента увеличен: компонент `stars` генерирует ~70 КБ теней.
- Из `backend/src/main/webapp` убран старый фронтенд (index.html, static/) — теперь его заменяет Angular.
- `docker-compose_dev.yml` теперь сам запускает `ng serve`; `nginx/nginx.conf` проксирует WebSocket для HMR.
- Добавлены `docker-compose.yml`, `.env.example`, `frontend/Dockerfile`, `frontend/nginx/`.

Ответы на вопросы к защите — в файле `ЗАЩИТА.md`.
