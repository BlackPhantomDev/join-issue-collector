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
 * Minimum viewport width in pixels at which task cards can be dragged.
 * Below it the move menu on each card stays the only way to move a task,
 * because pointer based dragging is unreliable on touch devices.
 */
const DRAG_MIN_WIDTH = 1024;

/**
 * Maximum viewport width in pixels at which the board uses its stacked
 * layout, where the columns sit below each other and their cards scroll
 * sideways instead of downwards.
 */
const STACKED_LAYOUT_MAX_WIDTH = 1200;

/**
 * Distance in pixels from a scrollable edge at which auto scrolling starts
 * while a card is being dragged.
 */
const AUTO_SCROLL_EDGE = 90;

/**
 * Pixels scrolled per animation frame while auto scrolling.
 */
const AUTO_SCROLL_STEP = 16;

let autoScrollFrame = null;
let dragPointer = { x: 0, y: 0 };

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
  initDragAndDrop();
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
 * Moves a task to a new column from the move menu on a card.
 * @param {Event} event - The click event of the menu entry
 * @param {string} taskId - The ID of the task to move
 * @param {string} newStatus - The column the task moves to
 * @returns {Promise<void>}
 */
async function moveTaskTo(event, taskId, newStatus) {
  event.stopPropagation();
  await applyTaskMove(taskId, newStatus);
}

/**
 * Persists a status change, queues the notification for the task creator and
 * re-renders the affected columns. Shared by the move menu and drag and drop,
 * so both ways of moving a task behave identically.
 * @param {string} taskId - The ID of the task to move
 * @param {string} newStatus - The column the task moves to
 * @returns {Promise<void>}
 */
async function applyTaskMove(taskId, newStatus) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task || !COLUMNS.includes(newStatus)) return;
  const oldStatus = task.status;
  if (oldStatus === newStatus) return;

  task.status = newStatus;
  let saved = false;
  try {
    await putData("/tasks/" + task.id, task);
    saved = true;
  } catch {
    task.status = oldStatus;
  }
  if (saved) await queueStatusNotification(task, oldStatus, newStatus);
  await reRenderColumns(oldStatus, newStatus);
}

/**
 * Queues an email notification for the creator of a moved task.
 * n8n polls this queue, sends the mail and removes the entry — the board
 * itself never talks to n8n, which keeps the workflow server unreachable
 * from the outside. Errors are swallowed on purpose: a notification that
 * cannot be queued must never block moving a task.
 * @param {Object} task - The moved task
 * @param {string} from - The column the task was in
 * @param {string} to - The column the task was moved to
 * @returns {Promise<void>}
 */
async function queueStatusNotification(task, from, to) {
  const creator = task.creator;
  if (!creator?.email) return;
  try {
    await postData("/notifications", {
      taskId: task.id,
      title: task.title,
      from,
      to,
      recipient: { name: creator.name, email: creator.email },
      at: new Date().toISOString(),
    });
  } catch (error) {
    return;
  }
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
   VIEWPORT
   ========================================================= */

/**
 * Reports whether task cards can be dragged at the current viewport width.
 * @returns {boolean} True when the viewport is wide enough for drag and drop
 */
function isDragEnabled() {
  return window.innerWidth >= DRAG_MIN_WIDTH;
}

/**
 * Reports whether the board currently renders in its stacked layout.
 * @returns {boolean} True when columns sit below each other
 */
function isStackedLayout() {
  return window.innerWidth <= STACKED_LAYOUT_MAX_WIDTH;
}

/* =========================================================
   DRAG AND DROP
   ========================================================= */

/**
 * Registers the drag and drop listeners for the board.
 * The listeners sit on the board container instead of on the cards, because
 * every move re-renders the columns and would otherwise drop the listeners.
 * @returns {void}
 */
function initDragAndDrop() {
  const board = document.querySelector(".progress-board");
  if (!board) return;
  board.addEventListener("dragstart", handleDragStart);
  board.addEventListener("dragover", handleDragOver);
  board.addEventListener("dragleave", handleDragLeave);
  board.addEventListener("drop", handleDrop);
  board.addEventListener("dragend", handleDragEnd);
}

/**
 * Starts dragging a task card and hands its ID to the drop target.
 * Cancels the drag below the desktop width, where the move menu takes over.
 * @param {DragEvent} event - The dragstart event
 * @returns {void}
 */
function handleDragStart(event) {
  const card = event.target.closest(".task-card");
  if (!card || !isDragEnabled()) {
    event.preventDefault();
    return;
  }
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", card.dataset.taskId);
  card.classList.add("dragging");
}

/**
 * Marks the column below the pointer as drop target and keeps the board
 * scrolling while the pointer rests near an edge.
 * @param {DragEvent} event - The dragover event
 * @returns {void}
 */
function handleDragOver(event) {
  if (!isDragEnabled()) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  dragPointer = { x: event.clientX, y: event.clientY };
  startAutoScroll();
  highlightDropTarget(event.target.closest(".board-task-body"));
}

/**
 * Clears the drop highlight once the pointer leaves the board.
 * @param {DragEvent} event - The dragleave event
 * @returns {void}
 */
function handleDragLeave(event) {
  if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget)) {
    return;
  }
  highlightDropTarget(null);
}

/**
 * Moves the dragged task into the column it was dropped on.
 * @param {DragEvent} event - The drop event
 * @returns {Promise<void>}
 */
async function handleDrop(event) {
  if (!isDragEnabled()) return;
  event.preventDefault();
  const column = event.target.closest(".board-task-body");
  const taskId = event.dataTransfer.getData("text/plain");
  handleDragEnd();
  if (!column || !taskId) return;
  await applyTaskMove(taskId, column.dataset.column);
}

/**
 * Removes every trace of the drag once the interaction ends, including a
 * drag the user aborted with Escape or by dropping outside the board.
 * @returns {void}
 */
function handleDragEnd() {
  stopAutoScroll();
  highlightDropTarget(null);
  document
    .querySelectorAll(".task-card.dragging")
    .forEach((card) => card.classList.remove("dragging"));
}

/**
 * Highlights a single column as the active drop target.
 * @param {HTMLElement|null} target - The column body below the pointer
 * @returns {void}
 */
function highlightDropTarget(target) {
  document.querySelectorAll(".board-task-body.drag-over").forEach((column) => {
    if (column !== target) column.classList.remove("drag-over");
  });
  if (target) target.classList.add("drag-over");
}

/* =========================================================
   AUTO SCROLL WHILE DRAGGING
   ========================================================= */

/**
 * Starts the auto scroll loop unless it is already running.
 * @returns {void}
 */
function startAutoScroll() {
  if (autoScrollFrame !== null) return;
  autoScrollFrame = requestAnimationFrame(runAutoScroll);
}

/**
 * Stops the auto scroll loop.
 * @returns {void}
 */
function stopAutoScroll() {
  if (autoScrollFrame === null) return;
  cancelAnimationFrame(autoScrollFrame);
  autoScrollFrame = null;
}

/**
 * Scrolls board and hovered column once per animation frame for as long as a
 * card is being dragged. Without this, columns outside the visible area could
 * not be reached: on wide screens the board scrolls sideways, in the stacked
 * layout the columns sit below each other.
 * @returns {void}
 */
function runAutoScroll() {
  scrollBoardSideways();
  scrollBoardVertically();
  scrollColumnUnderPointer();
  autoScrollFrame = requestAnimationFrame(runAutoScroll);
}

/**
 * Scrolls the board horizontally while the pointer sits near its left or
 * right edge.
 * @returns {void}
 */
function scrollBoardSideways() {
  const board = document.querySelector(".progress-board");
  if (!board) return;
  const bounds = board.getBoundingClientRect();
  scrollNearEdge(board, "scrollLeft", dragPointer.x, bounds.left, bounds.right);
}

/**
 * Scrolls the board area vertically while the pointer sits near its top or
 * bottom edge. This carries the stacked layout, where a column further down
 * can only be reached by scrolling the main area.
 * @returns {void}
 */
function scrollBoardVertically() {
  const main = document.getElementById("board-main");
  if (!main) return;
  const bounds = main.getBoundingClientRect();
  scrollNearEdge(main, "scrollTop", dragPointer.y, bounds.top, bounds.bottom);
}

/**
 * Scrolls the column below the pointer so cards outside its visible area
 * become reachable as drop position.
 * @returns {void}
 */
function scrollColumnUnderPointer() {
  const element = document.elementFromPoint(dragPointer.x, dragPointer.y);
  const column = element?.closest(".task-cards");
  if (!column) return;
  const bounds = column.getBoundingClientRect();
  const axis = isStackedLayout() ? "scrollLeft" : "scrollTop";
  const position = isStackedLayout() ? dragPointer.x : dragPointer.y;
  const start = isStackedLayout() ? bounds.left : bounds.top;
  const end = isStackedLayout() ? bounds.right : bounds.bottom;
  scrollNearEdge(column, axis, position, start, end);
}

/**
 * Scrolls a container along one axis while the pointer sits near its edges.
 * @param {HTMLElement} container - The scrollable container
 * @param {string} axis - Either "scrollLeft" or "scrollTop"
 * @param {number} position - The pointer position on that axis
 * @param {number} start - The container edge with the lower coordinate
 * @param {number} end - The container edge with the higher coordinate
 * @returns {void}
 */
function scrollNearEdge(container, axis, position, start, end) {
  if (position < start + AUTO_SCROLL_EDGE) {
    container[axis] -= AUTO_SCROLL_STEP;
  } else if (position > end - AUTO_SCROLL_EDGE) {
    container[axis] += AUTO_SCROLL_STEP;
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
  const isMobile = isStackedLayout();
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

    const isMobile = isStackedLayout();

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