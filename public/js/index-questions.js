/**
 * Index Questions — рендеринг вопросов (Multiple Choice, Ordering, Matching)
 */

/**
 * Рендер Multiple Choice
 * @param {Array} options — варианты ответов
 */
function renderMultipleChoice(options) {
  const container = document.getElementById("options-container");
  container.style.display = "flex";
  container.style.flexDirection = "column";
  selectedMCIndex = null;
  const submitBtn = document.getElementById("submit-mc-btn");
  submitBtn.style.display = "block";
  submitBtn.disabled = false;

  options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";

    // Поддержка как строк так и объектов {text, image}
    const optText =
      typeof option === "object" ? option.text || "" : option;
    const optImage =
      typeof option === "object" ? option.image || null : null;

    if (optImage) {
      if (optText) {
        btn.innerHTML = `<img src="${optImage}" style="max-width:100%;max-height:120px;object-fit:contain;border-radius:8px;margin-bottom:0.5rem;" /><span>${escapeHtml(optText)}</span>`;
      } else {
        // Только картинка без текста
        btn.innerHTML = `<img src="${optImage}" style="max-width:100%;max-height:150px;object-fit:contain;border-radius:8px;" />`;
      }
      btn.style.flexDirection = "column";
      btn.style.alignItems = "center";
      btn.style.textAlign = "center";
    } else {
      btn.textContent = optText;
    }

    btn.onclick = () => selectMultipleChoice(index, btn);
    container.appendChild(btn);
  });
}

/**
 * Выбор варианта Multiple Choice
 * @param {number} index
 * @param {HTMLElement} btn
 */
function selectMultipleChoice(index, btn) {
  if (hasAnswered) return;
  selectedMCIndex = index;
  document
    .querySelectorAll(".option-btn")
    .forEach((b) => b.classList.remove("selected"));
  btn.classList.add("selected");
}

/**
 * Рендер Ordering (drag & drop)
 * @param {Array} options — элементы для упорядочивания
 */
function renderOrdering(options) {
  const list = document.getElementById("ordering-list");
  list.innerHTML = "";
  orderingItems = [...options];

  // Перемешиваем для игрока
  const shuffled = orderingItems.map((opt, i) => ({
    text: opt,
    originalIndex: i,
  }));
  shuffled.sort(() => Math.random() - 0.5);

  shuffled.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "ordering-item";
    li.draggable = true;
    li.dataset.index = item.originalIndex;
    li.innerHTML = `
      <span class="drag-handle">⋮⋮</span>
      <span class="item-text">${item.text}</span>
    `;

    li.addEventListener("dragstart", handleOrderingDragStart);
    li.addEventListener("dragover", handleOrderingDragOver);
    li.addEventListener("drop", handleOrderingDrop);
    li.addEventListener("dragend", handleOrderingDragEnd);

    list.appendChild(li);
  });

  const submitBtn = document.getElementById("submit-order-btn");
  submitBtn.style.display = "block";
  submitBtn.disabled = false;
}

// Ordering Drag & Drop обработчики
function handleOrderingDragStart(e) {
  orderingDragSrcEl = this;
  this.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
}

function handleOrderingDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  return false;
}

function handleOrderingDrop(e) {
  e.stopPropagation();
  if (orderingDragSrcEl !== this) {
    const allItems = Array.from(
      document.getElementById("ordering-list").children,
    );
    const srcIndex = allItems.indexOf(orderingDragSrcEl);
    const targetIndex = allItems.indexOf(this);

    if (srcIndex < targetIndex) {
      this.parentNode.insertBefore(orderingDragSrcEl, this.nextSibling);
    } else {
      this.parentNode.insertBefore(orderingDragSrcEl, this);
    }
  }
  return false;
}

function handleOrderingDragEnd() {
  this.classList.remove("dragging");
}

/**
 * Рендер Matching (drag & drop)
 * @param {Array} options — пары для соответствия
 */
function renderMatching(options) {
  const leftCol = document.getElementById("matching-left");
  const rightCol = document.getElementById("matching-right");
  leftCol.innerHTML = "";
  rightCol.innerHTML = "";

  matchingDragged = null;
  matchingMatches = 0;
  matchingTotal = options.length;
  matchingUserPairs = [];

  // Левая колонка - вопросы (перемешаны)
  const shuffledLeft = [...options].sort(() => Math.random() - 0.5);
  shuffledLeft.forEach((pair, i) => {
    const item = document.createElement("div");
    item.className = "matching-item";
    item.draggable = true;
    item.textContent = pair.left;
    item.dataset.index = options.indexOf(pair);
    item.ondragstart = handleMatchingDragStart;
    item.ondragend = handleMatchingDragEnd;
    leftCol.appendChild(item);
  });

  // Правая колонка - ответы (перемешаны) — это dropzone
  const shuffledRight = [...options].sort(() => Math.random() - 0.5);
  shuffledRight.forEach((pair, i) => {
    const dropzone = document.createElement("div");
    dropzone.className = "matching-dropzone";
    dropzone.textContent = pair.right;
    dropzone.dataset.answer = pair.right;
    dropzone.dataset.correctIndex = options.indexOf(pair);

    dropzone.ondragover = handleMatchingDragOver;
    dropzone.ondragleave = handleMatchingDragLeave;
    dropzone.ondrop = handleMatchingDrop;

    rightCol.appendChild(dropzone);
  });

  // Добавляем dropzone в левую колонку (чтобы можно было вернуть элемент)
  leftCol.ondragover = handleMatchingLeftDragOver;
  leftCol.ondragleave = handleMatchingLeftDragLeave;
  leftCol.ondrop = handleMatchingLeftDrop;

  document.getElementById("matching-container").style.display = "grid";
  const submitBtn = document.getElementById("submit-matching-btn");
  submitBtn.style.display = "block";
  submitBtn.disabled = false;
}

// Matching Drag & Drop обработчики
function handleMatchingDragStart(e) {
  matchingDragged = this;
  this.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  if (this.dataset.placedInDropzone) {
    matchingDraggedFromDropzone = this.dataset.placedInDropzone;
  }
}

function handleMatchingDragEnd() {
  this.classList.remove("dragging");
  matchingDragged = null;
  matchingDraggedFromDropzone = null;
  document.querySelectorAll(".matching-dropzone").forEach((dz) => {
    dz.classList.remove("drag-over");
  });
}

function handleMatchingDragOver(e) {
  e.preventDefault();
  this.classList.add("drag-over");
  return false;
}

function handleMatchingDragLeave() {
  this.classList.remove("drag-over");
}

function handleMatchingDrop(e) {
  e.stopPropagation();
  this.classList.remove("drag-over");

  if (!matchingDragged) return false;

  const draggedIndex = parseInt(matchingDragged.dataset.index);
  const correctIndex = parseInt(this.dataset.correctIndex);

  // Если эта dropzone уже занята другим элементом
  if (this.classList.contains("has-item")) {
    const existingPairIndex = matchingUserPairs.findIndex(
      (p) => p.answerIndex === correctIndex,
    );
    if (existingPairIndex !== -1) {
      matchingUserPairs.splice(existingPairIndex, 1);
    }
  }

  // Если перетаскиваемый элемент уже был в другой dropzone, убираем его оттуда
  if (matchingDraggedFromDropzone) {
    const oldPairIndex = matchingUserPairs.findIndex(
      (p) => p.questionIndex === draggedIndex,
    );
    if (oldPairIndex !== -1) {
      matchingUserPairs.splice(oldPairIndex, 1);
    }
    const oldDropzone = document.querySelector(
      `.matching-dropzone[data-correct-index="${matchingDraggedFromDropzone}"]`,
    );
    if (oldDropzone) {
      oldDropzone.classList.remove("has-item", "matched");
      oldDropzone.textContent = oldDropzone.dataset.answer;
    }
  }

  // Запоминаем новый выбор
  matchingUserPairs.push({
    questionIndex: draggedIndex,
    answerIndex: correctIndex,
  });

  // Визуально размещаем элемент в dropzone
  this.classList.add("has-item", "matched");
  this.textContent = matchingDragged.textContent;
  this.dataset.placedItemIndex = draggedIndex;

  matchingDragged.classList.add("matched");
  matchingDragged.dataset.placedInDropzone = correctIndex;
  matchingDragged.draggable = true;
  matchingDragged.style.opacity = "0.5";

  matchingDragged = null;
  matchingDraggedFromDropzone = null;

  return false;
}

function handleMatchingLeftDragOver(e) {
  e.preventDefault();
  this.classList.add("drag-over");
  return false;
}

function handleMatchingLeftDragLeave() {
  this.classList.remove("drag-over");
}

function handleMatchingLeftDrop(e) {
  e.stopPropagation();

  if (!matchingDragged) return false;

  const draggedIndex = parseInt(matchingDragged.dataset.index);

  if (matchingDraggedFromDropzone) {
    const pairIndex = matchingUserPairs.findIndex(
      (p) => p.questionIndex === draggedIndex,
    );
    if (pairIndex !== -1) {
      matchingUserPairs.splice(pairIndex, 1);
    }
    const dropzone = document.querySelector(
      `.matching-dropzone[data-correct-index="${matchingDraggedFromDropzone}"]`,
    );
    if (dropzone) {
      dropzone.classList.remove("has-item", "matched");
      dropzone.textContent = dropzone.dataset.answer;
    }
  }

  matchingDragged.classList.remove("matched");
  matchingDragged.style.opacity = "1";
  matchingDragged.draggable = true;
  delete matchingDragged.dataset.placedInDropzone;

  matchingDragged = null;
  matchingDraggedFromDropzone = null;

  return false;
}
