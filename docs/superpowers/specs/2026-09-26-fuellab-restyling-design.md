# FUEL LAB — restyling "Spogliatoio e cucina", compositore per allenamento, dashboard di Matteo

## Context
Il sito demo per Matteo (meal prep fit, Pescara) funziona ma è "meccanico e troppo pieno": pagine da 500–750 righe, 4 filtri per 6 piatti, compositore a modali casella-per-casella senza drag, foto stock generiche. Il brief del cliente (`DIRETTIVE CLIENTE/LAB.pdf`) chiede più impronta fit (atleti, allenamenti), consigli per abbinare i pasti all'allenamento (cardio → più carboidrati; pesi → proteine + carbo ridotti) e piatti composti con scheda e motivo dell'abbinamento. Obiettivo: stesso impianto di rotte, molto meno contenuto, immagini grandi, compositore guidato dall'allenamento con drag & drop, e una dashboard demo per Matteo.

**Decisioni prese con l'utente**
- Stile: base chiara (carta del logo) alternata a sezioni scure full-bleed con atleti/allenamenti; lime solo come segnale.
- Compositore: "Allenamento → settimana" (scegli cardio/pesi/riposo per giorno → autoriempimento → ritocchi trascinando).
- Dashboard: solo per Matteo, **demo** (localStorage + dati d'esempio) dietro un'interfaccia repository pronta per Supabase.
- Prezzi: nessun prezzo in chiaro; la barra mostra "da 8,90 € a pasto" (flag `MOSTRA_STIMA_PREZZO` spento).

## Approccio

### Fase 0 — Fondamenta
- Branch `restyling` da `fase-a`; salvare questo design in `docs/superpowers/specs/2026-09-26-fuellab-restyling-design.md`.
- `next.config.ts`: `images: { loader: 'custom', loaderFile: './lib/immagini/loader.ts' }` (Unsplash ridimensiona; percorsi locali passano invariati). Next 16: niente `priority` → `fetchPriority="high"`; `params` è una Promise (`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`).
- `lib/immagini/index.ts`: unico registro foto (`FOTO.heroAtleta`, `corsa`, `pesi`, `cucina`, `matteo`…, `urlFoto(id,w)`, `VIDEO_HERO=null`). Elimina i 5 helper `unsplash()` duplicati (`app/page.tsx`, `chi-e-matteo`, `come-funziona`, `SchedaClient`, `StrisciaCucina`).
- Font: **Oxanium** (squadrato con angoli smussati come il logo) al posto di Anton su `--f-disp`; Archivo per il testo, Martian Mono solo per i numeri.
- Token: `globals.css` spezzato in `app/styles/{tokens,base,sezioni,controlli,compositore}.css`. Palette: paper `#f3efe6`, ink `#121412`, night `#0e100f`/`#1a1d1b`, steel `#9aa39d`, lime `#dfff3e` solo segnale (mai testo su carta). Raggio 4px + utility `.smusso` (clip-path angolo tagliato come il logo). Via il doppio guscio tray/core.
- Route group `app/(sito)/` (Nav, Footer, PianoProvider) + `app/dashboard/` con layout proprio; URL invariati.
- `components/ui/`: `Sezione` (carta|notte), `Titolo`, `Bottone`, `FotoPiena`, `TagAllenamento`, `Numero`. Nav/Footer ristilizzati (nav: Menu · Componi · Come funziona · Chi è Matteo + "Richiedi"). Rimuovere tipi morti in `lib/types.ts`.

### Fase 1 — Pagine di contenuto (meno testo, più immagine)
- `lib/consigli.ts`: copy unico cardio/pesi/riposo (dal PDF), usato da home, menu, compositore.
- Home (<80 righe, solo composizione) in `components/home/`: `Hero` (atleta full-bleed, una frase, un CTA) → `TrePassi` → `PiattiScelti` (3–4 piatti grandi, scroll orizzontale su mobile) → `Allenamento` (scuro, cardio | pesi) → `ChiusuraCta`. Via `home.module.css`/`Ticker` se inutilizzati.
- `/menu`: un solo filtro Tutti/Cardio/Pesi; `SchedaPiatto` (foto, ingredienti con grammi, "perché funziona", MacroBar, allergeni, giorno di cottura); `PerLaTuaBox` come lista compatta per reparto (snack a parte). `EXTRA` spostato in `lib/catalogo-extra.ts` mantenendo l'ordine (impronta di `condivisione.ts`).
- `/chi-e-matteo`: `Ritratto`, `Percorso`, `Principi` con segnaposto chiari + `StrisciaCucina` ristilizzata.
- `/come-funziona` ridotta (3 passi, consegna, FAQ riusando `Faq.tsx`); `/servizi` solo restyle (spostata nel footer); `/scheda` senza il finto caricamento PDF: macro a mano → matcher → "apri nel compositore".

### Fase 2 — Compositore "Allenamento → settimana" (`/settimana`)
- `lib/settimana.ts`: `TipoGiornata = cardio|pesi|riposo`, `Allenamenti`, `Slot`, `spostaCasella` (sposta; scambia se piena), `potaAllenamenti`. `Piano` invariato → nessuna migrazione; allenamenti su chiave nuova `fuellab.allenamenti.v1`.
- `lib/storeLocale.ts`: estrae la logica `useSyncExternalStore`/storage/altre schede da `lib/piano.tsx` in `creaStore<T>()`; `piano.tsx` aggiunge `sposta`, `riempi`; provider allenamenti.
- `lib/autofill.ts` (puro, deterministico): cardio → piatti cardio/entrambi per quota carbo; pesi → pesi/entrambi per rapporto P/C; riposo → i più leggeri; mai doppione nello stesso giorno, max 3 volte a settimana, niente stesso pasto in giorni consecutivi; riempie solo caselle vuote salvo `sovrascrivi`; `rimescola` per "altre proposte"; opzione 1 o 2 pasti al giorno.
- `lib/riepilogo.ts`: pasti, macro settimana/media giorno, prossima taglia, extra su richiesta; prezzo mostrato solo se `MOSTRA_STIMA_PREZZO`.
- `condivisione.ts`: `&a=` opzionale (7 caratteri c/p/r/-), link vecchi ancora validi. `whatsapp.ts`: una riga per giorno con allenamento.
- `components/compositore/`: `PianificaAllenamenti` (7 giorni × Cardio/Pesi/Riposo/—, toggle pasti, "Riempi la settimana"), `Banco` (6 piatti, sticky; è anche zona di rimozione), `Griglia` + `Slot` (`data-slot`), `FoglioExtra` (`<dialog>`, sostituisce `SelettoreCasella`), `BarraSettimana` (sticky: pasti/14, macro medie, "da 8,90 €", CTA → `/richiesta`), `Annunci` (aria-live), `useLinkCondiviso`.
- `useTrascina.ts`, DnD **fatto a mano con pointer events** (nessuna dipendenza): mouse/penna trascinano con ghost via transform; touch = tocca piatto → tocca casella (lo scroll resta libero); tastiera Invio/frecce/Esc/Canc. Un solo percorso "piazza" condiviso fra tap e tastiera. Da slot al banco o fuori = rimuovi.

### Fase 3 — Richieste salvate
- `lib/richieste/`: `tipi.ts` (`Richiesta`, `StatoRichiesta` nuova|contattata|chiusa|persa, `RepositoryRichieste` async), `locale.ts` (`fuellab.richieste.v1`, seed solo al primo accesso), `seed.ts` (~12 richieste relative a oggi), `statistiche.ts` (kpi settimana Europe/Rome, produzione per piatto Lunedì/Giovedì solo richieste aperte, top piatti, mix allenamenti), `index.ts` (`getRepository()` da `NEXT_PUBLIC_DATA_BACKEND`), `useRichieste.ts`.
- `/richiesta`: split in `components/richiesta/{Modulo,Riepilogo,Campo}`; al submit salva (try/catch, non blocca mai) poi apre WhatsApp; se manca il numero la richiesta resta salvata e lo si dice.

### Fase 4 — Dashboard demo di Matteo
- `app/dashboard/layout.tsx` (noindex) + `app/robots.ts` (disallow `/dashboard`); `Cancello` con PIN demo (`NEXT_PUBLIC_DEMO_PIN`, dichiarato come non-sicurezza).
- `/dashboard`: 4 KPI + elenco richieste filtrabile con cambio stato; `/dashboard/richieste/[id]`: contatto, settimana in sola lettura con allenamenti, macro, note interne, "Scrivi su WhatsApp"; `/dashboard/produzione`: porzioni per piatto per Lunedì/Giovedì, stampabile; barre CSS, niente librerie grafici.
- Backend reale (Supabase + `proxy.ts`) escluso da questo giro; l'interfaccia è pronta.

### Fase 5 — Test e verifica
- Nuovi vitest: `autofill`, `settimana` (sposta/scambia/pota), `riepilogo` + `pricing`, `condivisione` (round-trip `a`, link vecchi), `richieste/locale`, `richieste/statistiche`, `whatsapp` (righe allenamento).
- Ordine: `npx tsc --noEmit` → `npm run lint` → `npm test` → `npx next build` → `npx next start -p 4311` + `node scripts/verifica.mjs --scatti` (aggiornato con `/dashboard`, `/dashboard/produzione` e un controllo del compositore; il controllo contrasti resta, ancora più utile con le sezioni scure).
- Manuale a 390px e 1440px: trascina dal banco, scambio tra caselle, rimozione; tap su telefono con scroll funzionante; solo tastiera; link condiviso; richiesta → compare in dashboard → cambio stato → produzione; due schede sincronizzate; nessun warning di hydration. Poi deploy di anteprima su Vercel.

## Rischi / da chiedere a Matteo
- Con 6 piatti l'autoriempimento ripete (max 3/settimana): copy "il menu cambia ogni settimana". I piatti cotti il lunedì vanno serviti solo a inizio settimana?
- La dashboard localStorage vede solo le richieste di quel browser + seed: va detto chiaramente.
- Le foto restano stock finché non arrivano scatti veri (un solo file da cambiare).
