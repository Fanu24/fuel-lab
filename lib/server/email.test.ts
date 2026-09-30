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

  it("per l'abbonamento dice formula, fascia, chi si abbona, la prova, il prezzo proposto e la scheda", () => {
    const abb: RichiestaPerEmail = { ...richiesta, service: "abbonamento", meals: 0, notes: "Pesi lun-mer-ven", price_cents: 60800,
      subscription: { plan: "completo", tier: "plus", household: "coppia", trial: true }, items: [] };
    const mail = emailNuovaRichiesta(abb);
    expect(mail.subject).toBe("Nuova richiesta: Giulia <b>Rossi</b> · Abbonamento Completo · Plus");
    expect(mail.text).toContain("Nuova richiesta di abbonamento dal sito");
    expect(mail.text).toContain("Servizio: Abbonamento mensile");
    expect(mail.text).toContain("Formula: Completo · Plus");
    expect(mail.text).toContain("Cosa chiede: 15 pasti a settimana, pranzo e cena");
    expect(mail.text).toContain("Chi si abbona: In coppia");
    expect(mail.text).toContain("Settimana di prova: Sì");
    expect(mail.text).toContain("Prezzo proposto: € 608,00 al mese");
    expect(mail.text).toContain("Inizio desiderato: giovedì 1 ottobre 2026");
    expect(mail.text).toContain("La scheda del cliente:");
    expect(mail.text).not.toContain("Pasti:");
    // Niente piatti dal compositore: niente sezione dei pranzi, e niente "pranzi dal lunedi' al venerdi'".
    expect(mail.text).not.toMatch(/PRANZI INDICATI|PIATTI INDICATI/);
    expect(mail.text).not.toMatch(/lunedì al venerdì/);
    expect(mail.text).not.toContain("239");
    expect(emailAnnullataDalCliente(abb).text).toContain("Inizio desiderato: giovedì 1 ottobre 2026");
    expect(emailAnnullataDalCliente(abb).text).toContain("Formula: Completo · Plus");
    expect(emailAnnullataDalCliente(abb).text).not.toContain("Cosa chiede");
  });

  it("l'oggetto e le righe seguono la formula e la prova", () => {
    const base: RichiestaPerEmail = { ...richiesta, service: "abbonamento", meals: 0, items: [], notes: "", price_cents: 17300 };
    const pranzo = emailNuovaRichiesta({ ...base, subscription: { plan: "pranzo", tier: "standard", household: "singolo", trial: false } });
    expect(pranzo.subject).toBe("Nuova richiesta: Giulia <b>Rossi</b> · Abbonamento Pranzo · Standard");
    expect(pranzo.text).toContain("Cosa chiede: 5 pasti a settimana, solo il pranzo");
    expect(pranzo.text).toContain("Chi si abbona: Da solo");
    expect(pranzo.text).toContain("Settimana di prova: No");
    expect(pranzo.text).toContain("Prezzo proposto: € 173,00 al mese");
    const full = emailNuovaRichiesta({ ...base, price_cents: 72800, subscription: { plan: "full7", tier: "standard", household: "famiglia", trial: true } });
    expect(full.subject).toContain("Abbonamento Full 7 · Standard");
    expect(full.text).toContain("Cosa chiede: 21 pasti a settimana, tre al giorno");
    expect(full.text).toContain("Chi si abbona: In famiglia");
    // La prova e la formula arrivano anche nell'HTML.
    expect(full.html).toContain("Full 7 · Standard");
    expect(full.html).toContain("Settimana di prova");
    // Nessun prezzo salvato: la riga non c'e' (non si inventa un numero).
    expect(emailNuovaRichiesta({ ...base, price_cents: null, subscription: { plan: "full6", tier: "plus", household: "singolo", trial: true } }).text)
      .not.toContain("Prezzo proposto");
    // Con dei piatti allegati (un altro client) la sezione resta, con il nome giusto.
    const conPiatti = emailNuovaRichiesta({ ...base, subscription: { plan: "leggero", tier: "standard", household: "singolo", trial: true },
      items: [{ id: "c", name: "Manzo", day: "lun", meal: "pranzo", extras: [] }] });
    expect(conPiatti.text).toContain("PIATTI INDICATI DAL CLIENTE");
    // Un abbonamento vecchio, senza scelta salvata, e' un Pranzo e non porta righe inventate.
    const vecchio = emailNuovaRichiesta({ ...base, subscription: null });
    expect(vecchio.text).toContain("Formula: Pranzo");
    expect(vecchio.text).not.toContain("Chi si abbona");
    expect(vecchio.text).not.toContain("Settimana di prova");
  });

  it("al cliente dell'abbonamento nomina la formula, scrive il periodo e la consegna ogni 3 giorni, e chiama proposta il prezzo non ancora confermato", () => {
    const sub = { plan: "completo", tier: "plus", household: "singolo", trial: true } as const;
    const base = { service: "abbonamento" as const, subscription: sub, customer_name: "Giulia", fulfillment: "pickup" as const, fulfillment_date: null,
      address: "", comune: "", customer_message: "", price_cents: null, paid: 0 as const };
    const confermato = emailAggiornamentoCliente({
      ...base, customer_name: "Giulia Rossi", status: "confirmed", fulfillment_date: "2026-10-05", comune: "Pescara", price_cents: 60800,
    }, true);
    expect(confermato.subject).toBe("Aggiornamento FUEL LAB: abbonamento confermato");
    expect(confermato.text).toContain("Matteo ha confermato il tuo abbonamento Completo · Plus.");
    expect(confermato.text).toContain("Formula: Completo · Plus");
    expect(confermato.text).toContain("Periodo: dal lunedì 5 ottobre 2026 al mercoledì 4 novembre 2026");
    expect(confermato.text).toContain("Ritiro: ogni 3 giorni, a partire da lunedì 5 ottobre 2026");
    expect(confermato.text).toContain("Totale concordato: € 608,00");
    expect(confermato.text).not.toContain("al mese");
    expect(confermato.text).not.toMatch(/lunedì al venerdì/);
    const consegna = emailAggiornamentoCliente({
      ...base, status: "confirmed", fulfillment: "delivery", fulfillment_date: "2026-10-05", address: "Via Roma 1", comune: "Pescara",
    }, true);
    expect(consegna.text).toContain("Consegna: ogni 3 giorni, a partire da lunedì 5 ottobre 2026");
    expect(consegna.text).toContain("Dove: Via Roma 1, Pescara");
    const concluso = emailAggiornamentoCliente({ ...base, status: "completed", fulfillment_date: "2026-10-05", price_cents: 60800, paid: 1 }, true);
    expect(concluso.subject).toBe("Aggiornamento FUEL LAB: abbonamento concluso");
    expect(concluso.text).toContain("Il tuo abbonamento Completo · Plus si è concluso. Grazie!");
    expect(concluso.text).toContain("Stato: Concluso");
    const proposta = emailAggiornamentoCliente({ ...base, status: "requested", customer_message: "Ci sentiamo domani", price_cents: 60800 }, false);
    expect(proposta.text).toContain("Prezzo proposto: € 608,00 al mese");
    expect(emailAggiornamentoCliente({ ...base, status: "requested" }, true).text)
      .toContain("La tua richiesta di abbonamento Completo · Plus è in attesa di conferma");
    // In corso, annullata: la formula c'e' sempre.
    expect(emailAggiornamentoCliente({ ...base, status: "preparing" }, true).text).toContain("Il tuo abbonamento Completo · Plus è in corso.");
    expect(emailAggiornamentoCliente({ ...base, status: "cancelled" }, true).text)
      .toContain("La tua richiesta di abbonamento Completo · Plus è stata annullata.");
    // Un abbonamento senza scelta salvata e' un Pranzo.
    expect(emailAggiornamentoCliente({ ...base, subscription: null, status: "confirmed" }, true).text).toContain("il tuo abbonamento Pranzo.");
  });

  it("mantiene il testo dell'email di accesso", () => {
    const mail = emailAccesso("Verifica la tua email FUEL LAB", "https://fuelchef.it/api/auth/verify-email?token=a&b=c");
    expect(mail.text).toContain("https://fuelchef.it/api/auth/verify-email?token=a&b=c");
    expect(mail.html).toContain('href="https://fuelchef.it/api/auth/verify-email?token=a&amp;b=c"');
  });
});
