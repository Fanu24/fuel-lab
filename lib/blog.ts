export type SezioneArticolo = {
  titolo: string;
  paragrafi: string[];
  punti?: string[];
};

export type FonteArticolo = { titolo: string; url: string };

export type Articolo = {
  slug: string;
  titolo: string;
  descrizione: string;
  categoria: string;
  introduzione: string;
  sezioni: SezioneArticolo[];
  faq: { domanda: string; risposta: string }[];
  fonti?: FonteArticolo[];
};

export const ARTICOLI: Articolo[] = [
  {
    slug: "meal-prep-pescara-cosa-significa",
    titolo: "Meal prep a Pescara: che cos’è e come può semplificare la settimana",
    descrizione: "Meal prep a Pescara: significato, organizzazione dei pasti e idee pratiche per arrivare a pranzo con meno improvvisazione.",
    categoria: "Meal prep",
    introduzione: "Meal prep significa preparare in anticipo una parte dei pasti della settimana. A Pescara può essere utile a chi alterna lavoro, studio e allenamento e vuole decidere prima cosa mangiare, senza trasformare ogni pausa pranzo in una corsa. Non è una dieta e non richiede di mangiare sempre lo stesso piatto: è un modo per organizzarsi.",
    sezioni: [
      { titolo: "Da dove si comincia", paragrafi: ["La prima scelta non è il contenitore: è capire quali momenti della settimana sono più complicati. Se il problema è il pranzo in ufficio, si può pianificare quello. Se cambiano gli orari di allenamento, conviene lasciare spazio a una cena diversa o a un pasto già pronto da portare con sé.", "Una lista breve aiuta più di un piano rigido. Segna i giorni, i pasti che vuoi organizzare e le preferenze da rispettare. Poi scegli ricette e porzioni in base alle tue abitudini: il meal prep funziona quando rende la routine più semplice, non quando aggiunge regole difficili da seguire."] },
      { titolo: "Un menu con varietà", paragrafi: ["Alternare ingredienti e preparazioni aiuta a non stancarsi. Puoi partire da una base di cereali o patate, scegliere una fonte proteica e aggiungere verdure, condimenti e consistenze diverse. La combinazione dipende dai gusti, dalla stagione e dalle esigenze personali.", "Non serve cucinare sette giorni tutti insieme. Puoi preparare alcune componenti e completare il piatto al momento, oppure scegliere pasti già composti per i giorni in cui sai di avere meno tempo. A Pescara, come altrove, la soluzione migliore è quella compatibile con i tuoi orari e con le modalità di conservazione indicate per gli alimenti."] },
      { titolo: "Meal prep a Pescara con FUEL LAB", paragrafi: ["FUEL LAB propone piatti freschi e un menu pensato per chi vuole organizzare i pasti in modo pratico. Dal menu puoi leggere ingredienti e valori nutrizionali disponibili, poi comporre una settimana in base alle tue preferenze e ai giorni in cui ti alleni.", "Se vuoi capire quali piatti sono disponibili o come funziona il servizio nella tua zona, consulta il menu e inviaci una richiesta. Le informazioni del sito sono generali: per indicazioni cliniche o un piano alimentare individuale fai riferimento a un professionista abilitato."] },
    ],
    faq: [
      { domanda: "Meal prep vuol dire seguire una dieta?", risposta: "No. È un metodo per organizzare i pasti in anticipo; non stabilisce da solo quantità o obiettivi nutrizionali." },
      { domanda: "Devo preparare tutti i pasti della settimana?", risposta: "No. Puoi iniziare da uno o due pranzi e aggiungere altri pasti solo se ti è utile." },
    ],
  },
  {
    slug: "cucina-salutare-asporto-pescara",
    titolo: "Cucina salutare d’asporto a Pescara: cosa guardare quando scegli un pasto",
    descrizione: "Come scegliere cucina salutare d’asporto a Pescara: ingredienti, porzioni, informazioni chiare e praticità per il pranzo di tutti i giorni.",
    categoria: "Cucina a Pescara",
    introduzione: "Cercare cucina salutare d’asporto a Pescara non significa trovare un’unica ricetta perfetta. Significa poter scegliere un pasto che si adatti ai propri gusti, alla giornata e al tempo disponibile. Ingredienti comprensibili, informazioni chiare e una preparazione compatibile con la tua routine sono un buon punto di partenza.",
    sezioni: [
      { titolo: "Ingredienti riconoscibili e informazioni utili", paragrafi: ["Quando valuti un piatto, leggi la descrizione: quali ingredienti contiene, come è preparato e quali allergeni sono indicati? Se hai un’allergia o un’intolleranza, chiedi sempre conferma al locale prima di ordinare e non affidarti a supposizioni basate solo sul nome del piatto.", "Per confrontare prodotti confezionati, la tabella nutrizionale riporta energia e nutrienti per 100 grammi o 100 millilitri. Il CREA spiega come leggere le etichette e chiarisce il significato delle indicazioni nutrizionali. Queste informazioni aiutano a scegliere con consapevolezza, senza ridurre la qualità di un pasto a un singolo numero."] },
      { titolo: "Pensa alla tua giornata, non a una promessa", paragrafi: ["Un pranzo da asporto può essere comodo per una pausa breve, una giornata piena o una sera in cui non vuoi cucinare. Per renderlo più adatto alle tue abitudini, considera orari, appetito, attività e preferenze. Le esigenze cambiano da persona a persona: un menu generico non sostituisce una consulenza nutrizionale individuale.", "Anche il trasporto e la conservazione contano. Se il pasto è deperibile, segui le istruzioni del produttore e le indicazioni di conservazione. Il Ministero della Salute raccomanda di non lasciare i cibi deperibili a temperatura ambiente e di conservarli in frigorifero in contenitori chiusi e separati quando necessario."] },
      { titolo: "Il menu FUEL LAB a Pescara", paragrafi: ["FUEL LAB cucina piatti freschi per chi vuole organizzare pranzo e cena con più semplicità. Nel menu puoi consultare i piatti disponibili e i relativi ingredienti e macro pubblicati, poi usare il compositore per creare una proposta settimanale.", "Vuoi sapere se la consegna è disponibile nel tuo indirizzo o chiedere informazioni sugli ingredienti? Apri la pagina contatti e scrivi i dettagli della tua richiesta. Se hai esigenze mediche o allergie, indica chiaramente la tua situazione e chiedi conferma prima di scegliere."] },
    ],
    faq: [
      { domanda: "Cosa vuol dire cucina salutare d’asporto?", risposta: "È una descrizione ampia: controlla ingredienti e informazioni del singolo piatto e scegli in base alle tue preferenze e necessità." },
      { domanda: "FUEL LAB consegna in tutta Pescara?", risposta: "La disponibilità dipende dalla zona e dal servizio. Contattaci indicando il tuo indirizzo per una conferma." },
    ],
    fonti: [{ titolo: "CREA · Come si leggono le etichette", url: "https://sapermangiare.an.crea.gov.it/518/come-si-leggono-le-etichette.html" }, { titolo: "Ministero della Salute · Sicurezza domestica degli alimenti", url: "https://www.salute.gov.it/new/it/tema/sistema-di-controllo-della-sicurezza-alimentare/sicurezza-domestica-degli-alimenti/" }],
  },
  {
    slug: "pranzo-lavoro-pescara-organizzarlo",
    titolo: "Pranzo al lavoro a Pescara: idee per organizzare la pausa senza improvvisare",
    descrizione: "Idee per organizzare il pranzo al lavoro a Pescara: pianificazione, contenitori, menu vari e pasti da portare in ufficio.",
    categoria: "Pranzo al lavoro",
    introduzione: "La pausa pranzo spesso dura meno del previsto. Organizzare in anticipo cosa mangiare può aiutarti a usare meglio quel tempo, soprattutto se lavori a Pescara tra appuntamenti, spostamenti e orari variabili. Il primo passo è realistico: pianifica i giorni in cui sai già che avrai poco tempo.",
    sezioni: [
      { titolo: "Pianifica in base agli orari", paragrafi: ["Segna i giorni in cui puoi pranzare con calma e quelli in cui ti serve un pasto pratico da portare. In questo modo eviti di preparare troppo e puoi scegliere soluzioni diverse: una porzione già pronta, ingredienti da assemblare o un pasto acquistato vicino al lavoro.", "Se porti il cibo da casa, considera quanto tempo passerà prima di mangiarlo e come potrai conservarlo. Usa contenitori adatti, chiudili bene e segui le indicazioni specifiche per gli alimenti. Se in ufficio non c’è un frigorifero, organizza la giornata in modo compatibile con la conservazione sicura del pasto."] },
      { titolo: "Una pausa varia e concreta", paragrafi: ["Alternare piatti e ingredienti rende più semplice mantenere interesse per il menu. Puoi scegliere verdure diverse, cambiare cereale o contorno e alternare le fonti proteiche secondo gusto e disponibilità. Non è necessario applicare una formula identica a ogni persona o a ogni giorno.", "Per chi si allena dopo il lavoro, l’orario del pranzo e quello della sessione possono influenzare la scelta pratica del pasto. Valuta come ti senti e le tue abitudini; per strategie sportive personalizzate confrontati con un professionista della nutrizione o con il tuo medico."] },
      { titolo: "Pranzi organizzati con FUEL LAB", paragrafi: ["Il menu FUEL LAB è pensato per chi vuole avere un’opzione pronta da inserire nella settimana. Puoi consultare i piatti, scegliere quelli che preferisci e usare il compositore come promemoria del pranzo o della cena.", "Se lavori a Pescara e vuoi verificare disponibilità e consegna nella tua zona, contattaci indicando giorni e indirizzo. Così possiamo risponderti con informazioni pratiche, senza dare per scontato che ogni servizio sia disponibile per ogni zona o orario."] },
    ],
    faq: [
      { domanda: "Come porto il pranzo in ufficio in sicurezza?", risposta: "Segui le indicazioni di conservazione del prodotto, mantieni i cibi deperibili alla temperatura corretta e usa contenitori puliti e chiusi." },
      { domanda: "Posso comporre un menu solo per i pranzi?", risposta: "Sì. Il compositore permette di scegliere un pasto al giorno e di personalizzare la settimana." },
    ],
    fonti: [{ titolo: "Ministero della Salute · Sicurezza domestica degli alimenti", url: "https://www.salute.gov.it/new/it/tema/sistema-di-controllo-della-sicurezza-alimentare/sicurezza-domestica-degli-alimenti/" }],
  },
  {
    slug: "piatto-equilibrato-ingredienti-varieta",
    titolo: "Come comporre un piatto equilibrato: ingredienti, varietà e porzioni",
    descrizione: "Una guida pratica per comporre un piatto vario: verdure, cereali, fonti proteiche e condimenti in base a gusti e abitudini.",
    categoria: "Alimentazione quotidiana",
    introduzione: "Comporre un piatto equilibrato non richiede ingredienti speciali o regole rigide. Puoi partire dalla varietà: alternare alimenti e preparazioni, scegliere porzioni adatte alla tua giornata e dare spazio ai cibi che ti piacciono. Le linee guida ufficiali sono un riferimento generale, non una dieta personalizzata.",
    sezioni: [
      { titolo: "Varietà prima della perfezione", paragrafi: ["Un pasto può includere una fonte di carboidrati, una fonte proteica, verdure e un condimento. Le proporzioni dipendono dall’appetito, dall’età, dall’attività e da eventuali esigenze di salute. Non esiste un piatto universale che vada bene per ogni persona e ogni momento.", "L’Istituto Superiore di Sanità richiama l’importanza di variare gli alimenti e di seguire porzioni e frequenze raccomandate dagli esperti. Se hai una condizione medica o un obiettivo specifico, chiedi un parere professionale invece di escludere intere categorie alimentari di tua iniziativa."] },
      { titolo: "Colore, consistenze e praticità", paragrafi: ["Per rendere il piatto interessante puoi alternare verdure cotte e crude quando adatte, consistenze croccanti e morbide, erbe aromatiche e condimenti. Anche la stagionalità può offrire idee per cambiare menu e ridurre la ripetizione durante la settimana.", "Quando cucini in anticipo, pensa a come il piatto si conserverà e a come potrai completarlo prima di servirlo. Alcuni condimenti o componenti possono essere aggiunti all’ultimo momento per mantenere sapore e consistenza; segui sempre le istruzioni di conservazione degli alimenti."] },
      { titolo: "Dal piatto alla settimana", paragrafi: ["Organizzare più pasti in una volta aiuta a vedere se il menu è vario. Prova a non scegliere sempre la stessa preparazione: alterna ingredienti e controlla se hai considerato le tue preferenze, il tempo che hai e le occasioni in cui mangerai fuori.", "Nel menu FUEL LAB trovi piatti con ingredienti e valori disponibili per ogni ricetta. Puoi usarli come punto di partenza per comporre la tua settimana, senza intendere il compositore come prescrizione sanitaria."] },
    ],
    faq: [
      { domanda: "Esiste una proporzione valida per tutti i piatti?", risposta: "Le quantità dipendono dalle esigenze individuali; le indicazioni generali non sostituiscono una valutazione personalizzata." },
      { domanda: "Devo eliminare carboidrati o grassi per mangiare in modo equilibrato?", risposta: "Non eliminare alimenti o gruppi alimentari di tua iniziativa: chiedi indicazioni a un professionista qualificato." },
    ],
    fonti: [{ titolo: "ISS · Nutrizione e prevenzione", url: "https://www.iss.it/nutrizione" }, { titolo: "ISS · Alimentazione", url: "https://www.cuore.iss.it/prevenzione/alimentazione" }],
  },
  {
    slug: "meal-prep-allenamento-cardio-pesi",
    titolo: "Meal prep e allenamento: come pianificare i pasti nei giorni di cardio e pesi",
    descrizione: "Come organizzare il menu settimanale quando alterni cardio, pesi e riposo, con idee pratiche senza promesse nutrizionali.",
    categoria: "Allenamento e cucina",
    introduzione: "Se la settimana alterna cardio, pesi e giorni di riposo, organizzare i pasti può rendere la routine più leggibile. Il meal prep non determina la prestazione e non sostituisce un piano sportivo: ti aiuta a pianificare cosa mangiare e quando, lasciando spazio alle tue sensazioni e alle indicazioni del professionista che ti segue.",
    sezioni: [
      { titolo: "Segna gli allenamenti prima di scegliere", paragrafi: ["Apri il calendario e annota giorni e orari delle sessioni. Un allenamento al mattino, una pausa pranzo breve e una seduta serale richiedono organizzazioni diverse. Prima di scegliere il piatto, considera anche quanto tempo hai tra il pasto e l’attività e quali alimenti tolleri bene.", "Le esigenze di energia e nutrienti variano con persona, sport, durata e intensità. Per indicazioni su quantità, integrazione o obiettivi di composizione corporea serve una valutazione individuale. Evita di applicare automaticamente consigli pensati per un atleta diverso da te."] },
      { titolo: "Varietà nei giorni della settimana", paragrafi: ["Una settimana pianificata non deve avere una ricetta fissa per ogni tipo di allenamento. Puoi ruotare cereali, verdure e fonti proteiche e scegliere piatti che ti piacciono. Se il menu prevede macro o valori energetici, leggili come informazioni del piatto e non come prescrizione personale.", "Il compositore FUEL LAB usa cardio, pesi e riposo per proporre piatti del catalogo in base alle regole dimostrative del sito. Puoi modificare la proposta, sostituire i piatti e usare i dati della tua scheda come riferimento, se ti è stata fornita da un professionista."] },
      { titolo: "Costruisci una routine sostenibile", paragrafi: ["Il piano più utile è quello che puoi mantenere. Inizia organizzando pochi pasti, osserva quali orari funzionano e cambia il menu quando gli impegni cambiano. Tieni conto anche del recupero, del sonno e dell’idratazione: l’alimentazione non è l’unico elemento della routine sportiva.", "Se vuoi vedere i piatti proposti per l’allenamento, consulta il menu e componi la tua settimana. Per un piano alimentare personalizzato, affidati a un professionista abilitato."] },
    ],
    faq: [
      { domanda: "Devo mangiare un piatto diverso nei giorni di cardio e pesi?", risposta: "Non necessariamente. Le esigenze dipendono dalla persona e dall’attività; il menu del sito offre solo un orientamento generale." },
      { domanda: "I macro del compositore sono un piano nutrizionale?", risposta: "No. Sono dati illustrativi dei piatti e non sostituiscono un piano formulato da un professionista." },
    ],
    fonti: [{ titolo: "ISS · Nutrizione", url: "https://www.iss.it/nutrizione" }],
  },
  {
    slug: "conservare-pasti-preparati-frigorifero",
    titolo: "Come conservare i pasti preparati: frigorifero, contenitori e buon senso",
    descrizione: "Indicazioni generali per conservare pasti preparati in sicurezza: catena del freddo, contenitori e istruzioni in etichetta.",
    categoria: "Meal prep e conservazione",
    introduzione: "Preparare i pasti in anticipo è utile solo se poi li conservi correttamente. Tempi e temperature non sono uguali per tutti gli alimenti: segui sempre le istruzioni riportate in etichetta e le indicazioni del produttore. Questa guida riassume buone pratiche generali, non sostituisce le istruzioni specifiche del singolo prodotto.",
    sezioni: [
      { titolo: "Rispetta il freddo e le istruzioni", paragrafi: ["Il Ministero della Salute raccomanda di non lasciare i cibi deperibili a temperatura ambiente e di riporre in frigorifero alimenti crudi, cotti e pronti al consumo in modo separato e in contenitori chiusi. Mantieni il frigorifero alla temperatura indicata per gli alimenti e controlla le istruzioni specifiche del tuo elettrodomestico.", "Non basarti solo sull’aspetto o sull’odore per decidere se un pasto è ancora sicuro. Verifica la data, le istruzioni di conservazione e il tempo trascorso dall’apertura o dalla preparazione. Se hai dubbi, non consumare il prodotto."] },
      { titolo: "Organizza il frigorifero", paragrafi: ["Usa contenitori puliti e adatti agli alimenti. Chiudili e separa cibi crudi da cibi cotti o pronti al consumo, così riduci il rischio di contaminazione incrociata. Evita di sovraccaricare il frigorifero: la circolazione dell’aria contribuisce a mantenere le condizioni di conservazione.", "Se trasporti un pasto, considera la durata del tragitto e la temperatura esterna. Per i cibi che richiedono refrigerazione, usa una borsa termica o una soluzione adeguata e segui quanto specificato per quel prodotto. In estate, fai particolare attenzione ai tempi fuori dal frigorifero."] },
      { titolo: "Per il meal prep e l’asporto", paragrafi: ["Quando acquisti un pasto pronto, chiedi come conservarlo e quando consumarlo. Se viene consegnato freddo, riponilo in frigorifero appena possibile e segui la confezione. Se viene consegnato caldo, verifica le indicazioni di servizio e non lasciare il cibo deperibile sul tavolo a lungo.", "FUEL LAB prepara piatti per organizzare i pasti della settimana. Per ogni prodotto, le istruzioni specifiche di conservazione fanno fede: se non sono chiare, chiedi direttamente prima di consumare o conservare il pasto."] },
    ],
    faq: [
      { domanda: "Quanto dura un pasto preparato in frigorifero?", risposta: "Dipende dagli ingredienti, dalla preparazione e dalle condizioni di conservazione. Segui etichetta e istruzioni del produttore; non applicare un unico numero a tutti i piatti." },
      { domanda: "Posso lasciare il pranzo fuori dal frigo fino alla pausa?", risposta: "Solo se le condizioni indicate per quel prodotto lo consentono. I cibi deperibili non vanno lasciati a temperatura ambiente." },
    ],
    fonti: [{ titolo: "Ministero della Salute · Sicurezza domestica degli alimenti", url: "https://www.salute.gov.it/new/it/tema/sistema-di-controllo-della-sicurezza-alimentare/sicurezza-domestica-degli-alimenti/" }, { titolo: "Ministero della Salute · Conservare gli alimenti col freddo", url: "https://www.salute.gov.it/new/it/faq/faq-conservare-gli-alimenti-col-freddo/" }],
  },
  {
    slug: "pranzo-dopo-allenamento-pescara",
    titolo: "Pranzo dopo l’allenamento a Pescara: come organizzare il pasto",
    descrizione: "Idee pratiche per organizzare il pranzo dopo l’allenamento a Pescara, tenendo conto di orari, preferenze e routine.",
    categoria: "Allenamento e cucina",
    introduzione: "Finito l’allenamento, può essere comodo sapere già cosa mangerai. Organizzare il pranzo dopo una sessione a Pescara significa soprattutto coordinare orari, spostamenti e appetito. Le necessità cambiano in base alla persona e all’attività: qui trovi suggerimenti pratici per pianificare, non una prescrizione sportiva.",
    sezioni: [
      { titolo: "Parti dall’orario della sessione", paragrafi: ["Annota quando ti alleni e quanto tempo hai dopo. Se devi tornare al lavoro o raggiungere un appuntamento, un pasto già pronto può togliere una decisione dalla giornata. Se invece hai tempo, puoi scegliere un piatto con calma o preparare in casa una combinazione che ti piace.", "Anche fame e tolleranza personale contano. Non c’è un intervallo o un alimento obbligatorio valido per tutti. Per esigenze di performance, recupero o una condizione clinica, chiedi un’indicazione individuale a un professionista qualificato."] },
      { titolo: "Componi un pasto che ti soddisfa", paragrafi: ["Puoi scegliere un piatto con ingredienti vari e una porzione coerente con le tue abitudini. Alterna le preparazioni nel corso della settimana e considera eventuali restrizioni alimentari. Se hai allergie o intolleranze, verifica gli ingredienti e le modalità di preparazione direttamente con chi cucina.", "Se il pranzo viene trasportato, pianifica anche la conservazione. Usa contenitori adeguati e segui le istruzioni del produttore; non lasciare alimenti deperibili a temperatura ambiente più del consentito."] },
      { titolo: "Una settimana più semplice", paragrafi: ["Il menu FUEL LAB raccoglie piatti con ingredienti e valori disponibili e permette di vedere una settimana prima di inviare una richiesta. Puoi scegliere tra pranzo e cena e modificare i piatti in base ai tuoi gusti.", "Consulta il menu, componi il tuo piano e chiedi informazioni se vuoi sapere se il servizio è disponibile vicino alla palestra o al tuo indirizzo a Pescara."] },
    ],
    faq: [
      { domanda: "Cosa mangiare subito dopo una sessione?", risposta: "Dipende da allenamento, orari, preferenze e necessità individuali. Per indicazioni precise chiedi a un professionista." },
      { domanda: "FUEL LAB crea piani per la prestazione sportiva?", risposta: "Il sito propone piatti e strumenti dimostrativi, non una prescrizione individuale. Per un piano sportivo serve una valutazione professionale." },
    ],
    fonti: [{ titolo: "ISS · Nutrizione", url: "https://www.iss.it/nutrizione" }],
  },
  {
    slug: "spesa-settimanale-meal-prep-zero-sprechi",
    titolo: "Meal prep e spesa settimanale: un metodo semplice per ridurre gli sprechi",
    descrizione: "Come pianificare menu e spesa settimanale per il meal prep, usare gli ingredienti acquistati e ridurre gli avanzi dimenticati.",
    categoria: "Organizzazione",
    introduzione: "Una spesa settimanale ben fatta nasce dal menu, non da una lista infinita di ingredienti. Per organizzare il meal prep e ridurre gli sprechi puoi partire dai pasti che farai davvero, controllare cosa hai già in casa e comprare solo ciò che completa il piano.",
    sezioni: [
      { titolo: "Fai una lista breve e flessibile", paragrafi: ["Prima di uscire, guarda dispensa e frigorifero. Poi segna i pranzi e le cene che vuoi organizzare, lasciando qualche spazio libero per imprevisti o pasti fuori casa. Una lista flessibile evita di acquistare porzioni per giorni che probabilmente non seguirai.", "Scegli ingredienti che puoi riutilizzare in più preparazioni, ma cambia condimenti e consistenze per non mangiare sempre la stessa cosa. Se compri verdure fresche, pianifica quando usarle e conserva ciascun alimento secondo le indicazioni riportate in etichetta."] },
      { titolo: "Usa prima quello che hai", paragrafi: ["Metti in vista gli alimenti da consumare prima e costruisci almeno un piatto attorno a loro. Puoi anche porzionare gli ingredienti dopo la spesa, annotare le date e conservare in modo ordinato. Le buone pratiche riducono gli alimenti dimenticati e rendono più semplice trovare ciò che serve.", "Non congelare o ricongelare un prodotto senza verificare che sia consentito e senza seguire indicazioni precise. La sicurezza dipende dall’alimento, dalla lavorazione e dalla catena del freddo: affidati alle istruzioni del produttore e alle indicazioni ufficiali."] },
      { titolo: "Alterna cucina e pasti pronti", paragrafi: ["Il meal prep non richiede che tu cucini ogni pasto. Puoi preparare alcune basi in casa e organizzare gli altri pranzi con un menu già composto. L’obiettivo è evitare la decisione dell’ultimo minuto nei giorni più intensi.", "Nel compositore FUEL LAB puoi segnare i pasti della settimana e usare la lista come promemoria. Consulta le disponibilità prima di pianificare e chiedi conferma sui giorni e sulla zona di consegna."] },
    ],
    faq: [
      { domanda: "Come evito di comprare troppo per il meal prep?", risposta: "Pianifica solo i pasti che prevedi di consumare, controlla le scorte e lascia margine per gli imprevisti." },
      { domanda: "Posso conservare tutti gli avanzi nello stesso modo?", risposta: "No. Le modalità dipendono dall’alimento: segui sempre etichetta e istruzioni di conservazione." },
    ],
    fonti: [{ titolo: "Ministero della Salute · Sicurezza domestica degli alimenti", url: "https://www.salute.gov.it/new/it/tema/sistema-di-controllo-della-sicurezza-alimentare/sicurezza-domestica-degli-alimenti/" }],
  },
  {
    slug: "leggere-etichetta-nutrizionale-piatti-pronti",
    titolo: "Come leggere l’etichetta nutrizionale di un piatto pronto",
    descrizione: "Energia, proteine, carboidrati, zuccheri, grassi e sale: una guida pratica a cosa trovi nell’etichetta dei prodotti alimentari.",
    categoria: "Etichette e ingredienti",
    introduzione: "Quando scegli un pasto pronto, la tabella nutrizionale può aiutarti a capire cosa contiene. Non serve interpretare ogni numero come un voto: è più utile leggere la tabella insieme agli ingredienti, alla porzione e alle tue esigenze. Le indicazioni del CREA offrono una guida per interpretare le informazioni riportate in etichetta.",
    sezioni: [
      { titolo: "Per 100 grammi e per porzione", paragrafi: ["La tabella nutrizionale riporta valori standardizzati per 100 grammi o 100 millilitri, così puoi confrontare prodotti diversi. Quando è presente, la porzione indicata ti aiuta a stimare ciò che mangerai davvero. Controlla però che la porzione descritta corrisponda alla quantità che consumi.", "Troverai energia e valori relativi a grassi, acidi grassi saturi, carboidrati, zuccheri, proteine e sale. Nessun singolo dato descrive da solo la qualità complessiva di un piatto: valuta ingredienti, preparazione, preferenze e contesto del pasto."] },
      { titolo: "Ingredienti, allergeni e diciture", paragrafi: ["Leggi l’elenco ingredienti e controlla gli allergeni evidenziati. Se hai un’allergia o un’intolleranza, chiedi conferma anche sulle contaminazioni crociate e sulle modalità di preparazione. Una descrizione breve sul menu non sostituisce l’informazione completa del produttore.", "Le diciture come “fonte di fibre” o “a basso contenuto di zuccheri” hanno condizioni normative precise. Il CREA spiega cosa significano e quali soglie si applicano: non fermarti all’immagine sulla confezione, ma cerca i dati della tabella."] },
      { titolo: "Usa i numeri con equilibrio", paragrafi: ["Confrontare può essere utile, ma fissarsi su un solo valore può portare a conclusioni incomplete. Per esempio, il contenuto di proteine non dice se il piatto è adatto a ogni persona; energia e macro vanno interpretati nel contesto della giornata e degli obiettivi individuali.", "I valori riportati nel menu FUEL LAB descrivono i piatti secondo le ricette pubblicate. Se hai un piano alimentare, confrontali con le indicazioni del professionista che ti segue."] },
    ],
    faq: [
      { domanda: "I valori per 100 grammi sono quelli dell’intera confezione?", risposta: "No. Sono un riferimento standard. Moltiplicali o confrontali con la quantità effettiva della porzione che consumi." },
      { domanda: "Un piatto ricco di proteine è automaticamente adatto a me?", risposta: "No. Le necessità dipendono dalla persona; per obiettivi individuali chiedi una valutazione professionale." },
    ],
    fonti: [{ titolo: "CREA · Come si leggono le etichette", url: "https://sapermangiare.an.crea.gov.it/518/come-si-leggono-le-etichette.html" }],
  },
  {
    slug: "pasti-con-proteine-menu-settimanale",
    titolo: "Pasti con proteine: come variare le fonti nel menu settimanale",
    descrizione: "Idee per variare le fonti proteiche nel menu settimanale e organizzare i pasti senza affidarsi sempre alla stessa ricetta.",
    categoria: "Menu settimanale",
    introduzione: "Quando organizzi una settimana di pasti, variare le fonti proteiche può rendere il menu più interessante. Carne, pesce, uova, latticini e legumi offrono preparazioni diverse; quali scegliere dipende da preferenze, disponibilità e necessità personali.",
    sezioni: [
      { titolo: "Alterna ingredienti e preparazioni", paragrafi: ["Puoi cambiare non solo l’ingrediente principale, ma anche la tecnica di cottura, il contorno e i condimenti. Una settimana varia aiuta a evitare la ripetizione e ti permette di usare ingredienti che già acquisti per altri piatti.", "Le quantità di proteine necessarie non sono uguali per tutti. Età, attività, condizioni di salute e obiettivi individuali contano; evita di trasformare i valori di una ricetta in una prescrizione personale senza il supporto di un professionista."] },
      { titolo: "Scegli in base a gusto e praticità", paragrafi: ["Se hai poco tempo, puoi pianificare un pasto che si conserva e si trasporta facilmente. Se cucini in anticipo, segui le indicazioni di conservazione, separa gli alimenti e usa contenitori puliti. Per allergie o intolleranze, chiedi dettagli sugli ingredienti e sulla preparazione.", "Anche il costo e la disponibilità stagionale possono orientare la spesa. La varietà non richiede ingredienti particolari: puoi costruire il menu con prodotti comuni e ricette semplici."] },
      { titolo: "Il menu FUEL LAB", paragrafi: ["Nel menu FUEL LAB puoi consultare gli ingredienti e i valori nutrizionali pubblicati per ciascun piatto. Il compositore ti aiuta a disporli nei giorni in cui vuoi organizzare pranzo e cena.", "Se segui una dieta prescritta o hai esigenze specifiche, confronta la scelta con il professionista che ti segue e chiedi conferma sugli ingredienti prima di ordinare."] },
    ],
    faq: [
      { domanda: "Quante proteine dovrei mangiare?", risposta: "Il fabbisogno varia da persona a persona. Per una stima individuale rivolgiti a un professionista qualificato." },
      { domanda: "I legumi possono far parte di un menu vario?", risposta: "Sì, possono essere inclusi secondo gusti e necessità. Se hai esigenze cliniche, chiedi indicazioni personalizzate." },
    ],
    fonti: [{ titolo: "ISS · Nutrizione", url: "https://www.iss.it/nutrizione" }],
  },
  {
    slug: "cucina-di-stagione-abruzzo-pescara",
    titolo: "Cucina di stagione in Abruzzo: idee per variare il menu a Pescara",
    descrizione: "Spunti per seguire la stagionalità in cucina in Abruzzo e a Pescara, alternando verdure, legumi e preparazioni durante l’anno.",
    categoria: "Cucina in Abruzzo",
    introduzione: "La stagione può ispirare il menu senza imporre una lista rigida di alimenti. A Pescara e in Abruzzo la disponibilità cambia durante l’anno: osservare cosa trovi al mercato è un modo semplice per variare ingredienti, sapori e preparazioni.",
    sezioni: [
      { titolo: "Usa il mercato come fonte di idee", paragrafi: ["Quando fai la spesa, nota quali ortaggi sono più presenti e convenienti. Puoi scegliere un ingrediente di stagione e cercare due modi diversi di prepararlo: al forno, in padella, in una zuppa o come contorno. Per un menu settimanale, alterna verdure e condimenti invece di ripetere sempre la stessa ricetta.", "La cucina abruzzese offre molti piatti e ingredienti, ma ogni famiglia e ogni stagione hanno le proprie abitudini. Non serve forzare una ricetta tradizionale in ogni pasto: puoi prendere spunto da sapori locali e adattarli alle tue preferenze."] },
      { titolo: "Meal prep con ingredienti stagionali", paragrafi: ["Scegli ingredienti che puoi utilizzare in più pasti e prepara solo quello che sai di consumare. Se cucini in anticipo, programma quando userai ciascun alimento e segui le indicazioni per la conservazione. Per ridurre gli sprechi, riutilizza gli avanzi solo se sono stati conservati correttamente.", "Cambiare gli ingredienti durante l’anno rende il meal prep meno monotono. Puoi mantenere una struttura semplice del piatto e ruotare contorni, erbe aromatiche e condimenti."] },
      { titolo: "Sapori locali nel menu FUEL LAB", paragrafi: ["Il menu FUEL LAB propone piatti pratici per la settimana e può cambiare in base alle disponibilità. Consulta la selezione aggiornata e chiedi quali piatti sono presenti quando vuoi organizzare i prossimi pasti.", "Se cerchi cucina salutare da asporto a Pescara, contattaci per verificare menu, giorni e zona di consegna. Le disponibilità concrete vanno sempre confermate prima dell’ordine."] },
    ],
    faq: [
      { domanda: "Mangiare di stagione significa seguire una dieta particolare?", risposta: "No. È un modo per scegliere ingredienti disponibili nel periodo; non definisce da solo un piano alimentare." },
      { domanda: "Il menu FUEL LAB è sempre uguale?", risposta: "Consulta il menu online e chiedi conferma delle disponibilità aggiornate." },
    ],
    fonti: [{ titolo: "CREA · Linee guida per una sana alimentazione", url: "https://www.crea.gov.it/web/alimenti-e-nutrizione/-/linee-guida-per-una-sana-alimentazione-2018" }],
  },
  {
    slug: "consegna-pasti-pescara-cosa-chiedere",
    titolo: "Consegna pasti a Pescara: cosa chiedere prima di scegliere un servizio",
    descrizione: "Prima di scegliere un servizio di consegna pasti a Pescara, verifica zona, giorni, menu, ingredienti e indicazioni di conservazione.",
    categoria: "Servizi a Pescara",
    introduzione: "Cercare consegna pasti a Pescara può voler dire cose diverse: un pranzo in ufficio, alcune cene per la settimana o un menu da abbinare ai propri allenamenti. Prima di scegliere, raccogli le informazioni pratiche che incidono davvero sulla tua giornata.",
    sezioni: [
      { titolo: "Verifica zona e calendario", paragrafi: ["Chiedi se la consegna raggiunge il tuo indirizzo e in quali giorni è disponibile. Controlla fasce orarie, eventuali ordini minimi e modalità di pagamento. Non dare per scontata la copertura di ogni quartiere: un servizio locale può avere aree e orari specifici.", "Se lavori in una sede diversa da casa, indica l’indirizzo completo e considera dove riceverai e conserverai il pasto. Se il menu arriva freddo o richiede refrigerazione, organizzati per riporlo correttamente appena lo ricevi."] },
      { titolo: "Controlla menu e informazioni", paragrafi: ["Leggi le descrizioni dei piatti e chiedi chiarimenti su ingredienti e allergeni. Se segui indicazioni mediche o hai allergie, cerca una risposta precisa prima di ordinare. Valori nutrizionali e macro sono informazioni utili, ma non dimostrano che un pasto sia adatto a ogni persona.", "Confronta anche il formato delle porzioni e il modo in cui i pasti vengono confezionati. Chiedi istruzioni di conservazione e consumo; segui sempre l’etichetta o le indicazioni specifiche del prodotto."] },
      { titolo: "Chiedi a FUEL LAB", paragrafi: ["FUEL LAB propone meal prep e piatti freschi a Pescara, con consegne indicate il lunedì e il giovedì. La copertura del tuo indirizzo e la disponibilità dei piatti vanno confermate: scrivi il quartiere o la via e indica quali giorni ti interessano.", "Dal menu puoi scegliere i piatti e usare il compositore per organizzare una settimana. Per conoscere prezzi, giorni e disponibilità attuali, inviaci una richiesta dettagliata."] },
    ],
    faq: [
      { domanda: "FUEL LAB consegna al mio indirizzo a Pescara?", risposta: "La copertura dipende dalla zona. Invia il tuo indirizzo per ricevere conferma prima di organizzare l’ordine." },
      { domanda: "Quali giorni sono indicati per la consegna?", risposta: "Il sito indica lunedì e giovedì; chiedi conferma per disponibilità e calendario aggiornati." },
    ],
  },
  {
    slug: "macro-cosa-sono-come-leggerli",
    titolo: "Macro alimentari: cosa indicano e come leggere i valori dei piatti",
    descrizione: "Proteine, carboidrati e grassi: cosa sono i macro e come interpretarli quando consulti il menu o pianifichi i pasti.",
    categoria: "Etichette e ingredienti",
    introduzione: "La parola “macro” abbrevia macronutrienti: proteine, carboidrati e grassi. Sono valori che puoi trovare nelle tabelle nutrizionali e nei menu, ma vanno interpretati insieme agli ingredienti, alla porzione e alle necessità della persona.",
    sezioni: [
      { titolo: "Cosa trovi nella tabella", paragrafi: ["Le etichette riportano valori standard per 100 grammi o 100 millilitri, tra cui energia, grassi, carboidrati, zuccheri, proteine e sale. La porzione effettiva può essere diversa dal riferimento standardizzato, quindi controlla la quantità che mangerai.", "I macro aiutano a descrivere un alimento, ma non raccontano da soli gusto, varietà, fibre, micronutrienti o adeguatezza rispetto ai tuoi obiettivi. Il CREA offre indicazioni su come leggere le etichette alimentari e interpretare le diciture nutrizionali."] },
      { titolo: "Non sono una prescrizione", paragrafi: ["Due persone possono avere esigenze diverse pur scegliendo lo stesso piatto. Età, attività fisica, condizioni di salute, obiettivi e preferenze influenzano le quantità. Per un piano individuale serve una valutazione professionale.", "Evita di tagliare o aumentare drasticamente un macronutriente sulla base di un singolo post o di una calcolatrice online. Se segui una dieta prescritta, usa i valori dei piatti insieme alle indicazioni del professionista che ti segue."] },
      { titolo: "I macro nel menu FUEL LAB", paragrafi: ["Nel menu trovi i macro pubblicati per i piatti, insieme a calorie e descrizioni. Puoi confrontare le opzioni e scegliere in base alle tue preferenze; il compositore propone una bozza settimanale modificabile.", "Se vuoi capire come inserire i piatti nel tuo piano personale, parlane con il nutrizionista o il dietista che lo ha formulato. FUEL LAB può aiutarti con informazioni sul menu e sulla disponibilità dei piatti."] },
    ],
    faq: [
      { domanda: "I macro indicati online sono personalizzati?", risposta: "No. Descrivono il piatto secondo i valori pubblicati e non sono una prescrizione individuale." },
      { domanda: "Come confronto due piatti?", risposta: "Guarda porzione, ingredienti e tabella completa, poi considera le tue esigenze e preferenze." },
    ],
    fonti: [{ titolo: "CREA · Come si leggono le etichette", url: "https://sapermangiare.an.crea.gov.it/518/come-si-leggono-le-etichette.html" }, { titolo: "ISS · Nutrizione", url: "https://www.iss.it/nutrizione" }],
  },
  {
    slug: "menu-settimanale-pescara-come-pianificarlo",
    titolo: "Menu settimanale a Pescara: come pianificare pranzi e cene senza rigidità",
    descrizione: "Come organizzare un menu settimanale a Pescara: giorni impegnativi, pasti fuori casa, varietà e soluzioni meal prep flessibili.",
    categoria: "Organizzazione",
    introduzione: "Un menu settimanale utile non deve essere una tabella da rispettare a ogni costo. Serve a togliere decisioni nei giorni impegnativi, ricordare cosa hai già scelto e lasciare spazio a cambi di programma. A Pescara, come in ogni città, gli orari di lavoro, studio e allenamento cambiano da una settimana all’altra.",
    sezioni: [
      { titolo: "Parti dai giorni pieni", paragrafi: ["Segna prima appuntamenti, turni e allenamenti. Individua i pranzi in cui avrai poco tempo e le sere in cui preferisci non cucinare. Pianificare solo quei momenti è già un buon inizio e ti evita di organizzare più pasti di quanti ne userai.", "Aggiungi poi i pasti che vuoi preparare a casa e lascia uno o due spazi per uscite, avanzi o cambi di programma. Un calendario flessibile è più facile da adattare di un piano rigido."] },
      { titolo: "Alterna e controlla la spesa", paragrafi: ["Per evitare la monotonia, ruota ingredienti e metodi di cottura. Riutilizza una parte della spesa in piatti diversi e usa prima gli alimenti che rischiano di deteriorarsi. Conserva i cibi seguendo le indicazioni di etichetta e separando crudi e pronti al consumo quando necessario.", "Se hai esigenze nutrizionali specifiche, affidati alle indicazioni del professionista che ti segue. Un menu online può aiutare a scegliere piatti, ma non conosce automaticamente la tua situazione personale."] },
      { titolo: "Usa il compositore FUEL LAB", paragrafi: ["Il compositore mostra pranzo e cena nei giorni della settimana, consente di indicare cardio, pesi o riposo e propone alcuni piatti del menu. Puoi modificare ogni scelta o iniziare da un singolo pranzo.", "Vuoi un menu di meal prep a Pescara? Guarda i piatti disponibili e invia una richiesta per verificare calendario, zona di consegna e informazioni pratiche. La disponibilità viene confermata caso per caso."] },
    ],
    faq: [
      { domanda: "Devo pianificare tutti i pasti della settimana?", risposta: "No. Parti dai momenti più complicati e lascia flessibilità per gli imprevisti." },
      { domanda: "Posso cambiare i piatti proposti dal compositore?", risposta: "Sì. La proposta è modificabile e puoi scegliere i piatti che preferisci." },
    ],
    fonti: [{ titolo: "ISS · Nutrizione", url: "https://www.iss.it/nutrizione" }, { titolo: "Ministero della Salute · Sicurezza domestica degli alimenti", url: "https://www.salute.gov.it/new/it/tema/sistema-di-controllo-della-sicurezza-alimentare/sicurezza-domestica-degli-alimenti/" }],
  },
];

export function articoloPerSlug(slug: string): Articolo | undefined {
  return ARTICOLI.find((articolo) => articolo.slug === slug);
}
