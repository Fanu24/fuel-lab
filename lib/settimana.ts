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

/** Un indirizzo nella griglia: il giorno e il pasto. Serve a trascinare e a scambiare. */
export type Slot = { g: GiornoSettimana; m: Pasto };

/*
 * Cosa fa chi mangia quel giorno. Vive accanto al piano ma NON dentro: il Piano
 * resta identico a prima (nessuna migrazione dei piani salvati) e gli allenamenti
 * hanno una chiave loro. Un giorno senza tipo non e' "riposo": e' "non l'ho detto",
 * e l'autoriempimento lo lascia stare.
 */
export const TIPI_GIORNATA = ["cardio", "pesi", "riposo"] as const;
export type TipoGiornata = (typeof TIPI_GIORNATA)[number];

export type Allenamenti = Partial<Record<GiornoSettimana, TipoGiornata>>;

export const NOMI_GIORNATA: Record<TipoGiornata, string> = {
  cardio: "Cardio",
  pesi: "Pesi",
  riposo: "Riposo",
};

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
    // Una aggiunta vale una volta sola: dati riscritti a mano o venuti da un link possono ripeterla,
    // e due volte lo stesso extra sommerebbe due volte i macro (e il supplemento).
    c.extra = [
      ...new Set(
        (o.extra as unknown[]).filter((id): id is string => typeof id === "string" && !!getExtra(id)),
      ),
    ];
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

/** Stesso principio di potaPiano: arriva da localStorage o da un link, quindi non ci si fida. */
export function potaAllenamenti(v: unknown): Allenamenti {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const o = v as Record<string, unknown>;
  const out: Allenamenti = {};
  for (const g of GIORNI) {
    const t = o[g];
    if (typeof t === "string" && (TIPI_GIORNATA as readonly string[]).includes(t)) {
      out[g] = t as TipoGiornata;
    }
  }
  return out;
}

/**
 * Riscrive una casella senza mutare il piano corrente. Una casella rimasta vuota
 * sparisce, e con lei il giorno che non ha piu' pasti: cosi' il conto delle caselle
 * piene dice la verita' e il JSON salvato non accumula gusci vuoti.
 */
export function conCasella(
  p: Piano,
  g: GiornoSettimana,
  m: Pasto,
  c: Casella | undefined,
): Piano {
  const riga: Partial<Record<Pasto, Casella>> = { ...p[g] };
  if (c && !casellaVuota(c)) riga[m] = c;
  else delete riga[m];
  const out: Piano = { ...p, [g]: riga };
  if (Object.keys(riga).length === 0) delete out[g];
  return out;
}

/**
 * Trascinare una casella su un'altra: si porta dietro piatto E aggiunte, perche'
 * le aggiunte sono state scelte per quel piatto, non per quell'orario. Se la
 * destinazione e' piena le due caselle si scambiano: buttare via il piatto che
 * c'era sarebbe una perdita silenziosa che l'utente non ha chiesto.
 *
 * Nei casi in cui non succede niente torna lo STESSO riferimento: chi lo usa con
 * uno store puo' confrontare per identita' e non scrivere su localStorage a vuoto.
 */
export function spostaCasella(p: Piano, da: Slot, a: Slot): Piano {
  if (da.g === a.g && da.m === a.m) return p;
  const sorgente = p[da.g]?.[da.m];
  if (!sorgente) return p;
  const destinazione = p[a.g]?.[a.m];
  const senzaSorgente = conCasella(p, da.g, da.m, destinazione);
  return conCasella(senzaSorgente, a.g, a.m, sorgente);
}
