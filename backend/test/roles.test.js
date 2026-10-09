import { describe, expect, test } from "bun:test";
import { requireRole } from "../src/middleware/roles.js";

describe("requireRole", () => {
  test("allows an admin on an admin-only route", () => {
    const check = requireRole("admin");
    const result = check({ id: 1, role: "admin" });

    expect(result).toBeNull();
  });

  test("rejects an editor on an admin-only route", async () => {
    const check = requireRole("admin");
    const result = check({ id: 2, role: "editor" });

    expect(result).toBeInstanceOf(Response);
    expect(result.status).toBe(403);
    expect(await result.json()).toEqual({
      error: "Insufficient permissions",
    });
  });

  test("allows an editor on an editor-only route", () => {
    const check = requireRole("editor");
    const result = check({ id: 2, role: "editor" });

    expect(result).toBeNull();
  });

  test("rejects a missing user with 401", async () => {
    const check = requireRole("admin");
    const result = check(null);

    expect(result).toBeInstanceOf(Response);
    expect(result.status).toBe(401);
    expect(await result.json()).toEqual({
      error: "Authentication required",
    });
  });

  test("rejects an unrecognized role with 403", () => {
    const check = requireRole("admin");
    const result = check({ id: 3, role: "unknown" });

    expect(result).toBeInstanceOf(Response);
    expect(result.status).toBe(403);
  });
});
