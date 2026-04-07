require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Pool } = require("pg");
const rateLimit = require("express-rate-limit");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// === RATE LIMITING ===
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много запросов, попробуйте позже" },
});
app.use(limiter);

// Socket.IO rate limiting
const socketRateLimit = new Map();
const SOCKET_RATE_WINDOW_MS = 10_000; // 10 seconds
const SOCKET_RATE_MAX_EVENTS = 30;

io.use((socket, next) => {
  socketRateLimit.set(socket.id, { count: 0, resetAt: Date.now() + SOCKET_RATE_WINDOW_MS });
  next();
});

function checkSocketRateLimit(socket) {
  const record = socketRateLimit.get(socket.id);
  if (!record) return true;
  if (Date.now() > record.resetAt) {
    socketRateLimit.set(socket.id, { count: 1, resetAt: Date.now() + SOCKET_RATE_WINDOW_MS });
    return true;
  }
  record.count++;
  if (record.count > SOCKET_RATE_MAX_EVENTS) {
    socket.disconnect(true);
    console.log(`Клиент отключён за превышение лимита событий: ${socket.id}`);
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
  password: process.env.ADMIN_PASSWORD || "admin123",
};

// Подключение к PostgreSQL только из переменной окружения
const DATABASE_URL = process.env.DATABASE_URL || null;

if (!DATABASE_URL) {
  console.log("⚠️ DATABASE_URL не установлен. Работа в режиме RAM (без БД).");
  console.log("   Для подключения создайте файл .env (см. .env.example)");
}

const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: 60000,
      statementTimeoutMillis: 30000,
      max: 5,
    })
  : null;

// База данных в оперативной памяти (если нет БД)
let quizzes = [];
let currentQuizId = null;
let quizStarted = false;
const QUESTION_TIME = 30;
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
    // Проверяем подключение перед выполнением запросов
    await pool.query("SELECT NOW()");

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
        order_index INTEGER DEFAULT 0
      )
    `);
    console.log("База данных подключена и готова.");

    // Загрузка викторин из БД
    await loadQuizzesFromDB();
  } catch (err) {
    console.error("Ошибка подключения к БД:", err.message);
    console.log("Работа в режиме RAM (без подключения к БД)");
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

    // Sanitize text and options
    const sanitizedText = sanitizeInput(data.text, 2000);
    const sanitizedOptions = Array.isArray(data.options)
      ? data.options.map(opt => typeof opt === 'string' ? sanitizeInput(opt, 500) : opt)
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
            data.text,
            data.type || "multiple_choice",
            JSON.stringify(data.options),
            JSON.stringify(data.correct),
            data.image || null,
            data.timeLimit || QUESTION_TIME,
            orderIndex,
          ],
        );
        questionData.orderIndex = orderIndex;
      } catch (err) {
        console.error("Ошибка добавления вопроса:", err.message);
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
        await pool.query("DELETE FROM questions WHERE id = $1", [q.id]);
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
    const sanitizedText = sanitizeInput(data.text, 2000);
    const sanitizedOptions = Array.isArray(data.options)
      ? data.options.map(opt => typeof opt === 'string' ? sanitizeInput(opt, 500) : opt)
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
              data.text,
              data.type || "multiple_choice",
              JSON.stringify(data.options),
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

  // Перезапуск викторины (даже если есть игроки)
  socket.on("restart-quiz", () => {
    if (!adminSessions[socket.id]) return;
    if (!currentQuizId) return;

    const quiz = quizzes.find((q) => q.id === currentQuizId);
    if (!quiz) return;

    quizStarted = false;

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

  // Старт викторины
  socket.on("start-quiz", () => {
    if (!adminSessions[socket.id]) return;
    if (!currentQuizId) return;

    const quiz = quizzes.find((q) => q.id === currentQuizId);
    if (!quiz) return;

    quizStarted = true;

    for (const id in players) {
      sendNextQuestionToPlayer(id, quiz);
    }

    console.log("Викторина запущена");
  });

  // === ИГРОК ===

  socket.on("register", (data) => {
    if (!checkSocketRateLimit(socket)) return;
    if (quizStarted) {
      socket.emit("quiz-already-started");
      return;
    }

    const rawName = typeof data === "string" ? data : data.name;
    const name = sanitizeInput(rawName, 50);
    const savedId = typeof data === "object" ? data.savedId : null;

    if (!name) {
      socket.emit("registered", { playerId: null, name: "", error: "Имя не может быть пустым" });
      return;
    }

    // Если есть сохранённый ID, пытаемся восстановить игрока
    if (savedId && players[savedId]) {
      const player = players[savedId];
      // Перепривязываем к новому сокету
      players[socket.id] = player;
      delete players[savedId];

      console.log(
        `Игрок восстановлен: ${player.name} (${savedId} → ${socket.id})`,
      );
      socket.emit("registered", {
        playerId: socket.id,
        name: player.name,
        restored: true,
      });

      if (currentQuizId && quizStarted && player.currentQuestion) {
        const quiz = quizzes.find((q) => q.id === currentQuizId);
        if (quiz) {
          const question = quiz.questions[player.currentQuestion.originalIndex];
          socket.emit("new-question", {
            questionIndex: player.currentQuestion.questionNumber,
            totalQuestions: quiz.questions.length,
            text: question.text,
            type: question.type,
            options: question.options,
            correct: question.correct,
            image: question.image,
            timeLeft: QUESTION_TIME,
          });
        }
      }
      broadcastLeaderboard();
      return;
    }

    // Проверяем, есть ли игрок с таким именем (переподключение)
    const existingPlayer = Object.entries(players).find(
      ([id, p]) => p.name === name && !p.answeredQuestions.length,
    );

    if (existingPlayer) {
      const [oldId, player] = existingPlayer;
      // Перепривязываем к новому сокету
      players[socket.id] = player;
      delete players[oldId];

      console.log(
        `Игрок переподключён: ${player.name} (${oldId} → ${socket.id})`,
      );
      socket.emit("registered", {
        playerId: socket.id,
        name: player.name,
        restored: true,
      });

      if (currentQuizId && quizStarted && player.currentQuestion) {
        const quiz = quizzes.find((q) => q.id === currentQuizId);
        if (quiz) {
          const question = quiz.questions[player.currentQuestion.originalIndex];
          socket.emit("new-question", {
            questionIndex: player.currentQuestion.questionNumber,
            totalQuestions: quiz.questions.length,
            text: question.text,
            type: question.type,
            options: question.options,
            correct: question.correct,
            image: question.image,
            timeLeft: QUESTION_TIME,
          });
        }
      }
      broadcastLeaderboard();
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

    const quiz = quizzes.find((q) => q.id === currentQuizId);
    if (!quiz) return;

    const question = quiz.questions[player.currentQuestion.originalIndex];

    // Проверка ответа в зависимости от типа
    let isCorrect = false;

    if (typeof answerData === "object" && answerData !== null) {
      // Ordering или Matching или Text
      if (answerData.type === "ordering") {
        // Сравниваем порядок
        isCorrect =
          JSON.stringify(answerData.answer) ===
          JSON.stringify(question.correct);
      } else if (answerData.type === "matching") {
        isCorrect = answerData.correct;
      } else if (answerData.type === "text") {
        // Текстовый ответ - сравнение без учёта регистра, санитизируем
        const userAnswer = sanitizeInput(answerData.answer, 500).toLowerCase().trim();
        const correctAnswer = question.options[0] || "";
        isCorrect =
          userAnswer ===
          correctAnswer.toLowerCase().trim();
      }
    } else if (Array.isArray(answerData)) {
      // Множественный выбор
      isCorrect =
        answerData.every((a) => question.correct.includes(a)) &&
        answerData.length === question.correct.length;
    } else {
      // Одиночный выбор
      isCorrect = question.correct.includes(answerData);
    }

    if (isCorrect) {
      const timeSpent = player.questionStartTime
        ? (Date.now() - player.questionStartTime) / 1000
        : QUESTION_TIME;
      const bonus = Math.max(0, Math.floor((QUESTION_TIME - timeSpent) / 3));
      player.score += 10 + bonus;
      console.log(
        `Игрок ${player.name} ответил правильно! +${10 + bonus} баллов`,
      );
    }

    player.answeredQuestions.push(player.currentQuestion.originalIndex);
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
      delete players[socket.id];
      broadcastLeaderboard();
    }
    if (adminSessions[socket.id]) {
      delete adminSessions[socket.id];
      console.log("Админ отключился");
    }
  });
});

function initPlayerQuestions(playerId, quiz) {
  const shuffledIndices = shuffleArray(quiz.questions.map((_, i) => i));
  players[playerId].questionsQueue = shuffledIndices;
  players[playerId].answeredQuestions = [];
  players[playerId].currentQuestion = null;
  players[playerId].score = 0;
}

function sendNextQuestionToPlayer(playerId, quiz) {
  const player = players[playerId];
  if (!player) return;

  const nextIndex = player.questionsQueue.find(
    (i) => !player.answeredQuestions.includes(i),
  );

  if (nextIndex === undefined) {
    const playerScore = player.score;
    const totalQuestions = quiz.questions.length;
    const answeredCount = player.answeredQuestions.length;
    const percentage = Math.round((answeredCount / totalQuestions) * 100);

    io.to(playerId).emit("player-quiz-ended", {
      score: playerScore,
      totalQuestions,
      answeredCount,
      percentage,
    });

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
          ? Math.round(
              (data.answeredQuestions.length / data.questionsQueue.length) *
                100,
            )
          : 0,
    }))
    .sort((a, b) => b.score - a.score);
}

// Проверка: все ли игроки завершили викторину
function checkAllPlayersFinished(quiz) {
  const activePlayers = Object.values(players);
  if (activePlayers.length === 0) return;

  const allFinished = activePlayers.every(
    (p) => p.answeredQuestions.length >= quiz.questions.length,
  );

  if (allFinished) {
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
  // Также отправляем количество игроков
  io.emit("players-count", { count: Object.keys(players).length });
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
