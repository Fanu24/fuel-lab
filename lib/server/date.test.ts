import { describe, expect, it } from "vitest";
import { dataEstesa, dataValida, daTimestamp, giorniFino, giornoRoma, oggiRoma, spostaGiorno, tsSqlite } from "./date";

describe("date del server", () => {
  it("legge i due formati di D1 e li riporta a quello del contratto", () => {
    expect(tsSqlite("2026-09-27 11:37:38")).toBe("2026-09-27 11:37:38");
    expect(tsSqlite("2026-09-27T11:37:38.936Z")).toBe("2026-09-27 11:37:38");
    expect(tsSqlite(Date.UTC(2026, 8, 27, 11, 37, 38))).toBe("2026-09-27 11:37:38");
    expect(tsSqlite("non una data")).toBeNull();
    expect(daTimestamp("")).toBeNull();
  });

  it("assegna il giorno di Pescara, anche a cavallo della mezzanotte e dell'ora legale", () => {
    // 22:30 UTC di martedi' 29 settembre = 00:30 di mercoledi' a Pescara (UTC+2).
    expect(giornoRoma("2026-09-29 22:30:00")).toBe("2026-09-30");
    // Dopo il cambio d'ora (25 ottobre 2026) Pescara e' a UTC+1.
    expect(giornoRoma("2026-11-02 22:30:00")).toBe("2026-11-02");
    expect(giornoRoma("2026-11-02 23:30:00")).toBe("2026-11-03");
    expect(oggiRoma(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01-01");
  });

  it("accetta solo date di calendario esistenti", () => {
    expect(dataValida("2026-02-28")).toBe(true);
    expect(dataValida("2026-02-29")).toBe(false);
    expect(dataValida("2026-9-1")).toBe(false);
    expect(dataValida(null)).toBe(false);
  });

  it("costruisce intervalli completi dal piu' vecchio al piu' recente", () => {
    expect(spostaGiorno("2026-03-01", -1)).toBe("2026-02-28");
    expect(giorniFino("2026-01-02", 4)).toEqual(["2025-12-30", "2025-12-31", "2026-01-01", "2026-01-02"]);
    expect(giorniFino("2026-09-27", 30)).toHaveLength(30);
  });

  it("scrive le date per esteso in italiano", () => {
    expect(dataEstesa("2026-10-02")).toBe("venerdì 2 ottobre 2026");
    expect(dataEstesa("2026-11-01")).toBe("domenica 1 novembre 2026");
  });
});
