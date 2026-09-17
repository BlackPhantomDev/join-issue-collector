const REQUEST_LIMIT = 10;

/**
 * Returns the current date as the key used in the triggerCounter node.
 * Uses the local date, matching the day boundary the n8n workflow counts by.
 * @returns {string} The date in YYYY-MM-DD format
 */
function getCounterKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Reads how many requests the n8n agent processed today.
 * Each processed mail adds one push entry below the current date.
 * @returns {Promise<number|null>} The count, or null if it cannot be read
 */
async function readRequestCount() {
  try {
    const entries = await loadData(`/triggerCounter/${getCounterKey()}`);
    if (entries === undefined) return null;
    return Object.keys(entries ?? {}).length;
  } catch (error) {
    return null;
  }
}

/**
 * Fills the request counter on the stakeholder page with the current values.
 * Keeps the static markup as fallback when the count is unavailable, so the
 * page never shows a wrong number.
 * @returns {Promise<void>}
 */
async function renderRequestCounter() {
  const counter = document.getElementById("request-counter");
  const used = document.getElementById("requests-used");
  const limit = document.getElementById("requests-limit");
  if (!counter || !used || !limit) return;

  limit.textContent = REQUEST_LIMIT;
  const count = await readRequestCount();
  if (count === null) return;

  used.textContent = Math.min(count, REQUEST_LIMIT);
  const reached = count >= REQUEST_LIMIT;
  counter.classList.toggle("limit-reached", reached);
  toggleLimitState(reached);
}

/**
 * Switches the page between the default request view and the limit notice.
 * Also swaps the illustration, which differs between both states.
 * @param {boolean} reached - Whether the daily limit has been reached
 * @returns {void}
 */
function toggleLimitState(reached) {
  const open = document.getElementById("request-open");
  const limited = document.getElementById("request-limit");
  const illustration = document.getElementById("stakeholder-illustration");
  if (!open || !limited) return;

  open.hidden = reached;
  limited.hidden = !reached;
  if (!illustration || !reached) return;
  illustration.src = "./assets/img/stakeholder-illustration-limit.svg";
  illustration.alt = "Person standing in front of a full task board";
}

document.addEventListener("DOMContentLoaded", renderRequestCounter);
