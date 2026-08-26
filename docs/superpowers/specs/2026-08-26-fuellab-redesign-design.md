# FUEL LAB — fondo chiaro, primi e secondi, piano settimanale, contatto WhatsApp

Data: 2026-08-26
Stato: rivisto dopo il confronto con il committente. Pronto per il piano di implementazione.

## 1. Da dove si parte

Esiste un sito dimostrativo funzionante per **Matteo Pantanè**, cuoco a Pescara: meal prep
fresco, mai surgelato, consegnato in zona due volte a settimana. Sette pagine in Next.js 16 +
Tailwind 4, nessun backend, direzione visiva scura, carrello piatto in `localStorage`,
checkout dimostrativo con i totali in chiaro.

Il cliente ha visto la demo e ha chiesto otto cambiamenti. Questa spec li traduce in un
progetto unico, perché non sono ritocchi indipendenti: fondo chiaro, prezzi nascosti e
passaggio a WhatsApp si tengono l'un l'altro.

## 2. Il cambiamento di natura del progetto

**Il progetto smette di essere una demo statica** — ma solo alla Fase B. La dashboard richiesta
impone un database, un'autenticazione e il trattamento di dati personali:

- serve un database gestito e delle variabili d'ambiente in fase di deploy;
- serve un'autenticazione per il pannello di Matteo;
- serve un'informativa privacy con base giuridica GDPR, perché si conservano nome e numero
  di telefono di persone fisiche.

Il costo economico iniziale resta vicino a zero. Il costo in adempimenti no.

La **Fase A resta interamente statica** e si pubblica su Vercel senza alcun servizio esterno.

## 3. Decisioni prese

| Tema | Decisione |
|---|---|
| Marchio | **FUEL LAB** (non più "FUEL"), come da logo fornito |
| Fondo | **Chiaro**. Cambia il terreno, non l'identità: font, forme e accento restano |
| Catalogo | **Primi e secondi** separati, più gli extra |
| Selezione | **Griglia settimanale** tipo scheda di allenamento |
| Prezzi | Soglia unica **"a partire da 8,90 € a pasto"**, mai un totale |
| Contatto | **WhatsApp**, con cattura del contatto prima del passaggio |
| Condivisione | Il piano settimanale è un **link condivisibile** col nutrizionista |
| Dashboard | **Vera**, con database e autenticazione — Fase B |
| Pubblicazione | **Vercel**, già alla fine della Fase A |

## 4. Il logo: vincoli accertati

Il file fornito (`logo prov.jpeg`, 1600×1600) ha quattro problemi misurati:

1. il marchio è "FUEL LAB", mentre il sito dice ovunque "FUEL";
2. la tagline contiene un errore: **HEALTY** invece di HEALTHY;
3. c'è un watermark `KlingAI 3.0 Omni` in basso a destra;
4. è un JPEG raster senza trasparenza, e **sotto i ~90px di altezza la faccia del cuoco
   diventa illeggibile** (verificato rendendo il logo a 27px e a 64px).

**Decisioni.** Si usa un PNG ritagliato e reso trasparente (`public/logo-fuellab.png`,
1001×704) che esclude sia la tagline con l'errore sia il watermark. Il logo intero compare
**solo dove ha spazio**: hero, footer, sezioni ampie. Nella barra di navigazione si compone
**"FUEL LAB" a testo**.

**Da girare al cliente:** serve un vettoriale con la tagline corretta e senza watermark.
Il PNG è un ripiego accettabile per la demo, non per la produzione.

## 5. Il fondo chiaro: cosa cambia e cosa NON cambia

Richiesta esplicita: **cambia solo lo sfondo**. Non è un redesign, e non si cercano varianti.

**Resta identico:** Anton per i display, Martian Mono per ogni numero, lo shape lock
(interattivi a pillola, contenitori guscio 26px + nucleo 18px con curve concentriche),
il lime `#DFFF3E` come accento unico, la griglia deliberatamente rotta.

**Cambia:** il terreno si inverte. Fondo chiaro caldo, inchiostro verde bosco.

**Tre conseguenze obbligate, non scelte:**

1. **Il lime non può più essere testo.** Su chiaro ha un contrasto di **1.13:1**, cioè è
   invisibile. Diventa esclusivamente *superficie*: blocchi pieni con testo scuro sopra,
   evidenziatori dietro le parole, riempimento delle barre, cifre dentro un blocco scuro.
   Dove prima serviva "lime acceso" per un testo, ora la risposta è il verde bosco.
2. **La nav a vetro si inverte**: da scura translucida a chiara translucida.
3. **Le foto tornano naturali.** Erano state scurite a `brightness(.70)` per non bucare il
   fondo nero. Su chiaro il filtro si toglie: sul cibo è un guadagno secco.

Tutti i testi devono rispettare WCAG AA (4.5:1 normale, 3:1 grande). I rapporti vanno
documentati in testa a `app/globals.css` e verificati, non stimati.

**Nota di stato:** durante una partenza anticipata `globals.css` e `layout.tsx` sono già stati
riscritti sostituendo anche i font (Archivo, JetBrains Mono) e il sistema dei raggi. Questo
**eccede la richiesta** e va riportato ad Anton + Martian Mono e allo shape lock originale.

## 6. Movimento e sport

"Più movimento e qualcosa che ricordi lo sport" si traduce in moto **meccanico, non
decorativo**: contatori che scattano come ripetizioni, barre che si riempiono a tempo
regolare, evidenziatori lime che si aprono da sinistra, ticker orizzontale continuo, e
soprattutto la settimana presentata come **scheda di allenamento**.

Due easing dichiarate: una per le entrate, una per contatori e barre. Nessuna easing di
default. `prefers-reduced-motion` porta agli stati finali, mai all'assenza di contenuto.

## 7. Il catalogo: primi, secondi, extra

Il cambiamento più profondo della Fase A.

**Perché.** In italiano *primi* e *secondi* **sono già** la divisione carboidrati/proteine.
Il cliente ha chiesto entrambe le cose, quindi non vuole una categoria in più: vuole
**comporre il pasto**. I 27 piatti attuali sono completi (proteina + carboidrato + verdura in
un'unica schiscetta) e un piatto completo non è né un primo né un secondo.

**Come.** I 27 piatti si scompongono in circa **12 primi** e **14 secondi**, deduplicando le
basi ripetute. Le macro vanno decomposte in modo che gli abbinamenti classici **tornino
esattamente ai valori di oggi**: "Pollo alla piastra, riso basmati e broccoli" resta 588 kcal
e P52/C68/G12, ma come somma di un primo e di un secondo separabili.

Questo è anche più aderente a come si lavora in cucina: si cuociono poche basi e poche
proteine e si combinano. Da ~26 elementi escono ~168 combinazioni invece di 27.

**Modello dati.**

```
Elemento = {
  id, nome, descrizione, categoria: 'primo' | 'secondo',
  grammi, kcal, proteine, carboidrati, grassi,     // kcal = P*4 + C*4 + G*9, sempre
  tag: ('carne'|'pesce'|'veg'|'senza-glutine')[],
  allergeni: string[],                              // obbligo di legge
  img, giorno: 'lunedi' | 'giovedi'
}

Extra = { id, nome, grammi, kcal, proteine, carboidrati, grassi, allergeni }
```

**Extra previsti:** avocado, olio EVO, grana, mandorle, uovo sodo, porzione proteica
maggiorata, pane integrale, hummus. Ognuno con le proprie macro, che si sommano alla casella.

**Allergeni.** Campo obbligatorio su ogni elemento ed extra (Reg. UE 1169/2011), mostrato
sulla scheda. Non è un di più: è la condizione per vendere alimenti.

**Invariante da testare:** per ogni elemento ed extra, `kcal === P*4 + C*4 + G*9`, senza
arrotondamenti di comodo. Il piano somma le macro e le mostra: se il catalogo non torna, un
atleta se ne accorge alla prima somma.

## 8. La griglia settimanale

**Struttura.** Colonne `LUN → DOM`, righe `PRANZO` e `CENA`, quattordici caselle.

**Cosa contiene una casella.** Un primo, un secondo, **o entrambi**, più zero o più extra.
Nessuno dei due è obbligatorio: una cena può essere solo un secondo, un pranzo pre-allenamento
solo un primo. La casella mostra i nomi e le kcal combinate.

**Totali.** Sotto ogni colonna i macro **di quel giorno**. In fondo una barra scura con i
totali della settimana: pasti, kcal, P/C/G.

**Modello dati.**

```
Casella = { primo?: id, secondo?: id, extra: id[] }
Piano   = { [giorno]: { pranzo?: Casella, cena?: Casella } }
```

In `localStorage`, letto con `useSyncExternalStore`: nessun mismatch di idratazione e nessun
`setState` dentro un effetto. Sostituisce il carrello piatto attuale.

**Riempire una casella.** Cliccando si apre un selettore con primi, secondi ed extra,
filtrabile. Dal `/menu` un elemento va nella prima casella compatibile libera — un primo in
una casella senza primo, un secondo in una senza secondo.

**Mobile.** Una griglia 7×2 a 390px non esiste. Sotto `md` diventa **una colonna per giorno**,
impilate, ognuna con pranzo, cena e i macro del giorno. Non è la griglia compressa: è una
vista diversa dello stesso dato.

## 9. Barre macro animate

Richiesta esplicita del cliente. Ogni scheda mostra proteine, carboidrati e grassi come barre
che **si riempiono quando la scheda entra nel viewport**, sfalsate di ~90ms l'una dall'altra.

**Scala comune a tutto il catalogo**, non ogni barra al 100% del proprio valore: il fondo
scala vale il massimo del catalogo per quel macro. Altrimenti un elemento da 5 g di proteine e
uno da 47 sembrerebbero identici, ed è esattamente il confronto che serve fare fra un primo e
un secondo.

## 10. Il piano condivisibile

La settimana si codifica in un **link**: l'utente lo manda al proprio nutrizionista, che la
approva o la corregge. Nessun backend — il piano sta nella query string.

È il momento in cui la decisione si prende davvero, e presidiarlo vale più di molte altre
funzioni. Vincoli: URL sotto i ~2000 caratteri (quindi codifica compatta, non JSON grezzo),
e apertura del link che **non sovrascrive silenziosamente** il piano già presente in locale,
ma chiede conferma.

## 11. I prezzi

Non compare mai un totale, né un listino, né un prezzo per elemento. Esiste solo
**"a partire da 8,90 € a pasto"** sui servizi di meal prep, e **"su preventivo"** per l'home
cooking. Una soglia sola, non tre.

Il resoconto della settimana mostra **macro**, non euro. Il preventivo nasce nella
conversazione WhatsApp.

La logica di calcolo resta nel codice — servirà quando i prezzi torneranno in chiaro — ma non
viene mai renderizzata come totale.

## 12. I tre servizi

Sezione "I NOSTRI SERVIZI" in home, che **non è tre card identiche in fila** (il secondo è un
blocco lime pieno, gli altri due card di dimensioni diverse), più una pagina `/servizi`.

1. **Il menu della settimana** — primi, secondi ed extra con i macro dichiarati.
2. **Sui macro della tua scheda** — carichi la scheda, il piano si compone sui tuoi numeri.
3. **Home cooking** — Matteo cucina a casa tua: spesa, preparazione, porzionatura.

I primi due: *a partire da 8,90 € a pasto*. Il terzo: *su preventivo*.

**Perché l'home cooking è diverso.** Vende il tempo di Matteo, non la produzione in serie.
Per questo è l'unico senza soglia e il suo unico esito è la conversazione.

Ogni servizio chiude con un invito a scrivere su WhatsApp, mai con "aggiungi al carrello".
**Ogni servizio usa un link `wa.me` con testo precompilato diverso**, così Matteo capisce da
dove arriva il contatto senza analytics.

## 13. WhatsApp e cattura del contatto

**Il punto che rende possibile la dashboard.** Mandare l'utente diretto su WhatsApp non lascia
traccia: il pannello sarebbe vuoto per costruzione. Quindi, in quest'ordine:

1. l'utente compila un form breve: **nome, telefono**, comune, servizio di interesse, note;
2. **Fase B:** il sito salva la richiesta;
3. si apre WhatsApp con un **messaggio precompilato** che riassume piano, macro della
   settimana e servizio scelto.

Il messaggio precompilato serve a Matteo quanto al cliente: riceve una richiesta strutturata
invece di "ciao vorrei info".

**Il numero sta in una variabile d'ambiente**, non cablato. Non è ancora disponibile: il
codice deve funzionare con un segnaposto e **degradare in modo pulito** se manca, senza
generare link rotti.

**Consenso (Fase B):** casella non pre-spuntata con link all'informativa. Senza consenso non
si salva; WhatsApp si apre comunque, ma senza registrare nulla.

## 14. Dashboard e persistenza — Fase B

**Cosa vede Matteo:** le richieste dalla più recente, con nome, telefono cliccabile, comune,
servizio, data, piano richiesto con i macro, note, e uno stato modificabile
(`nuova / contattata / chiusa / persa`).

**Autenticazione:** una sola utenza, sessione con cookie `httpOnly`. Non serve gestione utenti:
serve che non entri nessun altro.

**Database:** provider da scegliere sul marketplace Vercel al momento dell'implementazione,
non a memoria adesso.

**Dato minimo.** Solo quello che serve a richiamare la persona. **Nessun dato sanitario:** la
scheda del nutrizionista non viene caricata da nessuna parte, e i macro salvati sono quelli
che l'utente ha scritto a mano, non un documento clinico. La distinzione va tenuta, perché i
dati sanitari hanno un regime molto più severo.

## 15. Cosa resta finto, cosa è vero

**Finto e dichiarato in pagina:** la lettura del PDF della scheda. Senza un servizio di
estrazione non si legge davvero un documento: l'animazione è scenografia e i macro proposti
sono una scheda tipo da correggere a mano. Il sito lo dice esplicitamente.

**Vero:** il matcher, i filtri, la griglia settimanale e i totali, il link condivisibile, il
messaggio WhatsApp precompilato, e in Fase B il salvataggio, la dashboard, l'autenticazione.

## 16. Sequenza: due fasi

Il lavoro non entra in un solo piano, e forzarlo sarebbe un errore: la Fase A è tutta
front-end senza dipendenze esterne, la Fase B tocca infrastruttura, segreti e dati personali.
Hanno criteri di "fatto" diversi.

**Fase A — quello che il cliente vede.**
Build di nuovo verde, fondo chiaro con l'identità intatta, logo, catalogo primi/secondi/extra,
sezione e pagina servizi, griglia settimanale con i totali, barre macro animate, prezzi solo
come soglia, matcher che compone abbinamenti, link condivisibile, CTA WhatsApp con messaggio
precompilato ma **senza salvataggio**, **deploy su Vercel**.
Alla fine di questa fase il cliente apre il sito dal telefono.

**Fase B — quello che serve a Matteo.**
Provider di database, schema, salvataggio, consenso e informativa, autenticazione, dashboard,
variabili d'ambiente in produzione.

**Fase A è il piano da scrivere adesso.**

## 17. Come contenere il costo del lavoro

Regola: **il modello costoso scrive il contratto, quelli economici lo eseguono.** Ogni task del
piano porta scritto il livello richiesto.

- **Economico** — rinomina FUEL→FUEL LAB su tutto il repo; aggiornamento dei link alle rotte
  nuove; sostituzione meccanica dei token nelle classi; inserimento di testi già scritti;
  conversione ripetitiva di pagine quando il contratto è congelato; test da criteri già scritti.
- **Medio** — ricostruzione di una singola pagina contro un design system già fissato.
- **Costoso** — il contratto del design system chiaro (un errore qui si propaga ovunque); la
  decomposizione del catalogo in primi e secondi con le macro che devono tornare; il componente
  della griglia settimanale e la sua vista mobile; l'aggancio matcher→griglia; la codifica del
  link condivisibile; la verifica finale nel browser.

## 18. Fuori perimetro

Pagamenti online. Gestione utenti multipli. Area cliente con storico ordini. Gestione
magazzino o produzione. Invio automatico di messaggi dal server (si apre solo il link `wa.me`,
niente API Business). Costruttore da ingredienti sfusi a peso. Logo vettoriale, che è lavoro
del grafico.

## 19. Stato attuale del repository

Modifiche già presenti, da considerare **lavoro iniziato e in parte da correggere**:
`app/globals.css` (riscritto in chiaro, ma con font e raggi cambiati oltre la richiesta),
`app/layout.tsx` (font e metadata), `lib/piano.tsx` (nuovo, modello a piatto intero: va
aggiornato a primo/secondo/extra), `public/logo-fuellab.png` (aggiunto), rimossi gli SVG di
scaffolding.

Le pagine cercano ancora i token scuri e l'API del vecchio carrello: **riportare la build in
verde è il primo passo del piano.**

Il progetto **non è sotto controllo di versione**. `git init` è il passo zero: senza, ogni
passaggio è irreversibile.

## 20. Verifica

Si verifica pilotando il browser, non guardando gli screenshot. In particolare:

- **i contrasti reali**, calcolati e non stimati: è una pagina chiara nata da una scura, ed è
  lì che si nascondono i testi illeggibili;
- l'assenza di scroll orizzontale da 390px a 1440px su ogni rotta;
- la griglia settimanale nella sua vista mobile;
- l'invariante `kcal === P*4 + C*4 + G*9` su tutto il catalogo e gli extra;
- che gli abbinamenti classici primo+secondo tornino ai valori dei 27 piatti originali;
- che il matcher centri il bersaglio entro il 12% sugli scenari ragionevoli e **dichiari** lo
  scarto su quelli fuori portata;
- il round-trip del link condivisibile: piano → URL → piano identico;
- il link WhatsApp con numero assente, che non deve produrre un href rotto.

## 21. Domande aperte

1. Il numero WhatsApp di destinazione (rimandato: si lavora con un segnaposto).
2. Chi fornisce il logo vettoriale corretto, e con quali tempi.
3. L'home cooking ha un raggio d'azione diverso dalla consegna? Serve un minimo di persone?
