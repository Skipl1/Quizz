/**
 * admin-quiz-crud.js — CRUD операции для викторин
 */

/**
 * Создаёт новую викторину с указанным названием.
 * Отправляет событие create-quiz на сервер.
 */
function createQuiz() {
  const name = document.getElementById("new-quiz-name").value.trim();
  if (!name) {
    alert("Введите название");
    return;
  }
  socket.emit("create-quiz", { name });
  document.getElementById("new-quiz-name").value = "";
}

/**
 * Удаляет викторину по ID после подтверждения пользователя.
 * @param {string} quizId - ID викторины для удаления
 */
function deleteQuiz(quizId) {
  if (confirm("Удалить эту викторину?")) {
    socket.emit("delete-quiz", quizId);
  }
}

/**
 * Выбирает викторину для игры (отправляет событие на сервер).
 * @param {string} quizId - ID викторины
 */
function selectQuiz(quizId) {
  socket.emit("select-quiz", quizId);
}
