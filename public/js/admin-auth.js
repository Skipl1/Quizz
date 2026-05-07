/**
 * admin-auth.js — Аутентификация администратора
 */

let adminSessionExpiresTimer = null;

function showAdminMain() {
  document.getElementById("login-screen").classList.remove("active");
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("main-screen").classList.remove("hidden");
  const logoutBtn = document.getElementById("admin-logout-btn");
  if (logoutBtn) logoutBtn.classList.remove("hidden");
  socket.emit("get-quizzes");
  socket.emit("get-game-state");
}

function showAdminLogin(message) {
  if (adminSessionExpiresTimer) {
    clearTimeout(adminSessionExpiresTimer);
    adminSessionExpiresTimer = null;
  }
  localStorage.removeItem(ADMIN_SESSION_KEY);
  document.getElementById("main-screen").classList.add("hidden");
  document.getElementById("login-screen").classList.remove("hidden");
  document.getElementById("login-screen").classList.add("active");
  const logoutBtn = document.getElementById("admin-logout-btn");
  if (logoutBtn) logoutBtn.classList.add("hidden");
  const err = document.getElementById("login-error");
  if (err) {
    err.textContent = message || "";
    err.style.display = message ? "block" : "none";
  }
}

function saveAdminSession(token, expiresAt) {
  localStorage.setItem(
    ADMIN_SESSION_KEY,
    JSON.stringify({ token, expiresAt }),
  );
  scheduleAdminSessionExpiry(expiresAt);
}

function scheduleAdminSessionExpiry(expiresAt) {
  if (adminSessionExpiresTimer) clearTimeout(adminSessionExpiresTimer);
  const delay = Number(expiresAt) - Date.now();
  if (!Number.isFinite(delay) || delay <= 0) {
    showAdminLogin("Сессия администратора истекла. Войдите снова.");
    return;
  }
  adminSessionExpiresTimer = setTimeout(() => {
    showAdminLogin("Сессия администратора истекла. Войдите снова.");
  }, delay);
}

/**
 * Проверяет сохранённую сессию админа при загрузке страницы.
 * Если сессия существует, отправляет запрос на сервер для проверки валидности.
 */
function checkAdminSession() {
  const saved = localStorage.getItem(ADMIN_SESSION_KEY);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      socket.emit("admin-login", { token: data.token }, (response) => {
        if (response.success) {
          saveAdminSession(response.token, response.expiresAt);
          showAdminMain();
        } else {
          showAdminLogin();
        }
      });
    } catch (e) {
      showAdminLogin();
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
      saveAdminSession(response.token, response.expiresAt);
      showAdminMain();
    } else {
      document.getElementById("login-error").textContent = response.error;
      document.getElementById("login-error").style.display = "block";
    }
  });
}

function adminLogout() {
  socket.emit("admin-logout", () => {
    showAdminLogin();
  });
}

socket.on("admin-session-expired", () => {
  showAdminLogin("Сессия администратора истекла. Войдите снова.");
});
