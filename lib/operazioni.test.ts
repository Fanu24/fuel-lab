import { describe, expect, it } from "vitest";
import type { Ordine } from "./api";
import {
  azioniDaFare,
  calendario,
  centesimiInTesto,
  codeOperative,
  contaPerStato,
  contaVoci,
  corrisponde,
  daIncassare,
  dateSuggerite,
  eGiornoDiCucina,
  elencoNomi,
  filtraOrdini,
  inRitardo,
  leggiEuro,
  leggiFiltroSpeciale,
  leggiFiltroStato,
  oggiRoma,
  ordiniCsv,
  prossimaAzione,
  prossimiGiorniCucina,
  spostaGiorni,
  testoWhatsApp,
  vociPerGiorno,
} from "./operazioni";

/* Domenica 27 settembre 2026: il prossimo lunedi e' il 28, il giovedi l'1 ottobre. */
const OGGI = "2026-09-27";

const ordine = (id: string, modifiche: Partial<Ordine> = {}): Ordine => ({
  id,
  user_id: `u-${id}`,
  email: `${id}@example.com`,
  status: "requested",
  service: "menu-settimana",
  fulfillment: "pickup",
  requested_date: null,
  production_date: null,
  fulfillment_date: null,
  customer_name: id,
  phone: "333 123 4567",
  comune: "Pescara",
  address: "",
  notes: "",
  internal_note: "",
  customer_message: "",
  price_cents: null,
  paid: 0,
  dietary_preferences: null,
  meals: 2,
  created_at: "2026-09-26 10:00:00",
  updated_at: "2026-09-26 10:00:00",
  items: [
    { id: "pollo", name: "Pollo e riso", day: "lun", meal: "pranzo", extras: ["Verdure"] },
    { id: "salmone", name: "Salmone", day: "lun", meal: "cena", extras: [] },
  ],
  ...modifiche,
});

describe("date e giorni di cucina", () => {
  it("oggi e' calcolato nel fuso di Roma", () => {
    expect(oggiRoma(new Date("2026-09-27T21:30:00Z"))).toBe("2026-09-27");
    expect(oggiRoma(new Date("2026-09-27T22:30:00Z"))).toBe("2026-09-28");
  });

  it("sposta i giorni senza inciampare nel cambio dell'ora", () => {
    expect(spostaGiorni("2026-10-24", 2)).toBe("2026-10-26");
    expect(spostaGiorni("2026-10-01", -1)).toBe("2026-09-30");
  });

  it("i giorni di cucina sono lunedi e giovedi, oggi compreso", () => {
    expect(eGiornoDiCucina("2026-09-28")).toBe(true);
    expect(eGiornoDiCucina("2026-10-01")).toBe(true);
    expect(eGiornoDiCucina(OGGI)).toBe(false);
    expect(prossimiGiorniCucina(OGGI, 3)).toEqual(["2026-09-28", "2026-10-01", "2026-10-05"]);
    expect(prossimiGiorniCucina("2026-09-28", 1)).toEqual(["2026-09-28"]);
  });

  it("propone il primo giorno di cucina dopo la data chiesta dal cliente", () => {
    expect(dateSuggerite(ordine("a"), OGGI)).toEqual({ produzione: "2026-09-28", uscita: "2026-09-28" });
    expect(dateSuggerite(ordine("b", { requested_date: "2026-09-30" }), OGGI)).toEqual({ produzione: "2026-10-01", uscita: "2026-10-01" });
    // una data preferita gia' passata non conta
    expect(dateSuggerite(ordine("c", { requested_date: "2026-09-20" }), OGGI)).toEqual({ produzione: "2026-09-28", uscita: "2026-09-28" });
  });

  it("non tocca le date gia' scritte e non mette la cucina dopo l'uscita", () => {
    expect(dateSuggerite(ordine("a", { production_date: "2026-10-01" }), OGGI)).toEqual({ produzione: "2026-10-01", uscita: "2026-10-01" });
    expect(dateSuggerite(ordine("b", { fulfillment_date: "2026-09-30" }), OGGI)).toEqual({ produzione: "2026-09-28", uscita: "2026-09-30" });
    expect(dateSuggerite(ordine("c", { production_date: "2026-10-01", fulfillment_date: "2026-10-02" }), OGGI))
      .toEqual({ produzione: "2026-10-01", uscita: "2026-10-02" });
  });
});

describe("prossima azione", () => {
  it("segue il giro Conferma, Preparazione, Pronto, Consegnato", () => {
    expect(prossimaAzione("requested")?.stato).toBe("confirmed");
    expect(prossimaAzione("confirmed")?.stato).toBe("preparing");
    expect(prossimaAzione("preparing")?.stato).toBe("ready");
    expect(prossimaAzione("ready", "pickup")).toMatchObject({ stato: "completed", verbo: "Segna ritirato" });
    expect(prossimaAzione("ready", "delivery")).toMatchObject({ stato: "completed", verbo: "Segna consegnato" });
    expect(prossimaAzione("completed")).toBeNull();
    expect(prossimaAzione("cancelled")).toBeNull();
  });
});

describe("prezzo in euro", () => {
  it("legge la virgola, il punto e le migliaia all'italiana", () => {
    expect(leggiEuro("")).toBeNull();
    expect(leggiEuro("  ")).toBeNull();
    expect(leggiEuro("45")).toBe(4500);
    expect(leggiEuro("45,5")).toBe(4550);
    expect(leggiEuro("45,50")).toBe(4550);
    expect(leggiEuro("45.50")).toBe(4550);
    expect(leggiEuro("€ 12,05")).toBe(1205);
    expect(leggiEuro("1.250")).toBe(125000);
    expect(leggiEuro("1.250,00")).toBe(125000);
  });

  it("rifiuta il testo che non e' un prezzo", () => {
    expect(leggiEuro("dieci")).toBeUndefined();
    expect(leggiEuro("12,345")).toBeUndefined();
    expect(leggiEuro("-5")).toBeUndefined();
  });

  it("riscrive i centesimi per il campo", () => {
    expect(centesimiInTesto(4550)).toBe("45,50");
    expect(centesimiInTesto(5)).toBe("0,05");
    expect(centesimiInTesto(null)).toBe("");
  });
});

describe("code operative di Matteo", () => {
  it("separa la preferenza del cliente dalla produzione confermata", () => {
    const c = codeOperative([
      ordine("nuova", { requested_date: "2026-09-28" }),
      ordine("oggi", { status: "confirmed", production_date: OGGI, fulfillment_date: "2026-09-28" }),
    ], OGGI);
    expect(c.daConfermare.map((o) => o.id)).toEqual(["nuova"]);
    expect(c.cucinaOggi.map((o) => o.id)).toEqual(["oggi"]);
    expect(c.porzioniOggi).toBe(2);
  });

  it("evidenzia date mancanti e ritardi senza contare gli ordini chiusi", () => {
    const c = codeOperative([
      ordine("senza-data", { status: "confirmed" }),
      ordine("ritardo", { status: "ready", production_date: "2026-09-24", fulfillment_date: "2026-09-25" }),
      ordine("chiuso", { status: "completed", production_date: "2026-09-24", fulfillment_date: "2026-09-25" }),
    ], OGGI);
    expect(c.senzaDate.map((o) => o.id)).toEqual(["senza-data"]);
    expect(c.inRitardo.map((o) => o.id)).toEqual(["ritardo"]);
    expect(c.aperti).toHaveLength(2);
  });

  it("le uscite di oggi restano in lista anche dopo la consegna", () => {
    const c = codeOperative([
      ordine("fatto", { status: "completed", production_date: OGGI, fulfillment_date: OGGI }),
      ordine("da-fare", { status: "ready", production_date: OGGI, fulfillment_date: OGGI }),
      ordine("annullato", { status: "cancelled", fulfillment_date: OGGI }),
    ], OGGI);
    expect(c.usciteOggi.map((o) => o.id)).toEqual(["fatto", "da-fare"]);
    expect(c.usciteDaFare.map((o) => o.id)).toEqual(["da-fare"]);
  });

  it("da incassare: prezzo scritto, non pagato, non annullato", () => {
    const c = codeOperative([
      ordine("deve", { status: "completed", price_cents: 4500 }),
      ordine("pagato", { status: "completed", price_cents: 4500, paid: 1 }),
      ordine("senza-prezzo", { status: "completed" }),
      ordine("annullato", { status: "cancelled", price_cents: 3000 }),
      ordine("pronto", { status: "ready", price_cents: 2000, production_date: OGGI, fulfillment_date: OGGI }),
    ], OGGI);
    expect(c.nonPagati.map((o) => o.id)).toEqual(["deve", "pronto"]);
    expect(c.consegnatiNonPagati.map((o) => o.id)).toEqual(["deve"]);
  });

  it("una richiesta e' in ritardo quando la data preferita e' passata", () => {
    expect(inRitardo(ordine("a", { requested_date: "2026-09-26" }), OGGI)).toBe(true);
    expect(inRitardo(ordine("b", { requested_date: OGGI }), OGGI)).toBe(false);
  });
});

describe("da fare adesso", () => {
  it("mette i ritardi in cima e scrive frasi con un verbo", () => {
    const azioni = azioniDaFare([
      ordine("Giulia", { price_cents: 4500, status: "completed" }),
      ordine("Marco", { status: "confirmed" }),
      ordine("Anna"),
      ordine("Luca"),
      ordine("Sara", { status: "preparing", production_date: "2026-09-24", fulfillment_date: "2026-09-25" }),
    ], OGGI, 1);
    expect(azioni.map((a) => a.id)).toEqual(["ritardo", "conferma", "date", "messaggi", "incassa"]);
    expect(azioni[0].testo).toBe("1 ordine in ritardo");
    expect(azioni[1].testo).toBe("Conferma 2 richieste nuove");
    expect(azioni[1].dettaglio).toBe("Anna e Luca");
    expect(azioni[1].href).toBe("/dashboard/ordini?stato=requested");
    expect(azioni[2].testo).toBe("Assegna le date a 1 ordine");
    expect(azioni[2].href).toBe("/dashboard/ordini?id=Marco");
    expect(azioni[3].testo).toBe("Rispondi a 1 messaggio");
    expect(azioni[4].testo).toMatch(/^Incassa 45,00\s€ da 1 ordine consegnato$/);
  });

  it("aggiunge cucina e uscite del giorno", () => {
    const azioni = azioniDaFare([
      ordine("a", { status: "confirmed", production_date: OGGI, fulfillment_date: OGGI, meals: 5 }),
      ordine("b", { status: "preparing", production_date: OGGI, fulfillment_date: OGGI, meals: 3, fulfillment: "delivery" }),
    ], OGGI);
    expect(azioni.map((a) => a.testo)).toEqual(["Cucina 8 porzioni oggi", "Consegna 2 ordini oggi"]);
    expect(azioni[1].dettaglio).toBe("1 ritiro · 1 consegna a domicilio");
  });

  it("niente da fare: lista vuota", () => {
    expect(azioniDaFare([], OGGI)).toEqual([]);
  });

  it("riassume i nomi senza allungare la riga", () => {
    const nomi = ["A", "B", "C", "D"].map((n) => ({ customer_name: n }));
    expect(elencoNomi(nomi.slice(0, 1))).toBe("A");
    expect(elencoNomi(nomi.slice(0, 3))).toBe("A, B e un altro");
    expect(elencoNomi(nomi)).toBe("A, B e altri 2");
  });
});

describe("calendario dei prossimi 7 giorni", () => {
  it("conta porzioni, uscite e richieste per giorno", () => {
    const giorni = calendario([
      ordine("a", { status: "confirmed", production_date: "2026-09-28", fulfillment_date: "2026-09-28", meals: 6 }),
      ordine("b", { status: "confirmed", production_date: "2026-09-28", fulfillment_date: "2026-09-29", meals: 4, fulfillment: "delivery" }),
      ordine("c", { requested_date: "2026-10-01" }),
      ordine("d", { status: "cancelled", production_date: "2026-09-28", fulfillment_date: "2026-09-28" }),
    ], OGGI);
    expect(giorni).toHaveLength(7);
    expect(giorni[0]).toMatchObject({ data: OGGI, oggi: true, cucina: false, porzioni: 0 });
    expect(giorni[1]).toMatchObject({ data: "2026-09-28", cucina: true, porzioni: 10, ordiniInCucina: 2, uscite: 1, ritiri: 1 });
    expect(giorni[2]).toMatchObject({ uscite: 1, consegne: 1 });
    expect(giorni[4]).toMatchObject({ data: "2026-10-01", cucina: true, richieste: 1 });
  });
});

describe("piatti", () => {
  it("somma piatti ed extra per il foglio cucina", () => {
    const lista = [ordine("a"), ordine("b")];
    expect(contaVoci(lista, "piatti")).toEqual([["Pollo e riso", 2], ["Salmone", 2]]);
    expect(contaVoci(lista, "extra")).toEqual([["Verdure", 2]]);
  });

  it("raggruppa per giorno in pranzo e cena, con gli allenamenti", () => {
    const giorni = vociPerGiorno(
      [
        { id: "x", name: "Bowl", day: "gio", meal: "pranzo", extras: [] },
        { id: "y", name: "Pollo", day: "lun", meal: "cena", extras: ["Riso"] },
      ],
      { lun: "pesi", mar: "cardio" },
    );
    expect(giorni.map((g) => g.giorno)).toEqual(["lun", "mar", "gio"]);
    expect(giorni[0]).toMatchObject({ nome: "Lunedì", allenamento: "pesi", pranzo: [], cena: [{ name: "Pollo" }] });
    expect(giorni[1]).toMatchObject({ allenamento: "cardio", pranzo: [], cena: [] });
    expect(giorni[2].pranzo[0].name).toBe("Bowl");
  });
});

describe("filtri e ricerca", () => {
  const lista = [
    ordine("r1", { customer_name: "Niccolò Rossi", phone: "+39 333 111 2222", created_at: "2026-09-25 08:00:00" }),
    ordine("c1", { status: "confirmed", production_date: "2026-10-01", fulfillment_date: "2026-10-01", comune: "Montesilvano" }),
    ordine("c2", { status: "confirmed", production_date: "2026-09-28", fulfillment_date: "2026-09-28", price_cents: 3000 }),
    ordine("late", { status: "ready", production_date: "2026-09-24", fulfillment_date: "2026-09-25" }),
    ordine("done", { status: "completed", updated_at: "2026-09-20 10:00:00" }),
    ordine("gone", { status: "cancelled" }),
  ];

  it("cerca per nome senza accenti, telefono a cifre, comune e id", () => {
    expect(corrisponde(lista[0], "niccolo")).toBe(true);
    expect(corrisponde(lista[0], "3331112")).toBe(true);
    expect(corrisponde(lista[1], "montesil")).toBe(true);
    expect(corrisponde(lista[1], "c1")).toBe(true);
    expect(corrisponde(lista[1], "zzz")).toBe(false);
  });

  it("filtra per stato e ordina ritardi, richieste, date", () => {
    const aperti = filtraOrdini(lista, { stato: "aperti", speciale: null, ricerca: "" }, OGGI);
    expect(aperti.map((o) => o.id)).toEqual(["late", "r1", "c2", "c1"]);
    const tutti = filtraOrdini(lista, { stato: "tutti", speciale: null, ricerca: "" }, OGGI);
    expect(tutti.map((o) => o.id)).toEqual(["late", "r1", "c2", "c1", "done", "gone"]);
    expect(filtraOrdini(lista, { stato: "tutti", speciale: "incassare", ricerca: "" }, OGGI).map((o) => o.id)).toEqual(["c2"]);
    expect(filtraOrdini(lista, { stato: "aperti", speciale: "ritardo", ricerca: "" }, OGGI).map((o) => o.id)).toEqual(["late"]);
  });

  it("conta ogni chip con la ricerca applicata", () => {
    const conti = contaPerStato(lista, { speciale: null, ricerca: "" }, OGGI);
    expect(conti).toMatchObject({ aperti: 4, requested: 1, confirmed: 2, ready: 1, completed: 1, cancelled: 1, tutti: 6 });
  });

  it("legge i filtri dall'indirizzo con un ripiego sicuro", () => {
    expect(leggiFiltroStato("requested")).toBe("requested");
    expect(leggiFiltroStato("boh")).toBe("aperti");
    expect(leggiFiltroStato(null)).toBe("aperti");
    expect(leggiFiltroSpeciale("incassare")).toBe("incassare");
    expect(leggiFiltroSpeciale("toString")).toBeNull();
  });
});

describe("testi pronti", () => {
  it("il WhatsApp saluta per nome e dice il giorno", () => {
    expect(testoWhatsApp({ customer_name: "Giulia Rossi", meals: 6, fulfillment: "pickup", fulfillment_date: "2026-10-01" }))
      .toBe("Ciao Giulia, sono Matteo di FUEL LAB. Ti scrivo per il tuo ordine di 6 pasti con ritiro giovedì 1 ottobre.");
    expect(testoWhatsApp({ customer_name: "", meals: 0, fulfillment: "delivery", fulfillment_date: null }))
      .toBe("Ciao, sono Matteo di FUEL LAB. Ti scrivo per il tuo ordine.");
  });
});

describe("CSV per Excel", () => {
  it("usa il punto e virgola, il BOM e le virgolette quando servono", () => {
    const csv = ordiniCsv([
      ordine("x", { customer_name: "Rossi; Giulia", notes: 'Senza "glutine"\nper favore', price_cents: 4550, paid: 1 }),
    ]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.slice(1).startsWith("ID;Ricevuto;Cliente;")).toBe(true);
    const riga = csv.split("\r\n")[1];
    expect(riga).toContain('"Rossi; Giulia"');
    expect(csv).toContain('"Senza ""glutine""\nper favore"');
    expect(riga).toContain(";45,50;Sì;");
    expect(riga).toContain("2026-09-26 12:00");
  });

  it("neutralizza le formule scritte dal cliente", () => {
    const csv = ordiniCsv([ordine("x", { notes: "=HYPERLINK(\"http://x\")", phone: "+39 333" })]);
    expect(csv).toContain(`"'=HYPERLINK(""http://x"")"`);
    expect(csv).toContain(";'+39 333;");
  });
});

describe("da incassare", () => {
  it("conta solo i prezzi concordati e non pagati, mai le proposte o gli annullati", () => {
    expect(daIncassare(ordine("a", { status: "requested", price_cents: 18000 }))).toBe(false);
    expect(daIncassare(ordine("b", { status: "cancelled", price_cents: 3000 }))).toBe(false);
    expect(daIncassare(ordine("c", { status: "completed", price_cents: 6450, paid: 1 }))).toBe(false);
    expect(daIncassare(ordine("d", { status: "confirmed", price_cents: null }))).toBe(false);
    expect(daIncassare(ordine("e", { status: "completed", price_cents: 6450 }))).toBe(true);
  });
});
