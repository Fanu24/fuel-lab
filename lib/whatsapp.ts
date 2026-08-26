import { GIORNI, NOMI_GIORNO, PASTI } from "./settimana";
import type { Casella, GiornoSettimana, Piano } from "./settimana";
import { getElemento, getExtra } from "./catalogo";
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

/** Nome di un elemento del catalogo, o undefined se l'id non c'e' (piu') nel menu. */
function nomeElemento(id: string | undefined): string | undefined {
  return id ? getElemento(id)?.nome : undefined;
}

/**
 * Primo ed extra di una casella in un'unica frase leggibile. Il caso
 * "solo extra" (nessun primo ne' secondo) e' raro ma valido secondo
 * lib/piano.tsx: una casella non e' vuota se ha almeno un extra dentro,
 * quindi va descritta lo stesso invece di sparire dal messaggio.
 */
function descrizioneCasella(c: Casella): string {
  const principali = [nomeElemento(c.primo), nomeElemento(c.secondo)].filter(
    (n): n is string => !!n,
  );
  if (principali.length > 0) return principali.join(" + ");
  const extra = c.extra.map((id) => getExtra(id)?.nome).filter((n): n is string => !!n);
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
 * settimana: chi manda, i giorni con dentro primo e secondo, e la riga finale
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
