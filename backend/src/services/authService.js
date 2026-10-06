import {
  generateToken,
  hashToken,
  hashPassword,
  verifyPassword,
} from "../utils/crypto.js";

const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days

function getExpiryDate() {
  return new Date(
    Date.now() + SESSION_DURATION * 1000
  ).toISOString();
}

// =========================
// LOGIN
// =========================

export async function loginUser(env, email, password) {
  const user = await env.DB
    .prepare(
      `
      SELECT id, name, email, password_hash, role
      FROM users
      WHERE email = ?
      `
    )
    .bind(email.toLowerCase().trim())
    .first();

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

  await env.DB
    .prepare(
      `
      INSERT INTO sessions (
        id,
        user_id,
        token_hash,
        expires_at
      )
      VALUES (?, ?, ?, ?)
      `
    )
    .bind(
      sessionId,
      user.id,
      tokenHash,
      expiresAt
    )
    .run();

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    expiresAt,
  };
}

// =========================
// SESSION VALIDATION
// =========================

export async function getUserFromSession(env, token) {
  if (!token) {
    return null;
  }

  const tokenHash = await hashToken(token);

  const session = await env.DB
    .prepare(
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
    )
    .bind(tokenHash)
    .first();

  if (!session) {
    return null;
  }

  const expiresAt = new Date(session.expires_at);

  if (expiresAt <= new Date()) {
    await env.DB
      .prepare(
        `
        DELETE FROM sessions
        WHERE id = ?
        `
      )
      .bind(session.session_id)
      .run();

    return null;
  }

  return {
    id: session.id,
    name: session.name,
    email: session.email,
    role: session.role,
  };
}

// =========================
// LOGOUT
// =========================

export async function logoutUser(env, token) {
  if (!token) {
    return;
  }

  const tokenHash = await hashToken(token);

  await env.DB
    .prepare(
      `
      DELETE FROM sessions
      WHERE token_hash = ?
      `
    )
    .bind(tokenHash)
    .run();
}

// =========================
// CREATE USER
// =========================

export async function createUser(
  env,
  { name, email, password }
) {
  const passwordHash = await hashPassword(password);

  const result = await env.DB
    .prepare(
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
    )
    .bind(
      name.trim(),
      email.toLowerCase().trim(),
      passwordHash
    )
    .first();

  return result;
}
