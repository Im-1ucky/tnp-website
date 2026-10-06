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
  await env.DB
    .prepare(
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
    )
    .bind(
      userId,
      action,
      entityType,
      entityId,
      details
    )
    .run();
}

export async function getAuditLogs(env) {
  const result = await env.DB
    .prepare(
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
    )
    .all();

  return result.results;
}
