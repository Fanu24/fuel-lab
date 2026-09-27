/**
 * I conti del pannello "Numeri": serie giornaliere complete (anche i giorni a
 * zero, cosi' il grafico non salta), piatti piu' chiesti, ricavi. D1 fornisce
 * le righe grezze dell'intervallo, qui si raggruppa per giorno di Pescara.
 */

import type { Metriche, StatoOrdine, VoceOrdine } from "../api";
import { giornoRoma } from "./date";
import { STATI } from "./ordini";

export const GIORNI_MIN = 7;
export const GIORNI_MAX = 365;
export const GIORNI_DEFAULT = 30;

/** `?days=N`: intero fra 7 e 365, altrimenti 30. Fuori scala si porta al bordo. */
export function leggiGiorni(raw: string | null): number {
  if (raw === null || raw.trim() === "") return GIORNI_DEFAULT;
  const n = Number(raw);
  if (!Number.isFinite(n)) return GIORNI_DEFAULT;
  return Math.min(GIORNI_MAX, Math.max(GIORNI_MIN, Math.round(n)));
}

export type RigaOrdineMetriche = {
  created_at: string;
  status: string;
  meals: number;
  items_json: string;
  price_cents: number | null;
  paid: number;
};

/** Tiene solo le righe il cui timestamp cade in uno dei giorni, e annota il giorno. */
export function nelPeriodo<T>(giorni: string[], righe: T[], ts: (riga: T) => unknown): Array<T & { giorno: string }> {
  const dentro = new Set(giorni);
  return righe.flatMap((riga) => {
    const giorno = giornoRoma(ts(riga));
    return giorno && dentro.has(giorno) ? [{ ...riga, giorno }] : [];
  });
}

export function ordiniGiornalieri(giorni: string[], ordini: Array<{ giorno: string; status: string; meals: number }>): Metriche["ordersDaily"] {
  const serie = new Map(giorni.map((day) => [day, { day, orders: 0, meals: 0 }]));
  for (const ordine of ordini) {
    if (ordine.status === "cancelled") continue;
    const punto = serie.get(ordine.giorno);
    if (!punto) continue;
    punto.orders += 1;
    punto.meals += Number(ordine.meals) || 0;
  }
  return [...serie.values()];
}

export function conteggiGiornalieri(giorni: string[], giorniEventi: string[]): Metriche["signupsDaily"] {
  const serie = new Map(giorni.map((day) => [day, { day, count: 0 }]));
  for (const giorno of giorniEventi) {
    const punto = serie.get(giorno);
    if (punto) punto.count += 1;
  }
  return [...serie.values()];
}

export function trafficoGiornaliero(giorni: string[], righe: Array<{ day: string; views: number }>): Metriche["traffic"] {
  const serie = new Map(giorni.map((day) => [day, { day, views: 0 }]));
  for (const riga of righe) {
    const punto = serie.get(riga.day);
    if (punto) punto.views += Number(riga.views) || 0;
  }
  return [...serie.values()];
}

export function ordiniPerStato(ordini: Array<{ status: string }>): Metriche["ordersByStatus"] {
  const conti = new Map<StatoOrdine, number>(STATI.map((stato) => [stato, 0]));
  for (const ordine of ordini) {
    const stato = ordine.status as StatoOrdine;
    if (conti.has(stato)) conti.set(stato, (conti.get(stato) ?? 0) + 1);
  }
  return [...conti.entries()].map(([status, count]) => ({ status, count }));
}

/** I piatti piu' chiesti: ogni voce e' una porzione. Le richieste annullate non contano. */
export function topPiatti(ordini: Array<{ status: string; items_json: string }>, quanti = 10): Metriche["topDishes"] {
  const conti = new Map<string, number>();
  for (const ordine of ordini) {
    if (ordine.status === "cancelled") continue;
    let voci: VoceOrdine[] = [];
    try {
      const letto: unknown = JSON.parse(ordine.items_json);
      if (Array.isArray(letto)) voci = letto as VoceOrdine[];
    } catch {
      continue;
    }
    for (const voce of voci) {
      if (typeof voce?.name !== "string" || !voce.name) continue;
      conti.set(voce.name, (conti.get(voce.name) ?? 0) + 1);
    }
  }
  return [...conti.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "it"))
    .slice(0, quanti)
    .map(([name, count]) => ({ name, count }));
}

/**
 * Totale concordato, incassato e da incassare. Il prezzo di una richiesta
 * ancora da confermare e' solo una proposta: conta come incassato se Matteo
 * l'ha gia' segnato pagato, ma non come credito. Gli annullati non contano.
 */
export function ricavi(ordini: Array<{ status: string; price_cents: number | null; paid: number }>): Metriche["revenue"] {
  let agreedCents = 0;
  let paidCents = 0;
  let unpaidCents = 0;
  for (const ordine of ordini) {
    if (ordine.status === "cancelled" || typeof ordine.price_cents !== "number") continue;
    const pagato = Number(ordine.paid) === 1;
    if (ordine.status === "requested" && !pagato) continue;
    agreedCents += ordine.price_cents;
    if (pagato) paidCents += ordine.price_cents;
    else unpaidCents += ordine.price_cents;
  }
  return { agreedCents, paidCents, unpaidCents };
}
