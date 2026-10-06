import {
  getAuditLogsController,
} from "../controllers/auditController.js";

export async function handleAuditRoute(request, env) {
  const url = new URL(request.url);

  if (
    request.method === "GET" &&
    url.pathname === "/api/audit-logs"
  ) {
    return getAuditLogsController(request, env);
  }

  return null;
}
