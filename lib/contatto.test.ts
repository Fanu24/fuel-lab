import { describe, expect, it } from "vitest";
import { ApiError, ETICHETTE_ARGOMENTO } from "./api";
import { EXTRA, PIATTI } from "./catalogo";
import {
  ARGOMENTI,
  EMAIL_CONTATTI,
  INDIRIZZO_COMPLETO,
  LIMITI,
  argomentoDaParam,
  bloccoSettimana,
  cifreTelefono,
  emailDaModulo,
  emailValida,
  linkEmail,
  linkMappa,
  preparaMessaggio,
  primoErrore,
  righeSettimana,
  spazioPerMessaggio,
  spiegaErroreInvio,
  telefonoValido,
  testoFinale,
  validaModulo,
  type DatiModulo,
} from "./contatto";
import type { Piano } from "./settimana";

const buono: DatiModulo = {
  nome: "Giulia",
  email: "giulia@example.com",
  telefono: "",
  comune: "Montesilvano",
  argomento: "info",
  messaggio: "Vorrei sapere se consegnate a Montesilvano il giovedì.",
};

describe("argomenti", () => {
  it("coprono esattamente le etichette del contratto", () => {
    expect([...ARGOMENTI].sort()).toEqual(Object.keys(ETICHETTE_ARGOMENTO).sort());
  });

  it("?servizio= preseleziona l'argomento, qualunque altra cosa torna a info", () => {
    expect(argomentoDaParam("home-cooking")).toBe("home-cooking");
    expect(argomentoDaParam("sui-tuoi-macro")).toBe("sui-tuoi-macro");
    expect(argomentoDaParam("consegna")).toBe("consegna");
    expect(argomentoDaParam("<script>")).toBe("info");
    expect(argomentoDaParam("")).toBe("info");
    expect(argomentoDaParam(null)).toBe("info");
    expect(argomentoDaParam(undefined)).toBe("info");
  });
});

describe("recapiti", () => {
  it("riconosce le email plausibili", () => {
    expect(emailValida("nome@gmail.com")).toBe(true);
    expect(emailValida("  nome.cognome+fuel@studio.co.uk ")).toBe(true);
    expect(emailValida("nome@gmail")).toBe(false);
    expect(emailValida("nome@.com")).toBe(false);
    expect(emailValida("nome@gmail..com")).toBe(false);
    expect(emailValida("nome gmail.com")).toBe(false);
    expect(emailValida("nome@@gmail.com")).toBe(false);
    expect(emailValida("")).toBe(false);
    expect(emailValida(`${"a".repeat(LIMITI.email)}@x.it`)).toBe(false);
  });

  it("conta solo le cifre del telefono, come il server", () => {
    expect(cifreTelefono("+39 333 123-4567")).toBe(12);
    expect(telefonoValido("085 123456")).toBe(true);
    expect(telefonoValido("12345678")).toBe(false);
    expect(telefonoValido("333 12 34 567")).toBe(true);
  });
});

describe("validaModulo", () => {
  it("un modulo completo non ha errori", () => {
    expect(validaModulo(buono)).toEqual({});
  });

  it("basta il telefono, senza email", () => {
    expect(validaModulo({ ...buono, email: "", telefono: "333 1234567" })).toEqual({});
  });

  it("il comune e' facoltativo", () => {
    expect(validaModulo({ ...buono, comune: "" })).toEqual({});
  });

  it("senza nome non parte", () => {
    expect(validaModulo({ ...buono, nome: "   " }).nome).toBeTruthy();
  });

  it("senza email e senza telefono segnala il gruppo, non i singoli campi", () => {
    const e = validaModulo({ ...buono, email: " ", telefono: "" });
    expect(e.recapito).toBeTruthy();
    expect(e.email).toBeUndefined();
    expect(e.telefono).toBeUndefined();
  });

  it("un'email scritta male blocca anche se il telefono e' buono", () => {
    const e = validaModulo({ ...buono, email: "giulia@gmail", telefono: "3331234567" });
    expect(e.email).toBeTruthy();
    expect(e.recapito).toBeUndefined();
  });

  it("un telefono con meno di 9 cifre non basta", () => {
    expect(validaModulo({ ...buono, email: "", telefono: "333 12" }).telefono).toMatch(/9 cifre/);
  });

  it("il messaggio va da 10 a 3000 caratteri, spazi esclusi ai bordi", () => {
    expect(validaModulo({ ...buono, messaggio: "" }).messaggio).toBeTruthy();
    expect(validaModulo({ ...buono, messaggio: "   ciao    " }).messaggio).toMatch(/10 caratteri/);
    expect(validaModulo({ ...buono, messaggio: "a".repeat(10) }).messaggio).toBeUndefined();
    expect(validaModulo({ ...buono, messaggio: "a".repeat(3000) }).messaggio).toBeUndefined();
    expect(validaModulo({ ...buono, messaggio: "a".repeat(3001) }).messaggio).toMatch(/3000/);
  });

  it("la settimana allegata conta nel limite dei 3000", () => {
    const allegato = "x".repeat(1000);
    expect(validaModulo({ ...buono, messaggio: "a".repeat(1998) }, allegato).messaggio).toBeUndefined();
    expect(validaModulo({ ...buono, messaggio: "a".repeat(1999) }, allegato).messaggio).toMatch(/allegat/);
  });

  it("rifiuta un argomento fuori elenco", () => {
    expect(validaModulo({ ...buono, argomento: "spam" }).argomento).toBeTruthy();
  });

  it("il fuoco va al primo errore nell'ordine della pagina", () => {
    expect(primoErrore({ messaggio: "x", nome: "y" })).toBe("nome");
    expect(primoErrore({ messaggio: "x", recapito: "y" })).toBe("recapito");
    expect(primoErrore({})).toBeNull();
  });
});

describe("testo e contatore", () => {
  it("allega la settimana dopo una riga vuota", () => {
    expect(testoFinale("  Ciao Matteo  ", "Settimana")).toBe("Ciao Matteo\n\nSettimana");
    expect(testoFinale("Ciao Matteo", "  ")).toBe("Ciao Matteo");
  });

  it("lo spazio per il messaggio toglie allegato e separatore", () => {
    expect(spazioPerMessaggio()).toBe(3000);
    expect(spazioPerMessaggio("x".repeat(100))).toBe(2898);
    expect(spazioPerMessaggio("x".repeat(5000))).toBe(0);
    const allegato = "x".repeat(100);
    expect(testoFinale("a".repeat(spazioPerMessaggio(allegato)), allegato).length).toBe(3000);
  });
});

describe("settimana allegata", () => {
  const [p1, p2] = PIATTI;
  const e1 = EXTRA[0];

  it("una riga per pasto: giorno · pasto · piatto, in ordine", () => {
    const piano: Piano = {
      gio: { cena: { piatto: p2.id, extra: [] } },
      lun: { pranzo: { piatto: p1.id, extra: [e1.id] }, cena: { extra: [e1.id] } },
    };
    expect(righeSettimana(piano)).toEqual([
      `Lunedì · Pranzo · ${p1.nome} + ${e1.nome}`,
      `Lunedì · Cena · solo aggiunte: ${e1.nome}`,
      `Giovedì · Cena · ${p2.nome}`,
    ]);
  });

  it("gli id sconosciuti spariscono invece di finire nel messaggio", () => {
    const piano: Piano = { mar: { pranzo: { piatto: "piatto-ritirato", extra: ["boh"] } } };
    expect(righeSettimana(piano)).toEqual([]);
    expect(bloccoSettimana(piano)).toBe("");
  });

  it("il blocco ha un titolo col numero dei pasti", () => {
    const blocco = bloccoSettimana({ ven: { pranzo: { piatto: p1.id, extra: [] } } });
    expect(blocco.split("\n")).toEqual(["— La mia settimana dal compositore (1 pasto) —", `Venerdì · Pranzo · ${p1.nome}`]);
    expect(bloccoSettimana({})).toBe("");
  });
});

describe("invio", () => {
  it("prepara il corpo di POST /api/contact con i campi ripuliti", () => {
    const corpo = preparaMessaggio(
      { ...buono, nome: " Giulia ", telefono: " 333 1234567 ", argomento: "home-cooking", messaggio: " Ciao, un preventivo? " },
      "Lunedì · Pranzo · Pollo",
    );
    expect(corpo).toEqual({
      name: "Giulia",
      email: "giulia@example.com",
      phone: "333 1234567",
      comune: "Montesilvano",
      topic: "home-cooking",
      message: "Ciao, un preventivo?\n\nLunedì · Pranzo · Pollo",
      website: "",
    });
  });

  it("l'esca per i bot passa cosi' com'e'", () => {
    expect(preparaMessaggio(buono, "", "http://spam.example").website).toBe("http://spam.example");
  });

  it("spiega il 429 a parte e lascia parlare il server negli altri casi", () => {
    const troppi = spiegaErroreInvio(new ApiError("Too many", 429));
    expect(troppi.troppi).toBe(true);
    expect(troppi.testo).toMatch(/più tardi/);
    expect(spiegaErroreInvio(new ApiError("Controlla l’email", 400))).toEqual({ testo: "Controlla l’email", troppi: false });
    expect(spiegaErroreInvio(new ApiError("Connessione assente. Controlla la rete e riprova.", 0)).testo).toMatch(/Connessione/);
    expect(spiegaErroreInvio(new Error("boom")).testo).toMatch(/non è partito/);
  });
});

describe("link", () => {
  it("Google Maps cerca l'indirizzo completo, codificato", () => {
    expect(INDIRIZZO_COMPLETO).toBe("Via del Santuario 214, 65124 Pescara (PE)");
    expect(linkMappa()).toBe(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Via del Santuario 214, 65124 Pescara (PE)")}`,
    );
  });

  it("il mailto ha oggetto e corpo codificati, e accorcia i testi lunghi", () => {
    expect(linkEmail("Ciao & grazie")).toBe(`mailto:${EMAIL_CONTATTI}?subject=Ciao%20%26%20grazie`);
    const lungo = linkEmail("Oggetto", "a".repeat(2000), 100);
    expect(decodeURIComponent(lungo.split("body=")[1])).toBe(`${"a".repeat(100)}…`);
  });

  it("l'email di riserva porta messaggio, settimana e firma", () => {
    const href = emailDaModulo({ ...buono, telefono: "3331234567" }, "Lunedì · Pranzo · Pollo");
    const corpo = decodeURIComponent(href.split("body=")[1]);
    expect(decodeURIComponent(href.split("subject=")[1].split("&")[0])).toBe("Richiesta dal sito · Informazioni");
    expect(corpo).toBe(`${buono.messaggio}\n\nLunedì · Pranzo · Pollo\n\nGiulia · 3331234567 · Montesilvano`);
  });
});
