/**
 * Index Timer — логика таймера
 */

/**
 * Запуск таймера
 * @param {number} timeLeft — начальное время (секунды)
 */
function startTimer(timeLeft) {
  if (timerInterval) clearInterval(timerInterval);

  const timerText = document.getElementById("timer-text");
  const timerFill = document.getElementById("timer-fill");

  timerFill.classList.remove("warning", "danger");
  timerFill.style.width = "100%";

  let remaining = timeLeft;
  timerText.textContent = remaining;

  timerInterval = setInterval(() => {
    remaining--;
    timerText.textContent = remaining;

    const percent = (remaining / timeLeft) * 100;
    timerFill.style.width = percent + "%";

    if (remaining <= 10 && remaining > 5) {
      timerFill.classList.add("warning");
    } else if (remaining <= 5) {
      timerFill.classList.add("danger");
    }

    if (remaining <= 0) {
      clearInterval(timerInterval);
      timeUp();
    }
  }, 1000);
}

/**
 * Время вышло — отправка текущего ответа
 */
function timeUp() {
  document.getElementById("time-up").style.display = "block";

  // Отправляем то, что пользователь выбрал (если выбрал)
  if (
    currentQuestionType === "multiple_choice" &&
    selectedMCIndex !== null
  ) {
    socket.emit("submit-answer", selectedMCIndex);
  } else if (
    currentQuestionType === "true_false" &&
    selectedTFIndex !== null
  ) {
    socket.emit("submit-answer", selectedTFIndex);
  } else if (
    currentQuestionType === "fill_blank" ||
    currentQuestionType === "open_ended"
  ) {
    const input = document.getElementById("text-answer-input");
    const answer = input.value.trim();
    if (answer) {
      socket.emit("submit-answer", { type: "text", answer: answer });
    } else {
      socket.emit("time-up");
    }
  } else if (currentQuestionType === "ordering") {
    const list = document.getElementById("ordering-list");
    const items = Array.from(list.children);
    const userOrder = items.map((item) => parseInt(item.dataset.index));
    socket.emit("submit-answer", { type: "ordering", answer: userOrder });
  } else if (currentQuestionType === "matching") {
    if (matchingUserPairs.length >= matchingTotal) {
      socket.emit("submit-answer", {
        type: "matching",
        pairs: matchingUserPairs.map((p) => ({
          questionIndex: p.questionIndex,
          answerIndex: p.answerIndex,
        })),
      });
    } else {
      socket.emit("time-up");
    }
  } else {
    socket.emit("time-up");
  }

  hasAnswered = true;
  disableAllInputs();
}
