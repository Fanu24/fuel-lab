# FUEL LAB — demo

Sito dimostrativo per **Matteo Pantanè**, cuoco a Pescara: meal prep **fresco, mai surgelato**,
consegnato in zona due volte a settimana, componibile a mano o a partire dalla scheda del
nutrizionista.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4. **Nessun backend: tutto gira nel
browser.** Il contatto finale non è un pagamento, è un messaggio su WhatsApp già scritto.

**Online:** <https://fuel-lab-cyan.vercel.app>

Verificato sul sito pubblicato, non solo in locale: 4489 nodi di testo misurati su 16
caricamenti, zero violazioni di contrasto.

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
| `/` | Home: hero con l'atleta, tre passi, i consigli cardio/pesi, i piatti, chiusura |
| `/menu` | I sei piatti con un filtro solo (Tutti / Cardio / Pesi) e gli alimenti per la box |
| `/menu/[id]` | La scheda del piatto: ingredienti con i grammi, macro, perché funziona, allergeni |
| `/settimana` | **Il compositore**: scegli come ti alleni giorno per giorno, la settimana si riempie, poi la sistemi trascinando |
| `/scheda` | Dai tuoi macro: scrivi i numeri del nutrizionista, il matcher compone, apri nel compositore |
| `/richiesta` | Il modulo: salva la richiesta e apre WhatsApp col messaggio già scritto |
| `/servizi`, `/come-funziona`, `/chi-e-matteo` | Pagine di contenuto, brevi |
| `/dashboard` | **Il pannello di Matteo** (demo): richieste, stato, numeri della settimana |
| `/dashboard/richieste/[id]` | Il dettaglio di una richiesta: contatto, settimana con gli allenamenti, note interne |
| `/dashboard/produzione` | Quante porzioni cucinare il lunedì e il giovedì, stampabile |

## Il compositore

Tre modi di mettere un piatto in una casella, un solo stato (`components/compositore/useTrascina.ts`):

- **mouse**: si trascina dal banco alla casella, da una casella all'altra (sposta o scambia), da una
  casella al banco (toglie);
- **dito**: si tocca il piatto e poi la casella (o prima la casella vuota e poi il piatto). Niente
  trascinamento su touch, apposta: il dito serve anche a scorrere;
- **tastiera**: Invio prende, Invio posa, Esc annulla, Canc toglie. Ogni passo è annunciato agli screen reader.

L'autoriempimento (`lib/autofill.ts`) segue i consigli di Matteo: cardio → più carboidrati, pesi →
proteine e carboidrati misurati, riposo → più leggero. Mai lo stesso piatto due volte nello stesso
giorno, al massimo tre volte a settimana.

Il prezzo non compare: il committente vuole solo la soglia "da 8,90 € a pasto". La stima completa
c'è già (`lib/riepilogo.ts`) e si accende con `MOSTRA_STIMA_PREZZO` in `lib/pricing.ts`.

## Cosa è vero e cosa è demo

**Vero:** catalogo con allergeni e macro coerenti (`kcal = P*4 + C*4 + G*9`, verificata dai test),
matcher, autoriempimento, compositore, link da mandare al nutrizionista (porta anche gli allenamenti),
messaggio WhatsApp.

**Demo:**

- **La dashboard** legge le richieste dal `localStorage` di quel browser, più 12 richieste d'esempio.
  Tutto passa da un'interfaccia (`lib/richieste/tipi.ts`, `RepositoryRichieste`): per il backend vero
  si aggiunge un'implementazione Supabase in `lib/richieste/` e `NEXT_PUBLIC_DATA_BACKEND` la accende,
  senza toccare le pagine. A quel punto il controllo d'accesso va sul server (`proxy.ts`).
- **Il PIN** del pannello (`NEXT_PUBLIC_DEMO_PIN`, predefinito `1234`) **non è sicurezza**: sta nel
  codice del browser. Serve solo a separare il pannello dal sito. Niente dati veri di clienti finché
  non c'è il backend.
- **Le foto** sono Unsplash scelte a mano. Si cambiano tutte da `lib/immagini/index.ts` (foto del sito)
  e dal campo `img` in `lib/catalogo.ts` (piatti); un percorso locale in `/public` al posto dell'id
  funziona senza toccare altro. Il ritratto di Matteo va in `RITRATTO_MATTEO`.

## Il numero WhatsApp

Va nella variabile d'ambiente `NEXT_PUBLIC_WHATSAPP`.

Finché è vuota, i bottoni WhatsApp restano **disabilitati con una spiegazione**: mai un link a
`wa.me/` senza numero, perché un mezzo link sembra funzionante finché non ci si clicca sopra.
Questo è il caso normale della demo, non un caso limite.

```bash
# in locale
echo "NEXT_PUBLIC_WHATSAPP=39XXXXXXXXXX" >> .env.local

# in produzione, quando arriva il numero di Matteo
vercel env add NEXT_PUBLIC_WHATSAPP
vercel --prod
```

## Test

```bash
npx vitest run        # 180 test: catalogo, piano, autofill, riepilogo, link, messaggio, richieste
npx tsc --noEmit
npx eslint app components lib
```

Il controllo che conta di più però non è nella suite: `scripts/verifica.mjs` apre un Chrome vero,
percorre tutte le rotte e **calcola il contrasto di ogni nodo di testo sul rendering reale**,
risalendo gli antenati per trovare il fondo effettivo e fondendo i colori semitrasparenti.

Serve perché questo sito è nato con il fondo scuro ed è stato portato su fondo chiaro: decine di
colori scelti per il buio erano rimasti dov'erano. Il lime del marchio e la carta hanno **luminanza
identica** — 1,00:1 — quindi il lime può fare da fondo, mai da testo. Cercare i colori sospetti a
mano ha fallito cinque volte; misurarli tutti no.

```bash
npm run build && npx next start -p 4311 &
node scripts/verifica.mjs
```

## Da rivedere con Matteo

- [ ] **Il numero WhatsApp**, che ancora manca
- [ ] **Le foto**: sostituire le Unsplash con scatti veri dei piatti
- [ ] **I testi segnaposto**, in particolare la storia e i numeri di `/chi-e-matteo`
- [ ] **La soglia di 8,90 €** a pasto: confermare o cambiare
- [ ] **Il logo vettoriale** con la tagline giusta, al posto del ritaglio provvisorio
- [ ] **Il raggio di consegna**: le pagine dicono "Pescara e provincia, entro venti
      chilometri". Da confermare, perche e scritto nella copy in piu punti
- [ ] **La dashboard**: la demo c'è; per usarla davvero serve il backend (Supabase) e una privacy policy
- [ ] **I piatti cucinati il lunedì** vanno serviti solo a inizio settimana? L'autoriempimento oggi non lo considera
- [ ] **Il ritratto di Matteo** e una foto vera della cucina
