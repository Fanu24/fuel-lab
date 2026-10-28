import { kcalDa, type Macros } from "./types";

export interface StatoNutrizione {
  stato: "stimata" | "da-confermare";
  nota: string;
  fonti: readonly string[];
}

export const NOTA_NUTRIZIONE = "Valori stimati per una porzione. Riso e pasta pesati cotti.";

type Composizione = Omit<Macros, "kcal">;
type IngredienteCalcolo = {
  nome: string;
  grammi: number;
  per100g: Composizione;
  fonte: string;
};

const crea = (codice: string) => `https://www.alimentinutrizione.it/tabelle-nutrizionali/${codice}`;

/**
 * CREA, Tabelle di composizione degli alimenti (consultate il 14/10/2026).
 * I carboidrati sono quelli disponibili, non includono la fibra.
 * Porzioni singole e riso/pasta cotti confermati dal titolare del progetto.
 * Gli altri pesi sono assunti a crudo, al netto degli scarti; tutti gli oli
 * indicati sono considerati consumati. Non sono misure sul prodotto finito.
 */
export const RICETTE_CALCOLABILI: Readonly<Record<string, readonly IngredienteCalcolo[]>> = {
  "riso-julien-pollo-teriyaki": [
    { nome: "Riso basmati", grammi: 150, per100g: { proteine: 3, carboidrati: 25.2, grassi: 0.6 }, fonte: crea("000135") },
    { nome: "Petto di pollo", grammi: 200, per100g: { proteine: 23.3, carboidrati: 0, grassi: 0.8 }, fonte: crea("106500") },
    { nome: "Carote", grammi: 180, per100g: { proteine: 1.1, carboidrati: 7.6, grassi: 0.2 }, fonte: crea("005150") },
    { nome: "Zucchine", grammi: 180, per100g: { proteine: 1.5, carboidrati: 1.7, grassi: 0.1 }, fonte: crea("005730") },
    { nome: "Olio d'oliva", grammi: 10, per100g: { proteine: 0, carboidrati: 0, grassi: 99.9 }, fonte: crea("009200") },
    { nome: "Olio di sesamo", grammi: 6, per100g: { proteine: 0, carboidrati: 0, grassi: 99.9 }, fonte: crea("009690") },
  ],
  "gnocchetti-sugo-ricotta": [
    { nome: "Gnocchi fatti a mano", grammi: 200, per100g: { proteine: 3.5, carboidrati: 34, grassi: 0.2 }, fonte: crea("006591") },
    { nome: "Pomodorini", grammi: 500, per100g: { proteine: 1.1, carboidrati: 7.2, grassi: 0.4 }, fonte: crea("006650") },
    { nome: "Cipolla", grammi: 50, per100g: { proteine: 1, carboidrati: 5.7, grassi: 0.1 }, fonte: crea("005300") },
    { nome: "Ricotta fresca", grammi: 150, per100g: { proteine: 8.8, carboidrati: 3.5, grassi: 10.9 }, fonte: crea("166820") },
    { nome: "Parmigiano", grammi: 50, per100g: { proteine: 32.4, carboidrati: 0, grassi: 29.7 }, fonte: crea("166000") },
    { nome: "Olio d'oliva", grammi: 15, per100g: { proteine: 0, carboidrati: 0, grassi: 99.9 }, fonte: crea("009200") },
  ],
};

/** Arrotondamento finale in grammi, poi regola energetica condivisa 4/4/9. */
export function calcolaStimaNutrizionale(id: string): Macros | null {
  const ingredienti = Object.hasOwn(RICETTE_CALCOLABILI, id) ? RICETTE_CALCOLABILI[id] : undefined;
  if (!ingredienti) return null;
  const somma = ingredienti.reduce((totale, ingrediente) => ({
    proteine: totale.proteine + ingrediente.grammi * ingrediente.per100g.proteine / 100,
    carboidrati: totale.carboidrati + ingrediente.grammi * ingrediente.per100g.carboidrati / 100,
    grassi: totale.grassi + ingrediente.grammi * ingrediente.per100g.grassi / 100,
  }), { proteine: 0, carboidrati: 0, grassi: 0 });
  const proteine = Math.round(somma.proteine);
  const carboidrati = Math.round(somma.carboidrati);
  const grassi = Math.round(somma.grassi);
  return { proteine, carboidrati, grassi, kcal: kcalDa(proteine, carboidrati, grassi) };
}

const NOTE: Readonly<Record<string, string>> = {
  "riso-julien-pollo-teriyaki": "Stima della ricetta base: 150 g di riso cotto, pollo e verdure pesati a crudo, tutto l'olio indicato. Eventuale salsa teriyaki aggiuntiva esclusa: quantità da confermare.",
  "gnocchetti-sugo-ricotta": "Stima con gnocchi di patate cotti e ricotta vaccina standard. Pomodorini e cipolla pesati a crudo, tutto l'olio indicato; aglio e basilico non quantificati esclusi. La ricetta degli gnocchi può cambiare i valori.",
  "noodles-sesamo-maiale": "Porzione singola con noodles cotti. Valori da confermare: tipo di noodles e composizione della salsa tahina.",
  "maiale-senape-spinaci": "Porzione singola. Valori da confermare: tipo di senape, zucchero e quantità di salsa di soia.",
  "pallotte-cacio-ovo": "Porzione singola. Mancano le quantità di olio e parmigiano per completare il calcolo.",
  "uova-purgatorio-peperoni": "Porzione singola. Manca la quantità di quark per completare il calcolo.",
};

/** L'assenza di una scheda fonte non rende validi i precedenti valori di prova. */
export function nutrizioneDisponibile(id: string): boolean {
  return Object.hasOwn(RICETTE_CALCOLABILI, id);
}

export function statoNutrizione(id: string): StatoNutrizione {
  const disponibile = nutrizioneDisponibile(id);
  return {
    stato: disponibile ? "stimata" : "da-confermare",
    nota: Object.hasOwn(NOTE, id) ? NOTE[id] : "Quantità e valori nutrizionali da confermare con Matteo.",
    fonti: disponibile ? [...new Set(RICETTE_CALCOLABILI[id].map((ingrediente) => ingrediente.fonte))] : [],
  };
}
