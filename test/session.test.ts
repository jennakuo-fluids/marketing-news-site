import { beforeEach, describe, expect, it } from "vitest";
import {
  createSessionToken,
  safeReturnTo,
  timingSafeEqualStrings,
  verifyPassword,
  verifySessionToken,
} from "@/lib/session";

beforeEach(() => {
  process.env.SITE_PASSWORD = "correct-password";
  process.env.SESSION_SECRET = "test-session-secret";
});

describe("verifyPassword", () => {
  it("accepts the correct password", async () => {
    expect(await verifyPassword("correct-password")).toBe(true);
  });

  it("rejects a wrong password", async () => {
    expect(await verifyPassword("wrong-password")).toBe(false);
  });
});

describe("timingSafeEqualStrings", () => {
  it("is a normal equality check, just constant-time", () => {
    expect(timingSafeEqualStrings("abc", "abc")).toBe(true);
    expect(timingSafeEqualStrings("abc", "abd")).toBe(false);
    expect(timingSafeEqualStrings("abc", "ab")).toBe(false);
  });
});

describe("session tokens", () => {
  it("a freshly created token verifies", async () => {
    const token = await createSessionToken();
    expect(await verifySessionToken(token)).toBe(true);
  });

  it("rejects a missing token", async () => {
    expect(await verifySessionToken(undefined)).toBe(false);
    expect(await verifySessionToken(null)).toBe(false);
    expect(await verifySessionToken("")).toBe(false);
  });

  it("rejects a tampered signature", async () => {
    const token = await createSessionToken();
    const [body, sig] = token.split(".");
    const tamperedSig = sig.slice(0, -2) + (sig.slice(-2) === "AA" ? "BB" : "AA");
    expect(await verifySessionToken(`${body}.${tamperedSig}`)).toBe(false);
  });

  it("rejects a tampered payload (body edited without re-signing)", async () => {
    const token = await createSessionToken();
    const [, sig] = token.split(".");
    const forgedBody = Buffer.from(JSON.stringify({ exp: Date.now() + 999999, pwHash: "x" }))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(await verifySessionToken(`${forgedBody}.${sig}`)).toBe(false);
  });

  it("rejects an expired token", async () => {
    // Can't easily fabricate one without the signing key mismatched, so
    // verify indirectly: a token signed for -1ms expiry never verifies.
    const secret = process.env.SESSION_SECRET!;
    const password = process.env.SITE_PASSWORD!;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const pwHash = Buffer.from(
      await crypto.subtle.digest("SHA-256", enc.encode(password))
    ).toString("base64url");
    const body = Buffer.from(JSON.stringify({ exp: Date.now() - 1000, pwHash })).toString(
      "base64url"
    );
    const sigBytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(body)));
    const sig = Buffer.from(sigBytes).toString("base64url");
    expect(await verifySessionToken(`${body}.${sig}`)).toBe(false);
  });

  it("changing SITE_PASSWORD invalidates previously issued tokens", async () => {
    const token = await createSessionToken();
    expect(await verifySessionToken(token)).toBe(true);

    process.env.SITE_PASSWORD = "a-new-password";
    expect(await verifySessionToken(token)).toBe(false);
  });
});

describe("safeReturnTo", () => {
  it("allows a same-site path", () => {
    expect(safeReturnTo("/search?q=%E5%8F%B0%E9%9B%BB")).toBe("/search?q=%E5%8F%B0%E9%9B%BB");
  });

  it("falls back to / for missing input", () => {
    expect(safeReturnTo(undefined)).toBe("/");
    expect(safeReturnTo(null)).toBe("/");
    expect(safeReturnTo("")).toBe("/");
  });

  it("rejects protocol-relative URLs", () => {
    expect(safeReturnTo("//evil.example.com")).toBe("/");
  });

  it("rejects absolute URLs with a scheme", () => {
    expect(safeReturnTo("https://evil.example.com")).toBe("/");
    expect(safeReturnTo("javascript:alert(1)")).toBe("/");
  });

  it("rejects a path not starting with /", () => {
    expect(safeReturnTo("evil.example.com")).toBe("/");
  });
});
