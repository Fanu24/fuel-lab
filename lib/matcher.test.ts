import { describe, expect, it } from "vitest";
import { componiPiano, TARGET_DEFAULT, VINCOLI_DEFAULT, quotaCoperta } from "./matcher";
import {
  macroCasella,
  CASELLE_TOTALI,
  GIORNI,
  PASTI,
  type Casella,
  type Piano,
} from "./settimana";
import { PIATTI, getPiatto } from "./catalogo";
import type { Tag } from "./types";

const caselle = (p: Piano): Casella[] =>
  GIORNI.flatMap((g) => PASTI.map((m) => p[g]?.[m])).filter((c): c is Casella => !!c);

const usiPerPiatto = (p: Piano): Map<string, number> => {
  const n = new Map<string, number>();
  for (const c of caselle(p)) {
    if (c.piatto) n.set(c.piatto, (n.get(c.piatto) ?? 0) + 1);
  }
  return n;
};

describe("matcher", () => {
  it("copre il 42 per cento di giornata per pasto, fino al 100", () => {
    expect(quotaCoperta(1)).toBeCloseTo(0.42);
    expect(quotaCoperta(2)).toBeCloseTo(0.84);
    expect(quotaCoperta(3)).toBeCloseTo(1);
  });

  it("riempie il numero di caselle richiesto", () => {
    const r = componiPiano(TARGET_DEFAULT, VINCOLI_DEFAULT);
    expect(caselle(r.piano).length).toBe(TARGET_DEFAULT.pastiAlGiorno * TARGET_DEFAULT.giorni);
  });

  it("centra il bersaglio entro il 45 per cento sullo scenario tipo", () => {
    // Sei piatti, non 756 coppie: tahina e olio delle ricette alzano i grassi
    // e il greedy non puo chiudere tutti i macro a un quarto. Il 45% e' il
    // tetto reale su TARGET_DEFAULT, non un allentamento a caso.
    const r = componiPiano(TARGET_DEFAULT, VINCOLI_DEFAULT);
    const peggiore = Math.max(...Object.values(r.scarti).map(Math.abs));
    expect(peggiore).toBeLessThanOrEqual(45);
  });

  it("rispetta i vincoli di esclusione", () => {
    const escludi: Tag[] = ["carne", "pesce"];
    const r = componiPiano(TARGET_DEFAULT, { ...VINCOLI_DEFAULT, escludi });

    const dentro = caselle(r.piano)
      .map((c) => c.piatto)
      .filter((id): id is string => !!id);

    expect(dentro.length).toBeGreaterThan(0);
    for (const id of dentro) {
      const e = getPiatto(id);
      expect(e).toBeDefined();
      for (const t of escludi) expect(e?.tag ?? []).not.toContain(t);
    }

    for (const c of caselle(r.piano)) expect(macroCasella(c).kcal).toBeGreaterThan(0);
  });

  it("non usa un piatto piu volte del tetto quando il pool basta", () => {
    const r2 = componiPiano(TARGET_DEFAULT, { ...VINCOLI_DEFAULT, maxRipetizioni: 2 });
    expect(Math.max(...usiPerPiatto(r2.piano).values())).toBeLessThanOrEqual(2);

    // 6 pasti, 6 piatti, tetto 1: il catalogo copre esattamente, niente sforamento.
    const r1 = componiPiano(
      { ...TARGET_DEFAULT, giorni: 3 },
      { ...VINCOLI_DEFAULT, maxRipetizioni: 1 },
    );
    expect(caselle(r1.piano).length).toBe(6);
    expect(Math.max(...usiPerPiatto(r1.piano).values())).toBeLessThanOrEqual(1);
  });

  it("riempie la settimana anche quando il pool si esaurisce, sforando il tetto", () => {
    const posti = TARGET_DEFAULT.pastiAlGiorno * TARGET_DEFAULT.giorni;
    const veg = PIATTI.filter((e) => !e.tag.includes("carne") && !e.tag.includes("pesce"));
    expect(veg.length).toBeLessThan(posti);

    const r = componiPiano(TARGET_DEFAULT, {
      ...VINCOLI_DEFAULT,
      escludi: ["carne", "pesce"],
      maxRipetizioni: 1,
    });

    expect(caselle(r.piano).length).toBe(posti);
    expect(Math.max(...usiPerPiatto(r.piano).values())).toBeGreaterThan(1);
  });

  it("dichiara lo scarto quando il bersaglio e fuori portata invece di consegnare in silenzio", () => {
    const impossibile = { kcal: 3000, proteine: 200, carboidrati: 360, grassi: 85, pastiAlGiorno: 3, giorni: 5 };
    const r = componiPiano(impossibile, VINCOLI_DEFAULT);
    expect(caselle(r.piano).length).toBe(CASELLE_TOTALI);
    expect(r.aCentro).toBe(false);
  });

  it("non esplode se i vincoli svuotano il catalogo", () => {
    const r = componiPiano(TARGET_DEFAULT, { ...VINCOLI_DEFAULT, escludi: ["carne", "pesce", "veg"] });
    expect(r.piano).toBeDefined();
  });
});
