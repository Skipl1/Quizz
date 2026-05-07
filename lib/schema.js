async function ensureDatabaseSchema(pool) {
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS quiz_results (
      id SERIAL PRIMARY KEY,
      quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      player_name TEXT NOT NULL,
      score NUMERIC(12, 6) NOT NULL,
      total_questions INTEGER NOT NULL,
      answered_count INTEGER NOT NULL,
      percentage SMALLINT,
      finished_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`ALTER TABLE quiz_results ALTER COLUMN player_name TYPE TEXT`);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz_id ON quiz_results(quiz_id)`,
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id SERIAL PRIMARY KEY,
      quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      run_id TEXT NOT NULL,
      player_key TEXT NOT NULL,
      player_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'in_progress',
      correct_count INTEGER NOT NULL DEFAULT 0,
      answered_count INTEGER NOT NULL DEFAULT 0,
      total_questions INTEGER NOT NULL DEFAULT 0,
      started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMPTZ,
      elapsed_ms BIGINT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
      id SERIAL PRIMARY KEY,
      attempt_id INTEGER NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
      question_id INTEGER REFERENCES questions(id) ON DELETE SET NULL,
      question_index INTEGER NOT NULL,
      answer_payload JSONB,
      is_correct BOOLEAN NOT NULL DEFAULT false,
      points NUMERIC(12, 6) NOT NULL DEFAULT 0,
      elapsed_ms BIGINT,
      answered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_attempts_run_player
     ON quiz_attempts(run_id, player_key)`,
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_run
     ON quiz_attempts(quiz_id, run_id, correct_count DESC, elapsed_ms ASC)`,
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_quiz_attempts_status
     ON quiz_attempts(status)`,
  );
  await pool.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_attempt_answers_once
     ON quiz_attempt_answers(attempt_id, question_index)`,
  );
}

module.exports = { ensureDatabaseSchema };
