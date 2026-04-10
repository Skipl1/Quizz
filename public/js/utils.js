/**
 * Utils — общие утилиты для index.html и admin.html
 */

/**
 * Экранирование HTML для предотвращения XSS
 * @param {string} text — текст для экранирования
 * @returns {string}
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
