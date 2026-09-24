import { describe, expect, it } from "vitest";
import { leggiCasella, macroCasella, potaPiano } from "./piano";
import { PIATTI, EXTRA } from "./catalogo";

describe("macroCasella", () => {
  it("una casella vuota vale zero", () => {
    expect(macroCasella(undefined)).toEqual({ kcal: 0, proteine: 0, carboidrati: 0, grassi: 0 });
    expect(macroCasella({ extra: [] })).toEqual({ kcal: 0, proteine: 0, carboidrati: 0, grassi: 0 });
  });

  it("somma piatto ed extra", () => {
    const p = PIATTI[0], x = EXTRA[0];
    const m = macroCasella({ piatto: p.id, extra: [x.id] });
    expect(m.kcal).toBe(p.kcal + x.kcal);
    expect(m.proteine).toBe(p.proteine + x.proteine);
  });

  it("ignora gli id sconosciuti invece di esplodere", () => {
    const m = macroCasella({ piatto: "non-esiste", extra: ["nemmeno"] });
    expect(m.kcal).toBe(0);
  });

  it("accetta una casella con il solo piatto", () => {
    const p = PIATTI[0];
    expect(macroCasella({ piatto: p.id, extra: [] }).kcal).toBe(p.kcal);
  });
});

describe("leggiCasella", () => {
  it("scarta gli id che il catalogo non conosce piu", () => {
    expect(leggiCasella({ piatto: "piatto-sparito", extra: [EXTRA[0].id] })).toEqual({
      extra: [EXTRA[0].id],
    });
  });

  it("tiene solo gli extra che sono stringhe note", () => {
    const c = leggiCasella({ piatto: PIATTI[0].id, extra: [EXTRA[0].id, 42, null, "ignoto"] });
    expect(c?.extra).toEqual([EXTRA[0].id]);
  });

  it("torna undefined su cio che non e un oggetto", () => {
    for (const v of [undefined, null, "stringa", 7, []]) {
      expect(leggiCasella(v)).toBeUndefined();
    }
  });

  it("torna undefined quando la potatura svuota la casella", () => {
    expect(leggiCasella({ piatto: "sparito", extra: ["sparito"] })).toBeUndefined();
  });

  it("normalizza extra assente ad array vuoto", () => {
    expect(leggiCasella({ piatto: PIATTI[0].id })).toEqual({ piatto: PIATTI[0].id, extra: [] });
  });

  it("ignora i campi primo/secondo del piano vecchio", () => {
    expect(leggiCasella({ primo: PIATTI[0].id, secondo: PIATTI[1].id })).toBeUndefined();
  });
});

describe("potaPiano", () => {
  it("tiene solo giorni e pasti riconosciuti", () => {
    const p = potaPiano({
      lun: { pranzo: { piatto: PIATTI[0].id, extra: [] }, merenda: { piatto: PIATTI[1].id } },
      lunedi: { pranzo: { piatto: PIATTI[1].id } },
      mar: "non un oggetto",
    });
    expect(p).toEqual({ lun: { pranzo: { piatto: PIATTI[0].id, extra: [] } } });
  });

  it("non lascia giorni con sole caselle morte", () => {
    expect(potaPiano({ gio: { cena: { piatto: "sparito", extra: [] } } })).toEqual({});
  });

  it("torna un piano vuoto su cio che non e un oggetto", () => {
    for (const v of [undefined, null, "stringa", 7]) {
      expect(potaPiano(v)).toEqual({});
    }
  });
});
