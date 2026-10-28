import { describe, expect, it } from "vitest";
import {
  emailAccesso,
  emailAggiornamentoCliente,
  emailAnnullataDalCliente,
  emailNuovaRichiesta,
  emailNuovoMessaggio,
  emailReimpostaPassword,
  emailRichiestaRicevuta,
  emailVerificaEmail,
  escapeHtml,
  piattiPerGiorno,
  primoNome,
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
    expect(mail.subject).toBe("I tuoi pasti sono pronti · FUEL LAB");
    expect(mail.text).toContain("Ciao Giulia,");
    expect(mail.text).toContain("I tuoi pasti sono pronti: te li portiamo all'indirizzo indicato.");
    expect(mail.text).toContain("Consegna: venerdì 2 ottobre 2026");
    expect(mail.text).toContain("Totale concordato: € 45,00 · pagato");
    expect(mail.text).toContain("> Passo dopo le 18");
    expect(mail.text).toContain("https://fuelchef.it/account");
    const soloMessaggio = emailAggiornamentoCliente({
      customer_name: "", status: "confirmed", fulfillment: "pickup", fulfillment_date: null,
      address: "", comune: "", customer_message: "Ciao!", price_cents: null, paid: 0,
    }, false);
    expect(soloMessaggio.subject).toBe("Un messaggio di Matteo sulla tua richiesta · FUEL LAB");
    expect(soloMessaggio.text).not.toContain("Totale concordato");
  });

  it("avvisa Matteo di annullamenti e messaggi dal modulo contatti", () => {
    expect(emailAnnullataDalCliente(richiesta).subject).toBe("Richiesta annullata: Giulia <b>Rossi</b>");
    const msg = emailNuovoMessaggio({ name: "Luca", email: "luca@example.com", phone: "", comune: "Chieti", topic: "consegna", message: "Consegnate a Chieti?" });
    expect(msg.subject).toBe("Nuovo messaggio: Luca · Consegna e ritiro");
    expect(msg.text).toContain("Rispondi a questa email per scrivere direttamente a luca@example.com.");
  });

  it("per l'abbonamento dice formula, fascia, chi si abbona, il prezzo proposto e la scheda", () => {
    const abb: RichiestaPerEmail = { ...richiesta, service: "abbonamento", meals: 0, notes: "Pesi lun-mer-ven", price_cents: 60800,
      subscription: { plan: "completo", tier: "plus", household: "coppia" }, items: [] };
    const mail = emailNuovaRichiesta(abb);
    expect(mail.subject).toBe("Nuova richiesta: Giulia <b>Rossi</b> · Abbonamento Completo · Plus");
    expect(mail.text).toContain("Nuova richiesta di abbonamento dal sito");
    expect(mail.text).toContain("Servizio: Abbonamento mensile");
    expect(mail.text).toContain("Formula: Completo · Plus");
    expect(mail.text).toContain("Cosa chiede: 15 pasti a settimana, pranzo e cena");
    expect(mail.text).toContain("Chi si abbona: In coppia");
    expect(mail.text).not.toMatch(/prova/i);
    expect(mail.html).not.toMatch(/prova/i);
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

  it("l'oggetto e le righe seguono la formula", () => {
    const base: RichiestaPerEmail = { ...richiesta, service: "abbonamento", meals: 0, items: [], notes: "", price_cents: 17300 };
    const pranzo = emailNuovaRichiesta({ ...base, subscription: { plan: "pranzo", tier: "standard", household: "singolo" } });
    expect(pranzo.subject).toBe("Nuova richiesta: Giulia <b>Rossi</b> · Abbonamento Pranzo · Standard");
    expect(pranzo.text).toContain("Cosa chiede: 5 pasti a settimana, solo il pranzo");
    expect(pranzo.text).toContain("Chi si abbona: Da solo");
    expect(pranzo.text).toContain("Prezzo proposto: € 173,00 al mese");
    const full = emailNuovaRichiesta({ ...base, price_cents: 72800, subscription: { plan: "full7", tier: "standard", household: "famiglia" } });
    expect(full.subject).toContain("Abbonamento Full 7 · Standard");
    expect(full.text).toContain("Cosa chiede: 21 pasti a settimana, tre al giorno");
    expect(full.text).toContain("Chi si abbona: In famiglia");
    expect(full.html).toContain("Full 7 · Standard");
    // Nessun prezzo salvato: la riga non c'e' (non si inventa un numero).
    expect(emailNuovaRichiesta({ ...base, price_cents: null, subscription: { plan: "full6", tier: "plus", household: "singolo" } }).text)
      .not.toContain("Prezzo proposto");
    // Con dei piatti allegati (un altro client) la sezione resta, con il nome giusto.
    const conPiatti = emailNuovaRichiesta({ ...base, subscription: { plan: "leggero", tier: "standard", household: "singolo" },
      items: [{ id: "c", name: "Manzo", day: "lun", meal: "pranzo", extras: [] }] });
    expect(conPiatti.text).toContain("PIATTI INDICATI DAL CLIENTE");
    // Un abbonamento vecchio, senza scelta salvata, e' un Pranzo e non porta righe inventate.
    const vecchio = emailNuovaRichiesta({ ...base, subscription: null });
    expect(vecchio.text).toContain("Formula: Pranzo");
    expect(vecchio.text).not.toContain("Chi si abbona");
  });

  it("al cliente dell'abbonamento nomina la formula, scrive il periodo e che giorno e orario si concordano, e chiama proposta il prezzo non ancora confermato", () => {
    const sub = { plan: "completo", tier: "plus", household: "singolo" } as const;
    const base = { service: "abbonamento" as const, subscription: sub, customer_name: "Giulia", fulfillment: "pickup" as const, fulfillment_date: null,
      address: "", comune: "", customer_message: "", price_cents: null, paid: 0 as const };
    const confermato = emailAggiornamentoCliente({
      ...base, customer_name: "Giulia Rossi", status: "confirmed", fulfillment_date: "2026-10-05", comune: "Pescara", price_cents: 60800,
    }, true);
    expect(confermato.subject).toBe("Abbonamento confermato · FUEL LAB");
    expect(confermato.text).toContain("Matteo ha confermato il tuo abbonamento Completo · Plus.");
    expect(confermato.text).toContain("Formula: Completo · Plus");
    expect(confermato.text).toContain("Periodo: dal lunedì 5 ottobre 2026 al mercoledì 4 novembre 2026");
    expect(confermato.text).toContain("Ritiro: con giorno e orario concordati, a partire da lunedì 5 ottobre 2026");
    expect(confermato.text).toContain("Totale concordato: € 608,00");
    expect(confermato.text).not.toContain("al mese");
    expect(confermato.text).not.toMatch(/lunedì al venerdì/);
    const consegna = emailAggiornamentoCliente({
      ...base, status: "confirmed", fulfillment: "delivery", fulfillment_date: "2026-10-05", address: "Via Roma 1", comune: "Pescara",
    }, true);
    expect(consegna.text).toContain("Consegna: con giorno e orario concordati, a partire da lunedì 5 ottobre 2026");
    expect(consegna.text).toContain("Dove: Via Roma 1, Pescara");
    const concluso = emailAggiornamentoCliente({ ...base, status: "completed", fulfillment_date: "2026-10-05", price_cents: 60800, paid: 1 }, true);
    expect(concluso.subject).toBe("Abbonamento concluso · FUEL LAB");
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
    expect(mail.text).toContain("Il link vale un'ora.");
    expect(mail.text).toContain("ignora questa email");
  });

  it("verifica e nuova password: un bottone chiaro, l'indirizzo una volta sola nel testo, la durata del link e chi scrivere", () => {
    const url = "https://fuelchef.it/api/auth/verify-email?token=eyJhbGciOiJIUzI1NiJ9.abc&callbackURL=%2Faccount";
    const verifica = emailVerificaEmail("Verifica la tua email FUEL LAB", url);
    expect(verifica.subject).toBe("Verifica la tua email FUEL LAB");
    expect(verifica.text).toContain("Conferma la mia email: " + url);
    expect(verifica.text.split(url).length - 1).toBe(1);
    expect(verifica.text).toContain("Il link vale un'ora.");
    expect(verifica.text).toContain("Se non ti sei registrato tu, ignora questa email.");
    expect(verifica.html).toContain("Conferma la mia email</a>");
    // Il link lungo non allarga la pagina sul telefono: va a capo ovunque.
    expect(verifica.html).toMatch(/word-break:break-all/);
    const reset = emailReimpostaPassword("Reimposta la password FUEL LAB", "https://fuelchef.it/api/auth/reset-password/tok?callbackURL=%2Faccedi");
    expect(reset.text).toContain("Scegli una nuova password: https://fuelchef.it/api/auth/reset-password/tok");
    expect(reset.text).toContain("la tua password resta quella di prima");
    expect(reset.text).not.toContain("Matteo ha");
  });

  it("ogni email ha l'anteprima nascosta, il tema scuro, niente variabili CSS ne' flex e nessun segnaposto", () => {
    const abb = { plan: "completo", tier: "plus", household: "coppia" } as const;
    const tutte = [
      emailVerificaEmail("Verifica la tua email FUEL LAB", "https://fuelchef.it/x"),
      emailReimpostaPassword("Reimposta la password FUEL LAB", "https://fuelchef.it/y"),
      emailAccesso("Accesso FUEL LAB", "https://fuelchef.it/z"),
      emailNuovaRichiesta(richiesta),
      emailNuovaRichiesta({ ...richiesta, service: "abbonamento", meals: 0, items: [], price_cents: 60800, subscription: abb }),
      emailAnnullataDalCliente(richiesta),
      emailRichiestaRicevuta(richiesta),
      emailRichiestaRicevuta({ ...richiesta, service: "abbonamento", meals: 0, items: [], price_cents: 60800, subscription: abb }),
      emailNuovoMessaggio({ name: "Luca", email: "luca@example.com", phone: "", comune: "Chieti", topic: "info", message: "Ciao" }),
      ...(["requested", "confirmed", "preparing", "ready", "completed", "cancelled"] as const).flatMap((status) => [
        emailAggiornamentoCliente({ customer_name: "Giulia", status, fulfillment: "delivery", fulfillment_date: "2026-10-05", address: "Via Roma 1", comune: "Pescara", customer_message: "", price_cents: 4500, paid: 0 }, true),
        emailAggiornamentoCliente({ service: "abbonamento", subscription: abb, customer_name: "Giulia", status, fulfillment: "pickup", fulfillment_date: "2026-10-05", address: "", comune: "", customer_message: "Ciao", price_cents: 60800, paid: 0 }, status !== "ready"),
      ]),
    ];
    for (const mail of tutte) {
      for (const parte of [mail.subject, mail.text, mail.html]) expect(parte).not.toMatch(/undefined|\bnull\b|NaN|\[object|TODO|lorem/i);
      expect(mail.subject.length).toBeLessThan(80);
      // Un oggetto sobrio: niente urla ne' punti esclamativi (finirebbe nello spam).
      expect(mail.subject).not.toMatch(/!|[A-ZÀ-Ý]{6,}\s[A-ZÀ-Ý]{6,}/);
      expect(mail.html).toContain('name="color-scheme"');
      expect(mail.html).toContain("prefers-color-scheme: dark");
      expect(mail.html).toMatch(/display:none;[^"]*mso-hide:all/);
      expect(mail.html).not.toMatch(/var\(--|display:\s*flex|display:\s*grid/);
      // Strutturata a tabelle e senza immagini: regge Outlook e i client senza caricamento delle immagini.
      expect(mail.html).toContain('role="presentation"');
      // Outlook per computer ignora max-width: la colonna da 560 se la fa dire da una tabella condizionale.
      expect(mail.html).toContain("<!--[if mso]>");
      expect(mail.html).not.toMatch(/<img|<script|<link|@import/);
      expect(mail.text).toContain("fuelchef.it");
      // Ogni indirizzo e' assoluto sul sito vero.
      for (const [, indirizzo] of mail.html.matchAll(/href="([^"]+)"/g)) expect(indirizzo).toMatch(/^https:\/\/fuelchef\.it\//);
    }
  });

  it("al cliente dice la differenza fra richiesta, ordine confermato e pagamento, e firma Matteo", () => {
    const base = { customer_name: "Giulia Rossi", fulfillment: "pickup" as const, fulfillment_date: "2026-10-05", address: "", comune: "", customer_message: "", price_cents: 4500, paid: 0 as const };
    const attesa = emailAggiornamentoCliente({ ...base, status: "requested" }, true);
    expect(attesa.text).toContain("Non è ancora un ordine confermato e non c'è niente da pagare adesso");
    expect(attesa.text).toContain("Prezzo proposto: € 45,00");
    const confermata = emailAggiornamentoCliente({ ...base, status: "confirmed" }, true);
    expect(confermata.text).toContain("Nessun pagamento online: il pagamento si concorda con Matteo.");
    // Gia' pagata: non si ripete che il pagamento si concorda.
    expect(emailAggiornamentoCliente({ ...base, status: "confirmed", paid: 1 }, true).text).not.toContain("Nessun pagamento online");
    // Annullata: niente totale (non si e' concordato niente) e una strada per riprovare.
    const annullata = emailAggiornamentoCliente({ ...base, status: "cancelled" }, true);
    expect(annullata.text).not.toContain("Totale");
    expect(annullata.text).not.toContain("Prezzo");
    expect(annullata.text).toContain("fai una nuova richiesta dal sito");
    // Pasti pronti e conclusi: a chi ritira e a chi riceve a casa si dice cosa fare.
    expect(emailAggiornamentoCliente({ ...base, status: "ready" }, true).text).toContain("puoi ritirarli in laboratorio");
    expect(emailAggiornamentoCliente({ ...base, status: "completed" }, true).text).toContain("La tua richiesta è conclusa. Buon appetito!");
    expect(emailAggiornamentoCliente({ ...base, status: "completed", fulfillment: "delivery" }, true).text).toContain("La tua richiesta è stata consegnata.");
    for (const mail of [attesa, confermata, annullata]) {
      expect(mail.text).toMatch(/A presto,\nMatteo\n/);
      expect(mail.html).toContain("<strong>Matteo</strong>");
      expect(mail.text).toContain("Ricevi questa email perché hai fatto una richiesta su fuelchef.it.");
      // Mai dati interni: l'unico indirizzo del cliente e' il suo, e il telefono non c'e'.
      expect(mail.text).not.toMatch(/333|production|interna/i);
    }
    // Il messaggio di Matteo, quando e' la novita', viene prima dei dettagli.
    const solo = emailAggiornamentoCliente({ ...base, status: "requested", customer_message: "Preferisci il riso integrale?" }, false);
    expect(solo.text.indexOf("> Preferisci il riso integrale?")).toBeLessThan(solo.text.indexOf("Stato:"));
    expect(solo.html).toContain("Matteo ti ha scritto: Preferisci il riso integrale?");
    // Una consegna senza indirizzo non scrive una riga "Dove" vuota.
    expect(emailAggiornamentoCliente({ ...base, status: "confirmed", fulfillment: "delivery" }, true).text).not.toContain("Dove:");
  });

  it("la ricevuta al cliente: e' arrivata, non e' ancora un ordine confermato, niente da pagare, si puo' annullare; mai le note ne' il telefono", () => {
    const menu = emailRichiestaRicevuta({ ...richiesta, customer_name: "Giulia Rossi", fulfillment: "delivery", address: "Via Roma 12", comune: "Montesilvano" });
    expect(menu.subject).toBe("Richiesta ricevuta · FUEL LAB");
    expect(menu.text).toContain("Ciao Giulia,");
    expect(menu.text).toContain("La tua richiesta di pasti sui tuoi macro è arrivata a Matteo");
    expect(menu.text).toContain("Non è ancora un ordine confermato e non c'è niente da pagare adesso");
    expect(menu.text).toContain("Dove: Via Roma 12, Montesilvano");
    expect(menu.text).toContain("Lunedì — pranzo: Manzo; cena: Pollo e riso (+ Verdure)");
    expect(menu.text).toContain("Finché Matteo non l'ha confermata puoi annullarla dal tuo account.");
    expect(menu.text).toContain("https://fuelchef.it/account?sezione=richieste");
    expect(menu.text).toMatch(/A presto,\nMatteo\n/);
    // I dati del cliente sono suoi, ma l'email non rilancia note e telefono: niente da ricordargli.
    expect(menu.text).not.toMatch(/3331234567|Niente <script>|Note del cliente/);
    const abb = emailRichiestaRicevuta({ ...richiesta, service: "abbonamento", meals: 0, items: [], price_cents: 60800, fulfillment: "pickup",
      subscription: { plan: "completo", tier: "plus", household: "coppia" } });
    expect(abb.text).toContain("La tua richiesta di abbonamento Completo · Plus è arrivata a Matteo");
    expect(abb.text).toContain("Finché Matteo non conferma non parte niente e non c'è niente da pagare");
    expect(abb.text).toContain("Prezzo proposto: € 608,00 al mese");
    expect(abb.text).toContain("Dove: Via del Santuario 214, 65124 Pescara (ritiro in laboratorio)");
    expect(abb.text).not.toContain("I piatti che hai scelto");
    expect(abb.text).not.toContain("Cosa chiede");
    // Un nome ostile non rompe l'HTML.
    expect(menu.html).not.toContain("<b>Rossi</b>");
  });

  it("un nome lunghissimo non allunga l'oggetto e le parole lunghe vanno a capo", () => {
    const lungo = "Supercalifragilistico".repeat(6);
    const mail = emailNuovaRichiesta({ ...richiesta, customer_name: lungo });
    expect(mail.subject.length).toBeLessThan(80);
    expect(mail.subject).toContain("…");
    expect(emailAnnullataDalCliente({ ...richiesta, customer_name: lungo }).subject.length).toBeLessThan(80);
    expect(emailNuovoMessaggio({ name: lungo, email: "a@b.it", phone: "", comune: "", topic: "info", message: "ciao" }).subject.length).toBeLessThan(80);
    // Nome corto: l'oggetto resta intero.
    expect(emailNuovaRichiesta(richiesta).subject).toBe("Nuova richiesta: Giulia <b>Rossi</b> · 3 pasti");
    expect(mail.html).toMatch(/word-break:break-word;overflow-wrap:anywhere/);
  });

  it("il saluto usa la prima parola del nome con la maiuscola, anche se scritto in minuscolo", () => {
    expect(primoNome("giulia rossi")).toBe("Giulia");
    expect(primoNome("  MARIA  Teresa ")).toBe("MARIA");
    expect(primoNome("émilie")).toBe("Émilie");
    expect(primoNome("")).toBe("");
    const mail = emailAggiornamentoCliente({ customer_name: "giulia", status: "confirmed", fulfillment: "pickup", fulfillment_date: null, address: "", comune: "", customer_message: "", price_cents: null, paid: 0 }, true);
    expect(mail.text).toContain("Ciao Giulia,");
  });

  it("a Matteo l'oggetto e l'anteprima dicono chi, cosa e dove; il comune non e' ripetuto con la consegna", () => {
    const consegna = emailNuovaRichiesta({ ...richiesta, fulfillment: "delivery", address: "Via Roma 12", comune: "Montesilvano" });
    expect(consegna.html).toContain("Giulia &lt;b&gt;Rossi&lt;/b&gt; · Sui tuoi macro · consegna a Montesilvano · giovedì 1 ottobre 2026");
    expect(consegna.text).not.toContain("Comune:");
    expect(consegna.text).toContain("Modalità: Consegna a Via Roma 12, Montesilvano");
    expect(consegna.text).toContain("Rispondi a questa email per scrivere direttamente a giulia@example.com.");
    const ritiro = emailNuovaRichiesta({ ...richiesta, fulfillment: "pickup", comune: "Chieti" });
    expect(ritiro.text).toContain("Comune: Chieti");
    expect(ritiro.html).toContain("ritiro in laboratorio");
    const abb = emailNuovaRichiesta({ ...richiesta, service: "abbonamento", meals: 0, items: [], subscription: { plan: "leggero", tier: "standard", household: "singolo" } });
    expect(abb.html).toContain("inizio giovedì 1 ottobre 2026");
  });

  it("nessun campo del cliente rompe l'HTML ne' l'oggetto: apici angolari, virgolette, a capo e intestazioni finte", () => {
    const ostile = "<img src=x onerror=alert(1)>\r\nBcc: spia@x.it \"'&";
    const richiesta = emailNuovaRichiesta({
      id: "id\"><script>", customer_name: ostile, email: "a@b.it", phone: ostile, comune: ostile, address: ostile, fulfillment: "delivery",
      service: "menu-settimana", requested_date: "2026-10-05", notes: ostile, meals: 1,
      items: [{ id: "x", name: ostile, day: "lun", meal: "pranzo", extras: [ostile] }],
    });
    const messaggio = emailNuovoMessaggio({ name: ostile, email: "a@b.it", phone: "", comune: ostile, topic: "info", message: ostile });
    for (const mail of [richiesta, messaggio]) {
      expect(mail.html).not.toMatch(/<img|<script/);
      expect(mail.html).toContain("&lt;img src=x onerror=alert(1)&gt;");
      // l'oggetto sta su una riga: niente CR/LF che aprano un'altra intestazione
      expect(mail.subject).not.toMatch(/[\r\n]/);
    }
    expect(richiesta.html).toContain("id%22%3E%3Cscript%3E");
  });
});
