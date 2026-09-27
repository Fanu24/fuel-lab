# FUEL LAB

Sito e area clienti di Matteo Pattanè, Via del Santuario 214, 65124 Pescara. Produzione: <https://fuelchef.it/>.

Next.js 16 genera le pagine statiche; Cloudflare Pages Functions gestisce autenticazione e API; Cloudflare D1 conserva account, menu salvati, richieste e statistiche aggregate. Il progetto Pages si chiama `fuelchef` nell'account Cloudflare `dotatv24`.

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

Il contratto fra pagine e server è `lib/api.ts`; le regole pure (validazioni, calcoli, testi email) stanno in `lib/server/` con i loro test. Endpoint principali: `/api/orders` e `/api/orders/:id` (storia degli eventi, annullamento del cliente finché la richiesta è da confermare), `/api/contact` (pubblico, max 5 messaggi l'ora per IP, IP salvato solo come impronta SHA-256), `/api/account/export` (dati dell'utente in JSON), `/api/admin/customers`, `/api/admin/metrics?days=7..365`, `/api/admin/messages`. La cancellazione dell'account è `POST /api/auth/delete-user` di better-auth: con `{ "password": "..." }` per gli account email, senza password solo con un accesso di meno di 24 ore; l'account admin è protetto.

Le email partono da `accesso@fuelchef.it` via Resend. Gli avvisi per Matteo vanno a `ADMIN_NOTIFY_EMAIL` (predefinito `info@fuelchef.it`); senza `RESEND_API_KEY` vengono saltati senza far fallire le richieste. Nuova migrazione in produzione: `npx wrangler d1 migrations apply fuelchef --remote` (dopo un backup con `npx wrangler d1 export fuelchef --remote --output backup.sql`).

## Pagine e accessi

- `/menu`, `/settimana`, `/scheda`: scelta dei piatti e composizione della settimana. Il bottone "Invia a Matteo" del compositore porta alla richiesta dall'account.
- `/accedi`: registrazione e accesso via email o Google, recupero password, `?next=` per tornare alla pagina di partenza (solo percorsi interni).
- `/account`: area cliente a sezioni (`?sezione=panoramica|settimana|richieste|richiesta|profilo|sicurezza`): settimana salvata, richieste con stato, messaggio di Matteo, prezzo concordato, "Ripeti", annullamento, promemoria da calendario (.ics), profilo, cambio password, download dei dati, eliminazione dell'account. Una richiesta non equivale a un ordine confermato o a un pagamento.
- `/richiesta`: contatti. Richiesta dall'account, modulo senza account (finisce nel pannello, sezione Messaggi) ed email.
- Pagine locali per la ricerca: `/meal-prep-pescara`, `/consegna-pasti-pescara`, `/pasti-proteici-pescara`, `/cuoco-a-domicilio-pescara`.
- `/blog`, `/blog/categoria/<id>`, `/blog/<slug>` (con immagine social `/blog/<slug>/og.png`); `/privacy`: informativa e preferenze Analytics.
- `/dashboard` (solo Matteo, installabile sul telefono come app "Pannello"):
  - **Oggi**: cosa fare adesso in ordine di urgenza, cucina e uscite del giorno, prossimi 7 giorni.
  - **Ordini** (`?id=` apre la scheda): filtri, ricerca, elenco o colonne per stato, CSV; nella scheda il bottone del passo successivo, date con scorciatoie ai giorni di cucina, prezzo, pagato, messaggio al cliente (con email), nota interna, cronologia.
  - **Cucina** (`?giorno=&scheda=`): porzioni per piatto, lista della spesa, etichette A4 3×7 da stampare, schede d'imballo.
  - **Clienti**, **Messaggi** (modulo contatti), **Numeri** (7/30/90 giorni).

Nota sui soldi: i campi "Da incassare" contano solo i prezzi di ordini confermati; il prezzo di una richiesta ancora da confermare è una proposta.

L'account amministratore è `info@fuelchef.it`. Il ruolo è assegnato nella tabella D1 `staff_roles`; l'accesso richiede anche `emailVerified=1`. Non aggiungere controlli di ruolo solo nel client. La casella in ingresso resta su Aruba; Resend invia solo email transazionali. Apple è predisposto nel codice ma apparirà soltanto quando saranno fornite le credenziali Apple Developer.

Google Analytics usa l'ID `G-DNVWYB7R0C` e si carica dopo il consenso. La dashboard conta anche le visualizzazioni aggregate nello stesso caso; i dati GA4 possono comparire con ritardo nella console Google.

Il numero WhatsApp non è configurato: i relativi pulsanti spiegano che sarà disponibile prossimamente. Imposta `NEXT_PUBLIC_WHATSAPP` con prefisso internazionale e ripubblica quando Matteo comunica il numero. Ragione sociale e Partita IVA sono segnaposto da completare appena disponibili.

`docs/HANDOFF-CLOUDFLARE.md` descrive una vecchia versione dimostrativa con PIN e solo dati locali; è conservato come documentazione storica e non va usato per pubblicare la versione corrente.

## Collaudo e foto

- `node scripts/collaudo.mjs [--scatti] [--solo=/a,/b]`: con `npx wrangler pages dev out --port 8788` avviato, controlla in Chrome tutte le pagine della sitemap più area cliente e pannello (stato HTTP, errori in console, scorrimento orizzontale, H1, title, description, canonical, JSON-LD) su desktop e telefono. Usa gli utenti del database **locale** `admin@test.local` e `cliente@test.local` (password in `ADMIN_PASSWORD`/`CLIENTE_PASSWORD`, predefinita `PasswordLocale123!`).
- `node scripts/verifica.mjs`: contrasti del testo su ogni nodo visibile.
- `node scripts/varianti-foto.mjs`: dopo aver aggiunto o cambiato foto in `public/foto`, genera le varianti leggere `480/` e `828/` usate da `lib/immagini/loader.ts`. I file generati vanno committati.
