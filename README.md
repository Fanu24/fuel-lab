# FUEL LAB

Sito e area clienti di Matteo Pattanè, Via del Santuario 214, 65124 Pescara. Produzione: <https://fuelchef.it/>.

Next.js 16 genera le pagine statiche; Cloudflare Pages Functions gestisce autenticazione e API; Cloudflare D1 conserva account, menu salvati, richieste e statistiche aggregate. Il progetto Pages si chiama `fuelchef` nell'account Cloudflare `dotatv24`.

Decisioni del committente (settembre 2026), da tenere ferme:

- **Matteo cucina ogni giorno e consegna ogni giorno.** Non ci sono più giorni fissi: il pannello propone come giorno di cucina e di uscita la data chiesta dal cliente (se è futura) o domani, e salta solo i giorni di chiusura segnati in Impostazioni. Il testo pubblico sta in `QUANDO_CUCINA` di `lib/sito.ts`; `lib/sito.test.ts` controlla che nessun sorgente citi più i due giorni.
- **Abbonamento mensile ai pranzi: 239 € al mese**, tutti i pranzi dal lunedì al venerdì per un mese, composti sulla scheda del cliente (allenamento, obiettivi, indicazioni del nutrizionista). Prezzo, link e testi stanno in `lib/abbonamento.ts`. Nessun pagamento online: inizio, consegna o ritiro e pagamento si concordano con Matteo.

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

Le email partono da `accesso@fuelchef.it` via Resend. Gli avvisi per Matteo vanno a `ADMIN_NOTIFY_EMAIL` (predefinito `info@fuelchef.it`); senza `RESEND_API_KEY` vengono saltati senza far fallire le richieste. Nuova migrazione in produzione: `npx wrangler d1 migrations apply fuelchef --remote` (dopo un backup con `npx wrangler d1 export fuelchef --remote --output backup.sql`).

**Migrazioni da applicare in produzione prima di pubblicare questa versione** (se `npx wrangler d1 migrations list fuelchef --remote` le mostra ancora da applicare):

- `0003_pannello.sql`: prezzo concordato, pagato e messaggio al cliente sugli ordini, cronologia degli eventi (`order_events`), messaggi del modulo contatti (`contact_messages`);
- `0004_ordini_manuali.sql`: colonna `source` (`web` o `manual`) per gli ordini inseriti a mano da Matteo;
- `0005_impostazioni.sql`: tabella `site_settings` per piatti non disponibili, chiusure e avviso.

L'abbonamento non vuole migrazioni: `orders.service` è testo senza vincolo e vale `abbonamento`; la richiesta nasce con `price_cents = 23900` (prezzo proposto, da confermare) e la data preferita è l'inizio desiderato. Alla conferma le due date dell'ordine sono entrambe l'inizio; il periodo vale un mese, fino al giorno prima dello stesso giorno del mese dopo (se quel giorno non esiste, l'ultimo del mese: 31 gennaio → 27 febbraio). Le regole stanno in `lib/abbonamento.ts` e `lib/server/ordini.ts`.

## Pagine e accessi

- `/menu`, `/settimana`, `/scheda`: scelta dei piatti e composizione della settimana. Il bottone "Invia a Matteo" del compositore porta alla richiesta dall'account. Per chi ha fatto l'accesso la settimana è **sincronizzata con l'account** (`lib/sincronizzaPiano.ts`, `GET/PUT /api/plan`): ogni salvataggio porta la versione da cui parte (`ifUpdatedAt`) e il server risponde 409 se nel frattempo è cambiata altrove; se sono cambiati entrambi i lati il sito chiede quale tenere.
- `/servizi`: i quattro servizi (menu della settimana, abbonamento, sui tuoi macro, home cooking) da `lib/servizi.ts`. `/abbonamento`: la pagina dell'abbonamento mensile; "Richiedilo" porta a `/account?sezione=richiesta&servizio=abbonamento`, senza account a `/richiesta?servizio=abbonamento#scrivi`.
- `/accedi`: registrazione e accesso via email o Google, recupero password, `?next=` per tornare alla pagina di partenza (solo percorsi interni).
- `/account`: area cliente a sezioni (`?sezione=panoramica|settimana|richieste|richiesta|profilo|sicurezza`): settimana salvata, richieste con stato, messaggio di Matteo, prezzo concordato, "Ripeti", annullamento, promemoria da calendario (.ics), profilo, cambio password, download dei dati, eliminazione dell'account. Una richiesta non equivale a un ordine confermato o a un pagamento. `&servizio=abbonamento` preseleziona l'abbonamento: niente settimana obbligatoria, la data diventa "Inizio desiderato" e le note diventano la scheda per Matteo; nelle Richieste l'abbonamento confermato mostra il periodo (dal … al …).
- `/richiesta`: contatti. Richiesta dall'account, modulo senza account (finisce nel pannello, sezione Messaggi) ed email. `?servizio=` (anche `abbonamento`) preseleziona l'argomento del modulo e il servizio del messaggio WhatsApp. Nel menu del telefono la voce è "Contatti"; nella barra del computer non c'è (non entra accanto ad "Abbonamento"), ci porta il bottone accanto.
- Pagine locali per la ricerca: `/meal-prep-pescara`, `/consegna-pasti-pescara`, `/pasti-proteici-pescara`, `/cuoco-a-domicilio-pescara`.
- `/blog`, `/blog/categoria/<id>`, `/blog/<slug>` (con immagine social `/blog/<slug>/og.png`); `/privacy`: informativa e preferenze Analytics.
- `/dashboard` (solo Matteo, installabile sul telefono come app "Pannello"):
  - **Oggi**: cosa fare adesso in ordine di urgenza, cucina e uscite del giorno (con i pranzi in abbonamento di oggi e dei prossimi 7 giorni), prossimi 7 giorni con i giorni di chiusura in evidenza.
  - **Ordini** (`?id=` apre la scheda, `?nuovo=1` il modulo dell'ordine a mano): filtri, "Solo da incassare", "Solo abbonamenti" (`?solo=abbonamenti`), ricerca, elenco o colonne per stato, CSV; nella scheda il bottone del passo successivo, date con le scorciatoie Oggi, Domani, Dopodomani, prezzo, pagato, messaggio al cliente (con email), nota interna, cronologia. L'abbonamento ha il segno "Abbonamento", una data sola (l'inizio) e il periodo calcolato; a mese finito risulta "Mese finito" e il bottone propone "Segna concluso".
  - **Cucina** (`?giorno=&scheda=`): porzioni per piatto, lista della spesa, etichette A4 3×7 da stampare, schede d'imballo. Dal lunedì al venerdì ci sono anche i **pranzi in abbonamento** degli abbonamenti in corso (confermati, in preparazione o pronti, con il periodo che comprende il giorno): una sezione con cliente, pranzo, allergie e scheda, un'etichetta per pranzo (il piatto indicato dal cliente per quel giorno o "Pranzo in abbonamento") e una scheda d'imballo. La logica è `abbonamentiDelGiorno` in `lib/produzione.ts`.
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
