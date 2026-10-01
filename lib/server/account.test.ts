import { describe, expect, it } from "vitest";
import { datiUtentePuliti, immagineAccount, MAX_NOME_ACCOUNT, nomeAccount } from "./account";

describe("nome dell'account", () => {
  it("sta su una riga, senza caratteri di controllo, entro il limite", () => {
    expect(nomeAccount("  Giulia\r\nRossi\u0007 ")).toBe("Giulia Rossi");
    expect(nomeAccount("x".repeat(100_000))).toHaveLength(MAX_NOME_ACCOUNT);
    expect(nomeAccount(`${"x".repeat(99)}   y`)).toBe("x".repeat(99));
  });

  it("se resta vuoto ripiega sull'email, e in ultimo su 'Cliente'", () => {
    expect(nomeAccount("   ", "giulia.rossi@example.com")).toBe("giulia.rossi");
    expect(nomeAccount(undefined, "luca@example.com")).toBe("luca");
    expect(nomeAccount(42, 42)).toBe("Cliente");
    expect(nomeAccount("", "@example.com")).toBe("Cliente");
  });
});

describe("immagine dell'account", () => {
  it("accetta solo un indirizzo https ragionevole", () => {
    expect(immagineAccount("https://lh3.googleusercontent.com/a/abc=s96-c")).toBe("https://lh3.googleusercontent.com/a/abc=s96-c");
    expect(immagineAccount("javascript:alert(1)")).toBeNull();
    expect(immagineAccount("data:image/png;base64,AAAA")).toBeNull();
    expect(immagineAccount("http://example.com/a.png")).toBeNull();
    expect(immagineAccount("https://example.com/a b.png")).toBeNull();
    expect(immagineAccount(`https://example.com/${"a".repeat(600)}`)).toBeNull();
    expect(immagineAccount("")).toBeNull();
    expect(immagineAccount(null)).toBeNull();
    expect(immagineAccount({ url: "https://example.com" })).toBeNull();
  });
});

describe("dati dell'utente prima del database", () => {
  it("in creazione sistema sempre il nome e tocca l'immagine solo se c'e'", () => {
    expect(datiUtentePuliti({ name: "x".repeat(500), email: "a@b.it" }, true)).toEqual({ name: "x".repeat(100), email: "a@b.it" });
    expect(datiUtentePuliti({ name: "", email: "giulia@example.com", image: "javascript:x" }, true))
      .toEqual({ name: "giulia", email: "giulia@example.com", image: null });
  });

  it("in aggiornamento lascia stare i campi che non ci sono", () => {
    expect(datiUtentePuliti({ updatedAt: 1 }, false)).toEqual({ updatedAt: 1 });
    expect(datiUtentePuliti({ image: "https://example.com/a.png" }, false)).toEqual({ image: "https://example.com/a.png" });
    expect(datiUtentePuliti({ name: " Luca\n" }, false)).toEqual({ name: "Luca" });
    expect(datiUtentePuliti({ image: null }, false)).toEqual({ image: null });
  });
});
