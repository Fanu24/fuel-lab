import { getPiatto, getExtra } from "./catalogo";
import type { Macros } from "./types";

/* =========================================================================
   Il piano della settimana: il nucleo puro.

   Un piatto gia' composto sta in una CASELLA precisa - martedi a cena - con
   le aggiunte della box attaccate a quel pasto. I macro si sommano giorno
   per giorno, che e' il modo in cui ragiona chi si allena.

   PERCHE' STA QUI E NON IN piano.tsx. Quel file e' marcato "use client", e un
   Server Component che importa da un modulo client non riceve le funzioni: Next
   sostituisce gli export con riferimenti al client, che non si possono chiamare.
   Il matcher, la codifica del link e qualunque pagina server hanno bisogno di
   questi simboli senza avere bisogno di React, quindi il modello dei dati vive
   fuori dal confine e piano.tsx ci si appoggia sopra.
   ========================================================================= */

export const GIORNI = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"] as const;
export type GiornoSettimana = (typeof GIORNI)[number];

export const PASTI = ["pranzo", "cena"] as const;
export type Pasto = (typeof PASTI)[number];

export const NOMI_GIORNO: Record<GiornoSettimana, string> = {
  lun: "Lunedì",
  mar: "Martedì",
  mer: "Mercoledì",
  gio: "Giovedì",
  ven: "Venerdì",
  sab: "Sabato",
  dom: "Domenica",
};

export interface Casella {
  piatto?: string;
  /** id degli extra: array vuoto quando non ce ne sono, mai assente */
  extra: string[];
}

export type Piano = Partial<Record<GiornoSettimana, Partial<Record<Pasto, Casella>>>>;

/** Sette giorni per due pasti: il fondo scala di ogni percentuale di riempimento. */
export const CASELLE_TOTALI = GIORNI.length * PASTI.length; // 14

export const ZERO_MACRO: Macros = { kcal: 0, proteine: 0, carboidrati: 0, grassi: 0 };

/**
 * Macro di una casella: piatto ed extra sommati.
 *
 * Gli id che il catalogo non conosce piu' vengono ignorati invece di far esplodere
 * il calcolo: il menu cambia ogni settimana e un piano salvato invecchia in fretta.
 */
export function macroCasella(c: Casella | undefined): Macros {
  if (!c) return { ...ZERO_MACRO };
  const pezzi: (Macros | undefined)[] = [
    c.piatto ? getPiatto(c.piatto) : undefined,
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

export function casellaVuota(c: Casella): boolean {
  return !c.piatto && c.extra.length === 0;
}

/**
 * Ricostruisce una casella da dati non fidati tenendo solo cio' che il catalogo
 * riconosce ancora. Esportata perche' e' pura: si prova senza montare React.
 */
export function leggiCasella(v: unknown): Casella | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const c: Casella = { extra: [] };
  if (typeof o.piatto === "string" && getPiatto(o.piatto)) {
    c.piatto = o.piatto;
  }
  if (Array.isArray(o.extra)) {
    c.extra = (o.extra as unknown[]).filter(
      (id): id is string => typeof id === "string" && !!getExtra(id),
    );
  }
  return casellaVuota(c) ? undefined : c;
}

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
