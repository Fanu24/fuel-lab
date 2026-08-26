import { describe, expect, it } from "vitest";
import { ABBINAMENTI, EXTRA, PRIMI, SECONDI, getElemento, kcalDa } from "./catalogo";

const tutti = [...PRIMI, ...SECONDI];

describe("catalogo", () => {
  it("ha primi e secondi", () => {
    expect(PRIMI.length).toBeGreaterThanOrEqual(12);
    expect(SECONDI.length).toBeGreaterThanOrEqual(14);
    expect(EXTRA.length).toBeGreaterThanOrEqual(8);
  });

  it("ha id univoci", () => {
    const ids = [...tutti.map((e) => e.id), ...EXTRA.map((e) => e.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("rispetta kcal = P*4 + C*4 + G*9 su ogni elemento", () => {
    for (const e of tutti)
      expect(`${e.id}:${e.kcal}`).toBe(`${e.id}:${kcalDa(e.proteine, e.carboidrati, e.grassi)}`);
  });

  it("rispetta kcal = P*4 + C*4 + G*9 su ogni extra", () => {
    for (const e of EXTRA)
      expect(`${e.id}:${e.kcal}`).toBe(`${e.id}:${kcalDa(e.proteine, e.carboidrati, e.grassi)}`);
  });

  it("dichiara gli allergeni su ogni riga", () => {
    for (const e of [...tutti, ...EXTRA]) expect(Array.isArray(e.allergeni)).toBe(true);
  });

  it("assegna la categoria giusta", () => {
    for (const p of PRIMI) expect(p.categoria).toBe("primo");
    for (const s of SECONDI) expect(s.categoria).toBe("secondo");
  });

  // Il test che protegge la decomposizione. NON basta verificare che la somma
  // soddisfi kcal = P*4+C*4+G*9: e automaticamente vero se entrambe le parti gia
  // la soddisfano, quindi non proverebbe nulla. Va confrontata con i valori
  // esatti dei 27 piatti originali, che sono la tabella qui sotto.
  const ORIGINALI: Record<string, [number, number, number, number]> = {
    // nome abbinamento: [kcal, proteine, carboidrati, grassi]
    "pollo-basmati-broccoli": [588, 52, 68, 12],
    "salmone-quinoa-verdure": [636, 44, 52, 28],
    "ragu-manzo-patate-dolci": [607, 48, 61, 19],
    "tacchino-farro-zucchine": [555, 50, 64, 11],
    "merluzzo-patate-fagiolini": [469, 42, 55, 9],
    "pollo-venere-peperoni": [597, 54, 66, 13],
    "albumi-avocado-integrale": [518, 38, 42, 22],
    "orata-couscous-broccoletti": [522, 41, 58, 14],
    "tofu-integrale-verdure": [552, 30, 72, 16],
    "ceci-bulgur-melanzane": [551, 26, 78, 15],
    "straccetti-manzo-rucola": [608, 51, 65, 16],
    "tonno-patate-viola-asparagi": [537, 46, 50, 17],
    "pollo-curry-jasmine-piselli": [602, 49, 70, 14],
    "maiale-sedano-rapa-cavolo": [486, 47, 34, 18],
    "gamberi-basmati-zucchine": [502, 40, 63, 10],
    "uova-patate-spinaci": [509, 32, 48, 21],
    "vitello-polenta-funghi": [557, 45, 56, 17],
    "salmone-integrale-cavolo-nero": [646, 43, 60, 26],
    "pollo-pasta-integrale-pomodorini": [648, 53, 82, 12],
    "seitan-quinoa-broccoli": [476, 34, 58, 12],
    "sgombro-patate-dolci-cime": [580, 39, 52, 24],
    "tacchino-basmati-carote": [586, 52, 72, 10],
    "lenticchie-riso-verdure": [565, 28, 84, 13],
    "manzo-couscous-zucca": [607, 50, 68, 15],
    "tempeh-quinoa-edamame": [594, 52, 56, 18],
    "albumi-ricotta-patate-asparagi": [518, 50, 48, 14],
    "burger-lenticchie-tofu": [567, 44, 64, 15],
  };

  it("ricompone i 27 abbinamenti storici ai valori originali esatti", () => {
    expect(ABBINAMENTI.length).toBe(27);
    expect(Object.keys(ORIGINALI).length).toBe(27);
    for (const a of ABBINAMENTI) {
      const atteso = ORIGINALI[a.nome];
      expect(atteso, `abbinamento non previsto: ${a.nome}`).toBeDefined();
      const p = getElemento(a.primo);
      const s = getElemento(a.secondo);
      expect(p, `primo mancante per ${a.nome}`).toBeDefined();
      expect(s, `secondo mancante per ${a.nome}`).toBeDefined();
      if (!p || !s || !atteso) continue;
      expect(
        [p.kcal + s.kcal, p.proteine + s.proteine, p.carboidrati + s.carboidrati, p.grassi + s.grassi],
        `${a.nome} non torna ai valori del piatto originale`,
      ).toEqual(atteso);
    }
  });

  it("non ha macro negative", () => {
    for (const e of tutti)
      for (const k of ["proteine", "carboidrati", "grassi"] as const)
        expect(e[k], `${e.id}.${k}`).toBeGreaterThanOrEqual(0);
  });
});
