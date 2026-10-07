import { getInstagramStats } from "../services/instagramService.js";
import { handleAuthRoute } from "../routes/authRoutes.js";
import { handleStaffRoute } from "../routes/staffRoutes.js";
import { handleAuditRoute } from "../routes/auditRoutes.js";
import { handleNewsRoute } from "../routes/newsRoutes.js";
import { handleUploadRoute } from "../routes/uploadRoutes.js";

const STATS_KEY = "instagram_stats";

async function fetchAndStoreStats(env) {
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Instagram stats attempt ${attempt}/${MAX_RETRIES}`);

      const stats = await getInstagramStats(
        env.INSTAGRAM_ACCESS_TOKEN
      );

      const data = {
        ...stats,
        lastUpdated: new Date().toISOString(),
        lastUpdateSuccessful: true,
      };

      await env.INSTAGRAM_STATS.put(
        STATS_KEY,
        JSON.stringify(data)
      );

      console.log("Instagram stats updated successfully.");

      return data;
    } catch (error) {
      console.error(
        `Instagram stats attempt ${attempt} failed:`,
        error.message
      );

      if (attempt < MAX_RETRIES) {
        // Wait 2 seconds before retrying
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  console.error(
    "Instagram stats failed after all retries. Keeping old stats."
  );

  return null;
}

export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(fetchAndStoreStats(env));
  },

  async fetch(request, env) {
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
