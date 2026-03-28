# 🚀 Развёртывание на Render.com с базой данных

## Шаг 1: Загрузите проект на GitHub

```bash
cd "d:\Для Windows 11\Всё подряд\Users\kreck\Desktop\Прочее\Квиз для Коныча"
git init
git add .
git commit -m "Quiz app with database"
git branch -M main
git remote add origin https://github.com/ВАШ_НИК/quiz-game.git
git push -u origin main
```

---

## Шаг 2: Создайте базу данных PostgreSQL на Render

1. https://dashboard.render.com/ → **New +** → **PostgreSQL**
2. Заполните:
   - **Name:** `quiz-db`
   - **Region:** `Frankfurt, Germany`
   - **Database:** `Free` (0$/мес)
3. Нажмите **Create Database**
4. После создания скопируйте **Internal Database URL** (вида `postgresql://user:pass@host:5432/dbname`)

---

## Шаг 3: Создайте Web Service

1. **New +** → **Web Service**
2. Выберите ваш репозиторий
3. Настройки:

| Поле | Значение |
|------|----------|
| **Name** | `quiz-game` |
| **Region** | `Frankfurt, Germany` |
| **Branch** | `main` |
| **Root Directory** | *(пусто)* |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | **Free** |

4. **Advanced** → добавьте переменную окружения:
   - **Key:** `DATABASE_URL`
   - **Value:** *(ваш Internal Database URL из шага 2)*

5. Нажмите **Create Web Service**

---

## Шаг 4: Дождитесь деплоя

- Статус: **"Live"** (3-5 минут)
- URL: `https://quiz-game-xxxx.onrender.com`

---

## ✅ Что работает

| Функция | Описание |
|---------|----------|
| 📚 **Сохранение викторин** | Все созданные тесты сохраняются в БД |
| 🔄 **Восстановление** | После перезапуска сервера викторины загружаются |
| 📊 **Типы вопросов** | Множественный выбор, Правда/Ложь, Заполнить пробел, Открытый |
| 🖼️ **Картинки** | Поддержка изображений в вопросах |
| ⏱️ **Таймер** | Настройка времени на каждый вопрос |

---

## 📁 Структура БД

```sql
quizzes:
  - id (SERIAL PRIMARY KEY)
  - name (VARCHAR)
  - created_at (TIMESTAMP)

questions:
  - id (SERIAL PRIMARY KEY)
  - quiz_id (INTEGER → quizzes.id)
  - text (TEXT)
  - type (VARCHAR) -- multiple_choice, true_false, fill_blank, open_ended
  - options (JSONB) -- ["вариант 1", "вариант 2"]
  - correct (JSONB) -- [0, 2] -- индексы правильных
  - image (TEXT) -- base64
  - order_index (INTEGER)
```

---

## ⚠️ Важно

- **Бесплатная БД:** 1 ГБ, 90 дней хранения
- **Для продления:** Подключите карту или создайте новую БД
- **Без БД:** Викторины хранятся только в RAM (теряются при перезапуске)

---

## 🔧 Локальный запуск (без БД)

```bash
npm install
npm start
```

Викторины будут работать в оперативной памяти.
