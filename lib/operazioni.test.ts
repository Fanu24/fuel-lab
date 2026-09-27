import { describe, expect, it } from "vitest";
import type { Chiusura, Ordine } from "./api";
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
  etichettaStatoOrdine,
  filtraOrdini,
  inRitardo,
  leggiEuro,
  leggiFiltroSpeciale,
  leggiFiltroStato,
  oggiRoma,
  ordiniCsv,
  periodoDi,
  prossimaAzione,
  prossimaAzioneDi,
  prossimiGiorniCucina,
  scorciatoieDate,
  spostaGiorni,
  testoWhatsApp,
  vociPerGiorno,
} from "./operazioni";

/* Domenica 27 settembre 2026. */
const OGGI = "2026-09-27";
/* Matteo chiuso lunedi' 28 e martedi' 29. */
const CHIUSO: Chiusura[] = [{ dal: "2026-09-28", al: "2026-09-29", motivo: "ferie" }];

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

  it("si cucina ogni giorno, tranne i giorni di chiusura", () => {
    expect(eGiornoDiCucina(OGGI)).toBe(true); // anche la domenica
    expect(eGiornoDiCucina("2026-09-30")).toBe(true);
    expect(eGiornoDiCucina("2026-09-28", CHIUSO)).toBe(false);
    expect(prossimiGiorniCucina(OGGI, 3)).toEqual([OGGI, "2026-09-28", "2026-09-29"]);
    expect(prossimiGiorniCucina(OGGI, 3, CHIUSO)).toEqual([OGGI, "2026-09-30", "2026-10-01"]);
  });

  it("le scorciatoie sono oggi, domani e dopodomani", () => {
    expect(scorciatoieDate(OGGI)).toEqual([
      { nome: "Oggi", data: OGGI },
      { nome: "Domani", data: "2026-09-28" },
      { nome: "Dopodomani", data: "2026-09-29" },
    ]);
  });

  it("propone la data chiesta dal cliente se e' futura, altrimenti domani, cucina e uscita lo stesso giorno", () => {
    expect(dateSuggerite(ordine("a"), OGGI)).toEqual({ produzione: "2026-09-28", uscita: "2026-09-28" });
    expect(dateSuggerite(ordine("b", { requested_date: "2026-09-30" }), OGGI)).toEqual({ produzione: "2026-09-30", uscita: "2026-09-30" });
    // una data preferita gia' passata, o di oggi, non conta: domani
    expect(dateSuggerite(ordine("c", { requested_date: "2026-09-20" }), OGGI)).toEqual({ produzione: "2026-09-28", uscita: "2026-09-28" });
    expect(dateSuggerite(ordine("d", { requested_date: OGGI }), OGGI)).toEqual({ produzione: "2026-09-28", uscita: "2026-09-28" });
  });

  it("salta i giorni di chiusura", () => {
    expect(dateSuggerite(ordine("a"), OGGI, CHIUSO)).toEqual({ produzione: "2026-09-30", uscita: "2026-09-30" });
    expect(dateSuggerite(ordine("b", { requested_date: "2026-09-29" }), OGGI, CHIUSO)).toEqual({ produzione: "2026-09-30", uscita: "2026-09-30" });
  });

  it("non tocca le date gia' scritte e non mette la cucina dopo l'uscita", () => {
    expect(dateSuggerite(ordine("a", { production_date: "2026-10-01" }), OGGI)).toEqual({ produzione: "2026-10-01", uscita: "2026-10-01" });
    // con la sola uscita, si cucina lo stesso giorno
    expect(dateSuggerite(ordine("b", { fulfillment_date: "2026-09-30" }), OGGI)).toEqual({ produzione: "2026-09-30", uscita: "2026-09-30" });
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

  it("l'abbonamento si conferma, poi niente da premere fino alla fine del mese, poi si chiude", () => {
    const abb = (stato: Ordine["status"], inizio: string | null) =>
      ordine("abb", { service: "abbonamento", status: stato, production_date: inizio, fulfillment_date: inizio });
    expect(prossimaAzioneDi(abb("requested", null), OGGI)).toMatchObject({ stato: "confirmed", verbo: "Conferma l'abbonamento" });
    // dal 1 al 31 ottobre: a meta' mese nessun bottone, dal 1 novembre "Segna concluso"
    expect(prossimaAzioneDi(abb("confirmed", "2026-10-01"), "2026-10-15")).toBeNull();
    expect(prossimaAzioneDi(abb("confirmed", "2026-10-01"), "2026-10-31")).toBeNull();
    expect(prossimaAzioneDi(abb("confirmed", "2026-10-01"), "2026-11-01")).toMatchObject({ stato: "completed", verbo: "Segna concluso" });
    expect(prossimaAzioneDi(abb("completed", "2026-10-01"), "2026-11-01")).toBeNull();
    // un ordine normale segue il giro di sempre
    expect(prossimaAzioneDi(ordine("x", { status: "confirmed" }), OGGI)?.stato).toBe("preparing");
  });

  it("un abbonamento chiuso si dice Concluso, un ritiro fatto Ritirato", () => {
    expect(etichettaStatoOrdine({ status: "completed", fulfillment: "pickup", service: "abbonamento" })).toBe("Concluso");
    expect(etichettaStatoOrdine({ status: "completed", fulfillment: "pickup", service: "menu-settimana" })).toBe("Ritirato");
    expect(etichettaStatoOrdine({ status: "completed", fulfillment: "delivery" })).toBe("Consegnato");
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

  it("gli abbonamenti non entrano in cucina e uscite come ordini: i loro pranzi di oggi si contano a parte", () => {
    const lunedi = "2026-09-28";
    const c = codeOperative([
      ordine("normale", { status: "confirmed", production_date: lunedi, fulfillment_date: lunedi, meals: 2 }),
      // inizia oggi: la sua data non e' un giorno di cucina o di uscita
      ordine("abb", { service: "abbonamento", status: "confirmed", production_date: lunedi, fulfillment_date: lunedi, meals: 0, items: [] }),
      ordine("abb-vecchio", { service: "abbonamento", status: "confirmed", production_date: "2026-09-14", fulfillment_date: "2026-09-14", meals: 0, items: [] }),
    ], lunedi);
    expect(c.cucinaOggi.map((o) => o.id)).toEqual(["normale"]);
    expect(c.usciteOggi.map((o) => o.id)).toEqual(["normale"]);
    expect(c.abbonamentiOggi.map((o) => o.id)).toEqual(["abb", "abb-vecchio"]);
    expect(c.porzioniOggi).toBe(4);
  });

  it("un abbonamento in corso e' in ritardo solo a mese finito", () => {
    const abb = ordine("abb", { service: "abbonamento", status: "confirmed", production_date: "2026-09-01", fulfillment_date: "2026-09-01" });
    expect(inRitardo(abb, "2026-09-30")).toBe(false);
    expect(inRitardo(abb, "2026-10-01")).toBe(true);
    expect(inRitardo({ ...abb, status: "completed" }, "2026-10-01")).toBe(false);
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

  it("somma i pranzi in abbonamento alle porzioni da cucinare", () => {
    const lunedi = "2026-09-28";
    const azioni = azioniDaFare([
      ordine("a", { status: "confirmed", production_date: lunedi, fulfillment_date: lunedi, meals: 5 }),
      ordine("abb", { service: "abbonamento", status: "confirmed", production_date: lunedi, fulfillment_date: lunedi, meals: 0, items: [] }),
    ], lunedi);
    expect(azioni.map((a) => a.testo)).toEqual(["Cucina 6 porzioni oggi", "Consegna 1 ordine oggi"]);
    expect(azioni[0].dettaglio).toBe("1 ordine e 1 pranzo in abbonamento · apri il foglio cucina con piatti ed extra.");
  });

  it("niente da fare: lista vuota", () => {
    expect(azioniDaFare([], OGGI)).toEqual([]);
  });

  it("riassume i nomi senza allungare la riga", () => {
    const nomi = ["A", "B", "C", "D"].map((n) => ({ customer_name: n }));
    expect(elencoNomi(nomi.slice(0, 1))).toBe("A");
    expect(elencoNomi(nomi.slice(0, 3))).toBe("A, B e un altro");
    expect(elencoNomi([{ customer_name: "Rev B" }, { customer_name: "Rev B" }, { customer_name: "C" }])).toBe("Rev B e C");
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
    expect(giorni[0]).toMatchObject({ data: OGGI, oggi: true, chiusura: null, porzioni: 0 });
    expect(giorni[1]).toMatchObject({ data: "2026-09-28", chiusura: null, porzioni: 10, ordiniInCucina: 2, uscite: 1, ritiri: 1 });
    expect(giorni[2]).toMatchObject({ uscite: 1, consegne: 1 });
    expect(giorni[4]).toMatchObject({ data: "2026-10-01", richieste: 1 });
  });

  it("segna i giorni di chiusura e conta i pranzi in abbonamento dal lunedi' al venerdi'", () => {
    const giorni = calendario([
      ordine("abb", { service: "abbonamento", status: "confirmed", production_date: "2026-09-29", fulfillment_date: "2026-09-29", items: [] }),
    ], OGGI, 7, CHIUSO);
    expect(giorni.map((g) => !!g.chiusura)).toEqual([false, true, true, false, false, false, false]);
    expect(giorni[1].chiusura?.motivo).toBe("ferie");
    // domenica 27 e lunedi' 28 prima dell'inizio, poi mar-ven, sabato no
    expect(giorni.map((g) => g.abbonamenti)).toEqual([0, 0, 1, 1, 1, 1, 0]);
    // l'abbonamento non e' un ordine in cucina il giorno d'inizio
    expect(giorni[2]).toMatchObject({ porzioni: 0, ordiniInCucina: 0, uscite: 0 });
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

  it("il filtro rapido Abbonamenti tiene solo gli abbonamenti", () => {
    const conAbb = [...lista, ordine("abb", { service: "abbonamento", status: "confirmed", production_date: "2026-10-01", fulfillment_date: "2026-10-01" })];
    expect(filtraOrdini(conAbb, { stato: "aperti", speciale: "abbonamenti", ricerca: "" }, OGGI).map((o) => o.id)).toEqual(["abb"]);
    expect(leggiFiltroSpeciale("abbonamenti")).toBe("abbonamenti");
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

  it("per l'abbonamento dice il periodo, non i pasti", () => {
    const abb = { customer_name: "Giulia Rossi", meals: 3, fulfillment: "pickup" as const, fulfillment_date: "2026-10-05", service: "abbonamento" as const };
    expect(testoWhatsApp(abb)).toBe("Ciao Giulia, sono Matteo di FUEL LAB. Ti scrivo per il tuo abbonamento ai pranzi dal 5 ottobre al 4 novembre.");
    expect(testoWhatsApp({ ...abb, fulfillment_date: null })).toBe("Ciao Giulia, sono Matteo di FUEL LAB. Ti scrivo per il tuo abbonamento ai pranzi.");
    expect(periodoDi(abb, OGGI)).toBe("dal 5 ottobre al 4 novembre");
    expect(periodoDi({ ...abb, service: "menu-settimana" }, OGGI)).toBeNull();
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
