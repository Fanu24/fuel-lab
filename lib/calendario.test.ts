import { describe, expect, it } from "vitest";
import { fileIcs } from "./calendario";

describe("evento da calendario", () => {
  const ics = fileIcs({
    uid: "abc",
    giorno: "2026-10-01",
    titolo: "Ritiro FUEL LAB, 3 pasti",
    descrizione: "Via del Santuario 214; Pescara\nPorta la borsa",
    luogo: "Via del Santuario 214, 65124 Pescara",
    adesso: new Date("2026-09-27T10:00:00Z"),
  });

  it("e' un giorno intero, dal giorno al giorno dopo", () => {
    expect(ics).toContain("DTSTART;VALUE=DATE:20261001");
    expect(ics).toContain("DTEND;VALUE=DATE:20261002");
    expect(ics).toContain("DTSTAMP:20260927T100000Z");
  });

  it("fa l'escape di virgole, punti e virgola e a capo", () => {
    expect(ics).toContain("SUMMARY:Ritiro FUEL LAB\\, 3 pasti");
    expect(ics).toContain("DESCRIPTION:Via del Santuario 214\\; Pescara\\nPorta la borsa");
  });

  it("usa CRLF e righe entro 75 ottetti", () => {
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    for (const riga of ics.split("\r\n")) expect(new TextEncoder().encode(riga).length).toBeLessThanOrEqual(75);
  });

  it("passa il mese quando il giorno e' l'ultimo", () => {
    expect(fileIcs({ uid: "x", giorno: "2026-10-31", titolo: "t" })).toContain("DTEND;VALUE=DATE:20261101");
  });
});
