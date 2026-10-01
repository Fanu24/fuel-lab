import { describe, expect, it } from "vitest";
import {
  avvisoVisibile,
  caselleEscluse,
  chiusuraDi,
  chiusureVicine,
  durata,
  erroreDataChiusa,
  fraseChiusura,
  GIORNI_CHIUSURA_LUNGA,
  linkInterno,
  ordiniApertiConPiatto,
  periodo,
  potaImpostazioni,
  settimanaProssima,
  sovrapposizioni,
} from "./impostazioni";
import { impostazioniVuote, type Chiusura, type Ordine } from "./api";

const OGGI = "2026-09-27"; // domenica

describe("periodo", () => {
  it("un giorno solo, lo stesso mese, due mesi", () => {
    expect(periodo("2026-10-05", "2026-10-05", OGGI)).toBe("il 5 ottobre");
    expect(periodo("2026-10-05", "2026-10-09", OGGI)).toBe("dal 5 al 9 ottobre");
    expect(periodo("2026-09-28", "2026-10-04", OGGI)).toBe("dal 28 settembre al 4 ottobre");
  });

  it("gli articoli davanti a 1, 8 e 11", () => {
    expect(periodo("2026-10-01", "2026-10-08", OGGI)).toBe("dal 1° all’8 ottobre");
    expect(periodo("2026-10-08", "2026-10-11", OGGI)).toBe("dall’8 all’11 ottobre");
    expect(periodo("2026-10-11", "2026-10-11", OGGI)).toBe("l’11 ottobre");
    expect(periodo("2026-11-01", "2026-11-01", OGGI)).toBe("il 1° novembre");
  });

  it("l'anno solo quando serve", () => {
    expect(periodo("2026-12-28", "2027-01-06", OGGI)).toBe("dal 28 dicembre 2026 al 6 gennaio 2027");
    expect(periodo("2027-08-10", "2027-08-20", OGGI)).toBe("dal 10 al 20 agosto 2027");
    expect(periodo("2027-07-30", "2027-08-02", OGGI)).toBe("dal 30 luglio al 2 agosto 2027");
  });
});

describe("chiusure", () => {
  const ferie: Chiusura = { dal: "2026-10-05", al: "2026-10-11", motivo: "Ferie" };
  const ponte: Chiusura = { dal: "2026-11-01", al: "2026-11-02", motivo: "" };

  it("trova la chiusura che comprende un giorno, estremi compresi", () => {
    expect(chiusuraDi("2026-10-05", [ponte, ferie])).toEqual(ferie);
    expect(chiusuraDi("2026-10-11", [ferie])).toEqual(ferie);
    expect(chiusuraDi("2026-10-12", [ferie])).toBeNull();
    expect(chiusuraDi("non-una-data", [ferie])).toBeNull();
  });

  it("le frasi per il cliente", () => {
    expect(fraseChiusura(ferie, OGGI)).toBe("Matteo è chiuso dal 5 all’11 ottobre (Ferie)");
    expect(fraseChiusura(ponte, OGGI)).toBe("Matteo è chiuso dal 1° al 2 novembre");
    expect(erroreDataChiusa(ferie, OGGI)).toBe("Matteo è chiuso dal 5 all’11 ottobre: scegli un altro giorno.");
  });

  it("le chiusure vicine: in corso o che iniziano entro n giorni", () => {
    const passata: Chiusura = { dal: "2026-09-01", al: "2026-09-10", motivo: "" };
    const inCorso: Chiusura = { dal: "2026-09-25", al: "2026-09-28", motivo: "" };
    expect(chiusureVicine([ponte, ferie, passata, inCorso], OGGI, 7)).toEqual([inCorso]);
    expect(chiusureVicine([ponte, ferie, passata, inCorso], OGGI, 8)).toEqual([inCorso, ferie]);
    expect(chiusureVicine([ponte, ferie], OGGI, 40)).toEqual([ferie, ponte]);
  });

  it("la settimana prossima va da lunedi a domenica", () => {
    expect(settimanaProssima("2026-09-27")).toEqual({ dal: "2026-09-28", al: "2026-10-04" }); // domenica
    expect(settimanaProssima("2026-09-28")).toEqual({ dal: "2026-10-05", al: "2026-10-11" }); // lunedi
    expect(settimanaProssima("2026-10-01")).toEqual({ dal: "2026-10-05", al: "2026-10-11" }); // giovedi
  });

  it("conta i giorni, estremi compresi", () => {
    expect(durata(ferie)).toBe(7);
    expect(durata({ dal: "2026-10-05", al: "2026-10-05" })).toBe(1);
    expect(durata({ dal: "2027-03-27", al: "2027-03-29" })).toBe(3); // cambio dell'ora
  });
});

describe("linkInterno", () => {
  it("accetta i percorsi del sito", () => {
    for (const buono of ["/", "/menu", "/menu/noodles-sesamo-maiale", "/menu?allenamento=cardio", "/settimana#griglia"]) {
      expect(linkInterno(buono), buono).toBe(true);
    }
  });

  it("rifiuta altri siti e trucchi", () => {
    for (const cattivo of ["", "menu", "//evil.com", "/\\evil.com", "https://evil.com", "javascript:alert(1)", "/ spazio", "/a\tb", `/${"x".repeat(200)}`]) {
      expect(linkInterno(cattivo), cattivo).toBe(false);
    }
  });
});

describe("potaImpostazioni", () => {
  it("tiene cio' che e' valido e butta il resto", () => {
    const p = potaImpostazioni({
      piattiNonDisponibili: ["noodles-sesamo-maiale", "piatto-tolto", 3, "noodles-sesamo-maiale"],
      chiusure: [
        { dal: "2026-11-01", al: "2026-11-02", motivo: "  Ponte\n dei santi " },
        { dal: "2026-10-09", al: "2026-10-05" },
        { dal: "2026-02-30", al: "2026-03-01" },
        { dal: "2026-10-05", al: "2026-10-11" },
      ],
      avviso: { attivo: true, testo: "Ciao", link: "//evil.com" },
    });
    expect(p.piattiNonDisponibili).toEqual(["noodles-sesamo-maiale"]);
    expect(p.chiusure).toEqual([
      { dal: "2026-10-05", al: "2026-10-11", motivo: "" },
      { dal: "2026-11-01", al: "2026-11-02", motivo: "Ponte dei santi" },
    ]);
    expect(p.avviso).toEqual({ attivo: true, testo: "Ciao", link: "" });
  });

  it("qualunque cosa illeggibile diventa il predefinito vuoto", () => {
    for (const x of [null, undefined, "x", 3, [], { chiusure: "no", avviso: [] }]) {
      expect(potaImpostazioni(x)).toEqual(impostazioniVuote());
    }
  });

  it("un avviso acceso senza testo resta spento", () => {
    expect(potaImpostazioni({ avviso: { attivo: true, testo: "   ", link: "/menu" } }).avviso.attivo).toBe(false);
    expect(avvisoVisibile({ attivo: true, testo: " ", link: "" })).toBeNull();
    expect(avvisoVisibile({ attivo: false, testo: "Ciao", link: "" })).toBeNull();
    expect(avvisoVisibile({ attivo: true, testo: "Ciao", link: "" })).toEqual({ attivo: true, testo: "Ciao", link: "" });
  });
});

describe("caselleEscluse", () => {
  it("elenca le caselle con un piatto escluso, in ordine di settimana", () => {
    const piano = {
      gio: { cena: { piatto: "noodles-sesamo-maiale", extra: [] } },
      lun: { pranzo: { piatto: "noodles-sesamo-maiale", extra: [] }, cena: { piatto: "pallotte-cacio-ovo", extra: [] } },
    };
    expect(caselleEscluse(piano, ["noodles-sesamo-maiale"])).toEqual([
      { g: "lun", m: "pranzo", piattoId: "noodles-sesamo-maiale" },
      { g: "gio", m: "cena", piattoId: "noodles-sesamo-maiale" },
    ]);
    expect(caselleEscluse(piano, [])).toEqual([]);
  });
});

describe("sovrapposizioni", () => {
  it("dice con quale chiusura (numero da 1) ogni riga si sovrappone, 0 se con nessuna", () => {
    const righe = [
      { dal: "2026-12-01", al: "2026-12-06" },
      { dal: "2026-12-06", al: "2026-12-10" }, // tocca la prima nell'ultimo giorno
      { dal: "2026-12-20", al: "2026-12-21" },
      { dal: "2026-12-11", al: "2026-12-12" }, // il giorno dopo la seconda: nessuna sovrapposizione
    ];
    expect(sovrapposizioni(righe)).toEqual([2, 1, 0, 0]);
  });

  it("le righe a meta' (date vuote o al contrario) non contano e non segnano le altre", () => {
    const righe = [
      { dal: "2026-12-01", al: "2026-12-10" },
      { dal: "", al: "" },
      { dal: "2026-12-09", al: "2026-12-02" },
      { dal: "2026-12-05", al: "" },
    ];
    expect(sovrapposizioni(righe)).toEqual([0, 0, 0, 0]);
    expect(sovrapposizioni([])).toEqual([]);
  });

  it("un anno sbagliato fa una chiusura lunghissima: sopra la soglia si segnala", () => {
    expect(durata({ dal: "2026-12-01", al: "2027-11-30" })).toBeGreaterThan(GIORNI_CHIUSURA_LUNGA);
    expect(durata({ dal: "2026-12-01", al: "2026-12-14" })).toBeLessThanOrEqual(GIORNI_CHIUSURA_LUNGA);
  });
});

describe("ordiniApertiConPiatto", () => {
  const ordine = (status: Ordine["status"], piatti: string[]) =>
    ({ status, items: piatti.map((id) => ({ id, name: id, day: "lun", meal: "pranzo", extras: [] })) }) as unknown as Ordine;

  it("conta gli ordini ancora aperti con il piatto e le sue porzioni, non quelli chiusi", () => {
    const ordini = [
      ordine("requested", ["noodles-sesamo-maiale", "noodles-sesamo-maiale", "pallotte-cacio-ovo"]),
      ordine("confirmed", ["noodles-sesamo-maiale"]),
      ordine("preparing", ["pallotte-cacio-ovo"]),
      ordine("ready", ["noodles-sesamo-maiale"]),
      ordine("completed", ["noodles-sesamo-maiale"]),
      ordine("cancelled", ["noodles-sesamo-maiale"]),
    ];
    expect(ordiniApertiConPiatto(ordini, "noodles-sesamo-maiale")).toEqual({ ordini: 2, porzioni: 3 });
    expect(ordiniApertiConPiatto(ordini, "uova-purgatorio-peperoni")).toEqual({ ordini: 0, porzioni: 0 });
    expect(ordiniApertiConPiatto([], "noodles-sesamo-maiale")).toEqual({ ordini: 0, porzioni: 0 });
  });
});
