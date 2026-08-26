import { describe, expect, it } from "vitest";
import { macroCasella } from "./piano";
import { PRIMI, SECONDI, EXTRA } from "./catalogo";

describe("macroCasella", () => {
  it("una casella vuota vale zero", () => {
    expect(macroCasella(undefined)).toEqual({ kcal: 0, proteine: 0, carboidrati: 0, grassi: 0 });
    expect(macroCasella({ extra: [] })).toEqual({ kcal: 0, proteine: 0, carboidrati: 0, grassi: 0 });
  });

  it("somma primo e secondo", () => {
    const p = PRIMI[0], s = SECONDI[0];
    const m = macroCasella({ primo: p.id, secondo: s.id, extra: [] });
    expect(m.kcal).toBe(p.kcal + s.kcal);
    expect(m.proteine).toBe(p.proteine + s.proteine);
  });

  it("somma anche gli extra", () => {
    const p = PRIMI[0], x = EXTRA[0];
    const m = macroCasella({ primo: p.id, extra: [x.id] });
    expect(m.kcal).toBe(p.kcal + x.kcal);
    expect(m.grassi).toBe(p.grassi + x.grassi);
  });

  it("ignora gli id sconosciuti invece di esplodere", () => {
    const m = macroCasella({ primo: "non-esiste", secondo: SECONDI[0].id, extra: ["nemmeno"] });
    expect(m.kcal).toBe(SECONDI[0].kcal);
  });

  it("accetta una casella con il solo secondo", () => {
    const s = SECONDI[0];
    expect(macroCasella({ secondo: s.id, extra: [] }).kcal).toBe(s.kcal);
  });
});
