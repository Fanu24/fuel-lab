"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { DISHES_BY_ID } from "./dishes";
import { sommaMacro } from "./matcher";
import type { Dish, Macros } from "./types";

/* =========================================================================
   Il piano della settimana.

   Sostituisce il vecchio carrello piatto. La differenza non e' cosmetica: qui
   un piatto non sta "nel box", sta in una CASELLA precisa — martedi a cena.
   E' quello che permette di mostrare i macro giorno per giorno invece che solo
   il totale, che e' il modo in cui ragiona chi si allena.

   Stato in localStorage, letto con useSyncExternalStore: durante SSR e
   idratazione React usa lo snapshot vuoto e poi passa da solo a quello vero,
   quindi nessun mismatch e nessun setState dentro un effetto.
   ========================================================================= */

export const GIORNI = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"] as const;
export type GiornoSettimana = (typeof GIORNI)[number];

export const PASTI = ["pranzo", "cena"] as const;
export type Pasto = (typeof PASTI)[number];

export const NOMI_GIORNO: Record<GiornoSettimana, string> = {
  lun: "Lunedi",
  mar: "Martedi",
  mer: "Mercoledi",
  gio: "Giovedi",
  ven: "Venerdi",
  sab: "Sabato",
  dom: "Domenica",
};

export type Piano = Partial<Record<GiornoSettimana, Partial<Record<Pasto, string>>>>;

const CHIAVE = "fuellab.piano.v1";
const VUOTO_SSR: Piano = Object.freeze({}) as Piano;

let piano: Piano = {};
let letto = false;
const ascoltatori = new Set<() => void>();

function leggi(): Piano | null {
  try {
    const raw = localStorage.getItem(CHIAVE);
    if (!raw) return null;
    const p = JSON.parse(raw) as unknown;
    if (!p || typeof p !== "object") return null;
    const out: Piano = {};
    for (const g of GIORNI) {
      const riga = (p as Record<string, unknown>)[g];
      if (!riga || typeof riga !== "object") continue;
      for (const m of PASTI) {
        const id = (riga as Record<string, unknown>)[m];
        // Scarto le caselle che puntano a piatti non piu in catalogo: il menu
        // cambia ogni settimana e un piano salvato invecchia.
        if (typeof id === "string" && DISHES_BY_ID[id]) {
          out[g] = { ...out[g], [m]: id };
        }
      }
    }
    return out;
  } catch {
    return null;
  }
}

function assicuraLettura() {
  if (letto) return;
  letto = true;
  const salvato = leggi();
  if (salvato) piano = salvato;
}

function scrivi(prossimo: Piano) {
  piano = prossimo;
  try {
    localStorage.setItem(CHIAVE, JSON.stringify(prossimo));
  } catch {
    /* storage negato o pieno: il piano resta valido per questa sessione */
  }
  for (const f of ascoltatori) f();
}

function daAltraScheda(e: StorageEvent) {
  if (e.key !== null && e.key !== CHIAVE) return;
  letto = false;
  assicuraLettura();
  for (const f of ascoltatori) f();
}

function subscribe(f: () => void): () => void {
  assicuraLettura();
  if (ascoltatori.size === 0) window.addEventListener("storage", daAltraScheda);
  ascoltatori.add(f);
  return () => {
    ascoltatori.delete(f);
    if (ascoltatori.size === 0) window.removeEventListener("storage", daAltraScheda);
  };
}

function getSnapshot(): Piano {
  assicuraLettura();
  return piano; // riferimento stabile: un oggetto nuovo qui farebbe ciclare React
}
function getServerSnapshot(): Piano {
  return VUOTO_SSR;
}

export const ZERO_MACRO: Macros = { kcal: 0, proteine: 0, carboidrati: 0, grassi: 0 };

export interface CtxPiano {
  piano: Piano;
  /** false durante SSR e idratazione: i numeri vanno resi solo quando e' true */
  pronto: boolean;
  /** caselle riempite, su 14 */
  pasti: number;
  piatti: Dish[];
  macroSettimana: Macros;
  macroGiorno: (g: GiornoSettimana) => Macros;
  piattoIn: (g: GiornoSettimana, m: Pasto) => Dish | undefined;
  metti: (g: GiornoSettimana, m: Pasto, dishId: string) => void;
  togli: (g: GiornoSettimana, m: Pasto) => void;
  /** riempie le prime caselle libere: usato dal matcher e dal menu */
  aggiungiDoveCape: (dishId: string) => boolean;
  sostituisciPiano: (p: Piano) => void;
  svuota: () => void;
  /** quante volte questo piatto compare nella settimana */
  quante: (dishId: string) => number;
}

const Ctx = createContext<CtxPiano | null>(null);

export function PianoProvider({ children }: { children: React.ReactNode }) {
  const corrente = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const pronto = corrente !== VUOTO_SSR;

  const metti = useCallback((g: GiornoSettimana, m: Pasto, dishId: string) => {
    if (!DISHES_BY_ID[dishId]) return;
    scrivi({ ...piano, [g]: { ...piano[g], [m]: dishId } });
  }, []);

  const togli = useCallback((g: GiornoSettimana, m: Pasto) => {
    const riga = { ...piano[g] };
    delete riga[m];
    const p = { ...piano, [g]: riga };
    if (!Object.keys(riga).length) delete p[g];
    scrivi(p);
  }, []);

  const aggiungiDoveCape = useCallback((dishId: string) => {
    if (!DISHES_BY_ID[dishId]) return false;
    for (const g of GIORNI) {
      for (const m of PASTI) {
        if (!piano[g]?.[m]) {
          scrivi({ ...piano, [g]: { ...piano[g], [m]: dishId } });
          return true;
        }
      }
    }
    return false; // settimana piena: 14 caselle su 14
  }, []);

  const sostituisciPiano = useCallback((p: Piano) => scrivi(p), []);
  const svuota = useCallback(() => scrivi({}), []);

  const valore = useMemo<CtxPiano>(() => {
    const piattoIn = (g: GiornoSettimana, m: Pasto) => {
      const id = corrente[g]?.[m];
      return id ? DISHES_BY_ID[id] : undefined;
    };
    const perGiorno = (g: GiornoSettimana) =>
      PASTI.map((m) => piattoIn(g, m)).filter((d): d is Dish => !!d);
    const piatti = GIORNI.flatMap(perGiorno);

    return {
      piano: corrente,
      pronto,
      pasti: piatti.length,
      piatti,
      macroSettimana: sommaMacro(piatti),
      macroGiorno: (g) => sommaMacro(perGiorno(g)),
      piattoIn,
      metti,
      togli,
      aggiungiDoveCape,
      sostituisciPiano,
      svuota,
      quante: (id) => piatti.filter((d) => d.id === id).length,
    };
  }, [corrente, pronto, metti, togli, aggiungiDoveCape, sostituisciPiano, svuota]);

  return <Ctx.Provider value={valore}>{children}</Ctx.Provider>;
}

export function usePiano(): CtxPiano {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePiano va usato dentro <PianoProvider>");
  return c;
}

export const CASELLE_TOTALI = GIORNI.length * PASTI.length; // 14
