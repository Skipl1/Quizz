/**
 * admin-results.js — вкладка «Результаты»: загрузка истории из БД
 */

/** @type {object|null} Последний ответ сервера для выгрузки в CSV */
window.__lastQuizResultsPayload = null;

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
 * Заполняет выпадающий список викторин (первый пункт — «все»).
 * @param {Array<{id: string, name: string}>} list
 */
function fillResultsQuizFilter(list) {
  const sel = document.getElementById("results-quiz-filter");
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML =
    '<option value="">Все (последние 200)</option>' +
    (list || [])
      .map((q) => {
        const id = String(q.id).replace(/"/g, "&quot;");
        return `<option value="${id}">${escapeHtml(q.name)}</option>`;
      })
      .join("");
  if ([...sel.options].some((o) => o.value === current)) {
    sel.value = current;
  }
}

/**
 * Форматирует дату/время для таблицы.
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
 * Запрашивает с сервера строки по выбранному фильтру.
 */
function loadQuizResults() {
  const sel = document.getElementById("results-quiz-filter");
  const quizId = sel ? sel.value : "";
  socket.emit("get-quiz-results", { quizId });
}

/**
 * Рендер ответа сервера.
 */
function renderQuizResultsPayload(data) {
  const errEl = document.getElementById("results-error");
  const wrap = document.getElementById("results-table-wrap");
  const csvBtn = document.getElementById("results-csv-btn");
  if (!wrap) return;

  window.__lastQuizResultsPayload =
    data && Array.isArray(data.results) && data.results.length > 0
      ? { ...data, results: data.results.slice() }
      : null;
  if (csvBtn) {
    csvBtn.disabled = !window.__lastQuizResultsPayload;
  }

  if (errEl) {
    errEl.classList.toggle("hidden", !data.error);
    errEl.textContent = data.error || "";
  }

  const rows = data.results || [];
  const mode = data.mode || (data.quizId ? "quiz" : "all");

  if (rows.length === 0) {
    wrap.innerHTML =
      '<div class="empty-state">Пока нет сохранённых прохождений для этого фильтра.</div>';
    return;
  }

  const showQuizCol = mode === "all";
  wrap.innerHTML = `
    <table class="admin-results-table">
      <thead>
        <tr>
          ${showQuizCol ? "<th>Викторина</th>" : ""}
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
            const qcell = showQuizCol
              ? `<td>${escapeHtml(r.quizName || "")}</td>`
              : "";
            return `<tr>
            ${qcell}
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

socket.on("quizzes-list", (quizzesData) => {
  fillResultsQuizFilter(quizzesData);
});
