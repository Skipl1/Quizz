/**
 * admin-state.js — Глобальные переменные состояния админ-панели
 */

/** @type {Socket} Socket.IO соединение */
const socket = io();

/** @type {string|null} ID текущей выбранной викторины */
let currentQuizId = null;

/** @type {Array} Список всех викторин */
let quizzes = [];

/** @type {string|null} Base64 закодированное изображение вопроса */
let imageBase64 = null;

/** @type {string} Текущий выбранный тип вопроса */
let selectedQuestionType = "multiple_choice";

/** @type {number} Выбранный лимит времени на вопрос (в секундах) */
let selectedTime = 20;

/** @type {number|null} Выбранный вариант для Правда/Ложь (0 или 1) */
let tfSelected = null;

/** @type {string} Ключ для хранения сессии админа в localStorage */
const ADMIN_SESSION_KEY = "quiz_admin_session";
