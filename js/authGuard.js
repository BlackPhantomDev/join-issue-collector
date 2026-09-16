import { auth, db } from "./firebaseAuth.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";
const homePaths = ["/", "/login.html", "login.html"];
const publicPaths = [
  "/privacy.html",
  "privacy.html",
  "/legal.html",
  "legal.html",
  "/help.html",
  "help.html",
  "/index.html",
  "index.html"
];
const path = window.location.pathname;

/**
 * Loads the authenticated user's data from Firebase and sets the global current user.
 * Redirects to summary page if on a home path, or loads the sidebar for public paths.
 * @async
 * @param {Object} user - The Firebase authenticated user object
 * @param {string} path - The current page path
 * @returns {Promise<void>}
 */
async function handleAuthenticatedUser(user, path) {
  const snapshot = await get(ref(db, `users/${user.uid}`));
  if (!snapshot.val()) return;
  const { contactId } = snapshot.val();
  const contactSnap = await get(ref(db, `contacts/${contactId}`));
  window.currentUser = contactSnap.val();
  renderUserMenue();
  if (homePaths.includes(path)) {
    window.location.href = "./summary.html";
  } else if (publicPaths.includes(path)) {
    const page = path.includes("privacy")
      ? "privacy"
      : path.includes("legal")
        ? "legal"
        : "help";
    if (typeof loadSidebar === "function") loadSidebar(page);
  }
}

/**
 * Handles routing for unauthenticated users.
 * Shows guest sidebar on public paths or redirects to index if on a protected path.
 * @param {string} path - The current page path
 * @returns {void}
 */
function handleUnauthenticatedUser(path) {
  if (publicPaths.includes(path)) {
    if (typeof switchToGuestSidebar === "function") switchToGuestSidebar();
  } else if (!homePaths.includes(path)) {
    window.location.href = "./index.html";
  }
}

/**
 * Listens to Firebase auth state changes and routes the user accordingly.
 * Handles three cases: anonymous guest, authenticated user, and unauthenticated user.
 * @listens onAuthStateChanged
 * @param {Object|null} user - The Firebase user object or null if not logged in
 * @returns {Promise<void>}
 */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    if (user.isAnonymous) {
      window.currentUser = { name: "Guest" };
      renderUserMenue();
      if (homePaths.includes(path)) {
        window.location.href = "./summary.html";
      } else if (publicPaths.includes(path)) {
        const page = path.includes("privacy")
          ? "privacy"
          : path.includes("legal")
            ? "legal"
            : "help";
        if (typeof loadSidebar === "function") loadSidebar(page);
      }
      return;
    }
    await handleAuthenticatedUser(user, path);
  } else {
    handleUnauthenticatedUser(path);
  }
});

/**
 * Signs out the current user from Firebase.
 * @returns {Promise<void>}
 */
async function logout() {
  await signOut(auth);
  window.location.href = "/";
}

window.logout = logout;
