import { describe, expect, it } from "vitest";
import { indietroDisponibile, profonditaDi, profonditaDopoVai, statoDopoVai, urlDiVista, vistaDaUrl } from "./pannello-navigazione";

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

  it("la settimana del cliente sta nell'indirizzo e si rilegge uguale, con o senza modifica", () => {
    // 2026-11-02 è un lunedì
    const conSettimana = { tipo: "cliente", clienteId: "c1", settimana: "2026-11-02" } as const;
    expect(urlDiVista(conSettimana, "/admin")).toBe("/admin?vista=cliente&cliente=c1&settimana=2026-11-02");
    expect(vistaDaUrl("?vista=cliente&cliente=c1&settimana=2026-11-02")).toEqual(conSettimana);

    const conModifica = { tipo: "cliente", clienteId: "c1", modifica: true, settimana: "2026-11-02" } as const;
    expect(urlDiVista(conModifica, "/admin")).toBe("/admin?vista=cliente&cliente=c1&modifica=1&settimana=2026-11-02");
    expect(vistaDaUrl(urlDiVista(conModifica, "/admin").slice("/admin".length))).toEqual(conModifica);
  });

  it("senza settimana l'indirizzo del cliente non cambia, e la lettura non inventa una settimana", () => {
    expect(urlDiVista({ tipo: "cliente", clienteId: "c1" }, "/admin")).toBe("/admin?vista=cliente&cliente=c1");
    expect(vistaDaUrl("?vista=cliente&cliente=c1")).toEqual({ tipo: "cliente", clienteId: "c1" });
    expect(vistaDaUrl("?vista=cliente&cliente=c1")).not.toHaveProperty("settimana");
  });

  it("una settimana che non è un lunedì vero viene scartata: si mostra la settimana di oggi", () => {
    const soloCliente = { tipo: "cliente", clienteId: "c1" };
    expect(vistaDaUrl("?vista=cliente&cliente=c1&settimana=2026-11-03")).toEqual(soloCliente); // martedì
    expect(vistaDaUrl("?vista=cliente&cliente=c1&settimana=2026-02-30")).toEqual(soloCliente); // non esiste
    expect(vistaDaUrl("?vista=cliente&cliente=c1&settimana=domani")).toEqual(soloCliente);
    expect(vistaDaUrl("?vista=cliente&cliente=c1&settimana=")).toEqual(soloCliente);
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

  it("vai con sostituisci lascia la voce al suo livello; senza, la voce nuova sta sopra", () => {
    expect(statoDopoVai(null, false)).toEqual({ pannello: true, profondita: 1 });
    expect(statoDopoVai({ pannello: true, profondita: 2 }, false)).toEqual({ pannello: true, profondita: 3 });
    expect(statoDopoVai({ pannello: true, profondita: 2 }, true)).toEqual({ pannello: true, profondita: 2 });
    // una voce che non e' del pannello, sostituita, resta a profondita' zero
    expect(statoDopoVai(null, true)).toEqual({ pannello: true, profondita: 0 });
  });

  it("indietro torna nella storia solo se ci sono voci del pannello sotto", () => {
    // giorno (voce iniziale) -> Altro (profondita 1) -> Indietro: si torna al giorno
    expect(indietroDisponibile(null)).toBe(false);
    expect(indietroDisponibile({ pannello: true, profondita: 0 })).toBe(false);
    expect(indietroDisponibile({ pannello: true, profondita: profonditaDopoVai(null, true) })).toBe(true);
  });
});
