const { Server } = require("socket.io");
const { loadQuizzes } = require("./db");
const {
  registerSchema,
  submitAnswerSchema,
  timeUpSchema,
  createQuizSchema,
  updateQuizSchema,
  selectQuizSchema,
  deleteQuizSchema,
  questionSchema,
  updateQuestionSchema,
  deleteQuestionSchema,
  adminLoginSchema,
} = require("./schemas");

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

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Socket.IO rate limiting
const socketRateLimit = new Map();
const SOCKET_RATE_WINDOW_MS = Number(process.env.SOCKET_RATE_WINDOW_MS) || 10_000;
const SOCKET_RATE_MAX_EVENTS = Number(process.env.SOCKET_RATE_MAX_EVENTS) || 30;

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

/**
 * Валидирует данные через Zod-схему.
 * При ошибке emits 'error' и возвращает false.
 * При успехе возвращает распарсенные данные.
 */
function validatePayload(socket, schema, data) {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    socket.emit("error", {
      code: "invalid-payload",
      message: "Некорректные данные",
      details: parsed.error.flatten(),
    });
    return null;
  }
  return parsed.data;
}

class GameEngine {
  constructor(io, pool) {
    this.io = io;
    this.pool = pool;
    this.quizzes = [];
    this.currentQuizId = null;
    this.quizStarted = false;
    this.QUESTION_TIME = 30;
    this.players = {};
    this.adminSessions = {};
  }

  async loadFromDB() {
    if (this.pool) {
      this.quizzes = await loadQuizzes(this.pool);
    } else {
      // RAM mode — тестовая викторина
      this.quizzes.push({
        id: "default",
        name: "Тестовая викторина",
        questions: [
          { text: "Столица Франции?", type: "multiple_choice", options: ["Лондон", "Берлин", "Париж", "Мадрид"], correct: [2], image: null, timeLimit: 30 },
          { text: "Сколько планет в Солнечной системе?", type: "multiple_choice", options: ["7", "8", "9", "10"], correct: [1], image: null, timeLimit: 30 },
          { text: "H2O — это формула воды", type: "true_false", options: ["Правда", "Ложь"], correct: [0], image: null, timeLimit: 30 },
          { text: "Кто написал «Войну и мир»?", type: "multiple_choice", options: ["Достоевский", "Чехов", "Толстой", "Пушкин"], correct: [2], image: null, timeLimit: 30 },
        ],
      });
    }
  }

  initPlayerQuestions(playerId, quiz) {
    const shuffledIndices = shuffleArray(quiz.questions.map((_, i) => i));
    this.players[playerId].questionsQueue = shuffledIndices;
    this.players[playerId].answeredQuestions = [];
    this.players[playerId].currentQuestion = null;
    this.players[playerId].score = 0;
    this.players[playerId].isProcessingAnswer = false;
  }

  sendNextQuestionToPlayer(playerId, quiz) {
    const player = this.players[playerId];
    if (!player) return;

    const nextIndex = player.questionsQueue.find(
      (i) => !player.answeredQuestions.includes(i),
    );

    if (nextIndex === undefined) {
      const playerScore = player.score;
      const totalQuestions = quiz.questions.length;
      const answeredCount = player.answeredQuestions.length;
      const percentage = Math.round((answeredCount / totalQuestions) * 100);

      this.io.to(playerId).emit("player-quiz-ended", {
        score: playerScore,
        totalQuestions,
        answeredCount,
        percentage,
      });

      this.checkAllPlayersFinished(quiz);
      return;
    }

    const question = quiz.questions[nextIndex];
    player.currentQuestion = {
      originalIndex: nextIndex,
      questionNumber: player.answeredQuestions.length + 1,
    };
    player.questionStartTime = Date.now();

    this.io.to(playerId).emit("new-question", {
      questionIndex: player.currentQuestion.questionNumber,
      totalQuestions: quiz.questions.length,
      text: question.text,
      type: question.type,
      options: question.options,
      correct: question.correct,
      image: question.image,
      timeLeft: question.timeLimit || this.QUESTION_TIME,
    });
  }

  getLeaderboard() {
    return Object.entries(this.players)
      .map(([id, data]) => ({
        name: data.name,
        score: data.score,
        answered: data.answeredQuestions.length,
        totalQuestions: data.questionsQueue.length,
        percentage: data.questionsQueue.length > 0
          ? Math.round((data.answeredQuestions.length / data.questionsQueue.length) * 100)
          : 0,
      }))
      .sort((a, b) => b.score - a.score);
  }

  broadcastLeaderboard() {
    const leaderboard = this.getLeaderboard();
    this.io.emit("update-leaderboard", leaderboard);
    this.io.emit("players-count", { count: Object.keys(this.players).length });
  }

  checkAllPlayersFinished(quiz) {
    const activePlayers = Object.values(this.players);
    if (activePlayers.length === 0) return;

    const allFinished = activePlayers.every(
      (p) => p.answeredQuestions.length >= quiz.questions.length,
    );

    if (allFinished) {
      const leaderboard = this.getLeaderboard();
      this.io.emit("all-players-finished", {
        leaderboard,
        totalQuestions: quiz.questions.length,
      });
      console.log("Все игроки завершили викторину!");
    }
  }

  registerEvents() {
    const { io, pool } = this;

    io.use((socket, next) => {
      socketRateLimit.set(socket.id, { count: 0, resetAt: Date.now() + SOCKET_RATE_WINDOW_MS });
      next();
    });

    io.on("connection", (socket) => {
      console.log("Подключился клиент:", socket.id);

      // === АДМИН ===
      const ADMIN_CREDENTIALS = {
        login: process.env.ADMIN_LOGIN || "admin",
        password: process.env.ADMIN_PASSWORD || "CHANGE_ME_set_in_env",
      };

      socket.on("admin-login", (data, callback) => {
        if (!checkSocketRateLimit(socket)) return;
        const parsed = validatePayload(socket, adminLoginSchema, data);
        if (!parsed) return;

        const login = sanitizeInput(parsed.login, 100);
        const password = parsed.password;
        if (login === ADMIN_CREDENTIALS.login && password === ADMIN_CREDENTIALS.password) {
          this.adminSessions[socket.id] = true;
          callback({ success: true });
          console.log("Админ авторизован");
        } else {
          callback({ success: false, error: "Неверный логин или пароль" });
        }
      });

      socket.on("get-quizzes", () => {
        if (!this.adminSessions[socket.id]) return;
        socket.emit(
          "quizzes-list",
          this.quizzes.map((q) => ({
            id: q.id,
            name: q.name,
            questionsCount: q.questions.length,
          })),
        );
      });

      socket.on("create-quiz", async (data) => {
        if (!checkSocketRateLimit(socket)) return;
        if (!this.adminSessions[socket.id]) return;

        const parsed = validatePayload(socket, createQuizSchema, data);
        if (!parsed) return;

        const quizName = sanitizeInput(parsed.name, 200);

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
            this.quizzes.push(newQuiz);
            socket.emit("quiz-created", { id: newQuiz.id, name: newQuiz.name });
            socket.emit("quizzes-list", this.quizzes.map((q) => ({
              id: q.id, name: q.name, questionsCount: q.questions.length,
            })));
          } catch (err) {
            console.error("Ошибка создания викторины:", err.message);
          }
        } else {
          const newQuiz = { id: "quiz-" + Date.now(), name: quizName, questions: [] };
          this.quizzes.push(newQuiz);
          socket.emit("quiz-created", { id: newQuiz.id, name: newQuiz.name });
          socket.emit("quizzes-list", this.quizzes.map((q) => ({
            id: q.id, name: q.name, questionsCount: q.questions.length,
          })));
        }
      });

      socket.on("add-question", async (data) => {
        if (!this.adminSessions[socket.id]) return;

        const parsed = validatePayload(socket, questionSchema, data);
        if (!parsed) return;

        const quiz = this.quizzes.find((q) => q.id === parsed.quizId);
        if (!quiz) return;

        const sanitizedText = sanitizeInput(parsed.text, 2000);
        const sanitizedOptions = Array.isArray(parsed.options)
          ? parsed.options.map(opt => typeof opt === 'string' ? sanitizeInput(opt, 500) : opt)
          : parsed.options;

        const questionData = {
          text: sanitizedText,
          type: parsed.type || "multiple_choice",
          options: sanitizedOptions,
          correct: parsed.correct,
          image: parsed.image || null,
          timeLimit: parsed.timeLimit || this.QUESTION_TIME,
          answerType: parsed.answerType || "single",
        };

        if (pool && quiz.dbId) {
          try {
            const orderIndex = quiz.questions.length;
            await pool.query(
              "INSERT INTO questions (quiz_id, text, type, options, correct, image, time_limit, order_index, order_answer) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
              [
                quiz.dbId,
                sanitizedText,
                parsed.type || "multiple_choice",
                JSON.stringify(sanitizedOptions),
                JSON.stringify(parsed.correct),
                parsed.image || null,
                parsed.timeLimit || this.QUESTION_TIME,
                orderIndex,
                parsed.orderAnswer ? JSON.stringify(parsed.orderAnswer) : null,
              ],
            );
            questionData.orderIndex = orderIndex;
          } catch (err) {
            console.error("Ошибка добавления вопроса:", err.message);
          }
        }

        quiz.questions.push(questionData);
        socket.emit("question-added", { quizId: quiz.id, questionIndex: quiz.questions.length - 1 });
        socket.emit("quizzes-list", this.quizzes.map((q) => ({
          id: q.id, name: q.name, questionsCount: q.questions.length,
        })));
      });

      socket.on("delete-question", async (data) => {
        if (!this.adminSessions[socket.id]) return;

        const parsed = validatePayload(socket, deleteQuestionSchema, data);
        if (!parsed) return;

        const quiz = this.quizzes.find((q) => q.id === parsed.quizId);
        if (!quiz || !quiz.questions[parsed.questionIndex]) return;

        if (pool && quiz.dbId) {
          const q = quiz.questions[parsed.questionIndex];
          if (q.id) {
            try {
              await pool.query("DELETE FROM questions WHERE id = $1", [q.id]);
            } catch (err) {
              console.error("Ошибка удаления вопроса из БД:", err.message);
            }
          }
        }

        quiz.questions.splice(parsed.questionIndex, 1);
        socket.emit("quizzes-list", this.quizzes.map((q) => ({
          id: q.id, name: q.name, questionsCount: q.questions.length,
        })));
        socket.emit("quiz-updated", { quizId: quiz.id, questions: quiz.questions });
      });

      socket.on("update-question", async (data) => {
        if (!this.adminSessions[socket.id]) return;

        const parsed = validatePayload(socket, updateQuestionSchema, data);
        if (!parsed) return;

        const quiz = this.quizzes.find((q) => q.id === parsed.quizId);
        if (!quiz || !quiz.questions[parsed.questionIndex]) return;

        const sanitizedText = parsed.text !== undefined
          ? sanitizeInput(parsed.text, 2000)
          : quiz.questions[parsed.questionIndex].text;
        const sanitizedOptions = parsed.options !== undefined
          ? (Array.isArray(parsed.options)
            ? parsed.options.map(opt => typeof opt === 'string' ? sanitizeInput(opt, 500) : opt)
            : parsed.options)
          : quiz.questions[parsed.questionIndex].options;

        const questionData = {
          text: sanitizedText,
          type: parsed.type || quiz.questions[parsed.questionIndex].type,
          options: sanitizedOptions,
          correct: parsed.correct !== undefined ? parsed.correct : quiz.questions[parsed.questionIndex].correct,
          image: parsed.image !== undefined ? parsed.image : quiz.questions[parsed.questionIndex].image,
          timeLimit: parsed.timeLimit || quiz.questions[parsed.questionIndex].timeLimit || this.QUESTION_TIME,
          answerType: parsed.answerType || quiz.questions[parsed.questionIndex].answerType || "single",
        };

        if (pool && quiz.dbId) {
          const q = quiz.questions[parsed.questionIndex];
          try {
            if (q.id) {
              await pool.query(
                "UPDATE questions SET text = $1, type = $2, options = $3, correct = $4, image = $5, time_limit = $6, order_answer = $8 WHERE id = $7",
                [
                  sanitizedText,
                  parsed.type || quiz.questions[parsed.questionIndex].type,
                  JSON.stringify(sanitizedOptions),
                  JSON.stringify(parsed.correct !== undefined ? parsed.correct : quiz.questions[parsed.questionIndex].correct),
                  parsed.image !== undefined ? parsed.image : quiz.questions[parsed.questionIndex].image,
                  parsed.timeLimit || quiz.questions[parsed.questionIndex].timeLimit || this.QUESTION_TIME,
                  q.id,
                  parsed.orderAnswer ? JSON.stringify(parsed.orderAnswer) : null,
                ],
              );
            }
          } catch (err) {
            console.error("Ошибка обновления вопроса:", err.message);
          }
        }

        quiz.questions[parsed.questionIndex] = questionData;
        socket.emit("question-updated", { quizId: quiz.id, questionIndex: parsed.questionIndex });
        socket.emit("quizzes-list", this.quizzes.map((q) => ({
          id: q.id, name: q.name, questionsCount: q.questions.length,
        })));
      });

      socket.on("delete-quiz", async (quizId) => {
        if (!this.adminSessions[socket.id]) return;

        const parsed = validatePayload(socket, deleteQuizSchema, quizId);
        if (!parsed) return;

        const quizIndex = this.quizzes.findIndex((q) => q.id === parsed);
        if (quizIndex === -1) return;

        const quiz = this.quizzes[quizIndex];

        if (pool && quiz.dbId) {
          try {
            await pool.query("DELETE FROM quizzes WHERE id = $1", [quiz.dbId]);
          } catch (err) {
            console.error("Ошибка удаления викторины:", err.message);
          }
        }

        this.quizzes.splice(quizIndex, 1);
        socket.emit("quizzes-list", this.quizzes.map((q) => ({
          id: q.id, name: q.name, questionsCount: q.questions.length,
        })));
      });

      socket.on("select-quiz", (quizId) => {
        if (!this.adminSessions[socket.id]) return;

        const parsed = validatePayload(socket, selectQuizSchema, quizId);
        if (!parsed) return;

        // selectQuizSchema может вернуть строку/число или объект{quizId}
        const targetId = typeof parsed === 'object' ? parsed.quizId : parsed;
        const quiz = this.quizzes.find((q) => q.id === targetId);
        if (!quiz) return;

        this.currentQuizId = targetId;
        this.quizStarted = false;

        for (const id in this.players) {
          this.initPlayerQuestions(id, quiz);
        }

        this.broadcastLeaderboard();
        io.emit("quiz-ready", {
          quizId,
          name: quiz.name,
          questionsCount: quiz.questions.length,
        });
        console.log(`Выбрана викторина: ${quiz.name}`);
      });

      socket.on("restart-quiz", () => {
        if (!this.adminSessions[socket.id]) return;
        if (!this.currentQuizId) return;

        const quiz = this.quizzes.find((q) => q.id === this.currentQuizId);
        if (!quiz) return;

        this.quizStarted = false;

        for (const id in this.players) {
          this.initPlayerQuestions(id, quiz);
        }

        this.broadcastLeaderboard();
        io.emit("quiz-restarted", {
          quizId: this.currentQuizId,
          name: quiz.name,
          questionsCount: quiz.questions.length,
        });
        console.log(`Викторина перезапущена: ${quiz.name}`);
      });

      socket.on("get-quiz-questions", (quizId) => {
        if (!this.adminSessions[socket.id]) return;

        const parsed = validatePayload(socket, selectQuizSchema, quizId);
        if (!parsed) return;

        const targetId = typeof parsed === 'object' ? parsed.quizId : parsed;
        const quiz = this.quizzes.find((q) => q.id === targetId);
        if (!quiz) return;
        socket.emit("quiz-questions", { quizId: targetId, questions: quiz.questions });
      });

      socket.on("start-quiz", () => {
        if (!this.adminSessions[socket.id]) return;
        if (!this.currentQuizId) return;

        const quiz = this.quizzes.find((q) => q.id === this.currentQuizId);
        if (!quiz) return;

        this.quizStarted = true;

        for (const id in this.players) {
          this.sendNextQuestionToPlayer(id, quiz);
        }

        console.log("Викторина запущена");
      });

      // === ИГРОК ===
      socket.on("register", (data) => {
        if (!checkSocketRateLimit(socket)) return;
        if (this.quizStarted) {
          socket.emit("quiz-already-started");
          return;
        }

        const parsed = validatePayload(socket, registerSchema, data);
        if (!parsed) return;

        const rawName = typeof parsed === "string" ? parsed : parsed?.name;
        const name = sanitizeInput(rawName, 50);
        const savedId = typeof parsed === "object" ? parsed?.savedId : null;

        if (!name) {
          socket.emit("registered", { playerId: null, name: "", error: "Имя не может быть пустым" });
          return;
        }

        // Восстановление по savedId
        if (savedId && this.players[savedId]) {
          const player = this.players[savedId];
          this.players[socket.id] = player;
          delete this.players[savedId];

          console.log(`Игрок восстановлен: ${player.name} (${savedId} → ${socket.id})`);
          socket.emit("registered", { playerId: socket.id, name: player.name, restored: true });

          if (this.currentQuizId && this.quizStarted && player.currentQuestion) {
            const quiz = this.quizzes.find((q) => q.id === this.currentQuizId);
            if (quiz) {
              const question = quiz.questions[player.currentQuestion.originalIndex];
              socket.emit("new-question", {
                questionIndex: player.currentQuestion.questionNumber,
                totalQuestions: quiz.questions.length,
                text: question.text, type: question.type,
                options: question.options, correct: question.correct,
                image: question.image, timeLeft: question.timeLimit || this.QUESTION_TIME,
              });
            }
          }
          this.broadcastLeaderboard();
          return;
        }

        // Переподключение по имени
        const existingPlayer = Object.entries(this.players).find(
          ([id, p]) => p.name === name && !p.answeredQuestions.length,
        );

        if (existingPlayer) {
          const [oldId, player] = existingPlayer;
          this.players[socket.id] = player;
          delete this.players[oldId];

          console.log(`Игрок переподключён: ${player.name} (${oldId} → ${socket.id})`);
          socket.emit("registered", { playerId: socket.id, name: player.name, restored: true });

          if (this.currentQuizId && this.quizStarted && player.currentQuestion) {
            const quiz = this.quizzes.find((q) => q.id === this.currentQuizId);
            if (quiz) {
              const question = quiz.questions[player.currentQuestion.originalIndex];
              socket.emit("new-question", {
                questionIndex: player.currentQuestion.questionNumber,
                totalQuestions: quiz.questions.length,
                text: question.text, type: question.type,
                options: question.options, correct: question.correct,
                image: question.image, timeLeft: question.timeLimit || this.QUESTION_TIME,
              });
            }
          }
          this.broadcastLeaderboard();
          return;
        }

        // Новый игрок
        this.players[socket.id] = {
          name,
          score: 0,
          questionsQueue: [],
          currentQuestion: null,
          answeredQuestions: [],
          questionStartTime: null,
          isProcessingAnswer: false,
        };
        console.log(`Игрок зарегистрирован: ${name}`);
        socket.emit("registered", { playerId: socket.id, name, restored: false });

        if (this.currentQuizId) {
          const quiz = this.quizzes.find((q) => q.id === this.currentQuizId);
          if (quiz) this.initPlayerQuestions(socket.id, quiz);
        }

        this.broadcastLeaderboard();
      });

      socket.on("submit-answer", (answerData) => {
        const player = this.players[socket.id];
        if (!player || !this.currentQuizId) return;
        if (!player.currentQuestion) return;
        if (player.answeredQuestions.includes(player.currentQuestion.originalIndex)) return;
        if (player.isProcessingAnswer) return;

        const parsed = validatePayload(socket, submitAnswerSchema, answerData);
        if (!parsed) {
          player.isProcessingAnswer = false;
          return;
        }
        player.isProcessingAnswer = true;

        const quiz = this.quizzes.find((q) => q.id === this.currentQuizId);
        if (!quiz) return;

        const question = quiz.questions[player.currentQuestion.originalIndex];
        let isCorrect = false;

        if (typeof parsed === "object" && parsed !== null && parsed.type) {
          if (parsed.type === "ordering") {
            isCorrect = JSON.stringify(parsed.answer) === JSON.stringify(question.correct);
          } else if (parsed.type === "matching") {
            isCorrect = parsed.correct;
          } else if (parsed.type === "text") {
            const userAnswer = sanitizeInput(parsed.answer, 500).toLowerCase().trim();
            const correctAnswer = question.options[0] || "";
            isCorrect = userAnswer === correctAnswer.toLowerCase().trim();
          }
        } else if (Array.isArray(parsed)) {
          isCorrect =
            parsed.every((a) => question.correct.includes(a)) &&
            parsed.length === question.correct.length;
        } else {
          isCorrect = question.correct.includes(parsed);
        }

        if (isCorrect) {
          const timeSpent = player.questionStartTime
            ? (Date.now() - player.questionStartTime) / 1000
            : this.QUESTION_TIME;
          const timeLimit = question.timeLimit || this.QUESTION_TIME;
          const bonus = Math.max(0, Math.floor((timeLimit - timeSpent) / 3));
          player.score += 10 + bonus;
          console.log(`Игрок ${player.name} ответил правильно! +${10 + bonus} баллов`);
        }

        player.answeredQuestions.push(player.currentQuestion.originalIndex);
        player.isProcessingAnswer = false;
        this.broadcastLeaderboard();

        setTimeout(() => {
          this.sendNextQuestionToPlayer(socket.id, quiz);
        }, 500);
      });

      socket.on("get-next-question", () => {
        const player = this.players[socket.id];
        if (!player || !this.currentQuizId) return;
        const quiz = this.quizzes.find((q) => q.id === this.currentQuizId);
        if (!quiz) return;
        this.sendNextQuestionToPlayer(socket.id, quiz);
      });

      socket.on("time-up", (data) => {
        const parsed = validatePayload(socket, timeUpSchema, data);
        if (!parsed) return;

        const player = this.players[socket.id];
        if (!player || !this.currentQuizId) return;
        const quiz = this.quizzes.find((q) => q.id === this.currentQuizId);
        if (!quiz) return;
        if (player.currentQuestion) {
          player.answeredQuestions.push(player.currentQuestion.originalIndex);
        }
        this.sendNextQuestionToPlayer(socket.id, quiz);
      });

      socket.on("get-final-leaderboard", () => {
        socket.emit("final-leaderboard", this.getLeaderboard());
      });

      socket.on("disconnect", () => {
        const player = this.players[socket.id];
        if (player) {
          console.log(`Игрок отключился: ${player.name}`);
          delete this.players[socket.id];
          this.broadcastLeaderboard();
        }
        if (this.adminSessions[socket.id]) {
          delete this.adminSessions[socket.id];
          console.log("Админ отключился");
        }
        socketRateLimit.delete(socket.id);
      });
    });
  }
}

function initSocketIO(server, pool) {
  const io = new Server(server);
  const engine = new GameEngine(io, pool);
  engine.registerEvents();
  return engine;
}

module.exports = { initSocketIO, sanitizeInput, shuffleArray };
