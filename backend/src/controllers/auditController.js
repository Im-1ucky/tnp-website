import { getSessionToken } from "../utils/cookies.js";
import { getUserFromSession } from "../services/authService.js";
import { getAuditLogs } from "../services/auditService.js";

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
