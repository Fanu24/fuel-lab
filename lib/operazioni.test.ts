import { describe, expect, it } from "vitest";
import { aggregateItems, operationalQueues, type Order } from "./operazioni";

const order = (id: string, changes: Partial<Order> = {}): Order => ({
  id, user_id: id, email: `${id}@example.com`, status: "requested", service: "menu-settimana",
  fulfillment: "pickup", requested_date: null, production_date: null, fulfillment_date: null,
  customer_name: id, phone: "3331234567", comune: "Pescara", address: "",
  notes: "", internal_note: "", dietary_preferences: null, meals: 2, created_at: "2026-09-26 10:00:00", updated_at: "2026-09-26 10:00:00",
  items: [{ id: "pollo", name: "Pollo e riso", day: "lunedi", meal: "pranzo", extras: ["Verdure"] }],
  ...changes,
});

describe("code operative di Matteo", () => {
  it("separa la preferenza del cliente dalla produzione confermata", () => {
    const data = operationalQueues([
      order("nuova", { requested_date: "2026-09-27" }),
      order("oggi", { status: "confirmed", production_date: "2026-09-27", fulfillment_date: "2026-09-28" }),
    ], "2026-09-27");
    expect(data.newRequests.map((item) => item.id)).toEqual(["nuova"]);
    expect(data.productionToday.map((item) => item.id)).toEqual(["oggi"]);
    expect(data.portionsToday).toBe(2);
  });

  it("evidenzia date mancanti e ritardi senza conteggiare ordini chiusi", () => {
    const data = operationalQueues([
      order("senza-data", { status: "confirmed" }),
      order("ritardo", { status: "ready", production_date: "2026-09-25", fulfillment_date: "2026-09-26" }),
      order("chiuso", { status: "completed", production_date: "2026-09-25", fulfillment_date: "2026-09-26" }),
    ], "2026-09-27");
    expect(data.unscheduled.map((item) => item.id)).toEqual(["senza-data"]);
    expect(data.overdue.map((item) => item.id)).toEqual(["ritardo"]);
    expect(data.attention.map((item) => item.id)).toEqual(["ritardo", "senza-data"]);
    expect(data.active).toHaveLength(2);
  });

  it("somma piatti ed extra per il foglio cucina", () => {
    const items = [order("a"), order("b")];
    expect(aggregateItems(items, "dishes")).toEqual([["Pollo e riso", 2]]);
    expect(aggregateItems(items, "extras")).toEqual([["Verdure", 2]]);
  });
});
