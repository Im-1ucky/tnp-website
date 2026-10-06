import { getSessionToken } from "../utils/cookies.js";
import { getUserFromSession } from "../services/authService.js";

export async function requireAuth(request, env) {
  const token = getSessionToken(request);

  if (!token) {
    return {
      authorized: false,
      response: Response.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  const user = await getUserFromSession(env, token);

  if (!user) {
    return {
      authorized: false,
      response: Response.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      ),
    };
  }

  return {
    authorized: true,
    user,
    token,
  };
}
