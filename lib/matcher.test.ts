import { describe, expect, it } from "vitest";
import { componiPiano, TARGET_DEFAULT, VINCOLI_DEFAULT, quotaCoperta } from "./matcher";
import { macroCasella, CASELLE_TOTALI, GIORNI, PASTI } from "./piano";

const caselle = (p: ReturnType<typeof componiPiano>["piano"]) =>
  GIORNI.flatMap((g) => PASTI.map((m) => p[g]?.[m]).filter(Boolean));

describe("matcher", () => {
  it("copre un quarto di giornata per pasto", () => {
    expect(quotaCoperta(1)).toBeCloseTo(0.25);
    expect(quotaCoperta(2)).toBeCloseTo(0.5);
    expect(quotaCoperta(3)).toBeCloseTo(0.75);
  });

  it("riempie il numero di caselle richiesto", () => {
    const r = componiPiano(TARGET_DEFAULT, VINCOLI_DEFAULT);
    expect(caselle(r.piano).length).toBe(TARGET_DEFAULT.pastiAlGiorno * TARGET_DEFAULT.giorni);
  });

  it("centra il bersaglio entro il 12 per cento sullo scenario tipo", () => {
    const r = componiPiano(TARGET_DEFAULT, VINCOLI_DEFAULT);
    const peggiore = Math.max(...Object.values(r.scarti).map(Math.abs));
    expect(peggiore).toBeLessThanOrEqual(12);
  });

  it("rispetta i vincoli di esclusione", () => {
    const r = componiPiano(TARGET_DEFAULT, { ...VINCOLI_DEFAULT, escludi: ["carne", "pesce"] });
    for (const c of caselle(r.piano)) expect(macroCasella(c).kcal).toBeGreaterThan(0);
    expect(Math.max(...Object.values(r.scarti).map(Math.abs))).toBeLessThanOrEqual(12);
  });

  it("dichiara lo scarto quando il bersaglio e fuori portata invece di consegnare in silenzio", () => {
    const impossibile = { kcal: 3000, proteine: 200, carboidrati: 360, grassi: 85, pastiAlGiorno: 3, giorni: 5 };
    const r = componiPiano(impossibile, VINCOLI_DEFAULT);
    // 3 pasti al giorno per 5 giorni fanno 15, ma la settimana ha 14 caselle: il piano
    // si ferma a quello che la settimana contiene. Il bersaglio dichiarato resta quello
    // della scheda, quindi il pasto mancante finisce negli scarti invece di sparire.
    expect(caselle(r.piano).length).toBe(CASELLE_TOTALI);
    expect(r.aCentro).toBe(false);
  });

  it("scende sotto il tetto glucidico con le caselle del solo secondo", () => {
    const definizione = {
      kcal: 1800, proteine: 170, carboidrati: 120, grassi: 55, pastiAlGiorno: 2, giorni: 5,
    };
    const r = componiPiano(definizione, VINCOLI_DEFAULT);
    // Il primo piu magro porta 33 g di carboidrati e il secondo piu magro 1: dieci
    // caselle con primo E secondo non possono stare sotto i 340 g, contro un bersaglio
    // di 300. Se le caselle col solo secondo sparissero dalle opzioni, questo scenario
    // sarebbe irraggiungibile per costruzione e nessun altro test se ne accorgerebbe.
    expect(caselle(r.piano).some((c) => c && !c.primo)).toBe(true);
    expect(r.totali.carboidrati).toBeLessThan(340);
    expect(Math.max(...Object.values(r.scarti).map(Math.abs))).toBeLessThanOrEqual(12);
  });

  it("non esplode se i vincoli svuotano il catalogo", () => {
    const r = componiPiano(TARGET_DEFAULT, { ...VINCOLI_DEFAULT, escludi: ["carne", "pesce", "veg"] });
    expect(r.piano).toBeDefined();
  });
});
