// tests/global-setup.js
import { execSync } from 'child_process';

export default async function globalSetup() {
  console.log('🔍 Проверка сервера на порту 3003...');
  
  try {
    const statusCode = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3003', { 
      stdio: 'pipe',
      timeout: 5000,
    }).toString();
    
    if (statusCode === '200') {
      console.log('✅ Сервер уже запущен на порту 3003');
      return;
    }
  } catch {
    // Сервер не работает
  }

  console.log('🚀 Запуск сервера...');
  
  // Убиваем старый сервер
  try {
    execSync('pkill -f "node server.js" 2>/dev/null || true', { stdio: 'pipe' });
  } catch {}
  
  // Ждём освобождения порта
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Запускаем сервер в RAM mode (без БД для тестов)
  execSync('cd /home/lcatharsis/Quizz && DATABASE_URL="" PORT=3003 NODE_ENV=development node server.js &', {
    stdio: 'pipe',
  });
  
  // Ждём готовности сервера (до 20 секунд)
  for (let i = 0; i < 20; i++) {
    try {
      const status = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3003', { 
        stdio: 'pipe',
        timeout: 3000,
      }).toString();
      
      if (status === '200') {
        console.log(`✅ Сервер запущен и готов (попытка ${i + 1})`);
        return;
      }
    } catch {
      // Сервер ещё не готов
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error('Сервер не запустился за 20 секунд');
}
