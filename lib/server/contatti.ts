/**
 * Il modulo contatti: validazione del messaggio, esca per i bot e impronta
 * dell'IP per il limite di invii. Nessun IP in chiaro arriva nel database.
 */

import { ETICHETTE_ARGOMENTO, type ArgomentoMessaggio, type MessaggioContatto, type StatoMessaggio } from "../api";
import { tsSqlite } from "./date";

export const ARGOMENTI = Object.keys(ETICHETTE_ARGOMENTO) as ArgomentoMessaggio[];
export const STATI_MESSAGGIO: readonly StatoMessaggio[] = ["new", "handled", "archived"];

export const MAX_NOME = 100;
export const MAX_COMUNE = 100;
export const MIN_MESSAGGIO = 10;
export const MAX_MESSAGGIO = 3000;
/** Invii consentiti per impronta IP in un'ora. */
export const MESSAGGI_ORARI = 10;
/**
 * Messaggi accettati in un'ora da tutta la rete: chi cambia indirizzo a ogni invio
 * non ha un limite per IP, ma non deve riempire la casella di Matteo e consumare
 * le email al giorno di Resend, che servono anche a verifiche e password.
 */
export const MESSAGGI_ORARI_TOTALI = 40;

export const eStatoMessaggio = (value: unknown): value is StatoMessaggio =>
  typeof value === "string" && (STATI_MESSAGGIO as readonly string[]).includes(value);

/** Campo su una riga: via a capo e caratteri di controllo (finiscono in oggetti email). */
export const unaRiga = (value: unknown) => (typeof value === "string" ? value.replace(/\p{Cc}+/gu, " ").replace(/\s+/g, " ").trim() : "");

/** Testo libero: tiene gli a capo, toglie gli altri caratteri di controllo. */
export const testoLibero = (value: unknown) =>
  typeof value === "string" ? value.replace(/\r\n?/g, "\n").replace(/[^\P{Cc}\n\t]/gu, "").trim() : "";

/** Un'etichetta del dominio ("fuelchef", "co"): lettere e cifre, trattini solo in mezzo. */
const ETICHETTA_DOMINIO = /^[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?$/u;
/** Niente spazi, chiocciole, apici angolari, virgole, due punti, parentesi, virgolette: l'email finisce in un campo Reply-To. */
const PARTE_LOCALE = /^[^\s@<>(),;:\\"[\]]+$/u;

/**
 * Un indirizzo con una sola chiocciola, una parte locale senza caratteri che
 * in un'intestazione email aprirebbero un altro destinatario (virgola, <>,
 * virgolette...) e un dominio fatto di etichette vere ("a@b..it" e "a@b.it," non passano).
 */
export function emailValida(value: string): boolean {
  if (value.length > 254) return false;
  const pezzi = value.split("@");
  if (pezzi.length !== 2) return false;
  const [locale, dominio] = pezzi;
  if (!locale || locale.length > 64 || !PARTE_LOCALE.test(locale) || locale.startsWith(".") || locale.endsWith(".") || locale.includes("..")) return false;
  const etichette = dominio.split(".");
  return etichette.length >= 2 && etichette.every((e) => ETICHETTA_DOMINIO.test(e)) && etichette[etichette.length - 1].length >= 2;
}

export const cifre = (value: string) => value.replace(/\D/g, "").length;

export type MessaggioValido = {
  name: string;
  email: string;
  phone: string;
  comune: string;
  topic: ArgomentoMessaggio;
  message: string;
};

export type LetturaMessaggio =
  | { ok: true; bot: true }
  | { ok: true; bot: false; value: MessaggioValido }
  | { ok: false; error: string };

/**
 * Valida il corpo di POST /api/contact. Se l'esca `website` e' piena risponde
 * `bot: true` prima di ogni altro controllo: al bot si finge un invio riuscito.
 */
export function leggiNuovoMessaggio(body: Record<string, unknown>): LetturaMessaggio {
  if (unaRiga(body.website)) return { ok: true, bot: true };
  const name = unaRiga(body.name);
  const email = unaRiga(body.email).toLowerCase();
  const phone = unaRiga(body.phone);
  const comune = unaRiga(body.comune);
  const message = testoLibero(body.message);
  const topic = (ARGOMENTI as unknown[]).includes(body.topic) ? body.topic as ArgomentoMessaggio : "info";

  if (!name) return { ok: false, error: "Scrivi il tuo nome" };
  if (name.length > MAX_NOME) return { ok: false, error: `Il nome può avere al massimo ${MAX_NOME} caratteri` };
  if (email && !emailValida(email)) return { ok: false, error: "L'indirizzo email non sembra corretto" };
  if (phone && (phone.length > 40 || cifre(phone) < 9 || cifre(phone) > 15)) {
    return { ok: false, error: "Il numero di telefono non sembra corretto" };
  }
  if (!email && !phone) return { ok: false, error: "Lascia un'email o un numero di telefono per la risposta" };
  if (comune.length > MAX_COMUNE) return { ok: false, error: `Il comune può avere al massimo ${MAX_COMUNE} caratteri` };
  if (message.length < MIN_MESSAGGIO) return { ok: false, error: `Il messaggio è troppo breve: scrivi almeno ${MIN_MESSAGGIO} caratteri` };
  if (message.length > MAX_MESSAGGIO) return { ok: false, error: `Il messaggio può avere al massimo ${MAX_MESSAGGIO} caratteri` };
  return { ok: true, bot: false, value: { name, email, phone, comune, topic, message } };
}

/**
 * La "rete" di un indirizzo, che e' cio' che il limite di invii conta: un IPv4
 * e' la sua rete, un IPv6 e' il suo /64 (una sola casa ha milioni di indirizzi
 * IPv6 e basterebbe cambiarli per ricominciare da zero).
 */
export function reteDi(ip: string): string {
  const pulito = ip.trim().toLowerCase().replace(/^\[|\]$/g, "").replace(/%.*$/, "");
  if (!pulito.includes(":")) return pulito;
  // IPv4 scritto dentro un IPv6 (::ffff:203.0.113.7): e' l'indirizzo IPv4.
  const mappato = pulito.match(/^(?:0*:)*:?ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mappato) return mappato[1];
  const [testa, coda = ""] = pulito.split("::");
  const prima = testa ? testa.split(":") : [];
  const dopo = coda ? coda.split(":") : [];
  const gruppi = pulito.includes("::") ? [...prima, ...Array(Math.max(0, 8 - prima.length - dopo.length)).fill("0"), ...dopo] : prima;
  return gruppi.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, "")).join(":") + "::/64";
}

/** SHA-256 esadecimale di IP + segreto: stabile per il limite, inutile a chi legge il database. */
export async function impronta(ip: string, segreto: string): Promise<string> {
  const dati = new TextEncoder().encode(`${ip}|${segreto}`);
  const hash = await crypto.subtle.digest("SHA-256", dati);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Riga di D1 -> MessaggioContatto (senza ip_hash). */
export function messaggioDaRiga(row: Record<string, unknown>): MessaggioContatto {
  const s = (value: unknown) => (typeof value === "string" ? value : "");
  return {
    id: s(row.id),
    name: s(row.name),
    email: s(row.email),
    phone: s(row.phone),
    comune: s(row.comune),
    topic: (ARGOMENTI as unknown[]).includes(row.topic) ? row.topic as ArgomentoMessaggio : "info",
    message: s(row.message),
    status: eStatoMessaggio(row.status) ? row.status : "new",
    user_id: typeof row.user_id === "string" && row.user_id ? row.user_id : null,
    created_at: tsSqlite(row.created_at) ?? s(row.created_at),
    updated_at: tsSqlite(row.updated_at) ?? s(row.updated_at),
  };
}
