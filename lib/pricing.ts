import type { Formula } from "./types";

export interface Taglia {
  pasti: number;
  prezzoPasto: number;
  scontoVolume: number; // percentuale rispetto alla taglia da 6
}

/**
 * Il prezzo lo decide la TAGLIA del box, non il singolo piatto: cosi il salmone
 * non costa piu del pollo e il cliente non ottimizza il carrello invece della dieta.
 * E' anche il motivo per cui i piatti non hanno un prezzo proprio nel catalogo.
 */
export const TAGLIE: Taglia[] = [
  { pasti: 6, prezzoPasto: 10.9, scontoVolume: 0 },
  { pasti: 10, prezzoPasto: 10.2, scontoVolume: 6 },
  { pasti: 15, prezzoPasto: 9.6, scontoVolume: 12 },
  { pasti: 20, prezzoPasto: 8.9, scontoVolume: 18 },
];

/** Sconto dell'abbonamento settimanale, sopra allo sconto di volume. */
export const SCONTO_ABBONAMENTO = 0.15;

/** Consegna a Pescara e provincia. Gratis dai 10 pasti in su. */
export const CONSEGNA = 3.9;
export const CONSEGNA_GRATIS_DA = 10;

export function tagliaPer(pasti: number): Taglia {
  // La taglia applicata e' la piu grande che il carrello raggiunge davvero:
  // chi mette 12 pasti paga il prezzo dei 10, non quello dei 15 che non ha comprato.
  let scelta = TAGLIE[0];
  for (const t of TAGLIE) if (pasti >= t.pasti) scelta = t;
  return scelta;
}

export interface Preventivo {
  pasti: number;
  prezzoPasto: number;
  scontoVolume: number;
  formula: Formula;
  subtotale: number;
  scontoAbbonamento: number;
  consegna: number;
  totale: number;
  /** quanto risparmi rispetto al prezzo pieno della taglia da 6, a parita di pasti */
  risparmio: number;
}

export function preventivo(pasti: number, formula: Formula): Preventivo {
  const t = tagliaPer(pasti);
  const subtotale = pasti * t.prezzoPasto;
  const scontoAbbonamento = formula === "abbonamento" ? subtotale * SCONTO_ABBONAMENTO : 0;
  const consegna = pasti >= CONSEGNA_GRATIS_DA ? 0 : CONSEGNA;
  const totale = subtotale - scontoAbbonamento + consegna;
  const pieno = pasti * TAGLIE[0].prezzoPasto;
  return {
    pasti,
    prezzoPasto: t.prezzoPasto,
    scontoVolume: t.scontoVolume,
    formula,
    subtotale,
    scontoAbbonamento,
    consegna,
    totale,
    risparmio: Math.max(0, pieno - (subtotale - scontoAbbonamento)),
  };
}

export function euro(n: number): string {
  return n.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}
