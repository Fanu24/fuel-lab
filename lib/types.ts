export type Obiettivo = "massa" | "definizione" | "equilibrio";

export type Tag = "carne" | "pesce" | "veg" | "senza-glutine";

export type Giorno = "lunedi" | "giovedi";

export interface Dish {
  id: string;
  nome: string;
  descrizione: string;
  /** peso della porzione in grammi */
  grammi: number;
  /** sempre coerente con i macro: kcal = P*4 + C*4 + G*9 */
  kcal: number;
  proteine: number;
  carboidrati: number;
  grassi: number;
  obiettivo: Obiettivo[];
  tag: Tag[];
  /** id della foto su images.unsplash.com */
  img: string;
  /** giorno in cui Matteo lo cucina */
  giorno: Giorno;
}

export interface Macros {
  kcal: number;
  proteine: number;
  carboidrati: number;
  grassi: number;
}

/** Obiettivi giornalieri letti dalla scheda del nutrizionista. */
export interface Target extends Macros {
  /** pasti al giorno che FUEL LAB deve coprire */
  pastiAlGiorno: number;
  /** giorni coperti dal box */
  giorni: number;
}

export interface CartLine {
  dishId: string;
  qta: number;
}

export type Formula = "singolo" | "abbonamento";

export const OBIETTIVI: { id: Obiettivo; label: string; descrizione: string }[] = [
  { id: "massa", label: "Massa", descrizione: "Carico glucidico alto, porzioni piene" },
  { id: "definizione", label: "Definizione", descrizione: "Proteine alte, densita calorica bassa" },
  { id: "equilibrio", label: "Equilibrio", descrizione: "Macro bilanciati, mantenimento" },
];

export const TAGS: { id: Tag; label: string }[] = [
  { id: "carne", label: "Carne" },
  { id: "pesce", label: "Pesce" },
  { id: "veg", label: "Veg" },
  { id: "senza-glutine", label: "Senza glutine" },
];
