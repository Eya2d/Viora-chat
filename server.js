const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, "data"));
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || (process.env.DATA_DIR ? path.join(DATA_DIR, "uploads") : path.join(PUBLIC_DIR, "uploads")));
const DB_FILE = path.join(DATA_DIR, "db.json");
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const SESSION_DAYS = 30;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
};

const allowedAttachments = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

let db = { users: [], sessions: [], messages: [], calls: [] };
const clients = new Set();

function ensureStorage() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  }
  db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  if (!Array.isArray(db.calls)) db.calls = [];
}

function saveDb() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function getBody(req, limit = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > limit) {
        reject(Object.assign(new Error("Payload too large"), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((item) => item.trim().split("="))
      .filter(([key]) => key)
      .map(([key, ...value]) => [key, decodeURIComponent(value.join("="))])
  );
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const candidate = hashPassword(password, salt).split(":")[1];
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    about: user.about || "متاح",
    avatar: user.avatar || "",
    createdAt: user.createdAt
  };
}

function listUsersFor(currentUserId) {
  return db.users
    .filter((user) => user.id !== currentUserId)
    .map(publicUser)
    .sort((a, b) => a.name.localeCompare(b.name, "ar"));
}

function userHasDevice(user, deviceId) {
  return user.deviceId === deviceId || (Array.isArray(user.deviceIds) && user.deviceIds.includes(deviceId));
}

function rememberDevice(user, deviceId) {
  if (!deviceId || deviceId.length < 16) return;
  if (!Array.isArray(user.deviceIds)) user.deviceIds = [];
  if (user.deviceId && !user.deviceIds.includes(user.deviceId)) user.deviceIds.push(user.deviceId);
  if (!user.deviceIds.includes(deviceId)) user.deviceIds.push(deviceId);
}

function getSession(req) {
  const token = parseCookies(req.headers.cookie).session;
  if (!token) return null;
  const now = Date.now();
  const session = db.sessions.find((item) => item.token === token && item.expiresAt > now);
  if (!session) return null;
  const user = db.users.find((item) => item.id === session.userId);
  return user ? { session, user } : null;
}

function requireAuth(req, res) {
  const auth = getSession(req);
  if (!auth) {
    json(res, 401, { error: "يجب تسجيل الدخول أولًا." });
    return null;
  }
  return auth;
}

function setSessionCookie(res, token) {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  res.setHeader("Set-Cookie", `session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`);
}

function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  db.sessions.push({ token, userId, expiresAt: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000 });
  return token;
}

function createRememberToken(user) {
  const token = crypto.randomBytes(32).toString("hex");
  user.rememberTokenHash = hashToken(token);
  user.rememberedAt = new Date().toISOString();
  return token;
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function broadcast(event, payload) {
  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of clients) {
    res.write(message);
  }
}

function sanitizeFileName(name) {
  return path.basename(String(name || "upload")).replace(/[^\w.\-]+/g, "_").slice(0, 80);
}

function inferMime(filename, fallback) {
  if (fallback && fallback !== "application/octet-stream") return fallback.split(";")[0].trim();
  const ext = path.extname(filename || "").toLowerCase();
  const inferred = MIME_TYPES[ext];
  return inferred ? inferred.split(";")[0] : fallback;
}

function normalizeMime(type) {
  return String(type || "").split(";")[0].trim().toLowerCase();
}

function storeUploadedFile(file) {
  const extension = path.extname(file.filename) || `.${file.type.split("/")[1] || "bin"}`;
  const storedName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}-${sanitizeFileName(file.filename || `upload${extension}`)}`;
  const diskPath = path.join(UPLOAD_DIR, storedName);
  fs.writeFileSync(diskPath, file.content);
  return {
    name: sanitizeFileName(file.filename),
    url: `/uploads/${storedName}`,
    size: file.content.length
  };
}

function parseMultipart(buffer, contentType) {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || "");
  if (!boundaryMatch) throw Object.assign(new Error("Missing multipart boundary"), { status: 400 });
  const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`);
  const fields = {};
  const files = [];
  let start = buffer.indexOf(boundary);
  while (start !== -1) {
    let next = buffer.indexOf(boundary, start + boundary.length);
    if (next === -1) break;
    let part = buffer.slice(start + boundary.length + 2, next - 2);
    start = next;
    if (!part.length || part.equals(Buffer.from("--"))) continue;
    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd === -1) continue;
    const rawHeaders = part.slice(0, headerEnd).toString("utf8");
    const content = part.slice(headerEnd + 4);
    const disposition = /content-disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]*)")?/i.exec(rawHeaders);
    if (!disposition) continue;
    const name = disposition[1];
    const filename = disposition[2];
    const typeMatch = /content-type:\s*([^\r\n]+)/i.exec(rawHeaders);
    if (filename) {
      const rawType = (typeMatch && typeMatch[1].trim()) || "application/octet-stream";
      files.push({ name, filename, type: inferMime(filename, rawType), content });
    } else {
      fields[name] = content.toString("utf8");
    }
  }
  return { fields, files };
}

async function register(req, res) {
  const payload = JSON.parse((await getBody(req)).toString("utf8") || "{}");
  const name = String(payload.name || "").trim();
  const username = normalize(payload.username).replace(/[^a-z0-9_.-]/g, "");
  const email = normalize(payload.email);
  const password = String(payload.password || "");
  const deviceId = String(payload.deviceId || "").trim();

  if (name.length < 2 || username.length < 3 || !email.includes("@") || password.length < 6) {
    return json(res, 400, { error: "أدخل اسمًا، اسم مستخدم 3 أحرف على الأقل، بريدًا صحيحًا، وكلمة مرور 6 أحرف على الأقل." });
  }
  if (!deviceId || deviceId.length < 16) {
    return json(res, 400, { error: "تعذر التحقق من الجهاز. أعد تحميل الصفحة وحاول مرة أخرى." });
  }
  if (db.users.some((user) => user.username === username)) {
    return json(res, 409, { error: "اسم المستخدم مستخدم بالفعل." });
  }
  if (db.users.some((user) => user.email === email)) {
    return json(res, 409, { error: "هذا البريد لديه حساب بالفعل." });
  }
  if (db.users.some((user) => userHasDevice(user, deviceId))) {
    return json(res, 409, { error: "لا يمكن إنشاء أكثر من حساب من نفس الجهاز." });
  }

  const user = {
    id: crypto.randomUUID(),
    name,
    username,
    email,
    deviceId,
    deviceIds: [deviceId],
    passwordHash: hashPassword(password),
    avatar: "",
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  const token = createSession(user.id);
  const rememberToken = createRememberToken(user);
  saveDb();
  broadcast("user", publicUser(user));
  setSessionCookie(res, token);
  json(res, 201, { user: publicUser(user), rememberToken });
}

async function login(req, res) {
  const payload = JSON.parse((await getBody(req)).toString("utf8") || "{}");
  const identifier = normalize(payload.identifier);
  const password = String(payload.password || "");
  const deviceId = String(payload.deviceId || "").trim();
  const user = db.users.find((item) => item.email === identifier || item.username === identifier);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return json(res, 401, { error: "بيانات الدخول غير صحيحة." });
  }
  rememberDevice(user, deviceId);
  const token = createSession(user.id);
  const rememberToken = createRememberToken(user);
  saveDb();
  setSessionCookie(res, token);
  json(res, 200, { user: publicUser(user), rememberToken });
}

async function rememberLogin(req, res) {
  const payload = JSON.parse((await getBody(req)).toString("utf8") || "{}");
  const userId = String(payload.userId || "");
  const rememberToken = String(payload.rememberToken || "");
  const user = db.users.find((item) => item.id === userId);
  if (!user || !rememberToken || user.rememberTokenHash !== hashToken(rememberToken)) {
    return json(res, 401, { error: "تعذر استرجاع الجلسة." });
  }
  const token = createSession(user.id);
  saveDb();
  setSessionCookie(res, token);
  json(res, 200, { user: publicUser(user) });
}

async function deviceLogin(req, res) {
  const payload = JSON.parse((await getBody(req)).toString("utf8") || "{}");
  const deviceId = String(payload.deviceId || "").trim();
  if (!deviceId || deviceId.length < 16) {
    return json(res, 400, { error: "تعذر التحقق من الجهاز." });
  }
  const user = db.users.find((item) => userHasDevice(item, deviceId));
  if (!user) return json(res, 404, { error: "لا يوجد حساب محفوظ لهذا الجهاز." });
  const token = createSession(user.id);
  const rememberToken = createRememberToken(user);
  saveDb();
  setSessionCookie(res, token);
  json(res, 200, { user: publicUser(user), rememberToken });
}

function getMessages(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const recipientId = String(url.searchParams.get("with") || "");
  const conversationId = recipientId ? directConversationId(auth.user.id, recipientId) : "general";
  markConversationMessages(auth.user.id, conversationId, "deliveredAt");
  const messages = db.messages
    .filter((message) => (message.conversationId || "general") === conversationId)
    .filter((message) => !Array.isArray(message.hiddenFor) || !message.hiddenFor.includes(auth.user.id))
    .slice(-300)
    .map((message) => ({
    ...message,
    mine: message.userId === auth.user.id
  }));
  json(res, 200, { messages });
}

function getUsers(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;
  json(res, 200, { users: listUsersFor(auth.user.id) });
}

function directConversationId(userA, userB) {
  return `direct:${[userA, userB].sort().join(":")}`;
}

function canMessageUser(userId) {
  return db.users.some((user) => user.id === userId);
}

function callPayload(call, currentUserId = "") {
  const otherId = call.fromId === currentUserId ? call.toId : call.fromId;
  const other = db.users.find((user) => user.id === otherId);
  const from = db.users.find((user) => user.id === call.fromId);
  const to = db.users.find((user) => user.id === call.toId);
  return {
    ...call,
    otherUser: other ? publicUser(other) : null,
    fromUser: from ? publicUser(from) : null,
    toUser: to ? publicUser(to) : null
  };
}

function findCallForUser(callId, userId) {
  return db.calls.find((call) => call.id === callId && (call.fromId === userId || call.toId === userId));
}

async function getCalls(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const calls = db.calls
    .filter((call) => call.fromId === auth.user.id || call.toId === auth.user.id)
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
    .slice(0, 80)
    .map((call) => callPayload(call, auth.user.id));
  json(res, 200, { calls });
}

async function startCall(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const payload = JSON.parse((await getBody(req)).toString("utf8") || "{}");
  const recipientId = String(payload.recipientId || "");
  if (!recipientId || recipientId === auth.user.id || !canMessageUser(recipientId)) {
    return json(res, 400, { error: "اختر حسابًا صحيحًا للاتصال." });
  }
  const call = {
    id: crypto.randomUUID(),
    fromId: auth.user.id,
    toId: recipientId,
    type: "voice",
    status: "ringing",
    startedAt: new Date().toISOString(),
    answeredAt: null,
    endedAt: null
  };
  db.calls.push(call);
  saveDb();
  broadcast("call", { type: "incoming", call: callPayload(call) });
  json(res, 201, { call: callPayload(call, auth.user.id) });
}

async function updateCall(req, res, callId) {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const call = findCallForUser(callId, auth.user.id);
  if (!call) return json(res, 404, { error: "المكالمة غير موجودة." });
  const payload = JSON.parse((await getBody(req)).toString("utf8") || "{}");
  const action = String(payload.action || "");
  const otherId = call.fromId === auth.user.id ? call.toId : call.fromId;
  if (action === "signal") {
    broadcast("callSignal", {
      callId: call.id,
      fromId: auth.user.id,
      toId: otherId,
      signal: payload.signal || null
    });
    return json(res, 200, { ok: true });
  }
  if (action === "accept") {
    call.status = "active";
    call.answeredAt = call.answeredAt || new Date().toISOString();
  } else if (action === "reject") {
    call.status = "rejected";
    call.endedAt = call.endedAt || new Date().toISOString();
  } else if (action === "end") {
    call.status = call.answeredAt ? "ended" : "missed";
    call.endedAt = call.endedAt || new Date().toISOString();
  } else {
    return json(res, 400, { error: "إجراء المكالمة غير صحيح." });
  }
  saveDb();
  const payloadCall = callPayload(call);
  broadcast("callUpdate", { action, call: payloadCall });
  json(res, 200, { call: callPayload(call, auth.user.id) });
}

function findMessage(messageId) {
  return db.messages.find((message) => message.id === messageId);
}

function canReadMessage(userId, message) {
  if (!message) return false;
  if ((message.conversationId || "general") === "general") return true;
  return message.userId === userId || message.recipientId === userId;
}

function canEditMessage(userId, message) {
  if (!message || message.userId !== userId || message.deletedAt) return false;
  if (message.media?.type === "video") return false;
  const createdAt = new Date(message.createdAt).getTime();
  return Number.isFinite(createdAt) && Date.now() - createdAt <= 5 * 60 * 1000;
}

function messageStatusPayload(message) {
  return {
    id: message.id,
    userId: message.userId,
    recipientId: message.recipientId || null,
    conversationId: message.conversationId || "general",
    deliveredAt: message.deliveredAt || null,
    readAt: message.readAt || null
  };
}

function markConversationMessages(userId, conversationId, field) {
  const now = new Date().toISOString();
  const changed = [];
  db.messages.forEach((message) => {
    if ((message.conversationId || "general") !== conversationId) return;
    if (message.userId === userId) return;
    if (message.recipientId && message.recipientId !== userId) return;
    if (Array.isArray(message.hiddenFor) && message.hiddenFor.includes(userId)) return;
    if (field === "readAt" && !message.deliveredAt) message.deliveredAt = now;
    if (message[field]) return;
    message[field] = now;
    changed.push(message);
  });
  if (changed.length) {
    saveDb();
    changed.forEach((message) => broadcast("messageStatus", messageStatusPayload(message)));
  }
  return changed;
}

async function createMessage(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const payload = JSON.parse((await getBody(req)).toString("utf8") || "{}");
  const text = String(payload.text || "").trim();
  const recipientId = String(payload.recipientId || "");
  if (!text) return json(res, 400, { error: "اكتب رسالة أولًا." });
  if (recipientId && !canMessageUser(recipientId)) return json(res, 404, { error: "هذا الحساب غير موجود." });
  const message = {
    id: crypto.randomUUID(),
    userId: auth.user.id,
    recipientId: recipientId || null,
    conversationId: recipientId ? directConversationId(auth.user.id, recipientId) : "general",
    author: auth.user.name,
    username: auth.user.username,
    avatar: auth.user.avatar || "",
    text: text.slice(0, 2000),
    media: null,
    mediaGroup: null,
    createdAt: new Date().toISOString(),
    deliveredAt: null,
    readAt: null
  };
  db.messages.push(message);
  saveDb();
  broadcast("message", message);
  json(res, 201, { message: { ...message, mine: true } });
}

async function updateTyping(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const payload = JSON.parse((await getBody(req)).toString("utf8") || "{}");
  const recipientId = String(payload.recipientId || "");
  const kind = payload.kind === "upload" ? "upload" : "typing";
  const active = Boolean(payload.active);
  if (recipientId && !canMessageUser(recipientId)) return json(res, 404, { error: "هذا الحساب غير موجود." });
  broadcast("typing", {
    userId: auth.user.id,
    recipientId: recipientId || null,
    conversationId: recipientId ? directConversationId(auth.user.id, recipientId) : "general",
    name: auth.user.name,
    username: auth.user.username,
    kind,
    active,
    at: new Date().toISOString()
  });
  json(res, 200, { ok: true });
}

async function markRead(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const payload = JSON.parse((await getBody(req)).toString("utf8") || "{}");
  const recipientId = String(payload.recipientId || "");
  if (recipientId && !canMessageUser(recipientId)) return json(res, 404, { error: "هذا الحساب غير موجود." });
  const conversationId = recipientId ? directConversationId(auth.user.id, recipientId) : "general";
  const changed = markConversationMessages(auth.user.id, conversationId, "readAt");
  json(res, 200, { ok: true, updated: changed.length });
}

async function deleteMessage(req, res, messageId) {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const payload = JSON.parse((await getBody(req)).toString("utf8") || "{}");
  const mode = payload.mode === "everyone" ? "everyone" : "me";
  const message = findMessage(messageId);
  if (!message || !canReadMessage(auth.user.id, message)) return json(res, 404, { error: "الرسالة غير موجودة." });

  if (mode === "me") {
    message.hiddenFor = Array.isArray(message.hiddenFor) ? message.hiddenFor : [];
    if (!message.hiddenFor.includes(auth.user.id)) message.hiddenFor.push(auth.user.id);
    saveDb();
    return json(res, 200, { ok: true, mode });
  }

  if (message.userId !== auth.user.id) return json(res, 403, { error: "يمكنك حذف رسائلك فقط." });
  db.messages = db.messages.filter((item) => item.id !== messageId);
  saveDb();
  broadcast("messageDelete", { id: messageId, conversationId: message.conversationId || "general" });
  json(res, 200, { ok: true, mode });
}

async function clearConversation(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const payload = JSON.parse((await getBody(req)).toString("utf8") || "{}");
  const recipientId = String(payload.recipientId || "");
  if (recipientId && !canMessageUser(recipientId)) return json(res, 404, { error: "هذا الحساب غير موجود." });
  const conversationId = recipientId ? directConversationId(auth.user.id, recipientId) : "general";
  let hidden = 0;
  db.messages.forEach((message) => {
    if ((message.conversationId || "general") !== conversationId) return;
    message.hiddenFor = Array.isArray(message.hiddenFor) ? message.hiddenFor : [];
    if (!message.hiddenFor.includes(auth.user.id)) {
      message.hiddenFor.push(auth.user.id);
      hidden += 1;
    }
  });
  if (hidden) {
    saveDb();
  }
  json(res, 200, { ok: true, hidden });
}

async function editMessage(req, res, messageId) {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const message = findMessage(messageId);
  if (!message || !canReadMessage(auth.user.id, message)) return json(res, 404, { error: "الرسالة غير موجودة." });
  if (!canEditMessage(auth.user.id, message)) {
    return json(res, 403, { error: "يمكن تعديل الرسائل النصية خلال 5 دقائق فقط، ولا يمكن تعديل الفيديو." });
  }
  const payload = JSON.parse((await getBody(req)).toString("utf8") || "{}");
  const text = String(payload.text || "").trim();
  if (!text) return json(res, 400, { error: "اكتب نص الرسالة الجديد." });
  message.text = text.slice(0, 2000);
  message.editedAt = new Date().toISOString();
  saveDb();
  broadcast("messageUpdate", message);
  json(res, 200, { message: { ...message, mine: true } });
}

async function forwardMessage(req, res, messageId) {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const source = findMessage(messageId);
  if (!source || !canReadMessage(auth.user.id, source)) return json(res, 404, { error: "الرسالة غير موجودة." });
  const payload = JSON.parse((await getBody(req)).toString("utf8") || "{}");
  const recipientIds = Array.from(new Set(Array.isArray(payload.recipientIds) ? payload.recipientIds.map(String) : []))
    .filter((id) => id && id !== auth.user.id);
  if (!recipientIds.length) return json(res, 400, { error: "اختر حسابًا واحدًا على الأقل." });
  const missing = recipientIds.find((id) => !canMessageUser(id));
  if (missing) return json(res, 404, { error: "يوجد حساب غير متاح للمشاركة." });

  const created = recipientIds.map((recipientId) => ({
    id: crypto.randomUUID(),
    userId: auth.user.id,
    recipientId,
    conversationId: directConversationId(auth.user.id, recipientId),
    author: auth.user.name,
    username: auth.user.username,
    avatar: auth.user.avatar || "",
    text: source.text || "",
    media: source.media ? { ...source.media } : null,
    mediaGroup: Array.isArray(source.mediaGroup) ? source.mediaGroup.map((item) => ({ ...item })) : null,
    forwardedFrom: {
      id: source.id,
      author: source.author,
      username: source.username
    },
    createdAt: new Date().toISOString(),
    deliveredAt: null,
    readAt: null
  }));
  db.messages.push(...created);
  saveDb();
  created.forEach((message) => broadcast("message", message));
  json(res, 201, { messages: created.map((message) => ({ ...message, mine: true })) });
}

async function uploadMedia(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const buffer = await getBody(req, MAX_UPLOAD_BYTES);
  const { fields, files } = parseMultipart(buffer, req.headers["content-type"]);
  const file = files.find((item) => item.name === "media");
  const caption = String(fields.caption || "").trim().slice(0, 500);
  const recipientId = String(fields.recipientId || "");
  if (!file) return json(res, 400, { error: "اختر ملفًا للإرسال." });
  if (recipientId && !canMessageUser(recipientId)) return json(res, 404, { error: "هذا الحساب غير موجود." });
  const fileType = normalizeMime(file.type);
  if (!allowedAttachments.has(fileType)) return json(res, 400, { error: "يدعم الموقع الصور والفيديو والصوت وملفات PDF وTXT وWord فقط." });
  const storedFile = storeUploadedFile(file);
  const mediaType = fileType.startsWith("image/")
    ? "image"
    : fileType.startsWith("video/")
      ? "video"
      : fileType.startsWith("audio/")
        ? "audio"
        : "document";
  const message = {
    id: crypto.randomUUID(),
    userId: auth.user.id,
    recipientId: recipientId || null,
    conversationId: recipientId ? directConversationId(auth.user.id, recipientId) : "general",
    author: auth.user.name,
    username: auth.user.username,
    avatar: auth.user.avatar || "",
    text: caption,
    media: {
      type: mediaType,
      mime: fileType,
      name: storedFile.name,
      url: storedFile.url,
      size: storedFile.size
    },
    mediaGroup: null,
    createdAt: new Date().toISOString(),
    deliveredAt: null,
    readAt: null
  };
  db.messages.push(message);
  saveDb();
  broadcast("message", message);
  json(res, 201, { message: { ...message, mine: true } });
}

async function uploadMediaGroup(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const buffer = await getBody(req, MAX_UPLOAD_BYTES);
  const { fields, files } = parseMultipart(buffer, req.headers["content-type"]);
  const mediaFiles = files.filter((item) => item.name === "media");
  const caption = String(fields.caption || "").trim().slice(0, 500);
  const recipientId = String(fields.recipientId || "");
  if (!mediaFiles.length) return json(res, 400, { error: "اختر صورًا للإرسال." });
  if (mediaFiles.length > 10) return json(res, 400, { error: "لا يمكن إرسال أكثر من 10 عناصر في المرة الواحدة." });
  if (recipientId && !canMessageUser(recipientId)) return json(res, 404, { error: "هذا الحساب غير موجود." });

  const group = [];
  for (const file of mediaFiles) {
    const fileType = normalizeMime(file.type);
    if (!allowedAttachments.has(fileType) || !fileType.startsWith("image/")) {
      return json(res, 400, { error: "يمكن تجميع الصور فقط. أرسل الفيديوهات والملفات بشكل منفصل." });
    }
    const storedFile = storeUploadedFile(file);
    group.push({
      type: "image",
      mime: fileType,
      name: storedFile.name,
      url: storedFile.url,
      size: storedFile.size
    });
  }

  const message = {
    id: crypto.randomUUID(),
    userId: auth.user.id,
    recipientId: recipientId || null,
    conversationId: recipientId ? directConversationId(auth.user.id, recipientId) : "general",
    author: auth.user.name,
    username: auth.user.username,
    avatar: auth.user.avatar || "",
    text: caption,
    media: null,
    mediaGroup: group,
    createdAt: new Date().toISOString(),
    deliveredAt: null,
    readAt: null
  };
  db.messages.push(message);
  saveDb();
  broadcast("message", message);
  json(res, 201, { message: { ...message, mine: true } });
}

async function updateProfile(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const isMultipart = String(req.headers["content-type"] || "").includes("multipart/form-data");
  let payload = {};
  let avatarFile = null;
  if (isMultipart) {
    const buffer = await getBody(req, MAX_UPLOAD_BYTES);
    const parsed = parseMultipart(buffer, req.headers["content-type"]);
    payload = parsed.fields;
    avatarFile = parsed.files.find((file) => file.name === "avatar") || null;
  } else {
    payload = JSON.parse((await getBody(req)).toString("utf8") || "{}");
  }
  const password = String(payload.password || "");
  if (!verifyPassword(password, auth.user.passwordHash)) {
    return json(res, 401, { error: "كلمة المرور غير صحيحة." });
  }

  const name = String(payload.name || "").trim();
  const username = normalize(payload.username).replace(/[^a-z0-9_.-]/g, "");
  const email = normalize(payload.email);
  const about = String(payload.about || "متاح").trim().slice(0, 120);
  const newPassword = String(payload.newPassword || "");

  if (name.length < 2 || username.length < 3 || !email.includes("@")) {
    return json(res, 400, { error: "أدخل اسمًا صحيحًا، اسم مستخدم 3 أحرف على الأقل، وبريدًا صحيحًا." });
  }
  if (newPassword && newPassword.length < 6) {
    return json(res, 400, { error: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل." });
  }
  if (db.users.some((user) => user.id !== auth.user.id && user.username === username)) {
    return json(res, 409, { error: "اسم المستخدم مستخدم بالفعل." });
  }
  if (db.users.some((user) => user.id !== auth.user.id && user.email === email)) {
    return json(res, 409, { error: "هذا البريد لديه حساب بالفعل." });
  }

  auth.user.name = name;
  auth.user.username = username;
  auth.user.email = email;
  auth.user.about = about || "متاح";
  auth.user.updatedAt = new Date().toISOString();
  if (newPassword) auth.user.passwordHash = hashPassword(newPassword);
  if (avatarFile && avatarFile.content.length) {
    if (!avatarFile.type.startsWith("image/")) {
      return json(res, 400, { error: "صورة الحساب يجب أن تكون ملف صورة فقط." });
    }
    auth.user.avatar = storeUploadedFile(avatarFile).url;
  }

  db.messages.forEach((message) => {
    if (message.userId === auth.user.id) {
      message.author = auth.user.name;
      message.username = auth.user.username;
      message.avatar = auth.user.avatar || "";
    }
  });
  saveDb();
  broadcast("userUpdate", publicUser(auth.user));
  json(res, 200, { user: publicUser(auth.user) });
}

function stream(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive"
  });
  res.write(`event: ready\ndata: ${JSON.stringify({ ok: true })}\n\n`);
  clients.add(res);
  req.on("close", () => clients.delete(res));
}

function logout(req, res) {
  const token = parseCookies(req.headers.cookie).session;
  if (token) db.sessions = db.sessions.filter((item) => item.token !== token);
  saveDb();
  res.setHeader("Set-Cookie", "session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
  json(res, 200, { ok: true });
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";

  if (pathname.startsWith("/uploads/")) {
    const uploadPath = path.normalize(path.join(UPLOAD_DIR, pathname.replace(/^\/uploads\//, "")));
    const publicUploadPath = path.normalize(path.join(PUBLIC_DIR, pathname));
    const candidates = uploadPath.startsWith(UPLOAD_DIR) ? [uploadPath] : [];
    if (publicUploadPath.startsWith(path.join(PUBLIC_DIR, "uploads"))) candidates.push(publicUploadPath);

    const existing = candidates.find((candidate) => fs.existsSync(candidate));
    if (!existing) return json(res, 404, { error: "File not found" });
    const ext = path.extname(existing).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    fs.createReadStream(existing).pipe(res);
    return;
  }

  const filePath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!filePath.startsWith(PUBLIC_DIR)) return json(res, 403, { error: "Forbidden" });
  fs.readFile(filePath, (error, content) => {
    if (error) {
      fs.readFile(path.join(PUBLIC_DIR, "index.html"), (fallbackError, fallback) => {
        if (fallbackError) return json(res, 404, { error: "Not found" });
        res.writeHead(200, { "Content-Type": MIME_TYPES[".html"] });
        res.end(fallback);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(content);
  });
}

ensureStorage();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === "POST" && url.pathname === "/api/register") return register(req, res);
    if (req.method === "POST" && url.pathname === "/api/login") return login(req, res);
    if (req.method === "POST" && url.pathname === "/api/remember") return rememberLogin(req, res);
    if (req.method === "POST" && url.pathname === "/api/device-login") return deviceLogin(req, res);
    if (req.method === "POST" && url.pathname === "/api/logout") return logout(req, res);
    if (req.method === "GET" && url.pathname === "/api/me") {
      const auth = getSession(req);
      if (!auth) return json(res, 200, { user: null });
      rememberDevice(auth.user, String(url.searchParams.get("deviceId") || "").trim());
      const rememberToken = createRememberToken(auth.user);
      saveDb();
      return json(res, 200, { user: publicUser(auth.user), rememberToken });
    }
    if (req.method === "GET" && url.pathname === "/api/messages") return getMessages(req, res);
    if (req.method === "GET" && url.pathname === "/api/calls") return getCalls(req, res);
    if (req.method === "GET" && url.pathname === "/api/users") return getUsers(req, res);
    if (req.method === "POST" && url.pathname === "/api/profile") return updateProfile(req, res);
    if (req.method === "POST" && url.pathname === "/api/messages") return createMessage(req, res);
    if (req.method === "POST" && url.pathname === "/api/typing") return updateTyping(req, res);
    if (req.method === "POST" && url.pathname === "/api/calls") return startCall(req, res);
    if (req.method === "POST" && url.pathname === "/api/read") return markRead(req, res);
    if (req.method === "POST" && url.pathname === "/api/conversation/clear") return clearConversation(req, res);
    const deleteMatch = /^\/api\/messages\/([^/]+)\/delete$/.exec(url.pathname);
    if (req.method === "POST" && deleteMatch) return deleteMessage(req, res, deleteMatch[1]);
    const editMatch = /^\/api\/messages\/([^/]+)\/edit$/.exec(url.pathname);
    if (req.method === "POST" && editMatch) return editMessage(req, res, editMatch[1]);
    const forwardMatch = /^\/api\/messages\/([^/]+)\/forward$/.exec(url.pathname);
    if (req.method === "POST" && forwardMatch) return forwardMessage(req, res, forwardMatch[1]);
    const callMatch = /^\/api\/calls\/([^/]+)$/.exec(url.pathname);
    if (req.method === "POST" && callMatch) return updateCall(req, res, callMatch[1]);
    if (req.method === "POST" && url.pathname === "/api/upload") return uploadMedia(req, res);
    if (req.method === "POST" && url.pathname === "/api/upload-group") return uploadMediaGroup(req, res);
    if (req.method === "GET" && url.pathname === "/api/events") return stream(req, res);
    return serveStatic(req, res);
  } catch (error) {
    const status = error.status || 500;
    json(res, status, { error: status === 500 ? "حدث خطأ في الخادم." : error.message });
  }
});

server.listen(PORT, () => {
  console.log(`Viora chat is running at http://localhost:${PORT}`);
});
