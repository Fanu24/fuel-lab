import { kcalDa, type Giorno, type Macros, type Tag } from "./types";
import { EXTRA } from "./catalogo-extra";

/*
 * kcalDa vive in ./types e EXTRA in ./catalogo-extra per non creare un ciclo di
 * import: catalogo-extra ha bisogno di kcalDa a tempo di caricamento, e se lo
 * prendesse da qui chi importa per primo catalogo-extra troverebbe EXTRA ancora
 * in zona morta. Li ri-esportiamo perche' il resto del sito importa da "./catalogo".
 */
export { kcalDa } from "./types";
export { EXTRA };

/**
 * Il catalogo del cliente: sei piatti gia' composti, piu' gli alimenti della box.
 *
 * Non e' piu' un menu da assemblare a primi e secondi. Ogni schiscetta e' un
 * piatto chiuso, con gli ingredienti, i macro e il motivo dell'abbinamento.
 * Le aggiunte (carboidrati, proteine, condimenti, verdure, snack) si attaccano
 * al piatto, non al contrario: senza piatto non c'e' box da personalizzare.
 *
 * Regola sui numeri: kcal e' SEMPRE uguale a P*4 + C*4 + G*9. Gli allergeni
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
  id: string;
  nome: string;
  descrizione: string;
  grammi: number;
  tag: Tag[];
  allergeni: string[];
  img: string;
  giorno: Giorno;
  ingredienti: Ingrediente[];
  motivo: string;
  allenamento: Allenamento;
}

export interface Extra extends Macros {
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
    img: "photo-1526318896980-cf78c088247c",
    giorno: "lunedi",
    allenamento: "cardio",
    ingredienti: [
      { nome: "Noodles", grammi: 100 },
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
      "In questo pasto completo abbiamo un'alta quantita di proteine unita alla dose di carboidrati giusta per assimilarle al meglio. Le spezie usate in questo piatto sono ricche di antiossidanti. Gli alimenti vengono trattati con cura per esaltare i valori nutrizionali.",
  },
  {
    id: "gnocchetti-sugo-ricotta",
    nome: "Gnocchetti al sugo con ricotta fresca proteica",
    descrizione: "Gnocchi fatti a mano, sugo di pomodorini e crema di ricotta e parmigiano.",
    grammi: 970,
    proteine: 46,
    carboidrati: 73,
    grassi: 49,
    kcal: kcalDa(46, 73, 49),
    tag: ["veg"],
    allergeni: ["glutine", "latte", "uova"],
    img: "photo-1601556123240-462c758a50db",
    giorno: "giovedi",
    allenamento: "cardio",
    ingredienti: [
      { nome: "Gnocchi fatti a mano", grammi: 200 },
      { nome: "Pomodorini", grammi: 500 },
      { nome: "Cipolla", grammi: 50 },
      { nome: "Aglio", nota: "1 spicchio" },
      { nome: "Basilico fresco", nota: "q.b." },
      { nome: "Ricotta fresca", grammi: 150 },
      { nome: "Parmigiano", grammi: 50 },
      { nome: "Olio d'oliva", grammi: 15 },
    ],
    motivo:
      "La semplicita del prodotto non significa che in esso non ci sia racchiuso tutto quello di cui hai bisogno. Gli gnocchi fatti a mano sono fatti da patate, poca farina e uova: le patate sono una delle migliori fonti di carboidrati e le uova nell'impasto aggiungono anche proteine. La crema di ricotta e parmigiano non solo rende piu gustoso il piatto, ha anche un fattore proteico non indifferente. Il sugo e fatto direttamente dai pomodorini freschi, cuocendo tutto a bassa temperatura per preservare il piu possibile i suoi valori.",
  },
  {
    id: "riso-julien-pollo-teriyaki",
    nome: "Riso carote e zucchine julien, pollo teriyaki",
    descrizione: "Basmati, petto di pollo e verdure a julienne con olio di sesamo.",
    grammi: 730,
    proteine: 62,
    carboidrati: 140,
    grassi: 23,
    kcal: kcalDa(62, 140, 23),
    tag: ["carne", "senza-glutine"],
    allergeni: ["sesamo", "soia"],
    img: "photo-1603133872878-684f208fb84b",
    giorno: "lunedi",
    allenamento: "entrambi",
    ingredienti: [
      { nome: "Riso basmati", grammi: 150 },
      { nome: "Petto di pollo", grammi: 200 },
      { nome: "Carote", grammi: 180 },
      { nome: "Zucchine", grammi: 180 },
      { nome: "Olio d'oliva", grammi: 10 },
      { nome: "Olio di sesamo", grammi: 6 },
    ],
    motivo:
      "In un piatto abbiamo tutto quello di cui abbiamo bisogno. L'olio di sesamo e ricco di acidi grassi e di antiossidanti come il sesamolo, che aiutano a combattere i radicali liberi.",
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
    tag: ["carne", "senza-glutine"],
    allergeni: ["senape", "soia"],
    img: "photo-1432139555190-58524dae6a55",
    giorno: "giovedi",
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
      "Un piatto estremamente gustoso e completo. La carne magra della fesa di maiale si combina perfettamente con la crema di senape. La senape e un condimento ipocalorico che favorisce la digestione, pieno zeppo di antiossidanti.",
  },
  {
    id: "pallotte-cacio-ovo",
    nome: "Pallotte cacio e ovo fit proteiche",
    descrizione: "Pallotte abruzzesi in versione light, con ricotta e sugo di pomodorini.",
    grammi: 840,
    proteine: 53,
    carboidrati: 116,
    grassi: 50,
    kcal: kcalDa(53, 116, 50),
    tag: ["veg"],
    allergeni: ["glutine", "uova", "latte"],
    img: "photo-1529042410759-befb1204b468",
    giorno: "giovedi",
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
      "Un piatto tipico della tradizione in versione piu light. Pur conosciuto come un piatto della tradizione abruzzese abbastanza pesante, con qualche accorgimento diventa un ottimo pasto completo con anche una buona quantita di proteine.",
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
    img: "photo-1590412200988-a436970781fa",
    giorno: "lunedi",
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
      { nome: "Formaggio tipo quark", grammi: 80 },
    ],
    motivo:
      "Poche calorie da carboidrati, tante proteine da uova e quark: il pasto da abbinare a un allenamento di pesistica, quando serve sintesi proteica e non un carico glucidico.",
  },
];


const PIATTI_BY_ID: Record<string, Piatto> = Object.fromEntries(PIATTI.map((e) => [e.id, e]));

export function getPiatto(id: string): Piatto | undefined {
  return PIATTI_BY_ID[id];
}

const EXTRA_BY_ID: Record<string, Extra> = Object.fromEntries(EXTRA.map((e) => [e.id, e]));

export function getExtra(id: string): Extra | undefined {
  return EXTRA_BY_ID[id];
}

/** URL Unsplash con larghezza esplicita: le foto sono il 90% del peso della pagina. */
export function piattoImg(e: Piatto, w = 800): string {
  return `https://images.unsplash.com/${e.img}?w=${w}&q=80&auto=format&fit=crop`;
}

export function extraImg(e: Extra, w = 400): string {
  return `https://images.unsplash.com/${e.img}?w=${w}&q=80&auto=format&fit=crop`;
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
