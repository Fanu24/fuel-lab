import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { importPKCS8, SignJWT } from "jose";
import type { D1Database } from "@cloudflare/workers-types";
import { datiUtentePuliti } from "../../lib/server/account";
import { emailAccesso } from "../../lib/server/email";
import { json } from "./http";
import { inviaEmail } from "./mail";

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
  /** Dove arrivano gli avvisi per Matteo (nuove richieste, messaggi). Predefinito: info@fuelchef.it. */
  ADMIN_NOTIFY_EMAIL?: string;
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
  await inviaEmail(env, { to: [to], ...emailAccesso(subject, url) });
}

/**
 * Pulizia dopo la cancellazione dell'account. D1 applica gia' le foreign key
 * (profilo, piano, ordini con i loro eventi, ruoli spariscono in cascata; i
 * messaggi di contatto restano senza collegamento): queste istruzioni sono una
 * rete di sicurezza e, se la cascata ha funzionato, non toccano niente.
 */
async function puliziaDopoCancellazione(env: Env, userId: string) {
  await env.DB.batch([
    env.DB.prepare("DELETE FROM order_events WHERE order_id IN (SELECT id FROM orders WHERE user_id=?)").bind(userId),
    env.DB.prepare("DELETE FROM orders WHERE user_id=?").bind(userId),
    env.DB.prepare("DELETE FROM saved_plans WHERE user_id=?").bind(userId),
    env.DB.prepare("DELETE FROM customer_profiles WHERE user_id=?").bind(userId),
    env.DB.prepare("DELETE FROM staff_roles WHERE user_id=?").bind(userId),
    env.DB.prepare("UPDATE contact_messages SET user_id=NULL WHERE user_id=?").bind(userId),
  ]);
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
    // Il limite di richieste e le sessioni si riconoscono dall'indirizzo del visitatore. Su Cloudflare l'unico che
    // il visitatore non puo' falsificare e' CF-Connecting-IP. Di X-Forwarded-For better-auth si fida solo se ha un
    // valore: se manca, o ne arriva uno inventato (Cloudflare ne aggiunge il suo in coda), nessun indirizzo e'
    // affidabile e tutti dividono lo stesso contatore (3 accessi ogni 10 secondi in tutto il sito: a Matteo e ai
    // clienti basterebbe un solo malintenzionato per non poter piu' entrare). I cookie sono "Secure" se il sito e' https.
    advanced: {
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"], ipv6Subnet: 64 },
      useSecureCookies: originOf(request).startsWith("https://"),
    },
    // Nome e immagine dell'utente arrivano dal browser: lunghezze e formato si decidono qui (lib/server/account.ts).
    databaseHooks: {
      user: {
        create: { before: async (user) => ({ data: datiUtentePuliti(user, true) }) },
        update: { before: async (user) => ({ data: datiUtentePuliti(user, false) }) },
      },
    },
    hooks: {
      // Eliminare un account e' irreversibile: chi ha una password la deve scrivere. better-auth, senza password,
      // si accontenta di una sessione aperta da meno di un giorno (pensata per chi entra solo con Google): a chi ha
      // trovato un telefono sbloccato basterebbe questo. Il sito manda sempre la password agli account con password.
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/delete-user") return;
        const corpo = (ctx.body ?? {}) as { password?: unknown; token?: unknown };
        if (corpo.password || corpo.token) return;
        const sessione = await getSessionFromCtx(ctx);
        if (!sessione) return;
        const credenziali = await ctx.context.internalAdapter.findCredentialAccount(sessione.user.id);
        if (credenziali?.password) {
          throw APIError.from("BAD_REQUEST", { code: "INVALID_PASSWORD", message: "Per eliminare l'account scrivi la tua password." });
        }
      }),
    },
    user: {
      // POST /api/auth/delete-user: con { password } per gli account email; senza password
      // (account Google) solo se l'accesso risale a meno di un giorno (freshAge).
      deleteUser: {
        enabled: true,
        beforeDelete: async (user) => {
          const staff = await env.DB.prepare("SELECT role FROM staff_roles WHERE user_id = ?").bind(user.id).first<{ role: string }>();
          if (staff) {
            throw APIError.from("FORBIDDEN", {
              code: "ADMIN_ACCOUNT_PROTECTED",
              message: "L'account amministratore è protetto e non si può cancellare dal sito.",
            });
          }
        },
        afterDelete: async (user) => {
          await puliziaDopoCancellazione(env, user.id);
        },
      },
    },
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
  return {
    ...session.user,
    role: staff?.role === "admin" && session.user.emailVerified ? "admin" as const : "customer" as const,
    /** Account di Matteo che deve ancora verificare l'email: per ora e' un cliente. */
    adminInAttesa: staff?.role === "admin" && !session.user.emailVerified,
  };
}

export type UtenteCorrente = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

/** 401 senza sessione, 403 se non e' Matteo, null se puo' passare. Il ruolo si decide solo qui, mai nel browser. */
export function soloAdmin(user: UtenteCorrente | null): Response | null {
  if (!user) return json({ error: "Accedi per continuare" }, 401);
  if (user.role !== "admin") return json({ error: "Riservato a Matteo" }, 403);
  return null;
}
