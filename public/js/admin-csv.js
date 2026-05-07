/**
 * admin-csv.js — Выгрузка текущих результатов в XLSX
 */

/**
 * Запрашивает XLSX-файл по текущей викторине.
 */
function downloadResults() {
  if (typeof currentQuizId !== "string" || !currentQuizId.startsWith("db-")) {
    alert("XLSX доступен для викторин, сохранённых в базе данных.");
    return;
  }
  const quizDbId = Number(currentQuizId.slice(3));
  socket.emit("download-results-xlsx", { quizDbId });
}
