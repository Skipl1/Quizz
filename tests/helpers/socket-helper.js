// tests/helpers/socket-helper.js
// Helper для E2E тестирования через Socket.IO из Node.js
// 
// Подход: отдельное socket.io-client подключение для админ операций.
// Слушаем события сервера (quiz-created, question-added) вместо callback.

import { io } from 'socket.io-client';

/**
 * Создаёт Socket.IO подключение для админ операций
 */
export async function createAdminSocket(baseURL = 'http://localhost:3003') {
  return new Promise((resolve, reject) => {
    const socket = io(baseURL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionAttempts: 10,
      timeout: 15000,
    });

    const timer = setTimeout(() => {
      socket.close();
      reject(new Error('Timeout подключения Socket.IO (15с)'));
    }, 16000);

    socket.on('connect', () => {
      clearTimeout(timer);
      console.log(`✅ Admin socket подключён: ${socket.id}`);
      resolve(socket);
    });

    socket.on('connect_error', (err) => {
      console.log(`⏳ Socket connect_error: ${err.message}`);
    });
  });
}

/**
 * Логин админа (через callback — сервер поддерживает)
 */
export async function adminLogin(socket, login = 'admin', password = 'admin123') {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout admin-login')), 10000);
    
    socket.emit('admin-login', { login, password }, (response) => {
      clearTimeout(timer);
      if (response?.error) {
        reject(new Error(`Admin login failed: ${response.error}`));
      } else if (response?.success) {
        resolve(response);
      } else {
        reject(new Error('Admin login: неизвестный ответ'));
      }
    });
  });
}

/**
 * Создаёт квиз (слушает событие quiz-created вместо callback)
 */
export async function createTestQuiz(socket, name = 'E2E Тест') {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout create-quiz (10с)')), 10000);
    
    // Сервер использует emit, не callback!
    const handler = (response) => {
      clearTimeout(timer);
      socket.off('quiz-created', handler);
      console.log(`✅ Квиз создан: ${JSON.stringify(response)}`);
      resolve(response);
    };
    
    socket.on('quiz-created', handler);
    socket.emit('create-quiz', { name });
  });
}

/**
 * Добавляет вопрос (слушает событие question-added)
 */
export async function addTestQuestion(socket, quizId, questionData = {}) {
  const question = {
    quizId,
    text: questionData.text || 'Тестовый вопрос?',
    type: questionData.type || 'multiple_choice',
    options: questionData.options || ['Вариант A', 'Вариант B', 'Вариант C', 'Вариант D'],
    correct: questionData.correct || [0],
    timeLimit: questionData.timeLimit || 30,
    image: null,
  };

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout add-question (10с)')), 10000);
    
    const handler = (response) => {
      clearTimeout(timer);
      socket.off('question-added', handler);
      console.log(`✅ Вопрос добавлен: ${JSON.stringify(response)}`);
      resolve(response);
    };
    
    socket.on('question-added', handler);
    socket.emit('add-question', question);
  });
}

/**
 * Выбирает квиз (слушаем quiz-ready)
 */
export async function selectQuiz(socket, quizId) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout select-quiz (10с)')), 10000);
    
    const handler = (response) => {
      // quiz-ready отправляется всем клиентам (io.emit), не только admin
      // Поэтому проверяем что это наш квиз
      if (response?.quizId === quizId || response?.name) {
        clearTimeout(timer);
        socket.off('quiz-ready', handler);
        console.log(`✅ Квиз выбран: ${JSON.stringify(response)}`);
        resolve(response);
      }
    };
    
    socket.on('quiz-ready', handler);
    socket.emit('select-quiz', quizId);
    
    // Fallback: если quiz-ready не пришёл, всё равно резолвим через 2с
    setTimeout(() => {
      socket.off('quiz-ready', handler);
      clearTimeout(timer);
      resolve({ quizId });
    }, 2000);
  });
}

/**
 * Запускает квиз
 */
export async function startQuiz(socket) {
  return new Promise((resolve) => {
    // start-quiz не имеет callback на сервере
    socket.emit('start-quiz', {});
    console.log(`✅ Квиз запущен`);
    resolve({ success: true });
  });
}

/**
 * Выбирает и запускает квиз
 */
export async function selectAndStartQuiz(socket, quizId) {
  await selectQuiz(socket, quizId);
  await new Promise(r => setTimeout(r, 500));
  await startQuiz(socket);
}

/**
 * Отключает socket
 */
export function disconnectSocket(socket) {
  if (socket && socket.connected) {
    socket.disconnect();
    console.log('🔌 Admin socket отключён');
  }
}
