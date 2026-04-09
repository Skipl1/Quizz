/**
 * Zod-схемы для викторин (create-quiz, select-quiz, delete-quiz).
 */
const { z } = require('zod');
const { hasNoHtmlTags, isSafeText } = require('./sanitize');

/**
 * createQuiz — создание новой викторины.
 */
const createQuizSchema = z.object({
  name: z.string()
    .min(1, 'Название не может быть пустым')
    .max(50, 'Название не более 50 символов')
    .refine(hasNoHtmlTags, 'Название не должно содержать HTML-теги')
    .refine(isSafeText, 'Название содержит недопустимые символы'),
});

/**
 * updateQuiz — обновление названия викторины.
 */
const updateQuizSchema = z.object({
  id: z.union([z.string(), z.number()])
    .refine(val => val !== undefined && val !== null, 'ID викторины обязателен'),
  name: z.string()
    .min(1, 'Название не может быть пустым')
    .max(50, 'Название не более 50 символов')
    .refine(hasNoHtmlTags, 'Название не должно содержать HTML-теги')
    .refine(isSafeText, 'Название содержит недопустимые символы'),
});

/**
 * selectQuiz — выбор викторины для игры.
 */
const selectQuizSchema = z.union([
  z.string().min(1, 'ID викторины не может быть пустым'),
  z.number(),
  z.object({
    quizId: z.union([z.string(), z.number()])
      .refine(val => val !== undefined && val !== null, 'ID викторины обязателен'),
  }),
]);

/**
 * deleteQuiz — удаление викторины.
 */
const deleteQuizSchema = z.union([
  z.string().min(1, 'ID викторины не может быть пустым'),
  z.number(),
]);

/**
 * TypeScript типы (для будущей миграции на TS)
 */
/** @typedef {z.infer<typeof createQuizSchema>} CreateQuizInput */
/** @typedef {z.infer<typeof updateQuizSchema>} UpdateQuizInput */
/** @typedef {z.infer<typeof selectQuizSchema>} SelectQuizInput */
/** @typedef {z.infer<typeof deleteQuizSchema>} DeleteQuizInput */

module.exports = {
  createQuizSchema,
  updateQuizSchema,
  selectQuizSchema,
  deleteQuizSchema,
};
