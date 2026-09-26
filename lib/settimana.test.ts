import { describe, expect, it } from "vitest";
import { conCasella, potaAllenamenti, spostaCasella, type Piano } from "./settimana";
import { PIATTI, EXTRA } from "./catalogo";

const A = PIATTI[0].id;
const B = PIATTI[1].id;
const X = EXTRA[0].id;

describe("potaAllenamenti", () => {
  it("tiene solo giorni noti con un tipo noto", () => {
    expect(
      potaAllenamenti({ lun: "cardio", mar: "pesi", mer: "riposo", gio: "yoga", lunedi: "pesi", ven: 3 }),
    ).toEqual({ lun: "cardio", mar: "pesi", mer: "riposo" });
  });

  it("torna vuoto su cio che non e un oggetto", () => {
    for (const v of [undefined, null, "cardio", 7, []]) expect(potaAllenamenti(v)).toEqual({});
  });
});

describe("conCasella", () => {
  it("toglie il giorno quando resta senza pasti", () => {
    const p: Piano = { lun: { pranzo: { piatto: A, extra: [] } } };
    expect(conCasella(p, "lun", "pranzo", undefined)).toEqual({});
  });

  it("non muta il piano di partenza", () => {
    const p: Piano = { lun: { pranzo: { piatto: A, extra: [] } } };
    const copia = structuredClone(p);
    conCasella(p, "lun", "cena", { piatto: B, extra: [] });
    expect(p).toEqual(copia);
  });
});

describe("spostaCasella", () => {
  it("sposta piatto ed extra in una casella vuota", () => {
    const p: Piano = { lun: { pranzo: { piatto: A, extra: [X] } } };
    expect(spostaCasella(p, { g: "lun", m: "pranzo" }, { g: "mer", m: "cena" })).toEqual({
      mer: { cena: { piatto: A, extra: [X] } },
    });
  });

  it("scambia quando la destinazione e piena", () => {
    const p: Piano = {
      lun: { pranzo: { piatto: A, extra: [X] } },
      mar: { cena: { piatto: B, extra: [] } },
    };
    expect(spostaCasella(p, { g: "lun", m: "pranzo" }, { g: "mar", m: "cena" })).toEqual({
      lun: { pranzo: { piatto: B, extra: [] } },
      mar: { cena: { piatto: A, extra: [X] } },
    });
  });

  it("stessa casella: torna lo stesso riferimento", () => {
    const p: Piano = { lun: { pranzo: { piatto: A, extra: [] } } };
    expect(spostaCasella(p, { g: "lun", m: "pranzo" }, { g: "lun", m: "pranzo" })).toBe(p);
  });

  it("sorgente vuota: torna lo stesso riferimento", () => {
    const p: Piano = { lun: { pranzo: { piatto: A, extra: [] } } };
    expect(spostaCasella(p, { g: "gio", m: "cena" }, { g: "lun", m: "pranzo" })).toBe(p);
  });

  it("non muta il piano di partenza", () => {
    const p: Piano = {
      lun: { pranzo: { piatto: A, extra: [X] } },
      mar: { cena: { piatto: B, extra: [] } },
    };
    const copia = structuredClone(p);
    spostaCasella(p, { g: "lun", m: "pranzo" }, { g: "mar", m: "cena" });
    expect(p).toEqual(copia);
  });

  it("lo scambio dentro lo stesso giorno tiene entrambi i pasti", () => {
    const p: Piano = { ven: { pranzo: { piatto: A, extra: [] }, cena: { piatto: B, extra: [X] } } };
    expect(spostaCasella(p, { g: "ven", m: "cena" }, { g: "ven", m: "pranzo" })).toEqual({
      ven: { pranzo: { piatto: B, extra: [X] }, cena: { piatto: A, extra: [] } },
    });
  });
});
