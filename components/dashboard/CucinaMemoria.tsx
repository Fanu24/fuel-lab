"use client";

/* La memoria del telefono in cucina: spunte della spesa, ordini imballati,
   giorni di scadenza delle etichette. Sta in localStorage, quindi resta sul
   dispositivo e non arriva al server. Se il browser blocca localStorage
   (navigazione privata, spazio pieno) si ripiega su una mappa in memoria:
   le spunte funzionano lo stesso finche' la pagina resta aperta. */

import { useCallback, useMemo, useSyncExternalStore } from "react";

const EVENTO = "fuellab-memoria";
const ripiego = new Map<string, string | null>();

function leggi(chiave: string): string | null {
  if (ripiego.has(chiave)) return ripiego.get(chiave) ?? null;
  try {
    return window.localStorage.getItem(chiave);
  } catch {
    return null;
  }
}

function scrivi(chiave: string, valore: string | null) {
  ripiego.set(chiave, valore);
  try {
    if (valore === null) window.localStorage.removeItem(chiave);
    else window.localStorage.setItem(chiave, valore);
    ripiego.delete(chiave); // scritto davvero: si torna a leggere da localStorage
  } catch {
    // Resta nella mappa in memoria.
  }
  window.dispatchEvent(new Event(EVENTO));
}

function iscriviti(avvisa: () => void) {
  const daAltraScheda = (e: StorageEvent) => {
    if (e.key) ripiego.delete(e.key);
    avvisa();
  };
  window.addEventListener("storage", daAltraScheda);
  window.addEventListener(EVENTO, avvisa);
  return () => {
    window.removeEventListener("storage", daAltraScheda);
    window.removeEventListener(EVENTO, avvisa);
  };
}

/** Un valore testuale salvato sul dispositivo. Si aggiorna anche se cambia in un'altra scheda. */
export function useMemoria(chiave: string): [string | null, (valore: string | null) => void] {
  const valore = useSyncExternalStore(iscriviti, () => leggi(chiave), () => null);
  const imposta = useCallback((v: string | null) => scrivi(chiave, v), [chiave]);
  return [valore, imposta];
}

/** Un insieme di spunte (id di voci o di ordini) salvato sul dispositivo. */
export function useSpunte(chiave: string) {
  const [grezzo, imposta] = useMemoria(chiave);
  const spunte = useMemo(() => {
    if (!grezzo) return new Set<string>();
    try {
      const dati: unknown = JSON.parse(grezzo);
      return new Set(Array.isArray(dati) ? dati.filter((x): x is string => typeof x === "string") : []);
    } catch {
      return new Set<string>();
    }
  }, [grezzo]);
  const cambia = useCallback(
    (id: string, fatto: boolean) => {
      const nuove = new Set(spunte);
      if (fatto) nuove.add(id);
      else nuove.delete(id);
      imposta(nuove.size ? JSON.stringify([...nuove]) : null);
    },
    [spunte, imposta],
  );
  const azzera = useCallback(() => imposta(null), [imposta]);
  /** Rimette un insieme di spunte salvato prima (serve all'"Annulla" dopo "Togli tutte le spunte"). */
  const ripristina = useCallback((ids: ReadonlySet<string>) => imposta(ids.size ? JSON.stringify([...ids]) : null), [imposta]);
  return { spunte, cambia, azzera, ripristina };
}
