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

## Pagine e accessi

- `/menu`, `/settimana`, `/scheda`: scelta dei piatti e composizione della settimana.
- `/accedi`: registrazione e accesso via email o Google; verifica email e recupero password tramite messaggi inviati da Resend.
- `/account`: profilo cliente, settimana salvata e richieste. Una richiesta non equivale a un ordine confermato o a un pagamento.
- `/dashboard`: richieste, clienti e andamento delle visite consentite, accessibile solo a Matteo.
- `/dashboard/produzione`: preparazioni del giorno e foglio stampabile.
- `/blog`: articoli raggiungibili dal footer; `/privacy`: informativa e preferenze Analytics.

L'account amministratore è `info@fuelchef.it`. Il ruolo è assegnato nella tabella D1 `staff_roles`; l'accesso richiede anche `emailVerified=1`. Non aggiungere controlli di ruolo solo nel client. La casella in ingresso resta su Aruba; Resend invia solo email transazionali. Apple è predisposto nel codice ma apparirà soltanto quando saranno fornite le credenziali Apple Developer.

Google Analytics usa l'ID `G-DNVWYB7R0C` e si carica dopo il consenso. La dashboard conta anche le visualizzazioni aggregate nello stesso caso; i dati GA4 possono comparire con ritardo nella console Google.

Il numero WhatsApp non è configurato: i relativi pulsanti spiegano che sarà disponibile prossimamente. Imposta `NEXT_PUBLIC_WHATSAPP` con prefisso internazionale e ripubblica quando Matteo comunica il numero. Ragione sociale e Partita IVA sono segnaposto da completare appena disponibili.

`docs/HANDOFF-CLOUDFLARE.md` descrive una vecchia versione dimostrativa con PIN e solo dati locali; è conservato come documentazione storica e non va usato per pubblicare la versione corrente.
