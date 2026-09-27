import { json } from "../_lib/http";

/**
 * Rete di sicurezza per tutte le API: un errore inatteso (D1 irraggiungibile,
 * bug) diventa un JSON in italiano invece della pagina d'errore di Cloudflare,
 * cosi' lib/api.ts mostra un messaggio sensato.
 */
export const onRequest = async ({ next }: { next: () => Promise<Response> }) => {
  try {
    return await next();
  } catch (error) {
    console.error("API error", error);
    return json({ error: "Servizio non disponibile. Riprova tra poco." }, 500);
  }
};
