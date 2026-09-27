import { ApiError, ETICHETTE_ARGOMENTO, type ArgomentoMessaggio, type NuovoMessaggio } from "./api";
import { getExtra, getPiatto } from "./catalogo";
import { GIORNI, NOMI_GIORNO, PASTI, type Pasto, type Piano } from "./settimana";

/* =========================================================================
   Il modulo contatti: la parte pura, senza React.

   Le regole qui dentro sono le STESSE di POST /api/contact (vedi lib/api.ts):
   nome obbligatorio, almeno un recapito fra un'email valida e un telefono con
   9 cifre o piu', messaggio fra 10 e 3000 caratteri, argomento nell'elenco.
   Il browser controlla prima per rispondere subito e in italiano, il server
   ricontrolla comunque: qui non c'e' niente che il server non sappia gia'.

   Dove il browser e' piu' severo lo e' di proposito: un'email scritta male
   accanto a un telefono buono passerebbe dal server, ma Matteo risponderebbe
   a un indirizzo che non esiste. Meglio dirlo adesso, quando si corregge in
   un secondo.
   ========================================================================= */

/** Recapiti pubblici di FUEL LAB: un posto solo per pagina, JSON-LD e link. */
export const EMAIL_CONTATTI = "info@fuelchef.it";

export const INDIRIZZO = {
  via: "Via del Santuario 214",
  cap: "65124",
  comune: "Pescara",
  provincia: "PE",
  paese: "IT",
} as const;

export const INDIRIZZO_COMPLETO = `${INDIRIZZO.via}, ${INDIRIZZO.cap} ${INDIRIZZO.comune} (${INDIRIZZO.provincia})`;

/** Google Maps per indirizzo: nessuna chiave, nessuna mappa incorporata, nessun cookie di terzi sulla pagina. */
export function linkMappa(indirizzo: string = INDIRIZZO_COMPLETO): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(indirizzo)}`;
}

/**
 * Lunghezze massime dei campi. Il messaggio e il telefono seguono il server;
 * gli altri tetti sono prudenti (il server tronca, non deve mai trovarsi a
 * troncare un'email a meta').
 */
export const LIMITI = {
  nome: 100,
  email: 200,
  telefono: 40,
  comune: 100,
  telefonoCifre: 9,
  messaggioMin: 10,
  messaggioMax: 3000,
} as const;

/** L'ordine in cui gli argomenti compaiono nel menu a tendina. */
export const ARGOMENTI: readonly ArgomentoMessaggio[] = [
  "info",
  "menu-settimana",
  "sui-tuoi-macro",
  "home-cooking",
  "consegna",
  "altro",
];

export function etichettaArgomento(a: ArgomentoMessaggio): string {
  return ETICHETTE_ARGOMENTO[a];
}

/**
 * `?servizio=` (i link delle pagine dei servizi) o `?argomento=` diventano
 * l'argomento preselezionato. Tutto cio' che non e' nell'elenco torna a
 * "info": la query string la scrive chiunque, non deve rompere il modulo.
 */
export function argomentoDaParam(valore: string | null | undefined): ArgomentoMessaggio {
  return ARGOMENTI.find((a) => a === valore) ?? "info";
}

/* ---------- Validazione ---------- */

const RE_EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/;

export function emailValida(email: string): boolean {
  const e = email.trim();
  return e.length > 0 && e.length <= LIMITI.email && RE_EMAIL.test(e);
}

export function cifreTelefono(telefono: string): number {
  return telefono.replace(/\D/g, "").length;
}

export function telefonoValido(telefono: string): boolean {
  const t = telefono.trim();
  return t.length <= LIMITI.telefono && cifreTelefono(t) >= LIMITI.telefonoCifre;
}

/** Quello che l'utente ha scritto, cosi' come sta nei campi. */
export type DatiModulo = {
  nome: string;
  email: string;
  telefono: string;
  comune: string;
  argomento: string;
  messaggio: string;
};

/** "recapito" e' l'errore di gruppo: ne email ne telefono. */
export type CampoModulo = "nome" | "recapito" | "email" | "telefono" | "comune" | "argomento" | "messaggio";
export type ErroriModulo = Partial<Record<CampoModulo, string>>;

/** L'ordine della pagina: il fuoco va sul primo campo sbagliato, dall'alto. */
export const ORDINE_CAMPI: readonly CampoModulo[] = ["nome", "comune", "recapito", "email", "telefono", "argomento", "messaggio"];

export function primoErrore(errori: ErroriModulo): CampoModulo | null {
  return ORDINE_CAMPI.find((c) => errori[c]) ?? null;
}

/**
 * Il testo che parte davvero: il messaggio, poi (se c'e') la settimana
 * allegata dopo una riga vuota. Sia il contatore sia la validazione misurano
 * questo, perche' e' questo che il server conta.
 */
export function testoFinale(messaggio: string, allegato = ""): string {
  const m = messaggio.trim();
  const a = allegato.trim();
  return a ? `${m}\n\n${a}` : m;
}

/** Quanti caratteri restano al messaggio scritto a mano, tolta la settimana allegata. */
export function spazioPerMessaggio(allegato = ""): number {
  const a = allegato.trim();
  return Math.max(0, a ? LIMITI.messaggioMax - a.length - 2 : LIMITI.messaggioMax);
}

export function validaModulo(d: DatiModulo, allegato = ""): ErroriModulo {
  const e: ErroriModulo = {};

  const nome = d.nome.trim();
  if (!nome) e.nome = "Scrivi il tuo nome: è così che Matteo sa a chi risponde.";
  else if (nome.length > LIMITI.nome) e.nome = `Il nome è troppo lungo: al massimo ${LIMITI.nome} caratteri.`;

  if (d.comune.trim().length > LIMITI.comune) e.comune = `Il comune è troppo lungo: al massimo ${LIMITI.comune} caratteri.`;

  const email = d.email.trim();
  const telefono = d.telefono.trim();
  if (!email && !telefono) {
    e.recapito = "Lascia almeno un recapito: un’email oppure un numero di telefono.";
  } else {
    if (email && !emailValida(email)) e.email = "Questa email non sembra completa: controlla la @ e la parte dopo il punto (es. nome@gmail.com).";
    if (telefono && telefono.length > LIMITI.telefono) e.telefono = "Il numero è troppo lungo: scrivi solo le cifre, con il prefisso se serve.";
    else if (telefono && !telefonoValido(telefono)) e.telefono = `Il numero sembra troppo corto: servono almeno ${LIMITI.telefonoCifre} cifre.`;
  }

  if (!ARGOMENTI.some((a) => a === d.argomento)) e.argomento = "Scegli di cosa vuoi parlare.";

  const messaggio = d.messaggio.trim();
  if (messaggio.length < LIMITI.messaggioMin) {
    e.messaggio = messaggio
      ? `Ancora qualche parola: servono almeno ${LIMITI.messaggioMin} caratteri.`
      : "Scrivi due righe su cosa ti serve: servizio, giorni, domande.";
  } else if (testoFinale(messaggio, allegato).length > LIMITI.messaggioMax) {
    e.messaggio = allegato.trim()
      ? `Messaggio e settimana allegata superano i ${LIMITI.messaggioMax} caratteri: accorcia il testo o togli l’allegato.`
      : `Il messaggio è troppo lungo: al massimo ${LIMITI.messaggioMax} caratteri.`;
  }

  return e;
}

/* ---------- La settimana allegata ---------- */

const NOMI_PASTO: Record<Pasto, string> = { pranzo: "Pranzo", cena: "Cena" };

/**
 * Una riga per casella piena, in ordine di giorno e di pasto:
 * "Lunedì · Pranzo · Pollo e riso + Zucchine". Gli id che il catalogo non
 * conosce piu' (il menu cambia) spariscono invece di finire come codici nel
 * messaggio; una casella di sole aggiunte resta, perche' e' una scelta vera.
 */
export function righeSettimana(piano: Piano): string[] {
  const righe: string[] = [];
  for (const g of GIORNI) {
    for (const m of PASTI) {
      const c = piano[g]?.[m];
      if (!c) continue;
      const piatto = c.piatto ? getPiatto(c.piatto)?.nome : undefined;
      const extra = (c.extra ?? []).map((id) => getExtra(id)?.nome).filter((n): n is string => !!n);
      let descrizione: string;
      if (piatto) descrizione = extra.length ? `${piatto} + ${extra.join(", ")}` : piatto;
      else if (extra.length) descrizione = `solo aggiunte: ${extra.join(", ")}`;
      else continue;
      righe.push(`${NOMI_GIORNO[g]} · ${NOMI_PASTO[m]} · ${descrizione}`);
    }
  }
  return righe;
}

/** Il blocco che finisce in fondo al messaggio. Stringa vuota se non c'e' niente da allegare. */
export function bloccoSettimana(piano: Piano): string {
  const righe = righeSettimana(piano);
  if (!righe.length) return "";
  const quanti = righe.length === 1 ? "1 pasto" : `${righe.length} pasti`;
  return [`— La mia settimana dal compositore (${quanti}) —`, ...righe].join("\n");
}

/* ---------- Invio ---------- */

/** Il corpo di POST /api/contact, con i campi gia' ripuliti. */
export function preparaMessaggio(d: DatiModulo, allegato = "", website = ""): NuovoMessaggio {
  return {
    name: d.nome.trim(),
    email: d.email.trim(),
    phone: d.telefono.trim(),
    comune: d.comune.trim(),
    topic: argomentoDaParam(d.argomento),
    message: testoFinale(d.messaggio, allegato),
    website,
  };
}

export type ErroreInvio = { testo: string; troppi: boolean };

/**
 * Cosa dire quando l'invio non va. Il 429 ha una spiegazione sua (non e'
 * colpa di chi scrive, e aspettare basta); negli altri casi il server manda
 * gia' un messaggio in italiano, che ApiError porta con se'.
 */
export function spiegaErroreInvio(err: unknown): ErroreInvio {
  if (err instanceof ApiError) {
    if (err.status === 429) {
      return {
        testo: "Da questa rete sono partiti molti messaggi in poco tempo, e per proteggerci dallo spam il modulo si ferma un po’. Riprova più tardi oppure manda lo stesso testo via email.",
        troppi: true,
      };
    }
    return { testo: err.message || "Il messaggio non è partito. Riprova tra poco.", troppi: false };
  }
  return { testo: "Il messaggio non è partito. Riprova tra poco.", troppi: false };
}

/**
 * Un mailto verso info@fuelchef.it, con oggetto e testo gia' scritti. Il corpo
 * e' accorciato: alcuni programmi di posta tagliano o rifiutano i link troppo
 * lunghi, e un link che non si apre e' peggio di un testo da completare.
 */
export function linkEmail(oggetto: string, corpo = "", massimo = 1500): string {
  const testo = corpo.length > massimo ? `${corpo.slice(0, massimo).trimEnd()}…` : corpo;
  const parti = [`subject=${encodeURIComponent(oggetto)}`];
  if (testo) parti.push(`body=${encodeURIComponent(testo)}`);
  return `mailto:${EMAIL_CONTATTI}?${parti.join("&")}`;
}

/** Lo stesso messaggio del modulo, pronto per l'email: serve quando il modulo non riesce a partire. */
export function emailDaModulo(d: DatiModulo, allegato = ""): string {
  const argomento = etichettaArgomento(argomentoDaParam(d.argomento));
  const firma = [d.nome.trim(), d.telefono.trim(), d.comune.trim()].filter(Boolean).join(" · ");
  const corpo = [testoFinale(d.messaggio, allegato), firma].filter(Boolean).join("\n\n");
  return linkEmail(`Richiesta dal sito · ${argomento}`, corpo);
}
