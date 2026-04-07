# QWEN.md — QUIZZ Project Context

## AI Orchestration
Этот проект управляется группой специализированных субагентов и скиллов, расположенных в директории `.qwen/`. 

- При работе над UI: всегда используй `@frontend-architect.md` и скилл `mobile-first-refactor`.
- При работе с логикой: вызывай `@backend-engineer.md` и используй сервер `postgres-db` для проверки таблиц.
- Перед фиксацией изменений: вызывай `@qa-devops.md` для запуска `web-browser` (Playwright) и проверки адаптивности.

## Project Overview

**QUIZZ** is a real-time multiplayer quiz game platform (similar to Quizizz/Kahoot) built with **Node.js**, **Express**, and **Socket.IO**. It features a PostgreSQL database for persistent storage with a fallback to in-memory mode. The application consists of:

- **Player frontend** (`public/index.html`) — where players join with a name, answer quiz questions in real-time, and see live leaderboard updates.
- **Admin panel** (`public/admin.html`) — where administrators create quizzes, manage questions (multiple types), and control game sessions.
- **Server** (`server.js`) — WebSocket-based game engine handling registration, question distribution, answer validation, scoring, and leaderboard broadcasting.

### Supported Question Types
- **Multiple Choice** (single or multiple correct answers)
- **True/False**
- **Fill in the Blank**
- **Open-Ended**
- **Ordering** (drag-and-drop reordering)
- **Matching** (drag-to-pair questions with answers)

### Key Features
- Real-time communication via Socket.IO
- Player session persistence/recovery (sessionStorage)
- Shuffled question order per player
- Timer per question (default 30s, configurable)
- Score calculation with time-based bonus
- Image support in questions (base64)
- Live leaderboard updates
- Admin authentication (`admin` / `admin123`)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| Real-time | Socket.IO |
| Database | PostgreSQL (via `pg`) |
| Frontend | Vanilla HTML/CSS/JS (no frameworks) |
| Deployment | Render.com |

## Project Structure

```
Quizz/
├── server.js            # Main server (Express + Socket.IO)
├── create-tables.js     # Standalone DB table creation script
├── package.json         # Dependencies and scripts
├── README-DEPLOY.md     # Deployment guide for Render.com
├── .gitignore
├── rere.html            # (Unknown purpose — unused/legacy file)
└── public/
    ├── index.html       # Player frontend
    └── admin.html       # Admin panel frontend
```

## Building and Running

### Prerequisites
- Node.js >= 18.0.0

### Local Development (in-memory mode, no DB)
```bash
npm install
npm start
```
- Players: `http://localhost:3000`
- Admin: `http://localhost:3000/admin.html`

### With PostgreSQL
Set the `DATABASE_URL` environment variable:
```bash
DATABASE_URL="postgresql://user:pass@host:5432/dbname" npm start
```

Or use the hardcoded URL in `server.js` (⚠️ contains exposed credentials — see Security notes).

### Database Schema
```sql
quizzes:
  - id (SERIAL PRIMARY KEY)
  - name (VARCHAR)
  - created_at (TIMESTAMP)

questions:
  - id (SERIAL PRIMARY KEY)
  - quiz_id (INTEGER → quizzes.id)
  - text (TEXT)
  - type (VARCHAR) — multiple_choice, true_false, fill_blank, open_ended, ordering, matching
  - options (JSONB)
  - correct (JSONB) — indices of correct answers
  - image (TEXT) — base64 encoded
  - order_index (INTEGER)
  - time_limit (INTEGER) — seconds per question
  - order_answer (JSONB) — for ordering-type questions
```

Run `node create-tables.js` to manually create/verify tables.

## Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `admin-login` | `{login, password}` | Admin authentication |
| `register` | `string \| {name, savedId}` | Player registration |
| `create-quiz` | `{name}` | Create new quiz |
| `add-question` | `{quizId, text, type, options, correct, image, timeLimit}` | Add question |
| `update-question` | `{quizId, questionIndex, ...}` | Update existing question |
| `delete-question` | `{quizId, questionIndex}` | Remove question |
| `delete-quiz` | `quizId` | Delete entire quiz |
| `select-quiz` | `quizId` | Select quiz for gameplay |
| `start-quiz` | — | Start the selected quiz |
| `restart-quiz` | — | Restart current quiz for all players |
| `submit-answer` | answer data | Submit answer to current question |
| `time-up` | — | Notify server when timer expires |
| `get-next-question` | — | Request next question |
| `get-final-leaderboard` | — | Request final results |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `registered` | `{playerId, name, restored}` | Registration confirmation |
| `quiz-ready` | `{quizId, name, questionsCount}` | Quiz selected, waiting for start |
| `new-question` | `{questionIndex, totalQuestions, text, type, options, image, timeLeft}` | New question for player |
| `update-leaderboard` | `[{name, score, answered, totalQuestions, percentage}]` | Live leaderboard |
| `player-quiz-ended` | `{score, totalQuestions, answeredCount, percentage}` | Player finished |
| `all-players-finished` | `{leaderboard, totalQuestions}` | All players done (admin notification) |
| `quiz-restarted` | `{quizId, name, questionsCount}` | Quiz restarted |
| `quiz-already-started` | — | Cannot join mid-game |

## Security Notes

1. **Hardcoded database credentials** in `server.js` — the `DATABASE_URL` contains a live password. This should be moved to environment variables only.
2. **Default admin credentials** (`admin` / `admin123`) are hardcoded — should be configurable via environment variables.
3. **No rate limiting** on Socket.IO events — vulnerable to abuse.
4. **No input sanitization** on player names or question text.

## Development Conventions

- Frontend is vanilla HTML/CSS/JS with inline styles and scripts (no build step).
- Backend uses `async/await` for database operations.
- All Socket.IO communication is event-based (no REST API).
- CSS uses CSS custom properties for theming (dark purple/violet theme).
- Russian language is used in all UI text and comments.
