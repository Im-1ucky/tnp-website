import {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  toggleNewsPin,
} from "../services/newsService.js";

import { getSessionToken } from "../utils/cookies.js";
import { getUserFromSession } from "../services/authService.js";
import { createAuditLog } from "../services/auditService.js";

// =========================
// GET ALL NEWS
// Public
// =========================

export async function getNewsController(request, env) {
  try {
    const news = await getAllNews(env);

    return Response.json({
      news,
    });
  } catch (error) {
    console.error("Get news error:", error);

    return Response.json(
      { error: "Unable to retrieve news" },
      { status: 500 }
    );
  }
}

// =========================
// CREATE NEWS
// Admin + Editor
// =========================

export async function createNewsController(request, env) {
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

  if (!["admin", "editor"].includes(user.role)) {
    return Response.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const title = body.title?.trim();
  const content = body.content?.trim();
  const image = body.image?.trim() || null;

  if (!title || !content) {
    return Response.json(
      {
        error: "Title and content are required",
      },
      { status: 400 }
    );
  }

  try {
    const result = await createNews(env, {
      title,
      content,
      image,
      createdBy: user.id,
    });

    await createAuditLog(env, {
      userId: user.id,
      action: "CREATE_NEWS",
      entityType: "news",
      entityId: result.news.id,
      details: JSON.stringify({
        title: result.news.title,
        automaticallyDeletedIds: result.deletedIds,
      }),
    });

    return Response.json(
      {
        message: "News created successfully",
        news: result.news,
        deletedIds: result.deletedIds,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create news error:", error);

    return Response.json(
      { error: "Unable to create news" },
      { status: 500 }
    );
  }
}

// =========================
// UPDATE NEWS
// Admin + Editor
// =========================

export async function updateNewsController(request, env) {
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

  if (!["admin", "editor"].includes(user.role)) {
    return Response.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  const url = new URL(request.url);

  const newsId = Number(
    url.pathname.split("/")[3]
  );

  if (!Number.isInteger(newsId) || newsId <= 0) {
    return Response.json(
      { error: "Invalid news ID" },
      { status: 400 }
    );
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const title = body.title?.trim();
  const content = body.content?.trim();
  const image = body.image?.trim() || null;

  if (!title || !content) {
    return Response.json(
      {
        error: "Title and content are required",
      },
      { status: 400 }
    );
  }

  try {
    const result = await updateNews(
      env,
      newsId,
      {
        title,
        content,
        image,
        updatedBy: user.id,
      }
    );

    if (!result) {
      return Response.json(
        { error: "News article not found" },
        { status: 404 }
      );
    }

    await createAuditLog(env, {
      userId: user.id,
      action: "UPDATE_NEWS",
      entityType: "news",
      entityId: newsId,
      details: JSON.stringify({
        title: result.news.title,
      }),
    });

    return Response.json({
      message: "News updated successfully",
      news: result.news,
    });
  } catch (error) {
    console.error("Update news error:", error);

    return Response.json(
      { error: "Unable to update news" },
      { status: 500 }
    );
  }
}

// =========================
// DELETE NEWS
// Admin + Editor
// =========================

export async function deleteNewsController(request, env) {
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

  if (!["admin", "editor"].includes(user.role)) {
    return Response.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  const url = new URL(request.url);

  const newsId = Number(
    url.pathname.split("/")[3]
  );

  if (!Number.isInteger(newsId) || newsId <= 0) {
    return Response.json(
      { error: "Invalid news ID" },
      { status: 400 }
    );
  }

  try {
    const news = await deleteNews(env, newsId);

    if (!news) {
      return Response.json(
        { error: "News article not found" },
        { status: 404 }
      );
    }

    await createAuditLog(env, {
      userId: user.id,
      action: "DELETE_NEWS",
      entityType: "news",
      entityId: newsId,
      details: JSON.stringify({
        title: news.title,
      }),
    });

    return Response.json({
      message: "News deleted successfully",
      news,
    });
  } catch (error) {
    console.error("Delete news error:", error);

    return Response.json(
      { error: "Unable to delete news" },
      { status: 500 }
    );
  }
}

// =========================
// PIN / UNPIN NEWS
// Admin + Editor
// =========================

export async function toggleNewsPinController(
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

  if (!["admin", "editor"].includes(user.role)) {
    return Response.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  const url = new URL(request.url);

  const newsId = Number(
    url.pathname.split("/")[3]
  );

  if (!Number.isInteger(newsId) || newsId <= 0) {
    return Response.json(
      { error: "Invalid news ID" },
      { status: 400 }
    );
  }

  try {
    const result = await toggleNewsPin(
      env,
      newsId
    );

    if (!result) {
      return Response.json(
        { error: "News article not found" },
        { status: 404 }
      );
    }

    const action = result.pinned
      ? "PIN_NEWS"
      : "UNPIN_NEWS";

    await createAuditLog(env, {
      userId: user.id,
      action,
      entityType: "news",
      entityId: newsId,
      details: JSON.stringify({
        title: result.news.title,
        previousPinned: result.previousPinned,
        pinned: result.pinned,
        automaticallyDeletedIds:
          result.deletedIds,
      }),
    });

    return Response.json({
      message: result.pinned
        ? "News pinned successfully"
        : "News unpinned successfully",
      news: result.news,
      deletedIds: result.deletedIds,
    });
  } catch (error) {
    console.error(
      "Toggle news pin error:",
      error
    );

    return Response.json(
      { error: "Unable to update news pin status" },
      { status: 500 }
    );
  }
}
