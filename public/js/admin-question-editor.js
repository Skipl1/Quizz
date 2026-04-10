/**
 * admin-question-editor.js — Редактирование вопросов
 */

/**
 * Выбирает тип вопроса и показывает соответствующий редактор.
 * @param {string} type - Тип вопроса (multiple_choice, true_false, fill_blank, ordering, matching)
 */
function selectQuestionType(type) {
  selectedQuestionType = type;
  document
    .querySelectorAll(".question-type")
    .forEach((t) => t.classList.remove("selected"));
  document
    .querySelector(`.question-type[data-type="${type}"]`)
    .classList.add("selected");

  document
    .getElementById("multiple-choice-editor")
    .classList.add("hidden");
  document.getElementById("true-false-editor").classList.add("hidden");
  document.getElementById("text-answer-editor").classList.add("hidden");
  document.getElementById("ordering-editor").classList.add("hidden");
  document.getElementById("matching-editor").classList.add("hidden");

  if (type === "multiple_choice") {
    document
      .getElementById("multiple-choice-editor")
      .classList.remove("hidden");
    updateAnswerHint();
  } else if (type === "true_false") {
    document
      .getElementById("true-false-editor")
      .classList.remove("hidden");
  } else if (type === "fill_blank" || type === "open_ended") {
    document
      .getElementById("text-answer-editor")
      .classList.remove("hidden");
  } else if (type === "ordering") {
    document.getElementById("ordering-editor").classList.remove("hidden");
  } else if (type === "matching") {
    document.getElementById("matching-editor").classList.remove("hidden");
  }
}

/**
 * Обновляет подсказку для типа ответа (один, несколько, любое количество).
 */
function updateAnswerHint() {
  const answerType = document.querySelector(
    'input[name="answer-type"]:checked',
  ).value;
  const hintEl = document.getElementById("answer-hint");

  // Сбрасываем все галочки при смене типа
  document
    .querySelectorAll("#answers-container .correct-checkbox")
    .forEach((cb) => {
      cb.classList.remove("checked");
    });

  if (answerType === "single") {
    hintEl.textContent = "Выберите ОДИН правильный ответ";
    document
      .querySelectorAll("#answers-container .correct-checkbox")
      .forEach((cb) => {
        cb.onclick = () => toggleCorrectSingle(cb);
      });
  } else if (answerType === "multiple") {
    hintEl.textContent = "Отметьте ВСЕ правильные ответы";
    document
      .querySelectorAll("#answers-container .correct-checkbox")
      .forEach((cb) => {
        cb.onclick = () => toggleCorrect(cb);
      });
  } else {
    hintEl.textContent = "Отметьте один или несколько правильных ответов";
    document
      .querySelectorAll("#answers-container .correct-checkbox")
      .forEach((cb) => {
        cb.onclick = () => toggleCorrect(cb);
      });
  }
}

/**
 * Переключает галочку правильного ответа (режим — только один).
 * Снимает галочки со всех остальных вариантов.
 * @param {HTMLElement} btn - Элемент кнопки-галочки
 */
function toggleCorrectSingle(btn) {
  document
    .querySelectorAll("#answers-container .correct-checkbox")
    .forEach((cb) => {
      if (cb !== btn) cb.classList.remove("checked");
    });
  btn.classList.toggle("checked");
}

/**
 * Выбирает вариант Правда/Ложь.
 * @param {HTMLElement} el - Выбранный элемент tf-option
 */
function selectTF(el) {
  tfSelected = parseInt(el.dataset.value);
  document.querySelectorAll(".tf-option").forEach((t) => {
    t.classList.remove("selected");
    t.classList.remove("true");
    t.classList.remove("false");
  });
  el.classList.add("selected");
  el.classList.add(el.classList.contains("true") ? "true" : "false");
}

/**
 * Выбирает лимит времени для вопроса.
 * @param {HTMLElement} el - Выбранный элемент time-option
 */
function selectTime(el) {
  selectedTime = parseInt(el.dataset.time);
  document
    .querySelectorAll(".time-option")
    .forEach((t) => t.classList.remove("selected"));
  el.classList.add("selected");
}

/**
 * Сохраняет вопрос (добавляет новый или обновляет существующий).
 * Собирает данные из формы и отправляет на сервер.
 */
function saveQuestion() {
  if (!currentQuizId) {
    alert("Выберите викторину");
    return;
  }

  const text = document.getElementById("question-text").value.trim();
  const questionImage = imageBase64;

  // Текст вопроса необязателен, если есть картинка
  if (!text && !questionImage) {
    alert("Введите текст вопроса или добавьте изображение");
    return;
  }

  let options = [];
  let correct = [];
  let answerType = "single";

  if (selectedQuestionType === "multiple_choice") {
    answerType = document.querySelector(
      'input[name="answer-type"]:checked',
    ).value;
    const rows = document.querySelectorAll(
      "#answers-container .answer-row",
    );
    rows.forEach((row) => {
      const textarea = row.querySelector("textarea");
      const checkbox = row.querySelector(".correct-checkbox");
      const image = row.dataset.image || "";
      const optionText = textarea.value.trim();
      // Вариант ответа необязателен, если есть картинка
      if (optionText || image) {
        const option = {
          text: optionText || "",
          image: image || null,
        };
        options.push(option);
        if (checkbox.classList.contains("checked")) {
          correct.push(options.length - 1);
        }
      }
    });
    if (options.length < 2) {
      alert("Минимум 2 варианта");
      return;
    }
    if (answerType === "single" && correct.length !== 1) {
      alert("Выберите один правильный ответ");
      return;
    }
    if (answerType === "multiple" && correct.length === 0) {
      alert("Выберите хотя бы один правильный ответ");
      return;
    }
  } else if (selectedQuestionType === "true_false") {
    options = ["Правда", "Ложь"];
    if (tfSelected === null) {
      alert("Выберите ответ");
      return;
    }
    correct = [tfSelected];
  } else if (
    selectedQuestionType === "fill_blank" ||
    selectedQuestionType === "open_ended"
  ) {
    const answer = document
      .getElementById("correct-answer-text")
      .value.trim();
    if (!answer) {
      alert("Введите ответ");
      return;
    }
    options = [answer];
    correct = [0];
  } else if (selectedQuestionType === "ordering") {
    const rows = document.querySelectorAll(
      "#ordering-container .answer-row",
    );
    rows.forEach((row) => {
      const textarea = row.querySelector("textarea");
      if (textarea.value.trim()) {
        options.push(textarea.value.trim());
      }
    });
    if (options.length < 2) {
      alert("Минимум 2 элемента");
      return;
    }
    correct = options.map((_, i) => i);
  } else if (selectedQuestionType === "matching") {
    const leftInputs = document.querySelectorAll(".matching-left");
    const rightInputs = document.querySelectorAll(".matching-right");
    leftInputs.forEach((input, i) => {
      if (input.value.trim() && rightInputs[i].value.trim()) {
        options.push({
          left: input.value.trim(),
          right: rightInputs[i].value.trim(),
        });
      }
    });
    if (options.length < 2) {
      alert("Минимум 2 пары");
      return;
    }
    correct = options.map((_, i) => i);
  }

  if (window.editQuestionIndex !== undefined) {
    socket.emit("update-question", {
      quizId: currentQuizId,
      questionIndex: window.editQuestionIndex,
      text,
      type: selectedQuestionType,
      options,
      correct,
      answerType,
      image: imageBase64,
      timeLimit: selectedTime,
    });
    // Сбрасываем индекс редактирования сразу
    window.editQuestionIndex = undefined;
  } else {
    socket.emit("add-question", {
      quizId: currentQuizId,
      text,
      type: selectedQuestionType,
      options,
      correct,
      answerType,
      image: imageBase64,
      timeLimit: selectedTime,
    });
  }

  // Сброс формы
  document.getElementById("question-text").value = "";
  document.getElementById("question-image").value = "";
  document
    .getElementById("image-preview-container")
    .classList.remove("show");
  document.getElementById("correct-answer-text").value = "";
  imageBase64 = null;
  tfSelected = null;
  document.querySelectorAll(".tf-option").forEach((t) => {
    t.classList.remove("selected");
    t.classList.remove("true");
    t.classList.remove("false");
  });

  // Очистка ответов multiple choice
  document
    .querySelectorAll("#answers-container .answer-row")
    .forEach((row, i) => {
      row.querySelector("textarea").value = "";
      row.querySelector(".correct-checkbox").classList.remove("checked");
      // Очищаем картинки вариантов
      row.dataset.image = "";
      const preview = row.querySelector(".answer-image-preview");
      if (preview) {
        preview.style.display = "none";
        preview.src = "";
      }
      const addImgBtn = row.querySelector(".answer-image-btn");
      if (addImgBtn) {
        addImgBtn.style.display = "flex";
      }
      const fileInput = row.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = "";
      }
    });

  // Очистка ordering
  document
    .querySelectorAll("#ordering-container .answer-row")
    .forEach((row) => {
      row.querySelector("textarea").value = "";
    });

  // Очистка matching
  document
    .querySelectorAll("#matching-container .matching-editor-row")
    .forEach((row) => {
      row.querySelector(".matching-left").value = "";
      row.querySelector(".matching-right").value = "";
    });

  // Кнопка переключается сразу, но индекс сбросится только после ответа сервера
  const saveBtn = document.getElementById("save-question-btn");
  const cancelBtn = document.getElementById("cancel-edit-btn");
  saveBtn.textContent = "Сохранить вопрос";
  saveBtn.classList.add("btn-success");
  saveBtn.classList.remove("btn-warning");
  cancelBtn.style.display = "none";
}

/**
 * Начинает редактирование существующего вопроса.
 * @param {number} index - Индекс вопроса в списке
 */
function startEditQuestion(index) {
  window.editQuestionIndex = index;
  const saveBtn = document.getElementById("save-question-btn");
  const cancelBtn = document.getElementById("cancel-edit-btn");
  saveBtn.textContent = "Сохранить изменения";
  saveBtn.classList.remove("btn-success");
  saveBtn.classList.add("btn-warning");
  cancelBtn.style.display = "flex";
  socket.emit("get-quiz-questions", currentQuizId);
}

/**
 * Отменяет редактирование вопроса и сбрасывает форму.
 */
function cancelEditQuestion() {
  window.editQuestionIndex = undefined;
  const saveBtn = document.getElementById("save-question-btn");
  const cancelBtn = document.getElementById("cancel-edit-btn");
  saveBtn.textContent = "Сохранить вопрос";
  saveBtn.classList.add("btn-success");
  saveBtn.classList.remove("btn-warning");
  cancelBtn.style.display = "none";

  // Очистка формы
  document.getElementById("question-text").value = "";
  document.getElementById("question-image").value = "";
  document
    .getElementById("image-preview-container")
    .classList.remove("show");
  document.getElementById("correct-answer-text").value = "";
  imageBase64 = null;
  tfSelected = null;

  // Сброс всех галочек
  document
    .querySelectorAll("#answers-container .correct-checkbox")
    .forEach((cb) => {
      cb.classList.remove("checked");
    });

  // Сброс TF выбора
  document.querySelectorAll(".tf-option").forEach((t) => {
    t.classList.remove("selected", "true", "false");
  });

  // Очистка ответов
  document
    .querySelectorAll("#answers-container .answer-row")
    .forEach((row, i) => {
      row.querySelector("textarea").value = "";
    });

  // Возврат к первому типу вопроса
  selectQuestionType("multiple_choice");
}

/**
 * Удаляет вопрос из викторины после подтверждения.
 * @param {number} index - Индекс вопроса для удаления
 */
function deleteQuestion(index) {
  if (confirm("Удалить вопрос?")) {
    socket.emit("delete-question", {
      quizId: currentQuizId,
      questionIndex: index,
    });
  }
}
