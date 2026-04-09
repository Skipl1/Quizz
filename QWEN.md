# QWEN.md — QUIZZ Project Context

## AI Orchestration
Этот проект управляется группой специализированных субагентов и скиллов, расположенных в директории `.qwen/`. 

- При работе над UI: всегда используй `@frontend-architect.md` и скилл `mobile-first-refactor`.
- При работе с логикой: вызывай `@backend-engineer.md` и используй сервер `postgres-db` для проверки таблиц.
- Перед фиксацией изменений: вызывай `@qa-devops.md` для запуска `web-browser` (Playwright) и проверки адаптивности.

## Project Overview

**QUIZZ** — платформа для многопользовательских викторин в реальном времени (аналог Quizizz/Kahoot). Построена на **Next.js** с кастомным сервером **Express + Socket.IO** и базой данных **PostgreSQL**.

### Архитектура

```
┌──────────────────────────────────────────────┐
│  Custom Next.js Server (server.js)           │
│  ├── Next.js App Router (app/)               │
│  ├── Express (статика + rate limiting)       │
│  └── Socket.IO (real-time логика)            │
├──────────────────────────────────────────────┤
│  Frontend                                    │
│  ├── public/index.html  — игрок (legacy)     │
│  ├── public/admin.html  — админ (legacy)     │
│  └── app/layout.js      — Next.js layout      │
├──────────────────────────────────────────────┤
│  Backend (lib/)                              │
│  ├── lib/db.js      — PostgreSQL pool        │
│  └── lib/socket.js  — GameEngine + события   │
└──────────────────────────────────────────────┘
```

### Поддерживаемые типы вопросов
- **Multiple Choice** (один или несколько правильных ответов)
- **True/False** (Правда/Ложь)
- **Fill in the Blank** (Заполнить пробел)
- **Open-Ended** (Открытый ответ)
- **Ordering** (drag-and-drop сортировка)
- **Matching** (drag-to-pair сопоставление)

### Ключевые возможности
- Real-time через Socket.IO
- Восстановление сессии игрока (sessionStorage)
- Перемешивание вопросов для каждого игрока
- Таймер на вопрос (по умолчанию 30с, настраиваемый)
- Подсчёт очков с бонусом за скорость
- Поддержка изображений в вопросах (base64)
- Живая таблица лидеров
- Админ-панель с CRUD для викторин/вопросов
- Аутентификация админа (настраиваемые креды через ENV)

## Tech Stack

| Layer | Технология |
|-------|-----------|
| Backend | Node.js + Next.js (App Router) + Express |
| Real-time | Socket.IO |
| Database | PostgreSQL (via `pg`) |
| Frontend | Vanilla HTML/CSS/JS (public/) + React (app/) |
| Styling | CSS Custom Properties (dark purple/violet theme) |
| Deployment | Render.com |

## Project Structure

```
Quizz/
├── server.js            # Кастомный сервер (Next.js + Express + Socket.IO)
├── create-tables.js     # Скрипт создания таблиц в БД
├── next.config.js       # Next.js конфигурация
├── package.json         # Зависимости и скрипты
├── README-DEPLOY.md     # Руководство по деплою на Render.com
├── .env.example         # Шаблон переменных окружения
├── .gitignore
├── .qwen/               # AI агент-конфигурация
├── app/                 # Next.js App Router
│   ├── layout.js        # Root layout
│   ├── admin/           # Admin pages (пусто — в разработке)
│   └── api/quiz/        # API routes (пусто — в разработке)
├── components/          # React components (пусто — в разработке)
├── lib/                 # Shared backend modules
│   ├── db.js            # PostgreSQL pool + загрузка викторин
│   └── socket.js        # GameEngine класс + все Socket.IO события
├── public/              # Статические файлы (legacy frontend)
│   ├── index.html       # Игрок (vanilla JS)
│   └── admin.html       # Админ-панель (vanilla JS)
└── styles/
    └── globals.css      # Глобальные стили + CSS переменные
```

## Building and Running

### Prerequisites
- Node.js >= 18.0.0

### Local Development (in-memory mode, без БД)
```bash
npm install
npm run dev        # или npm start
```
- Игроки: `http://localhost:3000`
- Админ: `http://localhost:3000/admin` или `http://localhost:3000/admin.html`

### С PostgreSQL
```bash
# Скопируйте .env.example в .env и укажите реальные значения
cp .env.example .env
npm run dev
```

### Создание/проверка таблиц
```bash
npm run db:create-tables
```

### Available Scripts
| Script | Описание |
|--------|----------|
| `npm run dev` | Запуск dev-сервера (node server.js) |
| `npm run build` | Next.js production build |
| `npm start` | Production режим (NODE_ENV=production node server.js) |
| `npm run db:create-tables` | Создание таблиц в БД |

## Database Schema

```sql
quizzes:
  - id (SERIAL PRIMARY KEY)
  - name (VARCHAR)
  - created_at (TIMESTAMP)

questions:
  - id (SERIAL PRIMARY KEY)
  - quiz_id (INTEGER → quizzes.id ON DELETE CASCADE)
  - text (TEXT)
  - type (VARCHAR) — multiple_choice, true_false, fill_blank, open_ended, ordering, matching
  - options (JSONB)
  - correct (JSONB) — индексы правильных ответов
  - image (TEXT) — base64 encoded
  - order_index (INTEGER)
  - time_limit (INTEGER) — секунды на вопрос
  - order_answer (JSONB) — для типа ordering
```

## Socket.IO Events

### Client → Server
| Event | Payload | Описание |
|-------|---------|----------|
| `admin-login` | `{login, password}` | Аутентификация админа |
| `register` | `string \| {name, savedId}` | Регистрация игрока |
| `create-quiz` | `{name}` | Создать викторину |
| `add-question` | `{quizId, text, type, options, correct, image, timeLimit}` | Добавить вопрос |
| `update-question` | `{quizId, questionIndex, ...}` | Обновить вопрос |
| `delete-question` | `{quizId, questionIndex}` | Удалить вопрос |
| `delete-quiz` | `quizId` | Удалить викторину |
| `select-quiz` | `quizId` | Выбрать викторину для игры |
| `start-quiz` | — | Начать викторину |
| `restart-quiz` | — | Перезапустить для всех |
| `submit-answer` | answer data | Отправить ответ |
| `time-up` | — | Таймер истёк |
| `get-next-question` | — | Запросить следующий вопрос |
| `get-final-leaderboard` | — | Запросить финальные результаты |
| `get-quizzes` | — | Получить список викторин (админ) |
| `get-quiz-questions` | `quizId` | Получить вопросы викторины |

### Server → Client
| Event | Payload | Описание |
|-------|---------|----------|
| `registered` | `{playerId, name, restored}` | Подтверждение регистрации |
| `quiz-ready` | `{quizId, name, questionsCount}` | Викторина выбрана, ждём старта |
| `new-question` | `{questionIndex, totalQuestions, text, type, options, image, timeLeft}` | Новый вопрос |
| `update-leaderboard` | `[{name, score, answered, totalQuestions, percentage}]` | Живая таблица лидеров |
| `player-quiz-ended` | `{score, totalQuestions, answeredCount, percentage}` | Игрок завершил |
| `all-players-finished` | `{leaderboard, totalQuestions}` | Все игроки завершили |
| `quiz-restarted` | `{quizId, name, questionsCount}` | Викторина перезапущена |
| `quiz-already-started` | — | Нельзя войти mid-game |
| `quiz-created` | `{id, name}` | Викторина создана |
| `question-added` | `{quizId, questionIndex}` | Вопрос добавлен |
| `quizzes-list` | `[{id, name, questionsCount}]` | Список викторин |
| `quiz-updated` | `{quizId, questions}` | Викторина обновлена |
| `quiz-questions` | `{quizId, questions}` | Вопросы викторины |

## Environment Variables

| Variable | Описание | Default |
|----------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `null` (RAM mode) |
| `ADMIN_LOGIN` | Логин админа | `admin` |
| `ADMIN_PASSWORD` | Пароль админа | `CHANGE_ME_set_in_env` |
| `PORT` | Порт сервера | `3000` |
| `NODE_ENV` | Окружение | `development` |
| `SOCKET_RATE_WINDOW_MS` | Окно rate limiting (мс) | `10000` |
| `SOCKET_RATE_MAX_EVENTS` | Макс. событий за окно | `30` |

## Security Notes

1. **Rate limiting** — реализовано как для HTTP (express-rate-limit), так и для Socket.IO событий.
2. **Input sanitization** — функция `sanitizeInput()` в `lib/socket.js` экранирует HTML-символы.
3. **ENV credentials** — админские креды и DATABASE_URL вынесены в `.env`.
4. ⚠️ **Legacy HTML файлы** в `public/` могут содержать захардкоженные креды — проверить `admin.html`.
5. ⚠️ **Next.js app/ директория** — страницы `app/admin/` и `app/api/quiz/` пока пусты, основная логика работает через Socket.IO и legacy HTML.

## Development Conventions

- **Backend**: `async/await` для DB-операций, event-driven Socket.IO.
- **Frontend (legacy)**: Vanilla HTML/CSS/JS, inline стили и скрипты.
- **Frontend (Next.js)**: App Router, React — директории `app/` и `components/` в процессе миграции.
- **Стилизация**: CSS custom properties → Tailwind CSS (в процессе миграции).
- **Язык UI**: Русский во всех интерфейсах и комментариях.
- **Тестирование**: Playwright E2E (в процессе настройки).

## 🚀 Migration Status (2026-04-09)

Проект находится в процессе **миграции на Next.js + React + Tailwind CSS**.

### Агентская система настроена:
| Агент | Файл | Роль |
|-------|------|------|
| `backend-engineer` | `.qwen/agents/backend-engineer.md` | API Routes, Socket.IO refactor, БД, security |
| `frontend-architect` | `.qwen/agents/frontend-architect.md` | React компоненты, Tailwind, mobile-first |
| `qa-devops` | `.qwen/agents/qa-devops.md` | Playwright E2E, Render проверка, аудит |

### Скиллы настроены:
| Скилл | Файл | Применение |
|-------|------|------------|
| `mobile-first-refactor` | `.qwen/skills/mobile-first-refactor.md` | Legacy HTML → Tailwind React компоненты |
| `schema-validation` | `.qwen/skills/schema-validation.md` | Zod валидация API + Socket.IO |
| `socket-state-sync` | `.qwen/skills/socket-state-sync.md` | Socket.IO → React Context + Hooks |

### Orchestrator:
- `.qwen/MIGRATION-ORCHESTRATOR.md` — полный пофазный план миграции (7 фаз)
- `.qwen/QA-CRITICAL-PATHS.md` — QA чеклисты + статус тестов

### Render PostgreSQL:
- **Подключён**: `DATABASE_URL` в `.env` указывает на Render Frankfurt
- **Проверка**: `npm run db:create-tables` перед каждым запуском
- **Порт**: `3003` (локальная разработка)
