# Лабораторная работа №3

REST API для учёта студентов общежития, перенесённый с Django (лаб. 2) на Jakarta EE.
Данные хранятся в PostgreSQL, доступ к API — по JWT с ролями `ADMIN` и `USER`.

Код бэкенда — в каталоге `backend/`. Фронтенд лаб. 2 (шаблон и статика) лежит в `student_register/main/` без изменений.

## Стек

- Java 21, Maven, WAR-архив `students.war`
- WildFly 41 (дистрибутив Jakarta EE 10), конфигурация `standalone-microprofile.xml`
- JAX-RS (RESTEasy), CDI, Bean Validation, JSON-B, JTA
- JPA через EclipseLink 4 (поставляется внутри WAR), PostgreSQL
- JWT: `com.auth0:java-jwt` (HS256), пароли: BCrypt (`org.mindrot:jbcrypt`, cost 12)
- MicroProfile Config (настройки из переменных окружения), MicroProfile OpenAPI + Swagger UI
- SLF4J для логов, JUnit 5 + Mockito для тестов

## Структура

```
backend/
  pom.xml
  .env.example                    пример настроек окружения
  wildfly/configure.cli           драйвер PostgreSQL и источник данных для WildFly
  postman/                        коллекция запросов Postman
  src/main/java/lab3/
    api/         JAX-RS ресурсы, фильтры (JWT и роли, лог запросов), обработка ошибок
    service/     бизнес-логика, транзакции, JWT, проверка данных
    repository/  доступ к БД через EntityManager (Criteria API, JPQL)
    model/       JPA-сущности Student, User, RefreshToken
    dto/         записи (record) для запросов и ответов API
  src/main/resources/META-INF/
    persistence.xml
    sql/create.sql                схема БД (выполняется при старте)
  src/main/webapp/swagger.html    Swagger UI
```

## Запуск через Docker

Нужен только Docker. Из корня проекта:

```
docker compose up --build
```

Поднимаются PostgreSQL и WildFly с приложением, сборка и тесты идут внутри образа.
После строки `WFLYSRV0025 ... started` в логе:

- Фронт: http://localhost:8080/
- API: http://localhost:8080/api
- Swagger UI: http://localhost:8080/swagger.html
- Администратор: `admin` / `change-me-please`

Настройки по умолчанию заданы в `docker-compose.yml`; их можно переопределить в файле `.env`
в корне проекта (`JWT_SECRET`, `ADMIN_PASSWORD`, `DB_PASSWORD`, `APP_PORT` и т.д.).
Остановить: `Ctrl+C`, удалить контейнеры вместе с базой: `docker compose down -v`.

## Запуск скриптом start.py (без Docker)

Нужен только Python 3.8+. Скрипт сам скачивает JDK 21, Maven, WildFly, PostgreSQL и JDBC-драйвер
(на Windows в `C:\lab3-tools`, на Linux и macOS в `~/.lab3-tools`, папку можно задать переменной `LAB3_TOOLS`),
создает `backend/.env` из `.env.example`, собирает проект и запускает сервер:

```
python start.py          # скачать, собрать, запустить (Ctrl+C останавливает)
python start.py setup    # только скачать и настроить
python start.py stop     # остановить, если что-то осталось работать
```

Если порты 8080/9990 заняты, WildFly запускается со сдвигом (например 8180), адрес печатается в консоли.
База создается один раз: если после первого запуска поменять `DB_USER` или `DB_PASSWORD` в `backend/.env`,
удалите папку `pgdata` в каталоге инструментов.

## Ручной запуск без Docker

Нужны JDK 21, Maven 3.9, PostgreSQL 14+, WildFly 41
([wildfly-ee-10-41.0.1.Final](https://github.com/wildfly/wildfly/releases/tag/41.0.1.Final))
и JDBC-драйвер [postgresql-42.7.x.jar](https://jdbc.postgresql.org/download/).
Ниже `WILDFLY_HOME` — каталог распакованного WildFly.

### 1. База данных

```
psql -U postgres -c "CREATE USER students WITH PASSWORD 'students';"
psql -U postgres -c "CREATE DATABASE students OWNER students;"
```

Таблицы приложение создаёт само при старте (`create.sql`, `CREATE TABLE IF NOT EXISTS`).

### 2. Настройки

Скопируйте `backend/.env.example` в `backend/.env` и задайте свои значения:
адрес базы, `JWT_SECRET` (не короче 32 символов), логин и пароль администратора.
Администратор создаётся при первом запуске, остальные пользователи регистрируются через API с ролью `USER`.

### 3. Настройка WildFly (один раз, сервер должен быть остановлен)

Скрипт добавляет модуль драйвера PostgreSQL и источник данных `java:jboss/datasources/StudentsDS`.
Адрес, логин и пароль базы он не сохраняет, а берёт из переменных `DB_URL`, `DB_USER`, `DB_PASSWORD` при старте сервера.

Windows (cmd):
```
%WILDFLY_HOME%\bin\jboss-cli.bat "-Dpostgres.jar=C:\drivers\postgresql-42.7.13.jar" --file=backend\wildfly\configure.cli
```

Linux:
```
$WILDFLY_HOME/bin/jboss-cli.sh -Dpostgres.jar=$HOME/drivers/postgresql-42.7.13.jar --file=backend/wildfly/configure.cli
```

### 4. Сборка и деплой

```
cd backend
mvn package
```

Скопируйте `backend/target/students.war` в `WILDFLY_HOME/standalone/deployments/`.

### 5. Запуск сервера

Переменные из `.env` нужно передать серверу через окружение.

Windows (PowerShell, из каталога `backend`):
```
Get-Content .env | Where-Object { $_ -match '^[A-Z_]+=' } | ForEach-Object {
    $name, $value = $_ -split '=', 2
    Set-Item "env:$name" $value
}
& "$env:WILDFLY_HOME\bin\standalone.bat" -c standalone-microprofile.xml
```

Linux (из каталога `backend`):
```
set -a; source .env; set +a
$WILDFLY_HOME/bin/standalone.sh -c standalone-microprofile.xml
```

После запуска:

- API: http://localhost:8080/api
- Swagger UI: http://localhost:8080/swagger.html (кнопка Authorize — access-токен)
- OpenAPI: http://localhost:8080/openapi

## API

| Метод  | Путь                    | Роль         | Ответ                               |
|--------|-------------------------|--------------|-------------------------------------|
| POST   | /api/auth/register      | —            | 201, пользователь с ролью USER      |
| POST   | /api/auth/login         | —            | 200, access- и refresh-токены       |
| POST   | /api/auth/refresh       | —            | 200, новая пара токенов             |
| POST   | /api/auth/logout        | —            | 204, refresh-токен отозван          |
| GET    | /api/auth/me            | любая        | 200, текущий пользователь           |
| GET    | /api/requests?…         | USER, ADMIN  | 200, страница студентов             |
| QUERY  | /api/requests           | USER, ADMIN  | 200, то же с параметрами в JSON     |
| GET    | /api/requests/{id}      | USER, ADMIN  | 200 / 404                           |
| POST   | /api/requests           | ADMIN        | 201 + Location / 409 / 422          |
| PUT    | /api/requests/{id}      | ADMIN        | 200, полная замена / 404 / 422      |
| PATCH  | /api/requests/{id}      | ADMIN        | 200, частичное изменение / 404 / 422|
| DELETE | /api/requests/{id}      | ADMIN        | 204 / 404                           |
| GET    | /api/users              | ADMIN        | 200, список учетных записей         |
| PATCH  | /api/users/{id}         | ADMIN        | 200, имя, почта, роль, пароль / 404 / 409 / 422 |

Студент: `{"id": 412345, "name": "Анна Смирнова", "group": "P3223", "dormitory": 8, "room": 412,
"moveinDate": "2026-11-01", "country": "Россия", "notes": "..."}`.
Правила проверки те же, что в лаб. 2: `id` (ИСУ) — положительное число и не меняется, имя — минимум два слова,
группа — `P3223`, общежитие и комната — положительные числа, дата заселения — от сегодня до +6 месяцев,
страна — Россия, Беларусь или Китай, заметка — до 500 символов.

PUT заменяет студента целиком (поля, которых нет в теле, становятся `null`).
PATCH работает по JSON Merge Patch (RFC 7396): переданное поле заменяется, `null` очищает поле,
остальные поля не меняются. Принимает `application/json` и `application/merge-patch+json`.

### Список студентов

```
GET /api/requests?group=P3223&group=P3224&dormitory=8&search=анна&sort=-room&page=1&size=20
```

- фильтры `id, name, group, dormitory, room, moveinDate, country, notes` — точное совпадение;
  повтор параметра объединяется через ИЛИ, разные параметры — через И
- `search` — подстрока в имени или группе без учёта регистра
- `sort` — поле сортировки, `-` перед полем — по убыванию (по умолчанию по `id`)
- `page` — с 1, `size` — от 1 до 100 (по умолчанию 20)

Ответ: `{"items": [...], "page": 1, "size": 20, "totalItems": 42, "totalPages": 3}`.
Неизвестный параметр или неверное значение — 400 с описанием в `details`.

QUERY принимает те же параметры в теле:
`{"group": ["P3223", "P3224"], "dormitory": [8], "search": "анна", "sort": "-name", "page": 1, "size": 20}`.

## Авторизация

1. `POST /api/auth/login` с `{"username", "password"}` возвращает
   `{"accessToken", "refreshToken", "tokenType": "Bearer", "expiresIn": 900}`.
2. Защищённые запросы отправляются с заголовком `Authorization: Bearer <accessToken>`.
3. Access-токен живёт 15 минут (`JWT_ACCESS_TTL_MINUTES`). Когда он истёк, клиент вызывает
   `POST /api/auth/refresh` с `{"refreshToken"}` и получает новую пару без ввода пароля.
4. Refresh-токен живёт 7 дней (`JWT_REFRESH_TTL_DAYS`) и одноразовый: его идентификатор (`jti`) хранится
   в таблице `refresh_tokens` и удаляется при обновлении или выходе. Повторное использование — 401.

Роли: `ADMIN` выполняет все операции со студентами, `USER` только читает (список и студент по ИСУ).
Права проверяет `AuthFilter` по аннотациям `@PermitAll` и `@RolesAllowed` на ресурсах:
нет токена или он недействителен — 401, не хватает роли — 403.

## Ошибки

Все ошибки возвращаются в одном формате:

```json
{"status": 422, "error": "Данные не прошли проверку", "details": {"group": "Заглавная латинская буква и четыре цифры, например P3223"}}
```

`details` есть только там, где ошибка относится к конкретным полям.
Коды: 400 — некорректный JSON или параметры, 401 — нет или неверный токен, неверный логин или пароль,
403 — не хватает прав, 404 — нет студента или пути, 405 — метод не поддерживается,
409 — ИСУ, имя пользователя или почта уже заняты, 415 — не JSON, 422 — данные не прошли проверку,
500 — внутренняя ошибка (подробности в логе сервера).

## Postman

Импортируйте `backend/postman/students.postman_collection.json`, в переменных коллекции укажите
`adminUsername` и `adminPassword` из `.env` и запустите коллекцию целиком (Run collection).
Токены сохраняются в переменные автоматически. Папки: Auth (регистрация, вход, обновление токена, выход),
Students (все операции администратора), Roles (что можно и нельзя пользователю с ролью USER),
Users (просмотр и изменение учетных записей администратором).

## Тесты

```
cd backend
mvn test
```

Модульные тесты проверяют бизнес-логику студентов (создание, PATCH, дату заселения, ошибки 404/409/422) и разбор параметров списка.
