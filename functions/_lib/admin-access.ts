import type { Env } from "./auth";

export const ADMIN_SESSION_SECONDS = 90 * 24 * 60 * 60;
export const ADMIN_ATTEMPT_WINDOW = 15 * 60;
export const ADMIN_ATTEMPT_LIMIT = 8;
const ITERATIONS = 100_000;
const encoder = new TextEncoder();

function hex(bytes: ArrayBuffer | Uint8Array): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function digest(value: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

/** Usato solo dal provisioning server e dai test, mai importato dal client. */
export async function hashAdminPassword(password: string, salt = hex(crypto.getRandomValues(new Uint8Array(16)))) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: encoder.encode(salt), iterations: ITERATIONS, hash: "SHA-256" }, key, 256);
  return `pbkdf2-sha256:${ITERATIONS}:${salt}:${hex(bits)}`;
}

export async function verifyAdminPassword(password: string, encoded: string): Promise<boolean> {
  if (typeof password !== "string" || password.length > 128 || password.length === 0) return false;
  const match = /^pbkdf2-sha256:100000:([a-f0-9]{32}):([a-f0-9]{64})$/.exec(encoded);
  if (!match) return false;
  const calculated = await hashAdminPassword(password, match[1]);
  let difference = calculated.length ^ encoded.length;
  for (let index = 0; index < encoded.length; index++) difference |= calculated.charCodeAt(index) ^ encoded.charCodeAt(index);
  return difference === 0;
}

export function adminCookieName(request: Request) {
  return new URL(request.url).protocol === "https:" ? "__Host-fuelchef-admin" : "fuelchef-admin";
}

export function adminCookie(request: Request, token: string, maxAge = ADMIN_SESSION_SECONDS) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${adminCookieName(request)}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

export function readAdminToken(request: Request): string | null {
  const name = adminCookieName(request);
  const token = request.headers.get("Cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}

/** Il cookie del pannello non autentica le API dell'area cliente. */
export function supportsAdminSession(request: Request) {
  const path = new URL(request.url).pathname;
  return path.startsWith("/api/admin/") ||
    (path === "/api/orders" && request.method === "GET") ||
    (/^\/api\/orders\/[^/]+$/.test(path) && ["GET", "PATCH"].includes(request.method));
}

export type AdminIdentity = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  role: "admin";
  adminInAttesa: false;
};

export async function currentAdminSession(env: Env, request: Request): Promise<AdminIdentity | null> {
  const token = readAdminToken(request);
  if (!token) return null;
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare(`SELECT u.id, u.name, u.email, u.image, u.createdAt, u.updatedAt
    FROM admin_access_sessions s
    JOIN admin_access_credentials c ON c.id = s.credential_id AND c.password_hash = s.credential_hash
    JOIN user u ON u.id = c.user_id
    JOIN staff_roles r ON r.user_id = u.id AND r.role = 'admin'
    WHERE s.token_hash = ? AND s.expires_at > ? AND c.enabled = 1 AND lower(u.email) = 'info@fuelchef.it' LIMIT 1`)
    .bind(await digest(token), now).first<{ id: string; name: string; email: string; image: string | null; createdAt: string; updatedAt: string }>();
  if (!row) return null;
  return { ...row, createdAt: new Date(row.createdAt), updatedAt: new Date(row.updatedAt), emailVerified: true, role: "admin", adminInAttesa: false };
}

/** Contatore atomico in D1: richieste concorrenti condividono lo stesso tetto. */
export async function reserveAdminAttempt(env: Env, request: Request, now = Math.floor(Date.now() / 1000)) {
  const address = request.headers.get("CF-Connecting-IP") || "local-or-unknown";
  const addressHash = await digest(`admin-login:${address}`);
  const windowStart = Math.floor(now / ADMIN_ATTEMPT_WINDOW) * ADMIN_ATTEMPT_WINDOW;
  const row = await env.DB.prepare(`INSERT INTO admin_access_attempts(address_hash, window_start, attempts) VALUES (?, ?, 1)
    ON CONFLICT(address_hash, window_start) DO UPDATE SET attempts = attempts + 1 RETURNING attempts`)
    .bind(addressHash, windowStart).first<{ attempts: number }>();
  return { allowed: !!row && row.attempts <= ADMIN_ATTEMPT_LIMIT, retryAfter: windowStart + ADMIN_ATTEMPT_WINDOW - now };
}
