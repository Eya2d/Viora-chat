const state = {
  user: null,
  messages: new Map(),
  events: null,
  mediaFile: null,
  deviceId: getDeviceId()
};

const els = {
  accountLabel: document.querySelector("#accountLabel"),
  authPanel: document.querySelector("#authPanel"),
  authNotice: document.querySelector("#authNotice"),
  loginForm: document.querySelector("#loginForm"),
  registerForm: document.querySelector("#registerForm"),
  logoutButton: document.querySelector("#logoutButton"),
  statusLine: document.querySelector("#statusLine"),
  messages: document.querySelector("#messages"),
  composer: document.querySelector("#composer"),
  messageInput: document.querySelector("#messageInput"),
  mediaInput: document.querySelector("#mediaInput"),
  attachButton: document.querySelector("#attachButton"),
  mediaPreview: document.querySelector("#mediaPreview"),
  toast: document.querySelector("#toast")
};

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

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.remove("hidden");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.add("hidden"), 3200);
}

function setNotice(message, isError = false) {
  els.authNotice.textContent = message;
  els.authNotice.classList.toggle("error", isError);
}

function setAuthenticated(user) {
  state.user = user;
  els.accountLabel.textContent = user ? `@${user.username}` : "غير متصل";
  els.statusLine.textContent = user ? "متصل الآن" : "سجّل الدخول لإرسال الرسائل";
  els.authPanel.classList.toggle("hidden", Boolean(user));
  els.logoutButton.classList.toggle("hidden", !user);
  els.composer.toggleAttribute("aria-disabled", !user);
  els.messageInput.disabled = !user;
  els.attachButton.disabled = !user;
  els.composer.querySelector(".send-button").disabled = !user;
  if (user) startEvents();
}

function switchAuthTab(tab) {
  document.querySelectorAll("[data-auth-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.authTab === tab);
  });
  els.loginForm.classList.toggle("hidden", tab !== "login");
  els.registerForm.classList.toggle("hidden", tab !== "register");
  setNotice("يُسمح بحساب واحد لكل بريد، اسم مستخدم، وجهاز.");
}

function addMessage(message) {
  if (state.messages.has(message.id)) return;
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

function formatTime(value) {
  return new Intl.DateTimeFormat("ar", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function loadMe() {
  const { user } = await api("/api/me");
  setAuthenticated(user);
  if (user) await loadMessages();
}

async function loadMessages() {
  const { messages } = await api("/api/messages");
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
  state.events.onerror = () => {
    els.statusLine.textContent = "يعيد الاتصال...";
  };
  state.events.addEventListener("ready", () => {
    els.statusLine.textContent = "متصل الآن";
  });
}

async function submitText(text) {
  const { message } = await api("/api/messages", {
    method: "POST",
    body: JSON.stringify({ text })
  });
  addMessage(message);
}

async function submitMedia(caption) {
  const formData = new FormData();
  formData.append("media", state.mediaFile);
  formData.append("caption", caption);
  const { message } = await api("/api/upload", {
    method: "POST",
    body: formData
  });
  addMessage(message);
}

document.querySelectorAll("[data-auth-tab]").forEach((button) => {
  button.addEventListener("click", () => switchAuthTab(button.dataset.authTab));
});

els.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = Object.fromEntries(new FormData(els.loginForm));
    const { user } = await api("/api/login", { method: "POST", body: JSON.stringify(data) });
    setAuthenticated(user);
    await loadMessages();
    showToast("تم تسجيل الدخول.");
  } catch (error) {
    setNotice(error.message, true);
  }
});

els.registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = Object.fromEntries(new FormData(els.registerForm));
    data.deviceId = state.deviceId;
    const { user } = await api("/api/register", { method: "POST", body: JSON.stringify(data) });
    setAuthenticated(user);
    await loadMessages();
    showToast("تم إنشاء الحساب.");
  } catch (error) {
    setNotice(error.message, true);
  }
});

els.logoutButton.addEventListener("click", async () => {
  await api("/api/logout", { method: "POST", body: JSON.stringify({}) });
  if (state.events) state.events.close();
  setAuthenticated(null);
  showToast("تم تسجيل الخروج.");
});

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
