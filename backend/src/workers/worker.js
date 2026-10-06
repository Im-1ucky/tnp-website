import { getInstagramStats } from "../services/instagramService.js";

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
    const url = new URL(request.url);

    if (
      request.method === "GET" &&
      url.pathname === "/api/instagram/stats"
    ) {
      const storedStats = await env.INSTAGRAM_STATS.get(
        STATS_KEY,
        "json"
      );

      if (!storedStats) {
        return Response.json(
          {
            error: "Instagram stats are not available yet",
          },
          { status: 503 }
        );
      }

      return Response.json(storedStats);
    }

    return Response.json(
      {
        error: "Not found",
      },
      { status: 404 }
    );
  },
};
