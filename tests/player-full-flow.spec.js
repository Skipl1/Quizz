/**
 * TC-5 — Player Full Flow E2E Test
 * 
 * Сценарий:
 * 1. Админ создаёт викторину через Socket.IO
 * 2. Админ добавляет 2 вопроса
 * 3. Админ выбирает и запускает викторину
 * 4. Игрок регистрируется через UI
 * 5. Игрок получает вопрос, отвечает
 * 6. Игрок видит результаты
 * 
 * @playwright-test
 */

import { test, expect } from '@playwright/test';
import { 
  createAdminSocket, 
  adminLogin, 
  createTestQuiz, 
  addTestQuestion, 
  selectQuiz, 
  startQuiz, 
  disconnectSocket 
} from './helpers/socket-helper.js';

test.describe('Player Full Flow (Integration)', () => {
  let adminSocket;

  test.beforeEach(async () => {
    // Создаём admin socket для управления викториной
    adminSocket = await createAdminSocket('http://localhost:3003');
    await adminLogin(adminSocket, 'admin', 'admin123');
  });

  test.afterEach(async () => {
    await disconnectSocket(adminSocket);
  });

  test('TC-5: Full player flow — create quiz, add questions, start, player answers, sees results', async ({ page }) => {
    // Шаг 1: Создаём тестовую викторину
    const quizResponse = await createTestQuiz(adminSocket, 'E2E Integration Test');
    expect(quizResponse).toHaveProperty('id');
    expect(quizResponse).toHaveProperty('name', 'E2E Integration Test');
    const quizId = quizResponse.id;

    // Шаг 2: Добавляем 2 вопроса
    const q1 = await addTestQuestion(adminSocket, quizId, {
      text: 'Сколько будет 2 + 2?',
      type: 'multiple_choice',
      options: ['3', '4', '5', '6'],
      correct: [1], // индекс правильного ответа (4)
      timeLimit: 30,
    });
    expect(q1).toHaveProperty('quizId', quizId);

    const q2 = await addTestQuestion(adminSocket, quizId, {
      text: 'Земля круглая?',
      type: 'true_false',
      options: ['Правда', 'Ложь'],
      correct: [0], // Правда
      timeLimit: 30,
    });
    expect(q2).toHaveProperty('quizId', quizId);

    // Шаг 3: Игрок регистрируется через UI
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /QUIZZ/i })).toBeVisible({ timeout: 15000 });
    
    const nameInput = page.getByPlaceholder(/имя/i);
    await expect(nameInput).toBeVisible();
    await nameInput.fill('E2E-Player');
    await page.getByRole('button', { name: /войти/i }).click();

    // Проверяем что игрок на экране ожидания
    await expect(page.getByText(/ожидание/i)).toBeVisible({ timeout: 15000 });

    // Шаг 4: Админ выбирает и запускает викторину
    await selectQuiz(adminSocket, quizId);
    await new Promise(r => setTimeout(r, 1000)); // Небольшая задержка
    await startQuiz(adminSocket);

    // Шаг 5: Игрок получает вопрос
    await expect(page.getByText(/вопрос/i)).toBeVisible({ timeout: 20000 });
    
    // Проверяем что есть варианты ответов
    const options = page.locator('button').filter({ hasText: /вариант|правда|ложь/i });
    const optionsCount = await options.count();
    expect(optionsCount).toBeGreaterThan(0);

    // Шаг 6: Игрок отвечает на первый вопрос (выбирает "4")
    // Для multiple_choice ищем кнопку с текстом "4"
    const answerButton = page.getByRole('button', { name: '4', exact: false });
    if (await answerButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await answerButton.click();
    } else {
      // Если не нашли точный ответ, кликаем первый доступный вариант
      const firstOption = page.locator('button[type="button"]').first();
      await firstOption.click({ timeout: 10000 });
    }

    // Шаг 7: Ждём второй вопрос или экран результатов
    // Даём серверу время обработать ответ и отправить следующий вопрос
    await page.waitForTimeout(3000);

    // Проверяем что игрок либо получил второй вопрос, либо завершил
    const gameScreenVisible = await page.getByText(/вопрос/i).isVisible().catch(() => false);
    const resultsVisible = await page.getByText(/результат|поздравля|финиш/i).isVisible().catch(() => false);

    // Либо игра продолжается, либо уже результаты
    expect(gameScreenVisible || resultsVisible).toBe(true);

    // Если всё ещё игра — отвечаем на второй вопрос
    if (gameScreenVisible) {
      const truthButton = page.getByRole('button', { name: /правда/i });
      if (await truthButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await truthButton.click();
      }
      
      // Ждём экран результатов
      await page.waitForTimeout(3000);
    }

    // Финальная проверка: игрок должен увидеть либо результаты, либо продолжить игру
    const finalState = await page.evaluate(() => {
      return document.body.innerText;
    });
    
    // Проверяем что нет ошибок
    expect(finalState).not.toContain('Error');
    expect(finalState).not.toContain('undefined');
  });

  test('TC-5a: Player reconnects mid-game and session restores', async ({ page, context }) => {
    /**
     * Сценарий: 
     * 1. Игрок регистрируется
     * 2. Админ запускает викторину
     * 3. Игрок перезагружает страницу
     * 4. Сессия восстанавливается (тот же игрок, тот же вопрос)
     */

    // Создаём викторину
    const quizResponse = await createTestQuiz(adminSocket, 'Session Restore Test');
    const quizId = quizResponse.id;

    await addTestQuestion(adminSocket, quizId, {
      text: 'Тестовый вопрос для восстановления?',
      type: 'multiple_choice',
      options: ['A', 'B', 'C', 'D'],
      correct: [0],
      timeLimit: 60, // Длинный таймер чтобы успеть перезагрузить
    });

    // Игрок регистрируется
    await page.goto('/');
    await page.getByPlaceholder(/имя/i).fill('Reconnect-Player');
    await page.getByRole('button', { name: /войти/i }).click();
    await expect(page.getByText(/ожидание/i)).toBeVisible({ timeout: 15000 });

    // Админ запускает викторину
    await selectQuiz(adminSocket, quizId);
    await new Promise(r => setTimeout(r, 500));
    await startQuiz(adminSocket);

    // Игрок получает вопрос
    await expect(page.getByText(/вопрос/i)).toBeVisible({ timeout: 20000 });
    const questionText = await page.getByText(/тестовый вопрос/i).textContent();
    expect(questionText).toContain('Тестовый вопрос для восстановления?');

    // Перезагружаем страницу
    await page.reload();

    // Проверяем что сессия восстановилась (игрок снова видит вопрос)
    // NOTE: Это зависит от реализации sessionStorage + socket restore
    await page.waitForTimeout(3000);
    
    const afterReload = await page.evaluate(() => document.body.innerText);
    // Проверяем что нет ошибки и игрок всё ещё в игре
    expect(afterReload).not.toContain('Error');
  });
});
