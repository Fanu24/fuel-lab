"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { getElemento, getExtra } from "./catalogo";
import type { Categoria } from "./catalogo";
import type { Macros } from "./types";

/* =========================================================================
   Il piano della settimana.

   Sostituisce il vecchio carrello piatto. La differenza non e' cosmetica: qui
   un elemento non sta "nel box", sta in una CASELLA precisa - martedi a cena.
   E' quello che permette di mostrare i macro giorno per giorno invece che solo
   il totale, che e' il modo in cui ragiona chi si allena.

   Dentro la casella il pasto e' scomposto: un primo, un secondo e quanti extra
   servono. Nessuno dei due elementi e' obbligatorio, perche' una cena puo' essere
   solo un secondo e un pranzo pre-allenamento solo un primo.

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

export interface Casella {
  primo?: string;
  secondo?: string;
  /** id degli extra: array vuoto quando non ce ne sono, mai assente */
  extra: string[];
}

export type Piano = Partial<Record<GiornoSettimana, Partial<Record<Pasto, Casella>>>>;

/** Sette giorni per due pasti: il fondo scala di ogni percentuale di riempimento. */
export const CASELLE_TOTALI = GIORNI.length * PASTI.length; // 14

export const ZERO_MACRO: Macros = { kcal: 0, proteine: 0, carboidrati: 0, grassi: 0 };

/**
 * Macro di una casella: primo, secondo ed extra sommati.
 *
 * Gli id che il catalogo non conosce piu' vengono ignorati invece di far esplodere
 * il calcolo: il menu cambia ogni settimana e un piano salvato invecchia in fretta,
 * quindi una riga morta e' un caso normale, non un guasto.
 */
export function macroCasella(c: Casella | undefined): Macros {
  if (!c) return { ...ZERO_MACRO };
  const pezzi: (Macros | undefined)[] = [
    c.primo ? getElemento(c.primo) : undefined,
    c.secondo ? getElemento(c.secondo) : undefined,
    ...(c.extra ?? []).map((id) => getExtra(id)),
  ];
  return pezzi.reduce<Macros>(
    (a, p) =>
      p
        ? {
            kcal: a.kcal + p.kcal,
            proteine: a.proteine + p.proteine,
            carboidrati: a.carboidrati + p.carboidrati,
            grassi: a.grassi + p.grassi,
          }
        : a,
    { ...ZERO_MACRO },
  );
}

function sommaMacro(lista: Macros[]): Macros {
  return lista.reduce<Macros>(
    (a, m) => ({
      kcal: a.kcal + m.kcal,
      proteine: a.proteine + m.proteine,
      carboidrati: a.carboidrati + m.carboidrati,
      grassi: a.grassi + m.grassi,
    }),
    { ...ZERO_MACRO },
  );
}

function casellaVuota(c: Casella): boolean {
  return !c.primo && !c.secondo && c.extra.length === 0;
}

/**
 * Riscrive una casella senza mutare il piano corrente. Una casella rimasta vuota
 * sparisce, e con lei il giorno che non ha piu' pasti: cosi' il conto delle caselle
 * piene dice la verita' e il JSON salvato non accumula gusci vuoti.
 */
function conCasella(p: Piano, g: GiornoSettimana, m: Pasto, c: Casella | undefined): Piano {
  const riga: Partial<Record<Pasto, Casella>> = { ...p[g] };
  if (c && !casellaVuota(c)) riga[m] = c;
  else delete riga[m];
  const out: Piano = { ...p, [g]: riga };
  if (Object.keys(riga).length === 0) delete out[g];
  return out;
}

const CHIAVE = "fuellab.piano.v1";
const VUOTO_SSR: Piano = Object.freeze({}) as Piano;

let piano: Piano = {};
let letto = false;
const ascoltatori = new Set<() => void>();

/**
 * Ricostruisce una casella dal JSON salvato tenendo solo cio' che il catalogo
 * riconosce ancora, e solo nello slot giusto: un id di secondo finito nel campo
 * `primo` viene scartato, altrimenti il conto delle proteine mentirebbe.
 */
function leggiCasella(v: unknown): Casella | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const c: Casella = { extra: [] };
  if (typeof o.primo === "string" && getElemento(o.primo)?.categoria === "primo") {
    c.primo = o.primo;
  }
  if (typeof o.secondo === "string" && getElemento(o.secondo)?.categoria === "secondo") {
    c.secondo = o.secondo;
  }
  if (Array.isArray(o.extra)) {
    c.extra = (o.extra as unknown[]).filter(
      (id): id is string => typeof id === "string" && !!getExtra(id),
    );
  }
  return casellaVuota(c) ? undefined : c;
}

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
        // Scarto le caselle svuotate dalla potatura: il menu cambia ogni settimana
        // e un piano salvato invecchia.
        const c = leggiCasella((riga as Record<string, unknown>)[m]);
        if (c) out[g] = { ...out[g], [m]: c };
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

export interface CtxPiano {
  piano: Piano;
  /** false durante SSR e idratazione: i numeri vanno resi solo quando e' true */
  pronto: boolean;
  /** caselle con almeno un elemento dentro, su CASELLE_TOTALI */
  pasti: number;
  macroSettimana: Macros;
  macroGiorno: (g: GiornoSettimana) => Macros;
  casella: (g: GiornoSettimana, m: Pasto) => Casella | undefined;
  metti: (g: GiornoSettimana, m: Pasto, categoria: Categoria, id: string) => void;
  togliElemento: (g: GiornoSettimana, m: Pasto, categoria: Categoria) => void;
  /** aggiunge l'extra se manca, lo toglie se c'e' gia' */
  alternaExtra: (g: GiornoSettimana, m: Pasto, extraId: string) => void;
  svuotaCasella: (g: GiornoSettimana, m: Pasto) => void;
  /** prima casella in cui QUELLA categoria e' libera, non la prima casella vuota */
  primaLibera: (categoria: Categoria) => { g: GiornoSettimana; m: Pasto } | null;
  sostituisciPiano: (p: Piano) => void;
  svuota: () => void;
}

const Ctx = createContext<CtxPiano | null>(null);

export function PianoProvider({ children }: { children: React.ReactNode }) {
  const corrente = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const pronto = corrente !== VUOTO_SSR;

  // Le mutazioni partono dal modulo e non da `corrente`: restano stabili fra i render
  // e due click ravvicinati non ripartono entrambi dallo stesso snapshot vecchio.
  const metti = useCallback((g: GiornoSettimana, m: Pasto, categoria: Categoria, id: string) => {
    const e = getElemento(id);
    if (!e || e.categoria !== categoria) return;
    const attuale = piano[g]?.[m] ?? { extra: [] };
    scrivi(conCasella(piano, g, m, { ...attuale, [categoria]: id }));
  }, []);

  const togliElemento = useCallback((g: GiornoSettimana, m: Pasto, categoria: Categoria) => {
    const attuale = piano[g]?.[m];
    if (!attuale) return;
    const prossima: Casella = { ...attuale };
    delete prossima[categoria];
    scrivi(conCasella(piano, g, m, prossima));
  }, []);

  const alternaExtra = useCallback((g: GiornoSettimana, m: Pasto, extraId: string) => {
    if (!getExtra(extraId)) return;
    const attuale = piano[g]?.[m] ?? { extra: [] };
    const gia = attuale.extra.includes(extraId);
    const extra = gia ? attuale.extra.filter((x) => x !== extraId) : [...attuale.extra, extraId];
    scrivi(conCasella(piano, g, m, { ...attuale, extra }));
  }, []);

  const svuotaCasella = useCallback((g: GiornoSettimana, m: Pasto) => {
    scrivi(conCasella(piano, g, m, undefined));
  }, []);

  const sostituisciPiano = useCallback((p: Piano) => scrivi(p), []);
  const svuota = useCallback(() => scrivi({}), []);

  const valore = useMemo<CtxPiano>(() => {
    const casella = (g: GiornoSettimana, m: Pasto) => corrente[g]?.[m];
    const macroGiorno = (g: GiornoSettimana) =>
      sommaMacro(PASTI.map((m) => macroCasella(casella(g, m))));
    const piene = GIORNI.flatMap((g) => PASTI.map((m) => casella(g, m))).filter(
      (c): c is Casella => !!c,
    );

    return {
      piano: corrente,
      pronto,
      pasti: piene.length,
      macroSettimana: sommaMacro(GIORNI.map(macroGiorno)),
      macroGiorno,
      casella,
      metti,
      togliElemento,
      alternaExtra,
      svuotaCasella,
      primaLibera: (categoria) => {
        for (const g of GIORNI) {
          for (const m of PASTI) {
            // Un primo cerca una casella senza primo, non una casella vuota:
            // il secondo gia' scelto la' dentro non e' un ostacolo.
            if (!casella(g, m)?.[categoria]) return { g, m };
          }
        }
        return null; // settimana piena per questa categoria
      },
      sostituisciPiano,
      svuota,
    };
  }, [
    corrente,
    pronto,
    metti,
    togliElemento,
    alternaExtra,
    svuotaCasella,
    sostituisciPiano,
    svuota,
  ]);

  return <Ctx.Provider value={valore}>{children}</Ctx.Provider>;
}

export function usePiano(): CtxPiano {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePiano va usato dentro <PianoProvider>");
  return c;
}
