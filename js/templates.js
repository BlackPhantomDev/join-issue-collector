/**
 * Returns the HTML template for the login form.
 * @returns {string} HTML string of the login form
 */
function getLoginTemplate() {
  return `
        <div class="form-header">
            <h1>Log in</h1>
            <div class="spacer"></div>
        </div>

        <form id="login-signup-form" onsubmit="handleLogin(event); return false;" novalidate>
            <div class="input-fields">
                <div class="field-wrapper">
                    <div class="email-input">
                        <input class="form-input" type="email" placeholder="E-Mail" name="email" autocomplete="additional-name" onblur="validateField(this, 'email-error')"/>
                        <span><img class="input-icon" src="./assets/icons/mail.svg" alt="Email icon"></span>
                    </div>
                    <span class="field-error" id="email-error"></span>
                </div>
                <div class="field-wrapper">
                    <div class="pwd-input">
                        <input class="form-input" type="password" placeholder="Password" name="password" onblur="validateField(this, 'password-error')" oninput="togglePwdVisibilityBtn(this)"/>
                        <span class="pwd-lock-icon"><img class="input-icon" src="./assets/icons/lock.svg" alt="Lock icon"></span>
                        <button type="button" class="pwd-toggle-btn" onclick="togglePwdVisibility(this)" tabindex="-1">
                            <img class="input-icon eye-off" src="./assets/icons/visibility-off.svg" alt="Hide password">
                            <img class="input-icon eye-on" src="./assets/icons/visibility-on.svg" alt="Show password">
                        </button>
                    </div>
                    <span class="field-error" id="password-error"></span>
                </div>
            </div>
            <div class="login-btns">
                <button id="login-btn" class="primary-btn btn" type="submit">Log in</button>
                <button id="guest-login-btn" class="regular-btn btn" type="button" onclick="guestLogin()">Guest Log in</button>
            </div>
        </form>
    `;
}

/**
 * Returns the HTML template for the signup form.
 * @returns {string} HTML string of the signup form
 */
function getSignupTemplate() {
  return `
    
        <div class="form-header">
            <span onclick="switchToLogin()" class="back"><img src="./assets/icons/arrow-back.svg" /></span>
            <h1>Sign Up</h1>
            <div class="spacer"></div>
        </div>

        <form id="login-signup-form" onsubmit="handleSignup(event); return false;" novalidate>
            <div class="input-fields">
                <div class="field-wrapper">
                    <div class="name-input">
                        <input class="form-input" type="text" placeholder="Full Name" name="fullname" autocomplete="name" onblur="validateField(this, 'fullname-error')"/>
                        <span><img class="input-icon" src="./assets/icons/person.svg" alt="User icon"></span>
                    </div>
                    <span class="field-error" id="fullname-error"></span>
                </div>

                <div class="field-wrapper">
                    <div class="email-input">
                        <input class="form-input" type="email" placeholder="E-Mail" name="email" autocomplete="email" onblur="validateField(this, 'email-error')"/>
                        <span><img class="input-icon" src="./assets/icons/mail.svg" alt="Email icon"></span>
                    </div>
                    <span class="field-error" id="email-error"></span>
                </div>

                <div class="field-wrapper">
                    <div class="pwd-input">
                        <input class="form-input" type="password" placeholder="Password" name="password" onblur="validateField(this, 'password-error')" oninput="togglePwdVisibilityBtn(this)"/>
                        <span class="pwd-lock-icon"><img class="input-icon" src="./assets/icons/lock.svg" alt="Lock icon"></span>
                        <button type="button" class="pwd-toggle-btn" onclick="togglePwdVisibility(this)" tabindex="-1">
                            <img class="input-icon eye-off" src="./assets/icons/visibility-off.svg" alt="Hide password">
                            <img class="input-icon eye-on" src="./assets/icons/visibility-on.svg" alt="Show password">
                        </button>
                    </div>
                    <span class="field-error" id="password-error"></span>
                </div>

                <div class="field-wrapper">
                    <div class="pwd-input">
                        <input class="form-input" type="password" placeholder="Confirm Password" name="password_confirm" onblur="validatePasswordConfirm(this)" oninput="togglePwdVisibilityBtn(this)"/>
                        <span class="pwd-lock-icon"><img class="input-icon" src="./assets/icons/lock.svg" alt="Lock icon"></span>
                        <button type="button" class="pwd-toggle-btn" onclick="togglePwdVisibility(this)" tabindex="-1">
                            <img class="input-icon eye-off" src="./assets/icons/visibility-off.svg" alt="Hide password">
                            <img class="input-icon eye-on" src="./assets/icons/visibility-on.svg" alt="Show password">
                        </button>
                    </div>
                    <span class="field-error" id="password-confirm-error"></span>
                </div>
                <div class="field-wrapper">
                    <div class="accept-input">
                        <input type="checkbox" id="accept-btn"/><p>I accept the <a class="highlighted" href="./legal.html">Privacy policy</a></p>
                    </div>
                    <span class="field-error" id="accept-error"></span>
                </div>
            </div>

            <div class="login-btns">
                <button id="signup-btn" class="primary-btn btn" type="submit">Sign Up</button>
            </div>
        </form>
    `;
}

/**
 * Returns the HTML template for the sidebar navigation.
 * @param {string} summary - Active class for summary link
 * @param {string} addtask - Active class for add task link
 * @param {string} board - Active class for board link
 * @param {string} contact - Active class for contacts link
 * @param {string} privacy - Active class for privacy link
 * @param {string} legal - Active class for legal link
 * @returns {string} HTML string of the sidebar
 */
function getSidebarTemplate(summary, addtask, board, contact, privacy, legal) {
  return `
        <img src="./assets/img/logo-light.svg" class="logo sidebar_logo" />
        <nav>
            <a class="nav-link ${summary}" id="summary-link" href="./summary.html">
                <img src="./assets/icons/summary_icon.svg" class="nav-link-icon ${summary}" />
                Summary
            </a>

            <a class="nav-link ${addtask}" id="addtask-link" href="./addtask.html">
                <img src="./assets/icons/addtask_icon.svg" class="nav-link-icon ${addtask}" />
                Add Task
            </a>

            <a class="nav-link ${board}" id="board-link" href="./board.html">
                <img src="./assets/icons/board_icon.svg" class="nav-link-icon ${board}" />
                Board
            </a>

            <a class="nav-link ${contact}" href="./contacts.html">
                <img src="./assets/icons/contacts_icon.svg" class="nav-link-icon ${contact}" />
                Contacts
            </a>
        </nav>

        <div class="privacy">
            <a class="nav-link ${privacy}" href="privacy.html">Privacy Policy</a>
            <a class="nav-link ${legal}" href="legal.html">Legal notice</a>
        </div>

    `;
}

/**
 * Returns the HTML template for the sidebar in guest (unauthenticated) mode.
 * Shows only the logo, a login link, and privacy/legal links.
 * @param {string} privacy - Active class for privacy link
 * @param {string} legal - Active class for legal link
 * @returns {string} HTML string of the guest sidebar
 */
function getSidebarGuestTemplate(privacy, legal) {
  return `
        <img src="./assets/img/logo-light.svg" class="logo sidebar_logo" />
        <nav>
            <a class="nav-link" href="./index.html">
                <img src="./assets/icons/login.svg" class="nav-link-icon" />
                Log In
            </a>
        </nav>
        <div class="privacy">
            <a class="nav-link ${privacy}" href="privacy.html">Privacy Policy</a>
            <a class="nav-link ${legal}" href="legal.html">Legal notice</a>
        </div>
    `;
}

/**
 * Returns the HTML template for the topbar.
 * @returns {string} HTML string of the topbar
 */
function getTopbarTemplate() {
  return `
  <div id="topbar-content">
    <p id="slogan">Kanban Project Management Tool</p>
    <img src="/assets/img/logo-dark.svg" class="topbar_logo">

    <div class="right-topbar-side">
          <button id="help">
              <a href="help.html"><img src="./assets/icons/help.svg" /></a>
          </button>
          <div id="user-menue" onclick="toggleUserMenue(event)">
          </div>
          <div id="user-menue-dropdown">
            <a href="./legal.html">Legal Notice</a>
            <a href="./privacy.html">Privacy Policy</a>
            <a href="#" onclick="logout()">Log Out</a>
          </div>
    </div>
  </div>
  `;
}

/**
 * Returns the HTML template for the add task dialog.
 * @param {string} status - The initial status for the new task
 * @returns {string} HTML string of the add task dialog
 */
function getAddTaskDialogTemplate(status) {
  return `
    <section class="add-task" id="add-task-dialog-content">
      <header id="add-task-dialog-header">
        <h1>Add Task</h2>
        <button onclick="closeAddTaskDialog()" id="close-dialog-btn" tabindex="1"><img src="../assets/icons/close.svg"></button>
      </header>
      <form class="add-task-form" onsubmit="createTask('${status}'); return false;" id="add-task-form" novalidate>
          <div id="left-side-form">
              <div id="task-title">
                  <label for="title">Title<span class="required">*</span></label>
                  <input type="text" name="title" placeholder="Enter a title" required onblur="validateOnBlur(this, 'Please enter a title')" />
                  <span class="field-error-msg"></span>
              </div>
              <div id="task-description">
                  <label for="description">Description</label>
                  <textarea name="description" id="description" cols="30" rows="5"></textarea>
              </div>
              <div id="task-due-date">
                  <label for="due-date">Due Date<span class="required">*</span></label>
                  <input type="date" id="due-date" name="due-date" required onchange="validateDate(this)" />
                  <span class="field-error-msg"></span>
              </div>
          </div>
          <div id="right-side-task">
              <div id="task-priority">
                  <label for="priority">Priority</label>
                  <div id="task-priority-btns">
                      <button class="priority-btn urgent" onclick="setPriority(this)" type="button">Urgent <span><img src="./assets/icons/priority-urgent.svg" alt="Urgent priority icon"></span></button>
                      <button class="priority-btn medium set" onclick="setPriority(this)" type="button">Medium<span><img src="./assets/icons/priority-medium.svg" alt="Medium priority icon"></span></button>
                      <button class="priority-btn low" onclick="setPriority(this)" type="button">Low<span><img src="./assets/icons/priority-low.svg" alt="Low priority icon"></span></button>
                  </div>
              </div>
              <div id="task-assigned-to">
                  <label>Assigned to</label>
                  <div class="custom-select-wrapper" id="assigned-wrapper">
                      <div class="custom-select-trigger" onclick="toggleDropdown('assigned')">
                          <span id="assigned-placeholder">Select contacts to assign</span>
                          <img src="./assets/icons/arrow_drop_down.svg" class="select-arrow">
                      </div>
                      <div class="custom-select-dropdown" id="assigned-dropdown">
                          <div id="custom-select-dropdown-inner">
                          </div>
                      </div>
                  </div>
                  <div id="assigned-badges"></div>
              </div>
              <div id="task-category">
                  <label>Category<span class="required">*</span></label>
                  <div class="custom-select-wrapper" id="category-wrapper">
                      <input type="hidden" name="category" required data-error-msg="Please select a category" />
                      <span class="field-error-msg"></span>
                      <div class="custom-select-trigger" onclick="toggleDropdown('category')">
                          <span id="category-placeholder">Select task category</span>
                          <img src="./assets/icons/arrow_drop_down.svg" class="select-arrow">
                      </div>
                      <div class="custom-select-dropdown" id="category-dropdown">
                          <div class="custom-select-dropdown-inner">
                              <div class="custom-option" onclick="selectCategory(this)" data-value="technical-task">
                                  <span>Technical Task</span>
                              </div>
                              <div class="custom-option" onclick="selectCategory(this)" data-value="user-story">
                                  <span>User Story</span>
                              </div>
                              <div class="custom-option" onclick="selectCategory(this)" data-value="bug-report">
                                  <span>Bug Report</span>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
              <div id="task-subtasks">
                  <label>Subtasks</label>
                  <div class="subtask-input-wrapper" id="subtask-wrapper">
                      <input 
                          type="text" 
                          id="subtask-input"
                          placeholder="Add new Subtask"
                          oninput="onSubtaskInput()"
                          onkeydown="handleSubtaskKey(event)"
                      />
                      <div class="subtask-actions" id="subtask-actions">
                          <div class="subtask-confirm-btns" id="subtask-confirm-btns">
                              <button class="subtask-icon-btn" onclick="clearSubtaskInput()" type="button">
                                  <img src="./assets/icons/close.svg" alt="Cancel">
                              </button>
                              <div class="subtask-divider"></div>
                              <button class="subtask-icon-btn" onclick="addSubtask()" type="button">
                                  <img src="./assets/icons/check-dark.svg" alt="Confirm">
                              </button>
                          </div>
                      </div>
                  </div>
                  <ul id="subtask-list"></ul>
              </div>
          </div>
      </form>
      <footer id="add-task-form-footer">
          <p><span class="required">*</span> This field is required</p>
          <div id="task-btns">
              <button id="clear-task-form" type="button" onclick="clearDialogAddTaskForm('${status}')">Clear <img src="./assets/icons/close.svg" alt="Cross icon"></button>
              <button id="create-task" class="primary-btn" form="add-task-form" type="submit">Create Task <img src="./assets/icons/check.svg" alt="Check icon"></button>
          </div>
      </footer>
    </section>
  `;
}

/**
 * Returns the HTML template for a task card on the board.
 * @param {Object} element - The task object
 * @param {number} solvedSubtasks - The number of completed subtasks
 * @param {number} totalSubtasks - The total number of subtasks
 * @param {string} visibility - CSS class to show or hide the progress bar
 * @param {number} progress - The progress percentage (0-100)
 * @returns {Promise<string>} HTML string of the task card
 */
async function getToDoTemplate(
  element,
  solvedSubtasks,
  totalSubtasks,
  visibility = "",
  progress,
) {
  return `  
<div class="task-card" draggable="true" data-task-id="${element["id"]}" onclick="openDialogBoard('${element["id"]}')">
  <div class="task-card-topbar">
    <span class="category-badge" style="background-color:${element["categoryLabelColor"]}">${element["category"]}</span>
    <button class="move-to-btn" draggable="false" onclick="toggleMoveOverlay(event, '${element["id"]}', '${element["status"]}')" title="Move to">
      <img src="./assets/icons/move-task.svg" />
    </button>
  </div>

  <h3 class="task-title">${element["title"]}</h3>

  <p class="task-description">${element["description"]}</p>

  <div class="progress-wrapper ${visibility}">
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${progress}%"></div>
    </div>
    <span class="progress-label">${solvedSubtasks}/${totalSubtasks} Subtasks</span>
  </div>

  <div class="task-footer">
    <div class="avatars">
      ${await getAssignedToAvatars(element.assignedTo)}
    </div>
    <span><img src="./assets/icons/priority-${element["priority"]}.svg" /></span>
  </div>
</div>`;
}

/**
 * Returns the HTML template for the task detail dialog.
 * @param {Object} element - The task object
 * @param {Object[]} assignedContacts - Array of assigned contact objects
 * @param {Object[]} subtasks - Array of subtask objects
 * @returns {string} HTML string of the task detail dialog
 */
function getDialogBoardTemplate(element, assignedContacts, subtasks) {
  return `
    <header>
        <div class="flex-sb">
            <div class="dialog-badges">
                <span class="category-badge" style="background-color:${element["categoryLabelColor"]}">${element["category"]}</span>
                ${getAiTicketBadgeTemplate(element)}
            </div>
            <button onclick="closeDialogBoard('${element.status}')">✕</button>
        </div>
        <h2>${element.title}</h2>
    </header>
    <main>
        <p>${element.description}</p>
        ${getCreatorTemplate(element.creator)}
        <p><span>Due date:</span><span>${formatDate(element.dueDate)}</span></p>
        <p>
            <span>Priority:</span>
            <span>${capitalize(element["priority"])} <img src="./assets/icons/priority-${element["priority"]}.svg" /></span>
        </p>
        <div class="contact-list">
            <p class="dialog-gap">Assigned To:</p>
            <p>${assignedContacts.map(getAssignedContactTemplate).join("")}</p>
        </div>
        <div>
            <p>Subtasks</p>
            <ul id="subtasks">
                ${checkIfSubtasksAvaiable(subtasks, element.id)}
            </ul>        
        </div>
    </main>
    <footer>
        <div class="dialog-board-actions">
            <button class="delete-edit-button" onclick="deleteTask('${element.id}')">
                <img src="./assets/icons/delete.svg" alt="delete Button">Delete
            </button>
            <div class="dialog-actions-divider"></div>
           <button class="delete-edit-button" onclick="openEditTask('${element.id}')">
    <img src="./assets/icons/edit.svg" alt="edit Button">Edit
</button>
        </div>
    </footer>
  `;
}


/**
 * Returns the HTML template for the "AI generated" hint in the task dialog header.
 * Renders nothing for tasks that were not created by the n8n agent.
 * @param {Object} element - The task object
 * @returns {string} HTML string of the AI badge or an empty string
 */
function getAiTicketBadgeTemplate(element) {
  if (!element.aiGenerated) return "";
  return `
    <span class="ai-badge">
        <img src="./assets/icons/ai-ticket.svg" alt="AI icon"><span>Ai-generated ticket</span>
    </span>`;
}

/**
 * Label and icon per channel an external task can come in through.
 * Extend this when the n8n agent starts reading from another source.
 */
const CREATOR_SOURCES = {
  email: { label: "E-Mail", icon: "link-mail.svg" },
};

/**
 * Returns the HTML template for the creator row in the task dialog.
 * Renders nothing for tasks created before the creator field existed.
 * @param {Object} creator - The creator object {type, name, source, contactId, email}
 * @returns {string} HTML string of the creator row or an empty string
 */
function getCreatorTemplate(creator) {
  if (!creator) return "";
  const isExtern = creator.type === "extern";
  const label = isExtern ? "Extern" : "Member";
  const icon = isExtern ? "creator-extern.svg" : "creator-member.svg";
  return `
    <p class="creator-row">
        <span>Creator:</span>
        <span class="creator-badge creator-badge-${isExtern ? "extern" : "member"}">
            <img src="./assets/icons/${icon}" alt="${label} icon">${label}
        </span>
        <span class="creator-name">${creator.name}</span>
        ${getCreatorActionTemplate(creator, isExtern)}
    </p>`;
}

/**
 * Returns the HTML template for the creator action.
 * Members link to their contact profile, external creators show the channel
 * their task came in through, linked when an address is available.
 * @param {Object} creator - The creator object
 * @param {boolean} isExtern - Whether the creator is external
 * @returns {string} HTML string of the action or an empty string
 */
function getCreatorActionTemplate(creator, isExtern) {
  if (!isExtern) return getCreatorProfileTemplate(creator);
  const source = CREATOR_SOURCES[creator.source];
  if (!source) return "";
  const content = `<img src="./assets/icons/${source.icon}" alt="${source.label} icon">${source.label}`;
  if (creator.source === "email" && creator.email) {
    return `<a class="creator-action" href="mailto:${creator.email}">${content}</a>`;
  }
  return `<span class="creator-action">${content}</span>`;
}

/**
 * Returns the HTML template for the profile link of an internal creator.
 * @param {Object} creator - The creator object
 * @returns {string} HTML string of the profile link or an empty string
 */
function getCreatorProfileTemplate(creator) {
  if (!creator.contactId) return "";
  return `<a class="creator-action" href="./contacts.html?contact=${creator.contactId}">
            <img src="./assets/icons/link-profile.svg" alt="Profile icon">Profil
        </a>`;
}

/**
 * Returns the HTML template for an assigned contact in the task dialog.
 * @param {Object} contact - The contact object
 * @returns {string} HTML string of the assigned contact
 */
function getAssignedContactTemplate(contact) {
  return `
    <div class="assigned-contact">
      <span class="avatar" style="background-color:${contact.avatarColor}">${getInitials(contact.name)}</span>
      <span>${contact.name}</span>
    </div>
  `;
}

/**
 * Returns the HTML template for a contact list item.
 * @param {Object} contact - The contact object
 * @param {string} initials - The initials of the contact
 * @param {string} color - The avatar background color
 * @returns {string} HTML string of the contact list item
 */
function getContactItemTemplate(contact, initials, color) {
  return `
    <div class="contact-avatar" style="background-color: ${color};">
      ${initials}
    </div>
    <div class="contact-info">
      <span class="contact-name">${contact.name}</span>
      <span class="contact-email">${contact.email}</span>
    </div>
  `;
}

/**
 * Returns the HTML template for the contact detail view.
 * @param {Object} contact - The contact object
 * @param {string} initials - The initials of the contact
 * @param {string} color - The avatar background color
 * @returns {string} HTML string of the contact detail view
 */
function getContactDetailTemplate(contact, initials, color) {
  return `
    <div class="contact-detail-header">
      <div class="contact-detail-avatar" style="background-color: ${color};">
        ${initials}
      </div>
      <div class="contact-detail-name-actions">
        <h2>${contact.name}</h2>
        <div class="contact-detail-actions">
          <button onclick="editContact('${contact.id}')" class="detail-action-btn">
            <img src="./assets/icons/edit.svg" alt="Edit"> Edit
          </button>
          <button onclick="deleteContact('${contact.id}')" class="detail-action-btn">
            <img src="./assets/icons/delete.svg" alt="Delete"> Delete
          </button>
        </div>
      </div>
    </div>

    <p class="contact-info-label">Contact Information</p>

    <div class="contact-detail-info">
      <p class="detail-info-title">Email</p>
      <a class="detail-info-email" href="mailto:${contact.email}">${contact.email}</a>
    </div>

    <div class="contact-detail-info">
      <p class="detail-info-title">Phone</p>
      <p class="detail-info-value" id="detail-phone">${contact.phone || "–"}</p>
    </div>
  `;
}

/**
 * Returns the HTML template for the task edit dialog.
 * @param {Object} element - The task object
 * @param {string} priorityButtons - HTML string of the priority buttons
 * @param {string} assignedHTML - HTML string of the assigned contacts section
 * @param {string} subtasksHTML - HTML string of the subtasks list
 * @returns {string} HTML string of the task edit dialog
 */
function getDialogBoardEditTemplate(
  element,
  priorityButtons,
  assignedHTML,
  subtasksHTML,
) {
  return `
    <header>
        <div class="flex-sb">
            <span class="category-badge" style="background-color:${element["categoryLabelColor"]}">${element["category"]}</span>
            <button onclick="closeDialogBoard('${element.status}')">✕</button>
        </div>
    </header>
    <main>
        <label class="edit-margin" for="edit-title">Title</label>
        <input type="text" id="edit-title" value="${element.title}" />
        <label class="edit-margin" for="edit-description">Description</label>
        <textarea id="edit-description">${element.description}</textarea>
        <label class="edit-margin" for="edit-due-date">Due date</label>
        <input type="date" id="edit-due-date" value="${element.dueDate}" />
        <label class="edit-margin">Priority</label>
        <div class="priority-buttons">${priorityButtons}</div>
        <label class="edit-margin">Assigned To</label>
        <div class="contacts-edit-list">${assignedHTML}</div>
        <label class="edit-margin">Subtasks</label>
        <div class="subtask-input-wrapper">
            <input type="text" id="new-subtask-input" placeholder="Add new subtask"
                   oninput="onSubtaskInputEdit()"
                   onkeydown="handleSubtaskKeyEdit(event, '${element.id}')">
            <div id="subtask-confirm-btns-edit" class="subtask-confirm-btns">
                <button class="subtask-icon-btn" type="button" onclick="clearSubtaskInputEdit()">
                    <img src="./assets/icons/close.svg">
                </button>
                <div class="subtask-divider-edit"></div>
                <button class="subtask-icon-btn" type="button" onclick="addSubtaskEdit('${element.id}')">
                    <img src="./assets/icons/check-dark.svg">
                </button>
            </div>
        </div>
        <ul id="subtasks">${subtasksHTML}</ul>
    </main>
    <footer>
        <div class="dialog-actions">
            <button class="save-edit-button" onclick="saveEditTask('${element.id}')">
                Ok <img src="./assets/icons/check.svg" alt="save Button">
            </button>
        </div>
    </footer>
  `;
}

/**
 * Returns the HTML template for a subtask list item with a configurable toggle function.
 * @param {Object} subtask - The subtask object
 * @param {string} taskID - The ID of the parent task
 * @param {number} subtaskIndex - The index of the subtask
 * @param {string} toggleFn - The toggle function name to call on click
 * @returns {string} HTML string of the subtask list item
 */
function getSubtasksTemplate(
  subtask,
  taskID,
  subtaskIndex,
  toggleFn = "toggleSubtask",
) {
  return `
    <li class="no-decoration board-subtask">
        <label for="${subtask.id}">
            <input type="checkbox" id="${subtask.id}" 
                   onclick="${toggleFn}('${subtaskIndex}', ${subtask.completed}, '${taskID}')" 
                   ${checkIfSubtaskActive(subtask.completed)}>
            ${subtask.title}
        </label>
    </li>
  `;
}

/**
 * Returns the HTML for a single priority button.
 * @param {string} priority - The priority value (e.g. "urgent")
 * @param {string} currentPriority - The currently active priority
 * @returns {string} HTML string of the priority button
 */
function getPriorityButtonTemplate(priority, currentPriority) {
  const active = getPriorityActiveClass(priority, currentPriority);
  return `<button class="prio-btn ${active}" data-priority="${priority}" onclick="setEditPriority(event, '${priority}')">
    ${capitalize(priority)} <span><img src="./assets/icons/priority-${priority}.svg" /></span>
  </button>`;
}

/**
 * Returns the HTML template for a contact option in the assignment dropdown.
 * @param {string} id - The contact ID
 * @param {Object} contact - The contact object
 * @param {string} checked - The checked attribute string if selected
 * @returns {string} HTML string of the contact option
 */
function getContactOptionTemplate(id, contact, checked) {
  return `
    <div class="custom-option" onclick="toggleAssignedContact(event, '${id}')">
      <span class="avatar" style="background:${contact.avatarColor}">${getInitials(contact.name)}</span>
      <span>${contact.name}</span>
      <input type="checkbox" value="${id}" ${checked} style="margin-left:auto" />
    </div>`;
}

/**
 * Returns the HTML template for a contact badge.
 * @param {Object} contact - The contact object
 * @returns {string} HTML string of the contact badge
 */
function getContactBadgeTemplate(contact) {
  return `<div class="badge-avatar" style="background:${contact.avatarColor}">${getInitials(contact.name)}</div>`;
}

/**
 * Returns the HTML template for the assigned contacts section in the edit dialog.
 * @param {string} optionsHTML - HTML string of the contact options
 * @param {string} badgesHTML - HTML string of the contact badges
 * @returns {string} HTML string of the assigned contacts edit section
 */
function getAssignedContactsEditTemplate(optionsHTML, badgesHTML) {
  return `
    <div class="custom-select-wrapper">
      <div class="custom-select-trigger" onclick="toggleEditDropdown()">
        <span>Select contacts to assign</span>
        <img src="./assets/icons/arrow_drop_down.svg" class="select-arrow">
      </div>
      <div class="custom-select-dropdown" id="edit-assigned-dropdown">
        <div class="custom-select-dropdown-inner">${optionsHTML}</div>
      </div>
    </div>
    <div id="edit-assigned-badges" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">${badgesHTML}</div>
  `;
}

/**
 * Returns the HTML template for a subtask edit list item.
 * @param {Object} subtask - The subtask object
 * @param {string} taskId - The ID of the parent task
 * @param {number} index - The index of the subtask
 * @returns {string} HTML string of the subtask edit list item
 */
function getSubtaskEditItemTemplate(subtask, taskId, index) {
  return `
    <li class="subtask-edit-item" data-task-id="${taskId}" data-index="${index}">
      <span class="subtask-text" onclick="editSubtaskEditMode(this)">${subtask.title}</span>
      <div class="subtask-item-actions">
        <button class="subtask-icon-btn" type="button" onclick="editSubtaskEditMode(this.closest('li').querySelector('.subtask-text'))">
          <img src="./assets/icons/edit.svg">
        </button>
        <div class="subtask-divider"></div>
        <button class="subtask-icon-btn" type="button" onclick="deleteSubtaskEdit('${taskId}', ${index})">
          <img src="./assets/icons/delete.svg">
        </button>
      </div>
    </li>
  `;
}

/**
 * Returns the HTML template for a subtask in editing state.
 * @param {string} currentText - The current subtask title
 * @returns {string} HTML string of the subtask editing state
 */
function getSubtaskEditingStateTemplate(currentText) {
  return `
    <input class="subtask-edit-input" type="text" value="${currentText}">
    <div class="subtask-item-actions">
      <button class="subtask-icon-btn" type="button" onclick="this.closest('li').remove()">
        <img src="./assets/icons/delete.svg">
      </button>
      <div class="subtask-divider"></div>
      <button class="subtask-icon-btn" type="button" onclick="confirmSubtaskEditMode(this)">
        <img src="./assets/icons/check-dark.svg">
      </button>
    </div>
  `;
}

/**
 * Returns the HTML template for subtask edit action buttons.
 * Contains a delete button and a confirm button separated by a divider.
 * @returns {string} HTML string with delete and confirm action buttons
 */
function getSubtaskEditActionsTemplate() {
    return `
        <button class="subtask-icon-btn" onclick="removeSubtask(this)" type="button">
            <img src="./assets/icons/delete.svg" alt="Delete">
        </button>
        <div class="subtask-divider"></div>
        <button class="subtask-icon-btn" onclick="confirmEditSubtask(this)" type="button">
            <img src="./assets/icons/check-dark.svg" alt="Confirm">
        </button>
    `;
}
