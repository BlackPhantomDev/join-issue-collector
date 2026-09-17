let mobileActiveContact = null;

const AVATAR_COLORS = [
  "#FF7043",  "#E91E8C",  "#9C27B0",  "#3F51B5",  "#00BCD4",  "#4CAF50",  "#FF9800",  "#795548",
];

/**
 * Displays a temporary message box with the given text.
 * The box animates in, stays visible for 2.5 seconds, then animates out.
 * @param {string} message - The message text to display
 */
function showMessage(message) {
    const box = document.getElementById('message-box');
    box.textContent = message;
    box.style.opacity = '1';
    box.style.transform = 'translate(-50%, 0)';
    box.style.zIndex = '999';
    setTimeout(() => {
        box.style.opacity = '0';
        box.style.transform = 'translate(-50%, 200px)';
        box.style.zIndex = '0';
    }, 2500);
}

/**
 * Opens the contact dialog overlay.
 */
function openContactDialog() {
  document.getElementById("dialog-overlay").classList.add("active");
}

/**
 * Closes the contact dialog overlay
 */
function closeContactDialog() {
  document.getElementById("dialog-overlay").classList.remove("active");
  clearDialogInputs();
  clearErrors();
  resetDialog();
}

/**
 * Clears all input fields in the contact dialog.
 */
function clearDialogInputs() {
  document.getElementById("input-name").value = "";
  document.getElementById("input-email").value = "";
  document.getElementById("input-phone").value = "";
}

document
  .getElementById("dialog-overlay")
  .addEventListener("click", function (e) {
    if (e.target === this) closeContactDialog();
  });

/**
 * Generates a contact object from the current dialog input values.
 * @param {string} contactID - The ID of the contact in Firebase
 * @returns {Object} The generated contact object
 */
function generateContactJson(contactID) {
  return {
    id: contactID,
    name: getContactName(),
    email: getContactEmailAdress(),
    phone: getContactPhone(),
    avatarColor: selectRandomAvatarColor(),
  };
}

/**
 * Returns the name value from the contact dialog input.
 * @returns {string} The trimmed name input value
 */
function getContactName() {
  return document.getElementById("input-name").value.trim();
}

/**
 * Returns the email value from the contact dialog input.
 * @returns {string} The trimmed email input value
 */
function getContactEmailAdress() {
  return document.getElementById("input-email").value.trim();
}

/**
 * Returns the phone value from the contact dialog input.
 * @returns {string} The trimmed phone input value
 */
function getContactPhone() {
  return document.getElementById("input-phone").value.trim();
}

/**
 * Returns a randomly selected avatar color from the predefined color list.
 * @returns {string} A hex color code
 */
function selectRandomAvatarColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

/**
 * Groups an array of contacts alphabetically by their first name letter.
 * @param {Object[]} contacts - Array of contact objects
 * @returns {Object} An object with letters as keys and contact arrays as values
 */
function groupContactsByLetter(contacts) {
  const sorted = contacts.sort((a, b) => a.name.localeCompare(b.name));
  const grouped = {};
  sorted.forEach((contact) => {
    const letter = contact.name[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(contact);
  });
  return grouped;
}

/**
 * Creates a contact list item element with initials and avatar color.
 * @param {Object} contact - The contact object
 * @returns {HTMLElement} The created contact item element
 */
function createContactItem(contact) {
  const initials = getInitials(contact.name);
  const item = document.createElement("div");
  item.className = "contact-item";
  item.dataset.contactId = contact.id;
  item.innerHTML = getContactItemTemplate(contact, initials, contact.avatarColor);
  item.addEventListener("click", (event) => openContactDetail(contact, event));
  return item;
}

/**
 * Creates a letter divider element for the contact list.
 * @param {string} letter - The letter to display as a section header
 * @returns {HTMLElement} The created divider element
 */
function createLetterDivider(letter) {
  const divider = document.createElement("div");
  divider.className = "contact-divider";
  divider.innerHTML = `
    <span class="contact-letter">${letter}</span>
    <hr class="contact-divider-line">
  `;
  return divider;
}

/**
 * Creates a contact list element grouped alphabetically by letter.
 * @param {Object} grouped - An object with letters as keys and contact arrays as values
 * @returns {HTMLElement} The created contact list element
 */
function buildContactList(grouped) {
  const list = document.createElement("div");
  list.className = "contacts-list";
  Object.keys(grouped)
    .sort()
    .forEach((letter) => {
      list.appendChild(createLetterDivider(letter));
      grouped[letter].forEach((contact) =>
        list.appendChild(createContactItem(contact))
      );
    });
  return list;
}

/**
 * Renders the contacts list grouped alphabetically into the sidebar.
 * @param {Object[]} contacts - Array of contact objects to render
 */
function renderContacts(contacts) {
  const sidebar = document.getElementById("sidebar_contacts");
  const existingList = sidebar.querySelector(".contacts-list");
  if (existingList) existingList.remove();
  const grouped = groupContactsByLetter(contacts);
  sidebar.appendChild(buildContactList(grouped));
}

/**
 * Loads all contacts from Firebase and renders them into the sidebar.
 * @returns {Promise<void>}
 */
async function loadContacts() {
  try {
    const data = await loadData("/contacts");
    if (!data) return;
    const contacts = Object.entries(data).map(([id, contact]) => ({
      ...contact,
      id,
    }));
    renderContacts(contacts);
    openContactFromUrl();
  } catch (error) {
    console.error("Fehler beim Laden der Kontakte:", error);
  }
}

/**
 * Opens a contact detail view directly if a contact ID is passed as URL parameter.
 * Used by the "Profil" link in the task dialog.
 * @returns {void}
 */
function openContactFromUrl() {
  const contactId = new URLSearchParams(location.search).get("contact");
  if (!contactId) return;
  const item = document.querySelector(
    `.contact-item[data-contact-id="${contactId}"]`,
  );
  if (item) item.click();
}

document.addEventListener("DOMContentLoaded", loadContacts);

/**
 * Clears the active contact selection and removes the detail view.
 */
function clearActiveContact() {
  document
    .querySelectorAll(".contact-item")
    .forEach((el) => el.classList.remove("active"));
  const existing = document.querySelector(".contact-detail");
  if (existing) existing.remove();
  document.querySelector(".main_contacts").classList.remove("contact-open");
  document.getElementById("sidebar_contacts").style.display = "";
  document.querySelector(".fab-add-contact").style.display = "";
  mobileActiveContact = null;
}

/**
 * Appends the contact detail view to the main content area.
 * @param {Object} contact - The contact object to display
 */
function appendContactDetail(contact) {
  const main = document.querySelector(".main_contacts");
  const initials = getInitials(contact.name);
  const detail = document.createElement("div");
  detail.className = "contact-detail";
  detail.innerHTML = getContactDetailTemplate(contact, initials, contact.avatarColor);
  main.appendChild(detail);
}

/**
 * Opens the contact detail view for the selected contact.
 * @param {Object} contact - The contact object to display
 * @param {MouseEvent} event - The click event from the contact item
 */
function openContactDetail(contact, event) {
  const clickedItem = event.currentTarget;
  const isAlreadyActive = clickedItem.classList.contains("active");
  clearActiveContact();
  if (isAlreadyActive) return;
  clickedItem.classList.add("active");
  mobileActiveContact = contact;
  appendContactDetail(contact);
  if (window.innerWidth <= 1200) {
    document.querySelector(".main_contacts").classList.add("contact-open");
    document.getElementById("sidebar_contacts").style.display = "none";
    document.querySelector(".fab-add-contact").style.display = "none";
  }
}

/**
 * Clears the active contact and returns to the contact list.
 */
function backToContacts() {
  clearActiveContact();
}

/**
 * Creates a new contact in Firebase and refreshes the contact list.
 * @returns {Promise<void>}
 */
async function submitContact() {
  if (!validateInputs()) return;
  try {
    const contactID = "contact-" + generateUUID();
    await putData("/contacts/" + contactID, generateContactJson(contactID));
    closeContactDialog();
    loadContacts();
    showMessage("Contact successfully created");
  } catch (error) {
    console.error("Fehler beim Erstellen des Kontakts:", error);
  }
}

/**
 * Deletes a contact from Firebase and refreshes the contact list.
 * @param {string} contactId - The ID of the contact to delete
 * @returns {Promise<void>}
 */
async function deleteContact(contactId) {
  try {
    await deleteData("/contacts/" + contactId);
    clearActiveContact();
    loadContacts();
    showMessage("Contact successfully deleted");
  } catch (error) {
    console.error("Fehler beim Löschen des Kontakts:", error);
  }
}

/**
 * Returns the data of the currently active contact item.
 * @param {string} contactId - The ID of the contact
 * @returns {Object|null} The active contact data or null if none is active
 */
function getActiveContactData(contactId) {
  let currentContact = null;
  document.querySelectorAll(".contact-item").forEach((item) => {
    if (item.classList.contains("active")) {
      currentContact = {
        id: contactId,
        name: item.querySelector(".contact-name").textContent,
        email: item.querySelector(".contact-email").textContent,
      };
    }
  });
  return currentContact;
}

/**
 * Fills the contact dialog inputs with the current contact's data.
 * @param {Object} currentContact - The contact object with name, email and phone
 */
function fillEditDialogInputs(currentContact) {
  document.getElementById("input-name").value = currentContact?.name || "";
  document.getElementById("input-email").value = currentContact?.email || "";
  const phoneEl = document.getElementById("detail-phone");
  document.getElementById("input-phone").value = phoneEl ? phoneEl.textContent : "";
}

/**
 * Sets up the edit dialog buttons for deleting and saving a contact.
 * @param {string} contactId - The ID of the contact to edit
 */
function setEditDialogButtons(contactId) {
  const cancelBtn = document.querySelector(".btn-cancel");
  const submitBtn = document.querySelector(".btn-submit");
  cancelBtn.textContent = "Delete ✕";
  cancelBtn.onclick = () => {
    deleteContact(contactId);
    closeContactDialog();
  };
  submitBtn.textContent = "Save ✓";
  submitBtn.onclick = () => saveContact(contactId);
  document.querySelector(".close-btn").onclick = () => closeContactDialog();
  document.querySelector(".dialog-left h1").textContent = "Edit contact";
}

/**
 * Opens the contact dialog in edit mode for the given contact.
 * @param {string} contactId - The ID of the contact to edit
 */
function editContact(contactId) {
  const currentContact = getActiveContactData(contactId);
  openContactDialog();
  fillEditDialogInputs(currentContact);
  setEditDialogButtons(contactId);
}

/**
 * Saves the updated contact data to Firebase and refreshes the contact list.
 * @param {string} contactId - The ID of the contact to save
 * @returns {Promise<void>}
 */
async function saveContact(contactId) {
  if (!validateInputs()) return;
  const updatedContact = {
    id: contactId,
    avatarColor: selectRandomAvatarColor(),
    name: document.getElementById("input-name").value.trim(),
    email: document.getElementById("input-email").value.trim(),
    phone: document.getElementById("input-phone").value.trim(),
  };
  try {
    await putData("/contacts/" + contactId, updatedContact);
    closeContactDialog();
    clearActiveContact();
    loadContacts();
    showMessage("Contact successfully updated");
  } catch (error) {
    console.error("Fehler beim Speichern des Kontakts:", error);
  }
}

/**
 * Resets the contact dialog to its default "Add contact" state.
 */
function resetDialog() {
  const cancelBtn = document.querySelector(".btn-cancel");
  const submitBtn = document.querySelector(".btn-submit");
  cancelBtn.textContent = "Cancel ✕";
  cancelBtn.onclick = closeContactDialog;
  submitBtn.textContent = "Create contact ✓";
  submitBtn.onclick = submitContact;
  document.querySelector(".close-btn").onclick = closeContactDialog;
  document.querySelector(".dialog-left h1").textContent = "Add contact";
}

/**
 * Validates the contact dialog input fields.
 * @returns {boolean} True if all inputs are valid, false otherwise
 */
function validateInputs() {
  const nameInput = document.getElementById("input-name");
  const emailInput = document.getElementById("input-email");
  const phoneInput = document.getElementById("input-phone");
  const phoneRegex = /^[+\d\s\-()]{6,20}$/;
  let isValid = true;

  clearErrors();

  if (!nameInput.value.trim()) {
    showError("input-name", "err-name", "This field is required");
    isValid = false;
  }
  if (!emailInput.checkValidity()) {
    showError("input-email", "err-email", "Please enter a valid email address");
    isValid = false;
  }
  if (!phoneRegex.test(phoneInput.value.trim())) {
    showError("input-phone", "err-phone", "Please enter a valid phone number");
    isValid = false;
  }

  return isValid;
}

/**
 * Marks an input field as invalid and displays an error message below it.
 * @param {string} inputId - The ID of the input element to mark as invalid
 * @param {string} errorId - The ID of the error message element
 * @param {string} message - The error message to display
 */
function showError(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const err = document.getElementById(errorId);
  input.style.borderColor = "var(--error-color)";
  err.textContent = message;
  err.classList.add("visible");
}

/**
 * Clears all validation errors from the contact dialog input fields.
 * Resets border colors and removes all error message elements.
 */
function clearErrors() {
  [
    { inputId: "input-name",  errorId: "err-name"  },
    { inputId: "input-email", errorId: "err-email" },
    { inputId: "input-phone", errorId: "err-phone" },
  ].forEach(({ inputId, errorId }) => {
    document.getElementById(inputId).style.borderColor = "";
    const err = document.getElementById(errorId);
    err.textContent = "";
    err.classList.remove("visible");
  });
}
