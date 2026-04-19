/**
 * admin-csv.js — Выгрузка результатов в CSV
 */

/**
 * Запрашивает финальный лидерборд и скачивает CSV-файл.
 * (Обработчик final-leaderboard находится в admin-sockets.js)
 */
function downloadResults() {
  socket.emit("get-final-leaderboard");
}
