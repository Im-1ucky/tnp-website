const MAX_AUDIT_LOGS = 1000;
const DASHBOARD_AUDIT_LOGS = 100;


/* =========================================================
   CREATE AUDIT LOG
   ========================================================= */

export async function createAuditLog(
  env,
  {
    userId,
    action,
    entityType,
    entityId = null,
    details = null,
  }
) {
  let userName = null;
  let userEmail = null;

  if (userId !== null && userId !== undefined) {
    const user = await env.DB
      .prepare(
        `
        SELECT
          name,
          email
        FROM users
        WHERE id = ?
        `
      )
      .bind(userId)
      .first();

    if (user) {
      userName = user.name;
      userEmail = user.email;
    }
  }

  await env.DB
    .prepare(
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
    )
    .bind(
      userId ?? null,
      userName,
      userEmail,
      action,
      entityType,
      entityId,
      details
    )
    .run();

  /*
   * Keep only the newest 1000 audit logs.
   */
  await env.DB
    .prepare(
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
    )
    .bind(MAX_AUDIT_LOGS)
    .run();
}


/* =========================================================
   GET AUDIT LOGS
   ========================================================= */

export async function getAuditLogs(env) {
  const result = await env.DB
    .prepare(
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
    )
    .bind(DASHBOARD_AUDIT_LOGS)
    .all();

  return result.results;
}


/* =========================================================
   DELETE SELECTED AUDIT LOGS
   ========================================================= */

export async function deleteAuditLogs(
  env,
  ids
) {
  if (
    !Array.isArray(ids) ||
    ids.length === 0
  ) {
    return 0;
  }

  const placeholders = ids
    .map(() => "?")
    .join(", ");

  const result = await env.DB
    .prepare(
      `
      DELETE FROM audit_logs
      WHERE id IN (${placeholders})
      `
    )
    .bind(...ids)
    .run();

  return result.meta?.changes ?? 0;
}
