require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Pool } = require("pg");
const rateLimit = require("express-rate-limit");
const { getPoolOptions } = require("./lib/pgPoolConfig");

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
let quizStarted = false;
let quizFinished = false;
const QUESTION_TIME = Number(process.env.QUESTION_TIME_SECONDS) || 30;
const players = {};
const adminSessions = {};

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
        player_name VARCHAR(255) NOT NULL,
        score NUMERIC(12, 6) NOT NULL,
        total_questions INTEGER NOT NULL,
        answered_count INTEGER NOT NULL,
        percentage SMALLINT,
        finished_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz_id ON quiz_results(quiz_id)`,
    );
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
      options: question.options,
      correct: question.correct,
      image: question.image,
      timeLeft: timeLeft,
    });
  } else if (player.answeredQuestions.length > 0) {
    // Игрок уже ответил на вопросы
    if (player.answeredQuestions.length >= quiz.questions.length) {
      io.to(socketId).emit("player-quiz-ended", {
        score: player.score,
        totalQuestions: quiz.questions.length,
        answeredCount: player.answeredQuestions.length,
        percentage: Math.round(
          (player.score / quiz.questions.length) * 100,
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
    const login = sanitizeInput(data.login, 100);
    const password = data.password; // не санитизируем пароль
    if (
      login === ADMIN_CREDENTIALS.login &&
      password === ADMIN_CREDENTIALS.password
    ) {
      adminSessions[socket.id] = true;
      callback({ success: true });
      console.log("Админ авторизован");
    } else {
      callback({ success: false, error: "Неверный логин или пароль" });
    }
  });

  socket.on("get-quizzes", () => {
    if (!adminSessions[socket.id]) return;
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
    if (!adminSessions[socket.id]) return;

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
    if (!adminSessions[socket.id]) return;

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
        await pool.query(
          "INSERT INTO questions (quiz_id, text, type, options, correct, image, time_limit, order_index) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
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
    if (!adminSessions[socket.id]) return;

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
    if (!adminSessions[socket.id]) return;

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
      text: sanitizedText,
      type: data.type || "multiple_choice",
      options: sanitizedOptions,
      correct: data.correct,
      image: data.image || null,
      timeLimit: data.timeLimit || QUESTION_TIME,
      answerType: data.answerType || "single",
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
    if (!adminSessions[socket.id]) return;

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
    if (!adminSessions[socket.id]) return;

    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) return;

    currentQuizId = quizId;
    quizStarted = false;

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
  socket.on("stop-quiz", () => {
    if (!adminSessions[socket.id]) return;

    // Сбрасываем состояние
    currentQuizId = null;
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
  socket.on("restart-quiz", () => {
    if (!adminSessions[socket.id]) return;
    if (!currentQuizId) return;

    const quiz = quizzes.find((q) => q.id === currentQuizId);
    if (!quiz) return;

    quizStarted = false;
    quizFinished = false;

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
    if (!adminSessions[socket.id]) return;
    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) return;
    socket.emit("quiz-questions", { quizId, questions: quiz.questions });
  });

  // Получить текущее состояние игры
  socket.on("get-game-state", () => {
    if (!adminSessions[socket.id]) return;

    let gameState = {
      currentQuizId: currentQuizId,
      quizStarted: quizStarted,
      quizFinished: quizFinished,
      quizName: null,
      questionsCount: 0,
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

    // Считаем только онлайн игроков (не отключившихся)
    const onlineCount = Object.values(players).filter(
      (p) => !p.disconnected,
    ).length;
    socket.emit("players-count", { count: onlineCount });
  });

  // История результатов (таблица quiz_results)
  socket.on("get-results-quizzes", async () => {
    if (!checkSocketRateLimit(socket)) return;
    if (!adminSessions[socket.id]) return;

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
        `SELECT r.quiz_id, q.name AS quiz_name,
                COUNT(*)::int AS attempts,
                MAX(r.finished_at) AS last_finished_at
         FROM quiz_results r
         INNER JOIN quizzes q ON q.id = r.quiz_id
         GROUP BY r.quiz_id, q.name
         ORDER BY last_finished_at DESC
         LIMIT 200`,
      );

      socket.emit("results-quizzes", {
        quizzes: res.rows.map((row) => ({
          quizDbId: Number(row.quiz_id),
          quizName: row.quiz_name,
          attempts: Number(row.attempts || 0),
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
    if (!adminSessions[socket.id]) return;

    const raw =
      payload != null && typeof payload === "object" && !Array.isArray(payload)
        ? payload
        : {};
    const quizDbId = Number(raw.quizDbId);

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
      const quizRow = await pool.query(
        `SELECT id, name FROM quizzes WHERE id = $1`,
        [quizDbId],
      );
      const quizName = quizRow.rows[0]?.name || null;

      const res = await pool.query(
        `SELECT r.id, r.player_name, r.score, r.total_questions, r.answered_count, r.percentage, r.finished_at
         FROM quiz_results r
         WHERE r.quiz_id = $1
         ORDER BY r.finished_at DESC
         LIMIT 500`,
        [quizDbId],
      );

      socket.emit("quiz-results", {
        results: res.rows.map((row) => ({
          id: row.id,
          playerName: row.player_name,
          score: Number(row.score),
          totalQuestions: row.total_questions,
          answeredCount: row.answered_count,
          percentage: row.percentage,
          finishedAt: row.finished_at,
        })),
        mode: "quiz",
        quizDbId,
        quizName,
      });
    } catch (err) {
      console.error("Ошибка загрузки результатов викторины:", err.message);
      socket.emit("quiz-results", {
        error: "Не удалось загрузить результаты: " + err.message,
        results: [],
        mode: "quiz",
        quizDbId,
      });
    }
  });

  socket.on("delete-quiz-results-by-db", async (payload) => {
    if (!checkSocketRateLimit(socket)) return;
    if (!adminSessions[socket.id]) return;

    const raw =
      payload != null && typeof payload === "object" && !Array.isArray(payload)
        ? payload
        : {};
    const quizDbId = Number(raw.quizDbId);

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
      const del = await pool.query(`DELETE FROM quiz_results WHERE quiz_id = $1`, [
        quizDbId,
      ]);
      socket.emit("quiz-results-deleted", {
        quizDbId,
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
    if (!adminSessions[socket.id]) return;

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
          `SELECT r.id, r.quiz_id, q.name AS quiz_name, r.player_name, r.score,
                  r.total_questions, r.answered_count, r.percentage, r.finished_at
           FROM quiz_results r
           INNER JOIN quizzes q ON q.id = r.quiz_id
           ORDER BY r.finished_at DESC
           LIMIT 200`,
        );
        socket.emit("quiz-results", {
          results: res.rows.map((row) => ({
            id: row.id,
            quizId: row.quiz_id,
            quizName: row.quiz_name,
            playerName: row.player_name,
            score: Number(row.score),
            totalQuestions: row.total_questions,
            answeredCount: row.answered_count,
            percentage: row.percentage,
            finishedAt: row.finished_at,
          })),
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

      const res = await pool.query(
        `SELECT r.id, r.player_name, r.score, r.total_questions, r.answered_count, r.percentage, r.finished_at
         FROM quiz_results r
         WHERE r.quiz_id = $1
         ORDER BY r.finished_at DESC
         LIMIT 500`,
        [quiz.dbId],
      );
      socket.emit("quiz-results", {
        results: res.rows.map((row) => ({
          id: row.id,
          playerName: row.player_name,
          score: Number(row.score),
          totalQuestions: row.total_questions,
          answeredCount: row.answered_count,
          percentage: row.percentage,
          finishedAt: row.finished_at,
        })),
        mode: "quiz",
        quizId,
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
  socket.on("start-quiz", () => {
    if (!adminSessions[socket.id]) return;
    if (!currentQuizId) return;

    const quiz = quizzes.find((q) => q.id === currentQuizId);
    if (!quiz) return;

    quizStarted = true;
    quizFinished = false;

    for (const id in players) {
      sendNextQuestionToPlayer(id, quiz);
    }

    console.log("Викторина запущена");
  });

  // === ИГРОК ===

  socket.on("register", (data) => {
    if (!checkSocketRateLimit(socket)) return;

    const rawName = typeof data === "string" ? data : data.name;
    const name = sanitizeInput(rawName, 50);
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
    players[socket.id] = {
      name,
      score: 0,
      questionsQueue: [],
      currentQuestion: null,
      answeredQuestions: [],
      questionStartTime: null,
      quizCompletionHandled: false,
    };
    console.log(`Игрок зарегистрирован: ${name}`);
    socket.emit("registered", { playerId: socket.id, name, restored: false });

    if (currentQuizId) {
      const quiz = quizzes.find((q) => q.id === currentQuizId);
      if (quiz) initPlayerQuestions(socket.id, quiz);
    }

    broadcastLeaderboard();
  });

  socket.on("submit-answer", (answerData) => {
    const player = players[socket.id];
    if (!player || !currentQuizId) return;
    if (!player.currentQuestion) return;
    if (player.answeredQuestions.includes(player.currentQuestion.originalIndex))
      return;
    // Deduplication guard to prevent race conditions (submit-answer + time-up)
    if (player.isProcessingAnswer) return;
    player.isProcessingAnswer = true;

    const quiz = quizzes.find((q) => q.id === currentQuizId);
    if (!quiz) return;

    const question = quiz.questions[player.currentQuestion.originalIndex];

    // Подсчёт баллов: максимум 1 балл за вопрос
    let pointsEarned = 0;

    if (typeof answerData === "object" && answerData !== null) {
      // Ordering или Matching или Text
      if (answerData.type === "ordering") {
        // Сравниваем порядок — полностью правильно или нет
        const isCorrect =
          JSON.stringify(answerData.answer) ===
          JSON.stringify(question.correct);
        pointsEarned = isCorrect ? 1 : 0;
      } else if (answerData.type === "matching") {
        // Matching — серверная проверка реальных пар
        const pairs = answerData.pairs; // [{questionIndex, answerIndex}, ...]
        if (!Array.isArray(pairs)) {
          pointsEarned = 0;
        } else {
          const isFullyCorrect =
            pairs.length === question.correct.length &&
            pairs.every((p) => {
              // Проверяем что questionIndex === answerIndex (правильная пара)
              return p.questionIndex === p.answerIndex;
            });
          pointsEarned = isFullyCorrect ? 1 : 0;
        }
      } else if (answerData.type === "text") {
        // Текстовый ответ — полностью правильно или нет
        const userAnswer = sanitizeInput(answerData.answer, 500)
          .toLowerCase()
          .trim();
        // Поддержка как строк так и объектов {text, image}
        const correctOption = question.options[0];
        const correctAnswer =
          typeof correctOption === "object"
            ? correctOption.text || ""
            : correctOption || "";
        pointsEarned =
          userAnswer === correctAnswer.toLowerCase().trim() ? 1 : 0;
      }
    } else if (Array.isArray(answerData)) {
      // Множественный выбор — пропорционально правильным ответам
      const correctAnswers = question.correct || [];
      const userAnswers = answerData;

      if (correctAnswers.length === 0) {
        pointsEarned = 0;
      } else {
        // Считаем сколько правильных ответов выбрал пользователь
        const correctSelected = userAnswers.filter((a) =>
          correctAnswers.includes(a),
        ).length;
        // Считаем сколько неправильных ответов выбрал пользователь (штраф)
        const incorrectSelected = userAnswers.filter(
          (a) => !correctAnswers.includes(a),
        ).length;
        // Пропорциональный балл: (правильные / всего_правильных) - штраф за неправильные
        // Но не меньше 0
        const rawPoints =
          correctSelected / correctAnswers.length -
          incorrectSelected / (question.options?.length || 1);
        pointsEarned = Math.max(0, Math.min(1, rawPoints));
      }
    } else {
      // Одиночный выбор — полностью правильно или нет
      pointsEarned = question.correct.includes(answerData) ? 1 : 0;
    }

    // Начисляем баллы (максимум 1 за вопрос)
    player.score += pointsEarned;

    if (pointsEarned > 0) {
      console.log(
        `Игрок ${player.name} ответил правильно! +${pointsEarned.toFixed(2)} баллов`,
      );
    }

    player.answeredQuestions.push(player.currentQuestion.originalIndex);
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

  socket.on("time-up", () => {
    const player = players[socket.id];
    if (!player || !currentQuizId) return;
    const quiz = quizzes.find((q) => q.id === currentQuizId);
    if (!quiz) return;
    if (player.currentQuestion) {
      player.answeredQuestions.push(player.currentQuestion.originalIndex);
    }
    sendNextQuestionToPlayer(socket.id, quiz);
  });

  socket.on("get-final-leaderboard", () => {
    socket.emit("final-leaderboard", getLeaderboard());
  });

  socket.on("disconnect", () => {
    const player = players[socket.id];
    if (player) {
      console.log(`Игрок отключился: ${player.name}`);
      // Помечаем как отключённого, но НЕ удаляем — чтобы сохранить в рейтинге
      // и дать время на восстановление сессии
      player.disconnected = true;
      player.lastSocketId = socket.id;
      broadcastLeaderboard();

      // Автоматически удаляем игрока через 60 секунд если не восстановился
      setTimeout(() => {
        if (player.disconnected && players[socket.id]) {
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
  players[playerId].isProcessingAnswer = false;
  players[playerId].quizCompletionHandled = false;
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

    const playerScore = player.score;
    const totalQuestions = quiz.questions.length;
    const answeredCount = player.answeredQuestions.length;
    // Процент от набранных баллов к максимальным
    const percentage =
      totalQuestions > 0 ? Math.round((playerScore / totalQuestions) * 100) : 0;

    const endPayload = {
      score: playerScore,
      totalQuestions,
      answeredCount,
      percentage,
    };
    void saveQuizResultToDb(quiz, player, endPayload);

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
    options: question.options,
    correct: question.correct,
    image: question.image,
    timeLeft: question.timeLimit || QUESTION_TIME,
  });
}

function getLeaderboard() {
  return Object.entries(players)
    .map(([id, data]) => ({
      name: data.name,
      score: data.score,
      answered: data.answeredQuestions.length,
      totalQuestions: data.questionsQueue.length,
      percentage:
        data.questionsQueue.length > 0
          ? Math.round((data.score / data.questionsQueue.length) * 100)
          : 0,
    }))
    .sort((a, b) => b.score - a.score);
}

// Проверка: все ли игроки завершили викторину
function checkAllPlayersFinished(quiz) {
  const activePlayers = Object.values(players);
  if (activePlayers.length === 0) return;

  const allFinished = activePlayers.every(
    (p) =>
      p.disconnected || p.answeredQuestions.length >= quiz.questions.length,
  );

  if (allFinished) {
    quizFinished = true;
    // Отправляем админу уведомление и результаты
    const leaderboard = getLeaderboard();
    io.emit("all-players-finished", {
      leaderboard,
      totalQuestions: quiz.questions.length,
    });
    console.log("Все игроки завершили викторину!");
  }
}

// Отправить обновление рейтинга всем
function broadcastLeaderboard() {
  const leaderboard = getLeaderboard();
  io.emit("update-leaderboard", leaderboard);
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
