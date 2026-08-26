import type { Dish } from "./types";

/**
 * Le 24 schiscette della settimana.
 *
 * Regola sui numeri: kcal e' SEMPRE uguale a P*4 + C*4 + G*9, senza arrotondamenti
 * di comodo. Il matcher somma i macro e mostra i totali: se il catalogo non tornasse,
 * un atleta se ne accorgerebbe alla prima somma e il servizio perderebbe credibilita.
 * Il test in lib/dishes.test.ts verifica la coerenza di tutte e 24 le righe.
 */
export const DISHES: Dish[] = [
  {
    id: "pollo-basmati-broccoli",
    nome: "Pollo alla piastra, riso basmati e broccoli",
    descrizione: "Sovracoscia disossata scottata sulla piastra, basmati sgranato, broccoli al vapore croccanti.",
    grammi: 480, kcal: 588, proteine: 52, carboidrati: 68, grassi: 12,
    obiettivo: ["massa", "equilibrio"], tag: ["carne", "senza-glutine"],
    img: "photo-1546069901-ba9599a7e63c", giorno: "lunedi",
  },
  {
    id: "salmone-quinoa-verdure",
    nome: "Salmone, quinoa e verdure di stagione",
    descrizione: "Filetto di salmone al forno, quinoa tricolore, verdure dell'orto abruzzese saltate.",
    grammi: 450, kcal: 636, proteine: 44, carboidrati: 52, grassi: 28,
    obiettivo: ["massa", "equilibrio"], tag: ["pesce", "senza-glutine"],
    img: "photo-1467003909585-2f8a72700288", giorno: "lunedi",
  },
  {
    id: "ragu-manzo-patate-dolci",
    nome: "Ragu di manzo, patate dolci e spinaci",
    descrizione: "Ragu di scottona cotto lento, patate dolci al forno, spinaci saltati in padella.",
    grammi: 500, kcal: 607, proteine: 48, carboidrati: 61, grassi: 19,
    obiettivo: ["massa", "equilibrio"], tag: ["carne", "senza-glutine"],
    img: "photo-1529042410759-befb1204b468", giorno: "lunedi",
  },
  {
    id: "tacchino-farro-zucchine",
    nome: "Tacchino, farro e zucchine grigliate",
    descrizione: "Fesa di tacchino a fette, farro perlato, zucchine grigliate con menta.",
    grammi: 470, kcal: 555, proteine: 50, carboidrati: 64, grassi: 11,
    obiettivo: ["equilibrio", "definizione"], tag: ["carne"],
    img: "photo-1607532941433-304659e8198a", giorno: "giovedi",
  },
  {
    id: "merluzzo-patate-fagiolini",
    nome: "Merluzzo, patate al forno e fagiolini",
    descrizione: "Filetto di merluzzo con crosta di erbe, patate al forno, fagiolini croccanti.",
    grammi: 460, kcal: 469, proteine: 42, carboidrati: 55, grassi: 9,
    obiettivo: ["definizione"], tag: ["pesce", "senza-glutine"],
    img: "photo-1476224203421-9ac39bcb3327", giorno: "giovedi",
  },
  {
    id: "pollo-venere-peperoni",
    nome: "Petto di pollo, riso venere e peperoni",
    descrizione: "Petto di pollo marinato agli agrumi, riso venere, peperoni arrostiti.",
    grammi: 480, kcal: 597, proteine: 54, carboidrati: 66, grassi: 13,
    obiettivo: ["massa", "equilibrio"], tag: ["carne", "senza-glutine"],
    img: "photo-1598515214211-89d3c73ae83b", giorno: "lunedi",
  },
  {
    id: "albumi-avocado-integrale",
    nome: "Frittata di albumi, avocado e pane integrale",
    descrizione: "Frittata di albumi con erba cipollina, avocado a fette, pane integrale a lievitazione naturale.",
    grammi: 380, kcal: 518, proteine: 38, carboidrati: 42, grassi: 22,
    obiettivo: ["definizione", "equilibrio"], tag: ["veg"],
    img: "photo-1490645935967-10de6ba17061", giorno: "giovedi",
  },
  {
    id: "orata-couscous-broccoletti",
    nome: "Orata al forno, cous cous e broccoletti",
    descrizione: "Orata dell'Adriatico sfilettata, cous cous al limone, broccoletti ripassati.",
    grammi: 450, kcal: 522, proteine: 41, carboidrati: 58, grassi: 14,
    obiettivo: ["equilibrio", "definizione"], tag: ["pesce"],
    img: "photo-1519708227418-c8fd9a32b7a2", giorno: "giovedi",
  },
  {
    id: "tofu-integrale-verdure",
    nome: "Tofu saltato, riso integrale e verdure croccanti",
    descrizione: "Tofu marinato allo zenzero e saltato al wok, riso integrale, verdure croccanti.",
    grammi: 470, kcal: 552, proteine: 30, carboidrati: 72, grassi: 16,
    obiettivo: ["equilibrio"], tag: ["veg", "senza-glutine"],
    img: "photo-1604908176997-125f25cc6f3d", giorno: "lunedi",
  },
  {
    id: "ceci-bulgur-melanzane",
    nome: "Ceci speziati, bulgur e melanzane",
    descrizione: "Ceci al cumino, bulgur, melanzane arrostite con tahina leggera.",
    grammi: 480, kcal: 551, proteine: 26, carboidrati: 78, grassi: 15,
    obiettivo: ["massa", "equilibrio"], tag: ["veg"],
    img: "photo-1512621776951-a57141f2eefd", giorno: "giovedi",
  },
  {
    id: "straccetti-manzo-rucola",
    nome: "Straccetti di manzo, riso basmati e rucola",
    descrizione: "Straccetti di manzo scottati, basmati, rucola e scaglie di grana.",
    grammi: 480, kcal: 608, proteine: 51, carboidrati: 65, grassi: 16,
    obiettivo: ["massa"], tag: ["carne", "senza-glutine"],
    img: "photo-1504674900247-0877df9cc836", giorno: "lunedi",
  },
  {
    id: "tonno-patate-viola-asparagi",
    nome: "Tonno scottato, patate viola e asparagi",
    descrizione: "Tarantello di tonno scottato al sesamo, patate viola, asparagi croccanti.",
    grammi: 440, kcal: 537, proteine: 46, carboidrati: 50, grassi: 17,
    obiettivo: ["definizione", "equilibrio"], tag: ["pesce", "senza-glutine"],
    img: "photo-1560717845-968823efbee1", giorno: "giovedi",
  },
  {
    id: "pollo-curry-jasmine-piselli",
    nome: "Pollo al curry leggero, riso jasmine e piselli",
    descrizione: "Bocconcini di pollo al curry senza panna, riso jasmine, piselli freschi.",
    grammi: 490, kcal: 602, proteine: 49, carboidrati: 70, grassi: 14,
    obiettivo: ["massa", "equilibrio"], tag: ["carne", "senza-glutine"],
    img: "photo-1555939594-58d7cb561ad1", giorno: "lunedi",
  },
  {
    id: "maiale-sedano-rapa-cavolo",
    nome: "Filetto di maiale, sedano rapa e cavolo",
    descrizione: "Filetto di maiale rosato, pure di sedano rapa, cavolo cappuccio saltato.",
    grammi: 450, kcal: 486, proteine: 47, carboidrati: 34, grassi: 18,
    obiettivo: ["definizione"], tag: ["carne", "senza-glutine"],
    img: "photo-1432139555190-58524dae6a55", giorno: "giovedi",
  },
  {
    id: "gamberi-basmati-zucchine",
    nome: "Gamberi, riso basmati e zucchine",
    descrizione: "Gamberi sgusciati saltati aglio e prezzemolo, basmati, zucchine a julienne.",
    grammi: 450, kcal: 502, proteine: 40, carboidrati: 63, grassi: 10,
    obiettivo: ["definizione", "equilibrio"], tag: ["pesce", "senza-glutine"],
    img: "photo-1559847844-5315695dadae", giorno: "giovedi",
  },
  {
    id: "uova-patate-spinaci",
    nome: "Uova, patate rustiche e spinaci saltati",
    descrizione: "Uova biologiche, patate rustiche al rosmarino, spinaci saltati all'aglio.",
    grammi: 420, kcal: 509, proteine: 32, carboidrati: 48, grassi: 21,
    obiettivo: ["equilibrio"], tag: ["veg", "senza-glutine"],
    img: "photo-1540189549336-e6e99c3679fe", giorno: "lunedi",
  },
  {
    id: "vitello-polenta-funghi",
    nome: "Vitello, polenta taragna e funghi",
    descrizione: "Fettine di vitello, polenta taragna leggera, funghi trifolati.",
    grammi: 470, kcal: 557, proteine: 45, carboidrati: 56, grassi: 17,
    obiettivo: ["equilibrio"], tag: ["carne", "senza-glutine"],
    img: "photo-1594834749740-74b3f6764be4", giorno: "giovedi",
  },
  {
    id: "salmone-integrale-cavolo-nero",
    nome: "Salmone, riso integrale e cavolo nero",
    descrizione: "Salmone al vapore, riso integrale, cavolo nero ripassato con aglio.",
    grammi: 470, kcal: 646, proteine: 43, carboidrati: 60, grassi: 26,
    obiettivo: ["massa"], tag: ["pesce", "senza-glutine"],
    img: "photo-1580476262798-bddd9f4b7369", giorno: "lunedi",
  },
  {
    id: "pollo-pasta-integrale-pomodorini",
    nome: "Pollo, pasta integrale e pomodorini",
    descrizione: "Pollo a straccetti, pasta integrale trafilata al bronzo, pomodorini confit.",
    grammi: 500, kcal: 648, proteine: 53, carboidrati: 82, grassi: 12,
    obiettivo: ["massa"], tag: ["carne"],
    img: "photo-1473093295043-cdd812d0e601", giorno: "lunedi",
  },
  {
    id: "seitan-quinoa-broccoli",
    nome: "Seitan alla piastra, quinoa e broccoli",
    descrizione: "Seitan artigianale alla piastra, quinoa, broccoli al vapore.",
    grammi: 450, kcal: 476, proteine: 34, carboidrati: 58, grassi: 12,
    obiettivo: ["definizione", "equilibrio"], tag: ["veg"],
    img: "photo-1543339308-43e59d6b73a6", giorno: "giovedi",
  },
  {
    id: "sgombro-patate-dolci-cime",
    nome: "Sgombro, patate dolci e cime di rapa",
    descrizione: "Sgombro dell'Adriatico al forno, patate dolci, cime di rapa saltate.",
    grammi: 450, kcal: 580, proteine: 39, carboidrati: 52, grassi: 24,
    obiettivo: ["equilibrio", "massa"], tag: ["pesce", "senza-glutine"],
    img: "photo-1512003867696-6d5ce6835040", giorno: "giovedi",
  },
  {
    id: "tacchino-basmati-carote",
    nome: "Tacchino, riso basmati e carote all'arancia",
    descrizione: "Tacchino a fette, basmati, carote glassate all'arancia.",
    grammi: 490, kcal: 586, proteine: 52, carboidrati: 72, grassi: 10,
    obiettivo: ["massa", "definizione"], tag: ["carne", "senza-glutine"],
    img: "photo-1516684732162-798a0062be99", giorno: "lunedi",
  },
  {
    id: "lenticchie-riso-verdure",
    nome: "Lenticchie, riso e verdure al forno",
    descrizione: "Lenticchie di Santo Stefano, riso, verdure di stagione al forno.",
    grammi: 500, kcal: 565, proteine: 28, carboidrati: 84, grassi: 13,
    obiettivo: ["massa", "equilibrio"], tag: ["veg", "senza-glutine"],
    img: "photo-1547592180-85f173990554", giorno: "giovedi",
  },
  {
    id: "manzo-couscous-zucca",
    nome: "Manzo, cous cous integrale e zucca",
    descrizione: "Spezzatino di manzo cotto lento, cous cous integrale, zucca arrostita.",
    grammi: 490, kcal: 607, proteine: 50, carboidrati: 68, grassi: 15,
    obiettivo: ["massa", "equilibrio"], tag: ["carne"],
    img: "photo-1611270629569-8b357cb88da9", giorno: "lunedi",
  },

  /* I tre piatti qui sotto esistono per una ragione precisa. Escludere carne e
     pesce e' un interruttore a un clic nel configuratore, e con i soli sei piatti
     veg iniziali (31 g di proteine di media contro un bersaglio di 45) il box
     usciva sistematicamente a -28% sulle proteine. Tempeh, albumi con ricotta e
     il burger di lenticchie e tofu sono le tre leve vere per fare un piatto
     vegetariano davvero proteico: senza di loro la promessa "sui tuoi macro"
     vale solo per chi mangia carne. */
  {
    id: "tempeh-quinoa-edamame",
    nome: "Tempeh marinato, quinoa e edamame",
    descrizione: "Tempeh marinato al tamari e scottato, quinoa, edamame e verdure croccanti.",
    grammi: 470, kcal: 594, proteine: 52, carboidrati: 56, grassi: 18,
    obiettivo: ["massa", "definizione"], tag: ["veg", "senza-glutine"],
    img: "photo-1512058564366-18510be2db19", giorno: "lunedi",
  },
  {
    id: "albumi-ricotta-patate-asparagi",
    nome: "Albumi e ricotta, patate e asparagi",
    descrizione: "Albumi montati con ricotta vaccina, patate al forno, asparagi croccanti.",
    grammi: 450, kcal: 518, proteine: 50, carboidrati: 48, grassi: 14,
    obiettivo: ["definizione", "equilibrio"], tag: ["veg", "senza-glutine"],
    img: "photo-1466637574441-749b8f19452f", giorno: "giovedi",
  },
  {
    id: "burger-lenticchie-tofu",
    nome: "Burger di lenticchie e tofu, riso e verdure",
    descrizione: "Burger di lenticchie e tofu affumicato, riso, verdure di stagione al forno.",
    grammi: 480, kcal: 567, proteine: 44, carboidrati: 64, grassi: 15,
    obiettivo: ["equilibrio", "massa"], tag: ["veg", "senza-glutine"],
    img: "photo-1505576399279-565b52d4ac71", giorno: "giovedi",
  },
];

export const DISHES_BY_ID: Record<string, Dish> = Object.fromEntries(
  DISHES.map((d) => [d.id, d]),
);

export function getDish(id: string): Dish | undefined {
  return DISHES_BY_ID[id];
}

/** URL Unsplash con larghezza esplicita: le foto dei piatti sono il 90% del peso della pagina. */
export function dishImg(dish: Dish, w = 800): string {
  return `https://images.unsplash.com/${dish.img}?w=${w}&q=80&auto=format&fit=crop`;
}
