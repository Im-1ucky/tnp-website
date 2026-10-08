import {
  recordVisitController,
  getAnalyticsController,
  refreshInstagramStatsController,
} from "../controllers/adminController.js";

export async function handleAdminRoute(request, env) {
  const url = new URL(request.url);

  // POST /api/admin/analytics/visit
  if (
    request.method === "POST" &&
    url.pathname === "/api/admin/analytics/visit"
  ) {
    return recordVisitController(request, env);
  }

  // POST /api/admin/instagram/refresh
  if (
    request.method === "POST" &&
    url.pathname === "/api/admin/instagram/refresh"
  ) {
    return refreshInstagramStatsController(
      request,
      env
    );
  }

  // GET /api/admin/analytics
  if (
    request.method === "GET" &&
    url.pathname === "/api/admin/analytics"
  ) {
    return getAnalyticsController(request, env);
  }

  return null;
}
