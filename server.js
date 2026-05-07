require("dotenv").config();
const crypto = require("crypto");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Pool } = require("pg");
const rateLimit = require("express-rate-limit");
const XLSX = require("xlsx");
const { getPoolOptions } = require("./lib/pgPoolConfig");
const { ensureDatabaseSchema } = require("./lib/schema");

const app = express();

const trustProxy = process.env.TRUST_PROXY;
if (trustProxy === "1" || trustProxy === "true" || trustProxy === "yes") {
  app.set("trust proxy", 1);
}
const server = http.createServer(app);
const io = new Server(server);

// === RATE LIMITING ===

// HTTP rate limiting — только для HTML/API, не для статики (CSS/JS/картинки)
const HTTP_RATE_WINDOW_MS = Number(process.env.HTTP_RATE_WINDOW_MS) || 5 * 60 * 1000; // 5 минут
const HTTP_RATE_MAX = Number(process.env.HTTP_RATE_MAX) || 1000; // 1000 запросов за окно

const limiter = rateLimit({
  windowMs: HTTP_RATE_WINDOW_MS,
  max: HTTP_RATE_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много запросов, попробуйте позже" },
  skip: (req) => {
    // Пропускаем статические файлы
    const skipExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
    return skipExtensions.some((ext) => req.path.endsWith(ext));
  },
});
app.use(limiter);

// Socket.IO rate limiting
const socketRateLimit = new Map();
const SOCKET_RATE_WINDOW_MS =
  Number(process.env.SOCKET_RATE_WINDOW_MS) || 15_000;
const SOCKET_RATE_MAX_EVENTS = Number(process.env.SOCKET_RATE_MAX_EVENTS) || 100;
const SOCKET_RATE_WARN_THRESHOLD = Number(process.env.SOCKET_RATE_WARN_THRESHOLD) || 60;
const SOCKET_RATE_CLEANUP_INTERVAL = 30_000; // Очистка каждые 30 сек

// Периодическая очистка устаревших записей
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [id, record] of socketRateLimit.entries()) {
    if (now > record.resetAt) {
      socketRateLimit.delete(id);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[RateLimit] Очищено ${cleaned} устаревших записей`);
  }
}, SOCKET_RATE_CLEANUP_INTERVAL);

io.use((socket, next) => {
  socketRateLimit.set(socket.id, {
    count: 0,
    resetAt: Date.now() + SOCKET_RATE_WINDOW_MS,
  });
  next();
});

function checkSocketRateLimit(socket) {
  const record = socketRateLimit.get(socket.id);
  if (!record) return true;

  // Сброс счётчика при истечении окна
  if (Date.now() > record.resetAt) {
    socketRateLimit.set(socket.id, {
      count: 1,
      resetAt: Date.now() + SOCKET_RATE_WINDOW_MS,
    });
    return true;
  }

  record.count++;

  // Предупреждение при достижении warn-порога
  if (record.count === SOCKET_RATE_WARN_THRESHOLD) {
    console.warn(
      `[RateLimit] Предупреждение: ${socket.id} (${record.count}/${SOCKET_RATE_MAX_EVENTS})`,
    );
  }

  // Отключение только при превышении жёсткого лимита
  if (record.count > SOCKET_RATE_MAX_EVENTS) {
    console.warn(
      `[RateLimit] Клиент отключён: ${socket.id} (${record.count}/${SOCKET_RATE_MAX_EVENTS})`,
    );
    socket.disconnect(true);
    return false;
  }

  return true;
}

// === INPUT SANITIZATION ===
function sanitizeInput(str, maxLength = 500) {
  if (typeof str !== "string") return "";
  return str
    .trim()
    .slice(0, maxLength)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function generateAdminToken() {
  return crypto.randomBytes(32).toString("hex");
}

function generateRunId() {
  return `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
}

function createAdminSession(socket) {
  const token = generateAdminToken();
  const expiresAt = Date.now() + ADMIN_SESSION_TTL_MS;
  adminTokens.set(token, { expiresAt });
  adminSessions[socket.id] = { token, expiresAt };
  return { token, expiresAt };
}

function bindAdminSession(socket, token, expiresAt) {
  adminSessions[socket.id] = { token, expiresAt };
}

function clearAdminSession(socket) {
  const session = adminSessions[socket.id];
  if (session?.token) {
    adminTokens.delete(session.token);
  }
  delete adminSessions[socket.id];
}

function ensureAdminSession(socket) {
  const session = adminSessions[socket.id];
  if (!session) return false;

  const tokenRecord = adminTokens.get(session.token);
  const expiresAt = tokenRecord?.expiresAt || session.expiresAt;
  if (!tokenRecord || !expiresAt || expiresAt <= Date.now()) {
    clearAdminSession(socket);
    socket.emit("admin-session-expired");
    return false;
  }

  session.expiresAt = expiresAt;
  return true;
}

function restoreAdminSession(socket, token) {
  if (typeof token !== "string" || !token) return null;
  const tokenRecord = adminTokens.get(token);
  if (!tokenRecord || tokenRecord.expiresAt <= Date.now()) {
    adminTokens.delete(token);
    return null;
  }
  bindAdminSession(socket, token, tokenRecord.expiresAt);
  return { token, expiresAt: tokenRecord.expiresAt };
}

function sanitizeFilenamePart(value) {
  return String(value || "results")
    .replace(/[/\\?%*:|"<>]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 120);
}

function formatDurationMs(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function toIsoOrEmpty(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

// Парсинг JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

// Админские учётные данные из переменных окружения
const ADMIN_CREDENTIALS = {
  login: process.env.ADMIN_LOGIN || "admin",
  password: process.env.ADMIN_PASSWORD || "CHANGE_ME_set_in_env",
};

// Подключение к PostgreSQL из переменных окружения (см. .env.example)
const poolOptions = getPoolOptions();
const pool = poolOptions ? new Pool(poolOptions) : null;

if (!pool) {
  console.log("⚠️ DATABASE_URL не установлен. Работа в режиме RAM (без БД).");
  console.log("   Для подключения создайте файл .env (см. .env.example)");
}

// База данных в оперативной памяти (если нет БД)
let quizzes = [];
let currentQuizId = null;
let currentRunId = null;
let quizStarted = false;
let quizFinished = false;
const QUESTION_TIME = Number(process.env.QUESTION_TIME_SECONDS) || 30;
const ADMIN_SESSION_TTL_MS =
  Number(process.env.ADMIN_SESSION_TTL_MS) || 3 * 60 * 60 * 1000;
const players = {};
const adminSessions = {};
const adminTokens = new Map();

// Инициализация БД
async function initDatabase() {
  if (!pool) {
    console.log("База данных не подключена. Работа в режиме RAM.");
    // Тестовая викторина
    quizzes.push({
      id: "default",
      name: "Тестовая викторина",
      questions: [
        {
          text: "Столица Франции?",
          type: "multiple_choice",
          options: ["Лондон", "Берлин", "Париж", "Мадрид"],
          correct: [2],
          image: null,
        },
        {
          text: "Сколько планет в Солнечной системе?",
          type: "multiple_choice",
          options: ["7", "8", "9", "10"],
          correct: [1],
          image: null,
        },
        {
          text: "H2O — это формула воды",
          type: "true_false",
          options: ["Правда", "Ложь"],
          correct: [0],
          image: null,
        },
        {
          text: "Кто написал «Войну и мир»?",
          type: "multiple_choice",
          options: ["Достоевский", "Чехов", "Толстой", "Пушкин"],
          correct: [2],
          image: null,
        },
      ],
    });
    return;
  }

  try {
    console.log(
      "🔄 Подключение к БД... (может занять до 60с при «пробуждении» Render)",
    );
    await pool.query("SELECT NOW()");
    console.log("✅ БД подключена");

    await ensureDatabaseSchema(pool);
    console.log("База данных подключена и готова.");

    // Загрузка викторин из БД
    await loadQuizzesFromDB();
  } catch (err) {
    console.error("❌ Ошибка подключения к БД:", err.message);
    console.error("   Код ошибки:", err.code || "нет кода");
    if (err.message.includes("timeout")) {
      console.error(
        "   ⏱  Таймаут — Render БД «спит». Подождите 30-60с и перезапустите сервер.",
      );
      console.error("   💡 Или проверьте DATABASE_URL в .env файле.");
    } else if (err.message.includes("password")) {
      console.error("   🔑 Неверный логин или пароль. Проверьте DATABASE_URL.");
    } else if (err.message.includes("does not exist")) {
      console.error(
        "   🗄  База данных не существует. Проверьте настройки на Render.",
      );
    }
    console.log("⚠️ Работа в режиме RAM (без подключения к БД)");
  }
}

async function loadQuizzesFromDB() {
  if (!pool) return;
  try {
    const result = await pool.query(
      "SELECT * FROM quizzes ORDER BY created_at DESC",
    );

    // Если викторин нет, создаём тестовую
    if (result.rows.length === 0) {
      console.log("Таблица пуста. Создаю тестовую викторину...");
      const quizResult = await pool.query(
        "INSERT INTO quizzes (name) VALUES ($1) RETURNING id",
        ["Тестовая викторина"],
      );
      const quizId = quizResult.rows[0].id;

      // Добавляем тестовые вопросы
      const questions = [
        {
          text: "Столица Франции?",
          type: "multiple_choice",
          options: JSON.stringify(["Лондон", "Берлин", "Париж", "Мадрид"]),
          correct: JSON.stringify([2]),
          order_index: 0,
        },
        {
          text: "Сколько планет в Солнечной системе?",
          type: "multiple_choice",
          options: JSON.stringify(["7", "8", "9", "10"]),
          correct: JSON.stringify([1]),
          order_index: 1,
        },
        {
          text: "H2O — это формула воды",
          type: "true_false",
          options: JSON.stringify(["Правда", "Ложь"]),
          correct: JSON.stringify([0]),
          order_index: 2,
        },
        {
          text: "Кто написал «Войну и мир»?",
          type: "multiple_choice",
          options: JSON.stringify([
            "Достоевский",
            "Чехов",
            "Толстой",
            "Пушкин",
          ]),
          correct: JSON.stringify([2]),
          order_index: 3,
        },
      ];

      for (const q of questions) {
        await pool.query(
          "INSERT INTO questions (quiz_id, text, type, options, correct, order_index) VALUES ($1, $2, $3, $4, $5, $6)",
          [quizId, q.text, q.type, q.options, q.correct, q.order_index],
        );
      }
      console.log("Тестовая викторина создана");

      // Перезагружаем список
      return loadQuizzesFromDB();
    }

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
          timeLimit: q.time_limit || QUESTION_TIME,
        })),
      });
    }
    console.log(`Загружено викторин: ${quizzes.length}`);
  } catch (err) {
    console.error("Ошибка загрузки викторин:", err.message);
  }
}

// Перемешивание массива
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getElapsedMs(player) {
  if (Number.isFinite(player.elapsedMs)) return player.elapsedMs;
  if (Number.isFinite(player.startedAtMs)) {
    return Date.now() - player.startedAtMs;
  }
  return null;
}

function getCompletionStatusRank(status) {
  return status === "completed" ? 0 : 1;
}

function sortStandingsRows(rows) {
  return rows.sort((a, b) => {
    const ac = Number(a.correctCount || 0);
    const bc = Number(b.correctCount || 0);
    if (bc !== ac) return bc - ac;

    const ar = getCompletionStatusRank(a.status);
    const br = getCompletionStatusRank(b.status);
    if (ar !== br) return ar - br;

    const ae =
      Number.isFinite(a.elapsedMs) && a.elapsedMs != null
        ? Number(a.elapsedMs)
        : Number.MAX_SAFE_INTEGER;
    const be =
      Number.isFinite(b.elapsedMs) && b.elapsedMs != null
        ? Number(b.elapsedMs)
        : Number.MAX_SAFE_INTEGER;
    if (ae !== be) return ae - be;

    return String(a.name || a.playerName || "").localeCompare(
      String(b.name || b.playerName || ""),
      "ru",
    );
  });
}

function getQuestionDisplayOptions(player, question, originalIndex) {
  if (
    question.type !== "multiple_choice" ||
    !Array.isArray(question.options)
  ) {
    return question.options;
  }

  const mapping = player.answerOptionMaps?.[originalIndex];
  if (!Array.isArray(mapping) || mapping.length !== question.options.length) {
    return question.options;
  }

  return mapping.map((optionIndex) => question.options[optionIndex]);
}

function prepareQuestionDisplayOptions(player, question, originalIndex) {
  if (
    question.type !== "multiple_choice" ||
    !Array.isArray(question.options)
  ) {
    return question.options;
  }

  if (!player.answerOptionMaps) player.answerOptionMaps = {};
  if (!Array.isArray(player.answerOptionMaps[originalIndex])) {
    const entries = question.options.map((_, index) => index);
    player.answerOptionMaps[originalIndex] = shuffleArray(entries);
  }

  return getQuestionDisplayOptions(player, question, originalIndex);
}

function createPlayerState(name, playerKey) {
  return {
    playerKey,
    name,
    score: 0,
    correctCount: 0,
    questionsQueue: [],
    currentQuestion: null,
    answeredQuestions: [],
    questionStartTime: null,
    quizCompletionHandled: false,
    attemptDbId: null,
    startedAtMs: null,
    completedAtMs: null,
    elapsedMs: null,
    status: "waiting",
    answerOptionMaps: {},
  };
}

async function createAttemptForPlayer(playerId, player, quiz) {
  if (!quizStarted || !currentRunId) return;
  player.playerKey = player.playerKey || playerId;
  player.startedAtMs = player.startedAtMs || Date.now();
  player.status = player.status === "completed" ? "completed" : "in_progress";

  if (!pool || !quiz?.dbId) return;

  try {
    const res = await pool.query(
      `INSERT INTO quiz_attempts
        (quiz_id, run_id, player_key, player_name, status, correct_count,
         answered_count, total_questions, started_at, completed_at, elapsed_ms)
       VALUES ($1, $2, $3, $4, 'in_progress', 0, 0, $5, CURRENT_TIMESTAMP, NULL, NULL)
       ON CONFLICT (run_id, player_key)
       DO UPDATE SET
         player_name = EXCLUDED.player_name,
         status = CASE
           WHEN quiz_attempts.status = 'completed' THEN quiz_attempts.status
           ELSE 'in_progress'
         END,
         total_questions = EXCLUDED.total_questions,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id, started_at`,
      [
        quiz.dbId,
        currentRunId,
        player.playerKey,
        player.name,
        quiz.questions.length,
      ],
    );
    player.attemptDbId = res.rows[0]?.id || player.attemptDbId;
    const startedAt = res.rows[0]?.started_at
      ? new Date(res.rows[0].started_at).getTime()
      : null;
    if (Number.isFinite(startedAt)) player.startedAtMs = startedAt;
  } catch (err) {
    console.error("Ошибка создания live-прохождения:", err.message);
  }
}

async function markAttemptStatus(player, status) {
  if (!player) return;
  if (player.status === "completed" && status !== "completed") return;
  player.status = status;

  if (!pool || !player.attemptDbId) return;

  const completedAtStatuses = new Set(["completed", "stopped"]);
  const shouldComplete = completedAtStatuses.has(status);
  const elapsedMs =
    shouldComplete && Number.isFinite(player.startedAtMs)
      ? getElapsedMs(player)
      : player.elapsedMs;

  if (shouldComplete) {
    player.completedAtMs = Date.now();
    player.elapsedMs = elapsedMs;
  }

  try {
    await pool.query(
      `UPDATE quiz_attempts
       SET status = $2,
           completed_at = CASE WHEN $3 THEN COALESCE(completed_at, CURRENT_TIMESTAMP) ELSE completed_at END,
           elapsed_ms = CASE WHEN $3 THEN COALESCE($4, elapsed_ms) ELSE elapsed_ms END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [player.attemptDbId, status, shouldComplete, elapsedMs],
    );
  } catch (err) {
    console.error("Ошибка обновления статуса прохождения:", err.message);
  }
}

async function recordAttemptAnswer({
  quiz,
  player,
  question,
  questionIndex,
  answerPayload,
  pointsEarned,
  elapsedMs,
}) {
  if (!pool || !quiz?.dbId || !player?.attemptDbId) return;

  const isCorrect = pointsEarned >= 1;
  try {
    await pool.query(
      `INSERT INTO quiz_attempt_answers
        (attempt_id, question_id, question_index, answer_payload, is_correct, points, elapsed_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (attempt_id, question_index)
       DO UPDATE SET
         question_id = EXCLUDED.question_id,
         answer_payload = EXCLUDED.answer_payload,
         is_correct = EXCLUDED.is_correct,
         points = EXCLUDED.points,
         elapsed_ms = EXCLUDED.elapsed_ms,
         answered_at = CURRENT_TIMESTAMP`,
      [
        player.attemptDbId,
        question.id || null,
        questionIndex,
        JSON.stringify(answerPayload || null),
        isCorrect,
        pointsEarned,
        Number.isFinite(elapsedMs) ? Math.round(elapsedMs) : null,
      ],
    );

    await pool.query(
      `UPDATE quiz_attempts
       SET correct_count = $2,
           answered_count = $3,
           status = CASE WHEN status = 'disconnected' THEN 'in_progress' ELSE status END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [player.attemptDbId, player.correctCount, player.answeredQuestions.length],
    );
  } catch (err) {
    console.error("Ошибка сохранения ответа в live-результаты:", err.message);
  }
}

function mapAttemptRow(row, rank) {
  return {
    rank,
    id: row.id,
    quizDbId: Number(row.quiz_id),
    runId: row.run_id,
    quizName: row.quiz_name,
    playerName: row.player_name,
    name: row.player_name,
    status: row.status,
    correctCount: Number(row.correct_count || 0),
    answeredCount: Number(row.answered_count || 0),
    totalQuestions: Number(row.total_questions || 0),
    percentage:
      Number(row.total_questions || 0) > 0
        ? Math.round(
            (Number(row.correct_count || 0) / Number(row.total_questions)) *
              100,
          )
        : 0,
    elapsedMs: row.elapsed_ms == null ? null : Number(row.elapsed_ms),
    startedAt: row.started_at,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
  };
}

async function getAttemptStandingsFromDb({ quizDbId, runId, limit = 500 }) {
  if (!pool) {
    return { rows: [], quizName: null, runId: runId || null };
  }

  let effectiveRunId = runId || null;
  if (!effectiveRunId) {
    const latest = await pool.query(
      `SELECT run_id
       FROM quiz_attempts
       WHERE quiz_id = $1
       ORDER BY started_at DESC, id DESC
       LIMIT 1`,
      [quizDbId],
    );
    effectiveRunId = latest.rows[0]?.run_id || null;
  }

  if (!effectiveRunId) {
    const quizRow = await pool.query(`SELECT name FROM quizzes WHERE id = $1`, [
      quizDbId,
    ]);
    return {
      rows: [],
      quizName: quizRow.rows[0]?.name || null,
      runId: null,
    };
  }

  const res = await pool.query(
    `SELECT a.id, a.quiz_id, a.run_id, q.name AS quiz_name, a.player_name,
            a.status, a.correct_count, a.answered_count, a.total_questions,
            a.started_at, a.completed_at, a.elapsed_ms, a.updated_at
     FROM quiz_attempts a
     INNER JOIN quizzes q ON q.id = a.quiz_id
     WHERE a.quiz_id = $1 AND a.run_id = $2
     ORDER BY a.correct_count DESC,
              CASE WHEN a.status = 'completed' THEN 0 ELSE 1 END ASC,
              a.elapsed_ms ASC NULLS LAST,
              lower(a.player_name) ASC,
              a.id ASC
     LIMIT $3`,
    [quizDbId, effectiveRunId, limit],
  );

  return {
    rows: res.rows.map((row, idx) => mapAttemptRow(row, idx + 1)),
    quizName: res.rows[0]?.quiz_name || null,
    runId: effectiveRunId,
  };
}

function buildResultsWorkbook(rows) {
  const sheetRows = rows.map((r) => ({
    "Место": r.rank,
    "Игрок": r.playerName || r.name || "",
    "Правильно": r.correctCount ?? 0,
    "Отвечено": r.answeredCount ?? 0,
    "Всего вопросов": r.totalQuestions ?? 0,
    "Время выполнения": formatDurationMs(r.elapsedMs),
    "Статус": r.status || "",
    "Дата старта": toIsoOrEmpty(r.startedAt),
    "Дата завершения": toIsoOrEmpty(r.completedAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(sheetRows);
  worksheet["!cols"] = [
    { wch: 8 },
    { wch: 32 },
    { wch: 12 },
    { wch: 10 },
    { wch: 15 },
    { wch: 18 },
    { wch: 15 },
    { wch: 24 },
    { wch: 24 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Результаты");
  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
}

/**
 * Сохранить итог прохождения викторины (только для викторин из БД).
 */
async function saveQuizResultToDb(quiz, player, payload) {
  if (!pool || !quiz?.dbId) return;
  try {
    await pool.query(
      `INSERT INTO quiz_results
        (quiz_id, player_name, score, total_questions, answered_count, percentage)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        quiz.dbId,
        player.name,
        payload.score,
        payload.totalQuestions,
        payload.answeredCount,
        payload.percentage,
      ],
    );
  } catch (err) {
    console.error("Ошибка сохранения результата квиза в БД:", err.message);
  }
}

/**
 * Найти отключённого игрока по имени
 * @returns {[string, object]|undefined}
 */
function findDisconnectedPlayerByName(name) {
  return Object.entries(players).find(
    ([id, p]) => p.name === name && p.disconnected,
  );
}

/**
 * Отправить восстановленному игроку его текущее состояние
 */
function sendRestoredPlayerState(socketId, player, quizId, quiz) {
  if (!quizId || !quiz) return;

  if (player.currentQuestion) {
    // Игрок был на вопросе — отправляем его обратно
    const question = quiz.questions[player.currentQuestion.originalIndex];
    const timeLimit = question.timeLimit || QUESTION_TIME;
    let timeLeft = timeLimit;
    if (player.questionStartTime) {
      const elapsed = (Date.now() - player.questionStartTime) / 1000;
      timeLeft = Math.max(0, Math.ceil(timeLimit - elapsed));
    }
    io.to(socketId).emit("new-question", {
      questionIndex: player.currentQuestion.questionNumber,
      totalQuestions: quiz.questions.length,
      text: question.text,
      type: question.type,
      options: getQuestionDisplayOptions(
        player,
        question,
        player.currentQuestion.originalIndex,
      ),
      image: question.image,
      timeLeft: timeLeft,
    });
  } else if (player.answeredQuestions.length > 0) {
    // Игрок уже ответил на вопросы
    if (player.answeredQuestions.length >= quiz.questions.length) {
      io.to(socketId).emit("player-quiz-ended", {
        correctCount: player.correctCount || 0,
        totalQuestions: quiz.questions.length,
        answeredCount: player.answeredQuestions.length,
        percentage: Math.round(
          ((player.correctCount || 0) / quiz.questions.length) * 100,
        ),
      });
    }
    // Иначе — игрок на экране ожидания, ничего не отправляем
  } else if (quizStarted) {
    // Игрок был в игре но ещё не получил вопрос
    io.to(socketId).emit("quiz-ready", {
      quizId,
      name: quiz.name,
      questionsCount: quiz.questions.length,
    });
  }
}

io.on("connection", (socket) => {
  console.log("Подключился клиент:", socket.id);

  // === АДМИН ===

  socket.on("admin-login", (data, callback) => {
    if (!checkSocketRateLimit(socket)) return;
    const tokenSession = restoreAdminSession(socket, data?.token);
    if (tokenSession) {
      callback({
        success: true,
        token: tokenSession.token,
        expiresAt: tokenSession.expiresAt,
      });
      return;
    }

    const login = sanitizeInput(data?.login, 100);
    const password = data?.password; // не санитизируем пароль
    if (
      login === ADMIN_CREDENTIALS.login &&
      password === ADMIN_CREDENTIALS.password
    ) {
      const session = createAdminSession(socket);
      callback({
        success: true,
        token: session.token,
        expiresAt: session.expiresAt,
      });
      console.log("Админ авторизован");
    } else {
      callback({ success: false, error: "Неверный логин или пароль" });
    }
  });

  socket.on("admin-logout", (callback) => {
    clearAdminSession(socket);
    if (typeof callback === "function") callback({ success: true });
  });

  socket.on("get-quizzes", () => {
    if (!ensureAdminSession(socket)) return;
    socket.emit(
      "quizzes-list",
      quizzes.map((q) => ({
        id: q.id,
        name: q.name,
        questionsCount: q.questions.length,
      })),
    );
  });

  // Создать викторину
  socket.on("create-quiz", async (data) => {
    if (!checkSocketRateLimit(socket)) return;
    if (!ensureAdminSession(socket)) return;

    const quizName = sanitizeInput(data?.name, 200) || "Новая викторина";

    if (pool) {
      try {
        const result = await pool.query(
          "INSERT INTO quizzes (name) VALUES ($1) RETURNING id",
          [quizName],
        );
        const newQuiz = {
          id: `db-${result.rows[0].id}`,
          dbId: result.rows[0].id,
          name: quizName,
          questions: [],
        };
        quizzes.push(newQuiz);
        socket.emit("quiz-created", { id: newQuiz.id, name: newQuiz.name });
        socket.emit(
          "quizzes-list",
          quizzes.map((q) => ({
            id: q.id,
            name: q.name,
            questionsCount: q.questions.length,
          })),
        );
      } catch (err) {
        console.error("Ошибка создания викторины:", err.message);
      }
    } else {
      const newQuiz = {
        id: "quiz-" + Date.now(),
        name: quizName,
        questions: [],
      };
      quizzes.push(newQuiz);
      socket.emit("quiz-created", { id: newQuiz.id, name: newQuiz.name });
      socket.emit(
        "quizzes-list",
        quizzes.map((q) => ({
          id: q.id,
          name: q.name,
          questionsCount: q.questions.length,
        })),
      );
    }
  });

  // Добавить вопрос
  socket.on("add-question", async (data) => {
    if (!ensureAdminSession(socket)) return;

    const quiz = quizzes.find((q) => q.id === data.quizId);
    if (!quiz) return;

    // Проверка: если работаем с БД, но у викторины нет dbId — ошибка
    if (pool && !quiz.dbId) {
      console.error("Ошибка: викторина создана в RAM режиме, но БД подключена");
      socket.emit("question-error", {
        error:
          "Викторина не сохранена в БД. Пересоздайте её после подключения к БД.",
      });
      return;
    }

    // Sanitize text and options
    const sanitizedText = sanitizeInput(data.text || "", 2000);
    const sanitizedOptions = Array.isArray(data.options)
      ? data.options.map((opt) => {
          // Поддержка как строк так и объектов {text, image}
          if (typeof opt === "object" && opt !== null) {
            return {
              text: sanitizeInput(opt.text || "", 500),
              image: typeof opt.image === "string" ? opt.image : null,
            };
          }
          return typeof opt === "string" ? sanitizeInput(opt, 500) : opt;
        })
      : data.options;

    const questionData = {
      text: sanitizedText,
      type: data.type || "multiple_choice",
      options: sanitizedOptions,
      correct: data.correct,
      image: data.image || null,
      timeLimit: data.timeLimit || QUESTION_TIME,
    };

    if (pool && quiz.dbId) {
      try {
        const orderIndex = quiz.questions.length;
        const inserted = await pool.query(
          "INSERT INTO questions (quiz_id, text, type, options, correct, image, time_limit, order_index) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
          [
            quiz.dbId,
            sanitizedText,
            data.type || "multiple_choice",
            JSON.stringify(sanitizedOptions),
            JSON.stringify(data.correct),
            data.image || null,
            data.timeLimit || QUESTION_TIME,
            orderIndex,
          ],
        );
        questionData.id = inserted.rows[0]?.id;
        questionData.orderIndex = orderIndex;
      } catch (err) {
        console.error("Ошибка добавления вопроса:", err.message);
        socket.emit("question-error", {
          error: "Ошибка сохранения в БД: " + err.message,
        });
        return;
      }
    }

    quiz.questions.push(questionData);
    socket.emit("question-added", {
      quizId: quiz.id,
      questionIndex: quiz.questions.length - 1,
    });
    socket.emit(
      "quizzes-list",
      quizzes.map((q) => ({
        id: q.id,
        name: q.name,
        questionsCount: q.questions.length,
      })),
    );
  });

  // Удалить вопрос
  socket.on("delete-question", async (data) => {
    if (!ensureAdminSession(socket)) return;

    const quiz = quizzes.find((q) => q.id === data.quizId);
    if (!quiz || !quiz.questions[data.questionIndex]) return;

    if (pool && quiz.dbId) {
      const q = quiz.questions[data.questionIndex];
      if (q.id) {
        try {
          await pool.query("DELETE FROM questions WHERE id = $1", [q.id]);
        } catch (err) {
          console.error("Ошибка удаления вопроса из БД:", err.message);
        }
      }
    }

    quiz.questions.splice(data.questionIndex, 1);
    socket.emit(
      "quizzes-list",
      quizzes.map((q) => ({
        id: q.id,
        name: q.name,
        questionsCount: q.questions.length,
      })),
    );
    socket.emit("quiz-updated", { quizId: quiz.id, questions: quiz.questions });
  });

  // Обновить вопрос
  socket.on("update-question", async (data) => {
    if (!ensureAdminSession(socket)) return;

    const quiz = quizzes.find((q) => q.id === data.quizId);
    if (!quiz || !quiz.questions[data.questionIndex]) return;

    // Sanitize text and options
    const sanitizedText = sanitizeInput(data.text || "", 2000);
    const sanitizedOptions = Array.isArray(data.options)
      ? data.options.map((opt) => {
          // Поддержка как строк так и объектов {text, image}
          if (typeof opt === "object" && opt !== null) {
            return {
              text: sanitizeInput(opt.text || "", 500),
              image: typeof opt.image === "string" ? opt.image : null,
            };
          }
          return typeof opt === "string" ? sanitizeInput(opt, 500) : opt;
        })
      : data.options;

    const questionData = {
      id: quiz.questions[data.questionIndex].id,
      text: sanitizedText,
      type: data.type || "multiple_choice",
      options: sanitizedOptions,
      correct: data.correct,
      image: data.image || null,
      timeLimit: data.timeLimit || QUESTION_TIME,
      answerType: data.answerType || "single",
      orderIndex: quiz.questions[data.questionIndex].orderIndex,
    };

    if (pool && quiz.dbId) {
      const q = quiz.questions[data.questionIndex];
      try {
        if (q.id) {
          await pool.query(
            "UPDATE questions SET text = $1, type = $2, options = $3, correct = $4, image = $5, time_limit = $6 WHERE id = $7",
            [
              sanitizedText,
              data.type || "multiple_choice",
              JSON.stringify(sanitizedOptions),
              JSON.stringify(data.correct),
              data.image || null,
              data.timeLimit || QUESTION_TIME,
              q.id,
            ],
          );
        }
      } catch (err) {
        console.error("Ошибка обновления вопроса:", err.message);
      }
    }

    quiz.questions[data.questionIndex] = questionData;
    socket.emit("question-updated", {
      quizId: quiz.id,
      questionIndex: data.questionIndex,
    });
    socket.emit(
      "quizzes-list",
      quizzes.map((q) => ({
        id: q.id,
        name: q.name,
        questionsCount: q.questions.length,
      })),
    );
  });

  // Удалить викторину
  socket.on("delete-quiz", async (quizId) => {
    if (!ensureAdminSession(socket)) return;

    const quizIndex = quizzes.findIndex((q) => q.id === quizId);
    if (quizIndex === -1) return;

    const quiz = quizzes[quizIndex];

    if (pool && quiz.dbId) {
      await pool.query("DELETE FROM quizzes WHERE id = $1", [quiz.dbId]);
    }

    quizzes.splice(quizIndex, 1);
    socket.emit(
      "quizzes-list",
      quizzes.map((q) => ({
        id: q.id,
        name: q.name,
        questionsCount: q.questions.length,
      })),
    );
  });

  // Выбрать викторину
  socket.on("select-quiz", (quizId) => {
    if (!ensureAdminSession(socket)) return;

    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) return;

    currentQuizId = quizId;
    quizStarted = false;
    quizFinished = false;
    currentRunId = null;

    for (const id in players) {
      initPlayerQuestions(id, quiz);
    }

    broadcastLeaderboard();
    io.emit("quiz-ready", {
      quizId,
      name: quiz.name,
      questionsCount: quiz.questions.length,
    });
    console.log(`Выбрана викторина: ${quiz.name}`);
  });

  // Остановка викторины
  socket.on("stop-quiz", async () => {
    if (!ensureAdminSession(socket)) return;

    await Promise.all(
      Object.values(players).map((player) => markAttemptStatus(player, "stopped")),
    );

    // Сбрасываем состояние
    currentQuizId = null;
    currentRunId = null;
    quizStarted = false;
    quizFinished = false;

    // Очищаем игроков
    for (const id in players) {
      delete players[id];
    }

    console.log("Викторина остановлена");
    io.emit("quiz-stopped");
  });

  // Перезапуск викторины (даже если есть игроки)
  socket.on("restart-quiz", async () => {
    if (!ensureAdminSession(socket)) return;
    if (!currentQuizId) return;

    const quiz = quizzes.find((q) => q.id === currentQuizId);
    if (!quiz) return;

    await Promise.all(
      Object.values(players).map((player) => markAttemptStatus(player, "stopped")),
    );

    quizStarted = false;
    quizFinished = false;
    currentRunId = null;

    // Сброс всех игроков
    for (const id in players) {
      initPlayerQuestions(id, quiz);
    }

    broadcastLeaderboard();
    io.emit("quiz-restarted", {
      quizId: currentQuizId,
      name: quiz.name,
      questionsCount: quiz.questions.length,
    });
    console.log(`Викторина перезапущена: ${quiz.name}`);
  });

  socket.on("get-quiz-questions", (quizId) => {
    if (!ensureAdminSession(socket)) return;
    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) return;
    socket.emit("quiz-questions", { quizId, questions: quiz.questions });
  });

  // Получить текущее состояние игры
  socket.on("get-game-state", () => {
    if (!ensureAdminSession(socket)) return;

    let gameState = {
      currentQuizId: currentQuizId,
      quizStarted: quizStarted,
      quizFinished: quizFinished,
      quizName: null,
      questionsCount: 0,
      runId: currentRunId,
    };

    if (currentQuizId) {
      const quiz = quizzes.find((q) => q.id === currentQuizId);
      if (quiz) {
        gameState.quizName = quiz.name;
        gameState.questionsCount = quiz.questions.length;
      }
    }

    socket.emit("game-state", gameState);

    // Отправляем текущий лидерборд и количество игроков онлайн
    const leaderboard = getLeaderboard();
    socket.emit("update-leaderboard", leaderboard);
    socket.emit("live-standings", leaderboard);

    // Считаем только онлайн игроков (не отключившихся)
    const onlineCount = Object.values(players).filter(
      (p) => !p.disconnected,
    ).length;
    socket.emit("players-count", { count: onlineCount });
  });

  socket.on("get-live-standings", () => {
    if (!ensureAdminSession(socket)) return;
    socket.emit("live-standings", getLeaderboard());
  });

  socket.on("download-results-xlsx", async (payload) => {
    if (!checkSocketRateLimit(socket)) return;
    if (!ensureAdminSession(socket)) return;

    const raw =
      payload != null && typeof payload === "object" && !Array.isArray(payload)
        ? payload
        : {};
    const quizDbId = Number(raw.quizDbId);
    const runId =
      typeof raw.runId === "string" && raw.runId.trim()
        ? raw.runId.trim()
        : null;

    if (!pool) {
      socket.emit("quiz-results-xlsx", {
        error: "База данных не подключена.",
      });
      return;
    }

    if (!Number.isFinite(quizDbId) || quizDbId <= 0) {
      socket.emit("quiz-results-xlsx", {
        error: "Некорректный идентификатор викторины.",
      });
      return;
    }

    try {
      const data = await getAttemptStandingsFromDb({ quizDbId, runId });
      if (data.rows.length === 0) {
        socket.emit("quiz-results-xlsx", {
          error: "Нет данных для выгрузки.",
        });
        return;
      }

      const buffer = buildResultsWorkbook(data.rows);
      const stamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      const label = sanitizeFilenamePart(data.quizName || `quiz_${quizDbId}`);
      socket.emit("quiz-results-xlsx", {
        filename: `results_${label}_${stamp}.xlsx`,
        base64: buffer.toString("base64"),
      });
    } catch (err) {
      console.error("Ошибка XLSX-выгрузки:", err.message);
      socket.emit("quiz-results-xlsx", {
        error: "Не удалось сформировать XLSX: " + err.message,
      });
    }
  });

  // История результатов (live-таблица quiz_attempts)
  socket.on("get-results-quizzes", async () => {
    if (!checkSocketRateLimit(socket)) return;
    if (!ensureAdminSession(socket)) return;

    if (!pool) {
      socket.emit("results-quizzes", {
        error:
          "База данных не подключена — результаты не сохраняются и не отображаются.",
        quizzes: [],
      });
      return;
    }

    try {
      const res = await pool.query(
        `SELECT a.quiz_id, a.run_id, q.name AS quiz_name,
                COUNT(*)::int AS attempts,
                MIN(a.started_at) AS started_at,
                MAX(COALESCE(a.completed_at, a.updated_at, a.started_at)) AS last_finished_at
         FROM quiz_attempts a
         INNER JOIN quizzes q ON q.id = a.quiz_id
         GROUP BY a.quiz_id, a.run_id, q.name
         ORDER BY started_at DESC
         LIMIT 200`,
      );

      socket.emit("results-quizzes", {
        quizzes: res.rows.map((row) => ({
          quizDbId: Number(row.quiz_id),
          runId: row.run_id,
          quizName: row.quiz_name,
          attempts: Number(row.attempts || 0),
          startedAt: row.started_at,
          lastFinishedAt: row.last_finished_at,
        })),
      });
    } catch (err) {
      console.error("Ошибка загрузки списка викторин с результатами:", err.message);
      socket.emit("results-quizzes", {
        error: "Не удалось загрузить список: " + err.message,
        quizzes: [],
      });
    }
  });

  socket.on("get-quiz-results-by-db", async (payload) => {
    if (!checkSocketRateLimit(socket)) return;
    if (!ensureAdminSession(socket)) return;

    const raw =
      payload != null && typeof payload === "object" && !Array.isArray(payload)
        ? payload
        : {};
    const quizDbId = Number(raw.quizDbId);
    const runId =
      typeof raw.runId === "string" && raw.runId.trim()
        ? raw.runId.trim()
        : null;

    if (!pool) {
      socket.emit("quiz-results", {
        error:
          "База данных не подключена — результаты не сохраняются и не отображаются.",
        results: [],
        mode: "quiz",
        quizDbId: Number.isFinite(quizDbId) ? quizDbId : null,
      });
      return;
    }

    if (!Number.isFinite(quizDbId) || quizDbId <= 0) {
      socket.emit("quiz-results", {
        error: "Некорректный идентификатор викторины.",
        results: [],
        mode: "quiz",
        quizDbId: null,
      });
      return;
    }

    try {
      const standings = await getAttemptStandingsFromDb({ quizDbId, runId });

      socket.emit("quiz-results", {
        results: standings.rows,
        mode: "quiz",
        quizDbId,
        runId: standings.runId,
        quizName: standings.quizName,
      });
    } catch (err) {
      console.error("Ошибка загрузки результатов викторины:", err.message);
      socket.emit("quiz-results", {
        error: "Не удалось загрузить результаты: " + err.message,
        results: [],
        mode: "quiz",
        quizDbId,
        runId,
      });
    }
  });

  socket.on("delete-quiz-results-by-db", async (payload) => {
    if (!checkSocketRateLimit(socket)) return;
    if (!ensureAdminSession(socket)) return;

    const raw =
      payload != null && typeof payload === "object" && !Array.isArray(payload)
        ? payload
        : {};
    const quizDbId = Number(raw.quizDbId);
    const runId =
      typeof raw.runId === "string" && raw.runId.trim()
        ? raw.runId.trim()
        : null;

    if (!pool) {
      socket.emit("quiz-results-deleted", {
        error: "База данных не подключена.",
      });
      return;
    }

    if (!Number.isFinite(quizDbId) || quizDbId <= 0) {
      socket.emit("quiz-results-deleted", {
        error: "Некорректный идентификатор викторины.",
      });
      return;
    }

    try {
      const del = runId
        ? await pool.query(
            `DELETE FROM quiz_attempts WHERE quiz_id = $1 AND run_id = $2`,
            [quizDbId, runId],
          )
        : await pool.query(`DELETE FROM quiz_attempts WHERE quiz_id = $1`, [
            quizDbId,
          ]);
      socket.emit("quiz-results-deleted", {
        quizDbId,
        runId,
        deletedCount: del.rowCount || 0,
        message: `Удалено прохождений: ${del.rowCount || 0}`,
      });
    } catch (err) {
      console.error("Ошибка удаления результатов:", err.message);
      socket.emit("quiz-results-deleted", {
        error: "Не удалось удалить результаты: " + err.message,
      });
    }
  });

  socket.on("get-quiz-results", async (payload) => {
    if (!checkSocketRateLimit(socket)) return;
    if (!ensureAdminSession(socket)) return;

    const raw =
      payload != null && typeof payload === "object" && !Array.isArray(payload)
        ? payload
        : {};
    const quizId =
      raw.quizId !== undefined && raw.quizId !== null
        ? String(raw.quizId)
        : typeof payload === "string"
          ? payload
          : "";

    if (!pool) {
      socket.emit("quiz-results", {
        error:
          "База данных не подключена — результаты не сохраняются и не отображаются.",
        results: [],
        mode: quizId ? "quiz" : "all",
        quizId: quizId || null,
      });
      return;
    }

    try {
      if (!quizId) {
        const res = await pool.query(
          `SELECT a.id, a.quiz_id, a.run_id, q.name AS quiz_name, a.player_name,
                  a.status, a.correct_count, a.answered_count, a.total_questions,
                  a.started_at, a.completed_at, a.elapsed_ms, a.updated_at
           FROM quiz_attempts a
           INNER JOIN quizzes q ON q.id = a.quiz_id
           ORDER BY a.started_at DESC, a.id DESC
           LIMIT 200`,
        );
        socket.emit("quiz-results", {
          results: res.rows.map((row, idx) => mapAttemptRow(row, idx + 1)),
          mode: "all",
          quizId: null,
        });
        return;
      }

      const quiz = quizzes.find((q) => q.id === quizId);
      if (!quiz || !quiz.dbId) {
        socket.emit("quiz-results", {
          error: quiz
            ? "Для этой викторины нет истории в базе (создана без БД)."
            : "Викторина не найдена.",
          results: [],
          mode: "quiz",
          quizId,
        });
        return;
      }

      const standings = await getAttemptStandingsFromDb({ quizDbId: quiz.dbId });
      socket.emit("quiz-results", {
        results: standings.rows,
        mode: "quiz",
        quizId,
        runId: standings.runId,
        quizName: quiz.name,
      });
    } catch (err) {
      console.error("Ошибка загрузки результатов:", err.message);
      socket.emit("quiz-results", {
        error: "Не удалось загрузить результаты: " + err.message,
        results: [],
        mode: quizId ? "quiz" : "all",
        quizId: quizId || null,
      });
    }
  });

  // Старт викторины
  socket.on("start-quiz", async () => {
    if (!ensureAdminSession(socket)) return;
    if (!currentQuizId) return;

    const quiz = quizzes.find((q) => q.id === currentQuizId);
    if (!quiz) return;

    quizStarted = true;
    quizFinished = false;
    currentRunId = generateRunId();

    for (const id in players) {
      initPlayerQuestions(id, quiz);
      players[id].startedAtMs = Date.now();
      players[id].status = "in_progress";
      await createAttemptForPlayer(id, players[id], quiz);
      sendNextQuestionToPlayer(id, quiz);
    }

    broadcastLeaderboard();
    console.log("Викторина запущена");
  });

  // === ИГРОК ===

  socket.on("register", (data) => {
    if (!checkSocketRateLimit(socket)) return;

    const rawName = typeof data === "string" ? data : data.name;
    const name = sanitizeInput(rawName, 500);
    const savedId = typeof data === "object" ? data.savedId : null;

    if (!name) {
      socket.emit("registered", {
        playerId: null,
        name: "",
        error: "Имя не может быть пустым",
      });
      return;
    }

    // Если есть сохранённый ID, пытаемся восстановить игрока (даже если викторина запущена)
    if (savedId) {
      if (players[savedId]) {
        // Игрок найден по старому socket.id
        const player = players[savedId];
        players[socket.id] = player;
        player.disconnected = false;
        if (quizStarted && player.attemptDbId) {
          void markAttemptStatus(player, "in_progress");
        }
        delete players[savedId];

        console.log(
          `[Session] Игрок восстановлен по ID: ${player.name} (${savedId} → ${socket.id})`,
        );
        socket.emit("registered", {
          playerId: socket.id,
          name: player.name,
          restored: true,
        });

        const quiz = quizzes.find((q) => q.id === currentQuizId);
        sendRestoredPlayerState(socket.id, player, currentQuizId, quiz);
        broadcastLeaderboard();
        return;
      }

      // Fallback: ищем игрока по имени среди отключённых
      const disconnectedPlayer = findDisconnectedPlayerByName(name);
      if (disconnectedPlayer) {
        const [oldId, player] = disconnectedPlayer;
        players[socket.id] = player;
        player.disconnected = false;
        if (quizStarted && player.attemptDbId) {
          void markAttemptStatus(player, "in_progress");
        }
        delete players[oldId];

        console.log(
          `[Session] Игрок восстановлен по имени: ${player.name} (${oldId} → ${socket.id})`,
        );
        socket.emit("registered", {
          playerId: socket.id,
          name: player.name,
          restored: true,
        });

        const quiz = quizzes.find((q) => q.id === currentQuizId);
        sendRestoredPlayerState(socket.id, player, currentQuizId, quiz);
        broadcastLeaderboard();
        return;
      }

      // Игрок не найден — сессия устарела
      console.log(`[Session] Сессия игрока не найдена: ${savedId}, имя: ${name}`);
      socket.emit("session-not-found");
      return;
    }

    // Проверяем, есть ли игрок с таким именем (переподключение после отключения без savedId)
    const existingPlayer = findDisconnectedPlayerByName(name);

    if (existingPlayer) {
      const [oldId, player] = existingPlayer;
      // Перепривязываем к новому сокету
      players[socket.id] = player;
      player.disconnected = false;
      if (quizStarted && player.attemptDbId) {
        void markAttemptStatus(player, "in_progress");
      }
      delete players[oldId];

      console.log(
        `[Session] Игрок переподключён по имени: ${player.name} (${oldId} → ${socket.id})`,
      );
      socket.emit("registered", {
        playerId: socket.id,
        name: player.name,
        restored: true,
      });

      const quiz = quizzes.find((q) => q.id === currentQuizId);
      sendRestoredPlayerState(socket.id, player, currentQuizId, quiz);
      broadcastLeaderboard();
      return;
    }

    // Для новых игроков — блокировка если викторина запущена
    if (quizStarted) {
      socket.emit("quiz-already-started");
      return;
    }

    // Новый игрок
    players[socket.id] = createPlayerState(name, socket.id);
    console.log(`Игрок зарегистрирован: ${name}`);
    socket.emit("registered", { playerId: socket.id, name, restored: false });

    if (currentQuizId) {
      const quiz = quizzes.find((q) => q.id === currentQuizId);
      if (quiz) initPlayerQuestions(socket.id, quiz);
    }

    broadcastLeaderboard();
  });

  socket.on("submit-answer", async (answerData) => {
    const player = players[socket.id];
    if (!player || !currentQuizId) return;
    if (!player.currentQuestion) return;
    if (player.answeredQuestions.includes(player.currentQuestion.originalIndex))
      return;
    // Deduplication guard to prevent race conditions (submit-answer + time-up)
    if (player.isProcessingAnswer) return;
    player.isProcessingAnswer = true;

    const quiz = quizzes.find((q) => q.id === currentQuizId);
    if (!quiz) {
      player.isProcessingAnswer = false;
      return;
    }

    const originalQuestionIndex = player.currentQuestion.originalIndex;
    const question = quiz.questions[originalQuestionIndex];
    const timeLimitSec = question.timeLimit || QUESTION_TIME;
    const elapsedSec =
      player.questionStartTime != null
        ? (Date.now() - player.questionStartTime) / 1000
        : 0;
    const elapsedMs = elapsedSec * 1000;
    // Небольшой запас на сетевую задержку/таймер клиента
    const graceSec = 0.75;
    if (elapsedSec > timeLimitSec + graceSec) {
      player.answeredQuestions.push(originalQuestionIndex);
      await createAttemptForPlayer(socket.id, player, quiz);
      await recordAttemptAnswer({
        quiz,
        player,
        question,
        questionIndex: originalQuestionIndex,
        answerPayload: { type: "time_up", answer: null },
        pointsEarned: 0,
        elapsedMs,
      });
      player.isProcessingAnswer = false;
      broadcastLeaderboard();
      setTimeout(() => {
        sendNextQuestionToPlayer(socket.id, quiz);
      }, 500);
      return;
    }

    // Подсчёт баллов: максимум 1 балл за вопрос
    let pointsEarned = 0;
    const qType = question.type;
    let answerPayload = { type: qType, answer: answerData };

    if (qType === "ordering") {
      if (
        typeof answerData === "object" &&
        answerData !== null &&
        answerData.type === "ordering"
      ) {
        const userOrder = answerData.answer;
        answerPayload = { type: "ordering", answer: userOrder };
        const expected = question.correct;
        const n = Array.isArray(expected) ? expected.length : 0;
        const isValid =
          Array.isArray(userOrder) &&
          userOrder.length === n &&
          userOrder.every((x) => Number.isInteger(x)) &&
          new Set(userOrder).size === n &&
          userOrder.every((x) => x >= 0 && x < n);
        const isCorrect =
          isValid &&
          JSON.stringify(userOrder) === JSON.stringify(expected);
        pointsEarned = isCorrect ? 1 : 0;
      }
    } else if (qType === "matching") {
      if (
        typeof answerData === "object" &&
        answerData !== null &&
        answerData.type === "matching"
      ) {
        const pairs = answerData.pairs;
        answerPayload = { type: "matching", pairs };
        if (!Array.isArray(pairs)) {
          pointsEarned = 0;
        } else {
          const n = Array.isArray(question.options)
            ? question.options.length
            : 0;
          const expectedLen = Array.isArray(question.correct)
            ? question.correct.length
            : 0;
          if (n < 2 || expectedLen !== n || pairs.length !== n) {
            pointsEarned = 0;
          } else {
            const qIdx = new Set();
            const aIdx = new Set();
            let validShape = true;
            for (const p of pairs) {
              if (!p || typeof p !== "object") {
                validShape = false;
                break;
              }
              const qi = Number(p.questionIndex);
              const ai = Number(p.answerIndex);
              if (
                !Number.isInteger(qi) ||
                !Number.isInteger(ai) ||
                qi < 0 ||
                qi >= n ||
                ai < 0 ||
                ai >= n
              ) {
                validShape = false;
                break;
              }
              if (qIdx.has(qi) || aIdx.has(ai)) {
                validShape = false;
                break;
              }
              qIdx.add(qi);
              aIdx.add(ai);
            }
            const isFullyCorrect =
              validShape &&
              pairs.every((p) => p.questionIndex === p.answerIndex);
            pointsEarned = isFullyCorrect ? 1 : 0;
          }
        }
      }
    } else if (
      qType === "fill_blank" ||
      qType === "open_ended" ||
      qType === "text"
    ) {
      if (
        typeof answerData === "object" &&
        answerData !== null &&
        answerData.type === "text"
      ) {
        const userAnswer = sanitizeInput(answerData.answer, 500)
          .toLowerCase()
          .trim();
        answerPayload = {
          type: "text",
          answer: sanitizeInput(answerData.answer, 500),
        };
        const correctOption = question.options[0];
        const correctAnswer =
          typeof correctOption === "object"
            ? correctOption.text || ""
            : correctOption || "";
        pointsEarned =
          userAnswer === correctAnswer.toLowerCase().trim() ? 1 : 0;
      }
    } else if (qType === "multiple_choice" || qType === "true_false") {
      const correctAnswers = question.correct || [];
      const displayToOriginal =
        qType === "multiple_choice" && Array.isArray(player.answerOptionMaps?.[originalQuestionIndex])
          ? player.answerOptionMaps[originalQuestionIndex]
          : Array.isArray(question.options)
            ? question.options.map((_, index) => index)
            : [];
      const optCount = displayToOriginal.length;

      if (Array.isArray(answerData)) {
        if (correctAnswers.length <= 1) {
          pointsEarned = 0;
        } else {
          const displayedAnswers = answerData;
          const validIndices =
            displayedAnswers.every(
              (a) => Number.isInteger(a) && a >= 0 && a < optCount,
            ) && new Set(displayedAnswers).size === displayedAnswers.length;
          const userAnswers = validIndices
            ? displayedAnswers.map((idx) => displayToOriginal[idx])
            : [];
          answerPayload = {
            type: qType,
            displayedAnswer: displayedAnswers,
            originalAnswer: userAnswers,
          };

          if (!validIndices || correctAnswers.length === 0) {
            pointsEarned = 0;
          } else {
            const correctSelected = userAnswers.filter((a) =>
              correctAnswers.includes(a),
            ).length;
            const incorrectSelected = userAnswers.filter(
              (a) => !correctAnswers.includes(a),
            ).length;
            const rawPoints =
              correctSelected / correctAnswers.length -
              incorrectSelected / (question.options?.length || 1);
            pointsEarned = Math.max(0, Math.min(1, rawPoints));
          }
        }
      } else {
        const displayedIdx = Number(answerData);
        const idx =
          Number.isInteger(displayedIdx) &&
          displayedIdx >= 0 &&
          displayedIdx < optCount
            ? displayToOriginal[displayedIdx]
            : NaN;
        answerPayload = {
          type: qType,
          displayedAnswer: Number.isInteger(displayedIdx)
            ? displayedIdx
            : answerData,
          originalAnswer: idx,
        };
        if (
          Number.isInteger(idx) &&
          correctAnswers.length <= 1
        ) {
          pointsEarned = question.correct.includes(idx) ? 1 : 0;
        } else {
          pointsEarned = 0;
        }
      }
    }

    // Начисляем баллы (максимум 1 за вопрос)
    player.score += pointsEarned;
    const isFullyCorrect = pointsEarned >= 1;
    if (isFullyCorrect) {
      player.correctCount = (player.correctCount || 0) + 1;
    }

    if (isFullyCorrect) {
      console.log(
        `Игрок ${player.name} ответил правильно!`,
      );
    }

    player.answeredQuestions.push(originalQuestionIndex);
    await createAttemptForPlayer(socket.id, player, quiz);
    await recordAttemptAnswer({
      quiz,
      player,
      question,
      questionIndex: originalQuestionIndex,
      answerPayload,
      pointsEarned,
      elapsedMs,
    });
    player.isProcessingAnswer = false; // Reset guard
    broadcastLeaderboard();

    setTimeout(() => {
      sendNextQuestionToPlayer(socket.id, quiz);
    }, 500);
  });

  socket.on("get-next-question", () => {
    const player = players[socket.id];
    if (!player || !currentQuizId) return;
    const quiz = quizzes.find((q) => q.id === currentQuizId);
    if (!quiz) return;
    sendNextQuestionToPlayer(socket.id, quiz);
  });

  socket.on("time-up", async () => {
    const player = players[socket.id];
    if (!player || !currentQuizId) return;
    const quiz = quizzes.find((q) => q.id === currentQuizId);
    if (!quiz) return;
    if (player.isProcessingAnswer) return;
    if (player.currentQuestion) {
      if (
        player.answeredQuestions.includes(player.currentQuestion.originalIndex)
      ) {
        return;
      }
      const question = quiz.questions[player.currentQuestion.originalIndex];
      const timeLimitSec = question.timeLimit || QUESTION_TIME;
      const elapsedSec =
        player.questionStartTime != null
          ? (Date.now() - player.questionStartTime) / 1000
          : 0;
      const graceSec = 0.75;
      if (elapsedSec + graceSec < timeLimitSec) {
        return;
      }
      const originalQuestionIndex = player.currentQuestion.originalIndex;
      player.answeredQuestions.push(originalQuestionIndex);
      await createAttemptForPlayer(socket.id, player, quiz);
      await recordAttemptAnswer({
        quiz,
        player,
        question,
        questionIndex: originalQuestionIndex,
        answerPayload: { type: "time_up", answer: null },
        pointsEarned: 0,
        elapsedMs: elapsedSec * 1000,
      });
      broadcastLeaderboard();
    }
    sendNextQuestionToPlayer(socket.id, quiz);
  });

  socket.on("disconnect", () => {
    const player = players[socket.id];
    if (player) {
      console.log(`Игрок отключился: ${player.name}`);
      // Помечаем как отключённого, но НЕ удаляем — чтобы сохранить в рейтинге
      // и дать время на восстановление сессии
      player.disconnected = true;
      player.lastSocketId = socket.id;
      if (quizStarted && player.status !== "completed") {
        void markAttemptStatus(player, "disconnected");
      }
      broadcastLeaderboard();

      // До старта можно чистить RAM, но после старта держим до stop/restart,
      // чтобы отключившийся игрок не пропал из live-итогов.
      setTimeout(() => {
        if (!quizStarted && player.disconnected && players[socket.id]) {
          delete players[socket.id];
          console.log(`Игрок удалён после таймаута: ${player.name}`);
          broadcastLeaderboard();
        }
      }, 60_000);
    }
    if (adminSessions[socket.id]) {
      delete adminSessions[socket.id];
      console.log("Админ отключился");
    }
    // Очистка rate limit записи
    socketRateLimit.delete(socket.id);
  });
});

function initPlayerQuestions(playerId, quiz) {
  const shuffledIndices = shuffleArray(quiz.questions.map((_, i) => i));
  players[playerId].questionsQueue = shuffledIndices;
  players[playerId].answeredQuestions = [];
  players[playerId].currentQuestion = null;
  players[playerId].score = 0;
  players[playerId].correctCount = 0;
  players[playerId].isProcessingAnswer = false;
  players[playerId].quizCompletionHandled = false;
  players[playerId].attemptDbId = null;
  players[playerId].startedAtMs = null;
  players[playerId].completedAtMs = null;
  players[playerId].elapsedMs = null;
  players[playerId].status = "waiting";
  players[playerId].answerOptionMaps = {};
}

function sendNextQuestionToPlayer(playerId, quiz) {
  const player = players[playerId];
  if (!player) return;

  const nextIndex = player.questionsQueue.find(
    (i) => !player.answeredQuestions.includes(i),
  );

  if (nextIndex === undefined) {
    if (player.quizCompletionHandled) return;
    player.quizCompletionHandled = true;

    const totalQuestions = quiz.questions.length;
    const answeredCount = player.answeredQuestions.length;
    const correctCount = player.correctCount || 0;
    const percentage =
      totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    player.status = "completed";
    player.completedAtMs = Date.now();
    player.elapsedMs = getElapsedMs(player);
    void markAttemptStatus(player, "completed");

    const endPayload = {
      correctCount,
      totalQuestions,
      answeredCount,
      percentage,
    };

    io.to(playerId).emit("player-quiz-ended", endPayload);

    // Проверка: все ли игроки завершили
    checkAllPlayersFinished(quiz);
    return;
  }

  const question = quiz.questions[nextIndex];
  player.currentQuestion = {
    originalIndex: nextIndex,
    questionNumber: player.answeredQuestions.length + 1,
  };
  player.questionStartTime = Date.now();

  io.to(playerId).emit("new-question", {
    questionIndex: player.currentQuestion.questionNumber,
    totalQuestions: quiz.questions.length,
    text: question.text,
    type: question.type,
    options: prepareQuestionDisplayOptions(player, question, nextIndex),
    image: question.image,
    timeLeft: question.timeLimit || QUESTION_TIME,
  });
}

function getLeaderboard() {
  const rows = Object.entries(players).map(([id, data]) => ({
      id,
      name: data.name,
      score: data.score,
      correctCount: data.correctCount || 0,
      answered: data.answeredQuestions.length,
      answeredCount: data.answeredQuestions.length,
      totalQuestions: data.questionsQueue.length,
      percentage:
        data.questionsQueue.length > 0
          ? Math.round(
              ((data.correctCount || 0) / data.questionsQueue.length) * 100,
            )
          : 0,
      status:
        data.disconnected && data.status !== "completed"
          ? "disconnected"
          : data.status || "waiting",
      elapsedMs: getElapsedMs(data),
    }));

  return sortStandingsRows(rows).map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

// Проверка: все ли игроки завершили викторину
function checkAllPlayersFinished(quiz) {
  const activePlayers = Object.values(players);
  if (activePlayers.length === 0) return;

  const allFinished = activePlayers.every(
    (p) =>
      p.disconnected || p.answeredQuestions.length >= quiz.questions.length,
  );

  if (allFinished && !quizFinished) {
    quizFinished = true;
    // Отправляем админу уведомление и результаты
    const leaderboard = getLeaderboard();
    io.emit("all-players-finished", {
      leaderboard,
      totalQuestions: quiz.questions.length,
      runId: currentRunId,
      quizDbId: quiz.dbId || null,
    });
    console.log("Все игроки завершили викторину!");
  }
}

// Отправить обновление рейтинга всем
function broadcastLeaderboard() {
  const leaderboard = getLeaderboard();
  io.emit("update-leaderboard", leaderboard);
  io.emit("live-standings", leaderboard);
  // Считаем только онлайн игроков (не отключившихся)
  const onlineCount = Object.values(players).filter(
    (p) => !p.disconnected,
  ).length;
  io.emit("players-count", { count: onlineCount });
}

// Инициализация и запуск
initDatabase();

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Игроки: http://localhost:${PORT}`);
  console.log(`Админ: http://localhost:${PORT}/admin.html`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Ошибка: порт ${PORT} уже занят.`);
    console.error("Решение:");
    console.error("  1. Остановите другой процесс Node.js");
    console.error(
      "  2. Или используйте другой порт: set PORT=3001 && npm start",
    );
    process.exit(1);
  } else {
    console.error("❌ Ошибка сервера:", err.message);
    process.exit(1);
  }
});
