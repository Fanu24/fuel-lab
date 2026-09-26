# Handoff: pubblicare FUEL LAB su Cloudflare

**Generato**: 2026-09-26 23:06
**Branch**: `restyling` (sopra `fase-a`; remote `origin` = github.com/Fanu24/fuel-lab, **non ancora pushato**)
**Stato**: pronto per la pubblicazione. Working tree pulito, tutto committato.

## Obiettivo

Mettere online su Cloudflare il sito demo di FUEL LAB, il meal prep di Matteo Pantanè a Pescara. Il sito è stato rifatto in questa sessione: lo sport resta il protagonista, con richiami alla cucina sana. Il sito è un **export statico**: niente server, niente database. `npm run build` produce la cartella `out/`, ed è quella che Cloudflare serve.

## Fatto

- [x] Restyling "spogliatoio e cucina": carta del logo più sezioni scure con atleti; font Oxanium (squadrato come il logo); lime usato solo come segnale.
- [x] Home: hero con atleta e riquadro "cucinato stamattina", tre passi, consigli cardio/pesi, sezione "La cucina", piatti, chiusura.
- [x] Menu con un filtro solo e una pagina statica per piatto (`/menu/[id]`, 6 pagine generate).
- [x] Compositore `/settimana`:
  - allenamento per giorno → riempimento automatico;
  - trascinamento col mouse, tocca-e-tocca col dito, uso da tastiera;
  - foglio delle aggiunte;
  - link da mandare al nutrizionista.
- [x] `/richiesta` salva la richiesta (localStorage) e poi apre WhatsApp.
- [x] Dashboard demo di Matteo (`/dashboard`, PIN): richieste, stato, dettaglio, produzione del lunedì e del giovedì.
- [x] Export statico: 404, `sitemap.xml`, `robots.txt`, immagine per le anteprime social, icone, `_headers`, `wrangler.jsonc`.
- [x] QA:
  - 11 dispositivi da 320 a 1920 px, orizzontale incluso: 0 problemi;
  - 18/18 interazioni su touch emulato;
  - contrasto misurato su 2190 nodi di testo: 0 violazioni;
  - 180 test vitest verdi; tsc e eslint puliti.

## Da fare (tocca all'utente)

- [ ] `git push -u origin restyling` (e unire in `master` se si vuole pubblicare da lì).
- [ ] Creare il progetto su Cloudflare (vedi **Istruzioni per riprendere**).
- [ ] Impostare le variabili di build (vedi **Setup**), soprattutto `NEXT_PUBLIC_SITE_URL`.
- [ ] Quando arriva il numero di Matteo: `NEXT_PUBLIC_WHATSAPP`, poi un nuovo deploy.
- [ ] Da confermare con Matteo:
  - foto vere (piatti, suo ritratto);
  - testi segnaposto di `/chi-e-matteo` e `/come-funziona`;
  - raggio di consegna;
  - se i piatti cucinati il lunedì vadano serviti solo a inizio settimana.
- [ ] Dashboard reale (fuori da questo giro): servirebbero Supabase e un runtime server. Vedi **Avvertenze**.

## Approcci falliti (non ripeterli)

- **`next start` dopo la build**: con `output: "export"` non funziona più, ed è voluto. Per l'anteprima si usa `npx wrangler dev` o un server statico su `out/`.
- **Rotta dinamica `/dashboard/richieste/[id]`**: con l'export statico non si può fare, perché le richieste non sono note al build. È stata sostituita da `/dashboard/richiesta?id=…`, letta nel client con `useSearchParams` dentro `<Suspense>`. Non reintrodurre rotte `[param]` senza `generateStaticParams`.
- **File di prefetch di Next 16 in 404 sull'hosting statico**:
  - Next scrive `out/settimana/__next.!KHNpdG8p/settimana/__PAGE__.txt`.
  - Il browser però chiede `/settimana/__next.!KHNpdG8p.settimana.__PAGE__.txt`.
  - Risultato: 404 in console a ogni link e prefetch perso (la navigazione funziona lo stesso).
  - Correzione: `scripts/appiattisci-prefetch.mjs` come `postbuild`, che copia i file col nome piatto.
  - **Serve buildare con `npm run build`**, non con `npx next build`, altrimenti il postbuild non parte.
- **Velo sulle foto a gradiente per il testo a metà immagine**: scendeva a 2,8:1 di contrasto sulle foto chiare. Per il testo centrato si usa `velo="forte"` in `FotoPiena` (fondo pieno all'80%).
- **Falsi allarmi nei test automatici** (non sono bug del sito):
  - `scroll-behavior: smooth` fa mancare tap e drag se si calcolano le coordinate subito dopo uno scroll; usare `behavior: "instant"` e aspettare.
  - Su Git Bash, gli argomenti che iniziano con `/` vengono convertiti in percorsi Windows; usare `MSYS_NO_PATHCONV=1`.

## Decisioni chiave

| Decisione | Motivo |
|---|---|
| Export statico e non OpenNext o Workers con SSR | Il sito gira tutto nel browser (localStorage, WhatsApp). Un export statico si pubblica gratis e senza manutenzione. |
| Loader immagini custom (`lib/immagini/loader.ts`) | L'export non supporta l'ottimizzazione di default; Unsplash ridimensiona da sé, e i file in `/public` passano invariati. |
| Nessun prezzo in chiaro (`MOSTRA_STIMA_PREZZO = false`) | Richiesta del committente: solo "da 8,90 € a pasto". |
| Dashboard su localStorage dietro `RepositoryRichieste` | È una demo: si attacca Supabase senza toccare le pagine. |
| Il PIN della dashboard sta nel client | Non è sicurezza, e lo dichiara: niente dati veri finché non c'è un backend. |
| Trascinamento scritto a mano, senza librerie | 6 piatti e 14 caselle; su touch si tocca invece di trascinare, così lo scroll non viene conteso. |

## Stato attuale

**Funziona**: tutto il sito in `out/` servito come file statici, compresi 404 e prefetch.

**Rotto**: niente di noto.

**Modifiche non committate**: nessuna.

## File da conoscere

| File | Perché conta |
|---|---|
| `next.config.ts` | `output: "export"` e loader immagini custom |
| `wrangler.jsonc` | config Cloudflare Workers: `assets.directory = ./out`, 404 e gestione degli URL |
| `public/_headers` | cache immutabile di `/_next/static/*`, header di sicurezza, noindex della dashboard |
| `scripts/appiattisci-prefetch.mjs` | postbuild obbligatorio (vedi approcci falliti) |
| `lib/sito.ts` | `URL_SITO` da `NEXT_PUBLIC_SITE_URL`, usato da sitemap, robots e metadati |
| `lib/immagini/index.ts` | tutte le foto del sito: qui si mettono quelle vere |
| `lib/catalogo.ts` | i 6 piatti (campo `img` per le foto) |
| `lib/richieste/` | repository delle richieste (demo localStorage); punto d'aggancio per Supabase |
| `scripts/verifica.mjs` | controllo dei contrasti in Chrome reale su tutte le rotte |
| `.node-version` | Node 22 per la build su Cloudflare (Next 16 vuole ≥ 20.9) |

## Contesto di codice

```ts
// lib/sito.ts: letto AL BUILD, non a runtime
export const URL_SITO = (process.env.NEXT_PUBLIC_SITE_URL || "https://fuel-lab.pages.dev").replace(/\/+$/, "");
```

```jsonc
// wrangler.jsonc
{
  "name": "fuel-lab",
  "compatibility_date": "2026-09-01",
  "assets": { "directory": "./out", "html_handling": "auto-trailing-slash", "not_found_handling": "404-page" }
}
```

```json
// package.json (estratto)
"build": "next build",
"postbuild": "node scripts/appiattisci-prefetch.mjs"
```

L'output atteso della build termina con:

```
appiattisci-prefetch: 18 file di prefetch resi raggiungibili
```

## Istruzioni per riprendere

1. **Push**: `git push -u origin restyling`.

2. **Crea il progetto su Cloudflare.** Due strade equivalenti.

   **A. Workers con Git (consigliata; Cloudflare oggi indirizza qui i nuovi progetti statici)**
   1. Dashboard Cloudflare → *Workers & Pages* → *Create* → *Import a repository* → `Fanu24/fuel-lab`.
   2. Branch di produzione: `restyling`, oppure `master` dopo il merge.
   3. Build command: `npm run build`.
   4. Deploy command: `npx wrangler deploy`. Legge `wrangler.jsonc` e carica `out/`.
   5. Nelle variabili di **build**, imposta quelle della sezione Setup.

   **B. Pages**
   1. *Workers & Pages* → *Create* → *Pages* → collega il repo.
   2. Framework preset: *None*.
   3. Build command: `npm run build`. Build output directory: `out`.
   4. Pages legge da solo `out/_headers` e serve `404.html`.
   5. `wrangler.jsonc` qui viene ignorato: non dà fastidio.

   **Deploy da terminale, senza Git**:

   ```bash
   npm ci && npm run build && npx wrangler login && npx wrangler deploy
   ```

3. **Verifica dopo il deploy.** Sostituisci `URL` con l'indirizzo assegnato.

   | Controllo | Atteso |
   |---|---|
   | `URL/` | hero scuro con atleta e titolo "ALLENATI. AL CIBO CI PENSA MATTEO." |
   | `URL/menu` e `URL/menu/pallotte-cacio-ovo` | rispondono 200, non 404 (vale per tutti gli URL senza `.html`) |
   | `URL/qualcosa-che-non-esiste` | pagina "Serie saltata.", stato 404 |
   | `URL/robots.txt`, `URL/sitemap.xml` | contengono il dominio vero |
   | `URL/settimana` → Tre pesi + 2 cardio → Riempi la settimana | 14 caselle piene; in DevTools → Network nessun 404 su file `__next.*` |
   | `URL/richiesta` → invia → `URL/dashboard`, PIN `1234` | la richiesta appena inviata è la prima dell'elenco |
   | Anteprima del link su WhatsApp o Telegram | immagine scura FUEL LAB |

   - Se sitemap o robots mostrano `fuel-lab.pages.dev` al posto del dominio vero: manca `NEXT_PUBLIC_SITE_URL` nelle variabili di build. Impostala e rifai il deploy.
   - Se ci sono 404 sui file `__next.*.txt`: la build non è passata da `npm run build`, quindi il postbuild non è partito.
   - Se `/menu` risponde 404: con Workers controlla `html_handling`; con Pages controlla che l'output directory sia `out`.

4. **Dominio personalizzato**:
   1. Progetto → *Settings* → *Domains & Routes* → *Add custom domain*.
   2. Aggiorna `NEXT_PUBLIC_SITE_URL` al nuovo dominio e rifai il deploy.

## Setup

**Variabili d'ambiente**, tutte di **build**: sono `NEXT_PUBLIC_*`, finiscono nel codice al build, e cambiarle richiede un nuovo deploy.

| Variabile | Valore | Se manca |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | es. `https://fuel-lab.pages.dev` o il dominio finale, senza `/` finale | sitemap, robots e anteprime social puntano al dominio di ripiego |
| `NEXT_PUBLIC_WHATSAPP` | numero di Matteo in formato internazionale, es. `393331234567` | i bottoni WhatsApp restano disattivati con una spiegazione (comportamento voluto) |
| `NEXT_PUBLIC_DEMO_PIN` | PIN della dashboard | vale `1234` |
| `NODE_VERSION` | `22` (solo se Cloudflare ignora `.node-version`) | Next 16 fallisce sotto Node 20.9 |

**Controlli in locale prima di pubblicare**:

```bash
npm ci
npx vitest run && npx tsc --noEmit && npx eslint app components lib   # 180 test verdi, nessun errore
npm run build                                                          # scrive out/
npx wrangler dev --port 4311                                           # anteprima identica a Cloudflare
node scripts/verifica.mjs                                              # atteso: "ESITO: VERDE"
```

## Casi limite

- **Numero WhatsApp assente**: `/richiesta` salva comunque la richiesta e mostra "Richiesta salvata", perché il bottone WhatsApp non si apre.
- **localStorage bloccato** (navigazione privata su alcuni browser): la settimana vale solo per la sessione e la richiesta non arriva alla dashboard. WhatsApp si apre lo stesso.
- **Link condiviso creato con un menu vecchio**: viene rifiutato con un avviso, invece di caricare piatti sbagliati.
- **Dashboard aperta da un altro dispositivo**: vede solo i dati d'esempio. Le richieste restano nel browser che le ha create (limite della demo, dichiarato nella pagina).

## Avvertenze

- **Non pubblicare la dashboard come pannello vero.** Il PIN sta nel codice del browser e i dati sono locali. Per una versione reale servono:
  - Supabase (implementazione di `RepositoryRichieste` in `lib/richieste/`);
  - un runtime server (OpenNext per Cloudflare, oppure un Worker con API);
  - l'autenticazione vera, non il PIN.
  L'export statico da solo non basta.
- **`AGENTS.md`**: `next dev` lo riscrive. Va lasciato com'è e committato.
- **`.vercel/`**: resta dal vecchio deploy su Vercel e non serve a Cloudflare. Si può ignorare o cancellare.
- **Foto Unsplash**: sono caricate a runtime da `images.unsplash.com`. Se un giorno una sparisse, si cambia l'id in `lib/immagini/index.ts` o in `lib/catalogo.ts`. Ogni id attuale è stato verificato (risposta 200).
- **Anteprima social**: `app/opengraph-image.jpg` è un file statico generato una volta. Se cambia lo slogan, va rigenerato.
