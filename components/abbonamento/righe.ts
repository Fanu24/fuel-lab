import {
  CONSEGNA_CONCORDATA,
  FORMULE,
  NOMI_PASTO_ABB,
  PASTO_STANDARD_CIRCA,
  RAGGIO_CONSEGNA_KM,
  SCONTI,
  type Formula,
  type Nucleo,
} from "@/lib/abbonamento";

/* Le frasi che le pagine dell'abbonamento ricavano dai dati di
   lib/abbonamento.ts: giorni e pasti di una formula, cosa arriva a ogni
   consegna, gli sconti scritti come sul volantino. Funzioni pure, senza React:
   la scheda singola e la pagina indice le leggono da qui, cosi' i testi non si
   scrivono a mano due volte. */

/** Il segno meno vero (U+2212): nei prezzi e negli sconti "-10%" con il trattino si spezza a fine riga. */
export const MENO = "\u2212";
export const percentuale = (n: number) => `${MENO}${n}%`;

/** "circa 8 € a pasto", con lo spazio che non va a capo (U+00A0): senza, il "€" restava solo in fondo alla riga. */
export const CIRCA_A_PASTO = `circa ${PASTO_STANDARD_CIRCA}\u00a0€ a pasto`;
export const CIRCA_A_PASTO_FRASE = `Circa ${PASTO_STANDARD_CIRCA}\u00a0€ a pasto.`;

const IN_LETTERE: Record<number, string> = { 2: "due", 3: "tre", 4: "quattro", 5: "cinque", 6: "sei", 7: "sette", 20: "venti" };
/** Un numero in lettere, per i testi discorsivi ("tre giorni"); fuori elenco resta la cifra. */
export const inLettere = (n: number) => IN_LETTERE[n] ?? String(n);

const maiuscola = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

function elenco(voci: string[]): string {
  return voci.length > 1 ? `${voci.slice(0, -1).join(", ")} e ${voci[voci.length - 1]}` : (voci[0] ?? "");
}

/** "Pranzo", "Pranzo e cena", "Colazione, pranzo e cena": i pasti che la formula cucina in ogni giorno coperto. */
export function pastiAParole(f: Formula): string {
  return maiuscola(elenco(f.pasti.map((p) => NOMI_PASTO_ABB[p].toLowerCase())));
}

/**
 * I giorni coperti, a parole. Per sei giorni non si dice quale resta libero: il
 * volantino non lo dice e lo si concorda con Matteo (la domenica e' solo
 * l'ipotesi del calendario di cucina, vedi lib/abbonamento.ts).
 */
export function giorniAParole(f: Formula): string {
  const g = f.giorni;
  if (g.length === 7) return "tutti i giorni";
  if (g.length === 6) return "sei giorni su sette, il giorno libero lo concordi con Matteo";
  if (g.length === 5 && [1, 2, 3, 4, 5].every((d) => g.includes(d))) return "dal lunedì al venerdì";
  return `${inLettere(g.length)} giorni su sette`;
}

/** "Dal lunedì al venerdì", "Tutti i giorni": i giorni coperti, come inizio di frase. */
export const giorniCopertiAParole = (f: Formula) => maiuscola(giorniAParole(f));

/** "Pranzo e cena · tutti i giorni": la riga che dice cosa copre una formula. */
export function coperturaAParole(f: Formula): string {
  return `${pastiAParole(f)} · ${giorniAParole(f)}`;
}

/** Cosa dice la scheda della consegna: giorno e orario si concordano; nei giorni che la formula non copre non c'e' niente da portare. */
export function esempioConsegna(f: Formula): string {
  return f.giorni.length < 7 ? `${CONSEGNA_CONCORDATA} Nei giorni che la formula non copre non c'è nessun pasto da portare.` : CONSEGNA_CONCORDATA;
}

/** La consegna in breve, come sul volantino: "Con giorno e orario concordati, a casa o al ritiro". */
export const CONSEGNA_A_PAROLE = "Con giorno e orario concordati, a casa o al ritiro";

/** "Pescara e dintorni, fino a 20 km". */
export const ZONA_A_PAROLE = `Pescara e dintorni, fino a ${RAGGIO_CONSEGNA_KM} km`;

/** Gli sconti scritti come sul volantino, nell'ordine in cui li legge chi si abbona. */
export const ELENCO_SCONTI = [
  { chiave: "ritiro", nome: "Ritiro in laboratorio", valore: SCONTI.ritiro },
  { chiave: "coppia", nome: "In coppia", valore: SCONTI.coppia },
  { chiave: "famiglia", nome: "In famiglia", valore: SCONTI.famiglia },
].filter((s) => s.valore > 0);

/** Il minimo e il massimo dei pasti a settimana fra le formule: "da 5 a 21". */
export const PASTI_SETTIMANA_MIN = Math.min(...FORMULE.map((f) => f.pastiSettimana));
export const PASTI_SETTIMANA_MAX = Math.max(...FORMULE.map((f) => f.pastiSettimana));

/** La stima di prezzo: la riga che dice quale sconto e' stato applicato e perche'. */
export function motivoSconto(scontoPercento: number, ritiro: boolean, nucleo: Nucleo): string {
  if (scontoPercento === 0) return "Nessuno sconto";
  // A parita' vale il ritiro: e' lo sconto che dipende solo dalla scelta di oggi.
  if (ritiro && scontoPercento === SCONTI.ritiro) return `Sconto ${percentuale(scontoPercento)}, ritiro in laboratorio`;
  return `Sconto ${percentuale(scontoPercento)}, ${nucleo === "coppia" ? "in coppia" : "in famiglia"}`;
}
