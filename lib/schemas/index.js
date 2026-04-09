/**
 * Barrel export всех Zod-схем QUIZZ.
 *
 * Использование:
 *   const { registerSchema, questionSchema, adminLoginSchema } = require('@/lib/schemas');
 */

// Схемы игроков
const {
  registerSchema,
  submitAnswerSchema,
  timeUpSchema,
} = require('./player');

// Схемы викторин
const {
  createQuizSchema,
  updateQuizSchema,
  selectQuizSchema,
  deleteQuizSchema,
} = require('./quiz');

// Схемы вопросов
const {
  questionSchema,
  updateQuestionSchema,
  deleteQuestionSchema,
  QUESTION_TYPES,
} = require('./question');

// Схемы авторизации
const {
  adminLoginSchema,
} = require('./auth');

// Утилиты санитизации
const {
  sanitizeInput,
  hasNoHtmlTags,
  isSafeText,
} = require('./sanitize');

module.exports = {
  // Игроки
  registerSchema,
  submitAnswerSchema,
  timeUpSchema,
  // Викторины
  createQuizSchema,
  updateQuizSchema,
  selectQuizSchema,
  deleteQuizSchema,
  // Вопросы
  questionSchema,
  updateQuestionSchema,
  deleteQuestionSchema,
  QUESTION_TYPES,
  // Авторизация
  adminLoginSchema,
  // Утилиты
  sanitizeInput,
  hasNoHtmlTags,
  isSafeText,
};
