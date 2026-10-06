import {
  getNewsController,
  createNewsController,
  updateNewsController,
  deleteNewsController,
  toggleNewsPinController,
} from "../controllers/newsController.js";

export async function handleNewsRoute(request, env) {
  const url = new URL(request.url);

  // GET /api/news
  if (
    request.method === "GET" &&
    url.pathname === "/api/news"
  ) {
    return getNewsController(request, env);
  }

  // POST /api/news
  if (
    request.method === "POST" &&
    url.pathname === "/api/news"
  ) {
    return createNewsController(request, env);
  }

  // PATCH /api/news/:id/pin
  if (
    request.method === "PATCH" &&
    url.pathname.match(/^\/api\/news\/\d+\/pin$/)
  ) {
    return toggleNewsPinController(request, env);
  }

  // PATCH /api/news/:id
  if (
    request.method === "PATCH" &&
    url.pathname.match(/^\/api\/news\/\d+$/)
  ) {
    return updateNewsController(request, env);
  }

  // DELETE /api/news/:id
  if (
    request.method === "DELETE" &&
    url.pathname.match(/^\/api\/news\/\d+$/)
  ) {
    return deleteNewsController(request, env);
  }

  return null;
}
