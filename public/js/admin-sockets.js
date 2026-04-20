/**
 * admin-sockets.js — Socket.IO обработчики событий сервера
 */

/**
 * Экранирует HTML-символы для безопасного вывода текста.
 * @param {string} text - Исходный текст
 * @returns {string} Экранированный HTML
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ---------- Викторины ----------

socket.on("quiz-created", () => {
  socket.emit("get-quizzes");
});

socket.on("quizzes-list", (quizzesData) => {
  quizzes = quizzesData;
  const list = document.getElementById("quizzes-list-container");
  const gameList = document.getElementById("game-quiz-list");

  list.innerHTML = quizzes.length
    ? quizzes
        .map(
          (q) => `
        <div class="quiz-item" onclick="openQuizDetail('${q.id}', '${q.name}')">
          <div>
            <div class="name">${escapeHtml(q.name)}</div>
            <div class="count">${q.questionsCount} вопр.</div>
          </div>
          <div class="quiz-item-actions">
            <button class="btn btn-small btn-secondary" onclick="event.stopPropagation(); selectQuiz('${q.id}')">Выбрать</button>
            <button class="btn btn-small btn-danger" onclick="event.stopPropagation(); deleteQuiz('${q.id}')">Удалить</button>
          </div>
        </div>
      `,
        )
        .join("")
    : '<div class="empty-state">Нет викторин. Создайте первую!</div>';

  gameList.innerHTML = quizzes
    .map(
      (q) => `
    <div class="quiz-item" onclick="selectQuiz('${q.id}')">
      <span class="name">${escapeHtml(q.name)}</span>
      <span class="count">${q.questionsCount} вопр.</span>
    </div>
  `,
    )
    .join("");
});

// ---------- Вопросы ----------

socket.on("question-added", () => {
  socket.emit("get-quiz-questions", currentQuizId);
});

socket.on("question-error", (data) => {
  alert(data.error);
});

socket.on("question-updated", () => {
  // Сбрасываем индекс редактирования только после успешного ответа сервера
  window.editQuestionIndex = undefined;
  // Возвращаем кнопку в исходное состояние
  const saveBtn = document.getElementById("save-question-btn");
  const cancelBtn = document.getElementById("cancel-edit-btn");
  if (saveBtn) {
    saveBtn.textContent = "Сохранить вопрос";
    saveBtn.classList.add("btn-success");
    saveBtn.classList.remove("btn-warning");
  }
  if (cancelBtn) {
    cancelBtn.style.display = "none";
  }
  // Обновляем список вопросов
  socket.emit("get-quiz-questions", currentQuizId);
});

socket.on("quiz-questions", (data) => {
  const index = window.editQuestionIndex;

  // Если это ответ на редактирование (индекс установлен), заполняем форму
  if (index !== undefined && index !== null) {
    const q = data.questions[index];
    if (!q) {
      window.editQuestionIndex = undefined;
      return;
    }

    document.getElementById("question-text").value = q.text;
    selectQuestionType(q.type);

    if (q.type === "multiple_choice") {
      const container = document.getElementById("answers-container");
      container.innerHTML = "";
      q.options.forEach((opt, i) => {
        const row = document.createElement("div");
        row.className = "answer-row";
        const isChecked = q.correct.includes(i) ? "checked" : "";
        // Поддержка как строк так и объектов {text, image}
        const optText = typeof opt === "object" ? opt.text || opt : opt;
        const optImage = typeof opt === "object" ? opt.image || "" : "";
        row.dataset.image = optImage;

        const imageBtnStyle = optImage ? "display:none" : "";
        const imagePreviewStyle = optImage ? "" : "display:none";
        const imagePreviewSrc = optImage ? `src="${optImage}"` : "";

        row.innerHTML = `
          <span class="answer-number">${i + 1}</span>
          <textarea placeholder="Текст варианта (необязательно, если есть изображение)...">${escapeHtml(optText)}</textarea>
          <div class="row-actions">
            <button
              class="answer-image-btn"
              onclick="addAnswerImage(this)"
              title="Добавить изображение"
              style="${imageBtnStyle}"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </button>
            <input
              type="file"
              accept="image/*"
              style="display:none"
              onchange="handleAnswerImage(this)"
            />
            <img class="answer-image-preview" ${imagePreviewSrc} style="width:32px;height:32px;object-fit:cover;border-radius:4px;cursor:pointer;${imagePreviewStyle}" onclick="removeAnswerImagePreview(this)" title="Удалить изображение" />
            <button
              class="correct-checkbox ${isChecked}"
              onclick="toggleCorrect(this)"
              title="Правильный ответ"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
            <button onclick="removeAnswer(this)" title="Удалить">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        `;
        container.appendChild(row);
      });
      const addBtn = document.createElement("div");
      addBtn.className = "add-answer-btn";
      addBtn.textContent = "+ Добавить вариант";
      addBtn.onclick = addAnswer;
      container.appendChild(addBtn);

      const answerTypeRadio = document.querySelector(
        `input[name="answer-type"][value="${q.answerType || "single"}"]`,
      );
      if (answerTypeRadio) answerTypeRadio.checked = true;
      // Не вызываем updateAnswerHint(), чтобы не сбросить галочки
      // Просто устанавливаем правильные обработчики
      const answerType = q.answerType || "single";
      document
        .querySelectorAll("#answers-container .correct-checkbox")
        .forEach((cb) => {
          if (answerType === "single") {
            cb.onclick = () => toggleCorrectSingle(cb);
          } else {
            cb.onclick = () => toggleCorrect(cb);
          }
        });
    } else if (q.type === "true_false") {
      document.querySelectorAll(".tf-option").forEach((t, i) => {
        t.classList.remove("selected", "true", "false");
        if (i === q.correct[0]) {
          t.classList.add("selected");
          t.classList.add(
            t.classList.contains("true") ? "true" : "false",
          );
        }
      });
      tfSelected = q.correct[0];
    } else if (q.type === "fill_blank" || q.type === "open_ended") {
      document.getElementById("correct-answer-text").value =
        q.options[0] || "";
    } else if (q.type === "ordering") {
      const container = document.getElementById("ordering-container");
      container.innerHTML = "";
      q.options.forEach((opt, i) => {
        const row = document.createElement("div");
        row.className = "answer-row";
        row.innerHTML = `
          <span class="answer-number">${i + 1}</span>
          <textarea placeholder="Элемент">${escapeHtml(opt)}</textarea>
          <div class="row-actions">
            <button onclick="removeOrderingAnswer(this)" title="Удалить">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <span class="answer-position-badge">Позиция ${i + 1}</span>
          </div>
        `;
        container.appendChild(row);
      });
      const addBtn = document.createElement("div");
      addBtn.className = "add-answer-btn";
      addBtn.textContent = "+ Добавить элемент";
      addBtn.onclick = addOrderingAnswer;
      container.appendChild(addBtn);
    } else if (q.type === "matching") {
      const container = document.getElementById("matching-container");
      container.innerHTML = "";
      q.options.forEach((pair, i) => {
        const div = document.createElement("div");
        div.className = "matching-editor-row";
        div.innerHTML = `
          <input type="text" class="matching-left" value="${escapeHtml(pair.left)}" placeholder="Вопрос" />
          <span class="matching-arrow">→</span>
          <input type="text" class="matching-right" value="${escapeHtml(pair.right)}" placeholder="Ответ" />
          <button class="btn btn-small btn-danger" onclick="removeMatchingPair(this)" style="width:36px;height:36px;padding:0;" title="Удалить пару">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        `;
        container.appendChild(div);
      });
    }

    // Обновляем изображение
    if (q.image) {
      imageBase64 = q.image;
      document.getElementById("image-preview").src = q.image;
      document
        .getElementById("image-preview-container")
        .classList.add("show");
    } else {
      document
        .getElementById("image-preview-container")
        .classList.remove("show");
    }

    document.querySelectorAll(".time-option").forEach((t) => {
      t.classList.toggle(
        "selected",
        parseInt(t.dataset.time) === (q.timeLimit || 30),
      );
    });
    selectedTime = q.timeLimit || 30;

    document
      .getElementById("question-text")
      .scrollIntoView({ behavior: "smooth" });

    // НЕ сбрасываем editQuestionIndex здесь — он нужен в saveQuestion()
    // чтобы определить что мы обновляем, а не создаём
    // Сброс произойдёт только в question-updated или cancelEditQuestion
    return;
  }

  const container = document.getElementById("questions-list");
  if (data.questions.length === 0) {
    container.innerHTML =
      '<div class="empty-state">Пока нет вопросов. Добавьте первый!</div>';
    return;
  }
  container.innerHTML = data.questions
    .map(
      (q, i) => `
    <div class="question-item-card">
      <div class="q-number">${i + 1}</div>
      <div class="q-content">
        <div class="q-text">${escapeHtml(q.text)}</div>
        <div class="q-meta">
          <span>${q.type === "open_ended" ? "Развёрнутый ответ" : q.type === "fill_blank" ? "Заполнить пробел" : q.type === "true_false" ? "Правда/Ложь" : q.type === "ordering" ? "Порядок" : q.type === "matching" ? "Соответствие" : "Множественный выбор"}</span>
          <span>${q.timeLimit || 30} сек</span>
          ${q.type === "multiple_choice" ? `<span>${q.answerType === "multiple" ? "Несколько ответов" : q.answerType === "any" ? "Один или несколько" : "Один ответ"}</span>` : ""}
        </div>
      </div>
      <div class="q-actions">
        <button class="btn btn-small btn-secondary" onclick="startEditQuestion(${i})" title="Редактировать">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn btn-small btn-danger" onclick="deleteQuestion(${i})" title="Удалить">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  `,
    )
    .join("");
});

// ---------- Состояние игры ----------

socket.on("quiz-ready", (data) => {
  document.getElementById("game-not-started").classList.add("hidden");
  document.getElementById("game-active").classList.remove("hidden");
  const qrBtn = document.getElementById("play-qr-btn");
  if (qrBtn) qrBtn.classList.remove("hidden");
  document.getElementById("current-quiz-name").textContent =
    `${data.name} (${data.questionsCount} вопросов)`;
  document.getElementById("start-btn").disabled = false;
  document.getElementById("stop-btn").disabled = true;
  document
    .getElementById("game-info-card")
    .classList.remove("quiz-running");
});

socket.on("quiz-stopped", () => {
  // Сбрасываем состояние игры
  currentQuizId = null;
  const qrBtn = document.getElementById("play-qr-btn");
  if (qrBtn) qrBtn.classList.add("hidden");

  // Показываем список викторин
  document.getElementById("game-not-started").classList.remove("hidden");
  document.getElementById("game-active").classList.add("hidden");
  document.getElementById("game-status").textContent =
    "Ожидание запуска...";
  document.getElementById("start-btn").disabled = false;
  document.getElementById("stop-btn").disabled = true;
  document
    .getElementById("game-info-card")
    .classList.remove("quiz-running");

  // Скрываем вкладку рейтинга
  document.getElementById("leaderboard-tab-btn").classList.add("hidden");
  document.getElementById("leaderboard-tab").classList.add("hidden");

  // Переключаемся на вкладку "Викторины"
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  document.querySelector('.tab[data-tab="quizzes"]').classList.add("active");
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById("quizzes-tab").classList.add("active");
});

// Восстановление состояния игры после перезагрузки страницы
socket.on("game-state", (data) => {
  if (data.currentQuizId) {
    currentQuizId = data.currentQuizId;
    document.getElementById("game-not-started").classList.add("hidden");
    document.getElementById("game-active").classList.remove("hidden");
    const qrBtn = document.getElementById("play-qr-btn");
    if (qrBtn) qrBtn.classList.remove("hidden");
    document.getElementById("current-quiz-name").textContent =
      `${data.quizName || "Викторина"} (${data.questionsCount} вопросов)`;

    if (data.quizStarted) {
      // Викторина запущена
      document.getElementById("start-btn").disabled = true;
      document.getElementById("stop-btn").disabled = false;
      document.getElementById("game-status").textContent =
        "Викторина идёт...";
      document
        .getElementById("game-info-card")
        .classList.add("quiz-running");
    } else {
      // Викторина выбрана, но не запущена
      document.getElementById("start-btn").disabled = false;
      document.getElementById("stop-btn").disabled = true;
      document.getElementById("game-status").textContent =
        "Ожидание запуска...";
      document
        .getElementById("game-info-card")
        .classList.remove("quiz-running");
    }

    // Если викторина завершена - показываем вкладку "Рейтинг"
    if (data.quizFinished) {
      document
        .getElementById("leaderboard-tab-btn")
        .classList.remove("hidden");
      document
        .getElementById("leaderboard-tab")
        .classList.remove("hidden");
    }
  }
});

// ---------- Лидерборд ----------

socket.on("update-leaderboard", (leaderboard) => {
  document.getElementById("players-count").textContent =
    `Игроков: ${leaderboard.length}`;

  const container = document.getElementById("leaderboard");
  if (leaderboard.length === 0) {
    container.innerHTML =
      '<div class="empty-state">Пока нет игроков</div>';
    return;
  }

  container.innerHTML = leaderboard
    .map(
      (p, i) => `
    <div class="leaderboard-item">
      <span class="rank">#${i + 1}</span>
      <span class="name">${escapeHtml(p.name)}</span>
      <span class="score">${p.score} бал.</span>
      <span style="color:var(--text-muted);font-size:0.8rem;margin-left:0.75rem;">${p.percentage}%</span>
    </div>
  `,
    )
    .join("");
});

socket.on("all-players-finished", (data) => {
  // Показываем вкладку "Рейтинг"
  document
    .getElementById("leaderboard-tab-btn")
    .classList.remove("hidden");
  document.getElementById("leaderboard-tab").classList.remove("hidden");

  // Переключаемся на вкладку рейтинга
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  const lbTab = document.getElementById("leaderboard-tab-btn");
  if (lbTab) lbTab.classList.add("active");
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById("leaderboard-tab").classList.add("active");

  const container = document.getElementById("leaderboard");
  container.innerHTML = `
    <div style="background:rgba(16,185,129,0.15);color:var(--success);padding:1.25rem;border-radius:12px;margin-bottom:1rem;">
      <strong>Все игроки завершили викторину!</strong>
    </div>
    ${data.leaderboard
      .map(
        (p, i) => `
      <div class="leaderboard-item">
        <span class="rank">#${i + 1}</span>
        <span class="name">${escapeHtml(p.name)}</span>
        <div style="display:flex;gap:0.75rem;align-items:center;">
          <span class="score">${p.score} бал.</span>
          <span style="background:var(--accent);color:white;padding:0.25rem 0.75rem;border-radius:8px;font-size:0.8rem;">${p.percentage}%</span>
        </div>
      </div>
    `,
      )
      .join("")}
  `;
});

socket.on("players-count", (data) => {
  const playersOnlineEl = document.getElementById("players-online");
  if (playersOnlineEl) {
    playersOnlineEl.textContent = data.count;
  }
  const playersCountEl = document.getElementById("players-count");
  if (playersCountEl) {
    playersCountEl.textContent = `Игроков: ${data.count}`;
  }
  console.log(`Игроков онлайн: ${data.count}`);
});

socket.on("final-leaderboard", (leaderboard) => {
  const quizName =
    document.getElementById("current-quiz-name").textContent ||
    "Викторина";
  const timestamp = new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/:/g, "-");

  let csv = "Место,Игрок,Баллы,Процент,Вопросов решено\n";
  leaderboard.forEach((p, i) => {
    csv += `${i + 1},"${p.name}",${p.score},${p.percentage}%,${p.answered}\n`;
  });

  const blob = new Blob(["\ufeff" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${quizName}_${timestamp}.csv`;
  link.click();
});
