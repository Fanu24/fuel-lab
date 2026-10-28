# FUEL LAB

Sito e area clienti di Matteo Pattanè, Via del Santuario 214, 65124 Pescara. Produzione: <https://fuelchef.it/>.

Next.js 16 genera le pagine statiche; Cloudflare Pages Functions gestisce autenticazione e API; Cloudflare D1 conserva account, menu salvati, richieste e statistiche aggregate. Il progetto Pages si chiama `fuelchef` nell'account Cloudflare `dotatv24`.

Decisioni del committente (settembre 2026), da tenere ferme:

- **Matteo cucina ogni giorno.** Ritiro o consegna, con giorno e orario concordati, anche per gli abbonamenti. Non ci sono più giorni fissi: il pannello propone come giorno di cucina e di uscita la data chiesta dal cliente (se è futura) o domani, e salta solo i giorni di chiusura segnati in Impostazioni. Il testo pubblico sta in `QUANDO_CUCINA` di `lib/sito.ts`; `lib/sito.test.ts` controlla che nessun sorgente citi più i due giorni.
- **Cinque abbonamenti mensili**, ciascuno in fascia Standard o Plus (prezzi al mese, dal volantino): Pranzo 173/225 € (il pranzo, lunedì–venerdì), Leggero 347/451 € (pranzo e cena, cinque giorni su sette), **Completo 520/676 € (pranzo e cena tutti i giorni, il consigliato)**, Full 6 624/811 € (tre pasti al giorno, sei giorni su sette), Full 7 728/946 € (tre pasti al giorno, tutti i giorni). Il cliente porta il piano scritto dal suo nutrizionista e Matteo lo cucina ai grammi (mediterranea, iperproteica, chetogenica, low-carb, vegana). **Ritiro o consegna, con giorno e orario concordati** (Pescara e dintorni, fino a 20 km). Sconti: ritiro in laboratorio −10%, in coppia −8%, in famiglia −10%. Le box del giorno (7–9 €) sono l'avanzo di cucina a prezzo piccolo, anche senza abbonarsi. Formule, prezzi, sconti, calendario e link stanno tutti in `lib/abbonamento.ts`; il vecchio abbonamento unico ai pranzi non esiste più. Nessun pagamento online e nessuna durata minima o disdetta (il committente non le ha dette): inizio, consegna o ritiro e pagamento si concordano con Matteo.
- **Ipotesi sugli abbonamenti, da confermare con il cliente** (ognuna isolata in una riga di `lib/abbonamento.ts`): gli sconti **non si sommano**, si applica il più alto fra quelli che spettano; coppia e famiglia si dichiarano nella richiesta e li conferma Matteo; il prezzo scontato è arrotondato all'euro; in **Full 6** il giorno libero è la domenica nel pannello (i testi pubblici dicono che si concorda con Matteo); **Leggero** è dal lunedì al venerdì; le pagine dicono che **Completo** vale 15 pasti a settimana, come il volantino, ma pranzo e cena tutti i giorni sono 14 (il calendario di cucina conta 14). Il prezzo finale, sconti compresi, lo conferma sempre Matteo.

## Avvio e pubblicazione

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
npm run deploy:cloudflare
```

`npm run dev` mostra le pagine, mentre le API Pages e D1 richiedono Wrangler. La configurazione del database è in `wrangler.jsonc`; le migrazioni sono in `migrations/`. Per un ambiente locale completo, usa `npx wrangler pages dev out` dopo la build e le migrazioni locali.

La pubblicazione diretta usa il profilo Wrangler `fuelchef` già autorizzato sul PC. Non inserire credenziali nel repository. I segreti di produzione sono `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `RESEND_API_KEY` (quest'ultimo limitato all'invio per `fuelchef.it`). L'esempio delle variabili è in `.env.example`.

## API, email e migrazioni

Il contratto fra pagine e server è `lib/api.ts`; le regole pure (validazioni, calcoli, testi email) stanno in `lib/server/` con i loro test. Endpoint principali: `/api/orders` e `/api/orders/:id` (storia degli eventi, annullamento del cliente finché la richiesta è da confermare), `/api/contact` (pubblico, max 10 messaggi l'ora per rete, IP salvato solo come impronta SHA-256), `/api/account/export` (dati dell'utente in JSON), `/api/admin/customers`, `/api/admin/metrics?days=7..365`, `/api/admin/messages`. La cancellazione dell'account è `POST /api/auth/delete-user` di better-auth: con `{ "password": "..." }` per gli account email, senza password solo con un accesso di meno di 24 ore; l'account admin è protetto.

Le email partono da `accesso@fuelchef.it` via Resend. Gli avvisi per Matteo vanno a `ADMIN_NOTIFY_EMAIL` (predefinito `info@fuelchef.it`); senza `RESEND_API_KEY` vengono saltati senza far fallire le richieste. Le email dell'account portano Reply-To `info@fuelchef.it` (a `accesso@` non risponde nessuno), il cliente riceve anche una ricevuta di richiesta (togliendo l'ultima `accodaEmail` di `functions/api/orders.ts` non parte più) e un secondo tentativo con Idempotency-Key copre i guasti passeggeri di Resend. Nuova migrazione in produzione: `npx wrangler d1 migrations apply fuelchef --remote` (dopo un backup con `npx wrangler d1 export fuelchef --remote --output backup.sql`).

**Migrazioni da applicare in produzione prima di pubblicare questa versione** (se `npx wrangler d1 migrations list fuelchef --remote` le mostra ancora da applicare):

- `0003_pannello.sql`: prezzo concordato, pagato e messaggio al cliente sugli ordini, cronologia degli eventi (`order_events`), messaggi del modulo contatti (`contact_messages`);
- `0004_ordini_manuali.sql`: colonna `source` (`web` o `manual`) per gli ordini inseriti a mano da Matteo;
- `0005_impostazioni.sql`: tabella `site_settings` per piatti non disponibili, chiusure e avviso;
- `0006_abbonamenti.sql`: quattro colonne su `orders`, valide solo per gli abbonamenti (NULL per gli altri servizi): `sub_plan` (la formula: `pranzo`, `leggero`, `completo`, `full6`, `full7`), `sub_tier` (`standard` o `plus`), `sub_household` (`singolo`, `coppia`, `famiglia`: serve a Matteo per lo sconto) e `sub_trial` (1 se il cliente parte dalla settimana di prova). I vecchi ordini con `service = 'abbonamento'` diventano Pranzo, Standard, singolo, con il prezzo che avevano già.

Un abbonamento è un ordine con `orders.service = 'abbonamento'` e la formula obbligatoria (`sub_plan`, `sub_tier`, `sub_household`, `sub_trial`; in `lib/api.ts` sono `Ordine.subscription`). La richiesta nasce con `price_cents` calcolato dal server con `calcolaPrezzo` (formula, fascia, ritiro o consegna, singolo/coppia/famiglia): è un prezzo proposto, da confermare, e la data preferita è l'inizio desiderato. Il piano allegato dal cliente si pota ai soli pasti della formula. Alla conferma le due date dell'ordine sono entrambe l'inizio; il periodo vale un mese, fino al giorno prima dello stesso giorno del mese dopo (se quel giorno non esiste, l'ultimo del mese: 31 gennaio → 27 febbraio). **Ogni 3 giorni dall'inizio c'è una consegna (o un ritiro)**: quel giorno Matteo cucina e consegna i pasti dei tre giorni coperti (oggi, domani e dopodomani, nei soli giorni e pasti della formula e dentro il periodo). Le regole stanno in `lib/abbonamento.ts` (formule, prezzi, sconti, calendario, link) e `lib/server/ordini.ts` (validazione e prezzo sul server).

## Pagine e accessi

- `/menu`, `/settimana`, `/scheda`: scelta dei piatti e composizione della settimana. Il bottone "Invia a Matteo" del compositore porta alla richiesta dall'account. Per chi ha fatto l'accesso la settimana è **sincronizzata con l'account** (`lib/sincronizzaPiano.ts`, `GET/PUT /api/plan`): ogni salvataggio porta la versione da cui parte (`ifUpdatedAt`) e il server risponde 409 se nel frattempo è cambiata altrove; se sono cambiati entrambi i lati il sito chiede quale tenere.
- `/servizi`: i quattro servizi (menu della settimana, abbonamenti, sui tuoi macro, home cooking) da `lib/servizi.ts`; gli abbonamenti si leggono "da 173 € al mese" (`PREZZO_DA`). `/abbonamento`: i cinque abbonamenti a confronto; `/abbonamento/<formula>` (`pranzo`, `leggero`, `completo`, `full6`, `full7`): una scheda per formula, con prezzi Standard e Plus e dati strutturati `Service` con due `Offer` (titoli e descrizioni in `paginaFormula`, `components/seo/pagine.ts`; nodi in `nodoAbbonamenti` e `nodoFormula`, `components/seo/schema.ts`). "Richiedi" porta a `/account?sezione=richiesta&servizio=abbonamento`, con `&formula=<id>`, `&fascia=standard|plus`, `&modalita=pickup|delivery` e `&nucleo=singolo|coppia|famiglia` quando la pagina sa già cosa si vuole (`linkRichiediAbbonamento`: il simulatore di `/abbonamento` li passa tutti, così il prezzo del modulo è quello del simulatore; i link dall'elenco delle formule e dalle schede passano `modalita=delivery`, perché il prezzo mostrato in pagina è quello senza lo sconto di ritiro), senza account a `/richiesta?servizio=abbonamento#scrivi`.
- `/accedi`: registrazione e accesso via email o Google, recupero password, `?next=` per tornare alla pagina di partenza (solo percorsi interni).
- `/account`: area cliente a sezioni (`?sezione=panoramica|settimana|richieste|richiesta|profilo|sicurezza`): settimana salvata, richieste con stato, messaggio di Matteo, prezzo concordato, "Ripeti", annullamento, promemoria da calendario (.ics), profilo, cambio password, download dei dati, eliminazione dell'account. Una richiesta non equivale a un ordine confermato o a un pagamento. Il modulo conserva una bozza in `sessionStorage` (legata a utente e indirizzo, cancellata a invio o uscita) e il telefono accetta al massimo 20 caratteri e da 9 a 15 cifre. `&servizio=abbonamento` preseleziona l'abbonamento: niente settimana obbligatoria, la data diventa "Inizio desiderato" e le note diventano la scheda per Matteo; formula e fascia si scelgono nel modulo (o arrivano da `?formula=`, `?fascia=`, `?modalita=` e `?nucleo=`), insieme a ritiro o consegna, "in coppia" o "in famiglia" e "parto con la settimana di prova", con il prezzo stimato e lo sconto; nelle Richieste l'abbonamento confermato mostra formula, fascia, prezzo, periodo (dal … al …) e prossima consegna.
- `/richiesta`: contatti. Richiesta dall'account, modulo senza account (finisce nel pannello, sezione Messaggi) ed email. `?servizio=` (anche `abbonamento`) preseleziona l'argomento del modulo e il servizio del messaggio WhatsApp. Nel menu del telefono la voce è "Contatti"; nella barra del computer non c'è (non entra accanto ad "Abbonamento"), ci porta il bottone accanto.
- Pagine locali per la ricerca: `/meal-prep-pescara`, `/consegna-pasti-pescara`, `/pasti-proteici-pescara`, `/cuoco-a-domicilio-pescara`.
- `/blog`, `/blog/categoria/<id>`, `/blog/<slug>` (con immagine social `/blog/<slug>/og.png`); `/privacy`: informativa e preferenze Analytics.
- `/dashboard` (solo Matteo, installabile sul telefono come app "Pannello"):
  - **Oggi**: cosa fare adesso in ordine di urgenza, cucina e uscite del giorno (con le consegne in abbonamento di oggi e dei prossimi 7 giorni), prossimi 7 giorni con i giorni di chiusura in evidenza.
  - **Ordini** (`?id=` apre la scheda, `?nuovo=1` il modulo dell'ordine a mano): filtri, "Solo da incassare", "Solo abbonamenti" (`?solo=abbonamenti`), ricerca, elenco o colonne per stato, CSV; nella scheda il bottone del passo successivo, date con le scorciatoie Oggi, Domani, Dopodomani, prezzo, pagato, messaggio al cliente (con email), nota interna, cronologia. L'abbonamento ha il segno "Abbonamento", l'etichetta della formula ("Completo · Plus"), una data sola (l'inizio) e il periodo calcolato; a mese finito risulta "Mese finito" e il bottone propone "Segna concluso".
  - **Cucina** (`?giorno=&scheda=`): porzioni per piatto, lista della spesa, etichette A4 3×7 da stampare, schede d'imballo. Nei giorni di consegna di un abbonamento in corso (confermato, in preparazione o pronto: l'inizio e poi ogni 3 giorni) ci sono anche i **pasti in abbonamento**: una sezione con cliente, formula, i pasti dei tre giorni coperti (colazioni comprese, solo quelli della formula), allergie e scheda, un'etichetta per pasto e una scheda d'imballo. La logica sta in `lib/produzione.ts`, sul calendario di `lib/abbonamento.ts`.
  - **Impostazioni**: piatti non disponibili, chiusure e ferie (i clienti non possono scegliere quei giorni e il pannello non li propone), avviso in cima al sito.
  - **Clienti**, **Messaggi** (modulo contatti), **Numeri** (7/30/90 giorni).

Nota sui soldi: i campi "Da incassare" contano solo i prezzi di ordini confermati; il prezzo di una richiesta ancora da confermare è una proposta.

L'account amministratore è `info@fuelchef.it`. Il ruolo è assegnato nella tabella D1 `staff_roles`; l'accesso richiede anche `emailVerified=1`. Non aggiungere controlli di ruolo solo nel client. La casella in ingresso resta su Aruba; Resend invia solo email transazionali. Apple è predisposto nel codice ma apparirà soltanto quando saranno fornite le credenziali Apple Developer.

Google Analytics usa l'ID `G-DNVWYB7R0C` e si carica dopo il consenso. La dashboard conta anche le visualizzazioni aggregate nello stesso caso; i dati GA4 possono comparire con ritardo nella console Google.

Il numero WhatsApp non è configurato: finché manca, i bottoni WhatsApp diventano "Scrivi a Matteo" e portano al modulo contatti (`/richiesta#scrivi`). Imposta `NEXT_PUBLIC_WHATSAPP` con prefisso internazionale e ripubblica quando Matteo comunica il numero. Ragione sociale e Partita IVA sono segnaposto da completare appena disponibili.

`docs/HANDOFF-CLOUDFLARE.md` descrive una vecchia versione dimostrativa con PIN e solo dati locali; è conservato come documentazione storica e non va usato per pubblicare la versione corrente.

## Collaudo e foto

- `node scripts/collaudo.mjs [--scatti] [--solo=/a,/b]`: con `npx wrangler pages dev out --port 8788` avviato, controlla in Chrome tutte le pagine della sitemap più area cliente e pannello (stato HTTP, errori in console, scorrimento orizzontale, H1, title, description, canonical, JSON-LD) su desktop e telefono. Usa gli utenti del database **locale** `admin@test.local` e `cliente@test.local` (password in `ADMIN_PASSWORD`/`CLIENTE_PASSWORD`, predefinita `PasswordLocale123!`).
- `node scripts/verifica.mjs`: contrasti del testo su ogni nodo visibile.
- `node scripts/varianti-foto.mjs`: dopo aver aggiunto o cambiato foto in `public/foto`, genera le varianti leggere `480/` e `828/` usate da `lib/immagini/loader.ts`. I file generati vanno committati.
