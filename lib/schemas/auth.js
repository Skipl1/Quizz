/**
 * Zod-схемы для авторизации (admin-login).
 */
const { z } = require('zod');
const { hasNoHtmlTags } = require('./sanitize');

/**
 * adminLogin — авторизация администратора.
 */
const adminLoginSchema = z.object({
  login: z.string()
    .min(1, 'Логин не может быть пустым')
    .max(100, 'Логин не более 100 символов')
    .refine(hasNoHtmlTags, 'Логин не должен содержать HTML-теги'),
  password: z.string()
    .min(1, 'Пароль не может быть пустым')
    .max(200, 'Пароль не более 200 символов'),
});

/**
 * TypeScript типы (для будущей миграции на TS)
 */
/** @typedef {z.infer<typeof adminLoginSchema>} AdminLoginInput */

module.exports = {
  adminLoginSchema,
};
