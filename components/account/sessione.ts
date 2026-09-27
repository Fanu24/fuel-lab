"use client";

import { useEffect, useSyncExternalStore } from "react";
import { api, type Utente } from "@/lib/api";

/* Chi e' collegato, chiesto UNA volta per caricamento di pagina.

   La nav, la pagina di accesso e l'area cliente leggono lo stesso valore: una
   sola chiamata a /api/me invece di una per componente, e nessuno dei tre puo'
   mostrare uno stato diverso dagli altri. /api/me e non la sessione di
   better-auth perche' solo il server sa se l'utente e' Matteo (il ruolo sta in
   staff_roles). Chi cambia la sessione (esci, cambio nome, eliminazione)
   aggiorna qui con impostaUtente; dopo l'accesso la pagina si ricarica da capo. */

export type StatoSessione =
  | { stato: "attesa"; utente: null }
  | { stato: "pronto"; utente: Utente | null }
  | { stato: "errore"; utente: null };

const IN_ATTESA: StatoSessione = { stato: "attesa", utente: null };

let corrente: StatoSessione = IN_ATTESA;
let inCorso: Promise<void> | null = null;
const ascoltatori = new Set<() => void>();

function pubblica(prossimo: StatoSessione) {
  corrente = prossimo;
  for (const a of ascoltatori) a();
}

/** Chiede /api/me se nessuno l'ha ancora fatto; `forza` rilegge comunque. */
export function caricaUtente(forza = false): Promise<void> {
  if (inCorso && !forza) return inCorso;
  inCorso = api.me().then(
    (r) => pubblica({ stato: "pronto", utente: r.user }),
    () => pubblica({ stato: "errore", utente: null }),
  );
  return inCorso;
}

/** Dopo un'azione che cambia l'utente: niente giro di rete per saperlo. */
export function impostaUtente(utente: Utente | null) {
  inCorso = Promise.resolve();
  pubblica({ stato: "pronto", utente });
}

function iscrivi(ascoltatore: () => void) {
  ascoltatori.add(ascoltatore);
  return () => {
    ascoltatori.delete(ascoltatore);
  };
}

export function useSessione(): StatoSessione {
  const stato = useSyncExternalStore(iscrivi, () => corrente, () => IN_ATTESA);
  useEffect(() => {
    void caricaUtente();
  }, []);
  return stato;
}
