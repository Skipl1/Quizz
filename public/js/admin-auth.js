/**
 * admin-auth.js — Аутентификация администратора
 */

/**
 * Проверяет сохранённую сессию админа при загрузке страницы.
 * Если сессия существует, отправляет запрос на сервер для проверки валидности.
 */
function checkAdminSession() {
  const saved = localStorage.getItem(ADMIN_SESSION_KEY);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      socket.emit("admin-login", data, (response) => {
        if (response.success) {
          document
            .getElementById("login-screen")
            .classList.remove("active");
          document.getElementById("login-screen").classList.add("hidden");
          document
            .getElementById("main-screen")
            .classList.remove("hidden");
          socket.emit("get-quizzes");
          // Запрашиваем текущее состояние игры
          socket.emit("get-game-state");
        } else {
          localStorage.removeItem(ADMIN_SESSION_KEY);
        }
      });
    } catch (e) {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
  }
}

/**
 * Выполняет вход администратора с указанными логином и паролем.
 * Отправляет учётные данные на сервер через Socket.IO.
 */
function adminLogin() {
  const login = document.getElementById("admin-login").value;
  const password = document.getElementById("admin-password").value;

  socket.emit("admin-login", { login, password }, (response) => {
    if (response.success) {
      localStorage.setItem(
        ADMIN_SESSION_KEY,
        JSON.stringify({ login, password }),
      );
      document.getElementById("login-screen").classList.remove("active");
      document.getElementById("login-screen").classList.add("hidden");
      document.getElementById("main-screen").classList.remove("hidden");
      socket.emit("get-quizzes");
      // Запрашиваем текущее состояние игры
      socket.emit("get-game-state");
    } else {
      document.getElementById("login-error").textContent = response.error;
      document.getElementById("login-error").style.display = "block";
    }
  });
}
