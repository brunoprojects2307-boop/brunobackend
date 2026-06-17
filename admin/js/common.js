const apiBase = "/api/admin";

async function api(path, options = {}) {
  const headers = {};
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${apiBase}${path}`, {
    credentials: "include",
    headers,
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

function setMessage(element, text, type = "") {
  if (!element) {
    return;
  }
  element.textContent = text;
  element.className = `message ${type}`.trim();
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toDateTimeIso(value) {
  if (!value) {
    return null;
  }
  return new Date(value).toISOString();
}

async function ensureSession() {
  try {
    const me = await api("/me", { method: "GET" });
    const adminIdentity = document.getElementById("adminIdentity");
    if (adminIdentity) {
      adminIdentity.textContent = `Signed in as ${me.email}`;
    }
    return me;
  } catch (error) {
    globalThis.location.href = "./index.html";
    throw error;
  }
}

function bindLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) {
    return;
  }

  logoutBtn.addEventListener("click", async () => {
    await api("/logout", { method: "POST" });
    globalThis.location.href = "./index.html";
  });
}

function bindAdminMenu() {
  const menuBtn = document.getElementById("adminMenuToggle");
  const dashboard = document.querySelector(".dashboard");
  const sidebar = document.getElementById("adminSidebar") || document.querySelector(".sidebar");

  if (!menuBtn || !dashboard || !sidebar) {
    return;
  }

  const closeMenu = () => {
    dashboard.classList.remove("menu-open");
    document.body.classList.remove("admin-menu-open");
    menuBtn.setAttribute("aria-expanded", "false");
  };

  menuBtn.addEventListener("click", () => {
    const willOpen = !dashboard.classList.contains("menu-open");
    dashboard.classList.toggle("menu-open", willOpen);
    document.body.classList.toggle("admin-menu-open", willOpen);
    menuBtn.setAttribute("aria-expanded", String(willOpen));
  });

  sidebar.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  globalThis.addEventListener("resize", () => {
    if (globalThis.innerWidth > 820) {
      closeMenu();
    }
  });
}

globalThis.adminCommon = {
  api,
  setMessage,
  toNumber,
  toDateTimeIso,
  ensureSession,
  bindLogout,
  bindAdminMenu
};
