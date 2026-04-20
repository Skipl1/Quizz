/**
 * admin-tabs.js — Управление вкладками и навигацией
 */

/**
 * Переключает видимую вкладку в админ-панели.
 * @param {string} tabName - Имя вкладки (quizzes, play, results, leaderboard)
 * @param {MouseEvent} [ev] - событие клика (если вызов из onclick)
 */
function showTab(tabName, ev) {
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  const target =
    ev && ev.target && typeof ev.target.closest === "function"
      ? ev.target.closest(".tab")
      : document.querySelector(`.tab[data-tab="${tabName}"]`);
  if (target) target.classList.add("active");
  const screen = document.getElementById(tabName + "-tab");
  if (screen) screen.classList.add("active");
  if (tabName === "results") {
    if (typeof loadResultsOverview === "function") {
      loadResultsOverview();
    } else if (typeof loadQuizResults === "function") {
      loadQuizResults();
    }
  }
}

/**
 * Открывает детальное редактирование викторины.
 * @param {string} quizId - ID викторины
 * @param {string} quizName - Название викторины
 */
function openQuizDetail(quizId, quizName) {
  currentQuizId = quizId;
  document.getElementById("detail-quiz-name").textContent = quizName;
  document.getElementById("quizzes-list-container").style.display = "none";
  document.getElementById("quiz-detail").classList.add("active");
  socket.emit("get-quiz-questions", quizId);
}

/**
 * Закрывает детальное редактирование викторины и возвращает к списку.
 */
function closeQuizDetail() {
  document.getElementById("quiz-detail").classList.remove("active");
  document.getElementById("quizzes-list-container").style.display = "block";
  currentQuizId = null;
}
