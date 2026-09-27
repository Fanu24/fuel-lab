import { describe, expect, it } from "vitest";
import { giorniFino } from "./date";
import { conteggiGiornalieri, leggiGiorni, nelPeriodo, ordiniGiornalieri, ordiniPerStato, ricavi, topPiatti, trafficoGiornaliero } from "./metriche";

const voci = (...nomi: string[]) => JSON.stringify(nomi.map((name) => ({ id: name, name, day: "lun", meal: "pranzo", extras: [] })));

describe("numeri del pannello", () => {
  it("legge ?days con default 30 e bordi 7..365", () => {
    expect(leggiGiorni(null)).toBe(30);
    expect(leggiGiorni("abc")).toBe(30);
    expect(leggiGiorni("3")).toBe(7);
    expect(leggiGiorni("90")).toBe(90);
    expect(leggiGiorni("1000")).toBe(365);
  });

  it("riempie le serie con gli zeri, dal giorno piu' vecchio", () => {
    const giorni = giorniFino("2026-09-27", 7);
    const ordini = nelPeriodo(giorni, [
      { created_at: "2026-09-26 22:30:00", status: "requested", meals: 4 }, // 27 a Pescara
      { created_at: "2026-09-25 10:00:00", status: "confirmed", meals: 2 },
      { created_at: "2026-09-25 11:00:00", status: "cancelled", meals: 9 },
      { created_at: "2026-09-10 10:00:00", status: "confirmed", meals: 2 }, // fuori intervallo
    ], (o) => o.created_at);
    const serie = ordiniGiornalieri(giorni, ordini);
    expect(serie).toHaveLength(7);
    expect(serie[0]).toEqual({ day: "2026-09-21", orders: 0, meals: 0 });
    expect(serie.find((p) => p.day === "2026-09-25")).toEqual({ day: "2026-09-25", orders: 1, meals: 2 });
    expect(serie.at(-1)).toEqual({ day: "2026-09-27", orders: 1, meals: 4 });
    expect(conteggiGiornalieri(giorni, ["2026-09-27", "2026-09-27", "2026-01-01"]).at(-1)).toEqual({ day: "2026-09-27", count: 2 });
    expect(trafficoGiornaliero(giorni, [{ day: "2026-09-22", views: 5 }]).map((p) => p.views)).toEqual([0, 5, 0, 0, 0, 0, 0]);
  });

  it("conta tutti gli stati, anche quelli a zero, nell'ordine del flusso", () => {
    expect(ordiniPerStato([{ status: "ready" }, { status: "ready" }, { status: "requested" }])).toEqual([
      { status: "requested", count: 1 }, { status: "confirmed", count: 0 }, { status: "preparing", count: 0 },
      { status: "ready", count: 2 }, { status: "completed", count: 0 }, { status: "cancelled", count: 0 },
    ]);
  });

  it("classifica i piatti escludendo le richieste annullate", () => {
    expect(topPiatti([
      { status: "confirmed", items_json: voci("Pollo", "Salmone", "Pollo") },
      { status: "cancelled", items_json: voci("Salmone", "Salmone", "Salmone") },
      { status: "requested", items_json: "rotto" },
      { status: "ready", items_json: voci("Manzo") },
    ])).toEqual([{ name: "Pollo", count: 2 }, { name: "Manzo", count: 1 }, { name: "Salmone", count: 1 }]);
  });

  it("somma i ricavi concordati, pagati e da incassare", () => {
    expect(ricavi([
      { status: "ready", price_cents: 4500, paid: 1 },
      { status: "confirmed", price_cents: 3000, paid: 0 },
      { status: "cancelled", price_cents: 9999, paid: 1 },
      { status: "requested", price_cents: null, paid: 0 },
    ])).toEqual({ agreedCents: 7500, paidCents: 4500, unpaidCents: 3000 });
  });

  it("non conta come credito il prezzo proposto di una richiesta da confermare", () => {
    expect(ricavi([
      { status: "requested", price_cents: 18000, paid: 0 },
      { status: "requested", price_cents: 2000, paid: 1 },
      { status: "completed", price_cents: 6450, paid: 0 },
    ])).toEqual({ agreedCents: 8450, paidCents: 2000, unpaidCents: 6450 });
  });
});
