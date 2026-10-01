import { json, MAX_CORPO_API } from "../_lib/http";

/**
 * Rete di sicurezza per tutte le API.
 * - Un errore inatteso (D1 irraggiungibile, bug) diventa un JSON in italiano
 *   invece della pagina d'errore di Cloudflare, cosi' lib/api.ts mostra un
 *   messaggio sensato.
 * - Un percorso che non esiste o un metodo non previsto (404, 405) risponde in
 *   JSON, non con la pagina 404 del sito (HTML) o con un corpo vuoto.
 * - Un corpo dichiarato piu' grande del tetto si rifiuta subito con 413.
 * - Ogni risposta delle API non si indicizza, non si "indovina" dal contenuto e
 *   di base non si conserva in cache: chi vuole altro (GET /api/settings) lo
 *   scrive da se'. Il file _headers vale solo per i file statici, non per le Function.
 */
export const onRequest = async ({ request, next }: { request: Request; next: () => Promise<Response> }) => {
  try {
    if (request.method !== "GET" && request.method !== "HEAD" && request.method !== "OPTIONS") {
      const dichiarata = Number(request.headers.get("Content-Length"));
      if (Number.isFinite(dichiarata) && dichiarata > MAX_CORPO_API) {
        return rifinisci(json({ error: "La richiesta è troppo grande." }, 413));
      }
    }
    return rifinisci(await next());
  } catch (error) {
    console.error("API error", error);
    return rifinisci(json({ error: "Servizio non disponibile. Riprova tra poco." }, 500));
  }
};

function rifinisci(risposta: Response): Response {
  const tipo = risposta.headers.get("Content-Type") ?? "";
  if ((risposta.status === 404 || risposta.status === 405) && !tipo.includes("json")) {
    return rifinisci(json({ error: risposta.status === 405 ? "Operazione non consentita." : "Non trovato." }, risposta.status));
  }
  const finale = new Response(risposta.body, risposta);
  finale.headers.set("X-Content-Type-Options", "nosniff");
  finale.headers.set("X-Robots-Tag", "noindex");
  if (!finale.headers.has("Cache-Control")) finale.headers.set("Cache-Control", "no-store");
  return finale;
}
