/* =========================================================================
   Accesso e area cliente: la parte pura.

   Niente React e niente fetch: qui stanno le regole che decidono dove si torna
   dopo l'accesso, come si traducono gli errori di better-auth, quando una
   richiesta e' pronta per partire e a che punto e' un ordine. Tutto si prova in
   lib/account.test.ts senza montare un componente.
   ========================================================================= */

import {
  ApiError,
  daSqlite,
  ETICHETTE_SERVIZIO,
  etichettaStato,
  type Chiusura,
  type EventoOrdine,
  type Modalita,
  type NuovoOrdine,
  type Ordine,
  type Profilo,
  type Servizio,
  type StatoOrdine,
} from "./api";
import {
  CONSEGNA_OGNI_GIORNI,
  calcolaPrezzo,
  eFascia,
  eFormulaId,
  eNucleo,
  etichettaFormula,
  euroInteri,
  fineAbbonamento,
  FORMULA_CONSIGLIATA,
  formulaDi,
  frasePeriodo,
  getFormula,
  NOMI_NUCLEO,
  periodoAbbonamento,
  prossimaConsegna as prossimaConsegnaAbbonamento,
  SCONTI,
  SCONTO_NUCLEO,
  type Fascia,
  type FormulaId,
  type Nucleo,
} from "./abbonamento";
import { getExtra, getPiatto } from "./catalogo";
import { chiusuraDi, erroreDataChiusa } from "./impostazioni";
import {
  GIORNI,
  NOMI_GIORNO,
  PASTI,
  type Allenamenti,
  type GiornoSettimana,
  type Pasto,
  type Piano,
} from "./settimana";

/* ---------- Sezioni dell'area cliente ---------- */

/* Gli id sono un contratto: il compositore e la pagina contatti linkano gia'
   /account?sezione=richiesta. Non rinominarli. */
export const SEZIONI = [
  { id: "panoramica", etichetta: "Panoramica" },
  { id: "settimana", etichetta: "La mia settimana" },
  { id: "richieste", etichetta: "Richieste" },
  { id: "richiesta", etichetta: "Nuova richiesta" },
  { id: "profilo", etichetta: "Profilo" },
  { id: "sicurezza", etichetta: "Sicurezza e privacy" },
] as const;

export type SezioneAccount = (typeof SEZIONI)[number]["id"];

export function sezioneDa(valore: string | null | undefined): SezioneAccount {
  return SEZIONI.some((s) => s.id === valore) ? (valore as SezioneAccount) : "panoramica";
}

/** "/account?sezione=richieste&apri=…": la panoramica non scrive il parametro. */
export function hrefSezione(id: SezioneAccount, extra: Record<string, string> = {}): string {
  const q = new URLSearchParams();
  if (id !== "panoramica") q.set("sezione", id);
  for (const [k, v] of Object.entries(extra)) q.set(k, v);
  const s = q.toString();
  return s ? `/account?${s}` : "/account";
}

/* ---------- Dove si torna dopo l'accesso ---------- */

export const DESTINAZIONE_PREDEFINITA = "/account";

const CARATTERI_DI_CONTROLLO = /[\u0000-\u001f\u007f-\u009f]/;
const SEPARATORE_CODIFICATO = /%2f|%5c/i;
const ORIGINE_FINTA = "https://fuellab.invalid";

/* Pagine da cui non ha senso ripartire dopo l'accesso: rimanderebbero di nuovo
   al modulo, o fuori dalle pagine del sito. */
const VIETATE = ["/accedi", "/reimposta-password", "/api"];

/**
 * Il parametro `next` arriva dalla barra degli indirizzi, quindi chiunque puo'
 * scriverci un sito esterno ("//evil.com", "/\\evil.com", "https://…").
 * Accetta solo un percorso interno, con le stesse regole con cui better-auth
 * accetta i suoi callbackURL relativi, e altrimenti torna all'area cliente.
 */
export function destinazioneSicura(
  valore: string | null | undefined,
  predefinita: string = DESTINAZIONE_PREDEFINITA,
): string {
  if (typeof valore !== "string" || valore.length === 0 || valore.length > 512) return predefinita;
  if (!valore.startsWith("/") || valore.startsWith("//") || valore.includes("\\")) return predefinita;
  if (CARATTERI_DI_CONTROLLO.test(valore)) return predefinita;
  const fine = valore.search(/[?#]/);
  const percorso = fine === -1 ? valore : valore.slice(0, fine);
  if (SEPARATORE_CODIFICATO.test(percorso)) return predefinita;
  let url: URL;
  try {
    url = new URL(valore, ORIGINE_FINTA);
  } catch {
    return predefinita;
  }
  if (url.origin !== ORIGINE_FINTA) return predefinita;
  // I segmenti "." e ".." spariscono nella normalizzazione: "/.//evil.com"
  // diventerebbe "//evil.com", un indirizzo esterno. Si controlla il risultato.
  if (url.pathname.startsWith("//") || url.pathname.includes("\\")) return predefinita;
  if (VIETATE.some((v) => url.pathname === v || url.pathname.startsWith(`${v}/`))) return predefinita;
  return `${url.pathname}${url.search}${url.hash}`;
}

export type ModoAccesso = "accedi" | "crea" | "recupera";

export function modoDa(valore: string | null | undefined): ModoAccesso {
  return valore === "crea" || valore === "recupera" ? valore : "accedi";
}

/** Il link alla pagina di accesso che poi riporta a `destinazione`. */
export function hrefAccedi(destinazione: string = DESTINAZIONE_PREDEFINITA, modo: ModoAccesso = "accedi"): string {
  const q = new URLSearchParams();
  const d = destinazioneSicura(destinazione);
  if (d !== DESTINAZIONE_PREDEFINITA) q.set("next", d);
  if (modo !== "accedi") q.set("modo", modo);
  const s = q.toString();
  return s ? `/accedi?${s}` : "/accedi";
}

/* ---------- Password ed email ---------- */

/* Gli stessi limiti di functions/_lib/auth.ts: se cambiano la', cambiano qui. */
export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;

export type Requisito = { id: "lunghezza" | "massimo" | "coincide"; testo: string; ok: boolean };

/**
 * I requisiti che la pagina mostra mentre si scrive. `conferma` va passata solo
 * dove c'e' il secondo campo: senza, il requisito "coincidono" non compare.
 */
export function requisitiPassword(password: string, conferma?: string): Requisito[] {
  const r: Requisito[] = [
    { id: "lunghezza", testo: `Almeno ${PASSWORD_MIN} caratteri`, ok: password.length >= PASSWORD_MIN },
  ];
  if (password.length > PASSWORD_MAX) {
    r.push({ id: "massimo", testo: `Non più di ${PASSWORD_MAX} caratteri`, ok: false });
  }
  if (conferma !== undefined) {
    r.push({ id: "coincide", testo: "Le due password coincidono", ok: conferma.length > 0 && conferma === password });
  }
  return r;
}

export function passwordAccettabile(password: string, conferma?: string): boolean {
  return requisitiPassword(password, conferma).every((r) => r.ok);
}

/** Controllo di forma, non di esistenza: basta a fermare i refusi evidenti. */
export function emailValida(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/* ---------- Errori di better-auth in italiano ---------- */

export type ContestoAuth =
  | "accesso"
  | "registrazione"
  | "recupero"
  | "reimposta"
  | "verifica"
  | "cambio-password"
  | "elimina"
  | "nome"
  | "social"
  | "esci";

export type TipoErroreAuth =
  | "credenziali"
  | "esiste"
  | "non-verificata"
  | "troppi"
  | "rete"
  | "link"
  | "password"
  | "sessione"
  | "senza-password"
  | "non-attivo"
  | "vietato"
  | "altro";

export type ErroreAuth = { tipo: TipoErroreAuth; messaggio: string };

/** La forma di `result.error` di better-auth (e di un errore di rete, con status 0). */
export type ErroreGrezzo = { code?: string | null; status?: number | null; message?: string | null };

const PREDEFINITI: Record<ContestoAuth, string> = {
  accesso: "Accesso non riuscito. Riprova tra poco.",
  registrazione: "Non riesco a creare l’account. Riprova tra poco.",
  recupero: "Non riesco a inviare l’email. Riprova tra poco.",
  reimposta: "Non riesco a salvare la nuova password. Riprova tra poco.",
  verifica: "Non riesco a inviare il link. Riprova tra poco.",
  "cambio-password": "Non riesco a cambiare la password. Riprova tra poco.",
  elimina: "Non riesco a eliminare l’account. Riprova tra poco.",
  nome: "Non riesco a salvare il nome. Riprova tra poco.",
  social: "L’accesso con Google non è andato a buon fine. Riprova.",
  esci: "Non riesco a chiudere la sessione. Riprova.",
};

const NON_ATTIVO = "Questa funzione non è ancora attiva. Scrivi a info@fuelchef.it e ti aiutiamo.";
const RICHIESTA_NON_VALIDA = "La richiesta non è valida. Ricarica la pagina e riprova.";

/**
 * Traduce un errore di better-auth in un messaggio che dice cosa fare.
 * Si guarda prima il codice (stabile), poi lo stato HTTP; il testo inglese del
 * server non arriva mai all'utente.
 */
export function traduciErroreAuth(errore: ErroreGrezzo | null | undefined, contesto: ContestoAuth): ErroreAuth {
  const codice = (errore?.code ?? "").toUpperCase();
  const status = errore?.status ?? undefined;

  switch (codice) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return {
        tipo: "credenziali",
        messaggio: "Email o password non corrette. Controlla e riprova: se non ricordi la password, puoi reimpostarla.",
      };
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return {
        tipo: "esiste",
        messaggio: "Esiste già un account con questa email. Accedi, oppure reimposta la password se non la ricordi.",
      };
    case "EMAIL_NOT_VERIFIED":
      return contesto === "social"
        ? { tipo: "non-verificata", messaggio: "Google non ha confermato questa email. Accedi con email e password." }
        : {
            tipo: "non-verificata",
            messaggio:
              "Devi ancora confermare la tua email. Ti abbiamo mandato un nuovo link: aprilo e torni qui già dentro. Controlla anche lo spam.",
          };
    case "INVALID_EMAIL":
      return { tipo: "altro", messaggio: "L’indirizzo email non sembra valido. Controlla che sia scritto bene." };
    case "PASSWORD_TOO_SHORT":
      return { tipo: "password", messaggio: `La password deve avere almeno ${PASSWORD_MIN} caratteri.` };
    case "PASSWORD_TOO_LONG":
      return { tipo: "password", messaggio: `La password può avere al massimo ${PASSWORD_MAX} caratteri.` };
    case "INVALID_PASSWORD":
      return {
        tipo: "password",
        messaggio: contesto === "cambio-password" ? "La password attuale non è corretta." : "La password non è corretta.",
      };
    case "INVALID_TOKEN":
    case "TOKEN_EXPIRED":
      return {
        tipo: "link",
        messaggio:
          contesto === "verifica"
            ? "Il link di verifica è scaduto o non è valido. Chiedine uno nuovo."
            : "Il link è scaduto o è già stato usato. Richiedine uno nuovo.",
      };
    case "USER_NOT_FOUND":
      return contesto === "reimposta"
        ? { tipo: "link", messaggio: "Il link non corrisponde più a un account. Richiedine uno nuovo." }
        : { tipo: "altro", messaggio: "Non troviamo questo account." };
    case "CREDENTIAL_ACCOUNT_NOT_FOUND":
      return {
        tipo: "senza-password",
        messaggio: "Il tuo account usa l’accesso con Google e non ha ancora una password.",
      };
    case "SESSION_EXPIRED":
    case "SESSION_NOT_FRESH":
      return { tipo: "sessione", messaggio: "Per sicurezza esci e accedi di nuovo, poi riprova." };
    case "EMAIL_PASSWORD_DISABLED":
    case "EMAIL_PASSWORD_SIGN_UP_DISABLED":
    case "RESET_PASSWORD_DISABLED":
    case "VERIFICATION_EMAIL_NOT_ENABLED":
    case "PROVIDER_NOT_FOUND":
      return { tipo: "non-attivo", messaggio: NON_ATTIVO };
    case "ADMIN_ACCOUNT_PROTECTED":
      return { tipo: "vietato", messaggio: "L’account amministratore è protetto e non si può eliminare dal sito." };
    case "EMAIL_ALREADY_VERIFIED":
      return { tipo: "altro", messaggio: "La tua email è già confermata: non serve un altro link." };
    case "FAILED_TO_CREATE_USER":
      return { tipo: "altro", messaggio: PREDEFINITI.registrazione };
    case "INVALID_ORIGIN":
    case "MISSING_OR_NULL_ORIGIN":
    case "INVALID_CALLBACK_URL":
    case "INVALID_REDIRECT_URL":
    case "INVALID_ERROR_CALLBACK_URL":
    case "INVALID_NEW_USER_CALLBACK_URL":
    case "CROSS_SITE_NAVIGATION_LOGIN_BLOCKED":
      return { tipo: "altro", messaggio: RICHIESTA_NON_VALIDA };
  }

  if (status === 0) return { tipo: "rete", messaggio: "Connessione assente. Controlla la rete e riprova." };
  if (status === 429) {
    return { tipo: "troppi", messaggio: "Troppi tentativi in poco tempo. Aspetta un minuto e riprova." };
  }
  // Dentro l'area cliente un 401 senza codice e' la sessione finita (accesso e registrazione hanno i loro codici).
  if (status === 401 && (contesto === "cambio-password" || contesto === "elimina" || contesto === "nome" || contesto === "esci")) {
    return { tipo: "sessione", messaggio: "La sessione è scaduta. Accedi di nuovo e riprova." };
  }
  if (contesto === "elimina" && status === 404) {
    return {
      tipo: "non-attivo",
      messaggio: "L’eliminazione dal sito non è ancora attiva. Scrivi a info@fuelchef.it e la facciamo noi.",
    };
  }
  if (contesto === "elimina" && status === 403) {
    return { tipo: "vietato", messaggio: "Questo account non si può eliminare da qui." };
  }
  if (status === 413) return { tipo: "altro", messaggio: "I dati sono troppo lunghi per essere inviati: accorcia il testo e riprova." };
  if (status !== undefined && status >= 500) {
    return { tipo: "altro", messaggio: "Servizio non disponibile. Riprova tra poco." };
  }
  return { tipo: "altro", messaggio: PREDEFINITI[contesto] };
}

/**
 * better-auth rimanda a una pagina del sito con `?error=<codice>` quando un
 * link di verifica scade o l'accesso con Google si interrompe. Null se non c'e'
 * nulla da dire.
 */
export function erroreDiRitorno(codice: string | null | undefined): string | null {
  if (!codice) return null;
  switch (codice.toLowerCase()) {
    case "access_denied":
      return "Hai annullato l’accesso con Google. Puoi riprovare o usare email e password.";
    case "invalid_token":
    case "token_expired":
      return "Il link è scaduto o è già stato usato. Accedi per riceverne uno nuovo.";
    case "user_not_found":
      return "Non troviamo l’account collegato a questo link.";
    case "account_not_linked":
    case "unable_to_link_account":
    case "account_already_linked_to_different_user":
    case "email_does_not_match":
      return "Questa email è già registrata con un altro metodo di accesso. Accedi con email e password.";
    case "email_not_found":
      return "Google non ci ha comunicato la tua email: accedi con email e password.";
    case "email_not_verified":
      return "Google non ha confermato questa email: accedi con email e password.";
    case "signup_disabled":
      return "Le nuove registrazioni con Google non sono attive. Crea l’account con email e password.";
    default:
      return "L’accesso non è andato a buon fine. Riprova.";
  }
}

/** La sessione e' finita (cookie scaduto, "esci da tutti i dispositivi" fatto altrove): il server risponde 401. */
export const eSessioneScaduta = (errore: unknown): boolean => errore instanceof ApiError && errore.status === 401;

/**
 * Il messaggio di un errore delle nostre API (gia' in italiano) o un ripiego.
 * Un 401 vale la stessa frase ovunque: ogni rotta lo dice a modo suo ("Accedi
 * per salvare il piano", "Accedi prima di inviare...") e a chi sta compilando
 * un modulo serve sapere una cosa sola, che deve rientrare.
 */
export function messaggioDa(errore: unknown, ripiego = "Qualcosa non ha funzionato. Riprova tra poco."): string {
  if (eSessioneScaduta(errore)) return "La sessione è scaduta. Accedi di nuovo e riprova.";
  if (errore instanceof ApiError && errore.message) return errore.message;
  return ripiego;
}

/* ---------- Nomi ---------- */

/** "Maria Rossi" -> "Maria"; senza nome, la parte prima della chiocciola. */
export function primoNome(nome: string | null | undefined, email?: string | null): string {
  const primo = (nome ?? "").trim().split(/\s+/)[0] ?? "";
  return primo || (email ?? "").split("@")[0] || "";
}

/** Il nome nella barra: corto, perche' lo spazio e' riservato e non si allarga. */
export function nomeBreve(nome: string | null | undefined, email?: string | null, max = 11): string {
  const base = primoNome(nome, email);
  const lettere = Array.from(base);
  return lettere.length > max ? `${lettere.slice(0, max - 1).join("")}…` : base;
}

export function iniziale(nome: string | null | undefined, email?: string | null): string {
  const base = (nome ?? "").trim() || (email ?? "").trim();
  const prima = Array.from(base)[0];
  return prima ? prima.toLocaleUpperCase("it-IT") : "?";
}

/* ---------- Profilo ---------- */

export const cifreTelefono = (telefono: string) => telefono.replace(/\D/g, "");

/** Quanti caratteri puo' avere un numero scritto a mano: "+39 333 123 4567" ne ha 16, con le parentesi 18. */
export const TELEFONO_MAX = 20;

/**
 * Cosa non va in un numero di telefono scritto in un campo, a parole; null se va
 * bene o se e' vuoto (chi lo vuole obbligatorio controlla prima il vuoto). Lo
 * stesso controllo sta nel modulo della richiesta e nel profilo: lo scrivono a
 * mano e finisce a Matteo, che deve poter chiamare. Cifre, spazi e i segni che si
 * usano davvero (+ - . / parentesi); da 9 a 15 cifre, il massimo di un numero
 * internazionale.
 */
export function erroreTelefono(telefono: string): string | null {
  const t = telefono.trim();
  if (!t) return null;
  if (!/^[\d\s+().\/-]+$/.test(t)) return "Nel telefono vanno solo cifre, spazi e il segno +: controlla il numero.";
  if (t.length > TELEFONO_MAX) return `Il numero è troppo lungo: al massimo ${TELEFONO_MAX} caratteri, per esempio +39 333 1234567.`;
  const cifre = cifreTelefono(t).length;
  if (cifre < 9) return "Il numero sembra troppo corto: controlla le cifre.";
  if (cifre > 15) return "Il numero ha troppe cifre: controlla di averlo scritto una volta sola.";
  return null;
}

/** Cosa manca al profilo per inviare una richiesta senza riscriverlo ogni volta. */
export function campiMancanti(profilo: Profilo | null | undefined): ("telefono" | "comune")[] {
  const mancano: ("telefono" | "comune")[] = [];
  if (!profilo || cifreTelefono(profilo.phone).length < 9) mancano.push("telefono");
  if (!profilo || profilo.comune.trim().length < 2) mancano.push("comune");
  return mancano;
}

/* ---------- Date ---------- */

const FUSO = "Europe/Rome";

/** La data di calendario di `momento` nel fuso di Pescara: "2026-09-27". */
export function dataIso(momento: Date, fuso: string = FUSO): string {
  const parti = new Intl.DateTimeFormat("en-GB", {
    timeZone: fuso,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(momento);
  const v = (t: string) => parti.find((p) => p.type === t)?.value ?? "";
  return `${v("year")}-${v("month")}-${v("day")}`;
}

export function spostaGiorni(iso: string, giorni: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + giorni);
  return d.toISOString().slice(0, 10);
}

/**
 * Il giorno preferito si sceglie da domani a novanta giorni, contati sul
 * calendario di Pescara come fa il server (lib/server/ordini.ts): la pagina non
 * propone mai un giorno che poi verrebbe rifiutato.
 */
export function limitiDataRichiesta(adesso: Date): { min: string; max: string } {
  const oggi = dataIso(adesso);
  return { min: spostaGiorni(oggi, 1), max: spostaGiorni(oggi, 90) };
}

export const dataValida = (iso: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(iso) && iso >= "2000-01-01" && iso <= "2100-12-31" && !Number.isNaN(Date.parse(`${iso}T12:00:00Z`)) &&
  new Date(`${iso}T12:00:00Z`).toISOString().slice(0, 10) === iso;

/** "giovedì 2 ottobre" (con l'anno se non e' quello di `riferimento`). */
export function formattaGiorno(iso: string, riferimento?: string): string {
  if (!dataValida(iso)) return iso;
  const conAnno = !!riferimento && riferimento.slice(0, 4) !== iso.slice(0, 4);
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(conAnno ? { year: "numeric" as const } : {}),
    timeZone: "UTC",
  }).format(new Date(`${iso}T12:00:00Z`));
}

/** "27 settembre 2026, 14:03" da un timestamp SQLite (UTC), letto a Pescara. */
export function formattaMomento(ts: string | null | undefined): string {
  if (!ts) return "";
  const d = daSqlite(ts);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: FUSO,
  }).format(d);
}

/** Solo il giorno di un timestamp SQLite: "27 settembre 2026". */
export function formattaGiornoDa(ts: string | null | undefined): string {
  if (!ts) return "";
  const d = daSqlite(ts);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: FUSO }).format(d);
}

/* ---------- Stato di un ordine ---------- */

export const STATI_IN_CORSO: StatoOrdine[] = ["requested", "confirmed", "preparing", "ready"];
export const STATI_CONFERMATI: StatoOrdine[] = ["confirmed", "preparing", "ready"];

export type StatoPasso = "fatto" | "attuale" | "da-fare";
export type Passo = { id: StatoOrdine; etichetta: string; stato: StatoPasso };

/**
 * Le cinque tappe che il cliente vede. Una richiesta annullata non ha tappe:
 * torna null e la pagina lo dice a parole. L'abbonamento ne ha tre: non si
 * prepara un ordine, parte un mese di consegne (preparazione e pronto contano
 * come "in corso").
 */
export function passiOrdine(stato: StatoOrdine, modalita: Modalita = "delivery", servizio?: Servizio): Passo[] | null {
  if (stato === "cancelled") return null;
  if (servizio === "abbonamento") {
    const tappe: { id: StatoOrdine; etichetta: string }[] = [
      { id: "requested", etichetta: "Inviata" },
      { id: "confirmed", etichetta: "In corso" },
      { id: "completed", etichetta: "Concluso" },
    ];
    const indice = stato === "requested" ? 0 : stato === "completed" ? 2 : 1;
    return tappe.map((t, i) => ({
      ...t,
      stato: i < indice || stato === "completed" ? "fatto" : i === indice ? "attuale" : "da-fare",
    }));
  }
  const tappe: { id: StatoOrdine; etichetta: string }[] = [
    { id: "requested", etichetta: "Inviata" },
    { id: "confirmed", etichetta: "Confermata" },
    { id: "preparing", etichetta: "In preparazione" },
    { id: "ready", etichetta: "Pronta" },
    { id: "completed", etichetta: modalita === "pickup" ? "Ritirata" : "Consegnata" },
  ];
  const indice = tappe.findIndex((t) => t.id === stato);
  return tappe.map((t, i) => ({
    ...t,
    stato: i < indice || stato === "completed" ? "fatto" : i === indice ? "attuale" : "da-fare",
  }));
}

/**
 * Il giorno in cui il cliente riceve (o ritira) qualcosa da un ordine: la data
 * di uscita; per un abbonamento in corso, la prossima consegna o ritiro (una
 * ogni 3 giorni dall'inizio, dentro il periodo di un mese), null a consegne
 * finite.
 */
export function prossimaUscitaDi(o: Pick<Ordine, "service" | "fulfillment_date" | "subscription">, oggi: string): string | null {
  if (!o.fulfillment_date) return null;
  if (o.service === "abbonamento") {
    return dataValida(o.fulfillment_date) ? prossimaConsegnaAbbonamento(formulaDi(o), o.fulfillment_date, oggi) : null;
  }
  return o.fulfillment_date;
}

/**
 * La consegna (o il ritiro) che il cliente aspetta: fra gli ordini confermati,
 * quello con la data piu' vicina da oggi in avanti (per un abbonamento, la
 * prossima consegna). Senza date future, il confermato aggiornato per ultimo,
 * perche' e' quello di cui aspetta notizie.
 */
export function prossimaConsegna(ordini: Ordine[], oggi: string): Ordine | null {
  const confermati = ordini.filter((o) => STATI_CONFERMATI.includes(o.status));
  const future = confermati
    .map((o) => ({ o, data: prossimaUscitaDi(o, oggi) }))
    .filter((x): x is { o: Ordine; data: string } => !!x.data && x.data >= oggi)
    .sort((a, b) => a.data.localeCompare(b.data));
  if (future.length) return future[0].o;
  return [...confermati].sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0] ?? null;
}

/** "dal 5 ottobre al 4 novembre": il periodo di un abbonamento con la data d'inizio confermata, altrimenti null. */
export function periodoRichiesta(o: Pick<Ordine, "service" | "fulfillment_date">, riferimento: string): string | null {
  if (o.service !== "abbonamento" || !o.fulfillment_date || !dataValida(o.fulfillment_date)) return null;
  return frasePeriodo(periodoAbbonamento(o.fulfillment_date), riferimento);
}

/** L'ultimo giorno di un abbonamento confermato, o null. */
export const fineRichiesta = (o: Pick<Ordine, "service" | "fulfillment_date">) =>
  o.service === "abbonamento" && o.fulfillment_date && dataValida(o.fulfillment_date) ? fineAbbonamento(o.fulfillment_date) : null;

/**
 * La riga "quando" di una richiesta: il periodo di un abbonamento confermato,
 * il giorno di ritiro o consegna, oppure quello che il cliente ha chiesto (da
 * confermare). Una richiesta annullata non ha un quando: il giorno che Matteo
 * aveva scritto prima di annullarla non e' piu' di nessuno e leggerlo fa credere
 * che il ritiro sia ancora fissato.
 */
export function quandoRichiesta(
  o: Pick<Ordine, "service" | "status" | "fulfillment" | "fulfillment_date" | "requested_date">,
  oggi: string,
): { etichetta: string; valore: string } | null {
  if (o.status === "cancelled") return null;
  const abbonamento = o.service === "abbonamento";
  const ritiro = o.fulfillment === "pickup";
  const periodo = periodoRichiesta(o, oggi);
  if (periodo) return { etichetta: "Periodo", valore: periodo };
  if (o.fulfillment_date) return { etichetta: ritiro ? "Ritiro" : "Consegna", valore: formattaGiorno(o.fulfillment_date, oggi) };
  if (o.requested_date) {
    return { etichetta: abbonamento ? "Inizio desiderato" : "Giorno preferito", valore: `${formattaGiorno(o.requested_date, oggi)}, da confermare` };
  }
  return { etichetta: abbonamento ? "Inizio" : ritiro ? "Ritiro" : "Consegna", valore: "Da concordare" };
}

/* ---------- Come si legge un abbonamento ---------- */

export type SchedaAbbonamento = {
  /** "Completo · Plus" (senza la fascia se l'ordine non la porta). */
  etichetta: string;
  /** "15 pasti a settimana, pranzo e cena". */
  cosaRicevi: string;
  /** "Da solo", "In coppia" o "In famiglia". */
  nucleo: string;
  /** Parte con la settimana di prova. */
  prova: boolean;
};

/**
 * Formula, fascia, nucleo e prova di un abbonamento, gia' a parole; null per
 * gli altri servizi. Un abbonamento senza `subscription` (nato prima delle
 * cinque formule) e' un Pranzo, come lo tratta il server.
 */
export function schedaAbbonamento(o: Pick<Ordine, "service" | "subscription">): SchedaAbbonamento | null {
  if (o.service !== "abbonamento") return null;
  const formula = formulaDi(o);
  return {
    etichetta: etichettaFormula(formula, o.subscription?.tier),
    cosaRicevi: getFormula(formula).cosaRicevi,
    nucleo: NOMI_NUCLEO[o.subscription?.household ?? "singolo"],
    prova: o.subscription?.trial ?? false,
  };
}

/** Il servizio di una richiesta a parole: per l'abbonamento "Abbonamento Completo · Plus". */
export function nomeServizioRichiesta(o: Pick<Ordine, "service" | "subscription">): string {
  const scheda = schedaAbbonamento(o);
  return scheda ? `Abbonamento ${scheda.etichetta}` : ETICHETTE_SERVIZIO[o.service];
}

/** "Consegna o ritiro ogni 3 giorni", detto per la modalita' scelta. */
export function frequenzaConsegne(modalita: Modalita): string {
  return `${modalita === "pickup" ? "Ritiro in laboratorio" : "Consegna a casa"} ogni ${CONSEGNA_OGNI_GIORNI} giorni`;
}

/**
 * Le righe del promemoria calendario per l'inizio di un abbonamento: formula,
 * fascia e periodo, poi la cadenza delle consegne. Niente pasti "dal lunedi' al
 * venerdi'": dipendono dalla formula.
 */
export function descrizioneInizioAbbonamento(
  o: Pick<Ordine, "service" | "subscription" | "fulfillment_date">,
  riferimento: string,
): string[] {
  const scheda = schedaAbbonamento(o);
  if (!scheda) return [];
  const periodo = periodoRichiesta(o, riferimento);
  return [
    `Abbonamento ${scheda.etichetta}${periodo ? `, ${periodo}` : ""}.`,
    `Consegna o ritiro ogni ${CONSEGNA_OGNI_GIORNI} giorni.`,
  ];
}

/** Una riga leggibile per la cronologia di un ordine. */
export function descriviEvento(evento: EventoOrdine, modalita?: "pickup" | "delivery"): { titolo: string; dettaglio: string } {
  const dettaglio = evento.detail?.trim() ?? "";
  switch (evento.type) {
    case "created":
      return { titolo: "Richiesta inviata", dettaglio: "" };
    case "status":
      if (evento.to_status === "cancelled") {
        return { titolo: evento.actor === "customer" ? "Hai annullato la richiesta" : "Richiesta annullata", dettaglio };
      }
      if (evento.to_status === "completed" && modalita === "pickup") return { titolo: "Ritirato", dettaglio };
      return {
        titolo: evento.to_status ? etichettaStato(evento.to_status, "cliente") : "Stato aggiornato",
        dettaglio,
      };
    case "message":
      return { titolo: "Messaggio di Matteo", dettaglio };
    case "price":
      return { titolo: "Totale aggiornato", dettaglio };
    case "payment":
      return { titolo: "Pagamento registrato", dettaglio };
    case "schedule":
      return { titolo: "Date aggiornate", dettaglio };
    case "email":
      return { titolo: "Email inviata", dettaglio: "" };
    default:
      return { titolo: "Aggiornamento", dettaglio };
  }
}

/* ---------- Il piano della settimana ---------- */

export type RigaPasto = { pasto: Pasto; piatto: string | null; extra: string[] };
export type RigaGiorno = { giorno: GiornoSettimana; nome: string; pasti: RigaPasto[] };

/**
 * I giorni con almeno una casella, coi nomi dei piatti gia' risolti dal
 * catalogo. Con `tutti` anche i giorni vuoti, per disegnare la settimana intera.
 */
export function righePiano(piano: Piano, tutti = false): RigaGiorno[] {
  return GIORNI.flatMap((g) => {
    const riga = piano[g];
    if (!tutti && (!riga || !PASTI.some((m) => riga[m]))) return [];
    return [{
      giorno: g,
      nome: NOMI_GIORNO[g],
      pasti: PASTI.map((m) => {
        const c = riga?.[m];
        return {
          pasto: m,
          piatto: c?.piatto ? getPiatto(c.piatto)?.nome ?? null : null,
          extra: (c?.extra ?? []).map((id) => getExtra(id)?.nome).filter((x): x is string => !!x),
        };
      }),
    }];
  });
}

/** Caselle con un piatto che il catalogo conosce: la stessa conta del server. */
export function contaPiatti(piano: Piano): number {
  return GIORNI.reduce(
    (n, g) => n + PASTI.filter((m) => { const id = piano[g]?.[m]?.piatto; return !!id && !!getPiatto(id); }).length,
    0,
  );
}

/**
 * Quanti piatti di un piano salvato (o di un vecchio ordine) non esistono piu'
 * nel menu: ricaricandolo spariscono, e la pagina lo deve dire prima.
 */
export function piattiNonPiuDisponibili(piano: unknown): number {
  if (!piano || typeof piano !== "object") return 0;
  let n = 0;
  for (const g of GIORNI) {
    const riga = (piano as Record<string, unknown>)[g];
    if (!riga || typeof riga !== "object") continue;
    for (const m of PASTI) {
      const c = (riga as Record<string, unknown>)[m];
      const id = c && typeof c === "object" ? (c as { piatto?: unknown }).piatto : undefined;
      if (typeof id === "string" && !getPiatto(id)) n++;
    }
  }
  return n;
}

/* ---------- Nuova richiesta ---------- */

/**
 * I servizi di meal prep hanno bisogno di piatti; l'home cooking no, e
 * nemmeno l'abbonamento: il cliente porta il piano del suo nutrizionista (le
 * note della richiesta sono "la scheda") e Matteo lo cucina sulla formula scelta.
 */
export const SERVIZIO_CON_PIATTI: Record<Servizio, boolean> = {
  "menu-settimana": true,
  abbonamento: false,
  "sui-tuoi-macro": true,
  "home-cooking": false,
};

/** `?servizio=` dell'indirizzo -> il servizio preselezionato; tutto il resto e' il menu della settimana. */
export function servizioDa(valore: string | null | undefined): Servizio {
  return valore === "abbonamento" || valore === "sui-tuoi-macro" || valore === "home-cooking" ? valore : "menu-settimana";
}

/** `?formula=` dell'indirizzo -> la formula preselezionata; un valore che non esiste vale la consigliata. */
export function formulaDa(valore: string | null | undefined): FormulaId {
  return eFormulaId(valore) ? valore : FORMULA_CONSIGLIATA;
}

/** `?fascia=` dell'indirizzo -> la fascia preselezionata; un valore che non esiste vale Standard. */
export function fasciaDa(valore: string | null | undefined): Fascia {
  return eFascia(valore) ? valore : "standard";
}

/** `?modalita=` dell'indirizzo -> come si riceve; qualunque altro valore e' il ritiro, com'e' sempre stato. */
export function modalitaDa(valore: string | null | undefined): Modalita {
  return valore === "delivery" ? "delivery" : "pickup";
}

/** `?nucleo=` dell'indirizzo -> con chi ci si abbona; un valore che non esiste vale "da solo". */
export function nucleoDa(valore: string | null | undefined): Nucleo {
  return eNucleo(valore) ? valore : "singolo";
}

export type DatiRichiesta = {
  servizio: Servizio;
  nome: string;
  telefono: string;
  comune: string;
  indirizzo: string;
  modalita: Modalita;
  data: string;
  note: string;
  /* Solo per l'abbonamento: gli altri servizi li ignorano (e il server pure). */
  formula: FormulaId;
  fascia: Fascia;
  nucleo: Nucleo;
  /** Parte con la settimana di prova: la prima settimana e' di prova, senza impegno. */
  prova: boolean;
};

export type CampoRichiesta = keyof DatiRichiesta | "piano";
export type ErroriRichiesta = Partial<Record<CampoRichiesta, string>>;

/** L'ordine in cui la pagina porta il fuoco sul primo errore. */
export const ORDINE_CAMPI_RICHIESTA: CampoRichiesta[] = [
  "piano", "servizio", "formula", "nome", "telefono", "comune", "modalita", "indirizzo", "data", "note",
];

export const NOTE_MAX = 1500;

/** Le stesse regole di functions/api/orders.ts, con parole che dicono cosa fare. */
export function validaRichiesta(
  d: DatiRichiesta,
  /** `chiusure`: i periodi in cui Matteo non cucina (GET /api/settings), se gia' letti. */
  contesto: { piatti: number; min: string; max: string; chiusure?: readonly Chiusura[] },
): ErroriRichiesta {
  const e: ErroriRichiesta = {};
  if (d.servizio === "abbonamento" && !eFormulaId(d.formula)) e.formula = "Scegli la formula dell’abbonamento.";

  const nome = d.nome.trim();
  if (!nome) e.nome = "Scrivi il nome a cui intestare la richiesta.";
  else if (nome.length > 100) e.nome = "Il nome può avere al massimo 100 caratteri.";

  if (!d.telefono.trim()) e.telefono = "Serve un numero di telefono: Matteo ti ricontatta lì per confermare.";
  else {
    const errore = erroreTelefono(d.telefono);
    if (errore) e.telefono = errore;
  }

  if (d.comune.trim().length < 2) e.comune = "Scrivi il comune: serve per organizzare ritiro o consegna.";
  else if (d.comune.trim().length > 100) e.comune = "Il comune può avere al massimo 100 caratteri.";

  if (d.modalita !== "pickup" && d.modalita !== "delivery") e.modalita = "Scegli ritiro o consegna.";
  if (d.modalita === "delivery" && d.indirizzo.trim().length < 5) {
    e.indirizzo = "Per la consegna serve l’indirizzo completo, con il numero civico.";
  } else if (d.indirizzo.trim().length > 240) {
    e.indirizzo = "L’indirizzo può avere al massimo 240 caratteri.";
  }

  if (d.data) {
    const inizio = d.servizio === "abbonamento";
    if (!dataValida(d.data)) e.data = "Questa data non è valida.";
    else if (d.data < contesto.min) e.data = inizio ? "L’abbonamento può iniziare da domani in poi." : "Scegli un giorno da domani in poi.";
    else if (d.data > contesto.max) e.data = inizio ? "Puoi indicare un inizio entro i prossimi 90 giorni." : "Puoi indicare un giorno entro i prossimi 90 giorni.";
    else {
      const chiusa = chiusuraDi(d.data, contesto.chiusure ?? []);
      if (chiusa) e.data = erroreDataChiusa(chiusa, contesto.min);
    }
  }

  if (d.note.length > NOTE_MAX) e.note = `Le note possono avere al massimo ${NOTE_MAX} caratteri.`;

  if (SERVIZIO_CON_PIATTI[d.servizio] && contesto.piatti === 0) {
    e.piano = "Per questo servizio serve almeno un piatto nella settimana.";
  }
  return e;
}

/**
 * Il corpo di POST /api/orders, con gli spazi gia' tolti. L'abbonamento porta la
 * scelta (`subscription`) e non un piano: il compositore non e' il modo di
 * scegliere i pasti di una formula, e un piano allegato verrebbe potato dal
 * server lasciando credere che quei piatti vengano cucinati.
 */
export function corpoRichiesta(d: DatiRichiesta, piano: Piano, allenamenti: Allenamenti): NuovoOrdine {
  const abbonamento = d.servizio === "abbonamento";
  return {
    name: d.nome.trim(),
    phone: d.telefono.trim(),
    comune: d.comune.trim(),
    address: d.indirizzo.trim(),
    service: d.servizio,
    fulfillment: d.modalita,
    requestedDate: d.data || null,
    notes: d.note.trim(),
    plan: abbonamento ? {} : piano,
    training: allenamenti,
    ...(abbonamento ? { subscription: { plan: d.formula, tier: d.fascia, household: d.nucleo, trial: d.prova } } : {}),
  };
}

/* ---------- Il prezzo stimato di un abbonamento ---------- */

export type StimaAbbonamento = {
  /** Il prezzo di listino al mese, com'e' sulle pagine: "676 €". */
  listino: string;
  /** Il totale stimato al mese, con lo sconto applicato: "608 €". */
  totale: string;
  /** Lo sconto applicato, in percentuale (0 se non ne spetta nessuno). */
  scontoPercento: number;
  /** Come si e' arrivati al totale, a parole: da quale sconto, o quali sconti esistono se non ne spetta nessuno. */
  dettaglio: string;
};

/** Gli sconti a parole, con l'articolo: "per il ritiro in laboratorio", "ti spettano l'abbonamento in coppia...". */
const NOMI_SCONTO_NUCLEO: Record<Nucleo, string> = { singolo: "", coppia: "l’abbonamento in coppia", famiglia: "l’abbonamento in famiglia" };

/**
 * Quanto costa al mese la scelta fatta nel modulo. E' una stima: gli sconti non
 * si sommano (si applica il piu' alto fra quelli che spettano, vedi
 * scontoApplicato) e il prezzo finale lo conferma Matteo.
 */
export function stimaAbbonamento(d: Pick<DatiRichiesta, "formula" | "fascia" | "nucleo" | "modalita">): StimaAbbonamento {
  const ritiro = d.modalita === "pickup";
  const { listinoCentesimi, scontoPercento, totaleCentesimi } = calcolaPrezzo({
    formula: d.formula,
    fascia: d.fascia,
    ritiro,
    nucleo: d.nucleo,
  });
  const listino = euroInteri(listinoCentesimi / 100);
  const spettano = [
    ritiro ? { chi: "il ritiro in laboratorio", percento: SCONTI.ritiro } : null,
    d.nucleo !== "singolo" ? { chi: NOMI_SCONTO_NUCLEO[d.nucleo], percento: SCONTO_NUCLEO[d.nucleo] } : null,
  ].filter((x): x is { chi: string; percento: number } => x !== null);
  const voce = (x: { chi: string; percento: number }) => `${x.chi} (−${x.percento}%)`;
  const dettaglio =
    spettano.length === 0
      ? `Prezzo di listino. Sconti: ritiro in laboratorio −${SCONTI.ritiro}%, in coppia −${SCONTI.coppia}%, in famiglia −${SCONTI.famiglia}%.`
      : spettano.length === 1
        ? `Listino ${listino}, sconto ${scontoPercento}% per ${spettano[0].chi}.`
        : `Listino ${listino}, sconto ${scontoPercento}%: ti spettano ${voce(spettano[0])} e ${voce(spettano[1])}, si applica il più alto.`;
  return { listino, totale: euroInteri(totaleCentesimi / 100), scontoPercento, dettaglio };
}

/* ---------- La richiesta a meta' ---------- */

/** sessionStorage: solo in questa scheda e solo finche' resta aperta. */
export const CHIAVE_BOZZA_RICHIESTA = "fuellab.bozza-richiesta.v1";

/**
 * Una richiesta lunga (la scheda dell'abbonamento e' mezza pagina di testo) non
 * deve sparire se il telefono ricarica la scheda o se la sessione scade a
 * meta'. La bozza e' di un utente e di un indirizzo (`ricerca`: la query con cui
 * si e' aperto il modulo): un altro link "Richiedi" del sito (altra formula,
 * altro servizio) riparte da zero, la stessa pagina ricaricata (o ritrovata dopo
 * l'accesso) no. Chi torna dal solo menu dell'area cliente ("Nuova richiesta",
 * senza scelte nell'indirizzo) ritrova quello che stava scrivendo.
 */
export function serializzaBozza(utente: string, ricerca: string, dati: DatiRichiesta): string {
  return JSON.stringify({ v: 1, utente, ricerca, dati });
}

/**
 * La bozza riletta da sessionStorage, che si puo' riscrivere a mano: o e'
 * intera e valida, o non c'e'. Un giorno che nel frattempo e' passato (prima di
 * `min`) si scarta, il resto si tiene.
 */
export function leggiBozza(raw: string | null | undefined, utente: string, ricerca: string, min: string): DatiRichiesta | null {
  if (!raw) return null;
  let b: unknown;
  try {
    b = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!b || typeof b !== "object") return null;
  const { v, utente: chi, ricerca: dove, dati } = b as Record<string, unknown>;
  if (v !== 1 || chi !== utente || !dati || typeof dati !== "object") return null;
  const senzaScelte = (q: string) => {
    const p = new URLSearchParams(q);
    p.delete("sezione");
    return p.toString() === "";
  };
  if (dove !== ricerca && !senzaScelte(ricerca)) return null;
  const d = dati as Record<string, unknown>;
  const testo = (valore: unknown, max: number) => (typeof valore === "string" ? valore.slice(0, max) : "");
  if (typeof d.servizio !== "string" || !Object.prototype.hasOwnProperty.call(SERVIZIO_CON_PIATTI, d.servizio)) return null;
  if (d.modalita !== "pickup" && d.modalita !== "delivery") return null;
  if (!eFormulaId(d.formula) || !eFascia(d.fascia) || !eNucleo(d.nucleo) || typeof d.prova !== "boolean") return null;
  const data = typeof d.data === "string" && dataValida(d.data) && d.data >= min ? d.data : "";
  return {
    servizio: d.servizio as Servizio,
    nome: testo(d.nome, 100),
    telefono: testo(d.telefono, 40),
    comune: testo(d.comune, 100),
    indirizzo: testo(d.indirizzo, 240),
    modalita: d.modalita,
    data,
    note: testo(d.note, NOTE_MAX),
    formula: d.formula,
    fascia: d.fascia,
    nucleo: d.nucleo,
    prova: d.prova,
  };
}

/* ---------- Da dove cominciare ---------- */

export type PassoAvvio = {
  id: "scelta" | "profilo" | "invio";
  /** Il passo e' fatto. Il terzo non lo e' mai qui: quando la prima richiesta parte, la panoramica cambia. */
  fatto: boolean;
};

/**
 * I tre passi che portano un cliente nuovo alla prima richiesta, a che punto
 * sono: cosa chiedere (la settimana composta, o un abbonamento che si sceglie
 * nel modulo), i recapiti, l'invio. `profiloCompleto` e' null finche' il
 * profilo non e' stato letto: il passo non si dichiara ne' fatto ne' da fare a
 * caso. `piatti` e' la conta della settimana composta in questo browser.
 */
export function passiDiAvvio({ profiloCompleto, piatti }: { profiloCompleto: boolean | null; piatti: number }): PassoAvvio[] {
  return [
    { id: "scelta", fatto: piatti > 0 },
    { id: "profilo", fatto: profiloCompleto === true },
    { id: "invio", fatto: false },
  ];
}

/* ---------- Privacy ---------- */

export const PAROLA_ELIMINA = "ELIMINA";

export const confermaEliminazione = (valore: string) => valore.trim().toUpperCase() === PAROLA_ELIMINA;

export function nomeFileDati(adesso: Date): string {
  return `fuellab-i-miei-dati-${dataIso(adesso)}.json`;
}
