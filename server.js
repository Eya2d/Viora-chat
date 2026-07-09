const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const UPLOAD_DIR = path.join(PUBLIC_DIR, "uploads");
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
  ".wav": "audio/wav",
  ".ogg": "audio/ogg"
};

const allowedMedia = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/webm"
]);

let db = { users: [], sessions: [], messages: [] };
const clients = new Set();

function ensureStorage() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  }
  db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
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
      files.push({ name, filename, type: (typeMatch && typeMatch[1].trim()) || "application/octet-stream", content });
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
  if (db.users.some((user) => user.deviceId === deviceId)) {
    return json(res, 409, { error: "لا يمكن إنشاء أكثر من حساب من نفس الجهاز." });
  }

  const user = {
    id: crypto.randomUUID(),
    name,
    username,
    email,
    deviceId,
    passwordHash: hashPassword(password),
    avatar: "",
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  const token = crypto.randomBytes(32).toString("hex");
  db.sessions.push({ token, userId: user.id, expiresAt: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000 });
  saveDb();
  broadcast("user", publicUser(user));
  setSessionCookie(res, token);
  json(res, 201, { user: publicUser(user) });
}

async function login(req, res) {
  const payload = JSON.parse((await getBody(req)).toString("utf8") || "{}");
  const identifier = normalize(payload.identifier);
  const password = String(payload.password || "");
  const user = db.users.find((item) => item.email === identifier || item.username === identifier);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return json(res, 401, { error: "بيانات الدخول غير صحيحة." });
  }
  const token = crypto.randomBytes(32).toString("hex");
  db.sessions.push({ token, userId: user.id, expiresAt: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000 });
  saveDb();
  setSessionCookie(res, token);
  json(res, 200, { user: publicUser(user) });
}

function getMessages(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const recipientId = String(url.searchParams.get("with") || "");
  const conversationId = recipientId ? directConversationId(auth.user.id, recipientId) : "general";
  const messages = db.messages
    .filter((message) => (message.conversationId || "general") === conversationId)
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
    text: text.slice(0, 2000),
    media: null,
    createdAt: new Date().toISOString()
  };
  db.messages.push(message);
  saveDb();
  broadcast("message", message);
  json(res, 201, { message: { ...message, mine: true } });
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
  if (!allowedMedia.has(file.type)) return json(res, 400, { error: "يدعم الموقع الصور والفيديوهات والمقاطع الصوتية فقط." });
  const extension = path.extname(file.filename) || `.${file.type.split("/")[1] || "bin"}`;
  const storedName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}-${sanitizeFileName(file.filename || `media${extension}`)}`;
  const diskPath = path.join(UPLOAD_DIR, storedName);
  fs.writeFileSync(diskPath, file.content);
  const mediaType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "audio";
  const message = {
    id: crypto.randomUUID(),
    userId: auth.user.id,
    recipientId: recipientId || null,
    conversationId: recipientId ? directConversationId(auth.user.id, recipientId) : "general",
    author: auth.user.name,
    username: auth.user.username,
    text: caption,
    media: {
      type: mediaType,
      mime: file.type,
      name: sanitizeFileName(file.filename),
      url: `/uploads/${storedName}`,
      size: file.content.length
    },
    createdAt: new Date().toISOString()
  };
  db.messages.push(message);
  saveDb();
  broadcast("message", message);
  json(res, 201, { message: { ...message, mine: true } });
}

async function updateProfile(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const payload = JSON.parse((await getBody(req)).toString("utf8") || "{}");
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

  db.messages.forEach((message) => {
    if (message.userId === auth.user.id) {
      message.author = auth.user.name;
      message.username = auth.user.username;
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
    if (req.method === "POST" && url.pathname === "/api/logout") return logout(req, res);
    if (req.method === "GET" && url.pathname === "/api/me") {
      const auth = getSession(req);
      return json(res, 200, { user: auth ? publicUser(auth.user) : null });
    }
    if (req.method === "GET" && url.pathname === "/api/messages") return getMessages(req, res);
    if (req.method === "GET" && url.pathname === "/api/users") return getUsers(req, res);
    if (req.method === "POST" && url.pathname === "/api/profile") return updateProfile(req, res);
    if (req.method === "POST" && url.pathname === "/api/messages") return createMessage(req, res);
    if (req.method === "POST" && url.pathname === "/api/upload") return uploadMedia(req, res);
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
