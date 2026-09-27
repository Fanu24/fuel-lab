"use client";

import { useEffect, useSyncExternalStore } from "react";
import { api, impostazioniVuote, type Impostazioni } from "@/lib/api";
import { potaImpostazioni } from "@/lib/impostazioni";

/* Le impostazioni di Matteo (piatti non disponibili, chiusure, avviso), chieste
   UNA volta per caricamento di pagina e condivise da tutti: la striscia
   dell'avviso, il menu, il compositore, la richiesta dall'account, il pannello.

   Le pagine sono statiche, quindi il primo disegno non le conosce mai. Per non
   far sfarfallare il sito da una pagina all'altra l'ultima copia sta in
   sessionStorage e vale subito, mentre la rete conferma; il server permette
   comunque al browser di tenerle un minuto (Cache-Control). Il pannello, dopo
   un salvataggio, pubblica qui la versione nuova con impostaImpostazioni. */

export type StatoImpostazioni = {
  /** "attesa": ancora nessun dato; "pronte": dalla rete o dalla copia di questa sessione. */
  stato: "attesa" | "pronte" | "errore";
  impostazioni: Impostazioni;
};

const CHIAVE = "fuellab.impostazioni.v1";
const IN_ATTESA: StatoImpostazioni = { stato: "attesa", impostazioni: impostazioniVuote() };

let corrente: StatoImpostazioni | null = null;
let inCorso: Promise<void> | null = null;
const ascoltatori = new Set<() => void>();

/** Il valore di partenza nel browser: la copia di questa sessione, se c'e'. */
function attuale(): StatoImpostazioni {
  if (corrente) return corrente;
  corrente = IN_ATTESA;
  try {
    const salvate = window.sessionStorage.getItem(CHIAVE);
    if (salvate) corrente = { stato: "pronte", impostazioni: potaImpostazioni(JSON.parse(salvate)) };
  } catch {
    // Storage bloccato o copia illeggibile: si aspetta la rete.
  }
  return corrente;
}

function pubblica(prossimo: StatoImpostazioni) {
  corrente = prossimo;
  if (prossimo.stato === "pronte") {
    try {
      window.sessionStorage.setItem(CHIAVE, JSON.stringify(prossimo.impostazioni));
    } catch {
      // Niente copia: la prossima pagina aspettera' la rete, tutto qui.
    }
  }
  for (const a of ascoltatori) a();
}

/** Chiede /api/settings se nessuno l'ha ancora fatto; `fresche` va comunque in rete. */
export function caricaImpostazioni(fresche = false): Promise<void> {
  if (inCorso && !fresche) return inCorso;
  inCorso = api.impostazioni(fresche).then(
    (r) => pubblica({ stato: "pronte", impostazioni: potaImpostazioni(r.settings) }),
    () => {
      // Senza rete si tiene la copia che c'e'; senza copia il sito va avanti come se non ci fossero impostazioni.
      if (attuale().stato === "attesa") pubblica({ stato: "errore", impostazioni: impostazioniVuote() });
    },
  );
  return inCorso;
}

/** Dopo un salvataggio nel pannello: tutti i componenti aperti vedono subito il nuovo valore. */
export function impostaImpostazioni(impostazioni: Impostazioni) {
  inCorso = Promise.resolve();
  pubblica({ stato: "pronte", impostazioni });
}

function iscrivi(ascoltatore: () => void) {
  ascoltatori.add(ascoltatore);
  return () => {
    ascoltatori.delete(ascoltatore);
  };
}

/** `fresche`: per il pannello, che deve vedere il database e non la copia di un minuto fa. */
export function useImpostazioni({ fresche = false }: { fresche?: boolean } = {}): StatoImpostazioni {
  const stato = useSyncExternalStore(iscrivi, attuale, () => IN_ATTESA);
  useEffect(() => {
    void caricaImpostazioni(fresche);
  }, [fresche]);
  return stato;
}

/** Scorciatoia per i componenti che chiedono solo "questo piatto si puo' scegliere?". */
export function usePiattiNonDisponibili(): readonly string[] {
  return useImpostazioni().impostazioni.piattiNonDisponibili;
}
