import { describe, expect, it } from "vitest";
import {
  emailAccesso,
  emailAggiornamentoCliente,
  emailAnnullataDalCliente,
  emailNuovaRichiesta,
  emailNuovoMessaggio,
  escapeHtml,
  piattiPerGiorno,
  type RichiestaPerEmail,
} from "./email";

const richiesta: RichiestaPerEmail = {
  id: "abc-123", customer_name: "Giulia <b>Rossi</b>", email: "giulia@example.com", phone: "3331234567",
  comune: "Pescara", address: "", fulfillment: "pickup", service: "sui-tuoi-macro", requested_date: "2026-10-01",
  notes: "Niente <script>alert(1)</script>\nGrazie", meals: 3,
  items: [
    { id: "b", name: "Salmone", day: "mar", meal: "cena", extras: [] },
    { id: "a", name: "Pollo e riso", day: "lun", meal: "cena", extras: ["Verdure"] },
    { id: "c", name: "Manzo", day: "lun", meal: "pranzo", extras: [] },
  ],
};

describe("email", () => {
  it("fa l'escape di tutto cio' che arriva dal cliente", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
    const mail = emailNuovaRichiesta(richiesta);
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).not.toContain("<b>Rossi</b>");
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.text).toContain("Niente <script>alert(1)</script>");
  });

  it("riassume la nuova richiesta per Matteo con i piatti giorno per giorno e il link al pannello", () => {
    const mail = emailNuovaRichiesta(richiesta);
    expect(mail.subject).toBe("Nuova richiesta: Giulia <b>Rossi</b> · 3 pasti");
    expect(mail.text).toContain("Telefono: 3331234567");
    expect(mail.text).toContain("Servizio: Sui tuoi macro");
    expect(mail.text).toContain("Data preferita: giovedì 1 ottobre 2026");
    expect(mail.text).toContain("https://fuelchef.it/dashboard/ordini?id=abc-123");
    expect(piattiPerGiorno(richiesta.items)).toEqual([
      "Lunedì — pranzo: Manzo; cena: Pollo e riso (+ Verdure)",
      "Martedì — cena: Salmone",
    ]);
  });

  it("scrive al cliente lo stato in parole semplici, senza dati interni", () => {
    const mail = emailAggiornamentoCliente({
      customer_name: "Giulia Rossi", status: "ready", fulfillment: "delivery", fulfillment_date: "2026-10-02",
      address: "Via Roma 1", comune: "Pescara", customer_message: "Passo dopo le 18", price_cents: 4500, paid: 1,
    }, true);
    expect(mail.subject).toBe("Aggiornamento FUEL LAB: Pronto");
    expect(mail.text).toContain("Ciao Giulia,");
    expect(mail.text).toContain("I tuoi pasti sono pronti.");
    expect(mail.text).toContain("Consegna: venerdì 2 ottobre 2026");
    expect(mail.text).toContain("Totale concordato: € 45,00 · pagato");
    expect(mail.text).toContain("> Passo dopo le 18");
    expect(mail.text).toContain("https://fuelchef.it/account");
    const soloMessaggio = emailAggiornamentoCliente({
      customer_name: "", status: "confirmed", fulfillment: "pickup", fulfillment_date: null,
      address: "", comune: "", customer_message: "Ciao!", price_cents: null, paid: 0,
    }, false);
    expect(soloMessaggio.subject).toBe("Un messaggio di Matteo sulla tua richiesta FUEL LAB");
    expect(soloMessaggio.text).not.toContain("Totale concordato");
  });

  it("avvisa Matteo di annullamenti e messaggi dal modulo contatti", () => {
    expect(emailAnnullataDalCliente(richiesta).subject).toBe("Richiesta annullata: Giulia <b>Rossi</b>");
    const msg = emailNuovoMessaggio({ name: "Luca", email: "luca@example.com", phone: "", comune: "Chieti", topic: "consegna", message: "Consegnate a Chieti?" });
    expect(msg.subject).toBe("Nuovo messaggio: Luca · Consegna e ritiro");
    expect(msg.text).toContain("Rispondi a questa email per scrivere direttamente a luca@example.com.");
  });

  it("per l'abbonamento dice l'inizio desiderato, il prezzo proposto e la scheda", () => {
    const abb: RichiestaPerEmail = { ...richiesta, service: "abbonamento", meals: 1, notes: "Pesi lun-mer-ven", price_cents: 23900,
      items: [{ id: "c", name: "Manzo", day: "lun", meal: "pranzo", extras: [] }] };
    const mail = emailNuovaRichiesta(abb);
    expect(mail.subject).toBe("Nuova richiesta: Giulia <b>Rossi</b> · Abbonamento mensile");
    expect(mail.text).toContain("Servizio: Abbonamento mensile");
    expect(mail.text).toContain("Inizio desiderato: giovedì 1 ottobre 2026");
    expect(mail.text).toContain("Prezzo proposto: 239 € al mese");
    expect(mail.text).toContain("PRANZI INDICATI DAL CLIENTE");
    expect(mail.text).toContain("La scheda del cliente:");
    expect(mail.text).not.toContain("Pasti:");
    expect(emailAnnullataDalCliente(abb).text).toContain("Inizio desiderato: giovedì 1 ottobre 2026");
  });

  it("al cliente dell'abbonamento scrive il periodo, e chiama proposta il prezzo non ancora confermato", () => {
    const confermato = emailAggiornamentoCliente({
      service: "abbonamento", customer_name: "Giulia Rossi", status: "confirmed", fulfillment: "pickup", fulfillment_date: "2026-10-05",
      address: "", comune: "Pescara", customer_message: "", price_cents: 23900, paid: 0,
    }, true);
    expect(confermato.subject).toBe("Aggiornamento FUEL LAB: abbonamento confermato");
    expect(confermato.text).toContain("Matteo ha confermato il tuo abbonamento ai pranzi.");
    expect(confermato.text).toContain("Periodo: dal lunedì 5 ottobre 2026 al mercoledì 4 novembre 2026, pranzi dal lunedì al venerdì");
    expect(confermato.text).toContain("Totale concordato: € 239,00");
    const concluso = emailAggiornamentoCliente({
      service: "abbonamento", customer_name: "Giulia", status: "completed", fulfillment: "pickup", fulfillment_date: "2026-10-05",
      address: "", comune: "", customer_message: "", price_cents: 23900, paid: 1,
    }, true);
    expect(concluso.subject).toBe("Aggiornamento FUEL LAB: abbonamento concluso");
    expect(concluso.text).toContain("Stato: Concluso");
    const proposta = emailAggiornamentoCliente({
      service: "abbonamento", customer_name: "Giulia", status: "requested", fulfillment: "pickup", fulfillment_date: null,
      address: "", comune: "", customer_message: "Ci sentiamo domani", price_cents: 23900, paid: 0,
    }, false);
    expect(proposta.text).toContain("Prezzo proposto: € 239,00");
  });

  it("mantiene il testo dell'email di accesso", () => {
    const mail = emailAccesso("Verifica la tua email FUEL LAB", "https://fuelchef.it/api/auth/verify-email?token=a&b=c");
    expect(mail.text).toContain("https://fuelchef.it/api/auth/verify-email?token=a&b=c");
    expect(mail.html).toContain('href="https://fuelchef.it/api/auth/verify-email?token=a&amp;b=c"');
  });
});
