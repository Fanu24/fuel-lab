import { describe, expect, it } from "vitest";
import type { Chiusura, ClienteAdmin, MessaggioContatto, Ordine } from "./api";
import {
  PRANZO_IN_ABBONAMENTO,
  abbonamentiDelGiorno,
  allergeniDelGiorno,
  cellaCsv,
  clientiCsv,
  confermatiSenzaGiorno,
  contaExtra,
  contaPiatti,
  contaPorzioni,
  corpoRisposta,
  dataBreve,
  etichette,
  etichetteAbbonamenti,
  filtraClienti,
  euroTondo,
  formattaPeso,
  formattaPezzi,
  giornoPredefinito,
  giorniConOrdini,
  inFogli,
  isData,
  leggiNota,
  listaSpesa,
  mailtoRisposta,
  nuoviClienti,
  oggettoRisposta,
  oggiRoma,
  ordiniDelGiorno,
  pranziComeOrdini,
  pranzoInAbbonamento,
  primoGiornoDiCucina,
  repartoDi,
  spostaGiorni,
  tacche,
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
    expect(sesamo?.fonti).toEqual(["Riso carote e zucchine julien, pollo teriyaki", "Tahina"]);
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

describe("abbonamenti in cucina", () => {
  // Giulia: dal 1 al 31 ottobre, ha indicato il pranzo del lunedi' e del mercoledi'.
  const giulia = ordine("giulia", {
    service: "abbonamento", customer_name: "Giulia", production_date: "2026-10-01", fulfillment_date: "2026-10-01",
    notes: "Pesi lun-mer-ven, 140 g di proteine", dietary_preferences: "Senza lattosio",
    items: [
      { id: "riso-julien-pollo-teriyaki", name: "Riso", day: "lun", meal: "pranzo", extras: ["Pasta"] },
      { id: "uova-purgatorio-peperoni", name: "Uova", day: "mer", meal: "pranzo", extras: [] },
    ],
  });
  // Anna: dal 5 al 4 novembre, nessun piatto indicato.
  const anna = ordine("anna", { service: "abbonamento", customer_name: "Anna", production_date: "2026-10-05", fulfillment_date: "2026-10-05", items: [] });
  const tutti = [
    giulia,
    anna,
    ordine("richiesta", { service: "abbonamento", status: "requested", production_date: null, fulfillment_date: null, requested_date: "2026-10-01" }),
    ordine("annullato", { service: "abbonamento", status: "cancelled", production_date: "2026-10-01", fulfillment_date: "2026-10-01" }),
    ordine("concluso", { service: "abbonamento", status: "completed", production_date: "2026-10-01", fulfillment_date: "2026-10-01" }),
    ordine("normale", { production_date: "2026-10-05", fulfillment_date: "2026-10-05" }),
  ];

  it("prende gli abbonamenti in corso il cui periodo comprende il giorno, dal lunedi' al venerdi'", () => {
    expect(abbonamentiDelGiorno(tutti, "2026-10-01").map((o) => o.id)).toEqual(["giulia"]); // giovedi', primo giorno
    expect(abbonamentiDelGiorno(tutti, "2026-10-05").map((o) => o.id)).toEqual(["anna", "giulia"]); // lunedi', per nome
    expect(abbonamentiDelGiorno(tutti, "2026-10-03")).toEqual([]); // sabato
    expect(abbonamentiDelGiorno(tutti, "2026-10-31")).toEqual([]); // sabato, ultimo giorno di Giulia
    expect(abbonamentiDelGiorno(tutti, "2026-10-30").map((o) => o.id)).toEqual(["anna", "giulia"]);
    expect(abbonamentiDelGiorno(tutti, "2026-11-02").map((o) => o.id)).toEqual(["anna"]); // Giulia e' finita
    expect(abbonamentiDelGiorno(tutti, "2026-11-05")).toEqual([]); // Anna finisce il 4
    expect(abbonamentiDelGiorno(tutti, "2026-09-30")).toEqual([]); // prima dell'inizio
    // anche in preparazione o pronto, mai da confermare, annullato o concluso
    expect(abbonamentiDelGiorno([{ ...giulia, status: "ready" }], "2026-10-02").map((o) => o.id)).toEqual(["giulia"]);
  });

  it("non finisce fra gli ordini del giorno d'inizio", () => {
    expect(ordiniDelGiorno(tutti, "2026-10-05").map((o) => o.id)).toEqual(["normale"]);
    expect(giorniConOrdini(tutti, "2026-10-01")).toEqual([{ giorno: "2026-10-05", ordini: 1, porzioni: 1 }]);
    expect(giornoPredefinito(tutti, "2026-10-02")).toBe("2026-10-02"); // venerdi': c'e' il pranzo di Giulia
  });

  it("trova il pranzo indicato per quel giorno della settimana e lo conta come una porzione", () => {
    expect(pranzoInAbbonamento(giulia, "2026-10-05")?.name).toBe("Riso"); // lunedi'
    expect(pranzoInAbbonamento(giulia, "2026-10-06")).toBeNull(); // martedi'
    const comeOrdini = pranziComeOrdini(abbonamentiDelGiorno(tutti, "2026-10-05"), "2026-10-05");
    expect(comeOrdini.map((o) => o.items.length)).toEqual([0, 1]);
    expect(contaPiatti(comeOrdini).map((p) => [p.id, p.porzioni])).toEqual([["riso-julien-pollo-teriyaki", 1]]);
  });

  it("fa una etichetta per pranzo: il piatto indicato, o Pranzo in abbonamento con allergeni da verificare", () => {
    const lunedi = etichetteAbbonamenti(abbonamentiDelGiorno(tutti, "2026-10-05"), "2026-10-05");
    expect(lunedi.map((e) => [e.cliente, e.piatto, e.quando])).toEqual([
      ["Anna", PRANZO_IN_ABBONAMENTO, "Lunedì · pranzo · abbonamento"],
      ["Giulia", "Riso carote e zucchine julien, pollo teriyaki", "Lunedì · pranzo · abbonamento"],
    ]);
    expect(lunedi[0].allergeni).toBeNull();
    expect(lunedi[1].allergeni).toEqual(["glutine", "sesamo", "soia"]);
    expect(lunedi[1].extra).toEqual(["Pasta"]);
    expect(new Set(lunedi.map((e) => e.chiave)).size).toBe(2);
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
