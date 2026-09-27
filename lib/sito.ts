/**
 * L'indirizzo pubblico del sito, per i link assoluti: anteprime social,
 * sitemap, robots. Viene da NEXT_PUBLIC_SITE_URL, letta AL BUILD (il sito e'
 * un export statico): su Cloudflare va impostata nelle variabili di build.
 * Senza, si usa l'indirizzo di anteprima, che almeno non rompe niente.
 */
export const URL_SITO = (process.env.NEXT_PUBLIC_SITE_URL || "https://fuelchef.it").replace(/\/+$/, "");

/* =========================================================================
   I dati dell'attivita', in un posto solo.

   Nome, indirizzo e contatti (il "NAP" per Google) devono essere IDENTICI
   ovunque: footer, pagine, dati strutturati, llms.txt. Per questo nessun
   componente li scrive a mano: li legge da qui. Se cambia qualcosa, si cambia
   questo file e basta (llms.txt in public/ e' l'unica copia statica: il test
   lib/sito.test.ts controlla che resti allineata).

   Regola: qui dentro solo dati veri. Quello che il committente non ha ancora
   dato (telefono, orari, P. IVA, profili social) resta null o vuoto, e i dati
   strutturati lo omettono invece di inventarlo.
   ========================================================================= */

export const NOME_ATTIVITA = "FUEL LAB";

export const TITOLARE = { nome: "Matteo Pattanè", ruolo: "Cuoco" } as const;

export const EMAIL = "info@fuelchef.it";
export const EMAIL_PRIVACY = "privacy@fuelchef.it";

/** Il numero arrivera' con WhatsApp (vedi lib/whatsapp.ts): finche' e' null non compare da nessuna parte. */
export const TELEFONO: string | null = null;

/** In aggiornamento: quando arrivano, il footer li mostra al posto della dicitura provvisoria. */
export const RAGIONE_SOCIALE: string | null = null;
export const PARTITA_IVA: string | null = null;

/**
 * Profili ufficiali (Google Business Profile, Instagram, Facebook...): URL
 * completi. Finiscono nel `sameAs` dei dati strutturati, che collega il sito
 * alla scheda Google e ai social. Vuoto finche' non esistono.
 */
export const PROFILI_SOCIAL: string[] = [];

export const INDIRIZZO = {
  via: "Via del Santuario 214",
  cap: "65124",
  citta: "Pescara",
  provincia: "PE",
  regione: "Abruzzo",
  nazione: "IT",
} as const;

/** "Via del Santuario 214, 65124 Pescara (PE)": la forma unica dell'indirizzo sul sito. */
export const INDIRIZZO_RIGA = `${INDIRIZZO.via}, ${INDIRIZZO.cap} ${INDIRIZZO.citta} (${INDIRIZZO.provincia})`;

/** Ricerca su Google Maps per l'indirizzo: niente coordinate scritte a mano, le trova Maps. */
export const LINK_MAPPA = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${INDIRIZZO.via}, ${INDIRIZZO.cap} ${INDIRIZZO.citta}`,
)}`;

/**
 * Quando Matteo cucina e consegna: ogni giorno (decisione del committente, che
 * ha superato i due giorni fissi di prima). Le pagine pubbliche lo scrivono con
 * queste parole e non promettono orari: il ritiro in sede si concorda con lui.
 */
export const QUANDO_CUCINA = "Matteo cucina ogni giorno e consegna ogni giorno";

export interface Zona {
  nome: string;
  /** sigla della provincia */
  provincia: "PE" | "CH";
  /** "comune" o localita' (Chieti Scalo e' la parte bassa del comune di Chieti) */
  tipo: "comune" | "localita";
}

/**
 * Dove si puo' chiedere la consegna: Pescara e i comuni vicini. La copertura
 * del singolo indirizzo si conferma sempre con Matteo prima dell'ordine, e il
 * sito lo dice ovunque mostri questo elenco. Se Matteo allarga o stringe la
 * zona, si cambia qui.
 */
export const ZONE_SERVITE: Zona[] = [
  { nome: "Pescara", provincia: "PE", tipo: "comune" },
  { nome: "Montesilvano", provincia: "PE", tipo: "comune" },
  { nome: "Spoltore", provincia: "PE", tipo: "comune" },
  { nome: "Francavilla al Mare", provincia: "CH", tipo: "comune" },
  { nome: "San Giovanni Teatino", provincia: "CH", tipo: "comune" },
  { nome: "Chieti Scalo", provincia: "CH", tipo: "localita" },
];

/** "Pescara, Montesilvano, ... e Chieti Scalo" */
export function elencoZone(zone: Zona[] = ZONE_SERVITE): string {
  const nomi = zone.map((z) => z.nome);
  if (nomi.length < 2) return nomi.join("");
  return `${nomi.slice(0, -1).join(", ")} e ${nomi[nomi.length - 1]}`;
}

/** La descrizione di una riga: la stessa per footer, dati strutturati e anteprime. */
export const DESCRIZIONE_ATTIVITA =
  "Meal prep fresco a Pescara per chi si allena: piatti per il cardio e per i pesi, con i macro su ogni porzione, cucinati ogni giorno da Matteo Pattanè.";
