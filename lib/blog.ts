import { APPROFONDIMENTI } from "./blog-approfondimenti";
import { INDIRIZZO, elencoZone } from "./sito";

/* =========================================================================
   Il blog di FUEL LAB: dati degli articoli, categorie e piccoli calcoli.

   Nei testi (paragrafi, punti, FAQ, celle di tabella) un link interno si
   scrive come in Markdown: [testo](/percorso). La pagina lo trasforma in un
   <Link>, il JSON-LD lo riduce a testo semplice e lib/blog.test.ts controlla
   che ogni percorso porti a una pagina che esiste davvero.

   Regole editoriali: Matteo è un cuoco, non un nutrizionista. Nessuna promessa
   medica o di dimagrimento, nessun numero senza fonte verificata, apostrofi
   tipografici (’) come nel resto del sito.
   ========================================================================= */

export type TabellaArticolo = {
  intestazioni: string[];
  righe: string[][];
  nota?: string;
};

export type SezioneArticolo = {
  titolo: string;
  paragrafi: string[];
  punti?: string[];
  tabella?: TabellaArticolo;
  /** id del catalogo: la pagina disegna una tabella con i valori aggiornati dei piatti */
  piatti?: string[];
  /** paragrafi che seguono elenco e tabella */
  dopo?: string[];
};

export type FonteArticolo = { titolo: string; url: string };

export type CategoriaId = "allenamento" | "meal-prep" | "lavoro-studio" | "etichette-nutrienti" | "pescara-abruzzo";

export type Categoria = {
  id: CategoriaId;
  /** nome breve per etichette, filtri e breadcrumb */
  nome: string;
  /** H1 della pagina di categoria */
  titolo: string;
  /** <title> della pagina di categoria, senza il marchio */
  titoloSeo: string;
  descrizione: string;
  introduzione: string;
};

export type FotoBlog = { src: string; alt: string; larghezza: number; altezza: number };

export type Articolo = {
  slug: string;
  /** H1 e headline del JSON-LD */
  titolo: string;
  /** titolo per <title> e anteprime quando l’H1 è troppo lungo */
  titoloSeo?: string;
  descrizione: string;
  categoria: CategoriaId;
  parolaChiave?: string;
  foto: ChiaveFotoBlog;
  /** pubblicazione, ISO aaaa-mm-gg */
  data: string;
  /** ultimo aggiornamento sostanziale, ISO aaaa-mm-gg */
  aggiornato?: string;
  /** minuti di lettura dichiarati; se assenti si calcolano dalle parole */
  minuti?: number;
  /** id dei piatti del catalogo collegati all’articolo */
  piatti?: string[];
  /** slug di altri articoli da proporre in fondo */
  correlati?: string[];
  introduzione: string;
  sezioni: SezioneArticolo[];
  faq: { domanda: string; risposta: string }[];
  fonti?: FonteArticolo[];
};

/** Data di pubblicazione della prima serie del blog. */
export const DATA_BLOG = "2026-09-27";

export const MARCHIO = " · FUEL LAB";

/** L’articolo in evidenza nell’indice del blog. */
export const SLUG_IN_EVIDENZA = "abbinare-pasti-tipo-allenamento";

/* Foto di repertorio già ospitate in /public/foto. L’alt descrive quello che
   si vede, non quello che vorremmo far credere: sono foto illustrative. */
export const FOTO_BLOG = {
  pesi: { src: "/foto/photo-1574680096145-d05b474e2155.webp", alt: "Atleta di spalle con il bilanciere appoggiato sulle spalle", larghezza: 1200, altezza: 801 },
  presa: { src: "/foto/photo-1549060279-7e168fcee0c2.webp", alt: "Mano che stringe il bilanciere carico, in primo piano", larghezza: 1200, altezza: 800 },
  distensione: { src: "/foto/photo-1541534741688-6078c6bfb5c5.webp", alt: "Atleta in spinta sopra la testa con il bilanciere", larghezza: 1200, altezza: 801 },
  stacco: { src: "/foto/photo-1605296867304-46d5465a13f1.webp", alt: "Atleta chinato sul bilanciere prima di uno stacco, in una palestra al buio", larghezza: 1200, altezza: 800 },
  corsa: { src: "/foto/photo-1552674605-db6ffd4facb5.webp", alt: "Tre persone che corrono in controluce all’alba", larghezza: 1200, altezza: 800 },
  schiscette: { src: "/foto/photo-1498837167922-ddd27525d352.webp", alt: "Vaschette di verdure, legumi e cereali freschi divise per ingrediente", larghezza: 1200, altezza: 800 },
  tagliere: { src: "/foto/photo-1466637574441-749b8f19452f.webp", alt: "Tagliere con avocado, uova, pomodorini, funghi e cipollotti, prima della preparazione", larghezza: 1200, altezza: 1200 },
  cuoco: { src: "/foto/photo-1577219491135-ce391730fb2c.webp", alt: "Un cuoco impiatta con la pinza sotto le lampade della cucina", larghezza: 1200, altezza: 1847 },
  cucina: { src: "/foto/photo-1556910103-1c02745aae4d.webp", alt: "Persone che cucinano insieme nella cucina di casa", larghezza: 1200, altezza: 800 },
  barattolo: { src: "/foto/photo-1505576399279-565b52d4ac71.webp", alt: "Insalata a strati in un barattolo di vetro, pronta da portare via", larghezza: 1200, altezza: 1800 },
  polpette: { src: "/foto/photo-1529042410759-befb1204b468.webp", alt: "Polpette dorate su un letto di foglie verdi", larghezza: 1200, altezza: 1807 },
  uova: { src: "/foto/photo-1590412200988-a436970781fa.webp", alt: "Uova cotte in padella nel sugo di pomodoro e peperoni", larghezza: 1200, altezza: 1600 },
  carne: { src: "/foto/photo-1558030006-450675393462.webp", alt: "Carne alla griglia tagliata a fette su un tagliere", larghezza: 900, altezza: 506 },
  spremuta: { src: "/foto/photo-1613478223719-2ab802602423.webp", alt: "Bicchiere di spremuta e arance tagliate su un tavolo di legno", larghezza: 900, altezza: 675 },
  couscous: { src: "/foto/photo-1512058564366-18510be2db19.webp", alt: "Padella di cous cous con verdure, erbe e spicchi di limone", larghezza: 1200, altezza: 799 },
  ciotola: { src: "/foto/photo-1547496502-affa22d38842.webp", alt: "Ciotola di verdure, avocado e semi su fondo scuro", larghezza: 1200, altezza: 1029 },
  ciotole: { src: "/foto/photo-1547592180-85f173990554.webp", alt: "Ciotole con verdure, legumi e salse su un tavolo chiaro", larghezza: 900, altezza: 600 },
  bowl: { src: "/foto/photo-1512621776951-a57141f2eefd.webp", alt: "Piatto di verdure fresche, ceci, avocado e patata dolce", larghezza: 1200, altezza: 800 },
  riso: { src: "/foto/photo-1516684732162-798a0062be99.webp", alt: "Ciotola di riso bianco accanto a una tazza scura", larghezza: 900, altezza: 1350 },
  risoBianco: { src: "/foto/photo-1536304993881-ff6e9eefa2a6.webp", alt: "Ciotole di riso bianco cotto", larghezza: 900, altezza: 600 },
  verdure: { src: "/foto/photo-1518843875459-f738682238a6.webp", alt: "Verdure crude appoggiate su un fondo nero, prima della cottura", larghezza: 1200, altezza: 827 },
  insalata: { src: "/foto/photo-1540420773420-3366772f4999.webp", alt: "Insalata colorata con pomodori, ravanelli e cavolo viola", larghezza: 900, altezza: 1361 },
  maiale: { src: "/foto/photo-1432139555190-58524dae6a55.webp", alt: "Costoletta di maiale con patate e verdure nel piatto", larghezza: 1200, altezza: 795 },
  pomodori: { src: "/foto/photo-1592924357228-91a4daadcfea.webp", alt: "Pomodori maturi ancora attaccati al ramo", larghezza: 900, altezza: 1295 },
  noodles: { src: "/foto/photo-1526318896980-cf78c088247c.webp", alt: "Ciotola di noodles con uovo, presi con le bacchette", larghezza: 1200, altezza: 1800 },
  penne: { src: "/foto/photo-1621996346565-e3dbc646d9a9.webp", alt: "Piatto di penne al sugo di pomodoro", larghezza: 900, altezza: 900 },
} satisfies Record<string, FotoBlog>;

export type ChiaveFotoBlog = keyof typeof FOTO_BLOG;

export const CATEGORIE: Categoria[] = [
  {
    id: "allenamento",
    nome: "Allenamento e pasti",
    titolo: "Cosa mangiare quando ti alleni",
    titoloSeo: "Alimentazione e allenamento: guide pratiche",
    descrizione:
      "Guide pratiche su cosa mangiare prima e dopo cardio, pesi, calcetto e CrossFit: tempi, esempi di piatti, idratazione e recupero, senza promesse miracolose.",
    introduzione:
      "Pasti e allenamento vanno d’accordo quando sai che cosa mangiare, quando e perché. In queste guide trovi le indicazioni delle linee guida e delle società scientifiche dello sport, tradotte in esempi da tavola: il pasto prima della corsa, la cena dopo i pesi, l’idratazione con il caldo. Sono indicazioni generali di una cucina, non piani personali.",
  },
  {
    id: "meal-prep",
    nome: "Meal prep e organizzazione",
    titolo: "Meal prep e organizzazione della settimana",
    titoloSeo: "Meal prep e organizzazione: guide pratiche",
    descrizione:
      "Meal prep senza stress: come pianificare la settimana, fare la spesa, conservare i pasti preparati e usare i piatti già composti nei giorni più pieni.",
    introduzione:
      "Il meal prep non è una dieta: è il modo di togliere decisioni dai giorni più pieni. Qui trovi metodi per pianificare pranzi e cene, schemi di settimana tipo, consigli di spesa e di conservazione, e il ruolo dei piatti già composti quando cucinare non è possibile.",
  },
  {
    id: "lavoro-studio",
    nome: "Lavoro e studio",
    titolo: "Pranzo al lavoro e all’università",
    titoloSeo: "Pranzo al lavoro e all’università: guide",
    descrizione:
      "Pranzo in ufficio e all’università tra Pescara e Chieti: come organizzarlo, cosa portare, come conservarlo e come conciliarlo con l’allenamento serale.",
    introduzione:
      "La pausa pranzo è spesso il pasto più improvvisato della giornata. Queste guide sono per chi lavora in ufficio, studia tra Pescara e Chieti o si sposta molto: cosa mettere nel contenitore, come trasportarlo in sicurezza e come arrivare all’allenamento della sera senza saltare i pasti.",
  },
  {
    id: "etichette-nutrienti",
    nome: "Macro ed etichette",
    titolo: "Macro, proteine ed etichette",
    titoloSeo: "Macro, proteine ed etichette: guide pratiche",
    descrizione:
      "Macro, proteine ed etichette spiegati semplici: come leggere i valori dei piatti, quante proteine per pasto, come comporre un piatto vario e confrontare.",
    introduzione:
      "Proteine, carboidrati, grassi, valori per 100 grammi o per porzione: i numeri aiutano a scegliere solo se sai leggerli. In queste guide spieghiamo le etichette e i macro dei piatti, i riferimenti ufficiali sulle proteine e come variare le fonti nel menu, sempre con i limiti di un’informazione generale.",
  },
  {
    id: "pescara-abruzzo",
    nome: "Pescara e Abruzzo",
    titolo: "Cucina a Pescara e in Abruzzo",
    titoloSeo: "Cucina a Pescara e in Abruzzo: guide",
    descrizione:
      "Cucina a Pescara e in Abruzzo per chi si allena: tradizione in chiave fit, ingredienti di stagione, cibo d’asporto e cosa chiedere a chi consegna i pasti.",
    introduzione:
      "FUEL LAB cucina a Pescara, in Via del Santuario 214. In questa sezione raccogliamo le guide legate al territorio: la tradizione abruzzese rivista per chi si allena, gli ingredienti di stagione, la cucina d’asporto e le domande da fare prima di scegliere un servizio di consegna pasti in zona.",
  },
];

/* Fonti verificate (settembre 2026). Si citano solo per quello che dicono
   davvero: numeri e frasi dei testi vengono da questi documenti. */
const FONTI = {
  creaLineeGuida: {
    titolo: "CREA · Linee guida per una sana alimentazione (2018)",
    url: "https://www.crea.gov.it/web/alimenti-e-nutrizione/-/linee-guida-per-una-sana-alimentazione-2018",
  },
  creaEtichette: {
    titolo: "CREA · Come si leggono le etichette",
    url: "https://sapermangiare.an.crea.gov.it/518/come-si-leggono-le-etichette.html",
  },
  issnProteine: {
    titolo: "ISSN · Position stand: protein and exercise (Jäger et al., 2017)",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/",
  },
  issnTiming: {
    titolo: "ISSN · Position stand: nutrient timing (Kerksick et al., 2017)",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5596471/",
  },
  efsaProteine: {
    titolo: "EFSA · Valori di riferimento per le proteine (2012)",
    url: "https://www.efsa.europa.eu/en/press/news/120209",
  },
  efsaAcqua: {
    titolo: "EFSA · Valori di riferimento per acqua, carboidrati, fibre e grassi (2010)",
    url: "https://www.efsa.europa.eu/en/press/news/nda100326",
  },
  acsmLiquidi: {
    titolo: "ACSM · Position stand: exercise and fluid replacement (2007)",
    url: "https://pubmed.ncbi.nlm.nih.gov/17277604/",
  },
  acsmPrestazione: {
    titolo: "ACSM, Academy of Nutrition and Dietetics, Dietitians of Canada · Nutrition and athletic performance (2016)",
    url: "https://pubmed.ncbi.nlm.nih.gov/26891166/",
  },
  saluteCaldo: {
    titolo: "Ministero della Salute · Ondate di calore, dieci consigli utili",
    url: "https://www.salute.gov.it/new/it/tema/ondate-di-calore/dieci-consigli-utili/",
  },
  saluteSicurezza: {
    titolo: "Ministero della Salute · Sicurezza domestica degli alimenti",
    url: "https://www.salute.gov.it/new/it/tema/sistema-di-controllo-della-sicurezza-alimentare/sicurezza-domestica-degli-alimenti/",
  },
  abruzzoPallotte: {
    titolo: "Regione Abruzzo, Abruzzo Turismo · Pallotte cac’e ove: un disciplinare",
    url: "https://www.abruzzoturismo.it/it/magazine/pallotte-cace-ove-un-disciplinare-uno-dei-piatti-piu-gustosi-dabruzzo",
  },
  saluteFreddo: {
    titolo: "Ministero della Salute · Conservare gli alimenti col freddo (FAQ)",
    url: "https://www.salute.gov.it/new/it/faq/faq-conservare-gli-alimenti-col-freddo/",
  },
  ue1169: {
    titolo: "Regolamento (UE) n. 1169/2011 · Informazioni sugli alimenti ai consumatori",
    url: "https://eur-lex.europa.eu/legal-content/IT/TXT/HTML/?uri=CELEX:32011R1169",
  },
  ceIndicazioni: {
    titolo: "Commissione europea · Nutrition claims, le indicazioni nutrizionali",
    url: "https://food.ec.europa.eu/food-safety/labelling-and-nutrition/nutrition-and-health-claims/nutrition-claims_en",
  },
  harvardPiatto: {
    titolo: "Harvard T.H. Chan School of Public Health · Healthy Eating Plate",
    url: "https://nutritionsource.hsph.harvard.edu/healthy-eating-plate/",
  },
  issNutrizione: {
    titolo: "ISS · Nutrizione",
    url: "https://www.iss.it/nutrizione",
  },
} satisfies Record<string, FonteArticolo>;

export const ARTICOLI: Articolo[] = [
  /* ---- seconda serie: guide approfondite ---- */
  {
    slug: "abbinare-pasti-tipo-allenamento",
    titolo: "Come abbinare i pasti al tipo di allenamento: cardio, pesi e riposo",
    titoloSeo: "Come abbinare i pasti al tipo di allenamento",
    descrizione: "Come abbinare i pasti al tipo di allenamento: più carboidrati nei giorni di cardio, proteine e carboidrati moderati con i pesi, flessibilità nel riposo.",
    categoria: "allenamento",
    parolaChiave: "abbinare i pasti all’allenamento",
    foto: "schiscette",
    data: DATA_BLOG,
    aggiornato: "2026-10-01",
    piatti: ["riso-julien-pollo-teriyaki", "maiale-senape-spinaci", "uova-purgatorio-peperoni"],
    correlati: ["cosa-mangiare-prima-di-correre", "cosa-mangiare-dopo-allenamento-pesi", "settimana-tipo-allenamento-alimentazione"],
    introduzione:
      "Nella cucina di FUEL LAB c’è una regola semplice, la stessa che usa il compositore della settimana: nei giorni di cardio un piatto più ricco di carboidrati, nei giorni di pesi un piatto con le proteine in primo piano e i carboidrati in quantità più moderata, nei giorni di riposo il piatto più leggero. Non è una dieta: è un criterio per scegliere che cosa mettere nel contenitore. Qui spieghiamo da dove viene, come applicarlo nella pratica e dove si ferma.",
    sezioni: [
      {
        titolo: "La regola in tre righe",
        paragrafi: [
          "È la domanda che torna più spesso a chi si allena: che cosa mangio nei giorni di corsa e che cosa nei giorni di palestra? La risposta di cucina è questa tabella.",
        ],
        tabella: {
          intestazioni: ["Giornata", "Cosa privilegiare", "Perché"],
          righe: [
            ["Cardio", "Carboidrati facili da digerire, una fonte proteica, condimenti leggeri", "I carboidrati sono il carburante principale degli sforzi lunghi o intensi"],
            ["Pesi", "Fonte proteica ben presente, carboidrati in quantità moderata, verdure", "Proteine e carboidrati dopo la seduta sostengono la sintesi proteica"],
            ["Riposo", "Un piatto completo e meno denso, con verdure e legumi quando piacciono", "Meno carico da recuperare, ma nessun digiuno forzato"],
          ],
          nota: "Criterio organizzativo di una cucina, non prescrizione nutrizionale.",
        },
        dopo: [
          "Non è un’invenzione: le linee guida CREA per una sana alimentazione indicano, per chi fa sport, pasti ricchi di carboidrati prima degli sforzi e, dopo un allenamento di resistenza muscolare, pasti ad alto contenuto di carboidrati con buone quote di proteine entro due ore. Le società scientifiche dello sport, come l’American College of Sports Medicine insieme ai dietisti statunitensi e canadesi, danno indicazioni su tipo, quantità e tempi di cibo e liquidi in base all’allenamento.",
        ],
      },
      {
        titolo: "Giorni di cardio: più carboidrati",
        paragrafi: [
          "Corsa, bici, nuoto, spinning, circuiti lunghi: nel cardio i muscoli consumano soprattutto glicogeno, cioè carboidrati di riserva. Per questo, nei giorni in cui corri o pedali, il piatto che precede o segue la seduta dovrebbe avere una buona quota di pasta, riso, noodles, patate o pane.",
          "Nel menu, il [riso con carote, zucchine e pollo teriyaki](/menu/riso-julien-pollo-teriyaki) è il piatto con più carboidrati, e unisce una fonte proteica: per questo è indicato sia per il cardio sia per i pesi. I [noodles sesamo e maiale in agrodolce](/menu/noodles-sesamo-maiale) sono l’altra scelta da giorno di cardio, dal sapore più deciso.",
          "Conta anche l’orario. Se corri la sera, il pranzo è il pasto su cui puntare; se corri la mattina presto, contano la cena del giorno prima e una colazione leggera. Ne parliamo nella guida su [cosa mangiare prima di correre](/blog/cosa-mangiare-prima-di-correre).",
        ],
      },
      {
        titolo: "Giorni di pesi: proteine davanti, carboidrati dosati",
        paragrafi: [
          "Dopo una seduta di forza il piatto mette la fonte proteica al centro. Le posizioni dell’International Society of Sports Nutrition (ISSN) indicano come riferimento circa 20–40 grammi di proteine per pasto, distribuiti nella giornata ogni tre o quattro ore.",
          "I carboidrati restano, in quantità più moderata rispetto ai giorni di cardio: servono anche loro al recupero. Nel menu il [maiale alla senape con spinaci e patate novelle](/menu/maiale-senape-spinaci) ha il rapporto più alto tra proteine e carboidrati; le [uova alla purgatorio con sugo di peperoni](/menu/uova-purgatorio-peperoni) sono la versione più leggera; le [pallotte cacio e ova fit](/menu/pallotte-cacio-ovo) portano in tavola la tradizione abruzzese.",
          "Per esempi concreti di pasto dopo la palestra, leggi la guida su [cosa mangiare dopo l’allenamento con i pesi](/blog/cosa-mangiare-dopo-allenamento-pesi); per i piatti pronti con le proteine in primo piano c’è la pagina sui [pasti proteici a Pescara](/pasti-proteici-pescara).",
        ],
      },
      {
        titolo: "Giorni di riposo: flessibilità",
        paragrafi: [
          "Il riposo non è un giorno di digiuno. Le linee guida CREA ricordano che chi si allena con regolarità a livello amatoriale può seguire le indicazioni valide per tutti, mangiando un po’ di più nei giorni di impegno: nei giorni senza allenamento si torna semplicemente alla normalità.",
          "In pratica è il giorno ideale per un piatto completo e meno denso, per più verdure e per i legumi, che a ridosso di un allenamento possono dare fastidio per la quantità di fibra. Il compositore propone come punto di partenza il piatto meno calorico tra quelli adatti, ma appetito e abitudini vengono prima.",
        ],
      },
      {
        titolo: "Come ragiona il compositore",
        paragrafi: [
          "Quando nel [compositore della settimana](/settimana) segni un giorno, la proposta segue regole precise e sempre uguali, così puoi prevederla e correggerla:",
        ],
        punti: [
          "Cardio: in cima i piatti indicati per il cardio, ordinati per quanto pesano i carboidrati sull’energia totale del piatto.",
          "Pesi: in cima i piatti indicati per i pesi, ordinati per rapporto tra proteine e carboidrati.",
          "Riposo: il piatto meno calorico tra quelli da pesi o da cardio e pesi.",
          "I piatti ‘cardio e pesi’ sono la seconda scelta di entrambe le giornate; nessun piatto compare più di tre volte a settimana.",
        ],
        piatti: ["riso-julien-pollo-teriyaki", "noodles-sesamo-maiale", "gnocchetti-sugo-ricotta", "maiale-senape-spinaci", "pallotte-cacio-ovo", "uova-purgatorio-peperoni"],
        dopo: ["Ogni proposta si può trascinare, sostituire o lasciare vuota: il compositore suggerisce, sei tu a decidere."],
      },
      {
        titolo: "Due giornate a confronto",
        paragrafi: [
          "Martedì, corsa di 50 minuti alle 19. A pranzo, alle 13, un piatto ricco di carboidrati come il riso con pollo teriyaki; verso le 17 una merenda semplice, pane e marmellata o un frutto; la sera una cena completa senza fritture. Il pasto chiave è il pranzo.",
          "Giovedì, pesi alle 18. A pranzo un piatto normale e vario; dopo la palestra, entro un paio d’ore, una cena con la fonte proteica in primo piano, per esempio il maiale alla senape con patate e spinaci. Il pasto chiave è la cena.",
          "Se nella stessa seduta fai sia cardio sia pesi, come in molti allenamenti funzionali, guarda che cosa pesa di più o scegli un piatto ‘cardio e pesi’.",
        ],
      },
      {
        titolo: "Dove si ferma la regola",
        paragrafi: [
          "È un criterio per scegliere tra piatti, non un piano alimentare. Peso, età, sesso, volume di allenamento e obiettivi cambiano le quantità da persona a persona. Le linee guida CREA indicano che solo chi si allena in modo molto intenso e continuativo, cinque-sette giorni a settimana per due o tre ore, ha bisogno di accorgimenti specifici con medici e nutrizionisti dello sport.",
          "Se hai già una scheda del tuo nutrizionista, usa la pagina [sui tuoi macro](/scheda): la settimana si compone sui numeri che ti ha dato lui, non sulla regola generale.",
        ],
      },
    ],
    faq: [
      { domanda: "Se faccio cardio e pesi nella stessa seduta, quale piatto scelgo?", risposta: "Guarda che cosa pesa di più nella seduta. Per gli allenamenti misti il menu segnala i piatti ‘cardio e pesi’, oggi il riso con carote, zucchine e pollo teriyaki, che unisce una buona quota di carboidrati e una fonte proteica." },
      { domanda: "Nei giorni di riposo devo mangiare meno?", risposta: "Non necessariamente. Il riposo non impone porzioni ridotte: il compositore propone il piatto meno denso del menu come punto di partenza, ma appetito, abitudini e indicazioni personali vengono prima." },
      { domanda: "Questa regola serve a dimagrire?", risposta: "No. Serve a scegliere il piatto in base all’allenamento del giorno, non a perdere peso. Per obiettivi di composizione corporea serve un percorso con un professionista abilitato." },
      { domanda: "Posso cambiare i piatti proposti dal compositore?", risposta: "Sì. La proposta è modificabile: puoi trascinare i piatti, sostituirli o lasciare caselle vuote nei giorni in cui mangi fuori." },
    ],
    fonti: [FONTI.creaLineeGuida, FONTI.issnTiming, FONTI.issnProteine, FONTI.acsmPrestazione],
  },
  {
    slug: "cosa-mangiare-dopo-allenamento-pesi",
    titolo: "Cosa mangiare dopo l’allenamento con i pesi",
    descrizione: "Cosa mangiare dopo l’allenamento con i pesi: proteine, carboidrati, tempi ed esempi di piatti per organizzare il pasto di recupero senza improvvisare.",
    categoria: "allenamento",
    parolaChiave: "cosa mangiare dopo l’allenamento con i pesi",
    foto: "pesi",
    data: DATA_BLOG,
    aggiornato: "2026-10-01",
    piatti: ["maiale-senape-spinaci", "uova-purgatorio-peperoni", "pallotte-cacio-ovo"],
    correlati: ["cosa-mangiare-sera-dopo-allenamento", "quante-proteine-per-pasto", "abbinare-pasti-tipo-allenamento"],
    introduzione:
      "Dopo una seduta con i pesi la domanda arriva puntuale: che cosa mangio adesso? La risposta pratica è un pasto vero, con una fonte proteica ben presente, una porzione di carboidrati e delle verdure, da consumare in tempi ragionevoli. Non servono prodotti speciali né formule segrete: serve sapere che cosa c’è nel piatto e quando riuscirai a mangiarlo. In questa guida mettiamo in fila quello che dicono le linee guida e lo traduciamo in esempi concreti.",
    sezioni: [
      {
        titolo: "Cosa dicono le linee guida, in breve",
        paragrafi: [
          "Le linee guida italiane per una sana alimentazione del CREA partono da un punto spesso dimenticato: chi si allena con regolarità a livello amatoriale, per esempio tre o quattro volte a settimana, non ha bisogno di un’alimentazione particolare. Basta mangiare un po’ di più in proporzione all’impegno, senza stravolgere l’equilibrio tra carboidrati, grassi e proteine.",
          "Sul dopo allenamento lo stesso documento è chiaro: spuntini o pasti ricchi di carboidrati e con buone quote di proteine, consumati prima e dopo (entro due ore) un allenamento di resistenza muscolare, possono migliorare la sintesi proteica. La posizione dell’International Society of Sports Nutrition (ISSN) sul timing dei nutrienti va nella stessa direzione: proteine di buona qualità assunte da subito fino a circa due ore dopo l’esercizio stimolano la sintesi delle proteine muscolari.",
          "Sono indicazioni pensate per gruppi di persone, non per te in particolare. Peso, volume di allenamento, età e obiettivi cambiano le quantità: per un numero personale serve un professionista della nutrizione.",
        ],
      },
      {
        titolo: "Proteine: il centro del piatto",
        paragrafi: [
          "Dopo i pesi la fonte proteica è l’elemento da non perdere. Può essere carne, pesce, uova, latticini come yogurt, ricotta o formaggi freschi, oppure legumi. Per le quantità, le posizioni ISSN indicano come riferimento circa 20–40 grammi di proteine per pasto, pari a 0,25–0,40 grammi per chilo di peso corporeo.",
          "Tradotto: una persona di 70 chili si muove indicativamente tra 18 e 28 grammi per pasto, una di 85 chili tra 21 e 34. Non serve pesare ogni boccone: una porzione normale di carne, pesce o uova, o un piatto unico con legumi, rientra facilmente in quell’ordine di grandezza. Ne parliamo in dettaglio nella guida su [quante proteine per pasto](/blog/quante-proteine-per-pasto).",
          "Conta anche la distribuzione: le stesse posizioni suggeriscono di ripartire le proteine nella giornata, ogni tre o quattro ore, invece di concentrarle tutte a cena.",
        ],
      },
      {
        titolo: "Carboidrati: dosati, non eliminati",
        paragrafi: [
          "Un errore frequente è pensare che dopo i pesi servano solo proteine. Le linee guida CREA parlano di pasti ricchi di carboidrati con buone quote di proteine, e i carboidrati servono anche a ricostituire le scorte di glicogeno usate durante la seduta.",
          "Nella cucina FUEL LAB la regola è questa: nei giorni di pesi il piatto mette le proteine in primo piano e tiene i carboidrati in quantità più moderata rispetto ai giorni di cardio, senza toglierli. Pane, patate, riso o pasta in porzione normale, insieme alla fonte proteica e alle verdure, fanno un pasto di recupero completo.",
          "Se nello stesso giorno hai un secondo allenamento, o una partita la sera, i carboidrati diventano più importanti: in quel caso conviene non ridurli. La guida su [come abbinare i pasti al tipo di allenamento](/blog/abbinare-pasti-tipo-allenamento) spiega la regola completa.",
        ],
      },
      {
        titolo: "Quando mangiare: la finestra non è un cronometro",
        paragrafi: [
          "Per anni si è parlato di una ‘finestra anabolica’ di trenta minuti da non mancare. Le posizioni scientifiche sono meno drammatiche: il periodo utile va dall’immediato dopo allenamento fino a circa due ore, e ciò che mangi nel resto della giornata conta almeno quanto il pasto subito dopo. Qualche situazione tipica:",
        ],
        punti: [
          "Ti alleni alle 18:30 e ceni alle 20:30: la cena è il tuo pasto di recupero, non serve altro.",
          "Ti alleni alle 7 prima del lavoro: dopo la doccia fai una colazione con una fonte proteica, per esempio yogurt o latte, pane e frutta, poi un pranzo completo.",
          "Ti alleni in pausa pranzo: porta con te un piatto già pronto da mangiare appena finisci, conservato al fresco fino a quel momento.",
          "Finisci tardi, dopo le 21: meglio una cena completa ma leggera che andare a letto a stomaco vuoto. Trovi qualche idea nella guida su [cosa mangiare la sera dopo l’allenamento](/blog/cosa-mangiare-sera-dopo-allenamento).",
        ],
      },
      {
        titolo: "Quattro esempi di pasto dopo i pesi",
        paragrafi: ["Qualche combinazione concreta, tra piatti del menu FUEL LAB e idee da cucinare a casa:"],
        punti: [
          "Carne magra, patate e verdure cotte: è la struttura del [maiale alla senape con spinaci e patate novelle](/menu/maiale-senape-spinaci), il piatto del menu con il rapporto più alto tra proteine e carboidrati.",
          "Uova, sugo di verdure e pane: le [uova alla purgatorio con sugo di peperoni](/menu/uova-purgatorio-peperoni) sono l’opzione più leggera per una cena dopo la palestra.",
          "Un piatto della tradizione: le [pallotte cacio e ova in versione fit](/blog/pallotte-cacio-e-ova-versione-fit), con uova, ricotta e sugo di pomodorini.",
          "A casa: pasta e legumi con una spolverata di formaggio, oppure riso, pollo e verdure saltate in padella.",
        ],
        dopo: [
          "Nel [compositore della settimana](/settimana), segnando un giorno come ‘pesi’, la proposta mette in cima i piatti con il rapporto più alto tra proteine e carboidrati. Puoi sempre cambiarli. Come lavoriamo questi piatti è spiegato nella pagina sui [pasti proteici a Pescara](/pasti-proteici-pescara).",
        ],
      },
      {
        titolo: "Gli errori più comuni",
        paragrafi: ["Più che il piatto perfetto, a fare la differenza è evitare qualche abitudine poco utile:"],
        punti: [
          "Saltare il pasto perché ‘tanto a pranzo ho mangiato’: il recupero passa anche dal pasto dopo la seduta.",
          "Affidarsi solo a uno shake e arrivare a cena affamati, finendo per mangiare in fretta quello che capita.",
          "Un piatto fatto solo di proteine, senza verdure né carboidrati: è meno completo e spesso meno soddisfacente.",
          "Fritture e piatti molto grassi a tarda sera: le linee guida CREA ricordano che per chi si allena anche il sonno è importantissimo.",
          "Integratori scelti di propria iniziativa: secondo il CREA, per la maggior parte degli sportivi l’integrazione proteica è in genere ingiustificata, perché mangiando di più si coprono già le esigenze.",
        ],
      },
    ],
    faq: [
      { domanda: "Devo mangiare entro 30 minuti dalla fine dell’allenamento?", risposta: "No, non è un limite rigido. La posizione ISSN sul timing indica che le proteine assunte da subito fino a circa due ore dopo l’esercizio stimolano la sintesi proteica; conta soprattutto arrivare al pasto in tempi ragionevoli e distribuire le proteine nella giornata." },
      { domanda: "Dopo i pesi è meglio evitare i carboidrati?", risposta: "No. Le linee guida CREA indicano pasti con carboidrati e buone quote di proteine dopo l’allenamento di resistenza. Nei giorni di pesi FUEL LAB propone piatti con le proteine in primo piano e carboidrati più moderati rispetto ai giorni di cardio, non assenti." },
      { domanda: "Lo shake proteico è necessario?", risposta: "Per la maggior parte di chi si allena a livello amatoriale un pasto completo basta: il CREA ritiene in genere ingiustificato l’uso di integratori proteici. Se ne usi uno su indicazione di un professionista, consideralo parte della giornata, non un sostituto del pasto." },
      { domanda: "Quante proteine servono dopo i pesi?", risposta: "Le posizioni ISSN parlano di circa 20–40 grammi per pasto, cioè 0,25–0,40 grammi per chilo di peso corporeo. Sono intervalli per la popolazione sportiva: per una quantità personale chiedi al tuo nutrizionista." },
    ],
    fonti: [FONTI.creaLineeGuida, FONTI.issnTiming, FONTI.issnProteine],
  },
  {
    slug: "quante-proteine-per-pasto",
    titolo: "Quante proteine per pasto? Numeri, esempi e buon senso",
    titoloSeo: "Quante proteine per pasto? Guida con esempi",
    descrizione: "Quante proteine per pasto servono a chi si allena: i riferimenti EFSA e ISSN, come calcolarli sul proprio peso ed esempi concreti di piatti e porzioni.",
    categoria: "etichette-nutrienti",
    parolaChiave: "quante proteine per pasto",
    foto: "carne",
    data: DATA_BLOG,
    piatti: ["maiale-senape-spinaci", "riso-julien-pollo-teriyaki", "uova-purgatorio-peperoni"],
    correlati: ["pasti-con-proteine-menu-settimanale", "cosa-mangiare-dopo-allenamento-pesi", "macro-cosa-sono-come-leggerli"],
    introduzione:
      "Quante proteine per pasto? È una delle domande più frequenti tra chi va in palestra, e anche una di quelle con più risposte improvvisate. I riferimenti ufficiali esistono e sono più semplici di quanto sembri: una quota giornaliera, espressa in grammi per chilo di peso corporeo, e una distribuzione ragionevole nei pasti. Qui li mettiamo in fila e li trasformiamo in esempi da tavola, con una premessa: il numero giusto per te lo stabilisce un professionista.",
    sezioni: [
      {
        titolo: "I riferimenti: popolazione generale e sportivi",
        paragrafi: [
          "Per gli adulti in generale l’EFSA, l’Autorità europea per la sicurezza alimentare, indica un apporto di riferimento per la popolazione di 0,83 grammi di proteine per chilo di peso corporeo al giorno. È il valore che copre il fabbisogno della grande maggioranza delle persone adulte, anziani compresi.",
          "Per chi si allena, la posizione dell’International Society of Sports Nutrition (ISSN) su proteine ed esercizio considera sufficiente, per la maggior parte delle persone attive, un apporto giornaliero tra 1,4 e 2,0 grammi per chilo. Le linee guida CREA aggiungono una nota di realismo: chi fa sport mangia di più per coprire il maggior dispendio, e così copre quasi sempre anche il maggior bisogno di proteine, senza bisogno di integratori.",
        ],
      },
      {
        titolo: "Per pasto: 20–40 grammi, o 0,25 grammi per chilo",
        paragrafi: [
          "Sul singolo pasto la stessa posizione ISSN indica circa 0,25 grammi di proteine di buona qualità per chilo di peso corporeo, oppure una dose assoluta di 20–40 grammi. La posizione sul timing dei nutrienti allarga l’intervallo a 0,25–0,40 grammi per chilo, ripetuti ogni tre o quattro ore. Ecco che cosa significa su pesi diversi:",
        ],
        tabella: {
          intestazioni: ["Peso corporeo", "0,25 g per kg", "0,40 g per kg"],
          righe: [
            ["55 kg", "circa 14 g", "circa 22 g"],
            ["70 kg", "circa 18 g", "circa 28 g"],
            ["85 kg", "circa 21 g", "circa 34 g"],
            ["100 kg", "circa 25 g", "circa 40 g"],
          ],
          nota: "Calcolo aritmetico sui valori ISSN, non un fabbisogno personale.",
        },
      },
      {
        titolo: "Distribuire conta più che concentrare",
        paragrafi: [
          "Molte giornate italiane hanno una colazione con pochissime proteine, un pranzo medio e una cena abbondante. Le posizioni ISSN suggeriscono invece di distribuire le proteine in modo più uniforme, ogni tre o quattro ore. Non serve stravolgere le abitudini: bastano piccoli spostamenti.",
        ],
        punti: [
          "Colazione: aggiungi uno yogurt, un bicchiere di latte o una fetta di formaggio fresco a quello che mangi già.",
          "Pranzo: un piatto con una fonte proteica riconoscibile, che sia carne, pesce, uova, latticini o legumi.",
          "Spuntino: yogurt, latte o un frutto con qualche mandorla, se tra pranzo e cena passano molte ore.",
          "Cena: una porzione normale di proteine, senza bisogno di recuperare tutto quello che è mancato di giorno.",
        ],
        dopo: [
          "Se vuoi variare le fonti nell’arco della settimana, la guida su [come variare le fonti proteiche](/blog/pasti-con-proteine-menu-settimanale) raccoglie qualche idea.",
        ],
      },
      {
        titolo: "Le proteine nei piatti del menu",
        paragrafi: [
          "I piatti del [menu FUEL LAB](/menu) sono pensati come pasto unico, con porzioni generose: diversi superano i 40 grammi di proteine per porzione. La tabella qui sotto riporta i valori aggiornati dei piatti in carta, così puoi confrontarli con il riferimento che ti riguarda. Se cerchi piatti pronti con queste caratteristiche, c’è anche la pagina sui [pasti proteici a Pescara](/pasti-proteici-pescara).",
        ],
        piatti: ["maiale-senape-spinaci", "riso-julien-pollo-teriyaki", "noodles-sesamo-maiale", "pallotte-cacio-ovo", "gnocchetti-sugo-ricotta", "uova-purgatorio-peperoni"],
        dopo: [
          "Per leggere correttamente questi numeri, tieni presente che si riferiscono alla porzione indicata in scheda, non a 100 grammi: lo spieghiamo nella guida sui [macro alimentari](/blog/macro-cosa-sono-come-leggerli).",
        ],
      },
      {
        titolo: "E se il piatto ne ha più di 40 grammi?",
        paragrafi: [
          "Nessun allarme. L’intervallo di 20–40 grammi descrive la dose che, secondo gli studi raccolti dall’ISSN, stimola bene la sintesi proteica in un pasto; le proteine in più non ‘spariscono’, contribuiscono comunque al totale della giornata. Per chi pesa di più, del resto, 0,40 grammi per chilo arrivano già a 40 grammi.",
          "Se invece la porzione è più grande del tuo appetito, puoi dividerla in due pasti, conservando la seconda metà in frigorifero come indicato e completandola con verdure o pane. È una scelta pratica, non una regola.",
        ],
      },
      {
        titolo: "Quando serve un professionista",
        paragrafi: [
          "Le cifre di questa guida valgono per adulti sani. In caso di malattie renali o altre condizioni cliniche, in gravidanza, in età di crescita o con obiettivi precisi di composizione corporea, la quota di proteine va decisa con un medico o un nutrizionista. Lo stesso vale se segui un’alimentazione solo vegetale e vuoi essere sicuro di coprire il fabbisogno.",
          "Se hai già dei numeri dal tuo professionista, puoi inserirli nella pagina [sui tuoi macro](/scheda): la settimana si compone sui tuoi target, scegliendo i piatti più vicini.",
        ],
      },
    ],
    faq: [
      { domanda: "Più di 30 grammi di proteine a pasto vengono sprecati?", risposta: "È una semplificazione. Le posizioni ISSN indicano 20–40 grammi per pasto come dose utile a stimolare la sintesi proteica; quantità maggiori contribuiscono comunque al totale della giornata. Conta soprattutto la quota giornaliera e come la distribuisci." },
      { domanda: "Quante proteine al giorno servono a chi va in palestra?", risposta: "Per la maggior parte delle persone che si allenano l’ISSN indica 1,4–2,0 grammi per chilo di peso al giorno; il riferimento EFSA per gli adulti in generale è 0,83 grammi per chilo. Il valore personale va stabilito con un professionista." },
      { domanda: "Le proteine vegetali contano?", risposta: "Sì. Legumi, cereali e derivati della soia contribuiscono all’apporto proteico, e alternarli con le altre fonti rende il menu più vario. Chi segue un’alimentazione solo vegetale fa bene a pianificarla con un professionista." },
      { domanda: "Serve un integratore per arrivare alla quota?", risposta: "Di solito no: secondo il CREA chi si allena, mangiando di più, copre quasi sempre anche il maggior fabbisogno proteico. Un integratore ha senso solo se indicato da un professionista." },
    ],
    fonti: [FONTI.efsaProteine, FONTI.issnProteine, FONTI.issnTiming, FONTI.creaLineeGuida],
  },
  {
    slug: "pallotte-cacio-e-ova-versione-fit",
    titolo: "Pallotte cacio e ova in versione fit: la tradizione abruzzese nel meal prep",
    titoloSeo: "Pallotte cacio e ova fit: la ricetta abruzzese",
    descrizione: "Pallotte cacio e ova in versione fit: la ricetta abruzzese tradizionale, cosa cambia nella proposta FUEL LAB con ricotta e sugo e come inserirla nel menu.",
    categoria: "pescara-abruzzo",
    parolaChiave: "pallotte cacio e ova",
    foto: "polpette",
    data: DATA_BLOG,
    aggiornato: "2026-10-01",
    piatti: ["pallotte-cacio-ovo", "uova-purgatorio-peperoni", "gnocchetti-sugo-ricotta"],
    correlati: ["cucina-di-stagione-abruzzo-pescara", "cosa-mangiare-dopo-allenamento-pesi", "piatti-gia-composti-cosa-sono"],
    introduzione:
      "Le pallotte cacio e ova, cac’e ove come si dice tra Chieti e Pescara, sono polpette senza carne: formaggio, uova e pane raffermo, fritte e poi cotte nel sugo di pomodoro. Un piatto nato per sfamare con poco, che oggi si trova nelle trattorie e sulle tavole delle feste. Nel menu FUEL LAB c’è una versione pensata per chi si allena: stessa idea, ingredienti ricalibrati. Vediamo che cosa resta della tradizione e che cosa cambia.",
    sezioni: [
      {
        titolo: "La ricetta tradizionale",
        paragrafi: [
          "Secondo il portale turistico della Regione Abruzzo, le pallotte nascono come cibo povero di sussistenza: polpette a base di uova e formaggio che sostituivano la carne quando la carne mancava. Sono tipiche soprattutto del chietino, ma oggi diffuse in tutta la regione, servite spesso come antipasto e immancabili nei pranzi delle feste, a partire da quello di Pasqua.",
          "L’impasto classico unisce uova, formaggio semistagionato grattugiato di vacca e di pecora, mollica di pane, aglio e prezzemolo. Le pallotte si friggono in olio extravergine d’oliva e poi cuociono a fuoco lento, per almeno mezz’ora, nel sugo di pomodoro. Su iniziativa della delegazione di Chieti dell’Accademia Italiana della Cucina ne è stato firmato un disciplinare che registra la ricetta, e il portale regionale le indica come prodotto agroalimentare tradizionale.",
          "Come per ogni piatto di famiglia, le varianti sono molte: con più o meno pane, con pecorino o formaggio vaccino, con l’aggiunta di ricotta.",
        ],
      },
      {
        titolo: "Perché piacciono a chi si allena",
        paragrafi: [
          "Sulla carta le pallotte hanno tutto: uova e formaggio portano proteine, il pane porta carboidrati, il sugo di pomodoro dà volume e sapore. È un piatto unico completo, che si conserva bene nel suo sugo e si porta facilmente in un contenitore.",
          "Il punto debole della versione classica è la quantità di formaggio stagionato unita alla frittura: un piatto ricco di grassi, buonissimo nel pranzo della domenica, meno pratico come pasto di tutti i giorni per chi si allena più volte a settimana. È lì che interviene la versione fit.",
        ],
      },
      {
        titolo: "La versione FUEL LAB: cosa cambia",
        paragrafi: [
          "Le [pallotte cacio e ovo fit proteiche](/menu/pallotte-cacio-ovo) del menu partono da pane raffermo, uova e ricotta, con parmigiano, sale e pepe; il sugo è di pomodorini, cipolla e basilico. La ricotta prende il posto di buona parte del formaggio stagionato: il sapore resta riconoscibile, l’impasto è più morbido e fresco.",
          "Nella scheda del piatto trovi grammature, allergeni (glutine, uova, latte) e i macro della porzione, aggiornati. Il piatto è indicato per i giorni di pesi: nel compositore compare tra le prime proposte quando segni una giornata di forza.",
        ],
      },
      {
        titolo: "Come inserirle nella settimana",
        paragrafi: [
          "Le pallotte sono tra i piatti del menu FUEL LAB, che Matteo cucina ogni giorno. Funzionano bene come cena dopo una seduta di pesi, accompagnate da un contorno di verdure che puoi aggiungere alla box, oppure come pranzo da portare al lavoro.",
          "Per non ripeterle troppo, alternale con piatti diversi nella stessa settimana: per esempio le [uova alla purgatorio](/menu/uova-purgatorio-peperoni) il lunedì e un piatto ricco di carboidrati nei giorni di cardio. Conservale seguendo le indicazioni che ricevi con il piatto e scaldale fino a quando sono ben calde anche all’interno.",
        ],
      },
      {
        titolo: "Rifarle a casa in chiave più leggera",
        paragrafi: ["Se vuoi provarci da solo, qualche accorgimento da cucina per alleggerire senza tradire il piatto:"],
        punti: [
          "Sostituisci una parte del formaggio stagionato con ricotta ben sgocciolata: l’impasto resta saporito e diventa più morbido.",
          "Ammolla il pane raffermo e strizzalo bene, così l’impasto tiene la forma senza bisogno di altro formaggio.",
          "Al posto della frittura, dora le pallotte in forno prima di passarle nel sugo, lasciandole insaporire a fuoco lento.",
          "Porziona subito in contenitori chiusi e metti in frigorifero appena intiepidite: il sugo le mantiene morbide per i pasti dei giorni successivi.",
        ],
        dopo: [
          "La versione fritta resta quella della tradizione, e ogni tanto merita la tavola della domenica. Quella più leggera è un modo per portarla anche nei giorni feriali.",
        ],
      },
      {
        titolo: "Altri sapori abruzzesi per chi si allena",
        paragrafi: [
          "La cucina abruzzese ha molti ingredienti che si prestano al meal prep: legumi come lenticchie e ceci, zuppe di verdure, uova e formaggi freschi, il pesce dell’Adriatico sulla costa. Non serve trasformare ogni ricetta: spesso basta dosare condimenti e cotture.",
          "Per idee stagione per stagione leggi la guida sulla [cucina di stagione in Abruzzo](/blog/cucina-di-stagione-abruzzo-pescara).",
        ],
      },
    ],
    faq: [
      { domanda: "Pallotte cacio e ova o cace e ove: qual è il nome giusto?", risposta: "Sono lo stesso piatto: cace e ove, o cac’e ove, è la forma dialettale di cacio e uova. Le trovi scritte in più modi, anche sui menu dei ristoranti; nel menu FUEL LAB si chiamano ‘pallotte cacio e ovo fit proteiche’." },
      { domanda: "Le pallotte fit vanno bene se ho un’allergia o un’intolleranza?", risposta: "Contengono glutine, uova e latte. Se hai allergie o intolleranze, leggi la scheda del piatto e chiedi conferma a Matteo prima di ordinarle." },
      { domanda: "Sono un piatto da giorno di pesi o di cardio?", risposta: "Nel menu sono indicate per i giorni di pesi, e il compositore le propone in quelle giornate. Puoi comunque spostarle dove preferisci." },
      { domanda: "Quando si possono avere le pallotte di FUEL LAB?", risposta: "Matteo cucina ogni giorno e consegna ogni giorno: chiedi a lui la disponibilità nel giorno che ti serve. Ritiro in Via del Santuario 214 o consegna in zona vanno confermati con Matteo." },
    ],
    fonti: [FONTI.abruzzoPallotte],
  },
  {
    slug: "cosa-mangiare-calcetto-crossfit-pescara",
    titolo: "Calcetto, CrossFit e palestra a Pescara: cosa mangiare prima e dopo",
    titoloSeo: "Cosa mangiare prima e dopo calcetto e CrossFit",
    descrizione: "Cosa mangiare prima e dopo calcetto, CrossFit e palestra: sport misti, orari serali, idratazione ed esempi pratici per chi si allena la sera a Pescara.",
    categoria: "allenamento",
    parolaChiave: "cosa mangiare prima del calcetto",
    foto: "distensione",
    data: DATA_BLOG,
    aggiornato: "2026-10-01",
    piatti: ["riso-julien-pollo-teriyaki", "noodles-sesamo-maiale", "maiale-senape-spinaci"],
    correlati: ["cosa-mangiare-sera-dopo-allenamento", "cosa-mangiare-prima-di-correre", "idratazione-allenamento-caldo-pescara"],
    introduzione:
      "Il calcetto del martedì alle 21, il WOD delle 19 al box, la scheda in palestra in pausa pranzo: a Pescara molti allenamenti amatoriali si concentrano la sera e mescolano scatti, pause e lavoro di forza. Per questo non basta dire ‘cardio’ o ‘pesi’: servono un pasto prima che non appesantisca, qualcosa dopo che aiuti il recupero e una buona organizzazione quando si finisce tardi.",
    sezioni: [
      {
        titolo: "Sport misti: servono carboidrati e proteine",
        paragrafi: [
          "Calcetto e CrossFit sono attività intermittenti: tratti molto intensi, cambi di direzione, sollevamenti, pause brevi. Gli sforzi intensi attingono soprattutto ai carboidrati, mentre il lavoro muscolare chiede proteine nel recupero. Il risultato è un allenamento che sta a metà tra cardio e pesi.",
          "Nel menu FUEL LAB esiste proprio questa categoria, ‘cardio e pesi’: ci sta il [riso con carote, zucchine e pollo teriyaki](/menu/riso-julien-pollo-teriyaki), che unisce una buona quota di carboidrati e una fonte proteica. È la scelta più semplice per i giorni di partita o di WOD.",
        ],
      },
      {
        titolo: "Prima: 2–3 ore e un pasto digeribile",
        paragrafi: [
          "Le linee guida CREA indicano per il pasto prima dell’allenamento cibi facilmente digeribili e ricchi di carboidrati, almeno 2–3 ore prima; per la merenda che precede l’attività, alimenti facili da digerire e ricchi di zuccheri semplici e complessi. Con la partita alle 21 hai due strade:",
        ],
        punti: [
          "Pranzo completo verso le 13, merenda tra le 18 e le 19 con pane e marmellata, fette biscottate o frutta, cena dopo la partita.",
          "Cena anticipata e leggera verso le 18:30, con pasta o riso e condimento semplice, e uno spuntino piccolo dopo la partita.",
          "In entrambi i casi: niente fritture, sughi elaborati o piatti molto grassi nelle ore prima di scendere in campo.",
        ],
      },
      {
        titolo: "Durante: acqua e pause",
        paragrafi: [
          "Per un’ora di calcetto o un WOD di mezz’ora, secondo il CREA, l’acqua è sufficiente: bevande con zuccheri e sali servono solo negli sforzi intensi che superano i 45–60 minuti con sudorazione abbondante, come un torneo o una giornata di gare.",
          "D’estate, nei campi all’aperto e nei box poco ventilati, bevi prima di iniziare e a piccoli sorsi nelle pause. Trovi indicazioni più dettagliate nella guida su [allenarsi con il caldo](/blog/idratazione-allenamento-caldo-pescara).",
        ],
      },
      {
        titolo: "Dopo: recupero senza abbuffate a mezzanotte",
        paragrafi: [
          "Chi gioca alle 21 torna a casa verso le 22:30. È il momento in cui si decide se cenare bene o ripiegare su quello che capita. Le posizioni ISSN indicano che le proteine assunte entro circa due ore dall’esercizio stimolano la sintesi proteica, e il CREA raccomanda di reintegrare presto liquidi e carboidrati: una cena completa ma digeribile fa entrambe le cose.",
          "Il classico terzo tempo in pizzeria ogni tanto ci sta. Ricorda però che, secondo il CREA, una pizza margherita napoletana può pesare anche 450 grammi e arrivare a più di 1000 kcal e a oltre 7 grammi di sale, e che le bevande alcoliche non dissetano ma disidratano. Se diventa l’abitudine di ogni settimana, conviene avere un’alternativa pronta in frigorifero.",
        ],
      },
      {
        titolo: "CrossFit: WOD brevi, intensità alta",
        paragrafi: [
          "Molte sedute di CrossFit uniscono una parte di forza e un WOD breve e intensissimo. Se il pranzo è lontano, uno spuntino con carboidrati 1–2 ore prima aiuta ad arrivare con energia; dopo, il pasto deve contenere proteine e carboidrati, come dopo una seduta di pesi.",
          "Se ti alleni due volte nello stesso giorno, il recupero dei carboidrati tra una seduta e l’altra diventa più importante: la posizione ISSN sul timing dei nutrienti dedica indicazioni specifiche al caso in cui tra due sedute passino poche ore. È una situazione da discutere con un professionista, non da improvvisare.",
        ],
      },
      {
        titolo: "Una settimana tipo per chi gioca e si allena",
        paragrafi: ["Un esempio per chi alterna palestra, CrossFit e calcetto, con i piatti del menu nei giorni più pieni:"],
        tabella: {
          intestazioni: ["Giorno", "Allenamento", "Pasto chiave"],
          righe: [
            ["Lunedì", "Pesi alle 18:30", "Cena proteica: maiale alla senape con patate e spinaci"],
            ["Martedì", "Calcetto alle 21", "Pranzo con carboidrati e merenda; cena leggera dopo la partita"],
            ["Mercoledì", "Riposo", "Piatto completo e meno denso, con verdure"],
            ["Giovedì", "CrossFit alle 19", "Pranzo con riso, pollo e verdure; cena con proteine e carboidrati"],
            ["Venerdì", "Libero", "Pasti normali, nessun obbligo"],
          ],
          nota: "Schema indicativo da adattare a orari e appetito.",
        },
        dopo: [
          "Nel [compositore](/settimana) puoi segnare ogni giorno come cardio, pesi o riposo e ottenere una proposta coerente, da ritoccare a mano. Per costruire lo schema da zero c’è la guida sulla [settimana tipo tra allenamenti e pasti](/blog/settimana-tipo-allenamento-alimentazione).",
        ],
      },
    ],
    faq: [
      { domanda: "Cosa mangiare prima del calcetto la sera?", risposta: "Un pranzo completo con carboidrati e, 1–2 ore prima della partita, una merenda digeribile a base di carboidrati: pane con marmellata o miele, fette biscottate, frutta. Evita fritti e pasti abbondanti a ridosso del campo." },
      { domanda: "Dopo il calcetto delle 22 posso mangiare?", risposta: "Sì: un pasto completo ma digeribile, con una porzione di carboidrati, una fonte proteica e verdure, aiuta a recuperare senza appesantire la notte. Meglio evitare fritture e piatti molto grassi." },
      { domanda: "Nel CrossFit servono integratori?", risposta: "Per un’attività amatoriale le linee guida CREA considerano in genere sufficiente un’alimentazione adeguata e varia. Un integratore va valutato con un professionista, non scelto per abitudine." },
      { domanda: "Quale piatto FUEL LAB scegliere per il CrossFit?", risposta: "Per le sedute miste il menu indica i piatti ‘cardio e pesi’, oggi il riso con carote, zucchine e pollo teriyaki. Nel compositore puoi segnare il giorno come cardio o pesi in base a che cosa prevale." },
    ],
    fonti: [FONTI.creaLineeGuida, FONTI.issnTiming],
  },
  {
    slug: "idratazione-allenamento-caldo-pescara",
    titolo: "Allenarsi con il caldo a Pescara: idratazione, pasti e recupero",
    titoloSeo: "Allenarsi con il caldo: idratazione e recupero",
    descrizione: "Allenarsi con il caldo a Pescara: quanta acqua bere, quando servono i sali, orari migliori, pasti leggeri e come trasportare il cibo preparato d’estate.",
    categoria: "allenamento",
    parolaChiave: "allenarsi con il caldo",
    foto: "spremuta",
    data: DATA_BLOG,
    aggiornato: "2026-10-01",
    piatti: ["uova-purgatorio-peperoni", "riso-julien-pollo-teriyaki", "gnocchetti-sugo-ricotta"],
    correlati: ["conservare-pasti-preparati-frigorifero", "cosa-mangiare-prima-di-correre", "cosa-mangiare-calcetto-crossfit-pescara"],
    introduzione:
      "D’estate, sulla costa di Pescara, il caldo umido si sente anche la sera: corri sul lungomare, giochi a beach volley o esci dalla palestra e la maglietta è da strizzare. Con il caldo cambiano tre cose: quanto bevi, quando ti alleni e come gestisci il cibo, compreso quello preparato in anticipo che deve restare al fresco. In questa guida mettiamo insieme le indicazioni ufficiali e qualche accorgimento pratico.",
    sezioni: [
      {
        titolo: "Quanta acqua: il riferimento di base",
        paragrafi: [
          "L’EFSA considera adeguata un’assunzione giornaliera totale di acqua di 2,0 litri per le donne e 2,5 litri per gli uomini: è l’acqua di tutte le fonti, bevande e cibi compresi, non solo quella del bicchiere. Le linee guida CREA traducono il concetto in pratica: asseconda sempre la sete e anzi prova ad anticiparla, bevendo in media 1,5–2 litri di acqua al giorno, spesso e in piccole quantità, anche tra i pasti.",
          "Chi si allena ha bisogno di più liquidi: il CREA ricorda che il fabbisogno idrico degli sportivi è aumentato e che con la sudorazione si perdono acqua ed elettroliti, soprattutto sodio. Con il caldo il Ministero della Salute raccomanda di bere molti liquidi, almeno un litro e mezzo di acqua al giorno, e di mangiare frutta fresca.",
        ],
      },
      {
        titolo: "Prima, durante e dopo l’allenamento",
        paragrafi: [
          "Il CREA indica di idratarsi prima, durante e dopo l’allenamento. L’acqua basta se l’attività è moderata o dura meno di 45–60 minuti; solo negli sforzi intensi e prolungati, oltre l’ora e con sudorazione abbondante, ha senso reintegrare anche sali e zuccheri. Le bevande ‘per sportivi’ usate senza motivo aggiungono sodio e zuccheri che non servono.",
          "La posizione dell’American College of Sports Medicine sulla reidratazione aggiunge due indicazioni utili: durante l’esercizio l’obiettivo è evitare una disidratazione eccessiva, cioè una perdita superiore al 2% del peso corporeo, e siccome la sudorazione varia molto da persona a persona, un modo semplice per stimarla è pesarsi prima e dopo l’allenamento.",
        ],
        punti: [
          "Arriva all’allenamento già idratato, bevendo con regolarità nelle ore precedenti.",
          "Porta sempre una borraccia e bevi a piccoli sorsi nelle pause.",
          "Pesati prima e dopo una seduta tipo: la differenza ti dà un’idea di quanto liquido perdi.",
          "Dopo, reintegra con acqua e con un pasto che contenga frutta e verdura.",
        ],
      },
      {
        titolo: "Orari e gradualità",
        paragrafi: [
          "Il Ministero della Salute consiglia di evitare l’esercizio fisico nelle ore più calde della giornata e, durante le ondate di calore, di evitare l’esposizione diretta al sole tra le 11 e le 18. Per gli sportivi raccomanda di adattarsi progressivamente al caldo a inizio stagione, con sedute di intensità ed esposizione crescenti, alternando l’allenamento a pause in luoghi freschi.",
          "A Pescara questo significa spostare corsa, bici e allenamenti all’aperto alle prime ore del mattino o dopo il tramonto, e ridurre intensità e durata nei giorni più afosi. Il lungomare all’alba è più piacevole anche per questo.",
        ],
      },
      {
        titolo: "Cosa mangiare quando fa caldo",
        paragrafi: [
          "Il Ministero della Salute suggerisce, nei periodi caldi, cinque porzioni al giorno di frutta e verdura di stagione, cibi freschi, facilmente digeribili e ricchi di acqua, meno piatti elaborati ricchi di grassi, poco sale e preferibilmente iodato. Anche frutta e verdura contribuiscono all’apporto di acqua della giornata.",
          "Per chi si allena non cambia la logica dei pasti, cambia il tipo di piatto: più verdure, cotture semplici, porzioni che non appesantiscano prima della seduta. Nel menu le [uova alla purgatorio con sugo di peperoni](/menu/uova-purgatorio-peperoni) e il [riso con carote, zucchine e pollo teriyaki](/menu/riso-julien-pollo-teriyaki) sono piatti ricchi di verdure che si adattano bene all’estate.",
          "Sul sale: per le attività moderate il CREA ritiene sufficiente una dieta equilibrata, ricca di frutta e verdura, per reintegrare i sali persi con il sudore.",
        ],
      },
      {
        titolo: "Il pasto preparato in anticipo, d’estate",
        paragrafi: [
          "Con il caldo la catena del freddo diventa la prima regola, come ricorda anche il Ministero della Salute. Le linee guida CREA indicano un frigorifero intorno ai +4 °C e ricordano che i cibi cotti vanno raffreddati e messi in frigorifero entro due ore dalla cottura.",
        ],
        punti: [
          "Trasporta il pranzo in una borsa termica con siberini, non nello zaino al sole.",
          "Non lasciare il contenitore in auto, in spiaggia o sul bordo campo durante l’allenamento.",
          "Se ritiri i piatti FUEL LAB in Via del Santuario 214, organizza il ritiro in modo da andare subito a casa o in ufficio e metterli in frigorifero.",
          "Scalda i piatti che lo prevedono fino a quando sono molto caldi anche all’interno.",
        ],
        dopo: [
          "Per tutte le regole di conservazione c’è la guida su [come conservare i pasti preparati](/blog/conservare-pasti-preparati-frigorifero).",
        ],
      },
      {
        titolo: "Quando fermarsi",
        paragrafi: [
          "Il caldo non è un avversario da battere. Se durante l’allenamento compaiono capogiri, nausea, crampi importanti o mal di testa, fermati, mettiti all’ombra e bevi; se i sintomi non passano, chiedi aiuto. Il Ministero della Salute ricorda che alcune condizioni di salute, come le malattie del cuore, del rene o del fegato, possono limitare l’assunzione di liquidi: in questi casi le quantità vanno concordate con il medico.",
        ],
      },
    ],
    faq: [
      { domanda: "Quanta acqua devo bere se mi alleno d’estate?", risposta: "Non esiste un numero unico: l’EFSA considera adeguati 2,0 litri al giorno di acqua totale (bevande e cibi) per le donne e 2,5 per gli uomini, e chi suda molto ne ha bisogno di più. Un metodo pratico, indicato anche dall’ACSM, è pesarsi prima e dopo l’allenamento per stimare quanto liquido si perde." },
      { domanda: "Servono gli integratori di sali minerali?", risposta: "Per attività moderate o sotto i 45–60 minuti, secondo il CREA, bastano l’acqua e un’alimentazione ricca di frutta e verdura. Bevande con sali e zuccheri hanno senso negli sforzi intensi e prolungati, con molta sudorazione." },
      { domanda: "È meglio allenarsi la mattina o la sera d’estate?", risposta: "Nelle ore più fresche. Il Ministero della Salute raccomanda di evitare l’esercizio fisico nelle ore più calde e, durante le ondate di calore, l’esposizione diretta al sole tra le 11 e le 18." },
      { domanda: "Posso lasciare il pranzo in macchina o in spiaggia?", risposta: "No, se si tratta di un alimento deperibile. Usa una borsa termica con siberini e riponilo in frigorifero appena possibile." },
    ],
    fonti: [FONTI.efsaAcqua, FONTI.creaLineeGuida, FONTI.acsmLiquidi, FONTI.saluteCaldo, FONTI.saluteSicurezza],
  },
  {
    slug: "settimana-tipo-allenamento-alimentazione",
    titolo: "Settimana tipo: come organizzare allenamenti e pasti",
    titoloSeo: "Settimana tipo tra allenamenti e pasti: schemi",
    descrizione: "Settimana tipo tra allenamenti e pasti: tre schemi da copiare per 3, 4 o 5 allenamenti, con cardio, pesi, riposo e un meal prep in due tempi a settimana.",
    categoria: "meal-prep",
    parolaChiave: "settimana tipo allenamento e alimentazione",
    foto: "tagliere",
    data: DATA_BLOG,
    piatti: ["riso-julien-pollo-teriyaki", "maiale-senape-spinaci", "noodles-sesamo-maiale", "uova-purgatorio-peperoni"],
    correlati: ["abbinare-pasti-tipo-allenamento", "menu-settimanale-pescara-come-pianificarlo", "meal-prep-allenamento-cardio-pesi"],
    introduzione:
      "Chi si allena con costanza sa che la settimana si regge su pochi punti fermi: i giorni di allenamento, i pasti che non si possono improvvisare, il momento in cui si cucina o si ritira il cibo. Invece di un menu rigido, qui trovi tre schemi di settimana tipo, con tre, quattro e cinque allenamenti, da adattare ai tuoi orari. Tutti tengono conto dei tempi di conservazione: a casa si cucina due volte a settimana, mentre dalla cucina FUEL LAB, che lavora ogni giorno, i piatti arrivano nei giorni in cui servono.",
    sezioni: [
      {
        titolo: "Le regole che reggono ogni schema",
        paragrafi: ["Prima degli schemi, cinque regole che valgono per tutti e tre:"],
        punti: [
          "Alterna giorni intensi e giorni più leggeri, con almeno un giorno senza allenamento.",
          "Metti il pasto più ricco di carboidrati prima o dopo il cardio, quello con più proteine dopo i pesi: è la regola spiegata nella guida su [come abbinare i pasti al tipo di allenamento](/blog/abbinare-pasti-tipo-allenamento).",
          "Cucina due volte a settimana, non una, oppure fatti preparare i piatti a ridosso dei giorni in cui li mangi: le linee guida CREA indicano che i cibi cotti conservati in frigorifero vanno consumati in tempi brevi, in genere due o tre giorni.",
          "Lascia libere le caselle delle cene fuori, degli inviti e degli imprevisti: una settimana piena di contenitori non mangiati è uno spreco.",
          "Guarda la settimana intera, non il singolo piatto: un pranzo più leggero si compensa con la cena, senza drammi.",
        ],
      },
      {
        titolo: "Schema A: tre allenamenti",
        paragrafi: [
          "Per chi si allena tre volte a settimana, per esempio due sedute di pesi e una di corsa. Se cucini a casa, una sessione la domenica copre lunedì, martedì e mercoledì e una il mercoledì sera copre il resto della settimana lavorativa; se ti affidi a una cucina, i piatti arrivano il giorno in cui ti servono.",
        ],
        tabella: {
          intestazioni: ["Giorno", "Allenamento", "Pasto su cui puntare"],
          righe: [
            ["Lunedì", "Pesi", "Cena con la fonte proteica in primo piano"],
            ["Martedì", "Riposo", "Piatto completo e meno denso"],
            ["Mercoledì", "Cardio", "Pranzo più ricco di carboidrati"],
            ["Giovedì", "Riposo", "Pasti normali, spesa o ritiro"],
            ["Venerdì", "Pesi", "Cena con proteine e carboidrati moderati"],
            ["Sabato e domenica", "Libero", "Pasti fuori, cucina di casa, nessun obbligo"],
          ],
        },
      },
      {
        titolo: "Schema B: quattro allenamenti",
        paragrafi: [
          "Per chi alterna forza e resistenza quattro volte a settimana, con un lungo nel fine settimana. Qui i pasti chiave sono quattro e conviene averli già decisi, perché cadono nei giorni più pieni.",
        ],
        tabella: {
          intestazioni: ["Giorno", "Allenamento", "Pasto su cui puntare"],
          righe: [
            ["Lunedì", "Pesi", "Cena proteica, per esempio maiale con patate e spinaci"],
            ["Martedì", "Cardio", "Pranzo con riso o pasta, merenda con carboidrati"],
            ["Mercoledì", "Riposo", "Piatto completo e meno denso"],
            ["Giovedì", "Pesi", "Cena proteica, per esempio uova con sugo di verdure"],
            ["Venerdì", "Riposo", "Pasti normali"],
            ["Sabato", "Cardio lungo", "Cena del venerdì e colazione con carboidrati"],
            ["Domenica", "Riposo", "Pranzo in famiglia, nessuna regola"],
          ],
        },
      },
      {
        titolo: "Schema C: cinque allenamenti",
        paragrafi: [
          "Per chi si allena cinque volte, magari con una seduta mista come CrossFit o calcetto. È lo schema più impegnativo e quello in cui il meal prep fa più differenza.",
        ],
        tabella: {
          intestazioni: ["Giorno", "Allenamento", "Pasto su cui puntare"],
          righe: [
            ["Lunedì", "Pesi", "Cena proteica"],
            ["Martedì", "Cardio", "Pranzo ricco di carboidrati"],
            ["Mercoledì", "Pesi", "Cena proteica, con verdure"],
            ["Giovedì", "Riposo", "Piatto completo e meno denso"],
            ["Venerdì", "Misto: CrossFit o calcetto", "Piatto ‘cardio e pesi’, merenda prima della seduta"],
            ["Sabato", "Cardio lungo", "Colazione e pranzo con carboidrati"],
            ["Domenica", "Riposo", "Libero"],
          ],
        },
        dopo: [
          "Le linee guida CREA ricordano che solo chi si allena in modo molto intenso e continuativo, cinque-sette giorni a settimana per due o tre ore a seduta, ha bisogno di indicazioni specifiche da medici e nutrizionisti dello sport. Se il tuo schema si avvicina a quel livello, il meal prep è un aiuto pratico, non un sostituto del professionista.",
        ],
      },
      {
        titolo: "Quando cucinare, ritirare e conservare",
        paragrafi: [
          "La cucina FUEL LAB lavora ogni giorno e consegna ogni giorno: puoi ricevere o ritirare i piatti a ridosso del giorno in cui li mangi, così nessun piatto resta a lungo in frigorifero. Se cucini a casa, il ritmo più comodo è di due sessioni a settimana, per esempio domenica e mercoledì sera, per la stessa ragione.",
          "Qualche regola di conservazione dalle linee guida CREA: frigorifero intorno ai +4 °C, cibi cotti raffreddati e messi in frigorifero entro due ore, porzioni piccole in contenitori chiusi, riscaldamento fino a quando il cibo è molto caldo anche all’interno. Per il resto c’è la guida su [come conservare i pasti preparati](/blog/conservare-pasti-preparati-frigorifero).",
        ],
      },
      {
        titolo: "Dallo schema al compositore",
        paragrafi: ["Quando hai scelto lo schema, trasformarlo in una settimana di piatti richiede pochi minuti:"],
        punti: [
          "Apri il [compositore della settimana](/settimana) e segna ogni giorno come cardio, pesi o riposo.",
          "Scegli se ti servono uno o due pasti al giorno: puoi riempire solo i pranzi.",
          "Guarda la proposta: il compositore mette in cima i piatti adatti a ogni giornata e non ripete lo stesso piatto più di tre volte.",
          "Trascina, sostituisci, svuota le caselle che non ti servono, poi invia la settimana a Matteo per confermare disponibilità, ritiro o consegna.",
        ],
      },
    ],
    faq: [
      { domanda: "Quanti giorni di riposo servono?", risposta: "Dipende dal programma e da chi ti segue in palestra. Negli schemi di questa guida c’è sempre almeno un giorno senza allenamento, utile anche per organizzare spesa e cucina." },
      { domanda: "Nei giorni di riposo devo cambiare menu?", risposta: "Non per forza: puoi scegliere un piatto completo e meno denso. Il compositore propone il piatto più leggero del menu come punto di partenza, ma decidi tu." },
      { domanda: "Perché cucinare due volte a settimana e non una?", risposta: "Perché i cibi cotti conservati in frigorifero vanno consumati in tempi brevi: le linee guida CREA parlano in genere di due o tre giorni. Due sessioni riducono i tempi di conservazione e rendono il menu più vario." },
      { domanda: "Gli schemi valgono anche se mi alleno la mattina?", risposta: "Sì: sposta il pasto ricco di carboidrati alla sera prima e alla colazione, e metti il pasto proteico dopo la seduta." },
    ],
    fonti: [FONTI.creaLineeGuida, FONTI.issnProteine],
  },
  {
    slug: "piatti-gia-composti-cosa-sono",
    titolo: "Piatti già composti: cosa sono e perché semplificano la settimana",
    titoloSeo: "Piatti già composti: cosa sono e perché aiutano",
    descrizione: "Piatti già composti: cosa sono, come si differenziano da una box da assemblare e perché ingredienti, grammi e macro dichiarati semplificano la settimana.",
    categoria: "meal-prep",
    parolaChiave: "piatti già composti",
    foto: "cuoco",
    data: DATA_BLOG,
    aggiornato: "2026-10-01",
    piatti: ["riso-julien-pollo-teriyaki", "gnocchetti-sugo-ricotta", "maiale-senape-spinaci"],
    correlati: ["meal-prep-pescara-cosa-significa", "leggere-etichetta-nutrizionale-piatti-pronti", "abbinare-pasti-tipo-allenamento"],
    introduzione:
      "Nel menu FUEL LAB non trovi primi e secondi da combinare, ma piatti già composti: ogni contenitore è un pasto chiuso, con ingredienti, grammi, macro e il motivo per cui quegli elementi stanno insieme. Sembra un dettaglio, ma cambia il modo in cui organizzi la settimana. Vediamo che cosa significa, quali vantaggi porta e quando invece conviene comporre da sé.",
    sezioni: [
      {
        titolo: "Cosa intendiamo per piatto già composto",
        paragrafi: [
          "Un piatto già composto è una ricetta completa pensata dal cuoco: una base di carboidrati, una fonte proteica, le verdure e un condimento, bilanciati in un’unica preparazione. Non scegli tu le proporzioni tra riso e pollo: sono decise in cucina, insieme a sapori e consistenze.",
          "Per ogni piatto la scheda dichiara gli ingredienti con le grammature, gli allergeni e i macro della porzione. Le calorie non sono stimate a occhio: si calcolano dai macro, con 4 kcal per grammo di proteine e di carboidrati e 9 per grammo di grassi. Il [riso con carote, zucchine e pollo teriyaki](/menu/riso-julien-pollo-teriyaki), per esempio, riporta riso basmati, petto di pollo, carote, zucchine, olio d’oliva e olio di sesamo, ciascuno con i suoi grammi.",
        ],
      },
      {
        titolo: "Perché semplifica la settimana",
        paragrafi: ["Il vantaggio principale è che le decisioni si prendono una volta, non a ogni pasto:"],
        punti: [
          "Meno scelte: apri il frigorifero e il pasto è già deciso, completo in ogni sua parte.",
          "Porzione nota: sai quanto mangi, senza pesare o stimare.",
          "Valori leggibili: macro e calorie sono riferiti alla porzione, quindi confronti due piatti in un colpo d’occhio.",
          "Abbinamento all’allenamento: ogni piatto è indicato per cardio, pesi o entrambi, e il [compositore](/settimana) lo usa per proporre la settimana.",
          "Allergeni in chiaro: sono un campo obbligatorio della scheda, come previsto dalle regole europee sull’informazione ai consumatori.",
        ],
      },
      {
        titolo: "Piatto composto o box da assemblare?",
        paragrafi: [
          "Molti servizi propongono basi, proteine e contorni da combinare a piacere. È una formula flessibile, ma sposta su di te il lavoro di comporre il piatto. Il confronto, in sintesi:",
        ],
        tabella: {
          intestazioni: ["Aspetto", "Piatto già composto", "Box da assemblare"],
          righe: [
            ["Decisioni", "Poche: il piatto è completo", "Molte: scegli ogni componente"],
            ["Valori", "Dichiarati per porzione", "Da sommare componente per componente"],
            ["Sapore", "Pensato come un’unica ricetta", "Dipende dagli abbinamenti"],
            ["Personalizzazione", "Aggiunte sulla box", "Libera: scegli ogni elemento"],
          ],
        },
        dopo: [
          "FUEL LAB tiene insieme le due cose: il piatto resta chiuso, ma alla box puoi attaccare delle aggiunte, come carboidrati, proteine, condimenti, verdure di stagione o snack. Le aggiunte si agganciano al piatto, non il contrario.",
        ],
      },
      {
        titolo: "Come leggere la scheda di un piatto",
        paragrafi: ["Ogni scheda del [menu](/menu) segue lo stesso ordine; leggerla in questa sequenza richiede meno di un minuto:"],
        punti: [
          "L’etichetta di allenamento: cardio, pesi oppure cardio e pesi.",
          "I macro della porzione, con la barra che mostra quanta energia viene da proteine, carboidrati e grassi.",
          "Il peso della porzione, in grammi.",
          "Il motivo dell’abbinamento, scritto in cucina.",
          "Gli ingredienti con le grammature e, in fondo, gli allergeni.",
        ],
        dopo: [
          "Se vuoi approfondire come si leggono i valori nutrizionali, la guida su [come leggere l’etichetta di un piatto pronto](/blog/leggere-etichetta-nutrizionale-piatti-pronti) spiega la differenza tra dati per 100 grammi e per porzione.",
        ],
      },
      {
        titolo: "Quando conviene comporre da sé",
        paragrafi: [
          "Il piatto composto non è la risposta a tutto. Se hai un piano del nutrizionista con quantità precise, ti serve partire dai tuoi numeri: la pagina [sui tuoi macro](/scheda) compone la settimana sui tuoi target, scegliendo i piatti più vicini. Se hai allergie o intolleranze importanti, il primo passo è parlarne con Matteo prima di scegliere.",
          "E cucinare a casa resta un’ottima abitudine. I piatti già composti funzionano meglio come alleati per i giorni in cui non c’è tempo, non come sostituti di tutto.",
        ],
      },
      {
        titolo: "Come inserirli nella tua settimana",
        paragrafi: [
          "Il menu ruota su pochi piatti, cucinati freschi ogni giorno. Il modo più semplice di iniziare è scegliere i pasti più difficili della settimana, per esempio i pranzi in ufficio o le cene dopo la palestra, e coprire solo quelli.",
          "Nel [compositore](/settimana) segni gli allenamenti, ottieni una proposta e la ritocchi; poi la invii a Matteo, che conferma disponibilità, ritiro in Via del Santuario 214 o consegna in zona. I modi di lavorare con FUEL LAB sono descritti nella pagina dei [servizi](/servizi): il [meal prep a Pescara](/meal-prep-pescara) con i piatti del menu, i [cinque abbonamenti mensili](/abbonamento) sul piano scritto dal tuo nutrizionista, oppure il [cuoco a domicilio](/cuoco-a-domicilio-pescara), se preferisci che Matteo cucini nella tua cucina.",
        ],
      },
    ],
    faq: [
      { domanda: "Un piatto già composto è un piatto pronto industriale?", risposta: "No. Nel caso di FUEL LAB sono piatti cucinati freschi da Matteo ogni giorno, con ingredienti e grammature dichiarati nella scheda." },
      { domanda: "Posso modificare un piatto?", risposta: "Puoi aggiungere alla box carboidrati, proteine, condimenti, verdure o snack. Per modifiche agli ingredienti, soprattutto in caso di allergie, chiedi prima a Matteo." },
      { domanda: "I macro sono per porzione o per 100 grammi?", risposta: "Nel menu FUEL LAB i valori si riferiscono alla porzione indicata in scheda. Per confrontarli con un’etichetta per 100 grammi, dividi per il peso della porzione e moltiplica per 100." },
      { domanda: "Quanti piatti ci sono nel menu?", risposta: "Oggi sono sei, un numero contenuto perché ogni ricetta resti curata, e il menu può cambiare nel tempo. Trovi quelli in carta, con i valori aggiornati, nella pagina del menu; quali Matteo cucina nei giorni che ti servono te lo conferma lui." },
    ],
    fonti: [FONTI.creaEtichette],
  },
  {
    slug: "pranzo-proteico-ufficio",
    titolo: "Pranzo proteico in ufficio: come comporlo e portarlo al lavoro",
    titoloSeo: "Pranzo proteico in ufficio: idee ed esempi",
    descrizione: "Pranzo proteico in ufficio: come comporre il piatto, quali fonti scegliere, come trasportarlo e conservarlo, con esempi per chi si allena dopo il lavoro.",
    categoria: "lavoro-studio",
    parolaChiave: "pranzo proteico in ufficio",
    foto: "barattolo",
    data: DATA_BLOG,
    piatti: ["maiale-senape-spinaci", "riso-julien-pollo-teriyaki", "uova-purgatorio-peperoni"],
    correlati: ["pranzo-lavoro-pescara-organizzarlo", "quante-proteine-per-pasto", "piatti-gia-composti-cosa-sono"],
    introduzione:
      "Il pranzo in ufficio è spesso il pasto più trascurato della giornata: un panino al bar, un’insalata poco convincente, oppure niente fino alle quattro. Per chi si allena dopo il lavoro è anche il pasto che prepara la seduta serale. Un pranzo proteico non è un piatto di sola carne: è un pasto completo in cui la fonte proteica è ben presente, accompagnata da carboidrati e verdure in proporzioni adatte al pomeriggio che ti aspetta.",
    sezioni: [
      {
        titolo: "Cosa rende un pranzo davvero proteico",
        paragrafi: [
          "Il punto di partenza è una fonte proteica riconoscibile nel piatto. Come ordine di grandezza, le posizioni dell’International Society of Sports Nutrition indicano circa 20–40 grammi di proteine per pasto, pari a 0,25–0,40 grammi per chilo di peso corporeo: la guida su [quante proteine per pasto](/blog/quante-proteine-per-pasto) spiega come orientarsi.",
          "Intorno alla proteina servono una porzione di carboidrati, verdure e un condimento misurato. Le linee guida CREA, nel loro decalogo della pausa pranzo sul posto di lavoro, aggiungono qualche regola di buon senso: attenzione alle porzioni anche quando si prepara il portavivande, frutta e verdura sempre, cotture che non richiedano troppi grassi, acqua come bevanda.",
        ],
      },
      {
        titolo: "Le fonti proteiche più pratiche da portare",
        paragrafi: ["Non tutte le proteine viaggiano allo stesso modo. Alcune opzioni che si conservano e si trasportano bene, se tenute al fresco:"],
        punti: [
          "Carni bianche e magre, cotte e porzionate: pollo, tacchino, fesa di maiale.",
          "Uova, sode o cotte nel sugo, come nelle [uova alla purgatorio](/menu/uova-purgatorio-peperoni).",
          "Legumi: il CREA suggerisce di sceglierli spesso, perché sono sazianti e fonte di proteine vegetali, e ricorda che sono un vero secondo piatto, non un contorno.",
          "Pesce cotto o in scatola, da consumare nei tempi indicati.",
          "Latticini freschi come ricotta, yogurt o formaggi tipo quark, anche come spuntino.",
        ],
      },
      {
        titolo: "Se ti alleni dopo il lavoro",
        paragrafi: [
          "Se la palestra o la corsa arrivano alle 18 o alle 19, il pranzo è il penultimo pasto prima della seduta. Il CREA indica che il pasto prima dell’allenamento deve essere digeribile, ricco di carboidrati e consumato almeno 2–3 ore prima; se passano almeno 3–4 ore si può aggiungere una porzione non abbondante di carne o pesce. Un pranzo alle 13 con allenamento alle 18 rientra bene in questa finestra.",
          "La regola della cucina FUEL LAB si applica anche qui: se la sera fai cardio, il pranzo può essere più ricco di carboidrati, come il [riso con carote, zucchine e pollo teriyaki](/menu/riso-julien-pollo-teriyaki); se fai pesi, il pranzo resta equilibrato e la cena mette le proteine in primo piano. Verso le 16:30, una merenda leggera con carboidrati ti porta in palestra con energia.",
        ],
      },
      {
        titolo: "Trasporto e conservazione in ufficio",
        paragrafi: [
          "Un pranzo proteico contiene quasi sempre alimenti deperibili: carne, pesce, uova, latticini. Il Ministero della Salute raccomanda di non lasciarli a temperatura ambiente, e le linee guida CREA indicano per il frigorifero una temperatura intorno ai +4 °C.",
        ],
        punti: [
          "Usa contenitori ermetici e puliti, meglio se in vetro o adatti al microonde.",
          "Se in ufficio c’è un frigorifero, riponi il pranzo appena arrivi.",
          "Se non c’è, usa una borsa termica con siberini e non lasciarla vicino a fonti di calore.",
          "Scalda il piatto solo se è previsto, fino a quando è molto caldo anche al centro.",
        ],
      },
      {
        titolo: "Cinque pranzi per una settimana",
        paragrafi: ["Un esempio che alterna piatti del menu e preparazioni di casa, per non mangiare sempre la stessa cosa:"],
        punti: [
          "Lunedì: riso, pollo e verdure, come il [riso con pollo teriyaki](/menu/riso-julien-pollo-teriyaki).",
          "Martedì: insalata di farro con ceci, pomodorini e un formaggio fresco, preparata la sera prima.",
          "Mercoledì: uova in sugo di verdure con pane, come le [uova alla purgatorio](/menu/uova-purgatorio-peperoni).",
          "Giovedì: fesa di maiale con patate e spinaci, come il [maiale alla senape](/menu/maiale-senape-spinaci).",
          "Venerdì: pasta e legumi della cucina di casa, con un frutto.",
        ],
        dopo: [
          "Se vuoi organizzare solo i pranzi, il [compositore](/settimana) permette di scegliere un pasto al giorno e di lasciare libere le cene. Per la parte organizzativa della pausa c’è anche la guida sul [pranzo al lavoro a Pescara](/blog/pranzo-lavoro-pescara-organizzarlo).",
        ],
      },
      {
        titolo: "Gli errori più comuni",
        paragrafi: ["Qualche abitudine che rende il pranzo in ufficio meno utile di quanto potrebbe essere:"],
        punti: [
          "Solo proteine, per esempio affettato e basta: il pomeriggio arriva senza carboidrati e la fame torna presto.",
          "Una barretta al posto del pranzo: il CREA mette tra le false credenze l’idea che basti, perché si rischia di concentrare tutto a cena.",
          "Mangiare davanti allo schermo in cinque minuti: lo stesso documento suggerisce di pranzare lontano dalla scrivania, quando possibile.",
          "Dimenticare l’acqua: pasteggiare con acqua aiuta ad arrivare ai 1,5–2 litri al giorno indicati dal CREA.",
        ],
      },
    ],
    faq: [
      { domanda: "Quante proteine deve avere un pranzo proteico?", risposta: "Come riferimento generale, le posizioni ISSN indicano 20–40 grammi per pasto, circa 0,25–0,40 grammi per chilo di peso. Il valore adatto a te dipende da peso, attività e obiettivi." },
      { domanda: "Posso mangiare il pranzo freddo?", risposta: "Sì, se il piatto è pensato per essere consumato freddo ed è stato conservato alla giusta temperatura fino al momento del pasto." },
      { domanda: "Un pranzo proteico va bene anche se non mi alleno?", risposta: "Un pasto con una buona fonte proteica, carboidrati e verdure è un pasto completo per chiunque; cambiano solo le quantità." },
      { domanda: "FUEL LAB consegna in ufficio a Pescara?", risposta: "La consegna in zona va confermata per indirizzo e giorno: i dettagli sono nella pagina sulla [consegna pasti a Pescara](/consegna-pasti-pescara). In alternativa c’è il ritiro in Via del Santuario 214." },
    ],
    fonti: [FONTI.creaLineeGuida, FONTI.issnProteine, FONTI.saluteSicurezza],
  },
  {
    slug: "meal-prep-studenti-universitari-pescara-chieti",
    titolo: "Meal prep per studenti universitari tra Pescara e Chieti",
    titoloSeo: "Meal prep per studenti tra Pescara e Chieti",
    descrizione: "Meal prep per studenti universitari tra Pescara e Chieti: come organizzare pranzi e cene tra lezioni, pendolarismo, sessione d’esami e allenamento.",
    categoria: "lavoro-studio",
    parolaChiave: "meal prep studenti Pescara",
    foto: "cucina",
    data: DATA_BLOG,
    aggiornato: "2026-10-01",
    piatti: ["riso-julien-pollo-teriyaki", "gnocchetti-sugo-ricotta", "uova-purgatorio-peperoni"],
    correlati: ["spesa-settimanale-meal-prep-zero-sprechi", "conservare-pasti-preparati-frigorifero", "settimana-tipo-allenamento-alimentazione"],
    introduzione:
      "Lezioni al mattino a Pescara, laboratorio il pomeriggio a Chieti, palestra la sera e un frigorifero condiviso con tre coinquilini: per molti studenti dell’Università ‘G. d’Annunzio’ il problema non è sapere che cosa sia un pasto equilibrato, è riuscire a mangiarlo. Il meal prep aiuta proprio qui: decidere prima, cucinare in blocco, portare con sé. Ecco un metodo pensato per la vita da studente, con tempi, spazi e budget ridotti.",
    sezioni: [
      {
        titolo: "Parti dall’orario delle lezioni",
        paragrafi: [
          "Prima delle ricette viene il calendario. Segna i giorni con lezioni lunghe, gli spostamenti tra Chieti e Pescara, i turni in biblioteca e gli allenamenti. Nella maggior parte delle settimane emergono tre-cinque pasti critici, di solito i pranzi tra una lezione e l’altra e le cene dopo la palestra.",
          "Sono quelli da organizzare. Gli altri pasti, a casa con calma o fuori con gli amici, possono restare liberi. Pianificare meno pasti, ma quelli giusti, è il modo migliore per non abbandonare il meal prep dopo due settimane.",
        ],
      },
      {
        titolo: "Due sessioni di cucina a settimana",
        paragrafi: [
          "Cucinare tutto la domenica sembra comodo, ma il venerdì il contenitore ha già passato troppi giorni in frigorifero. Le linee guida CREA indicano che i cibi cotti vanno messi in frigorifero entro due ore dalla cottura e conservati per breve tempo, in genere due o tre giorni. Meglio due sessioni brevi, per esempio domenica e mercoledì sera. Nelle settimane di esami, quando mancano anche quelle, puoi affidare qualche pasto a una cucina che lavora ogni giorno, come FUEL LAB, e ricevere i piatti a ridosso del giorno in cui li mangi.",
          "Il metodo più semplice è preparare basi da combinare in modi diversi: un cereale (riso, pasta, farro), una fonte proteica (legumi, uova, pollo) e una teglia di verdure al forno. Con tre basi e condimenti diversi ottieni pasti che non sembrano tutti uguali.",
        ],
      },
      {
        titolo: "Il frigorifero condiviso",
        paragrafi: ["Nelle case di studenti il frigorifero è spesso il punto debole. Qualche regola che evita sprechi e discussioni:"],
        punti: [
          "Contenitori chiusi, con nome e data scritti sul coperchio.",
          "Cibi crudi separati da quelli cotti o pronti, come raccomanda anche il Ministero della Salute.",
          "Frigorifero non troppo pieno e intorno ai +4 °C, come indicano le linee guida CREA, perché l’aria deve circolare.",
          "Un ripiano per ciascuno, così sai sempre che cosa è tuo e che cosa va consumato prima.",
        ],
      },
      {
        titolo: "Spesa da studente: pochi ingredienti, usati bene",
        paragrafi: [
          "Il meal prep fa risparmiare soprattutto perché riduce gli acquisti d’impulso e il cibo buttato. Una lista breve e riutilizzabile funziona meglio di una spesa enorme: legumi secchi o in scatola, uova, riso e pasta, verdure di stagione, yogurt e frutta. Al mercato trovi spesso verdure di stagione a prezzi migliori.",
          "Pianifica le quantità sui pasti che hai davvero deciso di preparare. Trovi un metodo passo per passo nella guida sulla [spesa settimanale per il meal prep](/blog/spesa-settimanale-meal-prep-zero-sprechi).",
        ],
      },
      {
        titolo: "Pranzo tra una lezione e l’altra",
        paragrafi: [
          "Il pasto preparato deve arrivare in aula nelle condizioni giuste. Usa un contenitore ermetico e una borsa termica con siberini, soprattutto nei mesi caldi e se passi ore in autobus o in treno tra Pescara e Chieti. Senza microonde, scegli piatti pensati per essere mangiati freddi, conservati al fresco fino al momento del pranzo.",
          "Le linee guida CREA suggeriscono, quando possibile, di pranzare lontano dalla scrivania, facendo due passi: vale anche per la biblioteca. Una pausa vera aiuta a tornare sui libri con più concentrazione.",
        ],
      },
      {
        titolo: "In sessione d’esami",
        paragrafi: [
          "Sotto esame la tentazione è saltare i pasti o vivere di snack. Il CREA ricorda tra le false credenze che una barretta o un pacchetto di cracker non sostituiscono il pranzo, e che gli spuntini utili sono piccoli: un frutto, uno yogurt, un cucchiaio di frutta secca.",
          "È il momento in cui il meal prep rende di più: i pasti sono già decisi e la testa resta sui libri. Molti trovano che un pranzo molto abbondante e ricco di grassi renda più faticoso il pomeriggio di studio: meglio porzioni normali, con verdure, e un’acqua sempre a portata di mano.",
        ],
      },
      {
        titolo: "Se ti alleni tra una lezione e l’altra",
        paragrafi: [
          "Palestra, calcetto con i compagni di corso, corsa sulla riviera: la regola è la stessa per tutti. Nei giorni di cardio un pasto più ricco di carboidrati, nei giorni di pesi le proteine in primo piano. La spieghiamo nella guida su [come abbinare i pasti al tipo di allenamento](/blog/abbinare-pasti-tipo-allenamento).",
          "Nelle settimane più piene puoi affiancare al meal prep di casa qualche piatto già pronto. Da FUEL LAB c’è il ritiro in Via del Santuario 214 a Pescara, mentre la [consegna in zona](/consegna-pasti-pescara) va verificata per il tuo indirizzo; nel [compositore](/settimana) puoi scegliere anche solo i pranzi.",
        ],
      },
    ],
    faq: [
      { domanda: "Quanto dura il meal prep in un frigorifero condiviso?", risposta: "Dipende da alimento, preparazione e temperatura del frigorifero. Le linee guida CREA parlano in genere di due o tre giorni per i cibi cotti: per questo conviene cucinare due volte a settimana, con contenitori chiusi ed etichettati." },
      { domanda: "Studio a Chieti: posso avere i piatti FUEL LAB?", risposta: "Il ritiro è in Via del Santuario 214 a Pescara. La consegna copre anche Chieti Scalo, ma la copertura del tuo indirizzo va confermata caso per caso: scrivi a Matteo indicando indirizzo e giorni che ti interessano." },
      { domanda: "Come faccio senza microonde in università?", risposta: "Scegli piatti pensati per essere mangiati freddi e tienili al fresco fino al pranzo, con borsa termica e siberini. I cibi deperibili non vanno lasciati a temperatura ambiente." },
      { domanda: "È meglio cucinare tutto la domenica?", risposta: "Non per forza. Due sessioni brevi, per esempio domenica e mercoledì, riducono i giorni di conservazione e la monotonia dei pasti." },
    ],
    fonti: [FONTI.creaLineeGuida, FONTI.saluteSicurezza],
  },
  {
    slug: "cosa-mangiare-prima-di-correre",
    titolo: "Cosa mangiare prima di correre (e prima del cardio)",
    titoloSeo: "Cosa mangiare prima di correre o fare cardio",
    descrizione: "Cosa mangiare prima di correre o di un allenamento cardio: quanto tempo prima, quali carboidrati scegliere, cosa evitare ed esempi pratici per ogni orario.",
    categoria: "allenamento",
    parolaChiave: "cosa mangiare prima di correre",
    foto: "corsa",
    data: DATA_BLOG,
    piatti: ["riso-julien-pollo-teriyaki", "noodles-sesamo-maiale", "gnocchetti-sugo-ricotta"],
    correlati: ["abbinare-pasti-tipo-allenamento", "idratazione-allenamento-caldo-pescara", "cosa-mangiare-calcetto-crossfit-pescara"],
    introduzione:
      "Correre sul lungomare di Pescara al mattino presto, fare spinning in pausa pranzo o un’ora di ellittica dopo il lavoro: il cardio cambia con l’orario, e con l’orario cambia il pasto che lo precede. In generale il pasto prima del cardio deve essere facile da digerire e basato soprattutto sui carboidrati; quanto abbondante e quanto tempo prima dipende da durata, intensità e da come reagisce il tuo stomaco. Ecco le regole di base e qualche esempio da adattare.",
    sezioni: [
      {
        titolo: "Perché prima del cardio contano i carboidrati",
        paragrafi: [
          "Negli sforzi di resistenza i muscoli usano soprattutto il glicogeno, la riserva di carboidrati. Le linee guida CREA raccomandano a chi fa sport di mangiare sufficienti alimenti a base di carboidrati, per avere riserve adeguate ed evitare cali di energia, e di evitare vicino all’allenamento i cibi che richiedono una lunga digestione, come quelli ricchi di grassi, o che possono dare disturbi, come quelli molto ricchi di fibra.",
          "La proporzione dipende dalla seduta. Per trenta minuti di corsa tranquilla bastano i pasti normali della giornata; per un lungo o per delle ripetute il pasto prima conta di più. La posizione ISSN sul timing dei nutrienti indica pasti ricchi di carboidrati nelle ore precedenti soprattutto per gli allenamenti intensi che superano i 90 minuti.",
        ],
      },
      {
        titolo: "Quanto tempo prima mangiare",
        paragrafi: [
          "Il CREA indica che il pranzo prima dell’allenamento deve essere facilmente digeribile, ricco di carboidrati e consumato almeno 2–3 ore prima. Se l’intervallo è di almeno 3–4 ore si può aggiungere una porzione non abbondante di carne o pesce. A ridosso dello sforzo, fino a circa mezz’ora prima, al massimo una piccola ‘razione d’attesa’: qualche biscotto secco, fette biscottate o frutta essiccata. In pratica:",
        ],
        punti: [
          "3–4 ore prima: pasto completo con pasta o riso e condimento leggero, verdura cotta, eventualmente una piccola porzione di carne o pesce.",
          "1–2 ore prima: uno spuntino con carboidrati semplici da digerire, come pane con miele o marmellata, fette biscottate, una banana.",
          "30 minuti prima: poco o niente; se hai fame, qualcosa di piccolo che hai già provato in allenamento.",
        ],
      },
      {
        titolo: "Correre al mattino: colazione o digiuno?",
        paragrafi: [
          "Le linee guida CREA sono nette: non si dovrebbe affrontare l’impegno fisico dopo un digiuno troppo lungo, come quello notturno, né subito dopo un pasto abbondante. Per chi corre alle sette la soluzione pratica è una colazione piccola e digeribile, 30–60 minuti prima: tè o caffè, due fette biscottate con miele o una banana.",
          "Dopo la corsa arriva la colazione vera, più completa: yogurt o latte, pane o cereali, frutta. Se la sera prima ceni con una buona porzione di carboidrati, il lungo del mattino sarà più semplice da gestire. La tolleranza è molto personale: prova le combinazioni negli allenamenti facili, non il giorno di una gara.",
        ],
      },
      {
        titolo: "Cosa evitare nel pasto prima",
        paragrafi: [
          "Il CREA elenca alcuni alimenti da evitare prima dell’allenamento: paste farcite, sughi elaborati, carni grasse, fritture, dolci con panna o creme. Prima di una gara consiglia anche di ridurre la fibra insolubile, per esempio legumi, cereali integrali e verdure crude poco digeribili, per limitare i disturbi gastrointestinali.",
          "Non significa che i legumi o l’integrale siano da evitare in assoluto: sono alimenti preziosi, semplicemente vanno spostati nei pasti lontani dalla corsa o nei giorni di riposo.",
        ],
      },
      {
        titolo: "Durante e dopo: acqua e carboidrati",
        paragrafi: [
          "Secondo il CREA basta l’acqua se l’attività è di intensità moderata o dura meno di 45–60 minuti; bevande con zuccheri e sali hanno senso negli sforzi intensi e prolungati, oltre l’ora, con sudorazione abbondante. Per gli allenamenti oltre i 60 minuti la posizione ISSN indica circa 30–60 grammi di carboidrati all’ora, per esempio con una bevanda al 6–8%.",
          "Dopo la corsa l’obiettivo è reintegrare liquidi e carboidrati, con una fonte proteica nel pasto successivo. D’estate sulla costa servono qualche attenzione in più: le trovi nella guida su [allenarsi con il caldo](/blog/idratazione-allenamento-caldo-pescara).",
        ],
      },
      {
        titolo: "Esempi pratici per orario",
        paragrafi: ["Tre giornate tipo per chi corre, da adattare alla tua tolleranza e alla durata della seduta:"],
        tabella: {
          intestazioni: ["Corsa", "Prima", "Quando", "Dopo"],
          righe: [
            ["Ore 7, 40 minuti facili", "Tè o caffè, due fette biscottate con miele o una banana", "30–60 minuti prima", "Colazione completa: yogurt o latte, pane, frutta"],
            ["Ore 13, pausa pranzo", "Colazione abbondante; a metà mattina pane e marmellata o frutta", "Spuntino 1–2 ore prima", "Pranzo con carboidrati e una fonte proteica"],
            ["Ore 19, ripetute o lungo", "Pranzo con pasta o riso e condimento leggero; merenda con carboidrati", "Pranzo 5–6 ore prima, merenda 1–2 ore prima", "Cena completa con riso o pasta, proteine e verdure"],
          ],
          nota: "Esempi indicativi per un allenamento amatoriale.",
        },
        dopo: [
          "Nei giorni segnati come cardio, il [compositore](/settimana) propone per primi i piatti in cui i carboidrati pesano di più, come il [riso con carote, zucchine e pollo teriyaki](/menu/riso-julien-pollo-teriyaki): un buon pranzo per chi corre la sera.",
        ],
      },
    ],
    faq: [
      { domanda: "Posso correre a stomaco vuoto?", risposta: "Le linee guida CREA sconsigliano di affrontare l’attività fisica dopo un digiuno troppo lungo, come quello notturno. Per una corsa breve e leggera può bastare uno spuntino piccolo e digeribile; se hai dubbi o condizioni particolari, chiedi al medico." },
      { domanda: "Quanto tempo prima di correre posso mangiare la pasta?", risposta: "Per un pasto completo a base di pasta o riso il CREA indica almeno 2–3 ore prima dell’allenamento. Se hai meno tempo, meglio uno spuntino con carboidrati facili da digerire." },
      { domanda: "Servono le bevande per sportivi?", risposta: "Per attività moderate o sotto i 45–60 minuti basta l’acqua, secondo il CREA. Bevande con zuccheri e sali hanno senso negli sforzi intensi e prolungati, oltre l’ora, soprattutto quando si suda molto." },
      { domanda: "I legumi prima della corsa vanno bene?", risposta: "Sono un ottimo alimento, ma sono ricchi di fibra: a ridosso dell’allenamento possono dare fastidio. Meglio inserirli nei pasti lontani dalla corsa o nei giorni di riposo." },
    ],
    fonti: [FONTI.creaLineeGuida, FONTI.issnTiming],
  },
  {
    slug: "cosa-mangiare-sera-dopo-allenamento",
    titolo: "Cosa mangiare la sera dopo l’allenamento",
    descrizione: "Cosa mangiare la sera dopo l’allenamento: una cena completa e digeribile, proteine e carboidrati in base alla seduta, orari tardi ed esempi pratici.",
    categoria: "allenamento",
    parolaChiave: "cosa mangiare la sera dopo l’allenamento",
    foto: "uova",
    data: DATA_BLOG,
    aggiornato: "2026-10-01",
    piatti: ["uova-purgatorio-peperoni", "maiale-senape-spinaci", "riso-julien-pollo-teriyaki"],
    correlati: ["cosa-mangiare-dopo-allenamento-pesi", "cosa-mangiare-calcetto-crossfit-pescara", "pranzo-dopo-allenamento-pescara"],
    introduzione:
      "Per molti l’allenamento arriva dopo il lavoro: palestra alle 19, corsa alle 20, rientro a casa quando la cucina è l’ultima cosa a cui pensare. La cena dopo l’allenamento deve fare due cose insieme: aiutarti a recuperare e lasciarti dormire bene. Il criterio è semplice, un pasto completo e digeribile con una fonte proteica, una porzione di carboidrati e verdure, ma i dettagli cambiano con l’orario e con il tipo di seduta.",
    sezioni: [
      {
        titolo: "La cena che segue l’allenamento",
        paragrafi: [
          "Le linee guida CREA descrivono il pasto che segue l’impegno sportivo come ‘completo e ritemprante’: pasta o riso, meglio se con verdure e legumi, conditi con olio e formaggio grattugiato; una porzione di carne o pesce, oppure uova, formaggio o legumi; verdura e frutta. E aggiungono un dettaglio che vale per tutti: evitare cibi grassi e poco digeribili, perché il sonno è importantissimo per chi si allena.",
          "Lo stesso documento ricorda che, alla fine di qualunque attività, la priorità è reintegrare liquidi e scorte di carboidrati, e che le proteine vanno assunte in una fase precoce del recupero. La cena dopo l’allenamento serale fa esattamente questo lavoro.",
        ],
      },
      {
        titolo: "Dopo il cardio o dopo i pesi",
        paragrafi: [
          "Il tipo di seduta sposta gli equilibri. Dopo un’ora di corsa, bici o nuoto la cena può essere più ricca di carboidrati: riso, pasta, patate o pane, con una fonte proteica e verdure. Dopo i pesi la proteina va in primo piano e i carboidrati restano in quantità moderata, come spieghiamo nella guida su [cosa mangiare dopo l’allenamento con i pesi](/blog/cosa-mangiare-dopo-allenamento-pesi).",
          "È la stessa logica che usa il [compositore della settimana](/settimana): segni il tipo di allenamento del giorno e la proposta mette in cima i piatti più adatti.",
        ],
      },
      {
        titolo: "Se finisci tardi",
        paragrafi: [
          "Quando esci dalla palestra alle 21:30, la tentazione è saltare la cena ‘perché è tardi’ oppure fermarsi al primo locale aperto. Nessuna delle due è una buona idea. Le posizioni ISSN indicano che il periodo utile per le proteine va da subito a circa due ore dopo l’esercizio: cenare entro quella finestra, anche tardi, è meglio che rimandare tutto alla colazione.",
          "La soluzione è ridurre il volume, non la completezza: una porzione più piccola di carboidrati, una fonte proteica, verdure cotte. Un piatto già pronto in frigorifero, da scaldare seguendo le indicazioni, elimina il problema alla radice.",
        ],
      },
      {
        titolo: "Carboidrati la sera: sì o no?",
        paragrafi: [
          "È uno dei miti più resistenti: i carboidrati a cena farebbero ingrassare. Le linee guida CREA lo smontano tra le false credenze: non esistono alimenti che fanno ingrassare o dimagrire in sé, conta l’insieme delle abitudini e delle quantità nel tempo.",
          "Dopo un allenamento serale, anzi, i carboidrati servono a reintegrare le scorte di glicogeno usate durante la seduta. La quantità giusta dipende dalla giornata e dai tuoi obiettivi; se segui un piano, rispetta le indicazioni del professionista che lo ha scritto.",
        ],
      },
      {
        titolo: "Proteine prima di dormire",
        paragrafi: [
          "La posizione ISSN sulle proteine riporta che 30–40 grammi di caseine prima di dormire aumentano la sintesi proteica notturna. Le caseine sono le proteine principali del latte: le trovi nel latte, nello yogurt e in formaggi freschi come il quark e la ricotta.",
          "Non è un obbligo né un trucco: è un’opzione per chi ha una cena presto e va a letto tardi, o per chi fatica ad arrivare alla propria quota di proteine. Un vasetto di yogurt da solo è lontano da quelle quantità, e non serve rincorrere il numero: se vuoi provare, scegli un alimento semplice e non un prodotto speciale. Con disturbi digestivi o del sonno, chiedi prima al tuo medico.",
        ],
      },
      {
        titolo: "Quattro cene pronte in dieci minuti",
        paragrafi: ["Idee per le sere in cui hai poco tempo e poca voglia di cucinare:"],
        punti: [
          "Uova, sugo di verdure e pane: sono le [uova alla purgatorio con sugo di peperoni](/menu/uova-purgatorio-peperoni), il piatto del menu con i valori energetici più contenuti.",
          "Carne magra con patate e verdure: il [maiale alla senape con spinaci e patate novelle](/menu/maiale-senape-spinaci), per le sere dopo i pesi.",
          "Riso, pollo e verdure: il [riso con carote, zucchine e pollo teriyaki](/menu/riso-julien-pollo-teriyaki), per le sere dopo il cardio.",
          "A casa: una frittata con verdure e pane, oppure pasta e legumi preparati in anticipo e riscaldati bene.",
        ],
        dopo: [
          "Se l’allenamento serale è una partita di calcetto o un WOD, trovi indicazioni specifiche nella guida su [calcetto, CrossFit e palestra](/blog/cosa-mangiare-calcetto-crossfit-pescara).",
        ],
      },
    ],
    faq: [
      { domanda: "Mangiare carboidrati la sera fa ingrassare?", risposta: "Non un alimento in sé: secondo le linee guida CREA non esistono cibi che fanno ingrassare o dimagrire, contano l’insieme delle abitudini e le quantità. Dopo un allenamento serale i carboidrati aiutano a reintegrare le scorte usate." },
      { domanda: "Se mi alleno alle 21 devo cenare prima o dopo?", risposta: "Molti preferiscono una merenda con carboidrati nel tardo pomeriggio e una cena completa ma leggera dopo la seduta. Evita un pasto abbondante subito prima dell’allenamento." },
      { domanda: "Posso cenare solo con uno shake proteico?", risposta: "Uno shake non sostituisce un pasto completo: mancano carboidrati, verdure e varietà. Se usi un integratore su indicazione di un professionista, consideralo un’aggiunta." },
      { domanda: "Qual è il piatto FUEL LAB più leggero per la sera?", risposta: "Tra i piatti del menu, le uova alla purgatorio con sugo di peperoni hanno i valori energetici più contenuti. Controlla la scheda del piatto per ingredienti e allergeni." },
    ],
    fonti: [FONTI.creaLineeGuida, FONTI.issnTiming, FONTI.issnProteine],
  },
  {
    slug: "meal-prep-pescara-cosa-significa",
    titolo: "Meal prep a Pescara: che cos’è e come può semplificare la settimana",
    titoloSeo: "Meal prep a Pescara: cos’è e come funziona",
    descrizione: "Meal prep a Pescara: cos’è, come si organizza una settimana di pasti e da dove iniziare per arrivare a pranzo e a cena con meno improvvisazione.",
    categoria: "meal-prep",
    parolaChiave: "meal prep Pescara",
    foto: "couscous",
    data: DATA_BLOG,
    aggiornato: "2026-09-30",
    piatti: ["riso-julien-pollo-teriyaki", "pallotte-cacio-ovo", "uova-purgatorio-peperoni"],
    correlati: ["piatti-gia-composti-cosa-sono", "menu-settimanale-pescara-come-pianificarlo", "conservare-pasti-preparati-frigorifero"],
    introduzione:
      "Meal prep significa preparare in anticipo una parte dei pasti della settimana: decidere prima che cosa mangerai, cucinarlo in blocco o farlo cucinare, porzionarlo e conservarlo fino al momento giusto. A Pescara è utile a chi alterna lavoro, studio e allenamento e vuole arrivare a pranzo e a cena senza improvvisare. Non è una dieta e non obbliga a mangiare sempre lo stesso piatto: è un metodo di organizzazione. Qui vediamo le forme che può prendere, da dove cominciare e quali errori evitare.",
    sezioni: [
      {
        titolo: "Che cosa vuol dire, in pratica",
        paragrafi: [
          "L’espressione viene dall’inglese meal preparation, preparazione dei pasti, e comprende tre momenti: la pianificazione (quali pasti, quali giorni, quali ricette), la preparazione (spesa, cottura, porzionatura) e la conservazione fino al consumo. Saltarne uno è il motivo più comune per cui il meal prep si abbandona dopo due settimane: si cucina senza un piano, oppure si pianifica senza sapere dove e per quanti giorni si terrà il cibo.",
          "Il meal prep non riguarda per forza tutti i pasti. Molti lo usano solo per i pranzi in ufficio, altri per le cene dopo la palestra. La domanda da cui partire non è ‘quanti contenitori riempio’, ma ‘quali pasti rischio di saltare o di improvvisare’.",
        ],
      },
      {
        titolo: "Tre modi di fare meal prep",
        paragrafi: ["Non esiste un metodo unico. I più diffusi sono tre, e si possono combinare nella stessa settimana:"],
        tabella: {
          intestazioni: ["Metodo", "Come funziona", "Per chi è adatto"],
          righe: [
            ["Piatti completi porzionati", "Si cucinano due o tre ricette e si dividono in porzioni pronte da scaldare", "Chi vuole aprire il frigorifero e trovare il pasto già deciso"],
            ["Basi da combinare", "Si preparano un cereale, una fonte proteica e delle verdure, da assemblare al momento con condimenti diversi", "Chi si stanca di mangiare lo stesso piatto"],
            ["Ingredienti pronti", "Si lavano e tagliano le verdure, si cuociono legumi e cereali, e la ricetta si chiude in pochi minuti", "Chi ha poco tempo ma ama cucinare la sera"],
          ],
          nota: "I metodi si mescolano: per esempio basi fatte in casa e qualche piatto già pronto nei giorni più pieni.",
        },
        dopo: [
          "Accanto al fai da te c’è una quarta strada: affidare una parte della preparazione a una cucina. È il caso dei [piatti già composti](/blog/piatti-gia-composti-cosa-sono), cucinati e porzionati da altri, con ingredienti e valori dichiarati.",
        ],
      },
      {
        titolo: "La prima settimana, passo per passo",
        paragrafi: ["Il modo più sicuro per iniziare è partire in piccolo:"],
        punti: [
          "Guarda il calendario e segna i due o tre pasti più difficili: il pranzo del giorno con più riunioni, la cena dopo l’allenamento serale.",
          "Scegli una ricetta che conosci e ti piace, da ripetere al massimo due volte, più una teglia di verdure.",
          "Verifica lo spazio: quanti contenitori entrano in frigorifero, se in ufficio ci sono un frigo e un microonde.",
          "Cucina o ritira i pasti il giorno prima dell’inizio del blocco, non una settimana prima.",
        ],
        dopo: [
          "A fine settimana guarda che cosa è rimasto nel frigorifero: se un contenitore è tornato indietro, la volta dopo pianifica un pasto in meno. Per trasformare il metodo in un calendario vero c’è la guida su [come pianificare il menu settimanale](/blog/menu-settimanale-pescara-come-pianificarlo).",
        ],
      },
      {
        titolo: "Quanto dura un pasto preparato",
        paragrafi: [
          "È la domanda che decide tutta l’organizzazione. Le linee guida CREA indicano che i cibi cotti, se non si mangiano subito, vanno raffreddati, messi in frigorifero al massimo entro due ore dalla cottura (un’ora d’estate) e conservati per breve tempo, in genere due o tre giorni; per tempi più lunghi vanno congelati. Il frigorifero va tenuto intorno ai +4 °C.",
          "Da qui la regola pratica per chi cucina a casa: due sessioni di preparazione a settimana invece di una. Una cucina che lavora ogni giorno, come FUEL LAB, accorcia ancora i tempi: il piatto arriva a ridosso del giorno in cui lo mangi. Quando un prodotto riporta istruzioni o una data, valgono quelle; le altre regole sono nella guida su [come conservare i pasti preparati](/blog/conservare-pasti-preparati-frigorifero).",
        ],
      },
      {
        titolo: "Gli errori che fanno abbandonare il meal prep",
        paragrafi: ["Chi prova e smette di solito inciampa sempre negli stessi punti:"],
        punti: [
          "Preparare quattordici pasti la prima settimana: troppo lavoro, troppi contenitori, troppi avanzi.",
          "Cucinare tutto la domenica e arrivare al venerdì con piatti conservati troppo a lungo.",
          "Ripetere la stessa ricetta per cinque giorni: la noia porta dritti al bar sotto l’ufficio.",
          "Dimenticare verdure e condimenti: un contenitore di solo riso e pollo è un pasto incompleto e poco invitante.",
          "Non lasciare caselle libere per cene fuori e imprevisti.",
        ],
      },
      {
        titolo: "Il meal prep a Pescara con FUEL LAB",
        paragrafi: [
          "Se cucinare in blocco non fa per te, o non sempre, puoi affidare una parte della settimana a una cucina. Con il [meal prep di FUEL LAB a Pescara](/meal-prep-pescara) Matteo, che è un cuoco, prepara piatti freschi ogni giorno: il [riso con carote, zucchine e pollo teriyaki](/menu/riso-julien-pollo-teriyaki), le [pallotte cacio e ova fit](/menu/pallotte-cacio-ovo), le [uova alla purgatorio](/menu/uova-purgatorio-peperoni) e gli altri piatti del [menu](/menu), ciascuno con ingredienti, allergeni e macro della porzione.",
          "Scegli i pasti nel [compositore della settimana](/settimana), anche solo due o tre, e manda la richiesta: Matteo conferma disponibilità, ritiro in Via del Santuario 214 o [consegna a Pescara e dintorni](/consegna-pasti-pescara). Se vuoi i pasti di tutta la settimana senza pensarci, ci sono gli [abbonamenti mensili](/abbonamento): Matteo cucina il piano del tuo nutrizionista e lo porta ogni 3 giorni; se preferisci che la preparazione avvenga nella tua cucina, c’è il servizio di [cuoco a domicilio](/cuoco-a-domicilio-pescara).",
        ],
      },
    ],
    faq: [
      { domanda: "Meal prep vuol dire seguire una dieta?", risposta: "No. È un metodo per organizzare i pasti in anticipo: decide quando e che cosa mangerai, non stabilisce quantità o obiettivi nutrizionali. Se segui un piano, il meal prep serve a rispettarlo con meno fatica." },
      { domanda: "Devo preparare tutti i pasti della settimana?", risposta: "No. Conviene partire da due o tre pasti, quelli che rischi di saltare, e aggiungerne altri solo se ti accorgi che servono. Lasciare caselle libere evita sprechi." },
      { domanda: "Quanti giorni si conservano i pasti preparati?", risposta: "Per i cibi cotti le linee guida CREA indicano in genere due o tre giorni in frigorifero, intorno ai +4 °C. Per questo conviene cucinare due volte a settimana; se il piatto riporta istruzioni o una data, valgono quelle." },
      { domanda: "Posso fare meal prep a Pescara senza cucinare?", risposta: "Sì, affidando i pasti a una cucina. FUEL LAB cucina ogni giorno e consegna ogni giorno, con ritiro in Via del Santuario 214 o consegna in zona da confermare per il tuo indirizzo." },
    ],
    fonti: [FONTI.creaLineeGuida],
  },
  {
    slug: "cucina-salutare-asporto-pescara",
    titolo: "Cucina salutare d’asporto a Pescara: cosa guardare quando scegli un pasto",
    titoloSeo: "Cucina salutare d’asporto a Pescara: cosa guardare",
    descrizione: "Cucina salutare d’asporto a Pescara: cosa guardare quando scegli un pasto, da ingredienti e allergeni alle porzioni, alla conservazione e al servizio.",
    categoria: "pescara-abruzzo",
    parolaChiave: "cucina salutare d’asporto Pescara",
    foto: "ciotola",
    data: DATA_BLOG,
    aggiornato: "2026-09-27",
    piatti: ["uova-purgatorio-peperoni", "riso-julien-pollo-teriyaki", "gnocchetti-sugo-ricotta"],
    correlati: ["consegna-pasti-pescara-cosa-chiedere", "leggere-etichetta-nutrizionale-piatti-pronti", "piatto-equilibrato-ingredienti-varieta"],
    introduzione:
      "Cercare cucina salutare d’asporto a Pescara significa, quasi sempre, cercare un pasto comodo che non ti faccia rimpiangere di non aver cucinato. Il problema è che ‘salutare’ non è una garanzia: è un aggettivo che chiunque può scrivere su un menu. Per scegliere servono informazioni verificabili, cioè ingredienti, allergeni, porzione, cottura e condimenti, più qualche domanda su trasporto e conservazione. Questa guida è una lista di controllo da usare con qualunque locale, FUEL LAB compreso.",
    sezioni: [
      {
        titolo: "‘Salutare’ non basta: cosa guardare davvero",
        paragrafi: [
          "Un piatto non diventa adatto a te per come viene chiamato. ‘Bowl’, ‘fit’, ‘light’ o ‘proteico’ descrivono un’intenzione; conta che cosa c’è dentro e in che quantità. Per i prodotti confezionati alcune diciture, come ‘leggero’ o ‘a basso contenuto di grassi’, hanno soglie di legge precise, che il CREA elenca nella sua guida alle etichette; il nome di un piatto preparato al momento, invece, non è legato a nessun numero.",
          "Per questo conviene guardare cinque cose, sempre nello stesso ordine:",
        ],
        punti: [
          "Ingredienti: sono scritti per intero o solo nel nome del piatto?",
          "Allergeni: sono indicati per ogni piatto?",
          "Porzione: quanto pesa, o almeno quanto è abbondante rispetto al tuo appetito?",
          "Cottura e condimenti: piastra, forno, vapore o frittura? Salse a parte o già dentro?",
          "Conservazione: il piatto va mangiato subito o può aspettare in frigorifero?",
        ],
      },
      {
        titolo: "Allergeni: l’informazione obbligatoria",
        paragrafi: [
          "Per i cibi venduti senza preimballaggio, o preimballati per la vendita diretta, come molti piatti d’asporto, il Regolamento europeo 1169/2011 rende obbligatoria l’informazione sugli allergeni; la tabella nutrizionale, invece, non lo è, salvo disposizioni nazionali. Gli allergeni da dichiarare sono quattordici: cereali con glutine, crostacei, uova, pesce, arachidi, soia, latte, frutta a guscio, sedano, senape, sesamo, anidride solforosa e solfiti oltre certe soglie, lupini e molluschi.",
          "Se hai un’allergia o un’intolleranza, la scheda online è un punto di partenza, non una garanzia: chiedi sempre conferma diretta a chi cucina, anche sulle possibili contaminazioni.",
        ],
      },
      {
        titolo: "Valori nutrizionali: utili se riferiti alla porzione",
        paragrafi: [
          "Proprio perché non sono obbligatori per i piatti d’asporto, i valori nutrizionali, quando ci sono, vanno letti con attenzione. La domanda chiave è: a che cosa si riferiscono? Sulle etichette dei prodotti confezionati i valori sono sempre per 100 grammi o 100 millilitri, e possono essere dati anche per porzione; un menu può riportare l’una o l’altra cosa, e la differenza cambia tutto.",
          "Un esempio: un piatto che dichiara 150 kcal per 100 grammi, con una porzione di 500 grammi, porta 750 kcal. Nel [menu FUEL LAB](/menu) i valori si riferiscono alla porzione intera indicata in scheda, e le calorie sono calcolate dai macro con i coefficienti del regolamento europeo: 4 kcal per grammo di proteine e di carboidrati, 9 per grammo di grassi. Come leggere questi numeri è spiegato nella guida sui [macro alimentari](/blog/macro-cosa-sono-come-leggerli).",
        ],
      },
      {
        titolo: "Porzioni, cotture e condimenti",
        paragrafi: [
          "Le linee guida CREA, nella parte dedicata ai pasti fuori casa, suggeriscono di puntare su una sola pietanza con un contorno di verdure e un frutto, di preferire piatti non troppo ricchi di sale e di grassi da condimento e di non eccedere con pane e sostituti. Per la pausa pranzo sul lavoro indicano cotture leggere, come piastra, vapore, cartoccio o forno, e di assaggiare prima di aggiungere sale.",
          "Nell’asporto questo si traduce in domande semplici: il piatto ha verdure o vanno aggiunte? La salsa è già dentro o a parte? È fritto? Nessuna risposta rende un piatto ‘giusto’ o ‘sbagliato’ in assoluto: serve a capire se è adatto alla tua giornata, per esempio a un pranzo prima dell’allenamento, quando le fritture è meglio lasciarle.",
        ],
      },
      {
        titolo: "Trasporto e conservazione",
        paragrafi: [
          "Un pasto preso a mezzogiorno e mangiato alle quattro non è più lo stesso pasto. Il Ministero della Salute raccomanda di non lasciare i cibi deperibili a temperatura ambiente e di tenere in frigorifero, separati e in contenitori chiusi, gli alimenti cotti o non consumati durante il pasto; le linee guida CREA indicano di riporre in frigorifero una pietanza cotta al massimo entro due ore, un’ora d’estate.",
          "Se ritiri il pasto per il giorno dopo, chiedi come conservarlo, come scaldarlo e se il contenitore va nel microonde. Se lo porti in ufficio, una borsa termica con siberini fa la differenza, soprattutto d’estate sulla costa.",
        ],
      },
      {
        titolo: "Due locali a confronto",
        paragrafi: ["Quando devi scegliere tra due opzioni, questa griglia aiuta a capire dove fare una domanda in più:"],
        tabella: {
          intestazioni: ["Cosa controllare", "Risposta che aiuta", "Risposta da chiarire"],
          righe: [
            ["Ingredienti", "Elenco completo, con le grammature principali", "Solo il nome del piatto"],
            ["Allergeni", "Indicati piatto per piatto", "Da chiedere di volta in volta"],
            ["Valori", "Riferiti alla porzione che ricevi", "Solo per 100 grammi, senza il peso della porzione"],
            ["Cottura", "Descritta: forno, piastra, vapore, padella", "Non indicata"],
            ["Conservazione", "Istruzioni per frigorifero e riscaldamento", "Nessuna indicazione"],
          ],
          nota: "Una risposta da chiarire non squalifica un locale: è il punto su cui chiedere prima di ordinare.",
        },
      },
      {
        titolo: "L’asporto di FUEL LAB a Pescara",
        paragrafi: [
          "FUEL LAB non è un locale con il bancone: è una cucina che prepara piatti freschi ogni giorno, da ritirare in Via del Santuario 214 o da ricevere con la [consegna a Pescara e dintorni](/consegna-pasti-pescara). Ogni scheda del [menu](/menu) riporta ingredienti con i grammi, allergeni, peso della porzione e macro: le [uova alla purgatorio con sugo di peperoni](/menu/uova-purgatorio-peperoni), per esempio, dichiarano uova e latte, il [riso con pollo teriyaki](/menu/riso-julien-pollo-teriyaki) sesamo e soia.",
          "Puoi scegliere i piatti nel [compositore](/settimana) e scrivere a Matteo dalla pagina [Scrivi a Matteo](/richiesta) per disponibilità, zona e domande sugli ingredienti. Se hai allergie, dillo nella richiesta: la conferma su contaminazioni e sostituzioni arriva da lui, non dalla scheda.",
        ],
      },
    ],
    faq: [
      { domanda: "Cosa vuol dire cucina salutare d’asporto?", risposta: "È una descrizione ampia, non una categoria definita. Per capire se un piatto fa per te guarda ingredienti, allergeni, porzione, cottura e condimenti, e confrontali con la tua giornata e con le indicazioni del tuo professionista, se ne hai." },
      { domanda: "I piatti d’asporto devono avere la tabella nutrizionale?", risposta: "Per i cibi venduti senza preimballaggio il Regolamento UE 1169/2011 rende obbligatoria l’informazione sugli allergeni, non la dichiarazione nutrizionale, salvo disposizioni nazionali. Quando un locale pubblica i valori, verifica se sono per 100 grammi o per porzione." },
      { domanda: "Quanto può restare fuori dal frigo un pasto d’asporto?", risposta: "Il meno possibile. Le linee guida CREA indicano di mettere in frigorifero una pietanza cotta entro due ore, un’ora d’estate; per un piatto ritirato per il giorno dopo segui le istruzioni di chi l’ha preparato." },
      { domanda: "FUEL LAB consegna in tutta Pescara?", risposta: "Le consegne sono tutti i giorni a Pescara e nei comuni vicini, ma la copertura del singolo indirizzo va confermata prima dell’ordine. In alternativa c’è il ritiro in Via del Santuario 214." },
    ],
    fonti: [FONTI.ue1169, FONTI.creaEtichette, FONTI.creaLineeGuida, FONTI.saluteSicurezza],
  },
  {
    slug: "pranzo-lavoro-pescara-organizzarlo",
    titolo: "Pranzo al lavoro a Pescara: idee per organizzare la pausa senza improvvisare",
    titoloSeo: "Pranzo al lavoro a Pescara: come organizzarlo",
    descrizione: "Pranzo al lavoro a Pescara: come organizzare la pausa con pasti da portare in ufficio, contenitori adatti, conservazione e un menu vario per la settimana.",
    categoria: "lavoro-studio",
    parolaChiave: "pranzo al lavoro Pescara",
    foto: "ciotole",
    data: DATA_BLOG,
    aggiornato: "2026-09-30",
    piatti: ["riso-julien-pollo-teriyaki", "gnocchetti-sugo-ricotta", "uova-purgatorio-peperoni"],
    correlati: ["pranzo-proteico-ufficio", "consegna-pasti-pescara-cosa-chiedere", "meal-prep-pescara-cosa-significa"],
    introduzione:
      "La pausa pranzo spesso dura meno del previsto: una riunione che si allunga, un cliente in ritardo, una commissione da fare. Se il pranzo non è deciso prima, la scelta cade su quello che è più vicino. Organizzare il pranzo al lavoro a Pescara vuol dire rispondere a poche domande pratiche, quanto tempo hai, dove mangi, se c’è un frigorifero, e scegliere per ogni giorno la soluzione giusta. Questa guida parte dalla logistica; per la composizione del piatto c’è la guida sul pranzo proteico.",
    sezioni: [
      {
        titolo: "Fotografa la tua pausa pranzo",
        paragrafi: ["Prima del menu, prendi una settimana tipo e rispondi a quattro domande. Sono le risposte che decidono che cosa puoi portare e che cosa no:"],
        punti: [
          "Quanto dura davvero la pausa: un’ora, mezz’ora o dieci minuti davanti allo schermo?",
          "Dove mangi: in ufficio, in un locale, in auto tra un appuntamento e l’altro?",
          "Che cosa hai a disposizione: frigorifero, microonde, posate, un tavolo lontano dalla scrivania?",
          "Che cosa succede dopo: altre ore alla scrivania, un pomeriggio in giro, l’allenamento alle 18?",
        ],
        dopo: [
          "Chi lavora in un negozio del centro, chi sta in ufficio tutto il giorno e chi si sposta tra Pescara e Montesilvano per lavoro avrà risposte diverse, e quindi soluzioni diverse. Non esiste un pranzo da ufficio valido per tutti.",
        ],
      },
      {
        titolo: "Le quattro soluzioni, a confronto",
        paragrafi: ["Nella maggior parte delle settimane si alternano quattro soluzioni. Nessuna è migliore in assoluto: cambiano il tempo richiesto e quanto sai di quello che mangi."],
        tabella: {
          intestazioni: ["Soluzione", "Tempo richiesto", "Cosa sai del pasto", "Punto critico"],
          righe: [
            ["Portavivande da casa", "Preparazione la sera prima o nel weekend", "Tutto: ingredienti e quantità li decidi tu", "Conservazione fino alla pausa"],
            ["Piatto già pronto, ritirato o consegnato", "Pochi minuti per scegliere", "Quello che dichiara la scheda: ingredienti, allergeni, valori", "Organizzare ritiro o consegna"],
            ["Tavola calda o bar", "Nessuna preparazione", "Poco: porzioni e condimenti variano", "Scelte d’impulso, poco tempo"],
            ["Mensa aziendale", "Nessuna preparazione", "Il menu del giorno", "La tentazione di prendere tutto"],
          ],
          nota: "Molte settimane funzionano meglio con due o tre soluzioni alternate.",
        },
      },
      {
        titolo: "Se pranzi fuori: le scelte più semplici",
        paragrafi: [
          "Le linee guida CREA dedicano un capitolo ai pasti fuori casa. Al ristorante o alla tavola calda suggeriscono una sola pietanza, un primo o un secondo, con un contorno di verdure e un frutto, senza esagerare con pane, grissini e focaccia. Al bar il panino può essere un piccolo pasto abbastanza assortito, se l’imbottitura non è eccessiva e se ogni tanto contiene verdura.",
          "In mensa il rischio è quello che il CREA chiama ‘sindrome da buffet’: davanti a tante portate, soprattutto a prezzo fisso, si tende a non rinunciare a niente. Anche qui la regola è un piatto con contorno e un frutto. Per chi torna alla scrivania, lo stesso documento osserva che evitare alcolici e dolci aiuta la concentrazione nelle ore successive.",
        ],
      },
      {
        titolo: "Se porti il pranzo: attrezzatura e conservazione",
        paragrafi: ["Il portavivande funziona se il pasto arriva alla pausa nelle condizioni giuste. L’essenziale:"],
        punti: [
          "Contenitori ermetici, meglio in vetro o adatti al microonde, uno per pasto.",
          "Una borsa termica con siberini se in ufficio non c’è il frigorifero o se il tragitto è lungo.",
          "Il pranzo in frigorifero appena arrivi: il Ministero della Salute raccomanda di non lasciare i cibi deperibili a temperatura ambiente.",
          "Senza microonde, piatti pensati per essere mangiati freddi: insalate di cereali e legumi, verdure grigliate, frittate.",
          "Posate e una bottiglia d’acqua in borsa, così la pausa non comincia cercando una forchetta.",
        ],
        dopo: [
          "Se prepari il pranzo la sera prima, le linee guida CREA indicano di mettere i cibi cotti in frigorifero entro due ore dalla cottura e di consumarli in genere entro due o tre giorni. Le altre regole sono nella guida su [come conservare i pasti preparati](/blog/conservare-pasti-preparati-frigorifero).",
        ],
      },
      {
        titolo: "Un piano per cinque giorni",
        paragrafi: ["Un esempio per chi lavora in ufficio a Pescara e va in palestra il martedì e il giovedì sera:"],
        punti: [
          "Lunedì: portavivande preparato la domenica sera, per esempio farro, ceci e verdure al forno.",
          "Martedì: un piatto già pronto consegnato in ufficio, come il [riso con carote, zucchine e pollo teriyaki](/menu/riso-julien-pollo-teriyaki), ricco di carboidrati prima della palestra.",
          "Mercoledì: tavola calda con i colleghi, una pietanza con contorno di verdure e un frutto.",
          "Giovedì: portavivande preparato il mercoledì sera, con uova, verdure e pane.",
          "Venerdì: un altro piatto pronto, come gli [gnocchetti al sugo con ricotta fresca](/menu/gnocchetti-sugo-ricotta), oppure pranzo libero se esci prima.",
        ],
        dopo: [
          "Nel [compositore](/settimana) puoi scegliere solo i pranzi e lasciare vuote le cene. Se la sera ti alleni, la guida sul [pranzo proteico in ufficio](/blog/pranzo-proteico-ufficio) spiega come comporre il piatto in vista della seduta.",
        ],
      },
      {
        titolo: "Piccole regole per la pausa",
        paragrafi: ["Dal decalogo CREA per la pausa pranzo sul posto di lavoro, le regole più facili da mettere in pratica:"],
        punti: [
          "Assaggia prima di salare: i piatti arrivano già conditi.",
          "A fine pasto, abitualmente, frutta al posto di dolci e pasticcini.",
          "Spuntini piccoli: frutta, verdura da sgranocchiare, yogurt, oppure prodotti confezionati da circa 100 kcal.",
          "Varia il menu: variare significa sostituire, non aggiungere.",
          "Se un pranzo di lavoro è stato abbondante, basta un pasto successivo più leggero.",
        ],
      },
      {
        titolo: "Il pranzo al lavoro con FUEL LAB",
        paragrafi: [
          "Se lavori a Pescara, a Montesilvano, a Spoltore o negli altri comuni della zona, puoi chiedere che i piatti arrivino in ufficio nei giorni che ti servono, oppure ritirarli in Via del Santuario 214. La copertura del singolo indirizzo si conferma prima dell’ordine: i dettagli sono nella pagina sulla [consegna pasti a Pescara](/consegna-pasti-pescara). Se vuoi il pranzo pronto dal lunedì al venerdì, ci sono gli [abbonamenti mensili](/abbonamento): Matteo cucina il piano del tuo nutrizionista e lo porta ogni 3 giorni.",
          "Prima di chiedere, verifica in ufficio dove terrai i piatti: sono piatti da frigorifero, da riporre appena arrivano. Per sapere che cosa domandare a qualunque servizio c’è la guida su [cosa chiedere prima di scegliere una consegna pasti](/blog/consegna-pasti-pescara-cosa-chiedere).",
        ],
      },
    ],
    faq: [
      { domanda: "Come porto il pranzo in ufficio in sicurezza?", risposta: "Usa contenitori puliti e chiusi, tieni i cibi deperibili al fresco con frigorifero o borsa termica e siberini, e riponi il pasto in frigo appena arrivi. Se il piatto ha istruzioni di conservazione, seguile." },
      { domanda: "Posso comporre un menu solo per i pranzi?", risposta: "Sì. Nel compositore puoi scegliere un pasto al giorno e lasciare vuote le cene o i giorni in cui mangi fuori." },
      { domanda: "Cosa scelgo alla tavola calda se ho poco tempo?", risposta: "Le linee guida CREA suggeriscono una sola pietanza, un primo o un secondo, con un contorno di verdure e un frutto, senza eccedere con pane e sostituti e preferendo piatti non troppo ricchi di sale e condimenti." },
      { domanda: "FUEL LAB consegna in ufficio?", risposta: "Puoi indicare l’indirizzo del lavoro nella richiesta: le consegne sono tutti i giorni a Pescara e nei comuni vicini, e la copertura si conferma prima dell’ordine." },
    ],
    fonti: [FONTI.creaLineeGuida, FONTI.saluteSicurezza],
  },
  {
    slug: "piatto-equilibrato-ingredienti-varieta",
    titolo: "Come comporre un piatto equilibrato: ingredienti, varietà e porzioni",
    titoloSeo: "Come comporre un piatto equilibrato",
    descrizione: "Come comporre un piatto equilibrato: verdure, cereali, fonti proteiche e condimenti, con varietà e porzioni adatte ai tuoi gusti e alla tua giornata.",
    categoria: "etichette-nutrienti",
    parolaChiave: "piatto equilibrato",
    foto: "bowl",
    data: DATA_BLOG,
    aggiornato: "2026-10-01",
    piatti: ["riso-julien-pollo-teriyaki", "maiale-senape-spinaci", "uova-purgatorio-peperoni"],
    correlati: ["macro-cosa-sono-come-leggerli", "pasti-con-proteine-menu-settimanale", "abbinare-pasti-tipo-allenamento"],
    introduzione:
      "Comporre un piatto equilibrato non richiede ingredienti speciali né bilance di precisione. Servono un’idea di proporzioni, qualche riferimento sulle porzioni e l’abitudine a variare nel corso della settimana. In questa guida partiamo da due strumenti pubblici, il ‘piatto del mangiar sano’ della scuola di sanità pubblica di Harvard e le porzioni standard delle linee guida CREA, e li traduciamo in esempi da tavola. Sono riferimenti generali per adulti sani, non una dieta personale.",
    sezioni: [
      {
        titolo: "Il modello del piatto diviso in quattro",
        paragrafi: [
          "Il riferimento visivo più semplice è l’Healthy Eating Plate della Harvard T.H. Chan School of Public Health: metà piatto di verdura e frutta, un quarto di cereali, meglio se integrali, un quarto di una fonte proteica come pesce, pollame, legumi o frutta secca; oli buoni come l’olio d’oliva per cucinare e condire, acqua come bevanda. Lo stesso modello precisa che non fissa calorie né numeri di porzioni: indica proporzioni approssimative.",
          "Le linee guida CREA aggiungono un dettaglio utile per la cucina italiana: le patate sono una buona fonte di amido e si avvicinano ai cereali, ma non sostituiscono verdure e ortaggi, anche se per tradizione le usiamo come contorno. Un piatto di pollo e patate, quindi, ha ancora bisogno delle sue verdure.",
        ],
      },
      {
        titolo: "Le porzioni standard, per orientarsi",
        paragrafi: ["Per capire quanto vale ‘un quarto di piatto’, le linee guida CREA riportano le porzioni standard per adulti, riferite all’alimento crudo e al netto degli scarti. Qualche esempio:"],
        tabella: {
          intestazioni: ["Alimento", "Porzione standard", "Come si traduce"],
          righe: [
            ["Pasta, riso, farro, orzo", "80 g", "Un piatto di pasta o di riso"],
            ["Pane", "50 g", "Una fetta media di pagnotta"],
            ["Patate", "200 g", "Due patate piccole"],
            ["Verdure (ortaggi)", "200 g", "Un contorno abbondante, per esempio zucchine o peperoni"],
            ["Insalata a foglia", "80 g", "Una ciotola di insalata"],
            ["Carne", "100 g", "Una fettina, una fetta di petto di pollo"],
            ["Pesce", "150 g", "Un filetto medio"],
            ["Uova", "50 g", "Un uovo medio"],
            ["Legumi freschi o in scatola", "150 g", "Mezzo piatto"],
            ["Olio extravergine", "10 ml", "Un cucchiaio"],
          ],
          nota: "Porzioni standard CREA per la popolazione adulta: un riferimento, non la quantità giusta per te.",
        },
        dopo: [
          "Chi si allena ha bisogno di più energia e spesso mangia porzioni più grandi: le linee guida CREA ricordano che, con allenamenti fino a 1–2 ore al giorno per 3–4 volte a settimana, basta mangiare un po’ di più in proporzione all’impegno, senza sbilanciare carboidrati, grassi e proteine.",
        ],
      },
      {
        titolo: "Dal modello al piatto: quattro esempi",
        paragrafi: ["Il modello funziona sia per un piatto unico sia per un pasto in più portate. Qualche combinazione concreta:"],
        punti: [
          "Piatto unico: riso basmati, petto di pollo e tanta verdura, con un filo d’olio. È la struttura del [riso con carote, zucchine e pollo teriyaki](/menu/riso-julien-pollo-teriyaki).",
          "Secondo con contorno: fesa di maiale, spinaci e patate, come nel [maiale alla senape con spinaci e patate novelle](/menu/maiale-senape-spinaci); qui le patate fanno da carboidrato, gli spinaci da verdura.",
          "Uova e verdure: le [uova alla purgatorio con sugo di peperoni](/menu/uova-purgatorio-peperoni), con una fetta di pane a completare la parte dei cereali.",
          "A casa: pasta e ceci con un’insalata e un frutto; qui i legumi portano le proteine e una parte dei carboidrati.",
        ],
        dopo: ["Le proporzioni non vanno rispettate al grammo in ogni pasto. Se a pranzo le verdure sono state poche, la cena può rimediare."],
      },
      {
        titolo: "Varietà: sostituire, non aggiungere",
        paragrafi: [
          "L’equilibrio si vede sulla settimana più che sul singolo piatto. L’Istituto Superiore di Sanità lo riassume così: un corretto stile alimentare si basa sul variare gli alimenti, consumando ciascun cibo secondo le porzioni e la frequenza raccomandate. Le linee guida CREA aggiungono che variare significa sostituire e non aggiungere: più scelte, non più quantità.",
          "In pratica si ruotano i cereali (riso, pasta, farro, orzo, pane), le fonti proteiche (carne, pesce, uova, latticini, legumi) e le verdure di stagione. Per frutta e verdura il CREA considera le cinque porzioni al giorno un obiettivo minimo, due di verdura ai pasti principali e tre di frutta. Per ruotare le proteine c’è la guida su [come variare le fonti proteiche](/blog/pasti-con-proteine-menu-settimanale).",
        ],
      },
      {
        titolo: "Condimenti, cotture e consistenze",
        paragrafi: [
          "Un piatto equilibrato è anche un piatto che si ha voglia di mangiare. Qualche accorgimento di cucina: alternare verdure crude e cotte, aggiungere qualcosa di croccante come semi o frutta secca, usare erbe aromatiche, spezie e agrumi per dare sapore senza aumentare il sale. Il condimento si misura: un cucchiaio d’olio è una porzione, e nei piatti preparati in anticipo conviene aggiungerlo, insieme alle salse, al momento di mangiare.",
          "Per le cotture il decalogo CREA della pausa pranzo suggerisce piastra, vapore, cartoccio, forno o microonde, e le stesse linee guida invitano a non eccedere con la frittura.",
        ],
      },
      {
        titolo: "Adattare il piatto alla tua giornata",
        paragrafi: [
          "Le proporzioni del piatto sono una base, non una regola fissa. Nei giorni di cardio il piatto può spostarsi verso i carboidrati, nei giorni di pesi verso le proteine: è il criterio spiegato nella guida su [come abbinare i pasti al tipo di allenamento](/blog/abbinare-pasti-tipo-allenamento).",
          "Se hai un piano del nutrizionista, le quantità le decide quel piano: la pagina [sui tuoi macro](/scheda) compone la settimana sui tuoi numeri. Se hai condizioni cliniche o allergie, prima di escludere o aumentare un gruppo di alimenti chiedi a un professionista.",
        ],
      },
    ],
    faq: [
      { domanda: "Esiste una proporzione valida per tutti i piatti?", risposta: "No. Modelli come il piatto di Harvard danno proporzioni approssimative, metà verdura e frutta, un quarto di cereali, un quarto di proteine, senza fissare calorie o porzioni. Le quantità giuste dipendono da persona, attività e obiettivi." },
      { domanda: "Le patate contano come verdura?", risposta: "No. Secondo le linee guida CREA sono una buona fonte di amido e si avvicinano ai cereali: anche se le usiamo come contorno, non sostituiscono verdure e ortaggi." },
      { domanda: "Devo eliminare carboidrati o grassi per mangiare in modo equilibrato?", risposta: "No. Il CREA ricorda che non esistono alimenti che fanno ingrassare o dimagrire in sé. Escludere gruppi di alimenti di tua iniziativa non è una buona idea: se hai un obiettivo specifico, chiedi a un professionista." },
      { domanda: "Un piatto unico può essere equilibrato?", risposta: "Sì, se contiene una base di cereali o patate, una fonte proteica, verdure e un condimento misurato. I piatti del menu FUEL LAB sono pensati così, con ingredienti e grammi dichiarati in scheda." },
    ],
    fonti: [FONTI.harvardPiatto, FONTI.creaLineeGuida, FONTI.issNutrizione],
  },
  {
    slug: "meal-prep-allenamento-cardio-pesi",
    titolo: "Meal prep e allenamento: come pianificare i pasti nei giorni di cardio e pesi",
    titoloSeo: "Meal prep per chi si allena: la settimana",
    descrizione: "Meal prep per chi si allena: come pianificare la settimana di pasti quando alterni cardio, pesi e riposo, con idee pratiche e nessuna promessa miracolosa.",
    categoria: "allenamento",
    parolaChiave: "meal prep allenamento",
    foto: "stacco",
    data: DATA_BLOG,
    aggiornato: "2026-09-27",
    piatti: ["riso-julien-pollo-teriyaki", "noodles-sesamo-maiale", "maiale-senape-spinaci"],
    correlati: ["abbinare-pasti-tipo-allenamento", "settimana-tipo-allenamento-alimentazione", "pranzo-dopo-allenamento-pescara"],
    introduzione:
      "Chi alterna cardio, pesi e giorni di riposo conosce il problema: i giorni di allenamento sono anche quelli con meno tempo per cucinare. Il meal prep serve proprio lì, a preparare in anticipo i pasti che cadono prima e dopo le sedute. Questa guida non ripete la regola su che cosa mangiare nei giorni di cardio o di pesi, che ha un articolo tutto suo: spiega come trasformarla in una sessione di preparazione concreta, con basi, porzioni, contenitori e tempi.",
    sezioni: [
      {
        titolo: "Prima il calendario, poi la spesa",
        paragrafi: [
          "Il punto di partenza è l’elenco degli allenamenti reali della settimana, con l’orario. Da lì si individuano i pasti che contano: il pranzo che precede una corsa serale, la cena dopo i pesi, la colazione dopo una seduta al mattino. Sono quelli da preparare in anticipo; gli altri possono restare liberi.",
          "Per il contenuto dei piatti vale la regola spiegata nella guida su [come abbinare i pasti al tipo di allenamento](/blog/abbinare-pasti-tipo-allenamento): più carboidrati nei giorni di cardio, proteine in primo piano e carboidrati più moderati nei giorni di pesi, un piatto completo e meno denso nel riposo. Se hai un piano del tuo nutrizionista, le quantità le decide quel piano.",
        ],
      },
      {
        titolo: "Basi comuni, proporzioni diverse",
        paragrafi: ["Il trucco per non cucinare due menu separati è preparare le stesse basi e cambiare le proporzioni nel contenitore:"],
        tabella: {
          intestazioni: ["Componente", "Cosa preparare", "Giorni di cardio", "Giorni di pesi"],
          righe: [
            ["Carboidrati", "Riso, pasta, farro o patate al forno", "Porzione più abbondante", "Porzione moderata"],
            ["Proteine", "Pollo, fesa di maiale, uova sode, legumi cotti", "Porzione normale", "Porzione in primo piano"],
            ["Verdure", "Una teglia al forno e una verdura in padella", "Cotte, poca fibra a ridosso della seduta", "Abbondanti"],
            ["Condimenti", "Olio, salse ed erbe, tenuti a parte", "Leggeri prima della seduta", "Liberi, senza eccessi"],
          ],
          nota: "Criterio organizzativo di una cucina: le quantità personali le stabilisce un professionista.",
        },
        dopo: [
          "Le linee guida CREA indicano di evitare, vicino all’allenamento, i cibi che richiedono una lunga digestione, come quelli ricchi di grassi, o che possono dare disturbi, come quelli molto ricchi di fibra. Per questo legumi e verdure crude trovano posto meglio nei pasti lontani dalla seduta o nei giorni di riposo.",
        ],
      },
      {
        titolo: "Una sessione di preparazione in 90 minuti",
        paragrafi: ["Un esempio di domenica pomeriggio per coprire i pasti chiave fino a mercoledì:"],
        punti: [
          "Minuto 0: forno acceso, una teglia di verdure a pezzi e una di patate.",
          "Minuto 10: acqua sul fuoco per riso o farro; in padella il pollo o la fesa di maiale a fettine.",
          "Minuto 30: uova sode per gli spuntini e per la colazione dopo la seduta del mattino.",
          "Minuto 50: tutto cotto; si lascia intiepidire coperto, senza dimenticarlo sul piano di lavoro.",
          "Minuto 65: porzionatura nei contenitori, con giorno e tipo di allenamento scritti sul coperchio.",
          "Minuto 80: in frigorifero. Le linee guida CREA indicano di riporre i cibi cotti entro due ore dalla cottura, un’ora d’estate.",
        ],
        dopo: ["Il mercoledì si ripete, in versione più breve, per la seconda metà della settimana."],
      },
      {
        titolo: "Quanti giorni coprire e come etichettare",
        paragrafi: [
          "I cibi cotti conservati in frigorifero vanno consumati in tempi brevi: le linee guida CREA parlano in genere di due o tre giorni, con il frigorifero intorno ai +4 °C. Per chi si allena questo significa due sessioni a settimana, per esempio domenica e mercoledì, oppure affidare una parte dei pasti a una cucina che lavora ogni giorno, come FUEL LAB, e ricevere i piatti a ridosso del giorno in cui li mangi.",
          "Scrivere sul coperchio giorno e tipo di seduta, ‘mar, cardio’ o ‘gio, pesi’, evita di mangiare il contenitore sbagliato al momento sbagliato. E, come suggerisce il CREA per tutti gli alimenti, i contenitori preparati prima vanno davanti, quelli più recenti dietro.",
        ],
      },
      {
        titolo: "Portare il pasto in palestra o in ufficio",
        paragrafi: [
          "Se ti alleni in pausa pranzo o subito dopo il lavoro, il pasto viaggia con te: borsa termica con siberini, contenitore ermetico e, se non c’è il microonde, un piatto pensato per essere mangiato freddo. Il Ministero della Salute raccomanda di non lasciare i cibi deperibili a temperatura ambiente: niente contenitore nello spogliatoio o in auto per ore.",
          "Per la seduta serale conviene preparare anche la merenda del pomeriggio, piccola e ricca di carboidrati facili da digerire, come pane e marmellata o un frutto: le linee guida CREA la indicano come il pasto che precede l’attività. Per gli orari, la guida su [cosa mangiare prima di correre](/blog/cosa-mangiare-prima-di-correre) ha qualche esempio.",
        ],
      },
      {
        titolo: "Gli errori più frequenti",
        paragrafi: ["Qualche abitudine che rende il meal prep per l’allenamento meno utile di quanto potrebbe essere:"],
        punti: [
          "Preparare solo proteine: pollo e basta non è un pasto completo, né prima né dopo la seduta.",
          "Cucinare per sette giorni in una volta sola.",
          "Riempire i contenitori sempre allo stesso modo, che sia giorno di cardio o di pesi.",
          "Riempire il pranzo che precede l’allenamento di fritture o salse pesanti.",
          "Dimenticare l’acqua: la borraccia fa parte della preparazione quanto i contenitori.",
        ],
      },
      {
        titolo: "Se non hai tempo di cucinare",
        paragrafi: [
          "Il meal prep si può anche delegare in parte. Nel [compositore della settimana](/settimana) segni i giorni come cardio, pesi o riposo e ottieni una proposta con i piatti del menu: per esempio i [noodles sesamo e maiale](/menu/noodles-sesamo-maiale) o il [riso con pollo teriyaki](/menu/riso-julien-pollo-teriyaki) nei giorni di cardio, il [maiale alla senape con spinaci e patate](/menu/maiale-senape-spinaci) nei giorni di pesi. Puoi modificarla e inviarla a Matteo.",
          "Una combinazione frequente è mista: basi fatte in casa per i pranzi, piatti pronti per le cene dopo la palestra. Gli schemi per tre, quattro o cinque allenamenti sono nella guida sulla [settimana tipo](/blog/settimana-tipo-allenamento-alimentazione).",
        ],
      },
    ],
    faq: [
      { domanda: "Devo mangiare un piatto diverso nei giorni di cardio e pesi?", risposta: "Non per forza un piatto diverso: puoi usare le stesse basi e cambiare le proporzioni, con più carboidrati nei giorni di cardio e proteine in primo piano nei giorni di pesi. Le quantità personali dipendono da te e da chi ti segue." },
      { domanda: "Quanti giorni prima posso preparare i pasti?", risposta: "Per i cibi cotti le linee guida CREA indicano in genere due o tre giorni di frigorifero. Per coprire una settimana di allenamenti conviene quindi fare due sessioni di preparazione." },
      { domanda: "Posso congelare i pasti del meal prep?", risposta: "Sì. Per gli alimenti cotti il Ministero della Salute indica come riferimento uno o due mesi a −18 °C, in piccole porzioni con la data scritta. Scongela in frigorifero o nel microonde, non a temperatura ambiente." },
      { domanda: "I macro del compositore sono un piano nutrizionale?", risposta: "No. Sono i valori dichiarati dei piatti e servono a confrontarli. Un piano personale lo formula un professionista; se ne hai uno, puoi usare i suoi numeri nella pagina sui tuoi macro." },
    ],
    fonti: [FONTI.creaLineeGuida, FONTI.saluteSicurezza, FONTI.saluteFreddo],
  },
  {
    slug: "conservare-pasti-preparati-frigorifero",
    titolo: "Come conservare i pasti preparati: frigorifero, contenitori e buon senso",
    titoloSeo: "Come conservare i pasti preparati in frigorifero",
    descrizione: "Come conservare i pasti preparati: frigorifero, contenitori chiusi, catena del freddo e istruzioni in etichetta per un meal prep sicuro in settimana.",
    categoria: "meal-prep",
    parolaChiave: "conservare pasti preparati",
    foto: "riso",
    data: DATA_BLOG,
    aggiornato: "2026-09-27",
    piatti: ["pallotte-cacio-ovo", "maiale-senape-spinaci", "gnocchetti-sugo-ricotta"],
    correlati: ["meal-prep-pescara-cosa-significa", "idratazione-allenamento-caldo-pescara", "pranzo-lavoro-pescara-organizzarlo"],
    introduzione:
      "Preparare i pasti in anticipo funziona solo se poi li conservi nel modo giusto. Temperatura del frigorifero, tempo tra cottura e refrigerazione, contenitori, posizione sui ripiani, trasporto e riscaldamento: sono i dettagli che decidono se il pranzo di mercoledì sarà buono e sicuro. Qui raccogliamo le indicazioni delle linee guida CREA e del Ministero della Salute, con una regola che viene prima di tutte: quando un prodotto riporta istruzioni o una data, valgono quelle.",
    sezioni: [
      {
        titolo: "Le tre regole di base",
        paragrafi: ["Linee guida CREA e Ministero della Salute concordano su pochi punti fermi:"],
        punti: [
          "Il frigorifero va tenuto intorno ai +4 °C, pulito e sbrinato periodicamente.",
          "I cibi cotti non si lasciano a lungo fuori a raffreddare, soprattutto scoperti: vanno in frigorifero il prima possibile, al massimo entro due ore dalla cottura, un’ora d’estate.",
          "Alimenti crudi, cotti e pronti al consumo si tengono separati, in contenitori chiusi.",
        ],
        dopo: [
          "Il Ministero della Salute aggiunge di non lasciare i cibi deperibili a temperatura ambiente e di rispettare in modo scrupoloso, dove presente, la temperatura di conservazione riportata in etichetta.",
        ],
      },
      {
        titolo: "Quanto dura un pasto preparato",
        paragrafi: [
          "Per i cibi cotti le linee guida CREA indicano una conservazione breve, in genere due o tre giorni; se il cibo deve durare di più, va congelato. Lo stesso vale per i prodotti usciti da una confezione aperta: una volta aperti la data stampata non conta più, e si conservano per qualche giorno, in genere due o tre.",
          "Non esiste però un numero unico per ogni piatto: ingredienti, cottura e confezionamento cambiano i tempi. Per questo, quando un piatto arriva con indicazioni del produttore o una data, sono quelle a fare fede. E se hai un dubbio non affidarti al naso: il CREA ricorda che un alimento contaminato non presenta necessariamente alterazioni di gusto, colore o odore.",
        ],
      },
      {
        titolo: "Dove mettere che cosa nel frigorifero",
        paragrafi: ["La temperatura non è uguale su tutti i ripiani, e anche l’ordine conta. Le indicazioni delle linee guida CREA:"],
        tabella: {
          intestazioni: ["Zona", "Cosa riporre", "Nota"],
          righe: [
            ["Cassetto in basso", "Frutta e verdura", "Si conservano meglio e spesso portano residui di terra"],
            ["Ripiani bassi", "Carne, pesce e formaggi, in involucri o contenitori", "È dove si mantiene meglio la temperatura più fredda"],
            ["Ripiani alti", "Creme, latte, panna", "Posizione indicata dal CREA"],
            ["Confezione d’acquisto", "Uova", "Per leggere la data ed evitare il contatto con altri alimenti"],
          ],
          nota: "Il frigorifero non va riempito troppo e i prodotti non vanno appoggiati alle pareti: l’aria deve circolare.",
        },
        dopo: [
          "I piatti già cotti, in contenitori chiusi, vanno tenuti lontani dagli alimenti crudi: in pratica, mai sotto una vaschetta di carne cruda che potrebbe gocciolare.",
        ],
      },
      {
        titolo: "Contenitori, porzioni ed etichette",
        paragrafi: [
          "Per il meal prep i contenitori ermetici sono la scelta più pratica: uno per pasto, così apri solo quello che mangi. Il CREA suggerisce di porzionare anche gli avanzi in piccole quantità, per riscaldare solo quello che verrà consumato, e di riporre gli acquisti più recenti dietro quelli già presenti, così i prodotti più vecchi si usano per primi.",
          "Scrivere sul coperchio la data di preparazione, o il giorno in cui mangerai il piatto, toglie ogni dubbio a metà settimana. Se il contenitore va nel microonde, verifica prima che sia adatto.",
        ],
      },
      {
        titolo: "Congelare, scongelare, riscaldare",
        paragrafi: [
          "Il congelatore allunga i tempi ma non ‘sterilizza’: blocca la crescita dei microrganismi finché la temperatura resta costante, a −18 °C o meno. In mancanza di indicazioni in etichetta, la tabella del Ministero della Salute, basata su dati dell’Istituto Superiore di Sanità, indica per gli alimenti cotti uno o due mesi di conservazione domestica in congelatore. Congela in porzioni piccole e scrivi la data sulla confezione.",
          "Scongela nella parte bassa del frigorifero, con il microonde o in acqua fredda solo in confezioni sigillate, mai a temperatura ambiente. Un alimento scongelato e non cotto non va ricongelato; si può invece congelare un piatto cotto preparato con ingredienti scongelati. Quando riscaldi un piatto o un avanzo, portalo fino a quando è molto caldo anche all’interno.",
        ],
      },
      {
        titolo: "Fuori casa: trasporto e pausa pranzo",
        paragrafi: [
          "Il tratto più delicato è quello tra il frigorifero di casa e il momento del pasto: borsa termica con siberini per il tragitto, frigorifero appena arrivi in ufficio, niente contenitori in auto, in spiaggia o nello spogliatoio della palestra. D’estate, a Pescara, i margini si accorciano: le linee guida CREA riducono a un’ora il limite per riporre in frigo una pietanza cotta.",
          "Per chi pranza in ufficio o all’università ci sono indicazioni specifiche nelle guide sul [pranzo al lavoro](/blog/pranzo-lavoro-pescara-organizzarlo) e sull’[allenamento con il caldo](/blog/idratazione-allenamento-caldo-pescara).",
        ],
      },
      {
        titolo: "I piatti FUEL LAB, dal ritiro al frigorifero",
        paragrafi: [
          "I piatti di FUEL LAB sono freschi, mai surgelati, e sono piatti da frigorifero: Matteo li cucina ogni giorno e, che tu li ritiri in Via del Santuario 214 o li riceva con la [consegna in zona](/consegna-pasti-pescara), vanno messi in frigo appena arrivano. Per ogni piatto, come le [pallotte cacio e ova fit](/menu/pallotte-cacio-ovo) nel loro sugo o il [maiale alla senape con spinaci e patate](/menu/maiale-senape-spinaci), valgono le indicazioni di conservazione e riscaldamento che ricevi con il piatto.",
          "Se qualcosa non è chiaro, chiedi prima dell’ordine, e organizza il ritiro in modo da andare subito a casa o in ufficio. Il [compositore](/settimana) ti aiuta a distribuire i piatti nei giorni giusti, così nessuno resta in frigorifero più del necessario.",
        ],
      },
    ],
    faq: [
      { domanda: "Quanto dura un pasto preparato in frigorifero?", risposta: "Dipende da ingredienti, preparazione e confezionamento. Per i cibi cotti le linee guida CREA indicano in genere due o tre giorni intorno ai +4 °C; se il piatto ha istruzioni o una data del produttore, valgono quelle." },
      { domanda: "Posso lasciare il pranzo fuori dal frigo fino alla pausa?", risposta: "No, se è un alimento deperibile. Il Ministero della Salute raccomanda di non lasciare i cibi deperibili a temperatura ambiente: usa un frigorifero o una borsa termica con siberini." },
      { domanda: "Quanto posso aspettare prima di mettere in frigo un piatto appena cotto?", risposta: "Le linee guida CREA indicano di non lasciare a lungo una pietanza cotta fuori dal frigorifero, soprattutto scoperta, e di riporla al massimo entro due ore dalla cottura, un’ora d’estate." },
      { domanda: "Si può ricongelare un piatto scongelato?", risposta: "Un alimento scongelato e non cotto non va ricongelato. Secondo il Ministero della Salute si può invece congelare un piatto cotto preparato con ingredienti scongelati, perché la cottura inattiva la maggior parte dei microrganismi." },
    ],
    fonti: [FONTI.creaLineeGuida, FONTI.saluteSicurezza, FONTI.saluteFreddo],
  },
  {
    slug: "pranzo-dopo-allenamento-pescara",
    titolo: "Pranzo dopo l’allenamento a Pescara: come organizzare il pasto",
    titoloSeo: "Pranzo dopo l’allenamento a Pescara",
    descrizione: "Pranzo dopo l’allenamento a Pescara: come organizzarlo tra palestra, ufficio e spostamenti, con idee pratiche su orari, trasporto e scelta del piatto.",
    categoria: "allenamento",
    parolaChiave: "pranzo dopo allenamento",
    foto: "presa",
    data: DATA_BLOG,
    aggiornato: "2026-09-27",
    piatti: ["riso-julien-pollo-teriyaki", "maiale-senape-spinaci", "gnocchetti-sugo-ricotta"],
    correlati: ["cosa-mangiare-dopo-allenamento-pesi", "meal-prep-allenamento-cardio-pesi", "pranzo-lavoro-pescara-organizzarlo"],
    introduzione:
      "Allenarsi al mattino presto o in pausa pranzo è sempre più comune: la palestra alle 7 prima dell’ufficio, la corsa sul lungomare alle 12:30, la lezione di spinning prima di rientrare al lavoro. In tutti questi casi il pranzo diventa il pasto del recupero, spesso da consumare in fretta e lontano da casa. Questa guida spiega come comporlo e, soprattutto, come organizzarlo tra palestra, ufficio e spostamenti. Per la cena dopo una seduta serale c’è una guida dedicata.",
    sezioni: [
      {
        titolo: "Il pranzo come pasto del recupero",
        paragrafi: [
          "Le linee guida CREA descrivono il pasto che segue l’impegno sportivo, pranzo o cena che sia, come ‘completo e ritemprante’: pasta o riso, meglio se con verdure e legumi, conditi con olio e formaggio grattugiato; una porzione di carne o pesce, oppure uova, formaggio o legumi; verdura e frutta. Alla fine di un’attività la priorità è reintegrare liquidi e carboidrati, con le proteine nella prima fase del recupero.",
          "Sul quando, la posizione dell’International Society of Sports Nutrition sul timing dei nutrienti indica che le proteine assunte da subito fino a circa due ore dopo l’esercizio stimolano la sintesi proteica. Per chi si allena alle 12:30 e pranza alle 14 il pranzo rientra in questa finestra; per chi si allena alle 7 il primo pasto del recupero è la colazione, e il pranzo lo completa.",
        ],
      },
      {
        titolo: "Tre situazioni tipiche",
        paragrafi: ["Lo stesso pranzo cambia ruolo a seconda dell’orario della seduta:"],
        tabella: {
          intestazioni: ["Allenamento", "Prima", "Dopo", "Il punto critico"],
          righe: [
            ["Pesi alle 7, poi ufficio", "Colazione leggera con carboidrati", "Colazione con una fonte proteica dopo la doccia, pranzo completo alle 13", "Avere il pranzo già pronto in ufficio"],
            ["Corsa o spinning alle 12:30", "Colazione abbondante e spuntino con carboidrati a metà mattina", "Pranzo alle 14, anche alla scrivania", "Pochi minuti e nessuna cucina"],
            ["Seduta lunga il sabato mattina", "Colazione con carboidrati 1–2 ore prima", "Pranzo completo a casa, con carboidrati e proteine", "Arrivare a casa affamati e improvvisare"],
          ],
          nota: "Esempi indicativi per chi si allena a livello amatoriale.",
        },
        dopo: [
          "Le linee guida CREA sconsigliano di allenarsi a digiuno: per la seduta del mattino presto basta una colazione piccola e digeribile, con pane, fette biscottate, marmellata o frutta.",
        ],
      },
      {
        titolo: "Come comporre il piatto",
        paragrafi: [
          "Il pranzo dopo l’allenamento non ha bisogno di ingredienti speciali. Ha bisogno di tre cose nello stesso piatto: una base di carboidrati (riso, pasta, pane, patate), una fonte proteica riconoscibile e delle verdure. Come ordine di grandezza per le proteine, le posizioni ISSN indicano circa 20–40 grammi per pasto; la guida su [quante proteine per pasto](/blog/quante-proteine-per-pasto) spiega come orientarsi sul proprio peso.",
          "Il tipo di seduta sposta le proporzioni. Dopo la corsa o lo spinning il piatto può essere più ricco di carboidrati, come il [riso con carote, zucchine e pollo teriyaki](/menu/riso-julien-pollo-teriyaki); dopo i pesi le proteine vanno in primo piano, come nel [maiale alla senape con spinaci e patate novelle](/menu/maiale-senape-spinaci). Il ragionamento completo è nella guida su [cosa mangiare dopo l’allenamento con i pesi](/blog/cosa-mangiare-dopo-allenamento-pesi).",
        ],
      },
      {
        titolo: "La logistica tra palestra e ufficio",
        paragrafi: ["Il pranzo dopo l’allenamento si gioca quasi sempre sull’organizzazione, non sulla ricetta:"],
        punti: [
          "Prepara o ritira il pasto il giorno prima: al mattino, tra borsone e doccia, non c’è tempo.",
          "Se passi dalla palestra all’ufficio, il contenitore viaggia in una borsa termica con siberini e va in frigorifero appena arrivi.",
          "Se l’ufficio ha il microonde scegli un piatto da scaldare; se non ce l’ha, un piatto pensato per essere mangiato freddo.",
          "Tieni in borsa un frutto o uno yogurt per il caso in cui il pranzo slitti di un’ora.",
          "Porta la borraccia: dopo la seduta reintegrare i liquidi è una priorità quanto il cibo.",
        ],
        dopo: [
          "Il Ministero della Salute raccomanda di non lasciare i cibi deperibili a temperatura ambiente: il pasto non resta nello spogliatoio per tutta la mattina.",
        ],
      },
      {
        titolo: "Due errori da evitare",
        paragrafi: [
          "Il primo è saltare il pranzo perché ‘tanto ho fatto colazione’ o perché la riunione è già cominciata: il recupero passa dai pasti che seguono la seduta, e il pomeriggio di lavoro diventa più faticoso. Il CREA mette tra le false credenze l’idea che una barretta o un pacchetto di cracker bastino come pranzo, perché si rischia di concentrare tutto a cena.",
          "Il secondo è compensare con un pranzo enorme e pesante: fritture e piatti molto grassi alle 14 rendono difficile il rientro alla scrivania. Un piatto completo in porzione normale, più una merenda se la cena è lontana, funziona meglio.",
        ],
      },
      {
        titolo: "Un pranzo pronto dopo la palestra, a Pescara",
        paragrafi: [
          "Se ti alleni al mattino e lavori a Pescara o nei comuni vicini, puoi avere il pranzo già pronto in frigorifero. FUEL LAB cucina ogni giorno e consegna ogni giorno: scegli i piatti nel [compositore](/settimana), segnando i giorni di allenamento come cardio o pesi, e ricevili a casa o in ufficio con la [consegna in zona](/consegna-pasti-pescara), oppure ritirali in Via del Santuario 214.",
          "Nel [menu](/menu) ogni piatto ha ingredienti, allergeni e macro della porzione: gli [gnocchetti al sugo con ricotta fresca](/menu/gnocchetti-sugo-ricotta), per esempio, sono tra i piatti indicati per i giorni di cardio. Chi cerca piatti con le proteine in primo piano trova una selezione nella pagina sui [pasti proteici a Pescara](/pasti-proteici-pescara).",
        ],
      },
    ],
    faq: [
      { domanda: "Cosa mangiare a pranzo dopo l’allenamento del mattino?", risposta: "Un pasto completo: una base di carboidrati, una fonte proteica e verdure. Le linee guida CREA descrivono il pasto che segue lo sport come ‘completo e ritemprante’; dopo il cardio puoi aumentare i carboidrati, dopo i pesi mettere le proteine in primo piano." },
      { domanda: "Quanto tempo dopo l’allenamento devo pranzare?", risposta: "Non c’è un cronometro. Le posizioni ISSN indicano che le proteine assunte da subito fino a circa due ore dopo l’esercizio stimolano la sintesi proteica; se il pranzo è più lontano, fai prima una colazione o uno spuntino con una fonte proteica." },
      { domanda: "Posso pranzare alla scrivania dopo la palestra?", risposta: "Sì, se il pasto è stato conservato al fresco fino a quel momento. Quando è possibile, però, le linee guida CREA suggeriscono di pranzare lontano dalla scrivania: una pausa vera aiuta anche a tornare al lavoro." },
      { domanda: "FUEL LAB crea piani per la prestazione sportiva?", risposta: "No. FUEL LAB è una cucina: propone piatti con ingredienti e valori dichiarati e uno strumento per organizzare la settimana. Per un piano sportivo personale serve un professionista abilitato." },
    ],
    fonti: [FONTI.creaLineeGuida, FONTI.issnTiming, FONTI.issnProteine, FONTI.saluteSicurezza],
  },
  {
    slug: "spesa-settimanale-meal-prep-zero-sprechi",
    titolo: "Meal prep e spesa settimanale: un metodo semplice per ridurre gli sprechi",
    titoloSeo: "Spesa settimanale per il meal prep senza sprechi",
    descrizione: "Spesa settimanale per il meal prep: come pianificare menu e lista, usare gli ingredienti acquistati e ridurre gli sprechi senza riempire il frigorifero.",
    categoria: "meal-prep",
    parolaChiave: "spesa settimanale meal prep",
    foto: "verdure",
    data: DATA_BLOG,
    aggiornato: "2026-09-27",
    piatti: ["uova-purgatorio-peperoni", "gnocchetti-sugo-ricotta", "riso-julien-pollo-teriyaki"],
    correlati: ["menu-settimanale-pescara-come-pianificarlo", "conservare-pasti-preparati-frigorifero", "meal-prep-studenti-universitari-pescara-chieti"],
    introduzione:
      "Una spesa settimanale ben fatta nasce dal menu, non da un giro tra gli scaffali. Per il meal prep significa comprare quello che servirà ai pasti che hai deciso di preparare, usare prima quello che hai già e lasciare in negozio le scorte che finirebbero nel cestino. Le linee guida CREA lo dicono chiaramente: contro lo spreco si può fare molto anche in casa. Ecco un metodo in cinque passi, con una lista d’esempio e qualche regola per conservare la spesa.",
    sezioni: [
      {
        titolo: "Perché la spesa è il punto debole del meal prep",
        paragrafi: [
          "Secondo i dati riportati dalle linee guida CREA, la fase della filiera in cui si spreca di più è il consumo domestico: la Commissione europea la stima al 43% di sprechi e perdite e, per l’Italia, il 47% dello spreco alimentare è a carico dei consumatori. A finire nel cestino sono soprattutto gli alimenti facilmente deperibili, come frutta e verdura, e quelli con una scadenza molto breve.",
          "Nel meal prep lo spreco nasce quasi sempre da una lista scritta per una settimana ideale: sette pranzi e sette cene, quando in realtà due cene saranno fuori e un pranzo salterà per una riunione. Il rimedio è contare prima di comprare.",
        ],
      },
      {
        titolo: "Il metodo in cinque passi",
        paragrafi: ["Richiede dieci minuti, prima di uscire di casa:"],
        punti: [
          "Conta i pasti reali: quanti pranzi e quante cene mangerai a casa o porterai con te, escludendo cene fuori, mensa e piatti già pronti.",
          "Fai l’inventario di frigorifero, congelatore e dispensa, con un occhio alle date di scadenza.",
          "Scegli le ricette partendo da quello che hai e da due o tre ingredienti che puoi usare in più piatti.",
          "Scrivi la lista per reparti e con le quantità: ‘pollo, 400 g’ e non solo ‘pollo’.",
          "Riponi con metodo: i prodotti con la scadenza più lontana dietro, quelli più vecchi davanti.",
        ],
        dopo: [
          "L’ultimo passo viene dalle linee guida CREA, che suggeriscono anche di programmare la spesa senza fare scorte che non si riesce a smaltire, così che nulla vada a male.",
        ],
      },
      {
        titolo: "Un ingrediente, tre usi",
        paragrafi: ["Il modo più efficace per non buttare niente è comprare ingredienti che lavorano in più ricette. Qualche esempio:"],
        tabella: {
          intestazioni: ["Ingrediente", "Primo uso", "Secondo uso", "Terzo uso"],
          righe: [
            ["Ceci", "Insalata di farro e ceci per il pranzo", "Pasta e ceci per cena", "Crema di ceci da spalmare sul pane"],
            ["Petto di pollo", "Riso, pollo e verdure", "Insalata di pollo e patate", "Piadina con pollo e verdure grigliate"],
            ["Zucchine", "Teglia di verdure al forno", "Frittata di zucchine", "Sugo per la pasta"],
            ["Uova", "Uova sode per gli spuntini", "Frittata al forno", "Uova cotte nel sugo di pomodoro"],
            ["Ricotta", "Condimento per la pasta", "Ripieno di verdure al forno", "Spuntino con frutta"],
          ],
          nota: "Idee di cucina: adatta le combinazioni a gusti, allergie e indicazioni del tuo professionista.",
        },
      },
      {
        titolo: "La lista d’esempio per una settimana",
        paragrafi: ["Una lista per cinque pasti da cucinare in casa, per una persona, con altri quattro coperti da piatti già pronti:"],
        punti: [
          "Cereali: farro, riso basmati, pane per due giorni.",
          "Proteine: petto di pollo, uova, ceci in scatola, ricotta.",
          "Verdure: zucchine, carote, peperoni, un’insalata a foglia.",
          "Frutta: cinque o sei frutti di stagione.",
          "Dispensa, solo se manca: olio extravergine, passata di pomodoro, spezie.",
        ],
        dopo: [
          "Le quantità dipendono da appetito e porzioni. Come riferimento, le linee guida CREA indicano per un adulto porzioni standard di 80 grammi di pasta o riso crudi, 100 grammi di carne, 150 di legumi in scatola e 200 di verdure: moltiplica per il numero di pasti e arrotonda al formato più vicino.",
        ],
      },
      {
        titolo: "Conservare la spesa per farla durare",
        paragrafi: [
          "Appena a casa, la spesa va sistemata: frutta e verdura nel cassetto in basso, carne, pesce e formaggi sui ripiani più bassi e protetti, le uova nella loro confezione, senza riempire troppo il frigorifero perché l’aria deve circolare. Pasta, riso, farina e legumi secchi stanno in dispensa, in confezioni ben chiuse e lontano dall’umidità.",
          "Quello che non userai entro pochi giorni si può congelare subito, in piccole porzioni e con la data: il Ministero della Salute raccomanda di congelare gli alimenti deperibili il prima possibile, non negli ultimi giorni prima della scadenza. Se compri surgelati, prendili per ultimi prima della cassa e usa una borsa termica per il tragitto.",
        ],
      },
      {
        titolo: "Avanzi: da problema a pasto",
        paragrafi: [
          "Il CREA suggerisce di riciclare gli avanzi in nuove ricette e di mangiare il giorno dopo quello che è avanzato, purché conservato secondo le regole: in frigorifero entro due ore dalla cottura, in contenitori chiusi, riscaldato fino a quando è molto caldo anche all’interno. Un’abitudine utile è lasciare nel menu una casella libera a metà settimana proprio per gli avanzi.",
          "Lo stesso documento ricorda che si possono costruire ricette con materie prime meno costose ma ugualmente nutrienti: pollo, uova, latte, yogurt, ricotta e legumi hanno un grande valore nutrizionale e sono la base di molte preparazioni.",
        ],
      },
      {
        titolo: "Spesa e piatti pronti insieme",
        paragrafi: [
          "Se una parte della settimana è coperta da piatti già pronti, la lista si accorcia. Nel [compositore FUEL LAB](/settimana) scegli prima i pasti che vuoi ricevere, per esempio le [uova alla purgatorio](/menu/uova-purgatorio-peperoni) il lunedì e gli [gnocchetti al sugo con ricotta](/menu/gnocchetti-sugo-ricotta) il giovedì, poi scrivi la lista solo per i pasti che restano da cucinare.",
          "È il modo più semplice per non comprare due volte, una per la cucina di casa e una per il servizio. Per la pianificazione a monte c’è la guida su [come pianificare il menu settimanale](/blog/menu-settimanale-pescara-come-pianificarlo).",
        ],
      },
    ],
    faq: [
      { domanda: "Come evito di comprare troppo per il meal prep?", risposta: "Conta i pasti che mangerai davvero a casa, controlla le scorte e scrivi la lista con le quantità. Le linee guida CREA suggeriscono di programmare la spesa senza fare scorte che non riesci a smaltire." },
      { domanda: "Posso conservare tutti gli avanzi nello stesso modo?", risposta: "No. In generale vanno in frigorifero entro due ore dalla cottura, in contenitori chiusi, e si consumano in pochi giorni; per congelarli servono porzioni piccole e la data. Se l’alimento ha istruzioni in etichetta, seguile." },
      { domanda: "Conviene comprare verdure surgelate?", risposta: "Possono aiutare contro lo spreco, perché si usano un po’ alla volta. Il Ministero della Salute ricorda di trasportarle in una borsa termica e di seguire le istruzioni della confezione, che spesso prevedono la cottura prima del consumo." },
      { domanda: "Ogni quanto conviene fare la spesa per il meal prep?", risposta: "Una spesa grande per dispensa e prodotti a lunga conservazione, più un piccolo rifornimento a metà settimana per frutta, verdura e freschi, è un buon compromesso: segue il ritmo delle due sessioni di preparazione." },
    ],
    fonti: [FONTI.creaLineeGuida, FONTI.saluteFreddo],
  },
  {
    slug: "leggere-etichetta-nutrizionale-piatti-pronti",
    titolo: "Come leggere l’etichetta nutrizionale di un piatto pronto",
    descrizione: "Come leggere l’etichetta nutrizionale di un piatto pronto: energia, proteine, carboidrati, zuccheri, grassi e sale, per 100 grammi e per porzione.",
    categoria: "etichette-nutrienti",
    parolaChiave: "leggere etichetta nutrizionale",
    foto: "insalata",
    data: DATA_BLOG,
    aggiornato: "2026-09-27",
    piatti: ["maiale-senape-spinaci", "uova-purgatorio-peperoni", "riso-julien-pollo-teriyaki"],
    correlati: ["macro-cosa-sono-come-leggerli", "cucina-salutare-asporto-pescara", "piatti-gia-composti-cosa-sono"],
    introduzione:
      "Sulla confezione di un piatto pronto c’è quasi tutto quello che serve per scegliere: che cosa contiene, quanto pesa, come si conserva, quali allergeni ci sono e quanta energia apporta. Il difficile è leggerlo nell’ordine giusto. Le regole sono fissate dal Regolamento europeo 1169/2011, e il CREA ne ha fatto una guida chiara. Qui le mettiamo in fila e le applichiamo a un esempio, dalla tabella per 100 grammi alla porzione che mangerai davvero.",
    sezioni: [
      {
        titolo: "Che cosa deve esserci per legge",
        paragrafi: ["Per gli alimenti preimballati il regolamento elenca le indicazioni obbligatorie. Le principali, per un piatto pronto:"],
        punti: [
          "La denominazione dell’alimento, che non può essere sostituita da un nome di fantasia.",
          "L’elenco degli ingredienti in ordine di quantità decrescente: il primo è quello presente in quantità maggiore.",
          "Gli allergeni, evidenziati nell’elenco con un carattere diverso dagli altri ingredienti, per esempio in grassetto.",
          "La quantità netta, la data di scadenza o il termine minimo di conservazione, le condizioni di conservazione e d’uso.",
          "La dichiarazione nutrizionale.",
        ],
      },
      {
        titolo: "La tabella nutrizionale, voce per voce",
        paragrafi: [
          "La tabella deve riportare, in un unico campo visivo, energia, grassi, acidi grassi saturi, carboidrati, zuccheri, proteine e sale, sempre per 100 grammi o 100 millilitri. Può aggiungere i valori per porzione e, su base volontaria, altre voci come fibre o amido. Dal regolamento del 2011 in etichetta si indica solo il sale, non più il sodio.",
          "L’energia si calcola con coefficienti fissati per legge: 4 kcal per grammo di proteine e di carboidrati, 9 per grammo di grassi, 2 per grammo di fibre. Per questo, sommando i macro moltiplicati per il loro coefficiente, si ritrovano le calorie dichiarate, a meno degli arrotondamenti.",
        ],
      },
      {
        titolo: "Da 100 grammi alla porzione: un esempio",
        paragrafi: ["I valori per 100 grammi servono a confrontare prodotti diversi; quelli per porzione dicono che cosa mangi. Prendiamo un piatto pronto immaginario da 350 grammi:"],
        tabella: {
          intestazioni: ["Voce", "Per 100 g", "Per la confezione da 350 g"],
          righe: [
            ["Energia", "150 kcal", "525 kcal"],
            ["Proteine", "9 g", "31,5 g"],
            ["Carboidrati", "16 g", "56 g"],
            ["di cui zuccheri", "2 g", "7 g"],
            ["Grassi", "5,5 g", "19,3 g"],
            ["Sale", "0,6 g", "2,1 g"],
          ],
          nota: "Esempio immaginario per spiegare il calcolo: ogni valore per 100 grammi si moltiplica per 3,5.",
        },
        dopo: [
          "Due errori comuni: confrontare le calorie di un prodotto per 100 grammi con quelle di un altro per porzione, e dare per scontato che la porzione suggerita sia quella che mangerai. Se la confezione contiene due porzioni e la mangi tutta, i valori raddoppiano.",
        ],
      },
      {
        titolo: "I consumi di riferimento",
        paragrafi: ["Alcune etichette indicano anche quale percentuale dei ‘consumi di riferimento’ copre una porzione. Sono valori convenzionali fissati dal regolamento per un adulto medio, non un fabbisogno personale:"],
        tabella: {
          intestazioni: ["Voce", "Consumo di riferimento"],
          righe: [
            ["Energia", "8400 kJ, cioè 2000 kcal"],
            ["Grassi totali", "70 g"],
            ["Acidi grassi saturi", "20 g"],
            ["Carboidrati", "260 g"],
            ["Zuccheri", "90 g"],
            ["Proteine", "50 g"],
            ["Sale", "6 g"],
          ],
          nota: "Allegato XIII del Regolamento UE 1169/2011.",
        },
        dopo: [
          "Il CREA precisa che le 2000 kcal sono un numero tondo, scelto per facilitare i calcoli e riferito idealmente a una donna adulta; per gli uomini il riferimento è 2500 kcal. Chi si allena spesso può avere bisogni molto diversi: la percentuale in etichetta serve a confrontare, non è un obiettivo.",
        ],
      },
      {
        titolo: "Le diciture sulla confezione",
        paragrafi: ["Frasi come ‘light’ o ‘fonte di fibre’ non sono slogan liberi: si possono usare solo se il prodotto rispetta soglie precise, elencate dal CREA e dalla Commissione europea. Alcuni esempi:"],
        punti: [
          "‘A basso contenuto di grassi’: non più di 3 grammi per 100 grammi, 1,5 per 100 millilitri nei liquidi.",
          "‘A basso contenuto di zuccheri’: non più di 5 grammi per 100 grammi, 2,5 per 100 millilitri.",
          "‘Fonte di fibre’: almeno 3 grammi per 100 grammi o 1,5 per 100 kcal; ‘ad alto contenuto di fibre’: almeno 6 grammi per 100 grammi.",
          "‘Fonte di proteine’: almeno il 12% dell’energia viene dalle proteine; ‘ad alto contenuto di proteine’: almeno il 20%.",
          "‘Leggero’ o ‘light’: una riduzione di almeno il 30% rispetto a un prodotto simile, con la specifica di che cosa è ridotto.",
        ],
        dopo: ["Una dicitura dice una cosa sola. Un piatto ‘fonte di proteine’ può essere anche ricco di sale o di grassi: la tabella completa resta la fonte da leggere."],
      },
      {
        titolo: "Scadenza e conservazione",
        paragrafi: [
          "‘Da consumarsi entro’ è la data di scadenza, obbligatoria per i prodotti molto deperibili: dopo quella data il prodotto non va consumato. ‘Da consumarsi preferibilmente entro’ è il termine minimo di conservazione: oltre quella data il prodotto integro e ben conservato può essere ancora consumato, ma il produttore non ne garantisce più le caratteristiche. Entrambe valgono solo per la confezione integra e conservata come indicato.",
          "Una volta aperta la confezione, le linee guida CREA indicano di consumare il prodotto in pochi giorni, in genere due o tre, a prescindere dalla data stampata. E la temperatura di conservazione riportata in etichetta va rispettata in modo scrupoloso, come raccomanda il Ministero della Salute.",
        ],
      },
      {
        titolo: "E i piatti senza etichetta?",
        paragrafi: [
          "I piatti preparati e venduti direttamente seguono regole diverse: per gli alimenti non preimballati, o preimballati per la vendita diretta, il regolamento rende obbligatoria l’informazione sugli allergeni, mentre la dichiarazione nutrizionale non è obbligatoria, salvo disposizioni nazionali.",
          "Per questo, quando un servizio pubblica i valori, conviene capire come sono calcolati. Nel [menu FUEL LAB](/menu) ogni scheda riporta ingredienti con i grammi, allergeni e macro della porzione intera, con le calorie calcolate dagli stessi coefficienti del regolamento: per esempio il [maiale alla senape con spinaci e patate](/menu/maiale-senape-spinaci) o le [uova alla purgatorio](/menu/uova-purgatorio-peperoni). Per confrontarli con un’etichetta, dividi per il peso della porzione e moltiplica per 100; il resto è nella guida sui [macro alimentari](/blog/macro-cosa-sono-come-leggerli).",
        ],
      },
    ],
    faq: [
      { domanda: "I valori per 100 grammi sono quelli dell’intera confezione?", risposta: "No. Sono un riferimento standard per confrontare prodotti diversi. Per sapere che cosa mangi, moltiplica ogni valore per il peso della porzione e dividi per 100, oppure usa i valori per porzione se l’etichetta li riporta." },
      { domanda: "Che differenza c’è tra ‘da consumarsi entro’ e ‘preferibilmente entro’?", risposta: "La prima è la data di scadenza, oltre la quale il prodotto non va consumato. La seconda è il termine minimo di conservazione: dopo quella data il prodotto integro e ben conservato può essere ancora consumato, ma il produttore non garantisce più le sue caratteristiche." },
      { domanda: "Un piatto con la scritta ‘fonte di proteine’ è adatto a me?", risposta: "La dicitura dice solo che almeno il 12% dell’energia viene dalle proteine. Non dice nulla di sale, grassi o porzione, né se il piatto è adatto alle tue esigenze: per obiettivi personali serve un professionista." },
      { domanda: "Perché i piatti d’asporto spesso non hanno la tabella nutrizionale?", risposta: "Perché per gli alimenti non preimballati il Regolamento UE 1169/2011 rende obbligatoria l’informazione sugli allergeni, non la dichiarazione nutrizionale. Quando i valori ci sono, verifica se si riferiscono a 100 grammi o alla porzione." },
    ],
    fonti: [FONTI.creaEtichette, FONTI.ue1169, FONTI.ceIndicazioni, FONTI.creaLineeGuida, FONTI.saluteSicurezza],
  },
  {
    slug: "pasti-con-proteine-menu-settimanale",
    titolo: "Pasti con proteine: come variare le fonti nel menu settimanale",
    titoloSeo: "Fonti proteiche: come variarle nel menu settimanale",
    descrizione: "Fonti proteiche nel menu settimanale: come alternare carne, pesce, uova, latticini e legumi per variare i pasti senza ripetere sempre la stessa ricetta.",
    categoria: "etichette-nutrienti",
    parolaChiave: "fonti proteiche menu settimanale",
    foto: "maiale",
    data: DATA_BLOG,
    aggiornato: "2026-10-01",
    piatti: ["maiale-senape-spinaci", "riso-julien-pollo-teriyaki", "pallotte-cacio-ovo"],
    correlati: ["quante-proteine-per-pasto", "piatto-equilibrato-ingredienti-varieta", "pranzo-proteico-ufficio"],
    introduzione:
      "Chi organizza i pasti della settimana finisce spesso per mangiare sempre la stessa proteina: pollo a pranzo, pollo a cena, pollo il giorno dopo. Variare le fonti proteiche rende il menu più piacevole e più completo, perché carne, pesce, uova, latticini e legumi portano, insieme alle proteine, nutrienti diversi. Le linee guida CREA danno indicazioni di frequenza semplici da usare: qui le trasformiamo in una settimana concreta. Per le quantità per pasto c’è una guida dedicata.",
    sezioni: [
      {
        titolo: "Le frequenze indicate dalle linee guida",
        paragrafi: ["Per la popolazione adulta le linee guida CREA danno riferimenti settimanali per le principali fonti proteiche:"],
        tabella: {
          intestazioni: ["Fonte", "Indicazione CREA", "Porzione standard"],
          righe: [
            ["Pesce e prodotti ittici, freschi o surgelati", "Almeno 2–3 volte a settimana, meglio pesce azzurro nostrano", "150 g"],
            ["Legumi", "2–4 porzioni a settimana, anche di più", "150 g freschi o in scatola, 50 g secchi"],
            ["Uova", "2–4 a settimana, distribuite in più giorni", "Un uovo medio, 50 g"],
            ["Carne", "Preferire le carni magre e moderarne il consumo, sostituendola più spesso con cereali e legumi", "100 g"],
            ["Latte e yogurt", "Una tazza di latte o yogurt ogni giorno", "125 ml o 125 g"],
            ["Formaggi", "In quantità moderata, meglio come secondo piatto", "100 g freschi, 50 g stagionati"],
          ],
          nota: "Riferimenti per adulti sani dalle linee guida CREA 2018: non un piano personale.",
        },
        dopo: [
          "L’indicazione più utile è quella sui legumi: il CREA suggerisce di alternarli alle fonti proteiche animali, perché sono buone fonti di proteine vegetali e di fibra, e nel decalogo della pausa pranzo ricorda che non sono un contorno ma un vero secondo piatto.",
        ],
      },
      {
        titolo: "Una settimana con dieci pasti",
        paragrafi: ["Un esempio di rotazione su dieci pasti principali, pranzi e cene dal lunedì al venerdì, con il weekend libero:"],
        tabella: {
          intestazioni: ["Giorno", "Pranzo", "Cena"],
          righe: [
            ["Lunedì", "Riso, pollo e verdure", "Pasta e lenticchie, insalata"],
            ["Martedì", "Insalata di farro, ceci e pomodorini", "Filetto di merluzzo, patate, zucchine"],
            ["Mercoledì", "Uova in sugo di peperoni, pane", "Fesa di maiale, spinaci, patate"],
            ["Giovedì", "Pasta al pomodoro con ricotta, verdure", "Salmone al forno, riso, verdure"],
            ["Venerdì", "Zuppa di fagioli e orzo, pane", "Frittata al forno con verdure, patate, insalata"],
          ],
          nota: "Pesce 2 volte, legumi 3, uova 2, carne 2, latticini 1: un esempio da adattare a gusti e disponibilità.",
        },
        dopo: ["Non serve seguirlo alla lettera: conta che nell’arco della settimana compaiano fonti diverse e che nessuna occupi da sola metà dei pasti."],
      },
      {
        titolo: "Le proteine nei piatti del menu",
        paragrafi: [
          "Nel [menu FUEL LAB](/menu) le fonti proteiche principali sono la carne di maiale e di pollo, le uova e i latticini: il [maiale alla senape con spinaci e patate](/menu/maiale-senape-spinaci), il [riso con pollo teriyaki](/menu/riso-julien-pollo-teriyaki), le [uova alla purgatorio](/menu/uova-purgatorio-peperoni) con formaggio tipo quark, le [pallotte cacio e ova fit](/menu/pallotte-cacio-ovo) con uova e ricotta, gli [gnocchetti al sugo con ricotta fresca](/menu/gnocchetti-sugo-ricotta). Tra le aggiunte della box ci sono anche salmone, merluzzo, gamberi e manzo.",
          "Pesce e legumi, quindi, trovano posto soprattutto nei pasti di casa: è una buona divisione dei compiti. I valori aggiornati dei piatti sono qui sotto.",
        ],
        piatti: ["maiale-senape-spinaci", "riso-julien-pollo-teriyaki", "noodles-sesamo-maiale", "pallotte-cacio-ovo", "gnocchetti-sugo-ricotta", "uova-purgatorio-peperoni"],
      },
      {
        titolo: "Proteine vegetali: come usarle bene",
        paragrafi: [
          "Legumi, cereali e derivati della soia contribuiscono all’apporto proteico. Il CREA li raccomanda anche per l’ambiente: suggerisce di combinare tanti alimenti vegetali con pochi prodotti animali, che restano però necessari per evitare carenze. Chi segue un’alimentazione solo vegetale fa bene a pianificarla con un professionista.",
          "In cucina i legumi sono versatili: in insalata, in zuppa, in crema, con la pasta o il riso. Chi li digerisce con fatica può provare quelli decorticati o passati al passaverdure, come suggerisce lo stesso CREA, e spostarli nei pasti lontani dall’allenamento, perché la fibra a ridosso della seduta può dare fastidio.",
        ],
      },
      {
        titolo: "Variare anche le preparazioni",
        paragrafi: [
          "La stessa fonte proteica può cambiare molto nel piatto: il pollo alla piastra, in padella con le verdure, in insalata fredda; le uova sode, in frittata al forno, cotte nel sugo; la ricotta nel condimento della pasta o nell’impasto delle polpette. Cambiare cottura e condimento è il modo più economico di non annoiarsi.",
          "Anche il costo conta. Le linee guida CREA ricordano che pollo, uova, latte, yogurt, ricotta e legumi sono materie prime meno costose ma con un grande valore nutrizionale, e che il pesce surgelato o d’allevamento può essere un’alternativa nutrizionalmente molto valida, e più economica, rispetto al fresco selvatico.",
        ],
      },
      {
        titolo: "Conservazione, fonte per fonte",
        paragrafi: ["Nel meal prep ogni fonte proteica ha le sue attenzioni, secondo le linee guida CREA:"],
        punti: [
          "Carne e pesce crudi: sui ripiani bassi del frigorifero, protetti e separati dai cibi cotti.",
          "Uova: nella confezione d’acquisto, senza lavarle, così si legge sempre la data.",
          "Legumi in scatola: aperta la latta, il resto va in un contenitore per alimenti, in frigorifero.",
          "Piatti cotti, con qualunque fonte proteica: in frigorifero entro due ore dalla cottura, da consumare in genere entro due o tre giorni.",
        ],
        dopo: ["Il resto è nella guida su [come conservare i pasti preparati](/blog/conservare-pasti-preparati-frigorifero)."],
      },
      {
        titolo: "Quanto, per te",
        paragrafi: [
          "Questa guida parla di varietà, non di quantità. Per i grammi di proteine per pasto, con i riferimenti di EFSA e ISSN, c’è la guida su [quante proteine per pasto](/blog/quante-proteine-per-pasto); per i piatti pronti con le proteine in primo piano, la pagina sui [pasti proteici a Pescara](/pasti-proteici-pescara).",
          "Se hai esigenze cliniche, segui un’alimentazione solo vegetale o hai obiettivi di composizione corporea, fonti e quantità vanno scelte con un professionista. I numeri della sua scheda si possono usare nella pagina [sui tuoi macro](/scheda).",
        ],
      },
    ],
    faq: [
      { domanda: "Quante volte a settimana mangiare pesce, uova e legumi?", risposta: "Per gli adulti le linee guida CREA indicano pesce almeno 2–3 volte a settimana, 2–4 uova e 2–4 porzioni di legumi, preferendo le carni magre e moderandone il consumo. Sono riferimenti generali, non un piano personale." },
      { domanda: "I legumi possono sostituire la carne?", risposta: "Sì, in molti pasti. Il CREA suggerisce di alternarli alle fonti proteiche animali e ricorda che sono un vero secondo piatto, non un contorno. Chi segue un’alimentazione solo vegetale fa bene a pianificarla con un professionista." },
      { domanda: "Il pesce surgelato vale quanto quello fresco?", risposta: "Secondo le linee guida CREA il pesce surgelato o d’allevamento può essere un’alternativa nutrizionalmente molto valida, e di minor costo, rispetto al pesce fresco selvatico." },
      { domanda: "Quante proteine dovrei mangiare?", risposta: "Il fabbisogno varia da persona a persona. I riferimenti generali di EFSA e ISSN sono nella guida su quante proteine per pasto; per una stima individuale rivolgiti a un professionista qualificato." },
    ],
    fonti: [FONTI.creaLineeGuida],
  },
  {
    slug: "cucina-di-stagione-abruzzo-pescara",
    titolo: "Cucina di stagione in Abruzzo: idee per variare il menu a Pescara",
    titoloSeo: "Cucina di stagione in Abruzzo: idee per il menu",
    descrizione: "Cucina di stagione in Abruzzo: spunti per variare il menu a Pescara durante l’anno, alternando verdure, legumi e ricette con quello che offre il mercato.",
    categoria: "pescara-abruzzo",
    parolaChiave: "cucina di stagione Abruzzo",
    foto: "pomodori",
    data: DATA_BLOG,
    aggiornato: "2026-09-27",
    piatti: ["pallotte-cacio-ovo", "uova-purgatorio-peperoni", "gnocchetti-sugo-ricotta"],
    correlati: ["pallotte-cacio-e-ova-versione-fit", "spesa-settimanale-meal-prep-zero-sprechi", "menu-settimanale-pescara-come-pianificarlo"],
    introduzione:
      "La stagione è uno dei modi più semplici per non annoiarsi con il menu: cambia gli ingredienti al posto tuo, quattro volte l’anno. A Pescara, tra i banchi del mercato e le campagne dell’entroterra, la differenza tra ottobre e luglio si vede e si sente. Questa guida spiega che cosa si intende davvero per ‘di stagione’, perché conviene, dove si ferma il ‘chilometro zero’ e come portare le verdure del periodo nel meal prep, con qualche richiamo alla cucina abruzzese.",
    sezioni: [
      {
        titolo: "Che cosa vuol dire ‘di stagione’",
        paragrafi: [
          "Secondo le linee guida CREA, nell’accezione generale un alimento di stagione è quello prodotto in campo aperto, oppure in serra ma senza luce o riscaldamento aggiuntivi. Al concetto si aggiungono spesso la produzione locale e la raccolta a maturazione sulla pianta.",
          "Lo stesso documento spiega perché conviene sceglierlo: di solito costa meno ed è più buono, e questo ne favorisce il consumo. Non gli attribuisce proprietà speciali. Frutta e verdura di stagione sono semplicemente il modo più facile di arrivare alle porzioni consigliate, che il CREA fissa in almeno cinque al giorno, due di verdura e tre di frutta.",
        ],
      },
      {
        titolo: "Il limite del chilometro zero",
        paragrafi: [
          "Locale e di stagione non sono sinonimi. Il CREA osserva che il chilometro zero come indicatore di sostenibilità ha dei limiti: un prodotto importato quando qui è fuori stagione può avere un impatto ambientale minore di uno coltivato vicino in serra riscaldata o conservato a lungo in cella frigorifera. Le valutazioni vanno fatte caso per caso.",
          "Comprare locale resta interessante per altri motivi, come le filiere corte che lasciano un guadagno maggiore agli agricoltori. L’ideale, conclude il CREA, è un prodotto che sia locale e anche di stagione.",
        ],
      },
      {
        titolo: "Un calendario orientativo",
        paragrafi: ["Il CREA avverte che le tabelle di stagionalità vanno prese come orientative: i periodi di raccolta cambiano con il clima, le tecniche e le varietà precoci e tardive. Con questa premessa, qualche idea per stagione:"],
        tabella: {
          intestazioni: ["Stagione", "Verdure e frutta da cercare", "Un’idea per il meal prep"],
          righe: [
            ["Autunno", "Zucca, cavoli, broccoli, funghi, uva, mele, pere", "Zucca al forno, metà per un contorno e metà per una crema"],
            ["Inverno", "Cavolfiore, finocchi, carciofi, cime di rapa, arance, mandarini", "Teglia di cavolfiore e finocchi, contorno per tre pasti"],
            ["Primavera", "Asparagi, piselli, fave, carciofi, fragole", "Frittata al forno con asparagi o piselli, da porzionare"],
            ["Estate", "Pomodori, zucchine, peperoni, melanzane, pesche, albicocche", "Peperonata e zucchine grigliate, buone anche fredde"],
          ],
          nota: "Orientativo: controlla che cosa trovi davvero al mercato.",
        },
      },
      {
        titolo: "Dal mercato al contenitore",
        paragrafi: ["Le verdure di stagione si prestano bene al meal prep, se le prepari pensando a più pasti:"],
        punti: [
          "Scegli un ingrediente protagonista della settimana e pensa due usi diversi: al forno per un contorno, frullato in una crema o saltato in un sugo.",
          "Le verdure da cuocere, come peperoni, zucchine, cavolfiore e zucca, si preparano bene in anticipo; le insalate a foglia è meglio condirle al momento.",
          "Compra quantità che userai prima della spesa successiva: frutta e verdura, ricorda il CREA, sono tra gli alimenti più sprecati.",
          "Conserva frutta e verdura nel cassetto in basso del frigorifero, separate dai cibi cotti.",
        ],
        dopo: ["Per trasformare le idee in una lista c’è la guida sulla [spesa settimanale senza sprechi](/blog/spesa-settimanale-meal-prep-zero-sprechi)."],
      },
      {
        titolo: "La tradizione abruzzese in chiave quotidiana",
        paragrafi: [
          "La cucina abruzzese è da sempre legata alle stagioni e ai legumi: lenticchie, ceci, fagioli e cicerchie nelle zuppe, le verdure dell’orto nei sughi, il pesce dell’Adriatico sulla costa. Molti piatti della tradizione nascono per usare bene quello che c’era, ed è lo stesso spirito del meal prep.",
          "Qualche esempio di come rileggerli: le zuppe di legumi e cereali si preparano in anticipo e spesso sono più buone il giorno dopo; le verdure ripassate in padella con aglio e olio diventano contorni da porzionare; le [pallotte cacio e ova](/blog/pallotte-cacio-e-ova-versione-fit), polpette di uova, formaggio e pane cotte nel sugo, diventano un piatto unico da portare al lavoro, nella versione più leggera del menu FUEL LAB.",
        ],
      },
      {
        titolo: "I sapori locali nel menu FUEL LAB",
        paragrafi: [
          "Nel [menu](/menu) la tradizione abruzzese c’è in modo esplicito con le [pallotte cacio e ovo fit proteiche](/menu/pallotte-cacio-ovo), con ricotta e sugo di pomodorini; altri piatti usano ingredienti che seguono bene le stagioni, come i peperoni delle [uova alla purgatorio](/menu/uova-purgatorio-peperoni) o i pomodorini degli [gnocchetti al sugo con ricotta fresca](/menu/gnocchetti-sugo-ricotta). Tra le aggiunte della box ci sono anche le verdure di stagione.",
          "Il menu ruota su pochi piatti e può cambiare nel tempo: prima di pianificare, controlla la selezione aggiornata e chiedi a Matteo quali piatti sono disponibili nei giorni che ti servono. Poi scegli tra ritiro in Via del Santuario 214 e [consegna a Pescara e dintorni](/consegna-pasti-pescara), da confermare per il tuo indirizzo.",
        ],
      },
    ],
    faq: [
      { domanda: "Mangiare di stagione significa seguire una dieta particolare?", risposta: "No. È un modo di scegliere gli ingredienti disponibili nel periodo: secondo il CREA di solito costano meno e sono più buoni, e questo aiuta a mangiare più frutta e verdura. Non definisce da solo un piano alimentare." },
      { domanda: "Locale vuol dire sempre più sostenibile?", risposta: "Non sempre. Le linee guida CREA spiegano che un prodotto coltivato in serra riscaldata o conservato a lungo in cella frigorifera può avere un impatto maggiore di uno importato nella sua stagione. L’ideale è il prodotto locale e di stagione." },
      { domanda: "Le verdure surgelate vanno bene nel meal prep?", risposta: "Sì, sono un’alternativa pratica quando la stagione non offre quello che cerchi. Il Ministero della Salute ricorda che un prodotto surgelato subito dopo la raccolta può conservare bene i principi nutrizionali; segui le istruzioni della confezione." },
      { domanda: "Il menu FUEL LAB cambia con le stagioni?", risposta: "Il menu ruota su pochi piatti e può cambiare nel tempo, e tra le aggiunte della box ci sono le verdure di stagione. Per sapere che cosa è disponibile nei giorni che ti interessano, consulta il menu e chiedi conferma a Matteo." },
    ],
    fonti: [FONTI.creaLineeGuida, FONTI.saluteFreddo, FONTI.abruzzoPallotte],
  },
  {
    slug: "consegna-pasti-pescara-cosa-chiedere",
    titolo: "Consegna pasti a Pescara: cosa chiedere prima di scegliere un servizio",
    titoloSeo: "Consegna pasti a Pescara: cosa chiedere prima",
    descrizione: "Consegna pasti a Pescara: cosa chiedere prima di scegliere un servizio, da zona e giorni di consegna a menu, ingredienti, allergeni e conservazione.",
    categoria: "pescara-abruzzo",
    parolaChiave: "consegna pasti Pescara",
    foto: "noodles",
    data: DATA_BLOG,
    aggiornato: "2026-09-30",
    piatti: ["noodles-sesamo-maiale", "maiale-senape-spinaci", "riso-julien-pollo-teriyaki"],
    correlati: ["cucina-salutare-asporto-pescara", "pranzo-lavoro-pescara-organizzarlo", "conservare-pasti-preparati-frigorifero"],
    introduzione:
      "Cercare consegna pasti a Pescara può voler dire cose diverse: il pranzo in ufficio, qualche cena della settimana, un menu da abbinare agli allenamenti. In tutti i casi, prima di scegliere un servizio conviene fare le domande giuste, perché i dettagli pratici contano quanto il menu: dove arriva, quando, quanto costa, come si conserva, che cosa succede se hai un’allergia. Ecco una lista di controllo da usare con qualunque servizio, con le risposte di FUEL LAB come esempio.",
    sezioni: [
      {
        titolo: "Zona e indirizzo",
        paragrafi: [
          "La prima domanda è la più banale e la più importante: il servizio arriva al tuo indirizzo? Un servizio locale ha spesso una zona precisa e percorsi legati ai giorni di consegna. Scrivere solo ‘consegnate a Pescara?’ produce una risposta generica; meglio indicare comune, via e numero civico, e se l’indirizzo è di casa o del lavoro.",
          `FUEL LAB consegna a ${elencoZone()}, con la copertura del singolo indirizzo confermata prima dell’ordine. Se il tuo comune non c’è, resta il ritiro in ${INDIRIZZO.via}. I dettagli sono nella pagina sulla [consegna pasti a Pescara](/consegna-pasti-pescara).`,
        ],
      },
      {
        titolo: "Giorni, orari e costi",
        paragrafi: ["Le domande pratiche da fare prima di organizzare la settimana:"],
        punti: [
          "In che giorni consegnate, e in che fascia oraria?",
          "C’è un ordine minimo? Quanto costa la consegna, e da quale numero di pasti diventa gratuita?",
          "Posso ricevere al lavoro o in palestra?",
          "Come si paga, e quando la richiesta diventa un ordine confermato?",
          "Posso ordinare solo per qualche giorno, senza impegni fissi?",
        ],
        dopo: [
          "Per il menu della settimana la consegna è tutti i giorni: Matteo cucina ogni giorno e consegna ogni giorno, ed è gratuita dai dieci pasti in su, come indicato nella pagina [Servizi e prezzi](/servizi); sotto quella soglia il costo per il tuo indirizzo te lo conferma Matteo. Chi vuole i pasti pronti senza ordinare ogni volta trova anche gli [abbonamenti mensili](/abbonamento), con consegna o ritiro ogni 3 giorni. Non c’è pagamento online: la richiesta diventa un ordine quando Matteo conferma piatti, giorno e modalità.",
        ],
      },
      {
        titolo: "Ingredienti e allergeni",
        paragrafi: [
          "Un menu online dice molto, ma non tutto. Chiedi se per ogni piatto sono indicati ingredienti, allergeni e peso della porzione. Per i cibi venduti senza preimballaggio, o preimballati per la vendita diretta, il Regolamento UE 1169/2011 rende obbligatoria l’informazione sugli allergeni, mentre la tabella nutrizionale non lo è.",
          "Se hai un’allergia o un’intolleranza, la scheda è un punto di partenza: chiedi anche delle possibili contaminazioni in cucina e delle sostituzioni, e aspetta una risposta prima di ordinare. Nel menu FUEL LAB gli allergeni sono in ogni scheda, per esempio i [noodles sesamo e maiale](/menu/noodles-sesamo-maiale) dichiarano glutine, sesamo e soia; per contaminazioni e sostituzioni la conferma arriva da Matteo.",
        ],
      },
      {
        titolo: "Valori nutrizionali e porzioni",
        paragrafi: [
          "Se il servizio pubblica i macro, chiedi a che cosa si riferiscono, alla porzione intera o a 100 grammi, e come sono calcolati. Un valore per 100 grammi senza il peso della porzione non dice quanto mangerai.",
          "Nel [menu FUEL LAB](/menu) i valori sono riferiti alla porzione indicata in scheda, con il suo peso, e le calorie sono sempre la somma di proteine e carboidrati per 4 e dei grassi per 9. Le porzioni sono pensate come pasto unico, per esempio il [maiale alla senape con spinaci e patate](/menu/maiale-senape-spinaci). Per leggere i numeri c’è la guida sui [macro alimentari](/blog/macro-cosa-sono-come-leggerli).",
        ],
      },
      {
        titolo: "Freschi o surgelati, caldi o freddi",
        paragrafi: [
          "Due domande che cambiano l’organizzazione: i piatti sono freschi o surgelati? Arrivano caldi, da mangiare subito, o freddi, da conservare? Un pasto caldo va consumato a breve; un piatto da frigorifero va riposto appena arriva e si scalda quando lo mangi. Chiedi anche per quanti giorni si conserva e se il contenitore va nel microonde.",
          "I piatti FUEL LAB sono freschi, mai surgelati, e sono piatti da frigorifero: appena li ricevi vanno riposti al fresco, seguendo le indicazioni di conservazione che accompagnano il piatto. Le regole generali sono nella guida su [come conservare i pasti preparati](/blog/conservare-pasti-preparati-frigorifero).",
        ],
      },
      {
        titolo: "Le domande in una tabella",
        paragrafi: ["Il riassunto, con il motivo per cui farle e la risposta di FUEL LAB:"],
        tabella: {
          intestazioni: ["Domanda", "Perché conta", "La risposta di FUEL LAB"],
          righe: [
            ["Arrivate al mio indirizzo?", "Le zone locali sono precise", "Pescara e comuni vicini, indirizzo confermato prima dell’ordine"],
            ["In che giorni?", "Decide quali pasti copri", "Tutti i giorni"],
            ["Quanto costa la consegna?", "Cambia il costo per pasto", "Gratuita dai dieci pasti; sotto, confermata per indirizzo"],
            ["Ci sono gli allergeni?", "Obbligatori per legge, decisivi se hai allergie", "In ogni scheda; contaminazioni da confermare con Matteo"],
            ["I valori sono per porzione?", "Senza porzione il numero non basta", "Sì, per la porzione intera"],
            ["Freschi o surgelati?", "Cambia l’organizzazione della settimana", "Freschi, da frigorifero"],
          ],
        },
      },
      {
        titolo: "Come scrivere la richiesta",
        paragrafi: [
          "Una richiesta completa fa risparmiare un giro di messaggi. Indica comune, via e numero civico; se è casa o lavoro; il giorno che preferisci; quanti pasti e quali piatti, anche solo come bozza del [compositore](/settimana); eventuali allergie o domande sugli ingredienti.",
          "Da FUEL LAB la richiesta si manda dalla pagina [Scrivi a Matteo](/richiesta). Se preferisci che Matteo cucini a casa tua invece di consegnare, c’è il servizio di [cuoco a domicilio](/cuoco-a-domicilio-pescara); i modi di lavorare con FUEL LAB sono riassunti in [Servizi e prezzi](/servizi).",
        ],
      },
    ],
    faq: [
      { domanda: "FUEL LAB consegna al mio indirizzo a Pescara?", risposta: "La zona comprende Pescara e i comuni vicini, ma la copertura del singolo indirizzo si conferma prima dell’ordine. Scrivi comune, via e numero civico; se la consegna non è possibile, resta il ritiro in Via del Santuario 214." },
      { domanda: "Quali giorni sono indicati per la consegna?", risposta: "Tutti i giorni: Matteo cucina ogni giorno e consegna ogni giorno. Il giorno per il tuo indirizzo si conferma con la richiesta, insieme alla copertura." },
      { domanda: "Quanto costa la consegna?", risposta: "Secondo la pagina Servizi e prezzi la consegna è gratuita dai dieci pasti in su. Sotto quella soglia, il costo per il tuo indirizzo te lo conferma Matteo insieme alla copertura." },
      { domanda: "I piatti arrivano caldi?", risposta: "No: sono piatti freschi, da conservare al fresco. Appena arrivano vanno in frigorifero e si scaldano quando li mangi, seguendo le istruzioni del piatto e del contenitore." },
    ],
    fonti: [FONTI.ue1169, FONTI.saluteSicurezza],
  },
  {
    slug: "macro-cosa-sono-come-leggerli",
    titolo: "Macro alimentari: cosa indicano e come leggere i valori dei piatti",
    titoloSeo: "Macro alimentari: cosa sono e come leggerli",
    descrizione: "Macro alimentari: cosa sono proteine, carboidrati e grassi, come leggere i valori dei piatti nel menu e perché non vanno presi come una prescrizione.",
    categoria: "etichette-nutrienti",
    parolaChiave: "macro alimentari",
    foto: "risoBianco",
    data: DATA_BLOG,
    aggiornato: "2026-09-27",
    piatti: ["riso-julien-pollo-teriyaki", "maiale-senape-spinaci", "gnocchetti-sugo-ricotta"],
    correlati: ["leggere-etichetta-nutrizionale-piatti-pronti", "quante-proteine-per-pasto", "piatto-equilibrato-ingredienti-varieta"],
    introduzione:
      "‘Macro’ è l’abbreviazione di macronutrienti: proteine, carboidrati e grassi, i nutrienti che forniscono energia e che si misurano in grammi. Li trovi sulle etichette, nei menu e nelle app, e sono il linguaggio con cui molti professionisti scrivono i piani per chi si allena. Leggerli bene significa sapere a che cosa si riferiscono, come diventano calorie e che cosa non dicono. Questa guida lo spiega usando come esempio i piatti del menu FUEL LAB.",
    sezioni: [
      {
        titolo: "Proteine, carboidrati, grassi: che cosa sono",
        paragrafi: [
          "Le proteine forniscono gli aminoacidi con cui l’organismo costruisce e ripara i tessuti, muscoli compresi: si trovano in carne, pesce, uova, latticini, legumi e, in misura minore, nei cereali. I carboidrati sono la fonte di energia più pronta e, negli sforzi di resistenza, il carburante principale dei muscoli: pasta, riso, pane, patate, frutta, legumi. I grassi forniscono energia concentrata e servono, tra l’altro, all’assorbimento di alcune vitamine: olio, frutta secca, formaggi, carni, pesce.",
          "Nelle tabelle compaiono anche due voci che ne fanno parte: gli zuccheri sono una quota dei carboidrati, gli acidi grassi saturi una quota dei grassi. Le fibre, quando indicate, sono una voce a sé.",
        ],
      },
      {
        titolo: "Dai grammi alle calorie",
        paragrafi: [
          "Ogni macro fornisce una quantità fissa di energia. Il Regolamento europeo 1169/2011 stabilisce i coefficienti da usare in etichetta: 4 kcal per grammo di proteine, 4 per grammo di carboidrati, 9 per grammo di grassi, oltre a 2 per le fibre e 7 per l’alcol. Le calorie di un piatto, quindi, non sono un numero a parte: sono la somma dei macro moltiplicati per il loro coefficiente.",
        ],
        tabella: {
          intestazioni: ["Macronutriente", "kcal per grammo", "Esempio: 30 grammi"],
          righe: [
            ["Proteine", "4", "120 kcal"],
            ["Carboidrati", "4", "120 kcal"],
            ["Grassi", "9", "270 kcal"],
          ],
          nota: "Coefficienti dell’allegato XIV del Regolamento UE 1169/2011.",
        },
        dopo: [
          "Nel [menu FUEL LAB](/menu) la regola vale sempre: le calorie di ogni piatto sono proteine per 4, più carboidrati per 4, più grassi per 9. Così i quattro numeri della scheda tornano fra loro, e puoi rifare il conto da solo.",
        ],
      },
      {
        titolo: "Per 100 grammi o per porzione",
        paragrafi: [
          "È la domanda da fare prima di ogni confronto. Le etichette dei prodotti confezionati riportano i valori per 100 grammi o 100 millilitri e, se vogliono, anche per porzione; molti menu e app usano invece la porzione. Confrontare un dato per 100 grammi con uno per porzione porta a conclusioni sbagliate.",
          "I valori del menu FUEL LAB sono riferiti alla porzione intera indicata in scheda. Un piatto può avere più proteine di un altro semplicemente perché è più grande: per confrontare la densità di due piatti, dividi i valori per il peso della porzione e moltiplica per 100. Le regole complete sono nella guida su [come leggere l’etichetta nutrizionale](/blog/leggere-etichetta-nutrizionale-piatti-pronti).",
        ],
      },
      {
        titolo: "Leggere un piatto: la quota di energia",
        paragrafi: [
          "Oltre ai grammi, è utile guardare quanta parte dell’energia del piatto arriva da ciascun macro: grammi per coefficiente, diviso le calorie totali. Un esempio con numeri tondi: un piatto con 40 grammi di proteine, 100 di carboidrati e 20 di grassi ha 740 kcal; le proteine ne forniscono 160, circa il 22%, i carboidrati 400, circa il 54%, i grassi 180, circa il 24%.",
          "È lo stesso ragionamento del [compositore della settimana](/settimana): nei giorni di cardio mette in cima i piatti in cui i carboidrati pesano di più sull’energia totale, nei giorni di pesi quelli con il rapporto più alto tra proteine e carboidrati. Nelle schede la barra dei macro mostra proprio questa ripartizione. I valori aggiornati dei piatti:",
        ],
        piatti: ["riso-julien-pollo-teriyaki", "noodles-sesamo-maiale", "gnocchetti-sugo-ricotta", "maiale-senape-spinaci", "pallotte-cacio-ovo", "uova-purgatorio-peperoni"],
      },
      {
        titolo: "Che cosa i macro non dicono",
        paragrafi: ["Due piatti con gli stessi macro possono essere molto diversi. I numeri non raccontano:"],
        punti: [
          "La qualità degli ingredienti e la varietà: 30 grammi di proteine da legumi, da pesce o da un affettato non sono la stessa cosa.",
          "Fibre, vitamine e minerali, che spesso non compaiono nella tabella.",
          "Il sale, che in etichetta c’è ma nei macro no.",
          "Il gusto, la sazietà e il momento della giornata in cui mangerai il piatto.",
        ],
        dopo: [
          "Per questo i macro vanno letti insieme all’elenco degli ingredienti. Un piatto equilibrato si costruisce anche con verdure, varietà e condimenti misurati: ne parliamo nella guida su [come comporre un piatto equilibrato](/blog/piatto-equilibrato-ingredienti-varieta).",
        ],
      },
      {
        titolo: "Macro e allenamento: riferimenti, non prescrizioni",
        paragrafi: [
          "Per chi si allena alcuni riferimenti generali esistono. Sulle proteine, le posizioni dell’International Society of Sports Nutrition indicano per la maggior parte delle persone attive 1,4–2,0 grammi per chilo di peso al giorno e circa 20–40 grammi per pasto, come spieghiamo nella guida su [quante proteine per pasto](/blog/quante-proteine-per-pasto). Sui carboidrati, le linee guida CREA raccomandano a chi fa sport di mangiarne a sufficienza per avere riserve adeguate.",
          "Sono però numeri di popolazione: età, peso, sesso, volume di allenamento, salute e obiettivi cambiano tutto, ed evitare di tagliare o raddoppiare un macro sulla base di un post o di una calcolatrice online è la regola più utile. Se hai un piano del nutrizionista, puoi inserirne i numeri nella pagina [sui tuoi macro](/scheda): la settimana si compone sui tuoi target, scegliendo i piatti più vicini.",
        ],
      },
    ],
    faq: [
      { domanda: "I macro indicati online sono personalizzati?", risposta: "No. Descrivono il piatto: ingredienti, porzione e valori pubblicati. Non sono una prescrizione e non tengono conto di peso, allenamento o salute di chi lo mangia." },
      { domanda: "Come confronto due piatti?", risposta: "Usa lo stesso riferimento, entrambi per porzione o entrambi per 100 grammi. Poi guarda la quota di energia da ciascun macro, gli ingredienti e gli allergeni, e scegli in base a gusto e giornata." },
      { domanda: "Perché le calorie sono proteine per 4, carboidrati per 4 e grassi per 9?", risposta: "Sono i coefficienti di conversione fissati dal Regolamento UE 1169/2011 per l’etichettatura. Nel menu FUEL LAB le calorie di ogni piatto si calcolano sempre così, quindi i numeri tornano fra loro." },
      { domanda: "Devo contare i macro per mangiare bene?", risposta: "Non è necessario. Contarli può essere utile se segui un piano con un professionista; per molte persone bastano varietà, porzioni ragionevoli e piatti completi." },
    ],
    fonti: [FONTI.ue1169, FONTI.creaEtichette, FONTI.issnProteine, FONTI.creaLineeGuida],
  },
  {
    slug: "menu-settimanale-pescara-come-pianificarlo",
    titolo: "Menu settimanale a Pescara: come pianificare pranzi e cene senza rigidità",
    titoloSeo: "Menu settimanale a Pescara: come pianificarlo",
    descrizione: "Menu settimanale a Pescara: come pianificare pranzi e cene partendo dai giorni pieni, con varietà, spesa sotto controllo e un meal prep flessibile.",
    categoria: "meal-prep",
    parolaChiave: "menu settimanale Pescara",
    foto: "penne",
    data: DATA_BLOG,
    aggiornato: "2026-09-27",
    piatti: ["uova-purgatorio-peperoni", "noodles-sesamo-maiale", "gnocchetti-sugo-ricotta"],
    correlati: ["settimana-tipo-allenamento-alimentazione", "spesa-settimanale-meal-prep-zero-sprechi", "meal-prep-pescara-cosa-significa"],
    introduzione:
      "Un menu settimanale utile non è una tabella da rispettare a ogni costo: è uno strumento per togliere decisioni nei giorni pieni, fare una spesa sensata e mangiare in modo più vario. A Pescara, come altrove, lavoro, studio, allenamenti e cene fuori cambiano da una settimana all’altra, e il menu deve adattarsi. In questa guida trovi un metodo in cinque passi, una griglia d’esempio e qualche regola di varietà dalle linee guida CREA, senza piani rigidi.",
    sezioni: [
      {
        titolo: "Prima i punti fermi della settimana",
        paragrafi: [
          "Il menu si costruisce sul calendario, non sul ricettario. Segna appuntamenti, turni, lezioni, allenamenti, cene fuori e pranzi di lavoro: nella maggior parte delle settimane emergono tre o quattro momenti in cui il pasto va deciso prima, e altri in cui si può improvvisare senza problemi.",
          "Conta poi i pasti reali da coprire. Una settimana con due cene fuori, un pranzo in mensa e il weekend in famiglia non ha quattordici pasti da pianificare, ma forse otto. Da quel numero partono la griglia e la spesa.",
        ],
      },
      {
        titolo: "Il metodo in cinque passi",
        paragrafi: ["Dal calendario al menu, in pratica:"],
        punti: [
          "Segna i punti fermi della settimana e conta i pasti da coprire.",
          "Assegna a ogni pasto un tipo: portavivande, piatto già pronto, cucina al momento, pasto fuori.",
          "Scegli cereali e fonti proteiche in rotazione, poi le verdure di stagione.",
          "Decidi quando cucinare o ritirare: due momenti a settimana bastano.",
          "Lascia una casella libera per avanzi e imprevisti, e rivedi la bozza a metà settimana.",
        ],
      },
      {
        titolo: "Una griglia d’esempio",
        paragrafi: ["Una settimana per chi lavora in ufficio a Pescara, va in palestra il martedì e il giovedì e cena fuori il venerdì:"],
        tabella: {
          intestazioni: ["Giorno", "Pranzo", "Cena"],
          righe: [
            ["Lunedì", "Portavivande: farro, ceci e verdure al forno", "Piatto pronto: uova in sugo di peperoni"],
            ["Martedì", "Piatto pronto: noodles con maiale e verdure", "Dopo la palestra: pasta al pomodoro, pollo, insalata"],
            ["Mercoledì", "Tavola calda con i colleghi", "Avanzi, oppure minestrone con legumi"],
            ["Giovedì", "Portavivande: riso, uova sode, zucchine", "Piatto pronto: gnocchetti al sugo con ricotta"],
            ["Venerdì", "Pranzo libero", "Cena fuori"],
          ],
          nota: "Esempio da adattare: le caselle libere fanno parte del piano.",
        },
        dopo: [
          "I piatti pronti della griglia possono essere quelli del [menu FUEL LAB](/menu), cucinati ogni giorno e consegnati quando ti servono: le [uova alla purgatorio](/menu/uova-purgatorio-peperoni), i [noodles sesamo e maiale](/menu/noodles-sesamo-maiale) e gli [gnocchetti al sugo con ricotta](/menu/gnocchetti-sugo-ricotta).",
        ],
      },
      {
        titolo: "Varietà: le regole che bastano",
        paragrafi: [
          "Per la varietà non serve un calcolo. Le linee guida CREA offrono qualche riferimento semplice: almeno cinque porzioni al giorno di frutta e verdura, due di verdura ai pasti principali e tre di frutta; pesce almeno due o tre volte a settimana; legumi da due a quattro porzioni a settimana; da due a quattro uova. Il resto è rotazione: se lunedì c’è il farro, martedì la pasta, mercoledì il riso.",
          "Lo stesso documento ricorda che variare significa sostituire e non aggiungere: più scelte, non più quantità. Per le fonti proteiche c’è una guida dedicata, su [come variarle nel menu settimanale](/blog/pasti-con-proteine-menu-settimanale).",
        ],
      },
      {
        titolo: "Dal menu alla spesa e alla cucina",
        paragrafi: [
          "Con la griglia in mano la lista della spesa si scrive quasi da sola: solo gli ingredienti dei pasti da cucinare, con le quantità. Il metodo completo è nella guida sulla [spesa settimanale senza sprechi](/blog/spesa-settimanale-meal-prep-zero-sprechi).",
          "Per i tempi vale la regola della conservazione: le linee guida CREA indicano che i cibi cotti si tengono in frigorifero per breve tempo, in genere due o tre giorni. Per questo il menu funziona meglio con due momenti di cucina, per esempio la domenica e il mercoledì, oppure con piatti che arrivano a ridosso del giorno in cui li mangi: FUEL LAB cucina e consegna ogni giorno.",
        ],
      },
      {
        titolo: "Quando il programma cambia",
        paragrafi: [
          "Un menu settimanale è una bozza. Se il mercoledì salta la palestra o arriva un invito a cena, sposti un pasto, congeli una porzione se il piatto lo consente, usi la casella libera. Il piano ha funzionato se ti ha evitato decisioni di corsa, non se è stato rispettato alla lettera.",
          "Chi si allena può aggiungere un livello: segnare per ogni giorno cardio, pesi o riposo e scegliere i piatti di conseguenza. Gli schemi con tre, quattro o cinque allenamenti sono nella guida sulla [settimana tipo tra allenamenti e pasti](/blog/settimana-tipo-allenamento-alimentazione).",
        ],
      },
      {
        titolo: "Il compositore FUEL LAB",
        paragrafi: [
          "Il [compositore](/settimana) mostra pranzo e cena di ogni giorno, ti permette di indicare cardio, pesi o riposo e propone alcuni piatti del menu, che puoi trascinare, sostituire o togliere. Puoi anche partire da un singolo pranzo.",
          "Quando la bozza ti convince, la mandi a Matteo, che conferma disponibilità, ritiro in Via del Santuario 214 o [consegna a Pescara e dintorni](/consegna-pasti-pescara). Il servizio è descritto nella pagina sul [meal prep a Pescara](/meal-prep-pescara).",
        ],
      },
    ],
    faq: [
      { domanda: "Devo pianificare tutti i pasti della settimana?", risposta: "No. Parti dai momenti più complicati, conta i pasti reali da coprire e lascia almeno una casella libera per avanzi e imprevisti." },
      { domanda: "Ogni quanto conviene cucinare per il menu settimanale?", risposta: "Due volte a settimana è un buon ritmo: le linee guida CREA indicano che i cibi cotti in frigorifero vanno consumati in tempi brevi, in genere due o tre giorni." },
      { domanda: "Come faccio a variare senza complicarmi la vita?", risposta: "Ruota cereali e fonti proteiche giorno per giorno e usa le verdure di stagione. Qualche riferimento dal CREA: pesce almeno 2–3 volte a settimana, legumi 2–4 porzioni, 2–4 uova." },
      { domanda: "Posso cambiare i piatti proposti dal compositore?", risposta: "Sì. La proposta è modificabile: puoi trascinare, sostituire o togliere i piatti e scegliere anche solo i pranzi." },
    ],
    fonti: [FONTI.creaLineeGuida],
  },
];

/* ---- ricerca ---- */

export function articoloPerSlug(slug: string): Articolo | undefined {
  return ARTICOLI.find((articolo) => articolo.slug === slug);
}

export function categoriaPerId(id: string): Categoria | undefined {
  return CATEGORIE.find((categoria) => categoria.id === id);
}

export function articoliPerCategoria(id: CategoriaId): Articolo[] {
  return ARTICOLI.filter((articolo) => articolo.categoria === id);
}

export function fotoArticolo(articolo: Articolo): FotoBlog {
  return FOTO_BLOG[articolo.foto];
}

/**
 * Gli articoli da proporre in fondo: prima quelli scelti a mano, poi i
 * correlati dell’approfondimento, infine la stessa categoria. Mai l’articolo
 * stesso, mai due volte lo stesso.
 */
export function correlatiDi(articolo: Articolo, quanti = 3): Articolo[] {
  const candidati = [
    ...(articolo.correlati ?? []),
    ...(APPROFONDIMENTI[articolo.slug]?.correlati ?? []),
    ...articoliPerCategoria(articolo.categoria).map((a) => a.slug),
  ];
  const visti = new Set<string>([articolo.slug]);
  const scelti: Articolo[] = [];
  for (const slug of candidati) {
    if (visti.has(slug)) continue;
    visti.add(slug);
    const trovato = articoloPerSlug(slug);
    if (trovato) scelti.push(trovato);
    if (scelti.length === quanti) break;
  }
  return scelti;
}

/* ---- titoli ---- */

/** Il <title> dell’articolo: il marchio si aggiunge solo se ci sta nei 60 caratteri. */
export function titoloPagina(articolo: Articolo): string {
  const base = articolo.titoloSeo ?? articolo.titolo;
  return base.length + MARCHIO.length <= 60 ? `${base}${MARCHIO}` : base;
}

export function titoloPaginaCategoria(categoria: Categoria): string {
  const base = categoria.titoloSeo;
  return base.length + MARCHIO.length <= 60 ? `${base}${MARCHIO}` : base;
}

/* ---- testo con link ---- */

/** [testo](/percorso): la sintassi dei link interni nei testi del blog. */
export const LINK_TESTO = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/** Toglie la sintassi dei link e lascia il testo: per JSON-LD e conteggi. */
export function testoSemplice(testo: string): string {
  return testo.replace(LINK_TESTO, "$1");
}

/**
 * Spazi che non devono andare a capo: "4 °C", "20 g", "7 min". Il numero e la
 * sua unità restano sulla stessa riga; gli intervalli ("20–40") li protegge
 * Testo con uno span, perché un trattino lungo permette l’a capo.
 */
export function unisciUnita(testo: string): string {
  return testo.replace(
    /(\d) (°C|%|kcal|kg|g|ml|min|minuti|ore|ora|giorni|giorno|litri|litro|grammi|chili)(?![\p{L}\p{N}])/gu,
    "$1 $2",
  );
}

/**
 * Una tabella "breve" ha celle di poche parole: sta in colonne anche a 390px.
 * Le altre, a quella larghezza, si leggono meglio come una scheda per riga.
 */
export function tabellaBreve(tabella: TabellaArticolo): boolean {
  return tabella.intestazioni.length <= 4 && tabella.righe.every((riga) => riga.every((cella) => cella.length <= 30));
}

/** Un intervallo di numeri, con l’eventuale unità già unita da unisciUnita. */
export const INTERVALLO_NUMERICO = /(\d+(?:,\d+)?–\d+(?:,\d+)?(?: [^\s,.;:)]+)?)/g;

/** Tutti i testi di un articolo, approfondimento compreso, nell’ordine di lettura. */
export function testiArticolo(articolo: Articolo): string[] {
  const approfondimento = APPROFONDIMENTI[articolo.slug];
  return [
    articolo.introduzione,
    ...(approfondimento ? [approfondimento.risposta] : []),
    ...articolo.sezioni.flatMap((sezione) => [
      sezione.titolo,
      ...sezione.paragrafi,
      ...(sezione.punti ?? []),
      ...(sezione.tabella ? [...sezione.tabella.intestazioni, ...sezione.tabella.righe.flat(), sezione.tabella.nota ?? ""] : []),
      ...(sezione.dopo ?? []),
    ]),
    ...(approfondimento ? [approfondimento.scenario, ...approfondimento.passi, approfondimento.daSapere] : []),
    ...articolo.faq.flatMap((faq) => [faq.domanda, faq.risposta]),
  ].filter(Boolean);
}

/** I percorsi dei link interni scritti nei testi dell’articolo. */
export function linkInterni(articolo: Articolo): string[] {
  return testiArticolo(articolo).flatMap((testo) => [...testo.matchAll(LINK_TESTO)].map((m) => m[2]));
}

export function paroleArticolo(articolo: Articolo): number {
  return testiArticolo(articolo)
    .map(testoSemplice)
    .join(" ")
    .split(/\s+/)
    .filter((parola) => /[\p{L}\p{N}]/u.test(parola)).length;
}

/** Minuti di lettura: dichiarati, oppure calcolati a 200 parole al minuto. */
export function minutiLettura(articolo: Articolo): number {
  return articolo.minuti ?? Math.max(1, Math.round(paroleArticolo(articolo) / 200));
}

/* ---- ancore e date ---- */

/** Ancora di una sezione: minuscole, senza accenti, parole unite da trattini. */
export function idSezione(titolo: string): string {
  return titolo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Ancore fisse della pagina articolo: le sezioni non devono usarle. */
export const ANCORE_RISERVATE = ["in-breve", "indice", "esempio-pratico", "piatti-collegati", "domande-frequenti", "fonti"];

const FORMATO_DATA = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** "2026-09-27" → "27 settembre 2026" */
export function dataLeggibile(iso: string): string {
  return FORMATO_DATA.format(new Date(`${iso}T00:00:00Z`));
}
