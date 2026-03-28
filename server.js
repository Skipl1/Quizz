const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Парсинг JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

// Админские учётные данные
const ADMIN_CREDENTIALS = {
  login: "admin",
  password: "admin123",
};

// База данных в оперативной памяти
let quizzes = []; // Массив викторин
let currentQuizId = null; // Текущая активная викторина
let quizStarted = false; // Флаг: викторина запущена
const QUESTION_TIME = 30; // Время на вопрос в секундах
const players = {}; // { socketId: { name, score, questionsQueue, currentQuestion, answeredQuestions } }
const adminSessions = {}; // { socketId: true } - авторизованные админы

// Тестовая викторина по умолчанию
quizzes.push({
  id: "default",
  name: "Тестовая викторина",
  questions: [
    {
      text: "Столица Франции?",
      options: ["Лондон", "Берлин", "Париж", "Мадрид"],
      correct: 2,
      image: null,
    },
    {
      text: "Сколько планет в Солнечной системе?",
      options: ["7", "8", "9", "10"],
      correct: 1,
      image: null,
    },
    {
      text: "Химическая формула воды?",
      options: ["CO2", "H2O", "O2", "NaCl"],
      correct: 1,
      image: null,
    },
    {
      text: "Кто написал «Войну и мир»?",
      options: ["Достоевский", "Чехов", "Толстой", "Пушкин"],
      correct: 2,
      image: null,
    },
    {
      text: "Самая длинная река в мире?",
      options: ["Нил", "Амазонка", "Янцзы", "Миссисипи"],
      correct: 1,
      image: null,
    },
    {
      text: "В каком году Гагарин полетел в космос?",
      options: ["1959", "1961", "1963", "1965"],
      correct: 1,
      image: null,
    },
  ],
});

// Перемешивание массива (алгоритм Фишера-Йетса)
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

  // Вход админа
  socket.on("admin-login", (data, callback) => {
    if (
      data.login === ADMIN_CREDENTIALS.login &&
      data.password === ADMIN_CREDENTIALS.password
    ) {
      adminSessions[socket.id] = true;
      callback({ success: true });
      console.log("Админ авторизован");
    } else {
      callback({ success: false, error: "Неверный логин или пароль" });
    }
  });

  // Получить все викторины
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

  // Создать новую викторину
  socket.on("create-quiz", (data) => {
    if (!adminSessions[socket.id]) return;

    const newQuiz = {
      id: "quiz-" + Date.now(),
      name: data.name || "Новая викторина",
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
    console.log(`Создана викторина: ${newQuiz.name}`);
  });

  // Добавить вопрос в викторину
  socket.on("add-question", (data) => {
    if (!adminSessions[socket.id]) return;

    const quiz = quizzes.find((q) => q.id === data.quizId);
    if (!quiz) return;

    quiz.questions.push({
      text: data.text,
      options: data.options,
      correct: data.correct,
      image: data.image || null,
    });

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
    console.log(`Добавлен вопрос в викторину: ${quiz.name}`);
  });

  // Удалить вопрос
  socket.on("delete-question", (data) => {
    if (!adminSessions[socket.id]) return;

    const quiz = quizzes.find((q) => q.id === data.quizId);
    if (!quiz || !quiz.questions[data.questionIndex]) return;

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

  // Выбрать викторину для игры
  socket.on("select-quiz", (quizId) => {
    if (!adminSessions[socket.id]) return;

    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) return;

    currentQuizId = quizId;
    quizStarted = false;

    // Инициализируем вопросы для всех текущих игроков
    for (const id in players) {
      initPlayerQuestions(id, quiz);
    }

    io.emit("update-leaderboard", getLeaderboard());
    io.emit("quiz-ready", {
      quizId,
      name: quiz.name,
      questionsCount: quiz.questions.length,
    });
    console.log(`Выбрана викторина: ${quiz.name}`);
  });

  // Получить вопросы викторины
  socket.on("get-quiz-questions", (quizId) => {
    if (!adminSessions[socket.id]) return;

    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) return;

    socket.emit("quiz-questions", { quizId, questions: quiz.questions });
  });

  // Старт викторины - отправляем первый вопрос всем игрокам
  socket.on("start-quiz", () => {
    if (!adminSessions[socket.id]) return;
    if (!currentQuizId) return;

    const quiz = quizzes.find((q) => q.id === currentQuizId);
    if (!quiz) return;

    quizStarted = true;

    // Отправляем каждому игроку его первый вопрос
    for (const id in players) {
      sendNextQuestionToPlayer(id, quiz);
    }

    console.log("Викторина запущена");
  });

  // === ИГРОК ===

  // Регистрация игрока
  socket.on("register", (data) => {
    // Если викторина запущена, нельзя подключиться
    if (quizStarted) {
      socket.emit("quiz-already-started");
      return;
    }

    const name = typeof data === "string" ? data : data.name;
    const savedId = typeof data === "object" ? data.savedId : null;

    // Если есть сохранённый ID, восстанавливаем игрока
    if (savedId && players[savedId]) {
      const player = players[savedId];
      // Перепривязываем к новому сокету
      players[socket.id] = player;
      delete players[savedId];

      console.log(`Игрок восстановлен: ${player.name}`);
      socket.emit("registered", {
        playerId: socket.id,
        name: player.name,
        restored: true,
      });

      // Если был в игре - отправляем текущий вопрос
      if (
        currentQuizId &&
        quizStarted &&
        player.currentQuestion &&
        !player.answeredQuestions.includes(player.currentQuestion.originalIndex)
      ) {
        const quiz = quizzes.find((q) => q.id === currentQuizId);
        if (quiz) {
          const question = quiz.questions[player.currentQuestion.originalIndex];
          socket.emit("new-question", {
            questionIndex: player.currentQuestion.questionNumber,
            totalQuestions: quiz.questions.length,
            text: question.text,
            options: question.options,
            image: question.image,
            timeLeft: QUESTION_TIME,
          });
        }
      }
      return;
    }

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

    // Если викторина уже выбрана, инициализируем вопросы
    if (currentQuizId) {
      const quiz = quizzes.find((q) => q.id === currentQuizId);
      if (quiz) {
        initPlayerQuestions(socket.id, quiz);
      }
    }
  });

  // Ответ игрока
  socket.on("submit-answer", (answerIndex) => {
    const player = players[socket.id];
    if (!player || !currentQuizId) return;

    // Проверка, есть ли текущий вопрос
    if (!player.currentQuestion) return;

    // Проверка, не отвечал ли уже на этот вопрос
    if (
      player.answeredQuestions.includes(player.currentQuestion.originalIndex)
    ) {
      return;
    }

    const quiz = quizzes.find((q) => q.id === currentQuizId);
    if (!quiz) return;

    const question = quiz.questions[player.currentQuestion.originalIndex];
    const isCorrect = answerIndex === question.correct;

    if (isCorrect) {
      // Бонус за скорость
      const timeSpent = player.questionStartTime
        ? (Date.now() - player.questionStartTime) / 1000
        : QUESTION_TIME;
      const bonus = Math.max(0, Math.floor((QUESTION_TIME - timeSpent) / 3));
      player.score += 10 + bonus;
      console.log(
        `Игрок ${player.name} ответил правильно! +${10 + bonus} баллов`,
      );
    } else {
      console.log(`Игрок ${player.name} ответил неправильно.`);
    }

    player.answeredQuestions.push(player.currentQuestion.originalIndex);

    // Обновить рейтинг
    io.emit("update-leaderboard", getLeaderboard());

    // Сразу отправляем следующий вопрос (без показа результата)
    setTimeout(() => {
      sendNextQuestionToPlayer(socket.id, quiz);
    }, 500);
  });

  // Запрос следующего вопроса
  socket.on("get-next-question", () => {
    const player = players[socket.id];
    if (!player || !currentQuizId) return;

    const quiz = quizzes.find((q) => q.id === currentQuizId);
    if (!quiz) return;

    sendNextQuestionToPlayer(socket.id, quiz);
  });

  // Время вышло - переход к следующему вопросу
  socket.on("time-up", () => {
    const player = players[socket.id];
    if (!player || !currentQuizId) return;

    const quiz = quizzes.find((q) => q.id === currentQuizId);
    if (!quiz) return;

    // Помечаем вопрос как пропущенный (без баллов)
    if (player.currentQuestion) {
      player.answeredQuestions.push(player.currentQuestion.originalIndex);
    }

    sendNextQuestionToPlayer(socket.id, quiz);
  });

  // Запрос финального рейтинга
  socket.on("get-final-leaderboard", () => {
    socket.emit("final-leaderboard", getLeaderboard());
  });

  // Отключение
  socket.on("disconnect", () => {
    const player = players[socket.id];
    if (player) {
      console.log(`Игрок отключился: ${player.name}`);
      delete players[socket.id];
      io.emit("update-leaderboard", getLeaderboard());
    }
    if (adminSessions[socket.id]) {
      delete adminSessions[socket.id];
      console.log("Админ отключился");
    }
  });
});

// Инициализация очереди вопросов для игрока
function initPlayerQuestions(playerId, quiz) {
  const shuffledIndices = shuffleArray(quiz.questions.map((_, i) => i));
  players[playerId].questionsQueue = shuffledIndices;
  players[playerId].answeredQuestions = [];
  players[playerId].currentQuestion = null;
  players[playerId].score = 0;
}

// Отправить следующий вопрос игроку
function sendNextQuestionToPlayer(playerId, quiz) {
  const player = players[playerId];
  if (!player) return;

  // Находим следующий неотвеченный вопрос
  const nextIndex = player.questionsQueue.find(
    (i) => !player.answeredQuestions.includes(i),
  );

  if (nextIndex === undefined) {
    // Вопросы закончились - игрок завершил
    io.to(playerId).emit("player-quiz-ended", { score: player.score });
    return;
  }

  const question = quiz.questions[nextIndex];
  player.currentQuestion = {
    originalIndex: nextIndex,
    questionNumber: player.answeredQuestions.length + 1,
  };
  player.questionStartTime = Date.now();

  // Отправляем вопрос конкретному игроку
  io.to(playerId).emit("new-question", {
    questionIndex: player.currentQuestion.questionNumber,
    totalQuestions: quiz.questions.length,
    text: question.text,
    options: question.options,
    image: question.image,
    timeLeft: QUESTION_TIME,
  });
}

function getLeaderboard() {
  return Object.entries(players)
    .map(([id, data]) => ({
      name: data.name,
      score: data.score,
      answered: data.answeredQuestions.length,
    }))
    .sort((a, b) => b.score - a.score);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Игроки: http://localhost:${PORT}`);
  console.log(`Админ: http://localhost:${PORT}/admin.html`);
  console.log(`Логин/пароль админа: admin / admin123`);
});
