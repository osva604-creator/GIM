const STORAGE_KEY = "loopGymProgress.v1";
const CURRENT_VERSION = 1;
const START_TIME = "06:10";

const weekdayLabels = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

const routine = {
  1: {
    label: "Lunes",
    title: "Torso",
    focus: "Fuerza Empuje/Tracción",
    exercises: [
      { id: "press-banca-plano", name: "Press de Banca Plano", detail: "Barra o mancuernas", sets: "4", reps: "8-10" },
      { id: "remo-barra-polea-baja", name: "Remo con barra o en polea baja", detail: "", sets: "4", reps: "8-10" },
      { id: "press-militar-hombros", name: "Press Militar para hombros", detail: "Sentado con mancuernas", sets: "3", reps: "10" },
      { id: "jalon-pecho-polea-alta", name: "Jalón al Pecho en polea alta", detail: "Agarre prono ancho", sets: "3", reps: "10-12" },
      { id: "curl-biceps-barra-z", name: "Curl de Bíceps", detail: "Barra Z, súper serie", sets: "3", reps: "12" },
      { id: "press-frances-polea", name: "Press Francés en polea", detail: "Tríceps, súper serie", sets: "3", reps: "12" }
    ]
  },
  2: {
    label: "Martes",
    title: "Piernas",
    focus: "Enfoque Cuádriceps",
    exercises: [
      { id: "sentadilla-barra", name: "Sentadillas con barra libre o multipower", detail: "", sets: "4", reps: "8-10" },
      { id: "prensa-piernas", name: "Prensa de piernas", detail: "Pies más abajo en la plataforma", sets: "3", reps: "10-12" },
      { id: "sillon-cuadriceps", name: "Sillón de cuádriceps", detail: "Extensiones", sets: "3", reps: "12-15" },
      { id: "gemelos-pie-maquina", name: "Gemelos de pie en máquina", detail: "2 segundos de pausa", sets: "4", reps: "15" }
    ]
  },
  4: {
    label: "Jueves",
    title: "Torso",
    focus: "Hipertrofia y Detalles",
    exercises: [
      { id: "press-banca-inclinado", name: "Press de Banca Inclinado", detail: "Con mancuernas", sets: "3", reps: "10-12" },
      { id: "remo-mancuerna-una-mano", name: "Remo con mancuerna a una mano", detail: "", sets: "3", reps: "10 por lado" },
      { id: "aperturas-banco-plano", name: "Aperturas con mancuernas en banco plano", detail: "", sets: "3", reps: "12" },
      { id: "elevaciones-laterales", name: "Elevaciones laterales para hombros", detail: "", sets: "4", reps: "12-15" },
      { id: "dominadas-barra", name: "Dominadas en barra", detail: "", sets: "3", reps: "Fallo técnico" }
    ]
  },
  5: {
    label: "Viernes",
    title: "Piernas",
    focus: "Isquios y Glúteos",
    exercises: [
      { id: "peso-muerto-rumano", name: "Peso Muerto Rumano", detail: "Barra o mancuernas", sets: "4", reps: "8-10" },
      { id: "estocadas-zancadas", name: "Estocadas/Zancadas caminando", detail: "", sets: "3", reps: "12 por pierna" },
      { id: "curl-isquios-maquina", name: "Curl de Isquios en máquina", detail: "Acostado o sentado", sets: "3", reps: "12-15" },
      { id: "gemelos-pantorrillas", name: "Gemelos", detail: "Pantorrillas", sets: "4", reps: "15" }
    ]
  }
};

const dom = {};
let store = loadStore();
let selectedDate = new Date();
let deferredInstallPrompt = null;

document.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  bindEvents();
  hydrate();
  registerServiceWorker();
});

function cacheDom() {
  dom.todayLabel = document.querySelector("#todayLabel");
  dom.routineDay = document.querySelector("#routineDay");
  dom.todayTitle = document.querySelector("#todayTitle");
  dom.routineMeta = document.querySelector("#routineMeta");
  dom.workoutForm = document.querySelector("#workoutForm");
  dom.restState = document.querySelector("#restState");
  dom.weekGrid = document.querySelector("#weekGrid");
  dom.exerciseSelect = document.querySelector("#exerciseSelect");
  dom.statsGrid = document.querySelector("#statsGrid");
  dom.historyChart = document.querySelector("#historyChart");
  dom.historyList = document.querySelector("#historyList");
  dom.calendarButton = document.querySelector("#calendarButton");
  dom.exportButton = document.querySelector("#exportButton");
  dom.importInput = document.querySelector("#importInput");
  dom.clearButton = document.querySelector("#clearButton");
  dom.storageNote = document.querySelector("#storageNote");
  dom.toast = document.querySelector("#toast");
  dom.installButton = document.querySelector("#installButton");
  dom.installBanner = document.querySelector("#installBanner");
  dom.installConfirm = document.querySelector("#installConfirm");
  dom.installDecline = document.querySelector("#installDecline");
  dom.jumpWeekButton = document.querySelector("#jumpWeekButton");
}

function bindEvents() {
  document.querySelectorAll("[data-nav-target]").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.navTarget));
  });

  dom.jumpWeekButton.addEventListener("click", () => showView("week"));
  dom.exerciseSelect.addEventListener("change", renderHistory);
  dom.calendarButton.addEventListener("click", downloadCalendarFile);
  dom.exportButton.addEventListener("click", exportData);
  dom.importInput.addEventListener("change", importData);
  dom.clearButton.addEventListener("click", clearHistory);
  dom.installButton.addEventListener("click", installApp);

  if (dom.installConfirm) dom.installConfirm.addEventListener("click", installApp);
  if (dom.installDecline) dom.installDecline.addEventListener("click", () => { if (dom.installBanner) dom.installBanner.hidden = true; });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    dom.installButton.hidden = false;
    if (dom.installBanner) dom.installBanner.hidden = false;
  });
}

async function installApp() {
  if (deferredInstallPrompt) {
    if (dom.installBanner) dom.installBanner.hidden = true;
    try {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice && choice.outcome === "accepted") {
        showToast("Instalación aceptada.");
      } else {
        showToast("Instalación cancelada.");
      }
    } catch (err) {
      console.warn("Error mostrando prompt de instalación", err);
      showToast("No se pudo iniciar la instalación.");
    }
    deferredInstallPrompt = null;
    if (dom.installButton) dom.installButton.hidden = true;
  } else {
    showToast("Instalación no disponible.");
  }
}

function hydrate() {
  renderToday();
  renderWeek();
  renderExerciseOptions();
  renderHistory();
  renderStorageNote();
}

function loadStore() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored?.version === CURRENT_VERSION && Array.isArray(stored.entries)) {
      return stored;
    }
  } catch (error) {
    console.warn("No se pudo leer el historial local", error);
  }

  return { version: CURRENT_VERSION, entries: [] };
}

function saveStore() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  renderStorageNote();
}

function todayKey() {
  return toDateKey(selectedDate);
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "short"
  }).format(date);
}

function renderToday() {
  const weekday = selectedDate.getDay();
  const workout = routine[weekday];
  const readableDate = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(selectedDate);

  dom.todayLabel.textContent = readableDate;
  dom.workoutForm.innerHTML = "";

  if (!workout) {
    dom.routineDay.textContent = weekdayLabels[weekday];
    dom.todayTitle.textContent = "Descanso";
    dom.routineMeta.textContent = "Sin rutina programada";
    dom.restState.hidden = false;
    dom.workoutForm.hidden = true;
    return;
  }

  dom.restState.hidden = true;
  dom.workoutForm.hidden = false;
  dom.routineDay.textContent = workout.label;
  dom.todayTitle.textContent = `${workout.title}: ${workout.focus}`;
  dom.routineMeta.textContent = `${workout.exercises.length} ejercicios · inicio sugerido ${START_TIME}`;

  const fragment = document.createDocumentFragment();
  workout.exercises.forEach((exercise) => {
    fragment.appendChild(createExerciseCard(exercise, workout));
  });
  dom.workoutForm.appendChild(fragment);
}

function createExerciseCard(exercise, workout) {
  const previous = getPreviousEntry(exercise.id, todayKey());
  const current = getEntryForDate(exercise.id, todayKey());
  const card = document.createElement("article");
  card.className = "exercise-card";
  card.dataset.exerciseId = exercise.id;

  const previousText = previous ? `${formatNumber(previous.weight)} kg` : "Sin dato";
  card.innerHTML = `
    <div class="exercise-top">
      <div class="exercise-name">
        <h3>${escapeHtml(exercise.name)}</h3>
        <p>${escapeHtml(metaLine(exercise))}</p>
      </div>
      <div class="previous-badge" title="Último peso registrado">Previo<br>${previousText}</div>
    </div>
    <div class="field-grid">
      <div class="field">
        <label for="${exercise.id}-weight">Peso kg</label>
        <input id="${exercise.id}-weight" name="weight" inputmode="decimal" type="number" min="0" step="0.5" value="${current?.weight ?? ""}">
      </div>
      <div class="field">
        <label for="${exercise.id}-reps">Reps reales</label>
        <input id="${exercise.id}-reps" name="reps" inputmode="numeric" type="text" value="${escapeAttribute(current?.reps ?? "")}" placeholder="${escapeAttribute(exercise.reps)}">
      </div>
    </div>
    <div class="field">
      <label for="${exercise.id}-notes">Notas</label>
      <textarea id="${exercise.id}-notes" name="notes" rows="2">${escapeHtml(current?.notes ?? "")}</textarea>
    </div>
    <div class="save-row">
      <span class="saved-state">${current ? "Guardado hoy" : ""}</span>
      <button class="primary-button" type="button">Guardar</button>
    </div>
  `;

  card.querySelector("button").addEventListener("click", () => saveExercise(card, exercise, workout));
  return card;
}

function metaLine(exercise) {
  const detail = exercise.detail ? ` · ${exercise.detail}` : "";
  return `${exercise.sets} x ${exercise.reps}${detail}`;
}

function saveExercise(card, exercise, workout) {
  const weightInput = card.querySelector('[name="weight"]');
  const repsInput = card.querySelector('[name="reps"]');
  const notesInput = card.querySelector('[name="notes"]');
  const weight = Number.parseFloat(weightInput.value.replace(",", "."));

  if (!Number.isFinite(weight) || weight < 0) {
    showToast("Ingresá un peso válido.");
    weightInput.focus();
    return;
  }

  const date = todayKey();
  const entry = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${exercise.id}`,
    date,
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    workout: `${workout.label}: ${workout.title}`,
    weight,
    reps: repsInput.value.trim(),
    notes: notesInput.value.trim(),
    createdAt: new Date().toISOString()
  };

  store.entries = store.entries.filter((item) => !(item.date === date && item.exerciseId === exercise.id));
  store.entries.push(entry);
  store.entries.sort((a, b) => a.date.localeCompare(b.date) || a.exerciseName.localeCompare(b.exerciseName));
  saveStore();

  card.querySelector(".saved-state").textContent = "Guardado hoy";
  renderExerciseOptions();
  renderHistory();
  renderWeek();
  showToast("Peso guardado.");
}

function getEntryForDate(exerciseId, date) {
  return store.entries.find((entry) => entry.exerciseId === exerciseId && entry.date === date);
}

function getPreviousEntry(exerciseId, beforeDate) {
  return store.entries
    .filter((entry) => entry.exerciseId === exerciseId && entry.date < beforeDate)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

function renderWeek() {
  const days = [1, 2, 3, 4, 5];
  const currentWeekday = selectedDate.getDay();
  dom.weekGrid.innerHTML = "";

  days.forEach((day) => {
    const workout = routine[day];
    const card = document.createElement("article");
    card.className = `week-card${day === currentWeekday ? " today" : ""}`;
    const exercises = workout?.exercises ?? [];
    card.innerHTML = `
      <h3>
        ${workout ? workout.label : weekdayLabels[day]}
        <span class="week-count">${exercises.length}</span>
      </h3>
      <p>${workout ? `${workout.title}: ${workout.focus}` : "Descanso"}</p>
      <ul class="mini-list">
        ${exercises.map((exercise) => `<li>${escapeHtml(exercise.name)}</li>`).join("")}
      </ul>
    `;
    card.addEventListener("click", () => {
      selectedDate = dateForWeekday(day);
      renderToday();
      renderWeek();
      showView("today");
    });
    dom.weekGrid.appendChild(card);
  });
}

function dateForWeekday(targetDay) {
  const date = new Date();
  const diff = targetDay - date.getDay();
  date.setDate(date.getDate() + diff);
  return date;
}

function renderExerciseOptions() {
  const allExercises = getAllExercises();
  const selected = dom.exerciseSelect.value || allExercises[0]?.id;

  dom.exerciseSelect.innerHTML = allExercises
    .map((exercise) => `<option value="${exercise.id}">${escapeHtml(exercise.name)}</option>`)
    .join("");

  if (allExercises.some((exercise) => exercise.id === selected)) {
    dom.exerciseSelect.value = selected;
  }
}

function getAllExercises() {
  return Object.values(routine).flatMap((day) => day.exercises);
}

function renderHistory() {
  const exerciseId = dom.exerciseSelect.value || getAllExercises()[0]?.id;
  const exercise = getAllExercises().find((item) => item.id === exerciseId);
  const entries = store.entries
    .filter((entry) => entry.exerciseId === exerciseId)
    .sort((a, b) => a.date.localeCompare(b.date));

  renderStats(entries);
  drawChart(entries, exercise?.name ?? "");
  renderHistoryList(entries);
}

function renderStats(entries) {
  const latest = entries.at(-1);
  const first = entries[0];
  const best = entries.reduce((max, entry) => (entry.weight > (max?.weight ?? -Infinity) ? entry : max), null);
  const delta = latest && first ? latest.weight - first.weight : 0;

  const stats = [
    { label: "Último", value: latest ? `${formatNumber(latest.weight)} kg` : "Sin datos" },
    { label: "Máximo", value: best ? `${formatNumber(best.weight)} kg` : "Sin datos" },
    { label: "Cambio", value: entries.length > 1 ? `${delta >= 0 ? "+" : ""}${formatNumber(delta)} kg` : "Sin datos" }
  ];

  dom.statsGrid.innerHTML = stats
    .map((stat) => `
      <article class="stat-card">
        <p>${stat.label}</p>
        <strong>${stat.value}</strong>
      </article>
    `)
    .join("");
}

function drawChart(entries, label) {
  const canvas = dom.historyChart;
  const context = canvas.getContext("2d");
  const styles = getComputedStyle(document.documentElement);
  const themeColor = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
  const colors = {
    surface: themeColor("--surface", "#15191f"),
    line: themeColor("--line", "rgba(255, 255, 255, 0.12)"),
    muted: themeColor("--muted", "#a7b0ba"),
    ink: themeColor("--ink", "#f6f3ea"),
    accent: themeColor("--accent", "#ff6748"),
    grid: "rgba(123, 167, 255, 0.14)"
  };
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 900;
  const height = canvas.clientHeight || 360;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.scale(ratio, ratio);
  context.clearRect(0, 0, width, height);

  const padding = { top: 28, right: 20, bottom: 42, left: 48 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  context.fillStyle = colors.surface;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = colors.line;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(padding.left, padding.top);
  context.lineTo(padding.left, padding.top + innerHeight);
  context.lineTo(padding.left + innerWidth, padding.top + innerHeight);
  context.stroke();

  context.fillStyle = colors.muted;
  context.font = "12px system-ui, sans-serif";
  context.fillText(label || "Ejercicio", padding.left, 18);

  if (entries.length === 0) {
    context.fillStyle = colors.muted;
    context.font = "14px system-ui, sans-serif";
    context.fillText("Sin registros todavía", padding.left, padding.top + 48);
    return;
  }

  const weights = entries.map((entry) => entry.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const spread = Math.max(1, max - min);
  const pointX = (index) => padding.left + (entries.length === 1 ? innerWidth / 2 : (innerWidth * index) / (entries.length - 1));
  const pointY = (weight) => padding.top + innerHeight - ((weight - min) / spread) * innerHeight;

  context.strokeStyle = colors.grid;
  context.beginPath();
  for (let i = 0; i < 4; i += 1) {
    const y = padding.top + (innerHeight * i) / 3;
    context.moveTo(padding.left, y);
    context.lineTo(padding.left + innerWidth, y);
  }
  context.stroke();

  context.strokeStyle = colors.accent;
  context.lineWidth = 3;
  context.beginPath();
  entries.forEach((entry, index) => {
    const x = pointX(index);
    const y = pointY(entry.weight);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.stroke();

  entries.forEach((entry, index) => {
    const x = pointX(index);
    const y = pointY(entry.weight);
    context.fillStyle = colors.ink;
    context.beginPath();
    context.arc(x, y, 4.5, 0, Math.PI * 2);
    context.fill();

    if (index === 0 || index === entries.length - 1) {
      context.fillStyle = colors.ink;
      context.font = "12px system-ui, sans-serif";
      context.fillText(`${formatNumber(entry.weight)} kg`, Math.min(x, width - 72), Math.max(18, y - 10));
    }
  });

  const firstDate = formatShortDate(entries[0].date);
  const lastDate = formatShortDate(entries.at(-1).date);
  context.fillStyle = colors.muted;
  context.font = "12px system-ui, sans-serif";
  context.fillText(firstDate, padding.left, height - 16);
  context.fillText(lastDate, Math.max(padding.left, padding.left + innerWidth - 58), height - 16);
}

function renderHistoryList(entries) {
  if (entries.length === 0) {
    dom.historyList.innerHTML = `
      <div class="empty-state">
        <h2>Sin registros</h2>
        <p>Guardá pesos desde la vista Hoy y la evolución aparece acá.</p>
      </div>
    `;
    return;
  }

  dom.historyList.innerHTML = entries
    .slice()
    .reverse()
    .map((entry) => `
      <article class="history-card">
        <div>
          <strong>${formatDate(entry.date)}</strong>
          <p>${escapeHtml(entry.workout)}${entry.reps ? ` · ${escapeHtml(entry.reps)} reps` : ""}</p>
          ${entry.notes ? `<p>${escapeHtml(entry.notes)}</p>` : ""}
        </div>
        <div class="weight">${formatNumber(entry.weight)} kg</div>
      </article>
    `)
    .join("");
}

function formatShortDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${String(year).slice(2)}`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 1
  }).format(value);
}

function downloadCalendarFile() {
  const today = new Date();
  const until = new Date(today);
  until.setMonth(until.getMonth() + 6);

  const events = Object.entries(routine).map(([day, workout]) => {
    const start = nextDateForWeekday(Number(day));
    const end = new Date(start);
    const [hour, minute] = START_TIME.split(":").map(Number);
    start.setHours(hour, minute, 0, 0);
    end.setHours(hour + 1, minute, 0, 0);

    return [
      "BEGIN:VEVENT",
      `UID:${workout.label.toLowerCase()}-${workout.title.toLowerCase()}@loop-gym`,
      `DTSTAMP:${toIcsDate(new Date())}`,
      `DTSTART:${toIcsDate(start)}`,
      `DTEND:${toIcsDate(end)}`,
      `RRULE:FREQ=WEEKLY;UNTIL=${toIcsDate(until).slice(0, 8)}T235959Z`,
      `SUMMARY:${escapeIcs(`Gimnasio - ${workout.label} ${workout.title}`)}`,
      `DESCRIPTION:${escapeIcs(workout.exercises.map((exercise) => `${exercise.name} ${exercise.sets}x${exercise.reps}`).join("\n"))}`,
      "END:VEVENT"
    ].join("\r\n");
  });

  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Loop Gym//PWA//ES",
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR"
  ].join("\r\n");

  downloadBlob(calendar, "loop-gym-calendario.ics", "text/calendar;charset=utf-8");
  showToast("Calendario generado.");
}

function nextDateForWeekday(day) {
  const date = new Date();
  const diff = (day - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + diff);
  return date;
}

function toIcsDate(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcs(value) {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function exportData() {
  const payload = JSON.stringify(store, null, 2);
  downloadBlob(payload, `loop-gym-backup-${todayKey()}.json`, "application/json;charset=utf-8");
  showToast("Backup exportado.");
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported.entries)) throw new Error("Formato inválido");
      store = {
        version: CURRENT_VERSION,
        entries: imported.entries.filter(isValidEntry).map(normalizeEntry)
      };
      saveStore();
      hydrate();
      showToast("Datos importados.");
    } catch (error) {
      showToast("No se pudo importar el archivo.");
    } finally {
      event.target.value = "";
    }
  });
  reader.readAsText(file);
}

function clearHistory() {
  const confirmed = window.confirm("¿Borrar todo el historial local de pesos?");
  if (!confirmed) return;
  store = { version: CURRENT_VERSION, entries: [] };
  saveStore();
  hydrate();
  showToast("Historial borrado.");
}

function isValidEntry(entry) {
  return Boolean(
    entry &&
      typeof entry.date === "string" &&
      typeof entry.exerciseId === "string" &&
      typeof entry.exerciseName === "string" &&
      Number.isFinite(Number(entry.weight))
  );
}

function normalizeEntry(entry) {
  return {
    ...entry,
    weight: Number(entry.weight),
    reps: entry.reps ?? "",
    notes: entry.notes ?? "",
    workout: entry.workout ?? ""
  };
}

function downloadBlob(content, fileName, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function renderStorageNote() {
  const count = store.entries.length;
  dom.storageNote.textContent = `${count} registro${count === 1 ? "" : "s"} guardado${count === 1 ? "" : "s"} en este dispositivo.`;
}

function showView(target) {
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.id === `view-${target}`);
  });
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.navTarget === target);
  });

  if (target === "history") {
    renderHistory();
  }
}

function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => dom.toast.classList.remove("show"), 2200);
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch((error) => {
      console.warn("No se pudo registrar el service worker", error);
    });
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
