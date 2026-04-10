/**
 * Index State — глобальные переменные и утилиты UI
 */

// Глобальное состояние
let playerName = "";
let playerScore = 0;
let hasAnswered = false;
let timerInterval = null;
let currentQuestionType = "multiple_choice";
const QUESTION_TIME = 30;
const STORAGE_KEY = "quiz_player_session";
const FALLBACK_KEY = "quiz_player_session_fallback";

/**
 * Получить данные сессии (с fallback на localStorage)
 * @returns {object|null}
 */
function getSessionData() {
  // Сначала пробуем sessionStorage
  let saved = sessionStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }
  // Fallback на localStorage
  saved = localStorage.getItem(FALLBACK_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      localStorage.removeItem(FALLBACK_KEY);
    }
  }
  return null;
}

/**
 * Сохранить данные сессии (в оба хранилища)
 * @param {object} data
 */
function saveSession(data) {
  const json = JSON.stringify(data);
  sessionStorage.setItem(STORAGE_KEY, json);
  localStorage.setItem(FALLBACK_KEY, json);
}

/**
 * Очистить данные сессии
 */
function clearSession() {
  sessionStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(FALLBACK_KEY);
}

// Переменные для хранения выбора пользователя
let selectedMCIndex = null;
let selectedTFIndex = null;

// Ordering state
let orderingItems = [];
let orderingDragSrcEl = null;

// Matching state
let matchingDragged = null;
let matchingDraggedFromDropzone = null;
let matchingMatches = 0;
let matchingTotal = 0;
let matchingUserPairs = [];

/**
 * Переключение экрана
 * @param {string} id - ID экрана
 */
function showScreen(id) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/**
 * Блокировка всех полей ввода
 */
function disableAllInputs() {
  document
    .querySelectorAll(".option-btn, .tf-btn, .text-answer-input, .submit-answer-btn, .ordering-item, .matching-item")
    .forEach((el) => {
      el.disabled = true;
      el.draggable = false;
    });
}

/**
 * Разблокировка всех полей ввода
 */
function enableAllInputs() {
  document
    .querySelectorAll(".option-btn, .tf-btn, .text-answer-input, .submit-answer-btn")
    .forEach((el) => {
      el.disabled = false;
    });
  document
    .querySelectorAll(".ordering-item, .matching-item")
    .forEach((el) => {
      el.draggable = true;
    });
}
