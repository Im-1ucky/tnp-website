import {
  loginUser,
  logoutUser,
} from "../services/authService.js";

import {
  setSessionCookie,
  clearSessionCookie,
  getSessionToken,
} from "../utils/cookies.js";

const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days

// =========================
// LOGIN
// =========================

export async function login(request, env) {
  try {
    const body = await request.json();

    const email = body.email?.trim();
    const password = body.password;

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const result = await loginUser(
      env,
      email,
      password
    );

    if (!result) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const headers = new Headers({
      "Content-Type": "application/json",
    });

    setSessionCookie(
      headers,
      result.token,
      SESSION_DURATION
    );

    return new Response(
      JSON.stringify({
        user: result.user,
      }),
      {
        status: 200,
        headers,
      }
    );
  } catch (error) {
    console.error("Login error:", error);

    return Response.json(
      { error: "Unable to log in" },
      { status: 500 }
    );
  }
}


// =========================
// LOGOUT
// =========================

export async function logout(request, env) {
  try {
    const token = getSessionToken(request);

    await logoutUser(env, token);

    const headers = new Headers({
      "Content-Type": "application/json",
    });

    clearSessionCookie(headers);

    return new Response(
      JSON.stringify({
        message: "Logged out successfully",
      }),
      {
        status: 200,
        headers,
      }
    );
  } catch (error) {
    console.error("Logout error:", error);

    return Response.json(
      { error: "Unable to log out" },
      { status: 500 }
    );
  }
}


// =========================
// CURRENT USER
// =========================

export async function me(request, env) {
  const token = getSessionToken(request);

  if (!token) {
    return Response.json(
      { user: null },
      { status: 200 }
    );
  }

  const { getUserFromSession } =
    await import("../services/authService.js");

  const user = await getUserFromSession(
    env,
    token
  );

  return Response.json({
    user: user ?? null,
  });
}
