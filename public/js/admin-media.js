/**
 * admin-media.js — Работа с медиа (изображения вопросов и ответов)
 */

/**
 * Сжимает изображение через Canvas до указанного размера и качества.
 * @param {string} base64 - Исходное base64 изображение
 * @param {number} maxWidth - Максимальная ширина
 * @param {number} quality - Качество JPEG (0-1)
 * @param {Function} callback - Callback с результатом (compressedBase64)
 */
function compressImage(base64, maxWidth, quality, callback) {
  const img = new Image();
  img.onload = function () {
    const canvas = document.createElement("canvas");
    let width = img.width;
    let height = img.height;

    // Масштабируем до maxWidth
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    // Конвертируем в base64 с сжатием JPEG
    const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
    callback(compressedBase64);
  };
  img.src = base64;
}

/**
 * Предварительный просмотр изображения вопроса.
 * Сжимает изображение и показывает превью.
 */
function previewImage() {
  const file = document.getElementById("question-image").files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    // Сжимаем изображение вопроса
    compressImage(e.target.result, 600, 0.8, (compressedBase64) => {
      imageBase64 = compressedBase64;
      const img = document.getElementById("image-preview");
      img.src = compressedBase64;
      document
        .getElementById("image-preview-container")
        .classList.add("show");
    });
  };
  reader.readAsDataURL(file);
}

/**
 * Удаляет изображение вопроса и сбрасывает состояние превью.
 */
function removeImage() {
  imageBase64 = null;
  document.getElementById("question-image").value = "";
  document
    .getElementById("image-preview-container")
    .classList.remove("show");
}

/**
 * Обработчик выбора изображения для варианта ответа.
 * Сжимает изображение и сохраняет в data-image строки.
 * @param {HTMLInputElement} input - Input типа file
 */
function handleAnswerImage(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    // Сжимаем изображение через Canvas
    compressImage(e.target.result, 400, 0.7, (compressedBase64) => {
      const row = input.closest(".answer-row");
      row.dataset.image = compressedBase64;

      // Показываем превью
      const preview = row.querySelector(".answer-image-preview");
      preview.src = compressedBase64;
      preview.style.display = "block";

      // Скрываем кнопку добавления
      const addBtn = row.querySelector(".answer-image-btn");
      addBtn.style.display = "none";
    });
  };
  reader.readAsDataURL(file);
}

/**
 * Открывает диалог выбора изображения для варианта ответа.
 * @param {HTMLElement} btn - Кнопка добавления изображения
 */
function addAnswerImage(btn) {
  const input = btn.nextElementSibling;
  input.click();
}

/**
 * Удаляет превью изображения варианта ответа.
 * @param {HTMLImageElement} img - Элемент превью изображения
 */
function removeAnswerImagePreview(img) {
  const row = img.closest(".answer-row");
  row.dataset.image = "";
  img.style.display = "none";
  img.src = "";

  // Показываем кнопку добавления
  const addBtn = row.querySelector(".answer-image-btn");
  addBtn.style.display = "flex";

  // Очищаем input
  const input = row.querySelector('input[type="file"]');
  input.value = "";
}
