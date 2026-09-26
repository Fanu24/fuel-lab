import { describe, expect, it } from "vitest";
import { kpi, lunediDi, mixAllenamenti, produzione, topPiatti } from "./statistiche";
import type { Richiesta, StatoRichiesta } from "./tipi";
import type { Allenamenti, Piano } from "../settimana";
import { getPiatto } from "../catalogo";

let n = 0;
function richiesta(
  creataIl: string,
  o: { stato?: StatoRichiesta; pasti?: number; piano?: Piano; allenamenti?: Allenamenti } = {},
): Richiesta {
  n += 1;
  return {
    id: `t-${n}`,
    creataIl,
    aggiornataIl: creataIl,
    stato: o.stato ?? "nuova",
    servizio: "menu-settimana",
    formula: "singolo",
    contatto: { nome: "Prova", telefono: "333 000 0000" },
    piano: o.piano ?? {},
    allenamenti: o.allenamenti ?? {},
    nomiPiatti: {},
    pasti: o.pasti ?? 0,
    macro: { kcal: 0, proteine: 0, carboidrati: 0, grassi: 0 },
    origine: "demo",
  };
}

describe("lunediDi (settimana a Roma)", () => {
  it("domenica 23:30 e lunedi 00:30 ora di Roma stanno in settimane diverse", () => {
    // estate, UTC+2
    expect(lunediDi(new Date("2026-09-27T21:30:00Z"))).toBe("2026-09-21");
    expect(lunediDi(new Date("2026-09-27T22:30:00Z"))).toBe("2026-09-28");
    // la notte del cambio d'ora, UTC+1
    expect(lunediDi(new Date("2026-10-25T22:30:00Z"))).toBe("2026-10-19");
    expect(lunediDi(new Date("2026-10-25T23:30:00Z"))).toBe("2026-10-26");
  });

  it("attraversa il cambio di mese e di anno", () => {
    expect(lunediDi(new Date("2027-01-01T12:00:00Z"))).toBe("2026-12-28");
  });
});

describe("kpi", () => {
  const oggi = new Date("2026-09-26T10:00:00Z"); // sabato
  const lista = [
    richiesta("2026-09-27T21:30:00Z", { pasti: 10 }), // domenica 23:30 Roma: questa settimana
    richiesta("2026-09-27T22:30:00Z", { pasti: 7 }), // lunedi 00:30 Roma: la prossima
    richiesta("2026-09-20T21:59:00Z", { pasti: 3, stato: "chiusa" }), // domenica prima, 23:59
    richiesta("2026-09-21T08:00:00Z", { pasti: 4, stato: "contattata" }),
    richiesta("2026-09-10T08:00:00Z", { stato: "persa" }),
    richiesta("2026-09-11T08:00:00Z", { stato: "chiusa" }),
    richiesta("2026-09-12T08:00:00Z", { stato: "chiusa" }),
  ];

  it("conta richieste e pasti della settimana da lunedi a domenica, ora di Roma", () => {
    const k = kpi(lista, oggi);
    expect(k.richiesteSettimana).toBe(2);
    expect(k.pastiSettimana).toBe(14);
  });

  it("il lunedi a mezzanotte e mezza la settimana e gia la nuova", () => {
    const k = kpi(lista, new Date("2026-09-27T22:30:00Z"));
    expect(k.richiesteSettimana).toBe(1);
    expect(k.pastiSettimana).toBe(7);
  });

  it("da contattare sono le nuove, la conversione e chiuse su chiuse piu perse", () => {
    const k = kpi(lista, oggi);
    expect(k.daContattare).toBe(2);
    expect(k.conversione).toBeCloseTo(3 / 4, 10);
  });

  it("senza chiuse ne perse la conversione e zero, non NaN", () => {
    expect(kpi([richiesta("2026-09-21T08:00:00Z")], oggi).conversione).toBe(0);
    expect(kpi([], oggi)).toEqual({
      richiesteSettimana: 0,
      pastiSettimana: 0,
      daContattare: 0,
      conversione: 0,
    });
  });
});

const NOODLES = "noodles-sesamo-maiale"; // lunedi
const MAIALE = "maiale-senape-spinaci"; // giovedi
const BASMATI = "carb-basmati-integrale";

const piano: Piano = {
  lun: { pranzo: { piatto: NOODLES, extra: [BASMATI] }, cena: { piatto: MAIALE, extra: [] } },
  mar: { pranzo: { piatto: NOODLES, extra: [BASMATI] } },
};

describe("topPiatti", () => {
  it("ordina i piatti per porzioni richieste e taglia a n", () => {
    const lista = [richiesta("2026-09-21T08:00:00Z", { piano }), richiesta("2026-09-22T08:00:00Z", { piano })];
    expect(topPiatti(lista, 1)).toEqual([
      { piattoId: NOODLES, nome: "Noodles sesamo e maiale in agrodolce", porzioni: 4 },
    ]);
    expect(topPiatti(lista, 5).map((p) => p.piattoId)).toEqual([NOODLES, MAIALE]);
  });
});

describe("mixAllenamenti", () => {
  it("conta i giorni per tipo su tutte le richieste", () => {
    const lista = [
      richiesta("2026-09-21T08:00:00Z", { allenamenti: { lun: "cardio", mar: "pesi" } }),
      richiesta("2026-09-22T08:00:00Z", { allenamenti: { lun: "pesi", dom: "riposo" } }),
    ];
    expect(mixAllenamenti(lista)).toEqual({ cardio: 1, pesi: 2, riposo: 1 });
  });
});

describe("produzione", () => {
  it("porzioni per giorno di cottura, solo richieste aperte, con gli extra", () => {
    const lista = [
      richiesta("2026-09-21T08:00:00Z", { piano, stato: "nuova" }),
      richiesta("2026-09-22T08:00:00Z", { piano, stato: "contattata" }),
      richiesta("2026-09-23T08:00:00Z", { piano, stato: "chiusa" }),
      richiesta("2026-09-23T08:00:00Z", { piano, stato: "persa" }),
    ];
    const p = produzione(lista);
    expect(p.lunedi).toEqual([
      { piattoId: NOODLES, nome: "Noodles sesamo e maiale in agrodolce", porzioni: 4 },
    ]);
    expect(p.giovedi).toEqual([{ piattoId: MAIALE, nome: getPiatto(MAIALE)?.nome, porzioni: 2 }]);
    expect(p.extra).toEqual([{ extraId: BASMATI, nome: "Basmati / integrale", porzioni: 4 }]);
  });
});
