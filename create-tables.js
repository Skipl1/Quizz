require("dotenv").config();
const { Pool } = require("pg");
const { getPoolOptions } = require("./lib/pgPoolConfig");
const { ensureDatabaseSchema } = require("./lib/schema");

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

    await ensureDatabaseSchema(pool);
    console.log("✅ Таблицы и индексы созданы/обновлены");

    // Проверка
    const quizzes = await pool.query("SELECT * FROM quizzes");
    const questions = await pool.query("SELECT * FROM questions");
    const attempts = await pool.query("SELECT * FROM quiz_attempts");
    const answers = await pool.query("SELECT * FROM quiz_attempt_answers");

    console.log("\n📊 Текущее состояние:");
    console.log(`   Викторин: ${quizzes.rows.length}`);
    console.log(`   Вопросов: ${questions.rows.length}`);
    console.log(`   Прохождений: ${attempts.rows.length}`);
    console.log(`   Ответов: ${answers.rows.length}`);

    await pool.end();
    console.log("\n✅ Готово!");
  } catch (err) {
    console.error("❌ Ошибка:", err.message);
    await pool.end();
  }
}

createTables();
