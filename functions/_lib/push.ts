import type { D1Database } from "@cloudflare/workers-types";
import type { Context } from "./auth";
import { richiestaPush, type ChiaviVapid, type IscrizionePush } from "../../lib/server/webpush";

/**
 * Notifica push a Matteo (Web Push con VAPID). Come accodaEmail: non fa mai fallire la richiesta del browser e,
 * con waitUntil, lavora dopo la risposta.
 */

export type MessaggioPush = { title: string; body: string; url: string };

/** Le tre chiavi, se sono tutte configurate; altrimenti null e le notifiche restano spente. */
function chiaviDa(env: Context["env"]): ChiaviVapid | null {
  const publicKey = env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = env.VAPID_PRIVATE_KEY?.trim();
  const subject = env.VAPID_SUBJECT?.trim();
  return publicKey && privateKey && subject ? { publicKey, privateKey, subject } : null;
}

/** Manda il messaggio a ogni iscrizione. Il browser che risponde 404 o 410 non e' piu' iscritto: la riga va via. */
async function inviaATutti(db: D1Database, chiavi: ChiaviVapid, testo: string) {
  const righe = await db.prepare("SELECT endpoint, p256dh, auth FROM push_iscrizioni").all<IscrizionePush>();
  const adesso = Math.floor(Date.now() / 1000);
  await Promise.all(righe.results.map(async (iscrizione) => {
    try {
      const risposta = await fetch(await richiestaPush(iscrizione, testo, chiavi, adesso));
      if (risposta.status === 404 || risposta.status === 410) {
        await db.prepare("DELETE FROM push_iscrizioni WHERE endpoint = ?").bind(iscrizione.endpoint).run();
      } else if (!risposta.ok) {
        console.error(`Notifica push rifiutata (${risposta.status})`);
      }
    } catch (error) {
      console.error("Notifica push non inviata", error);
    }
  }));
}

/** Non lancia mai. Senza le variabili VAPID non fa niente. */
export async function accodaPush(
  { env, waitUntil }: Pick<Context, "env" | "waitUntil">,
  messaggio: MessaggioPush,
): Promise<void> {
  const chiavi = chiaviDa(env);
  if (!chiavi) return;
  const task = inviaATutti(env.DB, chiavi, JSON.stringify(messaggio)).catch((error) => {
    console.error("Notifiche push non inviate", error);
  });
  if (waitUntil) waitUntil(task);
  else await task;
}
