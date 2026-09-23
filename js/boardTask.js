let currentEditPriority = null;

/**
 * Opens the task detail dialog for a given task.
 * @param {string} id - The ID of the task to display
 * @returns {Promise<void>}
 */
async function openDialogBoard(id) {
  await initTasks();
  const element = tasks.find((t) => t.id === id);
  const assignedContacts = await getAssignedContacts(element.assignedTo);
  const dialogBoard = document.getElementById("openDialogBoard");
  dialogBoard.innerHTML = getDialogBoardTemplate(
    element,
    assignedContacts,
    element.subtasks,
  );
  dialogBoard.dataset.mode = "preview";
  dialogBoard.dataset.section = element.status;
  if (!dialogBoard.open) dialogBoard.showModal();
  document.querySelector("body > main").style.overflowY = "hidden";
}

/**
 * Closes the task detail dialog and re-renders the section.
 * @param {string} section - The column name to re-render after closing
 * @returns {Promise<void>}
 */
async function closeDialogBoard(section) {
  const dialogBoard = document.getElementById("openDialogBoard");
  dialogBoard.close();
  document.querySelector("body > main").style.overflowY = "";
  renderSection(section);
}

/**
 * Closes the task preview on Escape. The edit mode of the same dialog stays
 * protected by the global Escape block, so unsaved changes are not lost.
 * @param {KeyboardEvent} event - The keydown event
 * @returns {void}
 */
function handleDialogBoardEscape(event) {
  const dialogBoard = document.getElementById("openDialogBoard");
  if (event.key !== "Escape" || !dialogBoard?.open) return;
  if (dialogBoard.dataset.mode !== "preview") return;
  closeDialogBoard(dialogBoard.dataset.section);
}

/**
 * Deletes a task from the board and Firebase.
 * @param {string} id - The ID of the task to delete
 * @returns {Promise<void>}
 */
async function deleteTask(id) {
  try {
    await deleteData(`/tasks/${id}`);
    showMessage("Task wurde gelöscht");
    document.getElementById("openDialogBoard").close();
    await initTasks();
    renderAll();
  } catch (error) {}
}

/**
 * Returns the subtask progress data for a given task.
 * @param {Object} element - The task object
 * @returns {Array} Array of [solved, total, visibility]
 */
function getSubtaskData(element) {
  const subtasks = normalizeList(element.subtasks);
  const solved = subtasks.filter((s) => s.completed == true).length;
  const total = subtasks.length;
  let visibility = "";
  if (total != 0) visibility = "show";
  return [solved, total, visibility];
}

/**
 * Returns the avatar HTML for all members assigned to a task.
 * @param {Object[]} allMembersOfThisTask - Array of assigned member objects
 * @returns {string} HTML string of avatar elements
 */
function getAssignedToAvatars(allMembersOfThisTask) {
  let members = [];
  if (allMembersOfThisTask == undefined) return "";
  const limit = 3;
  const totalMembers = allMembersOfThisTask.length;
  const displayCount = Math.min(totalMembers, limit);

  for (let i = 0; i < displayCount; i++) {
    const memberID = allMembersOfThisTask[i].id;
    members.push(getMemberAvatar(memberID));
  }

  if (totalMembers > limit) {
    const overflow = totalMembers - limit;
    members.push(
      `<div class="avatar overflow-badge" title="+${overflow} more">+${overflow}</div>`,
    );
  }
  return members.join("");
}

/**
 * Returns the avatar HTML for a single contact by ID.
 * @param {string} id - The contact ID to show the avatar for
 * @returns {string} HTML string of the avatar element
 */
function getMemberAvatar(id) {
  const member = contactsById[id];
  if (!member) return "";

  const name = member.name;
  const htmlTemplate = `<div class="avatar" style="background:${member["avatarColor"]}">${getInitials(name)}</div>`;

  return htmlTemplate;
}

/**
 * Toggles the completed state of a subtask and refreshes the task dialog.
 * @param {number} subtaskIndex - The index of the subtask in the subtasks array
 * @param {boolean} isSubtaskCompleted - The current completed state of the subtask
 * @param {string} taskID - The ID of the parent task
 * @returns {Promise<void>}
 */
async function toggleSubtask(subtaskIndex, isSubtaskCompleted, taskID) {
  if (isSubtaskCompleted) {
    await putData(
      "/tasks/" + taskID + "/subtasks/" + subtaskIndex + "/completed",
      false,
    );
  }
  if (isSubtaskCompleted == false) {
    await putData(
      "/tasks/" + taskID + "/subtasks/" + subtaskIndex + "/completed",
      true,
    );
  }
  await openDialogBoard(taskID);
}

/**
  * Calculates the subtask progress as a percentage.
 * @param {number} solved - The number of completed subtasks
 * @param {number} total - The total number of subtasks
 * @returns {number} The progress percentage (0–100)
 */
function calcSubtaskProgress(solved, total) {
  return (solved / total) * 100;
}

/**
 * Formats a date string from YYYY-MM-DD to DD/MM/YYYY.
 * @param {string} date - The date string in YYYY-MM-DD format
 * @returns {string} The formatted date string in DD/MM/YYYY format
 */
function formatDate(date) {
  if (!date) return "-";
  const [year, month, day] = date.split("-");
  if (!day) return date;
  return `${day}/${month}/${year}`;
}

/**
 * Capitalizes the first letter of a string.
 * @param {string} fletter - The string to capitalize
 * @returns {string} The string with the first letter capitalized
 */
function capitalize(fletter) {
  if (!fletter) return "";
  return fletter.charAt(0).toUpperCase() + fletter.slice(1);
}

/**
 * Returns "checked" if the subtask is completed, otherwise an empty string.
 * @param {boolean} subtaskCompleted - The completed state of the subtask
 * @returns {string} "checked" or empty string
 */
function checkIfSubtaskActive(subtaskCompleted) {
  if (subtaskCompleted == true) {
    return "checked";
  } else {
    return "";
  }
}

/**
 * Returns the subtask HTML for the task card, or a fallback message.
 * @param {Object[]} subtasks - Array of subtask objects
 * @param {string} taskID - The ID of the parent task
 * @returns {string} HTML string of all subtasks or fallback message
 */
function checkIfSubtasksAvaiable(subtasks, taskID) {
  if (subtasks && subtasks.length) {
    return subtasks
      .map((s, index) => getSubtasksTemplate(s, taskID, index))
      .join("");
  } else {
    return "<p>No Subtask avaiable in this Task</p>";
  }
}

/**
 * Opens the edit dialog for a given task.
 * @param {string} taskId - The ID of the task to edit
 * @returns {Promise<void>}
 */
async function openEditTask(taskId) {
  currentEditTaskId = taskId;
  document.getElementById("openDialogBoard").dataset.mode = "edit";
  const element = tasks.find((t) => t.id === taskId);
  const assignedContacts = await getAssignedContacts(element.assignedTo);
  const allContacts = await loadData("/contacts");
  const assignedTo = element.assignedTo
    ? Array.isArray(element.assignedTo)
      ? element.assignedTo
      : Object.values(element.assignedTo)
    : [];
  const assignedIds = assignedTo.map((a) => a.id);
  const priorityButtons = getPriorityButtonsTemplate(element.priority);
  const assignedHTML = buildAssignedContactsEdit(allContacts, assignedIds);
  const subtasksHTML = getSubtasksEditTemplate(element.subtasks, taskId);

  document.getElementById("openDialogBoard").innerHTML =
    getDialogBoardEditTemplate(
      element,
      priorityButtons,
      assignedHTML,
      subtasksHTML,
    );
}

/**
 * Saves the edited task data and closes the dialog.
 * @param {string} taskId - The ID of the task to save
 * @returns {Promise<void>}
 */
async function saveEditTask(taskId) {
  const element = tasks.find((t) => t.id === taskId);
  const updatedData = {
    ...element,
    title: document.getElementById("edit-title").value,
    description: document.getElementById("edit-description").value,
    dueDate: document.getElementById("edit-due-date").value,
    priority: currentEditPriority ?? element.priority,
  };

  await putData("/tasks/" + taskId, updatedData);

  const index = tasks.findIndex((t) => t.id === taskId);
  tasks[index] = updatedData;

  await closeDialogBoard(element.status);
}

/**
 * Sets the active priority for the edit dialog and updates the button styles.
 * @param {MouseEvent} event - The click event from the priority button
 * @param {string} priority - The selected priority (e.g. "urgent", "medium", "low")
 */
function setEditPriority(event, priority) {
  currentEditPriority = priority;
  document
    .querySelectorAll(".prio-btn")
    .forEach((btn) => btn.classList.remove("active"));
  event.currentTarget.classList.add("active");
}

/**
 * Returns the HTML for the subtask list in the edit dialog.
 * @param {Object[]} subtasks - Array of subtask objects
 * @param {string} taskId - The ID of the parent task
 * @returns {string} HTML string of all subtask edit items
 */
function getSubtasksEditTemplate(subtasks, taskId) {
  if (!subtasks) return "";
  return subtasks
    .map((s, i) => getSubtaskEditItemTemplate(s, taskId, i))
    .join("");
}

/**
 * Toggles the visibility of the subtask confirm buttons based on the input value.
 */
function onSubtaskInputEdit() {
  const input = document.getElementById("new-subtask-input");
  const btns = document.getElementById("subtask-confirm-btns-edit");
  btns.classList.toggle("visible", input.value.trim().length > 0);
}

/**
 * Clears the subtask input field and updates the button visibility.
 */
function clearSubtaskInputEdit() {
  document.getElementById("new-subtask-input").value = "";
  onSubtaskInputEdit();
}

/**
 * Adds a new subtask to the task and refreshes the edit dialog.
 * @param {string} taskId - The ID of the parent task
 * @returns {Promise<void>}
 */
async function addSubtaskEdit(taskId) {
  const input = document.getElementById("new-subtask-input");
  const title = input.value.trim();
  if (!title) return;
  const element = tasks.find((t) => t.id === taskId);
  const subtasks = element.subtasks ? [...element.subtasks] : [];
  subtasks.push({ title, completed: false });
  await putData("/tasks/" + taskId + "/subtasks", subtasks);
  await initTasks();
  await openEditTask(taskId);
}

/**
 * Deletes a subtask from the task and refreshes the edit dialog.
 * @param {string} taskId - The ID of the parent task
 * @param {number} subtaskIndex - The index of the subtask to delete
 * @returns {Promise<void>}
 */
async function deleteSubtaskEdit(taskId, subtaskIndex) {
  const element = tasks.find((t) => t.id === taskId);
  const subtasks = [...element.subtasks];
  subtasks.splice(subtaskIndex, 1);
  await putData("/tasks/" + taskId + "/subtasks", subtasks);
  await initTasks();
  await openEditTask(taskId);
}

/**
 * Toggles the open state of the assigned contacts dropdown in the edit dialog.
 */
function toggleEditDropdown() {
  const dropdown = document.getElementById("edit-assigned-dropdown");
  const trigger = dropdown.previousElementSibling;
  dropdown.classList.toggle("open");
  trigger.classList.toggle("open");
}

/**
 * Retrieves the checkbox from a contact option and toggles it if the click was outside the checkbox.
 * @param {MouseEvent} event - The click event from the contact option
 * @returns {HTMLInputElement} The checkbox element
 */
function getCheckboxState(event) {
  const checkbox = event.currentTarget.querySelector("input[type='checkbox']");
  if (event.target !== checkbox) checkbox.checked = !checkbox.checked;
  return checkbox;
}

/**
 * Returns a normalized array of assigned contacts from a task element.
 * Handles both array and object formats from Firebase.
 * @param {Object} element - The task object containing assignedTo data
 * @returns {Array<{id: string}>} Normalized array of assigned contact references
 */
function getNormalizedAssignedTo(element) {
  if (!element.assignedTo) return [];
  return Array.isArray(element.assignedTo)
    ? [...element.assignedTo]
    : Object.values(element.assignedTo);
}

/**
 * Adds or removes a contact from the assigned list and updates the UI selection state.
 * @param {HTMLInputElement} checkbox - The checkbox element indicating assignment state
 * @param {Array<{id: string}>} assignedTo - Current list of assigned contacts
 * @param {string} contactId - The ID of the contact to add or remove
 * @param {HTMLElement} currentTarget - The contact option element to toggle selected class
 * @returns {Array<{id: string}>} Updated list of assigned contacts
 */
function updateAssignedList(checkbox, assignedTo, contactId, currentTarget) {
  if (checkbox.checked) {
    assignedTo.push({ id: contactId });
    currentTarget.classList.add("selected");
  } else {
    assignedTo = assignedTo.filter((a) => a.id !== contactId);
    currentTarget.classList.remove("selected");
  }
  return assignedTo;
}

/**
 * Saves the updated assigned contacts to Firebase, reinitializes tasks and refreshes the badge UI.
 * @async
 * @param {string} taskId - The ID of the task to update
 * @param {Array<{id: string}>} assignedTo - Updated list of assigned contacts
 * @returns {Promise<void>}
 */
async function saveAndRefreshAssigned(taskId, assignedTo) {
  await putData("/tasks/" + taskId + "/assignedTo", assignedTo);
  await initTasks();
  const allContacts = await loadData("/contacts");
  const assignedIds = assignedTo.map((a) => a.id);
  document.getElementById("edit-assigned-badges").innerHTML =
    buildContactBadges(allContacts, assignedIds);
}

/**
 * Toggles a contact's assignment on a task and updates the UI.
 * @param {MouseEvent} event - The click event from the contact option
 * @param {string} contactId - The ID of the contact to toggle
 * @returns {Promise<void>}
 */
async function toggleAssignedContact(event, contactId) {
  const checkbox = getCheckboxState(event);
  const element = tasks.find((t) => t.id === currentEditTaskId);
  let assignedTo = getNormalizedAssignedTo(element);
  assignedTo = updateAssignedList(checkbox, assignedTo, contactId, event.currentTarget);
  await saveAndRefreshAssigned(currentEditTaskId, assignedTo);
}