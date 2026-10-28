import type { Context } from "../../_lib/auth";
import { adminCookie, ADMIN_SESSION_SECONDS, currentAdminSession, digest, readAdminToken, reserveAdminAttempt, verifyAdminPassword } from "../../_lib/admin-access";
import { bodyJson, json, sameOrigin } from "../../_lib/http";

export const onRequestGet = async ({ env, request }: Context) => {
  const user = await currentAdminSession(env, request);
  return json({ authenticated: !!user, user: user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null });
};

export const onRequestPost = async ({ env, request }: Context) => {
  if (!sameOrigin(request)) return json({ error: "Ricarica la pagina e riprova." }, 403);
  const body = await bodyJson(request, 1024);
  if (!body || typeof body.password !== "string" || body.password.length > 128 || !body.password) return json({ error: "Scrivi la password." }, 400);
  const attempt = await reserveAdminAttempt(env, request);
  if (!attempt.allowed) {
    const response = json({ error: "Troppi tentativi. Riprova tra 15 minuti." }, 429);
    response.headers.set("Retry-After", String(attempt.retryAfter));
    return response;
  }
  const credentials = await env.DB.prepare(`SELECT c.password_hash FROM admin_access_credentials c
    JOIN user u ON u.id = c.user_id JOIN staff_roles r ON r.user_id = u.id AND r.role = 'admin'
    WHERE c.id = 'matteo' AND c.enabled = 1 AND lower(u.email) = 'info@fuelchef.it' LIMIT 1`).first<{ password_hash: string }>();
  if (!credentials) return json({ error: "Accesso non ancora configurato. Contatta chi gestisce il sito." }, 503);
  if (!await verifyAdminPassword(body.password, credentials.password_hash)) return json({ error: "Password non corretta." }, 401);
  const token = [...crypto.getRandomValues(new Uint8Array(32))].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const now = Math.floor(Date.now() / 1000);
  const previous = readAdminToken(request);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM admin_access_sessions WHERE expires_at <= ? OR token_hash = ?").bind(now, previous ? await digest(previous) : ""),
    env.DB.prepare("DELETE FROM admin_access_attempts WHERE window_start < ?").bind(now - 24 * 60 * 60),
    env.DB.prepare("INSERT INTO admin_access_sessions(token_hash, credential_id, credential_hash, expires_at) VALUES (?, 'matteo', ?, ?)").bind(await digest(token), credentials.password_hash, now + ADMIN_SESSION_SECONDS),
  ]);
  const response = json({ authenticated: true });
  response.headers.set("Set-Cookie", adminCookie(request, token));
  return response;
};

export const onRequestDelete = async ({ env, request }: Context) => {
  if (!sameOrigin(request)) return json({ error: "Ricarica la pagina e riprova." }, 403);
  const token = readAdminToken(request);
  if (token) await env.DB.prepare("DELETE FROM admin_access_sessions WHERE token_hash = ?").bind(await digest(token)).run();
  const response = json({ authenticated: false });
  response.headers.set("Set-Cookie", adminCookie(request, "", 0));
  return response;
};
