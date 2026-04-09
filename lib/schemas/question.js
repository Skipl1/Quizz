/**
 * Zod-схемы для вопросов (add-question, update-question, delete-question).
 */
const { z } = require('zod');
const { hasNoHtmlTags, isSafeText } = require('./sanitize');

/**
 * Допустимые типы вопросов.
 */
const QUESTION_TYPES = [
  'multiple_choice',
  'true_false',
  'fill_blank',
  'open_ended',
  'ordering',
  'matching',
];

/**
 * question — добавление нового вопроса.
 */
const questionSchema = z.object({
  quizId: z.union([z.string(), z.number()])
    .refine(val => val !== undefined && val !== null, 'ID викторины обязателен'),
  text: z.string()
    .min(1, 'Текст вопроса не может быть пустым')
    .max(2000, 'Текст не более 2000 символов')
    .refine(hasNoHtmlTags, 'Текст не должен содержать HTML-теги')
    .refine(isSafeText, 'Текст содержит недопустимые символы'),
  type: z.enum(QUESTION_TYPES, {
    errorMap: () => ({
      message: `Недопустимый тип вопроса. Допустимые: ${QUESTION_TYPES.join(', ')}`,
    }),
  }),
  options: z.array(z.string().max(500, 'Вариант ответа не более 500 символов'))
    .min(2, 'Должно быть минимум 2 варианта ответа'),
  correct: z.union([
    z.array(z.number().int().min(0)),
    z.boolean(), // для matching типа
  ]).refine(val => {
    if (Array.isArray(val)) return val.length >= 1;
    return true;
  }, 'Должен быть указан хотя бы один правильный ответ'),
  image: z.union([z.string().max(5_000_000), z.null()]).optional(),
  timeLimit: z.number()
    .int('Время должно быть целым числом')
    .min(5, 'Минимальное время — 5 секунд')
    .max(300, 'Максимальное время — 300 секунд')
    .default(30),
  answerType: z.enum(['single', 'multiple']).optional(),
  orderAnswer: z.array(z.string()).optional(),
});

/**
 * updateQuestion — обновление существующего вопроса.
 */
const updateQuestionSchema = z.object({
  quizId: z.union([z.string(), z.number()])
    .refine(val => val !== undefined && val !== null, 'ID викторины обязателен'),
  questionIndex: z.number()
    .int('Индекс вопроса должен быть целым числом')
    .min(0, 'Индекс вопроса не может быть отрицательным'),
  text: z.string()
    .min(1, 'Текст вопроса не может быть пустым')
    .max(2000, 'Текст не более 2000 символов')
    .refine(hasNoHtmlTags, 'Текст не должен содержать HTML-теги')
    .refine(isSafeText, 'Текст содержит недопустимые символы')
    .optional(),
  type: z.enum(QUESTION_TYPES).optional(),
  options: z.array(z.string().max(500)).min(2).optional(),
  correct: z.union([
    z.array(z.number().int().min(0)),
    z.boolean(),
  ]).optional(),
  image: z.union([z.string().max(5_000_000), z.null()]).optional(),
  timeLimit: z.number()
    .int('Время должно быть целым числом')
    .min(5, 'Минимальное время — 5 секунд')
    .max(300, 'Максимальное время — 300 секунд')
    .optional(),
  answerType: z.enum(['single', 'multiple']).optional(),
  orderAnswer: z.array(z.string()).optional(),
});

/**
 * deleteQuestion — удаление вопроса.
 */
const deleteQuestionSchema = z.object({
  quizId: z.union([z.string(), z.number()])
    .refine(val => val !== undefined && val !== null, 'ID викторины обязателен'),
  questionIndex: z.number()
    .int('Индекс вопроса должен быть целым числом')
    .min(0, 'Индекс вопроса не может быть отрицательным'),
});

/**
 * TypeScript типы (для будущей миграции на TS)
 */
/** @typedef {z.infer<typeof questionSchema>} QuestionInput */
/** @typedef {z.infer<typeof updateQuestionSchema>} UpdateQuestionInput */
/** @typedef {z.infer<typeof deleteQuestionSchema>} DeleteQuestionInput */

module.exports = {
  questionSchema,
  updateQuestionSchema,
  deleteQuestionSchema,
  QUESTION_TYPES,
};
