/**
 * admin-game-control.js — Управление игрой (запуск, остановка)
 */

/**
 * Запускает викторину для игроков.
 */
function startQuiz() {
  socket.emit("start-quiz");
  document.getElementById("start-btn").disabled = true;
  document.getElementById("stop-btn").disabled = false;
  document.getElementById("game-info-card").classList.add("quiz-running");
}

/**
 * Останавливает текущую викторину.
 */
function stopQuiz() {
  socket.emit("stop-quiz");
}
