import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EXTRA, PIATTI } from "./catalogo";
import {
  creaSincronizzatore,
  decidi,
  descrizioneSincronia,
  impronta,
  leggiBaseDa,
  orario,
  quando,
  testoSincronia,
  versioneDa,
  type Base,
  type Settimana,
  type VersioneAccount,
} from "./sincronizzaPiano";

const A = PIATTI[0].id;
const B = PIATTI[1].id;
const X = EXTRA[0].id;
const Y = EXTRA[1].id;

const VUOTA: Settimana = { piano: {}, allenamenti: {} };
const LUNEDI: Settimana = { piano: { lun: { pranzo: { piatto: A, extra: [] } } }, allenamenti: { lun: "pesi" } };
const MARTEDI: Settimana = { piano: { mar: { cena: { piatto: B, extra: [] } } }, allenamenti: {} };

const nell = (s: Settimana, updatedAt: string): VersioneAccount => ({ ...s, updatedAt });
const base = (s: Settimana, updatedAt: string, utente = "u1"): Base => ({ utente, updatedAt, impronta: impronta(s) });

/* ---------- Le regole ---------- */

describe("impronta", () => {
  it("non dipende dall'ordine degli extra ne' dall'ordine delle chiavi", () => {
    const uno: Settimana = { piano: { mar: { cena: { piatto: A, extra: [X, Y] } }, lun: { pranzo: { piatto: B, extra: [] } } }, allenamenti: {} };
    const due: Settimana = { piano: { lun: { pranzo: { piatto: B, extra: [] } }, mar: { cena: { piatto: A, extra: [Y, X] } } }, allenamenti: {} };
    expect(impronta(uno)).toBe(impronta(due));
  });

  it("cambia se cambiano pasti o allenamenti", () => {
    expect(impronta(LUNEDI)).not.toBe(impronta({ ...LUNEDI, allenamenti: {} }));
    expect(impronta(LUNEDI)).not.toBe(impronta(MARTEDI));
  });
});

describe("decidi: la prima volta", () => {
  const d = (locale: Settimana, account: VersioneAccount | null, b: Base | null = null) =>
    decidi({ utente: "u1", locale, account, base: b });

  it("qui vuota e account pieno: si scarica", () => {
    expect(d(VUOTA, nell(LUNEDI, "t1"))).toBe("scarica");
  });

  it("qui pasti e account vuoto (o assente): si carica", () => {
    expect(d(LUNEDI, null)).toBe("carica");
    expect(d(LUNEDI, nell(VUOTA, "t1"))).toBe("carica");
  });

  it("pasti da tutte e due le parti e diversi: si chiede", () => {
    expect(d(LUNEDI, nell(MARTEDI, "t1"))).toBe("chiedi");
  });

  it("uguali: niente da fare", () => {
    expect(d(LUNEDI, nell(LUNEDI, "t1"))).toBe("allineate");
  });

  it("niente da nessuna parte: niente", () => {
    expect(d(VUOTA, null)).toBe("niente");
  });

  it("solo allenamenti: vince chi li ha", () => {
    const soloQui: Settimana = { piano: {}, allenamenti: { gio: "cardio" } };
    expect(d(soloQui, null)).toBe("carica");
    expect(d(VUOTA, nell(soloQui, "t1"))).toBe("scarica");
  });
});

describe("decidi: con la base", () => {
  const d = (locale: Settimana, account: VersioneAccount | null, b: Base | null) =>
    decidi({ utente: "u1", locale, account, base: b });

  it("qui non e' cambiato niente, l'account si': si scarica senza chiedere", () => {
    expect(d(LUNEDI, nell(MARTEDI, "t2"), base(LUNEDI, "t1"))).toBe("scarica");
  });

  it("l'account e' fermo, qui e' cambiato: si carica senza chiedere", () => {
    expect(d(MARTEDI, nell(LUNEDI, "t1"), base(LUNEDI, "t1"))).toBe("carica");
  });

  it("cambiati tutti e due: si chiede", () => {
    const terza: Settimana = { piano: { ven: { pranzo: { piatto: A, extra: [X] } } }, allenamenti: {} };
    expect(d(terza, nell(MARTEDI, "t2"), base(LUNEDI, "t1"))).toBe("chiedi");
  });

  it("la base di un altro account non vale come base", () => {
    const terza: Settimana = { piano: { ven: { pranzo: { piatto: A, extra: [X] } } }, allenamenti: {} };
    expect(d(terza, nell(MARTEDI, "t1"), base(LUNEDI, "t1", "altro"))).toBe("chiedi");
  });

  it("qui c'e' la copia intatta della settimana di un altro account: non si carica nel mio", () => {
    expect(d(LUNEDI, null, base(LUNEDI, "t1", "altro"))).toBe("niente");
    expect(d(LUNEDI, nell(MARTEDI, "t9"), base(LUNEDI, "t1", "altro"))).toBe("scarica");
  });
});

describe("dati da fuori", () => {
  it("versioneDa pota i piatti che il menu non ha piu' e riconosce l'account vuoto", () => {
    expect(versioneDa({ plan: null, training: null, updatedAt: null })).toBeNull();
    const v = versioneDa({
      plan: { lun: { pranzo: { piatto: "non-esiste", extra: [] }, cena: { piatto: A, extra: ["boh"] } } },
      training: { lun: "pesi", mar: "yoga" },
      updatedAt: "2026-09-27 16:42:00.123",
    });
    expect(v).toEqual({ piano: { lun: { cena: { piatto: A, extra: [] } } }, allenamenti: { lun: "pesi" }, updatedAt: "2026-09-27 16:42:00.123" });
  });

  it("leggiBaseDa scarta quello che non e' una base intera", () => {
    expect(leggiBaseDa(null)).toBeNull();
    expect(leggiBaseDa({ utente: "u1", updatedAt: "t1" })).toBeNull();
    expect(leggiBaseDa({ utente: "u1", updatedAt: "t1", impronta: "" })).toEqual({ utente: "u1", updatedAt: "t1", impronta: "" });
  });
});

describe("testi", () => {
  // 27 settembre 2026, 18:50 a Pescara (UTC+2)
  const adesso = new Date("2026-09-27T16:50:00Z");

  it("l'ora e' quella di Pescara; il giorno compare solo se non e' oggi", () => {
    expect(orario("2026-09-27 16:42:10", adesso)).toBe("18:42");
    expect(orario("2026-09-26 16:42:10.5", adesso)).toBe("ieri, 18:42");
    expect(orario("2026-09-20 07:05:00", adesso)).toBe("20 settembre, 09:05");
    expect(quando("2026-09-20 07:05:00", adesso)).toBe("il 20 settembre alle 09:05");
    expect(quando("2026-09-27 16:42:10", adesso)).toBe("oggi alle 18:42");
    expect(orario("rotto", adesso)).toBe("");
  });

  it("la riga di stato dice cosa succede", () => {
    expect(testoSincronia({ fase: "spenta" }, adesso)).toBe("");
    expect(testoSincronia({ fase: "salvataggio" }, adesso)).toBe("Salvataggio…");
    expect(testoSincronia({ fase: "salvata", momento: "2026-09-27 16:42:10", ripresa: false }, adesso)).toBe("Salvata nel tuo account · 18:42");
    expect(testoSincronia({ fase: "salvata", momento: "2026-09-27 16:42:10", ripresa: true }, adesso)).toBe("Ripresa dal tuo account · 18:42");
    expect(testoSincronia({ fase: "errore", motivo: "rete", primaLettura: false }, adesso)).toBe("Non salvata: riprovo");
    expect(descrizioneSincronia({ fase: "conflitto", account: nell(LUNEDI, "t1") }, adesso)).toMatch(/scegli quale tenere/);
  });
});

/* ---------- Il motore ---------- */

class Rifiuto extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`);
  }
}

/** Un account finto con il controllo di versione del vero functions/api/plan.ts. */
function banco({ locale = VUOTA, account = null as VersioneAccount | null, baseIniziale = null as Base | null } = {}) {
  const stato = {
    locale,
    account,
    base: baseIniziale,
    rete: true,
    orologio: 0,
    letture: 0,
    scritture: [] as { s: Settimana; se: string | null; urgente: boolean }[],
    /** risposte del PUT trattenute: si liberano a mano per provare "una alla volta" */
    trattieni: false,
    sospese: [] as (() => void)[],
    accessoScaduto: 0,
    /** se c'e', il PUT risponde con questo stato */
    errore: null as number | null,
  };
  const ascoltatori = new Set<() => void>();
  const motore = creaSincronizzatore({
    leggiLocale: () => stato.locale,
    scriviLocale: (s) => {
      stato.locale = s;
      for (const f of ascoltatori) f();
    },
    ascoltaLocale: (f) => {
      ascoltatori.add(f);
      return () => ascoltatori.delete(f);
    },
    leggiAccount: async () => {
      stato.letture++;
      if (!stato.rete) throw new Rifiuto(0);
      const a = stato.account;
      return { plan: a?.piano ?? null, training: a?.allenamenti ?? null, updatedAt: a?.updatedAt ?? null };
    },
    scriviAccount: async (s, se, urgente) => {
      stato.scritture.push({ s, se, urgente });
      if (stato.trattieni) await new Promise<void>((r) => stato.sospese.push(r));
      if (!stato.rete) throw new Rifiuto(0);
      if (stato.errore) throw new Rifiuto(stato.errore);
      if ((stato.account?.updatedAt ?? null) !== se) throw new Rifiuto(409);
      stato.orologio++;
      stato.account = { ...s, updatedAt: `s${stato.orologio}` };
      return { updatedAt: stato.account.updatedAt };
    },
    leggiBase: () => stato.base,
    scriviBase: (b) => {
      stato.base = b;
    },
    suAccessoScaduto: () => {
      stato.accessoScaduto++;
    },
    attesa: 1500,
  });
  /** l'utente tocca il compositore */
  const modifica = (s: Settimana) => {
    stato.locale = s;
    for (const f of ascoltatori) f();
  };
  return { stato, motore, modifica };
}

/** Fa correre il tempo finto e lascia finire le promesse appese. */
async function scorri(ms = 0) {
  await vi.advanceTimersByTimeAsync(ms);
  for (let i = 0; i < 10; i++) await Promise.resolve();
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("motore: primo caricamento", () => {
  it("senza avvia (anonimo) non chiama mai l'account", async () => {
    const { stato, motore, modifica } = banco({ locale: LUNEDI });
    modifica(MARTEDI);
    await scorri(10_000);
    expect(stato.letture).toBe(0);
    expect(stato.scritture).toHaveLength(0);
    expect(motore.stato().fase).toBe("spenta");
  });

  it("qui vuota e account pieno: porta qui l'account e non riscrive", async () => {
    const { stato, motore } = banco({ account: nell(LUNEDI, "v7") });
    motore.avvia("u1");
    await scorri();
    expect(stato.locale).toEqual({ piano: LUNEDI.piano, allenamenti: LUNEDI.allenamenti });
    expect(motore.stato()).toEqual({ fase: "salvata", momento: "v7", ripresa: true });
    await scorri(5_000);
    expect(stato.scritture).toHaveLength(0);
  });

  it("qui pasti e account vuoto: salva questa, dicendo che non si aspetta niente nell'account", async () => {
    const { stato, motore } = banco({ locale: LUNEDI });
    motore.avvia("u1");
    await scorri();
    expect(stato.scritture).toHaveLength(1);
    expect(stato.scritture[0].se).toBeNull();
    expect(stato.account?.piano).toEqual(LUNEDI.piano);
    expect(motore.stato()).toMatchObject({ fase: "salvata", momento: "s1" });
    expect(stato.base).toEqual({ utente: "u1", updatedAt: "s1", impronta: impronta(LUNEDI) });
  });

  it("tutte e due piene e diverse: chiede, e intanto non salva niente", async () => {
    const { stato, motore, modifica } = banco({ locale: LUNEDI, account: nell(MARTEDI, "v3") });
    motore.avvia("u1");
    await scorri();
    expect(motore.stato()).toMatchObject({ fase: "conflitto", account: { updatedAt: "v3" } });
    modifica({ ...LUNEDI, allenamenti: { lun: "cardio" } });
    await scorri(10_000);
    expect(stato.scritture).toHaveLength(0);
    expect(stato.locale.allenamenti).toEqual({ lun: "cardio" });
  });

  it("uguali: niente scritture, solo la base", async () => {
    const { stato, motore } = banco({ locale: LUNEDI, account: nell(LUNEDI, "v3") });
    motore.avvia("u1");
    await scorri();
    expect(stato.scritture).toHaveLength(0);
    expect(motore.stato()).toMatchObject({ fase: "salvata", momento: "v3", ripresa: false });
    expect(stato.base?.updatedAt).toBe("v3");
  });

  it("l'account e' cambiato altrove e qui no: lo porta qui senza chiedere", async () => {
    const { stato, motore } = banco({ locale: LUNEDI, account: nell(MARTEDI, "v9"), baseIniziale: base(LUNEDI, "v2") });
    motore.avvia("u1");
    await scorri();
    expect(stato.locale.piano).toEqual(MARTEDI.piano);
    expect(motore.stato()).toMatchObject({ fase: "salvata", ripresa: true });
    expect(stato.scritture).toHaveLength(0);
  });
});

describe("motore: dopo le modifiche", () => {
  it("aspetta 1,5 s di quiete e manda una sola richiesta", async () => {
    const { stato, motore, modifica } = banco({ locale: LUNEDI, account: nell(LUNEDI, "v1") });
    motore.avvia("u1");
    await scorri();
    modifica(MARTEDI);
    expect(motore.stato().fase).toBe("salvataggio");
    await scorri(1_000);
    modifica({ ...MARTEDI, allenamenti: { mar: "riposo" } });
    await scorri(1_000);
    expect(stato.scritture).toHaveLength(0);
    await scorri(600);
    expect(stato.scritture).toHaveLength(1);
    expect(stato.scritture[0]).toMatchObject({ se: "v1", s: { allenamenti: { mar: "riposo" } } });
    expect(motore.stato()).toMatchObject({ fase: "salvata", momento: "s1" });
  });

  it("una richiesta alla volta: la modifica arrivata durante il viaggio parte dopo", async () => {
    const { stato, motore, modifica } = banco({ locale: LUNEDI, account: nell(LUNEDI, "v1") });
    motore.avvia("u1");
    await scorri();
    stato.trattieni = true;
    modifica(MARTEDI);
    await scorri(1_600);
    expect(stato.scritture).toHaveLength(1);
    modifica(VUOTA);
    await scorri(5_000);
    expect(stato.scritture).toHaveLength(1); // la prima e' ancora in viaggio
    stato.trattieni = false;
    stato.sospese.splice(0).forEach((r) => r());
    await scorri();
    expect(stato.scritture).toHaveLength(2);
    expect(stato.scritture[1]).toMatchObject({ se: "s1", s: VUOTA });
    expect(stato.account?.piano).toEqual({});
  });

  it("torna com'era: niente richiesta", async () => {
    const { stato, motore, modifica } = banco({ locale: LUNEDI, account: nell(LUNEDI, "v1") });
    motore.avvia("u1");
    await scorri();
    modifica(MARTEDI);
    await scorri(500);
    modifica(LUNEDI);
    await scorri(2_000);
    expect(stato.scritture).toHaveLength(0);
    expect(motore.stato()).toMatchObject({ fase: "salvata", momento: "v1" });
  });

  it("senza rete: 'Non salvata: riprovo', poi riprova da solo", async () => {
    const { stato, motore, modifica } = banco({ locale: LUNEDI, account: nell(LUNEDI, "v1") });
    motore.avvia("u1");
    await scorri();
    stato.rete = false;
    modifica(MARTEDI);
    await scorri(1_600);
    expect(motore.stato()).toEqual({ fase: "errore", motivo: "rete", primaLettura: false });
    stato.rete = true;
    await scorri(2_100);
    expect(motore.stato()).toMatchObject({ fase: "salvata", momento: "s1" });
    expect(stato.account?.piano).toEqual(MARTEDI.piano);
  });

  it("la rete torna prima della riprova: riprovaOra salva subito", async () => {
    const { stato, motore, modifica } = banco({ locale: LUNEDI, account: nell(LUNEDI, "v1") });
    motore.avvia("u1");
    await scorri();
    stato.rete = false;
    modifica(MARTEDI);
    await scorri(1_600);
    await scorri(2_100); // prima riprova, ancora senza rete
    expect(motore.stato().fase).toBe("errore");
    stato.rete = true;
    motore.riprovaOra();
    await scorri();
    expect(motore.stato()).toMatchObject({ fase: "salvata" });
  });

  it("409: l'account e' cambiato altrove mentre qui si modificava: rilegge e chiede", async () => {
    const { stato, motore, modifica } = banco({ locale: LUNEDI, account: nell(LUNEDI, "v1") });
    motore.avvia("u1");
    await scorri();
    stato.account = nell(MARTEDI, "v5"); // un altro dispositivo
    const terza: Settimana = { piano: { ven: { pranzo: { piatto: A, extra: [X] } } }, allenamenti: {} };
    modifica(terza);
    await scorri(1_600);
    expect(stato.scritture).toHaveLength(1); // rifiutata col 409
    expect(stato.account.piano).toEqual(MARTEDI.piano); // l'altro dispositivo non e' stato scavalcato
    expect(motore.stato()).toMatchObject({ fase: "conflitto", account: { updatedAt: "v5" } });
  });

  it("401: smette di provarci e avvisa chi l'ha montato", async () => {
    const { stato, motore, modifica } = banco({ locale: LUNEDI, account: nell(LUNEDI, "v1") });
    motore.avvia("u1");
    await scorri();
    stato.errore = 401;
    modifica(MARTEDI);
    await scorri(1_600);
    expect(motore.stato()).toMatchObject({ fase: "errore", motivo: "accesso" });
    expect(stato.accessoScaduto).toBe(1);
    modifica(VUOTA);
    await scorri(120_000);
    expect(stato.scritture).toHaveLength(1); // nessuna riprova contro una sessione finita
  });
});

describe("motore: la scelta", () => {
  it("'Usa quella dell'account': la porta qui e riparte a salvare", async () => {
    const { stato, motore, modifica } = banco({ locale: LUNEDI, account: nell(MARTEDI, "v3") });
    motore.avvia("u1");
    await scorri();
    motore.usaAccount();
    expect(stato.locale.piano).toEqual(MARTEDI.piano);
    expect(motore.stato()).toMatchObject({ fase: "salvata", momento: "v3", ripresa: true });
    modifica(VUOTA);
    await scorri(1_600);
    expect(stato.scritture).toHaveLength(1);
    expect(stato.scritture[0].se).toBe("v3");
  });

  it("'Tieni questa': sovrascrive la versione che l'utente ha visto", async () => {
    const { stato, motore } = banco({ locale: LUNEDI, account: nell(MARTEDI, "v3") });
    motore.avvia("u1");
    await scorri();
    motore.tieniQuesta();
    await scorri();
    expect(stato.scritture).toEqual([{ s: LUNEDI, se: "v3", urgente: false }]);
    expect(stato.account?.piano).toEqual(LUNEDI.piano);
    expect(motore.stato()).toMatchObject({ fase: "salvata", momento: "s1" });
  });

  it("se l'utente rende uguali le due settimane il conflitto si chiude da solo", async () => {
    const { stato, motore, modifica } = banco({ locale: LUNEDI, account: nell(MARTEDI, "v3") });
    motore.avvia("u1");
    await scorri();
    modifica(MARTEDI);
    expect(motore.stato()).toMatchObject({ fase: "salvata", momento: "v3" });
    expect(stato.scritture).toHaveLength(0);
  });
});

describe("motore: dintorni", () => {
  it("ferma (uscita dall'account): nessuna chiamata e la settimana locale resta", async () => {
    const { stato, motore, modifica } = banco({ locale: LUNEDI, account: nell(LUNEDI, "v1") });
    motore.avvia("u1");
    await scorri();
    modifica(MARTEDI);
    motore.ferma();
    await scorri(10_000);
    expect(stato.scritture).toHaveLength(0);
    expect(stato.locale).toEqual(MARTEDI);
    expect(motore.stato().fase).toBe("spenta");
  });

  it("svuota: la modifica in attesa parte subito, come richiesta urgente", async () => {
    const { stato, motore, modifica } = banco({ locale: LUNEDI, account: nell(LUNEDI, "v1") });
    motore.avvia("u1");
    await scorri();
    modifica(MARTEDI);
    motore.svuota();
    await scorri();
    expect(stato.scritture).toHaveLength(1);
    expect(stato.scritture[0].urgente).toBe(true);
  });

  it("ricontrolla al ritorno sulla scheda: porta qui quello che e' cambiato altrove", async () => {
    const { stato, motore } = banco({ locale: LUNEDI, account: nell(LUNEDI, "v1") });
    motore.avvia("u1");
    await scorri();
    stato.account = nell(MARTEDI, "v8");
    motore.ricontrolla(); // troppo presto: niente
    await scorri();
    expect(stato.locale.piano).toEqual(LUNEDI.piano);
    await scorri(16_000);
    motore.ricontrolla();
    await scorri();
    expect(stato.locale.piano).toEqual(MARTEDI.piano);
    expect(stato.scritture).toHaveLength(0);
  });

  it("un'altra scheda ha gia' salvato la stessa settimana: non riscrive", async () => {
    const { stato, motore, modifica } = banco({ locale: LUNEDI, account: nell(LUNEDI, "v1") });
    motore.avvia("u1");
    await scorri();
    modifica(MARTEDI);
    // l'altra scheda salva prima di noi e aggiorna la base comune
    stato.account = nell(MARTEDI, "v2");
    stato.base = base(MARTEDI, "v2");
    await scorri(1_600);
    expect(stato.scritture).toHaveLength(0);
    expect(motore.stato()).toMatchObject({ fase: "salvata", momento: "v2" });
  });

  it("utente diverso sullo stesso browser: la settimana intatta dell'altro non finisce nel suo account", async () => {
    const { stato, motore } = banco({ locale: LUNEDI, account: null, baseIniziale: base(LUNEDI, "v1", "altro") });
    motore.avvia("u1");
    await scorri(5_000);
    expect(stato.scritture).toHaveLength(0);
    expect(motore.stato().fase).toBe("vuota");
  });
});
