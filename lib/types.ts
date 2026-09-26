export type Tag = "carne" | "pesce" | "veg" | "senza-glutine";

export type Giorno = "lunedi" | "giovedi";

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

export type Formula = "singolo" | "abbonamento";

export const TAGS: { id: Tag; label: string }[] = [
  { id: "carne", label: "Carne" },
  { id: "pesce", label: "Pesce" },
  { id: "veg", label: "Veg" },
  { id: "senza-glutine", label: "Senza glutine" },
];
