import type { Metadata } from "next";
import { NOME_ATTIVITA } from "@/lib/sito";
import { PIATTI, type Piatto } from "@/lib/catalogo";
import { PREZZO_ABBONAMENTO_TESTO } from "@/lib/abbonamento";

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

/** Data dell'ultima revisione dei contenuti: finisce in sitemap e dati strutturati. */
export const AGGIORNAMENTO = "2026-09-27";

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

const PROTEINE = PIATTI.map((p) => p.proteine);
const MIN_PROTEINE = Math.min(...PROTEINE);
const MAX_PROTEINE = Math.max(...PROTEINE);

export const PAGINE = {
  home: {
    percorso: "/",
    titolo: `${NOME_ATTIVITA} · Meal prep fresco a Pescara per chi si allena`,
    assoluto: true,
    descrizione:
      "Meal prep fresco a Pescara, mai surgelato: piatti per chi fa cardio o pesi, con i macro su ogni porzione. Matteo cucina e consegna ogni giorno.",
    breve: "Home",
    priorita: 1,
    frequenza: "weekly",
  },
  mealPrep: {
    percorso: "/meal-prep-pescara",
    titolo: "Meal prep a Pescara: pasti freschi e pronti",
    descrizione:
      "Meal prep a Pescara: piatti freschi, mai surgelati, cucinati ogni giorno da Matteo. Ritiro in sede o consegna in zona ogni giorno, da 8,90 € a pasto.",
    breve: "Meal prep a Pescara",
    priorita: 0.9,
    frequenza: "monthly",
  },
  consegna: {
    percorso: "/consegna-pasti-pescara",
    titolo: "Consegna pasti a Pescara, Montesilvano e dintorni",
    descrizione:
      "Consegna pasti ogni giorno a Pescara, Montesilvano, Spoltore, Francavilla al Mare, San Giovanni Teatino e Chieti Scalo. Oppure ritiro in sede.",
    breve: "Consegna pasti a Pescara",
    priorita: 0.9,
    frequenza: "monthly",
  },
  proteici: {
    percorso: "/pasti-proteici-pescara",
    titolo: "Pasti proteici a Pescara per chi va in palestra",
    descrizione: `Pasti proteici a Pescara per chi si allena: ${PIATTI.length} piatti da ${MIN_PROTEINE} a ${MAX_PROTEINE} g di proteine a porzione, con calorie, carboidrati e grassi veri. Per pesi e cardio.`,
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
    titolo: "Menu meal prep a Pescara: 6 piatti con i macro",
    descrizione:
      "I sei piatti del meal prep FUEL LAB a Pescara con ingredienti, allergeni e macro per porzione: calorie, proteine, carboidrati e grassi. Per cardio o pesi.",
    breve: "Menu",
    priorita: 0.9,
    frequenza: "weekly",
  },
  abbonamento: {
    percorso: "/abbonamento",
    titolo: `Abbonamento pranzi a Pescara: ${PREZZO_ABBONAMENTO_TESTO} al mese`,
    descrizione: `Abbonamento meal prep a Pescara: ${PREZZO_ABBONAMENTO_TESTO} al mese, tutti i pranzi dal lunedì al venerdì composti da Matteo sulla tua scheda. Ritiro o consegna in zona.`,
    breve: "Abbonamento",
    priorita: 0.9,
    frequenza: "monthly",
  },
  servizi: {
    percorso: "/servizi",
    titolo: "Servizi e prezzi del meal prep a Pescara",
    descrizione:
      "Menu della settimana sul tuo allenamento, piano sui macro del nutrizionista o Matteo che cucina da te: i servizi di FUEL LAB a Pescara, da 8,90 € a pasto.",
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
    titolo: "Chi siamo: la cucina di Matteo Pattanè a Pescara",
    descrizione:
      "FUEL LAB è il meal prep fresco di Matteo Pattanè, cuoco e fondatore, a Pescara: piatti per chi si allena, macro su ogni porzione, cucinati ogni giorno.",
    breve: "Chi siamo",
    priorita: 0.6,
    frequenza: "monthly",
  },
  scheda: {
    percorso: "/scheda",
    titolo: "Meal prep sui macro del tuo nutrizionista",
    descrizione:
      "Hai una scheda del nutrizionista? Scrivi calorie, proteine, carboidrati e grassi: la settimana si compone sui tuoi numeri con i piatti FUEL LAB a Pescara.",
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
  const testa = `${p.nome}: ${p.kcal} kcal e ${p.proteine} g di proteine a porzione.`;
  const candidate = [
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
