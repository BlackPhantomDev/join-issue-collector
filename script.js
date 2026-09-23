const loginSignupSection = document.getElementById("login-signup-section");
const signupBtn = document.getElementById("signup");
const messageElement = document.getElementById("message-box");
const sidebar = document.getElementById("sidebar");
let sidebarPage = "";

const animatedImgWrapper = document.getElementById("animated-img-wrapper");
const navLogo = document.getElementById("navbar-logo");

/**
 * Measures the navbar logo position and sets CSS variables for the intro animation target.
 * Temporarily makes the hidden logo visible to read its coordinates via getBoundingClientRect.
 */
function setLogoAnimationTarget() {
  const logo = document.getElementById("navbar-logo");
  if (!logo) return;

  logo.style.visibility = "hidden";
  logo.classList.remove("hide");

  const rect = logo.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const translateX = centerX - window.innerWidth / 2;
  const translateY = centerY - window.innerHeight / 2;

  document.documentElement.style.setProperty("--logo-x", `${translateX}px`);
  document.documentElement.style.setProperty("--logo-y", `${translateY}px`);

  // Zielgröße des echten Logos übernehmen
  document.documentElement.style.setProperty("--logo-w", `${rect.width}px`);
  document.documentElement.style.setProperty("--logo-h", `${rect.height}px`);

  logo.classList.add("hide");
  logo.style.visibility = "";
}

setLogoAnimationTarget();

/**
 * Checks whether the current user is a guest.
 * @returns {boolean} True if the current user is a guest, false otherwise
 */
function isGuest() {
  return window.currentUser?.name === "Guest";
}

/**
 * Registers the animation end event on the logo wrapper element.
 * Hides the wrapper and reveals the nav logo after the animation completes.
 */
function initLogoAnimation() {
  if (animatedImgWrapper) {
    animatedImgWrapper.addEventListener("animationend", (e) => {
      if (e.target === animatedImgWrapper) {
        animatedImgWrapper.style.display = "none";
        navLogo.classList.remove("hide");
      }
    });
  }
}

initLogoAnimation();

document.addEventListener(
  "cancel",
  (e) => {
    if (e.target.tagName === "DIALOG") e.preventDefault();
  },
  true,
);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.querySelector("dialog[open]"))
    e.preventDefault();
});

/**
 * Initializes the page by generating the topbar and loading the sidebar.
 * @param {string} site - The current page identifier
 */
function init(site) {
  generateTopbar();
  loadSidebar(site);
}

/**
 * Stores the resolved authentication state and redraws everything that depends
 * on it. Called by the auth listener once Firebase knows who the visitor is.
 * @param {"signed-in"|"signed-out"} state - The resolved authentication state
 */
function setAuthState(state) {
  window.authState = state;
  renderUserMenue();
  renderSidebar();
}

/**
 * Creates and appends an empty add task dialog element to the main content area.
 */
function generateDialog() {
  let main = document.querySelector("main");
  let dialogSection = document.createElement("dialog");
  dialogSection.id = "add-task-dialog";
  main.appendChild(dialogSection);
  addTaskDialog = dialogSection;
}

/**
 * Creates and appends the topbar element to the body.
 */
function generateTopbar() {
  let body = document.querySelector("body");
  let header = document.createElement("header");
  header.id = "topbar";
  body.appendChild(header);
  setTopbar();
}

/**
 * Renders the topbar template into the topbar element and draws the user menu
 * in case the auth state resolved before the topbar existed.
 */
function setTopbar() {
  const topbar = document.getElementById("topbar");
  topbar.innerHTML = getTopbarTemplate();
  renderUserMenue();
}

/**
 * Switches the login/signup section to the signup form.
 */
function switchToSignup() {
  loginSignupSection.innerHTML = getSignupTemplate();
  signupBtn.classList.add("hidden");
  document.getElementById("signupResponsiv").classList.add("hidden");
  document.title = "Join | Sign up";
}

/**
 * Switches the login/signup section to the login form.
 */
function switchToLogin() {
  loginSignupSection.innerHTML = getLoginTemplate();
  signupBtn.classList.remove("hidden");
  document.getElementById("signupResponsiv").classList.remove("hidden");
  document.title = "Join | Log in";
}

/**
 * Displays a temporary message in the message box for 5 seconds.
 * @param {string} message - The message to display
 */
function showMessage(message) {
  messageElement.classList.add("visible");
  const msgNode = document.createElement("p");
  msgNode.textContent = message.toString();
  messageElement.appendChild(msgNode);
  setTimeout(() => {
    msgNode.remove();
    if (messageElement.children.length === 0) {
      messageElement.classList.remove("visible");
    }
  }, 5000);
}

/**
 * Remembers the current page and renders the sidebar for it.
 * @param {string} page - The current page identifier (e.g. "summary", "board")
 */
function loadSidebar(page) {
  sidebarPage = page;
  renderSidebar();
}

/**
 * Renders the sidebar variant matching the resolved auth state. Does nothing
 * while the page or the auth state is still unknown, so it can be called from
 * both the auth listener and the page initialization.
 */
function renderSidebar() {
  if (!sidebar || !sidebarPage || !window.authState) return;

  if (window.authState === "signed-out") renderGuestSidebar();
  else renderMemberSidebar();
}

/**
 * Renders the full sidebar with the active navigation link for the current page.
 */
function renderMemberSidebar() {
  const map = {
    summary: ["active", "", "", "", "", ""],
    addtask: ["", "active", "", "", "", ""],
    board: ["", "", "active", "", "", ""],
    contact: ["", "", "", "active", "", ""],
    privacy: ["", "", "", "", "active", ""],
    legal: ["", "", "", "", "", "active"],
  };
  const args = map[sidebarPage] || ["", "", "", "", "", ""];
  sidebar.classList.remove("guest-sidebar");
  sidebar.innerHTML = getSidebarTemplate(...args);
}

/**
 * Renders the guest sidebar showing just the login link and privacy/legal links.
 */
function renderGuestSidebar() {
  const privacy = sidebarPage === "privacy" ? "active" : "";
  const legal = sidebarPage === "legal" ? "active" : "";
  sidebar.classList.add("guest-sidebar");
  sidebar.innerHTML = getSidebarGuestTemplate(privacy, legal);
}

/**
 * Returns the initials of a full name.
 * @param {string} name - The full name to extract initials from
 * @returns {string} The uppercase initials
 */
function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

/**
 * Renders the user menu with the current user's initials and avatar color.
 * Does nothing while the topbar or the current user is still missing, so it can
 * be called from both the auth listener and the topbar rendering.
 */
function renderUserMenue() {
  const user = window.currentUser;
  const um = document.getElementById("user-menue");
  if (!um || !user) return;

  um.style.backgroundColor = user.avatarColor;
  um.innerText = getInitials(user.name);
  um.classList.add("show");
}

/**
 * Toggles the visibility of the user menu dropdown.
 */
function toggleUserMenue(event) {
  event.stopPropagation();
  const dropdown = document.getElementById("user-menue-dropdown");
  dropdown.classList.toggle("show");
}

document.addEventListener("click", function () {
  const dropdown = document.getElementById("user-menue-dropdown");
  if (dropdown) dropdown.classList.remove("show");
});

/**
 * Generates a RFC 4122 compliant UUID v4.
 * Uses `crypto.randomUUID()` in secure contexts (HTTPS),
 * and falls back to `crypto.getRandomValues()` for HTTP environments.
 *
 * @returns {string} A UUID string in the format xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 *
 * @example
 * const id = generateUUID();
 * // "3b12f1df-5232-4804-897e-917bf397618a"
 *
 * const taskID = "task-" + generateUUID();
 * // "task-3b12f1df-5232-4804-897e-917bf397618a"
 */
function generateUUID() {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16),
  );
}
