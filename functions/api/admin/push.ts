import { currentUser, soloAdmin, type Context } from "../../_lib/auth";
import { bodyJson, json, sameOrigin } from "../../_lib/http";
import { b64urlAByte, type IscrizionePush } from "../../../lib/server/webpush";

const BASE64URL = /^[A-Za-z0-9_-]+$/;

/** I byte di una chiave in base64url, o null se non si decodificano. */
function decodifica(testo: string): Uint8Array<ArrayBuffer> | null {
  try {
    return b64urlAByte(testo);
  } catch {
    return null;
  }
}

/**
 * Un'iscrizione che il browser non puo' usare non va salvata: fallirebbe a ogni invio senza mai essere tolta.
 * Stesse soglie della tabella push_iscrizioni (migrations/0010_pannello_semplice.sql), piu' il controllo che
 * endpoint e chiavi siano davvero quello che dicono di essere: un URL https, una chiave P-256 valida, 16 byte di auth.
 */
async function leggiIscrizione(body: Record<string, unknown> | null): Promise<IscrizionePush | null> {
  const endpoint = body?.endpoint;
  const keys = body?.keys;
  if (typeof endpoint !== "string" || !keys || typeof keys !== "object") return null;
  const { p256dh, auth } = keys as Record<string, unknown>;
  if (typeof p256dh !== "string" || typeof auth !== "string") return null;

  if (endpoint.length < 10 || endpoint.length > 1000) return null;
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;

  if (p256dh.length < 80 || p256dh.length > 100 || auth.length < 16 || auth.length > 30) return null;
  if (!BASE64URL.test(p256dh) || !BASE64URL.test(auth)) return null;
  const punto = decodifica(p256dh);
  if (!punto || punto.byteLength !== 65) return null;
  try {
    await crypto.subtle.importKey("raw", punto, { name: "ECDH", namedCurve: "P-256" }, false, []);
  } catch {
    return null;
  }
  const segreto = decodifica(auth);
  if (!segreto || segreto.byteLength !== 16) return null;
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
  const iscrizione = await leggiIscrizione(await bodyJson(request, 4000));
  if (!iscrizione) return json({ error: "Iscrizione alle notifiche non valida." }, 400);
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
