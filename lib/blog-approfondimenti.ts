export type Approfondimento = {
  risposta: string;
  scenario: string;
  passi: string[];
  daSapere: string;
  correlati: string[];
};

// Ogni guida risponde a una ricerca diversa. Gli esempi descrivono scelte pratiche,
// non prescrizioni nutrizionali né promesse su consegne non ancora confermate.
export const APPROFONDIMENTI: Record<string, Approfondimento> = {
  "meal-prep-pescara-cosa-significa": {
    risposta: "Il meal prep è l'organizzazione anticipata di alcuni pasti. Per iniziare a Pescara, scegli prima i pranzi o le cene che rischi di saltare per mancanza di tempo, poi decidi se cucinarli, assemblarli o richiederli già pronti.",
    scenario: "Esempio: lunedì lavori fino a tardi, martedì pranzi fuori e giovedì ti alleni. Non serve preparare quattordici contenitori: scegli due pranzi e una cena, verifica dove li conserverai e lascia gli altri pasti liberi. Una bozza leggera si adatta meglio ai cambi di programma.",
    passi: ["Segna solo i giorni in cui il pasto è difficile da organizzare.", "Controlla ingredienti, porzioni e allergeni prima di scegliere.", "Prevedi dove conserverai il pasto fino al consumo.", "Consulta il menu FUEL LAB e prova il compositore settimanale; poi chiedi disponibilità e zona di consegna."],
    daSapere: "FUEL LAB indica preparazioni e consegne il lunedì e il giovedì. Per un indirizzo specifico a Pescara o nei dintorni, chiedi conferma prima di contare sulla consegna.",
    correlati: ["menu-settimanale-pescara-come-pianificarlo", "conservare-pasti-preparati-frigorifero"],
  },
  "cucina-salutare-asporto-pescara": {
    risposta: "Per scegliere cucina salutare d'asporto a Pescara, parti dalle informazioni verificabili: ingredienti, porzione, allergeni, modalità di conservazione e disponibilità del servizio. La parola salutare da sola non descrive un piatto.",
    scenario: "Se devi ritirare o ricevere un pranzo durante il lavoro, chiedi quando sarà pronto e dove potrai conservarlo. Se il menu riporta i macro, confronta i valori con la porzione reale, non con un generico numero per 100 grammi. Se hai un'allergia, serve una conferma diretta sugli ingredienti e sulla preparazione.",
    passi: ["Leggi la scheda del piatto e annota gli ingredienti da chiarire.", "Verifica prezzo, zona, giorno e modalità di consegna prima di pianificare la pausa.", "Chiedi istruzioni di conservazione per il pasto specifico.", "Apri il menu FUEL LAB, componi la tua selezione e scrivici le domande rimaste."],
    daSapere: "La scelta dipende dalle tue necessità. Un menu online non può garantire l'idoneità di un piatto per condizioni mediche o allergie.",
    correlati: ["consegna-pasti-pescara-cosa-chiedere", "leggere-etichetta-nutrizionale-piatti-pronti"],
  },
  "pranzo-lavoro-pescara-organizzarlo": {
    risposta: "Per organizzare il pranzo al lavoro a Pescara, identifica prima i giorni con una pausa breve. Per quei giorni prepara o scegli un pasto facile da trasportare e da conservare nel luogo in cui lavori.",
    scenario: "Una settimana tipica può avere due pranzi in ufficio, uno in movimento e due a casa. È più utile pianificare i primi tre che ordinare un numero fisso di pasti. Se non hai un frigorifero a disposizione, verifica come mantenere il cibo alla temperatura indicata fino alla pausa.",
    passi: ["Segna l'orario della pausa e il luogo in cui mangerai.", "Verifica se hai frigorifero, stoviglie e possibilità di riscaldare.", "Scegli preparazioni compatibili con trasporto e conservazione.", "Se lavori nell'area di Pescara, chiedi a FUEL LAB se il tuo indirizzo rientra nelle consegne."],
    daSapere: "Un pasto pronto resta pratico solo se hai informazioni chiare su tempi e conservazione. Segui sempre le istruzioni del prodotto.",
    correlati: ["meal-prep-pescara-cosa-significa", "consegna-pasti-pescara-cosa-chiedere"],
  },
  "piatto-equilibrato-ingredienti-varieta": {
    risposta: "Un piatto equilibrato si valuta nel contesto dell'intera giornata e delle esigenze personali. Per orientarti, guarda varietà degli ingredienti, porzione effettiva e modalità di preparazione, evitando formule uguali per tutti.",
    scenario: "Davanti a due piatti pronti, una descrizione come 'ricco di proteine' non basta. Confronta la lista degli ingredienti, la presenza di verdure, la fonte di carboidrati, il tipo di condimento e la quantità che mangerai. Se hai un piano clinico, la scelta va confrontata con chi lo ha prescritto.",
    passi: ["Leggi ingredienti e porzione, non solo il nome commerciale.", "Considera varietà di alimenti nell'arco della settimana.", "Controlla allergeni e chiedi chiarimenti quando servono.", "Nel menu FUEL LAB confronta piatti e macro pubblicati e componi una bozza modificabile."],
    daSapere: "Le indicazioni generali non sostituiscono il parere di un dietista, biologo nutrizionista o medico per necessità individuali.",
    correlati: ["macro-cosa-sono-come-leggerli", "leggere-etichetta-nutrizionale-piatti-pronti"],
  },
  "meal-prep-allenamento-cardio-pesi": {
    risposta: "Se alterni cardio e pesi, il meal prep ti aiuta soprattutto a non lasciare i pasti al caso nei giorni più pieni. Il tipo di allenamento può guidare il calendario, ma quantità e fabbisogni sono personali.",
    scenario: "Segna sul calendario il giorno dei pesi, quello del cardio e il giorno di riposo. Poi guarda gli orari effettivi: un pranzo da portare dopo una sessione mattutina richiede una soluzione diversa da una cena a casa dopo l'allenamento serale. Nel compositore FUEL LAB puoi modificare ogni proposta.",
    passi: ["Inserisci gli allenamenti reali della settimana, senza riempire ogni giorno.", "Scegli quali pasti vuoi avere già decisi dopo l'attività.", "Confronta ingredienti e valori dei piatti con le tue preferenze.", "Se segui un piano nutrizionale, usa le indicazioni del professionista come riferimento."],
    daSapere: "Cardio e pesi non corrispondono automaticamente a due menu prestabiliti. Le proposte online sono organizzative, non terapeutiche.",
    correlati: ["pranzo-dopo-allenamento-pescara", "pasti-con-proteine-menu-settimanale"],
  },
  "conservare-pasti-preparati-frigorifero": {
    risposta: "Per conservare i pasti preparati, segui le istruzioni del piatto, usa contenitori puliti e chiusi e mantieni la catena del freddo quando è richiesta. Il tempo di conservazione non è uguale per ogni ricetta.",
    scenario: "Ricevi un pasto destinato al giorno dopo? Prima di scegliere dove mangiarlo, controlla temperatura indicata, data e modalità di consumo. Se devi portarlo in ufficio o in palestra, valuta il tempo di trasporto e la disponibilità di un frigorifero. Non usare odore e aspetto come unica prova di sicurezza.",
    passi: ["Controlla subito le indicazioni fornite con il pasto.", "Riponi gli alimenti deperibili alla temperatura indicata.", "Tieni separati crudo e pronto al consumo quando prepari a casa.", "Chiedi a FUEL LAB come conservare il piatto specifico prima dell'ordine."],
    daSapere: "Per sicurezza alimentare, attieniti alle istruzioni del produttore e alle indicazioni del Ministero della Salute; non dedurre una scadenza generale da un articolo online.",
    correlati: ["meal-prep-pescara-cosa-significa", "pranzo-lavoro-pescara-organizzarlo"],
  },
  "pranzo-dopo-allenamento-pescara": {
    risposta: "Per il pranzo dopo l'allenamento a Pescara, la cosa più pratica è decidere prima dove e quando mangerai. Puoi scegliere un pasto da casa, un piatto pronto o una soluzione da comporre, secondo orari e preferenze.",
    scenario: "Se termini in palestra poco prima dell'ufficio, il punto critico può essere il trasporto. Se invece torni a casa, puoi organizzare un piatto da completare al momento. Le quantità e la composizione più adatte dipendono dalla persona e dall'eventuale piano alimentare che segue.",
    passi: ["Segna ora di fine allenamento e luogo del pranzo.", "Verifica come conserverai il pasto durante gli spostamenti.", "Confronta gli ingredienti del menu e scegli un piatto che ti piace.", "Scrivi a Matteo per sapere se la consegna è disponibile nel tuo indirizzo."],
    daSapere: "Nessun piatto del sito promette risultati sportivi. Per indicazioni nutrizionali individuali consulta un professionista abilitato.",
    correlati: ["meal-prep-allenamento-cardio-pesi", "pranzo-lavoro-pescara-organizzarlo"],
  },
  "spesa-settimanale-meal-prep-zero-sprechi": {
    risposta: "Una spesa settimanale utile al meal prep parte dai pasti che farai davvero a casa. Conta quelli, controlla cosa hai già e compra ingredienti riutilizzabili in più ricette, senza riempire il frigorifero per abitudine.",
    scenario: "Se hai due cene fuori e tre pranzi già organizzati, la lista non deve coprire quattordici pasti. Puoi scegliere un ingrediente da usare in più preparazioni e lasciare uno spazio per gli avanzi conservati correttamente. Se ordini alcuni piatti FUEL LAB, sottraili dalla lista della spesa domestica.",
    passi: ["Conta pranzi e cene realmente da preparare.", "Controlla scorte e date degli alimenti già presenti.", "Scrivi la lista per ingredienti e quantità utilizzabili.", "Completa il piano con il menu FUEL LAB solo per i giorni in cui ti serve un pasto pronto."],
    daSapere: "'Zero sprechi' è un obiettivo pratico, non una garanzia: acquisto, porzioni e conservazione vanno adattati alla tua settimana.",
    correlati: ["cucina-di-stagione-abruzzo-pescara", "menu-settimanale-pescara-come-pianificarlo"],
  },
  "leggere-etichetta-nutrizionale-piatti-pronti": {
    risposta: "Per leggere l'etichetta nutrizionale di un piatto pronto, controlla prima la porzione. I valori per 100 grammi servono a confrontare prodotti; quelli della confezione intera descrivono ciò che mangerai effettivamente.",
    scenario: "Se una tabella indica 150 kcal per 100 g e la porzione è 300 g, la porzione intera corrisponde a 450 kcal. Questo calcolo non dice da solo se il pasto sia adatto a te: vanno considerati ingredienti, allergeni, quantità e il resto della giornata.",
    passi: ["Individua il peso netto e la porzione effettiva.", "Distingui valori per 100 g e valori per confezione.", "Leggi ingredienti e allergeni prima dei claim pubblicitari.", "Nel menu FUEL LAB usa i dati pubblicati per confrontare i piatti e chiedi chiarimenti se manca un dettaglio."],
    daSapere: "Per allergie e intolleranze serve sempre conferma diretta sugli ingredienti e sulle possibili contaminazioni.",
    correlati: ["macro-cosa-sono-come-leggerli", "cucina-salutare-asporto-pescara"],
  },
  "pasti-con-proteine-menu-settimanale": {
    risposta: "Per variare le fonti proteiche in una settimana, alterna preparazioni e ingredienti invece di ripetere sempre lo stesso piatto. La quantità utile a te va valutata individualmente.",
    scenario: "Nel comporre i pranzi puoi confrontare un piatto con legumi, uno con pesce e uno con altre fonti disponibili nel menu. Guarda anche contorni, gusto e modalità di conservazione. Se un alimento non ti piace o non puoi consumarlo, sostituiscilo; non serve forzare una tabella perfetta.",
    passi: ["Controlla quali fonti sono presenti nei piatti disponibili.", "Alterna gusti e preparazioni nei giorni pianificati.", "Leggi la porzione e i valori pubblicati senza isolarli dal contesto.", "Se hai un obiettivo nutrizionale personale, confronta la scelta con il professionista che ti segue."],
    daSapere: "La dicitura 'proteico' non è sinonimo di adatto a tutti. Ingredienti, porzioni ed esigenze personali contano più di un'etichetta.",
    correlati: ["piatto-equilibrato-ingredienti-varieta", "meal-prep-allenamento-cardio-pesi"],
  },
  "cucina-di-stagione-abruzzo-pescara": {
    risposta: "Per portare ingredienti di stagione nel menu a Pescara, scegli ciò che è effettivamente disponibile quando fai la spesa e usalo in preparazioni diverse. La stagionalità è una fonte di varietà, non una lista obbligatoria.",
    scenario: "Puoi prendere un ortaggio trovato al mercato e immaginare due usi: un contorno per un pranzo a casa e una componente di una cena. Se acquisti anche pasti pronti, verifica il menu aggiornato: ingredienti e disponibilità possono cambiare nel tempo.",
    passi: ["Osserva disponibilità e qualità degli ingredienti nel periodo.", "Scegli due o tre preparazioni realistiche per la settimana.", "Acquista quantità che puoi usare e conservare correttamente.", "Consulta il menu FUEL LAB e chiedi quali piatti sono disponibili nei giorni che ti interessano."],
    daSapere: "Non attribuiamo a un ingrediente proprietà curative o risultati specifici: la varietà alimentare va vista nel quadro delle abitudini complessive.",
    correlati: ["spesa-settimanale-meal-prep-zero-sprechi", "menu-settimanale-pescara-come-pianificarlo"],
  },
  "consegna-pasti-pescara-cosa-chiedere": {
    risposta: "Prima di richiedere una consegna pasti a Pescara, verifica quattro cose: indirizzo coperto, giorno disponibile, piatti ordinabili e istruzioni per ricezione e conservazione. Sono i dettagli che rendono concreto il servizio.",
    scenario: "Scrivere solo 'consegnate a Pescara?' può produrre una risposta generica. Indica via e comune, giorno desiderato, numero di pasti e eventuali domande sugli ingredienti. FUEL LAB segnala lunedì e giovedì come giorni di consegna, ma disponibilità e copertura vanno confermate per il tuo indirizzo.",
    passi: ["Prepara indirizzo e giorni in cui puoi ricevere.", "Scegli i piatti dal menu o componi una settimana indicativa.", "Chiedi conferma su disponibilità, prezzo e modalità pratiche.", "Organizza un luogo adatto alla conservazione dopo la consegna."],
    daSapere: "Il sito non completa ordini né incassa pagamenti online. La richiesta viene confermata direttamente da Matteo.",
    correlati: ["cucina-salutare-asporto-pescara", "pranzo-lavoro-pescara-organizzarlo"],
  },
  "macro-cosa-sono-come-leggerli": {
    risposta: "I macro sono proteine, carboidrati e grassi. Quando li leggi nel menu, verifica se il numero si riferisce a 100 grammi o alla porzione del piatto, poi considera anche ingredienti e quantità effettiva.",
    scenario: "Un piatto può avere più proteine di un altro perché la porzione è più grande, non per una caratteristica speciale della ricetta. Per confrontare due opzioni, usa lo stesso riferimento di peso e osserva anche calorie, ingredienti e preferenze personali.",
    passi: ["Trova il riferimento del dato: 100 g o porzione.", "Confronta valori riferiti alla stessa quantità.", "Leggi l'elenco degli ingredienti e gli allergeni.", "Nel compositore FUEL LAB modifica i piatti proposti in base a gusto e indicazioni del tuo professionista, se ne segui uno."],
    daSapere: "Le tabelle descrivono alimenti e ricette: non stabiliscono fabbisogni individuali né sostituiscono un piano nutrizionale.",
    correlati: ["leggere-etichetta-nutrizionale-piatti-pronti", "piatto-equilibrato-ingredienti-varieta"],
  },
  "menu-settimanale-pescara-come-pianificarlo": {
    risposta: "Un menu settimanale a Pescara funziona se parte dai tuoi impegni reali. Pianifica prima i pasti nei giorni con meno tempo, lascia spazi liberi e rivedi la bozza quando cambiano lavoro o allenamenti.",
    scenario: "Puoi segnare due pranzi in ufficio, una cena dopo palestra e il resto della settimana aperto. Scegli piatti differenti per quei tre momenti e controlla cosa devi acquistare o ricevere. Nel compositore FUEL LAB puoi indicare cardio, pesi e riposo, ma nessuna proposta è obbligatoria.",
    passi: ["Metti sul calendario lavoro, studio, sport e pasti fuori casa.", "Seleziona solo i momenti in cui serve una scelta anticipata.", "Alterna piatti e lascia spazio a eventuali cambi.", "Componi la bozza sul sito e chiedi a Matteo disponibilità e consegna per il tuo comune."],
    daSapere: "Una settimana organizzata non richiede un piano alimentare rigido. Il servizio FUEL LAB aiuta a scegliere pasti; per esigenze cliniche serve un professionista.",
    correlati: ["meal-prep-pescara-cosa-significa", "consegna-pasti-pescara-cosa-chiedere"],
  },
};
