---
name: schema-validation
description: Автоматическая генерация схем валидации через Zod для защиты серверных эндпоинтов, API routes и Socket.IO событий.
---

# Schema-Based Validation Skill

## Контекст
Проект QUIZZ мигрирует на **Next.js API Routes + Socket.IO**. Все входящие данные должны валидироваться через Zod-схемы.

## Setup

### Установка
```bash
npm install zod
```

### Структура схем
Создай директорию `lib/schemas/` с файлами:
- `lib/schemas/quiz.js` — схемы для викторин
- `lib/schemas/question.js` — схемы для вопросов
- `lib/schemas/player.js` — схемы для игроков
- `lib/schemas/auth.js` — схемы для авторизации

## Инструкции

### 1. Zod Schemas для API Routes (Next.js)

Каждый API endpoint использует Zod для валидации request body:

```js
// lib/schemas/quiz.js
import { z } from 'zod';

export const createQuizSchema = z.object({
  name: z.string()
    .min(1, 'Название не может быть пустым')
    .max(50, 'Название не более 50 символов')
    .regex(/^[a-zA-Zа-яА-ЯёЁ0-9\s\-_]+$/, 'Название содержит недопустимые символы'),
});

export const updateQuizSchema = z.object({
  id: z.string().or(z.number()),
  name: z.string().min(1).max(50),
});
```

**Использование в Route Handler:**
```js
// app/api/quizzes/route.js
import { createQuizSchema } from '@/lib/schemas/quiz';

export async function POST(request) {
  const body = await request.json();
  const parsed = createQuizSchema.safeParse(body);
  
  if (!parsed.success) {
    return Response.json({ 
      success: false, 
      error: 'invalid-payload', 
      details: parsed.error.flatten() 
    }, { status: 400 });
  }
  
  // ... бизнес-логика с parsed.data
}
```

### 2. Zod Schemas для Socket.IO Events

Валидация пакетов в `lib/socket.js`:

```js
// lib/schemas/player.js
import { z } from 'zod';

export const registerSchema = z.union([
  z.string().min(1).max(50),
  z.object({
    name: z.string().min(1).max(50),
    savedId: z.string().optional(),
  }),
]);

export const submitAnswerSchema = z.union([
  z.number(), // single choice index
  z.array(z.number()), // multiple choice indices
  z.object({
    type: z.enum(['text', 'ordering', 'matching']),
    answer: z.union([z.string(), z.array(z.string()), z.array(z.number())]),
  }),
]);
```

**Использование в Socket.IO обработчике:**
```js
socket.on('register', (data) => {
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    socket.emit('error', { code: 'invalid-payload', message: 'Некорректные данные' });
    return;
  }
  // ... обработка parsed.data
});
```

### 3. Input Sanitization (XSS Protection)

**ВСЕГДА** комбинируй Zod с санитизацией:

```js
import { z } from 'zod';

function sanitize(str, maxLen = 500) {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .slice(0, maxLen)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Zod refine для кастомной валидации
export const questionSchema = z.object({
  text: z.string()
    .min(1, 'Текст вопроса не может быть пустым')
    .max(2000, 'Текст не более 2000 символов')
    .refine(val => val === sanitize(val), 'Текст содержит недопустимые символы'),
  type: z.enum(['multiple_choice', 'true_false', 'fill_blank', 'open_ended', 'ordering', 'matching']),
  options: z.array(z.string().max(500)).min(2),
  correct: z.array(z.number()).min(1),
  timeLimit: z.number().int().min(5).max(300).default(30),
  image: z.string().nullable().optional(),
});
```

### 4. TypeScript Types из Zod схем

Генерируй TS типы для использования на фронте и бэке:

```js
// Из схемы Zod → TypeScript type
export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AnswerInput = z.infer<typeof submitAnswerSchema>;
```

### 5. Стандартизированные ошибки

Все API endpoints и Socket.IO обработчики возвращают ошибки в едином формате:

```js
// Успех
{ success: true, data: { ... } }

// Ошибка валидации
{ success: false, error: 'invalid-payload', details: { fieldErrors: { name: ['...'] } } }

// Ошибка авторизации
{ success: false, error: 'unauthorized', message: 'Неверный логин или пароль' }

// Ошибка сервера
{ success: false, error: 'internal-error', message: 'Внутренняя ошибка сервера' }
```

## Примеры применения

**Пример 1:** "Создай схему валидации для `submit-answer`, проверяя что ID вопроса — число, а ответ не пуст."

```js
export const submitAnswerSchema = z.object({
  questionIndex: z.number().int().min(0),
  answer: z.union([
    z.number().int().min(0),
    z.array(z.number().int().min(0)).min(1),
    z.object({
      type: z.enum(['text', 'ordering', 'matching']),
      answer: z.union([
        z.string().min(1).max(500),
        z.array(z.string().min(1).max(500)),
      ]),
    }),
  ]),
});
```

**Пример 2:** "Защити создание квиза: имя не длиннее 50 символов, без HTML."

```js
export const createQuizSchema = z.object({
  name: z.string()
    .min(1)
    .max(50)
    .refine(val => !/[<>]/.test(val), 'Название не должно содержать HTML-теги'),
});
```

## Checklist перед мержем

- [ ] Все API routes используют Zod схемы
- [ ] Все Socket.IO обработчики валидируют входящие данные
- [ ] Текстовые поля проходят XSS санитизацию
- [ ] Схемы экспортируют TypeScript типы (`z.infer`)
- [ ] Ошибки возвращаются в стандартизированном формате
- [ ] Нет прямого доступа к `request.body` или `data` без валидации
