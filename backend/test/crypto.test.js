import { describe, expect, test } from "bun:test";
import {
  hashPassword,
  verifyPassword,
  hashToken,
  generateToken,
} from "../src/utils/crypto.js";

describe("password hashing", () => {
  test("verifies the correct password", async () => {
    const hash = await hashPassword("Example-password-123!");

    expect(await verifyPassword("Example-password-123!", hash))
      .toBe(true);
  });

  test("rejects an incorrect password", async () => {
    const hash = await hashPassword("Example-password-123!");

    expect(await verifyPassword("Wrong-password", hash))
      .toBe(false);
  });

  test("uses a different salt for each password hash", async () => {
    const first = await hashPassword("Example-password-123!");
    const second = await hashPassword("Example-password-123!");

    expect(first).not.toBe(second);
    expect(await verifyPassword("Example-password-123!", first))
      .toBe(true);
    expect(await verifyPassword("Example-password-123!", second))
      .toBe(true);
  });

  test("rejects a malformed stored hash", async () => {
    expect(await verifyPassword("password", "invalid"))
      .toBe(false);
  });
});

describe("session token utilities", () => {
  test("generates a 64-character hexadecimal token", () => {
    const token = generateToken();

    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  test("generates distinct tokens", () => {
    expect(generateToken()).not.toBe(generateToken());
  });

  test("returns a consistent SHA-256 hash for a token", async () => {
    const first = await hashToken("sample-token");
    const second = await hashToken("sample-token");

    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
  });

  test("different tokens produce different hashes", async () => {
    expect(await hashToken("token-a"))
      .not.toBe(await hashToken("token-b"));
  });
});
