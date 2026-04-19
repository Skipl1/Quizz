/**
 * admin-qr.js — Управление QR-кодом для игроков
 */

let qrInstance = null;

// Показать/скрыть QR модал
function toggleQRModal() {
  const modal = document.getElementById("qr-modal");
  if (!modal) return;

  const isHidden = modal.classList.contains("hidden");

  if (isHidden) {
    modal.classList.remove("hidden");
    generateQR();
  } else {
    modal.classList.add("hidden");
  }
}

// Закрыть модал при клике на фон
function closeQRModal(event) {
  if (event.target === event.currentTarget) {
    toggleQRModal();
  }
}

// Генерация QR-кода
function generateQR() {
  const container = document.getElementById("qrcode");
  if (!container) return;

  // Очистить предыдущий QR-код
  container.innerHTML = "";

  // Создать новый QR-код
  if (qrInstance) {
    qrInstance.clear();
  }

  qrInstance = new QRCode(container, {
    text: "https://quizz-jj9a.onrender.com",
    width: 256,
    height: 256,
    colorDark: "#1e1b4b",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H,
  });
}

// Закрытие по Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const modal = document.getElementById("qr-modal");
    if (modal && !modal.classList.contains("hidden")) {
      toggleQRModal();
    }
  }
});
