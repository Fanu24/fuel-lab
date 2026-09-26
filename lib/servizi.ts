/* =========================================================================
   I tre servizi di FUEL LAB (spec sezione 12).

   Il committente non vuole prezzi in chiaro, almeno per l'inizio: qui non
   c'e' un listino, c'e' una soglia. I primi due servizi sono meal prep,
   condividono la STESSA soglia di ingresso (SOGLIA_PREZZO, 8,90 euro a
   pasto) perche' la variabile che cambia e' cosa arriva nel box, non il
   prezzo minimo. Il terzo servizio, l'home cooking, non ha soglia: vende
   il tempo di Matteo dentro la cucina del cliente, non produzione in
   serie, e la sua economia non si lascia scrivere come "a partire da X".
   Per questo il prezzo di questo servizio e' sempre "su preventivo": mai
   un totale, mai un calcolo, mai un numero, da nessuna parte.

   Ogni pagina che mostra questi dati chiude con un invito a scrivere su
   WhatsApp (mai "aggiungi al carrello"), e usa lib/whatsapp.ts passando
   l'id del servizio a messaggioServizio(): e' cosi che Matteo distingue
   da quale servizio arriva un contatto, senza installare analytics.
   ========================================================================= */

export type ServizioId = "menu-settimana" | "sui-tuoi-macro" | "home-cooking";

/**
 * Unione discriminata sul campo "tipo": "soglia" per i due servizi di meal
 * prep (un numero e un'unita, sempre presentati come minimo d'ingresso),
 * "preventivo" per l'home cooking, che non porta nessun numero con se.
 */
export type Prezzo =
  | { tipo: "soglia"; valore: number; unita: string }
  | { tipo: "preventivo" };

export interface Servizio {
  id: ServizioId;
  /** "01" / "02" / "03": il testo che finisce dentro la classe .num */
  numero: string;
  nome: string;
  descrizione: string;
  prezzo: Prezzo;
  /** id Unsplash: lo ridimensiona il loader di next/image (lib/immagini/loader.ts) */
  img: string;
  /** pagina del sito dove approfondire il servizio, mai un ancora vuota */
  href: string;
}

/** Soglia unica dei due servizi di meal prep, in euro a pasto. Un solo posto da cui dipende tutto il sito. */
export const SOGLIA_PREZZO = 8.9;

export const SERVIZI: Servizio[] = [
  {
    id: "menu-settimana",
    numero: "01",
    nome: "Il menu della settimana",
    descrizione:
      "Dici come ti alleni giorno per giorno e la settimana si compone con i sei piatti del menu. La ritocchi trascinando i piatti, aggiungi quello che vuoi alla box.",
    prezzo: { tipo: "soglia", valore: SOGLIA_PREZZO, unita: "a pasto" },
    img: "photo-1505576399279-565b52d4ac71",
    href: "/settimana",
  },
  {
    id: "sui-tuoi-macro",
    numero: "02",
    nome: "Sui macro della tua scheda",
    descrizione:
      "Scrivi i numeri della scheda del tuo nutrizionista: il piano si compone sui tuoi target, scegliendo i piatti più vicini ai tuoi macro. Tu confermi.",
    prezzo: { tipo: "soglia", valore: SOGLIA_PREZZO, unita: "a pasto" },
    img: "photo-1512058564366-18510be2db19",
    href: "/scheda",
  },
  {
    id: "home-cooking",
    numero: "03",
    nome: "Home cooking",
    descrizione:
      "Matteo viene a casa tua: fa la spesa, cucina e porziona nella tua cucina. Non è produzione in serie, è il suo tempo dedicato solo a te, e per questo ha un'economia sua.",
    prezzo: { tipo: "preventivo" },
    img: "photo-1556910103-1c02745aae4d",
    // non e' una pagina che spiega il servizio (non esiste ancora): e' un posizionamento
    // deliberato, "conosci Matteo prima di farlo entrare in casa tua". Vedi il commento
    // di LinkServizio in components/servizi/SezioneServizi.tsx per il dettaglio.
    href: "/chi-e-matteo",
  },
];

/** Lettura per id invece che per indice: l'ordine del componente non deve dipendere dall'ordine dell'array. */
export function getServizio(id: ServizioId): Servizio {
  const s = SERVIZI.find((s) => s.id === id);
  // I tre id sono un union type chiuso e SERVIZI li copre tutti e tre: se questo
  // scatta, e' un refuso introdotto qui dentro, non un caso limite da gestire a valle.
  if (!s) throw new Error(`servizio mancante nei dati: ${id}`);
  return s;
}
