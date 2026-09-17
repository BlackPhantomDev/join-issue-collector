let currentEditTaskId = null;
let tasks = [];

const COLUMNS = ["triage", "toDo", "inProgress", "await", "done"];
const PRIORITIES = ["urgent", "medium", "low"];
const COLUMN_LABELS = {
  triage: "Triage",
  toDo: "To-do",
  inProgress: "In progress",
  await: "Await feedback",
  done: "Done",
};

/**
 * Initializes the board by running setup, loading tasks and rendering.
 * @param {string} site - The current site/page identifier
 * @returns {Promise<void>}
 */
async function initBoard(site) {
  init(site);
  await initTasks();
  await renderAll();
  document.addEventListener("click", handleOutsideClick);
  window.addEventListener("resize", updateScrollArrows);
}

/**
 * Initializes the tasks by loading them from the database.
 * @returns {Promise<void>}
 */
async function initTasks() {
  const data = await loadData("/tasks");
  tasks = Object.entries(data ?? {}).map(([id, task]) =>
    normalizeTask(id, task),
  );
}

/**
 * Converts a Firebase value into a plain array.
 * Firebase stores sparse arrays as objects and the n8n agent may omit the field.
 * @param {Object[]|Object|undefined} value - The raw value from Firebase
 * @returns {Object[]} The value as an array
 */
function normalizeList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : Object.values(value);
}

/**
 * Fills in the defaults for a task loaded from Firebase.
 * Tasks written by the n8n agent can miss fields the add-task form always sets,
 * so every task reaching the board has the same shape.
 * @param {string} id - The Firebase key of the task
 * @param {Object} task - The raw task object from Firebase
 * @returns {Object} The normalized task object
 */
function normalizeTask(id, task) {
  return {
    ...task,
    id,
    title: task.title ?? "Untitled task",
    description: task.description ?? "",
    category: task.category ?? "Technical Task",
    categoryLabelColor:
      task.categoryLabelColor ?? getTaskCategoryLabelColor(task.category),
    priority: PRIORITIES.includes(task.priority) ? task.priority : "medium",
    status: COLUMNS.includes(task.status) ? task.status : "triage",
    assignedTo: normalizeList(task.assignedTo),
    subtasks: normalizeList(task.subtasks),
    aiGenerated: task.aiGenerated === true,
  };
}

/**
 * Renders all task sections on the board.
 * @returns {Promise<void>}
 */
async function renderAll() {
  for (const section of COLUMNS) await renderSection(section);
  updateNoTaskPlaceholders();
  updateScrollArrows();
}

/**
 * Render all Tasks for a given status column.
 * @param {string} section - The column name (e.g. "toDo", "inProgress")
 * @returns {Promise<void>}
 */
async function renderSection(section) {
  const container = document.getElementById(section);
  container.innerHTML = "";
  const taskStatus = tasks.filter((t) => t["status"] == section);

  for (let i = 0; i < taskStatus.length; i++) {
    const element = taskStatus[i];
    const [solved, total, visibility] = await getSubtaskData(element);

    container.innerHTML += await getToDoTemplate(
      element,
      solved,
      total,
      visibility,
      calcSubtaskProgress(solved, total),
    );
  }
}

/**
 * Renders the given columns and updates the placeholders.
 * @param  {...string} columns - Column names to re-render
 * @returns {Promise<void>}
 */
async function reRenderColumns(...columns) {
  for (const col of columns) await renderSection(col);
  updateNoTaskPlaceholders();
  updateScrollArrows();
}

/* =========================================================
   MOVE-TO OVERLAY
   ========================================================= */

/**
 * Returns the neighbor columns a task can move to.
 * @param {string} currentStatus - The current column ID
 * @returns {Object[]} Array of {id, label, direction}
 */
function getMoveTargets(currentStatus) {
  const idx = COLUMNS.indexOf(currentStatus);
  const targets = [];
  if (idx > 0) {
    targets.push({
      id: COLUMNS[idx - 1],
      label: COLUMN_LABELS[COLUMNS[idx - 1]],
      direction: "up",
    });
  }
  if (idx < COLUMNS.length - 1) {
    targets.push({
      id: COLUMNS[idx + 1],
      label: COLUMN_LABELS[COLUMNS[idx + 1]],
      direction: "down",
    });
  }
  return targets;
}

/**
 * Toggles the move-to overlay on a task card.
 * @param {Event} event - The click event
 * @param {string} taskId - The task ID
 * @param {string} currentStatus - The current column of the task
 */
function toggleMoveOverlay(event, taskId, currentStatus) {
  event.stopPropagation();
  const existingOverlay = document.getElementById("move-overlay-" + taskId);
  closeAllOverlays();
  if (existingOverlay) return;

  const card = event.currentTarget.closest(".task-card");
  const targets = getMoveTargets(currentStatus);
  const overlay = document.createElement("div");
  overlay.className = "move-overlay";
  overlay.id = "move-overlay-" + taskId;
  overlay.innerHTML = getMoveOverlayHTML(taskId, targets);
  card.appendChild(overlay);
}

/**
 * Returns the HTML for the move overlay content.
 */
function getMoveOverlayHTML(taskId, targets) {
  let html = '<p class="move-overlay-title">Move to</p>';
  for (const t of targets) {
    const arrow = t.direction === "up" ? "↑" : "↓";
    html += `<button class="move-overlay-option" onclick="moveTaskTo(event, '${taskId}', '${t.id}')">
      <span class="move-arrow">${arrow}</span> ${t.label}
    </button>`;
  }
  return html;
}

/**
 * Moves a task to a new column via the overlay.
 */
async function moveTaskTo(event, taskId, newStatus) {
  event.stopPropagation();
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;
  const oldStatus = task.status;
  if (oldStatus === newStatus) return;

  task.status = newStatus;
  try {
    await putData("/tasks/" + task.id, task);
  } catch {
    task.status = oldStatus;
  }
  await reRenderColumns(oldStatus, newStatus);
}

/**
 * Closes all open move overlays.
 */
function closeAllOverlays() {
  document.querySelectorAll(".move-overlay").forEach((el) => el.remove());
}

/**
 * Handles clicks outside overlays to close them.
 */
function handleOutsideClick(event) {
  if (
    !event.target.closest(".move-overlay") &&
    !event.target.closest(".move-to-btn")
  ) {
    closeAllOverlays();
  }
}

/* =========================================================
   SCROLL ARROWS
   ========================================================= */

/**
 * Scrolls a column's task-cards container.
 * Desktop: vertical, Mobile: horizontal.
 * @param {string} columnId - e.g. "toDo"
 * @param {number} direction - -1 = up/left, 1 = down/right
 */
function scrollColumn(columnId, direction) {
  const container = document.getElementById(columnId);
  if (!container) return;
  const isMobile = window.innerWidth <= 1200;
  const scrollAmount = isMobile ? 260 : 280;

  if (isMobile) {
    container.scrollBy({ left: direction * scrollAmount, behavior: "smooth" });
  } else {
    container.scrollBy({ top: direction * scrollAmount, behavior: "smooth" });
  }
  setTimeout(() => updateScrollArrows(), 400);
}

/**
 * Updates scroll arrow visibility for all board columns based on scroll position and overflow.
 * Delegates to mobile or desktop handler depending on screen width.
 * @returns {void}
 */
function updateScrollArrows() {
  for (const col of COLUMNS) {
    const container = document.getElementById(col);
    const body = document.querySelector(
      `.board-task-body[data-column="${col}"]`,
    );
    if (!container || !body) continue;

    const arrowUp = body.querySelector(".arrow-up");
    const arrowDown = body.querySelector(".arrow-down");
    if (!arrowUp || !arrowDown) continue;

    const isMobile = window.innerWidth <= 1200;

    if (isMobile) {
      handleMobileArrows(container, arrowUp, arrowDown);
    } else {
      handleDesktopArrows(container, arrowUp, arrowDown);
    }
  }
}

/**
 * Shows or hides scroll arrows for horizontal (mobile) scroll containers.
 * @param {HTMLElement} container - The scrollable column container
 * @param {HTMLElement} arrowUp - The left scroll arrow element
 * @param {HTMLElement} arrowDown - The right scroll arrow element
 * @returns {void}
 */
function handleMobileArrows(container, arrowUp, arrowDown) {
  const hasOverflow = container.scrollWidth > container.clientWidth + 2;
  if (!hasOverflow) {
    arrowUp.classList.add("hidden");
    arrowDown.classList.add("hidden");
  } else {
    arrowUp.classList.toggle("hidden", container.scrollLeft <= 2);
    arrowDown.classList.toggle(
      "hidden",
      container.scrollLeft + container.clientWidth >= container.scrollWidth - 2,
    );
  }
}
/**
 * Shows or hides scroll arrows for vertical (desktop) scroll containers.
 * @param {HTMLElement} container - The scrollable column container
 * @param {HTMLElement} arrowUp - The upward scroll arrow element
 * @param {HTMLElement} arrowDown - The downward scroll arrow element
 * @returns {void}
 */
function handleDesktopArrows(container, arrowUp, arrowDown) {
  const hasOverflow = container.scrollHeight > container.clientHeight + 2;
  if (!hasOverflow) {
    arrowUp.classList.add("hidden");
    arrowDown.classList.add("hidden");
  } else {
    arrowUp.classList.toggle("hidden", container.scrollTop <= 2);
    arrowDown.classList.toggle(
      "hidden",
      container.scrollTop + container.clientHeight >=
        container.scrollHeight - 2,
    );
  }
}

/* =========================================================
   PLACEHOLDER
   ========================================================= */

/**
 * Shows or hides the "no tasks" placeholder for each column.
 */
function updateNoTaskPlaceholders() {
  for (let i = 0; i < COLUMNS.length; i++) {
    const column = document.getElementById(COLUMNS[i]);
    const placeholder = document.getElementById("placeholder-" + COLUMNS[i]);
    const hasTasks = column.querySelector(".task-card") !== null;
    if (!hasTasks) {
      placeholder.classList.remove("hidden");
    } else {
      placeholder.classList.add("hidden");
    }
  }
}

/* =========================================================
   CONTACTS
   ========================================================= */

async function getAssignedContacts(assignedTo) {
  const data = await loadData("/contacts");
  if (!data || !assignedTo) return [];

  const assignedArray = Array.isArray(assignedTo)
    ? assignedTo
    : Object.values(assignedTo);

  const assignedIds = assignedArray.map((a) => a.id.trim());
  const result = Object.entries(data)
    .map(([id, contact]) => ({ ...contact, id }))
    .filter((contact) => assignedIds.includes(contact.id.trim()));
  return result;
}

/* =========================================================
   SEARCH / FILTER
   ========================================================= */

async function findTask() {
  const query = document.getElementById("searchTask").value.toLowerCase();

  if (query.length < 1) {
    renderAll();
    return;
  }

  const matches = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query),
  );

  await renderFilteredTasks(matches);
}

async function renderFilteredTasks(filteredTasks) {
  for (const section of COLUMNS) {
    const container = document.getElementById(section);
    container.innerHTML = "";

    const sectionTasks = filteredTasks.filter((t) => t.status === section);

    for (const element of sectionTasks) {
      const [solved, total, visibility] = await getSubtaskData(element);
      container.innerHTML += await getToDoTemplate(
        element,
        solved,
        total,
        visibility,
        calcSubtaskProgress(solved, total),
      );
    }
  }
  updateNoTaskPlaceholders();
  updateScrollArrows();
}

/* =========================================================
   EDIT TASK (unchanged from original)
   ========================================================= */

async function toggleSubtaskEdit(subtaskIndex, isCompleted, taskId) {
  await putData(
    "/tasks/" + taskId + "/subtasks/" + subtaskIndex + "/completed",
    !isCompleted,
  );
  await initTasks();
  const element = tasks.find((t) => t.id === taskId);
  const assignedContacts = await getAssignedContacts(element.assignedTo);
  openEditTask(taskId);
}

function checkIfSubtasksAvaiableEdit(subtasks, taskID) {
  if (subtasks && subtasks.length) {
    return subtasks
      .map((s, index) =>
        getSubtasksTemplate(s, taskID, index, "toggleSubtaskEdit"),
      )
      .join("");
  } else {
    return "<p>No Subtask available</p>";
  }
}

function buildContactOptions(allContacts, assignedIds) {
  return Object.entries(allContacts)
    .map(([id, contact]) => {
      const checked = assignedIds.includes(id) ? "checked" : "";
      return getContactOptionTemplate(id, contact, checked);
    })
    .join("");
}

function buildContactBadges(allContacts, assignedIds) {
  return Object.entries(allContacts)
    .filter(([id]) => assignedIds.includes(id))
    .map(([id, contact]) => getContactBadgeTemplate(contact))
    .join("");
}

function buildAssignedContactsEdit(allContacts, assignedIds) {
  const optionsHTML = buildContactOptions(allContacts, assignedIds);
  const badgesHTML = buildContactBadges(allContacts, assignedIds);
  return getAssignedContactsEditTemplate(optionsHTML, badgesHTML);
}

function handleSubtaskKeyEdit(event, taskId) {
  if (event.key === "Enter") {
    event.preventDefault();
    addSubtaskEdit(taskId);
  }
  if (event.key === "Escape") clearSubtaskInputEdit();
}

function editSubtaskEditMode(span) {
  const li = span.closest("li");
  li.innerHTML = getSubtaskEditingStateTemplate(span.textContent);
  li.querySelector("input").focus();
}

function confirmSubtaskEditMode(btn) {
  const li = btn.closest("li");
  const text = li.querySelector(".subtask-edit-input").value.trim();
  if (!text) {
    li.remove();
    return;
  }
  li.outerHTML = getSubtaskEditItemTemplate(
    { title: text },
    li.dataset.taskId,
    li.dataset.index,
  );
}

/**
 * Returns the active CSS class for a priority button.
 * @param {string} priority - The priority to check
 * @param {string} currentPriority - The currently active priority
 * @returns {string} "active" or empty string
 */
function getPriorityActiveClass(priority, currentPriority) {
  return currentPriority === priority ? "active" : "";
}

/**
 * Returns the HTML template for all priority buttons in the edit dialog.
 * @param {string} currentPriority - The currently active priority (e.g. "urgent")
 * @returns {string} HTML string of all priority buttons
 */
function getPriorityButtonsTemplate(currentPriority) {
  return ["urgent", "medium", "low"]
    .map((p) => getPriorityButtonTemplate(p, currentPriority))
    .join("");
}