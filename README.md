# FUEL LAB — demo

Sito dimostrativo per **Matteo Pantanè**, cuoco a Pescara: meal prep **fresco, mai surgelato**,
consegnato in zona due volte a settimana, componibile a mano o a partire dalla scheda del
nutrizionista.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4. **Nessun backend: tutto gira nel
browser.** Il contatto finale non è un pagamento, è un messaggio su WhatsApp già scritto.

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
| `/` | Home: hero col timbro, fascia fiducia, come funziona, teaser del configuratore |
| `/menu` | Il catalogo diviso in **primi**, **secondi** ed extra, con filtri e ordinamenti |
| `/settimana` | La griglia LUN→DOM × pranzo/cena: si compone la settimana e i macro si sommano |
| `/servizi` | I tre servizi: menu della settimana, piano sui tuoi macro, home cooking |
| `/scheda` | Si carica la scheda del nutrizionista → macro modificabili → **il matcher compone** |
| `/richiesta` | Il modulo che diventa il messaggio WhatsApp |
| `/come-funziona` | Il servizio, il fresco contro il surgelato, le FAQ |
| `/chi-e-matteo` | La storia, i numeri, cosa FUEL LAB non è |

## Cosa è vero e cosa è scenografia

Il punto di questa demo è che le parti che il cliente deve poter provare **funzionano davvero**.
Quelle che richiedono un backend sono dichiarate qui invece di essere nascoste.

**Vero:**

- **Il catalogo.** 27 primi, 27 secondi e 8 extra costruiti a mano, con allergeni per Reg. UE
  1169/2011. I macro rispettano l'identità di Atwater: `kcal === P*4 + C*4 + G*9`, verificata dai test.
- **Il matcher.** Algoritmo reale (goloso più scambi locali) che compone i pasti sui macro
  obiettivo. Calibrato: su 729 abbinamenti la media è 562,3 kcal contro un bersaglio di 560.
- **La griglia settimanale.** Le scelte si salvano in `localStorage` e sopravvivono al ricaricamento.
  Due schede aperte restano sincronizzate.
- **Il link da mandare al nutrizionista.** La settimana viene codificata nella query string, senza
  server. Porta con sé un'impronta del catalogo: un link nato da un menu diverso viene **rifiutato**
  invece di essere decodificato in piatti sbagliati.
- **Il messaggio WhatsApp.** Composto per intero dai dati inseriti, con un solo saluto e una sola
  domanda di chiusura qualunque sia il servizio di partenza.

**Scenografia:**

- **Il caricamento della scheda del nutrizionista.** Il file non viene letto né interpretato: non
  c'è OCR e non c'è parsing. L'animazione di caricamento è teatro; i macro che compaiono sono
  modificabili a mano ed è da lì che parte il matcher, che invece è vero.
- **Le foto dei piatti.** Sono Unsplash, vanno sostituite con scatti veri.
- **Alcuni testi editoriali** sono segnaposto, segnalati da un commento nel sorgente.

**Non c'è ancora:**

- **La dashboard di Matteo** (chi ha scritto, numeri di telefono, storico). È la Fase B: richiede
  database e autenticazione, e non è stata pianificata in questo giro.
- **Il numero WhatsApp.** Vedi sotto.

## Il numero WhatsApp

Va nella variabile d'ambiente `NEXT_PUBLIC_WHATSAPP`.

Finché è vuota, i bottoni WhatsApp restano **disabilitati con una spiegazione**: mai un link a
`wa.me/` senza numero, perché un mezzo link sembra funzionante finché non ci si clicca sopra.
Questo è il caso normale della demo, non un caso limite.

```bash
# in locale
echo "NEXT_PUBLIC_WHATSAPP=39XXXXXXXXXX" >> .env.local
```

## Test

```bash
npx vitest run        # 102 test sul dominio: catalogo, piano, matcher, link, messaggio
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
- [ ] **La dashboard** (Fase B): decidere se serve davvero un pannello o se basta che i messaggi
      WhatsApp arrivino ordinati
