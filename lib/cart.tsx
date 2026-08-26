"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { DISHES_BY_ID } from "./dishes";
import { sommaMacro } from "./matcher";
import { preventivo, type Preventivo } from "./pricing";
import type { CartLine, Dish, Formula, Macros } from "./types";

const CHIAVE = "fuel.box.v1";

interface Stato {
  linee: CartLine[];
  formula: Formula;
}

/* =========================================================================
   Store esterno.

   Leggere localStorage in un useEffect e poi fare setState e' il modo ovvio,
   ed e' sbagliato per due motivi: React lo segnala come render a cascata, e
   costringe ogni pagina a difendersi dal mismatch di idratazione a mano.
   useSyncExternalStore risolve entrambi: durante SSR e durante l'idratazione
   React usa lo snapshot del server (box vuoto), poi passa da solo a quello del
   client. Il confronto con VUOTO_SSR e' quello che alimenta il flag 'pronto'.
   ========================================================================= */

const VUOTO_SSR: Stato = Object.freeze({ linee: [], formula: "singolo" }) as Stato;

let stato: Stato = { linee: [], formula: "singolo" };
let letto = false;
const ascoltatori = new Set<() => void>();

function leggi(): Stato | null {
  try {
    const raw = localStorage.getItem(CHIAVE);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<Stato>;
    if (!Array.isArray(p.linee)) return null;
    // Scarto le righe che puntano a piatti non piu in catalogo: un menu che cambia
    // ogni settimana rendera prima o poi invalido un box salvato settimane fa.
    const linee = p.linee
      .filter((l): l is CartLine => !!l && typeof l.dishId === "string" && !!DISHES_BY_ID[l.dishId])
      .map((l) => ({ dishId: l.dishId, qta: Math.max(1, Math.min(20, Math.round(l.qta) || 1)) }));
    return { linee, formula: p.formula === "abbonamento" ? "abbonamento" : "singolo" };
  } catch {
    return null;
  }
}

function assicuraLettura() {
  if (letto) return;
  letto = true;
  const salvato = leggi();
  if (salvato) stato = salvato;
}

function salva() {
  try {
    localStorage.setItem(CHIAVE, JSON.stringify(stato));
  } catch {
    /* quota piena o storage negato: il box resta valido per questa sessione */
  }
}

function scrivi(prossimo: Stato) {
  stato = prossimo;
  salva();
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

function getSnapshot(): Stato {
  // Deve restituire un riferimento STABILE: un oggetto nuovo a ogni chiamata
  // farebbe ri-renderizzare React all'infinito.
  assicuraLettura();
  return stato;
}

function getServerSnapshot(): Stato {
  return VUOTO_SSR;
}

/* ========================================================================= */

interface Ctx extends Stato {
  /** false durante SSR e idratazione: i numeri del box vanno resi solo quando e' true */
  pronto: boolean;
  pasti: number;
  piatti: Dish[];
  macro: Macros;
  conto: Preventivo;
  aggiungi: (dishId: string, qta?: number) => void;
  togli: (dishId: string) => void;
  imposta: (dishId: string, qta: number) => void;
  sostituisci: (linee: CartLine[]) => void;
  svuota: () => void;
  setFormula: (f: Formula) => void;
  quantita: (dishId: string) => number;
}

const CartCtx = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const corrente = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const pronto = corrente !== VUOTO_SSR;

  const aggiungi = useCallback((dishId: string, qta = 1) => {
    if (!DISHES_BY_ID[dishId]) return;
    const i = stato.linee.findIndex((l) => l.dishId === dishId);
    if (i === -1) {
      scrivi({ ...stato, linee: [...stato.linee, { dishId, qta }] });
      return;
    }
    const linee = stato.linee.slice();
    linee[i] = { ...linee[i], qta: Math.min(20, linee[i].qta + qta) };
    scrivi({ ...stato, linee });
  }, []);

  const imposta = useCallback((dishId: string, qta: number) => {
    scrivi({
      ...stato,
      linee:
        qta <= 0
          ? stato.linee.filter((l) => l.dishId !== dishId)
          : stato.linee.map((l) => (l.dishId === dishId ? { ...l, qta: Math.min(20, qta) } : l)),
    });
  }, []);

  const togli = useCallback((dishId: string) => {
    scrivi({ ...stato, linee: stato.linee.filter((l) => l.dishId !== dishId) });
  }, []);

  const sostituisci = useCallback((linee: CartLine[]) => {
    scrivi({ ...stato, linee: linee.filter((l) => !!DISHES_BY_ID[l.dishId]) });
  }, []);

  const svuota = useCallback(() => scrivi({ ...stato, linee: [] }), []);
  const setFormula = useCallback((formula: Formula) => scrivi({ ...stato, formula }), []);

  const valore = useMemo<Ctx>(() => {
    const piatti = corrente.linee.flatMap((l) =>
      Array.from({ length: l.qta }, () => DISHES_BY_ID[l.dishId]).filter(Boolean),
    );
    const pasti = piatti.length;
    return {
      ...corrente,
      pronto,
      pasti,
      piatti,
      macro: sommaMacro(piatti),
      conto: preventivo(pasti, corrente.formula),
      aggiungi,
      togli,
      imposta,
      sostituisci,
      svuota,
      setFormula,
      quantita: (id: string) => corrente.linee.find((l) => l.dishId === id)?.qta ?? 0,
    };
  }, [corrente, pronto, aggiungi, togli, imposta, sostituisci, svuota, setFormula]);

  return <CartCtx.Provider value={valore}>{children}</CartCtx.Provider>;
}

export function useCart(): Ctx {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart va usato dentro <CartProvider>");
  return c;
}
