import { describe, expect, it } from "vitest";
import {
  EXTRA,
  PIATTI,
  REPARTI,
  etichettaPrezzo,
  getPiatto,
  kcalDa,
} from "./catalogo";

describe("catalogo", () => {
  it("ha i sei piatti del cliente e il listino box", () => {
    expect(PIATTI.length).toBe(6);
    expect(EXTRA.length).toBeGreaterThanOrEqual(30);
  });

  it("ha id univoci", () => {
    const ids = [...PIATTI.map((e) => e.id), ...EXTRA.map((e) => e.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("rispetta kcal = P*4 + C*4 + G*9 su ogni piatto", () => {
    for (const e of PIATTI)
      expect(`${e.id}:${e.kcal}`).toBe(`${e.id}:${kcalDa(e.proteine, e.carboidrati, e.grassi)}`);
  });

  it("rispetta kcal = P*4 + C*4 + G*9 su ogni extra", () => {
    for (const e of EXTRA)
      expect(`${e.id}:${e.kcal}`).toBe(`${e.id}:${kcalDa(e.proteine, e.carboidrati, e.grassi)}`);
  });

  it("dichiara gli allergeni su ogni riga", () => {
    for (const e of [...PIATTI, ...EXTRA]) expect(Array.isArray(e.allergeni)).toBe(true);
  });

  it("ogni piatto ha ingredienti, motivo e allenamento", () => {
    for (const p of PIATTI) {
      expect(p.ingredienti.length, p.id).toBeGreaterThan(3);
      expect(p.motivo.length, p.id).toBeGreaterThan(40);
      expect(["cardio", "pesi", "entrambi"]).toContain(p.allenamento);
      expect(getPiatto(p.id)).toBe(p);
    }
  });

  it("ogni extra ha reparto, foto e un prezzo dichiarato senza inventarlo", () => {
    const reparti = new Set(REPARTI.map((r) => r.id));
    for (const e of EXTRA) {
      expect(e.descrizione.length, e.id).toBeGreaterThan(8);
      expect(e.img, e.id).toMatch(/^photo-/);
      expect(reparti.has(e.reparto), e.id).toBe(true);
      if (e.prezzoEuro != null) {
        expect(e.prezzoEuro).toBeGreaterThan(0);
        expect(etichettaPrezzo(e)).toMatch(/€/);
      } else {
        expect(e.prezzoNota, e.id).not.toBeNull();
      }
    }
  });

  it("non inventa i prezzi che il PDF non mette", () => {
    const pollo = EXTRA.find((e) => e.id === "prot-pollo");
    expect(pollo?.prezzoEuro).toBeNull();
    expect(pollo?.prezzoNota).toBe("incluso");
    const snack = EXTRA.find((e) => e.id === "snack-pancakes");
    expect(snack?.prezzoEuro).toBeNull();
    expect(snack?.prezzoNota).toBe("su-richiesta");
    const verdure = EXTRA.find((e) => e.id === "verdure-stagione");
    expect(verdure?.prezzoNota).toBe("da-a");
    expect(etichettaPrezzo(verdure!)).toBe("Da 1 a 2 €");
  });

  it("non ha macro negative", () => {
    for (const e of [...PIATTI, ...EXTRA])
      for (const k of ["proteine", "carboidrati", "grassi"] as const)
        expect(e[k], `${e.id}.${k}`).toBeGreaterThanOrEqual(0);
  });

  const ALLERGENI_UE = [
    "glutine", "crostacei", "uova", "pesce", "arachidi", "soia", "latte",
    "frutta a guscio", "sedano", "senape", "sesamo", "solfiti", "lupini", "molluschi",
  ];

  it("dichiara solo allergeni previsti dal Reg. UE 1169/2011", () => {
    for (const e of [...PIATTI, ...EXTRA])
      for (const a of e.allergeni)
        expect(ALLERGENI_UE, `${e.id}: allergene fuori elenco "${a}"`).toContain(a);
  });
});
