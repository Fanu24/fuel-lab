import { describe, expect, it } from "vitest";
import {
  CONSEGNA,
  MOSTRA_STIMA_PREZZO,
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
    expect(preventivo(9).consegna).toBe(CONSEGNA);
    expect(preventivo(10).consegna).toBe(0);
  });

  it("il totale somma subtotale e consegna", () => {
    const p = preventivo(9);
    expect(p.subtotale).toBeCloseTo(9 * TAGLIE[0].prezzoPasto, 10);
    expect(p.totale).toBeCloseTo(p.subtotale + CONSEGNA, 10);
  });
});

describe("MOSTRA_STIMA_PREZZO", () => {
  it("resta spento: il committente non vuole prezzi in chiaro", () => {
    expect(MOSTRA_STIMA_PREZZO).toBe(false);
  });
});
