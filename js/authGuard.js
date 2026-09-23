import { auth, db } from "./firebaseAuth.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";
const homePaths = [
  "/",
  "/login.html",
  "login.html",
  "/index.html",
  "index.html",
  "/stakeholder.html",
  "stakeholder.html",
];
const publicPaths = [
  "/privacy.html",
  "privacy.html",
  "/legal.html",
  "legal.html",
  "/help.html",
  "help.html",
];
const path = window.location.pathname;

/**
 * Publishes the resolved auth state so the topbar and sidebar can render it.
 * Tolerates pages that do not load script.js, such as the stakeholder page.
 * @param {"signed-in"|"signed-out"} state - The resolved authentication state
 * @returns {void}
 */
function publishAuthState(state) {
  if (typeof setAuthState === "function") setAuthState(state);
}

/**
 * Loads the authenticated user's data from Firebase and sets the global current user.
 * Redirects to the summary page if on a home path.
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
  window.currentUser = { ...contactSnap.val(), id: contactId };
  publishAuthState("signed-in");
  if (path.includes("login.html")) {
    window.location.href = "./summary.html";
  }
}

/**
 * Handles routing for unauthenticated users.
 * Redirects to index if on a protected path, otherwise leaves the page in place
 * so the guest sidebar can render.
 * @param {string} path - The current page path
 * @returns {void}
 */
function handleUnauthenticatedUser(path) {
  publishAuthState("signed-out");
  if (!publicPaths.includes(path) && !homePaths.includes(path)) {
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
      publishAuthState("signed-in");
      if (path.includes("login.html")) {
        window.location.href = "./summary.html";
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
