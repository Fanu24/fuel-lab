import type { Giorno, Macros, Tag } from "./types";

/**
 * Il catalogo scomposto: primi, secondi ed extra.
 *
 * Il committente compone il pasto invece di sceglierlo gia' fatto, e in italiano
 * "primi e secondi" e' gia' la divisione carboidrati/proteine che serve al matcher:
 * il primo porta la base glucidica con la verdura, il secondo la proteina con i suoi
 * grassi e i pochi carboidrati incidentali. I 27 piatti storici di lib/dishes.ts
 * restano ricomponibili uno per uno tramite ABBINAMENTI, e lib/catalogo.test.ts
 * verifica che la somma torni ai valori originali esatti: e' il vincolo che impedisce
 * alla decomposizione di derivare in silenzio quando qualcuno ritocca una riga.
 *
 * Regola sui numeri: kcal e' SEMPRE uguale a P*4 + C*4 + G*9, senza arrotondamenti
 * di comodo. Il piano settimanale somma questi macro e li mostra a persone che pesano
 * il cibo: se il catalogo non tornasse, se ne accorgerebbero alla prima somma.
 *
 * Gli allergeni sono un campo obbligatorio, array vuoto quando non ce ne sono e mai
 * assente: dichiararli e' un obbligo di legge (Reg. UE 1169/2011) e un campo opzionale
 * renderebbe indistinguibile "nessun allergene" da "non ancora compilato".
 */

export type Categoria = "primo" | "secondo";

export interface Elemento extends Macros {
  id: string;
  nome: string;
  descrizione: string;
  categoria: Categoria;
  /** peso della porzione in grammi */
  grammi: number;
  tag: Tag[];
  /** allergeni Reg. UE 1169/2011: array vuoto se non ne ha, mai assente */
  allergeni: string[];
  /** id della foto su images.unsplash.com, ereditato dal piatto di provenienza */
  img: string;
  /** giorno in cui Matteo lo cucina */
  giorno: Giorno;
}

export interface Extra extends Macros {
  id: string;
  nome: string;
  grammi: number;
  allergeni: string[];
}

/** Unica definizione delle kcal del progetto, cosi' non puo' divergere fra due file. */
export function kcalDa(proteine: number, carboidrati: number, grassi: number): number {
  return proteine * 4 + carboidrati * 4 + grassi * 9;
}

export const PRIMI: Elemento[] = [
  {
    id: "primo-riso-basmati-broccoli", nome: "Riso basmati e broccoli",
    descrizione: "Basmati sgranato e broccoli al vapore croccanti.",
    categoria: "primo", grammi: 290,
    kcal: 323, proteine: 8, carboidrati: 66, grassi: 3,
    tag: ["veg", "senza-glutine"], allergeni: [],
    img: "photo-1546069901-ba9599a7e63c", giorno: "lunedi",
  },
  {
    id: "primo-quinoa-verdure-stagione", nome: "Quinoa e verdure di stagione",
    descrizione: "Quinoa tricolore e verdure dell'orto abruzzese saltate.",
    categoria: "primo", grammi: 270,
    kcal: 290, proteine: 9, carboidrati: 50, grassi: 6,
    tag: ["veg", "senza-glutine"], allergeni: [],
    img: "photo-1467003909585-2f8a72700288", giorno: "lunedi",
  },
  {
    id: "primo-patate-dolci-spinaci", nome: "Patate dolci e spinaci",
    descrizione: "Patate dolci al forno e spinaci saltati in padella.",
    categoria: "primo", grammi: 300,
    kcal: 296, proteine: 6, carboidrati: 59, grassi: 4,
    tag: ["veg", "senza-glutine"], allergeni: [],
    img: "photo-1529042410759-befb1204b468", giorno: "lunedi",
  },
  {
    id: "primo-farro-zucchine", nome: "Farro e zucchine grigliate",
    descrizione: "Farro perlato e zucchine grigliate con menta.",
    categoria: "primo", grammi: 280,
    kcal: 320, proteine: 9, carboidrati: 62, grassi: 4,
    tag: ["veg"], allergeni: ["glutine"],
    img: "photo-1607532941433-304659e8198a", giorno: "giovedi",
  },
  {
    id: "primo-patate-forno-fagiolini", nome: "Patate al forno e fagiolini",
    descrizione: "Patate al forno a spicchi e fagiolini croccanti.",
    categoria: "primo", grammi: 280,
    kcal: 267, proteine: 7, carboidrati: 53, grassi: 3,
    tag: ["veg", "senza-glutine"], allergeni: [],
    img: "photo-1476224203421-9ac39bcb3327", giorno: "giovedi",
  },
  {
    id: "primo-riso-venere-peperoni", nome: "Riso venere e peperoni",
    descrizione: "Riso venere e peperoni arrostiti a falde.",
    categoria: "primo", grammi: 290,
    kcal: 324, proteine: 8, carboidrati: 64, grassi: 4,
    tag: ["veg", "senza-glutine"], allergeni: [],
    img: "photo-1598515214211-89d3c73ae83b", giorno: "lunedi",
  },
  {
    id: "primo-avocado-pane-integrale", nome: "Avocado e pane integrale",
    descrizione: "Avocado a fette e pane integrale a lievitazione naturale.",
    categoria: "primo", grammi: 150,
    kcal: 350, proteine: 8, carboidrati: 39, grassi: 18,
    tag: ["veg"], allergeni: ["glutine"],
    img: "photo-1490645935967-10de6ba17061", giorno: "giovedi",
  },
  {
    id: "primo-cous-cous-broccoletti", nome: "Cous cous al limone e broccoletti",
    descrizione: "Cous cous al limone e broccoletti ripassati in padella.",
    categoria: "primo", grammi: 270,
    kcal: 296, proteine: 9, carboidrati: 56, grassi: 4,
    tag: ["veg"], allergeni: ["glutine"],
    img: "photo-1519708227418-c8fd9a32b7a2", giorno: "giovedi",
  },
  {
    id: "primo-riso-integrale-verdure", nome: "Riso integrale e verdure croccanti",
    descrizione: "Riso integrale e verdure croccanti saltate al wok.",
    categoria: "primo", grammi: 280,
    kcal: 357, proteine: 8, carboidrati: 70, grassi: 5,
    tag: ["veg", "senza-glutine"], allergeni: [],
    img: "photo-1604908176997-125f25cc6f3d", giorno: "lunedi",
  },
  {
    id: "primo-bulgur-melanzane", nome: "Bulgur e melanzane",
    descrizione: "Bulgur e melanzane arrostite con tahina leggera.",
    categoria: "primo", grammi: 290,
    kcal: 399, proteine: 8, carboidrati: 76, grassi: 7,
    tag: ["veg"], allergeni: ["glutine", "sesamo"],
    img: "photo-1512621776951-a57141f2eefd", giorno: "giovedi",
  },
  {
    id: "primo-riso-basmati-rucola", nome: "Riso basmati e rucola",
    descrizione: "Basmati, rucola fresca e scaglie di grana.",
    categoria: "primo", grammi: 290,
    kcal: 315, proteine: 8, carboidrati: 64, grassi: 3,
    tag: ["veg", "senza-glutine"], allergeni: ["latte"],
    img: "photo-1504674900247-0877df9cc836", giorno: "lunedi",
  },
  {
    id: "primo-patate-viola-asparagi", nome: "Patate viola e asparagi",
    descrizione: "Patate viola al forno e asparagi croccanti.",
    categoria: "primo", grammi: 260,
    kcal: 247, proteine: 7, carboidrati: 48, grassi: 3,
    tag: ["veg", "senza-glutine"], allergeni: [],
    img: "photo-1560717845-968823efbee1", giorno: "giovedi",
  },
  {
    id: "primo-riso-jasmine-piselli", nome: "Riso jasmine e piselli",
    descrizione: "Riso jasmine profumato e piselli freschi.",
    categoria: "primo", grammi: 290,
    kcal: 328, proteine: 7, carboidrati: 66, grassi: 4,
    tag: ["veg", "senza-glutine"], allergeni: [],
    img: "photo-1555939594-58d7cb561ad1", giorno: "lunedi",
  },
  {
    id: "primo-sedano-rapa-cavolo", nome: "Pure di sedano rapa e cavolo",
    descrizione: "Pure di sedano rapa e cavolo cappuccio saltato.",
    categoria: "primo", grammi: 270,
    kcal: 192, proteine: 6, carboidrati: 33, grassi: 4,
    tag: ["veg", "senza-glutine"], allergeni: ["latte", "sedano"],
    img: "photo-1432139555190-58524dae6a55", giorno: "giovedi",
  },
  {
    id: "primo-riso-basmati-zucchine", nome: "Riso basmati e zucchine",
    descrizione: "Basmati e zucchine a julienne saltate.",
    categoria: "primo", grammi: 270,
    kcal: 312, proteine: 7, carboidrati: 62, grassi: 4,
    tag: ["veg", "senza-glutine"], allergeni: [],
    img: "photo-1559847844-5315695dadae", giorno: "giovedi",
  },
  {
    id: "primo-patate-rustiche-spinaci", nome: "Patate rustiche e spinaci",
    descrizione: "Patate rustiche al rosmarino e spinaci saltati all'aglio.",
    categoria: "primo", grammi: 250,
    kcal: 252, proteine: 8, carboidrati: 46, grassi: 4,
    tag: ["veg", "senza-glutine"], allergeni: [],
    img: "photo-1540189549336-e6e99c3679fe", giorno: "lunedi",
  },
  {
    id: "primo-polenta-taragna-funghi", nome: "Polenta taragna e funghi",
    descrizione: "Polenta taragna leggera e funghi trifolati.",
    categoria: "primo", grammi: 280,
    kcal: 297, proteine: 8, carboidrati: 55, grassi: 5,
    tag: ["veg", "senza-glutine"], allergeni: ["latte"],
    img: "photo-1594834749740-74b3f6764be4", giorno: "giovedi",
  },
  {
    id: "primo-riso-integrale-cavolo-nero", nome: "Riso integrale e cavolo nero",
    descrizione: "Riso integrale e cavolo nero ripassato con aglio.",
    categoria: "primo", grammi: 280,
    kcal: 309, proteine: 8, carboidrati: 58, grassi: 5,
    tag: ["veg", "senza-glutine"], allergeni: [],
    img: "photo-1580476262798-bddd9f4b7369", giorno: "lunedi",
  },
  {
    id: "primo-pasta-integrale-pomodorini", nome: "Pasta integrale e pomodorini",
    descrizione: "Pasta integrale trafilata al bronzo e pomodorini confit.",
    categoria: "primo", grammi: 300,
    kcal: 396, proteine: 10, carboidrati: 80, grassi: 4,
    tag: ["veg"], allergeni: ["glutine"],
    img: "photo-1473093295043-cdd812d0e601", giorno: "lunedi",
  },
  {
    id: "primo-quinoa-broccoli", nome: "Quinoa e broccoli",
    descrizione: "Quinoa e broccoli al vapore.",
    categoria: "primo", grammi: 270,
    kcal: 333, proteine: 9, carboidrati: 54, grassi: 9,
    tag: ["veg", "senza-glutine"], allergeni: [],
    img: "photo-1543339308-43e59d6b73a6", giorno: "giovedi",
  },
  {
    id: "primo-patate-dolci-cime-rapa", nome: "Patate dolci e cime di rapa",
    descrizione: "Patate dolci al forno e cime di rapa saltate.",
    categoria: "primo", grammi: 270,
    kcal: 268, proteine: 7, carboidrati: 51, grassi: 4,
    tag: ["veg", "senza-glutine"], allergeni: [],
    img: "photo-1512003867696-6d5ce6835040", giorno: "giovedi",
  },
  {
    id: "primo-riso-basmati-carote", nome: "Riso basmati e carote all'arancia",
    descrizione: "Basmati e carote glassate all'arancia.",
    categoria: "primo", grammi: 290,
    kcal: 348, proteine: 8, carboidrati: 70, grassi: 4,
    tag: ["veg", "senza-glutine"], allergeni: [],
    img: "photo-1516684732162-798a0062be99", giorno: "lunedi",
  },
  {
    id: "primo-riso-verdure-forno", nome: "Riso e verdure al forno",
    descrizione: "Riso e verdure di stagione arrostite al forno.",
    categoria: "primo", grammi: 300,
    kcal: 329, proteine: 10, carboidrati: 52, grassi: 9,
    tag: ["veg", "senza-glutine"], allergeni: [],
    img: "photo-1547592180-85f173990554", giorno: "giovedi",
  },
  {
    id: "primo-cous-cous-integrale-zucca", nome: "Cous cous integrale e zucca",
    descrizione: "Cous cous integrale e zucca arrostita a spicchi.",
    categoria: "primo", grammi: 290,
    kcal: 328, proteine: 7, carboidrati: 66, grassi: 4,
    tag: ["veg"], allergeni: ["glutine"],
    img: "photo-1611270629569-8b357cb88da9", giorno: "lunedi",
  },
  {
    id: "primo-quinoa-edamame", nome: "Quinoa e edamame",
    descrizione: "Quinoa, edamame e verdure croccanti.",
    categoria: "primo", grammi: 280,
    kcal: 309, proteine: 18, carboidrati: 48, grassi: 5,
    tag: ["veg", "senza-glutine"], allergeni: ["soia"],
    img: "photo-1512058564366-18510be2db19", giorno: "lunedi",
  },
  {
    id: "primo-patate-forno-asparagi", nome: "Patate al forno e asparagi",
    descrizione: "Patate al forno e asparagi croccanti.",
    categoria: "primo", grammi: 270,
    kcal: 236, proteine: 8, carboidrati: 42, grassi: 4,
    tag: ["veg", "senza-glutine"], allergeni: [],
    img: "photo-1466637574441-749b8f19452f", giorno: "giovedi",
  },
  {
    id: "primo-riso-verdure-stagione", nome: "Riso e verdure di stagione",
    descrizione: "Riso e verdure di stagione al forno.",
    categoria: "primo", grammi: 290,
    kcal: 301, proteine: 12, carboidrati: 52, grassi: 5,
    tag: ["veg", "senza-glutine"], allergeni: [],
    img: "photo-1505576399279-565b52d4ac71", giorno: "giovedi",
  },
];

export const SECONDI: Elemento[] = [
  {
    id: "secondo-pollo-piastra", nome: "Pollo alla piastra",
    descrizione: "Sovracoscia disossata scottata sulla piastra, solo sale e pepe.",
    categoria: "secondo", grammi: 190,
    kcal: 265, proteine: 44, carboidrati: 2, grassi: 9,
    tag: ["carne", "senza-glutine"], allergeni: [],
    img: "photo-1546069901-ba9599a7e63c", giorno: "lunedi",
  },
  {
    id: "secondo-salmone-forno", nome: "Salmone al forno",
    descrizione: "Filetto di salmone cotto al forno con scorza di limone.",
    categoria: "secondo", grammi: 180,
    kcal: 346, proteine: 35, carboidrati: 2, grassi: 22,
    tag: ["pesce", "senza-glutine"], allergeni: ["pesce"],
    img: "photo-1467003909585-2f8a72700288", giorno: "lunedi",
  },
  {
    id: "secondo-ragu-manzo", nome: "Ragu di manzo",
    descrizione: "Ragu di scottona cotto lento, senza soffritto pesante.",
    categoria: "secondo", grammi: 200,
    kcal: 311, proteine: 42, carboidrati: 2, grassi: 15,
    tag: ["carne", "senza-glutine"], allergeni: ["sedano"],
    img: "photo-1529042410759-befb1204b468", giorno: "lunedi",
  },
  {
    id: "secondo-fesa-tacchino", nome: "Fesa di tacchino",
    descrizione: "Fesa di tacchino a fette, cotta al naturale.",
    categoria: "secondo", grammi: 190,
    kcal: 235, proteine: 41, carboidrati: 2, grassi: 7,
    tag: ["carne", "senza-glutine"], allergeni: [],
    img: "photo-1607532941433-304659e8198a", giorno: "giovedi",
  },
  {
    id: "secondo-merluzzo-erbe", nome: "Merluzzo in crosta di erbe",
    descrizione: "Filetto di merluzzo con crosta di sole erbe aromatiche.",
    categoria: "secondo", grammi: 180,
    kcal: 202, proteine: 35, carboidrati: 2, grassi: 6,
    tag: ["pesce", "senza-glutine"], allergeni: ["pesce"],
    img: "photo-1476224203421-9ac39bcb3327", giorno: "giovedi",
  },
  {
    id: "secondo-pollo-agrumi", nome: "Petto di pollo agli agrumi",
    descrizione: "Petto di pollo marinato agli agrumi e scottato.",
    categoria: "secondo", grammi: 190,
    kcal: 273, proteine: 46, carboidrati: 2, grassi: 9,
    tag: ["carne", "senza-glutine"], allergeni: [],
    img: "photo-1598515214211-89d3c73ae83b", giorno: "lunedi",
  },
  {
    id: "secondo-frittata-albumi", nome: "Frittata di albumi",
    descrizione: "Frittata di soli albumi con erba cipollina.",
    categoria: "secondo", grammi: 230,
    kcal: 168, proteine: 30, carboidrati: 3, grassi: 4,
    tag: ["veg", "senza-glutine"], allergeni: ["uova"],
    img: "photo-1490645935967-10de6ba17061", giorno: "giovedi",
  },
  {
    id: "secondo-orata-forno", nome: "Orata al forno",
    descrizione: "Orata dell'Adriatico sfilettata e cotta al forno.",
    categoria: "secondo", grammi: 180,
    kcal: 226, proteine: 32, carboidrati: 2, grassi: 10,
    tag: ["pesce", "senza-glutine"], allergeni: ["pesce"],
    img: "photo-1519708227418-c8fd9a32b7a2", giorno: "giovedi",
  },
  {
    id: "secondo-tofu-zenzero", nome: "Tofu marinato allo zenzero",
    descrizione: "Tofu marinato allo zenzero e saltato al wok.",
    categoria: "secondo", grammi: 190,
    kcal: 195, proteine: 22, carboidrati: 2, grassi: 11,
    tag: ["veg", "senza-glutine"], allergeni: ["soia"],
    img: "photo-1604908176997-125f25cc6f3d", giorno: "lunedi",
  },
  {
    id: "secondo-ceci-cumino", nome: "Ceci speziati al cumino",
    descrizione: "Ceci cotti in casa e insaporiti al cumino.",
    categoria: "secondo", grammi: 190,
    kcal: 152, proteine: 18, carboidrati: 2, grassi: 8,
    tag: ["veg", "senza-glutine"], allergeni: [],
    img: "photo-1512621776951-a57141f2eefd", giorno: "giovedi",
  },
  {
    id: "secondo-straccetti-manzo", nome: "Straccetti di manzo",
    descrizione: "Straccetti di manzo scottati un minuto per lato.",
    categoria: "secondo", grammi: 190,
    kcal: 293, proteine: 43, carboidrati: 1, grassi: 13,
    tag: ["carne", "senza-glutine"], allergeni: [],
    img: "photo-1504674900247-0877df9cc836", giorno: "lunedi",
  },
  {
    id: "secondo-tonno-sesamo", nome: "Tonno scottato al sesamo",
    descrizione: "Tarantello di tonno scottato in crosta di sesamo.",
    categoria: "secondo", grammi: 180,
    kcal: 290, proteine: 39, carboidrati: 2, grassi: 14,
    tag: ["pesce", "senza-glutine"], allergeni: ["pesce", "sesamo"],
    img: "photo-1560717845-968823efbee1", giorno: "giovedi",
  },
  {
    id: "secondo-pollo-curry", nome: "Pollo al curry leggero",
    descrizione: "Bocconcini di pollo al curry, senza panna.",
    categoria: "secondo", grammi: 200,
    kcal: 274, proteine: 42, carboidrati: 4, grassi: 10,
    tag: ["carne", "senza-glutine"], allergeni: [],
    img: "photo-1555939594-58d7cb561ad1", giorno: "lunedi",
  },
  {
    id: "secondo-filetto-maiale", nome: "Filetto di maiale",
    descrizione: "Filetto di maiale rosato al cuore.",
    categoria: "secondo", grammi: 180,
    kcal: 294, proteine: 41, carboidrati: 1, grassi: 14,
    tag: ["carne", "senza-glutine"], allergeni: [],
    img: "photo-1432139555190-58524dae6a55", giorno: "giovedi",
  },
  {
    id: "secondo-gamberi-aglio", nome: "Gamberi aglio e prezzemolo",
    descrizione: "Gamberi sgusciati saltati con aglio e prezzemolo.",
    categoria: "secondo", grammi: 180,
    kcal: 190, proteine: 33, carboidrati: 1, grassi: 6,
    tag: ["pesce", "senza-glutine"], allergeni: ["crostacei"],
    img: "photo-1559847844-5315695dadae", giorno: "giovedi",
  },
  {
    id: "secondo-uova-biologiche", nome: "Uova biologiche",
    descrizione: "Uova biologiche di galline allevate a terra.",
    categoria: "secondo", grammi: 170,
    kcal: 257, proteine: 24, carboidrati: 2, grassi: 17,
    tag: ["veg", "senza-glutine"], allergeni: ["uova"],
    img: "photo-1540189549336-e6e99c3679fe", giorno: "lunedi",
  },
  {
    id: "secondo-fettine-vitello", nome: "Fettine di vitello",
    descrizione: "Fettine di vitello scottate in padella.",
    categoria: "secondo", grammi: 190,
    kcal: 260, proteine: 37, carboidrati: 1, grassi: 12,
    tag: ["carne", "senza-glutine"], allergeni: [],
    img: "photo-1594834749740-74b3f6764be4", giorno: "giovedi",
  },
  {
    id: "secondo-salmone-vapore", nome: "Salmone al vapore",
    descrizione: "Salmone cotto al vapore, più magro di quello al forno.",
    categoria: "secondo", grammi: 190,
    kcal: 337, proteine: 35, carboidrati: 2, grassi: 21,
    tag: ["pesce", "senza-glutine"], allergeni: ["pesce"],
    img: "photo-1580476262798-bddd9f4b7369", giorno: "lunedi",
  },
  {
    id: "secondo-pollo-straccetti", nome: "Pollo a straccetti",
    descrizione: "Petto di pollo tagliato a straccetti e saltato.",
    categoria: "secondo", grammi: 200,
    kcal: 252, proteine: 43, carboidrati: 2, grassi: 8,
    tag: ["carne", "senza-glutine"], allergeni: [],
    img: "photo-1473093295043-cdd812d0e601", giorno: "lunedi",
  },
  {
    id: "secondo-seitan-piastra", nome: "Seitan alla piastra",
    descrizione: "Seitan artigianale scottato alla piastra.",
    categoria: "secondo", grammi: 180,
    kcal: 143, proteine: 25, carboidrati: 4, grassi: 3,
    tag: ["veg"], allergeni: ["glutine"],
    img: "photo-1543339308-43e59d6b73a6", giorno: "giovedi",
  },
  {
    id: "secondo-sgombro-forno", nome: "Sgombro al forno",
    descrizione: "Sgombro dell'Adriatico cotto al forno.",
    categoria: "secondo", grammi: 180,
    kcal: 312, proteine: 32, carboidrati: 1, grassi: 20,
    tag: ["pesce", "senza-glutine"], allergeni: ["pesce"],
    img: "photo-1512003867696-6d5ce6835040", giorno: "giovedi",
  },
  {
    id: "secondo-tacchino-fette", nome: "Tacchino a fette",
    descrizione: "Tacchino a fette spesse, cotto al naturale.",
    categoria: "secondo", grammi: 200,
    kcal: 238, proteine: 44, carboidrati: 2, grassi: 6,
    tag: ["carne", "senza-glutine"], allergeni: [],
    img: "photo-1516684732162-798a0062be99", giorno: "lunedi",
  },
  {
    id: "secondo-lenticchie-santo-stefano", nome: "Lenticchie di Santo Stefano",
    descrizione: "Lenticchie di Santo Stefano cotte in umido.",
    categoria: "secondo", grammi: 200,
    kcal: 236, proteine: 18, carboidrati: 32, grassi: 4,
    tag: ["veg", "senza-glutine"], allergeni: [],
    img: "photo-1547592180-85f173990554", giorno: "giovedi",
  },
  {
    id: "secondo-spezzatino-manzo", nome: "Spezzatino di manzo",
    descrizione: "Spezzatino di manzo cotto lento nel suo fondo.",
    categoria: "secondo", grammi: 200,
    kcal: 279, proteine: 43, carboidrati: 2, grassi: 11,
    tag: ["carne", "senza-glutine"], allergeni: [],
    img: "photo-1611270629569-8b357cb88da9", giorno: "lunedi",
  },
  {
    id: "secondo-tempeh-tamari", nome: "Tempeh marinato al tamari",
    descrizione: "Tempeh marinato al tamari senza glutine e scottato.",
    categoria: "secondo", grammi: 190,
    kcal: 285, proteine: 34, carboidrati: 8, grassi: 13,
    tag: ["veg", "senza-glutine"], allergeni: ["soia"],
    img: "photo-1512058564366-18510be2db19", giorno: "lunedi",
  },
  {
    id: "secondo-albumi-ricotta", nome: "Albumi e ricotta",
    descrizione: "Albumi montati con ricotta vaccina e cotti al forno.",
    categoria: "secondo", grammi: 180,
    kcal: 282, proteine: 42, carboidrati: 6, grassi: 10,
    tag: ["veg", "senza-glutine"], allergeni: ["uova", "latte"],
    img: "photo-1466637574441-749b8f19452f", giorno: "giovedi",
  },
  {
    id: "secondo-burger-lenticchie-tofu", nome: "Burger di lenticchie e tofu",
    descrizione: "Burger di lenticchie e tofu affumicato, cotto in padella.",
    categoria: "secondo", grammi: 190,
    kcal: 266, proteine: 32, carboidrati: 12, grassi: 10,
    tag: ["veg", "senza-glutine"], allergeni: ["soia"],
    img: "photo-1505576399279-565b52d4ac71", giorno: "giovedi",
  },
];

export const EXTRA: Extra[] = [
  {
    id: "avocado", nome: "Mezzo avocado", grammi: 80,
    kcal: 144, proteine: 2, carboidrati: 7, grassi: 12,
    allergeni: [],
  },
  {
    id: "olio-evo", nome: "Olio EVO a crudo", grammi: 10,
    kcal: 90, proteine: 0, carboidrati: 0, grassi: 10,
    allergeni: [],
  },
  {
    id: "grana", nome: "Scaglie di grana", grammi: 20,
    kcal: 82, proteine: 7, carboidrati: 0, grassi: 6,
    allergeni: ["latte"],
  },
  {
    id: "mandorle", nome: "Mandorle tostate", grammi: 25,
    kcal: 161, proteine: 6, carboidrati: 5, grassi: 13,
    allergeni: ["frutta a guscio"],
  },
  {
    id: "uovo-sodo", nome: "Uovo sodo", grammi: 55,
    kcal: 73, proteine: 7, carboidrati: 0, grassi: 5,
    allergeni: ["uova"],
  },
  {
    id: "proteina-extra", nome: "Porzione proteica maggiorata", grammi: 70,
    kcal: 103, proteine: 18, carboidrati: 1, grassi: 3,
    allergeni: [],
  },
  {
    id: "pane-integrale", nome: "Pane integrale", grammi: 60,
    kcal: 150, proteine: 5, carboidrati: 28, grassi: 2,
    allergeni: ["glutine"],
  },
  {
    id: "hummus", nome: "Hummus di ceci", grammi: 60,
    kcal: 115, proteine: 4, carboidrati: 9, grassi: 7,
    allergeni: ["sesamo"],
  },
];

/**
 * I 27 abbinamenti storici. `nome` e' l'id del piatto originale in lib/dishes.ts,
 * perche' e' la chiave con cui il test confronta la somma dei due elementi con i macro
 * di quel piatto; resta anche il modo di proporre il piatto gia' composto a chi non
 * vuole scegliere due volte.
 */
export const ABBINAMENTI: { nome: string; primo: string; secondo: string }[] = [
  { nome: "pollo-basmati-broccoli", primo: "primo-riso-basmati-broccoli", secondo: "secondo-pollo-piastra" },
  { nome: "salmone-quinoa-verdure", primo: "primo-quinoa-verdure-stagione", secondo: "secondo-salmone-forno" },
  { nome: "ragu-manzo-patate-dolci", primo: "primo-patate-dolci-spinaci", secondo: "secondo-ragu-manzo" },
  { nome: "tacchino-farro-zucchine", primo: "primo-farro-zucchine", secondo: "secondo-fesa-tacchino" },
  { nome: "merluzzo-patate-fagiolini", primo: "primo-patate-forno-fagiolini", secondo: "secondo-merluzzo-erbe" },
  { nome: "pollo-venere-peperoni", primo: "primo-riso-venere-peperoni", secondo: "secondo-pollo-agrumi" },
  { nome: "albumi-avocado-integrale", primo: "primo-avocado-pane-integrale", secondo: "secondo-frittata-albumi" },
  { nome: "orata-couscous-broccoletti", primo: "primo-cous-cous-broccoletti", secondo: "secondo-orata-forno" },
  { nome: "tofu-integrale-verdure", primo: "primo-riso-integrale-verdure", secondo: "secondo-tofu-zenzero" },
  { nome: "ceci-bulgur-melanzane", primo: "primo-bulgur-melanzane", secondo: "secondo-ceci-cumino" },
  { nome: "straccetti-manzo-rucola", primo: "primo-riso-basmati-rucola", secondo: "secondo-straccetti-manzo" },
  { nome: "tonno-patate-viola-asparagi", primo: "primo-patate-viola-asparagi", secondo: "secondo-tonno-sesamo" },
  { nome: "pollo-curry-jasmine-piselli", primo: "primo-riso-jasmine-piselli", secondo: "secondo-pollo-curry" },
  { nome: "maiale-sedano-rapa-cavolo", primo: "primo-sedano-rapa-cavolo", secondo: "secondo-filetto-maiale" },
  { nome: "gamberi-basmati-zucchine", primo: "primo-riso-basmati-zucchine", secondo: "secondo-gamberi-aglio" },
  { nome: "uova-patate-spinaci", primo: "primo-patate-rustiche-spinaci", secondo: "secondo-uova-biologiche" },
  { nome: "vitello-polenta-funghi", primo: "primo-polenta-taragna-funghi", secondo: "secondo-fettine-vitello" },
  { nome: "salmone-integrale-cavolo-nero", primo: "primo-riso-integrale-cavolo-nero", secondo: "secondo-salmone-vapore" },
  { nome: "pollo-pasta-integrale-pomodorini", primo: "primo-pasta-integrale-pomodorini", secondo: "secondo-pollo-straccetti" },
  { nome: "seitan-quinoa-broccoli", primo: "primo-quinoa-broccoli", secondo: "secondo-seitan-piastra" },
  { nome: "sgombro-patate-dolci-cime", primo: "primo-patate-dolci-cime-rapa", secondo: "secondo-sgombro-forno" },
  { nome: "tacchino-basmati-carote", primo: "primo-riso-basmati-carote", secondo: "secondo-tacchino-fette" },
  { nome: "lenticchie-riso-verdure", primo: "primo-riso-verdure-forno", secondo: "secondo-lenticchie-santo-stefano" },
  { nome: "manzo-couscous-zucca", primo: "primo-cous-cous-integrale-zucca", secondo: "secondo-spezzatino-manzo" },
  { nome: "tempeh-quinoa-edamame", primo: "primo-quinoa-edamame", secondo: "secondo-tempeh-tamari" },
  { nome: "albumi-ricotta-patate-asparagi", primo: "primo-patate-forno-asparagi", secondo: "secondo-albumi-ricotta" },
  { nome: "burger-lenticchie-tofu", primo: "primo-riso-verdure-stagione", secondo: "secondo-burger-lenticchie-tofu" },
];

const ELEMENTI_BY_ID: Record<string, Elemento> = Object.fromEntries(
  [...PRIMI, ...SECONDI].map((e) => [e.id, e]),
);

export function getElemento(id: string): Elemento | undefined {
  return ELEMENTI_BY_ID[id];
}

const EXTRA_BY_ID: Record<string, Extra> = Object.fromEntries(EXTRA.map((e) => [e.id, e]));

export function getExtra(id: string): Extra | undefined {
  return EXTRA_BY_ID[id];
}

/** URL Unsplash con larghezza esplicita: le foto sono il 90% del peso della pagina. */
export function elementoImg(e: Elemento, w = 800): string {
  return `https://images.unsplash.com/${e.img}?w=${w}&q=80&auto=format&fit=crop`;
}

/**
 * Fondo scala comune delle barre macro. Si calcola dal catalogo e non si scrive a mano:
 * un valore cablato mentirebbe al primo elemento aggiunto, e le barre di due schede
 * diverse smetterebbero di essere confrontabili a colpo d'occhio.
 */
export const MAX_MACRO: { proteine: number; carboidrati: number; grassi: number } = {
  proteine: Math.max(...[...PRIMI, ...SECONDI].map((e) => e.proteine)),
  carboidrati: Math.max(...[...PRIMI, ...SECONDI].map((e) => e.carboidrati)),
  grassi: Math.max(...[...PRIMI, ...SECONDI].map((e) => e.grassi)),
};
