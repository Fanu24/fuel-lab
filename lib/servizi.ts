import { PREZZO_ABBONAMENTO } from "./abbonamento";

/* =========================================================================
   I quattro servizi di FUEL LAB (spec sezione 12, piu' l'abbonamento deciso
   dal committente a settembre 2026).

   Il committente non vuole prezzi in chiaro, almeno per l'inizio: qui non
   c'e' un listino, c'e' una soglia. I due servizi di meal prep a scelta
   (menu della settimana e sui macro) condividono la STESSA soglia di
   ingresso (SOGLIA_PREZZO, 8,90 euro a pasto) perche' la variabile che
   cambia e' cosa arriva nel box, non il prezzo minimo. L'eccezione voluta dal
   committente e' l'abbonamento: un prezzo fisso al mese (lib/abbonamento.ts)
   per tutti i pranzi dal lunedi' al venerdi'. L'home cooking non ha soglia:
   vende il tempo di Matteo dentro la cucina del cliente, non produzione in
   serie, e la sua economia non si lascia scrivere come "a partire da X".
   Per questo il prezzo di questo servizio e' sempre "su preventivo": mai
   un totale, mai un calcolo, mai un numero, da nessuna parte.

   Ogni pagina che mostra questi dati chiude con un invito a scrivere su
   WhatsApp (mai "aggiungi al carrello"), e usa lib/whatsapp.ts passando
   l'id del servizio a messaggioServizio(): e' cosi che Matteo distingue
   da quale servizio arriva un contatto, senza installare analytics.
   ========================================================================= */

export type ServizioId = "menu-settimana" | "abbonamento" | "sui-tuoi-macro" | "home-cooking";

/**
 * Unione discriminata sul campo "tipo": "soglia" per i due servizi di meal
 * prep a scelta (un numero e un'unita, sempre presentati come minimo
 * d'ingresso), "mese" per l'abbonamento (il prezzo intero del mese),
 * "preventivo" per l'home cooking, che non porta nessun numero con se.
 */
export type Prezzo =
  | { tipo: "soglia"; valore: number; unita: string }
  | { tipo: "mese"; valore: number }
  | { tipo: "preventivo" };

export interface Servizio {
  id: ServizioId;
  /** "01" / "02" / "03" / "04": il testo che finisce dentro la classe .num */
  numero: string;
  nome: string;
  descrizione: string;
  prezzo: Prezzo;
  /** Percorso della foto illustrativa ospitata sul sito. */
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
    img: "/foto/photo-1505576399279-565b52d4ac71.webp",
    href: "/settimana",
  },
  {
    id: "abbonamento",
    numero: "02",
    nome: "L’abbonamento ai pranzi",
    descrizione:
      "Tutti i pranzi dal lunedì al venerdì per un mese, composti da Matteo sulla tua scheda: come ti alleni, i tuoi obiettivi o le indicazioni del nutrizionista. Niente settimana da comporre ogni volta.",
    prezzo: { tipo: "mese", valore: PREZZO_ABBONAMENTO },
    img: "/foto/photo-1498837167922-ddd27525d352.webp",
    href: "/abbonamento",
  },
  {
    id: "sui-tuoi-macro",
    numero: "03",
    nome: "Sui macro della tua scheda",
    descrizione:
      "Scrivi i numeri della scheda del tuo nutrizionista: il piano si compone sui tuoi target, scegliendo i piatti più vicini ai tuoi macro. Tu confermi.",
    prezzo: { tipo: "soglia", valore: SOGLIA_PREZZO, unita: "a pasto" },
    img: "/foto/photo-1512058564366-18510be2db19.webp",
    href: "/scheda",
  },
  {
    id: "home-cooking",
    numero: "04",
    nome: "Home cooking",
    descrizione:
      "Matteo viene a casa tua: fa la spesa, cucina e porziona nella tua cucina. Non è produzione in serie, è il suo tempo dedicato solo a te, e per questo ha un'economia sua.",
    prezzo: { tipo: "preventivo" },
    img: "/foto/photo-1556910103-1c02745aae4d.webp",
    // non e' una pagina che spiega il servizio (non esiste ancora): e' un posizionamento
    // deliberato, "conosci Matteo prima di farlo entrare in casa tua". Vedi il commento
    // di LinkServizio in components/servizi/SezioneServizi.tsx per il dettaglio.
    href: "/chi-siamo",
  },
];

/** Lettura per id invece che per indice: l'ordine del componente non deve dipendere dall'ordine dell'array. */
export function getServizio(id: ServizioId): Servizio {
  const s = SERVIZI.find((s) => s.id === id);
  // I quattro id sono un union type chiuso e SERVIZI li copre tutti: se questo
  // scatta, e' un refuso introdotto qui dentro, non un caso limite da gestire a valle.
  if (!s) throw new Error(`servizio mancante nei dati: ${id}`);
  return s;
}
