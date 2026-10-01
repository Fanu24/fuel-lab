import { describe, expect, it } from "vitest";
import type { Chiusura, ClienteAdmin, MessaggioContatto, Ordine, SceltaAbbonamento } from "./api";
import {
  PASTO_IN_ABBONAMENTO,
  abbonamentiDelGiorno,
  allergeniDelGiorno,
  calendarioAbbonamento,
  cellaCsv,
  clientiConPreferenze,
  clientiCsv,
  confermatiSenzaGiorno,
  consegnaDelGiorno,
  contaExtra,
  contaPastiAbbonamenti,
  contaPiatti,
  contaPorzioni,
  corpoRisposta,
  dataBreve,
  dettaglioAbbonamento,
  etichette,
  etichetteAbbonamenti,
  filtraClienti,
  euroTondo,
  formattaPeso,
  formattaPezzi,
  frasePasti,
  giornoPredefinito,
  giorniConOrdini,
  giorniDaPreparare,
  inFogli,
  isData,
  leggiNota,
  listaSpesa,
  mailtoRisposta,
  nomeAbbonamento,
  nuoviClienti,
  oggettoRisposta,
  oggiRoma,
  ordiniDelGiorno,
  pastiComeOrdini,
  pastiConsegnati,
  pastiDaComporre,
  pastiDelPeriodo,
  pastiInConsegna,
  pastiInConsegnaPerGiorno,
  pastiPerGiorno,
  primoGiornoDiCucina,
  repartoDi,
  spostaGiorni,
  tacche,
  vocePasto,
  ETICHETTE_PER_FOGLIO,
} from "./produzione";

const ordine = (id: string, modifiche: Partial<Ordine> = {}): Ordine => ({
  id, user_id: `u-${id}`, email: `${id}@example.com`, status: "confirmed", service: "menu-settimana",
  fulfillment: "pickup", requested_date: null, production_date: "2026-09-28", fulfillment_date: "2026-09-28",
  customer_name: id, phone: "3331234567", comune: "Pescara", address: "", notes: "", internal_note: "",
  customer_message: "", price_cents: null, paid: 0, dietary_preferences: null, meals: 1,
  created_at: "2026-09-26 10:00:00", updated_at: "2026-09-26 10:00:00",
  items: [{ id: "riso-julien-pollo-teriyaki", name: "Riso", day: "lun", meal: "pranzo", extras: [] }],
  ...modifiche,
});

const cliente = (id: string, modifiche: Partial<ClienteAdmin> = {}): ClienteAdmin => ({
  id, name: id, email: `${id}@example.com`, emailVerified: true, createdAt: "2026-09-01 10:00:00",
  phone: "", comune: "Pescara", address: "", preferences: "", orders: 0, activeOrders: 0, meals: 0,
  lastOrderAt: null, spentCents: 0, hasSavedPlan: false, ...modifiche,
});

describe("date della cucina", () => {
  it("calcola oggi nel fuso di Roma anche a cavallo della mezzanotte UTC", () => {
    expect(oggiRoma(new Date("2026-09-27T22:30:00Z"))).toBe("2026-09-28");
  });

  it("si cucina ogni giorno: il primo giorno di cucina e' oggi, se non e' chiuso", () => {
    const ferie: Chiusura[] = [{ dal: "2026-09-27", al: "2026-09-29", motivo: "" }];
    expect(primoGiornoDiCucina("2026-09-27")).toBe("2026-09-27"); // anche di domenica
    expect(primoGiornoDiCucina("2026-09-27", ferie)).toBe("2026-09-30");
    expect(spostaGiorni("2026-10-24", 3)).toBe("2026-10-27"); // attraverso il cambio dell'ora
  });

  it("riconosce solo date vere", () => {
    expect(isData("2026-02-28")).toBe(true);
    expect(isData("2026-02-30")).toBe(false);
    expect(isData("28/09/2026")).toBe(false);
    // anni fuori dal 2000-2100: errori di battitura del campo data, non ordini
    expect(isData("0002-10-05")).toBe(false);
    expect(isData("9999-12-31")).toBe(false);
    expect(isData("2000-01-01")).toBe(true);
    expect(isData("2100-12-31")).toBe(true);
    expect(isData(null)).toBe(false);
  });

  it("scrive la data corta delle etichette", () => {
    expect(dataBreve("2026-09-28")).toBe("lun 28/09");
  });
});

describe("foglio di produzione", () => {
  const ordini = [
    ordine("anna", { items: [
      { id: "riso-julien-pollo-teriyaki", name: "Riso", day: "mar", meal: "cena", extras: ["Pasta"] },
      { id: "riso-julien-pollo-teriyaki", name: "Riso", day: "lun", meal: "pranzo", extras: ["Tahina", "Pasta"] },
    ] }),
    ordine("bruno", { status: "preparing", fulfillment_date: "2026-09-29", items: [
      { id: "uova-purgatorio-peperoni", name: "Uova", day: "lun", meal: "cena", extras: [] },
    ] }),
    ordine("pronto", { status: "ready" }),
    ordine("altro-giorno", { production_date: "2026-10-01" }),
    ordine("da-confermare", { status: "requested" }),
    ordine("senza-giorno", { production_date: null }),
  ];

  it("prende solo confermati e in preparazione del giorno, i pronti a richiesta", () => {
    expect(ordiniDelGiorno(ordini, "2026-09-28").map((o) => o.id)).toEqual(["anna", "bruno"]);
    expect(ordiniDelGiorno(ordini, "2026-09-28", true).map((o) => o.id)).toEqual(["anna", "pronto", "bruno"]);
  });

  it("conta porzioni, piatti ed extra", () => {
    const giorno = ordiniDelGiorno(ordini, "2026-09-28");
    expect(contaPorzioni(giorno)).toBe(3);
    expect(contaPiatti(giorno).map((p) => [p.nome, p.porzioni])).toEqual([
      ["Riso carote e zucchine julien, pollo teriyaki", 2],
      ["Uova alla purgatorio con sugo di peperoni", 1],
    ]);
    expect(contaExtra(giorno).map((e) => [e.nome, e.quanti, e.allergeni])).toEqual([
      ["Pasta", 2, ["glutine"]],
      ["Tahina", 1, ["sesamo"]],
    ]);
  });

  it("somma gli allergeni per porzione senza contarla due volte", () => {
    const righe = allergeniDelGiorno(ordiniDelGiorno(ordini, "2026-09-28"));
    const sesamo = righe.find((r) => r.allergene === "sesamo");
    // Due porzioni di riso (sesamo nel piatto), una delle due con tahina: sempre due porzioni.
    expect(sesamo?.porzioni).toBe(2);
    expect(sesamo?.fonti).toEqual(["Riso carote e zucchine julien, pollo teriyaki", "Tahina (extra)"]);
    expect(righe.find((r) => r.allergene === "glutine")?.porzioni).toBe(2);
    expect(righe.find((r) => r.allergene === "uova")?.porzioni).toBe(1);
  });

  it("elenca i giorni con ordini e segnala i confermati senza giorno", () => {
    expect(giorniConOrdini(ordini, "2026-09-28")).toEqual([
      { giorno: "2026-09-28", ordini: 2, porzioni: 3 },
      { giorno: "2026-10-01", ordini: 1, porzioni: 1 },
    ]);
    expect(confermatiSenzaGiorno(ordini).map((o) => o.id)).toEqual(["senza-giorno"]);
  });

  it("apre su oggi, o sul primo giorno dopo una chiusura se oggi non c'e' niente", () => {
    const chiuso: Chiusura[] = [{ dal: "2026-09-29", al: "2026-09-30", motivo: "ferie" }];
    expect(giornoPredefinito(ordini, "2026-09-28")).toBe("2026-09-28");
    expect(giornoPredefinito([], "2026-09-29")).toBe("2026-09-29");
    expect(giornoPredefinito([], "2026-09-29", chiuso)).toBe("2026-10-01");
    // chiuso, ma con un ordine gia' confermato per oggi: si apre su oggi
    expect(giornoPredefinito([ordine("x", { production_date: "2026-09-29" })], "2026-09-29", chiuso)).toBe("2026-09-29");
  });
});

describe("abbonamenti in cucina: una consegna ogni 3 giorni", () => {
  const scelta = (plan: SceltaAbbonamento["plan"], tier: SceltaAbbonamento["tier"] = "standard"): SceltaAbbonamento => ({
    plan, tier, household: "singolo", trial: false,
  });
  const abb = (id: string, inizio: string | null, modifiche: Partial<Ordine> = {}): Ordine =>
    ordine(id, { service: "abbonamento", customer_name: id, production_date: inizio, fulfillment_date: inizio, items: [], meals: 0, ...modifiche });

  // Giulia: Completo Plus dal 1 al 31 ottobre (giovedi' 1): pranzo e cena tutti i giorni, una consegna ogni 3 giorni.
  // Ha indicato il pranzo del lunedi' e del mercoledi'.
  const giulia = abb("giulia", "2026-10-01", {
    customer_name: "Giulia", subscription: scelta("completo", "plus"),
    notes: "Pesi lun-mer-ven, 140 g di proteine", dietary_preferences: "Senza lattosio",
    items: [
      { id: "riso-julien-pollo-teriyaki", name: "Riso", day: "lun", meal: "pranzo", extras: ["Pasta"] },
      { id: "uova-purgatorio-peperoni", name: "Uova", day: "mer", meal: "pranzo", extras: [] },
    ],
  });
  // Anna: abbonamento di prima delle formule (nessuna scelta salvata) = Pranzo, dal lunedi' 5 ottobre al 4 novembre.
  const anna = abb("anna", "2026-10-05", { customer_name: "Anna", subscription: null });
  // Sara: Pranzo dal 1 ottobre: la consegna del 31 (sabato) non porterebbe nessun pranzo e si salta.
  const sara = abb("sara", "2026-10-01", { customer_name: "Sara", subscription: scelta("pranzo") });
  // Fabio: Full 6 dal 3 ottobre (sabato), la domenica e' libera.
  const fabio = abb("fabio", "2026-10-03", { customer_name: "Fabio", subscription: scelta("full6") });
  // Elisa: Full 7 dal 1 ottobre, nove pasti a ogni consegna.
  const elisa = abb("elisa", "2026-10-01", { customer_name: "Elisa", subscription: scelta("full7", "plus") });
  const normale = ordine("normale", { production_date: "2026-10-05", fulfillment_date: "2026-10-05" });
  const tutti = [
    giulia,
    anna,
    sara,
    fabio,
    elisa,
    abb("richiesta", "2026-10-01", { status: "requested", subscription: scelta("completo") }),
    abb("annullato", "2026-10-01", { status: "cancelled", subscription: scelta("completo") }),
    abb("concluso", "2026-10-01", { status: "completed", subscription: scelta("completo") }),
    abb("senza-inizio", null, { subscription: scelta("completo") }),
    normale,
  ];
  const ids = (lista: Ordine[]) => lista.map((o) => o.id);

  it("un abbonamento compare solo nei giorni di consegna, non piu' ogni giorno feriale", () => {
    expect(ids(abbonamentiDelGiorno(tutti, "2026-10-01"))).toEqual(["elisa", "giulia", "sara"]); // giovedi', primo giorno
    expect(abbonamentiDelGiorno(tutti, "2026-10-02")).toEqual([]); // venerdi': in mezzo a due consegne
    expect(ids(abbonamentiDelGiorno(tutti, "2026-10-03"))).toEqual(["fabio"]);
    expect(ids(abbonamentiDelGiorno(tutti, "2026-10-04"))).toEqual(["elisa", "giulia", "sara"]); // domenica: si consegna anche di domenica
    expect(ids(abbonamentiDelGiorno(tutti, "2026-10-05"))).toEqual(["anna"]);
  });

  it("scarta gli abbonamenti non ancora iniziati, scaduti, senza inizio e negli stati non attivi", () => {
    expect(abbonamentiDelGiorno(tutti, "2026-09-30")).toEqual([]); // prima dell'inizio
    // Giulia, Sara ed Elisa finiscono il 31 ottobre, Fabio il 2 novembre, Anna il 4: il 1 novembre resta la consegna di Anna
    expect(ids(abbonamentiDelGiorno(tutti, "2026-11-01"))).toEqual(["anna"]);
    // richiesta, annullato, concluso e senza inizio non compaiono mai, in nessun giorno di consegna
    for (const g of ["2026-10-01", "2026-10-04", "2026-10-07"]) {
      for (const escluso of ["richiesta", "annullato", "concluso", "senza-inizio"]) {
        expect(ids(abbonamentiDelGiorno(tutti, g))).not.toContain(escluso);
      }
    }
    // in preparazione o pronto e' ancora in corso
    expect(ids(abbonamentiDelGiorno([{ ...giulia, status: "ready" }, { ...anna, status: "preparing" }], "2026-10-04"))).toEqual(["giulia"]);
    expect(abbonamentiDelGiorno(tutti, "non-una-data")).toEqual([]);
  });

  it("un abbonamento non e' un ordine del giorno d'inizio", () => {
    expect(ids(ordiniDelGiorno(tutti, "2026-10-05"))).toEqual(["normale"]);
    expect(giorniConOrdini(tutti, "2026-10-01")).toEqual([{ giorno: "2026-10-05", ordini: 1, porzioni: 1 }]);
  });

  it("i giorni da preparare comprendono le consegne degli abbonamenti, con i loro pasti", () => {
    const g = giorniDaPreparare([giulia, anna, normale], "2026-10-01", false, 7);
    expect(g).toEqual([
      { giorno: "2026-10-01", ordini: 0, abbonamenti: 1, porzioni: 6 }, // Giulia: gio, ven, sab = 6 pasti
      { giorno: "2026-10-04", ordini: 0, abbonamenti: 1, porzioni: 6 },
      { giorno: "2026-10-05", ordini: 1, abbonamenti: 1, porzioni: 1 + 3 }, // l'ordine normale + Anna (lun, mar, mer: 3 pranzi)
      { giorno: "2026-10-07", ordini: 0, abbonamenti: 1, porzioni: 6 },
    ]);
    // l'orizzonte e' un numero di giorni a partire da `daGiorno`, compreso
    expect(giorniDaPreparare([giulia], "2026-10-01", false, 1).map((x) => x.giorno)).toEqual(["2026-10-01"]);
    expect(giorniDaPreparare([giulia], "2026-10-01", false, 4).map((x) => x.giorno)).toEqual(["2026-10-01", "2026-10-04"]);
  });

  it("dice quale consegna e', quanti pasti porta e fino a quando copre", () => {
    const c = consegnaDelGiorno(giulia, "2026-10-04");
    expect(c).toMatchObject({ giorno: "2026-10-04", numero: 2, totale: 11, fino: "2026-10-06" });
    expect(c?.pasti).toHaveLength(6);
    expect(consegnaDelGiorno(giulia, "2026-10-02")).toBeNull();
    expect(consegnaDelGiorno({ ...giulia, status: "requested" }, "2026-10-04")).toBeNull();
  });

  it("consegna sull'ultimo giorno del periodo: porta i pasti di quel giorno e basta", () => {
    // Giulia: il 31 ottobre e' l'ultima delle 11 consegne e copre solo il 31 (pranzo e cena).
    expect(consegnaDelGiorno(giulia, "2026-10-31")).toMatchObject({ numero: 11, totale: 11, fino: "2026-10-31" });
    expect(pastiConsegnati(giulia, "2026-10-31")).toEqual([
      { data: "2026-10-31", pasto: "pranzo" },
      { data: "2026-10-31", pasto: "cena" },
    ]);
    // Anna: periodo 5 ott - 4 nov, l'ultima consegna e' il 4 novembre (mercoledi'), un pranzo.
    expect(consegnaDelGiorno(anna, "2026-11-04")).toMatchObject({ numero: 11, totale: 11, fino: "2026-11-04" });
    expect(pastiConsegnati(anna, "2026-11-04")).toEqual([{ data: "2026-11-04", pasto: "pranzo" }]);
    expect(consegnaDelGiorno(anna, "2026-11-05")).toBeNull();
  });

  it("una consegna senza pasti si salta (Pranzo che finisce di sabato)", () => {
    expect(abbonamentiDelGiorno([sara], "2026-10-31")).toEqual([]);
    expect(consegnaDelGiorno(sara, "2026-10-31")).toBeNull();
    // l'ultima vera e' il 28 (mercoledi', giovedi', venerdi'): tre pranzi, decima e ultima
    expect(consegnaDelGiorno(sara, "2026-10-28")).toMatchObject({ numero: 10, totale: 10, fino: "2026-10-30" });
    expect(pastiConsegnati(sara, "2026-10-28")).toHaveLength(3);
  });

  it("un abbonamento vecchio, senza formula, vale Pranzo: solo pranzi, dal lunedi' al venerdi'", () => {
    // Anna consegna lunedi' 5: lunedi', martedi', mercoledi' = tre pranzi.
    expect(pastiConsegnati(anna, "2026-10-05").map((p) => `${p.data} ${p.pasto}`)).toEqual([
      "2026-10-05 pranzo", "2026-10-06 pranzo", "2026-10-07 pranzo",
    ]);
    // giovedi' 8: giovedi' e venerdi'; il sabato non c'e'
    expect(pastiConsegnati(anna, "2026-10-08")).toHaveLength(2);
    // domenica 11: la consegna c'e', porta i pranzi di lunedi' e martedi'
    expect(pastiConsegnati(anna, "2026-10-11").map((p) => p.data)).toEqual(["2026-10-12", "2026-10-13"]);
  });

  it("Full 6 con la domenica libera: la consegna c'e' anche di domenica, i pasti no", () => {
    // Fabio: sabato 3 = sabato + (domenica libera) + lunedi': due giorni da tre pasti
    expect(pastiConsegnati(fabio, "2026-10-03").map((p) => `${p.data} ${p.pasto}`)).toEqual([
      "2026-10-03 colazione", "2026-10-03 pranzo", "2026-10-03 cena",
      "2026-10-05 colazione", "2026-10-05 pranzo", "2026-10-05 cena",
    ]);
    // martedi' 6: tre giorni pieni, nove pasti
    expect(pastiConsegnati(fabio, "2026-10-06")).toHaveLength(9);
    // una consegna che cade di domenica porta comunque i pasti dei due giorni dopo
    const dallaDomenica = abb("dom", "2026-10-04", { subscription: scelta("full6") });
    expect(pastiConsegnati(dallaDomenica, "2026-10-04").map((p) => p.data)).toEqual([
      "2026-10-05", "2026-10-05", "2026-10-05", "2026-10-06", "2026-10-06", "2026-10-06",
    ]);
    expect(ids(abbonamentiDelGiorno([dallaDomenica], "2026-10-04"))).toEqual(["dom"]);
  });

  it("Full 7: nove pasti a consegna, colazioni comprese", () => {
    const pasti = pastiConsegnati(elisa, "2026-10-01");
    expect(pasti).toHaveLength(9);
    expect(pasti.filter((p) => p.pasto === "colazione")).toHaveLength(3);
    expect(frasePasti(pasti)).toBe("9 pasti: 3 colazioni, 3 pranzi, 3 cene");
  });

  it("scrive i pasti a parole e li divide per giorno", () => {
    expect(frasePasti([{ data: "2026-10-05", pasto: "pranzo" }])).toBe("1 pranzo");
    expect(frasePasti(pastiConsegnati(anna, "2026-10-05"))).toBe("3 pranzi");
    expect(frasePasti(pastiConsegnati(giulia, "2026-10-04"))).toBe("6 pasti: 3 pranzi, 3 cene");
    expect(frasePasti([])).toBe("nessun pasto");
    expect(pastiPerGiorno(pastiConsegnati(fabio, "2026-10-03"))).toEqual([
      { data: "2026-10-03", pasti: ["colazione", "pranzo", "cena"] },
      { data: "2026-10-05", pasti: ["colazione", "pranzo", "cena"] },
    ]);
  });

  it("conta i pasti delle consegne del giorno e quelli ancora da comporre (senza piatto indicato)", () => {
    const giorno = "2026-10-04";
    const lista = abbonamentiDelGiorno(tutti, giorno);
    // Elisa 9 + Giulia 6 + Sara 2 (Pranzo: lunedi' e martedi')
    expect(contaPastiAbbonamenti(lista, giorno)).toBe(17);
    // l'unico piatto indicato e' il pranzo di lunedi' di Giulia
    expect(pastiDaComporre(lista, giorno)).toBe(16);
    expect(contaPastiAbbonamenti([], giorno)).toBe(0);
  });

  it("trova il piatto indicato per quel giorno della settimana e quel pasto", () => {
    expect(vocePasto(giulia, "2026-10-05", "pranzo")?.name).toBe("Riso"); // lunedi'
    expect(vocePasto(giulia, "2026-10-05", "cena")).toBeNull(); // la cena di lunedi' non l'ha indicata
    expect(vocePasto(giulia, "2026-10-12", "pranzo")?.name).toBe("Riso"); // ogni lunedi'
    expect(vocePasto(giulia, "2026-10-06", "pranzo")).toBeNull(); // martedi'
    expect(vocePasto(giulia, "2026-10-05", "colazione")).toBeNull(); // il compositore non ha la colazione
  });

  it("i pasti di una consegna portano ciascuno il suo piatto e la sua data", () => {
    const pasti = pastiInConsegna(giulia, "2026-10-04");
    expect(pasti.map((p) => [p.quando, p.voce?.name ?? null])).toEqual([
      ["Domenica 4/10 · pranzo", null],
      ["Domenica 4/10 · cena", null],
      ["Lunedì 5/10 · pranzo", "Riso"],
      ["Lunedì 5/10 · cena", null],
      ["Martedì 6/10 · pranzo", null],
      ["Martedì 6/10 · cena", null],
    ]);
    // Se la consegna copre un giorno solo, la data non serve
    expect(pastiInConsegna(giulia, "2026-10-31").map((p) => p.quando)).toEqual(["Sabato · pranzo", "Sabato · cena"]);
    expect(pastiInConsegna(giulia, "2026-10-02")).toEqual([]);
  });

  it("una consegna si legge giorno per giorno, con il piatto di ogni pasto", () => {
    const giorni = pastiInConsegnaPerGiorno(giulia, "2026-10-04");
    expect(giorni.map((g) => g.data)).toEqual(["2026-10-04", "2026-10-05", "2026-10-06"]);
    expect(giorni[1].pasti.map((p) => [p.pasto, p.voce?.name ?? null])).toEqual([["pranzo", "Riso"], ["cena", null]]);
    // Full 6: la domenica libera non e' un giorno della consegna
    expect(pastiInConsegnaPerGiorno(fabio, "2026-10-03").map((g) => g.data)).toEqual(["2026-10-03", "2026-10-05"]);
    expect(pastiInConsegnaPerGiorno(giulia, "2026-10-02")).toEqual([]);
  });

  it("i piatti indicati contano in ogni pasto del blocco, non solo nel giorno della consegna", () => {
    // Consegna di domenica 4: il pranzo di lunedi' 5 (Riso + Pasta) viaggia con lei.
    const comeOrdini = pastiComeOrdini(abbonamentiDelGiorno(tutti, "2026-10-04"), "2026-10-04");
    const dellaGiulia = comeOrdini.find((o) => o.id === "giulia");
    expect(dellaGiulia?.items.map((v) => v.name)).toEqual(["Riso"]);
    expect(dellaGiulia?.meals).toBe(6);
    expect(contaPiatti(comeOrdini).map((p) => [p.id, p.porzioni])).toEqual([["riso-julien-pollo-teriyaki", 1]]);
    expect(contaExtra(comeOrdini).map((e) => [e.nome, e.quanti])).toEqual([["Pasta", 1]]);
    // Consegna di mercoledi' 7: c'e' il pranzo di mercoledi' (Uova), non quello di lunedi'
    const mercoledi = pastiComeOrdini(abbonamentiDelGiorno([giulia], "2026-10-07"), "2026-10-07");
    expect(contaPiatti(mercoledi).map((p) => p.id)).toEqual(["uova-purgatorio-peperoni"]);
    // la spesa moltiplica la ricetta: un solo pranzo con piatto, tutto il resto da comporre
    const spesa = listaSpesa(comeOrdini).reparti.flatMap((r) => r.voci);
    expect(spesa.find((v) => v.nome === "Petto di pollo")?.grammi).toBe(200);
    // gli allergeni sono quelli del piatto indicato e dei suoi extra
    expect(allergeniDelGiorno(comeOrdini).find((a) => a.allergene === "glutine")?.porzioni).toBe(1);
  });

  it("non conta un piatto indicato per un pasto che la formula non ha", () => {
    // Pranzo non ha la cena: una cena indicata dal cliente non e' nel blocco e non si cucina.
    const conCena = abb("conc", "2026-10-05", { subscription: scelta("pranzo"), items: [
      { id: "uova-purgatorio-peperoni", name: "Uova", day: "lun", meal: "cena", extras: [] },
      { id: "riso-julien-pollo-teriyaki", name: "Riso", day: "lun", meal: "pranzo", extras: [] },
    ] });
    const comeOrdini = pastiComeOrdini([conCena], "2026-10-05");
    expect(comeOrdini[0].items.map((v) => v.name)).toEqual(["Riso"]);
    expect(comeOrdini[0].meals).toBe(3);
  });

  it("fa una etichetta per pasto: il piatto indicato, o Colazione/Pranzo/Cena in abbonamento con allergeni da verificare", () => {
    const el = etichetteAbbonamenti(abbonamentiDelGiorno([giulia, elisa], "2026-10-01"), "2026-10-01");
    // Elisa (Full 7): giovedi' 1, venerdi' 2, sabato 3 = 9 etichette; Giulia (Completo): 6
    expect(el).toHaveLength(15);
    expect(el.filter((e) => e.cliente === "Elisa")[0]).toMatchObject({
      piatto: PASTO_IN_ABBONAMENTO.colazione, quando: "Gio 1/10 · colazione · abbonamento", allergeni: null,
    });
    expect(el.filter((e) => e.cliente === "Giulia").map((e) => e.piatto)).toEqual([
      PASTO_IN_ABBONAMENTO.pranzo, PASTO_IN_ABBONAMENTO.cena,
      PASTO_IN_ABBONAMENTO.pranzo, PASTO_IN_ABBONAMENTO.cena,
      PASTO_IN_ABBONAMENTO.pranzo, PASTO_IN_ABBONAMENTO.cena,
    ]);
    expect(new Set(el.map((e) => e.chiave)).size).toBe(el.length); // ogni etichetta ha la sua chiave
    expect(PASTO_IN_ABBONAMENTO).toEqual({ colazione: "Colazione in abbonamento", pranzo: "Pranzo in abbonamento", cena: "Cena in abbonamento" });

    // una consegna che copre un giorno solo non ha bisogno della data: "Sabato · pranzo · abbonamento"
    expect(etichetteAbbonamenti([giulia], "2026-10-31").map((e) => e.quando)).toEqual([
      "Sabato · pranzo · abbonamento", "Sabato · cena · abbonamento",
    ]);

    const domenica = etichetteAbbonamenti([giulia], "2026-10-04");
    const lunedi = domenica.find((e) => e.quando.startsWith("Lun 5/10 · pranzo"));
    expect(lunedi).toMatchObject({ cliente: "Giulia", piatto: "Riso carote e zucchine julien, pollo teriyaki", extra: ["Pasta"] });
    expect(lunedi?.allergeni).toEqual(["glutine", "sesamo", "soia"]);
  });

  it("a Full 7 servono 9 etichette per consegna: reggono i fogli da 21", () => {
    const el = etichetteAbbonamenti([elisa, { ...elisa, id: "elisa2" }, { ...elisa, id: "elisa3" }], "2026-10-01");
    expect(el).toHaveLength(27);
    expect(inFogli(el)).toHaveLength(2);
  });

  it("il nome dell'abbonamento e' la formula con la fascia; uno vecchio e' un Pranzo", () => {
    expect(nomeAbbonamento(giulia)).toBe("Completo · Plus");
    expect(nomeAbbonamento(anna)).toBe("Pranzo");
    expect(dettaglioAbbonamento({ ...giulia, subscription: { plan: "completo", tier: "plus", household: "coppia", trial: true } })).toBe(
      "Completo · Plus · in coppia · con la settimana di prova",
    );
    expect(dettaglioAbbonamento(giulia)).toBe("Completo · Plus · da solo");
    expect(dettaglioAbbonamento(anna)).toBe("Pranzo");
  });

  it("il calendario di un abbonamento: periodo, pasti e giorni di consegna", () => {
    const c = calendarioAbbonamento("completo", "2026-10-01");
    expect(c).toMatchObject({ dal: "2026-10-01", al: "2026-10-31", pasti: 62 });
    expect(c.consegne).toHaveLength(11);
    expect([c.consegne[0], c.consegne[1], c.consegne[10]]).toEqual(["2026-10-01", "2026-10-04", "2026-10-31"]);
    // un Pranzo che finisce di sabato ha una consegna in meno
    expect(calendarioAbbonamento("pranzo", "2026-10-01")).toMatchObject({ pasti: 22 });
    expect(calendarioAbbonamento("pranzo", "2026-10-01").consegne).toHaveLength(10);
    expect(calendarioAbbonamento("full7", "2026-10-01").pasti).toBe(93);
  });

  it("i pasti del periodo servono a dire quanto vale l'abbonamento", () => {
    expect(pastiDelPeriodo(giulia)).toBe(62);
    expect(pastiDelPeriodo(elisa)).toBe(93);
    expect(pastiDelPeriodo(abb("x", null))).toBeNull();
    expect(pastiDelPeriodo(normale)).toBeNull();
  });
});

describe("lista della spesa", () => {
  it("moltiplica la ricetta per le porzioni e passa ai chili sopra i 1000 g", () => {
    const lista = listaSpesa([
      ordine("a", { items: Array.from({ length: 6 }, () => ({ id: "riso-julien-pollo-teriyaki", name: "Riso", day: "lun", meal: "pranzo", extras: ["Pasta"] })) }),
    ]);
    const tutte = lista.reparti.flatMap((r) => r.voci);
    expect(tutte.find((v) => v.nome === "Petto di pollo")?.grammi).toBe(1200);
    expect(formattaPeso(1200)).toBe("1,2 kg");
    expect(formattaPeso(1250)).toBe("1,25 kg");
    expect(formattaPeso(999)).toBe("999 g");
    // Gli extra (Pasta) non entrano nella spesa.
    expect(tutte.some((v) => v.nome === "Pasta")).toBe(false);
    expect(lista.reparti.map((r) => r.reparto)).toEqual(["Frutta e verdura", "Carne e pesce", "Pasta, riso e pane", "Dispensa e condimenti"]);
  });

  it("unisce lo stesso ingrediente scritto in due modi e tiene a parte pezzi e q.b.", () => {
    const lista = listaSpesa([
      ordine("a", { items: [
        { id: "noodles-sesamo-maiale", name: "Noodles", day: "lun", meal: "pranzo", extras: [] },
        { id: "riso-julien-pollo-teriyaki", name: "Riso", day: "lun", meal: "cena", extras: [] },
        { id: "uova-purgatorio-peperoni", name: "Uova", day: "mar", meal: "pranzo", extras: [] },
        { id: "uova-purgatorio-peperoni", name: "Uova", day: "mar", meal: "cena", extras: [] },
      ] }),
    ]);
    const verdura = lista.reparti.find((r) => r.reparto === "Frutta e verdura")?.voci ?? [];
    expect(verdura.find((v) => v.nome === "Carota")?.grammi).toBe(70 + 180);
    expect(verdura.find((v) => v.nome === "Peperone")?.grammi).toBe(70 + 200 * 2);
    expect(lista.pezzi.find((v) => v.nome === "Uova")).toMatchObject({ quantita: 6, unita: "" });
    expect(lista.pezzi.find((v) => v.nome === "Aglio")).toMatchObject({ quantita: 3, unita: "spicchio" });
    expect(formattaPezzi(3, "spicchio")).toBe("3 spicchi");
    expect(formattaPezzi(1, "spicchio")).toBe("1 spicchio");
    expect(formattaPezzi(6, "")).toBe("6 pz");
    expect(lista.qb.map((v) => v.nome)).toContain("Paprika");
  });

  it("un ingrediente comprato a peso o a pezzi non compare anche come q.b.", () => {
    // Noodles: aglio "1 spicchio", prezzemolo q.b.; Maiale: aglio q.b.; Gnocchetti: parmigiano 50 g; Pallotte: parmigiano q.b.
    const lista = listaSpesa([
      ordine("a", { items: [
        { id: "noodles-sesamo-maiale", name: "Noodles", day: "lun", meal: "pranzo", extras: [] },
        { id: "maiale-senape-spinaci", name: "Maiale", day: "lun", meal: "cena", extras: [] },
        { id: "gnocchetti-sugo-ricotta", name: "Gnocchetti", day: "mar", meal: "pranzo", extras: [] },
        { id: "pallotte-cacio-ovo", name: "Pallotte", day: "mar", meal: "cena", extras: [] },
      ] }),
    ]);
    const nomi = (voci: { nome: string }[]) => voci.map((v) => v.nome);
    expect(lista.pezzi.find((v) => v.nome === "Aglio")).toMatchObject({ quantita: 2, unita: "spicchio" });
    expect(nomi(lista.qb)).not.toContain("Aglio");
    expect(lista.reparti.flatMap((r) => r.voci).find((v) => v.nome === "Parmigiano")?.grammi).toBe(50);
    expect(nomi(lista.qb)).not.toContain("Parmigiano");
    // Quello che si compra solo q.b. resta nella sua lista.
    expect(nomi(lista.qb)).toEqual(expect.arrayContaining(["Prezzemolo", "Rosmarino"]));
  });

  it("segnala i piatti che non sono nel catalogo", () => {
    const lista = listaSpesa([ordine("a", { items: [{ id: "piatto-sparito", name: "Piatto vecchio", day: "lun", meal: "pranzo", extras: [] }] })]);
    expect(lista.sconosciuti).toEqual([{ nome: "Piatto vecchio", porzioni: 1 }]);
  });

  it("legge le note della ricetta e mette gli ingredienti nel reparto giusto", () => {
    expect(leggiNota("1 spicchio")).toEqual({ n: 1, unita: "spicchio" });
    expect(leggiNota("2")).toEqual({ n: 2, unita: "" });
    expect(leggiNota("q.b.")).toBeNull();
    expect(repartoDi("Peperone")).toBe("Frutta e verdura");
    expect(repartoDi("Pepe bianco")).toBe("Dispensa e condimenti");
    expect(repartoDi("Zucchero di cocco")).toBe("Dispensa e condimenti");
    expect(repartoDi("Formaggio tipo quark")).toBe("Latticini e uova");
    expect(repartoDi("Qualcosa di strano")).toBe("Altro");
  });
});

describe("clienti con allergie nel foglio", () => {
  const conPref = (id: string, modifiche: Partial<Ordine> = {}) =>
    ordine(id, { user_id: "marco", customer_name: "Marco", dietary_preferences: "allergia alle arachidi", ...modifiche });

  it("unisce lo stesso cliente che ha un ordine e un abbonamento nello stesso giorno", () => {
    const righe = clientiConPreferenze([conPref("o1"), conPref("o2"), ordine("senza"), conPref("o3", { user_id: "giulia", customer_name: "Giulia", dietary_preferences: "  niente lattosio " })]);
    expect(righe.map((r) => [r.cliente, r.preferenze, r.ordini])).toEqual([
      ["Marco", "allergia alle arachidi", 2],
      ["Giulia", "niente lattosio", 1],
    ]);
  });

  it("non fonde persone diverse intestate allo stesso account (ordini a mano di Matteo) e conta una volta lo stesso ordine", () => {
    const righe = clientiConPreferenze([
      conPref("a", { user_id: "matteo", customer_name: "Anna" }),
      conPref("b", { user_id: "matteo", customer_name: "Bruno" }),
      conPref("a", { user_id: "matteo", customer_name: "Anna" }),
    ]);
    expect(righe.map((r) => [r.cliente, r.ordini])).toEqual([["Anna", 1], ["Bruno", 1]]);
  });
});

describe("etichette", () => {
  it("fa una etichetta per porzione, in ordine di calendario, con gli allergeni degli extra", () => {
    const lista = etichette([
      ordine("anna", { items: [
        { id: "riso-julien-pollo-teriyaki", name: "Riso", day: "mar", meal: "cena", extras: [] },
        { id: "riso-julien-pollo-teriyaki", name: "Riso", day: "lun", meal: "pranzo", extras: ["Pasta"] },
      ] }),
    ]);
    expect(lista.map((e) => e.quando)).toEqual(["Lunedì · pranzo", "Martedì · cena"]);
    expect(lista[0].allergeni).toEqual(["glutine", "sesamo", "soia"]);
    expect(lista[1].allergeni).toEqual(["sesamo", "soia"]);
  });

  it("divide in fogli da 21 lasciando vuote le caselle gia' usate", () => {
    const voci = Array.from({ length: 25 }, (_, i) => i);
    const fogli = inFogli(voci, 5);
    expect(fogli).toHaveLength(2);
    expect(fogli[0]).toHaveLength(ETICHETTE_PER_FOGLIO);
    expect(fogli[0].slice(0, 5)).toEqual([null, null, null, null, null]);
    expect(fogli[1]).toHaveLength(30 - ETICHETTE_PER_FOGLIO);
    expect(inFogli([], 3)).toEqual([]);
  });
});

describe("clienti", () => {
  const clienti = [
    cliente("Nicolò Verdi", { orders: 3, activeOrders: 1, spentCents: 9000, lastOrderAt: "2026-09-20 10:00:00", phone: "+39 333 111 2222" }),
    cliente("Anna Bianchi", { createdAt: "2026-09-25 09:00:00" }),
    cliente("Zeno Rossi", { orders: 5, spentCents: 4000, emailVerified: false, lastOrderAt: "2026-08-01 10:00:00" }),
  ];

  it("cerca senza accenti e per telefono", () => {
    expect(filtraClienti(clienti, { cerca: "nicolo" }).map((c) => c.name)).toEqual(["Nicolò Verdi"]);
    expect(filtraClienti(clienti, { cerca: "1112222" }).map((c) => c.name)).toEqual(["Nicolò Verdi"]);
  });

  it("filtra e ordina", () => {
    expect(filtraClienti(clienti, { filtro: "aperti" }).map((c) => c.name)).toEqual(["Nicolò Verdi"]);
    expect(filtraClienti(clienti, { filtro: "senza-ordini" }).map((c) => c.name)).toEqual(["Anna Bianchi"]);
    expect(filtraClienti(clienti, { filtro: "non-verificati" }).map((c) => c.name)).toEqual(["Zeno Rossi"]);
    // Il 27 settembre: Zeno ha ordinato l'ultima volta il 1 agosto e non ha niente in corso; Nicolo' ha un ordine aperto.
    const adesso = Date.parse("2026-09-27T12:00:00Z");
    expect(filtraClienti(clienti, { filtro: "da-ricontattare", adesso }).map((c) => c.name)).toEqual(["Zeno Rossi"]);
    expect(filtraClienti(clienti, { ordine: "recenti" }).map((c) => c.name)).toEqual(["Anna Bianchi", "Nicolò Verdi", "Zeno Rossi"]);
    expect(filtraClienti(clienti, { ordine: "ordini" }).map((c) => c.name)).toEqual(["Zeno Rossi", "Nicolò Verdi", "Anna Bianchi"]);
    expect(filtraClienti(clienti, { ordine: "spesa" }).map((c) => c.name)).toEqual(["Nicolò Verdi", "Zeno Rossi", "Anna Bianchi"]);
    expect(filtraClienti(clienti, { ordine: "nome" }).map((c) => c.name)).toEqual(["Anna Bianchi", "Nicolò Verdi", "Zeno Rossi"]);
  });

  it("conta i nuovi degli ultimi 30 giorni", () => {
    expect(nuoviClienti(clienti, 30, new Date("2026-09-27T12:00:00Z"))).toBe(3);
    expect(nuoviClienti(clienti, 5, new Date("2026-09-27T12:00:00Z"))).toBe(1);
  });

  it("scrive un CSV per l'Excel italiano, al riparo dalle formule", () => {
    expect(cellaCsv("Via Roma; 3")).toBe('"Via Roma; 3"');
    expect(cellaCsv('Detto "Il Rosso"')).toBe('"Detto ""Il Rosso"""');
    expect(cellaCsv("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(cellaCsv("+39 333")).toBe("'+39 333");
    const csv = clientiCsv([clienti[0]]);
    expect(csv.startsWith("﻿Nome;Email;")).toBe(true);
    expect(csv).toContain("\r\n");
    expect(csv).toContain(";90,00;");
  });
});

describe("messaggi", () => {
  const m: MessaggioContatto = {
    id: "1", name: "Giulia Neri", email: "giulia@example.com", phone: "", comune: "Pescara",
    topic: "consegna", message: "Consegnate a Montesilvano?\nGrazie", status: "new", user_id: null,
    created_at: "2026-09-27 08:00:00", updated_at: "2026-09-27 08:00:00",
  };

  it("prepara oggetto e testo citato della risposta", () => {
    expect(oggettoRisposta(m)).toBe("Re: FUEL LAB – Consegna e ritiro");
    const corpo = corpoRisposta(m);
    expect(corpo.startsWith("Ciao Giulia,")).toBe(true);
    expect(corpo).toContain("> Consegnate a Montesilvano?\n> Grazie");
    expect(corpo).toContain("27 settembre");
  });

  it("costruisce un mailto con oggetto e corpo codificati", () => {
    const link = mailtoRisposta(m);
    expect(link.startsWith("mailto:giulia@example.com?subject=Re%3A%20FUEL%20LAB")).toBe(true);
    expect(decodeURIComponent(link.split("&body=")[1])).toBe(corpoRisposta(m));
  });
});

describe("euro tondi", () => {
  it("arrotonda all'euro per i riquadri", () => {
    expect(euroTondo(254049).replace(/\s/g, " ")).toBe("2540 €");
    expect(euroTondo(99).replace(/\s/g, " ")).toBe("1 €");
  });
});

describe("assi dei grafici", () => {
  it("sceglie tacche tonde", () => {
    expect(tacche(0)).toEqual([0, 1]);
    expect(tacche(3)).toEqual([0, 1, 2, 3]);
    expect(tacche(7)).toEqual([0, 2, 4, 6, 8]);
    expect(tacche(1234)).toEqual([0, 500, 1000, 1500]);
  });
});
