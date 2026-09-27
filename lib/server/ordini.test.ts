import { describe, expect, it } from "vitest";
import { PIATTI } from "../catalogo";
import {
  dettaglioDaRiga,
  euroTesto,
  eventiPerCliente,
  leggiAnnullamentoCliente,
  leggiModificaAdmin,
  leggiNuovoOrdine,
  ordineDaRiga,
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
    expect(leggiNuovoOrdine({ ...corpo, plan: {}, service: "home-cooking" }, "", "2026-09-27").ok).toBe(true);
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
