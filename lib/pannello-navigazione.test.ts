import { describe, expect, it } from "vitest";
import { indietroDisponibile, profonditaDi, profonditaDopoVai, urlDiVista, vistaDaUrl } from "./pannello-navigazione";

describe("vistaDaUrl e urlDiVista", () => {
  it("legge le viste dall'indirizzo, con la schermata del giorno come ripiego", () => {
    expect(vistaDaUrl("")).toEqual({ tipo: "giorno" });
    expect(vistaDaUrl("?vista=giorno")).toEqual({ tipo: "giorno" });
    expect(vistaDaUrl("?vista=boh")).toEqual({ tipo: "giorno" });
    expect(vistaDaUrl("?vista=nuovi")).toEqual({ tipo: "nuovi" });
    expect(vistaDaUrl("?vista=altro")).toEqual({ tipo: "altro" });
    expect(vistaDaUrl("?vista=cliente")).toEqual({ tipo: "giorno" });
    expect(vistaDaUrl("?vista=cliente&cliente=c1")).toEqual({ tipo: "cliente", clienteId: "c1" });
    expect(vistaDaUrl("?vista=cliente&cliente=c1&modifica=1")).toEqual({ tipo: "cliente", clienteId: "c1", modifica: true });
  });

  it("scrive l'indirizzo di una vista e lo rilegge uguale", () => {
    const viste = [
      { tipo: "giorno" },
      { tipo: "nuovi" },
      { tipo: "cliente", clienteId: "c 1", modifica: true },
    ] as const;
    for (const v of viste) {
      expect(vistaDaUrl(urlDiVista(v, "/admin").slice("/admin".length))).toEqual(v);
    }
    expect(urlDiVista({ tipo: "nuovi" }, "/admin")).toBe("/admin?vista=nuovi");
  });
});

describe("profondità nella storia", () => {
  it("una voce che non è del pannello ha profondità zero", () => {
    expect(profonditaDi(null)).toBe(0);
    expect(profonditaDi(undefined)).toBe(0);
    expect(profonditaDi({})).toBe(0);
    expect(profonditaDi({ profondita: 3 })).toBe(0);
    expect(profonditaDi({ pannello: true, profondita: -1 })).toBe(0);
    expect(profonditaDi({ pannello: true, profondita: 1.5 })).toBe(0);
    expect(profonditaDi({ pannello: true, profondita: 2 })).toBe(2);
  });

  it("vai crea una voce sopra quella attuale; una voce sostituita resta allo stesso livello", () => {
    expect(profonditaDopoVai(null, true)).toBe(1);
    expect(profonditaDopoVai({ pannello: true, profondita: 1 }, true)).toBe(2);
    expect(profonditaDopoVai({ pannello: true, profondita: 1 }, false)).toBe(1);
  });

  it("indietro torna nella storia solo se ci sono voci del pannello sotto", () => {
    // giorno (voce iniziale) -> Altro (profondita 1) -> Indietro: si torna al giorno
    expect(indietroDisponibile(null)).toBe(false);
    expect(indietroDisponibile({ pannello: true, profondita: 0 })).toBe(false);
    expect(indietroDisponibile({ pannello: true, profondita: profonditaDopoVai(null, true) })).toBe(true);
  });
});
