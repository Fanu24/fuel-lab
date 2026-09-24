import type { Giorno, Macros, Tag } from "./types";

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

/** Unica definizione delle kcal del progetto, cosi' non puo' divergere fra due file. */
export function kcalDa(proteine: number, carboidrati: number, grassi: number): number {
  return proteine * 4 + carboidrati * 4 + grassi * 9;
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

function extra(
  parziale: Omit<Extra, "kcal"> & { proteine: number; carboidrati: number; grassi: number },
): Extra {
  return { ...parziale, kcal: kcalDa(parziale.proteine, parziale.carboidrati, parziale.grassi) };
}

export const EXTRA: Extra[] = [
  extra({
    id: "carb-basmati-integrale",
    nome: "Basmati / integrale",
    descrizione: "Riso basmati o integrale, porzione extra nella box.",
    grammi: 80, proteine: 2, carboidrati: 22, grassi: 0, allergeni: [],
    img: "photo-1536304993881-ff6e9eefa2a6",
    reparto: "carboidrati", prezzoEuro: 2, prezzoNota: null,
  }),
  extra({
    id: "carb-rosso",
    nome: "Riso rosso",
    descrizione: "Riso rosso, porzione extra nella box.",
    grammi: 80, proteine: 3, carboidrati: 20, grassi: 1, allergeni: [],
    img: "photo-1516684732162-798a0062be99",
    reparto: "carboidrati", prezzoEuro: 3, prezzoNota: null,
  }),
  extra({
    id: "carb-carnaroli",
    nome: "Carnaroli",
    descrizione: "Riso carnaroli, porzione extra nella box.",
    grammi: 80, proteine: 2, carboidrati: 22, grassi: 0, allergeni: [],
    img: "photo-1536304993881-ff6e9eefa2a6",
    reparto: "carboidrati", prezzoEuro: 3, prezzoNota: null,
  }),
  extra({
    id: "carb-pasta",
    nome: "Pasta",
    descrizione: "Pasta, porzione extra nella box.",
    grammi: 80, proteine: 3, carboidrati: 20, grassi: 1, allergeni: ["glutine"],
    img: "photo-1621996346565-e3dbc646d9a9",
    reparto: "carboidrati", prezzoEuro: 1, prezzoNota: null,
  }),
  extra({
    id: "carb-couscous",
    nome: "Cous cous",
    descrizione: "Cous cous, porzione extra nella box.",
    grammi: 80, proteine: 3, carboidrati: 18, grassi: 0, allergeni: ["glutine"],
    img: "photo-1512058564366-18510be2db19",
    reparto: "carboidrati", prezzoEuro: 1, prezzoNota: null,
  }),
  extra({
    id: "carb-noodles",
    nome: "Noodles",
    descrizione: "Noodles, porzione extra nella box.",
    grammi: 80, proteine: 3, carboidrati: 22, grassi: 1, allergeni: ["glutine"],
    img: "photo-1612929633738-8fe44f7ec841",
    reparto: "carboidrati", prezzoEuro: 2, prezzoNota: null,
  }),
  extra({
    id: "carb-gnocchi",
    nome: "Gnocchi",
    descrizione: "Gnocchi, porzione extra nella box.",
    grammi: 100, proteine: 3, carboidrati: 18, grassi: 1, allergeni: ["glutine"],
    img: "photo-1601556123240-462c758a50db",
    reparto: "carboidrati", prezzoEuro: 3, prezzoNota: null,
  }),
  extra({
    id: "carb-patate",
    nome: "Patate / patate dolci",
    descrizione: "Patate o patate dolci, porzione extra nella box.",
    grammi: 100, proteine: 2, carboidrati: 17, grassi: 0, allergeni: [],
    img: "photo-1518977676601-b53f82aba655",
    reparto: "carboidrati", prezzoEuro: 1, prezzoNota: null,
  }),
  extra({
    id: "cprot-curry-cocco",
    nome: "Curry e latte di cocco",
    descrizione: "Condimento al curry e latte di cocco, sulla proteina.",
    grammi: 40, proteine: 1, carboidrati: 3, grassi: 8, allergeni: [],
    img: "photo-1455619452474-d2be8b1e70cd",
    reparto: "condimenti-proteine", prezzoEuro: 1, prezzoNota: null,
  }),
  extra({
    id: "cprot-soia",
    nome: "Soia",
    descrizione: "Salsa di soia sulla proteina. Inclusa nel piatto.",
    grammi: 15, proteine: 1, carboidrati: 1, grassi: 0, allergeni: ["soia"],
    img: "photo-1474979266404-7eaacbcd87c5",
    reparto: "condimenti-proteine", prezzoEuro: null, prezzoNota: "incluso",
  }),
  extra({
    id: "cprot-citronette",
    nome: "Citronette",
    descrizione: "Citronette sulla proteina. Inclusa nel piatto.",
    grammi: 20, proteine: 0, carboidrati: 1, grassi: 4, allergeni: [],
    img: "photo-1571066811602-716837d681de",
    reparto: "condimenti-proteine", prezzoEuro: null, prezzoNota: "incluso",
  }),
  extra({
    id: "cprot-senape",
    nome: "Senape",
    descrizione: "Senape sulla proteina.",
    grammi: 20, proteine: 1, carboidrati: 2, grassi: 1, allergeni: ["senape"],
    img: "photo-1638324396220-432156cd9303",
    reparto: "condimenti-proteine", prezzoEuro: 0.5, prezzoNota: null,
  }),
  extra({
    id: "cprot-pomodoro",
    nome: "Pomodoro",
    descrizione: "Sugo di pomodoro sulla proteina. Incluso nel piatto.",
    grammi: 80, proteine: 1, carboidrati: 4, grassi: 0, allergeni: [],
    img: "photo-1592924357228-91a4daadcfea",
    reparto: "condimenti-proteine", prezzoEuro: null, prezzoNota: "incluso",
  }),
  extra({
    id: "cprot-tahina",
    nome: "Tahina",
    descrizione: "Salsa tahina sulla proteina.",
    grammi: 20, proteine: 4, carboidrati: 4, grassi: 11, allergeni: ["sesamo"],
    img: "photo-1571066811602-716837d681de",
    reparto: "condimenti-proteine", prezzoEuro: 0.5, prezzoNota: null,
  }),
  extra({
    id: "prot-pollo",
    nome: "Pollo",
    descrizione: "Petto di pollo extra. Incluso come proteina base.",
    grammi: 50, proteine: 12, carboidrati: 0, grassi: 1, allergeni: [],
    img: "photo-1604503468506-a8da13d82791",
    reparto: "proteine", prezzoEuro: null, prezzoNota: "incluso",
  }),
  extra({
    id: "prot-manzo",
    nome: "Manzo",
    descrizione: "Manzo extra nella box.",
    grammi: 50, proteine: 13, carboidrati: 0, grassi: 4, allergeni: [],
    img: "photo-1558030006-450675393462",
    reparto: "proteine", prezzoEuro: 2.5, prezzoNota: null,
  }),
  extra({
    id: "prot-maiale",
    nome: "Maiale",
    descrizione: "Fesa di maiale extra nella box.",
    grammi: 50, proteine: 11, carboidrati: 0, grassi: 3, allergeni: [],
    img: "photo-1432139555190-58524dae6a55",
    reparto: "proteine", prezzoEuro: 1.5, prezzoNota: null,
  }),
  extra({
    id: "prot-gamberi",
    nome: "Gamberi",
    descrizione: "Gamberi extra nella box.",
    grammi: 50, proteine: 12, carboidrati: 0, grassi: 1, allergeni: ["crostacei"],
    img: "photo-1565680018434-b513d5e5fd47",
    reparto: "proteine", prezzoEuro: 2, prezzoNota: null,
  }),
  extra({
    id: "prot-salmone",
    nome: "Salmone",
    descrizione: "Salmone extra nella box.",
    grammi: 50, proteine: 10, carboidrati: 0, grassi: 6, allergeni: ["pesce"],
    img: "photo-1467003909585-2f8a72700288",
    reparto: "proteine", prezzoEuro: 2.5, prezzoNota: null,
  }),
  extra({
    id: "prot-merluzzo",
    nome: "Merluzzo",
    descrizione: "Merluzzo extra nella box.",
    grammi: 50, proteine: 12, carboidrati: 0, grassi: 1, allergeni: ["pesce"],
    img: "photo-1615141982883-c7ad0e69fd62",
    reparto: "proteine", prezzoEuro: 2.5, prezzoNota: null,
  }),
  extra({
    id: "prot-macinato-pollo",
    nome: "Macinato di pollo",
    descrizione: "Macinato di pollo extra nella box.",
    grammi: 50, proteine: 11, carboidrati: 0, grassi: 2, allergeni: [],
    img: "photo-1604503468506-a8da13d82791",
    reparto: "proteine", prezzoEuro: 1, prezzoNota: null,
  }),
  extra({
    id: "prot-macinato-manzo",
    nome: "Macinato di manzo",
    descrizione: "Macinato di manzo extra nella box.",
    grammi: 50, proteine: 12, carboidrati: 0, grassi: 5, allergeni: [],
    img: "photo-1611270629569-8b357cb88da9",
    reparto: "proteine", prezzoEuro: 2, prezzoNota: null,
  }),
  extra({
    id: "prot-macinato-maiale",
    nome: "Macinato di maiale",
    descrizione: "Macinato di maiale extra nella box.",
    grammi: 50, proteine: 10, carboidrati: 0, grassi: 4, allergeni: [],
    img: "photo-1529042410759-befb1204b468",
    reparto: "proteine", prezzoEuro: 1.5, prezzoNota: null,
  }),
  extra({
    id: "prot-ricotta",
    nome: "Ricotta / formaggio proteico a scelta",
    descrizione: "Ricotta o formaggio proteico extra nella box.",
    grammi: 50, proteine: 8, carboidrati: 2, grassi: 4, allergeni: ["latte"],
    img: "photo-1452195100486-9cc805987862",
    reparto: "proteine", prezzoEuro: 2, prezzoNota: null,
  }),
  extra({
    id: "ccarb-pomodoro",
    nome: "Pomodoro",
    descrizione: "Sugo di pomodoro sul carboidrato. Incluso nel piatto.",
    grammi: 80, proteine: 1, carboidrati: 4, grassi: 0, allergeni: [],
    img: "photo-1592924357228-91a4daadcfea",
    reparto: "condimenti-carboidrati", prezzoEuro: null, prezzoNota: "incluso",
  }),
  extra({
    id: "ccarb-soia",
    nome: "Soia",
    descrizione: "Salsa di soia sul carboidrato. Inclusa nel piatto.",
    grammi: 15, proteine: 1, carboidrati: 1, grassi: 0, allergeni: ["soia"],
    img: "photo-1474979266404-7eaacbcd87c5",
    reparto: "condimenti-carboidrati", prezzoEuro: null, prezzoNota: "incluso",
  }),
  extra({
    id: "ccarb-olio",
    nome: "Olio",
    descrizione: "Olio extravergine sul carboidrato. Incluso nel piatto.",
    grammi: 10, proteine: 0, carboidrati: 0, grassi: 10, allergeni: [],
    img: "photo-1474979266404-7eaacbcd87c5",
    reparto: "condimenti-carboidrati", prezzoEuro: null, prezzoNota: "incluso",
  }),
  extra({
    id: "ccarb-burro",
    nome: "Burro",
    descrizione: "Burro sul carboidrato.",
    grammi: 10, proteine: 0, carboidrati: 0, grassi: 8, allergeni: ["latte"],
    img: "photo-1603596310923-dbb12732f9c7",
    reparto: "condimenti-carboidrati", prezzoEuro: 0.5, prezzoNota: null,
  }),
  extra({
    id: "ccarb-miso",
    nome: "Miso",
    descrizione: "Miso sul carboidrato.",
    grammi: 15, proteine: 2, carboidrati: 4, grassi: 1, allergeni: ["soia"],
    img: "photo-1547592180-85f173990554",
    reparto: "condimenti-carboidrati", prezzoEuro: 0.5, prezzoNota: null,
  }),
  extra({
    id: "ccarb-parmigiano",
    nome: "Parmigiano",
    descrizione: "Parmigiano sul carboidrato.",
    grammi: 15, proteine: 5, carboidrati: 0, grassi: 4, allergeni: ["latte"],
    img: "photo-1452195100486-9cc805987862",
    reparto: "condimenti-carboidrati", prezzoEuro: 0.5, prezzoNota: null,
  }),
  extra({
    id: "ccarb-citronette",
    nome: "Citronette",
    descrizione: "Citronette sul carboidrato. Inclusa nel piatto.",
    grammi: 20, proteine: 0, carboidrati: 1, grassi: 4, allergeni: [],
    img: "photo-1571066811602-716837d681de",
    reparto: "condimenti-carboidrati", prezzoEuro: null, prezzoNota: "incluso",
  }),
  extra({
    id: "verdure-stagione",
    nome: "Verdure di stagione",
    descrizione: "Verdure di stagione, da un euro a due secondo il reco.",
    grammi: 150, proteine: 3, carboidrati: 8, grassi: 1, allergeni: [],
    img: "photo-1540420773420-3366772f4999",
    reparto: "verdure", prezzoEuro: null, prezzoNota: "da-a", prezzoDa: 1, prezzoA: 2,
  }),
  extra({
    id: "snack-pancakes",
    nome: "Pancakes proteici",
    descrizione: "Pancakes proteici, snack della box.",
    grammi: 120, proteine: 18, carboidrati: 22, grassi: 6, allergeni: ["glutine", "uova", "latte"],
    img: "photo-1567620905732-2d1ec7ab7445",
    reparto: "snack", prezzoEuro: null, prezzoNota: "su-richiesta",
  }),
  extra({
    id: "snack-porridge",
    nome: "Porridge",
    descrizione: "Porridge, snack della box.",
    grammi: 180, proteine: 8, carboidrati: 32, grassi: 4, allergeni: ["glutine", "latte"],
    img: "photo-1517673400267-0251440c45dc",
    reparto: "snack", prezzoEuro: null, prezzoNota: "su-richiesta",
  }),
  extra({
    id: "snack-barrette",
    nome: "Barrette",
    descrizione: "Barrette proteiche, snack della box.",
    grammi: 60, proteine: 10, carboidrati: 18, grassi: 6, allergeni: ["latte", "frutta a guscio"],
    img: "photo-1705868432559-211198009991",
    reparto: "snack", prezzoEuro: null, prezzoNota: "su-richiesta",
  }),
  extra({
    id: "snack-tiramisu",
    nome: "Tiramisu fit",
    descrizione: "Tiramisu fit, snack della box.",
    grammi: 110, proteine: 12, carboidrati: 20, grassi: 8, allergeni: ["uova", "latte", "glutine"],
    img: "photo-1571877227200-a0d98ea607e9",
    reparto: "snack", prezzoEuro: null, prezzoNota: "su-richiesta",
  }),
  extra({
    id: "snack-yogurt-muesli",
    nome: "Yogurt, muesli e frutta fresca",
    descrizione: "Yogurt con muesli e frutta fresca, snack della box.",
    grammi: 200, proteine: 10, carboidrati: 28, grassi: 5, allergeni: ["latte", "glutine", "frutta a guscio"],
    img: "photo-1488477181946-6428a0291777",
    reparto: "snack", prezzoEuro: null, prezzoNota: "su-richiesta",
  }),
  extra({
    id: "snack-frutta",
    nome: "Frutta",
    descrizione: "Frutta fresca, snack della box.",
    grammi: 150, proteine: 1, carboidrati: 18, grassi: 0, allergeni: [],
    img: "photo-1619566636858-adf3ef46400b",
    reparto: "snack", prezzoEuro: null, prezzoNota: "su-richiesta",
  }),
  extra({
    id: "snack-centrifugati",
    nome: "Centrifugati",
    descrizione: "Centrifugato di frutta e verdura, snack della box.",
    grammi: 250, proteine: 2, carboidrati: 16, grassi: 0, allergeni: [],
    img: "photo-1613478223719-2ab802602423",
    reparto: "snack", prezzoEuro: null, prezzoNota: "su-richiesta",
  }),
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
