import { describe, expect, it } from "vitest";
import { impostazioniVuote } from "../api";
import { PIATTI } from "../catalogo";
import { controllaDataPreferita, impostazioniDaRighe, leggiAvviso, leggiChiusure, leggiImpostazioni, leggiPiatti } from "./impostazioni";

const OGGI = "2026-09-27";

const errore = (esito: { ok: boolean; error?: string; status?: number }) => {
  expect(esito.ok).toBe(false);
  expect(esito.status).toBe(400);
  return esito.error ?? "";
};

describe("leggiPiatti", () => {
  it("accetta solo id del catalogo e toglie i doppioni", () => {
    expect(leggiPiatti([PIATTI[0].id, PIATTI[1].id, PIATTI[0].id])).toEqual({ ok: true, value: [PIATTI[0].id, PIATTI[1].id] });
    expect(leggiPiatti([])).toEqual({ ok: true, value: [] });
    expect(errore(leggiPiatti(["piatto-inventato"]))).toMatch(/sconosciuto/);
    expect(errore(leggiPiatti([3]))).toMatch(/sconosciuto/);
    expect(errore(leggiPiatti("noodles"))).toMatch(/non valido/);
  });
});

describe("leggiChiusure", () => {
  it("date valide, dal <= al, motivo su una riga, in ordine di data", () => {
    const esito = leggiChiusure([
      { dal: "2026-11-01", al: "2026-11-02", motivo: " Ponte\n dei santi " },
      { dal: "2026-10-05", al: "2026-10-05" },
      { dal: "2026-10-05", al: "2026-10-05", motivo: "" },
    ]);
    expect(esito).toEqual({
      ok: true,
      value: [
        { dal: "2026-10-05", al: "2026-10-05", motivo: "" },
        { dal: "2026-11-01", al: "2026-11-02", motivo: "Ponte dei santi" },
      ],
    });
  });

  it("dice cosa correggere e in quale riga", () => {
    expect(errore(leggiChiusure([{ dal: "2026-02-30", al: "2026-03-01" }]))).toMatch(/Chiusura 1: il primo giorno/);
    expect(errore(leggiChiusure([{ dal: "2026-10-05", al: "5 ottobre" }]))).toMatch(/l'ultimo giorno/);
    expect(errore(leggiChiusure([{ dal: "2026-10-05", al: "2026-10-06" }, { dal: "2026-10-09", al: "2026-10-05" }]))).toMatch(/Chiusura 2: il primo giorno viene dopo/);
    expect(errore(leggiChiusure([{ dal: "2026-10-05", al: "2026-10-06", motivo: "x".repeat(121) }]))).toMatch(/120/);
    expect(errore(leggiChiusure([null]))).toMatch(/non validi/);
    expect(errore(leggiChiusure({}))).toMatch(/non valido/);
  });

  it("al massimo venti chiusure", () => {
    const una = { dal: "2026-10-05", al: "2026-10-06", motivo: "" };
    expect(leggiChiusure(Array(20).fill(una)).ok).toBe(true);
    expect(errore(leggiChiusure(Array(21).fill(una)))).toMatch(/Al massimo 20/);
  });
});

describe("leggiAvviso", () => {
  it("testo fino a 180 caratteri, link facoltativo e interno", () => {
    expect(leggiAvviso({ attivo: true, testo: " Chiusi\nper ferie ", link: " /menu " })).toEqual({
      ok: true,
      value: { attivo: true, testo: "Chiusi per ferie", link: "/menu" },
    });
    expect(leggiAvviso({ attivo: false, testo: "", link: "" }).ok).toBe(true);
    expect(leggiAvviso({ attivo: true, testo: "x".repeat(180) }).ok).toBe(true);
    expect(errore(leggiAvviso({ attivo: true, testo: "x".repeat(181) }))).toMatch(/180/);
  });

  it("niente avviso acceso e vuoto, niente link esterni", () => {
    expect(errore(leggiAvviso({ attivo: true, testo: "  " }))).toMatch(/Scrivi il testo/);
    for (const link of ["//evil.com", "https://evil.com", "menu", "/\\evil.com", "javascript:alert(1)"]) {
      expect(errore(leggiAvviso({ attivo: true, testo: "Ciao", link })), link).toMatch(/pagina di questo sito/);
    }
    expect(errore(leggiAvviso({ attivo: true, testo: "Ciao", link: `/${"x".repeat(200)}` }))).toMatch(/200/);
    expect(errore(leggiAvviso({ attivo: "si", testo: "Ciao" }))).toMatch(/Avviso non valido/);
    expect(errore(leggiAvviso(null))).toMatch(/Avviso non valido/);
  });
});

describe("leggiImpostazioni", () => {
  it("salva solo le parti presenti", () => {
    expect(leggiImpostazioni({ piattiNonDisponibili: [PIATTI[2].id] })).toEqual({ ok: true, value: { piattiNonDisponibili: [PIATTI[2].id] } });
    const tutto = leggiImpostazioni({ ...impostazioniVuote(), altro: 1 });
    expect(tutto).toEqual({ ok: true, value: impostazioniVuote() });
  });

  it("un errore in una parte ferma tutto", () => {
    expect(errore(leggiImpostazioni({ piattiNonDisponibili: [], chiusure: [{ dal: "x", al: "y" }] }))).toMatch(/Chiusura 1/);
    expect(errore(leggiImpostazioni({}))).toMatch(/Niente da salvare/);
    expect(errore(leggiImpostazioni({ altro: true }))).toMatch(/Niente da salvare/);
  });
});

describe("impostazioniDaRighe", () => {
  it("legge le righe e rimette i predefiniti dove manca qualcosa", () => {
    expect(impostazioniDaRighe([])).toEqual(impostazioniVuote());
    const lette = impostazioniDaRighe([
      { key: "piattiNonDisponibili", value_json: JSON.stringify([PIATTI[0].id, "piatto-tolto"]) },
      { key: "chiusure", value_json: JSON.stringify([{ dal: "2026-10-05", al: "2026-10-11", motivo: "Ferie" }]) },
      { key: "avviso", value_json: "{rotto" },
      { key: "sconosciuta", value_json: "1" },
    ]);
    expect(lette).toEqual({
      piattiNonDisponibili: [PIATTI[0].id],
      chiusure: [{ dal: "2026-10-05", al: "2026-10-11", motivo: "Ferie" }],
      avviso: impostazioniVuote().avviso,
    });
  });
});

describe("controllaDataPreferita", () => {
  const chiusure = [{ dal: "2026-10-05", al: "2026-10-11", motivo: "Ferie" }];

  it("rifiuta un giorno dentro una chiusura con una frase chiara", () => {
    expect(errore(controllaDataPreferita("2026-10-05", chiusure, OGGI))).toBe("Matteo è chiuso dal 5 all’11 ottobre: scegli un altro giorno.");
    expect(errore(controllaDataPreferita("2026-10-11", chiusure, OGGI))).toMatch(/chiuso/);
  });

  it("lascia passare gli altri giorni e la data assente", () => {
    expect(controllaDataPreferita("2026-10-12", chiusure, OGGI)).toEqual({ ok: true, value: null });
    expect(controllaDataPreferita(null, chiusure, OGGI)).toEqual({ ok: true, value: null });
    expect(controllaDataPreferita("2026-10-05", [], OGGI)).toEqual({ ok: true, value: null });
  });
});
