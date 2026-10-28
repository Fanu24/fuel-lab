import type { Piatto } from "./catalogo";

/** Aggiornamento cliente del 15 ottobre 2026. Nessuna stima nutrizionale
 * pubblicata finché ricette, condimenti e rese non sono completi. Gli zeri
 * sono segnaposto interni e non valori da mostrare o usare per suggerimenti. */
function nuovo(dati: Omit<Piatto, "grammi" | "proteine" | "carboidrati" | "grassi" | "kcal" | "novita">): Piatto {
  return { ...dati, grammi: 0, proteine: 0, carboidrati: 0, grassi: 0, kcal: 0, novita: true };
}

export const PIATTI_OTTOBRE: Piatto[] = [
  nuovo({
    id: "pollo-curry-riso-carote", nome: "Pollo al curry, basmati e carote",
    descrizione: "Pollo al curry, riso basmati bianco e carote.",
    img: "/foto/fuel-20261015-v2-pollo-curry-riso-carote.webp", tag: ["carne"], allergeni: [], allergeniDaConfermare: true, allenamento: "entrambi",
    ingredienti: [{ nome: "Riso basmati bianco", grammi: 100, nota: "peso cotto" }, { nome: "Pollo", grammi: 150 }, { nome: "Carote", grammi: 200 }, { nome: "Curry", nota: "miscela e quantità da confermare" }],
    notaRicetta: "Quantità della ricetta del cliente; riso pesato cotto. Miscela di curry, condimenti e relativi allergeni da confermare con Matteo.",
    motivo: "Una delle nuove proposte di Matteo, con pollo al curry, basmati bianco e carote. Ingredienti e disponibilità si confermano prima dell’ordine.",
  }),
  nuovo({
    id: "pollo-peperoni-anacardi", nome: "Pollo, peperoni e anacardi",
    descrizione: "Bocconcini di pollo con peperoni e anacardi.",
    img: "/foto/fuel-20261015-v2-pollo-peperoni-anacardi.webp", tag: ["carne"], allergeni: ["frutta a guscio"], allenamento: "pesi",
    ingredienti: [{ nome: "Pollo", grammi: 150 }, { nome: "Peperoni", grammi: 200 }, { nome: "Anacardi", grammi: 50 }],
    notaRicetta: "Quantità indicate dal cliente. Condimenti e preparazione si confermano con Matteo.",
    motivo: "Pollo e peperoni con la consistenza degli anacardi: una nuova proposta per variare i pasti della settimana, da concordare con Matteo.",
  }),
  nuovo({
    id: "frittata-verdure-campo", nome: "Frittata di verdure di campo",
    descrizione: "Uova, verdure di campo e parmigiano, in una frittata dorata.",
    img: "/foto/fuel-20261015-v2-frittata-verdure-campo.webp", tag: ["veg"], allergeni: ["uova", "latte"], allenamento: "pesi",
    ingredienti: [{ nome: "Uova", nota: "4" }, { nome: "Parmigiano", grammi: 50 }, { nome: "Verdure di campo", grammi: 200 }],
    notaRicetta: "Quantità della ricetta del cliente. Tipologia delle verdure e condimenti da confermare con Matteo.",
    motivo: "La frittata unisce uova e verdure di campo con il gusto del parmigiano. È una delle nuove proposte senza carne del menu di Matteo.",
  }),
  nuovo({
    id: "tagliatelle-funghi-ricotta", nome: "Tagliatelle ai funghi e crema di ricotta",
    descrizione: "Tagliatelle con funghi nell’impasto, funghi e crema di ricotta al parmigiano.",
    img: "/foto/fuel-20261015-v2-tagliatelle-funghi-ricotta.webp", tag: ["veg"], allergeni: ["glutine", "uova", "latte"], allenamento: "cardio",
    ingredienti: [{ nome: "Farina", grammi: 100, nota: "per l’impasto" }, { nome: "Funghi secchi", grammi: 30 }, { nome: "Uovo", nota: "1" }, { nome: "Funghi", grammi: 150 }, { nome: "Ricotta", grammi: 70 }, { nome: "Parmigiano", grammi: 30 }],
    notaRicetta: "La farina è il peso dell’ingrediente per l’impasto, non della pasta cotta. Condimenti e resa finale da confermare.",
    motivo: "Funghi nell’impasto e nel condimento, con ricotta e parmigiano: una pasta dal gusto pieno, da scegliere per il proprio menu settimanale.",
  }),
  nuovo({
    id: "cotoletta-melanzane-yogurt", nome: "Cotoletta di melanzane con yogurt",
    descrizione: "Melanzane dorate con uovo e farina, accompagnate da yogurt.",
    img: "/foto/fuel-20261015-v2-cotoletta-melanzane-yogurt.webp", tag: ["veg"], allergeni: ["glutine", "uova", "latte"], allenamento: "entrambi",
    ingredienti: [{ nome: "Melanzana", nota: "1" }, { nome: "Uovo", nota: "1" }, { nome: "Farina", grammi: 20 }, { nome: "Yogurt", grammi: 70 }],
    notaRicetta: "La ricetta indica una melanzana: peso, condimenti e modalità di cottura da confermare con Matteo.",
    motivo: "Una proposta senza carne con melanzana, uovo, farina e yogurt. La preparazione e la disponibilità si concordano direttamente con Matteo.",
  }),
  nuovo({
    id: "piadina-turca", nome: "Piadina turca",
    descrizione: "Piadina con carne macinata, pomodori secchi, olive, erbe e cipolla.",
    img: "/foto/fuel-20261015-v2-piadina-turca.webp", tag: ["carne"], allergeni: ["glutine"], allenamento: "entrambi",
    ingredienti: [{ nome: "Farina", grammi: 100, nota: "per l’impasto" }, { nome: "Acqua", grammi: 60 }, { nome: "Carne macinata", grammi: 200 }, { nome: "Pomodori secchi", nota: "quantità da confermare" }, { nome: "Olive", nota: "quantità da confermare" }, { nome: "Erbe", nota: "quantità da confermare" }, { nome: "Cipolla", nota: "quantità da confermare" }],
    notaRicetta: "Farina e acqua sono le dosi dell’impasto. Tipo di carne, condimenti e quantità di pomodori secchi, olive, erbe e cipolla da confermare.",
    motivo: "Una piadina con ripieno di carne macinata, pomodori secchi, olive, erbe e cipolla: la nuova proposta di Matteo ispirata ai sapori turchi.",
  }),
];
