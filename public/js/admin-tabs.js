/**
 * admin-tabs.js — Управление вкладками и навигацией
 */

/**
 * Переключает видимую вкладку в админ-панели.
 * @param {string} tabName - Имя вкладки (quizzes, play, leaderboard)
 */
function showTab(tabName) {
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  event.target.classList.add("active");
  document.getElementById(tabName + "-tab").classList.add("active");
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
