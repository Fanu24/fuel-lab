import { describe, expect, it } from "vitest";
import { leggiPercorso, MAX_PERCORSO } from "./analytics";

describe("percorso di una visita", () => {
  it("accetta i percorsi del sito e li porta in minuscolo senza barra finale", () => {
    expect(leggiPercorso("/")).toEqual({ ok: true, percorso: "/" });
    expect(leggiPercorso("/menu")).toEqual({ ok: true, percorso: "/menu" });
    expect(leggiPercorso("/Blog/Come-Fare-Meal-Prep/")).toEqual({ ok: true, percorso: "/blog/come-fare-meal-prep" });
    expect(leggiPercorso("/abbonamento/full6")).toEqual({ ok: true, percorso: "/abbonamento/full6" });
    expect(leggiPercorso("/blog/caff%C3%A8")).toEqual({ ok: true, percorso: "/blog/caff%c3%a8" });
  });

  it("rifiuta query, frammenti, caratteri strani, percorsi relativi, '//' e troppo lunghi", () => {
    for (const cattivo of ["/a?x=1", "/a#x", "/<script>alert(1)</script>", "/a b", "menu", "//evil.example", "/../etc", "/a\u0000b", "/a\b", ""]) {
      expect(leggiPercorso(cattivo)).toEqual({ ok: false });
    }
    expect(leggiPercorso("/" + "a".repeat(MAX_PERCORSO))).toEqual({ ok: false });
    expect(leggiPercorso("/" + "a".repeat(MAX_PERCORSO - 1))).toMatchObject({ ok: true });
    for (const nonTesto of [undefined, null, 5, {}, ["/menu"]]) expect(leggiPercorso(nonTesto)).toEqual({ ok: false });
  });

  it("il pannello di Matteo e le API non sono traffico del sito: percorso valido, ma da non contare", () => {
    for (const privato of ["/dashboard", "/dashboard/", "/dashboard/ordini", "/Dashboard/Cucina", "/api/me"]) {
      expect(leggiPercorso(privato)).toEqual({ ok: true, percorso: null });
    }
    // una pagina che comincia con la stessa parola non e' il pannello
    expect(leggiPercorso("/dashboardi")).toEqual({ ok: true, percorso: "/dashboardi" });
  });
});
