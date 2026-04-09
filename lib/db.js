const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL || null;

const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 60000,
      idleTimeoutMillis: 60000,
      statementTimeoutMillis: 30000,
      max: 5,
    })
  : null;

async function initDatabase() {
  if (!pool) {
    console.log("⚠️ DATABASE_URL не установлен. Работа в режиме RAM.");
    return { pool: null, quizzes: [], error: null };
  }

  try {
    console.log("🔄 Подключение к БД... (может занять до 60с при «пробуждении» Render)");
    await pool.query("SELECT NOW()");
    console.log("✅ БД подключена");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'multiple_choice',
        options JSONB,
        correct JSONB,
        image TEXT,
        order_index INTEGER DEFAULT 0,
        time_limit INTEGER DEFAULT 30,
        order_answer JSONB
      )
    `);

    console.log("📋 Таблицы готовы");
    return { pool, error: null };
  } catch (err) {
    console.error("❌ Ошибка подключения к БД:", err.message);
    console.error("   Код ошибки:", err.code || "нет кода");
    if (err.message.includes("timeout")) {
      console.error("   ⏱  Таймаут — Render БД «спит». Подождите 30-60с и перезапустите сервер.");
    } else if (err.message.includes("password")) {
      console.error("   🔑 Неверный логин или пароль. Проверьте DATABASE_URL.");
    } else if (err.message.includes("does not exist")) {
      console.error("   🗄️  База данных не существует. Проверьте настройки на Render.");
    }
    return { pool: null, quizzes: [], error: err.message };
  }
}

async function loadQuizzes(pool) {
  if (!pool) return [];
  try {
    const result = await pool.query("SELECT * FROM quizzes ORDER BY created_at DESC");
    const quizzes = [];

    for (const row of result.rows) {
      const qResult = await pool.query(
        "SELECT * FROM questions WHERE quiz_id = $1 ORDER BY order_index",
        [row.id],
      );
      quizzes.push({
        id: `db-${row.id}`,
        dbId: row.id,
        name: row.name,
        questions: qResult.rows.map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options || [],
          correct: q.correct || [],
          image: q.image,
          orderIndex: q.order_index,
          timeLimit: q.time_limit || 30,
          orderAnswer: q.order_answer,
        })),
      });
    }
    console.log(`📚 Загружено викторин из БД: ${quizzes.length}`);
    return quizzes;
  } catch (err) {
    console.error("Ошибка загрузки викторин:", err.message);
    return [];
  }
}

module.exports = { pool, initDatabase, loadQuizzes };
