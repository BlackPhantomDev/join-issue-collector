/**
 * Calculates the summary counts for all task statuses and priorities.
 * @param {Object[]} tasks - Array of task objects
 * @returns {Object} Object containing all counts and the upcoming deadline
 */
function getSummaryCounts(tasks) {
  const urgentTasks = tasks.filter((t) => t.priority === "urgent");
  return {
    toDoCount: tasks.filter((t) => t.status === "toDo").length,
    doneCount: tasks.filter((t) => t.status === "done").length,
    progressCount: tasks.filter((t) => t.status === "inProgress").length,
    feedbackCount: tasks.filter((t) => t.status === "await").length,
    boardCount: tasks.length,
    urgentCount: urgentTasks.length,
    emailCount: tasks.filter((t) => t.aiGenerated === true).length,
    deadline: getNextDeadline(urgentTasks),
  };
}

/**
 * Renders the summary counts into the corresponding DOM elements.
 * @param {Object} counts - The counts object returned by getSummaryCounts
 */
function renderSummaryElements(counts) {
  document.getElementById("todo_count").textContent = counts.toDoCount;
  document.getElementById("done_count").textContent = counts.doneCount;
  document.getElementById("progress_count").textContent = counts.progressCount;
  document.getElementById("feedback_count").textContent = counts.feedbackCount;
  document.getElementById("board_count").textContent = counts.boardCount;
  document.getElementById("urgent_count").textContent = counts.urgentCount;
  document.getElementById("email_count").textContent = counts.emailCount;
  document.getElementById("deadline").textContent = counts.deadline;
}

/**
 * Initializes the summary page by loading tasks and updating all counters.
 * @returns {Promise<void>}
 */
async function initSummary() {
  const data = await loadData("/tasks");

  const tasks = data
    ? Object.entries(data).map(([id, task]) => ({ ...task, id }))
    : [];

  renderSummaryElements(getSummaryCounts(tasks));

  if (window.innerWidth <= 1200) {
    const welcomeMsg = document.querySelector(".welcome_msg");
    if (!welcomeMsg) return;

    setTimeout(() => {
      welcomeMsg.classList.add("fade-out");

      welcomeMsg.addEventListener(
        "transitionend",
        () => {
          welcomeMsg.classList.add("hidden");
        },
        { once: true },
      );
    }, 1000);
  }
}

/**
 * Returns the nearest upcoming deadline from a list of urgent tasks.
 * @param {Object[]} urgentTasks - Array of urgent task objects
 * @returns {string} The formatted deadline date or "No deadline"
 */
function getNextDeadline(urgentTasks) {
  const withDeadline = urgentTasks
    .filter((t) => t.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  if (withDeadline.length === 0) return "No deadline";

  const date = new Date(withDeadline[0].dueDate);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
