import { hashPassword } from "../utils/crypto.js";

export async function deleteStaff(
  env,
  userId,
  deletingAdminId
) {
  const target = await env.DB
    .prepare(
      `
      SELECT
        id,
        name,
        email,
        role
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

  if (
    Number(userId) ===
    Number(deletingAdminId)
  ) {
    return {
      error: "You cannot delete your own account",
      status: 400,
    };
  }

  if (target.role === "admin") {
    const adminCount =
      await env.DB
        .prepare(
          `
          SELECT COUNT(*) AS count
          FROM users
          WHERE role = 'admin'
          `
        )
        .first();

    if (Number(adminCount?.count || 0) <= 1) {
      return {
        error: "Cannot delete the last admin",
        status: 400,
      };
    }
  }

  /*
   * Sessions are automatically deleted because
   * users -> sessions uses ON DELETE CASCADE.
   *
   * Audit logs are preserved because their user_id
   * now uses ON DELETE SET NULL.
   *
   * News remains untouched because creator/updater
   * identity is stored separately.
   */

  await env.DB
    .prepare(
      `
      DELETE FROM users
      WHERE id = ?
      `
    )
    .bind(userId)
    .run();

  return {
    deleted: true,
    staff: target,
  };
}

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
