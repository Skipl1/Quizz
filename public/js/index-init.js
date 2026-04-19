/**
 * Index Init — инициализация при загрузке страницы игрока
 * Сессия игрока живёт только в рамках одной викторины
 */

// Проверяем сессию при загрузке (восстановление произойдёт через socket.on("connect"))
document.addEventListener("DOMContentLoaded", () => {
  checkSavedSession();
});

// Сохраняем сессию перед закрытием страницы
window.addEventListener("beforeunload", () => {
  const data = getSessionData();
  if (data) {
    saveSession({ playerId: data.playerId, name: data.name });
  }
});
