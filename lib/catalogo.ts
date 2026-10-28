import { kcalDa, type Macros, type Tag } from "./types";
import { EXTRA } from "./catalogo-extra";
import { calcolaStimaNutrizionale } from "./nutrizione";
import { PIATTI_OTTOBRE } from "./catalogo-ottobre";

/*
 * kcalDa vive in ./types e EXTRA in ./catalogo-extra per non creare un ciclo di
 * import: catalogo-extra ha bisogno di kcalDa a tempo di caricamento, e se lo
 * prendesse da qui chi importa per primo catalogo-extra troverebbe EXTRA ancora
 * in zona morta. Li ri-esportiamo perche' il resto del sito importa da "./catalogo".
 */
export { kcalDa } from "./types";
export { EXTRA };

/**
 * Il catalogo del cliente: piatti gia' composti, piu' gli alimenti della box.
 *
 * Non e' piu' un menu da assemblare a primi e secondi. Ogni schiscetta e' un
 * piatto chiuso, con gli ingredienti, i macro e il motivo dell'abbinamento.
 * Le aggiunte (carboidrati, proteine, condimenti, verdure, snack) si attaccano
 * al piatto, non al contrario: senza piatto non c'e' box da personalizzare.
 *
 * Regola sui numeri: kcal e' SEMPRE uguale a P*4 + C*4 + G*9. La coerenza
 * aritmetica non valida una ricetta: lib/nutrizione decide quali stime possono
 * essere mostrate. Gli altri numeri sono precedenti dati di prova conservati
 * per compatibilita', non valori nutrizionali pubblicabili. Il peso finito
 * non e' stato misurato: grammi non va presentato come peso della porzione.
 * Gli allergeni
 * sono un campo obbligatorio (Reg. UE 1169/2011): array vuoto quando non ce
 * ne sono, mai assente.
 */

export type Allenamento = "cardio" | "pesi" | "entrambi";

export type RepartoExtra =
  | "carboidrati"
  | "condimenti-proteine"
  | "proteine"
  | "condimenti-carboidrati"
  | "verdure"
  | "snack";

export type PrezzoNota = "incluso" | "su-richiesta" | "da-a";

export interface Ingrediente {
  nome: string;
  grammi?: number;
  nota?: string;
}

export interface Piatto extends Macros {
  novita?: boolean;
  notaRicetta?: string;
  allergeniDaConfermare?: boolean;
  id: string;
  nome: string;
  descrizione: string;
  grammi: number;
  tag: Tag[];
  allergeni: string[];
  img: string;
  ingredienti: Ingrediente[];
  motivo: string;
  allenamento: Allenamento;
}

export interface Extra extends Macros {
  novita?: boolean;
  ingredienti?: Ingrediente[];
  notaRicetta?: string;
  id: string;
  nome: string;
  descrizione: string;
  grammi: number;
  allergeni: string[];
  img: string;
  reparto: RepartoExtra;
  /** supplemento sulla box; null quando il PDF non mette un numero */
  prezzoEuro: number | null;
  prezzoNota: PrezzoNota | null;
  prezzoDa?: number;
  prezzoA?: number;
}

export const ALLENAMENTI: { id: Allenamento; label: string }[] = [
  { id: "cardio", label: "Cardio" },
  { id: "pesi", label: "Pesistica" },
  { id: "entrambi", label: "Cardio e pesi" },
];

export const REPARTI: { id: RepartoExtra; label: string }[] = [
  { id: "carboidrati", label: "Carboidrati" },
  { id: "condimenti-proteine", label: "Condimenti proteine" },
  { id: "proteine", label: "Proteine" },
  { id: "condimenti-carboidrati", label: "Condimenti carboidrati" },
  { id: "verdure", label: "Verdure di stagione" },
  { id: "snack", label: "Snack" },
];

export function etichettaAllenamento(a: Allenamento): string {
  if (a === "cardio") return "Cardio";
  if (a === "pesi") return "Pesistica";
  return "Cardio e pesi";
}

/** Testo prezzo per schede e WhatsApp. Non inventa cifre: dove manca, lo dice. */
export function etichettaPrezzo(e: Extra, conSegno = false): string {
  if (e.prezzoEuro != null) {
    const n = e.prezzoEuro.toFixed(2).replace(".", ",");
    return conSegno ? `+${n} €` : `${n} €`;
  }
  if (e.prezzoNota === "incluso") return "Incluso";
  if (e.prezzoNota === "da-a" && e.prezzoDa != null && e.prezzoA != null) {
    return `Da ${e.prezzoDa} a ${e.prezzoA} €`;
  }
  return "Su richiesta";
}

export const PIATTI: Piatto[] = [
  {
    id: "noodles-sesamo-maiale",
    nome: "Noodles sesamo e maiale in agrodolce",
    descrizione: "Noodles, fesa di maiale e verdure in salsa tahina, miele e miso.",
    grammi: 570,
    proteine: 58,
    carboidrati: 116,
    grassi: 53,
    kcal: kcalDa(58, 116, 53),
    tag: ["carne"],
    allergeni: ["glutine", "sesamo", "soia"],
    img: "/foto/fuel-20261015-v2-noodles-sesamo-maiale.webp",
    allenamento: "cardio",
    ingredienti: [
      { nome: "Noodles", grammi: 100, nota: "peso cotto" },
      { nome: "Fesa di maiale", grammi: 150 },
      { nome: "Cipolla", grammi: 70 },
      { nome: "Carota", grammi: 70 },
      { nome: "Peperone", grammi: 70 },
      { nome: "Aglio", nota: "1 spicchio" },
      { nome: "Zenzero", grammi: 10 },
      { nome: "Paprika", nota: "q.b." },
      { nome: "Coriandolo", nota: "q.b." },
      { nome: "Pepe bianco", nota: "q.b." },
      { nome: "Prezzemolo", nota: "q.b." },
      { nome: "Aceto di mele", nota: "q.b." },
      { nome: "Salsa tahina", grammi: 50 },
      { nome: "Miele millefiori", grammi: 15 },
      { nome: "Miso", grammi: 15 },
      { nome: "Olio d'oliva", grammi: 15 },
    ],
    motivo:
      "Noodles, carne e condimenti creano un piatto dal sapore deciso. Consulta ingredienti, allergeni e valori pubblicati per capire se si adatta alle tue preferenze e alla tua giornata.",
  },
  {
    id: "gnocchetti-sugo-ricotta",
    nome: "Gnocchetti al sugo con ricotta fresca",
    descrizione: "Gnocchi fatti a mano, sugo di pomodorini e crema di ricotta e parmigiano.",
    grammi: 970,
    ...calcolaStimaNutrizionale("gnocchetti-sugo-ricotta")!,
    tag: ["veg"],
    allergeni: ["glutine", "latte", "uova"],
    img: "/foto/fuel-20261015-v2-gnocchetti-sugo-ricotta.webp",
    allenamento: "cardio",
    ingredienti: [
      { nome: "Gnocchi fatti a mano", grammi: 200, nota: "peso cotto" },
      { nome: "Pomodorini", grammi: 500 },
      { nome: "Cipolla", grammi: 50 },
      { nome: "Aglio", nota: "1 spicchio" },
      { nome: "Basilico fresco", nota: "q.b." },
      { nome: "Ricotta fresca", grammi: 150 },
      { nome: "Parmigiano", grammi: 50 },
      { nome: "Olio d'oliva", grammi: 15 },
    ],
    motivo:
      "Gli gnocchetti con sugo e ricotta abbinano consistenza morbida e sapore fresco. Controlla la scheda per ingredienti, allergeni, porzione e valori del piatto prima di inserirlo nella settimana.",
  },
  {
    id: "riso-julien-pollo-teriyaki",
    nome: "Riso carote e zucchine julien, pollo teriyaki",
    descrizione: "Basmati, petto di pollo e verdure a julienne con olio di sesamo.",
    grammi: 730,
    ...calcolaStimaNutrizionale("riso-julien-pollo-teriyaki")!,
    tag: ["carne"],
    allergeni: ["sesamo", "soia"],
    img: "/foto/fuel-20261015-v2-riso-julien-pollo-teriyaki.webp",
    allenamento: "entrambi",
    ingredienti: [
      { nome: "Riso basmati", grammi: 150, nota: "peso cotto" },
      { nome: "Petto di pollo", grammi: 200 },
      { nome: "Carote", grammi: 180 },
      { nome: "Zucchine", grammi: 180 },
      { nome: "Olio d'oliva", grammi: 10 },
      { nome: "Olio di sesamo", grammi: 6 },
    ],
    motivo:
      "Riso, pollo e verdure julien compongono un piatto pratico da inserire nei giorni più pieni. I valori pubblicati descrivono la ricetta; per quantità individuali segui le indicazioni del tuo professionista.",
  },
  {
    id: "maiale-senape-spinaci",
    nome: "Maiale alla senape, spinaci e patate novelle",
    descrizione: "Fesa di maiale, crema di senape, spinaci e patate novelle.",
    grammi: 960,
    proteine: 71,
    carboidrati: 70,
    grassi: 37,
    kcal: kcalDa(71, 70, 37),
    tag: ["carne"],
    allergeni: ["senape", "soia"],
    img: "/foto/fuel-20261015-v2-maiale-senape-spinaci.webp",
    allenamento: "pesi",
    ingredienti: [
      { nome: "Fesa di maiale", grammi: 250 },
      { nome: "Spinaci", grammi: 300 },
      { nome: "Patate novelle", grammi: 200 },
      { nome: "Senape", grammi: 80 },
      { nome: "Zucchero di cocco", grammi: 10 },
      { nome: "Coriandolo", nota: "q.b." },
      { nome: "Pepe", nota: "q.b." },
      { nome: "Salsa di soia", nota: "q.b." },
      { nome: "Cipolla", grammi: 100 },
      { nome: "Aglio", nota: "q.b." },
      { nome: "Rosmarino", nota: "q.b." },
      { nome: "Salvia", nota: "q.b." },
      { nome: "Timo", nota: "q.b." },
      { nome: "Olio d'oliva", grammi: 20 },
    ],
    motivo:
      "La fesa di maiale con crema di senape, spinaci e patate novelle combina sapori diversi. Leggi ingredienti e allergeni, soprattutto se eviti senape o altri componenti della ricetta.",
  },
  {
    id: "pallotte-cacio-ovo",
    nome: "Pallotte cacio e ovo",
    descrizione: "Pallotte abruzzesi con ricotta e sugo di pomodorini.",
    grammi: 840,
    proteine: 53,
    carboidrati: 116,
    grassi: 50,
    kcal: kcalDa(53, 116, 50),
    tag: ["veg"],
    allergeni: ["glutine", "uova", "latte"],
    img: "/foto/fuel-20261015-v2-pallotte-cacio-ovo.webp",
    allenamento: "pesi",
    ingredienti: [
      { nome: "Pane raffermo", grammi: 180 },
      { nome: "Uova", nota: "2" },
      { nome: "Ricotta", grammi: 100 },
      { nome: "Pepe", nota: "q.b." },
      { nome: "Sale", nota: "q.b." },
      { nome: "Olio", nota: "q.b." },
      { nome: "Pomodorini", grammi: 300 },
      { nome: "Cipolla", grammi: 100 },
      { nome: "Basilico", nota: "q.b." },
      { nome: "Parmigiano", nota: "q.b." },
    ],
    motivo:
      "Le pallotte cacio e ovo richiamano la cucina abruzzese in una proposta per il menu settimanale. La scheda indica ingredienti e valori della porzione, così puoi confrontarla con gli altri piatti.",
  },
  {
    id: "uova-purgatorio-peperoni",
    nome: "Uova alla purgatorio con sugo di peperoni",
    descrizione: "Uova in sugo di peperoni e pomodorini, con formaggio tipo quark.",
    grammi: 870,
    proteine: 35,
    carboidrati: 42,
    grassi: 31,
    kcal: kcalDa(35, 42, 31),
    tag: ["veg", "senza-glutine"],
    allergeni: ["uova", "latte"],
    img: "/foto/fuel-20261015-v2-uova-purgatorio-peperoni.webp",
    allenamento: "pesi",
    ingredienti: [
      { nome: "Uova", nota: "3" },
      { nome: "Peperoni", grammi: 200 },
      { nome: "Pomodorini", grammi: 200 },
      { nome: "Aglio", nota: "1 spicchio" },
      { nome: "Cipolla", grammi: 200 },
      { nome: "Olio d'oliva", grammi: 15 },
      { nome: "Origano", nota: "q.b." },
      { nome: "Sale", nota: "q.b." },
      { nome: "Pepe", nota: "q.b." },
      { nome: "Formaggio tipo quark", nota: "quantità da confermare" },
    ],
    motivo:
      "Uova, peperoni e quark danno carattere a questo piatto. Puoi confrontarne ingredienti e valori con le altre proposte del menu e scegliere in base a gusto e indicazioni personali.",
  },
];


// Gli indici esistenti sono usati dai link condivisi: le novità si aggiungono in fondo.
PIATTI.push(...PIATTI_OTTOBRE);
export const PIATTI_MENU = [...PIATTI].sort((a, b) => Number(!!b.novita) - Number(!!a.novita));
const PIATTI_BY_ID: Record<string, Piatto> = Object.fromEntries(PIATTI.map((e) => [e.id, e]));

export function getPiatto(id: string): Piatto | undefined {
  return PIATTI_BY_ID[id];
}

const EXTRA_BY_ID: Record<string, Extra> = Object.fromEntries(EXTRA.map((e) => [e.id, e]));

export function getExtra(id: string): Extra | undefined {
  return EXTRA_BY_ID[id];
}

/** Le foto del catalogo sono file locali serviti da fuelchef.it. */
export function piattoImg(e: Piatto): string {
  return e.img;
}

export function extraImg(e: Extra): string {
  return e.img;
}

export function extraPerReparto(reparto: RepartoExtra): Extra[] {
  return EXTRA.filter((e) => e.reparto === reparto);
}

/**
 * Fondo scala comune delle barre macro. Si calcola dal catalogo e non si scrive a mano:
 * un valore cablato mentirebbe al primo piatto aggiunto.
 */
export const MAX_MACRO: { proteine: number; carboidrati: number; grassi: number } = {
  proteine: Math.max(...PIATTI.map((e) => e.proteine)),
  carboidrati: Math.max(...PIATTI.map((e) => e.carboidrati)),
  grassi: Math.max(...PIATTI.map((e) => e.grassi)),
};
