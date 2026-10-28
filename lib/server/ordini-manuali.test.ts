import { describe, expect, it } from "vitest";
import { PIATTI } from "../catalogo";
import { leggiIdCliente, leggiOrdineManuale, type ClienteRegistrato } from "./ordini-manuali";
import { ordineDaRiga } from "./ordini";

const OGGI = "2026-09-27"; // domenica
const piatto = PIATTI[0];
const altro = PIATTI[1];

const corpo = {
  name: "Anna Verdi",
  phone: "347 765 4321",
  comune: "Montesilvano",
  address: "",
  service: "menu-settimana",
  fulfillment: "pickup",
  plan: { lun: { pranzo: { piatto: piatto.id, extra: [] }, cena: { piatto: altro.id, extra: [] } } },
  status: "requested",
};

const giulia: ClienteRegistrato = { id: "u-giulia", name: "Giulia Rossi", phone: "333 123 4567", comune: "Pescara", address: "Via Roma 1" };

const esito = (changes: Record<string, unknown> = {}, cliente: ClienteRegistrato | null = null) =>
  leggiOrdineManuale({ ...corpo, ...changes }, OGGI, cliente);

const errore = (changes: Record<string, unknown> = {}, cliente: ClienteRegistrato | null = null) => {
  const e = esito(changes, cliente);
  return e.ok ? null : e.error;
};

describe("ordine a mano: cliente", () => {
  it("per chi non ha account vuole nome e telefono di almeno 9 cifre", () => {
    const e = esito();
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(e.value).toMatchObject({ customerId: null, name: "Anna Verdi", phone: "347 765 4321", comune: "Montesilvano" });
    expect(errore({ name: "   " })).toBe("Scrivi il nome del cliente");
    expect(errore({ phone: "347 12" })).toMatch(/almeno 9 cifre/);
    expect(errore({ phone: undefined })).toMatch(/almeno 9 cifre/);
  });

  it("il comune serve solo per la consegna, insieme all'indirizzo", () => {
    expect(esito({ comune: "" }).ok).toBe(true);
    expect(errore({ fulfillment: "delivery" })).toBe("Per la consegna servono indirizzo e comune");
    expect(errore({ fulfillment: "delivery", address: "Via Po 3", comune: "" })).toBe("Per la consegna servono indirizzo e comune");
    expect(esito({ fulfillment: "delivery", address: "Via Po 3" }).ok).toBe(true);
    expect(errore({ fulfillment: "domicilio" })).toBe("Scegli ritiro o consegna");
  });

  it("un cliente registrato completa i campi vuoti col suo profilo, quelli scritti vincono", () => {
    const e = esito({ name: "", phone: "", comune: "", address: "", fulfillment: "delivery" }, giulia);
    expect(e.ok && e.value).toMatchObject({
      customerId: "u-giulia", name: "Giulia Rossi", phone: "333 123 4567", comune: "Pescara", address: "Via Roma 1",
    });
    const scritto = esito({ name: "Giulia R.", phone: "340 000 1111" }, giulia);
    expect(scritto.ok && scritto.value).toMatchObject({ name: "Giulia R.", phone: "340 000 1111", comune: "Montesilvano" });
  });

  it("un profilo senza telefono non basta: Matteo lo deve scrivere", () => {
    expect(errore({ phone: "" }, { ...giulia, phone: "" })).toMatch(/almeno 9 cifre/);
  });

  it("toglie i caratteri di controllo dai campi su una riga", () => {
    const e = esito({ name: "Anna\n\tVerdi\u0007", address: "Via  Po\r\n3" });
    expect(e.ok && e.value.name).toBe("Anna Verdi");
    expect(e.ok && e.value.address).toBe("Via Po 3");
  });

  it("legge l'id del cliente solo se e' un id plausibile", () => {
    expect(leggiIdCliente({})).toEqual({ ok: true, value: null });
    expect(leggiIdCliente({ customerId: null })).toEqual({ ok: true, value: null });
    expect(leggiIdCliente({ customerId: "" })).toEqual({ ok: true, value: null });
    expect(leggiIdCliente({ customerId: " PAW9LBO6JWF5cmkTneVortmbWBfgFRDt " })).toEqual({ ok: true, value: "PAW9LBO6JWF5cmkTneVortmbWBfgFRDt" });
    expect(leggiIdCliente({ customerId: 42 }).ok).toBe(false);
    expect(leggiIdCliente({ customerId: "x' OR 1=1 --" }).ok).toBe(false);
    expect(leggiIdCliente({ customerId: "a".repeat(101) }).ok).toBe(false);
  });
});

describe("ordine a mano: piatti e porzioni", () => {
  it("ricava le righe dal piano come le richieste dal sito", () => {
    const e = esito();
    expect(e.ok && e.value.items).toEqual([
      { id: piatto.id, name: piatto.nome, day: "lun", meal: "pranzo", extras: [] },
      { id: altro.id, name: altro.nome, day: "lun", meal: "cena", extras: [] },
    ]);
    expect(e.ok && e.value.meals).toBe(2);
  });

  it("senza piatti rifiuta menu e macro, accetta l'home cooking", () => {
    expect(errore({ plan: {} })).toBe("Scegli almeno un piatto");
    expect(errore({ plan: { lun: { pranzo: { piatto: "non-esiste", extra: [] } } } })).toBe("Scegli almeno un piatto");
    expect(errore({ plan: {}, service: "sui-tuoi-macro" })).toBe("Scegli almeno un piatto");
    const home = esito({ plan: {}, service: "home-cooking", meals: 10 });
    expect(home.ok && home.value).toMatchObject({ items: [], meals: 10 });
    expect(esito({ plan: {}, service: "home-cooking" }).ok).toBe(true);
  });

  it("per l'home cooking le porzioni sono almeno quante i piatti scelti", () => {
    const pochi = esito({ service: "home-cooking", meals: 1 });
    expect(pochi.ok && pochi.value.meals).toBe(2);
    const tanti = esito({ service: "home-cooking", meals: 12 });
    expect(tanti.ok && tanti.value.meals).toBe(12);
    expect(errore({ service: "home-cooking", meals: -1 })).toMatch(/Porzioni non valide/);
    expect(errore({ service: "home-cooking", meals: 2.5 })).toMatch(/Porzioni non valide/);
    expect(errore({ service: "home-cooking", meals: 101 })).toMatch(/Porzioni non valide/);
  });

  it("fuori dall'home cooking le porzioni sono sempre i piatti, qualunque meals arrivi", () => {
    const e = esito({ meals: 40 });
    expect(e.ok && e.value.meals).toBe(2);
  });

  it("rifiuta un servizio sconosciuto, senza servizio usa il menu della settimana", () => {
    expect(errore({ service: "catering" })).toBe("Servizio non valido");
    const { service: _tolto, ...senza } = corpo;
    void _tolto;
    const e = leggiOrdineManuale(senza, OGGI, null);
    expect(e.ok && e.value.service).toBe("menu-settimana");
  });
});

describe("ordine a mano: stato e date", () => {
  it("parte da confermare anche senza date, e la data di uscita diventa quella chiesta", () => {
    const senza = esito();
    expect(senza.ok && senza.value).toMatchObject({ status: "requested", productionDate: null, fulfillmentDate: null, requestedDate: null });
    const conData = esito({ fulfillmentDate: "2026-10-01" });
    expect(conData.ok && conData.value.requestedDate).toBe("2026-10-01");
    const senzaStato = leggiOrdineManuale({ ...corpo, status: undefined }, OGGI, null);
    expect(senzaStato.ok && senzaStato.value.status).toBe("requested");
  });

  it("gia' confermato vuole entrambe le date", () => {
    expect(errore({ status: "confirmed" })).toMatch(/servono le date/);
    expect(errore({ status: "confirmed", productionDate: "2026-09-28" })).toMatch(/servono le date/);
    const ok = esito({ status: "confirmed", productionDate: "2026-09-28", fulfillmentDate: "2026-09-28" });
    expect(ok.ok && ok.value).toMatchObject({ status: "confirmed", productionDate: "2026-09-28", fulfillmentDate: "2026-09-28" });
  });

  it("non accetta stati oltre il confermato", () => {
    for (const status of ["preparing", "ready", "completed", "cancelled", "boh"]) {
      expect(errore({ status, productionDate: "2026-09-28", fulfillmentDate: "2026-09-28" })).toMatch(/Stato iniziale non valido/);
    }
  });

  it("rifiuta date impossibili, produzione dopo l'uscita e date fuori finestra", () => {
    expect(errore({ productionDate: "2026-02-31" })).toBe("Data non valida");
    expect(errore({ fulfillmentDate: "domani" })).toBe("Data non valida");
    expect(errore({ productionDate: "2026-10-01", fulfillmentDate: "2026-09-28" })).toMatch(/non può essere dopo/);
    expect(errore({ productionDate: "2026-08-27" })).toMatch(/fra un mese fa e un anno/);
    expect(esito({ productionDate: "2026-08-28" }).ok).toBe(true);
    expect(errore({ fulfillmentDate: "2027-09-28" })).toMatch(/fra un mese fa e un anno/);
    expect(esito({ productionDate: "", fulfillmentDate: null }).ok).toBe(true);
  });
});

describe("ordine a mano: soldi e note", () => {
  it("prezzo in centesimi interi, pagato solo booleano", () => {
    const e = esito({ priceCents: 4550, paid: true });
    expect(e.ok && e.value).toMatchObject({ priceCents: 4550, paid: 1 });
    const senza = esito({ priceCents: null });
    expect(senza.ok && senza.value).toMatchObject({ priceCents: null, paid: 0 });
    expect(errore({ priceCents: 45.5 })).toMatch(/Totale non valido/);
    expect(errore({ priceCents: -1 })).toMatch(/Totale non valido/);
    expect(errore({ priceCents: "45" })).toMatch(/Totale non valido/);
    expect(errore({ priceCents: 1_000_001 })).toMatch(/Totale non valido/);
    expect(errore({ paid: "si" })).toBe("Pagamento non valido");
  });

  it("note e nota interna tengono gli a capo e hanno un limite", () => {
    const e = esito({ notes: "  senza cipolla\r\nporzioni grandi ", internalNote: "chiamato alle 10" });
    expect(e.ok && e.value).toMatchObject({ notes: "senza cipolla\nporzioni grandi", internalNote: "chiamato alle 10" });
    expect(errore({ notes: "x".repeat(1501) })).toMatch(/al massimo 1500/);
    expect(errore({ internalNote: "x".repeat(2001) })).toMatch(/al massimo 2000/);
    expect(errore({ internalNote: 3 })).toBe("Nota interna non valida");
  });
});

describe("ordine a mano visto dal pannello", () => {
  const riga = {
    id: "o9", user_id: "u1", email: "matteo@example.com", status: "requested", service: "menu-settimana", fulfillment: "pickup",
    customer_name: "Anna Verdi", phone: "3477654321", comune: "", address: "", notes: "", internal_note: "", customer_message: "",
    price_cents: null, paid: 0, meals: 0, created_at: "2026-09-27 10:00:00", updated_at: "2026-09-27 10:00:00", items_json: "[]",
  };

  it("l'admin vede la provenienza, il cliente no", () => {
    expect(ordineDaRiga({ ...riga, source: "manual" }, true).source).toBe("manual");
    expect(ordineDaRiga({ ...riga, source: "web" }, true).source).toBe("web");
    expect(ordineDaRiga(riga, true).source).toBe("web");
    expect(ordineDaRiga({ ...riga, source: "manual" }, false)).not.toHaveProperty("source");
  });
});

describe("ordine a mano: abbonamento", () => {
  const formula = { plan: "completo", tier: "plus", household: "singolo" };
  const abb = (changes: Record<string, unknown> = {}) => ({ service: "abbonamento", plan: {}, subscription: formula, ...changes });

  it("niente piatti, prezzo proposto per la formula se Matteo non lo scrive, le due date sono l'inizio", () => {
    const e = esito(abb({ status: "confirmed", productionDate: "2026-10-05", fulfillmentDate: "2026-10-05" }));
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    // Completo Plus, ritiro (il corpo di base e' un ritiro): 676 euro di listino
    expect(e.value).toMatchObject({
      service: "abbonamento", items: [], meals: 0, priceCents: 67600, requestedDate: "2026-10-05",
      subscription: { plan: "completo", tier: "plus", household: "singolo" },
    });
    expect(e.value.plan).toEqual({});
    // con la consegna a domicilio e' il listino
    const domicilio = esito(abb({ fulfillment: "delivery", address: "Via Roma 1" }));
    expect(domicilio.ok && domicilio.value.priceCents).toBe(67600);
  });

  it("vuole la formula, e la formula giusta", () => {
    expect(errore(abb({ subscription: undefined }))).toMatch(/formula/);
    expect(errore(abb({ subscription: { plan: "full9" } }))).toMatch(/formula/);
    expect(errore(abb({ subscription: { plan: "pranzo", tier: "oro" } }))).toMatch(/Fascia/);
  });

  it("gli altri servizi non hanno formula", () => {
    const e = esito({ subscription: formula });
    expect(e.ok && e.value.subscription).toBeNull();
  });

  it("ignora i piatti mandati per sbaglio e rispetta il prezzo scritto, anche vuoto", () => {
    const conPiatti = esito({ service: "abbonamento", subscription: formula });
    expect(conPiatti.ok && conPiatti.value.items).toEqual([]);
    const scontato = esito(abb({ priceCents: 20000 }));
    expect(scontato.ok && scontato.value.priceCents).toBe(20000);
    const senza = esito(abb({ priceCents: null }));
    expect(senza.ok && senza.value.priceCents).toBeNull();
  });

  it("vuole le due date uguali, e l'inizio per un abbonamento gia' confermato", () => {
    expect(errore(abb({ productionDate: "2026-10-05", fulfillmentDate: "2026-10-06" }))).toMatch(/coincidere/);
    expect(errore(abb({ status: "confirmed" }))).toMatch(/servono le date/);
  });
});
