import { CHIAVE_BOZZA_RICHIESTA, leggiBozza, serializzaBozza, type DatiRichiesta } from "@/lib/account";

/* La richiesta a meta' in sessionStorage (le regole stanno in lib/account.ts).
   Ogni accesso e' protetto: lo storage puo' essere negato (finestra privata,
   dati del sito bloccati) e in quel caso la bozza semplicemente non c'e'. */

export function leggiBozzaSalvata(utente: string, ricerca: string, min: string): DatiRichiesta | null {
  try {
    return leggiBozza(sessionStorage.getItem(CHIAVE_BOZZA_RICHIESTA), utente, ricerca, min);
  } catch {
    return null;
  }
}

export function salvaBozzaRichiesta(utente: string, ricerca: string, dati: DatiRichiesta) {
  try {
    sessionStorage.setItem(CHIAVE_BOZZA_RICHIESTA, serializzaBozza(utente, ricerca, dati));
  } catch {
    // storage pieno o negato: si perde solo la rete di sicurezza
  }
}

/** Alla richiesta inviata, all'uscita e all'eliminazione dell'account: i recapiti non devono restare nel browser. */
export function cancellaBozzaRichiesta() {
  try {
    sessionStorage.removeItem(CHIAVE_BOZZA_RICHIESTA);
  } catch {
    // niente da cancellare
  }
}
