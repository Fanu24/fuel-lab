import type { D1Database } from "@cloudflare/workers-types";
import { calcolaPrezzo } from "../abbonamento";
import type { Modalita, SceltaAbbonamento, ScontoOrdine } from "../api";
import { normalizzaCodice, totaleScontato } from "../sconti";

export async function leggiSconto(db: D1Database, value: unknown): Promise<{ ok: true; code: string | null; percent: number | null } | { ok: false; error: string }> {
  if (value === undefined || value === null || value === "") return { ok: true, code: null, percent: null };
  const code = normalizzaCodice(value);
  if (!code) return { ok: false, error: "Codice sconto non valido: usa da 3 a 32 lettere, numeri, - o _." };
  const row = await db.prepare("SELECT percent FROM discount_codes WHERE code=? AND active=1").bind(code).first<{ percent: number }>();
  return row ? { ok: true, code, percent: row.percent } : { ok: false, error: "Codice sconto inesistente o disattivato." };
}

/** Applica solo il codice generato da Matteo, sul listino dell'abbonamento. */
export function preparaSconto(code: string | null, percent: number | null, base: number | null, subscription: SceltaAbbonamento | null, fulfillment: Modalita, usaListino = true): { discount: ScontoOrdine | null; price: number | null } {
  if (!code || percent === null) return { discount: null, price: base };
  let appliedPercent = percent;
  if (subscription && usaListino) {
    const prezzo = calcolaPrezzo({ formula: subscription.plan, fascia: subscription.tier, nucleo: subscription.household, ritiro: fulfillment === "pickup" });
    base = prezzo.listinoCentesimi;
    appliedPercent = percent;
  }
  return { discount: { code, percent, appliedPercent, baseCents: base, roundEuro: false }, price: totaleScontato(base, appliedPercent) };
}
