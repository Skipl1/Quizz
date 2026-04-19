require("dotenv").config();
const { Pool } = require("pg");
const { getPoolOptions } = require("./lib/pgPoolConfig");

const poolOptions = getPoolOptions();

if (!poolOptions) {
  console.error("❌ Ошибка: DATABASE_URL не установлен.");
  console.error("   Создайте файл .env на основе .env.example");
  process.exit(1);
}

const pool = new Pool(poolOptions);

async function createTables() {
  try {
    console.log("🔌 Подключение к БД...");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Таблица quizzes создана");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'multiple_choice',
        options JSONB,
        correct JSONB,
        image TEXT,
        time_limit INTEGER DEFAULT 30,
        order_index INTEGER DEFAULT 0
      )
    `);
    console.log("✅ Таблица questions создана");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS quiz_results (
        id SERIAL PRIMARY KEY,
        quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        player_name VARCHAR(255) NOT NULL,
        score NUMERIC(12, 6) NOT NULL,
        total_questions INTEGER NOT NULL,
        answered_count INTEGER NOT NULL,
        percentage SMALLINT,
        finished_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Таблица quiz_results создана");

    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz_id ON quiz_results(quiz_id)`,
    );
    console.log("✅ Индекс idx_quiz_results_quiz_id");

    // Добавим колонку для ordering вопросов если её нет
    try {
      await pool.query(
        `ALTER TABLE questions ADD COLUMN IF NOT EXISTS order_answer JSONB`,
      );
      console.log("✅ Добавлена колонка order_answer");
    } catch (e) {
      console.log("⚠️ Колонка order_answer уже существует");
    }

    // Проверка
    const quizzes = await pool.query("SELECT * FROM quizzes");
    const questions = await pool.query("SELECT * FROM questions");

    console.log("\n📊 Текущее состояние:");
    console.log(`   Викторин: ${quizzes.rows.length}`);
    console.log(`   Вопросов: ${questions.rows.length}`);

    await pool.end();
    console.log("\n✅ Готово!");
  } catch (err) {
    console.error("❌ Ошибка:", err.message);
    await pool.end();
  }
}

createTables();
