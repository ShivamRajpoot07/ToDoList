const collections = ["calendar", "subjects", "exams", "notes", "resources"];
const storagePrefix = "studyflow.academic.";
const entriesByCollection = Object.fromEntries(
  collections.map((collection) => [collection, []])
);

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setStatus(collection, message, isError = false) {
  const status = document.querySelector(`#${collection}-status`);
  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

function loadEntries(collection) {
  try {
    const saved = localStorage.getItem(`${storagePrefix}${collection}`);
    if (saved === null) {
      return [];
    }

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      throw new Error("Saved data has an unexpected format.");
    }
    return parsed;
  } catch (error) {
    setStatus(collection, `Could not load saved ${collection}: ${error.message}`, true);
    return [];
  }
}

function saveEntries(collection, entries) {
  try {
    localStorage.setItem(`${storagePrefix}${collection}`, JSON.stringify(entries));
    entriesByCollection[collection] = entries;
    return true;
  } catch (error) {
    setStatus(collection, `Could not save ${collection}: ${error.message}`, true);
    return false;
  }
}

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

function createActionButton(label, action, id, isDanger = false) {
  const button = createElement(
    "button",
    isDanger ? "sf-entry-action is-danger" : "sf-entry-action",
    label
  );
  button.type = "button";
  button.dataset.action = action;
  button.dataset.id = id;
  return button;
}

function makeEntryCard(entry, collection) {
  const card = createElement("article", "sf-entry-card");
  const content = createElement("div", "sf-entry-content");
  const heading = createElement("div", "sf-entry-heading");
  const title = createElement("h3", "", entry.title);
  heading.append(title);

  if (collection === "subjects") {
    const priority = createElement(
      "span",
      `sf-priority-badge is-${entry.priority || "medium"}`,
      `${entry.priority || "medium"} priority`
    );
    heading.append(priority);
  }

  if (collection === "resources") {
    const link = createElement("a", "sf-entry-link", "Open resource ↗");
    link.href = entry.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    content.append(heading, link);
  } else {
    content.append(heading);
  }

  const metadata = [];
  if (collection === "calendar") {
    metadata.push(
      new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
      }).format(new Date(`${entry.date}T00:00:00`))
    );
    if (entry.time) {
      metadata.push(entry.time);
    }
    if (entry.type) {
      metadata.push(entry.type);
    }
    if (entry.location) {
      metadata.push(entry.location);
    }
  } else if (collection === "exams") {
    metadata.push(
      new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
      }).format(new Date(`${entry.date}T00:00:00`))
    );
    if (entry.time) {
      metadata.push(entry.time);
    }
    if (entry.subject) {
      metadata.push(entry.subject);
    }
    const examDate = new Date(`${entry.date}T00:00:00`);
    const today = new Date(`${localDateString(new Date())}T00:00:00`);
    const daysLeft = Math.ceil((examDate - today) / 86400000);
    metadata.push(
      daysLeft < 0
        ? "Past"
        : daysLeft === 0
          ? "Today"
          : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
    );
  } else if (entry.subject) {
    metadata.push(entry.subject);
  }

  if (metadata.length > 0) {
    content.append(createElement("p", "sf-entry-meta", metadata.join(" · ")));
  }

  const detailText =
    collection === "notes" ? entry.content : entry.description;
  if (detailText) {
    content.append(createElement("p", "sf-entry-description", detailText));
  }

  const actions = createElement("div", "sf-entry-actions");
  actions.append(
    createActionButton("Edit", "edit", entry.id),
    createActionButton("Delete", "delete", entry.id, true)
  );
  card.append(content, actions);
  return card;
}

function renderList(collection, entries, customEmptyMessage) {
  const list = document.querySelector(`#${collection}-list`);
  list.replaceChildren();
  const count = document.querySelector(`#${collection}-count`);
  if (count) {
    count.textContent = String(entries.length);
  }

  if (entries.length === 0) {
    const emptyMessages = {
      subjects: ["No subjects yet", "Add a subject and choose its priority."],
      exams: ["No exams scheduled", "Add an exam to keep its date in view."],
      notes: ["No notes yet", "Create a note to get started."],
      resources: ["No resources saved", "Add a link you want to keep handy."],
    };
    const [title, description] = customEmptyMessage || emptyMessages[collection];
    const emptyState = createElement("div", "sf-module-empty");
    emptyState.append(
      createElement("h3", "", title),
      createElement("p", "", description)
    );
    list.append(emptyState);
    return;
  }

  list.append(...entries.map((entry) => makeEntryCard(entry, collection)));
}

let selectedCalendarDate = localDateString(new Date());
let displayedMonth = new Date();
displayedMonth.setDate(1);

function renderCalendar() {
  const monthLabel = document.querySelector("#calendar-month-label");
  const calendarGrid = document.querySelector("#calendar-grid");
  const selectedDateLabel = document.querySelector("#calendar-selected-date");
  const selectedDate = new Date(`${selectedCalendarDate}T00:00:00`);
  monthLabel.textContent = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(displayedMonth);
  selectedDateLabel.textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(selectedDate);

  calendarGrid.replaceChildren();
  const firstOfMonth = new Date(
    displayedMonth.getFullYear(),
    displayedMonth.getMonth(),
    1
  );
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  for (let offset = 0; offset < 42; offset += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + offset);
    const dateValue = localDateString(date);
    const dayButton = createElement("button", "sf-calendar-day");
    dayButton.type = "button";
    dayButton.textContent = String(date.getDate());
    dayButton.dataset.date = dateValue;
    dayButton.setAttribute(
      "aria-label",
      new Intl.DateTimeFormat(undefined, {
        dateStyle: "full",
      }).format(date)
    );
    dayButton.setAttribute(
      "aria-pressed",
      String(dateValue === selectedCalendarDate)
    );
    if (date.getMonth() !== displayedMonth.getMonth()) {
      dayButton.classList.add("is-outside-month");
    }
    if (dateValue === localDateString(new Date())) {
      dayButton.classList.add("is-today");
    }
    if (dateValue === selectedCalendarDate) {
      dayButton.classList.add("is-selected");
    }
    if (entriesByCollection.calendar.some((entry) => entry.date === dateValue)) {
      dayButton.classList.add("has-events");
      dayButton.setAttribute("aria-label", `${dayButton.getAttribute("aria-label")}, has events`);
    }
    calendarGrid.append(dayButton);
  }

  const dayEvents = entriesByCollection.calendar
    .filter((entry) => entry.date === selectedCalendarDate)
    .sort((left, right) => (left.time || "").localeCompare(right.time || ""));
  const list = document.querySelector("#calendar-list");
  list.replaceChildren();
  if (dayEvents.length === 0) {
    const emptyState = createElement("div", "sf-module-empty");
    emptyState.append(
      createElement("h3", "", "Nothing planned for this day"),
      createElement("p", "", "Add an event to start filling your calendar.")
    );
    list.append(emptyState);
  } else {
    list.append(...dayEvents.map((entry) => makeEntryCard(entry, "calendar")));
  }
}

function renderNotes() {
  const searchTerm = document.querySelector("#notes-search").value.trim().toLowerCase();
  const filteredNotes = entriesByCollection.notes.filter((entry) =>
    [entry.title, entry.subject, entry.content]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(searchTerm))
  );
  renderList(
    "notes",
    filteredNotes,
    searchTerm ? ["No matching notes", "Try another title, subject, or search term."] : null
  );
}

function renderExams() {
  const exams = [...entriesByCollection.exams].sort((left, right) =>
    left.date.localeCompare(right.date)
  );
  renderList("exams", exams);
}

function renderCollection(collection) {
  if (collection === "calendar") {
    renderCalendar();
  } else if (collection === "notes") {
    renderNotes();
  } else if (collection === "exams") {
    renderExams();
  } else {
    renderList(collection, entriesByCollection[collection]);
  }
}

function resetForm(collection) {
  const form = document.querySelector(`#${collection}-form`);
  form.reset();
  form.elements.id.value = "";
  form.querySelector(`[data-cancel-form="${collection}"]`).hidden = true;
  const labels = {
    calendar: ["Add an event", "Save event"],
    subjects: ["Add a subject", "Save subject"],
    exams: ["Add an exam", "Save exam"],
    notes: ["Create a note", "Save note"],
    resources: ["Add a resource", "Save resource"],
  };
  document.querySelector(`#${collection}-form-heading`).textContent =
    labels[collection][0];
  form.querySelector('[type="submit"]').textContent = labels[collection][1];
  if (collection === "calendar") {
    form.elements.date.value = selectedCalendarDate;
  }
}

function startEditing(collection, id) {
  const entry = entriesByCollection[collection].find((item) => item.id === id);
  if (!entry) {
    setStatus(collection, "That item could not be found. Refresh and try again.", true);
    return;
  }

  const form = document.querySelector(`#${collection}-form`);
  Object.entries(entry).forEach(([name, value]) => {
    if (form.elements[name]) {
      form.elements[name].value = value;
    }
  });
  form.querySelector(`[data-cancel-form="${collection}"]`).hidden = false;
  const labels = {
    calendar: ["Edit event", "Update event"],
    subjects: ["Edit subject", "Update subject"],
    exams: ["Edit exam", "Update exam"],
    notes: ["Edit note", "Update note"],
    resources: ["Edit resource", "Update resource"],
  };
  document.querySelector(`#${collection}-form-heading`).textContent =
    labels[collection][0];
  form.querySelector('[type="submit"]').textContent = labels[collection][1];
  form.elements.title.focus();
}

function readFormEntry(collection, form) {
  const formData = new FormData(form);
  const entry = Object.fromEntries(formData.entries());
  entry.id = entry.id || (crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  Object.keys(entry).forEach((key) => {
    if (typeof entry[key] === "string") {
      entry[key] = entry[key].trim();
    }
  });

  if (collection === "resources") {
    let parsedUrl;
    try {
      parsedUrl = new URL(entry.url);
    } catch {
      throw new Error("Enter a valid resource URL.");
    }
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Resource URLs must start with http:// or https://.");
    }
    entry.url = parsedUrl.href;
  }

  return entry;
}

function saveForm(collection, form) {
  let entry;
  try {
    entry = readFormEntry(collection, form);
  } catch (error) {
    setStatus(collection, error.message, true);
    return;
  }

  const existingIndex = entriesByCollection[collection].findIndex(
    (item) => item.id === entry.id
  );
  const nextEntries = [...entriesByCollection[collection]];
  if (existingIndex < 0) {
    nextEntries.push(entry);
  } else {
    nextEntries[existingIndex] = entry;
  }

  if (!saveEntries(collection, nextEntries)) {
    return;
  }

  if (collection === "calendar") {
    selectedCalendarDate = entry.date;
    displayedMonth = new Date(`${entry.date}T00:00:00`);
    displayedMonth.setDate(1);
  }
  resetForm(collection);
  setStatus(collection, existingIndex < 0 ? "Saved." : "Changes saved.");
  renderCollection(collection);
}

function removeEntry(collection, id) {
  const entry = entriesByCollection[collection].find((item) => item.id === id);
  if (!entry || !window.confirm(`Delete "${entry.title}"?`)) {
    return;
  }

  const nextEntries = entriesByCollection[collection].filter(
    (item) => item.id !== id
  );
  if (!saveEntries(collection, nextEntries)) {
    return;
  }
  if (document.querySelector(`#${collection}-form`).elements.id.value === id) {
    resetForm(collection);
  }
  setStatus(collection, "Deleted.");
  renderCollection(collection);
}

function setupCollection(collection) {
  entriesByCollection[collection] = loadEntries(collection);
  const form = document.querySelector(`#${collection}-form`);
  const list = document.querySelector(`#${collection}-list`);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveForm(collection, form);
  });
  form.querySelector(`[data-cancel-form="${collection}"]`).addEventListener(
    "click",
    () => resetForm(collection)
  );
  list.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }
    if (button.dataset.action === "edit") {
      startEditing(collection, button.dataset.id);
    } else if (button.dataset.action === "delete") {
      removeEntry(collection, button.dataset.id);
    }
  });
  document.querySelectorAll(`[data-new-entry="${collection}"]`).forEach((button) => {
    button.addEventListener("click", () => {
      resetForm(collection);
      form.elements.title.focus();
    });
  });
  renderCollection(collection);
}

function setupCalendarControls() {
  document.querySelector("#calendar-grid").addEventListener("click", (event) => {
    const dayButton = event.target.closest("button[data-date]");
    if (!dayButton) {
      return;
    }
    selectedCalendarDate = dayButton.dataset.date;
    displayedMonth = new Date(`${selectedCalendarDate}T00:00:00`);
    displayedMonth.setDate(1);
    document.querySelector("#calendar-form").elements.date.value =
      selectedCalendarDate;
    setStatus("calendar", "");
    renderCalendar();
  });

  document.querySelector("#calendar-previous").addEventListener("click", () => {
    displayedMonth.setMonth(displayedMonth.getMonth() - 1);
    selectedCalendarDate = localDateString(displayedMonth);
    document.querySelector("#calendar-form").elements.date.value =
      selectedCalendarDate;
    renderCalendar();
  });

  document.querySelector("#calendar-next").addEventListener("click", () => {
    displayedMonth.setMonth(displayedMonth.getMonth() + 1);
    selectedCalendarDate = localDateString(displayedMonth);
    document.querySelector("#calendar-form").elements.date.value =
      selectedCalendarDate;
    renderCalendar();
  });

  document.querySelector("#calendar-today").addEventListener("click", () => {
    selectedCalendarDate = localDateString(new Date());
    displayedMonth = new Date();
    displayedMonth.setDate(1);
    document.querySelector("#calendar-form").elements.date.value =
      selectedCalendarDate;
    renderCalendar();
  });
}

collections.forEach(setupCollection);
setupCalendarControls();
document.querySelector("#notes-search").addEventListener("input", renderNotes);
