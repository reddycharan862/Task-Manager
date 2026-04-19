//Config
const API = "";  // Same origin. Change to full URL if deploying frontend separately.

//State
let token = localStorage.getItem("token");
let currentUser = localStorage.getItem("username") || "";
let currentPage = 1;
let currentFilter = "";
let totalPages = 1;

//Init
if (token) showApp();

//Auth UI toggles
function showRegister() {
  document.getElementById("login-form").style.display = "none";
  document.getElementById("register-form").style.display = "block";
  clearErrors();
}

function showLogin() {
  document.getElementById("register-form").style.display = "none";
  document.getElementById("login-form").style.display = "block";
  clearErrors();
}

function clearErrors() {
  ["login-error", "register-error", "create-error"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });
}

function showApp() {
  document.getElementById("auth-section").style.display = "none";
  document.getElementById("app-section").style.display = "block";
  document.getElementById("welcome-msg").textContent = currentUser ? `👋 ${currentUser}` : "";
  loadTasks();
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  token = null;
  currentUser = "";
  document.getElementById("auth-section").style.display = "block";
  document.getElementById("app-section").style.display = "none";
  showLogin();
}

//Register
async function register() {
  const email = document.getElementById("reg-email").value.trim();
  const username = document.getElementById("reg-username").value.trim();
  const password = document.getElementById("reg-password").value;
  const errEl = document.getElementById("register-error");

  if (!email || !username || !password) {
    errEl.textContent = "All fields are required.";
    return;
  }

  try {
    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password }),
    });
    const data = await res.json();

    if (res.ok) {
      errEl.style.color = "#22c55e";
      errEl.textContent = "✅ Registered! Logging you in...";
      // Auto-login
      await loginWithCredentials(username, password);
    } else {
      errEl.style.color = "#ef4444";
      errEl.textContent = data.detail || "Registration failed.";
    }
  } catch (err) {
    document.getElementById("register-error").textContent = "Network error. Is the server running?";
  }
}

//Login
async function login() {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  const errEl = document.getElementById("login-error");

  if (!username || !password) {
    errEl.textContent = "Username and password required.";
    return;
  }

  await loginWithCredentials(username, password);
}

async function loginWithCredentials(username, password) {
  const errEl = document.getElementById("login-error") || document.getElementById("register-error");
  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username, password }),
    });
    const data = await res.json();

    if (res.ok) {
      token = data.access_token;
      currentUser = username;
      localStorage.setItem("token", token);
      localStorage.setItem("username", username);
      currentPage = 1;
      currentFilter = "";
      showApp();
    } else {
      if (errEl) {
        errEl.style.color = "#ef4444";
        errEl.textContent = data.detail || "Login failed.";
      }
    }
  } catch (err) {
    if (errEl) errEl.textContent = "Network error. Is the server running?";
  }
}

//Allow Enter key to submit forms
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("login-password")?.addEventListener("keydown", e => {
    if (e.key === "Enter") login();
  });
  document.getElementById("reg-password")?.addEventListener("keydown", e => {
    if (e.key === "Enter") register();
  });
  document.getElementById("task-title")?.addEventListener("keydown", e => {
    if (e.key === "Enter") createTask();
  });
});

//Tasks
async function loadTasks() {
  const list = document.getElementById("task-list");
  list.innerHTML = `<div class="loading">Loading tasks…</div>`;

  let url = `${API}/tasks?page=${currentPage}&page_size=8`;
  if (currentFilter !== "") url += `&completed=${currentFilter}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) { logout(); return; }

    const data = await res.json();
    totalPages = data.total_pages || 1;
    renderTasks(data);
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><p>⚠️ Could not load tasks.</p></div>`;
  }
}

function renderTasks(data) {
  const list = document.getElementById("task-list");
  const pagination = document.getElementById("pagination");

  if (!data.tasks || data.tasks.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="icon">📋</div>
        <p>${currentFilter === "true" ? "No completed tasks." : currentFilter === "false" ? "No pending tasks." : "No tasks yet. Create one above!"}</p>
      </div>`;
    pagination.style.display = "none";
    return;
  }

  list.innerHTML = data.tasks.map(task => `
    <div class="task-item ${task.completed ? "done" : ""}" id="task-${task.id}">
      <div class="task-content">
        <div class="task-title">
          ${escapeHtml(task.title)}
          <span class="task-status-badge ${task.completed ? "badge-done" : "badge-pending"}">
            ${task.completed ? "✓ Done" : "Pending"}
          </span>
        </div>
        ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ""}
        <div class="task-meta">Created: ${formatDate(task.created_at)}</div>
      </div>
      <div class="task-actions">
        ${task.completed
          ? `<button class="btn-undo" onclick="toggleTask(${task.id}, true)">↩ Undo</button>`
          : `<button class="btn btn-success btn-sm" onclick="toggleTask(${task.id}, false)">✓ Complete</button>`
        }
        <button class="btn btn-danger btn-sm" onclick="deleteTask(${task.id})">🗑</button>
      </div>
    </div>
  `).join("");

  //Pagination
  const pageInfo = document.getElementById("page-info");
  pageInfo.textContent = `Page ${data.page} of ${data.total_pages}  (${data.total} task${data.total !== 1 ? "s" : ""})`;
  pagination.style.display = data.total_pages > 1 ? "flex" : "none";
  document.getElementById("prev-btn").disabled = currentPage <= 1;
  document.getElementById("next-btn").disabled = currentPage >= data.total_pages;
}

async function createTask() {
  const title = document.getElementById("task-title").value.trim();
  const description = document.getElementById("task-desc").value.trim();
  const errEl = document.getElementById("create-error");
  errEl.textContent = "";

  if (!title) { errEl.textContent = "Title is required."; return; }

  try {
    const res = await fetch(`${API}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, description }),
    });

    if (res.ok) {
      document.getElementById("task-title").value = "";
      document.getElementById("task-desc").value = "";
      currentPage = 1;
      currentFilter = "";
      updateFilterButtons("");
      loadTasks();
    } else {
      const data = await res.json();
      errEl.textContent = data.detail || "Failed to create task.";
    }
  } catch (err) {
    errEl.textContent = "Network error.";
  }
}

async function toggleTask(id, currentlyCompleted) {
  try {
    await fetch(`${API}/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ completed: !currentlyCompleted }),
    });
    loadTasks();
  } catch (err) {
    alert("Failed to update task.");
  }
}

async function deleteTask(id) {
  if (!confirm("Delete this task? This cannot be undone.")) return;
  try {
    const res = await fetch(`${API}/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 204) {
      // If deleting last item on page > 1, go back a page
      if (currentPage > 1) {
        const list = document.getElementById("task-list");
        const items = list.querySelectorAll(".task-item");
        if (items.length === 1) currentPage--;
      }
      loadTasks();
    }
  } catch (err) {
    alert("Failed to delete task.");
  }
}

//Filters & Pagination
function setFilter(value) {
  currentFilter = value;
  currentPage = 1;
  updateFilterButtons(value);
  loadTasks();
}

function updateFilterButtons(value) {
  document.getElementById("filter-all").classList.toggle("active", value === "");
  document.getElementById("filter-pending").classList.toggle("active", value === "false");
  document.getElementById("filter-done").classList.toggle("active", value === "true");
}

function changePage(dir) {
  const newPage = currentPage + dir;
  if (newPage < 1 || newPage > totalPages) return;
  currentPage = newPage;
  loadTasks();
}

//Helpers
function escapeHtml(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
