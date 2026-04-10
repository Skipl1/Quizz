/**
 * Index Sockets — обработчики Socket.IO событий
 */

/**
 * Рендеринг нового вопроса
 */
socket.on("new-question", (data) => {
  hasAnswered = false;
  document.getElementById("time-up").style.display = "none";
  document.getElementById("loading-next").style.display = "none";
  enableAllInputs();

  // Сброс переменных выбора
  selectedMCIndex = null;
  selectedTFIndex = null;
  matchingDragged = null;
  matchingDraggedFromDropzone = null;
  matchingUserPairs = [];
  matchingMatches = 0;

  document.getElementById("question-number").textContent =
    `Вопрос ${data.questionIndex} из ${data.totalQuestions}`;

  // Текст вопроса может быть пустым, если есть картинка
  const questionTextEl = document.getElementById("question-text");
  if (data.text) {
    questionTextEl.textContent = data.text;
    questionTextEl.style.display = "block";
  } else {
    questionTextEl.style.display = "none";
  }
  currentQuestionType = data.type || "multiple_choice";

  // Очищаем текстовое поле
  document.getElementById("text-answer-input").value = "";

  const typeNames = {
    multiple_choice: "Множественный выбор",
    true_false: "Правда/Ложь",
    fill_blank: "Заполнить пробел",
    open_ended: "Открытый вопрос",
    ordering: "Изменение порядка",
    matching: "Соответствовать",
  };
  document.getElementById("question-type-badge").textContent =
    typeNames[data.type] || "Вопрос";

  // Подсказка для ответа
  const hintEl = document.getElementById("answer-hint");
  if (data.type === "multiple_choice") {
    hintEl.textContent = "Выберите один правильный ответ";
  } else if (data.type === "ordering") {
    hintEl.textContent =
      "Перетащите элементы в правильном порядке (сверху вниз)";
  } else if (data.type === "matching") {
    hintEl.textContent = "Перетащите вопрос к правильному ответу";
  } else {
    hintEl.textContent = "";
  }

  const img = document.getElementById("question-image");
  if (data.image) {
    img.src = data.image;
    img.classList.add("show");
  } else {
    img.classList.remove("show");
  }

  // Скрыть все контейнеры и кнопки
  document.getElementById("options-container").innerHTML = "";
  document.getElementById("options-container").style.display = "none";
  document.getElementById("tf-container").style.display = "none";
  document.getElementById("text-answer-container").style.display = "none";
  document.getElementById("ordering-list").innerHTML = "";
  document.getElementById("submit-order-btn").style.display = "none";
  document.getElementById("matching-container").style.display = "none";
  document.getElementById("submit-mc-btn").style.display = "none";
  document.getElementById("submit-tf-btn").style.display = "none";
  document.getElementById("submit-matching-btn").style.display = "none";

  // Рендер в зависимости от типа вопроса
  if (data.type === "multiple_choice") {
    renderMultipleChoice(data.options);
  } else if (data.type === "true_false") {
    document.getElementById("tf-container").style.display = "grid";
    selectedTFIndex = null;
    document.querySelectorAll(".tf-btn").forEach((b) => {
      b.classList.remove("selected");
      b.disabled = false;
    });
    const submitBtn = document.getElementById("submit-tf-btn");
    submitBtn.style.display = "block";
    submitBtn.disabled = false;
  } else if (data.type === "fill_blank" || data.type === "open_ended") {
    document.getElementById("text-answer-container").style.display =
      "block";
    document.getElementById("text-answer-input").value = "";
    document.getElementById("text-answer-input").disabled = false;
    document.querySelector(".submit-answer-btn").disabled = false;
  } else if (data.type === "ordering") {
    renderOrdering(data.options);
  } else if (data.type === "matching") {
    renderMatching(data.options);
  }

  startTimer(data.timeLeft || QUESTION_TIME);
  showScreen("question-screen");
});

/**
 * Обновление leaderboard
 */
socket.on("update-leaderboard", (leaderboard) => {
  // Обновляем счёт в ожидании
  if (leaderboard.length > 0) {
    const player = leaderboard.find((p) => p.name === playerName);
    if (player) {
      playerScore = player.score;
    }
  }
});

/**
 * Игрок закончил викторину — очищаем сессию
 */
socket.on("player-quiz-ended", (data) => {
  document.getElementById("final-score").textContent = data.score;

  // Сессия больше не нужна — игрок завершил викторину
  clearSession();

  // Запрашиваем финальный leaderboard
  socket.emit("get-final-leaderboard");

  showScreen("end-screen");
});

/**
 * Финальный leaderboard
 */
socket.on("final-leaderboard", (leaderboard) => {
  const container = document.getElementById("final-leaderboard");
  container.innerHTML = "";

  if (leaderboard.length === 0) {
    container.innerHTML = "<p style='text-align: center; color: var(--text-muted);'>Нет игроков</p>";
    return;
  }

  let html = `
    <table class="leaderboard-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Имя</th>
          <th>Баллы</th>
          <th>Процент</th>
        </tr>
      </thead>
      <tbody>
  `;

  leaderboard.forEach((player, index) => {
    const rank = index + 1;
    const medals = ["🥇", "🥈", "🥉"];
    const medal = rank <= 3 ? medals[rank - 1] : rank;
    const isCurrentUser = player.name === playerName;

    html += `
      <tr class="${isCurrentUser ? "player-row" : ""}">
        <td class="rank"><span class="medal">${medal}</span></td>
        <td class="name">${escapeHtml(player.name)}</td>
        <td class="score">${player.score.toFixed(2)}</td>
        <td style="text-align: right; color: var(--text-muted);">${player.percentage}%</td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  container.innerHTML = html;
});

/**
 * Викторина остановлена — очищаем сессию и перезагружаем
 */
socket.on("quiz-stopped", () => {
  clearSession();
  alert("Викторина остановлена ведущим.");
  location.reload();
});

/**
 * Викторина перезапущена — очищаем сессию и перезагружаем
 */
socket.on("quiz-restarted", () => {
  clearSession();
  alert("Викторина перезапущена ведущим! Введите имя заново.");
  location.reload();
});
