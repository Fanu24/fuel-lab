import type { Metadata } from "next";
import { NOME_ATTIVITA } from "@/lib/sito";
import type { Piatto } from "@/lib/catalogo";
import { FORMULE, PREZZO_DA_TESTO, getFormula, percorsoFormula, type FormulaId } from "@/lib/abbonamento";

/* =========================================================================
   Titoli, descrizioni e canonical delle pagine pubbliche, in un posto solo.

   Regole (controllate da lib/sito.test.ts):
   - titolo completo, suffisso compreso, entro 60 caratteri, con la parola
     chiave e la citta' dove ha senso;
   - descrizione fra 140 e 155 caratteri;
   - canonical sempre esplicito, senza slash finale (come esporta Next).
   La stessa scheda alimenta metadata, sitemap e briciole: un nome cambiato
   qui cambia ovunque.
   ========================================================================= */

/** Il suffisso dei titoli: il layout usa lo stesso template. */
export const TEMPLATE_TITOLO = `%s · ${NOME_ATTIVITA}`;

/** Data dell'ultima revisione dei contenuti: finisce in sitemap, dati strutturati e nella riga "Pagina aggiornata il". */
export const AGGIORNAMENTO = "2026-10-15";

/** "1 ottobre 2026": una data ISO scritta all'italiana (UTC: e' un giorno, non un istante). */
export function dataLeggibile(iso: string): string {
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

export const IMMAGINE_OG = {
  url: "/opengraph-image.jpg",
  width: 1200,
  height: 630,
  alt: "FUEL LAB · Meal prep a Pescara",
} as const;

export interface ImmagineOg {
  url: string;
  width?: number;
  height?: number;
  alt: string;
}

export interface PaginaSeo {
  percorso: string;
  /** Revisione effettiva della singola pagina, senza ridatare tutto il sito. */
  aggiornamento?: string;
  /** senza suffisso, a meno che `assoluto` */
  titolo: string;
  assoluto?: boolean;
  descrizione: string;
  /** il nome corto: briciole, footer, llms.txt */
  breve: string;
  priorita: number;
  frequenza: "weekly" | "monthly" | "yearly";
  /** foto della pagina (anteprima social e sitemap delle immagini) */
  immagine?: ImmagineOg;
}


export const PAGINE = {
  home: {
    percorso: "/",
    aggiornamento: "2026-10-15",
    titolo: `${NOME_ATTIVITA} · Meal prep fresco a Pescara per chi si allena`,
    assoluto: true,
    descrizione:
      "I tuoi pasti, già pronti. Abbonamenti di meal prep a Pescara da 173 € al mese oppure componi la tua settimana. Cucina Matteo, ritiri o ricevi a casa.",
    breve: "Home",
    priorita: 1,
    frequenza: "weekly",
  },
  mealPrep: {
    percorso: "/meal-prep-pescara",
    titolo: "Meal prep a Pescara: pasti freschi e pronti",
    descrizione:
      "Meal prep a Pescara: piatti freschi, mai surgelati, cucinati ogni giorno da Matteo. Da 8,90 € a pasto; ritiro o consegna, giorno e orario concordati.",
    breve: "Meal prep a Pescara",
    priorita: 0.9,
    frequenza: "monthly",
  },
  consegna: {
    percorso: "/consegna-pasti-pescara",
    titolo: "Consegna pasti a Pescara, Montesilvano e dintorni",
    descrizione:
      "Consegna pasti a Pescara, Montesilvano, Spoltore, Francavilla al Mare, San Giovanni Teatino e Chieti Scalo, con giorno e orario concordati. Ritiro in sede.",
    breve: "Consegna pasti a Pescara",
    priorita: 0.9,
    frequenza: "monthly",
  },
  proteici: {
    percorso: "/pasti-proteici-pescara",
    titolo: "Pasti proteici a Pescara per chi va in palestra",
    descrizione: "Pasti proteici a Pescara cucinati da Matteo. Ingredienti, allergeni e stime nutrizionali delle ricette disponibili. Abbonamenti, ritiro e consegna.",
    breve: "Pasti proteici a Pescara",
    priorita: 0.9,
    frequenza: "monthly",
  },
  domicilio: {
    percorso: "/cuoco-a-domicilio-pescara",
    titolo: "Cuoco a domicilio a Pescara: il meal prep a casa",
    descrizione:
      "Cuoco a domicilio a Pescara: Matteo fa la spesa, cucina e porziona nella tua cucina i pasti della settimana. Home cooking su preventivo, in zona.",
    breve: "Cuoco a domicilio a Pescara",
    priorita: 0.8,
    frequenza: "monthly",
  },
  menu: {
    percorso: "/menu",
    titolo: "Menu meal prep a Pescara: scegli i tuoi piatti",
    descrizione:
      "Scegli i piatti di FUEL LAB e componi la tua settimana. Ingredienti, allergeni e stime nutrizionali nelle schede. Ritiro a Pescara o consegna in zona.",
    breve: "Menu",
    priorita: 0.9,
    frequenza: "weekly",
  },
  abbonamento: {
    percorso: "/abbonamento",
    titolo: `Abbonamenti meal prep a Pescara da ${PREZZO_DA_TESTO} al mese`,
    descrizione: `Cinque abbonamenti meal prep a Pescara da ${PREZZO_DA_TESTO} al mese: Matteo cucina il piano del tuo nutrizionista, con giorno e orario concordati, in Standard o Plus.`,
    breve: "Abbonamenti",
    priorita: 0.9,
    frequenza: "monthly",
  },
  servizi: {
    percorso: "/servizi",
    titolo: "Servizi e prezzi del meal prep a Pescara",
    descrizione:
      `Menu della settimana da 8,90 € a pasto, cinque abbonamenti da ${PREZZO_DA_TESTO} al mese, piano sui macro o Matteo che cucina da te: i servizi di FUEL LAB a Pescara.`,
    breve: "Servizi e prezzi",
    priorita: 0.8,
    frequenza: "monthly",
  },
  comeFunziona: {
    percorso: "/come-funziona",
    titolo: "Come funziona il meal prep FUEL LAB a Pescara",
    descrizione:
      "Scegli come ti alleni, componi la settimana con i piatti e chiedi a Matteo conferma di disponibilità, ritiro in sede o consegna a Pescara e dintorni.",
    breve: "Come funziona",
    priorita: 0.7,
    frequenza: "monthly",
  },
  chiSiamo: {
    percorso: "/chi-siamo",
    aggiornamento: "2026-10-08",
    titolo: "Chi siamo: la cucina di Matteo Patanè a Pescara",
    descrizione:
      "Conosci Matteo Patanè, cuoco diplomato ALMA e fondatore di FUEL LAB. Meal prep e abbonamenti a Pescara, in Via del Santuario 214. Ritiro o consegna.",
    breve: "Chi siamo",
    priorita: 0.6,
    frequenza: "monthly",
  },
  scheda: {
    percorso: "/scheda",
    titolo: "Meal prep sui macro del tuo nutrizionista",
    descrizione:
      "Hai un piano alimentare? Concorda con Matteo ingredienti e quantità del tuo nutrizionista. Abbonamenti FUEL LAB a Pescara, con ritiro o consegna.",
    breve: "Dai tuoi macro",
    priorita: 0.6,
    frequenza: "monthly",
  },
  settimana: {
    percorso: "/settimana",
    titolo: "Componi il menu settimanale per cardio e pesi",
    descrizione:
      "Scegli giorno per giorno se fai cardio, pesi o riposo: la settimana si riempie con i piatti del meal prep FUEL LAB. Poi la sistemi e la mandi a Matteo.",
    breve: "Componi la settimana",
    priorita: 0.6,
    frequenza: "monthly",
  },
  richiesta: {
    percorso: "/richiesta",
    titolo: "Contatti: scrivi a Matteo, meal prep a Pescara",
    descrizione:
      "Scrivi a Matteo di FUEL LAB, meal prep a Pescara: modulo senza account, email o richiesta dall’account. Risposta di solito entro un giorno lavorativo.",
    breve: "Contatti",
    priorita: 0.5,
    frequenza: "yearly",
  },
  privacy: {
    percorso: "/privacy",
    titolo: "Privacy e cookie",
    descrizione:
      "Informativa privacy e cookie di FUEL LAB, meal prep a Pescara: dati trattati dal sito, account, richieste, Analytics solo con consenso e i tuoi diritti.",
    breve: "Privacy e cookie",
    priorita: 0.2,
    frequenza: "yearly",
  },
} satisfies Record<string, PaginaSeo>;

export type ChiavePagina = keyof typeof PAGINE;

/** Il titolo come lo vede Google, suffisso compreso. */
export function titoloCompleto(p: PaginaSeo): string {
  return p.assoluto ? p.titolo : TEMPLATE_TITOLO.replace("%s", p.titolo);
}

/**
 * Metadata completi di una pagina. L'openGraph va scritto per intero: Next
 * fonde i metadata in modo superficiale, e un openGraph parziale nella pagina
 * cancellerebbe immagine, lingua e nome del sito ereditati dal layout.
 */
export function metadatiPagina(p: PaginaSeo, altro: Partial<Metadata> = {}): Metadata {
  const immagine = p.immagine ?? IMMAGINE_OG;
  return {
    title: p.assoluto ? { absolute: p.titolo } : p.titolo,
    description: p.descrizione,
    alternates: { canonical: p.percorso },
    openGraph: {
      type: "website",
      locale: "it_IT",
      siteName: NOME_ATTIVITA,
      url: p.percorso,
      title: titoloCompleto(p),
      description: p.descrizione,
      images: [immagine],
    },
    ...altro,
  };
}

/* ---- le schede dei piatti ---- */

/**
 * La descrizione di un piatto deve stare fra 140 e 155 caratteri, ma i nomi
 * vanno da 30 a 50: si prova dalla frase piu' ricca alla piu' asciutta e si
 * tiene la prima che entra. Niente giorno di cottura: Matteo cucina ogni giorno.
 */
export function descrizionePiatto(p: Piatto): string {
  const testa = `${p.nome}.`;
  const candidate = [
    `${testa} Ingredienti, allergeni e dettagli del piatto, cucinato fresco da Matteo a Pescara. Sceglilo per la tua settimana, con ritiro o consegna.`,
    `${testa} Ingredienti e allergeni del piatto, cucinato fresco da Matteo a Pescara. Sceglilo per la tua settimana.`,
    `${testa} Ingredienti e allergeni del piatto, cucinato fresco da Matteo a Pescara. Sceglilo per la tua settimana, da ritirare in sede.`,
    `${testa} Ingredienti e allergeni. Meal prep fresco a Pescara, cucinato da Matteo. Ritiro in sede o consegna in zona.`,
    `${testa} Ingredienti, allergeni e macro del piatto, cucinato fresco da ${NOME_ATTIVITA} a Pescara.`,
    `${testa} Ingredienti e allergeni del piatto, cucinato fresco da ${NOME_ATTIVITA} a Pescara.`,
    `${testa} Ingredienti e allergeni, cucinato fresco da ${NOME_ATTIVITA} a Pescara.`,
    `${testa} Ingredienti e allergeni. Meal prep ${NOME_ATTIVITA} a Pescara.`,
    `${testa} Meal prep a Pescara.`,
  ];
  return (
    candidate.find((c) => c.length >= 140 && c.length <= 155) ??
    candidate.find((c) => c.length <= 155) ??
    candidate[candidate.length - 1]
  );
}

export function paginaPiatto(p: Piatto): PaginaSeo {
  return {
    percorso: `/menu/${p.id}`,
    titolo: p.nome,
    descrizione: descrizionePiatto(p),
    breve: p.nome,
    priorita: 0.7,
    frequenza: "weekly",
    immagine: { url: p.img, alt: `${p.nome}, foto illustrativa` },
  };
}

/* ---- le schede degli abbonamenti ---- */

/**
 * Anche qui la descrizione deve stare fra 140 e 155 caratteri e i nomi delle
 * formule e le cifre cambiano da una scheda all'altra: si prova la frase piu'
 * ricca e, se sfora, quella piu' asciutta. Il prezzo in evidenza e' quello
 * Standard, il piu' basso della formula; il Plus sta fra parentesi.
 */
function descrizioneFormula(id: FormulaId): string {
  const f = getFormula(id);
  const testa = `Abbonamento ${f.nome} a Pescara: ${f.pastiSettimana} pasti a settimana, ${f.prezzo.standard} € al mese (Plus ${f.prezzo.plus} €).`;
  const candidate = [
    `${testa} Matteo cucina il piano del nutrizionista: giorno e orario concordati.`,
    `${testa} Matteo cucina il piano del tuo nutrizionista.`,
  ];
  return (
    candidate.find((c) => c.length >= 140 && c.length <= 155) ??
    candidate.find((c) => c.length <= 155) ??
    candidate[candidate.length - 1]
  );
}

/** La scheda SEO di /abbonamento/<formula>: `breve` e' il nome della formula, per briciole e llms.txt. */
export function paginaFormula(id: FormulaId): PaginaSeo {
  const f = getFormula(id);
  return {
    percorso: percorsoFormula(id),
    titolo: `Abbonamento ${f.nome} a Pescara da ${f.prezzo.standard} € al mese`,
    descrizione: descrizioneFormula(id),
    breve: f.nome,
    priorita: 0.7,
    frequenza: "monthly",
  };
}

/** Le cinque schede, nell'ordine del volantino: la sitemap e i test le scorrono da qui. */
export const PAGINE_FORMULE: readonly PaginaSeo[] = FORMULE.map((f) => paginaFormula(f.id));
