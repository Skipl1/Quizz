/**
 * admin-init.js — Инициализация при загрузке страницы
 */

// Проверка сохранённой сессии при загрузке
document.addEventListener("DOMContentLoaded", () => {
  checkAdminSession();
});
