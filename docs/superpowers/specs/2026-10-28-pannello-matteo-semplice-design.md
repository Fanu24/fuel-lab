# Pannello di Matteo semplicissimo, come app sul telefono

Data: 28/10/2026 · Stato: in attesa di approvazione · Branch di lavoro: `restyling`

## Perché

Matteo (FUEL LAB, meal prep a Pescara) non è pratico di informatica. Con il pannello di oggi (`fuelchef.it/admin`) si è bloccato tre volte:

- ha confermato un ordine arrivato dal sito e poi non l'ha più trovato. La schermata "Oggi" mostra solo gli ordini del giorno di cucina selezionato, quindi un ordine confermato per un altro giorno sparisce e resta solo nella scheda "Ordini", sotto un filtro;
- non ha capito come aggiungere gli ordini dei clienti che segna a mano su un foglio di carta;
- non ha capito come aggiungere un cliente che non è registrato sul sito. In realtà il modulo lo permette già, ma è nascosto in una quindicina di campi.

Il pannello nuovo deve essere il suo foglio di carta dentro il telefono, con le etichette che escono da sole da quello che c'è scritto. Deve anche avvisarlo con una notifica quando arriva un ordine dal sito, come la PWA del bot di Lilith che l'utente usa già sul suo iPhone.

## Come lavora Matteo

- Sa già cosa deve cucinare ogni giorno, perché molti clienti li segna su un foglio: "mercoledì Paolo ha questo, giovedì sera Paolo ha quest'altro" e così via.
- Molti piatti sono personalizzati per il singolo cliente e non sono nel menu del sito.
- Si fa pagare soprattutto in contanti. Il pannello **non** deve chiedere né mostrare come arrivano i soldi.
- Quando arriva un ordine dal sito lo guarda e, se ha dubbi, scrive al cliente su WhatsApp. Per questo gli servono nome e telefono in vista.
- Stampa le etichette da attaccare alle vaschette, su fogli A4 da 21 etichette (70 × 42,3 mm).

## Obiettivi

1. Matteo, da solo e dal telefono, riesce a:
   - ricopiare il foglio della settimana: per ogni cliente, cosa mangia in ogni giorno, a pranzo e a cena;
   - vedere un ordine nuovo dal sito, chiamare o scrivere su WhatsApp al cliente con un tocco, accettarlo e ritrovarlo nella settimana;
   - stampare le etichette di un giorno;
   - creare un codice sconto (percentuale + codice);
   - vedere quanto ha guadagnato nel mese.
2. Una notifica sul telefono per ogni ordine nuovo dal sito.
3. Dentro l'app, una guida passo per passo per aggiungere l'icona alla schermata Home e attivare le notifiche.
4. Etichette belle, con il logo e i font del sito.
5. Due correzioni al sito pubblico: via la settimana di prova, e "Ritiro o consegna, con giorno e orario concordati" al posto di "ogni 3 giorni".

## Non obiettivi

- Pagamenti online, metodi di pagamento, "contanti / bonifico".
- Gli stati di avanzamento ("in preparazione", "pronto", "consegnato") nel pannello.
- Ritoccare il vecchio pannello `/dashboard` (circa 9.000 righe in `components/dashboard/`): resta com'è, cioè un rimando a `/admin`.
- Un'app da store (iOS/Android): è una PWA del sito.
- La colazione nel pannello. Gli abbonamenti Full 6 e Full 7 sul sito includono la colazione, ma nel pannello ci sono solo pranzo e cena: la colazione Matteo la gestisce a modo suo (decisione dell'utente: "lascia perdere"). Il sito pubblico, su questo punto, non cambia.

## Anti-obiettivi: casi in cui avremmo fallito anche se tutto funziona

- Un ordine "sparisce" dopo che Matteo ci ha fatto qualcosa.
- Matteo deve capire la differenza fra giorno di cucina e giorno di consegna, oppure usare filtri e stati.
- Per scrivere a un cliente nuovo servono più di due tocchi dall'apertura dell'app.
- Per aggiungere un pasto deve compilare un modulo lungo invece di toccare una casella.
- Le etichette sembrano un modulo generico.
- Si perdono ordini esistenti, o l'area cliente del sito smette di funzionare.

## Punto di partenza

- Il pannello online è `/admin` (`app/admin/page.tsx`, `components/admin/SimpleAdmin.tsx`, `AdminAccess.tsx`, `Sconti.tsx`, `admin-model.ts`, `app/styles/admin.css`). Ci si entra con una password: sessioni nelle tabelle `admin_access_*` della migrazione `0007`, logica in `functions/_lib/admin-access.ts`. Ha quattro schede: Oggi, Ordini, Sconti, Menu.
- **Questo codice, insieme a migrazioni 0007–0009, API degli sconti e altri file, è online ma non è in git** (file non tracciati sul branch `restyling`). Il primo passo del lavoro è un commit di checkpoint di quello che c'è.
- Stack: Next.js 16.3.3 in `output: "export"` (sito statico), API in Cloudflare Pages Functions (`functions/`), database D1 `fuelchef` (`wrangler.jsonc`, `nodejs_compat` attivo). Prima di scrivere codice Next leggere `node_modules/next/dist/docs/` (vedi `AGENTS.md`).
- Gli ordini stanno nella tabella `orders`:
  - `user_id NOT NULL`;
  - il piano `plan_json` è indicizzato per giorno della settimana (`lun`…`dom` × `pranzo`/`cena`), **senza date vere**;
  - ci sono anche `production_date`, `fulfillment_date`, `requested_date`, `price_cents`, `paid`, i campi `sub_*` dell'abbonamento (tra cui `sub_trial`), lo sconto e `source` (`web` | `manual`).
- Esiste già il manifest `public/pannello.webmanifest` (`start_url` e `scope` = `/admin`, `display: standalone`). Non esiste un service worker e non esiste niente per le notifiche push.
- Quando arriva una richiesta dal sito, Matteo riceve un'email (`emailNuovaRichiesta` in `lib/server/email.ts`). Questa resta.
- I codici sconto esistono già (`components/admin/Sconti.tsx`, `functions/api/admin/discounts.ts`): percentuale, codice facoltativo o generato, attiva/disattiva.

## Il pannello nuovo

Sostituisce l'interfaccia di `/admin` (stessa pagina, stesso accesso con password, stesso manifest). Lo stile segue quello di oggi: fondo crema `#f3efe6`, verde scuro `#18352a`, riquadri bianchi. Il testo è più grande del sito, i bottoni sono grandi e c'è una sola azione principale per schermata.

I mockup approvati sono in `.superpowers/brainstorm/109018-1793209060/content/` (cartella ignorata da git, solo locale): `schermata-a-dettagli.html`, `etichetta-a-e-altro.html`, `aggiungi-cliente.html` (opzione B) e `piatto-libero.html`.

### 1. Schermata principale ("un giorno alla volta")

- In alto "Ciao Matteo".
- Se ci sono ordini nuovi dal sito, compare un riquadro **rosso** in cima: "N ordini nuovi dal sito → Apri". Se non ce ne sono, il riquadro non c'è.
- Striscia dei giorni della settimana (lun–dom, con il numero del giorno), con un modo semplice di passare alla settimana prima e a quella dopo. **All'apertura è sempre selezionato oggi.**
- Sotto, per il giorno selezionato: **PRANZO** e **CENA**. Ogni riga riporta il nome del cliente in grassetto e il piatto sotto. Toccando una riga si apre la settimana di quel cliente (punto 3).
- In fondo, sempre visibili, due bottoni grandi:
  - **+ Aggiungi**;
  - **Stampa etichette di [giorno]**, che stampa tutte le etichette del giorno selezionato, pranzo e cena.
- Un bottoncino discreto **Altro**.

### 2. Ordini nuovi dal sito

- Elenco degli ordini in attesa (stato `requested`). Ogni ordine mostra:
  - nome;
  - telefono, ben visibile;
  - cosa ha chiesto (tipo di servizio, numero di pasti, ritiro o consegna e indirizzo, da quando);
  - i piatti;
  - le note e le allergie del cliente.
- Bottoni **WhatsApp** (link `wa.me` al numero del cliente) e **Chiama** (`tel:`).
- Bottoni **Accetta** e **Rifiuta**.
- **Accetta** porta l'ordine nella settimana, così Matteo lo ritrova lì e non deve cercarlo:
  - *Menu della settimana* e *Sui tuoi macro*: i piatti scelti dal cliente vanno nei giorni e nei pasti del suo piano, a partire dalla data richiesta. Se la data manca, nel momento in cui accetta Matteo sceglie da che giorno parte.
  - *Abbonamento*: il cliente entra nella rubrica di Matteo ("I miei clienti") e Matteo riempie la sua settimana come per un cliente del foglio (punto 3), usando "Copia la settimana scorsa" per le settimane successive. Non c'è più il calcolo automatico "una consegna ogni 3 giorni".
  - *Home cooking* (cuoco a domicilio): compare come una riga nel giorno concordato, senza etichetta (vedi decisioni).
- Insieme ad "Accetta" c'è un campo **facoltativo** "Quanto paga a pasto". È già compilato quando il sito ha un prezzo da cui ricavarlo, per esempio quello dell'abbonamento; altrimenti è vuoto e si può lasciare vuoto. Il valore va sul cliente nella rubrica.
- **Rifiuta** chiede una conferma ("Sei sicuro?") e annulla l'ordine.
- L'ordine accettato o rifiutato esce dall'elenco degli ordini nuovi.

### 3. "+ Aggiungi" e la modifica: la settimana del cliente

- "+ Aggiungi" apre **Per chi?**: un campo di ricerca, l'elenco dei clienti di Matteo (prima i più recenti) e **+ Cliente nuovo**.
- Il cliente nuovo si crea con il **nome** (l'unico campo obbligatorio), il telefono (facoltativo, ma consigliato per WhatsApp), l'indirizzo (facoltativo) e **quanto paga a pasto** in euro (**facoltativo**). Sono dati che scrive una volta sola.
- Scelto il cliente, si apre **la sua settimana**: una griglia di 7 giorni × pranzo/cena. In cima ci sono nome, telefono e prezzo a pasto.
  - Le caselle vuote mostrano un "+".
  - Toccando una casella vuota si apre un pannello dal basso con, in quest'ordine:
    1. un **campo di testo per scrivere il piatto a mano**, con il bottone OK;
    2. i piatti **già scritti per quel cliente**, da riusare con un tocco;
    3. i piatti **del menu del sito**.
  - Toccando una casella piena si può cambiare il piatto o toglierlo.
  - Bottone **Copia la settimana scorsa**: copia i pasti della settimana precedente di quel cliente nelle caselle vuote di questa settimana, senza sovrascrivere quelle già piene.
  - Bottone **Fatto**.
- La settimana mostrata è quella del giorno selezionato nella schermata principale, con il passaggio alla settimana prima e a quella dopo.
- È la stessa schermata sia per aggiungere sia per modificare. Ci si arriva anche toccando una riga nella schermata principale.
- Il piatto scritto a mano finisce sull'etichetta così com'è.

### 4. Etichette (versione "A" corretta)

Foglio A4 da 21 etichette da 70 × 42,3 mm, come oggi.

**Matteo probabilmente stamperà dal telefono.** La stampa deve quindi funzionare dall'app installata, su iPhone e su Android, verso la sua stampante, e le etichette devono cadere dentro le caselle del foglio. La stampa del browser da telefono spesso non rispetta margini e scala, quindi il costruttore valuti di generare un PDF in misura esatta e di aggiungere una pagina di prova per allineare il foglio. **Il lavoro sulle etichette non è finito finché non si è provato con Matteo, sul suo telefono e sulla sua stampante.** La prova la organizza l'utente.

Ogni etichetta contiene:

- in alto a sinistra il **logo FUEL LAB, grande** (`public/logo-fuellab.png`, circa 30 px nel mockup in scala 5 px/mm);
- in alto a destra il giorno e il pasto in Oxanium maiuscolo spaziato ("MERCOLEDÌ 28 / PRANZO");
- il **nome del cliente** grande, in Oxanium 800 maiuscolo;
- il **piatto** in Archivo semibold;
- in fondo, sotto una riga sottile, "Preparato il **28/10/2026**" (data in Martian Mono).

**Niente allergeni e niente "consumare entro"**: è una scelta esplicita dell'utente. Gli abbiamo fatto presente che per i pasti consegnati il regolamento UE 1169/2011 chiede di comunicare gli allergeni al cliente. La decisione è stata lasciata a lui e a Matteo.

I font sono quelli del sito, già caricati da `app/layout.tsx` (Oxanium, Archivo, Martian Mono). Le etichette devono restare leggibili anche su una stampante in bianco e nero. Sparisce l'impostazione "caselle già usate sul foglio": si parte sempre da un foglio nuovo.

### 5. Altro

Una schermata con:

- **Guadagni**: il totale del mese in corso, grande, con il numero di pasti e di clienti, e sotto il totale del mese prima. Nessuna informazione su come è stato pagato.
  - **Regola decisa con l'utente:** ogni cliente ha un prezzo a pasto **facoltativo**. Il totale del mese è la somma dei pasti del mese per il loro prezzo.
  - I pasti di clienti senza prezzo non si contano, e non viene chiesto niente.
  - Il prezzo va salvato sul singolo pasto quando viene messo nella settimana, così se Matteo cambia il prezzo di un cliente non cambiano i mesi passati.
  - Vale anche per gli abbonamenti, mese dopo mese, mentre Matteo continua con "Copia la settimana scorsa".
- **Codici sconto**: l'elenco (codice e percentuale), **+ Nuovo codice**, attiva/disattiva. È il componente `Sconti` di oggi, ripulito per questa grafica.
- **I miei clienti**: la rubrica. Toccando un cliente si modificano nome, telefono, indirizzo e prezzo a pasto, e si apre la sua settimana.
- **Piatti sul sito**: togli o rimetti un piatto dal menu pubblico (è la scheda "Menu" di oggi).
- **Installa l'app e le notifiche**: riapre la guida del punto 7.
- **Esci**.

### 6. Notifiche

- Una notifica push per ogni nuovo ordine arrivato dal sito, per esempio "Nuovo ordine: Francesca Rossi, 6 pasti". Toccandola si apre l'app sugli ordini nuovi.
- Le notifiche sono Web Push standard (VAPID) con un service worker nell'area `/admin`. Le iscrizioni dei dispositivi sono salvate in D1 e l'invio parte dalla Pages Function che crea l'ordine. Le chiavi VAPID stanno nei secret di Cloudflare.
- Devono funzionare su iPhone (PWA aggiunta alla Home, iOS 16.4 o successivo) e su Android.
- L'email a Matteo resta com'è.

### 7. Guida "aggiungi alla Home e attiva le notifiche"

- Compare alla prima apertura, e finché l'app non è installata o le notifiche non sono attive. Si può sempre riaprire da Altro.
- Riconosce il dispositivo e mostra solo i passi giusti, pochi e con disegni semplici:
  - **iPhone (Safari):** tocca Condividi → "Aggiungi alla schermata Home" → apri FUEL LAB dall'icona → tocca "Attiva notifiche" → "Consenti".
  - **Android (Chrome):** menu ⋮ → "Installa app" o "Aggiungi a schermata Home" → apri dall'icona → "Attiva notifiche" → "Consenti".
  - **Computer:** dice che le notifiche vanno attivate sul telefono.
- Il bottone "Attiva notifiche" chiede il permesso e registra il dispositivo. Una volta attivo, la guida mostra "Notifiche attive ✓" e sparisce dalla schermata principale.

### 8. Cosa sparisce dal pannello

- Le schede Ordini, Sconti e Menu (Sconti e Menu finiscono in Altro).
- Prezzo e "già pagato" sui singoli ordini.
- Gli stati "in preparazione", "pronto" e "consegnato".
- Il giorno di cucina separato dal giorno di consegna.
- Le stampe della produzione, dei ritiri e consegne e del singolo ordine: resta solo "Stampa etichette".
- Le impostazioni del foglio di etichette.

## Correzioni al sito pubblico

### Via la settimana di prova

Nel sito e nell'area cliente non si propone e non si sceglie più la "settimana di prova" (nemmeno "la prima settimana è di prova, senza impegno"). Per esempio, nella scheda dell'abbonamento la frase diventa solo "Prezzo da confermare con Matteo." Il riferimento compare in molti file, tra cui:

- `components/abbonamento/ScontiEProva.tsx`, `RiquadroPrezzi.tsx`, `ChiusuraAbbonamento.tsx`, `Simulatore.tsx`;
- `components/home/Abbonamento.tsx`, `app/(sito)/abbonamento/**`;
- `components/account/sezioni/NuovaRichiesta.tsx`, `Panoramica.tsx`, `Richieste.tsx`, `components/account/Vantaggi.tsx`;
- `lib/abbonamento.ts`, `lib/whatsapp.ts`, `lib/server/email.ts`, `lib/server/ordini.ts`, `lib/api.ts`, `lib/account.ts`;
- `components/seo/pagine.ts`, `public/llms.txt`, `lib/blog.ts`, `lib/servizi.ts`, `components/contatto/DoveSiamo.tsx`;
- i test relativi.

Per avere l'elenco completo: `grep -ri "prova"`, filtrando i falsi positivi tipo "riprova". La colonna `sub_trial` resta nel database (nessuna migrazione distruttiva). Il server non accetta più nuove richieste con la prova, e quelle vecchie si leggono ancora.

### "Ritiro o consegna, con giorno e orario concordati"

L'utente ci tiene in modo particolare. Il sito e l'area cliente non devono promettere **nessuna cadenza fissa** di consegna, ritiro o cucina per il servizio FUEL LAB: né "ogni 3 giorni", né "i pasti dei tre giorni successivi", né "due volte a settimana" o simili. Al loro posto va **"Ritiro o consegna, con giorno e orario concordati."** (o una frase equivalente adattata al contesto). I punti noti:

- `app/(sito)/come-funziona/page.tsx` (passo 3);
- la FAQ in `app/(sito)/consegna-pasti-pescara/page.tsx` (`CONSEGNA_OGNI_GIORNI`);
- `components/abbonamento/righe.ts` (`esempioConsegna` e la riga "come sul volantino");
- `lib/abbonamento.ts` (`CONSEGNA_OGNI_GIORNI`, i giorni di consegna del periodo);
- `lib/account.ts` (`frequenzaConsegne`, la prossima consegna);
- `NuovaRichiesta.tsx`;
- il calcolo della "prossima consegna" ogni 3 giorni in `Panoramica.tsx` e `Richieste.tsx`, che diventa "giorno e orario da concordare con Matteo";
- `public/llms.txt` (righe sugli abbonamenti);
- `lib/blog-locali.ts`, dove dice che "il sito indica consegna o ritiro ogni tre giorni";
- i test relativi (`lib/abbonamento.test.ts`, `lib/account.test.ts`).

Per avere l'elenco completo: `grep -riE "ogni (3|tre) giorni|giorni successivi|volte a settimana"` e poi una lettura a mano.

## Vincoli

- **Niente deploy e niente migrazioni `--remote` senza una richiesta esplicita dell'utente.** Per pubblicare:
  1. backup con `wrangler d1 export fuelchef --remote`;
  2. le migrazioni **prima** del codice;
  3. `npm run deploy:cloudflare`.
- Il codice di `/admin` oggi non tracciato va committato prima di cambiarlo.
- Gli ordini esistenti in produzione e l'area cliente (`/account`) devono continuare a funzionare.
- Testi in italiano con gli accenti giusti. Nel pannello: testo base di almeno 17 px, aree da toccare di almeno 48 px.
- Restano sito statico + Pages Functions + D1: niente server Next.

## Decisioni prese da me (da controllare)

- **Prezzo precompilato all'Accetta:** se l'ordine del sito ha un prezzo, è quel prezzo diviso per i suoi pasti. Per un abbonamento si ricava dal prezzo mensile e dai pasti a settimana della formula. Se il conto non si può fare, il campo resta vuoto.
- **Testi del blog:** i consigli generici a chi cucina da sé ("cucina due volte a settimana", dalle linee guida CREA) restano. Cambiano solo le frasi che descrivono il servizio FUEL LAB.
- **"Preparato il"** è la data in cui si stampano le etichette, non il giorno del pasto.
- **Home cooking:** una riga nel giorno concordato, senza etichetta.
- **Accetta / Rifiuta** mandano al cliente registrato l'email di aggiornamento che esiste già (`emailAggiornamentoCliente`): confermato o annullato.
- Un ordine accettato resta "Confermato" anche per il cliente. Non c'è più il passaggio a "Pronto" o "Consegnato".
- **Cosa vede il cliente:** le modifiche che Matteo fa nella settimana di un cliente del sito non cambiano quello che il cliente vede nella sua area. Il cliente continua a vedere l'ordine come l'ha mandato.
- **Ordini già in produzione.** Una conversione fatta una volta sola trasforma gli ordini aperti (confermato, in preparazione, pronto) con date da oggi in poi in pasti datati nella settimana. Usa `production_date`/`fulfillment_date` per collocare i giorni del piano. I loro clienti, anche quelli manuali salvati sotto l'utente di Matteo, entrano nella rubrica. Gli abbonamenti vecchi senza piatti entrano nella rubrica con la settimana vuota. Non si cancella niente. Prima di migrare si contano gli ordini in produzione in sola lettura, con il permesso dell'utente.
- **Porzioni.** Una casella può avere più porzioni dello stesso piatto (×2, ×3), per le coppie e le famiglie o per chi ne prende due. Si stampa un'etichetta per porzione, con lo stesso nome. Le aggiunte ("extra") degli ordini del sito si accodano al testo del piatto.
- **Accesso.** Sul telefono la sessione dura 90 giorni, così toccando una notifica non si finisce sulla password. Si esce da Altro → Esci.
- La striscia dei giorni va da lunedì a domenica.
- Il vecchio `/dashboard` resta un rimando a `/admin`. I suoi componenti non si cancellano in questo lavoro.

## Lasciato al costruttore

- Il modello dei dati. Suggerimento: tabelle nuove per la rubrica dei clienti di Matteo e per i pasti, una riga per pasto con data vera, pranzo/cena, cliente, testo del piatto, id del piatto del sito se c'è, prezzo e ordine di provenienza. Meglio che piegare `orders`, che ha `user_id NOT NULL` e un piano indicizzato per giorno della settimana.
- Come si collegano gli ordini del sito accettati ai pasti della settimana.
- L'implementazione di Web Push su Pages Functions: cifratura del payload e firma VAPID con WebCrypto o con `nodejs_compat`.
- Il riconoscimento del dispositivo nella guida e la gestione dei permessi negati.
- La struttura dei componenti, l'aggiornamento automatico dei dati (oggi ogni 60 secondi) e i test.
