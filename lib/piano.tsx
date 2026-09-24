"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { getPiatto, getExtra } from "./catalogo";
import type { Macros } from "./types";
import {
  GIORNI,
  PASTI,
  ZERO_MACRO,
  casellaVuota,
  macroCasella,
  potaPiano,
  type Casella,
  type GiornoSettimana,
  type Pasto,
  type Piano,
} from "./settimana";

/*
 * Il modello dei dati e' in ./settimana, fuori dal confine client. Viene ri-esportato
 * da qui perche' le pagine importano "@/lib/piano" e non devono sapere dove passa la
 * linea: chi ha bisogno di React prende il provider, chi non ne ha bisogno puo'
 * importare direttamente da ./settimana e restare server-safe.
 */
export {
  CASELLE_TOTALI,
  GIORNI,
  NOMI_GIORNO,
  PASTI,
  ZERO_MACRO,
  leggiCasella,
  macroCasella,
  potaPiano,
} from "./settimana";
export type { Casella, GiornoSettimana, Pasto, Piano } from "./settimana";

/* =========================================================================
   Lo store del piano: la parte che ha bisogno di React.

   Stato in localStorage, letto con useSyncExternalStore: durante SSR e
   idratazione React usa lo snapshot vuoto e poi passa da solo a quello vero,
   quindi nessun mismatch e nessun setState dentro un effetto.
   ========================================================================= */

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

const CHIAVE = "fuellab.piano.v2";
const VUOTO_SSR: Piano = Object.freeze({}) as Piano;

let piano: Piano = {};
let letto = false;
const ascoltatori = new Set<() => void>();

/**
 * `null` significa una cosa sola: lo storage non e' stato leggibile (negato, o in
 * errore). La chiave assente e il JSON illeggibile tornano `{}`, che vuol dire "letto,
 * e non c'era niente di valido". La distinzione conta perche' assicuraLettura scrive
 * quello che riceve: confondere i due casi farebbe azzerare il piano di questa scheda
 * al primo storage negato, o al contrario lo terrebbe stantio dopo che un'altra scheda
 * ha svuotato la settimana.
 */
function leggi(): Piano | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(CHIAVE);
  } catch {
    return null; // storage negato: non ho letto, quindi non ho niente da dire
  }
  if (!raw) return {}; // chiave assente: letto, e la settimana e' vuota davvero
  try {
    return potaPiano(JSON.parse(raw) as unknown);
  } catch {
    return {}; // JSON rotto: letto, e non c'era niente di valido da tenere
  }
}

function assicuraLettura() {
  if (letto) return;
  letto = true;
  const salvato = leggi();
  // `??` e non `if (salvato)`: un piano vuoto e' un risultato, non un fallimento.
  // Con `if` l'utente che svuota la settimana in una scheda se la rivedeva nell'altra.
  piano = salvato ?? piano;
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
  metti: (g: GiornoSettimana, m: Pasto, id: string) => void;
  togliPiatto: (g: GiornoSettimana, m: Pasto) => void;
  /** aggiunge l'extra se manca, lo toglie se c'e' gia' */
  alternaExtra: (g: GiornoSettimana, m: Pasto, extraId: string) => void;
  /** accende o spegne un extra senza invertire: serve quando la scheda del piatto scrive un insieme, non un click */
  impostaExtra: (g: GiornoSettimana, m: Pasto, extraId: string, acceso: boolean) => void;
  svuotaCasella: (g: GiornoSettimana, m: Pasto) => void;
  /** prima casella senza piatto: una casella di soli extra ha ancora posto */
  primaLibera: () => { g: GiornoSettimana; m: Pasto } | null;
  /** il piano in ingresso viene potato: puo' arrivare da un link condiviso */
  sostituisciPiano: (p: Piano) => void;
  svuota: () => void;
}

const Ctx = createContext<CtxPiano | null>(null);

export function PianoProvider({ children }: { children: React.ReactNode }) {
  const corrente = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const pronto = corrente !== VUOTO_SSR;

  // Le mutazioni partono dal modulo e non da `corrente`: restano stabili fra i render
  // e due click ravvicinati non ripartono entrambi dallo stesso snapshot vecchio.
  const metti = useCallback((g: GiornoSettimana, m: Pasto, id: string) => {
    if (!getPiatto(id)) return;
    const attuale = piano[g]?.[m] ?? { extra: [] };
    scrivi(conCasella(piano, g, m, { ...attuale, piatto: id }));
  }, []);

  const togliPiatto = useCallback((g: GiornoSettimana, m: Pasto) => {
    const attuale = piano[g]?.[m];
    if (!attuale) return;
    const prossima: Casella = { extra: attuale.extra };
    scrivi(conCasella(piano, g, m, prossima));
  }, []);

  const impostaExtra = useCallback(
    (g: GiornoSettimana, m: Pasto, extraId: string, acceso: boolean) => {
      if (!getExtra(extraId)) return;
      const attuale = piano[g]?.[m] ?? { extra: [] };
      const gia = attuale.extra.includes(extraId);
      if (gia === acceso) return;
      const extra = acceso
        ? [...attuale.extra, extraId]
        : attuale.extra.filter((x) => x !== extraId);
      scrivi(conCasella(piano, g, m, { ...attuale, extra }));
    },
    [],
  );

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

  // Passa da potaPiano come la lettura da localStorage: al Task 6 il piano arriva
  // dalla query string di un link condiviso, che chiunque puo' riscrivere a mano.
  // Senza questo, dati malformati resterebbero in memoria E su localStorage per tutta
  // la sessione: assicuraLettura non ripota nulla finche' `letto` e' true, e l'evento
  // `storage` non torna indietro alla scheda che ha scritto.
  const sostituisciPiano = useCallback((p: Piano) => scrivi(potaPiano(p)), []);
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
      togliPiatto,
      alternaExtra,
      impostaExtra,
      svuotaCasella,
      primaLibera: () => {
        for (const g of GIORNI) {
          for (const m of PASTI) {
            if (!casella(g, m)?.piatto) return { g, m };
          }
        }
        return null;
      },
      sostituisciPiano,
      svuota,
    };
  }, [
    corrente,
    pronto,
    metti,
    togliPiatto,
    alternaExtra,
    impostaExtra,
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
