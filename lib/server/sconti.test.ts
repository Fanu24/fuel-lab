import { calcolaPrezzo } from "../abbonamento";
import { describe, expect, it } from "vitest";
import { normalizzaCodice, percentualeValida, totaleScontato, generaCodice } from "../sconti";
import { leggiSconto, preparaSconto } from "./sconti";
import { leggiModificaAdmin, ordineDaRiga, type StatoModificabile } from "./ordini";
import type { D1Database } from "@cloudflare/workers-types";

describe("codici sconto", () => {
  it("normalizza e rifiuta caratteri, lunghezze e percentuali non ammesse", () => {
    expect(normalizzaCodice(" matteo_10 ")).toBe("MATTEO_10");
    for (const code of ["ab", "a bcd", "àbc", "a".repeat(33), "<script>", 42]) expect(normalizzaCodice(code)).toBeNull();
    for (const n of [0, -10, 101, 2.5, "10", NaN]) expect(percentualeValida(n)).toBe(false);
    expect(percentualeValida(100)).toBe(true);
    expect(normalizzaCodice(generaCodice())).not.toBeNull();
  });
  it("calcola in centesimi e mantiene il totale non concordato", () => {
    expect(totaleScontato(1001, 10)).toBe(901);
    expect(totaleScontato(1001, 100)).toBe(0);
    expect(totaleScontato(null, 10)).toBeNull();
    expect(preparaSconto("TEST", 10, null, null, "pickup")).toEqual({ discount: { code: "TEST", percent: 10, appliedPercent: 10, baseCents: null, roundEuro: false }, price: null });
  });
  it("applica solo la percentuale del codice anche con ritiro", () => {
    const subscription = { plan: "pranzo" as const, tier: "standard" as const, household: "singolo" as const };
    const r = preparaSconto("TEST", 1, 123, subscription, "pickup");
    expect(r.discount!.baseCents).toBeGreaterThan(123);
    expect(r.discount!.appliedPercent).toBe(1);
    expect(r.price).toBe(totaleScontato(r.discount!.baseCents, r.discount!.appliedPercent));
  });
  it("un codice dell’1% sconta il listino una sola volta", () => {
    for (const plan of ["leggero", "pranzo"] as const) {
      const subscription = { plan, tier: "standard" as const, household: "singolo" as const };
      const senza = calcolaPrezzo({ formula: plan, fascia: "standard", ritiro: true, nucleo: "singolo" });
      const r = preparaSconto("TEST", 1, senza.totaleCentesimi, subscription, "pickup");
      expect(r.price).toBe(totaleScontato(senza.listinoCentesimi, 1));
      const current: StatoModificabile = { status: "requested", production_date: null, fulfillment_date: null, internal_note: "", customer_message: "", paid: 0, price_cents: r.price, discount: r.discount };
      const res = leggiModificaAdmin({ priceCents: r.discount!.baseCents }, current, "pickup");
      expect(res.ok && res.value.next.price_cents).toBe(r.price);
      expect(res.ok && res.value.cambi).toEqual([]);
    }
  });
  it("rifiuta codici sconosciuti/disattivati e legge percentuale solo dal DB", async () => {
    const fakeDb = (row: unknown) => ({ prepare: () => ({ bind: () => ({ first: async () => row }) }) }) as unknown as D1Database;
    expect(await leggiSconto(fakeDb(null), "TEST")).toMatchObject({ ok: false });
    expect(await leggiSconto(fakeDb({ percent: 25 }), " test ")).toEqual({ ok: true, code: "TEST", percent: 25 });
    expect(await leggiSconto(fakeDb(null), "")).toEqual({ ok: true, code: null, percent: null });
  });
  it("il 20% su 173 euro dà 138,40 euro sia con ritiro sia con consegna", () => {
    const subscription = { plan: "pranzo" as const, tier: "standard" as const, household: "famiglia" as const };
    for (const fulfillment of ["pickup", "delivery"] as const) {
      const risultato = preparaSconto("MATTEO20", 20, 17300, subscription, fulfillment);
      expect(risultato.price).toBe(13840);
      expect(risultato.discount).toMatchObject({ percent: 20, appliedPercent: 20, baseCents: 17300, roundEuro: false });
    }
  });
  it("mantiene lo snapshot leggendo ordini anche dopo disattivazione", () => {
    const o = ordineDaRiga({ discount_code: "TEST", discount_percent: 10, discount_applied_percent: 10, discount_base_cents: 10000, price_cents: 9000 }, false);
    expect(o.discount).toEqual({ code: "TEST", percent: 10, appliedPercent: 10, baseCents: 10000, roundEuro: false });
    expect(o.price_cents).toBe(9000);
  });
  it("modificare note o reinviare il prezzo base non riapplica lo sconto", () => {
    const current: StatoModificabile = { status: "requested", production_date: null, fulfillment_date: null, internal_note: "", customer_message: "", paid: 0, price_cents: 9000, discount: { code: "TEST", percent: 10, appliedPercent: 10, baseCents: 10000 } };
    const note = leggiModificaAdmin({ internalNote: "prova" }, current, "pickup");
    expect(note.ok && note.value.next.price_cents).toBe(9000);
    const prezzo = leggiModificaAdmin({ priceCents: 10000 }, current, "pickup");
    expect(prezzo.ok && prezzo.value.next.price_cents).toBe(9000);
    expect(prezzo.ok && prezzo.value.cambi).toEqual([]);
    const nuovo = leggiModificaAdmin({ priceCents: 20000 }, current, "pickup");
    expect(nuovo.ok && nuovo.value.next.price_cents).toBe(18000);
    expect(nuovo.ok && nuovo.value.next.discount?.baseCents).toBe(20000);
    const rimosso = leggiModificaAdmin({ priceCents: null }, current, "pickup");
    expect(rimosso.ok && rimosso.value.next.price_cents).toBeNull();
  });
  it("anche un codice 100% registra cambi del totale base", () => {
    const current: StatoModificabile = { status: "requested", production_date: null, fulfillment_date: null, internal_note: "", customer_message: "", paid: 0, price_cents: 0, discount: { code: "FREE", percent: 100, appliedPercent: 100, baseCents: 10000 } };
    const r = leggiModificaAdmin({ priceCents: 20000 }, current, "pickup");
    expect(r.ok && r.value.cambi.length).toBe(1);
    expect(r.ok && r.value.next.discount?.baseCents).toBe(20000);
    expect(r.ok && r.value.next.price_cents).toBe(0);
  });
});
