import type { ChiaveFoto } from "./immagini";

/* =========================================================================
   Come abbinare il pasto all'allenamento: i consigli di Matteo.

   Vengono dal brief del committente ("con un allenamento cardio abbinare un
   pasto piu' ricco di carboidrati; con un allenamento di pesistica abbinare
   proteine e carboidrati in quantita' ridotta per la sintesi proteica") e
   sono la stessa regola che usa lib/autofill.ts per riempire la settimana.
   Un testo solo, letto da home, menu e compositore: se Matteo cambia idea,
   cambia qui.
   ========================================================================= */

export type ChiaveConsiglio = "cardio" | "pesi" | "riposo";

export interface Consiglio {
  id: ChiaveConsiglio;
  nome: string;
  /** la regola in una riga */
  regola: string;
  /** il perche', due frasi al massimo */
  perche: string;
  foto: ChiaveFoto;
}

export const CONSIGLI: Record<ChiaveConsiglio, Consiglio> = {
  cardio: {
    id: "cardio",
    nome: "Cardio",
    regola: "Più carboidrati.",
    perche:
      "Corsa, bici, nuoto, circuiti: il carburante è il glicogeno. Un pasto ricco di carboidrati lo rimette dove serve, così il giorno dopo le gambe ci sono ancora.",
    foto: "corsa",
  },
  pesi: {
    id: "pesi",
    nome: "Pesi",
    regola: "Proteine, e carboidrati misurati.",
    perche:
      "Dopo la pesistica il muscolo si ricostruisce: servono proteine piene e una quota ridotta di carboidrati, quella giusta per assimilarle e favorire la sintesi proteica.",
    foto: "pesi",
  },
  riposo: {
    id: "riposo",
    nome: "Riposo",
    regola: "Più leggero.",
    perche:
      "Il giorno senza allenamento il fabbisogno scende. Piatti più leggeri, con le proteine che restano: il recupero si fa anche a tavola.",
    foto: "verdure",
  },
};
