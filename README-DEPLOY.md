# 🚀 Развёртывание на Render.com

## Шаг 1: Загрузите проект на GitHub

1. Создайте новый репозиторий на **GitHub** (https://github.com)
2. Загрузите файлы проекта в репозиторий:

```bash
cd "d:\Для Windows 11\Всё подряд\Users\kreck\Desktop\Прочее\Квиз для Коныча"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/ВАШ_НИК/quiz-game.git
git push -u origin main
```

**Или через GitHub Desktop:**
- Скачайте https://desktop.github.com/
- Создайте новый репозиторий с папкой проекта
- Нажмите "Publish repository"

---

## Шаг 2: Создайте приложение на Render

1. Зайдите на https://dashboard.render.com/
2. Войдите через GitHub
3. Нажмите **"New +"** → **"Web Service"**
4. Выберите ваш репозиторий с викториной
5. Заполните настройки:

| Поле | Значение |
|------|----------|
| **Name** | `quiz-game` (или любое) |
| **Region** | `Frankfurt, Germany` (ближе к РФ) |
| **Branch** | `main` |
| **Root Directory** | *(оставьте пустым)* |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | **Free** |

6. Нажмите **"Advanced"** и добавьте переменную окружения:
   - **Key:** `PORT`
   - **Value:** `3000`

7. Нажмите **"Create Web Service"**

---

## Шаг 3: Дождитесь деплоя

- Статус изменится на **"Live"** (2-5 минут)
- Вы получите URL вида: `https://quiz-game-xxxx.onrender.com`

---

## Шаг 4: Используйте викторину

- **Игроки:** `https://quiz-game-xxxx.onrender.com`
- **Админ:** `https://quiz-game-xxxx.onrender.com/admin.html`
- **Логин/пароль:** `admin` / `admin123`

---

## ⚠️ Важно для бесплатного тарифа

- Приложение **"засыпает"** через 15 минут без активности
- Первый запуск занимает ~30 секунд
- Для "пробуждения" просто откройте сайт

---

## 🔧 Если что-то не работает

1. **Проверьте логи** в Dashboard Render → Logs
2. **Убедитесь**, что `package.json` в корне проекта
3. **Проверьте**, что `node_modules` в `.gitignore`

---

## 📁 Структура проекта для Render

```
quiz-game/
├── server.js          ✅
├── package.json       ✅
├── .gitignore         ✅
└── public/
    ├── index.html     ✅
    └── admin.html     ✅
```
