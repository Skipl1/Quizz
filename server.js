require("dotenv").config();
const http = require("http");
const { parse } = require("url");
const next = require("next");
const { initSocketIO } = require("./lib/socket");
const { initDatabase, pool } = require("./lib/db");

const dev = process.env.NODE_ENV !== "production";
const PORT = Number(process.env.PORT) || 3000;

async function start() {
  console.error(`🔄 Запуск сервера на порту ${PORT} (dev: ${dev})...`);

  const nextApp = next({ dev });
  await nextApp.prepare();
  console.error("✅ Next.js подготовлен");
  const handle = nextApp.getRequestHandler();

  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("❌ Ошибка обработки запроса:", err.message);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    }
  });

  console.error("🔧 HTTP server created, initializing Socket.IO...");
  const engine = initSocketIO(server, pool);
  console.error("🔌 Socket.IO initialized");

  console.error("📚 Loading quizzes from DB...");
  await engine.loadFromDB();
  console.error(`📚 Loaded ${engine.quizzes.length} quizzes`);

  console.error("🗄️ Initializing database tables...");
  await initDatabase();
  console.error("✅ БД готова");

  server.listen(PORT, "0.0.0.0", () => {
    console.error(`🚀 Сервер запущен на порту ${PORT}`);
    console.error(`👤 Игроки: http://localhost:${PORT}`);
    console.error(`🔧 Админ: http://localhost:${PORT}/admin`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`❌ Порт ${PORT} уже занят.`);
      process.exit(1);
    } else {
      console.error("❌ Ошибка сервера:", err.message);
      process.exit(1);
    }
  });

  process.on("SIGTERM", () => {
    console.error("🔌 SIGTERM received");
    server.close(() => process.exit(0));
  });
  process.on("SIGINT", () => {
    console.error("🔌 SIGINT received");
    server.close(() => process.exit(0));
  });
}

start().catch((err) => {
  console.error("❌ Ошибка запуска сервера:", err);
  process.exit(1);
});
