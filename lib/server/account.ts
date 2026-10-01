/**
 * Cio' che better-auth scrive sull'utente (registrazione, "aggiorna il profilo")
 * passa da qui prima di arrivare nel database: senza, un nome di 100.000
 * caratteri o un'immagine "javascript:..." entrerebbero cosi' come sono, e
 * finirebbero nell'elenco clienti, nelle email e nell'esportazione dei dati.
 * Niente D1 e niente Request: si prova con stringhe.
 */

import { unaRiga } from "./contatti";

export const MAX_NOME_ACCOUNT = 100;
export const MAX_IMMAGINE_ACCOUNT = 500;

/**
 * Il nome dell'account su una riga, senza caratteri di controllo, al massimo
 * MAX_NOME_ACCOUNT. Se resta vuoto (nome di soli spazi, o un accesso con Google
 * senza nome) si ripiega sulla parte prima della chiocciola dell'email.
 */
export function nomeAccount(nome: unknown, email?: unknown): string {
  const pulito = unaRiga(nome).slice(0, MAX_NOME_ACCOUNT).trim();
  if (pulito) return pulito;
  const dallEmail = unaRiga(typeof email === "string" ? email.split("@")[0] : "").slice(0, MAX_NOME_ACCOUNT).trim();
  return dallEmail || "Cliente";
}

/** L'immagine del profilo: solo un indirizzo https ragionevole (quello che manda Google), altrimenti niente. */
export function immagineAccount(immagine: unknown): string | null {
  if (typeof immagine !== "string") return null;
  const url = immagine.trim();
  if (!url || url.length > MAX_IMMAGINE_ACCOUNT || /\s/.test(url)) return null;
  try {
    return new URL(url).protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/**
 * Per databaseHooks.user.create.before / update.before: sistema solo i campi
 * presenti (un aggiornamento puo' toccare il solo nome o la sola immagine).
 */
export function datiUtentePuliti<T extends Record<string, unknown>>(dati: T, creazione: boolean): T {
  const puliti: Record<string, unknown> = { ...dati };
  if (creazione || dati.name !== undefined) puliti.name = nomeAccount(dati.name, dati.email);
  if (dati.image !== undefined) puliti.image = immagineAccount(dati.image);
  return puliti as T;
}
