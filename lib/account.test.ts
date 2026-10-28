import { describe, expect, it } from "vitest";
import {
  abbonamentoConcluso,
  campiMancanti,
  CHIAVE_BOZZA_RICHIESTA,
  confermaEliminazione,
  contaPiatti,
  corpoRichiesta,
  dataIso,
  descriviEvento,
  descrizioneInizioAbbonamento,
  destinazioneSicura,
  eSessioneScaduta,
  emailValida,
  erroreDiRitorno,
  erroreTelefono,
  fasciaDa,
  formattaGiorno,
  formulaDa,
  frequenzaConsegne,
  hrefAccedi,
  hrefSezione,
  iniziale,
  leggiBozza,
  limitiDataRichiesta,
  messaggioDa,
  modoDa,
  nomeBreve,
  nomeFileDati,
  nomeServizioRichiesta,
  ORDINE_CAMPI_RICHIESTA,
  passiDiAvvio,
  passiOrdine,
  passwordAccettabile,
  periodoRichiesta,
  piattiNonPiuDisponibili,
  primoNome,
  prossimaConsegna,
  prossimaUscitaDi,
  quandoRichiesta,
  SERVIZIO_CON_PIATTI,
  requisitiPassword,
  righePiano,
  schedaAbbonamento,
  serializzaBozza,
  servizioDa,
  sezioneDa,
  spostaGiorni,
  stimaAbbonamento,
  TELEFONO_MAX,
  traduciErroreAuth,
  validaRichiesta,
  type DatiRichiesta,
} from "./account";
import { calcolaPrezzo, FASCE, FORMULE_ID, NUCLEI } from "./abbonamento";
import { ApiError, type EventoOrdine, type Ordine } from "./api";
import { leggiNuovoOrdine } from "./server/ordini";
import type { Piano } from "./settimana";

describe("destinazioneSicura", () => {
  it("accetta qualunque percorso interno, con query e ancora", () => {
    expect(destinazioneSicura("/account")).toBe("/account");
    expect(destinazioneSicura("/account?sezione=richiesta")).toBe("/account?sezione=richiesta");
    expect(destinazioneSicura("/settimana#griglia")).toBe("/settimana#griglia");
    expect(destinazioneSicura("/dashboard")).toBe("/dashboard");
  });

  it("rifiuta siti esterni, schemi e trucchi del parser", () => {
    for (const cattivo of [
      "https://evil.com",
      "//evil.com",
      "/\\evil.com",
      "\\\\evil.com",
      "javascript:alert(1)",
      "evil.com",
      "/%2F%2Fevil.com",
      "/%5cevil.com",
      "/.//evil.com",
      "/..//evil.com",
      "/%2e//evil.com",
      "/a/..//evil.com/login",
      "/\tevil",
      " /account",
      "",
    ]) {
      expect(destinazioneSicura(cattivo)).toBe("/account");
    }
    expect(destinazioneSicura(null)).toBe("/account");
    expect(destinazioneSicura(undefined)).toBe("/account");
  });

  it("non torna alla pagina di accesso ne' alle API", () => {
    expect(destinazioneSicura("/accedi?next=/account")).toBe("/account");
    expect(destinazioneSicura("/reimposta-password")).toBe("/account");
    expect(destinazioneSicura("/api/me")).toBe("/account");
    // /apiario non e' /api: il prefisso vale solo per segmenti interi.
    expect(destinazioneSicura("/apiario")).toBe("/apiario");
  });

  it("normalizza i segmenti ma resta sul sito", () => {
    expect(destinazioneSicura("/menu/../account")).toBe("/account");
  });
});

describe("hrefAccedi e hrefSezione", () => {
  it("codifica il ritorno come lo linkano le altre pagine", () => {
    expect(hrefAccedi("/account?sezione=richiesta")).toBe("/accedi?next=%2Faccount%3Fsezione%3Drichiesta");
    expect(hrefAccedi("/account")).toBe("/accedi");
    expect(hrefAccedi("/account", "crea")).toBe("/accedi?modo=crea");
    expect(hrefAccedi("//evil.com")).toBe("/accedi");
  });

  it("scrive la sezione solo quando non e' la panoramica", () => {
    expect(hrefSezione("panoramica")).toBe("/account");
    expect(hrefSezione("richieste", { apri: "abc" })).toBe("/account?sezione=richieste&apri=abc");
  });

  it("legge sezione, modo e servizio con un valore di ripiego", () => {
    expect(sezioneDa("richiesta")).toBe("richiesta");
    expect(sezioneDa("boh")).toBe("panoramica");
    expect(sezioneDa(null)).toBe("panoramica");
    expect(modoDa("crea")).toBe("crea");
    expect(modoDa("x")).toBe("accedi");
    expect(servizioDa("home-cooking")).toBe("home-cooking");
    expect(servizioDa("abbonamento")).toBe("abbonamento");
    expect(servizioDa(null)).toBe("menu-settimana");
  });

  it("legge formula e fascia dall'indirizzo, e un valore che non esiste torna al predefinito", () => {
    expect(formulaDa("full7")).toBe("full7");
    expect(formulaDa("pranzo")).toBe("pranzo");
    expect(formulaDa("completo")).toBe("completo");
    // Il consigliato dal committente: chi arriva senza scegliere trova Completo.
    expect(formulaDa(null)).toBe("completo");
    expect(formulaDa(undefined)).toBe("completo");
    expect(formulaDa("")).toBe("completo");
    expect(formulaDa("full8")).toBe("completo");
    expect(formulaDa("<script>")).toBe("completo");
    expect(formulaDa("COMPLETO")).toBe("completo");
    expect(fasciaDa("plus")).toBe("plus");
    expect(fasciaDa("standard")).toBe("standard");
    expect(fasciaDa(null)).toBe("standard");
    expect(fasciaDa("premium")).toBe("standard");
    expect(fasciaDa("")).toBe("standard");
  });
});

describe("password ed email", () => {
  it("mostra i requisiti mentre si scrive", () => {
    expect(requisitiPassword("corta")).toEqual([{ id: "lunghezza", testo: "Almeno 12 caratteri", ok: false }]);
    const r = requisitiPassword("abbastanzalunga", "abbastanzalunga");
    expect(r.map((x) => x.ok)).toEqual([true, true]);
    expect(requisitiPassword("abbastanzalunga", "").find((x) => x.id === "coincide")?.ok).toBe(false);
    expect(requisitiPassword("x".repeat(129)).some((x) => x.id === "massimo")).toBe(true);
  });

  it("accetta solo password fra 12 e 128 caratteri che coincidono", () => {
    expect(passwordAccettabile("123456789012")).toBe(true);
    expect(passwordAccettabile("12345678901")).toBe(false);
    expect(passwordAccettabile("123456789012", "123456789013")).toBe(false);
    expect(passwordAccettabile("x".repeat(129))).toBe(false);
  });

  it("riconosce gli indirizzi scritti male", () => {
    expect(emailValida("maria@esempio.it")).toBe(true);
    expect(emailValida(" maria@esempio.it ")).toBe(true);
    expect(emailValida("maria@esempio")).toBe(false);
    expect(emailValida("maria esempio.it")).toBe(false);
  });
});

describe("traduciErroreAuth", () => {
  it("traduce i codici di better-auth", () => {
    expect(traduciErroreAuth({ code: "INVALID_EMAIL_OR_PASSWORD", status: 401 }, "accesso").tipo).toBe("credenziali");
    expect(traduciErroreAuth({ code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL", status: 422 }, "registrazione").tipo).toBe("esiste");
    expect(traduciErroreAuth({ code: "EMAIL_NOT_VERIFIED", status: 403 }, "accesso").tipo).toBe("non-verificata");
    expect(traduciErroreAuth({ code: "INVALID_PASSWORD", status: 400 }, "cambio-password").messaggio).toMatch(/attuale/);
    expect(traduciErroreAuth({ code: "INVALID_TOKEN", status: 400 }, "reimposta").tipo).toBe("link");
    expect(traduciErroreAuth({ code: "CREDENTIAL_ACCOUNT_NOT_FOUND" }, "cambio-password").tipo).toBe("senza-password");
    expect(traduciErroreAuth({ code: "RESET_PASSWORD_DISABLED" }, "recupero").tipo).toBe("non-attivo");
  });

  it("usa lo stato quando manca il codice", () => {
    expect(traduciErroreAuth({ status: 429, message: "Too many requests" }, "accesso").tipo).toBe("troppi");
    expect(traduciErroreAuth({ status: 0 }, "accesso").tipo).toBe("rete");
    expect(traduciErroreAuth({ status: 503 }, "accesso").messaggio).toMatch(/non disponibile/);
    expect(traduciErroreAuth({ status: 413 }, "registrazione").messaggio).toMatch(/troppo lunghi/);
    expect(traduciErroreAuth({ status: 404 }, "elimina").tipo).toBe("non-attivo");
    expect(traduciErroreAuth({ status: 403 }, "elimina").tipo).toBe("vietato");
    expect(traduciErroreAuth({ code: "ADMIN_ACCOUNT_PROTECTED", status: 403 }, "elimina").messaggio).toMatch(/protetto/);
  });

  it("un 401 senza codice dentro l'area cliente e' la sessione finita", () => {
    for (const contesto of ["cambio-password", "elimina", "nome", "esci"] as const) {
      expect(traduciErroreAuth({ status: 401 }, contesto)).toEqual({ tipo: "sessione", messaggio: "La sessione è scaduta. Accedi di nuovo e riprova." });
    }
    // All'accesso un 401 e' una password sbagliata, ha il suo codice e il suo messaggio.
    expect(traduciErroreAuth({ code: "INVALID_EMAIL_OR_PASSWORD", status: 401 }, "accesso").tipo).toBe("credenziali");
    expect(traduciErroreAuth({ status: 401 }, "accesso").tipo).toBe("altro");
  });

  it("non mostra mai il testo inglese del server", () => {
    const e = traduciErroreAuth({ status: 400, message: "Something odd" }, "registrazione");
    expect(e.messaggio).not.toMatch(/Something/);
    expect(traduciErroreAuth(null, "accesso").messaggio).toMatch(/Accesso non riuscito/);
  });

  it("spiega i ritorni con ?error=", () => {
    expect(erroreDiRitorno(null)).toBeNull();
    expect(erroreDiRitorno("access_denied")).toMatch(/annullato/);
    expect(erroreDiRitorno("TOKEN_EXPIRED")).toMatch(/scaduto/);
    expect(erroreDiRitorno("qualcosa")).toMatch(/non è andato/);
  });

  it("usa il messaggio delle nostre API, gia' in italiano", () => {
    expect(messaggioDa(new ApiError("Richiesta non trovata", 404))).toBe("Richiesta non trovata");
    expect(messaggioDa(new Error("boom"), "Ripiego")).toBe("Ripiego");
  });

  it("un 401 vale sempre la stessa frase, qualunque cosa dica la rotta", () => {
    expect(eSessioneScaduta(new ApiError("Accedi prima di inviare una richiesta", 401))).toBe(true);
    expect(eSessioneScaduta(new ApiError("Richiesta non trovata", 404))).toBe(false);
    expect(eSessioneScaduta(new Error("boom"))).toBe(false);
    expect(messaggioDa(new ApiError("Accedi per salvare il piano", 401))).toBe("La sessione è scaduta. Accedi di nuovo e riprova.");
    expect(messaggioDa(new ApiError("Accedi per continuare", 401), "Ripiego")).toMatch(/Accedi di nuovo/);
  });
});

describe("nomi", () => {
  it("ricava primo nome, nome breve e iniziale", () => {
    expect(primoNome("Maria Rossi")).toBe("Maria");
    expect(primoNome("", "luca.b@x.it")).toBe("luca.b");
    expect(nomeBreve("Massimilianoooo Rossi")).toBe("Massimilia…");
    expect(nomeBreve("Ada")).toBe("Ada");
    expect(iniziale("élodie")).toBe("É");
    expect(iniziale("", "zeta@x.it")).toBe("Z");
    expect(iniziale("", "")).toBe("?");
  });
});

describe("profilo", () => {
  it("controlla com'e' scritto un telefono: caratteri, lunghezza, cifre", () => {
    for (const buono of ["333 1234567", "+39 333 123 4567", "(+39) 333-123-4567", "085/1234567", "0039.333.1234567", " 3331234567 "]) {
      expect(erroreTelefono(buono)).toBeNull();
    }
    expect(erroreTelefono("")).toBeNull();
    expect(erroreTelefono("   ")).toBeNull();
    expect(erroreTelefono("333 123")).toMatch(/troppo corto/);
    expect(erroreTelefono("333 1234567 Marco")).toMatch(/solo cifre/);
    expect(erroreTelefono("chiamami")).toMatch(/solo cifre/);
    expect(erroreTelefono("333 1234567\n3331234567")).toMatch(/solo cifre|lungo/);
    // Troppo lungo come scrittura (20 caratteri al massimo) e troppe cifre (15 al massimo).
    expect(erroreTelefono("+39 333 123 45 67 89 01")).toMatch(/troppo lungo/);
    expect(erroreTelefono("3331234567890123")).toMatch(/troppe cifre/);
    expect(erroreTelefono("333123456789012")).toBeNull();
    expect(TELEFONO_MAX).toBe(20);
  });

  it("dice cosa manca per inviare una richiesta", () => {
    expect(campiMancanti(null)).toEqual(["telefono", "comune"]);
    expect(campiMancanti({ phone: "333 123", comune: "Pescara", address: "", preferences: "" })).toEqual(["telefono"]);
    expect(campiMancanti({ phone: "+39 333 123 4567", comune: "Pescara", address: "", preferences: "" })).toEqual([]);
  });
});

describe("date", () => {
  it("legge il giorno a Pescara, non in UTC", () => {
    // 23:30 UTC del 27 settembre sono le 01:30 del 28 a Roma (ora legale).
    expect(dataIso(new Date("2026-09-27T23:30:00Z"))).toBe("2026-09-28");
    expect(spostaGiorni("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("propone da domani a novanta giorni, sul calendario di Pescara", () => {
    const { min, max } = limitiDataRichiesta(new Date("2026-09-27T10:00:00Z"));
    expect(min).toBe("2026-09-28");
    expect(max).toBe("2026-12-26");
    // Dopo mezzanotte a Roma ma prima in UTC: a Pescara e' gia' il 28.
    const notte = limitiDataRichiesta(new Date("2026-09-27T22:30:00Z"));
    expect(notte.min).toBe("2026-09-29");
    expect(notte.max).toBe("2026-12-27");
  });

  it("scrive i giorni in italiano", () => {
    expect(formattaGiorno("2026-10-01")).toBe("giovedì 1 ottobre");
    expect(formattaGiorno("2027-01-04", "2026-12-20")).toBe("lunedì 4 gennaio 2027");
  });
});

function ordine(parziale: Partial<Ordine>): Ordine {
  return {
    id: "o", user_id: "u", email: "a@b.it", status: "requested", service: "menu-settimana", fulfillment: "pickup",
    requested_date: null, fulfillment_date: null, customer_name: "A", phone: "", comune: "", address: "", notes: "",
    customer_message: "", price_cents: null, paid: 0, dietary_preferences: null, meals: 0,
    created_at: "2026-09-20 10:00:00", updated_at: "2026-09-20 10:00:00", items: [],
    ...parziale,
  };
}

describe("stato degli ordini", () => {
  it("disegna le cinque tappe", () => {
    expect(passiOrdine("preparing")?.map((p) => p.stato)).toEqual(["fatto", "fatto", "attuale", "da-fare", "da-fare"]);
    expect(passiOrdine("completed", "pickup")?.at(-1)).toEqual({ id: "completed", etichetta: "Ritirata", stato: "fatto" });
    expect(passiOrdine("completed", "delivery")?.every((p) => p.stato === "fatto")).toBe(true);
    expect(passiOrdine("cancelled")).toBeNull();
  });

  it("l'abbonamento ha tre tappe: inviata, in corso, concluso", () => {
    expect(passiOrdine("requested", "pickup", "abbonamento")?.map((p) => [p.etichetta, p.stato])).toEqual([
      ["Inviata", "attuale"], ["In corso", "da-fare"], ["Concluso", "da-fare"],
    ]);
    expect(passiOrdine("preparing", "pickup", "abbonamento")?.map((p) => p.stato)).toEqual(["fatto", "attuale", "da-fare"]);
    expect(passiOrdine("completed", "pickup", "abbonamento")?.every((p) => p.stato === "fatto")).toBe(true);
    expect(passiOrdine("cancelled", "pickup", "abbonamento")).toBeNull();
  });

  it("un abbonamento e' concluso solo dopo l'ultimo giorno del suo periodo: in corso non lo e', con l'inizio futuro la data e' l'inizio", () => {
    // dal 14 settembre al 13 ottobre
    const abb = { service: "abbonamento" as const, fulfillment_date: "2026-09-14" };
    expect(abbonamentoConcluso(abb, "2026-09-10")).toBe(false); // non ancora iniziato
    expect(prossimaUscitaDi(abb, "2026-09-10")).toBe("2026-09-14");
    expect(abbonamentoConcluso(abb, "2026-09-27")).toBe(false); // in corso: nessuna data futura, da concordare
    expect(prossimaUscitaDi(abb, "2026-09-27")).toBeNull();
    expect(abbonamentoConcluso(abb, "2026-10-13")).toBe(false); // ultimo giorno del periodo
    expect(abbonamentoConcluso(abb, "2026-10-14")).toBe(true); // periodo finito
    expect(abbonamentoConcluso({ ...abb, service: "menu-settimana" }, "2026-10-20")).toBe(false);
    expect(abbonamentoConcluso({ ...abb, fulfillment_date: null }, "2026-10-20")).toBe(false);
  });

  it("per un abbonamento la prossima uscita è solo l'inizio, se non è passato", () => {
    const abb = { service: "abbonamento" as const, fulfillment_date: "2026-11-02", subscription: { plan: "completo" as const, tier: "standard" as const, household: "singolo" as const } };
    expect(prossimaUscitaDi(abb, "2026-10-28")).toBe("2026-11-02");
    expect(prossimaUscitaDi(abb, "2026-11-05")).toBeNull();
  });

  it("per l'abbonamento la prossima uscita e' l'inizio, se non e' passato: il resto si concorda con Matteo", () => {
    const abb = ordine({
      id: "abb", service: "abbonamento", status: "confirmed", fulfillment_date: "2026-09-14",
      subscription: { plan: "completo", tier: "plus", household: "singolo" },
    });
    expect(prossimaUscitaDi(abb, "2026-09-14")).toBe("2026-09-14");
    expect(prossimaUscitaDi(abb, "2026-09-27")).toBeNull();
    expect(prossimaUscitaDi(abb, "2026-10-14")).toBeNull();
    const lontana = ordine({ id: "lontana", status: "confirmed", fulfillment_date: "2026-10-10" });
    expect(prossimaConsegna([lontana, abb], "2026-09-10")?.id).toBe("abb");
    expect(periodoRichiesta(abb, "2026-09-27")).toBe("dal 14 settembre al 13 ottobre");
    expect(periodoRichiesta({ ...abb, service: "menu-settimana" }, "2026-09-27")).toBeNull();
    expect(periodoRichiesta({ ...abb, fulfillment_date: null }, "2026-09-27")).toBeNull();
    expect(prossimaUscitaDi({ ...abb, fulfillment_date: null }, "2026-09-27")).toBeNull();
  });

  it("legge un abbonamento a parole: formula e fascia, chi si abbona, cosa ricevi", () => {
    const abb = ordine({
      service: "abbonamento",
      subscription: { plan: "full6", tier: "plus", household: "coppia" },
    });
    expect(schedaAbbonamento(abb)).toEqual({
      etichetta: "Full 6 · Plus",
      cosaRicevi: "18 pasti a settimana, tre al giorno",
      nucleo: "In coppia",
    });
    expect(nomeServizioRichiesta(abb)).toBe("Abbonamento Full 6 · Plus");
    // Senza scelta salvata: Pranzo, senza fascia, da solo.
    expect(schedaAbbonamento(ordine({ service: "abbonamento" }))).toEqual({
      etichetta: "Pranzo",
      cosaRicevi: "5 pasti a settimana, solo il pranzo",
      nucleo: "Da solo",
    });
    expect(schedaAbbonamento(ordine({ service: "menu-settimana" }))).toBeNull();
    expect(nomeServizioRichiesta(ordine({ service: "menu-settimana" }))).toBe("Menu della settimana");
  });

  it("la consegna dell'abbonamento si concorda: nessuna cadenza fissa", () => {
    expect(frequenzaConsegne("pickup")).toBe("Ritiro in laboratorio, con giorno e orario concordati");
    expect(frequenzaConsegne("delivery")).toBe("Consegna a casa, con giorno e orario concordati");
  });

  it("il promemoria del calendario dice il periodo e che giorno e orario si concordano", () => {
    const abb = ordine({
      service: "abbonamento", status: "confirmed", fulfillment_date: "2026-10-05",
      subscription: { plan: "completo", tier: "plus", household: "singolo" },
    });
    const righe = descrizioneInizioAbbonamento(abb, "2026-09-30");
    expect(righe).toEqual([
      "Abbonamento Completo · Plus, dal 5 ottobre al 4 novembre.",
      "Ritiro o consegna, con giorno e orario concordati.",
    ]);
    // Le formule non sono piu' "pranzi dal lunedi' al venerdi'".
    expect(righe.join(" ")).not.toMatch(/lunedì al venerdì/);
    expect(descrizioneInizioAbbonamento(ordine({ service: "menu-settimana" }), "2026-09-30")).toEqual([]);
    expect(descrizioneInizioAbbonamento({ ...abb, fulfillment_date: null }, "2026-09-30")[0]).toBe("Abbonamento Completo · Plus.");
  });

  it("trova la prossima consegna confermata", () => {
    const ordini = [
      ordine({ id: "attesa", status: "requested", fulfillment_date: null }),
      ordine({ id: "passata", status: "ready", fulfillment_date: "2026-09-20" }),
      ordine({ id: "lontana", status: "confirmed", fulfillment_date: "2026-10-10" }),
      ordine({ id: "vicina", status: "preparing", fulfillment_date: "2026-10-01" }),
      ordine({ id: "annullata", status: "cancelled", fulfillment_date: "2026-09-30" }),
    ];
    expect(prossimaConsegna(ordini, "2026-09-27")?.id).toBe("vicina");
    expect(prossimaConsegna(ordini.slice(0, 2), "2026-09-27")?.id).toBe("passata");
    expect(prossimaConsegna([ordini[0]], "2026-09-27")).toBeNull();
  });

  it("dice quando, e per una richiesta annullata non dice niente", () => {
    const oggi = "2026-09-30";
    expect(quandoRichiesta(ordine({ status: "confirmed", fulfillment_date: "2026-10-03", fulfillment: "pickup" }), oggi))
      .toEqual({ etichetta: "Ritiro", valore: "sabato 3 ottobre" });
    expect(quandoRichiesta(ordine({ status: "confirmed", fulfillment_date: "2026-10-03", fulfillment: "delivery" }), oggi)?.etichetta).toBe("Consegna");
    expect(quandoRichiesta(ordine({ status: "requested", requested_date: "2026-10-05" }), oggi))
      .toEqual({ etichetta: "Giorno preferito", valore: "lunedì 5 ottobre, da confermare" });
    expect(quandoRichiesta(ordine({ status: "requested" }), oggi)).toEqual({ etichetta: "Ritiro", valore: "Da concordare" });
    expect(quandoRichiesta(ordine({ status: "requested", fulfillment: "delivery" }), oggi)?.etichetta).toBe("Consegna");
    const abb = ordine({ service: "abbonamento", status: "requested", requested_date: "2026-10-05" });
    expect(quandoRichiesta(abb, oggi)?.etichetta).toBe("Inizio desiderato");
    expect(quandoRichiesta({ ...abb, requested_date: null }, oggi)).toEqual({ etichetta: "Inizio", valore: "Da concordare" });
    expect(quandoRichiesta({ ...abb, status: "confirmed", fulfillment_date: "2026-10-05" }, oggi))
      .toEqual({ etichetta: "Periodo", valore: "dal 5 ottobre al 4 novembre" });
    // Matteo aveva scritto il giorno, poi ha annullato: quel giorno non e' piu' fissato.
    expect(quandoRichiesta(ordine({ status: "cancelled", fulfillment_date: "2026-10-03", requested_date: "2026-10-03" }), oggi)).toBeNull();
    expect(quandoRichiesta({ ...abb, status: "cancelled", fulfillment_date: "2026-10-05" }, oggi)).toBeNull();
  });

  it("racconta la cronologia", () => {
    const base: EventoOrdine = { id: 1, actor: "admin", type: "created", from_status: null, to_status: null, detail: "", created_at: "" };
    expect(descriviEvento(base).titolo).toBe("Richiesta inviata");
    expect(descriviEvento({ ...base, type: "status", to_status: "confirmed" }).titolo).toBe("Confermato");
    expect(descriviEvento({ ...base, type: "status", to_status: "completed" }, "pickup").titolo).toBe("Ritirato");
    expect(descriviEvento({ ...base, type: "status", to_status: "completed" }, "delivery").titolo).toBe("Consegnato");
    expect(descriviEvento({ ...base, actor: "customer", type: "status", to_status: "cancelled" }).titolo).toBe("Hai annullato la richiesta");
    expect(descriviEvento({ ...base, type: "message", detail: " Ci vediamo giovedì " })).toEqual({ titolo: "Messaggio di Matteo", dettaglio: "Ci vediamo giovedì" });
  });
});

describe("piano", () => {
  const piano: Piano = {
    lun: { pranzo: { piatto: "noodles-sesamo-maiale", extra: ["carb-rosso"] } },
    gio: { cena: { piatto: "gnocchetti-sugo-ricotta", extra: [] } },
  };

  it("riassume i giorni con i nomi dei piatti", () => {
    const righe = righePiano(piano);
    expect(righe.map((r) => r.giorno)).toEqual(["lun", "gio"]);
    expect(righe[0].pasti[0].piatto).toBeTruthy();
    expect(righe[0].pasti[0].extra).toHaveLength(1);
    expect(righe[0].pasti[1].piatto).toBeNull();
    expect(righePiano(piano, true)).toHaveLength(7);
    expect(contaPiatti(piano)).toBe(2);
  });

  it("conta i piatti usciti dal menu prima di ricaricare un piano", () => {
    expect(piattiNonPiuDisponibili(piano)).toBe(0);
    expect(piattiNonPiuDisponibili({ lun: { pranzo: { piatto: "piatto-sparito", extra: [] } } })).toBe(1);
    expect(piattiNonPiuDisponibili(null)).toBe(0);
  });
});

describe("nuova richiesta", () => {
  const limiti = { piatti: 3, min: "2026-09-28", max: "2026-12-26" };
  const buona: DatiRichiesta = {
    servizio: "menu-settimana", nome: "Maria", telefono: "333 123 4567", comune: "Pescara",
    indirizzo: "", modalita: "pickup", data: "", note: "",
    formula: "completo", fascia: "standard", nucleo: "singolo",
  };

  it("passa quando e' completa", () => {
    expect(validaRichiesta(buona, limiti)).toEqual({});
  });

  it("segnala i campi accanto ai quali scrivere", () => {
    const e = validaRichiesta({ ...buona, nome: " ", telefono: "333", comune: "", modalita: "delivery", data: "2026-09-27" }, limiti);
    expect(Object.keys(e).sort()).toEqual(["comune", "data", "indirizzo", "nome", "telefono"]);
    expect(validaRichiesta({ ...buona, data: "2027-01-10" }, limiti).data).toMatch(/90/);
    expect(validaRichiesta({ ...buona, note: "x".repeat(1501) }, limiti).note).toBeTruthy();
  });

  it("il telefono della richiesta: obbligatorio e scritto come un numero", () => {
    expect(validaRichiesta({ ...buona, telefono: "" }, limiti).telefono).toMatch(/Serve un numero/);
    expect(validaRichiesta({ ...buona, telefono: "  " }, limiti).telefono).toMatch(/Serve un numero/);
    expect(validaRichiesta({ ...buona, telefono: "chiamami" }, limiti).telefono).toMatch(/solo cifre/);
    expect(validaRichiesta({ ...buona, telefono: "+39 333 1234567 890 1234" }, limiti).telefono).toMatch(/troppo lungo/);
    expect(validaRichiesta({ ...buona, telefono: "+39 333 123 4567" }, limiti)).toEqual({});
  });

  it("rifiuta un giorno in cui Matteo e' chiuso, e dice fino a quando", () => {
    const chiusure = [{ dal: "2026-10-05", al: "2026-10-11", motivo: "Ferie" }];
    expect(validaRichiesta({ ...buona, data: "2026-10-08" }, { ...limiti, chiusure }).data).toBe(
      "Matteo è chiuso dal 5 all’11 ottobre: scegli un altro giorno.",
    );
    expect(validaRichiesta({ ...buona, data: "2026-10-12" }, { ...limiti, chiusure })).toEqual({});
    expect(validaRichiesta({ ...buona, data: "2026-10-08" }, limiti)).toEqual({});
  });

  it("chiede i piatti solo ai servizi di meal prep", () => {
    expect(validaRichiesta(buona, { ...limiti, piatti: 0 }).piano).toBeTruthy();
    expect(validaRichiesta({ ...buona, servizio: "home-cooking" }, { ...limiti, piatti: 0 })).toEqual({});
    expect(validaRichiesta({ ...buona, servizio: "abbonamento" }, { ...limiti, piatti: 0 })).toEqual({});
    expect(SERVIZIO_CON_PIATTI.abbonamento).toBe(false);
  });

  it("per l'abbonamento la data e' l'inizio, con le stesse regole", () => {
    const abb = { ...buona, servizio: "abbonamento" as const };
    expect(validaRichiesta({ ...abb, data: "2026-10-05" }, limiti)).toEqual({});
    expect(validaRichiesta({ ...abb, data: "2026-09-27" }, limiti).data).toMatch(/iniziare da domani/);
    expect(validaRichiesta({ ...abb, data: "2027-01-10" }, limiti).data).toMatch(/inizio entro i prossimi 90/);
    const corpo = corpoRichiesta({ ...abb, data: "2026-10-05", note: " Pesi lun-mer-ven " }, {}, { lun: "pesi" });
    expect(corpo).toMatchObject({ service: "abbonamento", requestedDate: "2026-10-05", notes: "Pesi lun-mer-ven" });
  });

  it("l'abbonamento vuole una formula valida, gli altri servizi la ignorano", () => {
    const abb = { ...buona, servizio: "abbonamento" as const };
    expect(validaRichiesta(abb, limiti)).toEqual({});
    for (const formula of ["pranzo", "leggero", "completo", "full6", "full7"] as const) {
      expect(validaRichiesta({ ...abb, formula }, limiti)).toEqual({});
    }
    // Uno stato corrotto (non puo' succedere dai radio, ma il server la rifiuterebbe) si ferma qui, con il fuoco sulla formula.
    const rotta = validaRichiesta({ ...abb, formula: "full8" as never }, limiti);
    expect(rotta.formula).toBe("Scegli la formula dell’abbonamento.");
    expect(ORDINE_CAMPI_RICHIESTA.find((k) => rotta[k])).toBe("formula");
    expect(validaRichiesta({ ...buona, formula: "full8" as never }, limiti)).toEqual({});
    expect(validaRichiesta({ ...abb, formula: "" as never, nome: "" }, limiti).formula).toBeTruthy();
  });

  it("l'abbonamento parte con la sua scelta e senza piatti", () => {
    const piano: Piano = { lun: { pranzo: { piatto: "noodles-sesamo-maiale", extra: [] } } };
    const abb: DatiRichiesta = { ...buona, servizio: "abbonamento", formula: "full6", fascia: "plus", nucleo: "coppia" };
    const corpo = corpoRichiesta(abb, piano, { lun: "pesi" });
    expect(corpo.subscription).toEqual({ plan: "full6", tier: "plus", household: "coppia" });
    // Niente campo della prova, ne' nella scelta ne' nella scheda che la legge.
    expect(Object.keys(corpo.subscription!)).toEqual(["plan", "tier", "household"]);
    expect(Object.keys(schedaAbbonamento(ordine({ service: "abbonamento", subscription: { plan: "full6", tier: "plus", household: "coppia" } }))!))
      .toEqual(["etichetta", "cosaRicevi", "nucleo"]);
    // Il compositore non sceglie i pasti dell'abbonamento: il server scarterebbe i piatti, e non li mandiamo.
    expect(corpo.plan).toEqual({});
    expect(corpo.training).toEqual({ lun: "pesi" });
    // Gli altri servizi non portano la scelta e tengono il loro piano.
    const menu = corpoRichiesta({ ...buona, formula: "full7", fascia: "plus" }, piano, {});
    expect(menu).not.toHaveProperty("subscription");
    expect(menu.plan).toEqual(piano);
    expect(corpoRichiesta({ ...buona, servizio: "home-cooking" }, piano, {})).not.toHaveProperty("subscription");
  });

  it("ritiro e nucleo non cambiano il listino della richiesta", () => {
    for (const nucleo of ["singolo", "coppia", "famiglia"] as const) for (const modalita of ["pickup", "delivery"] as const) {
      const stima = stimaAbbonamento({ formula: "completo", fascia: "plus", nucleo, modalita });
      expect(stima).toMatchObject({ listino: "676 €", totale: "676 €", scontoPercento: 0 });
      expect(stima.dettaglio).toBe("Prezzo di listino. Se hai un codice sconto, applicalo alla richiesta.");
    }
  });

  it("la stima del modulo e il prezzo proposto dal server coincidono, per ogni combinazione", () => {
    // Il cliente vede la stima, il server scrive il prezzo proposto: se divergono, Matteo trova una cifra
    // diversa da quella che il cliente ha letto. Si prova su tutte le 60 combinazioni, passando dal server vero.
    for (const formula of FORMULE_ID) for (const fascia of FASCE) for (const nucleo of NUCLEI) {
      for (const modalita of ["pickup", "delivery"] as const) {
        const { totaleCentesimi } = calcolaPrezzo({ formula, fascia, ritiro: modalita === "pickup", nucleo });
        expect(stimaAbbonamento({ formula, fascia, nucleo, modalita }).totale).toBe(`${totaleCentesimi / 100} €`);
        const server = leggiNuovoOrdine(
          {
            name: "Giulia", phone: "333 123 4567", comune: "Pescara", address: "Via Roma 1", service: "abbonamento",
            fulfillment: modalita, notes: "", plan: {}, training: {},
            subscription: { plan: formula, tier: fascia, household: nucleo },
          },
          "Account",
          "2026-09-27",
        );
        expect(server.ok && server.value.priceCents).toBe(totaleCentesimi);
      }
    }
  });

  it("prepara il corpo per il server", () => {
    const corpo = corpoRichiesta({ ...buona, nome: " Maria ", data: "2026-10-01" }, {}, { lun: "pesi" });
    expect(corpo).toMatchObject({ name: "Maria", requestedDate: "2026-10-01", fulfillment: "pickup", training: { lun: "pesi" } });
    expect(corpoRichiesta(buona, {}, {}).requestedDate).toBeNull();
  });

  describe("la bozza", () => {
    const min = "2026-09-28";
    const ricerca = "?sezione=richiesta&servizio=abbonamento";
    const lunga: DatiRichiesta = { ...buona, servizio: "abbonamento", formula: "full6", fascia: "plus", nucleo: "coppia", data: "2026-10-05", note: "Piano: 2200 kcal." };

    it("si salva e si ritrova uguale, per lo stesso utente e lo stesso indirizzo", () => {
      const raw = serializzaBozza("u1", ricerca, lunga);
      expect(leggiBozza(raw, "u1", ricerca, min)).toEqual(lunga);
      expect(CHIAVE_BOZZA_RICHIESTA).toMatch(/bozza-richiesta/);
    });

    it("non passa a un altro utente ne' a un altro link del sito", () => {
      const raw = serializzaBozza("u1", ricerca, lunga);
      expect(leggiBozza(raw, "u2", ricerca, min)).toBeNull();
      expect(leggiBozza(raw, "u1", "?sezione=richiesta&servizio=abbonamento&formula=completo", min)).toBeNull();
      expect(leggiBozza(raw, "u1", "", min)).not.toBeNull();
    });

    it("chi torna dal menu dell'area cliente (nessuna scelta nell'indirizzo) ritrova quello che scriveva", () => {
      const raw = serializzaBozza("u1", ricerca, lunga);
      expect(leggiBozza(raw, "u1", "sezione=richiesta", min)).toEqual(lunga);
      expect(leggiBozza(raw, "u1", "?sezione=richiesta", min)).toEqual(lunga);
      // ...ma non se arriva con una scelta sua: quella vale piu' della bozza.
      expect(leggiBozza(raw, "u1", "sezione=richiesta&servizio=home-cooking", min)).toBeNull();
    });

    it("scarta un giorno gia' passato e tiene il resto", () => {
      const raw = serializzaBozza("u1", ricerca, { ...lunga, data: "2026-09-27" });
      expect(leggiBozza(raw, "u1", ricerca, min)).toEqual({ ...lunga, data: "" });
    });

    it("rifiuta tutto cio' che non e' una bozza intera: e' sessionStorage, si puo' riscrivere a mano", () => {
      for (const raw of [null, undefined, "", "non json", "null", "[]", '{"v":2}', JSON.stringify({ v: 1, utente: "u1", ricerca })]) {
        expect(leggiBozza(raw, "u1", ricerca, min)).toBeNull();
      }
      const rotta = (campo: Partial<Record<keyof DatiRichiesta, unknown>>) =>
        leggiBozza(JSON.stringify({ v: 1, utente: "u1", ricerca, dati: { ...lunga, ...campo } }), "u1", ricerca, min);
      expect(rotta({ servizio: "constructor" })).toBeNull();
      expect(rotta({ servizio: "pizza" })).toBeNull();
      expect(rotta({ modalita: "drone" })).toBeNull();
      expect(rotta({ formula: "full8" })).toBeNull();
      expect(rotta({ fascia: "oro" })).toBeNull();
      expect(rotta({ nucleo: "branco" })).toBeNull();
      // I testi si tengono ma dentro i limiti che il server accetta.
      expect(rotta({ note: "x".repeat(2000) })?.note).toHaveLength(1500);
      expect(rotta({ nome: 42 })?.nome).toBe("");
      expect(rotta({ data: "domani" })?.data).toBe("");
    });
  });
});

describe("da dove cominciare", () => {
  it("dice a che punto e' un cliente nuovo", () => {
    expect(passiDiAvvio({ profiloCompleto: false, piatti: 0 })).toEqual([
      { id: "scelta", fatto: false }, { id: "profilo", fatto: false }, { id: "invio", fatto: false },
    ]);
    expect(passiDiAvvio({ profiloCompleto: true, piatti: 4 }).map((p) => p.fatto)).toEqual([true, true, false]);
    expect(passiDiAvvio({ profiloCompleto: true, piatti: 0 }).map((p) => p.fatto)).toEqual([false, true, false]);
    // Profilo non ancora letto: non e' ne' fatto ne' sbagliato, e non si dichiara fatto a caso.
    expect(passiDiAvvio({ profiloCompleto: null, piatti: 0 })[1].fatto).toBe(false);
    expect(passiDiAvvio({ profiloCompleto: true, piatti: 0 }).map((p) => p.id)).toEqual(["scelta", "profilo", "invio"]);
  });
});

describe("privacy", () => {
  it("chiede ELIMINA per confermare", () => {
    expect(confermaEliminazione("ELIMINA")).toBe(true);
    expect(confermaEliminazione(" elimina ")).toBe(true);
    expect(confermaEliminazione("elimin")).toBe(false);
  });

  it("dà un nome datato al file dei dati", () => {
    expect(nomeFileDati(new Date("2026-09-27T10:00:00Z"))).toBe("fuellab-i-miei-dati-2026-09-27.json");
  });
});
