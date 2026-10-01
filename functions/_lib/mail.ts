import type { Context, Env } from "./auth";
import type { ContenutoEmail } from "../../lib/server/email";

/**
 * Invio email via Resend. Le email di accesso (verifica, password) passano da
 * inviaEmail e possono fallire; le notifiche (richieste, messaggi, stati)
 * passano da accodaEmail e non fanno mai fallire la richiesta del browser.
 */

export const MITTENTE = "FUEL LAB <accesso@fuelchef.it>";

export type Email = ContenutoEmail & { to: string[]; replyTo?: string };

/** Com'e' andata: "saltata" quando manca RESEND_API_KEY (tipico in locale). */
export type EsitoEmail = "inviata" | "saltata" | "fallita";

/** Dove arrivano gli avvisi per Matteo. */
export const emailMatteo = (env: Env) => env.ADMIN_NOTIFY_EMAIL?.trim() || "info@fuelchef.it";

/**
 * Una seconda possibilita' ai guasti passeggeri di Resend (rete, tempo scaduto, 429, 5xx): una notifica persa
 * e' una richiesta che Matteo non sa di avere, un link di accesso perso e' un cliente che non entra.
 */
export const RIPROVA = { tentativi: 2, pausaMs: 800 };

/** Spedisce subito. Lancia se Resend rifiuta; ritorna false se l'email non e' configurata. */
export async function inviaEmail(env: Env, email: Email): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    console.warn(`Email saltata, RESEND_API_KEY assente: "${email.subject}"`);
    return false;
  }
  // La stessa chiave a ogni tentativo: se il primo e' arrivato ma la risposta si e' persa, Resend non spedisce due volte.
  const chiave = crypto.randomUUID();
  let ultimo: unknown;
  for (let tentativo = 1; tentativo <= RIPROVA.tentativi; tentativo++) {
    if (tentativo > 1) await new Promise((fatto) => setTimeout(fatto, RIPROVA.pausaMs));
    let response: Response;
    try {
      response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": chiave,
        },
        body: JSON.stringify({
          from: MITTENTE,
          to: email.to,
          subject: email.subject,
          text: email.text,
          html: email.html,
          ...(email.replyTo ? { reply_to: email.replyTo } : {}),
        }),
        // Resend che non risponde non deve tenere appesa la registrazione o la notifica per sempre.
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      ultimo = error;
      continue;
    }
    if (response.ok) return true;
    // Il motivo detto da Resend (dominio non verificato, chiave scaduta, quota finita) finisce nei log: senza, sembra sempre "fallita".
    const motivo = (await response.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 200);
    ultimo = new Error(`EMAIL_SEND_FAILED_${response.status}${motivo ? `: ${motivo}` : ""}`);
    // Un rifiuto vero (dominio non verificato, destinatario non valido) non cambia riprovando.
    if (response.status !== 429 && response.status < 500) break;
  }
  throw ultimo;
}

/**
 * Notifica "spara e dimentica": con waitUntil continua dopo la risposta e qui
 * non si aspetta. Non lancia mai. `dopo` riceve l'esito (es. per scrivere
 * l'evento `email` nella storia dell'ordine).
 */
export async function accodaEmail(
  { env, waitUntil }: Pick<Context, "env" | "waitUntil">,
  email: Email,
  dopo?: (esito: EsitoEmail) => Promise<unknown>,
): Promise<void> {
  const task = (async () => {
    let esito: EsitoEmail;
    try {
      esito = (await inviaEmail(env, email)) ? "inviata" : "saltata";
    } catch (error) {
      console.error(`Email non inviata: "${email.subject}"`, error);
      esito = "fallita";
    }
    if (dopo) {
      try {
        await dopo(esito);
      } catch (error) {
        console.error("Registrazione dell'esito email non riuscita", error);
      }
    }
  })();
  if (waitUntil) waitUntil(task);
  else await task;
}
