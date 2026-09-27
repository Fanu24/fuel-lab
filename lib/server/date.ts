/**
 * Date e orari lato server.
 *
 * In D1 convivono due formati: CURRENT_TIMESTAMP scrive "YYYY-MM-DD HH:MM:SS"
 * in UTC, better-auth scrive ISO ("2026-09-27T11:37:38.936Z"). Le date di
 * calendario del sito invece sono giorni di Pescara, fuso Europe/Rome: una
 * richiesta delle 00:30 di mercoledi' e' di mercoledi', anche se in UTC e'
 * ancora martedi'.
 */

const FORMATO_ROMA = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Rome",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Qualunque timestamp di D1 (SQLite, ISO, millisecondi) -> Date, oppure null. */
export function daTimestamp(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value !== "string" || !value) return null;
  const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(value) ? `${value.replace(" ", "T")}Z` : value;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Riporta un timestamp al formato del contratto: "YYYY-MM-DD HH:MM:SS" in UTC. */
export function tsSqlite(value: unknown): string | null {
  const d = daTimestamp(value);
  return d ? d.toISOString().slice(0, 19).replace("T", " ") : null;
}

/** Il giorno di calendario a Pescara in cui cade un timestamp. */
export function giornoRoma(value: unknown): string | null {
  const d = daTimestamp(value);
  return d ? FORMATO_ROMA.format(d) : null;
}

export function oggiRoma(now = new Date()): string {
  return FORMATO_ROMA.format(now);
}

/** "YYYY-MM-DD" che esiste davvero nel calendario (niente 31 febbraio). */
export function dataValida(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Aritmetica sui giorni di calendario, senza passare dai fusi. */
export function spostaGiorno(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** `quanti` giorni consecutivi che finiscono con `ultimo`, dal piu' vecchio. */
export function giorniFino(ultimo: string, quanti: number): string[] {
  return Array.from({ length: quanti }, (_, i) => spostaGiorno(ultimo, i - quanti + 1));
}

const NOMI_GIORNI = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
const NOMI_MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

/** "2026-10-02" -> "venerdì 2 ottobre 2026". Scritta a mano: non dipende dall'ICU del runtime. */
export function dataEstesa(day: string): string {
  if (!dataValida(day)) return day;
  const d = new Date(`${day}T00:00:00Z`);
  return `${NOMI_GIORNI[d.getUTCDay()]} ${d.getUTCDate()} ${NOMI_MESI[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
