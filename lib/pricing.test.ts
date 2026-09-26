import { describe, expect, it } from "vitest";
import {
  CONSEGNA,
  MOSTRA_STIMA_PREZZO,
  SCONTO_ABBONAMENTO,
  TAGLIE,
  preventivo,
  tagliaPer,
} from "./pricing";

describe("tagliaPer", () => {
  it("sotto la prima taglia applica comunque la prima", () => {
    expect(tagliaPer(5)).toBe(TAGLIE[0]);
  });

  it("cambia taglia solo quando la soglia e raggiunta davvero", () => {
    expect(tagliaPer(6).pasti).toBe(6);
    expect(tagliaPer(9).pasti).toBe(6);
    expect(tagliaPer(10).pasti).toBe(10);
    expect(tagliaPer(14).pasti).toBe(10);
  });
});

describe("preventivo", () => {
  it("la consegna e gratis dai 10 pasti", () => {
    expect(preventivo(9, "singolo").consegna).toBe(CONSEGNA);
    expect(preventivo(10, "singolo").consegna).toBe(0);
  });

  it("l'abbonamento toglie il 15% dal subtotale", () => {
    const p = preventivo(10, "abbonamento");
    expect(SCONTO_ABBONAMENTO).toBe(0.15);
    expect(p.scontoAbbonamento).toBeCloseTo(p.subtotale * 0.15, 10);
    expect(p.totale).toBeCloseTo(p.subtotale * 0.85, 10);
    expect(preventivo(10, "singolo").scontoAbbonamento).toBe(0);
  });

  it("il totale somma subtotale, sconto e consegna", () => {
    const p = preventivo(9, "singolo");
    expect(p.subtotale).toBeCloseTo(9 * TAGLIE[0].prezzoPasto, 10);
    expect(p.totale).toBeCloseTo(p.subtotale + CONSEGNA, 10);
  });
});

describe("MOSTRA_STIMA_PREZZO", () => {
  it("resta spento: il committente non vuole prezzi in chiaro", () => {
    expect(MOSTRA_STIMA_PREZZO).toBe(false);
  });
});
