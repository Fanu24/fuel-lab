import { describe, expect, it } from "vitest";
import { leggiCasella, macroCasella, potaPiano } from "./piano";
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

describe("leggiCasella", () => {
  it("scarta gli id che il catalogo non conosce piu", () => {
    expect(leggiCasella({ primo: "primo-sparito", secondo: SECONDI[0].id })).toEqual({
      secondo: SECONDI[0].id,
      extra: [],
    });
  });

  it("scarta un id di secondo messo nel campo primo", () => {
    // Lo slot sbagliato non e' un dettaglio: sommato lo stesso, falserebbe le proteine.
    expect(leggiCasella({ primo: SECONDI[0].id })).toBeUndefined();
    expect(leggiCasella({ secondo: PRIMI[0].id })).toBeUndefined();
  });

  it("tiene solo gli extra che sono stringhe note", () => {
    const c = leggiCasella({ primo: PRIMI[0].id, extra: [EXTRA[0].id, 42, null, "ignoto"] });
    expect(c?.extra).toEqual([EXTRA[0].id]);
  });

  it("torna undefined su cio che non e un oggetto", () => {
    for (const v of [undefined, null, "stringa", 7, []]) {
      expect(leggiCasella(v)).toBeUndefined();
    }
  });

  it("torna undefined quando la potatura svuota la casella", () => {
    expect(leggiCasella({ primo: "sparito", secondo: "sparito", extra: ["sparito"] })).toBeUndefined();
  });

  it("normalizza extra assente ad array vuoto", () => {
    expect(leggiCasella({ primo: PRIMI[0].id })).toEqual({ primo: PRIMI[0].id, extra: [] });
  });
});

describe("potaPiano", () => {
  it("tiene solo giorni e pasti riconosciuti", () => {
    const p = potaPiano({
      lun: { pranzo: { primo: PRIMI[0].id, extra: [] }, merenda: { primo: PRIMI[1].id } },
      lunedi: { pranzo: { primo: PRIMI[1].id } },
      mar: "non un oggetto",
    });
    expect(p).toEqual({ lun: { pranzo: { primo: PRIMI[0].id, extra: [] } } });
  });

  it("non lascia giorni con sole caselle morte", () => {
    expect(potaPiano({ gio: { cena: { primo: "sparito", extra: [] } } })).toEqual({});
  });

  it("torna un piano vuoto su cio che non e un oggetto", () => {
    for (const v of [undefined, null, "stringa", 7]) {
      expect(potaPiano(v)).toEqual({});
    }
  });
});
