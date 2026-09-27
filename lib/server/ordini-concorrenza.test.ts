import { describe, expect, it } from "vitest";
import { controllaStatoAtteso, erroreStatoCambiato, leggiModificaAdmin, type StatoModificabile } from "./ordini";

describe("stato atteso nelle modifiche di Matteo", () => {
  it("senza expectedStatus (client vecchi) non controlla niente", () => {
    expect(controllaStatoAtteso({}, "confirmed")).toEqual({ ok: true, value: null });
    expect(controllaStatoAtteso({ expectedStatus: null }, "confirmed")).toEqual({ ok: true, value: null });
  });

  it("passa se lo stato e' quello che Matteo vedeva", () => {
    expect(controllaStatoAtteso({ expectedStatus: "requested", status: "confirmed" }, "requested").ok).toBe(true);
  });

  it("409 con lo stato attuale in italiano se nel frattempo e' cambiato", () => {
    const esito = controllaStatoAtteso({ expectedStatus: "requested", status: "confirmed" }, "cancelled");
    expect(esito).toEqual({
      ok: false,
      status: 409,
      error: "L'ordine è cambiato nel frattempo: ora è «Annullato». Ho ricaricato la scheda, controlla e riprova.",
    });
    expect(erroreStatoCambiato("ready")).toContain("«Pronto»");
  });

  it("400 se expectedStatus non e' uno stato: un controllo illeggibile non passa in silenzio", () => {
    for (const expectedStatus of ["boh", "", 3, true, {}]) {
      const esito = controllaStatoAtteso({ expectedStatus }, "requested");
      expect(esito).toEqual({ ok: false, status: 400, error: "Stato atteso non valido" });
    }
  });

  it("la validazione delle modifiche ignora expectedStatus: non diventa un cambio ne' un evento", () => {
    const stato: StatoModificabile = {
      status: "requested", production_date: null, fulfillment_date: null, internal_note: "", customer_message: "", price_cents: null, paid: 0,
    };
    const esito = leggiModificaAdmin({ expectedStatus: "requested", priceCents: 1000 }, stato, "pickup");
    expect(esito.ok && esito.value.cambi.map((c) => c.type)).toEqual(["price"]);
  });
});
