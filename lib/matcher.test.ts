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
import { SECONDI, getElemento } from "./catalogo";
import type { Tag } from "./types";

const caselle = (p: Piano): Casella[] =>
  GIORNI.flatMap((g) => PASTI.map((m) => p[g]?.[m])).filter((c): c is Casella => !!c);

/**
 * Quante volte ogni elemento compare nella settimana.
 * Si conta per ELEMENTO e non per coppia: due caselle diverse che condividono il
 * secondo lo consumano tutte e due, ed e' quello il tetto che il matcher applica.
 */
const usiPerElemento = (p: Piano): Map<string, number> => {
  const n = new Map<string, number>();
  for (const c of caselle(p)) {
    for (const id of [c.primo, c.secondo]) {
      if (id) n.set(id, (n.get(id) ?? 0) + 1);
    }
  }
  return n;
};

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
    const escludi: Tag[] = ["carne", "pesce"];
    const r = componiPiano(TARGET_DEFAULT, { ...VINCOLI_DEFAULT, escludi });

    const dentro = caselle(r.piano)
      .flatMap((c) => [c.primo, c.secondo])
      .filter((id): id is string => !!id);

    // Il controllo va fatto sui TAG degli elementi, non sulle kcal della casella: un
    // matcher che ignorasse del tutto i vincoli riempirebbe la settimana di pollo e
    // passerebbe lo stesso un controllo sulle sole calorie.
    expect(dentro.length).toBeGreaterThan(0);
    for (const id of dentro) {
      const e = getElemento(id);
      expect(e).toBeDefined();
      for (const t of escludi) expect(e?.tag ?? []).not.toContain(t);
    }

    for (const c of caselle(r.piano)) expect(macroCasella(c).kcal).toBeGreaterThan(0);
    expect(Math.max(...Object.values(r.scarti).map(Math.abs))).toBeLessThanOrEqual(12);
  });

  it("non usa un elemento piu volte del tetto di ripetizioni", () => {
    // La varieta' del menu e' una promessa di prodotto: il cliente si accorge subito
    // se mangia lo stesso secondo cinque volte in una settimana.
    for (const maxRipetizioni of [2, 1]) {
      const r = componiPiano(TARGET_DEFAULT, { ...VINCOLI_DEFAULT, maxRipetizioni });
      const usi = usiPerElemento(r.piano);
      expect(usi.size).toBeGreaterThan(0);
      expect(Math.max(...usi.values())).toBeLessThanOrEqual(maxRipetizioni);
    }
  });

  it("riempie la settimana anche quando il pool si esaurisce, sforando il tetto", () => {
    const posti = TARGET_DEFAULT.pastiAlGiorno * TARGET_DEFAULT.giorni;
    const vegSecondi = SECONDI.filter(
      (e) => !e.tag.includes("carne") && !e.tag.includes("pesce"),
    );
    // La premessa si verifica invece di darla per buona: i secondi ammessi sono meno
    // delle caselle da riempire, e OGNI opzione ne porta uno (anche quelle col solo
    // secondo). Con un tetto di un uso per elemento il pool finisce prima della fine.
    expect(vegSecondi.length).toBeLessThan(posti);

    const r = componiPiano(TARGET_DEFAULT, {
      ...VINCOLI_DEFAULT,
      escludi: ["carne", "pesce"],
      maxRipetizioni: 1,
    });

    // Il ramo di ripiego sfora il tetto apposta: meglio un elemento ripetuto che una
    // casella vuota, perche' la casella vuota e' un pasto che il cliente non riceve.
    expect(caselle(r.piano).length).toBe(posti);
    expect(Math.max(...usiPerElemento(r.piano).values())).toBeGreaterThan(1);
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

  it("non esplode se i vincoli svuotano il catalogo", () => {
    const r = componiPiano(TARGET_DEFAULT, { ...VINCOLI_DEFAULT, escludi: ["carne", "pesce", "veg"] });
    expect(r.piano).toBeDefined();
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
    expect(caselle(r.piano).some((c) => !c.primo)).toBe(true);
    expect(r.totali.carboidrati).toBeLessThan(340);
    expect(Math.max(...Object.values(r.scarti).map(Math.abs))).toBeLessThanOrEqual(12);
  });
});
