import {
  login,
  logout,
  me,
} from "../controllers/authController.js";

export async function handleAuthRoute(request, env) {
  const url = new URL(request.url);

  if (request.method === "POST" && url.pathname === "/api/auth/login") {
    return login(request, env);
  }

  if (request.method === "POST" && url.pathname === "/api/auth/logout") {
    return logout(request, env);
  }

  if (request.method === "GET" && url.pathname === "/api/auth/me") {
    return me(request, env);
  }

  return null;
}
