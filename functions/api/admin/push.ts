import { currentUser, soloAdmin, type Context } from "../../_lib/auth";
import { bodyJson, json, sameOrigin } from "../../_lib/http";
import type { IscrizionePush } from "../../../lib/server/webpush";

/** Le stesse soglie della tabella push_iscrizioni (migrations/0010_pannello_semplice.sql). */
function leggiIscrizione(body: Record<string, unknown> | null): IscrizionePush | null {
  const endpoint = body?.endpoint;
  const keys = body?.keys;
  if (typeof endpoint !== "string" || !keys || typeof keys !== "object") return null;
  const { p256dh, auth } = keys as Record<string, unknown>;
  if (typeof p256dh !== "string" || typeof auth !== "string") return null;
  if (!endpoint.startsWith("https://") || endpoint.length < 10 || endpoint.length > 1000) return null;
  if (p256dh.length < 80 || p256dh.length > 100 || auth.length < 16 || auth.length > 30) return null;
  return { endpoint, p256dh, auth };
}

/** GET /api/admin/push — la chiave pubblica VAPID che il browser di Matteo usa per iscriversi (null se non c'e'). */
export const onRequestGet = async ({ env, request }: Context) => {
  const vietato = soloAdmin(await currentUser(env, request));
  if (vietato) return vietato;
  return json({ publicKey: env.VAPID_PUBLIC_KEY?.trim() || null });
};

/** POST /api/admin/push — registra il dispositivo di Matteo; rifare la stessa iscrizione non crea un doppione. */
export const onRequestPost = async ({ env, request }: Context) => {
  if (!sameOrigin(request)) return json({ error: "Ricarica la pagina e riprova." }, 403);
  const vietato = soloAdmin(await currentUser(env, request));
  if (vietato) return vietato;
  const iscrizione = leggiIscrizione(await bodyJson(request, 4000));
  if (!iscrizione) return json({ error: "Iscrizione non valida." }, 400);
  await env.DB.prepare(
    `INSERT INTO push_iscrizioni (endpoint, p256dh, auth) VALUES (?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth`,
  ).bind(iscrizione.endpoint, iscrizione.p256dh, iscrizione.auth).run();
  return json({ ok: true });
};

/** DELETE /api/admin/push — toglie il dispositivo indicato da `endpoint`. */
export const onRequestDelete = async ({ env, request }: Context) => {
  if (!sameOrigin(request)) return json({ error: "Ricarica la pagina e riprova." }, 403);
  const vietato = soloAdmin(await currentUser(env, request));
  if (vietato) return vietato;
  const body = await bodyJson(request, 4000);
  const endpoint = body?.endpoint;
  if (typeof endpoint !== "string" || !endpoint) return json({ error: "Iscrizione non valida." }, 400);
  await env.DB.prepare("DELETE FROM push_iscrizioni WHERE endpoint = ?").bind(endpoint).run();
  return json({ ok: true });
};
