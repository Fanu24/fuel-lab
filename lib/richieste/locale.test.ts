import { describe, expect, it } from "vitest";
import { creaRepoLocale } from "./locale";
import { richiesteDemo } from "./seed";
import { STATI, type NuovaRichiesta } from "./tipi";
import { getPiatto } from "../catalogo";
import { GIORNI, PASTI } from "../settimana";

const CHIAVE = "fuellab.richieste.v1";
const SEMINATO = "fuellab.richieste.seminato";
const OGGI = new Date("2026-09-26T10:00:00Z");

function finto(iniziale: Record<string, string> = {}) {
  const dati = new Map(Object.entries(iniziale));
  return {
    dati,
    getItem: (k: string) => dati.get(k) ?? null,
    setItem: (k: string, v: string) => void dati.set(k, v),
  };
}

const nuova: NuovaRichiesta = {
  servizio: "menu-settimana",
  formula: "singolo",
  contatto: { nome: "Prova", telefono: "333 000 0000" },
  piano: { lun: { pranzo: { piatto: "noodles-sesamo-maiale", extra: [] } } },
  allenamenti: { lun: "cardio" },
  nomiPiatti: { "noodles-sesamo-maiale": "Noodles" },
  pasti: 1,
  macro: { kcal: 1, proteine: 1, carboidrati: 1, grassi: 1 },
  origine: "sito",
};

describe("creaRepoLocale", () => {
  it("al primo accesso semina le richieste demo, dalla piu recente", async () => {
    const s = finto();
    const lista = await creaRepoLocale(s, () => OGGI).elenca();
    expect(lista.length).toBeGreaterThanOrEqual(10);
    expect(s.dati.get(SEMINATO)).toBeTruthy();
    const date = lista.map((r) => r.creataIl);
    expect(date).toEqual([...date].sort().reverse());
  });

  it("non risemina se la lista e stata gia creata, anche se vuota", async () => {
    const s = finto({ [SEMINATO]: "1", [CHIAVE]: "[]" });
    expect(await creaRepoLocale(s, () => OGGI).elenca()).toEqual([]);
  });

  it("un JSON rotto vale lista vuota, senza lanciare", async () => {
    const s = finto({ [SEMINATO]: "1", [CHIAVE]: "{rotto" });
    expect(await creaRepoLocale(s, () => OGGI).elenca()).toEqual([]);
  });

  it("scarta le voci senza forma di richiesta", async () => {
    const buona = richiesteDemo(OGGI)[0];
    const s = finto({
      [SEMINATO]: "1",
      [CHIAVE]: JSON.stringify([buona, { id: 3 }, null, { ...buona, id: "x", stato: "boh" }]),
    });
    expect((await creaRepoLocale(s, () => OGGI).elenca()).map((r) => r.id)).toEqual([buona.id]);
  });

  it("crea con id, date e stato nuova, e la rilegge", async () => {
    const s = finto({ [SEMINATO]: "1" });
    const repo = creaRepoLocale(s, () => OGGI);
    const r = await repo.crea(nuova);
    expect(r.id).toBeTruthy();
    expect(r.stato).toBe("nuova");
    expect(r.creataIl).toBe(OGGI.toISOString());
    expect(await repo.leggi(r.id)).toEqual(r);
    expect(JSON.parse(s.dati.get(CHIAVE) ?? "[]")).toHaveLength(1);
  });

  it("due richieste create insieme hanno id diversi", async () => {
    const repo = creaRepoLocale(finto({ [SEMINATO]: "1" }), () => OGGI);
    const [a, b] = await Promise.all([repo.crea(nuova), repo.crea(nuova)]);
    expect(a.id).not.toBe(b.id);
  });

  it("filtra per stato", async () => {
    const repo = creaRepoLocale(finto(), () => OGGI);
    const nuove = await repo.elenca({ stato: "nuova" });
    expect(nuove.length).toBeGreaterThan(0);
    expect(nuove.every((r) => r.stato === "nuova")).toBe(true);
  });

  it("cambia stato e note aggiornando la data di modifica", async () => {
    let adesso = OGGI;
    const repo = creaRepoLocale(finto({ [SEMINATO]: "1" }), () => adesso);
    const r = await repo.crea(nuova);
    adesso = new Date("2026-09-27T09:00:00Z");
    const dopo = await repo.aggiornaStato(r.id, "contattata");
    expect(dopo.stato).toBe("contattata");
    expect(dopo.aggiornataIl).toBe(adesso.toISOString());
    expect(dopo.creataIl).toBe(r.creataIl);
    expect((await repo.annota(r.id, "richiamare lunedi")).noteInterne).toBe("richiamare lunedi");
    expect((await repo.leggi(r.id))?.stato).toBe("contattata");
  });

  it("un id sconosciuto: leggi da null, le modifiche rifiutano con un errore chiaro", async () => {
    const repo = creaRepoLocale(finto({ [SEMINATO]: "1" }), () => OGGI);
    expect(await repo.leggi("non-esiste")).toBeNull();
    await expect(repo.aggiornaStato("non-esiste", "chiusa")).rejects.toThrow(/non-esiste/);
    await expect(repo.annota("non-esiste", "x")).rejects.toThrow(/non-esiste/);
  });
});

describe("richiesteDemo", () => {
  const demo = richiesteDemo(OGGI);

  it("una dozzina di richieste demo in tutti e quattro gli stati", () => {
    expect(demo.length).toBeGreaterThanOrEqual(10);
    expect(demo.every((r) => r.origine === "demo")).toBe(true);
    for (const s of STATI) expect(demo.some((r) => r.stato === s.id)).toBe(true);
    expect(new Set(demo.map((r) => r.id)).size).toBe(demo.length);
  });

  it("negli ultimi 21 giorni rispetto a oggi", () => {
    for (const r of demo) {
      const t = new Date(r.creataIl).getTime();
      expect(t).toBeLessThanOrEqual(OGGI.getTime());
      expect(t).toBeGreaterThan(OGGI.getTime() - 21 * 86_400_000);
    }
  });

  it("piatti veri e conti coerenti", () => {
    for (const r of demo) {
      let pasti = 0;
      for (const g of GIORNI) {
        for (const m of PASTI) {
          const c = r.piano[g]?.[m];
          if (!c) continue;
          pasti += 1;
          if (c.piatto) {
            expect(getPiatto(c.piatto)).toBeDefined();
            expect(r.nomiPiatti[c.piatto]).toBe(getPiatto(c.piatto)?.nome);
          }
        }
      }
      expect(r.pasti).toBe(pasti);
    }
  });

  it("numeri di telefono palesemente finti", () => {
    for (const r of demo) expect(r.contatto.telefono.replace(/\s/g, "")).toMatch(/^33300000\d\d$/);
  });
});
