const dashboardPreview = {
  summary: {
    classesThisWeek: 6,
    pendingTasks: 3,
    studyHours: 18.5,
    progressPercent: 72,
  },
  schedule: [
    { time: "09:00 AM", subject: "Data Structures", room: "Room 301", type: "Lecture" },
    { time: "11:00 AM", subject: "Operating Systems", room: "Room 204", type: "Lecture" },
    { time: "02:00 PM", subject: "Database Systems", room: "Room 105", type: "Seminar" },
    { time: "04:00 PM", subject: "Web Development", room: "Design Lab", type: "Lab" },
  ],
  exams: [
    { day: "15", month: "OCT", name: "Midterm Exam", subject: "Data Structures", daysRemaining: 10 },
    { day: "21", month: "OCT", name: "Systems Quiz", subject: "Operating Systems", daysRemaining: 16 },
    { day: "28", month: "OCT", name: "Database Exam", subject: "Database Systems", daysRemaining: 23 },
  ],
  weeklyHours: [
    { day: "Mon", hours: 2.5 },
    { day: "Tue", hours: 3.2 },
    { day: "Wed", hours: 1.8 },
    { day: "Thu", hours: 3.8 },
    { day: "Fri", hours: 2.7 },
    { day: "Sat", hours: 2.2 },
    { day: "Sun", hours: 2.3 },
  ],
};

const viewNames = {
  dashboard: "Dashboard",
  calendar: "Calendar",
  tasks: "Tasks",
  subjects: "Subjects",
  exams: "Exams",
  notes: "Notes",
  resources: "Resources",
  progress: "Progress",
  settings: "Settings",
};

const previewDescriptions = {
  calendar: "A monthly view of classes, exams, and due dates will be added in a later phase.",
  subjects: "Create subjects and connect them to your classes, tasks, and exams in a later phase.",
  exams: "Add exam dates and see countdowns in a later phase.",
  notes: "Create and search study notes in a later phase.",
  resources: "Keep useful course links together in a later phase.",
  progress: "Study history and calculated progress will be connected in a later phase.",
};

function renderDashboardPreview() {
  const { summary } = dashboardPreview;
  document.querySelector("#summary-classes").textContent = summary.classesThisWeek;
  document.querySelector("#summary-tasks").textContent = summary.pendingTasks;
  document.querySelector("#summary-hours").textContent = `${summary.studyHours}h`;
  document.querySelector("#summary-progress").textContent = `${summary.progressPercent}%`;
  document.querySelector("#summary-progress-bar").style.width = `${summary.progressPercent}%`;

  const scheduleList = document.querySelector("#schedule-list");
  scheduleList.replaceChildren();
  dashboardPreview.schedule.forEach((entry) => {
    const row = document.createElement("article");
    row.className = "sf-schedule-item";

    const time = document.createElement("time");
    time.className = "sf-schedule-time";
    time.textContent = entry.time;

    const timeline = document.createElement("span");
    timeline.className = "sf-timeline";
    timeline.setAttribute("aria-hidden", "true");
    const dot = document.createElement("i");
    dot.className = "sf-timeline-dot";
    timeline.append(dot);

    const details = document.createElement("div");
    const subject = document.createElement("div");
    subject.className = "sf-schedule-subject";
    subject.textContent = entry.subject;
    const room = document.createElement("div");
    room.className = "sf-schedule-room";
    room.textContent = entry.room;
    details.append(subject, room);

    const type = document.createElement("span");
    type.className = "sf-schedule-type";
    type.textContent = entry.type;
    row.append(time, timeline, details, type);
    scheduleList.append(row);
  });

  const examList = document.querySelector("#exam-list");
  examList.replaceChildren();
  dashboardPreview.exams.forEach((exam) => {
    const row = document.createElement("article");
    row.className = "sf-exam-item";

    const date = document.createElement("time");
    date.className = "sf-exam-date";
    const day = document.createElement("strong");
    day.textContent = exam.day;
    const month = document.createElement("span");
    month.textContent = exam.month;
    date.append(day, month);

    const details = document.createElement("div");
    const name = document.createElement("div");
    name.className = "sf-exam-name";
    name.textContent = exam.name;
    const subject = document.createElement("div");
    subject.className = "sf-exam-subject";
    subject.textContent = exam.subject;
    details.append(name, subject);

    const countdown = document.createElement("span");
    countdown.className = "sf-exam-countdown";
    countdown.textContent = `${exam.daysRemaining} days`;
    row.append(date, details, countdown);
    examList.append(row);
  });

  const weeklyTotal = dashboardPreview.weeklyHours.reduce(
    (total, item) => total + item.hours,
    0
  );
  document.querySelector("#week-total").innerHTML =
    `${weeklyTotal.toFixed(1)}<small> hrs</small>`;

  const weeklyChart = document.querySelector("#weekly-chart");
  weeklyChart.replaceChildren();
  const maxHours = Math.max(...dashboardPreview.weeklyHours.map((item) => item.hours));
  dashboardPreview.weeklyHours.forEach((item) => {
    const column = document.createElement("div");
    column.className = "sf-chart-column";
    column.setAttribute("aria-label", `${item.day}: ${item.hours} study hours`);

    const barWrap = document.createElement("div");
    barWrap.className = "sf-chart-bar-wrap";
    const bar = document.createElement("div");
    bar.className = "sf-chart-bar";
    bar.style.height = `${Math.max(4, (item.hours / maxHours) * 100)}%`;
    barWrap.append(bar);

    const day = document.createElement("span");
    day.className = "sf-chart-day";
    day.textContent = item.day;
    column.append(barWrap, day);
    weeklyChart.append(column);
  });

  const currentDate = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
  document.querySelector(".sf-welcome-row .sf-kicker").textContent =
    currentDate.toUpperCase();
}

function changeView(requestedView) {
  const view = viewNames[requestedView] ? requestedView : "dashboard";
  const actualView = document.querySelector(`.sf-view[data-view="${view}"]`)
    ? view
    : "placeholder";

  document.querySelectorAll(".sf-view").forEach((section) => {
    const isCurrent = section.dataset.view === actualView;
    section.hidden = !isCurrent;
    section.classList.toggle("is-visible", isCurrent);
  });

  document.querySelectorAll(".sf-nav-link[data-view-link]").forEach((link) => {
    const selected = link.dataset.viewLink === view;
    link.classList.toggle("is-active", selected);
    if (selected) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  document.querySelector("#current-section-name").textContent = viewNames[view];
  if (actualView === "placeholder") {
    document.querySelector("#placeholder-title").textContent = viewNames[view];
    document.querySelector("#placeholder-description").textContent =
      previewDescriptions[view] || "This section will be available in a later phase.";
    document.querySelector("#placeholder-icon").textContent =
      view === "calendar" ? "▦" : view === "exams" ? "▤" : "✦";
  }

  document.body.classList.remove("sidebar-open");
  document.querySelector("#menu-button").setAttribute("aria-expanded", "false");

  if (view === "tasks") {
    document.dispatchEvent(new Event("studyflow:tasks-open"));
  }
}

function setupNavigation() {
  document.querySelectorAll("[data-view-link], [data-open-view]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const view = link.dataset.viewLink || link.dataset.openView;
      changeView(view);
    });
  });

  document.querySelector("#dashboard-add-task").addEventListener("click", () => {
    changeView("tasks");
    document.dispatchEvent(new Event("studyflow:open-new-task"));
  });

  const menuButton = document.querySelector("#menu-button");
  menuButton.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("sidebar-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });
  document.querySelector("#sidebar-scrim").addEventListener("click", () => {
    document.body.classList.remove("sidebar-open");
    menuButton.setAttribute("aria-expanded", "false");
  });

  const notificationButton = document.querySelector("#notification-button");
  const notificationPopover = document.querySelector("#notification-popover");
  notificationButton.addEventListener("click", () => {
    const isExpanded = notificationButton.getAttribute("aria-expanded") === "true";
    notificationButton.setAttribute("aria-expanded", String(!isExpanded));
    notificationPopover.hidden = isExpanded;
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".sf-notification-wrap")) {
      notificationPopover.hidden = true;
      notificationButton.setAttribute("aria-expanded", "false");
    }
  });
}

function applyStudentName(name) {
  const studentName = name.trim() || "Student";
  document.querySelector("#welcome-student-name").textContent = studentName;
  document.querySelector("#sidebar-student-name").textContent = studentName;
  document.querySelector("#settings-student-name").value =
    studentName === "Student" ? "" : studentName;
  document.querySelector(".sf-avatar").textContent =
    studentName === "Student" ? "S" : studentName[0].toUpperCase();
}

function applyTheme(theme) {
  document.body.classList.toggle("light-theme", theme === "light");
  document.querySelector("#settings-theme").value =
    theme === "light" ? "light" : "dark";
}

function loadPreferences() {
  const name = localStorage.getItem("studyflow.studentName") || "Student";
  const semester = localStorage.getItem("studyflow.semester") || "Fall 2026";
  const theme = localStorage.getItem("studyflow.theme") || "dark";
  const savedWeeklyGoal = Number(localStorage.getItem("studyflow.weeklyGoal"));
  const weeklyGoal =
    Number.isFinite(savedWeeklyGoal) && savedWeeklyGoal >= 1 && savedWeeklyGoal <= 100
      ? savedWeeklyGoal
      : 10;
  applyStudentName(name);
  applyTheme(theme);

  const semesterOptions = [...document.querySelector("#top-semester-select").options];
  const configuredSemester = semesterOptions.some((option) => option.value === semester)
    ? semester
    : "Fall 2026";
  document.querySelector("#top-semester-select").value = configuredSemester;
  document.querySelector("#settings-semester").value = configuredSemester;
  document.querySelector("#settings-weekly-goal").value = weeklyGoal;
  document.querySelector("#settings-weekly-goal").addEventListener("input", () => {
    const status = document.querySelector("#settings-status");
    status.textContent = "";
  });

  document.querySelector("#top-semester-select").addEventListener("change", (event) => {
    localStorage.setItem("studyflow.semester", event.target.value);
    document.querySelector("#settings-semester").value = event.target.value;
  });

  document.querySelector("#settings-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const nextName = document.querySelector("#settings-student-name").value.trim();
    const nextSemester = document.querySelector("#settings-semester").value;
    const nextTheme = document.querySelector("#settings-theme").value;
    const nextWeeklyGoal = Number(
      document.querySelector("#settings-weekly-goal").value
    );
    if (!Number.isFinite(nextWeeklyGoal) || nextWeeklyGoal < 1 || nextWeeklyGoal > 100) {
      document.querySelector("#settings-weekly-goal").focus();
      return;
    }

    try {
      localStorage.setItem("studyflow.studentName", nextName || "Student");
      localStorage.setItem("studyflow.semester", nextSemester);
      localStorage.setItem("studyflow.theme", nextTheme);
      localStorage.setItem("studyflow.weeklyGoal", String(nextWeeklyGoal));
    } catch (error) {
      const status = document.querySelector("#settings-status");
      status.textContent = `Could not save preferences: ${error.message}`;
      status.classList.add("is-error");
      return;
    }

    applyStudentName(nextName || "Student");
    applyTheme(nextTheme);
    document.querySelector("#top-semester-select").value = nextSemester;
    const status = document.querySelector("#settings-status");
    status.classList.remove("is-error");
    status.textContent = "Preferences saved on this device.";
    renderProgress();
    window.setTimeout(() => {
      status.textContent = "";
    }, 2800);
  });
}

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readFocusSessions() {
  const savedSessions = localStorage.getItem("studyflow.focusSessions");
  if (!savedSessions) {
    return [];
  }

  const sessions = JSON.parse(savedSessions);
  if (!Array.isArray(sessions)) {
    throw new Error("Saved focus session data is invalid.");
  }
  return sessions.filter(
    (session) =>
      typeof session.completedAt === "string" &&
      Number.isFinite(Date.parse(session.completedAt)) &&
      Number.isFinite(Number(session.durationSeconds))
  );
}

function formatHours(hours) {
  return `${Number(hours.toFixed(1))}h`;
}

function renderProgress() {
  const status = document.querySelector("#progress-status");
  const chart = document.querySelector("#progress-chart");
  const sessionList = document.querySelector("#progress-sessions");
  status.textContent = "";
  status.classList.remove("is-error");

  let sessions;
  try {
    sessions = readFocusSessions();
  } catch (error) {
    status.textContent = `Could not load progress: ${error.message}`;
    status.classList.add("is-error");
    sessions = [];
  }

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return {
      date,
      key: getLocalDateKey(date),
      day: new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date),
      seconds: 0,
    };
  });
  const secondsByDate = new Map(weekDays.map((day) => [day.key, day]));
  const sessionsThisWeek = sessions.filter((session) => {
    const completedDate = new Date(session.completedAt);
    const key = getLocalDateKey(completedDate);
    const day = secondsByDate.get(key);
    if (!day) {
      return false;
    }
    day.seconds += Number(session.durationSeconds);
    return true;
  });
  const totalSeconds = weekDays.reduce((total, day) => total + day.seconds, 0);
  const totalHours = totalSeconds / 3600;
  const savedWeeklyGoal = Number(localStorage.getItem("studyflow.weeklyGoal"));
  const weeklyGoal =
    Number.isFinite(savedWeeklyGoal) && savedWeeklyGoal >= 1 && savedWeeklyGoal <= 100
      ? savedWeeklyGoal
      : 10;
  const goalPercent = Math.round((totalHours / weeklyGoal) * 100);

  document.querySelector("#progress-week-hours").textContent = formatHours(totalHours);
  document.querySelector("#progress-session-count").textContent =
    String(sessionsThisWeek.length);
  document.querySelector("#progress-goal-value").textContent =
    `${weeklyGoal}h`;
  document.querySelector("#progress-goal-caption").textContent =
    `${Math.min(goalPercent, 100)}% complete`;
  document.querySelector("#progress-goal-bar").style.width =
    `${Math.min(goalPercent, 100)}%`;
  document.querySelector("#progress-goal-note").textContent =
    totalHours >= weeklyGoal
      ? "Weekly goal reached. Great work!"
      : `${formatHours(Math.max(weeklyGoal - totalHours, 0))} left to reach your weekly goal.`;
  document.querySelector("#progress-week-range").textContent =
    `${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(weekStart)} – ${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(weekDays[6].date)}`;

  const maxHours = Math.max(
    weeklyGoal / 7,
    ...weekDays.map((day) => day.seconds / 3600),
    0.5
  );
  chart.replaceChildren();
  weekDays.forEach((day) => {
    const hours = day.seconds / 3600;
    const column = document.createElement("div");
    column.className = "sf-progress-chart-column";
    column.setAttribute("aria-label", `${day.day}: ${hours.toFixed(2)} study hours`);
    const value = document.createElement("span");
    value.className = "sf-progress-chart-value";
    value.textContent = hours > 0 ? formatHours(hours) : "";
    const bar = document.createElement("span");
    bar.className = "sf-progress-chart-bar";
    bar.style.height = `${hours > 0 ? Math.max(5, (hours / maxHours) * 100) : 0}%`;
    bar.title = `${day.day}: ${hours.toFixed(2)} hours`;
    const dayLabel = document.createElement("span");
    dayLabel.className = "sf-progress-chart-day";
    dayLabel.textContent = day.day;
    column.append(value, bar, dayLabel);
    chart.append(column);
  });

  sessionList.replaceChildren();
  const recentSessions = [...sessions]
    .sort((left, right) =>
      new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime()
    )
    .slice(0, 5);
  if (recentSessions.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "sf-module-empty";
    const heading = document.createElement("h3");
    heading.textContent = "No completed sessions yet";
    const detail = document.createElement("p");
    detail.textContent = "Complete a focus timer to start tracking your study time.";
    emptyState.append(heading, detail);
    sessionList.append(emptyState);
    return;
  }

  recentSessions.forEach((session) => {
    const item = document.createElement("article");
    item.className = "sf-entry-card sf-progress-session";
    const details = document.createElement("div");
    details.className = "sf-entry-content";
    const title = document.createElement("h3");
    title.textContent = session.subject || "Focus session";
    const completedAt = new Date(session.completedAt);
    const metadata = document.createElement("p");
    metadata.className = "sf-entry-meta";
    metadata.textContent = new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(completedAt);
    details.append(title, metadata);
    const duration = document.createElement("span");
    duration.className = "sf-progress-session-duration";
    duration.textContent = formatHours(Number(session.durationSeconds) / 3600);
    item.append(details, duration);
    sessionList.append(item);
  });
}

function setupFocusTimer() {
  const focusDurationSeconds = 25 * 60;
  let secondsRemaining = focusDurationSeconds;
  let timerId = null;
  let isRunning = false;
  let hasStarted = false;
  let pendingCompletedSession = null;

  const display = document.querySelector("#timer-display");
  const ring = document.querySelector("#timer-ring");
  const startButton = document.querySelector("#timer-start");
  const pauseButton = document.querySelector("#timer-pause");
  const resetButton = document.querySelector("#timer-reset");
  const caption = document.querySelector("#timer-caption");

  function renderTimer() {
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    display.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    const progress = (secondsRemaining / focusDurationSeconds) * 100;
    ring.style.setProperty("--timer-progress", `${progress}%`);
  }

  function setRunning(running) {
    isRunning = running;
    startButton.disabled = running || hasStarted;
    startButton.textContent = running
      ? "Focus in progress"
      : hasStarted
        ? "Session paused"
        : "Start focus session";
    pauseButton.textContent = running ? "Pause" : "Resume";
    pauseButton.disabled =
      !running && (!hasStarted || secondsRemaining === 0);
    caption.textContent = running
      ? "FOCUSING NOW"
      : hasStarted
        ? "SESSION PAUSED"
        : "FOCUS SESSION";
  }

  function finishSession() {
    window.clearInterval(timerId);
    timerId = null;
    setRunning(false);
    startButton.disabled = true;
    startButton.textContent = "Session completed";
    caption.textContent = "WELL DONE";
    pendingCompletedSession = {
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      completedAt: new Date().toISOString(),
      durationSeconds: focusDurationSeconds,
    };
    document.querySelector("#focus-complete-dialog").showModal();
  }

  function saveCompletedSession() {
    if (!pendingCompletedSession) {
      return;
    }

    try {
      const sessions = readFocusSessions();
      sessions.push({
        ...pendingCompletedSession,
        subject: document.querySelector("#focus-subject").value,
      });
      localStorage.setItem("studyflow.focusSessions", JSON.stringify(sessions));
      pendingCompletedSession = null;
      renderProgress();
    } catch (error) {
      const status = document.querySelector("#progress-status");
      status.textContent = `Session completed but could not save progress: ${error.message}`;
      status.classList.add("is-error");
      pendingCompletedSession = null;
    }
  }

  startButton.addEventListener("click", () => {
    if (secondsRemaining === 0 || isRunning) {
      return;
    }

    hasStarted = true;
    setRunning(true);
    timerId = window.setInterval(() => {
      secondsRemaining -= 1;
      renderTimer();
      if (secondsRemaining <= 0) {
        finishSession();
      }
    }, 1000);
  });

  pauseButton.addEventListener("click", () => {
    if (isRunning) {
      window.clearInterval(timerId);
      timerId = null;
      setRunning(false);
    } else if (secondsRemaining > 0 && secondsRemaining < focusDurationSeconds) {
      setRunning(true);
      timerId = window.setInterval(() => {
        secondsRemaining -= 1;
        renderTimer();
        if (secondsRemaining <= 0) {
          finishSession();
        }
      }, 1000);
    }
  });

  resetButton.addEventListener("click", () => {
    window.clearInterval(timerId);
    timerId = null;
    secondsRemaining = focusDurationSeconds;
    hasStarted = false;
    renderTimer();
    setRunning(false);
    startButton.disabled = false;
  });

  document.querySelector("#focus-complete-dialog").addEventListener("close", () => {
    saveCompletedSession();
    secondsRemaining = focusDurationSeconds;
    hasStarted = false;
    renderTimer();
    setRunning(false);
    startButton.disabled = false;
  });

  renderTimer();
  setRunning(false);
}

renderDashboardPreview();
setupNavigation();
loadPreferences();
renderProgress();
setupFocusTimer();
