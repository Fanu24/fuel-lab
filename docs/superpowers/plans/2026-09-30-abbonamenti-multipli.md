# Abbonamenti multipli (5 formule, Standard/Plus, sconti, settimana di prova)

Piano del 30/09/2026. Stato: in esecuzione sul branch `restyling`, solo commit locali.

## 1. Cosa dicono i documenti del cliente

Fonte: cartella `DIRETTIVE CLIENTE` (volantino fronte/retro, cinque schede A4, dieci grafiche social, tutte con gli stessi dati; `LAB.pdf` e la foto WhatsApp sono del 9 settembre e riguardano il menu, già trattato).

Cinque abbonamenti, ognuno in fascia **Standard** o **Plus**:

| Formula | Cosa copre | Pasti/sett. | Standard | Plus |
|---|---|---|---|---|
| Pranzo | il pranzo, dal lunedì al venerdì | 5 | 173 € | 225 € |
| Leggero | pranzo e cena, cinque giorni su sette (settimana lavorativa) | 10 | 347 € | 451 € |
| **Completo** (consigliato) | pranzo e cena, tutti i giorni | 15 | 520 € | 676 € |
| Full 6 | colazione, pranzo e cena, sei giorni su sette | 18 | 624 € | 811 € |
| Full 7 | tre pasti al giorno, tutti i giorni | 21 | 728 € | 946 € |

- Prezzi al mese. Standard "circa 8 € a pasto" (verificato: 8 € × pasti/sett. × 13/3, arrotondato). Plus = Standard + 30% (verificato su tutte e cinque), "porzioni e proteine maggiorate per chi si allena".
- Sconti: ritiro in laboratorio −10%, in coppia −8%, in famiglia −10%.
- Consegna **ogni 3 giorni**, a casa o al ritiro. Pescara e dintorni, fino a 20 km.
- La prima settimana è di prova, senza impegno ("Prenota la tua settimana di prova").
- Il cliente porta il piano scritto dal suo nutrizionista; per ogni dieta (mediterranea, iperproteica, chetogenica, low-carb, vegana) FUEL LAB cucina ai grammi.
- "Le box del giorno 7–9 €": ogni giorno si cucina qualcosa in più, l'avanzo diventa una box pronta a prezzo piccolo, anche senza abbonarsi.

Da NON pubblicare: i volantini hanno segnaposto (`3XX XXX XX XX`, `0XX XXX XXXX`), dominio `fuellab.it`, Instagram `@fuellab` e la grafia "FuelLab"; il sito è `fuelchef.it`, "FUEL LAB". I PDF/JPG non vanno online e non vanno copiati in `public/` (la cartella è già in `.gitignore`).

## 2. Cosa cambia rispetto a oggi

Oggi esiste **un solo** abbonamento (239 €/mese, pranzi lun–ven) sparso in circa 60 file. La formula "Pranzo" lo sostituisce (173 €). Il vecchio 239 € non esiste più da nessuna parte.

Conflitti fra il sito e i nuovi documenti, risolti così:

- "Matteo cucina ogni giorno e consegna ogni giorno" resta vero per il menu; **per gli abbonamenti la consegna è ogni 3 giorni** (testi dell'abbonamento e logica del pannello).
- La regola del vecchio file ("niente sconti") cade: gli sconti ora sono decisione del committente. Restano vietati durate minime, disdette, pagamenti online: non li ha detti.

## 3. Decisioni e ipotesi (da confermare con il cliente, tutte isolate in `lib/abbonamento.ts`)

1. **Sconti non cumulabili in automatico**: la stima applica il più alto fra quelli che spettano; il prezzo finale lo conferma Matteo. Il volantino non dice se si sommano; sottopromettere è la scelta sicura. Cambiare regola = una funzione (`scontoApplicato`).
2. Sconto coppia/famiglia: si indica nella richiesta ("ci abboniamo insieme"); lo sconto vale per ogni abbonamento del gruppo, Matteo lo conferma.
3. Prezzo con sconto arrotondato all'euro intero (come i listini).
4. **Full 6**: il giorno libero è la domenica (il volantino dice solo "sei giorni su sette"); il pannello lo assume, i testi pubblici dicono "il giorno libero si concorda con Matteo". **Leggero**: lunedì–venerdì ("la settimana lavorativa mangi come si deve, il weekend lo gestisci tu").
5. **Settimana di prova**: è un'opzione della richiesta (`trial`), salvata e mostrata a Matteo. Il sito non inventa il suo prezzo né la sua durata contrattuale: le condizioni concrete le concorda Matteo.
6. **Cucina e consegne nel pannello**: un abbonamento ha una consegna/ritiro ogni 3 giorni dalla data d'inizio; quel giorno Matteo cucina e consegna i pasti dei tre giorni coperti (oggi, domani, dopodomani, nei soli giorni e pasti della formula e dentro il periodo). Il pranzo/cena/colazione non "compaiono" più ogni giorno in cucina, compaiono nel giorno di consegna.
7. Vecchi ordini (`service='abbonamento'` senza formula): la migrazione li porta a Pranzo/Standard/singolo, il prezzo salvato resta quello che era.
8. Box del giorno: prezzo "7–9 €" e testo del volantino, presentate come extra senza abbonamento. Niente disponibilità in tempo reale (non richiesto): `Impostazioni` potrà ospitarla in seguito senza migrazioni.

## 4. Architettura

### 4.1 Nucleo (`lib/abbonamento.ts`, un file, tutto puro e testato)

- Tipi: `FormulaId = "pranzo"|"leggero"|"completo"|"full6"|"full7"`, `Fascia = "standard"|"plus"`, `Nucleo = "singolo"|"coppia"|"famiglia"`, `PastoAbb = "colazione"|"pranzo"|"cena"`.
- `FORMULE`: elenco con id, nome, slogan, descrizione, `pasti` (per giorno), `giorni` (0=dom…6=sab), `pastiSettimana`, `prezzi{standard,plus}`, `consigliato`.
- `SCONTI` e `scontoApplicato({ritiro, nucleo})`; `calcolaPrezzo({formula, fascia, ritiro, nucleo})` → `{ listinoCentesimi, scontoPercento, totaleCentesimi }`; `prezzoAPasto(formula)`.
- Calendario: `periodoAbbonamento`, `fineAbbonamento` (invariati), `pastiDelGiorno(formula, data)`, `consegneAbbonamento(inizio)` (inizio, +3, +6… nel periodo), `bloccoDiConsegna(inizio, consegna)`, `pastiDelBlocco(formula, inizio, consegna)`, `pastiNelPeriodo`, `prossimaConsegna(inizio, oggi)`.
- Link: `linkRichiediAbbonamento({formula?, fascia?})`, `LINK_SCRIVI_ABBONAMENTO`.
- Sparisce `PREZZO_ABBONAMENTO`; chi mostrava "239 €" mostra la formula scelta o "da 173 €".

### 4.2 Dati

Migrazione `0006_abbonamenti.sql`: `orders.sub_plan`, `sub_tier`, `sub_household` (TEXT, CHECK con i valori ammessi, NULL per gli altri servizi), `sub_trial INTEGER NOT NULL DEFAULT 0`; backfill dei vecchi abbonamenti. Nessun cambio a `order_events` (i prezzi usano già `price`).

`lib/api.ts`: `Ordine.subscription?: { plan, tier, household, trial } | null`; `NuovoOrdine.subscription` e `NuovoOrdineManuale.subscription`.

`lib/server/ordini.ts`: valida la formula (obbligatoria per l'abbonamento, ignorata per gli altri servizi), calcola `priceCents` con `calcolaPrezzo` usando `fulfillment`; il piano allegato si pota ai pasti della formula (`soloPastiDellaFormula`). `ordineDaRiga` legge le nuove colonne (tolleranti se mancano). `functions/api/orders.ts` e `functions/api/admin/orders.ts` li scrivono; le email mostrano formula, fascia, nucleo, prova.

### 4.3 Sito pubblico

- `/abbonamento`: "Cinque tagli, uno è il tuo." Formule in tabella/carte con interruttore Standard/Plus, simulatore di prezzo (formula, fascia, ritiro/consegna, singolo/coppia/famiglia), come funziona in tre passi, per ogni dieta, Standard vs Plus, sconti, settimana di prova, box del giorno, FAQ, CTA.
- `/abbonamento/[formula]` × 5 (schede singole): dettaglio di ogni formula con prezzi, cosa ricevi, consegna, fasce, prova, come funziona; JSON-LD `Service`+`Offer`.
- Home (sezione Abbonamento), `/servizi` (prezzo "da 173 € al mese"), `come-funziona`, `meal-prep-pescara`, `pasti-proteici-pescara`, `chi-siamo`, WhatsApp, `llms.txt`, README, sitemap, dati strutturati, titoli e descrizioni entro i limiti dei test.

### 4.4 Area cliente

Richiesta dell'abbonamento: scelta formula (precompilata da `?formula=`), fascia, ritiro/consegna, "ci abboniamo in coppia/famiglia", "parto con la settimana di prova", prezzo stimato con sconto, inizio desiderato, scheda del nutrizionista nelle note. Panoramica e Richieste: formula, fascia, prezzo, periodo, prossima consegna.

### 4.5 Pannello di Matteo

Ordine a mano con formula/fascia/nucleo e prezzo proposto; scheda ordine e liste con etichetta "Completo · Plus"; filtro abbonamenti; Cucina e Oggi con le consegne ogni 3 giorni e i pasti da preparare per quelle consegne (colazioni comprese); etichette una per pasto; spesa e allergeni come prima; numeri.

## 5. Ordine di lavoro

1. Nucleo + migrazione + contratto API + validazioni server + test (io, in serie).
2. In parallelo, su file disgiunti: **A** sito pubblico, **B** area cliente + email + WhatsApp/contatti, **C** pannello (produzione, operazioni, componenti dashboard).
3. Integrazione: `tsc`, `eslint`, `vitest`, `next build`, migrazioni sul D1 **locale**, collaudo in Chrome (`scripts/collaudo.mjs`, `scripts/verifica.mjs`) su desktop e telefono, giro completo: richiesta dall'account → conferma in pannello → cucina/uscite.
4. Revisione del codice con un agente indipendente, correzioni, commit locali.
5. Non si pubblica e non si migra il D1 remoto: serve la conferma esplicita (vedi memoria del progetto). Da applicare in produzione: `0003`–`0006`.
