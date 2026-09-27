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
    regola: "Carboidrati secondo l'allenamento.",
    perche:
      "Corsa, bici e circuiti possono richiedere organizzazioni diverse dei pasti. Guarda gli ingredienti e scegli secondo durata, orari e indicazioni del professionista che ti segue.",
    foto: "corsa",
  },
  pesi: {
    id: "pesi",
    nome: "Pesi",
    regola: "Proteine, senza formule fisse.",
    perche:
      "Dopo i pesi puoi preferire un pasto con una fonte proteica. La quantità di carboidrati e la porzione complessiva dipendono da te e dal resto della giornata.",
    foto: "pesi",
  },
  riposo: {
    id: "riposo",
    nome: "Riposo",
    regola: "Scegli con flessibilità.",
    perche:
      "Un giorno di riposo non impone automaticamente porzioni più piccole. Scegli in base alle tue abitudini, alle preferenze e a eventuali indicazioni personalizzate.",
    foto: "verdure",
  },
};
