import { describe, expect, it } from "vitest";
import {
  campiMancanti,
  confermaEliminazione,
  contaPiatti,
  corpoRichiesta,
  dataIso,
  descriviEvento,
  destinazioneSicura,
  emailValida,
  erroreDiRitorno,
  formattaGiorno,
  hrefAccedi,
  hrefSezione,
  iniziale,
  limitiDataRichiesta,
  messaggioDa,
  modoDa,
  nomeBreve,
  nomeFileDati,
  passiOrdine,
  passwordAccettabile,
  piattiNonPiuDisponibili,
  primoNome,
  prossimaConsegna,
  requisitiPassword,
  righePiano,
  servizioDa,
  sezioneDa,
  spostaGiorni,
  traduciErroreAuth,
  validaRichiesta,
  type DatiRichiesta,
} from "./account";
import { ApiError, type EventoOrdine, type Ordine } from "./api";
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
    expect(servizioDa(null)).toBe("menu-settimana");
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
    expect(traduciErroreAuth({ status: 404 }, "elimina").tipo).toBe("non-attivo");
    expect(traduciErroreAuth({ status: 403 }, "elimina").tipo).toBe("vietato");
    expect(traduciErroreAuth({ code: "ADMIN_ACCOUNT_PROTECTED", status: 403 }, "elimina").messaggio).toMatch(/protetto/);
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
  });

  it("prepara il corpo per il server", () => {
    const corpo = corpoRichiesta({ ...buona, nome: " Maria ", data: "2026-10-01" }, {}, { lun: "pesi" });
    expect(corpo).toMatchObject({ name: "Maria", requestedDate: "2026-10-01", fulfillment: "pickup", training: { lun: "pesi" } });
    expect(corpoRichiesta(buona, {}, {}).requestedDate).toBeNull();
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
