# 🚀 Quick Start — QUIZZ Migration

## Как начать работу

### 1. Запуск сервера (локальная разработка)
```bash
cd /home/lcatharsis/Quizz
npm install          # если ещё не установлен
npm run dev          # или npm start
```

Сервер запустится на порту **3003**:
- 👤 Игроки: `http://localhost:3003`
- 🔧 Админ: `http://localhost:3003/admin`

### 2. Проверка БД
```bash
npm run db:create-tables
```
Подключается к **Render PostgreSQL** (Frankfurt). Если таймаут — подожди 30-60с (БД "спит" на free tier).

---

## Как использовать агентов

### Запуск backend-задачи
```
Вызови: backend-engineer
Описание: "Создай API route для GET /api/quizzes с Zod валидацией"
```

### Запуск frontend-задачи
```
Вызови: frontend-architect  
Описание: "Создай React компонент JoinScreen с mobile-first Tailwind"
```

### Запуск QA-задачи
```
Вызови: qa-devops
Описание: "Напиши Playwright E2E тест для Player Join Flow"
```

### Использование скиллов
```
skill: mobile-first-refactor   — при переделке верстки в Tailwind
skill: schema-validation       — при создании Zod схем
skill: socket-state-sync       — при создании React Socket.IO хуков
```

---

## Файловая навигация

| Что нужно | Файл |
|-----------|------|
| Общий контекст проекта | `QWEN.md` |
| Пофазный план миграции | `.qwen/MIGRATION-ORCHESTRATOR.md` |
| QA чеклисты и баги | `.qwen/QA-CRITICAL-PATHS.md` |
| Backend агент | `.qwen/agents/backend-engineer.md` |
| Frontend агент | `.qwen/agents/frontend-architect.md` |
| QA агент | `.qwen/agents/qa-devops.md` |
| Mobile-first скилл | `.qwen/skills/mobile-first-refactor.md` |
| Zod validation скилл | `.qwen/skills/schema-validation.md` |
| Socket.IO React скилл | `.qwen/skills/socket-state-sync.md` |
| Конфигурация Qwen | `.qwen/settings.json` |
| Переменные окружения | `.env` (НЕ КОММИТЬ!) |

---

## Текущий статус миграции

| Фаза | Статус |
|------|--------|
| 0. Подготовка | ⏳ PENDING |
| 1. Инфраструктура React | ⏳ PENDING |
| 2. Player Flow | ⏳ PENDING |
| 3. QA — Player Flow | ⏳ PENDING |
| 4. Admin Flow | ⏳ PENDING |
| 5. API Routes | ⏳ PENDING |
| 6. QA — Integration | ⏳ PENDING |
| 7. Polish + Deploy | ⏳ PENDING |

**Для начала миграции:** запусти Фазу 0 через `backend-engineer` агента.

---

## Команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск dev-сервера |
| `npm start` | Production режим |
| `npm run build` | Next.js build |
| `npm run db:create-tables` | Проверка/создание таблиц БД |
| `npm audit` | Проверка уязвимостей |
