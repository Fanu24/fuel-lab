import { betterAuth } from "better-auth";
import { importPKCS8, SignJWT } from "jose";
import type { D1Database } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  APPLE_CLIENT_ID?: string;
  APPLE_TEAM_ID?: string;
  APPLE_KEY_ID?: string;
  APPLE_PRIVATE_KEY?: string;
  RESEND_API_KEY?: string;
}

export interface Context<P = Record<string, string>> {
  env: Env;
  request: Request;
  params: P;
  waitUntil?: (promise: Promise<unknown>) => void;
}

export function originOf(request: Request): string {
  const url = new URL(request.url);
  if (url.hostname === "fuelchef.it" || url.hostname === "www.fuelchef.it") return "https://fuelchef.it";
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return url.origin;
  if (url.hostname.endsWith(".fuelchef.pages.dev")) return url.origin;
  return "https://fuelchef.it";
}

async function appleSecret(env: Env) {
  const key = await importPKCS8(env.APPLE_PRIVATE_KEY!.replace(/\\n/g, "\n"), "ES256");
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: env.APPLE_KEY_ID! })
    .setIssuer(env.APPLE_TEAM_ID!)
    .setSubject(env.APPLE_CLIENT_ID!)
    .setAudience("https://appleid.apple.com")
    .setIssuedAt(now)
    .setExpirationTime(now + 30 * 24 * 60 * 60)
    .sign(key);
}

async function sendAuthEmail(env: Env, to: string, subject: string, url: string) {
  if (!env.RESEND_API_KEY) throw new Error("EMAIL_NOT_CONFIGURED");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "FUEL LAB <accesso@fuelchef.it>",
      to: [to],
      subject,
      text: `${subject}\n\nApri questo link per continuare:\n${url}\n\nSe non hai richiesto questa operazione, ignora questa email.\n\nFUEL LAB · Via del Santuario 214, Pescara`,
    }),
  });
  if (!response.ok) throw new Error(`EMAIL_SEND_FAILED_${response.status}`);
}

export function createAuth(env: Env, request: Request, waitUntil?: Context["waitUntil"]) {
  if (!env.DB || !env.BETTER_AUTH_SECRET) throw new Error("AUTH_NOT_CONFIGURED");
  const appleReady = !!(env.APPLE_CLIENT_ID && env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY);
  const mailReady = !!env.RESEND_API_KEY;
  const deliver = async (to: string, subject: string, url: string) => {
    const task = sendAuthEmail(env, to, subject, url);
    if (waitUntil) waitUntil(task.catch((error) => console.error("Auth email failed", error)));
    else await task;
  };
  return betterAuth({
    appName: "FUEL LAB",
    baseURL: originOf(request),
    secret: env.BETTER_AUTH_SECRET,
    database: env.DB,
    trustedOrigins: ["https://fuelchef.it", "https://www.fuelchef.it", "https://appleid.apple.com", originOf(request)],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: mailReady,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      autoSignIn: true,
      revokeSessionsOnPasswordReset: true,
      ...(mailReady ? { sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
        await deliver(user.email, "Reimposta la password FUEL LAB", url);
      } } : {}),
    },
    ...(mailReady ? { emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
        await deliver(user.email, "Verifica la tua email FUEL LAB", url);
      },
    } } : {}),
    socialProviders: {
      ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
        : {}),
      ...(appleReady
        ? { apple: async () => ({ clientId: env.APPLE_CLIENT_ID!, clientSecret: await appleSecret(env) }) }
        : {}),
    },
    rateLimit: { enabled: true, window: 60, max: 20 },
  });
}

export async function currentUser(env: Env, request: Request) {
  const auth = createAuth(env, request);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return null;
  const staff = await env.DB.prepare("SELECT role FROM staff_roles WHERE user_id = ?")
    .bind(session.user.id).first<{ role: string }>();
  return { ...session.user, role: staff?.role === "admin" && session.user.emailVerified ? "admin" as const : "customer" as const };
}
