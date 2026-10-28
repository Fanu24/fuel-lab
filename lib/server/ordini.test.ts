import { describe, expect, it } from "vitest";
import { EXTRA, PIATTI } from "../catalogo";
import {
  dettaglioDaRiga,
  euroTesto,
  eventiPerCliente,
  leggiAnnullamentoCliente,
  leggiModificaAdmin,
  leggiNuovoOrdine,
  leggiSceltaAbbonamento,
  ordineDaRiga,
  pianoDaCorpo,
  sceltaDaRiga,
  soloPastiDellaFormula,
  vociDalPiano,
  type StatoModificabile,
} from "./ordini";
import type { EventoOrdine } from "../api";

const riga = {
  id: "o1", user_id: "u1", email: "cliente@example.com", status: "confirmed", service: "menu-settimana",
  fulfillment: "delivery", requested_date: "2026-10-01", production_date: "2026-09-30", fulfillment_date: "2026-10-01",
  customer_name: "Giulia Rossi", phone: "3331234567", comune: "Pescara", address: "Via Roma 1", notes: "",
  internal_note: "chiamare prima", customer_message: "A domani!", price_cents: 4500, paid: 0,
  dietary_preferences: "senza lattosio", meals: 2, created_at: "2026-09-27 10:00:00", updated_at: "2026-09-27 11:00:00",
  plan_json: "{}", training_json: "{}", items_json: JSON.stringify([{ id: "x", name: "Pollo e riso", day: "lun", meal: "pranzo", extras: [] }]),
};

const stato = (changes: Partial<StatoModificabile> = {}): StatoModificabile => ({
  status: "requested", production_date: null, fulfillment_date: null, internal_note: "",
  customer_message: "", price_cents: null, paid: 0, ...changes,
});

const evento = (id: number, type: EventoOrdine["type"], created_at = "2026-09-27 10:00:00"): EventoOrdine =>
  ({ id, actor: "admin", type, from_status: null, to_status: null, detail: "", created_at });

describe("ordine visto da Matteo e dal cliente", () => {
  it("al cliente non arrivano note interne, data di produzione e colonne grezze", () => {
    const cliente = ordineDaRiga(riga, false);
    expect(cliente).not.toHaveProperty("internal_note");
    expect(cliente).not.toHaveProperty("production_date");
    expect(cliente).not.toHaveProperty("plan_json");
    expect(cliente).not.toHaveProperty("items_json");
    expect(cliente.items[0].name).toBe("Pollo e riso");
    expect(cliente.price_cents).toBe(4500);
    expect(cliente.paid).toBe(0);
    const admin = ordineDaRiga(riga, true);
    expect(admin.internal_note).toBe("chiamare prima");
    expect(admin.production_date).toBe("2026-09-30");
  });

  it("al cliente arrivano solo gli eventi di nascita, stato e messaggio, in ordine di data", () => {
    const eventi = [
      evento(3, "message", "2026-09-27 12:00:00"),
      evento(1, "created", "2026-09-27 10:00:00"),
      evento(2, "note", "2026-09-27 11:00:00"),
      evento(4, "price", "2026-09-27 12:00:00"),
      evento(5, "email", "2026-09-27 12:00:00"),
    ];
    expect(eventiPerCliente(eventi).map((e) => e.type)).toEqual(["message", "created"]);
    expect(dettaglioDaRiga(riga, eventi, false).events.map((e) => e.id)).toEqual([1, 3]);
    expect(dettaglioDaRiga(riga, eventi, true).events.map((e) => e.id)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("nuova richiesta", () => {
  const piatto = PIATTI[0];
  const corpo = {
    name: "Giulia", phone: "333 123 4567", comune: "Pescara", address: "", service: "menu-settimana",
    fulfillment: "pickup", requestedDate: "2026-10-01", notes: "",
    plan: { lun: { pranzo: { piatto: piatto.id, extra: [] } } }, training: {},
  };

  it("valida e ricava le righe dal piano", () => {
    const esito = leggiNuovoOrdine(corpo, "Account", "2026-09-27");
    expect(esito.ok).toBe(true);
    if (esito.ok) expect(esito.value.items).toEqual([{ id: piatto.id, name: piatto.nome, day: "lun", meal: "pranzo", extras: [] }]);
  });

  it("rifiuta telefono corto, consegna senza indirizzo, date fuori finestra e piani vuoti", () => {
    expect(leggiNuovoOrdine({ ...corpo, phone: "333" }, "", "2026-09-27").ok).toBe(false);
    expect(leggiNuovoOrdine({ ...corpo, fulfillment: "delivery" }, "", "2026-09-27").ok).toBe(false);
    expect(leggiNuovoOrdine({ ...corpo, requestedDate: "2026-09-26" }, "", "2026-09-27").ok).toBe(false);
    expect(leggiNuovoOrdine({ ...corpo, requestedDate: "2027-01-10" }, "", "2026-09-27").ok).toBe(false);
    expect(leggiNuovoOrdine({ ...corpo, plan: {} }, "", "2026-09-27").ok).toBe(false);
  });

  const abb = { plan: "completo", tier: "standard", household: "singolo", trial: false };

  it("l'abbonamento non vuole piatti e parte con il prezzo proposto per la formula", () => {
    const esito = leggiNuovoOrdine({ ...corpo, service: "abbonamento", plan: {}, subscription: abb, fulfillment: "delivery", address: "Via Roma 1" }, "Account", "2026-09-27");
    expect(esito.ok).toBe(true);
    if (!esito.ok) return;
    expect(esito.value).toMatchObject({
      service: "abbonamento", requestedDate: "2026-10-01", priceCents: 52000, items: [],
      subscription: { plan: "completo", tier: "standard", household: "singolo", trial: false },
    });
    // gli altri servizi non partono con un prezzo ne' con una formula
    const normale = leggiNuovoOrdine({ ...corpo, subscription: abb }, "Account", "2026-09-27");
    expect(normale.ok && normale.value.priceCents).toBeNull();
    expect(normale.ok && normale.value.subscription).toBeNull();
    // un servizio sconosciuto torna al menu della settimana
    const strano = leggiNuovoOrdine({ ...corpo, service: "boh" }, "Account", "2026-09-27");
    expect(strano.ok && strano.value.service).toBe("menu-settimana");
  });

  it("il prezzo proposto segue formula, fascia, ritiro e nucleo", () => {
    const prezzo = (subscription: Record<string, unknown>, fulfillment = "delivery") => {
      const e = leggiNuovoOrdine({ ...corpo, service: "abbonamento", plan: {}, subscription, fulfillment, address: "Via Roma 1" }, "Account", "2026-09-27");
      return e.ok ? e.value.priceCents : e.error;
    };
    expect(prezzo({ plan: "pranzo" })).toBe(17300); // Standard, da solo: i valori di partenza
    expect(prezzo({ plan: "full7", tier: "plus" })).toBe(94600);
    expect(prezzo({ plan: "completo" }, "pickup")).toBe(52000); // solo listino
    expect(prezzo({ plan: "completo", household: "coppia" })).toBe(52000); // solo listino
    expect(prezzo({ plan: "completo", household: "coppia" }, "pickup")).toBe(52000); // solo listino
  });

  it("l'abbonamento vuole una formula valida", () => {
    const errore = (subscription: unknown) => {
      const e = leggiNuovoOrdine({ ...corpo, service: "abbonamento", plan: {}, subscription }, "Account", "2026-09-27");
      return e.ok ? null : e.error;
    };
    expect(errore(undefined)).toMatch(/formula/);
    expect(errore({})).toMatch(/formula/);
    expect(errore({ plan: "full8" })).toMatch(/formula/);
    expect(errore({ plan: "pranzo", tier: "oro" })).toMatch(/Fascia/);
    expect(errore({ plan: "pranzo", household: "tribu" })).toMatch(/coppia/);
    expect(errore({ plan: "pranzo", trial: "si" })).toMatch(/prova/);
  });

  it("la formula ha valori di partenza: Standard, da solo, senza prova", () => {
    const e = leggiSceltaAbbonamento({ plan: "leggero" });
    expect(e).toEqual({ ok: true, value: { plan: "leggero", tier: "standard", household: "singolo", trial: false } });
    const p = leggiSceltaAbbonamento({ plan: "full6", tier: "plus", household: "famiglia", trial: true });
    expect(p).toEqual({ ok: true, value: { plan: "full6", tier: "plus", household: "famiglia", trial: true } });
  });

  it("il piano allegato all'abbonamento tiene solo i pasti della formula", () => {
    const casella = { piatto: piatto.id, extra: [] };
    const settimana = {
      lun: { pranzo: casella, cena: casella },
      sab: { pranzo: casella, cena: casella },
      dom: { pranzo: casella },
    };
    expect(soloPastiDellaFormula(settimana, "pranzo")).toEqual({ lun: { pranzo: casella } });
    expect(soloPastiDellaFormula(settimana, "leggero")).toEqual({ lun: { pranzo: casella, cena: casella } });
    expect(soloPastiDellaFormula(settimana, "completo")).toEqual(settimana);
    // Full 6 salta la domenica; il compositore non ha la colazione, quindi restano pranzo e cena
    expect(soloPastiDellaFormula(settimana, "full6")).toEqual({ lun: { pranzo: casella, cena: casella }, sab: { pranzo: casella, cena: casella } });
    const conPiano = leggiNuovoOrdine({ ...corpo, service: "abbonamento", plan: settimana, subscription: { plan: "pranzo" } }, "Account", "2026-09-27");
    expect(conPiano.ok && conPiano.value.items.map((v) => `${v.day}-${v.meal}`)).toEqual(["lun-pranzo"]);
  });

  it("la formula si legge dalle colonne sub_*; senza colonne e' il Pranzo di prima", () => {
    expect(sceltaDaRiga({ sub_plan: "full6", sub_tier: "plus", sub_household: "coppia", sub_trial: 1 }))
      .toEqual({ plan: "full6", tier: "plus", household: "coppia", trial: true });
    expect(sceltaDaRiga({})).toEqual({ plan: "pranzo", tier: "standard", household: "singolo", trial: false });
    expect(sceltaDaRiga({ sub_plan: "boh", sub_tier: "oro", sub_household: "x", sub_trial: 9 }))
      .toEqual({ plan: "pranzo", tier: "standard", household: "singolo", trial: false });
    // solo gli abbonamenti hanno una formula
    expect(ordineDaRiga({ ...riga, sub_plan: "full7" }, false).subscription).toBeNull();
    expect(ordineDaRiga({ ...riga, service: "abbonamento", sub_plan: "full7", sub_tier: "plus" }, false).subscription)
      .toEqual({ plan: "full7", tier: "plus", household: "singolo", trial: false });
    expect(ordineDaRiga({ ...riga, service: "abbonamento" }, true).subscription?.plan).toBe("pranzo");
  });

  it("Matteo puo' cambiare la formula di un abbonamento, e la cronologia lo scrive", () => {
    const attuale = stato({ subscription: { plan: "completo", tier: "standard", household: "singolo", trial: false } });
    const cambio = leggiModificaAdmin({ subscription: { plan: "full6", tier: "plus", household: "coppia", trial: true } }, attuale, "pickup", "abbonamento");
    expect(cambio.ok).toBe(true);
    if (!cambio.ok) return;
    expect(cambio.value.next.subscription).toEqual({ plan: "full6", tier: "plus", household: "coppia", trial: true });
    expect(cambio.value.cambi).toEqual([
      { type: "note", detail: "Formula: Full 6 · Plus, in coppia, con la settimana di prova", from_status: null, to_status: null },
    ]);
    // stessa scelta: nessun evento; altro servizio: rifiutata; scelta malformata: rifiutata
    const uguale = leggiModificaAdmin({ subscription: attuale.subscription }, attuale, "pickup", "abbonamento");
    expect(uguale.ok && uguale.value.cambi).toEqual([]);
    expect(leggiModificaAdmin({ subscription: { plan: "pranzo" } }, stato(), "pickup", "menu-settimana").ok).toBe(false);
    expect(leggiModificaAdmin({ subscription: { plan: "nessuna" } }, attuale, "pickup", "abbonamento").ok).toBe(false);
  });

  it("una data con l'anno fuori dal 2000-2100 e' un errore 400, non un'eccezione del calendario", () => {
    for (const data of ["0002-10-05", "9999-12-31", "1999-12-31", "2101-01-01"]) {
      const esito = leggiModificaAdmin({ fulfillmentDate: data }, stato(), "pickup", "abbonamento");
      expect(esito).toMatchObject({ ok: false, status: 400 });
    }
  });

  it("per l'abbonamento la cronologia scrive l'inizio e fin quando vale", () => {
    const esito = leggiModificaAdmin({ status: "confirmed", productionDate: "2026-10-05", fulfillmentDate: "2026-10-05" }, stato(), "pickup", "abbonamento");
    expect(esito.ok && esito.value.cambi.find((c) => c.type === "schedule")?.detail)
      .toBe("Inizio: lunedì 5 ottobre 2026, fino a mercoledì 4 novembre 2026");
  });

  it("un abbonamento letto dal database resta un abbonamento", () => {
    expect(ordineDaRiga({ ...riga, service: "abbonamento" }, true).service).toBe("abbonamento");
    expect(leggiNuovoOrdine({ ...corpo, plan: {}, service: "home-cooking" }, "", "2026-09-27").ok).toBe(true);
  });

  it("una data scritta male e' un errore, non una richiesta senza data", () => {
    for (const requestedDate of ["05/10/2026", "2026-02-30", "2026-10-01T10:00:00Z", 20261001, "domani", {}]) {
      expect(leggiNuovoOrdine({ ...corpo, requestedDate }, "", "2026-09-27"), String(requestedDate)).toMatchObject({ ok: false, status: 400, error: "La data scelta non è valida" });
    }
    // nessuna data, e' una scelta valida
    for (const requestedDate of [undefined, null, "", "  "]) {
      expect(leggiNuovoOrdine({ ...corpo, requestedDate }, "", "2026-09-27")).toMatchObject({ ok: true, value: { requestedDate: null } });
    }
    expect(leggiNuovoOrdine({ ...corpo, requestedDate: " 2026-10-01 " }, "", "2026-09-27")).toMatchObject({ ok: true, value: { requestedDate: "2026-10-01" } });
    // gli altri errori restano com'erano: prima i dati mancanti
    expect(leggiNuovoOrdine({ ...corpo, requestedDate: "boh", phone: "1" }, "", "2026-09-27")).toMatchObject({ ok: false, error: "Completa nome, telefono e dati di ritiro o consegna" });
  });

  it("nome, telefono, comune e indirizzo stanno su una riga; le note tengono gli a capo ma non i caratteri di controllo", () => {
    const esito = leggiNuovoOrdine({
      ...corpo, name: " Mario\r\nBcc: spia@x.it ", phone: "333\n123 4567", comune: "Pe\tscara\u0000", address: "Via Roma\r\n1",
      fulfillment: "delivery", notes: " senza cipolla\r\nporzioni grandi\u0007 ",
    }, "", "2026-09-27");
    expect(esito).toMatchObject({ ok: true, value: { name: "Mario Bcc: spia@x.it", phone: "333 123 4567", comune: "Pe scara", address: "Via Roma 1", notes: "senza cipolla\nporzioni grandi" } });
    // il nome dell'account, se serve, e' ripulito allo stesso modo
    const dallAccount = leggiNuovoOrdine({ ...corpo, name: "" }, "Anna\r\nBianchi", "2026-09-27");
    expect(dallAccount.ok && dallAccount.value.name).toBe("Anna Bianchi");
  });

  it("le aggiunte ripetute dello stesso piatto contano una volta, nel piano salvato e nelle righe", () => {
    const extra = EXTRA[0].id;
    const piano = pianoDaCorpo({ lun: { pranzo: { piatto: piatto.id, extra: Array(500).fill(extra) } } });
    expect(piano.lun?.pranzo?.extra).toEqual([extra]);
    expect(pianoDaCorpo({ lun: { pranzo: { piatto: piatto.id, extra: [EXTRA[1].id, EXTRA[0].id, EXTRA[1].id] } } }).lun?.pranzo?.extra).toEqual([EXTRA[1].id, EXTRA[0].id]);
    expect(pianoDaCorpo("boh")).toEqual({});
    const esito = leggiNuovoOrdine({ ...corpo, plan: { lun: { pranzo: { piatto: piatto.id, extra: Array(500).fill(extra) } } } }, "", "2026-09-27");
    expect(esito.ok && esito.value.items[0].extras).toEqual([EXTRA[0].nome]);
    expect(esito.ok && esito.value.plan.lun?.pranzo?.extra).toEqual([extra]);
    // anche un piano arrivato da altrove (che puo' avere doppioni) non li riporta nelle righe
    expect(vociDalPiano({ lun: { pranzo: { piatto: piatto.id, extra: [extra, extra, extra] } } })[0].extras).toEqual([EXTRA[0].nome]);
  });

  it("usa il nome dell'account se il modulo lo lascia vuoto", () => {
    const esito = leggiNuovoOrdine({ ...corpo, name: "  " }, "Mario Bianchi", "2026-09-27");
    expect(esito.ok && esito.value.name).toBe("Mario Bianchi");
  });
});

describe("modifiche di Matteo", () => {
  it("registra un evento per ogni campo cambiato e nessuno per quelli uguali", () => {
    const esito = leggiModificaAdmin({
      status: "confirmed", productionDate: "2026-09-30", fulfillmentDate: "2026-10-01",
      internalNote: "  porzioni grandi ", customerMessage: "Ci vediamo giovedì", priceCents: 4500, paid: true, notify: true,
    }, stato(), "pickup");
    expect(esito.ok).toBe(true);
    if (!esito.ok) return;
    expect(esito.value.cambi.map((c) => c.type)).toEqual(["status", "schedule", "note", "message", "price", "payment"]);
    expect(esito.value.cambi[0]).toMatchObject({ from_status: "requested", to_status: "confirmed" });
    expect(esito.value.cambi[1].detail).toBe("Produzione: mercoledì 30 settembre 2026 · Ritiro: giovedì 1 ottobre 2026");
    expect(esito.value.cambi[4].detail).toBe("Totale concordato: € 45,00");
    expect(esito.value.next.internal_note).toBe("porzioni grandi");
    expect(esito.value.next.paid).toBe(1);
    expect(esito.value.avvisaCliente).toBe(true);

    const niente = leggiModificaAdmin({ internalNote: "" }, stato(), "pickup");
    expect(niente.ok && niente.value.cambi).toEqual([]);
  });

  it("avvisa il cliente solo se richiesto e se cambia lo stato o arriva un messaggio", () => {
    const base = stato({ status: "confirmed", production_date: "2026-09-30", fulfillment_date: "2026-10-01" });
    const soloPrezzo = leggiModificaAdmin({ priceCents: 3000, notify: true }, base, "pickup");
    expect(soloPrezzo.ok && soloPrezzo.value.avvisaCliente).toBe(false);
    const senzaNotify = leggiModificaAdmin({ status: "ready" }, base, "pickup");
    expect(senzaNotify.ok && senzaNotify.value.avvisaCliente).toBe(false);
    const messaggio = leggiModificaAdmin({ customerMessage: "Pronto da martedì", notify: true }, base, "pickup");
    expect(messaggio.ok && messaggio.value.avvisaCliente).toBe(true);
    const messaggioTolto = leggiModificaAdmin({ customerMessage: "", notify: true }, { ...base, customer_message: "x" }, "pickup");
    expect(messaggioTolto.ok && messaggioTolto.value.avvisaCliente).toBe(false);
  });

  it("mantiene i vincoli su date e stati", () => {
    expect(leggiModificaAdmin({ status: "spedito" }, stato(), "pickup")).toMatchObject({ ok: false, status: 400 });
    expect(leggiModificaAdmin({ status: "confirmed" }, stato(), "pickup")).toMatchObject({ ok: false, status: 400 });
    expect(leggiModificaAdmin({ productionDate: "2026-10-02", fulfillmentDate: "2026-10-01" }, stato(), "pickup").ok).toBe(false);
    expect(leggiModificaAdmin({ productionDate: "2026-02-30" }, stato(), "pickup").ok).toBe(false);
    // Una vecchia richiesta confermata senza date resta modificabile nel prezzo.
    expect(leggiModificaAdmin({ priceCents: 1000 }, stato({ status: "confirmed" }), "pickup").ok).toBe(true);
    expect(leggiModificaAdmin({ status: "cancelled" }, stato(), "pickup").ok).toBe(true);
  });

  it("controlla tipi e limiti di prezzo, pagamento e testi", () => {
    expect(leggiModificaAdmin({ priceCents: 12.5 }, stato(), "pickup").ok).toBe(false);
    expect(leggiModificaAdmin({ priceCents: -1 }, stato(), "pickup").ok).toBe(false);
    expect(leggiModificaAdmin({ priceCents: 1_000_001 }, stato(), "pickup").ok).toBe(false);
    expect(leggiModificaAdmin({ priceCents: "4500" }, stato(), "pickup").ok).toBe(false);
    expect(leggiModificaAdmin({ priceCents: null }, stato({ price_cents: 100 }), "pickup")).toMatchObject({ ok: true });
    expect(leggiModificaAdmin({ paid: "si" }, stato(), "pickup").ok).toBe(false);
    expect(leggiModificaAdmin({ customerMessage: "x".repeat(1001) }, stato(), "pickup").ok).toBe(false);
    expect(leggiModificaAdmin({ internalNote: "x".repeat(2001) }, stato(), "pickup").ok).toBe(false);
  });

  it("scrive gli importi all'italiana", () => {
    expect(euroTesto(0)).toBe("€ 0,00");
    expect(euroTesto(4505)).toBe("€ 45,05");
    expect(euroTesto(123456)).toBe("€ 1.234,56");
  });
});

describe("annullamento del cliente", () => {
  it("consente solo lo stato cancelled, solo al proprietario e solo prima della conferma", () => {
    expect(leggiAnnullamentoCliente({ status: "cancelled" }, { status: "requested", user_id: "u1" }, "u1")).toEqual({ ok: true, value: null });
    expect(leggiAnnullamentoCliente({ status: "cancelled" }, { status: "requested", user_id: "u2" }, "u1")).toMatchObject({ status: 404 });
    expect(leggiAnnullamentoCliente({ status: "confirmed" }, { status: "requested", user_id: "u1" }, "u1")).toMatchObject({ status: 403 });
    expect(leggiAnnullamentoCliente({ status: "cancelled", priceCents: 0 }, { status: "requested", user_id: "u1" }, "u1")).toMatchObject({ status: 403 });
    expect(leggiAnnullamentoCliente({ status: "cancelled" }, { status: "confirmed", user_id: "u1" }, "u1")).toMatchObject({ status: 409 });
    expect(leggiAnnullamentoCliente({ status: "cancelled" }, { status: "cancelled", user_id: "u1" }, "u1")).toMatchObject({ status: 409 });
  });
});
