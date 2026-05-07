/**
 * admin-results.js — вкладка «Результаты»: live-история из БД и XLSX
 */

window.__lastQuizResultsPayload = null;

let selectedResultsQuizDbId = null;
let selectedResultsRunId = "";
let selectedResultsQuizName = "";

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

function loadResultsOverview() {
  selectedResultsQuizDbId = null;
  selectedResultsRunId = "";
  selectedResultsQuizName = "";
  window.__lastQuizResultsPayload = null;
  const wrap = document.getElementById("results-table-wrap");
  if (wrap) wrap.innerHTML = "";
  socket.emit("get-results-quizzes");
}

function renderQuizResultsPayload(data) {
  const errEl = document.getElementById("results-error");
  const wrap = document.getElementById("results-table-wrap");
  if (!wrap) return;

  window.__lastQuizResultsPayload =
    data && Array.isArray(data.results) && data.results.length > 0
      ? { ...data, results: data.results.slice() }
      : null;

  if (errEl) {
    errEl.classList.toggle("hidden", !data.error);
    errEl.textContent = data.error || "";
  }

  renderStandingsTable(wrap, data.results || [], {
    showDates: true,
    emptyText: "Пока нет сохранённых прохождений для этого фильтра.",
  });
}

socket.on("quiz-results", (data) => {
  renderQuizResultsPayload(data || {});
});

function encodedArg(value) {
  return encodeURIComponent(String(value || "")).replace(/'/g, "%27");
}

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
      const runId = String(q.runId || "");
      const isActive =
        Number(q.quizDbId) === selectedResultsQuizDbId &&
        runId === selectedResultsRunId;
      const title = escapeHtml(q.quizName || "Викторина");
      const meta = `${q.attempts || 0} участн. • старт ${escapeHtml(formatResultsDate(q.startedAt || q.lastFinishedAt))}`;
      const encodedRunId = encodedArg(runId);
      const encodedName = encodedArg(q.quizName || "");
      return `
        <div class="results-quiz-item ${isActive ? "active" : ""}" onclick="selectResultsQuiz(${Number(q.quizDbId)}, decodeURIComponent('${encodedRunId}'), decodeURIComponent('${encodedName}'))">
          <div>
            <div class="name">${title}</div>
            <div class="meta">${meta}</div>
          </div>
          <div class="quiz-item-actions">
            <button class="btn btn-small btn-success" onclick="event.stopPropagation(); downloadResultsXlsxForQuiz(${Number(q.quizDbId)}, decodeURIComponent('${encodedRunId}'))">Сохранить XLSX</button>
            <button class="btn btn-small btn-danger" onclick="event.stopPropagation(); deleteResultsForQuiz(${Number(q.quizDbId)}, decodeURIComponent('${encodedRunId}'), decodeURIComponent('${encodedName}'))">Удалить</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function selectResultsQuiz(quizDbId, runId, quizName) {
  const id = Number(quizDbId);
  const normalizedRunId = String(runId || "");
  const isSame =
    selectedResultsQuizDbId != null &&
    selectedResultsQuizDbId === id &&
    selectedResultsRunId === normalizedRunId;

  if (isSame) {
    selectedResultsQuizDbId = null;
    selectedResultsRunId = "";
    selectedResultsQuizName = "";
    window.__lastQuizResultsPayload = null;
    const wrap = document.getElementById("results-table-wrap");
    if (wrap) wrap.innerHTML = "";
    if (typeof window.__lastResultsQuizzesList !== "undefined") {
      renderCompletedQuizzes(window.__lastResultsQuizzesList);
    }
    return;
  }

  selectedResultsQuizDbId = id;
  selectedResultsRunId = normalizedRunId;
  selectedResultsQuizName = quizName || "";

  socket.emit("get-quiz-results-by-db", {
    quizDbId: selectedResultsQuizDbId,
    runId: selectedResultsRunId,
  });
}

function downloadResultsXlsxForQuiz(quizDbId, runId) {
  const id = Number(quizDbId);
  if (!Number.isFinite(id) || id <= 0) return;
  socket.emit("download-results-xlsx", {
    quizDbId: id,
    runId: String(runId || ""),
  });
}

function deleteResultsForQuiz(quizDbId, runId, quizName) {
  const id = Number(quizDbId);
  if (!Number.isFinite(id) || id <= 0) return;
  const name = quizName || `ID ${id}`;
  if (
    !confirm(
      `Удалить сохранённые прохождения для «${name}»? Это действие нельзя отменить.`,
    )
  ) {
    return;
  }
  if (selectedResultsQuizDbId === id && selectedResultsRunId === String(runId || "")) {
    const wrap = document.getElementById("results-table-wrap");
    if (wrap) wrap.innerHTML = "";
  }
  socket.emit("delete-quiz-results-by-db", {
    quizDbId: id,
    runId: String(runId || ""),
  });
}

socket.on("results-quizzes", (data) => {
  const errEl = document.getElementById("results-error");
  if (errEl) {
    errEl.classList.toggle("hidden", !data?.error);
    errEl.textContent = data?.error || "";
  }
  window.__lastResultsQuizzesList = (data && data.quizzes) || [];
  renderCompletedQuizzes(window.__lastResultsQuizzesList);

  const pendingId = window.__pendingAutoOpenResultsQuizDbId;
  if (pendingId != null) {
    const pendingRunId = String(window.__pendingAutoOpenResultsRunId || "");
    const found =
      window.__lastResultsQuizzesList.find(
        (q) =>
          Number(q.quizDbId) === Number(pendingId) &&
          (!pendingRunId || String(q.runId || "") === pendingRunId),
      ) ||
      window.__lastResultsQuizzesList.find(
        (q) => Number(q.quizDbId) === Number(pendingId),
      );
    if (found) {
      const pendingName =
        typeof window.__pendingAutoOpenResultsQuizName === "string"
          ? window.__pendingAutoOpenResultsQuizName
          : "";
      window.__pendingAutoOpenResultsQuizDbId = null;
      window.__pendingAutoOpenResultsRunId = null;
      window.__pendingAutoOpenResultsQuizName = null;
      selectResultsQuiz(
        Number(found.quizDbId),
        found.runId || "",
        pendingName || found.quizName || "",
      );
    }
  }
});

socket.on("quiz-results-deleted", (data) => {
  selectedResultsQuizDbId = null;
  selectedResultsRunId = "";
  selectedResultsQuizName = "";
  const wrap = document.getElementById("results-table-wrap");
  if (wrap) wrap.innerHTML = "";
  window.__lastQuizResultsPayload = null;
  if (data?.message) alert(data.message);
  loadResultsOverview();
});

socket.on("quiz-results-xlsx", (data) => {
  if (data?.error) {
    alert(data.error);
    return;
  }
  if (!data?.base64) return;

  const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = data.filename || "results.xlsx";
  link.click();
  URL.revokeObjectURL(link.href);
});

// При первом заходе на вкладку «Результаты» подхватится через showTab()
