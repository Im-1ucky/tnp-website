import { hashPassword } from "../utils/crypto.js";

export async function updateStaffRole(
  env,
  userId,
  newRole
) {
  const target = await env.DB
    .prepare(
      `
      SELECT id, name, email, role
      FROM users
      WHERE id = ?
      `
    )
    .bind(userId)
    .first();

  if (!target) {
    return {
      error: "Staff account not found",
      status: 404,
    };
  }

  // Nothing to change.
  if (target.role === newRole) {
    return {
      staff: target,
      previousRole: target.role,
      changed: false,
    };
  }

  // Prevent removing the final admin.
  if (
    target.role === "admin" &&
    newRole === "editor"
  ) {
    const adminCount = await env.DB
      .prepare(
        `
        SELECT COUNT(*) AS count
        FROM users
        WHERE role = 'admin'
        `
      )
      .first();

    if (adminCount.count <= 1) {
      return {
        error: "Cannot demote the last admin",
        status: 400,
      };
    }
  }

  const previousRole = target.role;

  const staff = await env.DB
    .prepare(
      `
      UPDATE users
      SET
        role = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      RETURNING id, name, email, role, created_at, updated_at
      `
    )
    .bind(newRole, userId)
    .first();

  return {
    staff,
    previousRole,
    changed: true,
  };
}

export async function createStaff(
  env,
  { name, email, password }
) {
  const passwordHash = await hashPassword(password);

  const staff = await env.DB
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

  return staff;
}

export async function getAllStaff(env) {
  const result = await env.DB
    .prepare(
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
    )
    .all();

  return result.results;
}

export async function resetStaffPassword(
  env,
  userId,
  newPassword
) {
  const target = await env.DB
    .prepare(
      `
      SELECT id, name, email, role
      FROM users
      WHERE id = ?
      `
    )
    .bind(userId)
    .first();

  if (!target) {
    return {
      error: "Staff account not found",
      status: 404,
    };
  }

  const passwordHash = await hashPassword(
    newPassword
  );

  await env.DB
    .prepare(
      `
      UPDATE users
      SET
        password_hash = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `
    )
    .bind(passwordHash, userId)
    .run();

  // Invalidate all existing sessions for this account.
  await env.DB
    .prepare(
      `
      DELETE FROM sessions
      WHERE user_id = ?
      `
    )
    .bind(userId)
    .run();

  return {
    staff: target,
  };
}
