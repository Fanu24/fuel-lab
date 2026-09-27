import { describe, expect, it } from "vitest";
import {
  PREZZO_ABBONAMENTO,
  PREZZO_ABBONAMENTO_CENTESIMI,
  eFeriale,
  fineAbbonamento,
  frasePeriodo,
  nelPeriodo,
  periodoAbbonamento,
  pranziNelPeriodo,
  prossimoPranzo,
  stessoGiornoMeseDopo,
} from "./abbonamento";

/* Il periodo di un abbonamento: dalla data d'inizio al giorno prima dello
   stesso giorno del mese dopo. Ottobre 2026 comincia di giovedi'. */

describe("periodo dell'abbonamento", () => {
  it("dura un mese: fino al giorno prima dello stesso giorno del mese dopo", () => {
    expect(periodoAbbonamento("2026-10-05")).toEqual({ dal: "2026-10-05", al: "2026-11-04" });
    expect(fineAbbonamento("2026-10-01")).toBe("2026-10-31");
    expect(fineAbbonamento("2026-12-15")).toBe("2027-01-14"); // scavalca il capodanno
  });

  it("se il mese dopo non ha quel giorno, conta il suo ultimo giorno", () => {
    expect(stessoGiornoMeseDopo("2027-01-31")).toBe("2027-02-28");
    expect(fineAbbonamento("2027-01-31")).toBe("2027-02-27");
    expect(stessoGiornoMeseDopo("2028-01-30")).toBe("2028-02-29"); // bisestile
    expect(fineAbbonamento("2026-03-31")).toBe("2026-04-29");
    // il mese dopo ricomincia dal giorno in cui il primo finisce + 1
    expect(stessoGiornoMeseDopo("2026-10-05")).toBe("2026-11-05");
  });

  it("dice se un giorno sta nel periodo, estremi compresi", () => {
    expect(nelPeriodo("2026-10-05", "2026-10-05")).toBe(true);
    expect(nelPeriodo("2026-10-05", "2026-11-04")).toBe(true);
    expect(nelPeriodo("2026-10-05", "2026-11-05")).toBe(false);
    expect(nelPeriodo("2026-10-05", "2026-10-04")).toBe(false);
  });

  it("i pranzi sono dal lunedi' al venerdi'", () => {
    expect(eFeriale("2026-10-02")).toBe(true); // venerdi'
    expect(eFeriale("2026-10-03")).toBe(false); // sabato
    expect(eFeriale("2026-10-04")).toBe(false); // domenica
    expect(pranziNelPeriodo(periodoAbbonamento("2026-10-01"))).toBe(22);
    expect(pranziNelPeriodo({ dal: "2026-10-03", al: "2026-10-04" })).toBe(0);
  });

  it("il prossimo pranzo salta il fine settimana e si ferma a fine periodo", () => {
    expect(prossimoPranzo("2026-10-01", "2026-09-27")).toBe("2026-10-01"); // non ancora iniziato
    expect(prossimoPranzo("2026-10-01", "2026-10-03")).toBe("2026-10-05"); // sabato -> lunedi'
    expect(prossimoPranzo("2026-10-01", "2026-10-31")).toBeNull(); // ultimo giorno, sabato
    expect(prossimoPranzo("2026-10-01", "2026-11-02")).toBeNull();
  });

  it("scrive il periodo a parole, con l'anno solo quando serve", () => {
    expect(frasePeriodo(periodoAbbonamento("2026-10-05"), "2026-09-27")).toBe("dal 5 ottobre al 4 novembre");
    expect(frasePeriodo(periodoAbbonamento("2026-10-01"), "2026-09-27")).toBe("dal 1° al 31 ottobre");
    expect(frasePeriodo(periodoAbbonamento("2026-12-15"), "2026-09-27")).toBe("dal 15 dicembre 2026 al 14 gennaio 2027");
  });

  it("il prezzo in centesimi discende da quello in euro", () => {
    expect(PREZZO_ABBONAMENTO_CENTESIMI).toBe(PREZZO_ABBONAMENTO * 100);
    expect(PREZZO_ABBONAMENTO_CENTESIMI).toBe(23900);
  });
});
