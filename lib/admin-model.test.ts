import { describe, expect, it } from "vitest";
import { PIATTI } from "@/lib/catalogo";
import { vociDalPiano } from "@/lib/server/ordini";
import { pianoDaQuantita } from "@/components/admin/admin-model";

describe("Ordine rapido di Matteo", () => {
  it("mantiene ogni porzione partendo dal ritiro, anche quando passa la domenica", () => {
    const piano = pianoDaQuantita([{ id: PIATTI[0].id, quantita: 5 }, { id: PIATTI[1].id, quantita: 9 }], "2026-10-18");
    const voci = vociDalPiano(piano);
    expect(voci).toHaveLength(14);
    expect(voci.filter((v) => v.id === PIATTI[0].id)).toHaveLength(5);
    expect(piano.dom?.pranzo?.piatto).toBe(PIATTI[0].id);
    expect(piano.lun?.pranzo?.piatto).toBe(PIATTI[0].id);
  });
  it("blocca oltre 14 pasti prima che una casella possa sovrascriverne un'altra", () => {
    expect(() => pianoDaQuantita([{ id: PIATTI[0].id, quantita: 15 }], "2026-10-14")).toThrow();
  });
  it("rifiuta quantità frazionarie, negative e piatti sconosciuti", () => {
    for (const riga of [{ id: PIATTI[0].id, quantita: 1.5 }, { id: PIATTI[0].id, quantita: -1 }, { id: "non-esiste", quantita: 1 }]) {
      expect(() => pianoDaQuantita([riga], "2026-10-14")).toThrow();
    }
  });
});
