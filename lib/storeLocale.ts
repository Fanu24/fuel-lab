/* =========================================================================
   Uno store su localStorage, letto con useSyncExternalStore.

   Nato dentro piano.tsx e tirato fuori quando e' arrivato il secondo store (gli
   allenamenti): stessa semantica, scritta una volta sola. Durante SSR e
   idratazione React usa lo snapshot VUOTO_SSR e poi passa da solo a quello
   vero, quindi nessun mismatch e nessun setState dentro un effetto.

   Niente import di React qui dentro: il modulo non ha bisogno di "use client"
   e si prova in node con un localStorage finto. Tocca `window` solo dentro
   subscribe, che React chiama solo nel browser.
   ========================================================================= */

export interface OpzioniStore<T> {
  chiave: string;
  /** ricostruisce il valore da dati non fidati: localStorage si puo' riscrivere a mano */
  pota: (v: unknown) => T;
  /** il valore "letto, e non c'era niente": una funzione, cosi' ogni chiamata da' un oggetto nuovo */
  vuoto: () => T;
}

export interface StoreLocale<T> {
  subscribe: (f: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  /** il valore corrente, per le mutazioni: parte dal modulo, non da uno snapshot di render */
  get: () => T;
  scrivi: (prossimo: T) => void;
  /** sentinella congelata: `snapshot !== VUOTO_SSR` vuol dire "siamo idratati" */
  VUOTO_SSR: T;
}

export function creaStore<T>({ chiave, pota, vuoto }: OpzioniStore<T>): StoreLocale<T> {
  const VUOTO_SSR = Object.freeze(vuoto()) as T;

  let valore: T = vuoto();
  let letto = false;
  const ascoltatori = new Set<() => void>();

  /**
   * `null` significa una cosa sola: lo storage non e' stato leggibile (negato, o in
   * errore). La chiave assente e il JSON illeggibile tornano `vuoto()`, che vuol dire
   * "letto, e non c'era niente di valido". La distinzione conta perche' assicuraLettura
   * scrive quello che riceve: confondere i due casi farebbe azzerare il valore di questa
   * scheda al primo storage negato, o al contrario lo terrebbe stantio dopo che un'altra
   * scheda ha svuotato la chiave.
   */
  function leggi(): T | null {
    let raw: string | null;
    try {
      raw = localStorage.getItem(chiave);
    } catch {
      return null; // storage negato: non ho letto, quindi non ho niente da dire
    }
    if (!raw) return vuoto(); // chiave assente: letto, ed e' vuoto davvero
    try {
      return pota(JSON.parse(raw) as unknown);
    } catch {
      return vuoto(); // JSON rotto: letto, e non c'era niente di valido da tenere
    }
  }

  function assicuraLettura() {
    if (letto) return;
    letto = true;
    const salvato = leggi();
    // `??` e non `if (salvato)`: un valore vuoto e' un risultato, non un fallimento.
    // Con `if` l'utente che svuota la settimana in una scheda se la rivedeva nell'altra.
    valore = salvato ?? valore;
  }

  function avvisa() {
    for (const f of ascoltatori) f();
  }

  function scrivi(prossimo: T) {
    valore = prossimo;
    letto = true; // quello che ho appena scritto e' piu' nuovo di qualunque lettura
    try {
      localStorage.setItem(chiave, JSON.stringify(prossimo));
    } catch {
      /* storage negato o pieno: il valore resta valido per questa sessione */
    }
    avvisa();
  }

  function daAltraScheda(e: Pick<StorageEvent, "key">) {
    // key null = localStorage.clear() in un'altra scheda: riguarda anche noi
    if (e.key !== null && e.key !== chiave) return;
    letto = false;
    assicuraLettura();
    avvisa();
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

  function getSnapshot(): T {
    assicuraLettura();
    return valore; // riferimento stabile: un oggetto nuovo qui farebbe ciclare React
  }

  return {
    subscribe,
    getSnapshot,
    getServerSnapshot: () => VUOTO_SSR,
    get: getSnapshot,
    scrivi,
    VUOTO_SSR,
  };
}
