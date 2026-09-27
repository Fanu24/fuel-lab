import { daSqlite } from "./api";
import { GIORNI, PASTI, potaAllenamenti, potaPiano, type Allenamenti, type Piano } from "./settimana";

/* =========================================================================
   La settimana nell'account: quando browser e account non sono d'accordo,
   chi vince.

   Il piano vive in localStorage (lib/piano) e, per chi ha fatto l'accesso,
   anche nell'account (GET/PUT /api/plan). Qui stanno le regole, scritte come
   funzioni pure, e il motore che le applica (attesa dopo le modifiche, una
   richiesta alla volta, riprova). Niente React e niente fetch: le dipendenze
   arrivano da components/account/SincronizzaPiano.tsx, i test le fingono.

   LA BASE. Dopo ogni allineamento riuscito il browser si ricorda "l'account
   era alla versione V e conteneva X" (utente, updatedAt, impronta). Alla
   lettura successiva questo dice chi e' cambiato nel frattempo:
   - solo l'account (qui c'e' ancora X): la versione dell'account e' piu'
     nuova e si scarica senza chiedere, perche' qui non c'e' lavoro da perdere;
   - solo il browser (l'account e' ancora V): si carica;
   - tutti e due, o nessuna base: valgono le regole della prima volta.

   LA PRIMA VOLTA (o quando sono cambiati entrambi):
   - qui nessun pasto, nell'account si'  -> si scarica l'account;
   - qui pasti, nell'account no          -> si carica questa;
   - pasti da tutte e due le parti       -> si chiede, non si sceglie da soli;
   - uguali                              -> niente.

   L'account non si sovrascrive mai alla cieca: ogni PUT porta la versione da
   cui parte e il server risponde 409 se nel frattempo e' cambiata. Allora si
   rilegge e si decide di nuovo.
   ========================================================================= */

/* ---------- Tipi ---------- */

export type Settimana = { piano: Piano; allenamenti: Allenamenti };

/** La settimana salvata nell'account, con la sua versione (updated_at del server). */
export type VersioneAccount = Settimana & { updatedAt: string };

/** L'ultimo punto in cui browser e account coincidevano, per questo utente. */
export type Base = { utente: string; updatedAt: string; impronta: string };

/** La risposta di GET /api/plan, cosi' come arriva: i dati si potano qui. */
export type RispostaAccount = { plan: unknown; training: unknown; updatedAt: string | null };

export type Decisione = "niente" | "allineate" | "scarica" | "carica" | "chiedi";

/* ---------- Confronti ---------- */

/**
 * Una stringa che e' uguale per due settimane uguali: giorni e pasti in ordine
 * fisso, extra ordinati (l'ordine in cui li hai spuntati non cambia la box).
 */
export function impronta(s: Settimana): string {
  const pezzi: string[] = [];
  for (const g of GIORNI) {
    for (const m of PASTI) {
      const c = s.piano[g]?.[m];
      const extra = c?.extra ?? [];
      if (!c || (!c.piatto && extra.length === 0)) continue;
      pezzi.push(`${g}.${m}=${c.piatto ?? ""}+${[...extra].sort().join(",")}`);
    }
  }
  for (const g of GIORNI) {
    const t = s.allenamenti[g];
    if (t) pezzi.push(`${g}:${t}`);
  }
  return pezzi.join("|");
}

/** Le caselle con dentro qualcosa (un piatto o solo aggiunte). */
export function contaPasti(s: Settimana): number {
  let n = 0;
  for (const g of GIORNI) {
    for (const m of PASTI) {
      const c = s.piano[g]?.[m];
      if (c && (c.piatto || (c.extra ?? []).length > 0)) n++;
    }
  }
  return n;
}

export const conPasti = (s: Settimana) => contaPasti(s) > 0;

/** Niente pasti e nessun allenamento: una settimana mai toccata. */
export const vuota = (s: Settimana) => !conPasti(s) && Object.keys(s.allenamenti).length === 0;

/** GET /api/plan -> la versione dell'account, potata come ogni dato che arriva da fuori. */
export function versioneDa(r: RispostaAccount): VersioneAccount | null {
  if (!r.updatedAt) return null;
  return { piano: potaPiano(r.plan), allenamenti: potaAllenamenti(r.training), updatedAt: r.updatedAt };
}

/** La base riletta da localStorage, che si puo' riscrivere a mano: o e' intera o non c'e'. */
export function leggiBaseDa(v: unknown): Base | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.utente !== "string" || !o.utente) return null;
  if (typeof o.updatedAt !== "string" || !o.updatedAt) return null;
  if (typeof o.impronta !== "string") return null;
  return { utente: o.utente, updatedAt: o.updatedAt, impronta: o.impronta };
}

/* ---------- La regola ---------- */

/**
 * Cosa fare quando si confrontano la settimana di questo browser e quella
 * dell'account. `base` e' quella salvata in localStorage, di chiunque sia.
 */
export function decidi({
  utente,
  locale,
  account,
  base,
}: {
  utente: string;
  locale: Settimana;
  account: VersioneAccount | null;
  base: Base | null;
}): Decisione {
  const qui = impronta(locale);
  if (account && impronta(account) === qui) return "allineate";
  if (!account && vuota(locale)) return "niente";

  if (account && base && base.utente === utente) {
    const cambiatoQui = base.impronta !== qui;
    const cambiatoAccount = base.updatedAt !== account.updatedAt;
    if (!cambiatoQui && cambiatoAccount) return "scarica";
    if (cambiatoQui && !cambiatoAccount) return "carica";
  }

  /* Qui c'e' la copia intatta della settimana di un ALTRO account (stesso
     browser: uno e' uscito, l'altro e' entrato). E' al sicuro nell'account a
     cui appartiene, quindi non e' lavoro di chi e' appena entrato: non la si
     carica nel suo account e, se lui ne ha una, si mostra la sua. */
  if (base && base.utente !== utente && base.impronta === qui) {
    return account && !vuota(account) ? "scarica" : "niente";
  }

  const pienoQui = conPasti(locale);
  const pienoAccount = !!account && conPasti(account);
  if (pienoQui && pienoAccount) return "chiedi";
  if (pienoAccount) return "scarica";
  if (pienoQui) return "carica";
  // Nessun pasto da nessuna parte: restano gli allenamenti, e vince chi ne ha.
  return vuota(locale) ? "scarica" : "carica";
}

/* ---------- Lo stato che si vede ---------- */

export type StatoSincronia =
  /** nessuno collegato: nessuna chiamata a /api/plan */
  | { fase: "spenta" }
  /** prima lettura dell'account in corso */
  | { fase: "controllo" }
  /** niente nell'account e niente da salvare */
  | { fase: "vuota" }
  /** modifiche in attesa o in viaggio */
  | { fase: "salvataggio" }
  /** allineata; `ripresa`: e' arrivata dall'account, non partita da qui */
  | { fase: "salvata"; momento: string; ripresa: boolean }
  | { fase: "errore"; motivo: "rete" | "accesso"; primaLettura: boolean }
  /** due settimane diverse: finche' l'utente non sceglie non si salva niente */
  | { fase: "conflitto"; account: VersioneAccount };

export const SPENTA: StatoSincronia = Object.freeze({ fase: "spenta" });

const MESI = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
];

const FORMATO = new Intl.DateTimeFormat("it-IT", {
  timeZone: "Europe/Rome",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Giorno e ora a Pescara, qualunque sia il fuso del telefono. */
function parti(d: Date) {
  const p = Object.fromEntries(FORMATO.formatToParts(d).map((x) => [x.type, x.value]));
  return {
    giorno: `${p.year}-${p.month}-${p.day}`,
    numero: Number(p.day),
    mese: MESI[Number(p.month) - 1] ?? "",
    ora: `${p.hour.padStart(2, "0")}:${p.minute}`,
  };
}

function relativo(ts: string, adesso: Date) {
  const d = daSqlite(ts);
  if (Number.isNaN(d.getTime())) return null;
  const q = parti(d);
  const oggi = parti(adesso).giorno;
  const ieri = parti(new Date(adesso.getTime() - 86_400_000)).giorno;
  return { ...q, quale: q.giorno === oggi ? "oggi" : q.giorno === ieri ? "ieri" : "altro" };
}

/** Per la riga di stato: "18:42", "ieri, 18:42", "25 settembre, 18:42". */
export function orario(ts: string, adesso: Date): string {
  const r = relativo(ts, adesso);
  if (!r) return "";
  if (r.quale === "oggi") return r.ora;
  if (r.quale === "ieri") return `ieri, ${r.ora}`;
  return `${r.numero} ${r.mese}, ${r.ora}`;
}

/** Per una frase: "oggi alle 18:42", "ieri alle 18:42", "il 25 settembre alle 18:42". */
export function quando(ts: string, adesso: Date): string {
  const r = relativo(ts, adesso);
  if (!r) return "";
  if (r.quale === "oggi") return `oggi alle ${r.ora}`;
  if (r.quale === "ieri") return `ieri alle ${r.ora}`;
  return `il ${r.numero} ${r.mese} alle ${r.ora}`;
}

/** La riga corta vicino al titolo del compositore. Vuota quando non c'e' niente da dire. */
export function testoSincronia(s: StatoSincronia, adesso: Date): string {
  switch (s.fase) {
    case "spenta":
      return "";
    case "controllo":
      return "Controllo il tuo account…";
    case "vuota":
      return "Si salva da sola nel tuo account";
    case "salvataggio":
      return "Salvataggio…";
    case "salvata": {
      const t = orario(s.momento, adesso);
      return `${s.ripresa ? "Ripresa dal" : "Salvata nel"} tuo account${t ? ` · ${t}` : ""}`;
    }
    case "errore":
      if (s.motivo === "accesso") return "Non salvata: accedi di nuovo";
      return s.primaLettura ? "Account non raggiungibile: riprovo" : "Non salvata: riprovo";
    case "conflitto":
      return "Due versioni della settimana: scegli quale tenere";
  }
}

/** La stessa cosa detta per intero, per "La mia settimana" nell'area cliente. */
export function descrizioneSincronia(s: StatoSincronia, adesso: Date): string {
  switch (s.fase) {
    case "spenta":
    case "controllo":
      return "Controllo la versione nel tuo account…";
    case "vuota":
      return "Appena aggiungi un piatto, la settimana si salva da sola nel tuo account.";
    case "salvataggio":
      return "Salvataggio nel tuo account…";
    case "salvata":
      return `${testoSincronia(s, adesso)}. La ritrovi su ogni dispositivo in cui accedi.`;
    case "errore":
      if (s.motivo === "accesso") return "Non salvata: la sessione è scaduta. Accedi di nuovo e la settimana si salva da sola.";
      return s.primaLettura
        ? "Non riesco a raggiungere il tuo account. Riprovo da solo appena torna la connessione."
        : "Non salvata: la connessione non risponde. Resta su questo dispositivo e riprovo da solo.";
    case "conflitto":
      return "Nel tuo account c’è una settimana diversa da questa: scegli quale tenere. Finché non scegli, non salviamo niente.";
  }
}

/* ---------- Il motore ---------- */

export interface DipendenzeSincronia {
  leggiLocale: () => Settimana;
  scriviLocale: (s: Settimana) => void;
  /** avvisa a ogni modifica della settimana locale, anche da un'altra scheda */
  ascoltaLocale: (f: () => void) => () => void;
  leggiAccount: () => Promise<RispostaAccount>;
  /** PUT condizionato: lancia un errore con `status` 409 se l'account non e' piu' a `seVersione` */
  scriviAccount: (s: Settimana, seVersione: string | null, urgente: boolean) => Promise<{ updatedAt: string }>;
  leggiBase: () => Base | null;
  scriviBase: (b: Base) => void;
  /** una scheda alla volta (Web Locks): la seconda trova la base gia' aggiornata e non riscrive */
  inEsclusiva?: <T>(f: () => Promise<T>) => Promise<T>;
  /** 401: la sessione e' finita altrove, chi monta il motore rilegge chi e' collegato */
  suAccessoScaduto?: () => void;
  /** millisecondi di quiete prima di salvare */
  attesa?: number;
  adesso?: () => number;
}

export interface Sincronizzatore {
  /** utente collegato: legge l'account e applica le regole */
  avvia: (utente: string) => void;
  /** nessuno collegato: smette di chiamare il server, la settimana locale resta com'e' */
  ferma: () => void;
  stato: () => StatoSincronia;
  ascolta: (f: () => void) => () => void;
  /** conflitto: vince l'account */
  usaAccount: () => void;
  /** conflitto: vince questa */
  tieniQuesta: () => void;
  /** la rete e' tornata, o l'utente ha premuto "Riprova" */
  riprovaOra: () => void;
  /** la scheda torna in primo piano: l'account puo' essere cambiato da un altro dispositivo */
  ricontrolla: () => void;
  /** la pagina si nasconde o si chiude: salva subito quello che era in attesa */
  svuota: () => void;
}

const RICONTROLLO_MINIMO = 15_000;
const RIPROVA_MASSIMA = 60_000;
/** 409 di fila oltre i quali si smette di insistere e si chiede */
const RIFIUTI_MASSIMI = 3;

function codice(e: unknown): number {
  return e && typeof e === "object" && "status" in e && typeof e.status === "number" ? e.status : 0;
}

export function creaSincronizzatore(dip: DipendenzeSincronia): Sincronizzatore {
  const ATTESA = dip.attesa ?? 1500;
  const esclusiva = dip.inEsclusiva ?? (<T>(f: () => Promise<T>) => f());
  const ora = dip.adesso ?? (() => Date.now());

  let utente: string | null = null;
  let attuale: StatoSincronia = SPENTA;
  /** cresce a ogni avvia/ferma: le risposte di un giro vecchio si buttano */
  let giro = 0;
  /** la versione dell'account che conosco: e' quella che va nel PUT */
  let versione: string | null = null;
  /** la prima lettura dell'account e' andata a buon fine */
  let letto = false;
  let inVolo = false;
  let poi: "salva" | "controlla" | null = null;
  let timerSalva: ReturnType<typeof setTimeout> | null = null;
  let timerRiprova: ReturnType<typeof setTimeout> | null = null;
  let tentativi = 0;
  let rifiuti = 0;
  let ultimoControllo = -Infinity;
  /** sto scrivendo io la settimana locale: non e' una modifica dell'utente */
  let scrivo = false;
  let stacca: (() => void) | null = null;
  const ascoltatori = new Set<() => void>();

  function imposta(s: StatoSincronia) {
    attuale = s;
    for (const f of ascoltatori) f();
  }

  function fermaTimer() {
    if (timerSalva) clearTimeout(timerSalva);
    if (timerRiprova) clearTimeout(timerRiprova);
    timerSalva = null;
    timerRiprova = null;
  }

  const bloccato = () => attuale.fase === "errore" && attuale.motivo === "accesso";

  /** Browser e account coincidono su `account`: lo si ricorda e, se serve, lo si porta qui. */
  function allinea(account: VersioneAccount, scarica: boolean) {
    if (!utente) return;
    dip.scriviBase({ utente, updatedAt: account.updatedAt, impronta: impronta(account) });
    versione = account.updatedAt;
    rifiuti = 0;
    if (scarica) {
      scrivo = true;
      try {
        dip.scriviLocale({ piano: account.piano, allenamenti: account.allenamenti });
      } finally {
        scrivo = false;
      }
    }
    imposta({ fase: "salvata", momento: account.updatedAt, ripresa: scarica });
  }

  function suModificaLocale() {
    // Prima della lettura dell'account non si salva: la decisione leggera' il locale di quel momento.
    if (!utente || scrivo || !letto || bloccato()) return;
    if (attuale.fase === "conflitto") {
      // Mai salvare durante il conflitto; ma se l'utente ha reso le due uguali, non c'e' piu' niente da chiedere.
      if (impronta(dip.leggiLocale()) === impronta(attuale.account)) allinea(attuale.account, false);
      return;
    }
    if (timerSalva) clearTimeout(timerSalva);
    if (attuale.fase !== "salvataggio") imposta({ fase: "salvataggio" });
    timerSalva = setTimeout(() => {
      timerSalva = null;
      void salva();
    }, ATTESA);
  }

  function riprovaTra() {
    if (timerRiprova) clearTimeout(timerRiprova);
    tentativi++;
    const ms = Math.min(RIPROVA_MASSIMA, 2_000 * 2 ** (tentativi - 1));
    timerRiprova = setTimeout(() => {
      timerRiprova = null;
      void (letto ? salva() : controlla());
    }, ms);
  }

  function scaduto() {
    fermaTimer();
    poi = null;
    imposta({ fase: "errore", motivo: "accesso", primaLettura: !letto });
    dip.suAccessoScaduto?.();
  }

  function seguito() {
    const p = poi;
    poi = null;
    if (p === "salva") void salva();
    else if (p === "controlla") void controlla();
  }

  async function salva(opzioni: { urgente?: boolean; forza?: boolean } = {}): Promise<void> {
    if (!utente || attuale.fase === "conflitto" || bloccato()) return;
    if (!letto) return controlla();
    if (inVolo) {
      poi = "salva";
      return;
    }
    fermaTimer();
    const g = giro;
    const chi = utente;
    const se = versione;
    inVolo = true;
    let esito: { base: Base | null; scritta: boolean } | null;
    try {
      esito = await esclusiva(async () => {
        if (g !== giro) return null;
        const locale = dip.leggiLocale();
        const qui = impronta(locale);
        const b = dip.leggiBase();
        const base = b && b.utente === chi ? b : null;
        if (!opzioni.forza) {
          // gia' cosi' nell'account (magari l'ha appena salvata un'altra scheda)
          if (base && base.impronta === qui) return { base, scritta: false };
          // niente nell'account e niente da metterci
          if (!base && se === null && vuota(locale)) return { base: null, scritta: false };
        }
        const r = await dip.scriviAccount(locale, se, !!opzioni.urgente);
        const nuova: Base = { utente: chi, updatedAt: r.updatedAt, impronta: qui };
        // Vero anche se nel frattempo l'utente e' uscito: il server l'ha scritta.
        dip.scriviBase(nuova);
        return { base: nuova, scritta: true };
      });
    } catch (e) {
      if (g !== giro) return;
      inVolo = false;
      poi = null;
      const c = codice(e);
      if (c === 409) {
        // L'account e' cambiato da un'altra parte: si rilegge e si decide di nuovo.
        rifiuti++;
        return controlla();
      }
      if (c === 401) return scaduto();
      imposta({ fase: "errore", motivo: "rete", primaLettura: false });
      riprovaTra();
      return;
    }
    if (g !== giro || !esito) return;
    inVolo = false;
    tentativi = 0;
    if (esito.scritta) rifiuti = 0;
    if (esito.base) {
      versione = esito.base.updatedAt;
      const stessa = attuale.fase === "salvata" && attuale.momento === esito.base.updatedAt;
      if (!stessa) imposta({ fase: "salvata", momento: esito.base.updatedAt, ripresa: false });
    } else {
      imposta({ fase: "vuota" });
    }
    seguito();
  }

  async function controlla(): Promise<void> {
    if (!utente) return;
    if (inVolo) {
      poi = "controlla";
      return;
    }
    fermaTimer();
    const g = giro;
    const chi = utente;
    inVolo = true;
    if (!letto) imposta({ fase: "controllo" });
    let risposta: RispostaAccount;
    try {
      risposta = await dip.leggiAccount();
    } catch (e) {
      if (g !== giro) return;
      inVolo = false;
      poi = null;
      if (codice(e) === 401) return scaduto();
      if (!letto) {
        imposta({ fase: "errore", motivo: "rete", primaLettura: true });
        riprovaTra();
      } else if (attuale.fase === "salvataggio" || attuale.fase === "errore") {
        // c'e' lavoro non salvato: lo si dice e si riprova
        imposta({ fase: "errore", motivo: "rete", primaLettura: false });
        riprovaTra();
      }
      // altrimenti era un controllo di fondo: niente da dire, si riprovera' al prossimo ritorno sulla scheda
      return;
    }
    if (g !== giro) return;
    inVolo = false;
    letto = true;
    tentativi = 0;
    ultimoControllo = ora();
    poi = null; // la decisione legge il locale di adesso: copre anche le modifiche arrivate nel frattempo
    const account = versioneDa(risposta);
    versione = account?.updatedAt ?? null;
    const d = decidi({ utente: chi, locale: dip.leggiLocale(), account, base: dip.leggiBase() });
    if (d === "allineate" && account) allinea(account, false);
    else if (d === "scarica" && account) allinea(account, true);
    else if (d === "chiedi" && account) imposta({ fase: "conflitto", account });
    else if (d === "carica") {
      if (rifiuti >= RIFIUTI_MASSIMI && account && conPasti(account)) {
        // l'account continua a cambiare sotto i piedi: meglio chiedere che insistere
        imposta({ fase: "conflitto", account });
      } else {
        imposta({ fase: "salvataggio" });
        void salva({ forza: true });
      }
    } else imposta({ fase: "vuota" });
  }

  function ricontrolla(forza: boolean) {
    if (!utente || !letto || inVolo || bloccato()) return;
    if (attuale.fase === "errore") return; // ci pensa la riprova
    if (timerSalva) {
      // prima il lavoro in attesa; se l'account e' cambiato arriva il 409 e poi la decisione
      void salva();
      return;
    }
    if (!forza && ora() - ultimoControllo < RICONTROLLO_MINIMO) return;
    void controlla();
  }

  function ferma() {
    giro++;
    fermaTimer();
    stacca?.();
    stacca = null;
    utente = null;
    versione = null;
    letto = false;
    inVolo = false;
    poi = null;
    tentativi = 0;
    rifiuti = 0;
    ultimoControllo = -Infinity;
    if (attuale.fase !== "spenta") imposta(SPENTA);
  }

  return {
    avvia(id) {
      if (utente === id) return;
      ferma();
      utente = id;
      stacca = dip.ascoltaLocale(suModificaLocale);
      void controlla();
    },
    ferma,
    stato: () => attuale,
    ascolta(f) {
      ascoltatori.add(f);
      return () => {
        ascoltatori.delete(f);
      };
    },
    usaAccount() {
      if (attuale.fase !== "conflitto") return;
      allinea(attuale.account, true);
    },
    tieniQuesta() {
      if (attuale.fase !== "conflitto") return;
      // si sovrascrive proprio la versione che l'utente ha visto: se nel frattempo e' cambiata, 409 e si richiede
      versione = attuale.account.updatedAt;
      rifiuti = 0;
      imposta({ fase: "salvataggio" });
      void salva({ forza: true });
    },
    riprovaOra() {
      if (!utente || bloccato()) return;
      tentativi = 0;
      if (attuale.fase === "errore") {
        if (timerRiprova) clearTimeout(timerRiprova);
        timerRiprova = null;
        void (letto ? salva() : controlla());
      } else {
        ricontrolla(true);
      }
    },
    ricontrolla: () => ricontrolla(false),
    svuota() {
      if (!timerSalva) return;
      clearTimeout(timerSalva);
      timerSalva = null;
      void salva({ urgente: true });
    },
  };
}
