var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// wrangler-modules-watch:wrangler:modules-watch
var init_wrangler_modules_watch = __esm({
  "wrangler-modules-watch:wrangler:modules-watch"() {
    init_modules_watch_stub();
  }
});

// node_modules/wrangler/templates/modules-watch-stub.js
var init_modules_watch_stub = __esm({
  "node_modules/wrangler/templates/modules-watch-stub.js"() {
    init_wrangler_modules_watch();
  }
});

// src/utils/crypto.js
function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
async function derivePasswordHash(password, salt) {
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  return crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 1e5,
      hash: "SHA-256"
    },
    passwordKey,
    256
  );
}
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePasswordHash(password, salt);
  return `${toHex(salt)}:${toHex(hash)}`;
}
async function verifyPassword(password, storedHash) {
  const [saltHex, hashHex] = storedHash.split(":");
  if (!saltHex || !hashHex) {
    return false;
  }
  const salt = fromHex(saltHex);
  const expectedHash = fromHex(hashHex);
  const actualHash = new Uint8Array(
    await derivePasswordHash(password, salt)
  );
  if (actualHash.length !== expectedHash.length) {
    return false;
  }
  let difference = 0;
  for (let i = 0; i < actualHash.length; i++) {
    difference |= actualHash[i] ^ expectedHash[i];
  }
  return difference === 0;
}
async function hashToken(token) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(token)
  );
  return toHex(hash);
}
function generateToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return toHex(bytes);
}
var encoder;
var init_crypto = __esm({
  "src/utils/crypto.js"() {
    init_modules_watch_stub();
    encoder = new TextEncoder();
    __name(toHex, "toHex");
    __name(fromHex, "fromHex");
    __name(derivePasswordHash, "derivePasswordHash");
    __name(hashPassword, "hashPassword");
    __name(verifyPassword, "verifyPassword");
    __name(hashToken, "hashToken");
    __name(generateToken, "generateToken");
  }
});

// src/services/authService.js
var authService_exports = {};
__export(authService_exports, {
  createUser: () => createUser,
  getUserFromSession: () => getUserFromSession,
  loginUser: () => loginUser,
  logoutUser: () => logoutUser
});
function getExpiryDate() {
  return new Date(
    Date.now() + SESSION_DURATION * 1e3
  ).toISOString();
}
async function loginUser(env, email, password) {
  const user = await env.DB.prepare(
    `
      SELECT id, name, email, password_hash, role
      FROM users
      WHERE email = ?
      `
  ).bind(email.toLowerCase().trim()).first();
  if (!user) {
    return null;
  }
  const passwordValid = await verifyPassword(
    password,
    user.password_hash
  );
  if (!passwordValid) {
    return null;
  }
  const token = generateToken();
  const tokenHash = await hashToken(token);
  const sessionId = crypto.randomUUID();
  const expiresAt = getExpiryDate();
  await env.DB.prepare(
    `
      INSERT INTO sessions (
        id,
        user_id,
        token_hash,
        expires_at
      )
      VALUES (?, ?, ?, ?)
      `
  ).bind(
    sessionId,
    user.id,
    tokenHash,
    expiresAt
  ).run();
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    expiresAt
  };
}
async function getUserFromSession(env, token) {
  if (!token) {
    return null;
  }
  const tokenHash = await hashToken(token);
  const session = await env.DB.prepare(
    `
      SELECT
        s.id AS session_id,
        s.expires_at,
        u.id,
        u.name,
        u.email,
        u.role
      FROM sessions s
      JOIN users u
        ON u.id = s.user_id
      WHERE s.token_hash = ?
      `
  ).bind(tokenHash).first();
  if (!session) {
    return null;
  }
  const expiresAt = new Date(session.expires_at);
  if (expiresAt <= /* @__PURE__ */ new Date()) {
    await env.DB.prepare(
      `
        DELETE FROM sessions
        WHERE id = ?
        `
    ).bind(session.session_id).run();
    return null;
  }
  return {
    id: session.id,
    name: session.name,
    email: session.email,
    role: session.role
  };
}
async function logoutUser(env, token) {
  if (!token) {
    return;
  }
  const tokenHash = await hashToken(token);
  await env.DB.prepare(
    `
      DELETE FROM sessions
      WHERE token_hash = ?
      `
  ).bind(tokenHash).run();
}
async function createUser(env, { name, email, password }) {
  const passwordHash = await hashPassword(password);
  const result = await env.DB.prepare(
    `
      INSERT INTO users (
        name,
        email,
        password_hash,
        role
      )
      VALUES (?, ?, ?, 'editor')
      RETURNING id, name, email, role, created_at
      `
  ).bind(
    name.trim(),
    email.toLowerCase().trim(),
    passwordHash
  ).first();
  return result;
}
var SESSION_DURATION;
var init_authService = __esm({
  "src/services/authService.js"() {
    init_modules_watch_stub();
    init_crypto();
    SESSION_DURATION = 60 * 60 * 24 * 7;
    __name(getExpiryDate, "getExpiryDate");
    __name(loginUser, "loginUser");
    __name(getUserFromSession, "getUserFromSession");
    __name(logoutUser, "logoutUser");
    __name(createUser, "createUser");
  }
});

// .wrangler/tmp/bundle-fkCz7K/middleware-loader.entry.ts
init_modules_watch_stub();

// .wrangler/tmp/bundle-fkCz7K/middleware-insertion-facade.js
init_modules_watch_stub();

// src/workers/worker.js
init_modules_watch_stub();

// src/services/instagramService.js
init_modules_watch_stub();
var GRAPH_URL = "https://graph.instagram.com";
async function instagramRequest(endpoint, accessToken) {
  const url = new URL(`${GRAPH_URL}${endpoint}`);
  url.searchParams.set("access_token", accessToken);
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      data.error?.message || "Instagram API request failed"
    );
  }
  return data;
}
__name(instagramRequest, "instagramRequest");
async function getProfile(accessToken) {
  return instagramRequest(
    "/me?fields=id,username,account_type,media_count,followers_count",
    accessToken
  );
}
__name(getProfile, "getProfile");
async function getAllMedia(accessToken) {
  const fields = [
    "id",
    "media_type",
    "username",
    "timestamp",
    "like_count",
    "comments_count",
    "permalink"
  ].join(",");
  let url = new URL(`${GRAPH_URL}/me/media`);
  url.searchParams.set("fields", fields);
  url.searchParams.set("limit", "100");
  url.searchParams.set("access_token", accessToken);
  const media = [];
  while (url) {
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data.error?.message || "Instagram media request failed"
      );
    }
    media.push(...data.data ?? []);
    url = data.paging?.next ? new URL(data.paging.next) : null;
  }
  return media;
}
__name(getAllMedia, "getAllMedia");
async function getMediaViews(media, accessToken) {
  let totalViews = 0;
  let processed = 0;
  let failed = 0;
  for (const item of media) {
    if (item.media_type !== "VIDEO") {
      continue;
    }
    try {
      const data = await instagramRequest(
        `/${item.id}/insights?metric=views`,
        accessToken
      );
      const views = data.data?.find(
        (metric) => metric.name === "views"
      );
      if (views) {
        totalViews += views.values?.[0]?.value ?? 0;
      }
      processed++;
    } catch (error) {
      console.error(
        `Failed to fetch views for media ${item.id}:`,
        error.message
      );
      failed++;
    }
  }
  return {
    totalViews,
    processed,
    failed
  };
}
__name(getMediaViews, "getMediaViews");
async function getInstagramStats(accessToken) {
  const profile = await getProfile(accessToken);
  const media = await getAllMedia(accessToken);
  const totalLikes = media.reduce(
    (total, item) => total + (item.like_count ?? 0),
    0
  );
  const videoMedia = media.filter(
    (item) => item.media_type === "VIDEO"
  );
  const { totalViews, processed, failed } = await getMediaViews(videoMedia, accessToken);
  return {
    followers: profile.followers_count,
    likes: totalLikes,
    views: totalViews,
    mediaCount: media.length,
    videoCount: videoMedia.length,
    viewsProcessed: processed,
    viewsFailed: failed
  };
}
__name(getInstagramStats, "getInstagramStats");

// src/routes/authRoutes.js
init_modules_watch_stub();

// src/controllers/authController.js
init_modules_watch_stub();
init_authService();

// src/utils/cookies.js
init_modules_watch_stub();
var COOKIE_NAME = "tnp_session";
function setSessionCookie(headers, token, maxAge) {
  headers.append(
    "Set-Cookie",
    [
      `${COOKIE_NAME}=${token}`,
      "HttpOnly",
      "Secure",
      "SameSite=Strict",
      "Path=/",
      `Max-Age=${maxAge}`
    ].join("; ")
  );
}
__name(setSessionCookie, "setSessionCookie");
function clearSessionCookie(headers) {
  headers.append(
    "Set-Cookie",
    [
      `${COOKIE_NAME}=`,
      "HttpOnly",
      "Secure",
      "SameSite=Strict",
      "Path=/",
      "Max-Age=0"
    ].join("; ")
  );
}
__name(clearSessionCookie, "clearSessionCookie");
function getSessionToken(request) {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) {
    return null;
  }
  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.trim().split("=");
    if (name === COOKIE_NAME) {
      return valueParts.join("=") || null;
    }
  }
  return null;
}
__name(getSessionToken, "getSessionToken");

// src/controllers/authController.js
var SESSION_DURATION2 = 60 * 60 * 24 * 7;
async function login(request, env) {
  try {
    const body = await request.json();
    const email = body.email?.trim();
    const password = body.password;
    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }
    const result = await loginUser(
      env,
      email,
      password
    );
    if (!result) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }
    const headers = new Headers({
      "Content-Type": "application/json"
    });
    setSessionCookie(
      headers,
      result.token,
      SESSION_DURATION2
    );
    return new Response(
      JSON.stringify({
        user: result.user
      }),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      { error: "Unable to log in" },
      { status: 500 }
    );
  }
}
__name(login, "login");
async function logout(request, env) {
  try {
    const token = getSessionToken(request);
    await logoutUser(env, token);
    const headers = new Headers({
      "Content-Type": "application/json"
    });
    clearSessionCookie(headers);
    return new Response(
      JSON.stringify({
        message: "Logged out successfully"
      }),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return Response.json(
      { error: "Unable to log out" },
      { status: 500 }
    );
  }
}
__name(logout, "logout");
async function me(request, env) {
  const token = getSessionToken(request);
  if (!token) {
    return Response.json(
      { user: null },
      { status: 200 }
    );
  }
  const { getUserFromSession: getUserFromSession2 } = await Promise.resolve().then(() => (init_authService(), authService_exports));
  const user = await getUserFromSession2(
    env,
    token
  );
  return Response.json({
    user: user ?? null
  });
}
__name(me, "me");

// src/routes/authRoutes.js
async function handleAuthRoute(request, env) {
  const url = new URL(request.url);
  if (request.method === "POST" && url.pathname === "/api/auth/login") {
    return login(request, env);
  }
  if (request.method === "POST" && url.pathname === "/api/auth/logout") {
    return logout(request, env);
  }
  if (request.method === "GET" && url.pathname === "/api/auth/me") {
    return me(request, env);
  }
  return null;
}
__name(handleAuthRoute, "handleAuthRoute");

// src/routes/staffRoutes.js
init_modules_watch_stub();

// src/controllers/staffController.js
init_modules_watch_stub();

// src/services/staffService.js
init_modules_watch_stub();
init_crypto();
async function updateStaffRole(env, userId, newRole) {
  const target = await env.DB.prepare(
    `
      SELECT id, name, email, role
      FROM users
      WHERE id = ?
      `
  ).bind(userId).first();
  if (!target) {
    return {
      error: "Staff account not found",
      status: 404
    };
  }
  if (target.role === newRole) {
    return {
      staff: target,
      previousRole: target.role,
      changed: false
    };
  }
  if (target.role === "admin" && newRole === "editor") {
    const adminCount = await env.DB.prepare(
      `
        SELECT COUNT(*) AS count
        FROM users
        WHERE role = 'admin'
        `
    ).first();
    if (adminCount.count <= 1) {
      return {
        error: "Cannot demote the last admin",
        status: 400
      };
    }
  }
  const previousRole = target.role;
  const staff = await env.DB.prepare(
    `
      UPDATE users
      SET
        role = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      RETURNING id, name, email, role, created_at, updated_at
      `
  ).bind(newRole, userId).first();
  return {
    staff,
    previousRole,
    changed: true
  };
}
__name(updateStaffRole, "updateStaffRole");
async function createStaff(env, { name, email, password }) {
  const passwordHash = await hashPassword(password);
  const staff = await env.DB.prepare(
    `
      INSERT INTO users (
        name,
        email,
        password_hash,
        role
      )
      VALUES (?, ?, ?, 'editor')
      RETURNING id, name, email, role, created_at
      `
  ).bind(
    name.trim(),
    email.toLowerCase().trim(),
    passwordHash
  ).first();
  return staff;
}
__name(createStaff, "createStaff");
async function getAllStaff(env) {
  const result = await env.DB.prepare(
    `
      SELECT
        id,
        name,
        email,
        role,
        created_at,
        updated_at
      FROM users
      ORDER BY
        CASE WHEN role = 'admin' THEN 0 ELSE 1 END,
        name ASC
      `
  ).all();
  return result.results;
}
__name(getAllStaff, "getAllStaff");
async function resetStaffPassword(env, userId, newPassword) {
  const target = await env.DB.prepare(
    `
      SELECT id, name, email, role
      FROM users
      WHERE id = ?
      `
  ).bind(userId).first();
  if (!target) {
    return {
      error: "Staff account not found",
      status: 404
    };
  }
  const passwordHash = await hashPassword(
    newPassword
  );
  await env.DB.prepare(
    `
      UPDATE users
      SET
        password_hash = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `
  ).bind(passwordHash, userId).run();
  await env.DB.prepare(
    `
      DELETE FROM sessions
      WHERE user_id = ?
      `
  ).bind(userId).run();
  return {
    staff: target
  };
}
__name(resetStaffPassword, "resetStaffPassword");

// src/controllers/staffController.js
init_authService();

// src/services/auditService.js
init_modules_watch_stub();
async function createAuditLog(env, {
  userId,
  action,
  entityType,
  entityId = null,
  details = null
}) {
  await env.DB.prepare(
    `
      INSERT INTO audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        details
      )
      VALUES (?, ?, ?, ?, ?)
      `
  ).bind(
    userId,
    action,
    entityType,
    entityId,
    details
  ).run();
}
__name(createAuditLog, "createAuditLog");
async function getAuditLogs(env) {
  const result = await env.DB.prepare(
    `
      SELECT
        a.id,
        a.user_id,
        u.name AS user_name,
        u.email AS user_email,
        a.action,
        a.entity_type,
        a.entity_id,
        a.details,
        a.created_at
      FROM audit_logs a
      JOIN users u
        ON u.id = a.user_id
      ORDER BY a.created_at DESC
      `
  ).all();
  return result.results;
}
__name(getAuditLogs, "getAuditLogs");

// src/controllers/staffController.js
async function getStaffController(request, env) {
  const token = getSessionToken(request);
  if (!token) {
    return Response.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
  const user = await getUserFromSession(env, token);
  if (!user) {
    return Response.json(
      { error: "Invalid or expired session" },
      { status: 401 }
    );
  }
  if (user.role !== "admin") {
    return Response.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }
  try {
    const staff = await getAllStaff(env);
    return Response.json({
      staff
    });
  } catch (error) {
    console.error("Get staff error:", error);
    return Response.json(
      { error: "Unable to retrieve staff" },
      { status: 500 }
    );
  }
}
__name(getStaffController, "getStaffController");
async function createStaffController(request, env) {
  const token = getSessionToken(request);
  if (!token) {
    return Response.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
  const user = await getUserFromSession(env, token);
  if (!user) {
    return Response.json(
      { error: "Invalid or expired session" },
      { status: 401 }
    );
  }
  if (user.role !== "admin") {
    return Response.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  if (!name || !email || !password) {
    return Response.json(
      {
        error: "Name, email and password are required"
      },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return Response.json(
      {
        error: "Password must be at least 8 characters"
      },
      { status: 400 }
    );
  }
  try {
    const staff = await createStaff(env, {
      name,
      email,
      password
    });
    await createAuditLog(env, {
      userId: user.id,
      action: "CREATE_STAFF",
      entityType: "user",
      entityId: staff.id,
      details: JSON.stringify({
        name: staff.name,
        email: staff.email,
        role: staff.role
      })
    });
    return Response.json(
      {
        message: "Staff account created successfully",
        staff
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create staff error:", error);
    if (error.message?.includes("UNIQUE")) {
      return Response.json(
        {
          error: "An account with this email already exists"
        },
        { status: 409 }
      );
    }
    return Response.json(
      { error: "Unable to create staff account" },
      { status: 500 }
    );
  }
}
__name(createStaffController, "createStaffController");
async function updateStaffRoleController(request, env) {
  const token = getSessionToken(request);
  if (!token) {
    return Response.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
  const currentUser = await getUserFromSession(env, token);
  if (!currentUser) {
    return Response.json(
      { error: "Invalid or expired session" },
      { status: 401 }
    );
  }
  if (currentUser.role !== "admin") {
    return Response.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }
  const url = new URL(request.url);
  const userId = Number(
    url.pathname.split("/")[3]
  );
  if (!Number.isInteger(userId) || userId <= 0) {
    return Response.json(
      { error: "Invalid staff ID" },
      { status: 400 }
    );
  }
  if (userId === currentUser.id) {
    return Response.json(
      { error: "You cannot change your own role" },
      { status: 400 }
    );
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  const newRole = body.role;
  if (!["admin", "editor"].includes(newRole)) {
    return Response.json(
      {
        error: "Role must be either admin or editor"
      },
      { status: 400 }
    );
  }
  try {
    const result = await updateStaffRole(
      env,
      userId,
      newRole
    );
    if (result.error) {
      return Response.json(
        { error: result.error },
        { status: result.status }
      );
    }
    if (result.changed) {
      await createAuditLog(env, {
        userId: currentUser.id,
        action: "UPDATE_STAFF_ROLE",
        entityType: "user",
        entityId: userId,
        details: JSON.stringify({
          previousRole: result.previousRole,
          newRole
        })
      });
    }
    return Response.json({
      message: "Staff role updated successfully",
      staff: result.staff
    });
  } catch (error) {
    console.error(
      "Update staff role error:",
      error
    );
    return Response.json(
      { error: "Unable to update staff role" },
      { status: 500 }
    );
  }
}
__name(updateStaffRoleController, "updateStaffRoleController");
async function resetStaffPasswordController(request, env) {
  const token = getSessionToken(request);
  if (!token) {
    return Response.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
  const currentUser = await getUserFromSession(env, token);
  if (!currentUser) {
    return Response.json(
      { error: "Invalid or expired session" },
      { status: 401 }
    );
  }
  if (currentUser.role !== "admin") {
    return Response.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }
  const url = new URL(request.url);
  const userId = Number(
    url.pathname.split("/")[3]
  );
  if (!Number.isInteger(userId) || userId <= 0) {
    return Response.json(
      { error: "Invalid staff ID" },
      { status: 400 }
    );
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  const newPassword = body.password;
  if (!newPassword) {
    return Response.json(
      { error: "New password is required" },
      { status: 400 }
    );
  }
  if (newPassword.length < 8) {
    return Response.json(
      {
        error: "Password must be at least 8 characters"
      },
      { status: 400 }
    );
  }
  try {
    const result = await resetStaffPassword(
      env,
      userId,
      newPassword
    );
    if (result.error) {
      return Response.json(
        { error: result.error },
        { status: result.status }
      );
    }
    await createAuditLog(env, {
      userId: currentUser.id,
      action: "RESET_STAFF_PASSWORD",
      entityType: "user",
      entityId: userId,
      details: JSON.stringify({
        staffEmail: result.staff.email
      })
    });
    return Response.json({
      message: "Staff password reset successfully",
      staff: result.staff
    });
  } catch (error) {
    console.error(
      "Reset staff password error:",
      error
    );
    return Response.json(
      { error: "Unable to reset staff password" },
      { status: 500 }
    );
  }
}
__name(resetStaffPasswordController, "resetStaffPasswordController");

// src/routes/staffRoutes.js
async function handleStaffRoute(request, env) {
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/api/staff") {
    return getStaffController(request, env);
  }
  if (request.method === "POST" && url.pathname === "/api/staff") {
    return createStaffController(request, env);
  }
  if (request.method === "PATCH" && url.pathname.match(/^\/api\/staff\/\d+\/role$/)) {
    return updateStaffRoleController(request, env);
  }
  if (request.method === "POST" && url.pathname.match(/^\/api\/staff\/\d+\/reset-password$/)) {
    return resetStaffPasswordController(request, env);
  }
  return null;
}
__name(handleStaffRoute, "handleStaffRoute");

// src/routes/auditRoutes.js
init_modules_watch_stub();

// src/controllers/auditController.js
init_modules_watch_stub();
init_authService();
async function getAuditLogsController(request, env) {
  const token = getSessionToken(request);
  if (!token) {
    return Response.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
  const user = await getUserFromSession(env, token);
  if (!user) {
    return Response.json(
      { error: "Invalid or expired session" },
      { status: 401 }
    );
  }
  if (user.role !== "admin") {
    return Response.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }
  try {
    const logs = await getAuditLogs(env);
    return Response.json({
      logs
    });
  } catch (error) {
    console.error(
      "Get audit logs error:",
      error
    );
    return Response.json(
      { error: "Unable to retrieve audit logs" },
      { status: 500 }
    );
  }
}
__name(getAuditLogsController, "getAuditLogsController");

// src/routes/auditRoutes.js
async function handleAuditRoute(request, env) {
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/api/audit-logs") {
    return getAuditLogsController(request, env);
  }
  return null;
}
__name(handleAuditRoute, "handleAuditRoute");

// src/routes/newsRoutes.js
init_modules_watch_stub();

// src/controllers/newsController.js
init_modules_watch_stub();

// src/services/newsService.js
init_modules_watch_stub();
async function getAllNews(env) {
  const result = await env.DB.prepare(
    `
      SELECT
        n.id,
        n.title,
        n.content,
        n.image,
        n.pinned,
        n.pinned_at,
        n.created_at,
        n.updated_at,
        n.created_by,
        n.updated_by,
        creator.name AS created_by_name,
        updater.name AS updated_by_name
      FROM news n
      JOIN users creator
        ON creator.id = n.created_by
      LEFT JOIN users updater
        ON updater.id = n.updated_by
      ORDER BY
        n.pinned DESC,
        n.pinned_at DESC,
        n.created_at DESC
      `
  ).all();
  return result.results;
}
__name(getAllNews, "getAllNews");
async function getNewsById(env, newsId) {
  const news = await env.DB.prepare(
    `
      SELECT
        n.id,
        n.title,
        n.content,
        n.image,
        n.pinned,
        n.pinned_at,
        n.created_at,
        n.updated_at,
        n.created_by,
        n.updated_by,
        creator.name AS created_by_name,
        updater.name AS updated_by_name
      FROM news n
      JOIN users creator
        ON creator.id = n.created_by
      LEFT JOIN users updater
        ON updater.id = n.updated_by
      WHERE n.id = ?
      `
  ).bind(newsId).first();
  return news;
}
__name(getNewsById, "getNewsById");
async function cleanupNonPinnedNews(env) {
  const result = await env.DB.prepare(
    `
      SELECT id
      FROM news
      WHERE pinned = 0
      ORDER BY created_at DESC, id DESC
      LIMIT -1 OFFSET 30
      `
  ).all();
  const oldNews = result.results;
  if (oldNews.length === 0) {
    return [];
  }
  const deletedIds = [];
  for (const news of oldNews) {
    await env.DB.prepare(
      `
        DELETE FROM news
        WHERE id = ?
        `
    ).bind(news.id).run();
    deletedIds.push(news.id);
  }
  return deletedIds;
}
__name(cleanupNonPinnedNews, "cleanupNonPinnedNews");
async function createNews(env, { title, content, image, createdBy }) {
  const news = await env.DB.prepare(
    `
      INSERT INTO news (
        title,
        content,
        image,
        created_by
      )
      VALUES (?, ?, ?, ?)
      RETURNING
        id,
        title,
        content,
        image,
        pinned,
        pinned_at,
        created_at,
        updated_at,
        created_by,
        updated_by
      `
  ).bind(
    title,
    content,
    image ?? null,
    createdBy
  ).first();
  const deletedIds = await cleanupNonPinnedNews(env);
  return {
    news,
    deletedIds
  };
}
__name(createNews, "createNews");
async function updateNews(env, newsId, { title, content, image, updatedBy }) {
  const existing = await getNewsById(env, newsId);
  if (!existing) {
    return null;
  }
  const news = await env.DB.prepare(
    `
      UPDATE news
      SET
        title = ?,
        content = ?,
        image = ?,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = ?
      WHERE id = ?
      RETURNING
        id,
        title,
        content,
        image,
        pinned,
        pinned_at,
        created_at,
        updated_at,
        created_by,
        updated_by
      `
  ).bind(
    title,
    content,
    image ?? null,
    updatedBy,
    newsId
  ).first();
  return {
    news
  };
}
__name(updateNews, "updateNews");
async function deleteNews(env, newsId) {
  const existing = await getNewsById(env, newsId);
  if (!existing) {
    return null;
  }
  await env.DB.prepare(
    `
      DELETE FROM news
      WHERE id = ?
      `
  ).bind(newsId).run();
  return existing;
}
__name(deleteNews, "deleteNews");
async function toggleNewsPin(env, newsId) {
  const existing = await getNewsById(env, newsId);
  if (!existing) {
    return null;
  }
  const newPinnedState = existing.pinned ? 0 : 1;
  const news = await env.DB.prepare(
    `
      UPDATE news
      SET
        pinned = ?,
        pinned_at = ?
      WHERE id = ?
      RETURNING
        id,
        title,
        content,
        image,
        pinned,
        pinned_at,
        created_at,
        updated_at,
        created_by,
        updated_by
      `
  ).bind(
    newPinnedState,
    newPinnedState ? (/* @__PURE__ */ new Date()).toISOString() : null,
    newsId
  ).first();
  const deletedIds = newPinnedState === 0 ? await cleanupNonPinnedNews(env) : [];
  return {
    news,
    previousPinned: existing.pinned,
    pinned: newPinnedState,
    deletedIds
  };
}
__name(toggleNewsPin, "toggleNewsPin");

// src/controllers/newsController.js
init_authService();
async function getNewsController(request, env) {
  try {
    const news = await getAllNews(env);
    return Response.json({
      news
    });
  } catch (error) {
    console.error("Get news error:", error);
    return Response.json(
      { error: "Unable to retrieve news" },
      { status: 500 }
    );
  }
}
__name(getNewsController, "getNewsController");
async function createNewsController(request, env) {
  const token = getSessionToken(request);
  if (!token) {
    return Response.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
  const user = await getUserFromSession(env, token);
  if (!user) {
    return Response.json(
      { error: "Invalid or expired session" },
      { status: 401 }
    );
  }
  if (!["admin", "editor"].includes(user.role)) {
    return Response.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  const title = body.title?.trim();
  const content = body.content?.trim();
  const image = body.image?.trim() || null;
  if (!title || !content) {
    return Response.json(
      {
        error: "Title and content are required"
      },
      { status: 400 }
    );
  }
  try {
    const result = await createNews(env, {
      title,
      content,
      image,
      createdBy: user.id
    });
    await createAuditLog(env, {
      userId: user.id,
      action: "CREATE_NEWS",
      entityType: "news",
      entityId: result.news.id,
      details: JSON.stringify({
        title: result.news.title,
        automaticallyDeletedIds: result.deletedIds
      })
    });
    return Response.json(
      {
        message: "News created successfully",
        news: result.news,
        deletedIds: result.deletedIds
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create news error:", error);
    return Response.json(
      { error: "Unable to create news" },
      { status: 500 }
    );
  }
}
__name(createNewsController, "createNewsController");
async function updateNewsController(request, env) {
  const token = getSessionToken(request);
  if (!token) {
    return Response.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
  const user = await getUserFromSession(env, token);
  if (!user) {
    return Response.json(
      { error: "Invalid or expired session" },
      { status: 401 }
    );
  }
  if (!["admin", "editor"].includes(user.role)) {
    return Response.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }
  const url = new URL(request.url);
  const newsId = Number(
    url.pathname.split("/")[3]
  );
  if (!Number.isInteger(newsId) || newsId <= 0) {
    return Response.json(
      { error: "Invalid news ID" },
      { status: 400 }
    );
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  const title = body.title?.trim();
  const content = body.content?.trim();
  const image = body.image?.trim() || null;
  if (!title || !content) {
    return Response.json(
      {
        error: "Title and content are required"
      },
      { status: 400 }
    );
  }
  try {
    const result = await updateNews(
      env,
      newsId,
      {
        title,
        content,
        image,
        updatedBy: user.id
      }
    );
    if (!result) {
      return Response.json(
        { error: "News article not found" },
        { status: 404 }
      );
    }
    await createAuditLog(env, {
      userId: user.id,
      action: "UPDATE_NEWS",
      entityType: "news",
      entityId: newsId,
      details: JSON.stringify({
        title: result.news.title
      })
    });
    return Response.json({
      message: "News updated successfully",
      news: result.news
    });
  } catch (error) {
    console.error("Update news error:", error);
    return Response.json(
      { error: "Unable to update news" },
      { status: 500 }
    );
  }
}
__name(updateNewsController, "updateNewsController");
async function deleteNewsController(request, env) {
  const token = getSessionToken(request);
  if (!token) {
    return Response.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
  const user = await getUserFromSession(env, token);
  if (!user) {
    return Response.json(
      { error: "Invalid or expired session" },
      { status: 401 }
    );
  }
  if (!["admin", "editor"].includes(user.role)) {
    return Response.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }
  const url = new URL(request.url);
  const newsId = Number(
    url.pathname.split("/")[3]
  );
  if (!Number.isInteger(newsId) || newsId <= 0) {
    return Response.json(
      { error: "Invalid news ID" },
      { status: 400 }
    );
  }
  try {
    const news = await deleteNews(env, newsId);
    if (!news) {
      return Response.json(
        { error: "News article not found" },
        { status: 404 }
      );
    }
    await createAuditLog(env, {
      userId: user.id,
      action: "DELETE_NEWS",
      entityType: "news",
      entityId: newsId,
      details: JSON.stringify({
        title: news.title
      })
    });
    return Response.json({
      message: "News deleted successfully",
      news
    });
  } catch (error) {
    console.error("Delete news error:", error);
    return Response.json(
      { error: "Unable to delete news" },
      { status: 500 }
    );
  }
}
__name(deleteNewsController, "deleteNewsController");
async function toggleNewsPinController(request, env) {
  const token = getSessionToken(request);
  if (!token) {
    return Response.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
  const user = await getUserFromSession(env, token);
  if (!user) {
    return Response.json(
      { error: "Invalid or expired session" },
      { status: 401 }
    );
  }
  if (!["admin", "editor"].includes(user.role)) {
    return Response.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }
  const url = new URL(request.url);
  const newsId = Number(
    url.pathname.split("/")[3]
  );
  if (!Number.isInteger(newsId) || newsId <= 0) {
    return Response.json(
      { error: "Invalid news ID" },
      { status: 400 }
    );
  }
  try {
    const result = await toggleNewsPin(
      env,
      newsId
    );
    if (!result) {
      return Response.json(
        { error: "News article not found" },
        { status: 404 }
      );
    }
    const action = result.pinned ? "PIN_NEWS" : "UNPIN_NEWS";
    await createAuditLog(env, {
      userId: user.id,
      action,
      entityType: "news",
      entityId: newsId,
      details: JSON.stringify({
        title: result.news.title,
        previousPinned: result.previousPinned,
        pinned: result.pinned,
        automaticallyDeletedIds: result.deletedIds
      })
    });
    return Response.json({
      message: result.pinned ? "News pinned successfully" : "News unpinned successfully",
      news: result.news,
      deletedIds: result.deletedIds
    });
  } catch (error) {
    console.error(
      "Toggle news pin error:",
      error
    );
    return Response.json(
      { error: "Unable to update news pin status" },
      { status: 500 }
    );
  }
}
__name(toggleNewsPinController, "toggleNewsPinController");

// src/routes/newsRoutes.js
async function handleNewsRoute(request, env) {
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/api/news") {
    return getNewsController(request, env);
  }
  if (request.method === "POST" && url.pathname === "/api/news") {
    return createNewsController(request, env);
  }
  if (request.method === "PATCH" && url.pathname.match(/^\/api\/news\/\d+\/pin$/)) {
    return toggleNewsPinController(request, env);
  }
  if (request.method === "PATCH" && url.pathname.match(/^\/api\/news\/\d+$/)) {
    return updateNewsController(request, env);
  }
  if (request.method === "DELETE" && url.pathname.match(/^\/api\/news\/\d+$/)) {
    return deleteNewsController(request, env);
  }
  return null;
}
__name(handleNewsRoute, "handleNewsRoute");

// src/workers/worker.js
var STATS_KEY = "instagram_stats";
async function fetchAndStoreStats(env) {
  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Instagram stats attempt ${attempt}/${MAX_RETRIES}`);
      const stats = await getInstagramStats(
        env.INSTAGRAM_ACCESS_TOKEN
      );
      const data = {
        ...stats,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
        lastUpdateSuccessful: true
      };
      await env.INSTAGRAM_STATS.put(
        STATS_KEY,
        JSON.stringify(data)
      );
      console.log("Instagram stats updated successfully.");
      return data;
    } catch (error) {
      console.error(
        `Instagram stats attempt ${attempt} failed:`,
        error.message
      );
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 2e3));
      }
    }
  }
  console.error(
    "Instagram stats failed after all retries. Keeping old stats."
  );
  return null;
}
__name(fetchAndStoreStats, "fetchAndStoreStats");
var worker_default = {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(fetchAndStoreStats(env));
  },
  async fetch(request, env) {
    const authResponse = await handleAuthRoute(request, env);
    if (authResponse) {
      return authResponse;
    }
    const staffResponse = await handleStaffRoute(request, env);
    if (staffResponse) {
      return staffResponse;
    }
    const auditResponse = await handleAuditRoute(
      request,
      env
    );
    if (auditResponse) {
      return auditResponse;
    }
    const newsResponse = await handleNewsRoute(
      request,
      env
    );
    if (newsResponse) {
      return newsResponse;
    }
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/api/instagram/stats") {
      const storedStats = await env.INSTAGRAM_STATS.get(
        "instagram_stats",
        "json"
      );
      if (!storedStats) {
        return Response.json(
          { error: "Instagram stats are not available yet" },
          { status: 503 }
        );
      }
      return Response.json(storedStats);
    }
    return Response.json(
      { error: "Not found" },
      { status: 404 }
    );
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_modules_watch_stub();
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_modules_watch_stub();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-fkCz7K/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
init_modules_watch_stub();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-fkCz7K/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
