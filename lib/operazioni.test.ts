import { describe, expect, it } from "vitest";
import type { FormulaId } from "./abbonamento";
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
import { abbonamentiDelGiorno, contaPastiAbbonamenti, contaPorzioni, etichette, etichetteAbbonamenti, ordiniDelGiorno } from "./produzione";

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

/* Un abbonamento in corso: la data d'inizio e' sia il giorno di cucina sia quello di ritiro o consegna. */
const abbonamento = (id: string, inizio: string | null, plan: FormulaId | null = "pranzo", modifiche: Partial<Ordine> = {}): Ordine =>
  ordine(id, {
    service: "abbonamento",
    status: "confirmed",
    production_date: inizio,
    fulfillment_date: inizio,
    meals: 0,
    items: [],
    subscription: plan ? { plan, tier: "standard", household: "singolo", trial: false } : null,
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

  it("un abbonamento esce e va in cucina solo nel giorno di consegna, con i pasti che porta", () => {
    const lunedi = "2026-09-28";
    const c = codeOperative([
      ordine("normale", { status: "confirmed", production_date: lunedi, fulfillment_date: lunedi, meals: 2 }),
      // Pranzo dal 28: la consegna e' oggi e copre lun-mar-mer, tre pranzi (la data d'inizio non e' un giorno di cucina "da ordine")
      abbonamento("abb", lunedi),
      // un abbonamento di prima delle formule, dal 25: consegna il 25 e poi ogni 3 giorni, quindi anche oggi
      abbonamento("abb-vecchio", "2026-09-25", null),
      // dal 26 le consegne cadono il 26 e il 29: oggi niente
      abbonamento("abb-in-mezzo", "2026-09-26"),
      // dal 28 ma ancora da confermare, oppure annullato o concluso: non consegnano
      abbonamento("abb-richiesto", lunedi, "pranzo", { status: "requested" }),
      abbonamento("abb-annullato", lunedi, "pranzo", { status: "cancelled" }),
      abbonamento("abb-concluso", lunedi, "pranzo", { status: "completed" }),
    ], lunedi);
    expect(c.cucinaOggi.map((o) => o.id)).toEqual(["normale"]);
    expect(c.abbonamentiOggi.map((o) => o.id)).toEqual(["abb", "abb-vecchio"]);
    expect(c.pastiAbbonamentiOggi).toBe(6);
    // le uscite di oggi comprendono le consegne degli abbonamenti
    expect(c.usciteOggi.map((o) => o.id)).toEqual(["normale", "abb", "abb-vecchio"]);
    expect(c.usciteDaFare.map((o) => o.id)).toEqual(["normale", "abb", "abb-vecchio"]);
    // le porzioni sommano i pasti delle consegne: 2 + 3 + 3
    expect(c.porzioniOggi).toBe(8);
  });

  it("Oggi, foglio cucina ed etichette contano le stesse porzioni", () => {
    const lunedi = "2026-09-28";
    const lista = [
      ordine("normale", { status: "confirmed", production_date: lunedi, fulfillment_date: lunedi, meals: 2 }), // due piatti
      abbonamento("completo", lunedi, "completo"), // lun-mar-mer: 6 pasti
      abbonamento("full7", lunedi, "full7"), // 9 pasti, colazioni comprese
      abbonamento("pranzo", "2026-09-25"), // 3 pranzi
    ];
    const c = codeOperative(lista, lunedi);
    const abb = abbonamentiDelGiorno(lista, lunedi);
    const etichetteTotali = etichette(ordiniDelGiorno(lista, lunedi)).length + etichetteAbbonamenti(abb, lunedi).length;
    expect(c.porzioniOggi).toBe(2 + 6 + 9 + 3);
    expect(etichetteTotali).toBe(c.porzioniOggi);
    const oggi = calendario(lista, lunedi, 1)[0];
    expect(oggi.porzioni + oggi.pastiAbbonamenti).toBe(c.porzioniOggi);
    expect(contaPorzioni(ordiniDelGiorno(lista, lunedi)) + contaPastiAbbonamenti(abb, lunedi)).toBe(c.porzioniOggi);
  });

  it("nei giorni fra due consegne un abbonamento non compare", () => {
    const c = codeOperative([abbonamento("abb", "2026-09-28", "completo")], "2026-09-29");
    expect(c.abbonamentiOggi).toEqual([]);
    expect(c.usciteOggi).toEqual([]);
    expect(c.porzioniOggi).toBe(0);
  });

  it("una consegna in abbonamento gia' fatta (segnata sul telefono) non e' piu' da fare, ma resta fra le uscite", () => {
    const lunedi = "2026-09-28";
    const lista = [abbonamento("abb", lunedi), abbonamento("abb2", lunedi)];
    const c = codeOperative(lista, lunedi, new Set(["abb"]));
    expect(c.usciteOggi.map((o) => o.id)).toEqual(["abb", "abb2"]);
    expect(c.usciteDaFare.map((o) => o.id)).toEqual(["abb2"]);
    // un id che non e' un'uscita di oggi non cambia niente
    expect(codeOperative(lista, lunedi, new Set(["altro"])).usciteDaFare).toHaveLength(2);
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

  it("somma i pasti delle consegne in abbonamento alle porzioni da cucinare", () => {
    const lunedi = "2026-09-28";
    const azioni = azioniDaFare([
      ordine("a", { status: "confirmed", production_date: lunedi, fulfillment_date: lunedi, meals: 5 }),
      abbonamento("abb", lunedi, "leggero"), // lun-mar-mer: pranzo e cena, 6 pasti
    ], lunedi);
    expect(azioni.map((a) => a.testo)).toEqual(["Cucina 11 porzioni oggi", "Consegna 2 ordini oggi"]);
    expect(azioni[0].dettaglio).toBe("1 ordine e 1 consegna di abbonamento (6 pasti) · apri il foglio cucina con piatti ed extra.");
    expect(azioni[0].quanti).toBe(2);
    expect(azioni[1].dettaglio).toBe("2 ritiri (di cui 1 in abbonamento)");
  });

  it("una consegna in abbonamento segnata come fatta esce dalle cose da fare", () => {
    const lunedi = "2026-09-28";
    const lista = [abbonamento("abb", lunedi)];
    expect(azioniDaFare(lista, lunedi).map((a) => a.id)).toEqual(["cucina", "uscite"]);
    expect(azioniDaFare(lista, lunedi, 0, new Set(["abb"])).map((a) => a.id)).toEqual(["cucina"]);
  });

  it("solo abbonamenti: si dice quante consegne e quanti pasti", () => {
    const azioni = azioniDaFare([abbonamento("a", "2026-09-28"), abbonamento("b", "2026-09-28", "full7")], "2026-09-28");
    expect(azioni[0].testo).toBe("Cucina 12 porzioni oggi"); // 3 pranzi + 9 pasti
    expect(azioni[0].dettaglio).toBe("2 consegne di abbonamento (12 pasti) · apri il foglio cucina con piatti ed extra.");
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

  it("segna i giorni di chiusura e conta le consegne in abbonamento con i pasti che portano", () => {
    // Completo dal 30 settembre: consegne il 30 (mercoledi') e il 3 ottobre (sabato), sei pasti ciascuna
    const giorni = calendario([abbonamento("abb", "2026-09-30", "completo")], OGGI, 7, CHIUSO);
    expect(giorni.map((g) => !!g.chiusura)).toEqual([false, true, true, false, false, false, false]);
    expect(giorni[1].chiusura?.motivo).toBe("ferie");
    // domenica 27 ... sabato 3 ottobre
    expect(giorni.map((g) => g.abbonamenti)).toEqual([0, 0, 0, 1, 0, 0, 1]);
    expect(giorni.map((g) => g.pastiAbbonamenti)).toEqual([0, 0, 0, 6, 0, 0, 6]);
    // non e' un ordine in cucina, ma la consegna e' un'uscita di quel giorno
    expect(giorni[3]).toMatchObject({ porzioni: 0, ordiniInCucina: 0, uscite: 1, ritiri: 1, consegne: 0 });
    expect(giorni[4]).toMatchObject({ uscite: 0, abbonamenti: 0 });
  });

  it("conta le consegne a domicilio degli abbonamenti fra le consegne del giorno", () => {
    const giorni = calendario([abbonamento("abb", "2026-09-28", "pranzo", { fulfillment: "delivery" })], OGGI);
    expect(giorni[1]).toMatchObject({ data: "2026-09-28", abbonamenti: 1, pastiAbbonamenti: 3, uscite: 1, consegne: 1, ritiri: 0 });
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
    const conAbb = [...lista, abbonamento("abb", "2026-10-01")];
    expect(filtraOrdini(conAbb, { stato: "aperti", speciale: "abbonamenti", ricerca: "" }, OGGI).map((o) => o.id)).toEqual(["abb"]);
    expect(leggiFiltroSpeciale("abbonamenti")).toBe("abbonamenti");
  });

  it("si trova un abbonamento anche scrivendo la formula o la fascia", () => {
    const completo = abbonamento("abb", "2026-10-01", "completo", { subscription: { plan: "completo", tier: "plus", household: "coppia", trial: true } });
    expect(corrisponde(completo, "completo")).toBe(true);
    expect(corrisponde(completo, "PLUS")).toBe(true);
    expect(corrisponde(completo, "full")).toBe(false);
    // la formula si cerca solo negli abbonamenti
    expect(corrisponde(ordine("x", { comune: "Pescara" }), "completo")).toBe(false);
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

  it("per l'abbonamento dice la formula e il periodo, non i pasti", () => {
    const abb = {
      customer_name: "Giulia Rossi",
      meals: 3,
      fulfillment: "pickup" as const,
      fulfillment_date: "2026-10-05",
      service: "abbonamento" as const,
      subscription: { plan: "completo" as const, tier: "plus" as const, household: "singolo" as const, trial: false },
    };
    expect(testoWhatsApp(abb)).toBe("Ciao Giulia, sono Matteo di FUEL LAB. Ti scrivo per il tuo abbonamento Completo Plus dal 5 ottobre al 4 novembre.");
    expect(testoWhatsApp({ ...abb, fulfillment_date: null })).toBe("Ciao Giulia, sono Matteo di FUEL LAB. Ti scrivo per il tuo abbonamento Completo Plus.");
    // un abbonamento di prima delle formule e' un Pranzo
    expect(testoWhatsApp({ ...abb, subscription: null })).toBe("Ciao Giulia, sono Matteo di FUEL LAB. Ti scrivo per il tuo abbonamento Pranzo dal 5 ottobre al 4 novembre.");
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

  it("scrive la formula dell'abbonamento in una colonna a parte", () => {
    const csv = ordiniCsv([
      abbonamento("abb", "2026-10-05", "completo", { subscription: { plan: "completo", tier: "plus", household: "coppia", trial: true } }),
      ordine("x"),
    ]);
    const [intestazione, riga, altra] = csv.slice(1).split("\r\n");
    expect(intestazione).toContain(";Servizio;Formula;");
    expect(riga).toContain(";Abbonamento mensile;Completo · Plus · in coppia · con la settimana di prova;");
    expect(altra).toContain(";Menu della settimana;;");
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
