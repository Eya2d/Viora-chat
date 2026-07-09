const state = {
  user: null,
  users: new Map(),
  messages: new Map(),
  events: null,
  mediaFile: null,
  activeChat: { type: "general", user: null },
  search: "",
  deviceId: getDeviceId()
};

const els = {
  authPage: document.querySelector("#authPage"),
  accountsPage: document.querySelector("#accountsPage"),
  chatPage: document.querySelector("#chatPage"),
  settingsPage: document.querySelector("#settingsPage"),
  accountLabel: document.querySelector("#accountLabel"),
  authNotice: document.querySelector("#authNotice"),
  settingsNotice: document.querySelector("#settingsNotice"),
  loginForm: document.querySelector("#loginForm"),
  registerForm: document.querySelector("#registerForm"),
  profileForm: document.querySelector("#profileForm"),
  logoutButton: document.querySelector("#logoutButton"),
  refreshButton: document.querySelector("#refreshButton"),
  menuButton: document.querySelector("#menuButton"),
  overflowMenu: document.querySelector("#overflowMenu"),
  searchInput: document.querySelector("#searchInput"),
  generalChatButton: document.querySelector("#generalChatButton"),
  usersList: document.querySelector("#usersList"),
  backToAccounts: document.querySelector("#backToAccounts"),
  backFromSettings: document.querySelector("#backFromSettings"),
  chatAvatar: document.querySelector("#chatAvatar"),
  chatTitle: document.querySelector("#chatTitle"),
  statusLine: document.querySelector("#statusLine"),
  settingsAvatar: document.querySelector("#settingsAvatar"),
  settingsName: document.querySelector("#settingsName"),
  settingsUsername: document.querySelector("#settingsUsername"),
  themeToggle: document.querySelector("#themeToggle"),
  messages: document.querySelector("#messages"),
  composer: document.querySelector("#composer"),
  messageInput: document.querySelector("#messageInput"),
  mediaInput: document.querySelector("#mediaInput"),
  attachButton: document.querySelector("#attachButton"),
  mediaPreview: document.querySelector("#mediaPreview"),
  toast: document.querySelector("#toast")
};

applyTheme(localStorage.getItem("vioraTheme") || "light");

function getDeviceId() {
  const existing = localStorage.getItem("vioraDeviceId");
  if (existing) return existing;
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const id = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  localStorage.setItem("vioraDeviceId", id);
  return id;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: options.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "حدث خطأ غير متوقع.");
  return payload;
}

function showPage(name) {
  els.authPage.classList.toggle("hidden", name !== "auth");
  els.accountsPage.classList.toggle("hidden", name !== "accounts");
  els.chatPage.classList.toggle("hidden", name !== "chat");
  els.settingsPage.classList.toggle("hidden", name !== "settings");
  els.overflowMenu.classList.add("hidden");
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.remove("hidden");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.add("hidden"), 3200);
}

function setNotice(node, message, isError = false) {
  node.textContent = message;
  node.classList.toggle("error", isError);
}

function setAuthenticated(user) {
  state.user = user;
  if (!user) {
    state.users.clear();
    state.messages.clear();
    if (state.events) state.events.close();
    renderUsers();
    showPage("auth");
    return;
  }

  els.accountLabel.textContent = `@${user.username}`;
  els.settingsName.textContent = user.name;
  els.settingsUsername.textContent = `@${user.username}`;
  els.settingsAvatar.textContent = initials(user.name);
  fillProfileForm(user);
  startEvents();
  showPage("accounts");
}

function fillProfileForm(user) {
  els.profileForm.name.value = user.name || "";
  els.profileForm.username.value = user.username || "";
  els.profileForm.email.value = user.email || "";
  els.profileForm.about.value = user.about || "متاح";
  els.profileForm.password.value = "";
  els.profileForm.newPassword.value = "";
}

function switchAuthTab(tab) {
  document.querySelectorAll("[data-auth-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.authTab === tab);
  });
  els.loginForm.classList.toggle("hidden", tab !== "login");
  els.registerForm.classList.toggle("hidden", tab !== "register");
  setNotice(els.authNotice, "حساب واحد لكل بريد، اسم مستخدم، وجهاز.");
}

function setUsers(users) {
  state.users.clear();
  users.forEach((user) => state.users.set(user.id, user));
  renderUsers();
}

function addOrUpdateUser(user) {
  if (!state.user || user.id === state.user.id) {
    if (state.user && user.id === state.user.id) {
      state.user = user;
      setAuthenticated(user);
    }
    return;
  }
  state.users.set(user.id, user);
  if (state.activeChat.user?.id === user.id) {
    state.activeChat.user = user;
    updateChatHeader();
  }
  renderUsers();
}

function renderUsers() {
  els.usersList.textContent = "";
  if (!state.user) return;

  const query = normalizeForSearch(state.search);
  const users = Array.from(state.users.values())
    .filter((user) => {
      const haystack = normalizeForSearch(`${user.name} ${user.username} ${user.about || ""}`);
      return !query || haystack.includes(query);
    })
    .sort((a, b) => a.name.localeCompare(b.name, "ar"));

  if (!users.length) {
    const empty = document.createElement("p");
    empty.className = "empty-users";
    empty.textContent = state.search ? "لا توجد نتائج مطابقة" : "لا توجد حسابات أخرى بعد";
    els.usersList.appendChild(empty);
    return;
  }

  users.forEach((user) => {
    const row = document.createElement("button");
    row.className = "chat-row user-row";
    row.type = "button";
    row.innerHTML = `
      <span class="avatar">${escapeHtml(initials(user.name))}</span>
      <span>
        <strong>${escapeHtml(user.name)}</strong>
        <small>@${escapeHtml(user.username)} · ${escapeHtml(user.about || "متاح")}</small>
      </span>
      <em>خاص</em>
    `;
    row.addEventListener("click", () => openChat("direct", user));
    els.usersList.appendChild(row);
  });
}

async function openChat(type, user = null) {
  state.activeChat = { type, user };
  updateChatHeader();
  showPage("chat");
  await loadMessages();
}

function updateChatHeader() {
  if (state.activeChat.type === "general") {
    els.chatAvatar.textContent = "ع";
    els.chatAvatar.classList.add("group");
    els.chatTitle.textContent = "المحادثة العامة";
    els.statusLine.textContent = "كل المستخدمين";
    return;
  }
  const user = state.activeChat.user;
  els.chatAvatar.textContent = initials(user.name);
  els.chatAvatar.classList.remove("group");
  els.chatTitle.textContent = user.name;
  els.statusLine.textContent = `@${user.username} · ${user.about || "متاح"}`;
}

function addMessage(message) {
  if (!messageBelongsToActiveChat(message) || state.messages.has(message.id)) return;
  state.messages.set(message.id, message);
  const node = document.createElement("article");
  node.className = `message${message.mine || message.userId === state.user?.id ? " mine" : ""}`;
  node.innerHTML = `
    <div class="meta">
      <span>${escapeHtml(message.author || "مستخدم")}</span>
      <span>@${escapeHtml(message.username || "")}</span>
    </div>
    <div class="body"></div>
    <time>${formatTime(message.createdAt)}</time>
  `;
  const body = node.querySelector(".body");
  if (message.media) body.appendChild(renderMedia(message.media));
  if (message.text) {
    const text = document.createElement("p");
    text.textContent = message.text;
    body.appendChild(text);
  }
  els.messages.appendChild(node);
  els.messages.scrollTop = els.messages.scrollHeight;
}

function messageBelongsToActiveChat(message) {
  if (state.activeChat.type === "general") return (message.conversationId || "general") === "general";
  const otherId = state.activeChat.user?.id;
  return message.conversationId === directConversationId(state.user.id, otherId);
}

function directConversationId(userA, userB) {
  return `direct:${[userA, userB].sort().join(":")}`;
}

function renderMedia(media) {
  const wrapper = document.createElement("div");
  let mediaNode;
  if (media.type === "image") {
    mediaNode = document.createElement("img");
    mediaNode.alt = media.name || "صورة";
  } else if (media.type === "video") {
    mediaNode = document.createElement("video");
    mediaNode.controls = true;
  } else {
    mediaNode = document.createElement("audio");
    mediaNode.controls = true;
  }
  mediaNode.src = media.url;
  wrapper.appendChild(mediaNode);
  const name = document.createElement("span");
  name.className = "media-name";
  name.textContent = `${media.name || "ملف"} · ${formatSize(media.size)}`;
  wrapper.appendChild(name);
  return wrapper;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function normalizeForSearch(value) {
  return String(value || "").trim().toLowerCase();
}

function formatTime(value) {
  return new Intl.DateTimeFormat("ar", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function initials(name) {
  const parts = String(name || "U").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
}

function currentRecipientId() {
  return state.activeChat.type === "direct" ? state.activeChat.user.id : "";
}

async function loadMe() {
  const { user } = await api("/api/me");
  setAuthenticated(user);
  if (user) await loadUsers();
}

async function loadUsers() {
  const { users } = await api("/api/users");
  setUsers(users);
}

async function loadMessages() {
  const recipientId = currentRecipientId();
  const path = recipientId ? `/api/messages?with=${encodeURIComponent(recipientId)}` : "/api/messages";
  const { messages } = await api(path);
  els.messages.textContent = "";
  state.messages.clear();
  messages.forEach(addMessage);
}

function startEvents() {
  if (state.events) state.events.close();
  state.events = new EventSource("/api/events");
  state.events.addEventListener("message", (event) => {
    addMessage(JSON.parse(event.data));
  });
  state.events.addEventListener("user", (event) => {
    addOrUpdateUser(JSON.parse(event.data));
  });
  state.events.addEventListener("userUpdate", (event) => {
    addOrUpdateUser(JSON.parse(event.data));
  });
  state.events.onerror = () => {
    if (!els.chatPage.classList.contains("hidden")) els.statusLine.textContent = "يعيد الاتصال...";
  };
  state.events.addEventListener("ready", () => updateChatHeader());
}

async function submitText(text) {
  const { message } = await api("/api/messages", {
    method: "POST",
    body: JSON.stringify({ text, recipientId: currentRecipientId() })
  });
  addMessage(message);
}

async function submitMedia(caption) {
  const formData = new FormData();
  formData.append("media", state.mediaFile);
  formData.append("caption", caption);
  formData.append("recipientId", currentRecipientId());
  const { message } = await api("/api/upload", {
    method: "POST",
    body: formData
  });
  addMessage(message);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("vioraTheme", theme);
  if (els.themeToggle) els.themeToggle.checked = theme === "dark";
}

document.querySelectorAll("[data-auth-tab]").forEach((button) => {
  button.addEventListener("click", () => switchAuthTab(button.dataset.authTab));
});

document.querySelectorAll("[data-open-settings]").forEach((button) => {
  button.addEventListener("click", () => {
    fillProfileForm(state.user);
    showPage("settings");
  });
});

els.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = Object.fromEntries(new FormData(els.loginForm));
    const { user } = await api("/api/login", { method: "POST", body: JSON.stringify(data) });
    setAuthenticated(user);
    await loadUsers();
    showToast("تم تسجيل الدخول.");
  } catch (error) {
    setNotice(els.authNotice, error.message, true);
  }
});

els.registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = Object.fromEntries(new FormData(els.registerForm));
    data.deviceId = state.deviceId;
    const { user } = await api("/api/register", { method: "POST", body: JSON.stringify(data) });
    setAuthenticated(user);
    await loadUsers();
    showToast("تم إنشاء الحساب.");
  } catch (error) {
    setNotice(els.authNotice, error.message, true);
  }
});

els.profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = Object.fromEntries(new FormData(els.profileForm));
    const { user } = await api("/api/profile", { method: "POST", body: JSON.stringify(data) });
    state.user = user;
    setAuthenticated(user);
    await loadUsers();
    setNotice(els.settingsNotice, "تم حفظ التعديلات بنجاح.");
    showToast("تم تحديث الحساب.");
    showPage("accounts");
  } catch (error) {
    setNotice(els.settingsNotice, error.message, true);
  }
});

els.logoutButton.addEventListener("click", async () => {
  await api("/api/logout", { method: "POST", body: JSON.stringify({}) });
  setAuthenticated(null);
  showToast("تم تسجيل الخروج.");
});

els.menuButton.addEventListener("click", () => {
  els.overflowMenu.classList.toggle("hidden");
});

document.addEventListener("click", (event) => {
  if (!els.overflowMenu.contains(event.target) && !els.menuButton.contains(event.target)) {
    els.overflowMenu.classList.add("hidden");
  }
});

els.refreshButton.addEventListener("click", async () => {
  await loadUsers();
  showToast("تم تحديث الحسابات.");
});

els.searchInput.addEventListener("input", () => {
  state.search = els.searchInput.value;
  renderUsers();
});

els.generalChatButton.addEventListener("click", () => openChat("general"));
els.backToAccounts.addEventListener("click", () => showPage("accounts"));
els.backFromSettings.addEventListener("click", () => showPage("accounts"));
els.themeToggle.addEventListener("change", () => applyTheme(els.themeToggle.checked ? "dark" : "light"));

els.attachButton.addEventListener("click", () => els.mediaInput.click());

els.mediaInput.addEventListener("change", () => {
  state.mediaFile = els.mediaInput.files[0] || null;
  if (!state.mediaFile) {
    els.mediaPreview.classList.add("hidden");
    els.mediaPreview.textContent = "";
    return;
  }
  els.mediaPreview.innerHTML = `
    <span>${escapeHtml(state.mediaFile.name)} · ${formatSize(state.mediaFile.size)}</span>
    <button type="button" aria-label="إزالة الملف">إزالة</button>
  `;
  els.mediaPreview.querySelector("button").addEventListener("click", () => {
    state.mediaFile = null;
    els.mediaInput.value = "";
    els.mediaPreview.classList.add("hidden");
    els.mediaPreview.textContent = "";
  });
  els.mediaPreview.classList.remove("hidden");
});

els.messageInput.addEventListener("input", () => {
  els.messageInput.style.height = "auto";
  els.messageInput.style.height = `${Math.min(120, els.messageInput.scrollHeight)}px`;
});

els.composer.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.user) return showToast("سجّل الدخول أولًا.");
  const text = els.messageInput.value.trim();
  if (!text && !state.mediaFile) return;
  els.composer.querySelector(".send-button").disabled = true;
  try {
    if (state.mediaFile) await submitMedia(text);
    else await submitText(text);
    els.messageInput.value = "";
    els.messageInput.style.height = "auto";
    state.mediaFile = null;
    els.mediaInput.value = "";
    els.mediaPreview.classList.add("hidden");
    els.mediaPreview.textContent = "";
  } catch (error) {
    showToast(error.message);
  } finally {
    els.composer.querySelector(".send-button").disabled = false;
  }
});

loadMe().catch(() => setAuthenticated(null));
