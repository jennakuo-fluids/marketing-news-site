// Shared-password session gate (handover §15). Uses only Web Crypto
// (crypto.subtle) and btoa/atob — no Node-only APIs — so this same module
// works unmodified in both middleware (Edge runtime) and server actions
// (Node.js runtime).

export const SESSION_COOKIE = "fcg_session";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

type SessionPayload = { exp: number; pwHash: string };

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} env var`);
  return v;
}

function bytesToBase64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function stringToBase64url(s: string): string {
  return bytesToBase64url(new TextEncoder().encode(s));
}

function base64urlToString(s: string): string {
  return new TextDecoder().decode(base64urlToBytes(s));
}

async function hmacSha256(key: string, message: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(message));
  return bytesToBase64url(new Uint8Array(sig));
}

async function sha256(message: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message));
  return bytesToBase64url(new Uint8Array(digest));
}

/**
 * Fixed-time string comparison so a wrong password or a forged cookie
 * signature can't be brute-forced faster by timing how many leading
 * characters matched. Not a cryptographic primitive, just a userland
 * constant-length loop — good enough for this app-level check.
 */
export function timingSafeEqualStrings(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    const ca = i < a.length ? a.charCodeAt(i) : 0;
    const cb = i < b.length ? b.charCodeAt(i) : 0;
    diff |= ca ^ cb;
  }
  return diff === 0;
}

export async function verifyPassword(submitted: string): Promise<boolean> {
  const expected = requireEnv("SITE_PASSWORD");
  return timingSafeEqualStrings(submitted, expected);
}

async function currentPasswordHash(): Promise<string> {
  return sha256(requireEnv("SITE_PASSWORD"));
}

export async function createSessionToken(): Promise<string> {
  const secret = requireEnv("SESSION_SECRET");
  const pwHash = await currentPasswordHash();
  const payload: SessionPayload = {
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    pwHash,
  };
  const body = stringToBase64url(JSON.stringify(payload));
  const sig = await hmacSha256(secret, body);
  return `${body}.${sig}`;
}

/**
 * Verifies signature, expiry, AND that the embedded password hash matches
 * the *current* SITE_PASSWORD — so rotating the password invalidates every
 * existing session immediately, with no separate revocation list.
 */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return false;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const secret = requireEnv("SESSION_SECRET");
  const expectedSig = await hmacSha256(secret, body);
  if (!timingSafeEqualStrings(sig, expectedSig)) return false;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(base64urlToString(body));
  } catch {
    return false;
  }
  if (typeof payload.exp !== "number" || Date.now() > payload.exp) return false;
  if (typeof payload.pwHash !== "string") return false;

  const currentHash = await currentPasswordHash();
  return timingSafeEqualStrings(payload.pwHash, currentHash);
}

/** No open redirect: only a same-site path (starts with exactly one "/") is allowed. */
export function safeReturnTo(raw: string | null | undefined): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  if (raw.startsWith("/\\") || /^\/[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) return "/";
  return raw;
}
