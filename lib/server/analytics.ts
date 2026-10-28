/**
 * Le visite del sito (POST /api/analytics/visit): quale percorso conta e come si
 * scrive. L'endpoint e' pubblico, quindi chiunque puo' inventare percorsi: qui si
 * decide cosa e' un percorso vero, cosi' la tabella traffic_daily non si riempie
 * di spazzatura e "Pagine piu' viste" resta leggibile. Niente D1 e niente Request.
 */

export const MAX_PERCORSO = 120;
/** I percorsi diversi che si contano in un giorno: oltre, le visite vanno in PERCORSO_ALTRO. Il sito ne ha poco piu' di cento. */
export const MAX_PERCORSI_AL_GIORNO = 300;
export const PERCORSO_ALTRO = "/altro";

/** Parti del sito che non sono traffico del sito: il pannello di Matteo non conta come visita. */
const NON_CONTATI = ["/admin", "/dashboard", "/api"] as const;

const CARATTERI = /^\/[a-z0-9._~%/-]*$/;

export type LetturaPercorso =
  | { ok: true; percorso: string }
  /** Percorso valido ma da non contare (il pannello): si risponde ok senza scrivere. */
  | { ok: true; percorso: null }
  | { ok: false };

/**
 * Il percorso come si conta: minuscolo, senza barra finale. Un indirizzo con
 * query o frammento, un percorso che non comincia con "/" (o comincia con "//"),
 * troppo lungo o con caratteri che un URL del sito non ha e' rifiutato.
 */
export function leggiPercorso(value: unknown): LetturaPercorso {
  if (typeof value !== "string") return { ok: false };
  const grezzo = value.trim().toLowerCase();
  if (!grezzo.startsWith("/") || grezzo.startsWith("//") || grezzo.length > MAX_PERCORSO) return { ok: false };
  if (!CARATTERI.test(grezzo) || grezzo.includes("..")) return { ok: false };
  const percorso = grezzo.length > 1 ? grezzo.replace(/\/+$/, "") || "/" : grezzo;
  if (NON_CONTATI.some((prefisso) => percorso === prefisso || percorso.startsWith(`${prefisso}/`))) return { ok: true, percorso: null };
  return { ok: true, percorso };
}
