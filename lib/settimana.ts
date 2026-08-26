import { getElemento, getExtra } from "./catalogo";
import type { Macros } from "./types";

/* =========================================================================
   Il piano della settimana: il nucleo puro.

   Sostituisce il vecchio carrello piatto. La differenza non e' cosmetica: qui
   un elemento non sta "nel box", sta in una CASELLA precisa - martedi a cena.
   E' quello che permette di mostrare i macro giorno per giorno invece che solo
   il totale, che e' il modo in cui ragiona chi si allena.

   Dentro la casella il pasto e' scomposto: un primo, un secondo e quanti extra
   servono. Nessuno dei due elementi e' obbligatorio, perche' una cena puo' essere
   solo un secondo e un pranzo pre-allenamento solo un primo.

   PERCHE' STA QUI E NON IN piano.tsx. Quel file e' marcato "use client", e un
   Server Component che importa da un modulo client non riceve le funzioni: Next
   sostituisce gli export con riferimenti al client, che non si possono chiamare.
   Il matcher, la codifica del link e qualunque pagina server hanno bisogno di
   questi simboli senza avere bisogno di React, quindi il modello dei dati vive
   fuori dal confine e piano.tsx ci si appoggia sopra. Il guasto che questa
   separazione previene non lo vede nessuno strumento - ne' tsc, ne' vitest, ne'
   lint: la build passa e si rompe solo aprendo la pagina.
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

/**
 * Una casella senza niente dentro. Vive qui e non nello store perche' la usano sia
 * leggiCasella, per scartare le caselle che il catalogo ha svuotato, sia la
 * riscrittura del piano, per non lasciare gusci vuoti nel JSON salvato.
 */
export function casellaVuota(c: Casella): boolean {
  return !c.primo && !c.secondo && c.extra.length === 0;
}

/**
 * Ricostruisce una casella da dati non fidati tenendo solo cio' che il catalogo
 * riconosce ancora, e solo nello slot giusto: un id di secondo finito nel campo
 * `primo` viene scartato, altrimenti il conto delle proteine mentirebbe.
 *
 * Esportata perche' e' la funzione con piu' casi limite del file ed e' pura: si
 * prova senza montare React e senza un DOM finto.
 */
export function leggiCasella(v: unknown): Casella | undefined {
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

/**
 * L'unico cancello per far entrare un piano nello store, da qualunque parte arrivi:
 * il JSON di localStorage o il link condivisibile, che e' una query string e quindi
 * per definizione modificabile a mano. Scarta le caselle che puntano a id spariti dal
 * catalogo — il menu cambia ogni settimana e un piano salvato invecchia — e le chiavi
 * di giorno o di pasto che non riconosce.
 */
export function potaPiano(v: unknown): Piano {
  if (!v || typeof v !== "object") return {};
  const o = v as Record<string, unknown>;
  const out: Piano = {};
  for (const g of GIORNI) {
    const riga = o[g];
    if (!riga || typeof riga !== "object") continue;
    for (const m of PASTI) {
      const c = leggiCasella((riga as Record<string, unknown>)[m]);
      if (c) out[g] = { ...out[g], [m]: c };
    }
  }
  return out;
}
