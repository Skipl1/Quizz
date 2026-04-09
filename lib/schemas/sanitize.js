/**
 * Утилиты санитизации для XSS-защиты.
 * Используются совместно с Zod .refine() во всех схемах.
 */

/**
 * Санитизирует строку: обрезает, экранирует HTML-сущности.
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
function sanitizeInput(str, maxLength = 500) {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .slice(0, maxLength)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Проверка: строка НЕ содержит опасных символов (<>).
 * Используется внутри Zod .refine() ДО санитизации — чтобы отклонить вредоносный ввод.
 */
function hasNoHtmlTags(str) {
  if (typeof str !== 'string') return true;
  return !/[<>]/.test(str);
}

/**
 * Проверка: строка не содержит потенциально опасных паттернов XSS.
 */
function isSafeText(str) {
  if (typeof str !== 'string') return true;
  // Запрещаем script, onerror, javascript:, data: и т.д.
  const dangerous = /<\s*script|on\w+\s*=|javascript\s*:|data\s*:/i;
  return !dangerous.test(str);
}

module.exports = { sanitizeInput, hasNoHtmlTags, isSafeText };
