/**
 * Index Registration — регистрация игрока и управление сессией
 */

/**
 * Регистрация игрока
 */
function register() {
  const input = document.getElementById("player-name");
  const name = input.value.trim();
  if (!name) {
    alert("Введите имя!");
    return;
  }
  playerName = name;
  socket.emit("register", name);
}

/**
 * Проверка сохранённой сессии
 * Работает только в рамках одной викторины
 * Вызывается из index-init.js при DOMContentLoaded
 */
function checkSavedSession() {
  // Ждём подключения сокета
  if (socket.connected) {
    tryRestoreSession();
  } else {
    // Если ещё не подключён — дождёмся события connect
    console.log("[Session] Socket ещё не подключён, ждём connect...");
  }
}

// Восстановление сессии при переподключении сокета
let sessionRestored = false;

/**
 * Попытка восстановить сессию (безопасно)
 */
function tryRestoreSession() {
  if (sessionRestored) {
    console.log("[Session] Уже восстановлена, пропускаем");
    return;
  }

  const data = getSessionData();
  if (!data) {
    console.log("[Session] Нет сохранённой сессии");
    return;
  }

  sessionRestored = true;

  console.log(`[Session] Восстанавливаю: ${data.name} (${data.playerId})`);
  socket.emit("register", {
    name: data.name,
    savedId: data.playerId,
  });

  // Скрываем экран входа сразу чтобы не мигал
  showScreen("waiting-screen");
}

// При подключении пробуем восстановить
socket.on("connect", () => {
  console.log("[Socket] Connected, пробуем восстановить сессию");
  tryRestoreSession();
});

// При переподключении тоже пробуем (на случай разрыва соединения)
socket.on("reconnect", () => {
  console.log("[Socket] Reconnect, пробуем восстановить сессию");
  tryRestoreSession();
});

socket.on("registered", (data) => {
  playerName = data.name;
  document.getElementById("display-name").textContent = data.name;

  if (data.restored) {
    document.getElementById("restored-badge").style.display = "inline";
    document.getElementById("restore-status").textContent =
      "Сессия восстановлена!";
  }

  saveSession({ playerId: data.playerId, name: data.name });

  showScreen("waiting-screen");

  // Если сессия восстановлена и викторина запущена - скрываем ссылку на админку
  if (data.restored) {
    const adminLink = document.querySelector(".secondary-action");
    if (adminLink) adminLink.style.display = "none";
  }
});

// Обработка случая когда сессия не найдена на сервере
socket.on("session-not-found", () => {
  clearSession();
  // Показываем экран входа заново
  showScreen("login-screen");
});

socket.on("quiz-already-started", () => {
  // Если сессия есть, она уже восстанавливается через checkSavedSession()
  // Просто показываем сообщение для новых игроков
  const data = getSessionData();
  if (!data) {
    alert("Викторина уже запущена! Подключиться нельзя.");
    // Показываем ссылку на админку
    const adminLink = document.querySelector(".secondary-action");
    if (adminLink) adminLink.style.display = "inline-block";
  } else {
    // Сессия есть но игрок не найден на сервере — очищаем
    clearSession();
    showScreen("login-screen");
  }
});

socket.on("quiz-ready", (data) => {
  document.getElementById("waiting-text").textContent =
    `Викторина "${data.name}" готова! Ожидание запуска...`;
  // Скрываем ссылку на админку когда викторина выбрана
  const adminLink = document.querySelector(".secondary-action");
  if (adminLink) adminLink.style.display = "none";
});
