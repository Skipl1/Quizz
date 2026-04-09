# QUIZZ Migration Orchestrator

## 🎯 Цель
Полная миграция проекта QUIZZ с **legacy HTML/vanilla JS** (`public/index.html`, `public/admin.html`) на **Next.js App Router + React + Tailwind CSS** с сохранением real-time функциональности через Socket.IO и деплоем на Render.

---

## 📋 Поэтапный план миграции

### Фаза 0: Подготовка (Backend-Engineer)
**Ответственный:** `backend-engineer`
**Скиллы:** `schema-validation`
**Статус:** ✅ ЗАВЕРШЕНО — 2026-04-09

- [x] Установить `zod` для валидации
- [x] Создать `lib/schemas/` с Zod-схемами для всех событий
  - `player.js` — registerSchema, submitAnswerSchema, timeUpSchema
  - `quiz.js` — createQuizSchema, updateQuizSchema, selectQuizSchema, deleteQuizSchema
  - `question.js` — questionSchema, updateQuestionSchema, deleteQuestionSchema, QUESTION_TYPES
  - `auth.js` — adminLoginSchema
  - `sanitize.js` — sanitizeInput, hasNoHtmlTags, isSafeText
  - `index.js` — barrel export всех схем
- [x] Проверить подключение к Render PostgreSQL (`npm run db:create-tables`) — 4 викторины, 18 вопросов
- [x] Убедиться что `.env` содержит правильные переменные
- [x] Рефакторинг `lib/socket.js`: добавить Zod-валидацию в каждый обработчик:
  - admin-login → adminLoginSchema
  - register → registerSchema
  - submit-answer → submitAnswerSchema
  - time-up → timeUpSchema
  - create-quiz → createQuizSchema
  - add-question → questionSchema
  - update-question → updateQuestionSchema
  - delete-question → deleteQuestionSchema
  - delete-quiz → deleteQuizSchema
  - select-quiz → selectQuizSchema
  - get-quiz-questions → selectQuizSchema
  - Добавлена validatePayload() helper функция
  - При ошибке валидации: socket.emit('error', {code, message, details})
- [x] Передать результат `frontend-architect`

### Фаза 1: Инфраструктура React (Frontend-Architect)
**Ответственный:** `frontend-architect`
**Скиллы:** `mobile-first-refactor`, `socket-state-sync`

- [ ] Установить Tailwind CSS, настроить `tailwind.config.js`, `postcss.config.js`
- [ ] Обновить `app/layout.js`: добавить meta viewport, подключить Tailwind
- [ ] Создать `components/providers/SocketProvider.jsx` (React Context для Socket.IO)
- [ ] Создать `lib/hooks/useQuizSocket.js` (главный хук)
- [ ] Создать `lib/hooks/useTimer.js` (хук таймера)
- [ ] Создать `components/shared/` базовые компоненты (Button, Card, Input)
- [ ] Передать результат `backend-engineer` для API Routes

### Фаза 2: Player Flow (Frontend-Architect)
**Ответственный:** `frontend-architect`
**Скиллы:** `mobile-first-refactor`, `socket-state-sync`

- [ ] `components/player/JoinScreen.jsx` — регистрация игрока
- [ ] `components/player/WaitingScreen.jsx` — ожидание старта
- [ ] `components/player/GameScreen.jsx` — вопрос + ответы (все 6 типов)
- [ ] `components/player/Timer.jsx` — компонент таймера с анимацией
- [ ] `components/player/ResultsScreen.jsx` — финальные результаты
- [ ] `components/shared/ConnectionStatus.jsx` — индикатор соединения
- [ ] `app/page.js` — главная страница (player entry point)
- [ ] Протестировать: регистрация → ожидание → игра → результаты
- [ ] Передать результат `qa-devops`

### Фаза 3: QA — Player Flow (QA-DevOps)
**Ответственный:** `qa-devops`
**Скиллы:** нет (стандартные инструменты)

- [ ] Настроить Playwright с iPhone 14 эмуляцией
- [ ] Написать E2E тесты для Player Join Flow (TC-1 — TC-5)
- [ ] Запустить тесты, зафиксировать проблемы
- [ ] Проверить подключение к Render PostgreSQL
- [ ] Если P0 тесты проходят → передать `frontend-architect` для Admin Flow
- [ ] Если P0 тесты падают → вернуть `frontend-architect` с отчётом

### Фаза 4: Admin Flow (Frontend-Architect)
**Ответственный:** `frontend-architect`
**Скиллы:** `mobile-first-refactor`, `socket-state-sync`

- [ ] `components/admin/AdminLogin.jsx` — авторизация
- [ ] `components/admin/QuizList.jsx` — список викторин
- [ ] `components/admin/QuizEditor.jsx` — CRUD викторин
- [ ] `components/admin/QuestionEditor.jsx` — редактор вопросов (6 типов)
- [ ] `components/admin/LiveLeaderboard.jsx` — live таблица лидеров
- [ ] `app/admin/page.js` — страница админки
- [ ] Протестировать: логин → создание квиза → вопросы → старт
- [ ] Передать результат `backend-engineer` для API Routes

### Фаза 5: API Routes (Backend-Engineer)
**Ответственный:** `backend-engineer`
**Скиллы:** `schema-validation`

- [ ] `app/api/quizzes/route.js` — GET/POST викторин
- [ ] `app/api/quizzes/[id]/route.js` — GET/PUT/DELETE конкретной викторины
- [ ] `app/api/questions/route.js` — POST вопросов
- [ ] `app/api/questions/[id]/route.js` — GET/PUT/DELETE конкретного вопроса
- [ ] Все routes используют Zod-схемы из `lib/schemas/`
- [ ] Socket.IO остаётся для real-time, HTTP API — для CRUD
- [ ] Протестировать: CRUD через curl/Postman → данные в БД
- [ ] Передать результат `qa-devops`

### Фаза 6: QA — Admin Flow + Full Integration (QA-DevOps)
**Ответственный:** `qa-devops`

- [ ] E2E тесты для Admin Control Flow (TC-6 — TC-10)
- [ ] Integration тесты: Player + Admin одновременно
- [ ] Проверка сохранения данных в Render PostgreSQL после рестарта
- [ ] Проверка rate limiting (TC-11)
- [ ] Проверка XSS защиты (TC-12)
- [ ] Проверка mobile-first на всех 3 viewport
- [ ] Если все тесты проходят → Фаза 7
- [ ] Если тесты падают → вернуть ответственному агенту

### Фаза 7: Polish & Cleanup (Все агенты)
**Ответственные:** `backend-engineer` + `frontend-architect` + `qa-devops`

- [ ] Удалить `public/index.html` и `public/admin.html` (legacy файлы)
- [ ] Удалить мёртвый код (`get-next-question` handler, `quiz-updated` emit)
- [ ] Заменить `console.log` на structured logger (pino/winston)
- [ ] Убедиться что `npm run build` проходит без ошибок
- [ ] Финальный `npm audit` — 0 vulnerabilities
- [ ] Деплой на Render, проверка всех endpoint
- [ ] Обновить `QA-CRITICAL-PATHS.md` — статус "READY FOR PRODUCTION"

---

## 🔄 Порядок работы агентов

```
┌─────────────────────┐
│  backend-engineer   │  Фаза 0: Подготовка схем и БД
└─────────┬───────────┘
          ↓
┌─────────────────────┐
│ frontend-architect  │  Фаза 1-2: Player Flow (React)
└─────────┬───────────┘
          ↓
┌─────────────────────┐
│    qa-devops        │  Фаза 3: Тесты Player Flow
└─────────┬───────────┘
          ↓
┌─────────────────────┐
│ frontend-architect  │  Фаза 4: Admin Flow (React)
└─────────┬───────────┘
          ↓
┌─────────────────────┐
│  backend-engineer   │  Фаза 5: API Routes
└─────────┬───────────┘
          ↓
┌─────────────────────┐
│    qa-devops        │  Фаза 6: Full Integration Tests
└─────────┬───────────┘
          ↓
┌─────────────────────┐
│    ALL AGENTS       │  Фаза 7: Polish + Deploy
└─────────────────────┘
```

---

## 🛠 Правила координации

### Для всех агентов:
1. **ВСЕГДА** читай этот файл перед началом работы — чтобы понимать текущую фазу
2. **ВСЕГДА** читай `QWEN.md` — общий контекст проекта
3. **ВСЕГДА** обновляй статус задач в этом файле (отмечай [x] выполненные)
4. **ВСЕГДА** проверяй Render PostgreSQL перед началом работы (`npm run db:create-tables`)
5. **НИКОГДА** не работай в изоляции — сообщай следующему агенту о завершении
6. **ЕСЛИ** задача блокируется — создай issue с описанием проблемы

### Backend-Engineer → Frontend-Architect:
- Сообщай когда Zod-схемы готовы — фронтенд использует типы из схем
- Сообщай когда API Routes готовы — фронтенд может тестировать CRUD
- Документируй формат всех Socket.IO событий

### Frontend-Architect → QA-DevOps:
- Сообщай когда компонент готов — QA пишет тесты
- Указывай URL и selector'ы для E2E тестов
- Фиксируй известные баги перед передачей

### QA-DevOps → Все агенты:
- При падении P0 теста — сразу возвращай ответственному агенту
- Веди отчёт в `QA-CRITICAL-PATHS.md`
- Перед деплоем — запускай полный чеклист

---

## 📊 Статус миграции

| Фаза | Статус | Ответственный | Дата начала | Дата завершения |
|------|--------|---------------|-------------|-----------------|
| 0. Подготовка | ✅ COMPLETED | backend-engineer | 2026-04-09 | 2026-04-09 |
| 1. Инфраструктура React | ⏳ PENDING | frontend-architect | — | — |
| 2. Player Flow | ⏳ PENDING | frontend-architect | — | — |
| 3. QA — Player Flow | ⏳ PENDING | qa-devops | — | — |
| 4. Admin Flow | ⏳ PENDING | frontend-architect | — | — |
| 5. API Routes | ⏳ PENDING | backend-engineer | — | — |
| 6. QA — Integration | ⏳ PENDING | qa-devops | — | — |
| 7. Polish + Deploy | ⏳ PENDING | ALL | — | — |

---

## ⚠️ Критические注意事項

1. **Render PostgreSQL** — ВСЕГДА проверяй подключение перед работой. БД может "спать" на free tier — подожди 30-60с при таймауте.
2. **Legacy HTML** — НЕ удаляй `public/index.html` и `public/admin.html` до Фазы 7. Они нужны как fallback.
3. **Socket.IO** — НЕ меняй формат событий без согласования с frontend-architect.
4. ** `.env`** — НИКОГДА не коммить. Render использует Environment Variables из Dashboard.
5. **Build** — `npm run build` ДОЛЖЕН проходить перед каждым деплоем.

---

*Создано: 2026-04-09*
*Последнее обновление: 2026-04-09*
