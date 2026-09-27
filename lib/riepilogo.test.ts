import { describe, expect, it } from "vitest";
import { riepilogoSettimana } from "./riepilogo";
import { EXTRA, PIATTI } from "./catalogo";
import { TAGLIE } from "./pricing";
import type { Piano } from "./settimana";

const conPrezzo = EXTRA.find((e) => e.prezzoEuro != null)!;
const suRichiesta = EXTRA.find((e) => e.prezzoEuro == null)!;
const P0 = PIATTI[0];
const P1 = PIATTI[1];

describe("riepilogoSettimana", () => {
  it("settimana vuota: zeri, niente preventivo, prezzo minimo sempre", () => {
    const r = riepilogoSettimana({});
    expect(r.pasti).toBe(0);
    expect(r.giorniPieni).toBe(0);
    expect(r.macroMediaGiorno).toEqual({ kcal: 0, proteine: 0, carboidrati: 0, grassi: 0 });
    expect(r.preventivo).toBeNull();
    expect(r.prezzoMinimo).toBe(8.9);
    expect(r.prezzoMinimo).toBe(TAGLIE[TAGLIE.length - 1].prezzoPasto);
  });

  it("somma la settimana e fa la media sui soli giorni con un pasto", () => {
    const p: Piano = {
      lun: { pranzo: { piatto: P0.id, extra: [] }, cena: { piatto: P1.id, extra: [] } },
      gio: { pranzo: { piatto: P0.id, extra: [] } },
    };
    const r = riepilogoSettimana(p);
    expect(r.pasti).toBe(3);
    expect(r.giorniPieni).toBe(2);
    expect(r.macroSettimana.kcal).toBe(P0.kcal * 2 + P1.kcal);
    expect(r.macroMediaGiorno.kcal).toBeCloseTo((P0.kcal * 2 + P1.kcal) / 2, 10);
    expect(r.preventivo?.pasti).toBe(3);
  });

  it("dice quanti pasti mancano alla prossima taglia", () => {
    const p: Piano = {};
    for (const g of ["lun", "mar", "mer", "gio"] as const) {
      p[g] = { pranzo: { piatto: P0.id, extra: [] }, cena: { piatto: P1.id, extra: [] } };
    }
    const r = riepilogoSettimana(p);
    expect(r.pasti).toBe(8);
    expect(r.prossimaTaglia).toEqual({ mancano: 2, prezzoPasto: TAGLIE[1].prezzoPasto });
  });

  it("la prossima taglia e quella che abbassa davvero il prezzo, non la prima soglia", () => {
    // sotto i 6 pasti si paga gia' il prezzo della taglia da 6: arrivarci non cambia nulla
    const r = riepilogoSettimana({ lun: { pranzo: { piatto: P0.id, extra: [] } } });
    expect(r.prossimaTaglia).toEqual({ mancano: 9, prezzoPasto: TAGLIE[1].prezzoPasto });
  });

  it("separa i supplementi con prezzo dagli extra su richiesta", () => {
    const p: Piano = {
      lun: { pranzo: { piatto: P0.id, extra: [conPrezzo.id, suRichiesta.id] } },
      mar: { cena: { piatto: P1.id, extra: [conPrezzo.id] } },
    };
    const r = riepilogoSettimana(p);
    expect(r.supplementiExtra).toBeCloseTo((conPrezzo.prezzoEuro ?? 0) * 2, 10);
    expect(r.extraSuRichiesta).toBe(1);
  });
});
