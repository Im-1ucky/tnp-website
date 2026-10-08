import {
  recordVisit,
  getVisitStats,
  getDailyVisits,
} from "../services/analyticsService.js";

import {
  refreshInstagramStats,
} from "../services/instagramService.js";

import { getSessionToken } from "../utils/cookies.js";
import { getUserFromSession } from "../services/authService.js";



// =========================
// RECORD PUBLIC VISIT
// =========================

export async function recordVisitController(request, env) {
  try {
    await recordVisit(env);

    return Response.json({
      message: "Visit recorded",
    });
  } catch (error) {
    console.error("Record visit error:", error);

    return Response.json(
      { error: "Unable to record visit" },
      { status: 500 }
    );
  }
}


// =========================
// GET ADMIN ANALYTICS
// =========================

export async function getAnalyticsController(request, env) {
  // =========================
  // AUTHENTICATION
  // =========================

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

  // =========================
  // AUTHORIZATION
  // =========================

  if (user.role !== "admin") {
    return Response.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  // =========================
  // GET RANGE
  // =========================

  const url = new URL(request.url);

  const requestedRange = Number(
    url.searchParams.get("range")
  );

  const allowedRanges = [7, 30, 90, 180, 365];

  const range = allowedRanges.includes(requestedRange)
    ? requestedRange
    : 7;

  // =========================
  // GET ANALYTICS
  // =========================

  try {
    const [stats, daily] = await Promise.all([
      getVisitStats(env),
      getDailyVisits(env, range),
    ]);

    return Response.json({
      stats,
      daily,
      range,
    });
  } catch (error) {
    console.error("Get analytics error:", error);

    return Response.json(
      { error: "Unable to retrieve analytics" },
      { status: 500 }
    );
  }
}

export async function refreshInstagramStatsController(
  request,
  env
) {
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
    const stats = await refreshInstagramStats(env);

    if (!stats) {
      return Response.json(
        {
          error:
            "Unable to fetch latest Instagram statistics",
        },
        { status: 502 }
      );
    }

    return Response.json({
      message: "Instagram statistics refreshed successfully",
      stats,
    });
  } catch (error) {
    console.error(
      "Manual Instagram refresh error:",
      error
    );

    return Response.json(
      {
        error:
          "Unable to refresh Instagram statistics",
      },
      { status: 500 }
    );
  }
}
