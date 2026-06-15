import { isRole, type SessionUser } from "@/core/auth/roles";

/**
 * Stateless signed-session token using HMAC-SHA256 via the Web Crypto API.
 *
 * Web Crypto is available in BOTH the Edge runtime (middleware) and Node
 * (server actions/route handlers), so this single module verifies sessions
 * everywhere — no `next/headers` import, no Node-only crypto. The token is a
 * compact `base64url(payload).base64url(signature)` string.
 *
 * NOTE: this is a self-contained demo auth. In production you'd swap this for an
 * OIDC/IdP-issued JWT — but the verification boundary (middleware + server
 * guards) stays exactly the same.
 */

const ALG = { name: "HMAC", hash: "SHA-256" } as const;
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

interface TokenPayload extends SessionUser {
  iat: number;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET is missing or too short (>=16 chars required).");
  }
  return secret;
}

// ─── base64url helpers (no Buffer; edge-safe) ────────────────────────────────
function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromBase64Url(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
const enc = new TextEncoder();

/**
 * Copy a view into a standalone ArrayBuffer. TextEncoder/atob produce
 * `Uint8Array<ArrayBufferLike>`, which TS does not accept as `BufferSource`
 * (it could be SharedArrayBuffer-backed). Copying yields a plain ArrayBuffer.
 */
function buf(view: Uint8Array): ArrayBuffer {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
}

async function importKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", buf(enc.encode(getSecret())), ALG, false, [
    "sign",
    "verify",
  ]);
}

// ─── Public API ──────────────────────────────────────────────────────────────
export const SESSION_COOKIE = "ps_session";
export { COOKIE_MAX_AGE };

export async function signSession(user: SessionUser): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = { ...user, iat: now, exp: now + COOKIE_MAX_AGE };
  const body = toBase64Url(enc.encode(JSON.stringify(payload)));
  const key = await importKey();
  const sig = await crypto.subtle.sign(ALG, key, buf(enc.encode(body)));
  return `${body}.${toBase64Url(new Uint8Array(sig))}`;
}

export async function verifySession(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const sigPart = token.slice(dot + 1);

  try {
    const key = await importKey();
    const valid = await crypto.subtle.verify(
      ALG,
      key,
      buf(fromBase64Url(sigPart)),
      buf(enc.encode(body)),
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as TokenPayload;
    if (!isRole(payload.role)) return null;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;

    return { sub: payload.sub, email: payload.email, name: payload.name, role: payload.role };
  } catch {
    return null;
  }
}