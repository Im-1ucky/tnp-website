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

// .wrangler/tmp/bundle-X8i4Q9/middleware-loader.entry.ts
init_modules_watch_stub();

// .wrangler/tmp/bundle-X8i4Q9/middleware-insertion-facade.js
init_modules_watch_stub();

// src/workers/worker.js
init_modules_watch_stub();

// src/services/instagramService.js
init_modules_watch_stub();
var GRAPH_URL = "https://graph.instagram.com";
async function refreshInstagramStats(env) {
  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `Instagram stats attempt ${attempt}/${MAX_RETRIES}`
      );
      const stats = await getInstagramStats(
        env.INSTAGRAM_ACCESS_TOKEN
      );
      const data = {
        ...stats,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
        lastUpdateSuccessful: true
      };
      await env.INSTAGRAM_STATS.put(
        "instagram_stats",
        JSON.stringify(data)
      );
      console.log(
        "Instagram stats updated successfully."
      );
      return data;
    } catch (error) {
      console.error(
        `Instagram stats attempt ${attempt} failed:`,
        error.message
      );
      if (attempt < MAX_RETRIES) {
        await new Promise(
          (resolve) => setTimeout(resolve, 2e3)
        );
      }
    }
  }
  console.error(
    "Instagram stats failed after all retries. Keeping old stats."
  );
  return null;
}
__name(refreshInstagramStats, "refreshInstagramStats");
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
function isSecureRequest(request) {
  const url = new URL(request.url);
  return url.protocol === "https:";
}
__name(isSecureRequest, "isSecureRequest");
function setSessionCookie(headers, token, maxAge, request) {
  const cookie = [
    `${COOKIE_NAME}=${token}`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${maxAge}`
  ];
  if (isSecureRequest(request)) {
    cookie.push("Secure");
  }
  headers.append("Set-Cookie", cookie.join("; "));
}
__name(setSessionCookie, "setSessionCookie");
function clearSessionCookie(headers, request) {
  const cookie = [
    `${COOKIE_NAME}=`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    "Max-Age=0"
  ];
  if (isSecureRequest(request)) {
    cookie.push("Secure");
  }
  headers.append("Set-Cookie", cookie.join("; "));
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

// src/services/auditService.js
init_modules_watch_stub();
var MAX_AUDIT_LOGS = 1e3;
var DASHBOARD_AUDIT_LOGS = 100;
async function createAuditLog(env, {
  userId,
  action,
  entityType,
  entityId = null,
  details = null
}) {
  let userName = null;
  let userEmail = null;
  if (userId !== null && userId !== void 0) {
    const user = await env.DB.prepare(
      `
        SELECT
          name,
          email
        FROM users
        WHERE id = ?
        `
    ).bind(userId).first();
    if (user) {
      userName = user.name;
      userEmail = user.email;
    }
  }
  await env.DB.prepare(
    `
      INSERT INTO audit_logs (
        user_id,
        user_name,
        user_email,
        action,
        entity_type,
        entity_id,
        details
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `
  ).bind(
    userId ?? null,
    userName,
    userEmail,
    action,
    entityType,
    entityId,
    details
  ).run();
  await env.DB.prepare(
    `
      DELETE FROM audit_logs
      WHERE id NOT IN (
        SELECT id
        FROM audit_logs
        ORDER BY
          created_at DESC,
          id DESC
        LIMIT ?
      )
      `
  ).bind(MAX_AUDIT_LOGS).run();
}
__name(createAuditLog, "createAuditLog");
async function getAuditLogs(env) {
  const result = await env.DB.prepare(
    `
      SELECT
        a.id,
        a.user_id,

        a.user_name,
        a.user_email,

        a.action,
        a.entity_type,
        a.entity_id,
        a.details,
        a.created_at

      FROM audit_logs a

      ORDER BY
        a.created_at DESC,
        a.id DESC

      LIMIT ?
      `
  ).bind(DASHBOARD_AUDIT_LOGS).all();
  return result.results;
}
__name(getAuditLogs, "getAuditLogs");
async function deleteAuditLogs(env, ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return 0;
  }
  const placeholders = ids.map(() => "?").join(", ");
  const result = await env.DB.prepare(
    `
      DELETE FROM audit_logs
      WHERE id IN (${placeholders})
      `
  ).bind(...ids).run();
  return result.meta?.changes ?? 0;
}
__name(deleteAuditLogs, "deleteAuditLogs");

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
    await createAuditLog(env, {
      userId: result.user.id,
      action: "LOGIN",
      entityType: "user",
      entityId: result.user.id
    });
    const headers = new Headers({
      "Content-Type": "application/json"
    });
    setSessionCookie(
      headers,
      result.token,
      SESSION_DURATION2,
      request
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
    clearSessionCookie(headers, request);
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
async function deleteStaff(env, userId, deletingAdminId) {
  const target = await env.DB.prepare(
    `
      SELECT
        id,
        name,
        email,
        role
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
  if (Number(userId) === Number(deletingAdminId)) {
    return {
      error: "You cannot delete your own account",
      status: 400
    };
  }
  if (target.role === "admin") {
    const adminCount = await env.DB.prepare(
      `
          SELECT COUNT(*) AS count
          FROM users
          WHERE role = 'admin'
          `
    ).first();
    if (Number(adminCount?.count || 0) <= 1) {
      return {
        error: "Cannot delete the last admin",
        status: 400
      };
    }
  }
  await env.DB.prepare(
    `
      DELETE FROM users
      WHERE id = ?
      `
  ).bind(userId).run();
  return {
    deleted: true,
    staff: target
  };
}
__name(deleteStaff, "deleteStaff");
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
async function deleteStaffController(request, env) {
  const token = getSessionToken(request);
  if (!token) {
    return Response.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
  const user = await getUserFromSession(
    env,
    token
  );
  if (!user) {
    return Response.json(
      {
        error: "Invalid or expired session"
      },
      { status: 401 }
    );
  }
  if (user.role !== "admin") {
    return Response.json(
      {
        error: "Admin access required"
      },
      { status: 403 }
    );
  }
  const url = new URL(request.url);
  const parts = url.pathname.split("/");
  const userId = Number(parts[3]);
  if (!Number.isInteger(userId) || userId <= 0) {
    return Response.json(
      {
        error: "Invalid staff ID"
      },
      { status: 400 }
    );
  }
  try {
    const result = await deleteStaff(
      env,
      userId,
      user.id
    );
    if (result.error) {
      return Response.json(
        {
          error: result.error
        },
        {
          status: result.status || 400
        }
      );
    }
    await createAuditLog(
      env,
      {
        userId: user.id,
        action: "DELETE_STAFF",
        entityType: "staff",
        entityId: result.staff.id,
        details: JSON.stringify({
          deletedName: result.staff.name,
          deletedEmail: result.staff.email,
          deletedRole: result.staff.role
        })
      }
    );
    return Response.json({
      message: "Staff account deleted successfully",
      staff: result.staff
    });
  } catch (error) {
    console.error(
      "Delete staff error:",
      error
    );
    return Response.json(
      {
        error: "Failed to delete staff account"
      },
      { status: 500 }
    );
  }
}
__name(deleteStaffController, "deleteStaffController");
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
  if (request.method === "DELETE" && /^\/api\/staff\/\d+$/.test(
    url.pathname
  )) {
    return deleteStaffController(
      request,
      env
    );
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
async function deleteAuditLogsController(request, env) {
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
    const body = await request.json();
    const ids = body.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json(
        { error: "No audit logs selected" },
        { status: 400 }
      );
    }
    const validIds = [
      ...new Set(
        ids.map(Number).filter(
          (id) => Number.isInteger(id) && id > 0
        )
      )
    ];
    if (validIds.length === 0) {
      return Response.json(
        { error: "Invalid audit log IDs" },
        { status: 400 }
      );
    }
    const deletedCount = await deleteAuditLogs(
      env,
      validIds
    );
    await createAuditLog(env, {
      userId: user.id,
      action: "DELETE_AUDIT_LOGS",
      entityType: "audit_logs",
      details: JSON.stringify({
        deletedCount,
        deletedIds: validIds
      })
    });
    return Response.json({
      message: "Audit logs deleted successfully",
      deletedCount
    });
  } catch (error) {
    console.error(
      "Delete audit logs error:",
      error
    );
    return Response.json(
      { error: "Unable to delete audit logs" },
      { status: 500 }
    );
  }
}
__name(deleteAuditLogsController, "deleteAuditLogsController");
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
  if (request.method === "DELETE" && url.pathname === "/api/audit-logs") {
    return deleteAuditLogsController(request, env);
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
async function deleteNewsImage(env, imageUrl) {
  if (!imageUrl) {
    return {
      attempted: false,
      deleted: false,
      reason: "No image"
    };
  }
  try {
    const url = new URL(imageUrl);
    const publicPrefix = "/storage/v1/object/public/tnp-images/";
    if (!url.pathname.startsWith(publicPrefix)) {
      console.warn(
        "Skipping unknown image URL:",
        imageUrl
      );
      return {
        attempted: false,
        deleted: false,
        reason: "Unknown image URL"
      };
    }
    const filePath = decodeURIComponent(
      url.pathname.slice(publicPrefix.length)
    );
    if (!filePath) {
      return {
        attempted: false,
        deleted: false,
        reason: "Invalid image path"
      };
    }
    const response = await fetch(
      `${env.SUPABASE_URL}/storage/v1/object/tnp-images/${filePath}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
          apikey: env.SUPABASE_SECRET_KEY
        }
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Failed to delete Supabase image:",
        filePath,
        errorText
      );
      return {
        attempted: true,
        deleted: false,
        filePath,
        reason: "Supabase deletion failed"
      };
    }
    return {
      attempted: true,
      deleted: true,
      filePath
    };
  } catch (error) {
    console.error(
      "Supabase image deletion error:",
      error
    );
    return {
      attempted: true,
      deleted: false,
      reason: "Supabase deletion error"
    };
  }
}
__name(deleteNewsImage, "deleteNewsImage");
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

        COALESCE(
          creator.name,
          n.created_by_name
        ) AS created_by_name,

        COALESCE(
          creator.email,
          n.created_by_email
        ) AS created_by_email,

        COALESCE(
          updater.name,
          n.updated_by_name
        ) AS updated_by_name,

        COALESCE(
          updater.email,
          n.updated_by_email
        ) AS updated_by_email

      FROM news n

      LEFT JOIN users creator
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

        COALESCE(
          creator.name,
          n.created_by_name
        ) AS created_by_name,

        COALESCE(
          creator.email,
          n.created_by_email
        ) AS created_by_email,

        COALESCE(
          updater.name,
          n.updated_by_name
        ) AS updated_by_name,

        COALESCE(
          updater.email,
          n.updated_by_email
        ) AS updated_by_email

      FROM news n

      LEFT JOIN users creator
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
      SELECT
        id,
        title,
        image
      FROM news
      WHERE pinned = 0
      ORDER BY
        created_at DESC,
        id DESC
      LIMIT -1 OFFSET 30
      `
  ).all();
  const oldNews = result.results;
  if (oldNews.length === 0) {
    return {
      deletedIds: [],
      imageDeletionResults: []
    };
  }
  const deletedIds = [];
  const imageDeletionResults = [];
  for (const news of oldNews) {
    await env.DB.prepare(
      `
        DELETE FROM news
        WHERE id = ?
        `
    ).bind(news.id).run();
    const imageDeletion = await deleteNewsImage(
      env,
      news.image
    );
    deletedIds.push(news.id);
    imageDeletionResults.push({
      newsId: news.id,
      title: news.title,
      ...imageDeletion
    });
  }
  return {
    deletedIds,
    imageDeletionResults
  };
}
__name(cleanupNonPinnedNews, "cleanupNonPinnedNews");
async function createNews(env, {
  title,
  content,
  image,
  createdBy
}) {
  const creator = await env.DB.prepare(
    `
      SELECT
        name,
        email
      FROM users
      WHERE id = ?
      `
  ).bind(createdBy).first();
  if (!creator) {
    return {
      error: "Creator account not found",
      status: 404
    };
  }
  const news = await env.DB.prepare(
    `
      INSERT INTO news (
        title,
        content,
        image,
        created_by,
        created_by_name,
        created_by_email
      )
      VALUES (?, ?, ?, ?, ?, ?)

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
        updated_by,
        created_by_name,
        created_by_email,
        updated_by_name,
        updated_by_email
      `
  ).bind(
    title,
    content,
    image ?? null,
    createdBy,
    creator.name,
    creator.email
  ).first();
  const cleanupResult = await cleanupNonPinnedNews(env);
  return {
    news,
    deletedIds: cleanupResult.deletedIds,
    imageDeletionResults: cleanupResult.imageDeletionResults
  };
}
__name(createNews, "createNews");
async function updateNews(env, newsId, {
  title,
  content,
  image,
  updatedBy
}) {
  const existing = await getNewsById(
    env,
    newsId
  );
  if (!existing) {
    return null;
  }
  const updater = await env.DB.prepare(
    `
      SELECT
        name,
        email
      FROM users
      WHERE id = ?
      `
  ).bind(updatedBy).first();
  if (!updater) {
    return {
      error: "Updater account not found",
      status: 404
    };
  }
  const news = await env.DB.prepare(
    `
      UPDATE news
      SET
        title = ?,
        content = ?,
        image = ?,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = ?,
        updated_by_name = ?,
        updated_by_email = ?

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
        updated_by,
        created_by_name,
        created_by_email,
        updated_by_name,
        updated_by_email
      `
  ).bind(
    title,
    content,
    image ?? null,
    updatedBy,
    updater.name,
    updater.email,
    newsId
  ).first();
  let imageDeletion = null;
  if (existing.image && existing.image !== news.image) {
    imageDeletion = await deleteNewsImage(
      env,
      existing.image
    );
  }
  return {
    news,
    imageDeletion
  };
}
__name(updateNews, "updateNews");
async function deleteNews(env, newsId) {
  const existing = await getNewsById(
    env,
    newsId
  );
  if (!existing) {
    return null;
  }
  await env.DB.prepare(
    `
      DELETE FROM news
      WHERE id = ?
      `
  ).bind(newsId).run();
  const imageDeletion = await deleteNewsImage(
    env,
    existing.image
  );
  return {
    ...existing,
    imageDeletion
  };
}
__name(deleteNews, "deleteNews");
async function toggleNewsPin(env, newsId) {
  const existing = await getNewsById(
    env,
    newsId
  );
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
        updated_by,
        created_by_name,
        created_by_email,
        updated_by_name,
        updated_by_email
      `
  ).bind(
    newPinnedState,
    newPinnedState ? (/* @__PURE__ */ new Date()).toISOString() : null,
    newsId
  ).first();
  const cleanupResult = newPinnedState === 0 ? await cleanupNonPinnedNews(env) : {
    deletedIds: [],
    imageDeletionResults: []
  };
  return {
    news,
    previousPinned: existing.pinned,
    pinned: newPinnedState,
    deletedIds: cleanupResult.deletedIds,
    imageDeletionResults: cleanupResult.imageDeletionResults
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
        automaticallyDeletedIds: result.deletedIds,
        imageDeletionResults: result.imageDeletionResults
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
        title: result.news.title,
        imageDeletion: result.imageDeletion
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
        title: news.title,
        imageDeletion: news.imageDeletion
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
        automaticallyDeletedIds: result.deletedIds,
        imageDeletionResults: result.imageDeletionResults
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

// src/routes/uploadRoutes.js
init_modules_watch_stub();
init_authService();
var MAX_FILE_SIZE = 10 * 1024 * 1024;
var ALLOWED_TYPES = /* @__PURE__ */ new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
]);
async function handleUploadRoute(request, env) {
  const url = new URL(request.url);
  if (request.method !== "POST" || url.pathname !== "/api/uploads/news-image") {
    return null;
  }
  const sessionToken = getSessionToken(request);
  if (!sessionToken) {
    return Response.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
  const user = await getUserFromSession(env, sessionToken);
  if (!user) {
    return Response.json(
      { error: "Invalid or expired session" },
      { status: 401 }
    );
  }
  if (user.role !== "admin" && user.role !== "editor") {
    return Response.json(
      { error: "You do not have permission to upload images" },
      { status: 403 }
    );
  }
  let formData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { error: "Invalid multipart form data" },
      { status: 400 }
    );
  }
  const file = formData.get("image");
  if (!(file instanceof File)) {
    return Response.json(
      { error: "No image was provided" },
      { status: 400 }
    );
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json(
      {
        error: "Only JPEG, PNG, WebP, and GIF images are allowed"
      },
      { status: 400 }
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      {
        error: "Image must be 10 MB or smaller"
      },
      { status: 400 }
    );
  }
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${crypto.randomUUID()}.${extension}`;
  const filePath = `news/${fileName}`;
  const fileBuffer = await file.arrayBuffer();
  const uploadResponse = await fetch(
    `${env.SUPABASE_URL}/storage/v1/object/tnp-images/${filePath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
        apikey: env.SUPABASE_SECRET_KEY,
        "Content-Type": file.type,
        "x-upsert": "false"
      },
      body: fileBuffer
    }
  );
  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error(
      "Supabase image upload failed:",
      errorText
    );
    return Response.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
  const imageUrl = `${env.SUPABASE_URL}/storage/v1/object/public/tnp-images/${filePath}`;
  return Response.json({
    image: imageUrl
  });
}
__name(handleUploadRoute, "handleUploadRoute");

// src/routes/adminRoutes.js
init_modules_watch_stub();

// src/controllers/adminController.js
init_modules_watch_stub();

// src/services/analyticsService.js
init_modules_watch_stub();
async function recordVisit(env) {
  await env.DB.prepare(
    `
      INSERT INTO visits (visited_at)
      VALUES (CURRENT_TIMESTAMP)
      `
  ).run();
}
__name(recordVisit, "recordVisit");
async function getVisitStats(env) {
  const result = await env.DB.prepare(
    `
      SELECT
        COUNT(
          CASE
            WHEN date(visited_at) = date('now')
            THEN 1
          END
        ) AS today,

        COUNT(
          CASE
            WHEN date(visited_at) >= date('now', 'weekday 0', '-6 days')
            THEN 1
          END
        ) AS week,

        COUNT(
          CASE
            WHEN strftime('%Y-%m', visited_at) =
                 strftime('%Y-%m', 'now')
            THEN 1
          END
        ) AS month

      FROM visits
      `
  ).first();
  return {
    today: result?.today ?? 0,
    week: result?.week ?? 0,
    month: result?.month ?? 0
  };
}
__name(getVisitStats, "getVisitStats");
async function getDailyVisits(env, days) {
  const safeDays = Math.min(
    Math.max(Number(days) || 7, 1),
    365
  );
  const result = await env.DB.prepare(
    `
      SELECT
        date(visited_at) AS date,
        COUNT(*) AS visits
      FROM visits
      WHERE visited_at >= datetime(
        'now',
        ?
      )
      GROUP BY date(visited_at)
      ORDER BY date(visited_at) ASC
      `
  ).bind(`-${safeDays - 1} days`).all();
  return result.results;
}
__name(getDailyVisits, "getDailyVisits");

// src/controllers/adminController.js
init_authService();
async function recordVisitController(request, env) {
  try {
    await recordVisit(env);
    return Response.json({
      message: "Visit recorded"
    });
  } catch (error) {
    console.error("Record visit error:", error);
    return Response.json(
      { error: "Unable to record visit" },
      { status: 500 }
    );
  }
}
__name(recordVisitController, "recordVisitController");
async function getAnalyticsController(request, env) {
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
  const url = new URL(request.url);
  const requestedRange = Number(
    url.searchParams.get("range")
  );
  const allowedRanges = [7, 30, 90, 180, 365];
  const range = allowedRanges.includes(requestedRange) ? requestedRange : 7;
  try {
    const [stats, daily] = await Promise.all([
      getVisitStats(env),
      getDailyVisits(env, range)
    ]);
    return Response.json({
      stats,
      daily,
      range
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    return Response.json(
      { error: "Unable to retrieve analytics" },
      { status: 500 }
    );
  }
}
__name(getAnalyticsController, "getAnalyticsController");
async function refreshInstagramStatsController(request, env) {
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
    const stats = await refreshInstagramStats(env);
    if (!stats) {
      return Response.json(
        {
          error: "Unable to fetch latest Instagram statistics"
        },
        { status: 502 }
      );
    }
    return Response.json({
      message: "Instagram statistics refreshed successfully",
      stats
    });
  } catch (error) {
    console.error(
      "Manual Instagram refresh error:",
      error
    );
    return Response.json(
      {
        error: "Unable to refresh Instagram statistics"
      },
      { status: 500 }
    );
  }
}
__name(refreshInstagramStatsController, "refreshInstagramStatsController");

// src/routes/adminRoutes.js
async function handleAdminRoute(request, env) {
  const url = new URL(request.url);
  if (request.method === "POST" && url.pathname === "/api/admin/analytics/visit") {
    return recordVisitController(request, env);
  }
  if (request.method === "POST" && url.pathname === "/api/admin/instagram/refresh") {
    return refreshInstagramStatsController(
      request,
      env
    );
  }
  if (request.method === "GET" && url.pathname === "/api/admin/analytics") {
    return getAnalyticsController(request, env);
  }
  return null;
}
__name(handleAdminRoute, "handleAdminRoute");

// src/workers/worker.js
var worker_default = {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(refreshInstagramStats(env));
  },
  async fetch(request, env) {
    const adminResponse = await handleAdminRoute(
      request,
      env
    );
    if (adminResponse) {
      return adminResponse;
    }
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
    const uploadResponse = await handleUploadRoute(request, env);
    if (uploadResponse) {
      return uploadResponse;
    }
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

// .wrangler/tmp/bundle-X8i4Q9/middleware-insertion-facade.js
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

// .wrangler/tmp/bundle-X8i4Q9/middleware-loader.entry.ts
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
