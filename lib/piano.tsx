"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { getPiatto, getExtra } from "./catalogo";
import type { Macros } from "./types";
import { creaStore } from "./storeLocale";
import {
  GIORNI,
  PASTI,
  ZERO_MACRO,
  conCasella,
  macroCasella,
  potaAllenamenti,
  potaPiano,
  spostaCasella,
  type Allenamenti,
  type Casella,
  type GiornoSettimana,
  type Pasto,
  type Piano,
  type Slot,
  type TipoGiornata,
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
  NOMI_GIORNATA,
  NOMI_GIORNO,
  PASTI,
  TIPI_GIORNATA,
  ZERO_MACRO,
  leggiCasella,
  macroCasella,
  potaAllenamenti,
  potaPiano,
  spostaCasella,
} from "./settimana";
export type {
  Allenamenti,
  Casella,
  GiornoSettimana,
  Pasto,
  Piano,
  Slot,
  TipoGiornata,
} from "./settimana";

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

/*
 * Due store e due chiavi: il piano resta sulla sua (nessuna migrazione dei piani
 * gia' salvati), gli allenamenti ne hanno una nuova. La meccanica - SSR, idratazione,
 * altre schede, null contro {} - e' in ./storeLocale e vale per entrambi.
 */
const storePiano = creaStore<Piano>({
  chiave: "fuellab.piano.v2",
  pota: potaPiano,
  vuoto: () => ({}),
});

const storeAllenamenti = creaStore<Allenamenti>({
  chiave: "fuellab.allenamenti.v1",
  pota: potaAllenamenti,
  vuoto: () => ({}),
});

/** Scrive solo se qualcosa e' cambiato: le funzioni pure tornano lo stesso riferimento quando non fanno nulla. */
function scriviPiano(prossimo: Piano) {
  if (prossimo !== storePiano.get()) storePiano.scrivi(prossimo);
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
  primaLibera: () => Slot | null;
  /** il piano in ingresso viene potato: puo' arrivare da un link condiviso */
  sostituisciPiano: (p: Piano) => void;
  /** sposta una casella intera, piatto e aggiunte; se la destinazione e' piena le scambia */
  sposta: (da: Slot, a: Slot) => void;
  /** il piano proposto dall'autoriempimento: stessa strada di sostituisciPiano, nome che dice perche' */
  riempi: (p: Piano) => void;
  /** svuota solo il piano: gli allenamenti descrivono la settimana di chi mangia, non il carrello */
  svuota: () => void;
  allenamenti: Allenamenti;
  /** `null` toglie il giorno: "non l'ho detto" e' diverso da "riposo" */
  impostaAllenamento: (g: GiornoSettimana, t: TipoGiornata | null) => void;
  svuotaAllenamenti: () => void;
}

const Ctx = createContext<CtxPiano | null>(null);

export function PianoProvider({ children }: { children: React.ReactNode }) {
  const corrente = useSyncExternalStore(
    storePiano.subscribe,
    storePiano.getSnapshot,
    storePiano.getServerSnapshot,
  );
  const allenamenti = useSyncExternalStore(
    storeAllenamenti.subscribe,
    storeAllenamenti.getSnapshot,
    storeAllenamenti.getServerSnapshot,
  );
  const pronto = corrente !== storePiano.VUOTO_SSR;

  // Le mutazioni partono dal modulo e non da `corrente`: restano stabili fra i render
  // e due click ravvicinati non ripartono entrambi dallo stesso snapshot vecchio.
  const metti = useCallback((g: GiornoSettimana, m: Pasto, id: string) => {
    if (!getPiatto(id)) return;
    const attuale = storePiano.get()[g]?.[m] ?? { extra: [] };
    scriviPiano(conCasella(storePiano.get(), g, m, { ...attuale, piatto: id }));
  }, []);

  const togliPiatto = useCallback((g: GiornoSettimana, m: Pasto) => {
    const attuale = storePiano.get()[g]?.[m];
    if (!attuale) return;
    const prossima: Casella = { extra: attuale.extra };
    scriviPiano(conCasella(storePiano.get(), g, m, prossima));
  }, []);

  const impostaExtra = useCallback(
    (g: GiornoSettimana, m: Pasto, extraId: string, acceso: boolean) => {
      if (!getExtra(extraId)) return;
      const attuale = storePiano.get()[g]?.[m] ?? { extra: [] };
      const gia = attuale.extra.includes(extraId);
      if (gia === acceso) return;
      const extra = acceso
        ? [...attuale.extra, extraId]
        : attuale.extra.filter((x) => x !== extraId);
      scriviPiano(conCasella(storePiano.get(), g, m, { ...attuale, extra }));
    },
    [],
  );

  const alternaExtra = useCallback((g: GiornoSettimana, m: Pasto, extraId: string) => {
    if (!getExtra(extraId)) return;
    const attuale = storePiano.get()[g]?.[m] ?? { extra: [] };
    const gia = attuale.extra.includes(extraId);
    const extra = gia ? attuale.extra.filter((x) => x !== extraId) : [...attuale.extra, extraId];
    scriviPiano(conCasella(storePiano.get(), g, m, { ...attuale, extra }));
  }, []);

  const svuotaCasella = useCallback((g: GiornoSettimana, m: Pasto) => {
    scriviPiano(conCasella(storePiano.get(), g, m, undefined));
  }, []);

  // Passa da potaPiano come la lettura da localStorage: al Task 6 il piano arriva
  // dalla query string di un link condiviso, che chiunque puo' riscrivere a mano.
  // Senza questo, dati malformati resterebbero in memoria E su localStorage per tutta
  // la sessione: assicuraLettura non ripota nulla finche' `letto` e' true, e l'evento
  // `storage` non torna indietro alla scheda che ha scritto.
  const sostituisciPiano = useCallback((p: Piano) => storePiano.scrivi(potaPiano(p)), []);
  const sposta = useCallback(
    (da: Slot, a: Slot) => scriviPiano(spostaCasella(storePiano.get(), da, a)),
    [],
  );
  const svuota = useCallback(() => storePiano.scrivi({}), []);

  const impostaAllenamento = useCallback((g: GiornoSettimana, t: TipoGiornata | null) => {
    const attuali = storeAllenamenti.get();
    if ((attuali[g] ?? null) === t) return;
    const prossimi: Allenamenti = { ...attuali };
    if (t) prossimi[g] = t;
    else delete prossimi[g];
    storeAllenamenti.scrivi(prossimi);
  }, []);
  const svuotaAllenamenti = useCallback(() => storeAllenamenti.scrivi({}), []);

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
      sposta,
      riempi: sostituisciPiano,
      svuota,
      allenamenti,
      impostaAllenamento,
      svuotaAllenamenti,
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
    sposta,
    svuota,
    allenamenti,
    impostaAllenamento,
    svuotaAllenamenti,
  ]);

  return <Ctx.Provider value={valore}>{children}</Ctx.Provider>;
}

export function usePiano(): CtxPiano {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePiano va usato dentro <PianoProvider>");
  return c;
}
