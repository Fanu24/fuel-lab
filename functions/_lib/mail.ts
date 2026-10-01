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

/** Spedisce subito. Lancia se Resend rifiuta; ritorna false se l'email non e' configurata. */
export async function inviaEmail(env: Env, email: Email): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    console.warn(`Email saltata, RESEND_API_KEY assente: "${email.subject}"`);
    return false;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
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
  if (!response.ok) {
    // Il motivo detto da Resend (dominio non verificato, chiave scaduta, quota finita) finisce nei log: senza, sembra sempre "fallita".
    const motivo = (await response.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 200);
    throw new Error(`EMAIL_SEND_FAILED_${response.status}${motivo ? `: ${motivo}` : ""}`);
  }
  return true;
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
