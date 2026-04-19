/**
 * Index Submit — отправка ответов всех типов
 */

/**
 * Отправка Multiple Choice
 */
function submitMultipleChoiceFinal() {
  if (selectedMCIndex === null) {
    const hintEl = document.getElementById("answer-hint");
    hintEl.textContent = "Выберите вариант ответа!";
    hintEl.style.color = "var(--danger)";
    setTimeout(() => {
      hintEl.style.color = "";
      hintEl.textContent = "Выберите один или несколько вариантов";
    }, 2000);
    return;
  }
  if (hasAnswered) return;
  hasAnswered = true;
  document
    .querySelectorAll(".option-btn")
    .forEach((b) => (b.disabled = true));
  document.getElementById("submit-mc-btn").style.display = "none";
  document.getElementById("loading-next").style.display = "block";
  socket.emit("submit-answer", selectedMCIndex);
}

/**
 * Выбор True/False
 * @param {number} answer — 0 (Правда) или 1 (Ложь)
 */
function selectTFAnswer(answer) {
  if (hasAnswered) return;
  selectedTFIndex = answer;
  document.querySelectorAll(".tf-btn").forEach((b) => {
    b.classList.remove("selected");
  });
  document.querySelectorAll(".tf-btn")[answer].classList.add("selected");
}

/**
 * Отправка True/False
 */
function submitTFFinal() {
  if (selectedTFIndex === null) {
    const hintEl = document.getElementById("answer-hint");
    hintEl.textContent = "Выберите вариант!";
    hintEl.style.color = "var(--danger)";
    setTimeout(() => {
      hintEl.style.color = "";
      hintEl.textContent = "Выберите вариант";
    }, 2000);
    return;
  }
  if (hasAnswered) return;
  hasAnswered = true;
  document.querySelectorAll(".tf-btn").forEach((b) => (b.disabled = true));
  document.getElementById("submit-tf-btn").style.display = "none";
  document.getElementById("loading-next").style.display = "block";
  socket.emit("submit-answer", selectedTFIndex);
}

/**
 * Отправка текстового ответа
 */
function submitTextFinal() {
  const input = document.getElementById("text-answer-input");
  const answer = input.value.trim();
  if (!answer) {
    const hintEl = document.getElementById("answer-hint");
    hintEl.textContent = "Введите ответ!";
    hintEl.style.color = "var(--danger)";
    setTimeout(() => {
      hintEl.style.color = "";
      hintEl.textContent = "Введите ответ";
    }, 2000);
    return;
  }
  if (hasAnswered) return;
  hasAnswered = true;
  input.disabled = true;
  document.querySelector(".submit-answer-btn").disabled = true;
  document.getElementById("loading-next").style.display = "block";
  socket.emit("submit-answer", { type: "text", answer: answer });
}

/**
 * Отправка Ordering
 */
function submitOrderingFinal() {
  if (hasAnswered) return;
  hasAnswered = true;

  const list = document.getElementById("ordering-list");
  const items = Array.from(list.children);
  const userOrder = items.map((item) => parseInt(item.dataset.index));

  document.getElementById("submit-order-btn").style.display = "none";
  document.getElementById("loading-next").style.display = "block";
  socket.emit("submit-answer", { type: "ordering", answer: userOrder });
}

/**
 * Отправка Matching
 */
function submitMatchingFinal() {
  if (hasAnswered) return;

  // Проверяем, все ли пары собраны
  if (matchingUserPairs.length < matchingTotal) {
    const hintEl = document.getElementById("answer-hint");
    hintEl.textContent = `Соедините все пары! (${matchingUserPairs.length}/${matchingTotal})`;
    hintEl.style.color = "var(--danger)";
    setTimeout(() => {
      hintEl.style.color = "";
      hintEl.textContent = "Соотнесите пары";
    }, 2000);
    return;
  }

  hasAnswered = true;
  document.getElementById("submit-matching-btn").style.display = "none";
  document.getElementById("loading-next").style.display = "block";

  // Отправляем реальные пары на сервер для проверки
  socket.emit("submit-answer", {
    type: "matching",
    pairs: matchingUserPairs.map((p) => ({
      questionIndex: p.questionIndex,
      answerIndex: p.answerIndex,
    })),
  });
}
