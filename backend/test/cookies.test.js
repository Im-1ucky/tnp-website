import { describe, expect, test } from "bun:test";
import {
  setSessionCookie,
  clearSessionCookie,
  getSessionToken,
} from "../src/utils/cookies.js";

describe("getSessionToken", () => {
  test("returns null when there is no cookie", () => {
    expect(
      getSessionToken(new Request("https://example.com"))
    ).toBeNull();
  });

  test("returns the session token", () => {
    const request = new Request("https://example.com", {
      headers: { Cookie: "tnp_session=abc123" },
    });

    expect(getSessionToken(request)).toBe("abc123");
  });

  test("finds the session among multiple cookies", () => {
    const request = new Request("https://example.com", {
      headers: {
        Cookie: "theme=dark; tnp_session=abc123; lang=en",
      },
    });

    expect(getSessionToken(request)).toBe("abc123");
  });

  test("returns null for an empty session cookie", () => {
    const request = new Request("https://example.com", {
      headers: { Cookie: "tnp_session=" },
    });

    expect(getSessionToken(request)).toBeNull();
  });

  test("preserves equals signs inside a token", () => {
    const request = new Request("https://example.com", {
      headers: { Cookie: "tnp_session=abc=123" },
    });

    expect(getSessionToken(request)).toBe("abc=123");
  });
});

describe("session cookie headers", () => {
  test("sets secure HttpOnly cookie over HTTPS", () => {
    const headers = new Headers();

    setSessionCookie(
      headers,
      "abc123",
      604800,
      new Request("https://example.com"),
    );

    const cookie = headers.get("Set-Cookie");

    expect(cookie).toContain("tnp_session=abc123");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=604800");
  });

  test("does not set Secure for HTTP requests", () => {
    const headers = new Headers();

    setSessionCookie(
      headers,
      "abc123",
      3600,
      new Request("http://localhost"),
    );

    expect(headers.get("Set-Cookie")).not.toContain("Secure");
  });

  test("clears the session cookie", () => {
    const headers = new Headers();

    clearSessionCookie(
      headers,
      new Request("https://example.com"),
    );

    const cookie = headers.get("Set-Cookie");

    expect(cookie).toContain("tnp_session=");
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
  });
});
