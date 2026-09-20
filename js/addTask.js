let addTaskDialog;
let contacts = [];

/**
 * Initializes the add task page by running setup and loading contacts.
 * @param {string} site - The current site/page identifier
 * @returns {Promise<void>}
 */
async function initAddTask(site) {
    init(site);
    await renderContacts()
}

/**
 * Opens the add task dialog and renders the contact list.
 * @param {string} status - The initial status for the new task
 */
function openAddTaskDialog(status) {
    let main = document.querySelector('main');
    let dialogSection = document.createElement("dialog");
    dialogSection.id = "add-task-dialog";
    main.appendChild(dialogSection);
    dialogSection.innerHTML = getAddTaskDialogTemplate(status);
    dialogSection.showModal();
    addTaskDialog = dialogSection;
    renderContacts();
}

/**
 * Closes and removes the add task dialog.
 */

function closeAddTaskDialog() {
    addTaskDialog.close();
    addTaskDialog.remove();
}

/**
 * Clears and resets the add task form in add task dialog.
 * @param {string} status - The initial status for the new task
 */
function clearDialogAddTaskForm(status) {
    const dialogSection = document.querySelector('#add-task-dialog');
    dialogSection.innerHTML = '';
    dialogSection.innerHTML = getAddTaskDialogTemplate(status);
    renderContacts();
}

/**
 * Resets the add task form in addtask.html including all custom dropdowns, priority buttons, and subtasks.
 */
function clearAddTaskForm() {
    document.getElementById('add-task-form').reset();
    document.querySelectorAll('#assigned-dropdown .custom-option.selected').forEach(opt => {
        opt.classList.remove('selected');
        opt.querySelector('input[type="checkbox"]').checked = false;
    });
    document.getElementById('assigned-badges').innerHTML = '';
    document.querySelectorAll('#category-dropdown .custom-option.selected').forEach(opt => opt.classList.remove('selected'));
    document.querySelector('#category-wrapper input[name="category"]').value = '';
    document.getElementById('category-placeholder').textContent = 'Select task category';
    document.getElementById('category-placeholder').style.color = '';
    document.querySelectorAll('#task-priority-btns .priority-btn').forEach(btn => btn.classList.remove('set'));
    document.querySelector('#task-priority-btns .priority-btn.medium').classList.add('set');
    document.getElementById('subtask-list').innerHTML = '';

    document.querySelectorAll('#add-task-form .input-error').forEach(input => clearFieldError(input));
    document.querySelectorAll('#add-task-form .field-error-msg').forEach(el => el.style.visibility = 'hidden');
}

/**
 * Sets the active priority button and removes the active state from the others.
 * @param {HTMLElement} clickedButton - The priority button that was clicked
 */
function setPriority(clickedButton) {
    const buttons = document.querySelectorAll('#task-priority-btns .priority-btn');
    buttons.forEach(btn => {
        btn.classList.remove('set');
    });
    clickedButton.classList.add('set');
}

/**
 * Loads all contacts from the database and stores them globally.
 * @returns {Promise<void>}
 */
async function loadContacts() {
    try {
        const data = await loadData("/contacts");
        contacts = Object.entries(data).map(([id, contact]) => ({
            id,
            name: contact.name,
            color: contact.avatarColor
        }));        
    } catch (error) {
        contacts = [];
    }
}

/**
 * Loads and renders all contacts into the assignment dropdown.
 * @returns {Promise<void>}
 */
async function renderContacts() {
    await loadContacts();    
    const container = document.getElementById('custom-select-dropdown-inner');

    container.innerHTML = contacts.map(contact => `
        <div class="custom-option" 
             onclick="toggleContact(this)" 
             data-id="${contact.id}">
            <div class="contact-avatar" style="background:${contact.color}">
                ${getInitials(contact.name)}
            </div>
            <span>${contact.name}</span>
            <input type="checkbox">
        </div>
    `).join('');
}

/**
 * Toggles the open state of a dropdown and closes all other open dropdowns.
 * @param {string} id - The ID of the dropdown to toggle
 */
function toggleDropdown(id) {
    const wrapper = document.getElementById(`${id}-wrapper`);
    const trigger = wrapper.querySelector('.custom-select-trigger');
    const dropdown = document.getElementById(`${id}-dropdown`);
    const isOpen = dropdown.classList.contains('open');

    document.querySelectorAll('.custom-select-dropdown.open').forEach(d => d.classList.remove('open'));
    document.querySelectorAll('.custom-select-trigger.open').forEach(t => t.classList.remove('open'));

    if (!isOpen) {
        dropdown.classList.add('open');
        trigger.classList.add('open');
    } else if (id === 'category') {
        const hiddenInput = wrapper.querySelector('input[name="category"]');
        if (hiddenInput) validateOnBlur(hiddenInput, 'Please select a category');
    }
}

/**
 * Selects a category option and updates the dropdown display.
 * @param {HTMLElement} option - The selected category option element
 */
function selectCategory(option) {
    document.querySelectorAll('#category-dropdown .custom-option')
        .forEach(o => o.classList.remove('selected'));
    option.classList.add('selected');

    const placeholder = document.getElementById('category-placeholder');
    placeholder.textContent = option.querySelector('span').textContent;
    placeholder.style.color = '#2a3647';

    const hiddenInput = document.querySelector('#category-wrapper input[name="category"]');
    hiddenInput.value = option.dataset.value;
    clearFieldError(hiddenInput);

    toggleDropdown('category');
}

/**
 * Toggles the selection state of a contact option in the dropdown.
 * @param {HTMLElement} option - The selected contact option element
 */
function toggleContact(option) {
    const checkbox = option.querySelector('input[type="checkbox"]');
    const isSelected = option.classList.toggle('selected');
    checkbox.checked = isSelected;
    updateAssignedBadges();
}

/**
 * Updates the assigned contact badges based on the selected contacts.
 */
function updateAssignedBadges() {
    const badges = document.getElementById('assigned-badges');
    badges.innerHTML = '';
    const limit = 5;
    const selected = document.querySelectorAll('#assigned-dropdown .custom-option.selected');
    const total = selected.length;

    selected.forEach((opt, i) => {
        if (i >= limit) return;
        const avatar = opt.querySelector('.contact-avatar');
        const badge = document.createElement('div');
        badge.className = 'badge-avatar';
        badge.style.background = avatar.style.background;
        badge.textContent = avatar.textContent.trim();
        badges.appendChild(badge);
    });

    if (total > limit) {
        const overflow = document.createElement('div');
        overflow.className = 'badge-avatar overflow-badge';
        overflow.textContent = `+${total - limit}`;
        badges.appendChild(overflow);
    }
}

/**
 * Renders the avatar icons for all selected contacts.
 */
function renderSelectedAvatars() {
    const container = document.getElementById('selected-avatars');
    if (!container) return;
    container.innerHTML = selectedContacts.map(c => `
        <div class="contact-avatar" style="background:${c.color}" title="${c.name}">
            ${getInitials(c.name)}
        </div>
    `).join('');
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select-wrapper')) {
        document.querySelectorAll('.custom-select-dropdown.open').forEach(d => {
            d.classList.remove('open');

            const wrapper = d.closest('.custom-select-wrapper');
            const hiddenInput = wrapper?.querySelector('input[name="category"]');
            if (hiddenInput) validateOnBlur(hiddenInput, 'Please select a category');
        });
        document.querySelectorAll('.custom-select-trigger.open').forEach(t => t.classList.remove('open'));
    }
});

/**
 * Generates a task object from the current form values.
 * @param {string} taskID - The ID for the new task
 * @param {string} statusArg - The initial status of the task (default: "todo")
 * @returns {Object} The generated task object
 */
function generateTaskJson(taskID, statusArg='triage') {
    return {
        id: taskID,
        title: getTaskTitle(),
        description: getTaskDescription(),
        dueDate: getTaskDueDate(),
        priority: getTaskPriority(),
        category: getTaskCategory(),
        categoryLabelColor: getTaskCategoryLabelColor(getTaskCategory()),
        assignedTo: getAssignedTo(),
        subtasks: getSubtasks(),
        status: statusArg,
        creator: getTaskCreator(),
        aiGenerated: false
    };
}

/**
 * Returns the creator info for a task created through the board UI.
 * External tasks get their creator written by the n8n agent instead.
 * @returns {Object} The creator object with type, name and contactId
 */
function getTaskCreator() {
    const user = window.currentUser;
    return {
        type: "member",
        name: user?.name ?? "Guest",
        email: user?.email ?? "",
        contactId: user?.id ?? ""
    };
}

/**
 * Returns the title value from the task form input.
 * @returns {string} The trimmed title input value
 */
function getTaskTitle() {
    return document.querySelector('input[name="title"]').value.trim();
}

/**
 * Returns the description value from the task form textarea.
 * @returns {string} The trimmed description input value
 */
function getTaskDescription() {
    return document.querySelector('textarea[name="description"]').value.trim();
}

/**
 * Returns the due date value from the task form input.
 * @returns {string} The trimmed due date input value
 */
function getTaskDueDate() {
    return document.querySelector('input[name="due-date"]').value.trim();
}

/**
 * Returns the selected priority from the priority buttons.
 * @returns {string} The active priority ("urgent", "medium" or "low")
 */
function getTaskPriority() {
    const priorityBtn = document.querySelector('.priority-btn.set');
    const priority = ['urgent', 'medium', 'low'].find(p => priorityBtn.classList.contains(p));
    return priority;
}

/**
 * Returns the selected and formatted category from the task form.
 * @returns {string} The formatted category label
 */
function getTaskCategory() {
    const category = document.querySelector('input[name="category"]').value.trim();
    return formatLabel(category);
}

/**
 * Returns the label color for a given task category.
 * @param {string} category - The category name (e.g. "User Story")
 * @returns {string} The hex color code for the category
 */
function getTaskCategoryLabelColor(category) {
    switch (category) {
        case "User Story":
            return "#0038FF";
        case "Technical Task":
            return "#1FD7C1";
        default:
            return "#2A3647";
    }
}

/**
 * Returns all selected contacts as an array of ID objects.
 * @returns {Object[]} Array of objects containing the contact ID
 */
function getAssignedTo() {
    return [...document.querySelectorAll('#assigned-dropdown .custom-option.selected')]
        .map(opt => ({
            id:    opt.dataset.id
        }));
}

/**
 * Returns all subtasks from the subtask list as an array of objects.
 * @returns {Object[]} Array of subtask objects with id, title and completed state
 */
function getSubtasks() {
    return [...document.querySelectorAll('#subtask-list li')]
        .map(li => ({
            id:        "subtask-"+generateUUID(),
            title:     li.querySelector('.subtask-text').textContent,
            completed: false
        }));
}

/**
 * Creates a new task in Firebase and redirects to the board.
 * @param {string} status - The initial status of the new task
 * @returns {Promise<void>}
 */
async function createTask(status) {
    const form = document.getElementById('add-task-form');
    if (!validateForm(form)) return;

    const taskID = generateUUID();
    let task = generateTaskJson(taskID, status);
    await putData("/tasks/task-"+taskID, task);
    location.href = "./board.html";
}

/**
 * Formats a kebab-case string into a capitalized label.
 * @param {string} str - The kebab-case string to format (e.g. "user-story")
 * @returns {string} The formatted label (e.g. "User Story")
 */
function formatLabel(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}