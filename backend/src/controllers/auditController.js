import { getSessionToken } from "../utils/cookies.js";
import { getUserFromSession } from "../services/authService.js";
import {
  getAuditLogs,
  deleteAuditLogs,
  createAuditLog,
} from "../services/auditService.js";

export async function deleteAuditLogsController(request, env) {
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
        ids
          .map(Number)
          .filter(
            (id) =>
              Number.isInteger(id) &&
              id > 0
          )
      ),
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

    // Record the deletion itself.
    await createAuditLog(env, {
      userId: user.id,
      action: "DELETE_AUDIT_LOGS",
      entityType: "audit_logs",
      details: JSON.stringify({
        deletedCount,
        deletedIds: validIds,
      }),
    });

    return Response.json({
      message: "Audit logs deleted successfully",
      deletedCount,
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

export async function getAuditLogsController(request, env) {
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
      logs,
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
