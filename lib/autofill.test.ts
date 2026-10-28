import { describe, expect, it } from "vitest";
import { candidatiPer, riempiSettimana, sostituisciEsclusi } from "./autofill";
import { getPiatto, EXTRA, PIATTI } from "./catalogo";
import { GIORNI, PASTI, macroCasella, type Allenamenti, type Piano, type TipoGiornata } from "./settimana";

function tutta(t: TipoGiornata): Allenamenti {
  return Object.fromEntries(GIORNI.map((g) => [g, t])) as Allenamenti;
}

function piatti(p: Piano): string[] {
  return GIORNI.flatMap((g) => PASTI.map((m) => p[g]?.[m]?.piatto)).filter(
    (x): x is string => !!x,
  );
}

function carbo(p: Piano): number {
  return GIORNI.flatMap((g) => PASTI.map((m) => macroCasella(p[g]?.[m]))).reduce(
    (a, m) => a + m.carboidrati,
    0,
  );
}

function conteggi(p: Piano): Map<string, number> {
  const c = new Map<string, number>();
  for (const id of piatti(p)) c.set(id, (c.get(id) ?? 0) + 1);
  return c;
}

describe("candidatiPer", () => {
  it("cardio: prima i piatti da cardio per quota di carboidrati, poi gli ibridi", () => {
    const candidati = candidatiPer("cardio");
    const specifici = candidati.filter((p) => p.allenamento === "cardio");
    expect(specifici).toHaveLength(2);
    expect(candidati.slice(0, specifici.length)).toEqual(specifici);
    expect(candidati.at(-1)?.allenamento).toBe("entrambi");
    const quote = specifici.map((p) => p.carboidrati * 4 / p.kcal);
    expect(quote[0]).toBeGreaterThanOrEqual(quote[1]);
  });

  it("pesi: prima i piatti da pesi per rapporto proteine/carboidrati, poi gli ibridi", () => {
    expect(candidatiPer("pesi").map((p) => p.id)).toEqual([
      "maiale-senape-spinaci",
      "uova-purgatorio-peperoni",
      "pallotte-cacio-ovo",
      "riso-julien-pollo-teriyaki",
    ]);
  });

  it("riposo: i piatti da pesi e gli ibridi, dal piu leggero", () => {
    const kcal = candidatiPer("riposo").map((p) => p.kcal);
    expect(kcal).toEqual([...kcal].sort((a, b) => a - b));
    expect(candidatiPer("riposo").every((p) => p.allenamento !== "cardio")).toBe(true);
    expect(candidatiPer("riposo")).toHaveLength(4);
  });
});

describe("riempiSettimana", () => {
  const due = { pastiAlGiorno: 2, sovrascrivi: false } as const;
  const uno = { pastiAlGiorno: 1, sovrascrivi: false } as const;

  it("una settimana di cardio porta piu carboidrati di una di pesi", () => {
    expect(carbo(riempiSettimana({}, tutta("cardio"), due))).toBeGreaterThan(
      carbo(riempiSettimana({}, tutta("pesi"), due)),
    );
    expect(carbo(riempiSettimana({}, tutta("cardio"), uno))).toBeGreaterThan(
      carbo(riempiSettimana({}, tutta("pesi"), uno)),
    );
  });

  it("riempie solo i giorni che hanno un allenamento", () => {
    const p = riempiSettimana({}, { lun: "cardio", gio: "pesi" }, due);
    expect(Object.keys(p).sort()).toEqual(["gio", "lun"]);
    expect(p.lun?.pranzo?.piatto && p.lun?.cena?.piatto).toBeTruthy();
  });

  it("con un pasto al giorno riempie solo il pranzo", () => {
    const p = riempiSettimana({}, tutta("pesi"), uno);
    for (const g of GIORNI) {
      expect(p[g]?.pranzo?.piatto).toBeTruthy();
      expect(p[g]?.cena).toBeUndefined();
    }
  });

  it("mai lo stesso piatto due volte nello stesso giorno", () => {
    for (const t of ["cardio", "pesi", "riposo"] as const) {
      const p = riempiSettimana({}, tutta(t), due);
      for (const g of GIORNI) expect(p[g]?.pranzo?.piatto).not.toBe(p[g]?.cena?.piatto);
    }
  });

  it("al massimo tre volte lo stesso piatto, contando quelli gia presenti", () => {
    const gia: Piano = {
      lun: { pranzo: { piatto: "noodles-sesamo-maiale", extra: [] } },
      mar: { pranzo: { piatto: "noodles-sesamo-maiale", extra: [] } },
    };
    for (const t of ["cardio", "pesi", "riposo"] as const) {
      const p = riempiSettimana(gia, tutta(t), due);
      for (const n of conteggi(p).values()) expect(n).toBeLessThanOrEqual(3);
      expect(conteggi(riempiSettimana({}, tutta(t), due)).size).toBeGreaterThan(1);
    }
    expect(conteggi(riempiSettimana(gia, tutta("cardio"), due)).get("noodles-sesamo-maiale")).toBe(3);
  });

  it("riempie tutte e quattordici le caselle anche con un tipo solo", () => {
    for (const t of ["cardio", "pesi", "riposo"] as const) {
      expect(piatti(riempiSettimana({}, tutta(t), due))).toHaveLength(14);
    }
  });

  it("evita lo stesso piatto allo stesso pasto in giorni consecutivi", () => {
    for (const t of ["cardio", "pesi", "riposo"] as const) {
      for (const o of [uno, due]) {
        const p = riempiSettimana({}, tutta(t), o);
        for (let i = 1; i < GIORNI.length; i += 1) {
          for (const m of PASTI) {
            const ieri = p[GIORNI[i - 1]]?.[m]?.piatto;
            if (ieri) expect(p[GIORNI[i]]?.[m]?.piatto).not.toBe(ieri);
          }
        }
      }
    }
  });

  it("tiene le caselle gia piene, salvo sovrascrivi che cambia il piatto e tiene le aggiunte", () => {
    const gia: Piano = { mer: { cena: { piatto: "uova-purgatorio-peperoni", extra: [EXTRA[0].id] } } };
    const tenuto = riempiSettimana(gia, tutta("cardio"), due);
    expect(tenuto.mer?.cena).toEqual(gia.mer?.cena);

    const rifatto = riempiSettimana(gia, tutta("cardio"), { ...due, sovrascrivi: true });
    expect(rifatto.mer?.cena?.extra).toEqual([EXTRA[0].id]);
    expect(getPiatto(rifatto.mer?.cena?.piatto ?? "")).toBeDefined();
    expect(piatti(rifatto)).toHaveLength(14);
  });

  it("non tocca i giorni senza allenamento nemmeno con sovrascrivi", () => {
    const gia: Piano = { dom: { pranzo: { piatto: "uova-purgatorio-peperoni", extra: [] } } };
    const p = riempiSettimana(gia, { lun: "cardio" }, { ...due, sovrascrivi: true });
    expect(p.dom).toEqual(gia.dom);
  });

  it("e deterministico e non muta l'ingresso", () => {
    const gia: Piano = { lun: { pranzo: { piatto: "uova-purgatorio-peperoni", extra: [] } } };
    const copia = structuredClone(gia);
    const a = riempiSettimana(gia, { lun: "cardio", mar: "pesi", mer: "riposo" }, due);
    const b = riempiSettimana(gia, { lun: "cardio", mar: "pesi", mer: "riposo" }, due);
    expect(a).toEqual(b);
    expect(gia).toEqual(copia);
  });

  it("rimescola da altre proposte, sempre dentro le regole", () => {
    const base = riempiSettimana({}, tutta("pesi"), due);
    const altra = riempiSettimana({}, tutta("pesi"), { ...due, rimescola: 1 });
    expect(altra).not.toEqual(base);
    expect(riempiSettimana({}, tutta("pesi"), { ...due, rimescola: 1 })).toEqual(altra);
    for (const n of conteggi(altra).values()) expect(n).toBeLessThanOrEqual(3);
    expect(riempiSettimana({}, tutta("cardio"), { ...uno, rimescola: 2 })).not.toEqual(
      riempiSettimana({}, tutta("cardio"), uno),
    );
  });
});

describe("piatti non disponibili", () => {
  const due = { pastiAlGiorno: 2, sovrascrivi: false } as const;
  const tutti = ["cardio", "pesi", "riposo"] as const;

  it("riempiSettimana non usa mai un piatto escluso", () => {
    for (const escluso of PIATTI.map((p) => p.id)) {
      for (const t of tutti) {
        for (const rimescola of [0, 1, 2]) {
          const p = riempiSettimana({}, tutta(t), { ...due, esclusi: [escluso], rimescola });
          expect(piatti(p)).not.toContain(escluso);
          expect(piatti(p)).toHaveLength(14);
        }
      }
    }
  });

  it("con due piatti esclusi riempie lo stesso tutte le caselle, nelle regole", () => {
    const esclusi = ["noodles-sesamo-maiale", "maiale-senape-spinaci"];
    for (const t of tutti) {
      const p = riempiSettimana({}, tutta(t), { ...due, esclusi });
      expect(piatti(p)).toHaveLength(14);
      expect(piatti(p).some((id) => esclusi.includes(id))).toBe(false);
      for (const g of GIORNI) expect(p[g]?.pranzo?.piatto).not.toBe(p[g]?.cena?.piatto);
    }
  });

  it("senza esclusi la proposta resta quella di sempre", () => {
    for (const t of tutti) {
      expect(riempiSettimana({}, tutta(t), { ...due, esclusi: [] })).toEqual(riempiSettimana({}, tutta(t), due));
    }
  });

  it("una casella con un piatto escluso si rifa' anche senza sovrascrivi, e tiene le aggiunte", () => {
    const gia: Piano = {
      lun: { pranzo: { piatto: "noodles-sesamo-maiale", extra: [EXTRA[0].id] } },
      mar: { pranzo: { piatto: "pallotte-cacio-ovo", extra: [] } },
      dom: { cena: { piatto: "noodles-sesamo-maiale", extra: [] } },
    };
    const p = riempiSettimana(gia, { lun: "cardio", mar: "pesi" }, { ...due, esclusi: ["noodles-sesamo-maiale"] });
    expect(p.lun?.pranzo?.piatto).not.toBe("noodles-sesamo-maiale");
    expect(p.lun?.pranzo?.extra).toEqual([EXTRA[0].id]);
    expect(p.mar?.pranzo).toEqual(gia.mar?.pranzo); // piena e disponibile: resta
    expect(p.dom).toEqual(gia.dom); // giorno senza allenamento: non si tocca
  });

  it("se nessun piatto e' disponibile la casella perde il piatto escluso", () => {
    const tuttiEsclusi = PIATTI.map((p) => p.id);
    const gia: Piano = { lun: { pranzo: { piatto: "noodles-sesamo-maiale", extra: [EXTRA[0].id] }, cena: { piatto: "pallotte-cacio-ovo", extra: [] } } };
    const p = riempiSettimana(gia, { lun: "cardio" }, { ...due, esclusi: tuttiEsclusi });
    expect(p.lun?.pranzo).toEqual({ extra: [EXTRA[0].id] });
    expect(p.lun?.cena).toBeUndefined();
    expect(piatti(riempiSettimana({}, tutta("pesi"), { ...due, esclusi: tuttiEsclusi }))).toEqual([]);
  });

  it("sostituisciEsclusi cambia solo le caselle con un piatto escluso", () => {
    const gia: Piano = {
      lun: { pranzo: { piatto: "noodles-sesamo-maiale", extra: [EXTRA[1].id] }, cena: { piatto: "pallotte-cacio-ovo", extra: [] } },
      sab: { cena: { piatto: "noodles-sesamo-maiale", extra: [] } },
      dom: { pranzo: { piatto: "uova-purgatorio-peperoni", extra: [] } },
    };
    const copia = structuredClone(gia);
    const p = sostituisciEsclusi(gia, { lun: "pesi" }, ["noodles-sesamo-maiale"]);
    expect(gia).toEqual(copia);
    expect(piatti(p)).toHaveLength(4);
    expect(piatti(p)).not.toContain("noodles-sesamo-maiale");
    expect(p.lun?.pranzo?.extra).toEqual([EXTRA[1].id]);
    expect(p.lun?.pranzo?.piatto).not.toBe("pallotte-cacio-ovo"); // mai due volte lo stesso giorno
    expect(p.lun?.cena).toEqual(gia.lun?.cena);
    expect(p.dom).toEqual(gia.dom);
    // Sabato non ha un allenamento: si cerca un piatto dello stesso genere (cardio).
    expect(getPiatto(p.sab?.cena?.piatto ?? "")?.allenamento).not.toBe("pesi");
    expect(sostituisciEsclusi(gia, {}, [])).toBe(gia);
  });
});
