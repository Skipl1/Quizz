/**
 * admin-results.js — вкладка «Результаты»: загрузка истории из БД
 */

/** @type {object|null} Последний ответ сервера для выгрузки в CSV */
window.__lastQuizResultsPayload = null;

/** @type {number|null} Выбранная викторина (DB id) */
let selectedResultsQuizDbId = null;

/** @type {string} Выбранное название викторины */
let selectedResultsQuizName = "";

/** @type {number|null} Если не null — после загрузки авто-скачать CSV */
let pendingCsvDownloadQuizDbId = null;

/**
 * Экранирование значения для CSV (RFC-стиль).
 * @param {unknown} val
 */
function csvEscapeCell(val) {
  const s = val == null ? "" : String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Имя файла без недопустимых символов.
 * @param {string} base
 */
function sanitizeCsvFilename(base) {
  return base.replace(/[/\\?%*:|"<>]/g, "_").slice(0, 120) || "export";
}

/**
 * Скачивает текущую таблицу истории результатов в CSV (UTF-8 с BOM).
 */
function downloadQuizHistoryCsv() {
  const data = window.__lastQuizResultsPayload;
  if (!data || !Array.isArray(data.results) || data.results.length === 0) {
    alert(
      "Нет данных для выгрузки. Откройте вкладку «Результаты», нажмите «Обновить» или смените викторину.",
    );
    return;
  }

  const mode = data.mode || (data.quizId ? "quiz" : "all");
  const showQuizCol = mode === "all";

  const header = showQuizCol
    ? [
        "Викторина",
        "Игрок",
        "Баллы",
        "Вопросов",
        "Отвечено",
        "Процент",
        "Дата (локаль)",
        "Дата (ISO)",
      ]
    : [
        "Игрок",
        "Баллы",
        "Вопросов",
        "Отвечено",
        "Процент",
        "Дата (локаль)",
        "Дата (ISO)",
      ];

  const lines = [header.map(csvEscapeCell).join(",")];

  for (const r of data.results) {
    const iso =
      r.finishedAt != null
        ? new Date(r.finishedAt).toISOString()
        : "";
    const local = formatResultsDate(r.finishedAt);
    const pct = r.percentage != null ? `${r.percentage}` : "";
    const row = showQuizCol
      ? [
          r.quizName || "",
          r.playerName || "",
          typeof r.score === "number" && !Number.isNaN(r.score)
            ? r.score
            : "",
          r.totalQuestions ?? "",
          r.answeredCount ?? "",
          pct,
          local,
          iso,
        ]
      : [
          r.playerName || "",
          typeof r.score === "number" && !Number.isNaN(r.score)
            ? r.score
            : "",
          r.totalQuestions ?? "",
          r.answeredCount ?? "",
          pct,
          local,
          iso,
        ];
    lines.push(row.map(csvEscapeCell).join(","));
  }

  const stamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
  let label = "все_викторины";
  if (mode === "quiz" && data.quizName) {
    label = sanitizeCsvFilename(data.quizName);
  }
  const filename = `results_${label}_${stamp}.csv`;

  const blob = new Blob(["\ufeff" + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Форматирует дату/время для краткого отображения.
 * @param {string|Date} value
 */
function formatResultsDate(value) {
  if (value == null) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Отображает балл (в т.ч. дробный).
 * @param {number} n
 */
function formatScore(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  const s = n.toFixed(2);
  return s.endsWith(".00") ? String(Math.round(n)) : s.replace(/0+$/, "").replace(/\.$/, "");
}

/**
 * Запрашивает список викторин, по которым есть прохождения.
 */
function loadResultsOverview() {
  selectedResultsQuizDbId = null;
  selectedResultsQuizName = "";
  window.__lastQuizResultsPayload = null;
  const wrap = document.getElementById("results-table-wrap");
  if (wrap) wrap.innerHTML = "";
  socket.emit("get-results-quizzes");
}

/**
 * Рендер ответа сервера.
 */
function renderQuizResultsPayload(data) {
  const errEl = document.getElementById("results-error");
  const wrap = document.getElementById("results-table-wrap");
  if (!wrap) return;

  window.__lastQuizResultsPayload =
    data && Array.isArray(data.results) && data.results.length > 0
      ? { ...data, results: data.results.slice() }
      : null;
  // Автоскачивание CSV по кнопке у конкретной викторины
  if (
    pendingCsvDownloadQuizDbId != null &&
    data &&
    Number(data.quizDbId) === pendingCsvDownloadQuizDbId
  ) {
    pendingCsvDownloadQuizDbId = null;
    if (window.__lastQuizResultsPayload) {
      downloadQuizHistoryCsv();
    } else {
      alert("Нет данных для выгрузки CSV по этой викторине.");
    }
  }

  if (errEl) {
    errEl.classList.toggle("hidden", !data.error);
    errEl.textContent = data.error || "";
  }

  const rows = data.results || [];
  if (rows.length === 0) {
    wrap.innerHTML =
      '<div class="empty-state">Пока нет сохранённых прохождений для этого фильтра.</div>';
    return;
  }

  wrap.innerHTML = `
    <table class="admin-results-table">
      <thead>
        <tr>
          <th>Игрок</th>
          <th>Баллы</th>
          <th>Вопросов</th>
          <th>Отвечено</th>
          <th>%</th>
          <th>Дата</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map((r) => {
            return `<tr>
            <td>${escapeHtml(r.playerName || "")}</td>
            <td>${escapeHtml(String(formatScore(r.score)))}</td>
            <td>${r.totalQuestions ?? "—"}</td>
            <td>${r.answeredCount ?? "—"}</td>
            <td>${r.percentage != null ? `${r.percentage}%` : "—"}</td>
            <td>${escapeHtml(formatResultsDate(r.finishedAt))}</td>
          </tr>`;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

socket.on("quiz-results", (data) => {
  renderQuizResultsPayload(data || {});
});

/**
 * Рендерит список «пройденных викторин».
 * @param {Array<{quizDbId:number, quizName:string, attempts:number, lastFinishedAt:string}>} list
 */
function renderCompletedQuizzes(list) {
  const container = document.getElementById("results-quizzes-list");
  if (!container) return;

  if (!Array.isArray(list) || list.length === 0) {
    container.innerHTML =
      '<div class="empty-state">Пока нет сохранённых прохождений</div>';
    return;
  }

  container.innerHTML = list
    .map((q) => {
      const isActive = q.quizDbId === selectedResultsQuizDbId;
      const title = escapeHtml(q.quizName || "Викторина");
      const meta = `${q.attempts || 0} прохожд. • ${escapeHtml(formatResultsDate(q.lastFinishedAt))}`;
      return `
        <div class="results-quiz-item ${isActive ? "active" : ""}" onclick="selectResultsQuiz(${q.quizDbId}, '${String(q.quizName || "").replace(/'/g, "\\'")}')">
          <div>
            <div class="name">${title}</div>
            <div class="meta">${meta}</div>
          </div>
          <div class="quiz-item-actions">
            <button class="btn btn-small btn-success" onclick="event.stopPropagation(); downloadResultsCsvForQuiz(${q.quizDbId}, '${String(q.quizName || "").replace(/'/g, "\\'")}')">Сохранить в CSV</button>
            <button class="btn btn-small btn-danger" onclick="event.stopPropagation(); deleteResultsForQuiz(${q.quizDbId}, '${String(q.quizName || "").replace(/'/g, "\\'")}')">Удалить</button>
          </div>
        </div>
      `;
    })
    .join("");
}

/**
 * Выбор викторины в списке и загрузка её прохождений.
 * @param {number} quizDbId
 * @param {string} quizName
 */
function selectResultsQuiz(quizDbId, quizName) {
  const id = Number(quizDbId);
  const isSame = selectedResultsQuizDbId != null && selectedResultsQuizDbId === id;

  // Повторный клик по активной викторине — свернуть список
  if (isSame) {
    selectedResultsQuizDbId = null;
    selectedResultsQuizName = "";
    window.__lastQuizResultsPayload = null;
    const wrap = document.getElementById("results-table-wrap");
    if (wrap) wrap.innerHTML = "";
    // Снимем подсветку active без перезапроса к серверу
    if (typeof window.__lastResultsQuizzesList !== "undefined") {
      renderCompletedQuizzes(window.__lastResultsQuizzesList);
    }
    return;
  }

  selectedResultsQuizDbId = id;
  selectedResultsQuizName = quizName || "";

  socket.emit("get-quiz-results-by-db", { quizDbId: selectedResultsQuizDbId });
}

/**
 * Запустить скачивание CSV по конкретной викторине.
 * @param {number} quizDbId
 * @param {string} quizName
 */
function downloadResultsCsvForQuiz(quizDbId, quizName) {
  const id = Number(quizDbId);
  if (!Number.isFinite(id) || id <= 0) return;
  selectedResultsQuizDbId = id;
  selectedResultsQuizName = quizName || "";
  pendingCsvDownloadQuizDbId = id;
  socket.emit("get-quiz-results-by-db", { quizDbId: id });
}

/**
 * Удалить историю конкретной викторины.
 * @param {number} quizDbId
 * @param {string} quizName
 */
function deleteResultsForQuiz(quizDbId, quizName) {
  const id = Number(quizDbId);
  if (!Number.isFinite(id) || id <= 0) return;
  const name = quizName || `ID ${id}`;
  if (
    !confirm(
      `Удалить все сохранённые прохождения для «${name}»? Это действие нельзя отменить.`,
    )
  ) {
    return;
  }
  // если сейчас открыта эта викторина — очистим таблицу сразу
  if (selectedResultsQuizDbId === id) {
    const wrap = document.getElementById("results-table-wrap");
    if (wrap) wrap.innerHTML = "";
  }
  socket.emit("delete-quiz-results-by-db", { quizDbId: id });
}

socket.on("results-quizzes", (data) => {
  const errEl = document.getElementById("results-error");
  if (errEl) {
    errEl.classList.toggle("hidden", !data?.error);
    errEl.textContent = data?.error || "";
  }
  window.__lastResultsQuizzesList = (data && data.quizzes) || [];
  renderCompletedQuizzes(window.__lastResultsQuizzesList);
});

socket.on("quiz-results-deleted", (data) => {
  selectedResultsQuizDbId = null;
  selectedResultsQuizName = "";
  const wrap = document.getElementById("results-table-wrap");
  if (wrap) wrap.innerHTML = "";
  window.__lastQuizResultsPayload = null;
  if (data?.message) alert(data.message);
  loadResultsOverview();
});

// При первом заходе на вкладку «Результаты» подхватится через showTab()
