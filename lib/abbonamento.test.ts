import { describe, expect, it } from "vitest";
import {
  BOX_DEL_GIORNO,
  FASCE,
  FORMULE,
  FORMULE_ID,
  LINK_RICHIEDI_ABBONAMENTO,
  NUCLEI,
  PASTO_STANDARD_CIRCA,
  PREZZO_DA,
  PREZZO_FINO_A,
  SCONTI,
  bloccoDiConsegna,
  calcolaPrezzo,
  consegneAbbonamento,
  eFeriale,
  eGiornoDiConsegna,
  eFormulaId,
  etichettaFormula,
  fineAbbonamento,
  formulaDi,
  frasePeriodo,
  getFormula,
  linkRichiediAbbonamento,
  nelPeriodo,
  pastiDelBlocco,
  pastiDelGiorno,
  pastiNelPeriodo,
  periodoAbbonamento,
  prossimaConsegna,
  scontoApplicato,
  stessoGiornoMeseDopo,
} from "./abbonamento";
import { CONSEGNA_A_PAROLE, esempioConsegna, giorniAParole, giorniCopertiAParole, pastiAParole } from "../components/abbonamento/righe";

/* Ottobre 2026: giovedi' 1, venerdi' 2, sabato 3, domenica 4, lunedi' 5. */

describe("le cinque formule", () => {
  it("sono cinque, nell'ordine del volantino, con un solo consigliato: Completo", () => {
    expect(FORMULE.map((f) => f.id)).toEqual(["pranzo", "leggero", "completo", "full6", "full7"]);
    expect(FORMULE_ID).toEqual(FORMULE.map((f) => f.id));
    expect(FORMULE.filter((f) => f.consigliato).map((f) => f.id)).toEqual(["completo"]);
  });

  it("i prezzi sono quelli del volantino", () => {
    expect(FORMULE.map((f) => [f.id, f.prezzo.standard, f.prezzo.plus])).toEqual([
      ["pranzo", 173, 225],
      ["leggero", 347, 451],
      ["completo", 520, 676],
      ["full6", 624, 811],
      ["full7", 728, 946],
    ]);
    expect(PREZZO_DA).toBe(173);
    expect(PREZZO_FINO_A).toBe(946);
  });

  it("Standard fa circa 8 euro a pasto e Plus costa il 30% in piu', per tutte le formule", () => {
    for (const f of FORMULE) {
      // 4,33 settimane al mese (13/3): il conto che il volantino arrotonda a "circa 8 euro a pasto".
      expect(Math.round((PASTO_STANDARD_CIRCA * f.pastiSettimana * 13) / 3)).toBe(f.prezzo.standard);
      expect(Math.round(f.prezzo.standard * 1.3)).toBe(f.prezzo.plus);
    }
  });

  it("i pasti a settimana tornano con giorni e pasti della formula, tranne Completo", () => {
    for (const f of FORMULE.filter((x) => x.id !== "completo")) expect(f.giorni.length * f.pasti.length).toBe(f.pastiSettimana);
    // INCONGRUENZA DEL VOLANTINO, da chiarire con il committente: Completo dice "pranzo e cena, tutti i
    // giorni" (7 x 2 = 14 pasti) ma "15 pasti a settimana", e 520 euro sono 15 pasti a 8 euro. Le pagine
    // scrivono 15 come il volantino; il calendario di cucina cucina 14 (pranzo e cena ogni giorno).
    const c = getFormula("completo");
    expect(c.giorni.length * c.pasti.length).toBe(14);
    expect(c.pastiSettimana).toBe(15);
  });

  it("riconosce gli id e trova la formula", () => {
    expect(eFormulaId("full6")).toBe(true);
    expect(eFormulaId("full8")).toBe(false);
    expect(eFormulaId(undefined)).toBe(false);
    expect(getFormula("leggero").nome).toBe("Leggero");
    expect(() => getFormula("nessuna" as never)).toThrow();
  });

  it("un ordine senza formula (abbonamento di prima) e' un pranzo dal lunedi' al venerdi'", () => {
    expect(formulaDi({ subscription: null })).toBe("pranzo");
    expect(formulaDi({})).toBe("pranzo");
    expect(formulaDi(null)).toBe("pranzo");
    expect(formulaDi({ subscription: { plan: "full7" } })).toBe("full7");
  });

  it("scrive formula e fascia insieme", () => {
    expect(etichettaFormula("completo")).toBe("Completo");
    expect(etichettaFormula("completo", "plus")).toBe("Completo · Plus");
    expect(etichettaFormula("full6", "standard")).toBe("Full 6 · Standard");
  });

  it("le box del giorno costano da 7 a 9 euro", () => {
    expect(BOX_DEL_GIORNO).toEqual({ da: 7, a: 9 });
  });
});

describe("il prezzo di un abbonamento", () => {
  const base = { formula: "completo", fascia: "standard", ritiro: false, nucleo: "singolo" } as const;

  it("senza sconti e' il listino, in centesimi", () => {
    expect(calcolaPrezzo(base)).toEqual({ listinoCentesimi: 52000, scontoPercento: 0, totaleCentesimi: 52000 });
    expect(calcolaPrezzo({ ...base, fascia: "plus" }).totaleCentesimi).toBe(67600);
    expect(calcolaPrezzo({ ...base, formula: "pranzo" }).totaleCentesimi).toBe(17300);
    expect(calcolaPrezzo({ ...base, formula: "full7", fascia: "plus" }).totaleCentesimi).toBe(94600);
  });

  it("ritiro, coppia e famiglia mantengono il listino senza sconti automatici", () => {
    expect(SCONTI).toEqual({ ritiro: 0, coppia: 0, famiglia: 0 });
    for (const formula of FORMULE_ID) for (const fascia of FASCE) for (const nucleo of NUCLEI) for (const ritiro of [false, true]) {
      const p = calcolaPrezzo({ formula, fascia, nucleo, ritiro });
      expect(scontoApplicato({ ritiro, nucleo })).toBe(0);
      expect(p.scontoPercento).toBe(0);
      expect(p.totaleCentesimi).toBe(getFormula(formula).prezzo[fascia] * 100);
    }
  });

  it("uno sconto non porta mai il prezzo sotto zero ne' sopra il listino", () => {
    for (const formula of FORMULE_ID) for (const fascia of FASCE) for (const nucleo of NUCLEI) for (const ritiro of [false, true]) {
      const p = calcolaPrezzo({ formula, fascia, nucleo, ritiro });
      expect(p.totaleCentesimi).toBeGreaterThan(0);
      expect(p.totaleCentesimi).toBeLessThanOrEqual(p.listinoCentesimi);
    }
  });
});

describe("i link", () => {
  it("la richiesta dall'account porta il servizio e, se c'e', la scelta", () => {
    expect(LINK_RICHIEDI_ABBONAMENTO).toBe("/account?sezione=richiesta&servizio=abbonamento");
    expect(linkRichiediAbbonamento({ formula: "completo" })).toBe("/account?sezione=richiesta&servizio=abbonamento&formula=completo");
    expect(linkRichiediAbbonamento({ formula: "full6", fascia: "plus" })).toBe(
      "/account?sezione=richiesta&servizio=abbonamento&formula=full6&fascia=plus",
    );
    // dal simulatore arrivano anche come si riceve e con chi ci si abbona
    expect(linkRichiediAbbonamento({ formula: "completo", fascia: "standard", ritiro: false, nucleo: "coppia" })).toBe(
      "/account?sezione=richiesta&servizio=abbonamento&formula=completo&fascia=standard&modalita=delivery&nucleo=coppia",
    );
    expect(linkRichiediAbbonamento({ ritiro: true })).toBe("/account?sezione=richiesta&servizio=abbonamento&modalita=pickup");
  });
});

/* Il periodo di un abbonamento: dalla data d'inizio al giorno prima dello
   stesso giorno del mese dopo. */

describe("periodo dell'abbonamento", () => {
  it("dura un mese: fino al giorno prima dello stesso giorno del mese dopo", () => {
    expect(periodoAbbonamento("2026-10-05")).toEqual({ dal: "2026-10-05", al: "2026-11-04" });
    expect(fineAbbonamento("2026-10-01")).toBe("2026-10-31");
    expect(fineAbbonamento("2026-12-15")).toBe("2027-01-14"); // scavalca il capodanno
  });

  it("se il mese dopo non ha quel giorno, conta il suo ultimo giorno", () => {
    expect(stessoGiornoMeseDopo("2027-01-31")).toBe("2027-02-28");
    expect(fineAbbonamento("2027-01-31")).toBe("2027-02-27");
    expect(stessoGiornoMeseDopo("2028-01-30")).toBe("2028-02-29"); // bisestile
    expect(fineAbbonamento("2026-03-31")).toBe("2026-04-29");
    // il mese dopo ricomincia dal giorno in cui il primo finisce + 1
    expect(stessoGiornoMeseDopo("2026-10-05")).toBe("2026-11-05");
  });

  it("dice se un giorno sta nel periodo, estremi compresi", () => {
    expect(nelPeriodo("2026-10-05", "2026-10-05")).toBe(true);
    expect(nelPeriodo("2026-10-05", "2026-11-04")).toBe(true);
    expect(nelPeriodo("2026-10-05", "2026-11-05")).toBe(false);
    expect(nelPeriodo("2026-10-05", "2026-10-04")).toBe(false);
  });

  it("scrive il periodo a parole, con l'anno solo quando serve", () => {
    expect(frasePeriodo(periodoAbbonamento("2026-10-05"), "2026-09-27")).toBe("dal 5 ottobre al 4 novembre");
    expect(frasePeriodo(periodoAbbonamento("2026-10-01"), "2026-09-27")).toBe("dal 1° al 31 ottobre");
    expect(frasePeriodo(periodoAbbonamento("2026-12-15"), "2026-09-27")).toBe("dal 15 dicembre 2026 al 14 gennaio 2027");
  });

  it("riconosce i giorni feriali", () => {
    expect(eFeriale("2026-10-02")).toBe(true); // venerdi'
    expect(eFeriale("2026-10-03")).toBe(false); // sabato
    expect(eFeriale("2026-10-04")).toBe(false); // domenica
  });
});

describe("i pasti di ogni giorno", () => {
  it("Pranzo e Leggero coprono il lunedi'-venerdi', il fine settimana no", () => {
    expect(pastiDelGiorno("pranzo", "2026-10-02")).toEqual(["pranzo"]);
    expect(pastiDelGiorno("pranzo", "2026-10-03")).toEqual([]);
    expect(pastiDelGiorno("leggero", "2026-10-05")).toEqual(["pranzo", "cena"]);
    expect(pastiDelGiorno("leggero", "2026-10-04")).toEqual([]);
  });

  it("Completo copre tutti i giorni con pranzo e cena", () => {
    expect(pastiDelGiorno("completo", "2026-10-04")).toEqual(["pranzo", "cena"]);
  });

  it("Full 6 salta la domenica, Full 7 no; entrambe hanno la colazione in testa", () => {
    expect(pastiDelGiorno("full6", "2026-10-03")).toEqual(["colazione", "pranzo", "cena"]); // sabato
    expect(pastiDelGiorno("full6", "2026-10-04")).toEqual([]); // domenica
    expect(pastiDelGiorno("full7", "2026-10-04")).toEqual(["colazione", "pranzo", "cena"]);
  });

  it("in un periodo si contano tutti i pasti (ottobre 2026 dal 1 al 31: 22 feriali, 31 giorni, 4 domeniche)", () => {
    const ottobre = periodoAbbonamento("2026-10-01");
    expect(pastiNelPeriodo("pranzo", ottobre)).toBe(22);
    expect(pastiNelPeriodo("leggero", ottobre)).toBe(44);
    expect(pastiNelPeriodo("completo", ottobre)).toBe(62);
    expect(pastiNelPeriodo("full6", ottobre)).toBe(81); // 27 giorni x 3
    expect(pastiNelPeriodo("full7", ottobre)).toBe(93);
    expect(pastiNelPeriodo("pranzo", { dal: "2026-10-03", al: "2026-10-04" })).toBe(0);
  });
});

describe("le consegne ogni 3 giorni", () => {
  it("un blocco e' di tre giorni e non esce dal periodo", () => {
    expect(bloccoDiConsegna("2026-10-01", "2026-10-01")).toEqual({ dal: "2026-10-01", al: "2026-10-03" });
    // l'ultimo blocco di un periodo che finisce il 31: solo il 31
    expect(bloccoDiConsegna("2026-10-01", "2026-10-31")).toEqual({ dal: "2026-10-31", al: "2026-10-31" });
    expect(bloccoDiConsegna("2026-10-05", "2026-11-03")).toEqual({ dal: "2026-11-03", al: "2026-11-04" });
  });

  it("i pasti di una consegna sono quelli della formula nei tre giorni, in ordine di calendario", () => {
    // Consegna venerdi' 2 ottobre: venerdi', sabato, domenica.
    expect(pastiDelBlocco("pranzo", "2026-10-01", "2026-10-02")).toEqual([{ data: "2026-10-02", pasto: "pranzo" }]);
    expect(pastiDelBlocco("completo", "2026-10-01", "2026-10-04")).toEqual([
      { data: "2026-10-04", pasto: "pranzo" },
      { data: "2026-10-04", pasto: "cena" },
      { data: "2026-10-05", pasto: "pranzo" },
      { data: "2026-10-05", pasto: "cena" },
      { data: "2026-10-06", pasto: "pranzo" },
      { data: "2026-10-06", pasto: "cena" },
    ]);
    expect(pastiDelBlocco("full6", "2026-10-01", "2026-10-03").map((p) => `${p.data} ${p.pasto}`)).toEqual([
      "2026-10-03 colazione", "2026-10-03 pranzo", "2026-10-03 cena", // sabato
      "2026-10-05 colazione", "2026-10-05 pranzo", "2026-10-05 cena", // domenica libera, poi lunedi'
    ]);
  });

  it("le consegne partono dall'inizio e si ripetono ogni tre giorni", () => {
    expect(consegneAbbonamento("completo", "2026-10-01")).toEqual([
      "2026-10-01", "2026-10-04", "2026-10-07", "2026-10-10", "2026-10-13", "2026-10-16",
      "2026-10-19", "2026-10-22", "2026-10-25", "2026-10-28", "2026-10-31",
    ]);
  });

  it("una consegna che non porta nessun pasto si salta (l'ultima di un Pranzo che finisce di sabato)", () => {
    // Periodo 1-31 ottobre: la consegna del 31 (sabato) coprirebbe solo il 31, che non e' un giorno di pranzo.
    const pranzo = consegneAbbonamento("pranzo", "2026-10-01");
    expect(pranzo).not.toContain("2026-10-31");
    expect(pranzo[0]).toBe("2026-10-01");
    // ma i pasti del periodo sono tutti coperti da una consegna
    const coperti = pranzo.flatMap((d) => pastiDelBlocco("pranzo", "2026-10-01", d));
    expect(coperti).toHaveLength(pastiNelPeriodo("pranzo", periodoAbbonamento("2026-10-01")));
  });

  it("per ogni formula le consegne coprono ogni pasto del periodo una volta sola", () => {
    for (const formula of FORMULE_ID) for (const inizio of ["2026-10-01", "2026-10-05", "2027-01-31", "2028-02-01"]) {
      const coperti = consegneAbbonamento(formula, inizio).flatMap((d) => pastiDelBlocco(formula, inizio, d));
      expect(coperti).toHaveLength(pastiNelPeriodo(formula, periodoAbbonamento(inizio)));
      expect(new Set(coperti.map((p) => `${p.data} ${p.pasto}`)).size).toBe(coperti.length);
    }
  });

  it("dice se un giorno e' di consegna", () => {
    expect(eGiornoDiConsegna("completo", "2026-10-01", "2026-10-01")).toBe(true);
    expect(eGiornoDiConsegna("completo", "2026-10-01", "2026-10-02")).toBe(false);
    expect(eGiornoDiConsegna("completo", "2026-10-01", "2026-10-04")).toBe(true);
    expect(eGiornoDiConsegna("completo", "2026-10-01", "2026-11-01")).toBe(false); // fuori dal periodo
    expect(eGiornoDiConsegna("pranzo", "2026-10-01", "2026-10-31")).toBe(false); // consegna senza pasti
    expect(eGiornoDiConsegna("completo", "2026-10-05", "2026-09-30")).toBe(false); // prima dell'inizio
  });

  it("la prossima consegna parte da oggi compreso e finisce col periodo", () => {
    expect(prossimaConsegna("completo", "2026-10-01", "2026-09-27")).toBe("2026-10-01"); // non ancora iniziato
    expect(prossimaConsegna("completo", "2026-10-01", "2026-10-04")).toBe("2026-10-04");
    expect(prossimaConsegna("completo", "2026-10-01", "2026-10-05")).toBe("2026-10-07");
    expect(prossimaConsegna("completo", "2026-10-01", "2026-11-01")).toBeNull();
    expect(prossimaConsegna("pranzo", "2026-10-01", "2026-10-29")).toBeNull(); // 28 e' l'ultima con un pranzo
  });
});

/* Le frasi delle pagine (components/abbonamento/righe.ts): giorni e pasti che il visitatore legge devono essere
   quelli delle formule, e dove il volantino non lo dice (il giorno libero di Full 6) la pagina non lo inventa. */
describe("le frasi sulle formule", () => {
  it("dicono i giorni coperti di ogni formula", () => {
    expect(giorniAParole(getFormula("pranzo"))).toBe("dal lunedì al venerdì");
    expect(giorniAParole(getFormula("leggero"))).toBe("dal lunedì al venerdì");
    expect(giorniAParole(getFormula("completo"))).toBe("tutti i giorni");
    expect(giorniAParole(getFormula("full7"))).toBe("tutti i giorni");
  });

  it("per Full 6 il giorno libero si concorda: nessun giorno della settimana nominato", () => {
    const frase = giorniAParole(getFormula("full6"));
    expect(frase).toContain("sei giorni su sette");
    expect(frase).toContain("concordi con Matteo");
    expect(frase).not.toMatch(/domenica|luned|marted|mercoled|gioved|venerd|sabato/);
  });

  it("i giorni, scritti per cominciare una frase, hanno la maiuscola", () => {
    expect(giorniCopertiAParole(getFormula("completo"))).toBe("Tutti i giorni");
    expect(giorniCopertiAParole(getFormula("pranzo"))).toBe("Dal lunedì al venerdì");
  });

  it("elencano i pasti della formula nell'ordine in cui si mangiano", () => {
    expect(pastiAParole(getFormula("pranzo"))).toBe("Pranzo");
    expect(pastiAParole(getFormula("leggero"))).toBe("Pranzo e cena");
    expect(pastiAParole(getFormula("full6"))).toBe("Colazione, pranzo e cena");
  });

  it("la scheda della consegna non fissa nessuna cadenza: giorno e orario si concordano con Matteo", () => {
    expect(esempioConsegna(getFormula("completo"))).toMatch(/^Ritiro o consegna, con giorno e orario concordati\./);
    expect(esempioConsegna(getFormula("completo"))).not.toContain("non copre");
    expect(esempioConsegna(getFormula("pranzo"))).toMatch(/^Ritiro o consegna, con giorno e orario concordati\./);
    expect(esempioConsegna(getFormula("pranzo"))).toContain("non copre");
    expect(CONSEGNA_A_PAROLE).toBe("Con giorno e orario concordati, a casa o al ritiro");
  });
});
