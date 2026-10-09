import { describe, expect, test } from "bun:test";
import { requireAuth } from "../src/middleware/auth.js";

function makeRequest(token) {
  const headers = token
    ? { Cookie: `tnp_session=${token}` }
    : {};

  return new Request("https://example.com/api/admin", {
    headers,
  });
}

function makeEnv(session = null) {
  const deletedSessions = [];

  const env = {
    deletedSessions,
    DB: {
      prepare(sql) {
        return {
          bind(...params) {
            if (sql.includes("DELETE FROM sessions")) {
              return {
                run: async () => {
                  deletedSessions.push(params[0]);
                  return { success: true };
                },
              };
            }

            return {
              first: async () => session,
            };
          },
        };
      },
    },
  };

  return env;
}

describe("requireAuth", () => {
  test("rejects requests without a session cookie", async () => {
    const result = await requireAuth(
      makeRequest(null),
      makeEnv(),
    );

    expect(result.authorized).toBe(false);
    expect(result.response.status).toBe(401);
    expect(await result.response.json()).toEqual({
      error: "Authentication required",
    });
  });

  test("rejects an invalid session", async () => {
    const result = await requireAuth(
      makeRequest("invalid-token"),
      makeEnv(null),
    );

    expect(result.authorized).toBe(false);
    expect(result.response.status).toBe(401);
    expect(await result.response.json()).toEqual({
      error: "Invalid or expired session",
    });
  });

  test("authorizes a valid admin session", async () => {
    const env = makeEnv({
      session_id: "session-1",
      expires_at: new Date(Date.now() + 60_000).toISOString(),
      id: "user-1",
      name: "Test Admin",
      email: "admin@example.test",
      role: "admin",
    });

    const result = await requireAuth(
      makeRequest("valid-token"),
      env,
    );

    expect(result.authorized).toBe(true);
    expect(result.token).toBe("valid-token");
    expect(result.user).toEqual({
      id: "user-1",
      name: "Test Admin",
      email: "admin@example.test",
      role: "admin",
    });
  });

  test("authorizes a valid editor session", async () => {
    const env = makeEnv({
      session_id: "session-2",
      expires_at: new Date(Date.now() + 60_000).toISOString(),
      id: "user-2",
      name: "Test Editor",
      email: "editor@example.test",
      role: "editor",
    });

    const result = await requireAuth(
      makeRequest("editor-token"),
      env,
    );

    expect(result.authorized).toBe(true);
    expect(result.user.role).toBe("editor");
  });

  test("rejects expired sessions and deletes them", async () => {
    const env = makeEnv({
      session_id: "expired-session",
      expires_at: new Date(Date.now() - 60_000).toISOString(),
      id: "user-3",
      name: "Expired User",
      email: "expired@example.test",
      role: "editor",
    });

    const result = await requireAuth(
      makeRequest("expired-token"),
      env,
    );

    expect(result.authorized).toBe(false);
    expect(result.response.status).toBe(401);
    expect(await result.response.json()).toEqual({
      error: "Invalid or expired session",
    });
    expect(env.deletedSessions).toEqual(["expired-session"]);
  });
});
