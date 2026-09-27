export type Approfondimento = {
  /** la risposta breve in apertura: due-tre frasi che rispondono alla ricerca */
  risposta: string;
  /** un esempio concreto di settimana o di giornata */
  scenario: string;
  /** i passi da cui cominciare; accettano link [testo](/percorso) */
  passi: string[];
  daSapere: string;
  /** per le guide della prima serie; le nuove usano Articolo.correlati */
  correlati?: string[];
};

// Ogni guida risponde a una ricerca diversa. Gli esempi descrivono scelte pratiche,
// non prescrizioni nutrizionali né promesse su consegne non ancora confermate.
export const APPROFONDIMENTI: Record<string, Approfondimento> = {
  /* ---- seconda serie ---- */
  "abbinare-pasti-tipo-allenamento": {
    risposta: "Abbina il pasto all’allenamento del giorno: con il cardio un piatto più ricco di carboidrati, con i pesi le proteine ben presenti e i carboidrati in quantità più moderata, nel riposo un piatto completo e meno denso. È un criterio per scegliere tra piatti, non una prescrizione.",
    scenario: "Una settimana possibile: lunedì pesi, martedì corsa, mercoledì riposo, giovedì pesi, venerdì calcetto, weekend libero. Nel compositore segni i cinque giorni: la proposta mette il maiale alla senape o le uova alla purgatorio nei giorni di pesi, il riso con pollo teriyaki o i noodles nei giorni di cardio e il piatto più leggero il mercoledì. Poi sistemi tu: se il venerdì ceni fuori, lasci la casella vuota.",
    passi: [
      "Scrivi gli allenamenti reali della settimana, con il loro orario.",
      "Per ogni giorno individua il pasto chiave: il pranzo prima del cardio serale, la cena dopo i pesi.",
      "Scegli il piatto secondo la regola e controlla ingredienti e allergeni nella scheda.",
      "Prova la proposta automatica nel [compositore della settimana](/settimana) e correggila a mano.",
    ],
    daSapere: "La regola viene dall’esperienza di cucina di Matteo ed è coerente con le linee guida per chi fa sport, ma non conosce il tuo peso, i tuoi obiettivi né la tua salute. Se segui un piano, valgono le indicazioni del tuo professionista.",
  },
  "cosa-mangiare-dopo-allenamento-pesi": {
    risposta: "Dopo i pesi mangia un pasto completo: una fonte proteica ben presente (come riferimento 20–40 grammi, secondo le posizioni ISSN), una porzione moderata di carboidrati e delle verdure, possibilmente entro un paio d’ore. Conta più il pasto nel suo insieme che il cronometro.",
    scenario: "Il martedì fai pesi dalle 18:30 alle 19:45. Se in frigorifero trovi già un piatto pronto, ceni entro le 21 senza passare dal bar sotto la palestra: per esempio fesa di maiale con patate e spinaci, più un frutto. Il giovedì invece ti alleni alle 7: la colazione dopo la seduta diventa il pasto chiave, con yogurt o latte, pane e frutta, e il pranzo completa il recupero.",
    passi: [
      "Segna sul calendario i giorni di pesi e l’ora in cui finisci.",
      "Decidi prima dove mangerai il pasto successivo: casa, ufficio o palestra.",
      "Scegli un piatto con una fonte proteica chiara e una porzione di carboidrati.",
      "Nel [compositore](/settimana) segna quei giorni come ‘pesi’ e controlla la proposta.",
    ],
    daSapere: "Gli intervalli citati vengono da documenti per la popolazione sportiva e non sono una prescrizione. FUEL LAB è una cucina: se hai obiettivi di composizione corporea o condizioni cliniche, i numeri li stabilisce il tuo nutrizionista.",
  },
  "cosa-mangiare-prima-di-correre": {
    risposta: "Prima di correre scegli carboidrati facili da digerire: un pasto completo 2–3 ore prima, con pasta o riso e condimento leggero, oppure uno spuntino piccolo 30–60 minuti prima, come pane e miele, fette biscottate o una banana. Evita fritture, grassi e molta fibra a ridosso della corsa.",
    scenario: "Esci a correre alle 19 per un’ora, con qualche ripetuta. A pranzo, alle 13, mangi un piatto di riso con verdure e pollo; alle 17 una merenda con pane e marmellata o un frutto. Rientri, bevi e alle 20:30 ceni con un piatto completo. Se un altro giorno la corsa è di 30 minuti a ritmo tranquillo, pranzo e cena normali bastano: non serve trasformare ogni uscita in una gara.",
    passi: [
      "Guarda orario e durata della corsa prima di decidere il pasto.",
      "Se mancano più di 2–3 ore, fai un pasto completo con carboidrati e condimento leggero.",
      "Se mancano meno di due ore, scegli uno spuntino piccolo e già provato.",
      "Nei giorni di cardio segnati nel [compositore](/settimana), la settimana parte dai piatti più ricchi di carboidrati.",
    ],
    daSapere: "Tempi e quantità sono indicazioni generali tratte da linee guida per la popolazione e da documenti per sportivi. Se prepari una gara o hai disturbi gastrointestinali ricorrenti, serve un piano personale con un professionista.",
  },
  "cosa-mangiare-sera-dopo-allenamento": {
    risposta: "La sera dopo l’allenamento mangia una cena completa e digeribile: una fonte proteica, una porzione di carboidrati e verdure, senza fritture né piatti molto grassi. Dopo il cardio puoi aumentare i carboidrati, dopo i pesi metti le proteine in primo piano. Anche se finisci tardi, non saltare la cena: riduci il volume, non la completezza.",
    scenario: "Esci dalla palestra alle 21:15 dopo una seduta di pesi. A casa scaldi un piatto preparato il giorno prima, per esempio uova in sugo di peperoni con una fetta di pane, e alle 21:45 sei a tavola. Il giorno dopo corri alle 19: la cena dopo la corsa è un riso con pollo e verdure, più ricco di carboidrati. Due sere diverse, la stessa regola.",
    passi: [
      "Prima di uscire di casa, sappi già che cosa mangerai al rientro.",
      "Tieni in frigorifero almeno un piatto completo per le sere di allenamento.",
      "Adatta i carboidrati al tipo di seduta: più dopo il cardio, moderati dopo i pesi.",
      "Pianifica le cene dei giorni di allenamento nel [compositore](/settimana).",
    ],
    daSapere: "Le indicazioni valgono per chi si allena a livello amatoriale. Per disturbi del sonno, problemi digestivi o obiettivi specifici di peso, confrontati con un medico o un nutrizionista.",
  },
  "quante-proteine-per-pasto": {
    risposta: "Come riferimento, l’ISSN indica circa 20–40 grammi di proteine per pasto, cioè 0,25–0,40 grammi per chilo di peso corporeo, distribuiti ogni 3–4 ore, dentro una quota giornaliera di 1,4–2,0 grammi per chilo per chi si allena. Per la popolazione adulta in generale l’EFSA indica 0,83 grammi per chilo al giorno.",
    scenario: "Una persona di 60 chili che si allena tre volte a settimana ha, con 0,25–0,40 grammi per chilo, una dose di circa 15–24 grammi per pasto. A colazione aggiunge uno yogurt, a pranzo sceglie un piatto con una fonte proteica chiara, a cena uova o pesce. Se il piatto pronto ha più proteine di quelle che le servono in un pasto, lo divide in due porzioni e completa con verdure e pane.",
    passi: [
      "Calcola l’intervallo per pasto sul tuo peso: 0,25 e 0,40 grammi per chilo.",
      "Guarda la tua giornata tipo e individua il pasto con meno proteine, spesso la colazione.",
      "Distribuisci le fonti proteiche su tre o quattro momenti della giornata.",
      "Se hai numeri precisi del tuo nutrizionista, usali nella pagina [sui tuoi macro](/scheda).",
    ],
    daSapere: "Le cifre valgono per adulti sani e sono riferimenti di popolazione. In presenza di malattie, in gravidanza, in crescita o con obiettivi specifici, la quota di proteine va decisa con un professionista.",
  },
  "pallotte-cacio-e-ova-versione-fit": {
    risposta: "Le pallotte cacio e ova sono polpette abruzzesi di formaggio, uova e pane, fritte e poi cotte nel sugo di pomodoro. La versione fit di FUEL LAB usa pane raffermo, uova, ricotta e parmigiano con un sugo di pomodorini: resta il sapore della tradizione, con un impasto più leggero e i valori della porzione scritti in scheda.",
    scenario: "Il giovedì ti alleni con i pesi alle 18. Le pallotte le ritiri o le ricevi quel giorno stesso, perché Matteo cucina e consegna ogni giorno: le conservi come indicato e la sera le mangi con un contorno di verdure. Il venerdì a pranzo scegli un piatto diverso, per non ripetere lo stesso sapore due volte di fila.",
    passi: [
      "Apri la scheda delle pallotte fit e controlla ingredienti e allergeni.",
      "Mettile in un giorno di pesi della tua settimana, a pranzo o a cena.",
      "Abbinale a verdure di stagione per completare il pasto.",
      "Chiedi a Matteo disponibilità nel giorno che ti serve, ritiro o consegna.",
    ],
    daSapere: "Contengono glutine, uova e latte. La versione tradizionale fritta resta un piatto delle feste; quella fit è pensata per i giorni feriali, non per sostituire la tradizione.",
  },
  "cosa-mangiare-calcetto-crossfit-pescara": {
    risposta: "Prima di calcetto e CrossFit fai un pasto digeribile e ricco di carboidrati 2–3 ore prima, oppure una merenda con carboidrati 1–2 ore prima. Dopo, anche se è tardi, una cena completa con carboidrati, una fonte proteica e verdure. Per un’ora di gioco basta l’acqua.",
    scenario: "Martedì calcetto alle 21. Pranzi alle 13 con un piatto di riso, pollo e verdure; alle 18:30 mangi pane e marmellata e un frutto; porti la borraccia al campo. Alle 22:30 sei a casa e scaldi un piatto già pronto, invece di finire ogni settimana in pizzeria. Giovedì, WOD alle 19: stesso schema, con la merenda un po’ prima.",
    passi: [
      "Segna nel calendario partite e WOD con il loro orario reale.",
      "Decidi se preferisci merenda prima e cena dopo, o cena anticipata e spuntino dopo.",
      "Tieni pronto un piatto completo per il rientro serale.",
      "Nel [compositore](/settimana) segna questi giorni come cardio o pesi, a seconda di che cosa prevale.",
    ],
    daSapere: "Tornei, doppie sedute o allenamenti agonistici richiedono strategie più precise, da definire con un professionista dello sport.",
  },
  "idratazione-allenamento-caldo-pescara": {
    risposta: "Con il caldo bevi con regolarità durante tutta la giornata e prima, durante e dopo l’allenamento; per sedute moderate o sotto i 45–60 minuti basta l’acqua. Allenati nelle ore fresche, scegli pasti leggeri e ricchi di verdure e tieni il cibo preparato sempre in frigorifero o in borsa termica.",
    scenario: "A luglio corri sul lungomare alle 6:45 invece che alle 18. Prima di uscire bevi un bicchiere d’acqua, porti la borraccia, e al rientro ti pesi per capire quanto hai sudato. Il pranzo lo porti in ufficio in una borsa termica con siberini e lo metti subito in frigorifero. La sera ceni con un piatto ricco di verdure e una fonte proteica.",
    passi: [
      "Sposta gli allenamenti all’aperto nelle prime ore del mattino o dopo il tramonto.",
      "Pesati prima e dopo una seduta tipo per stimare la perdita di liquidi.",
      "Usa borsa termica e siberini per ogni pasto deperibile fuori casa.",
      "Nei giorni più caldi scegli piatti ricchi di verdure e cotture semplici.",
    ],
    daSapere: "Se hai patologie cardiache, renali o epatiche, o assumi farmaci che influenzano i liquidi, le quantità da bere vanno concordate con il medico.",
  },
  "settimana-tipo-allenamento-alimentazione": {
    risposta: "Per organizzare una settimana tipo parti dai giorni di allenamento, individua il pasto chiave di ogni giorno (il pranzo prima del cardio, la cena dopo i pesi), cucina due volte a settimana o ricevi i piatti nei giorni in cui ti servono, e lascia libere le caselle dei pasti fuori. Gli schemi con tre, quattro o cinque allenamenti sono un punto di partenza da adattare.",
    scenario: "Ti alleni quattro volte: pesi il lunedì, corsa il martedì, di nuovo pesi il giovedì e un lungo il sabato. La domenica prepari due pranzi; per le due cene dopo i pesi ricevi un piatto pronto il giorno stesso. Il mercoledì e il venerdì mangi quello che hai in casa, senza schemi.",
    passi: [
      "Scegli lo schema più vicino al numero dei tuoi allenamenti.",
      "Sposta i giorni in base al tuo calendario reale.",
      "Segna per ogni giorno il pasto chiave e decidi chi lo cucina.",
      "Riporta lo schema nel [compositore](/settimana) e invia la settimana a Matteo.",
    ],
    daSapere: "Gli schemi descrivono l’organizzazione dei pasti, non il programma di allenamento: per carichi, recuperi e progressioni fai riferimento al tuo allenatore.",
  },
  "piatti-gia-composti-cosa-sono": {
    risposta: "I piatti già composti sono pasti completi pensati dal cuoco, con base di carboidrati, fonte proteica, verdure e condimento in un’unica ricetta. Ingredienti, grammature, allergeni e macro della porzione sono dichiarati: scegli il piatto invece di assemblare ogni componente.",
    scenario: "Hai tre pranzi in ufficio e due cene dopo la palestra da coprire. Invece di decidere ogni volta basi e condimenti, scegli cinque piatti già composti, controlli le schede e li distribuisci nella settimana. Nei giorni in cui hai più fame aggiungi alla box una porzione di verdure o uno snack.",
    passi: [
      "Individua i pasti della settimana che non riesci a cucinare.",
      "Apri le schede del [menu](/menu) e confronta macro, ingredienti e allergeni.",
      "Aggiungi alla box solo quello che ti serve davvero.",
      "Componi la settimana e chiedi a Matteo conferma di disponibilità e ritiro.",
    ],
    daSapere: "I piatti già composti non sostituiscono un piano alimentare personalizzato. Se hai numeri precisi da rispettare, parti dalla pagina sui tuoi macro.",
  },
  "pranzo-proteico-ufficio": {
    risposta: "Un pranzo proteico da ufficio unisce una fonte proteica ben presente (carne magra, pesce, uova, legumi o formaggi freschi), una porzione di carboidrati e verdure, in un contenitore chiuso tenuto al fresco. Se ti alleni la sera, mantienilo digeribile e aggiungi una merenda prima della seduta.",
    scenario: "Lavori in centro a Pescara e alle 18:30 hai la palestra. La sera prima prepari un contenitore con farro, ceci e verdure, oppure ritiri un piatto già pronto. Alle 13 pranzi lontano dalla scrivania, alle 16:30 mangi uno yogurt e un frutto, alle 18:30 ti alleni e la cena completa il recupero.",
    passi: [
      "Verifica se in ufficio hai frigorifero e microonde.",
      "Scegli per ogni giorno una fonte proteica diversa.",
      "Completa con carboidrati e verdure, secondo l’allenamento della sera.",
      "Organizza i pranzi della settimana nel [compositore](/settimana), anche solo quelli.",
    ],
    daSapere: "Le quantità di proteine citate sono riferimenti generali per chi si allena. Per esigenze cliniche o obiettivi specifici, segui le indicazioni del tuo professionista.",
  },
  "meal-prep-studenti-universitari-pescara-chieti": {
    risposta: "Per il meal prep da studente scegli i pasti critici della settimana, di solito i pranzi tra le lezioni; cucina due volte a settimana basi versatili, cioè un cereale, una fonte proteica e verdure; porta il pasto in un contenitore chiuso con borsa termica. Nelle settimane più piene puoi affiancare qualche piatto già pronto.",
    scenario: "Lunedì e mercoledì hai lezione a Chieti tutto il giorno, martedì e giovedì a Pescara con la palestra la sera. La domenica cucini riso, ceci e verdure al forno per due pranzi; il mercoledì sera rifai le basi per giovedì e venerdì. Per la cena del martedì dopo la palestra ritiri un piatto pronto a Pescara.",
    passi: [
      "Segna lezioni, spostamenti e allenamenti della settimana.",
      "Scegli i tre-cinque pasti che rischi di saltare.",
      "Cucina due volte a settimana basi da combinare.",
      "Per i giorni più pieni, valuta qualche piatto pronto nel [compositore](/settimana).",
    ],
    daSapere: "Frigoriferi condivisi e tragitti lunghi rendono la conservazione il punto più delicato: in caso di dubbio su un alimento, non consumarlo.",
  },
  /* ---- prima serie ---- */
  "meal-prep-pescara-cosa-significa": {
    risposta: "Il meal prep è l’organizzazione anticipata di alcuni pasti: pianificarli, prepararli e conservarli. Per iniziare a Pescara scegli i due o tre pasti che rischi di saltare, cucinali o fatteli preparare non più di due o tre giorni prima e tienili in frigorifero; poi aggiungi altri pasti solo se servono.",
    scenario: "Lunedì lavori fino a tardi, martedì pranzi fuori e giovedì ti alleni alle 19. Non servono quattordici contenitori: la domenica sera prepari un’insalata di farro e ceci per il pranzo di lunedì, il lunedì ritiri un piatto per la cena e il giovedì un altro per la cena dopo la palestra. Gli altri pasti restano liberi, e a fine settimana correggi la bozza guardando che cosa è avanzato.",
    passi: [
      "Segna solo i giorni in cui il pasto è difficile da organizzare.",
      "Scegli una ricetta semplice o un piatto del [menu](/menu), controllando ingredienti e allergeni.",
      "Prevedi dove conserverai il pasto e per quanti giorni: meglio due preparazioni a settimana.",
      "Prova il [compositore](/settimana) e chiedi a Matteo disponibilità e zona di consegna.",
    ],
    daSapere: "FUEL LAB cucina ogni giorno e consegna ogni giorno. Per un indirizzo specifico a Pescara o nei dintorni chiedi conferma prima di contare sulla consegna; per le quantità personali fai riferimento al tuo professionista.",
    correlati: ["menu-settimanale-pescara-come-pianificarlo", "conservare-pasti-preparati-frigorifero"],
  },
  "cucina-salutare-asporto-pescara": {
    risposta: "Per scegliere cucina salutare d’asporto a Pescara guarda cinque cose: ingredienti, allergeni, porzione, cottura e condimenti, istruzioni di conservazione. La parola ‘salutare’ da sola non descrive un piatto; per l’asporto l’informazione sugli allergeni è obbligatoria, i valori nutrizionali no.",
    scenario: "Martedì hai venti minuti di pausa e l’allenamento alle 18:30. Tra due locali scegli quello che indica ingredienti e allergeni, lasci il fritto e prendi un piatto con riso, una fonte proteica e verdure. Se invece ritiri il pranzo del giorno dopo, chiedi come conservarlo e se il contenitore va nel microonde, e lo metti in frigorifero appena arrivi.",
    passi: [
      "Leggi la scheda del piatto e annota gli ingredienti da chiarire.",
      "Controlla se i valori sono per 100 grammi o per porzione.",
      "Chiedi istruzioni di conservazione e riscaldamento per il pasto specifico.",
      "Apri il [menu](/menu), componi la selezione nel [compositore](/settimana) e scrivi a Matteo le domande rimaste.",
    ],
    daSapere: "La scelta dipende dalle tue necessità. Un menu online non può garantire l’idoneità di un piatto per condizioni mediche o allergie.",
    correlati: ["consegna-pasti-pescara-cosa-chiedere", "leggere-etichetta-nutrizionale-piatti-pronti"],
  },
  "pranzo-lavoro-pescara-organizzarlo": {
    risposta: "Per organizzare il pranzo al lavoro a Pescara parti dalla pausa reale: quanto dura, dove mangi, se c’è un frigorifero. Poi assegna a ogni giorno una soluzione, cioè portavivande, piatto già pronto, tavola calda o mensa, e prepara in anticipo solo i pranzi dei giorni più stretti.",
    scenario: "Una settimana tipica può avere due pranzi in ufficio con poco tempo, uno in giro per appuntamenti e due più tranquilli. Pianifichi i primi tre: un portavivande preparato la sera prima, un piatto già pronto ricevuto il lunedì, un panino semplice con verdura e un frutto per il giorno in giro. Se in ufficio non c’è il frigorifero, porti la borsa termica con i siberini.",
    passi: [
      "Segna l’orario della pausa e il luogo in cui mangerai.",
      "Verifica se hai frigorifero, microonde e stoviglie.",
      "Assegna a ogni giorno una soluzione compatibile con trasporto e conservazione.",
      "Se lavori nella zona di Pescara, chiedi a FUEL LAB se il tuo indirizzo rientra nelle [consegne](/consegna-pasti-pescara).",
    ],
    daSapere: "Un pasto pronto resta pratico solo se hai informazioni chiare su tempi e conservazione. Segui sempre le istruzioni del prodotto.",
    correlati: ["meal-prep-pescara-cosa-significa", "consegna-pasti-pescara-cosa-chiedere"],
  },
  "piatto-equilibrato-ingredienti-varieta": {
    risposta: "Un piatto equilibrato mette insieme verdure, una base di cereali o patate, una fonte proteica e un condimento misurato. Come riferimento visivo: metà piatto di verdura, un quarto di cereali, un quarto di proteine. Le quantità dipendono da persona e giornata, e l’equilibrio si valuta sulla settimana.",
    scenario: "Davanti a due piatti pronti, una descrizione come ‘ricco di proteine’ non basta. Il primo è pollo e riso senza verdure, il secondo ha riso, pollo, carote e zucchine: scegli il secondo, oppure completi il primo con un contorno e un frutto. Se a pranzo hai mangiato poca verdura, a cena la metti al centro del piatto.",
    passi: [
      "Leggi ingredienti e porzione, non solo il nome commerciale.",
      "Controlla che nel piatto ci siano verdure, una base di carboidrati e una fonte proteica.",
      "Ruota cereali, proteine e verdure nell’arco della settimana.",
      "Nel [menu](/menu) confronta piatti e macro e componi una bozza nel [compositore](/settimana).",
    ],
    daSapere: "Le indicazioni generali non sostituiscono il parere di un dietista, biologo nutrizionista o medico per necessità individuali.",
    correlati: ["macro-cosa-sono-come-leggerli", "leggere-etichetta-nutrizionale-piatti-pronti"],
  },
  "meal-prep-allenamento-cardio-pesi": {
    risposta: "Se alterni cardio e pesi, prepara in anticipo i pasti che cadono prima e dopo le sedute: stesse basi di carboidrati, proteine e verdure, proporzioni diverse secondo il giorno. Cucina due volte a settimana, porziona ed etichetta i contenitori; le quantità personali restano quelle del tuo professionista.",
    scenario: "Pesi il lunedì alle 18:30 e di nuovo il giovedì, corsa il martedì alle 19. La domenica cucini riso, pollo, patate e una teglia di verdure: il contenitore di martedì ha più riso, quello di lunedì più pollo e patate. Il mercoledì sera rifai le basi per giovedì e venerdì, oppure il giovedì ricevi un piatto pronto per la cena dopo la palestra.",
    passi: [
      "Inserisci gli allenamenti reali della settimana, con l’orario.",
      "Individua i pasti chiave prima e dopo le sedute.",
      "Prepara basi comuni e cambia le proporzioni nel contenitore.",
      "Per i giorni più pieni prova la proposta del [compositore](/settimana).",
    ],
    daSapere: "Cardio e pesi non corrispondono automaticamente a due menu prestabiliti: la regola della cucina è un criterio organizzativo, non terapeutico. Se segui un piano, valgono le indicazioni del tuo professionista.",
    correlati: ["pranzo-dopo-allenamento-pescara", "pasti-con-proteine-menu-settimanale"],
  },
  "conservare-pasti-preparati-frigorifero": {
    risposta: "Per conservare i pasti preparati: frigorifero intorno ai +4 °C, cibi cotti in frigo entro due ore dalla cottura (un’ora d’estate), contenitori chiusi, crudo separato dal cotto. I cibi cotti si consumano in genere entro due o tre giorni, ma quando il piatto ha istruzioni o una data valgono quelle.",
    scenario: "Il lunedì ricevi due piatti per martedì e mercoledì. Li metti subito in frigorifero, lontano dagli alimenti crudi, con il giorno scritto sul coperchio. Il mercoledì porti il pranzo in ufficio nella borsa termica e lo riponi in frigo appena arrivi; a pranzo lo scaldi fino a quando è molto caldo anche al centro, seguendo le istruzioni del piatto.",
    passi: [
      "Controlla subito le indicazioni fornite con il pasto.",
      "Riponi i cibi cotti in frigorifero entro due ore, un’ora d’estate.",
      "Tieni separati crudo e pronto al consumo, in contenitori chiusi con la data.",
      "Chiedi a FUEL LAB come conservare il piatto specifico prima dell’ordine.",
    ],
    daSapere: "Per la sicurezza alimentare fanno fede le istruzioni del produttore e le indicazioni del Ministero della Salute: i tempi di questa guida sono riferimenti generali, non una scadenza valida per ogni piatto.",
    correlati: ["meal-prep-pescara-cosa-significa", "pranzo-lavoro-pescara-organizzarlo"],
  },
  "pranzo-dopo-allenamento-pescara": {
    risposta: "Dopo un allenamento al mattino o in pausa pranzo, il pranzo è il pasto del recupero: una base di carboidrati, una fonte proteica e verdure, possibilmente entro un paio d’ore dalla seduta. Decidilo prima: un pasto già pronto, tenuto al fresco fino alla pausa, evita il panino preso di corsa.",
    scenario: "Il martedì fai pesi dalle 7 alle 8 e alle 9 sei in ufficio in centro. Dopo la doccia mangi uno yogurt con pane e frutta; alle 13 scaldi il piatto portato in borsa termica, per esempio fesa di maiale con patate e spinaci. Il giovedì corri in pausa pranzo alle 12:30: a metà mattina uno spuntino con carboidrati, alle 14 riso, pollo e verdure.",
    passi: [
      "Segna ora di fine allenamento e luogo del pranzo.",
      "Prepara o ritira il pasto il giorno prima e verifica come lo conserverai.",
      "Scegli un piatto con carboidrati, fonte proteica e verdure, secondo la seduta.",
      "Scrivi a Matteo per sapere se la [consegna](/consegna-pasti-pescara) arriva a casa o in ufficio.",
    ],
    daSapere: "Nessun piatto del sito promette risultati sportivi. Per indicazioni nutrizionali individuali consulta un professionista abilitato.",
    correlati: ["meal-prep-allenamento-cardio-pesi", "pranzo-lavoro-pescara-organizzarlo"],
  },
  "spesa-settimanale-meal-prep-zero-sprechi": {
    risposta: "Una spesa settimanale per il meal prep parte dai pasti che farai davvero a casa: contali, controlla che cosa hai già, scegli ingredienti che servono a più ricette e scrivi la lista con le quantità. Poi riponi la spesa con i prodotti più vecchi davanti e lascia una casella libera per gli avanzi.",
    scenario: "Hai due cene fuori, quattro pasti coperti da piatti già pronti e cinque da cucinare. La lista copre solo quei cinque: farro, ceci, pollo, uova, zucchine, carote e frutta. I ceci vanno nell’insalata di martedì e nella pasta di giovedì, le zucchine nella teglia e nella frittata. Il venerdì resta libero per gli avanzi.",
    passi: [
      "Conta pranzi e cene realmente da preparare.",
      "Controlla scorte e date di frigorifero, congelatore e dispensa.",
      "Scrivi la lista per reparti, con le quantità.",
      "Togli dalla lista i pasti che scegli nel [compositore](/settimana) e completa il piano con il [menu](/menu).",
    ],
    daSapere: "‘Zero sprechi’ è un obiettivo pratico, non una garanzia: acquisto, porzioni e conservazione vanno adattati alla tua settimana.",
    correlati: ["cucina-di-stagione-abruzzo-pescara", "menu-settimanale-pescara-come-pianificarlo"],
  },
  "leggere-etichetta-nutrizionale-piatti-pronti": {
    risposta: "Per leggere l’etichetta di un piatto pronto parti dal peso e dalla porzione, poi guarda ingredienti e allergeni, infine la tabella: i valori per 100 grammi servono a confrontare prodotti, quelli della porzione descrivono ciò che mangerai. Diciture come ‘light’ o ‘fonte di proteine’ hanno soglie di legge, ma non raccontano tutto il piatto.",
    scenario: "Una tabella indica 150 kcal per 100 grammi e la confezione pesa 300 grammi: la porzione intera corrisponde a 450 kcal. Il calcolo però non dice se il pasto sia adatto a te: guardi anche gli ingredienti, gli allergeni evidenziati, il sale e che cosa hai mangiato nel resto della giornata.",
    passi: [
      "Individua il peso netto e la porzione effettiva.",
      "Distingui i valori per 100 grammi da quelli per porzione.",
      "Leggi ingredienti e allergeni prima delle diciture in evidenza.",
      "Nel [menu](/menu) usa i dati per porzione per confrontare i piatti e chiedi chiarimenti se manca un dettaglio.",
    ],
    daSapere: "Per allergie e intolleranze serve sempre conferma diretta sugli ingredienti e sulle possibili contaminazioni.",
    correlati: ["macro-cosa-sono-come-leggerli", "cucina-salutare-asporto-pescara"],
  },
  "pasti-con-proteine-menu-settimanale": {
    risposta: "Per variare le fonti proteiche nella settimana alterna carne, pesce, uova, latticini e legumi, cambiando anche cotture e condimenti. Le linee guida CREA indicano per gli adulti pesce almeno 2–3 volte a settimana, 2–4 uova, 2–4 porzioni di legumi e carni magre con moderazione; le quantità per te vanno valutate individualmente.",
    scenario: "Su dieci pranzi e cene metti due piatti di pesce, tre di legumi, uno di uova e il resto tra carne e latticini. Se tre pasti arrivano dal menu FUEL LAB, per esempio pollo, maiale e uova, a casa cucini pesce e legumi. Se un alimento non ti piace o non puoi mangiarlo, lo sostituisci: la tabella è un punto di partenza, non un obbligo.",
    passi: [
      "Controlla quali fonti proteiche ci sono nei piatti che hai già scelto.",
      "Completa la settimana con le fonti che mancano, spesso pesce e legumi.",
      "Cambia cotture e condimenti per la stessa fonte.",
      "Se hai un obiettivo personale, confronta la scelta con il professionista che ti segue.",
    ],
    daSapere: "La dicitura ‘proteico’ non è sinonimo di adatto a tutti. Ingredienti, porzioni ed esigenze personali contano più di un’etichetta.",
    correlati: ["piatto-equilibrato-ingredienti-varieta", "meal-prep-allenamento-cardio-pesi"],
  },
  "cucina-di-stagione-abruzzo-pescara": {
    risposta: "Per portare la stagione nel menu a Pescara scegli al mercato quello che c’è davvero nel periodo e usalo in due o tre preparazioni diverse. Secondo il CREA frutta e verdura di stagione di solito costano meno e sono più buone; il calendario resta orientativo e il ‘chilometro zero’ non è sempre sinonimo di sostenibile.",
    scenario: "A ottobre trovi zucca e cavolfiore a buon prezzo. La domenica cuoci una teglia di zucca al forno: metà diventa il contorno di due pranzi, metà una crema per la cena di martedì. Il cavolfiore va in teglia con i finocchi per giovedì. Il resto della settimana lo completi con due piatti del menu.",
    passi: [
      "Osserva disponibilità e prezzi al mercato nel periodo.",
      "Scegli un ingrediente protagonista e due preparazioni per la settimana.",
      "Acquista quantità che puoi usare e conservare correttamente.",
      "Consulta il [menu](/menu) e chiedi quali piatti sono disponibili nei giorni che ti interessano.",
    ],
    daSapere: "Non attribuiamo a un ingrediente proprietà curative o risultati specifici: la varietà alimentare va vista nel quadro delle abitudini complessive.",
    correlati: ["spesa-settimanale-meal-prep-zero-sprechi", "menu-settimanale-pescara-come-pianificarlo"],
  },
  "consegna-pasti-pescara-cosa-chiedere": {
    risposta: "Prima di richiedere una consegna pasti a Pescara verifica: indirizzo coperto, giorni e costi di consegna, ingredienti e allergeni dei piatti, valori riferiti alla porzione, istruzioni per ricezione e conservazione. Sono i dettagli che rendono concreto un servizio.",
    scenario: "Lavori in un ufficio a Montesilvano e vuoi i pranzi per metà settimana. Nella richiesta scrivi via e numero civico, ‘ufficio, dalle 9 alle 18’, il giovedì come giorno preferito, tre pranzi scelti nel compositore e il fatto che eviti il sesamo. Matteo ti risponde con copertura, costo della consegna e piatti adatti, e in ufficio liberi un ripiano del frigorifero.",
    passi: [
      "Prepara indirizzo completo e giorni in cui puoi ricevere.",
      "Scegli i piatti dal [menu](/menu) o componi una settimana nel [compositore](/settimana).",
      "Chiedi conferma su copertura, costi e modalità pratiche.",
      "Organizza un frigorifero libero per il giorno della consegna.",
    ],
    daSapere: "Il sito non completa ordini né incassa pagamenti online. La richiesta viene confermata direttamente da Matteo.",
    correlati: ["cucina-salutare-asporto-pescara", "pranzo-lavoro-pescara-organizzarlo"],
  },
  "macro-cosa-sono-come-leggerli": {
    risposta: "I macro sono proteine, carboidrati e grassi, che forniscono rispettivamente 4, 4 e 9 kcal per grammo. Quando li leggi, verifica se il numero si riferisce a 100 grammi o alla porzione, confronta i piatti con lo stesso riferimento e leggili insieme agli ingredienti: descrivono il piatto, non il tuo fabbisogno.",
    scenario: "Un piatto da 900 grammi può avere più proteine di uno da 600 solo perché è più grande, non per una ricetta speciale. Per confrontarli dividi i valori per il peso e moltiplica per 100, poi guarda quanta parte dell’energia arriva dalle proteine e dai carboidrati. Solo a quel punto scegli, in base al gusto e all’allenamento del giorno.",
    passi: [
      "Trova il riferimento del dato: 100 grammi o porzione.",
      "Confronta valori riferiti alla stessa quantità.",
      "Leggi l’elenco degli ingredienti e gli allergeni.",
      "Nel [compositore](/settimana) modifica i piatti proposti in base a gusto e indicazioni del tuo professionista, se ne segui uno.",
    ],
    daSapere: "Le tabelle descrivono alimenti e ricette: non stabiliscono fabbisogni individuali né sostituiscono un piano nutrizionale.",
    correlati: ["leggere-etichetta-nutrizionale-piatti-pronti", "piatto-equilibrato-ingredienti-varieta"],
  },
  "menu-settimanale-pescara-come-pianificarlo": {
    risposta: "Un menu settimanale funziona se parte dai tuoi impegni reali: segna i punti fermi, conta i pasti da coprire, assegna a ciascuno una soluzione e ruota cereali, proteine e verdure. Cucina due volte a settimana, o fatti consegnare i piatti nei giorni che ti servono, e lascia una casella libera per gli imprevisti.",
    scenario: "Segni due pranzi in ufficio, una cena dopo la palestra e il resto della settimana aperto. Per quei tre momenti scegli piatti diversi, uno con legumi, uno con uova, uno con carne, e scrivi che cosa devi comprare e che cosa ricevere. Il mercoledì controlli la bozza: se è saltato un allenamento, sposti la cena al giorno dopo.",
    passi: [
      "Metti sul calendario lavoro, studio, sport e pasti fuori casa.",
      "Seleziona solo i momenti in cui serve una scelta anticipata.",
      "Alterna piatti e fonti proteiche e lascia spazio ai cambi.",
      "Componi la bozza nel [compositore](/settimana) e chiedi a Matteo disponibilità e consegna per il tuo comune.",
    ],
    daSapere: "Una settimana organizzata non richiede un piano alimentare rigido. Il servizio FUEL LAB aiuta a scegliere pasti; per esigenze cliniche serve un professionista.",
    correlati: ["meal-prep-pescara-cosa-significa", "consegna-pasti-pescara-cosa-chiedere"],
  },
};
