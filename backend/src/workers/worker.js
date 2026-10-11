import {
  refreshInstagramStats,
} from "../services/instagramService.js";
import { handleAuthRoute } from "../routes/authRoutes.js";
import { handleStaffRoute } from "../routes/staffRoutes.js";
import { handleAuditRoute } from "../routes/auditRoutes.js";
import { handleNewsRoute } from "../routes/newsRoutes.js";
import { handleUploadRoute } from "../routes/uploadRoutes.js";
import { handleAdminRoute } from "../routes/adminRoutes.js";
import { cleanupOldAuditLogs } from "../services/auditService.js";

const STATS_KEY = "instagram_stats";


export default {

  async scheduled(controller, env, ctx) {
    // Refresh Instagram stats every hour.
    ctx.waitUntil(
      refreshInstagramStats(env).catch((error) => {
        console.error("Instagram stats refresh failed:", error);
      })
    );

    // Clean up audit logs only at midnight UTC.
    if (controller.cron === "0 0 * * *") {
      ctx.waitUntil(
        cleanupOldAuditLogs(env).catch((error) => {
          console.error("Audit log cleanup failed:", error);
        })
      );
    }
  },


  async fetch(request, env) {

    const adminResponse = await handleAdminRoute(
      request,
      env
    );

    if (adminResponse) {
      return adminResponse;
    }

    const authResponse = await handleAuthRoute(request, env);

    if (authResponse) {
      return authResponse;
    }

    const staffResponse = await handleStaffRoute(request, env);

    if (staffResponse) {
      return staffResponse;
    }

    const auditResponse = await handleAuditRoute(
      request,
      env
    );

    if (auditResponse) {
      return auditResponse;
    }

    const newsResponse = await handleNewsRoute(
      request,
      env
    );

    const uploadResponse = await handleUploadRoute(request, env);

    if (uploadResponse) {
      return uploadResponse;
    }

    if (newsResponse) {
      return newsResponse;
    }

    const url = new URL(request.url);

    // Existing Instagram route
    if (
      request.method === "GET" &&
      url.pathname === "/api/instagram/stats"
    ) {
      const storedStats = await env.INSTAGRAM_STATS.get(
        "instagram_stats",
        "json"
      );

      if (!storedStats) {
        return Response.json(
          { error: "Instagram stats are not available yet" },
          { status: 503 }
        );
      }

      return Response.json(storedStats);
    }

    return Response.json(
      { error: "Not found" },
      { status: 404 }
    );
  }
};
