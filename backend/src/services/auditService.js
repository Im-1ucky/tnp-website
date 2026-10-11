
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
      .prepare(`
        SELECT name, email
        FROM users
        WHERE id = ?
      `)
      .bind(userId)
      .first();

    if (user) {
      userName = user.name;
      userEmail = user.email;
    }
  }

  await env.DB
    .prepare(`
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
    `)
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
}

/* =========================================================
   GET AUDIT LOGS
   ========================================================= */

export async function getAuditLogs(env) {
  const result = await env.DB
    .prepare(`
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
    `)
    .bind(DASHBOARD_AUDIT_LOGS)
    .all();

  return result.results;
}

/* =========================================================
   CLEAN UP AUDIT LOGS OLDER THAN 90 DAYS
   ========================================================= */

export async function cleanupOldAuditLogs(env) {
  const result = await env.DB
    .prepare(`
      DELETE FROM audit_logs
      WHERE datetime(created_at) < datetime('now', '-90 days')
    `)
    .run();

  const deletedCount = result.meta?.changes ?? 0;

  if (deletedCount > 0) {
    console.log(
      `Deleted ${deletedCount} audit logs older than 90 days.`
    );
  }

  return deletedCount;
}
