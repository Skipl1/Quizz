/**
 * Zod-схемы для событий игроков (register, submit-answer, time-up).
 * Используется в lib/socket.js для валидации Socket.IO пакетов.
 */
const { z } = require('zod');
const { hasNoHtmlTags, isSafeText } = require('./sanitize');

/**
 * register — имя игрока или объект{name, savedId?}
 * Клиент может отправить просто строку или объект.
 */
const registerSchema = z.union([
  z.string()
    .min(1, 'Имя не может быть пустым')
    .max(50, 'Имя не более 50 символов')
    .refine(hasNoHtmlTags, 'Имя не должно содержать HTML-теги')
    .refine(isSafeText, 'Имя содержит недопустимые символы'),
  z.object({
    name: z.string()
      .min(1, 'Имя не может быть пустым')
      .max(50, 'Имя не более 50 символов')
      .refine(hasNoHtmlTags, 'Имя не должно содержать HTML-теги')
      .refine(isSafeText, 'Имя содержит недопустимые символы'),
    savedId: z.string().optional(),
  }),
]);

/**
 * submitAnswer — ответ на вопрос.
 * Форматы:
 *   - number (single choice индекс)
 *   - number[] (multiple choice индексы)
 *   - object{type: 'text'|'ordering'|'matching', answer: ...}
 */
const submitAnswerSchema = z.union([
  z.number().int().min(0, 'Индекс ответа не может быть отрицательным'),
  z.array(z.number().int().min(0, 'Индекс ответа не может быть отрицательным'))
    .min(1, 'Должен быть выбран хотя бы один вариант'),
  z.object({
    type: z.enum(['text', 'ordering', 'matching'], {
      errorMap: () => ({ message: 'Недопустимый тип ответа. Допустимые: text, ordering, matching' }),
    }),
    answer: z.union([
      z.string()
        .min(1, 'Ответ не может быть пустым')
        .max(500, 'Ответ не более 500 символов')
        .refine(hasNoHtmlTags, 'Ответ не должен содержать HTML-теги'),
      z.array(z.string().max(500)),
      z.array(z.number().int()),
    ]),
  }),
]);

/**
 * timeUp — уведомление что время вышло.
 * Может прийти как пустой объект, null, или undefined.
 */
const timeUpSchema = z.any().refine(
  (val) => val === undefined || val === null || typeof val === 'object',
  'Некорректный формат time-up'
);

/**
 * TypeScript типы (для будущей миграции на TS)
 */
/** @typedef {z.infer<typeof registerSchema>} RegisterInput */
/** @typedef {z.infer<typeof submitAnswerSchema>} SubmitAnswerInput */
/** @typedef {z.infer<typeof timeUpSchema>} TimeUpInput */

module.exports = {
  registerSchema,
  submitAnswerSchema,
  timeUpSchema,
};
