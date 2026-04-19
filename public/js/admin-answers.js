/**
 * admin-answers.js — Управление вариантами ответов
 */

/**
 * Переключает галочку правильного ответа (режим — несколько).
 * @param {HTMLElement} btn - Элемент кнопки-галочки
 */
function toggleCorrect(btn) {
  btn.classList.toggle("checked");
}

/**
 * Добавляет новый вариант ответа в редактор множественного выбора.
 */
function addAnswer() {
  const container = document.getElementById("answers-container");
  const addBtn = container.querySelector(".add-answer-btn");
  const index = container.querySelectorAll(".answer-row").length;

  const row = document.createElement("div");
  row.className = "answer-row";
  row.dataset.image = "";
  row.innerHTML = `
    <span class="answer-number">${index + 1}</span>
    <textarea placeholder="Текст варианта (необязательно, если есть изображение)..."></textarea>
    <div class="row-actions">
      <button
        class="answer-image-btn"
        onclick="addAnswerImage(this)"
        title="Добавить изображение"
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
      <img class="answer-image-preview" style="display:none;width:32px;height:32px;object-fit:cover;border-radius:4px;cursor:pointer;" onclick="removeAnswerImagePreview(this)" title="Удалить изображение" />
      <button
        class="correct-checkbox"
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
  container.insertBefore(row, addBtn);
  updateAnswerNumbers();
}

/**
 * Удаляет вариант ответа (минимум 2 должно остаться).
 * @param {HTMLElement} btn - Кнопка удаления внутри строки
 */
function removeAnswer(btn) {
  const row = btn.closest(".answer-row");
  const container = document.getElementById("answers-container");
  if (container.querySelectorAll(".answer-row").length > 2) {
    row.remove();
    updateAnswerNumbers();
  } else {
    alert("Минимум 2 варианта!");
  }
}

/**
 * Обновляет номера вариантов ответов в редакторе множественного выбора.
 */
function updateAnswerNumbers() {
  const container = document.getElementById("answers-container");
  container.querySelectorAll(".answer-row").forEach((row, i) => {
    row.querySelector(".answer-number").textContent = i + 1;
    row.querySelector("textarea").placeholder =
      `Введите вариант ответа...`;
  });
}

/**
 * Добавляет новый элемент в редактор порядка (ordering).
 */
function addOrderingAnswer() {
  const container = document.getElementById("ordering-container");
  const addBtn = container.querySelector(".add-answer-btn");
  const index = container.querySelectorAll(".answer-row").length;

  const row = document.createElement("div");
  row.className = "answer-row";
  row.innerHTML = `
    <span class="answer-number">${index + 1}</span>
    <textarea placeholder="Введите элемент..."></textarea>
    <div class="row-actions">
      <button onclick="removeOrderingAnswer(this)" title="Удалить">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <span class="answer-position-badge">Позиция ${index + 1}</span>
    </div>
  `;
  container.insertBefore(row, addBtn);
  updateOrderingNumbers();
}

/**
 * Удаляет элемент из редактора порядка (минимум 2 должно остаться).
 * @param {HTMLElement} btn - Кнопка удаления внутри строки
 */
function removeOrderingAnswer(btn) {
  const row = btn.closest(".answer-row");
  const container = document.getElementById("ordering-container");
  if (container.querySelectorAll(".answer-row").length > 2) {
    row.remove();
    updateOrderingNumbers();
  } else {
    alert("Минимум 2 элемента!");
  }
}

/**
 * Обновляет номера и позиции элементов в редакторе порядка.
 */
function updateOrderingNumbers() {
  const container = document.getElementById("ordering-container");
  container.querySelectorAll(".answer-row").forEach((row, i) => {
    row.querySelector(".answer-number").textContent = i + 1;
    row.querySelector(".answer-position-badge").textContent =
      `Позиция ${i + 1}`;
  });
}

/**
 * Добавляет новую пару вопрос-ответ в редактор соответствий (matching).
 */
function addMatchingPair() {
  const container = document.getElementById("matching-container");
  const pair = document.createElement("div");
  pair.className = "matching-editor-row";
  pair.innerHTML = `
    <input type="text" class="matching-left" placeholder="Вопрос" />
    <span class="matching-arrow">→</span>
    <input type="text" class="matching-right" placeholder="Ответ" />
    <button class="btn btn-small btn-danger" onclick="removeMatchingPair(this)" style="width:36px;height:36px;padding:0;" title="Удалить пару">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;
  container.appendChild(pair);
}

/**
 * Удаляет пару из редактора соответствий (минимум 2 должно остаться).
 * @param {HTMLElement} btn - Кнопка удаления внутри строки пары
 */
function removeMatchingPair(btn) {
  const container = document.getElementById("matching-container");
  if (container.querySelectorAll(".matching-editor-row").length > 2) {
    btn.parentElement.remove();
  } else {
    alert("Минимум 2 пары!");
  }
}
