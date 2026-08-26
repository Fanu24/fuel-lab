import { EXTRA, PRIMI, SECONDI } from "./catalogo";
import { CASELLE_TOTALI, GIORNI, PASTI, potaPiano } from "./piano";
import type { Casella, Pasto, Piano } from "./piano";

/* =========================================================================
   Il piano della settimana dentro un link.

   Non c'e' backend: il piano viaggia per intero nella query string, perche' il
   momento che conta e' quello in cui l'utente manda la settimana al proprio
   nutrizionista e aspetta un si' o una correzione. Un link e' l'unico formato
   che attraversa WhatsApp, la mail e il PC dello studio senza che nessuno debba
   installare o registrarsi.

   Gli id del catalogo sono lunghi quasi trenta caratteri: quattordici caselle
   piene li farebbero sfondare il limite pratico dei 2000 caratteri di URL, oltre
   il quale alcuni browser e client di posta troncano senza dire niente. Quindi
   nella stringa finiscono gli INDICI nelle liste del catalogo, a larghezza fissa.

   E qui nasce il rischio vero. Un indice e' stabile solo finche' l'ordine del
   catalogo non cambia, e il menu di questo servizio cambia ogni settimana: un
   link mandato oggi, riaperto dopo un riordino, decodificherebbe in piatti
   DIVERSI, e ne' il paziente ne' il nutrizionista avrebbero modo di sospettarlo.
   Per questo la stringa porta in testa un'impronta del catalogo e decodificaPiano
   rifiuta i link nati da un catalogo diverso invece di interpretarli. Un link che
   smette di funzionare e' un fastidio; un link che funziona e mostra il piano
   sbagliato e' un danno.
   ========================================================================= */

/**
 * Piano vuoto ma valido. Serve un sentinella perche' la stringa vuota deve restare
 * sinonimo di "malformato": un `?p=` troncato per strada non puo' passare per una
 * settimana svuotata di proposito.
 */
const VUOTO = "-";

/** Divide impronta e corpo. Fuori da base36, quindi non puo' collidere col corpo. */
const SEP = "~";

/** Casella senza primo o senza secondo. Fuori da base36 per lo stesso motivo. */
const ASSENTE = "_";

/** Cifre base36 che servono a scrivere `massimo`. */
function cifre36(massimo: number): number {
  let cifre = 1;
  let capienza = 36;
  while (capienza <= massimo) {
    capienza *= 36;
    cifre += 1;
  }
  return cifre;
}

/*
 * Le larghezze si ricavano dal catalogo invece di essere scritte a mano. Oggi i primi
 * sono 27 e una cifra base36 basta, ma il menu cresce: un campo largo un carattere
 * troncherebbe in silenzio il trentaseiesimo piatto in poi, che e' esattamente il tipo
 * di guasto che questo file esiste per impedire. Un catalogo di dimensione diversa
 * cambia anche l'impronta, quindi le due parti non possono andare fuori sincrono.
 */
const LARGH_ELEMENTO = Math.max(cifre36(PRIMI.length - 1), cifre36(SECONDI.length - 1));
/** Gli extra stanno in una maschera di bit: 8 oggi, e l'aritmetica regge fino a 53. */
const LARGH_EXTRA = cifre36(2 ** EXTRA.length - 1);
const LARGH_CASELLA = LARGH_ELEMENTO * 2 + LARGH_EXTRA;
const LUNGH_CORPO = CASELLE_TOTALI * LARGH_CASELLA;

/**
 * FNV-1a a 32 bit. Non deve resistere a nessun attacco: chi manomette a mano il corpo
 * del link ottiene comunque piatti veri, e non c'e' modo di distinguerlo da chi li ha
 * scelti davvero. Deve solo accorgersi che il catalogo non e' piu' quello di ieri, e
 * per quello basta che due liste diverse diano due numeri diversi quasi sempre.
 */
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/*
 * Nell'impronta entrano anche GIORNI e PASTI: il corpo e' posizionale sulle quattordici
 * caselle, quindi un ottavo giorno o un terzo pasto sposterebbero tutti i campi di un
 * posto esattamente come farebbe un riordino del catalogo.
 */
const MATERIA = [
  PRIMI.map((e) => e.id).join(","),
  SECONDI.map((e) => e.id).join(","),
  EXTRA.map((e) => e.id).join(","),
  GIORNI.join(","),
  PASTI.join(","),
].join(";");

/**
 * Conteggio degli elementi piu' hash dei loro id, in base36.
 *
 * Il conteggio da solo non basterebbe — riordinare 27 primi non cambia quanti sono —
 * ma sta davanti perche' rende l'impronta leggibile a occhio: in un log si vede subito
 * che il link viene da un menu con un altro numero di piatti. Esportata perche' e' cio'
 * che permette a chi apre il link di dire "questo piano e' di un altro menu" invece di
 * un generico "link non valido".
 */
export const IMPRONTA_CATALOGO = `${(PRIMI.length + SECONDI.length + EXTRA.length).toString(
  36,
)}-${fnv1a(MATERIA).toString(36)}`;

const INDICE_PRIMO = new Map(PRIMI.map((e, i) => [e.id, i] as const));
const INDICE_SECONDO = new Map(SECONDI.map((e, i) => [e.id, i] as const));
const INDICE_EXTRA = new Map(EXTRA.map((e, i) => [e.id, i] as const));

function campo(n: number, largh: number): string {
  return n.toString(36).padStart(largh, "0");
}

function codificaCasella(c: Casella | undefined): string {
  const primo = c?.primo === undefined ? undefined : INDICE_PRIMO.get(c.primo);
  const secondo = c?.secondo === undefined ? undefined : INDICE_SECONDO.get(c.secondo);

  // Set e non somma diretta: lo stesso extra due volte accenderebbe il bit due volte e
  // la maschera diventerebbe un altro numero, cioe' un altro insieme di extra.
  const accesi = new Set<number>();
  for (const id of c?.extra ?? []) {
    const i = INDICE_EXTRA.get(id);
    if (i !== undefined) accesi.add(i);
  }
  let maschera = 0;
  for (const i of accesi) maschera += 2 ** i;

  const niente = ASSENTE.repeat(LARGH_ELEMENTO);
  return (
    (primo === undefined ? niente : campo(primo, LARGH_ELEMENTO)) +
    (secondo === undefined ? niente : campo(secondo, LARGH_ELEMENTO)) +
    campo(maschera, LARGH_EXTRA)
  );
}

/**
 * Il piano in una stringa da mettere in `?p=`.
 *
 * Si pota PRIMA di codificare, non dopo: cosi' due piani che valgono lo stesso — uno
 * dei due con dentro un id gia' uscito dal menu — producono lo stesso identico link, e
 * rimandare due volte la stessa settimana non genera due indirizzi diversi.
 */
export function codificaPiano(p: Piano): string {
  const pulito = potaPiano(p);
  if (Object.keys(pulito).length === 0) return VUOTO;

  let corpo = "";
  for (const g of GIORNI) {
    for (const m of PASTI) corpo += codificaCasella(pulito[g]?.[m]);
  }
  return `${IMPRONTA_CATALOGO}${SEP}${corpo}`;
}

/** base36 piu' il segno di assente: tutto il resto e' roba che non abbiamo scritto noi. */
const ALFABETO = /^[0-9a-z_]+$/;

function leggiIndice(tok: string, quanti: number): number | undefined {
  if (tok.includes(ASSENTE)) return undefined;
  const n = Number.parseInt(tok, 36);
  // Fuori intervallo si scarta in silenzio: e' il campo a essere vecchio, non il link.
  return Number.isInteger(n) && n >= 0 && n < quanti ? n : undefined;
}

function leggiExtra(tok: string): string[] {
  const maschera = Number.parseInt(tok, 36);
  if (!Number.isInteger(maschera) || maschera < 0) return [];
  const out: string[] = [];
  // Solo i bit che corrispondono a un extra esistente: i piu' alti si ignorano.
  for (let i = 0; i < EXTRA.length; i += 1) {
    if (Math.floor(maschera / 2 ** i) % 2 === 1) out.push(EXTRA[i].id);
  }
  return out;
}

/**
 * Il piano che c'era dentro il link, oppure `null`.
 *
 * Non lancia mai: chi la chiama e' una pagina che legge una query string, cioe' la fonte
 * meno fidata che esista, e un carattere di troppo non puo' far esplodere il render.
 * `null` copre due casi diversi con la stessa conseguenza per l'utente — la stringa non
 * e' nostra, oppure e' nostra ma di un altro catalogo.
 */
export function decodificaPiano(s: string): Piano | null {
  try {
    if (typeof s !== "string") return null;
    // Minuscolo perche' l'alfabeto e' tutto minuscolo e qualche client di posta
    // normalizza il case degli URL: meglio accettarlo che dire null a un link buono.
    const testo = s.trim().toLowerCase();
    if (testo === "") return null;
    if (testo === VUOTO) return {};

    const parti = testo.split(SEP);
    if (parti.length !== 2) return null;

    // Il rifiuto e' il punto di tutto il file: con un catalogo riordinato questi indici
    // puntano a piatti che l'utente non ha mai scelto, e nessuno se ne accorgerebbe.
    if (parti[0] !== IMPRONTA_CATALOGO) return null;

    const corpo = parti[1];
    if (corpo.length !== LUNGH_CORPO || !ALFABETO.test(corpo)) return null;

    const grezzo: Piano = {};
    let cursore = 0;
    for (const g of GIORNI) {
      const riga: Partial<Record<Pasto, Casella>> = {};
      for (const m of PASTI) {
        const blocco = corpo.slice(cursore, cursore + LARGH_CASELLA);
        cursore += LARGH_CASELLA;

        const iPrimo = leggiIndice(blocco.slice(0, LARGH_ELEMENTO), PRIMI.length);
        const iSecondo = leggiIndice(
          blocco.slice(LARGH_ELEMENTO, LARGH_ELEMENTO * 2),
          SECONDI.length,
        );
        const casella: Casella = { extra: leggiExtra(blocco.slice(LARGH_ELEMENTO * 2)) };
        if (iPrimo !== undefined) casella.primo = PRIMI[iPrimo].id;
        if (iSecondo !== undefined) casella.secondo = SECONDI[iSecondo].id;
        riga[m] = casella;
      }
      grezzo[g] = riga;
    }

    // Lo stesso cancello di localStorage: toglie le caselle rimaste vuote, i giorni
    // senza pasti e gli id che nel frattempo sono usciti dal catalogo. La validazione
    // sta in un posto solo, cosi' il link e lo storage non possono divergere.
    return potaPiano(grezzo);
  } catch {
    return null;
  }
}

/**
 * L'indirizzo da incollare nel messaggio al nutrizionista.
 *
 * `encodeURIComponent` e' un no-op sull'alfabeto attuale — base36 piu' `-`, `_` e `~`,
 * tutti caratteri non riservati per RFC 3986 — e resta perche' e' l'alfabeto a dover
 * essere sicuro, non la chiamata a doversi ricordare che lo era.
 */
export function linkPiano(p: Piano, origine: string): string {
  const base = origine.replace(/\/+$/, "");
  return `${base}/settimana?p=${encodeURIComponent(codificaPiano(p))}`;
}
