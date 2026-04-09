// E2E сервер — упрощённая версия БЕЗ БД для тестирования UI
require("dotenv").config();
const http = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const { GameEngine } = require("./lib/game-engine");

const dev = process.env.NODE_ENV !== "production";
const PORT = Number(process.env.PORT) || 3003;

(async () => {
  console.error(`🔄 Запуск E2E сервера на порту ${PORT} (dev: ${dev})...`);

  const nextApp = next({ dev });
  await nextApp.prepare();
  console.error("✅ Next.js подготовлен");
  const handle = nextApp.getRequestHandler();

  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("❌ Ошибка:", err.message);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    }
  });

  // Socket.IO без БД (RAM mode)
  const io = new Server(server);
  const engine = new GameEngine(io, null);
  await engine.loadFromDB(); // RAM mode — тестовые вопросы
  console.error(`📚 RAM mode: ${engine.quizzes.length} quizzes loaded`);

  engine.registerEvents();
  console.error("🔌 Socket.IO events registered");

  server.listen(PORT, "0.0.0.0", () => {
    console.error(`🚀 Сервер запущен на порту ${PORT}`);
    console.error(`👤 Игроки: http://localhost:${PORT}`);
    console.error(`🔧 Админ: http://localhost:${PORT}/admin`);
  });

  process.on("SIGTERM", () => {
    console.error("🔌 SIGTERM");
    server.close(() => process.exit(0));
  });
  process.on("SIGINT", () => {
    console.error("🔌 SIGINT");
    server.close(() => process.exit(0));
  });
})().catch((err) => {
  console.error("❌ FATAL:", err);
  process.exit(1);
});
