import { GIORNI, NOMI_GIORNO, PASTI } from "./settimana";
import type { Casella, GiornoSettimana, Piano } from "./settimana";
import { getPiatto, getExtra, etichettaPrezzo } from "./catalogo";
import type { Macros } from "./types";

/* =========================================================================
   Il contatto finale non e' un checkout, e' una conversazione su WhatsApp.

   Il caso normale, non quello limite, e' che NEXT_PUBLIC_WHATSAPP sia vuota:
   il numero del committente non e' ancora arrivato e il resto del sito va
   avanti lo stesso. Per questo ogni funzione qui dentro legge la variabile
   d'ambiente al momento della chiamata (mai catturata in una costante di
   modulo) e degrada a `null` invece di produrre un `href` verso "wa.me/"
   senza numero: un link cosi' porta al nulla, e un cliente che ci clicca
   pensa che il servizio sia rotto. Chi consuma queste funzioni deve rendere
   il bottone disabilitato con una spiegazione, non nasconderlo e non
   lasciarlo cliccabile a vuoto.

   Il messaggio precompilato esiste perche' Matteo deve poter leggere in tre
   secondi su un telefono cosa vuole il cliente, senza dover ricominciare la
   conversazione da "ciao vorrei info". Ogni servizio ha un testo diverso
   apposta: e' l'unico modo per Matteo di sapere da quale pagina arriva il
   contatto senza installare un sistema di analytics.
   ========================================================================= */

/**
 * Toglie spazi, `+`, trattini e parentesi. Non "ripulisce" le lettere: un
 * numero scritto male (con lettere dentro) deve restare invalido, non essere
 * forzato a diventare qualcos'altro. Se dopo la pulizia non resta nulla, o
 * resta qualcosa che non e' fatto solo di cifre, il numero non e' utilizzabile.
 */
function normalizzaNumero(grezzo: string | undefined): string | null {
  if (!grezzo) return null;
  const pulito = grezzo.replace(/[\s+()-]/g, "");
  if (pulito === "" || !/^\d+$/.test(pulito)) return null;
  return pulito;
}

/**
 * Punto unico di lettura di process.env.NEXT_PUBLIC_WHATSAPP. Leggerla qui
 * a ogni chiamata (e non una volta sola al primo import) e' cio' che permette
 * al numero di cambiare fra un ambiente Vercel e l'altro, e ai test di
 * ricaricare il modulo con vi.resetModules() e vedere il nuovo valore.
 */
function numeroPulito(): string | null {
  return normalizzaNumero(process.env.NEXT_PUBLIC_WHATSAPP);
}

/** true solo se c'e' un numero valido: la condizione che decide se un bottone e' cliccabile. */
export function numeroConfigurato(): boolean {
  return numeroPulito() !== null;
}

/**
 * Il link "wa.me" col testo gia' scritto dentro. `null` quando il numero
 * manca o non e' valido: mai un mezzo link, perche' un mezzo link e' peggio
 * di nessun link, sembra un bottone funzionante finche' non ci si clicca sopra.
 */
export function linkWhatsApp(testo: string): string | null {
  const numero = numeroPulito();
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(testo)}`;
}

/**
 * Un testo diverso per ciascuno dei tre servizi: e' cosi' che Matteo capisce
 * da quale pagina arriva il contatto, senza altro tracciamento. `servizioId`
 * e' una stringa e non l'union di lib/servizi.ts di proposito: questo modulo
 * non dipende da quale altro file definisce i servizi, quindi un id ignoto
 * (o non ancora esistente, mentre un altro task lavora su lib/servizi.ts)
 * ottiene comunque un messaggio sensato invece di un errore o una stringa vuota.
 */
const TESTI_SERVIZIO: Record<string, string> = {
  "menu-settimana":
    "Ciao Matteo! Ho visto il Menu della settimana su FUEL LAB e vorrei qualche informazione per iniziare.",
  "sui-tuoi-macro":
    "Ciao Matteo! Vorrei un piano costruito sui miei macro (servizio Sui tuoi macro): mi dici come funziona e come partire?",
  "home-cooking":
    "Ciao Matteo! Mi interessa il servizio Home cooking di FUEL LAB: vorrei un preventivo.",
};

const TESTO_SERVIZIO_GENERICO =
  "Ciao Matteo! Ho visto FUEL LAB e vorrei qualche informazione sui vostri servizi.";

export function messaggioServizio(servizioId: string): string {
  return TESTI_SERVIZIO[servizioId] ?? TESTO_SERVIZIO_GENERICO;
}

function nomePiatto(id: string | undefined): string | undefined {
  return id ? getPiatto(id)?.nome : undefined;
}

function nomeExtra(id: string): string | undefined {
  const e = getExtra(id);
  if (!e) return undefined;
  if (e.prezzoEuro != null) return `${e.nome} (${etichettaPrezzo(e, true)})`;
  return e.nome;
}

/**
 * Piatto ed extra di una casella in un'unica frase leggibile. Il caso
 * "solo extra" e' raro ma valido: una casella non e' vuota se ha almeno
 * un extra dentro, quindi va descritta invece di sparire dal messaggio.
 */
function descrizioneCasella(c: Casella): string {
  const piatto = nomePiatto(c.piatto);
  const extra = c.extra.map(nomeExtra).filter((n): n is string => !!n);
  if (piatto) {
    return extra.length > 0 ? `${piatto} + ${extra.join(", ")}` : piatto;
  }
  return extra.length > 0 ? extra.join(" + ") : "casella vuota";
}

/** Una riga per giorno, solo per i giorni che hanno almeno un pasto scelto. */
function rigaGiorno(g: GiornoSettimana, p: Piano): string | undefined {
  const parti: string[] = [];
  for (const m of PASTI) {
    const c = p[g]?.[m];
    if (c) parti.push(`${m} ${descrizioneCasella(c)}`);
  }
  return parti.length > 0 ? `${NOMI_GIORNO[g]}: ${parti.join(" / ")}` : undefined;
}

/**
 * Il messaggio che Matteo legge quando arriva dalla richiesta legata a una
 * settimana: chi manda, i giorni con il piatto e le aggiunte, e la riga finale
 * dei macro totali. I ritorni a capo sono `\n` veri: e' compito di
 * linkWhatsApp codificarli nell'URL, non di questa funzione.
 */
export function messaggioPiano(p: Piano, macro: Macros, nome?: string): string {
  const righeGiorni = GIORNI.map((g) => rigaGiorno(g, p)).filter((r): r is string => !!r);

  const blocchi: string[] = [
    nome ? `Ciao Matteo, sono ${nome}!` : "Ciao Matteo!",
    "Ecco la mia settimana su FUEL LAB:",
    "",
    righeGiorni.length > 0 ? righeGiorni.join("\n") : "Non ho ancora scelto nessun pasto.",
    "",
    `Totale settimana: ${macro.kcal} kcal, ${macro.proteine} g proteine, ` +
      `${macro.carboidrati} g carboidrati, ${macro.grassi} g grassi.`,
    "",
    "Mi dici come possiamo organizzarci?",
  ];

  return blocchi.join("\n");
}

/* =========================================================================
   componiMessaggio — dove il servizio e la settimana diventano un unico
   messaggio.

   messaggioServizio() e messaggioPiano() qui sopra sono separate e nessuna
   delle due sa dell'altra. Comporle in un testo con un saluto solo, non due
   messaggi incollati, e' il lavoro di componiMessaggio() e delle sue due
   funzioni di supporto qui sotto.
   ========================================================================= */

/** I quattro dati che il form di richiesta raccoglie e che messaggioServizio()
 *  e messaggioPiano() non conoscono: le raccoglie solo chi chiama
 *  componiMessaggio(). Campo vuoto ("") quando non c'e' un valore, mai assente. */
export interface DatiContatto {
  nome: string;
  telefono: string;
  comune: string;
  note: string;
}

/**
 * Toglie il saluto iniziale ("Ciao Matteo!" o "Ciao Matteo, sono X!") da un
 * testo prodotto da messaggioServizio() o messaggioPiano(). Serve perche'
 * componiMessaggio() (piu' sotto) saluta una volta sola: unire i due testi
 * senza questo passaggio produrrebbe due "Ciao Matteo" nello stesso
 * messaggio — due testi appiccicati, non un messaggio unico.
 *
 * Il punto delicato e' fermarsi al primo "!", non a fine riga: in
 * messaggioServizio() il saluto NON sta su una riga propria (e' seguito
 * dal resto della frase sulla stessa riga, es. "Ciao Matteo! Ho visto..."),
 * mentre in messaggioPiano() il saluto e' un blocco a se', seguito da un
 * "\n". Un `[^\n]*` si sarebbe fermato solo a fine riga: nel primo caso
 * avrebbe mangiato l'intero messaggio del servizio, lasciando un blocco
 * vuoto. `[^!]*!` si ferma al primo punto esclamativo in entrambi i casi.
 * Se il testo non comincia con un saluto riconoscibile (l'implementazione
 * di messaggioServizio()/messaggioPiano() e' cambiata sotto i piedi) lo
 * lascia intatto: un saluto ripetuto e' un difetto piccolo, un pezzo di
 * messaggio perso no.
 */
export function senzaSaluto(testo: string): string {
  return testo.replace(/^Ciao Matteo(, sono [^!]*)?!\s*/, "").trim();
}

/**
 * Toglie l'ultima domanda di chiusura da un testo, se il testo finisce con
 * "?". Serve ad applicare la STESSA deduplicazione sia al corpo del
 * servizio sia al corpo della settimana, invece di sapere a memoria che
 * "Mi dici come possiamo organizzarci?" e' la chiusura di messaggioPiano():
 * quel taglio specifico e' esattamente il difetto trovato in revisione —
 * funzionava solo perche' cercava una stringa fissa, e non vedeva che
 * TESTI_SERVIZIO["sui-tuoi-macro"] chiude anche lui con una domanda propria
 * ("...mi dici come funziona e come partire?"), lasciando due punti
 * interrogativi nello stesso messaggio.
 *
 * Cerca un confine STRUTTURALE, non una frase:
 * 1. se il testo ha un'interruzione di paragrafo (una riga vuota, come fra
 *    i blocchi di messaggioPiano) e l'ultimo paragrafo e' - da solo, senza
 *    altre righe dentro - una domanda, toglie quel paragrafo intero;
 * 2. altrimenti (un solo paragrafo, come i testi di messaggioServizio) e la
 *    domanda e' agganciata al resto con un connettivo (": ", come in
 *    "...servizio Sui tuoi macro): mi dici come funziona..."), tiene la
 *    frase fino al connettivo e toglie solo la domanda;
 * 3. se non trova nessuno dei due confini, il testo intero E' la domanda:
 *    non c'e' contesto da salvare, e torna vuoto — un blocco perso e'
 *    meglio di due punti interrogativi nello stesso messaggio.
 */
export function senzaDomandaFinale(testo: string): string {
  const t = testo.trim();
  if (!t.endsWith("?")) return t;

  const paragrafi = t.split(/\n{2,}/);
  const ultimo = paragrafi[paragrafi.length - 1];
  if (paragrafi.length > 1 && !ultimo.includes("\n")) {
    return paragrafi.slice(0, -1).join("\n\n").trim();
  }

  const confine = t.lastIndexOf(": ");
  if (confine !== -1) return t.slice(0, confine).trim();

  return "";
}

/**
 * Il messaggio unico che Matteo legge sul telefono: un saluto solo (col
 * nome, se c'e'), il contesto del servizio da messaggioServizio(), la
 * settimana composta quando il servizio la richiede (da messaggioPiano()),
 * poi comune e telefono — che messaggioServizio() e messaggioPiano() non
 * conoscono, li raccoglie solo il form di chi chiama questa funzione — la
 * nota libera se c'e', e una sola domanda finale. Entrambi i testi che
 * vengono da messaggioServizio() e messaggioPiano() passano da
 * senzaDomandaFinale(): ognuno dei due puo', per conto suo, gia' chiudere
 * con una domanda, e componiMessaggio() ne aggiunge sempre esattamente una.
 *
 * `servizioId` e' una stringa, non l'union ServizioId di lib/servizi.ts: e'
 * lo stesso principio di messaggioServizio() qui sopra, per lo stesso
 * motivo — questo modulo non dipende da quale altro file definisce i
 * servizi, quindi un id ignoto ottiene comunque un messaggio sensato invece
 * di un errore.
 */
export function componiMessaggio(args: {
  servizioId: string;
  richiedePiano: boolean;
  piano: Piano;
  macro: Macros;
  contatto: DatiContatto;
}): string {
  const { servizioId, richiedePiano, piano, macro, contatto } = args;
  const nome = contatto.nome.trim();

  const blocchi: string[] = [nome ? `Ciao Matteo, sono ${nome}!` : "Ciao Matteo!"];

  const corpoServizio = senzaDomandaFinale(senzaSaluto(messaggioServizio(servizioId)));
  if (corpoServizio) blocchi.push(corpoServizio);

  if (richiedePiano) {
    const corpoPiano = senzaDomandaFinale(senzaSaluto(messaggioPiano(piano, macro)));
    if (corpoPiano) blocchi.push(corpoPiano);
  }

  const comune = contatto.comune.trim();
  const telefono = contatto.telefono.trim();
  const contattoTesto = [
    comune ? `Sono di ${comune}.` : "",
    telefono ? `Il mio numero è ${telefono}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
  if (contattoTesto) blocchi.push(contattoTesto);

  const note = contatto.note.trim();
  if (note) blocchi.push(note);

  blocchi.push("Mi dici come possiamo organizzarci?");

  return blocchi.join("\n\n");
}
