# FUEL — demo

Sito dimostrativo per **Matteo Pantanè**, cuoco a Pescara: meal prep **fresco, mai surgelato**,
consegnato in zona due volte a settimana, componibile a mano o a partire dalla scheda del nutrizionista.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4. Nessun backend: tutto gira nel browser.

## Avvio

```bash
npm install
npm run dev          # http://localhost:3000
```

Per provarla come sarà in produzione:

```bash
npm run build && npm start
```

## Le pagine

| Rotta | Cosa fa |
|---|---|
| `/` | Home: hero, fascia fiducia, come funziona, menu della settimana, teaser configuratore |
| `/menu` | I 27 piatti con filtri veri per obiettivo, tipo, giorno di cottura e ordinamento |
| `/box` | Taglia (6/10/15/20), formula singola o abbonamento, riepilogo macro e conto |
| `/scheda` | Carica la scheda → macro modificabili → **il matcher compone il box** |
| `/checkout` | Dati, CAP della zona servita, slot di consegna, conferma |
| `/come-funziona` | Il servizio, fresco contro surgelato, FAQ |
| `/chi-e-matteo` | Il cuoco: è il differenziatore "locale, non nazionale" |

## Cosa è vero e cosa è finto

Questa distinzione conta, perché la demo non deve promettere cose che il sito non fa.

**Finto, e dichiarato in pagina:**
- Il **caricamento della scheda**. Senza backend un PDF non si può leggere: l'animazione di
  lettura è scenografia, e i macro che compaiono sono una scheda tipo da correggere a mano.
  La pagina lo dice esplicitamente, in due punti.
- Il **checkout**. Nessun pagamento, nessun ordine registrato, nessun dato che lascia il browser.

**Vero, e funziona davvero:**
- Il **matcher** (`lib/matcher.ts`). Costruzione greedy con proiezione sul totale, poi passate di
  scambi locali, con pesi diversi per macro: le proteine pesano 1,6 perché sono il vincolo che un
  atleta controlla davvero, i grassi 0,7 perché nelle schede hanno la tolleranza più ampia.
  Sul fabbisogno tipo chiude entro il **2,2%** su tutti e quattro i macro.
- I **filtri** del menu, il **carrello** (persiste in `localStorage`, si sincronizza fra schede),
  i **prezzi**, la **validazione del CAP** sulla zona servita.

## Due decisioni di modello che vale la pena conoscere

**Il prezzo lo decide la taglia del box, non il piatto.** Così il salmone non costa più del pollo
e nessuno finisce a ottimizzare il carrello invece della dieta. È il motivo per cui i piatti in
`lib/dishes.ts` non hanno un prezzo proprio.

**Ogni schiscetta copre un quarto della giornata** (`quotaCoperta` in `lib/matcher.ts`).
Non è un numero tondo scelto per eleganza: con il fabbisogno tipo chiede a ogni piatto 560 kcal
e 45/62/16 g, mentre la media reale dei 27 piatti è 562 kcal e 44/61/16 g. Bersaglio e catalogo
hanno lo stesso baricentro, quindi il matcher può davvero centrarlo.
**Se il catalogo cambia verso porzioni più grandi o più piccole, questa costante va rifatta insieme a lui.**

## Limite noto

Un fabbisogno da **3.000 kcal al giorno su 3 pasti** chiede 750 kcal e 90 g di carboidrati a
schiscetta, mentre il piatto più carico del catalogo ne ha 648 e 84. È fuori portata per
costruzione, non un difetto dell'algoritmo: nessuna porzione fresca da 500 g ci arriva.
Il sito **lo dichiara** invece di consegnare in silenzio un box corto — ed è il comportamento
giusto. Per servire davvero quel profilo servirebbero porzioni maggiorate (taglia L), che oggi
non esistono nel modello.

## Da rivedere con il cliente

- **Testi**: sono segnaposto credibili, non approvati. In particolare il racconto in `/chi-e-matteo`.
- **Foto**: tutte da Unsplash, segnaposto. Servono scatti veri dei piatti di Matteo — è il
  materiale che regge metà del sito.
- **Prezzi**: 10,90 → 8,90 € a pasto secondo la taglia, −15% con l'abbonamento. Numeri plausibili,
  da confermare sui costi reali.
- **Zona servita**: la validazione accetta i CAP di Pescara e provincia. Da verificare contro
  l'area che il furgone copre davvero.
- **Menu**: 27 piatti con macro coerenti (`kcal = P·4 + C·4 + G·9` su ogni riga), ma inventati.
  Vanno sostituiti con le ricette e i valori reali.

## Struttura

```
app/            una cartella per rotta; i client component sono file separati
                cosi ogni page.tsx puo restare server e esportare metadata
components/     Nav, Footer, DishCard, MacroBar, Ticker, Reveal, ui
  home/         componenti solo della home
lib/
  dishes.ts     il catalogo
  matcher.ts    l'algoritmo che compone il box
  cart.tsx      carrello su useSyncExternalStore (niente mismatch di idratazione)
  pricing.ts    taglie, sconti, consegna
  types.ts      il modello dati
```

## Note di design

Direzione visiva **"Bosco Elettrico"**: verde bosco e lime elettrico, Anton per il display,
Martian Mono per ogni numero, griglia deliberatamente rotta.
Il tema è **bloccato scuro**: è identità di marca, non una preferenza, quindi non c'è light mode.

Una regola di forma attraversa tutto (`app/globals.css`): gli elementi interattivi sono pill piene,
i contenitori hanno guscio da 26px e nucleo da 18px — la differenza è il padding, così le curve
restano concentriche.

Le barre macro hanno la **tacca del target** alla stessa altezza su ogni riga. Senza quella, una
barra all'88% e una al 99% sembrano entrambe "piena" e il pannello smette di raccontare lo scarto
dal piano, diventando un punteggio.
