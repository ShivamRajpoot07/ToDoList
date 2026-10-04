const API_URL = "/api/tasks";

const taskList = document.querySelector("#task-list");
const searchInput = document.querySelector("#search-input");
const message = document.querySelector("#message");
const dialog = document.querySelector("#task-dialog");
const taskForm = document.querySelector("#task-form");
const taskIdInput = document.querySelector("#task-id");
const taskTitleInput = document.querySelector("#task-title");
const taskDescriptionInput = document.querySelector("#task-description");
const taskStatusInput = document.querySelector("#task-status");
const taskIsDailyInput = document.querySelector("#task-is-daily");
const dialogTitle = document.querySelector("#dialog-title");
const formError = document.querySelector("#form-error");
const saveTaskButton = document.querySelector("#save-task-button");

let searchTimer;
let requestNumber = 0;
let loadedTasks = [];
let activeFilter = "all";

function showMessage(text) {
  message.textContent = text;
  message.hidden = false;
}

function hideMessage() {
  message.textContent = "";
  message.hidden = true;
}

function showFormError(text) {
  formError.textContent = text;
  formError.hidden = false;
}

function clearFormError() {
  formError.textContent = "";
  formError.hidden = true;
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || `Request failed (${response.status}).`);
  }

  return response.status === 204 ? null : response.json();
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function makeEmptyState(title, description) {
  const emptyState = document.createElement("div");
  emptyState.className = "empty-state";

  const icon = document.createElement("div");
  icon.className = "empty-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "✓";

  const heading = document.createElement("h3");
  heading.textContent = title;

  const detail = document.createElement("p");
  detail.textContent = description;

  emptyState.append(icon, heading, detail);
  return emptyState;
}

function makeTaskCard(task) {
  const card = document.createElement("article");
  card.className = "task-card";
  card.dataset.id = task.id;
  card.dataset.daily = String(Boolean(task.is_daily));
  if (task.status === "Completed") {
    card.classList.add("is-completed");
  }

  const checkbox = document.createElement("input");
  checkbox.className = "task-checkbox";
  checkbox.type = "checkbox";
  checkbox.checked = task.status === "Completed";
  checkbox.setAttribute(
    "aria-label",
    `Mark "${task.title}" ${checkbox.checked ? "as pending" : "as completed"}`
  );
  checkbox.dataset.action = "toggle";

  const content = document.createElement("div");
  content.className = "task-content";

  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;
  content.append(title);

  if (task.description) {
    const description = document.createElement("p");
    description.className = "task-description";
    description.textContent = task.description;
    content.append(description);
  }

  const meta = document.createElement("div");
  meta.className = "task-meta";

  const badge = document.createElement("span");
  badge.className = "status-badge";
  badge.textContent = task.status;

  const createdDate = document.createElement("span");
  createdDate.textContent = `Created ${formatDate(task.created_at)}`;

  meta.append(badge);
  if (task.is_daily) {
    const repeatBadge = document.createElement("span");
    repeatBadge.className = "sf-task-repeat-badge";
    repeatBadge.textContent = "↻ Daily";
    meta.append(repeatBadge);
  }
  meta.append(createdDate);
  content.append(meta);

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const editButton = document.createElement("button");
  editButton.className = "text-button";
  editButton.type = "button";
  editButton.textContent = "Edit";
  editButton.dataset.action = "edit";

  const deleteButton = document.createElement("button");
  deleteButton.className = "text-button delete-button";
  deleteButton.type = "button";
  deleteButton.textContent = "Delete";
  deleteButton.dataset.action = "delete";

  actions.append(editButton, deleteButton);
  card.append(checkbox, content, actions);
  return card;
}

function updateTaskOverview(tasks) {
  const completedCount = tasks.filter((task) => task.status === "Completed").length;
  const totalCount = tasks.length;
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const progressBar = document.querySelector("#task-progress-bar");
  const today = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  document.querySelector("#task-today-date").textContent = today;
  document.querySelector("#task-progress-count").textContent =
    `${completedCount} of ${totalCount} complete`;
  document.querySelector("#task-progress-percent").textContent = `${percent}%`;
  document.querySelector("#task-progress-note").textContent =
    totalCount === 0
      ? "Add a task to start shaping your day."
      : completedCount === totalCount
        ? "Everything is done. Enjoy the breathing room."
        : "Small steps add up. Keep your momentum going.";
  progressBar.setAttribute("aria-valuenow", String(percent));
  progressBar.querySelector("span").style.width = `${percent}%`;
}

function renderTasks(tasks, searchTerm) {
  loadedTasks = tasks;
  updateTaskOverview(tasks);

  const counts = {
    all: tasks.length,
    pending: tasks.filter((task) => task.status === "Pending").length,
    completed: tasks.filter((task) => task.status === "Completed").length,
    daily: tasks.filter((task) => task.is_daily).length,
  };
  Object.entries(counts).forEach(([filter, count]) => {
    document.querySelector(`#task-count-${filter}`).textContent = count;
  });

  const visibleTasks = activeFilter === "all"
    ? tasks
    : tasks.filter((task) => {
        if (activeFilter === "daily") {
          return task.is_daily;
        }
        return task.status === (activeFilter === "completed" ? "Completed" : "Pending");
      });
  taskList.replaceChildren();

  if (visibleTasks.length === 0) {
    const emptyCopy = activeFilter === "daily"
      ? ["No daily tasks yet", "Turn on “Repeat every day” when adding a task to build your routine."]
      : activeFilter === "completed"
        ? ["Nothing completed yet", "Your finished tasks will show up here."]
        : activeFilter === "pending"
          ? ["You’re all caught up", "There are no tasks waiting for you right now."]
          : ["Your task list is clear", "Add a task to get started."];
    taskList.append(
      searchTerm
        ? makeEmptyState("No matching tasks", "Try another title or search term.")
        : makeEmptyState(...emptyCopy)
    );
    return;
  }

  const cards = visibleTasks.map(makeTaskCard);
  taskList.append(...cards);
}

async function loadTasks() {
  const currentRequest = ++requestNumber;
  const searchTerm = searchInput.value.trim();
  const url = new URL(API_URL, window.location.origin);
  if (searchTerm) {
    url.searchParams.set("search", searchTerm);
  }

  hideMessage();
  try {
    const tasks = await request(url);
    // Ignore an older search response if a newer one has already finished.
    if (currentRequest === requestNumber) {
      renderTasks(tasks, searchTerm);
    }
  } catch (error) {
    if (currentRequest === requestNumber) {
      taskList.replaceChildren();
      showMessage(`Could not load tasks: ${error.message}`);
    }
  }
}

function openNewTaskForm() {
  taskForm.reset();
  taskIdInput.value = "";
  taskStatusInput.value = "Pending";
  taskIsDailyInput.checked = false;
  dialogTitle.textContent = "Add a task";
  saveTaskButton.textContent = "Save task";
  clearFormError();
  dialog.showModal();
  taskTitleInput.focus();
}

async function openEditTaskForm(id) {
  clearFormError();
  try {
    const task = await request(`${API_URL}/${id}`);
    taskIdInput.value = task.id;
    taskTitleInput.value = task.title;
    taskDescriptionInput.value = task.description || "";
    taskStatusInput.value = task.status;
    taskIsDailyInput.checked = Boolean(task.is_daily);
    dialogTitle.textContent = "Edit task";
    saveTaskButton.textContent = "Save changes";
    dialog.showModal();
    taskTitleInput.focus();
  } catch (error) {
    showMessage(`Could not open this task: ${error.message}`);
  }
}

document.querySelector("#add-task-button").addEventListener("click", openNewTaskForm);

document.querySelectorAll(".close-dialog").forEach((button) => {
  button.addEventListener("click", () => dialog.close());
});

document.addEventListener("studyflow:tasks-open", loadTasks);
document.addEventListener("studyflow:open-new-task", openNewTaskForm);

dialog.addEventListener("close", clearFormError);

document.querySelectorAll("[data-task-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.taskFilter;
    document.querySelectorAll("[data-task-filter]").forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle("is-active", isActive);
      filterButton.setAttribute("aria-pressed", String(isActive));
    });
    renderTasks(loadedTasks, searchInput.value.trim());
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.body.classList.contains("sidebar-open")) {
    document.body.classList.remove("sidebar-open");
    document.querySelector("#menu-button").setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("keydown", (event) => {
  if (
    event.key === "/" &&
    !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)
  ) {
    event.preventDefault();
    searchInput.focus();
  }
});

searchInput.addEventListener("input", () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(loadTasks, 250);
});

taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearFormError();

  const task = {
    title: taskTitleInput.value.trim(),
    description: taskDescriptionInput.value.trim(),
    status: taskStatusInput.value,
    is_daily: taskIsDailyInput.checked,
  };

  if (!task.title) {
    showFormError("Please enter a task title.");
    taskTitleInput.focus();
    return;
  }

  const id = taskIdInput.value;
  const saveUrl = id ? `${API_URL}/${id}` : API_URL;
  const method = id ? "PUT" : "POST";
  saveTaskButton.disabled = true;

  try {
    await request(saveUrl, {
      method,
      body: JSON.stringify(task),
    });
    dialog.close();
    taskForm.reset();
    await loadTasks();
  } catch (error) {
    showFormError(`Could not save this task: ${error.message}`);
  } finally {
    saveTaskButton.disabled = false;
  }
});

taskList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const card = button.closest(".task-card");
  if (button.dataset.action === "edit") {
    await openEditTaskForm(card.dataset.id);
    return;
  }

  if (button.dataset.action === "delete") {
    const title = card.querySelector(".task-title").textContent;
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await request(`${API_URL}/${card.dataset.id}`, { method: "DELETE" });
      await loadTasks();
    } catch (error) {
      showMessage(`Could not delete this task: ${error.message}`);
    }
  }
});

taskList.addEventListener("change", async (event) => {
  if (event.target.dataset.action !== "toggle") {
    return;
  }

  const checkbox = event.target;
  const card = checkbox.closest(".task-card");
  const title = card.querySelector(".task-title").textContent;
  const description =
    card.querySelector(".task-description")?.textContent || "";

  try {
    await request(`${API_URL}/${card.dataset.id}`, {
      method: "PUT",
      body: JSON.stringify({
        title,
        description,
        status: checkbox.checked ? "Completed" : "Pending",
        is_daily: card.dataset.daily === "true",
      }),
    });
    await loadTasks();
  } catch (error) {
    checkbox.checked = !checkbox.checked;
    showMessage(`Could not update this task: ${error.message}`);
  }
});
