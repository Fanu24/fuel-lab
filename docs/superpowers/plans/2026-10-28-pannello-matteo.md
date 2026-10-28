# Pannello di Matteo semplicissimo — piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rifare `/admin` come app per il telefono di Matteo: il suo foglio di carta (chi mangia cosa, giorno per giorno), gli ordini nuovi dal sito con WhatsApp e Chiama, le etichette belle in PDF, "Altro" con guadagni, codici sconto, rubrica e piatti del sito, le notifiche push e la guida per installare l'app.

**Architecture:**
- Due tabelle nuove in D1: `clienti_matteo` (la rubrica) e `pasti` (una riga per pasto, con data vera). Sono la fonte della settimana, delle etichette e dei guadagni.
- Gli ordini del sito restano in `orders`. Quando Matteo li accetta, o quando una conversione automatica e idempotente trova un ordine confermato non ancora portato, diventano righe di `pasti` (flag `orders.in_settimana`).
- La logica pura sta in `lib/pannello.ts`, quella su D1 in `lib/server/pannello.ts`. Le API sono Pages Functions sotto `/api/admin/`.
- L'interfaccia è un insieme di componenti client in `components/pannello/`, montati da `app/admin/page.tsx` dentro l'`AdminAccess` che esiste già.
- Le notifiche sono Web Push con VAPID, cifrate aes128gcm con sola WebCrypto. Le etichette sono disegnate su canvas a 300 dpi e impacchettate in PDF con `pdf-lib`.

**Tech Stack:** Next.js 16.3.3 (`output: "export"`), React 19, Cloudflare Pages Functions + D1, WebCrypto, Vitest su Node 24 (`node:sqlite`), `pdf-lib@1.17.1`.

**Spec:** `docs/superpowers/specs/2026-10-28-pannello-matteo-semplice-design.md`. I mockup approvati sono in `.superpowers/brainstorm/109018-1793209060/content/` (`schermata-a-dettagli.html`, `etichetta-a-e-altro.html`, `aggiungi-cliente.html` opzione B, `piatto-libero.html`).

## Global Constraints

- **Questo piano parte dopo `docs/superpowers/plans/2026-10-28-correzioni-sito-prova-consegne.md`**: i test e i tipi qui sotto danno per scontato che `SceltaAbbonamento` non abbia più `trial`.
- **Niente deploy e niente migrazioni `--remote` senza una richiesta esplicita dell'utente.** Le migrazioni vanno applicate prima del codice, dopo un backup `wrangler d1 export fuelchef --remote`.
- Prima di scrivere codice Next leggere la guida pertinente in `node_modules/next/dist/docs/` (`AGENTS.md`). Il sito è statico (`output: "export"`): niente Server Actions, niente route handler Next, niente `cookies()`. Tutti i dati passano dalle Pages Functions.
- Testi in italiano con gli accenti giusti.
- Nel pannello: testo base di almeno 17 px, aree da toccare di almeno 48 px, una sola azione principale per schermata.
- Colori del pannello: fondo `#f3efe6`, verde scuro `#18352a`, riquadri bianchi, rosso degli ordini nuovi `#c0392b`, WhatsApp `#25d366`.
- Solo pranzo e cena: la colazione non esiste nel pannello.
- Il prezzo a pasto è sempre facoltativo; l'unico campo obbligatorio di un cliente è il nome.
- Il pannello non chiede né mostra mai come è stato pagato qualcosa.
- Etichetta: 70 × 42,3 mm, 21 per A4 (3 × 7), logo grande in alto a sinistra, "GIORNO NN / PASTO" in alto a destra, nome grande (Oxanium 800 maiuscolo), piatto (Archivo 600), in fondo `Preparato il GG/MM/AAAA` (data in Martian Mono). Niente allergeni e niente "consumare entro".
- "Preparato il" è la data in cui si stampa (`oggiRoma()`), non il giorno del pasto.
- Gli ordini esistenti e l'area cliente `/account` devono continuare a funzionare.
- Ogni task si chiude con `npm test`, `npx tsc --noEmit` e `npm run lint` verdi. I task di interfaccia anche con `npm run build`.

## Review Focus

1. **Accetta a metà.** Il PATCH di conferma va a buon fine, ma la chiamata che mette l'ordine nella settimana fallisce (rete). L'ordine deve comparire comunque nella settimana al caricamento successivo, e l'interfaccia non deve invitare Matteo ad accettarlo di nuovo. Test nel Task 3 (`convertiOrdiniAperti` prende un ordine confermato con `in_settimana = 0`) e comportamento nel Task 8.
2. **Testi lunghi sulle etichette.** Nomi lunghi ("Maria Francesca") e piatti scritti a mano lunghi ("Pasta integrale, tonno, pomodorini, olive e capperi 200 g") devono stare nell'etichetta: il nome si rimpicciolisce fino a 4 mm, il piatto va a capo su massimo 2 righe con "…". Test nel Task 10.
3. **Confini di settimana e cambio dell'ora.** La domenica 25/10/2026, quando finisce l'ora legale, appartiene alla settimana che comincia lunedì 19/10. Le date non devono slittare di un giorno. Test nel Task 2.
4. **Notifica che fallisce.** Chiavi VAPID assenti, `fetch` che lancia, iscrizione scaduta (404/410): l'ordine del cliente si crea comunque. L'iscrizione scaduta si cancella. Test nel Task 6.
5. **Numeri di telefono scritti in modi diversi.** `+39 347 123 4567`, `0039 347…`, `347-1234567`, vuoto: i link WhatsApp e Chiama sono giusti, oppure nascosti se il numero manca. Test nel Task 2.

---

### Task 0: Checkpoint del codice che oggi è online ma non in git

**Files:** tutto ciò che `git status` mostra come modificato o non tracciato (`.superpowers/` è già ignorato).

Se il Task 0 del piano delle correzioni al sito è già stato fatto, questo task si salta.

- [ ] **Step 1:** Run `npm test` e `npx tsc --noEmit`; annotare nel messaggio di commit se qualcosa è già rosso (non correggerlo qui).
- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: checkpoint del pannello /admin, delle migrazioni 0007-0009 e dei lavori in corso, cosi' com'e' online"
```

### Task 1: Migrazione 0010 e banco di prova D1

**Files:**
- Create: `migrations/0010_pannello_semplice.sql`
- Create: `lib/server/d1-prova.ts` (helper dei test; Vitest esegue solo i `*.test.ts`)
- Test: `lib/server/migrazione-pannello.test.ts`

**Interfaces:**
- Produces: le tabelle `clienti_matteo`, `pasti`, `push_iscrizioni` e la colonna `orders.in_settimana`, come sotto.
- Produces: `creaD1Prova(): { sqlite: DatabaseSync; env: Env; chiudi: () => void }`. Applica tutte le migrazioni e inserisce l'utente `matteo` (`info@fuelchef.it`, ruolo admin in `staff_roles`) e l'utente cliente `cliente1` (`cliente1@test.local`). `env.DB` implementa `prepare().bind().first/run/all` e `batch` (transazione, rollback su errore), come il finto D1 di `lib/server/ordini-manuali-route.test.ts`, più `all: async () => ({ results: rows })`.

- [ ] **Step 1: Write the failing test**

```ts
it("la rubrica, i pasti e le iscrizioni push esistono con i vincoli giusti", () => {
  const { sqlite, chiudi } = creaD1Prova();
  sqlite.exec("INSERT INTO clienti_matteo(id,nome) VALUES ('c1','Paolo')");
  sqlite.exec("INSERT INTO pasti(id,cliente_id,data,pasto,piatto) VALUES ('p1','c1','2026-10-28','pranzo','Pollo al curry')");
  expect(() => sqlite.exec("INSERT INTO pasti(id,cliente_id,data,pasto,piatto) VALUES ('p2','c1','2026-10-28','pranzo','Altro')")).toThrow(); // UNIQUE(cliente_id,data,pasto)
  expect(() => sqlite.exec("INSERT INTO pasti(id,cliente_id,data,pasto,piatto) VALUES ('p3','c1','2026-10-28','colazione','X')")).toThrow();
  expect(() => sqlite.exec("INSERT INTO clienti_matteo(id,nome) VALUES ('c2','  ')")).toThrow();
  expect(sqlite.prepare("SELECT porzioni, prezzo_cents FROM pasti WHERE id='p1'").get()).toEqual({ porzioni: 1, prezzo_cents: null });
  expect(sqlite.prepare("SELECT in_settimana FROM orders LIMIT 0").all()).toEqual([]);
  chiudi();
});
```

- [ ] **Step 2:** Run `npx vitest run lib/server/migrazione-pannello.test.ts`. Expected: FAIL (`creaD1Prova` non esiste).
- [ ] **Step 3: Write `migrations/0010_pannello_semplice.sql`**

```sql
-- La rubrica di Matteo: clienti del suo foglio e clienti del sito accettati.
CREATE TABLE IF NOT EXISTS clienti_matteo (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL CHECK(length(trim(nome)) BETWEEN 1 AND 100),
  telefono TEXT NOT NULL DEFAULT '' CHECK(length(telefono) <= 40),
  indirizzo TEXT NOT NULL DEFAULT '' CHECK(length(indirizzo) <= 240),
  prezzo_pasto_cents INTEGER CHECK(prezzo_pasto_cents IS NULL OR prezzo_pasto_cents BETWEEN 0 AND 100000),
  user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS clienti_matteo_utente ON clienti_matteo(user_id) WHERE user_id IS NOT NULL;

-- Una riga per pasto, con la data vera. 'evento' = cuoco a domicilio: compare nel giorno, senza etichetta.
CREATE TABLE IF NOT EXISTS pasti (
  id TEXT PRIMARY KEY,
  cliente_id TEXT NOT NULL REFERENCES clienti_matteo(id) ON DELETE CASCADE,
  data TEXT NOT NULL CHECK(data GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  pasto TEXT NOT NULL CHECK(pasto IN ('pranzo','cena','evento')),
  piatto TEXT NOT NULL CHECK(length(trim(piatto)) BETWEEN 1 AND 200),
  piatto_id TEXT,
  porzioni INTEGER NOT NULL DEFAULT 1 CHECK(porzioni BETWEEN 1 AND 20),
  -- Prezzo di una porzione quando il pasto e' entrato: cambiare il prezzo del cliente non riscrive i mesi passati.
  prezzo_cents INTEGER CHECK(prezzo_cents IS NULL OR prezzo_cents BETWEEN 0 AND 1000000),
  ordine_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(cliente_id, data, pasto)
);
CREATE INDEX IF NOT EXISTS pasti_data ON pasti(data);
CREATE INDEX IF NOT EXISTS pasti_ordine ON pasti(ordine_id);

-- 1 quando l'ordine e' gia' stato portato nella settimana (accettato o convertito).
ALTER TABLE orders ADD COLUMN in_settimana INTEGER NOT NULL DEFAULT 0 CHECK(in_settimana IN (0, 1));

CREATE TABLE IF NOT EXISTS push_iscrizioni (
  endpoint TEXT PRIMARY KEY CHECK(length(endpoint) BETWEEN 10 AND 1000),
  p256dh TEXT NOT NULL CHECK(length(p256dh) BETWEEN 80 AND 100),
  auth TEXT NOT NULL CHECK(length(auth) BETWEEN 16 AND 30),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

- [ ] **Step 4: Implement `creaD1Prova` in `lib/server/d1-prova.ts`**, then run `npx vitest run lib/server/migrazione-pannello.test.ts`. Expected: PASS. Run `npm test`. Expected: tutto verde (le migrazioni si applicano anche nei test esistenti).
- [ ] **Step 5: Commit**

```bash
git add migrations/0010_pannello_semplice.sql lib/server/d1-prova.ts lib/server/migrazione-pannello.test.ts
git commit -m "feat(pannello): rubrica di Matteo, pasti con data vera, iscrizioni push"
```

### Task 2: Logica pura del pannello

**Files:**
- Create: `lib/pannello.ts`
- Test: `lib/pannello.test.ts`

**Interfaces:**
- Consumes: `Ordine`, `VoceOrdine` da `lib/api.ts`; `giornoDelPiano`, `spostaGiorni`, `isData` da `lib/produzione.ts`; `getFormula` da `lib/abbonamento.ts`; `getPiatto` da `lib/catalogo.ts`.
- Produces (tipi):

```ts
export type PastoPannello = "pranzo" | "cena" | "evento";
export type ClienteMatteo = { id: string; nome: string; telefono: string; indirizzo: string; prezzoPastoCents: number | null; userId: string | null; ultimoPasto: string | null };
export type DatiCliente = { nome: string; telefono: string; indirizzo: string; prezzoPastoCents: number | null };
export type PastoSettimana = { id: string; clienteId: string; data: string; pasto: PastoPannello; piatto: string; piattoId: string | null; porzioni: number; prezzoCents: number | null; ordineId: string | null };
export type NuovoPasto = { clienteId: string; data: string; pasto: "pranzo" | "cena"; piatto: string; piattoId: string | null; porzioni: number };
export type RigaDaOrdine = Omit<PastoSettimana, "id" | "clienteId">;
export type Guadagni = { cents: number; pasti: number; clienti: number };
export type DatiPannello = { clienti: ClienteMatteo[]; pasti: PastoSettimana[]; nuovi: Ordine[]; recenti: Record<string, string[]> };
export type RigaGiorno = { pasto: PastoSettimana; cliente: ClienteMatteo };
export type EtichettaPannello = { chiave: string; cliente: string; piatto: string; giorno: string; pasto: "Pranzo" | "Cena" };
```

- Produces (funzioni):
  - `lunediDi(data: string): string`
  - `giorniDellaSettimana(lunedi: string): string[]` (7 date)
  - `nomeGiorno(data: string): string` ("Mercoledì 28")
  - `nomeGiornoCorto(data: string): { sigla: string; numero: string }` ({ sigla: "Mer", numero: "28" })
  - `pastiDaOrdine(o: Pick<Ordine, "id" | "service" | "items" | "meals">, inizio: string, prezzoPastoCents: number | null, oggi: string): RigaDaOrdine[]`
  - `prezzoPastoProposto(o: Pick<Ordine, "service" | "price_cents" | "meals" | "subscription">): number | null`
  - `pastiDelGiorno(pasti: PastoSettimana[], clienti: ClienteMatteo[], data: string): { pranzo: RigaGiorno[]; cena: RigaGiorno[]; evento: RigaGiorno[] }`
  - `etichetteDelGiorno(pasti: PastoSettimana[], clienti: ClienteMatteo[], data: string): EtichettaPannello[]`
  - `numeroInternazionale(telefono: string): string | null`
  - `linkWhatsAppCliente(telefono: string, nome: string): string | null`
  - `linkChiama(telefono: string): string | null`
  - `meseDi(data: string): string` ("2026-10")
  - `mesePrima(mese: string): string`

- [ ] **Step 1: Write the failing tests** in `lib/pannello.test.ts`

```ts
it("la settimana comincia di lunedì, anche quando finisce l'ora legale", () => {
  expect(lunediDi("2026-10-25")).toBe("2026-10-19"); // domenica, cambio dell'ora
  expect(lunediDi("2026-10-26")).toBe("2026-10-26");
  expect(lunediDi("2026-10-28")).toBe("2026-10-26");
  expect(giorniDellaSettimana("2026-10-26")).toEqual(["2026-10-26","2026-10-27","2026-10-28","2026-10-29","2026-10-30","2026-10-31","2026-11-01"]);
  expect(nomeGiorno("2026-10-28")).toBe("Mercoledì 28");
  expect(nomeGiornoCorto("2026-11-01")).toEqual({ sigla: "Dom", numero: "1" });
});

it("un menu della settimana accettato finisce nei giorni giusti da quando parte", () => {
  const o = { id: "o1", service: "menu-settimana" as const, meals: 3, items: [
    { id: "pollo-curry-riso-carote", name: "Pollo al curry, basmati e carote", day: "gio", meal: "pranzo", extras: [] },
    { id: "frittata-verdure-campo", name: "Frittata di verdure di campo", day: "lun", meal: "cena", extras: ["Pane integrale"] },
    { id: "pollo-curry-riso-carote", name: "Pollo al curry, basmati e carote", day: "mar", meal: "pranzo", extras: [] },
  ] };
  expect(pastiDaOrdine(o, "2026-10-29", 800, "2026-10-28")).toEqual([
    { data: "2026-10-29", pasto: "pranzo", piatto: "Pollo al curry, basmati e carote", piattoId: "pollo-curry-riso-carote", porzioni: 1, prezzoCents: 800, ordineId: "o1" },
    { data: "2026-11-02", pasto: "cena", piatto: "Frittata di verdure di campo + Pane integrale", piattoId: "frittata-verdure-campo", porzioni: 1, prezzoCents: 800, ordineId: "o1" },
    { data: "2026-11-03", pasto: "pranzo", piatto: "Pollo al curry, basmati e carote", piattoId: "pollo-curry-riso-carote", porzioni: 1, prezzoCents: 800, ordineId: "o1" },
  ]);
  // i pasti di date gia' passate non si mettono
  expect(pastiDaOrdine(o, "2026-10-20", null, "2026-10-28").map((r) => r.data)).toEqual(["2026-10-29"]);
});

it("abbonamento: nessun pasto, li mette Matteo; cuoco a domicilio: una riga evento", () => {
  expect(pastiDaOrdine({ id: "a", service: "abbonamento", items: [], meals: 0 }, "2026-11-02", 800, "2026-10-28")).toEqual([]);
  expect(pastiDaOrdine({ id: "h", service: "home-cooking", items: [], meals: 4 }, "2026-11-07", 2500, "2026-10-28")).toEqual([
    { data: "2026-11-07", pasto: "evento", piatto: "Cuoco a domicilio · 4 porzioni", piattoId: null, porzioni: 1, prezzoCents: 10000, ordineId: "h" },
  ]);
});

it("il prezzo a pasto si propone solo quando si può ricavare", () => {
  expect(prezzoPastoProposto({ service: "abbonamento", price_cents: 52000, meals: 0, subscription: { plan: "completo", tier: "standard", household: "singolo" } })).toBe(800);
  expect(prezzoPastoProposto({ service: "abbonamento", price_cents: 90000, meals: 0, subscription: { plan: "completo", tier: "standard", household: "coppia" } })).toBeNull();
  expect(prezzoPastoProposto({ service: "menu-settimana", price_cents: 5400, meals: 6, subscription: null })).toBe(900);
  expect(prezzoPastoProposto({ service: "menu-settimana", price_cents: null, meals: 6, subscription: null })).toBeNull();
});

it("le etichette del giorno: una per porzione, prima il pranzo, clienti in ordine di nome, niente eventi", () => {
  const clienti = [cliente("c1", "Paolo"), cliente("c2", "Giulia")];
  const pasti = [
    pasto("p1", "c1", "2026-10-28", "cena", "Pollo, peperoni e anacardi", 1),
    pasto("p2", "c1", "2026-10-28", "pranzo", "Pollo al curry", 2),
    pasto("p3", "c2", "2026-10-28", "pranzo", "Frittata", 1),
    pasto("p4", "c2", "2026-10-28", "evento", "Cuoco a domicilio · 4 porzioni", 1),
    pasto("p5", "c2", "2026-10-29", "pranzo", "Altro giorno", 1),
  ];
  expect(etichetteDelGiorno(pasti, clienti, "2026-10-28").map((e) => [e.cliente, e.pasto, e.piatto, e.giorno])).toEqual([
    ["Giulia", "Pranzo", "Frittata", "Mercoledì 28"],
    ["Paolo", "Pranzo", "Pollo al curry", "Mercoledì 28"],
    ["Paolo", "Pranzo", "Pollo al curry", "Mercoledì 28"],
    ["Paolo", "Cena", "Pollo, peperoni e anacardi", "Mercoledì 28"],
  ]);
});

it("i numeri di telefono diventano link giusti, o nessun link", () => {
  for (const t of ["+39 347 123 4567", "0039 347 1234567", "347-1234567", "3471234567"]) expect(numeroInternazionale(t)).toBe("393471234567");
  expect(numeroInternazionale("")).toBeNull();
  expect(numeroInternazionale("abc")).toBeNull();
  expect(linkChiama("347 1234567")).toBe("tel:+393471234567");
  expect(linkWhatsAppCliente("347 1234567", "Paolo")).toBe(`https://wa.me/393471234567?text=${encodeURIComponent("Ciao Paolo, sono Matteo di FUEL LAB.")}`);
  expect(linkWhatsAppCliente("", "Paolo")).toBeNull();
});

it("mesi", () => {
  expect(meseDi("2026-10-28")).toBe("2026-10");
  expect(mesePrima("2026-01")).toBe("2025-12");
});
```

(`cliente(id, nome)` e `pasto(id, clienteId, data, pasto, piatto, porzioni)` sono piccoli costruttori nel file di test.)

- [ ] **Step 2:** Run `npx vitest run lib/pannello.test.ts`. Expected: FAIL (modulo inesistente).
- [ ] **Step 3: Implement `lib/pannello.ts`**
  - **Date:** `spostaGiorni` e `giornoDelPiano` di `lib/produzione.ts` (mezzogiorno UTC, quindi niente slittamenti).
  - **`pastiDaOrdine`:** per `menu-settimana` e `sui-tuoi-macro`, per ogni voce prende la prima data `>= inizio` con `giornoDelPiano(data) === v.day` e scarta le date `< oggi`. Il piatto è `v.name`, più `" + " + v.extras.join(", ")` se ci sono aggiunte. Il risultato è ordinato per data e poi pranzo prima di cena.
  - **`prezzoPastoProposto`:**
    - abbonamento solo con `household === "singolo"` e `price_cents`: `Math.round(price_cents * 12 / (52 * getFormula(plan).pastiSettimana))`;
    - altri servizi con `price_cents` e `meals > 0`: `Math.round(price_cents / meals)`;
    - altrimenti `null`.
  - **`numeroInternazionale`:** toglie tutto tranne le cifre, toglie un `00` iniziale; 10 cifre che cominciano con `3` prendono `39` davanti; meno di 6 cifre dà `null`.
  - **`pastiDelGiorno`:** ordina i clienti con `localeCompare(…, "it")`.
- [ ] **Step 4:** Run `npx vitest run lib/pannello.test.ts`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add lib/pannello.ts lib/pannello.test.ts
git commit -m "feat(pannello): settimana, pasti dagli ordini, etichette del giorno, link WhatsApp e telefono"
```

### Task 3: Server della settimana — rubrica, pasti, conversione e accettazione

**Files:**
- Create: `lib/server/pannello.ts`
- Create: `functions/api/admin/pannello.ts` (GET)
- Create: `functions/api/admin/rubrica.ts` (POST, PATCH)
- Create: `functions/api/admin/pasti.ts` (PUT, DELETE)
- Create: `functions/api/admin/pasti/copia.ts` (POST)
- Create: `functions/api/admin/in-settimana/[id].ts` (POST)
- Test: `lib/server/pannello.test.ts`, `lib/server/pannello-route.test.ts`

**Interfaces:**
- Consumes: tipi e `pastiDaOrdine` (Task 2); `creaD1Prova` (Task 1); `ordineDaRiga`, `RigaOrdine` da `lib/server/ordini.ts`; `ORDER_SELECT` da `functions/_lib/ordini.ts`; `oggiRoma` da `lib/server/date.ts`; `getPiatto` da `lib/catalogo.ts`.
- Produces (`lib/server/pannello.ts`, tutte con `db: D1Database`):
  - `leggiDatiCliente(body: Record<string, unknown>): Esito<DatiCliente>`
  - `leggiNuovoPasto(body: Record<string, unknown>): Esito<NuovoPasto>`
  - `leggiPannello(db, da: string, a: string): Promise<{ clienti: ClienteMatteo[]; pasti: PastoSettimana[]; recenti: Record<string, string[]> }>`. `recenti` contiene, per ogni cliente, fino a 12 piatti distinti dei suoi pasti degli ultimi 60 giorni, dal più recente.
  - `creaCliente(db, d: DatiCliente): Promise<ClienteMatteo>`
  - `modificaCliente(db, id: string, d: DatiCliente): Promise<ClienteMatteo | null>`
  - `salvaPasto(db, p: NuovoPasto): Promise<Esito<PastoSettimana>>`. È un upsert su `(cliente_id,data,pasto)`; `prezzo_cents = COALESCE(prezzo già sul pasto, prezzo attuale del cliente)`; se il cliente non esiste restituisce 404.
  - `togliPasto(db, id: string): Promise<boolean>`
  - `copiaSettimanaPrecedente(db, clienteId: string, lunedi: string): Promise<{ pasti: PastoSettimana[]; copiati: number }>`. Copia solo pranzo e cena della settimana `lunedi-7 … lunedi-1` sulle stesse caselle +7 giorni, `ON CONFLICT DO NOTHING`, con il prezzo attuale del cliente e `ordine_id = NULL`. `pasti` sono tutti quelli del cliente nella settimana di `lunedi`.
  - `mettiInSettimana(db, ordine: Ordine, inizio: string, prezzoPastoCents: number | null, oggi: string): Promise<PastoSettimana[]>`. In ordine:
    1. trova o crea il cliente nella rubrica: per `user_id` se il proprietario dell'ordine non è in `staff_roles`; altrimenti senza `user_id`, cercandolo per `nome` e `telefono` uguali;
    2. se `prezzoPastoCents !== null` lo salva sul cliente;
    3. inserisce `pastiDaOrdine(...)` con `ON CONFLICT DO NOTHING`;
    4. se `prezzoPastoCents !== null`, esegue `UPDATE pasti SET prezzo_cents=? WHERE ordine_id=? AND prezzo_cents IS NULL`;
    5. mette `orders.in_settimana = 1`;
    6. restituisce i pasti dell'ordine.

    Tutto in un `batch`.
  - `convertiOrdiniAperti(db, oggi: string): Promise<number>`. Per gli ordini con `status IN ('confirmed','preparing','ready') AND in_settimana = 0` chiama `mettiInSettimana(db, ordine, fulfillment_date ?? production_date ?? requested_date ?? oggi, null, oggi)` e restituisce quanti ne ha convertiti.
- Produces (API, tutte con `soloAdmin`; quelle diverse da GET anche con `sameOrigin`):
  - `GET /api/admin/pannello?da=YYYY-MM-DD&a=YYYY-MM-DD` → `DatiPannello`. Prima chiama `convertiOrdiniAperti(db, oggiRoma())`. `nuovi` sono gli ordini con `status='requested'`, dal più vecchio. Range valido: `da <= a`, al massimo 31 giorni, altrimenti 400.
  - `POST /api/admin/rubrica` (body `DatiCliente`) → 201 `{ cliente }`; `PATCH /api/admin/rubrica` (body `{ id } & DatiCliente`) → `{ cliente }`, oppure 404.
  - `PUT /api/admin/pasti` (body `NuovoPasto`) → `{ pasto }`; `DELETE /api/admin/pasti` (body `{ id }`) → `{ ok: true }`, oppure 404.
  - `POST /api/admin/pasti/copia` (body `{ clienteId, lunedi }`) → `{ pasti, copiati }`. 400 se `lunedi` non è un lunedì.
  - `POST /api/admin/in-settimana/:id` (body `{ inizio, prezzoPastoCents }`) → `{ pasti }`. 409 `"Prima accetta l'ordine."` se l'ordine non è confermato, in preparazione o pronto.

- [ ] **Step 1: Write the failing tests** in `lib/server/pannello.test.ts` (funzioni) e `lib/server/pannello-route.test.ts` (route, con `vi.mock("../../functions/_lib/auth", …)` come in `ordini-manuali-route.test.ts`). Casi obbligatori:

```ts
it("il nome è l'unico campo obbligatorio; il prezzo è facoltativo", () => {
  expect(leggiDatiCliente({ nome: "  Paolo " })).toEqual({ ok: true, value: { nome: "Paolo", telefono: "", indirizzo: "", prezzoPastoCents: null } });
  expect(leggiDatiCliente({ nome: "" })).toMatchObject({ ok: false, status: 400 });
  expect(leggiDatiCliente({ nome: "Paolo", prezzoPastoCents: -1 })).toMatchObject({ ok: false, status: 400 });
});
it("salvare la stessa casella due volte la aggiorna, non la raddoppia, e tiene il prezzo di quando è entrata", async () => { /* cliente con prezzo 1000; salva; cambia prezzo cliente a 1200; salva di nuovo la stessa casella con un altro piatto → 1 riga, piatto nuovo, prezzo_cents 1000 */ });
it("copia la settimana scorsa solo nelle caselle vuote", async () => { /* lun e mer pieni la settimana prima, mer già pieno questa settimana → copiati 1, mer non toccato */ });
it("un ordine confermato non ancora nella settimana ci finisce da solo al caricamento", async () => { /* ordine web confermato, fulfillment_date 2026-10-29, in_settimana 0 → GET /api/admin/pannello lo converte: righe in pasti, cliente in rubrica con user_id cliente1, in_settimana 1; un secondo GET non duplica */ });
it("accettare con il prezzo lo salva sul cliente e sui pasti già convertiti senza prezzo", async () => { /* convertito senza prezzo, poi POST in-settimana con 800 → pasti.prezzo_cents 800, cliente.prezzo_pasto_cents 800 */ });
it("un ordine a mano senza account entra nella rubrica senza user_id e non si duplica", async () => { /* due ordini manuali di Matteo per lo stesso nome e telefono → un solo cliente */ });
it("non si mette in settimana un ordine ancora da confermare", async () => { /* status requested → 409 */ });
it("il pannello rifiuta intervalli sbagliati", async () => { /* da > a, oltre 31 giorni, date non valide → 400 */ });
```

- [ ] **Step 2:** Run `npx vitest run lib/server/pannello.test.ts lib/server/pannello-route.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `lib/server/pannello.ts` e le cinque route. Gli id si creano con `crypto.randomUUID()`. Le righe SQL si leggono in camelCase con funzioni `clienteDaRiga` e `pastoDaRiga`. `ultimoPasto` è `(SELECT MAX(data) FROM pasti WHERE cliente_id = c.id)`.
- [ ] **Step 4:** Run `npm test` e `npx tsc --noEmit`. Expected: verde.
- [ ] **Step 5: Commit**

```bash
git add lib/server/pannello.ts lib/server/pannello*.test.ts functions/api/admin/pannello.ts functions/api/admin/rubrica.ts functions/api/admin/pasti.ts functions/api/admin/pasti functions/api/admin/in-settimana
git commit -m "feat(pannello): API della settimana, rubrica, pasti, copia e ordini accettati"
```

### Task 4: Guadagni

**Files:**
- Modify: `lib/server/pannello.ts`
- Create: `functions/api/admin/guadagni.ts`
- Test: `lib/server/pannello.test.ts`

**Interfaces:**
- Produces: `guadagniDelMese(db, mese: string): Promise<Guadagni>` dove:
  - `cents = SUM(prezzo_cents * porzioni)` dei pasti del mese che hanno un prezzo;
  - `pasti = SUM(porzioni)` di pranzo e cena, con o senza prezzo;
  - `clienti = COUNT(DISTINCT cliente_id)` di tutte le righe del mese.
- Produces: `GET /api/admin/guadagni?mese=YYYY-MM` → `{ mese: Guadagni; precedente: Guadagni }`, 400 se il mese non è valido.

- [ ] **Step 1: Write the failing test**

```ts
it("i guadagni contano solo i pasti con un prezzo, moltiplicato per le porzioni", async () => {
  // ottobre: Paolo 2 pasti a 1000 (uno con porzioni 2), Giulia 1 pasto senza prezzo e un suo evento da 10000; settembre: 1 pasto di Paolo a 900
  expect(await guadagniDelMese(env.DB, "2026-10")).toEqual({ cents: 1000 * 1 + 1000 * 2 + 10000, pasti: 4, clienti: 2 });
  expect(await guadagniDelMese(env.DB, "2026-09")).toEqual({ cents: 900, pasti: 1, clienti: 1 });
  expect(await guadagniDelMese(env.DB, "2026-08")).toEqual({ cents: 0, pasti: 0, clienti: 0 });
});
```

- [ ] **Step 2:** Run `npx vitest run lib/server/pannello.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement con `WHERE data >= ? AND data < ?` (primo giorno del mese, primo giorno del mese dopo).
- [ ] **Step 4:** Run `npm test`. Expected: verde.
- [ ] **Step 5:** `git commit -m "feat(pannello): guadagni del mese"` (aggiungendo i file toccati).

### Task 5: Sessione di 90 giorni

**Files:**
- Modify: `functions/_lib/admin-access.ts:3`
- Test: `lib/server/admin-access.test.ts:55`

- [ ] **Step 1:** Nel test cambiare l'atteso in `"HttpOnly; SameSite=Strict; Max-Age=7776000; Secure"`.
- [ ] **Step 2:** Run `npx vitest run lib/server/admin-access.test.ts`. Expected: FAIL.
- [ ] **Step 3:** `export const ADMIN_SESSION_SECONDS = 90 * 24 * 60 * 60;`
- [ ] **Step 4:** Run `npm test`. Expected: verde.
- [ ] **Step 5:** `git commit -m "feat(pannello): Matteo resta collegato 90 giorni"`

### Task 6: Notifiche push lato server

**Files:**
- Create: `lib/server/webpush.ts`
- Create: `functions/_lib/push.ts`
- Create: `functions/api/admin/push.ts` (GET, POST, DELETE)
- Create: `scripts/genera-vapid.mjs`
- Modify: `functions/_lib/auth.ts` (`Env`: `VAPID_PUBLIC_KEY?: string; VAPID_PRIVATE_KEY?: string; VAPID_SUBJECT?: string`)
- Modify: `functions/api/orders.ts` (dopo le due `accodaEmail`)
- Modify: `.env.example` (le tre variabili, commentate come secret di Cloudflare)
- Test: `lib/server/webpush.test.ts`, `lib/server/push-route.test.ts`

**Interfaces:**
- Produces (`lib/server/webpush.ts`, solo WebCrypto, gira su Workers e su Node 24):
  - `type IscrizionePush = { endpoint: string; p256dh: string; auth: string }` (chiavi base64url come in `PushSubscription.toJSON()`)
  - `type ChiaviVapid = { publicKey: string; privateKey: string; subject: string }` (`publicKey`: base64url dei 65 byte non compressi; `privateKey`: base64url dei 32 byte `d`)
  - `firmaVapid(endpoint: string, chiavi: ChiaviVapid, adessoSec: number): Promise<string>`. Restituisce il valore dell'header `Authorization`, cioè `vapid t=<jwt>, k=<publicKey>`. Il JWT è ES256 con `{ aud: origin dell'endpoint, exp: adessoSec + 12 * 3600, sub: subject }`.
  - `cifraPayload(iscrizione: IscrizionePush, testo: string, prova?: { salt: Uint8Array; chiaviServer: CryptoKeyPair }): Promise<Uint8Array>`. Corpo `aes128gcm` secondo RFC 8291 e RFC 8188, un solo record.
  - `richiestaPush(iscrizione: IscrizionePush, testo: string, chiavi: ChiaviVapid, adessoSec: number): Promise<Request>`. È una POST all'`endpoint` con gli header `Content-Encoding: aes128gcm`, `Content-Type: application/octet-stream`, `TTL: 86400`, `Urgency: high` e `Authorization`.
- Produces (`functions/_lib/push.ts`):
  - `type MessaggioPush = { title: string; body: string; url: string }`
  - `accodaPush(ctx: Pick<Context, "env" | "waitUntil">, m: MessaggioPush): Promise<void>`. Non lancia mai. Se mancano le tre variabili VAPID non fa niente. Manda a tutte le righe di `push_iscrizioni` e cancella quelle che rispondono 404 o 410. Con `waitUntil` lavora dopo la risposta, come `accodaEmail`.
- Produces (API):
  - `GET /api/admin/push` → `{ publicKey: string | null }`;
  - `POST` body `{ endpoint, keys: { p256dh, auth } }` → `{ ok: true }` (upsert);
  - `DELETE` body `{ endpoint }` → `{ ok: true }`.
- Produces: in `functions/api/orders.ts`, dopo un ordine creato, `accodaPush({ env, waitUntil }, { title: "Nuovo ordine dal sito", body: \`${o.name} · ${ETICHETTE_SERVIZIO[o.service]}${o.items.length ? \` · ${o.items.length} pasti\` : ""}\`, url: "/admin?vista=nuovi" })`.

- [ ] **Step 1: Write the failing tests** in `lib/server/webpush.test.ts`

```ts
it("il payload si decifra con la chiave del browser (RFC 8291)", async () => {
  // il "browser": coppia ECDH P-256 e auth secret di 16 byte
  const browser = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const auth = crypto.getRandomValues(new Uint8Array(16));
  const iscrizione = { endpoint: "https://web.push.apple.com/abc", p256dh: b64url(await crypto.subtle.exportKey("raw", browser.publicKey)), auth: b64url(auth) };
  const corpo = await cifraPayload(iscrizione, JSON.stringify({ title: "Nuovo ordine dal sito", body: "Francesca Rossi", url: "/admin?vista=nuovi" }));
  expect(corpo.slice(16, 20)).toEqual(new Uint8Array([0, 0, 16, 0])); // rs = 4096
  expect(corpo[20]).toBe(65); // idlen
  expect(await decifraPerTest(corpo, browser.privateKey, auth, iscrizione.p256dh)).toBe('{"title":"Nuovo ordine dal sito","body":"Francesca Rossi","url":"/admin?vista=nuovi"}');
});
it("la firma VAPID è un JWT ES256 verificabile con la chiave pubblica", async () => {
  const chiavi = await chiaviVapidPerTest();
  const header = await firmaVapid("https://fcm.googleapis.com/fcm/send/xyz", chiavi, 1_793_200_000);
  const [, jwt, k] = /^vapid t=([^,]+), k=(.+)$/.exec(header)!;
  expect(k).toBe(chiavi.publicKey);
  const [h, p, s] = jwt.split(".");
  expect(JSON.parse(atobUrl(p))).toEqual({ aud: "https://fcm.googleapis.com", exp: 1_793_200_000 + 43200, sub: "mailto:info@fuelchef.it" });
  expect(await verificaEs256(`${h}.${p}`, s, chiavi.publicKey)).toBe(true);
});
```

`decifraPerTest` implementa il verso opposto nel file di test: ECDH con la chiave pubblica del server presa dall'header (`keyid`), poi le stesse HKDF e AES-GCM, poi via il delimitatore `0x02` finale.

In `lib/server/push-route.test.ts` (D1 di prova, `fetch` finto con `vi.stubGlobal`):
- `accodaPush` senza variabili VAPID non chiama `fetch`;
- con un `fetch` che lancia non rifiuta;
- una risposta 410 cancella l'iscrizione e una 201 la tiene;
- `POST /api/admin/push` salva e un secondo POST uguale non duplica;
- creando un ordine con `POST /api/orders` (utente `cliente1`, `currentUser` finto) parte una chiamata push.

- [ ] **Step 2:** Run `npx vitest run lib/server/webpush.test.ts lib/server/push-route.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `cifraPayload`.** L'algoritmo è fissato da RFC 8291 e deve seguire questi passi:

```
ua_public = b64url_decode(p256dh)  (65 byte)      auth_secret = b64url_decode(auth)  (16 byte)
as_keys   = ECDH P-256 effimera (o prova.chiaviServer); as_public = raw(as_keys.publicKey) (65 byte)
ecdh      = deriveBits(ECDH, public: ua_public, as_keys.privateKey, 256)
IKM       = HKDF-SHA256(salt = auth_secret, ikm = ecdh, info = "WebPush: info\0" || ua_public || as_public, 32 byte)
salt      = 16 byte casuali (o prova.salt)
CEK       = HKDF-SHA256(salt, IKM, "Content-Encoding: aes128gcm\0", 16 byte)
NONCE     = HKDF-SHA256(salt, IKM, "Content-Encoding: nonce\0", 12 byte)
cifrato   = AES-128-GCM(CEK, NONCE, testo_utf8 || 0x02)
corpo     = salt(16) || rs = 4096 (uint32 BE) || idlen = 65 (1 byte) || as_public(65) || cifrato
```

Ogni HKDF è una sola `crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, chiave, byte * 8)`. Per `firmaVapid`, la chiave privata si importa come JWK `{ kty: "EC", crv: "P-256", d, x, y }`, con `x` e `y` presi dai byte 1–32 e 33–64 della pubblica. La firma ECDSA di WebCrypto è già nel formato `r||s` che vuole ES256.

`scripts/genera-vapid.mjs` genera una coppia ECDSA P-256 e stampa `VAPID_PUBLIC_KEY=…` e `VAPID_PRIVATE_KEY=…` in base64url, più `VAPID_SUBJECT=mailto:info@fuelchef.it`.
- [ ] **Step 4:** Run `npm test` e `npx tsc --noEmit`. Expected: verde.
- [ ] **Step 5: Commit**

```bash
git add lib/server/webpush.ts lib/server/webpush.test.ts lib/server/push-route.test.ts functions/_lib/push.ts functions/api/admin/push.ts functions/_lib/auth.ts functions/api/orders.ts scripts/genera-vapid.mjs .env.example
git commit -m "feat(pannello): notifica push a Matteo per ogni ordine nuovo dal sito"
```

### Task 7: Guscio dell'app e schermata del giorno

**Files:**
- Modify: `lib/api.ts` (aggiungere `pannelloApi`)
- Create: `components/pannello/PannelloMatteo.tsx` (stato, caricamento, viste, storia del browser)
- Create: `components/pannello/VistaGiorno.tsx`
- Create: `components/pannello/ui.tsx` (`Bottone`, `Foglio` — il pannello dal basso, con focus intrappolato come `Sheet` in `SimpleAdmin.tsx` —, `Errore`, `Avviso`)
- Rewrite: `app/styles/admin.css` (prefisso `pm-`; tiene `@page`/`@media print` solo se servono ancora)
- Modify: `app/admin/page.tsx` (`<AdminAccess><PannelloMatteo /></AdminAccess>`)

**Interfaces:**
- Consumes: i tipi di `lib/pannello.ts` e le API dei Task 3 e 4.
- Produces (`lib/api.ts`):

```ts
export const pannelloApi = {
  pannello: (da: string, a: string) => chiama<DatiPannello>(`/api/admin/pannello?da=${da}&a=${a}`),
  salvaCliente: (dati: DatiCliente, id?: string) => chiama<{ cliente: ClienteMatteo }>("/api/admin/rubrica", { method: id ? "PATCH" : "POST", json: id ? { id, ...dati } : dati }),
  salvaPasto: (p: NuovoPasto) => chiama<{ pasto: PastoSettimana }>("/api/admin/pasti", { method: "PUT", json: p }),
  togliPasto: (id: string) => chiama<{ ok: true }>("/api/admin/pasti", { method: "DELETE", json: { id } }),
  copiaSettimana: (clienteId: string, lunedi: string) => chiama<{ pasti: PastoSettimana[]; copiati: number }>("/api/admin/pasti/copia", { method: "POST", json: { clienteId, lunedi } }),
  mettiInSettimana: (ordineId: string, inizio: string, prezzoPastoCents: number | null) => chiama<{ pasti: PastoSettimana[] }>(`/api/admin/in-settimana/${encodeURIComponent(ordineId)}`, { method: "POST", json: { inizio, prezzoPastoCents } }),
  guadagni: (mese: string) => chiama<{ mese: Guadagni; precedente: Guadagni }>(`/api/admin/guadagni?mese=${mese}`),
  chiavePush: () => chiama<{ publicKey: string | null }>("/api/admin/push"),
  iscriviPush: (s: PushSubscriptionJSON) => chiama<{ ok: true }>("/api/admin/push", { method: "POST", json: s }),
};
```

- Produces (`PannelloMatteo`):
  - `type Vista = { tipo: "giorno" } | { tipo: "nuovi" } | { tipo: "scegli-cliente" } | { tipo: "cliente"; clienteId: string; modifica?: boolean } | { tipo: "nuovo-cliente" } | { tipo: "altro" } | { tipo: "guida" }`.
  - Ogni cambio di vista fa `history.pushState` con `?vista=…` (e `&cliente=…`); `popstate` torna indietro, così il gesto "indietro" del telefono riporta alla schermata del giorno. All'apertura legge `?vista=nuovi` (è l'URL della notifica).
  - Stato condiviso passato alle viste:
    - `giorno: string`, che parte da `oggiRoma()`;
    - `dati: DatiPannello` della settimana di `giorno`, caricata con `pannello(lunediDi(giorno), giorniDellaSettimana(...)[6])`;
    - `impostazioni` (per `piattiNonDisponibili`);
    - `ricarica(): Promise<void>`;
    - `vai(v: Vista): void`.
  - Si ricarica ogni 60 secondi quando la pagina è visibile e nessun `Foglio` è aperto, e subito a `visibilitychange` → visibile.
- Produces (`VistaGiorno`, come il mockup A di `schermata-a-dettagli.html`):
  - "Ciao Matteo";
  - il riquadro rosso `N ordini nuovi dal sito · Apri →`, solo se `nuovi.length > 0`;
  - la striscia lun–dom con `‹` e `›` per cambiare settimana;
  - le sezioni PRANZO e CENA (più "ALTRO" per gli eventi), con righe nome in grassetto e piatto sotto, porzioni `×2` se più di una. Toccando una riga si va a `{ tipo: "cliente", clienteId }`. Se il giorno è vuoto: "Niente da cucinare per questo giorno.";
  - in fondo, fissi, `+ Aggiungi` (verso `scegli-cliente`) e `Stampa etichette di <giorno>` (disabilitato senza etichette; il collegamento al PDF arriva nel Task 10, qui mostra "In arrivo");
  - il bottoncino `Altro`.

- [ ] **Step 1:** Implementare i file sopra; togliere l'import di `SimpleAdmin` da `app/admin/page.tsx` (il file si cancella nel Task 12).
- [ ] **Step 2:** Run `npx tsc --noEmit`, `npm run lint`, `npm run build`. Expected: nessun errore.
- [ ] **Step 3: Verifica a mano.** Stack locale (memoria `fuel-lab-ambiente-locale`: `npx next dev -p 3000`, `npx wrangler pages dev --port 8789` dopo `npx wrangler d1 migrations apply fuelchef --local`, proxy su 8788). Aprire http://localhost:8788/admin a larghezza 390 px. Expected:
  - si apre su oggi;
  - con un ordine `requested` nel D1 locale compare il riquadro rosso;
  - un pasto inserito con `PUT /api/admin/pasti` compare sotto PRANZO;
  - `‹` e `›` cambiano settimana;
  - il "indietro" del browser torna alla vista precedente.
- [ ] **Step 4: Commit**

```bash
git add lib/api.ts components/pannello app/styles/admin.css app/admin/page.tsx
git commit -m "feat(pannello): app nuova, schermata del giorno"
```

### Task 8: Ordini nuovi dal sito

**Files:**
- Create: `components/pannello/OrdiniNuovi.tsx`

**Interfaces:**
- Consumes:
  - `dati.nuovi`;
  - `api.modificaOrdine(id, { status, productionDate, fulfillmentDate, expectedStatus: "requested", notify: true })`;
  - `pannelloApi.mettiInSettimana`;
  - `prezzoPastoProposto`, `linkWhatsAppCliente`, `linkChiama` (Task 2);
  - `leggiEuro` e `centesimiInTesto` da `lib/operazioni.ts`;
  - `ETICHETTE_SERVIZIO`, `dataBreve`.
- Produces: per ogni ordine (dal più vecchio) una scheda come al centro di `schermata-a-dettagli.html`, con:
  - nome;
  - telefono grande;
  - le pillole: servizio, `N pasti` se ci sono, `Ritiro` oppure `Consegna · indirizzo, comune`, `da <dataBreve>` oppure `data da decidere`;
  - i piatti raggruppati (`2× Pollo al curry · …`);
  - allergie e note;
  - i bottoni `WhatsApp` e `Chiama`, nascosti se il link è `null`;
  - i bottoni `Accetta` e `Rifiuta`.
- `Accetta` apre, dentro la scheda:
  - il campo `Da che giorno?` (input date, valore iniziale `requested_date ?? oggiRoma()`), visibile solo se manca `requested_date`;
  - `Quanto paga a pasto (facoltativo)`, precompilato con `centesimiInTesto(prezzoPastoProposto(o))`;
  - `Conferma`.

  Alla conferma:
  1. PATCH con `status: "confirmed"` e `productionDate = fulfillmentDate = inizio`;
  2. `mettiInSettimana(id, inizio, cents)`;
  3. `ricarica()`;
  4. per un abbonamento si va alla settimana del cliente, altrimenti al giorno `inizio`, con l'avviso "Messo nella settimana: lo trovi qui."

  Se il passo 1 riesce e il passo 2 fallisce: si chiama comunque `ricarica()` (la conversione automatica lo mette nella settimana) e l'avviso è "Accettato. Lo trovi nella settimana." Non si mostra mai un errore che inviti a riaccettare.
- `Rifiuta` chiede "Sei sicuro? Il cliente riceve un'email." con `Sì, rifiuta` e `No`, poi fa il PATCH `status: "cancelled"`.
- Un 409 del PATCH (qualcun altro l'ha già cambiato) ricarica i dati e dice "Questo ordine era già stato aggiornato."

- [ ] **Step 1:** Implementare e collegare a `vista.tipo === "nuovi"`.
- [ ] **Step 2:** Run `npx tsc --noEmit`, `npm run lint`, `npm run build`. Expected: nessun errore.
- [ ] **Step 3: Verifica a mano.** Nel locale creare un ordine "menu della settimana" da `cliente@test.local`. Expected:
  - dal riquadro rosso si apre la scheda con il telefono e i bottoni;
  - Accetta porta al giorno di inizio e i piatti sono lì;
  - l'ordine sparisce dagli ordini nuovi;
  - Rifiuta chiede conferma.

  Poi, con la rete bloccata solo su `/api/admin/in-settimana` (DevTools → Network request blocking), si accetta un altro ordine. Expected: compare comunque nella settimana dopo la ricarica.
- [ ] **Step 4:** `git commit -m "feat(pannello): ordini nuovi con WhatsApp, Chiama, Accetta e Rifiuta"`

### Task 9: Clienti e settimana del cliente

**Files:**
- Create: `components/pannello/SceltaCliente.tsx`, `ModuloCliente.tsx`, `SettimanaCliente.tsx`, `FoglioPiatto.tsx`

**Interfaces:**
- Consumes:
  - `dati.clienti`, `dati.pasti`, `dati.recenti`, `impostazioni.piattiNonDisponibili`;
  - `pannelloApi.salvaCliente`, `salvaPasto`, `togliPasto`, `copiaSettimana`;
  - `PIATTI` da `lib/catalogo.ts`;
  - `linkWhatsAppCliente`, `linkChiama`, `lunediDi`, `giorniDellaSettimana`, `nomeGiorno`.
- Produces:
  - `SceltaCliente`: campo "Cerca nome…"; elenco dei clienti ordinato per `ultimoPasto` decrescente, poi per nome, con nome e telefono; `+ Cliente nuovo` tratteggiato. Toccando un cliente si va a `{ tipo: "cliente", clienteId }`.
  - `ModuloCliente` (nuovo e modifica):
    - `Nome` (obbligatorio);
    - `Telefono` (`type="tel"`);
    - `Indirizzo`;
    - `Quanto paga a pasto (€) — facoltativo` (`inputMode="decimal"`, letto con `leggiEuro`; un valore non valido dà "Scrivi un importo come 10 o 8,50").

    `Salva` porta alla settimana del cliente.
  - `SettimanaCliente`, come `piatto-libero.html`:
    - in testa il nome grande, poi telefono e `· 10 € a pasto` se c'è il prezzo, con i link WhatsApp e Chiama e un link `Modifica`;
    - `‹ settimana ›`;
    - la griglia 7 × (PRANZO, CENA): una casella vuota mostra `+`, una piena mostra il piatto (più `×N`);
    - gli eventi del cliente sotto la griglia, solo testo con `Togli`;
    - in fondo `Copia la settimana scorsa` (dopo, "Copiati N pasti" oppure "La settimana scorsa era vuota") e `Fatto` (verso il giorno).
  - `FoglioPiatto` (`Foglio` dal basso, titolo "Giovedì 29 · Cena"), in quest'ordine:
    1. il campo "Scrivi il piatto…" con il bottone `OK`;
    2. "GIÀ FATTI PER {NOME}": `recenti[clienteId]`;
    3. "DAL MENU DEL SITO": i `PIATTI` non in `piattiNonDisponibili`;
    4. `Porzioni: − N +` (da 1 a 20, iniziale quella della casella o 1);
    5. per una casella piena, `Togli` in rosso.

    Un tocco su un piatto suggerito salva subito. Il testo scritto a mano salva con `OK`, e `piattoId` diventa l'id del catalogo solo se il testo è identico al nome di un piatto, altrimenti `null`. Dopo il salvataggio il foglio si chiude e la casella si aggiorna senza ricaricare tutto. Il doppio tocco è innocuo perché l'API fa un upsert.

- [ ] **Step 1:** Implementare e collegare alle viste `scegli-cliente`, `nuovo-cliente`, `cliente`.
- [ ] **Step 2:** Run `npx tsc --noEmit`, `npm run lint`, `npm run build`. Expected: nessun errore.
- [ ] **Step 3: Verifica a mano** (390 px). Expected:
  - `+ Aggiungi` → `Cliente nuovo` "Paolo" senza telefono né prezzo si salva;
  - nella sua settimana, mercoledì pranzo scritto a mano "Riso, pollo 200 g, zucchine" compare nella casella, e nella schermata del giorno sotto PRANZO;
  - giovedì cena scelta dal menu con porzioni 2 mostra `×2`;
  - riaprendo una casella compare tra "Già fatti";
  - `Togli` svuota la casella;
  - nella settimana dopo, `Copia la settimana scorsa` copia i due pasti.
- [ ] **Step 4:** `git commit -m "feat(pannello): rubrica e settimana del cliente con piatti scritti a mano"`

### Task 10: Etichette in PDF

**Files:**
- Create: `lib/etichette-layout.ts` (pura, testata)
- Create: `lib/etichette-pdf.ts` (browser: canvas + `pdf-lib`)
- Modify: `components/pannello/VistaGiorno.tsx` (il bottone "Stampa etichette")
- Modify: `package.json` (`npm install pdf-lib@1.17.1`)
- Test: `lib/etichette-layout.test.ts`

**Interfaces:**
- Consumes: `etichetteDelGiorno`, `EtichettaPannello` (Task 2); `oggiRoma`.
- Produces (`lib/etichette-layout.ts`):
  - `ETICHETTA_MM = { larghezza: 70, altezza: 42.3, margineAlto: 2.8, margineLato: 3.2, margineBasso: 2.4, logoAltezza: 6, giornoCorpo: 2.4, nomeMax: 6.8, nomeMin: 4, piattoCorpo: 3, piattoInterlinea: 1.2, piedeCorpo: 2.2 }` (dal mockup approvato: 5 px = 1 mm);
  - `MARGINE_FOGLIO_ALTO_MM = 0.45`, cioè (297 − 7 × 42,3) / 2;
  - `posizioneEtichetta(indice: number, sposta: { x: number; y: number }): { x: number; y: number }`, in mm, con indice da 0 a 20, riga per riga, da sinistra a destra;
  - `vaACapo(testo: string, larghezzaMm: number, misura: (t: string) => number, maxRighe: number): string[]`. Spezza sugli spazi; se il testo non ci sta in `maxRighe`, l'ultima riga finisce con "…";
  - `adattaNome(testo: string, larghezzaMm: number, misuraA: (t: string, corpoMm: number) => number): { testo: string; corpoMm: number }`. Scende di 0,2 mm da `nomeMax` finché ci sta; a `nomeMin` taglia con "…";
  - `dataEtichetta(data: string): string`, per esempio `"28/10/2026"`.
- Produces (`lib/etichette-pdf.ts`):
  - `creaPdfEtichette(etichette: EtichettaPannello[], opzioni: { preparatoIl: string; sposta: { x: number; y: number }; prova?: boolean }): Promise<Blob>`:
    - un canvas A4 a 300 dpi (2480 × 3508, 11,811 px/mm) per foglio;
    - i font si prendono da `getComputedStyle(document.documentElement)` (`--f-disp`, `--f-ui`, `--f-mono`) dopo `await document.fonts.load(...)`;
    - il logo è `/logo-fuellab.png`;
    - l'etichetta è disegnata come `etichetta-a-e-altro.html`: logo a sinistra; giorno e pasto a destra su due righe, maiuscolo, spaziatura 0,12 em; nome; piatto su massimo 2 righe; riga di 0,3 mm; `Preparato il ` più la data;
    - con `prova: true` si disegnano solo i bordi delle 21 caselle (0,2 mm) e una croce al centro di ognuna;
    - ogni canvas diventa una pagina A4 di `pdf-lib` (595,28 × 841,89 pt), con l'immagine a pagina piena.
  - `consegnaPdf(blob: Blob, nomeFile: string): Promise<void>`. Usa `navigator.share({ files: [file] })` quando `navigator.canShare?.({ files: [file] })` è vero (su iPhone il foglio di condivisione ha "Stampa"); altrimenti apre `URL.createObjectURL(blob)` in una nuova scheda.
  - `leggiSposta(): { x: number; y: number }` e `salvaSposta(s)` su `localStorage` (chiave `fuellab-etichette-sposta`, da −5 a 5 mm, sempre dentro `try/catch`).
- Nel `VistaGiorno` il bottone chiama `creaPdfEtichette(etichetteDelGiorno(pasti, clienti, giorno), { preparatoIl: oggiRoma(), sposta: leggiSposta() })`, poi `consegnaPdf(blob, "etichette-<giorno>.pdf")`. Durante il lavoro mostra "Preparo le etichette…".

- [ ] **Step 1: Write the failing tests** in `lib/etichette-layout.test.ts`

```ts
const misura = (t: string) => t.length * 1.5; // 1,5 mm per carattere
it("le etichette stanno sul foglio A4 in 3 colonne e 7 righe", () => {
  expect(posizioneEtichetta(0, { x: 0, y: 0 })).toEqual({ x: 0, y: 0.45 });
  expect(posizioneEtichetta(4, { x: 0, y: 0 })).toEqual({ x: 70, y: 0.45 + 42.3 });
  expect(posizioneEtichetta(20, { x: 1, y: -0.5 })).toEqual({ x: 141, y: 0.45 + 6 * 42.3 - 0.5 });
});
it("un piatto lungo va a capo su due righe e finisce con i puntini", () => {
  const righe = vaACapo("Pasta integrale, tonno, pomodorini, olive e capperi 200 g", 63.6, misura, 2);
  expect(righe).toHaveLength(2);
  expect(righe[1].endsWith("…")).toBe(true);
  expect(righe.every((r) => misura(r) <= 63.6)).toBe(true);
  expect(vaACapo("Frittata", 63.6, misura, 2)).toEqual(["Frittata"]);
});
it("un nome lungo si rimpicciolisce, poi si taglia", () => {
  const misuraA = (t: string, mm: number) => t.length * mm * 0.7;
  expect(adattaNome("PAOLO", 63.6, misuraA)).toEqual({ testo: "PAOLO", corpoMm: 6.8 });
  expect(adattaNome("MARIA FRANCESCA", 63.6, misuraA).corpoMm).toBeLessThan(6.8);
  expect(adattaNome("MARIA FRANCESCA DE SANTIS DI GIOVANNANTONIO", 63.6, misuraA).testo.endsWith("…")).toBe(true);
});
it("la data di preparazione per esteso", () => {
  expect(dataEtichetta("2026-10-28")).toBe("28/10/2026");
});
```

- [ ] **Step 2:** Run `npx vitest run lib/etichette-layout.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implementare i due file e il bottone; `npm install pdf-lib@1.17.1`.
- [ ] **Step 4:** Run `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`. Expected: verde.
- [ ] **Step 5: Verifica a mano.** Nel locale, con due pasti di prova (uno con nome e piatto lunghi), "Stampa etichette" apre un PDF A4. Expected:
  - il logo è grande, il nome in Oxanium maiuscolo, il piatto in Archivo, il piede "Preparato il <oggi>";
  - nessun allergene e nessun "entro";
  - il testo lungo va a capo e non esce dall'etichetta;
  - con lo zoom del lettore PDF le caselle misurano 70 × 42,3 mm.

  Allegare uno screenshot del PDF al rapporto del task.
- [ ] **Step 6:** `git commit -m "feat(pannello): etichette belle in PDF, pronte per la stampa dal telefono"` (con `package.json` e `package-lock.json`).

### Task 11: Altro, notifiche e guida all'installazione

**Files:**
- Create: `components/pannello/Altro.tsx`, `PiattiSulSito.tsx` (spostato da `SimpleMenu` in `SimpleAdmin.tsx`), `AllineaEtichette.tsx`, `GuidaInstallazione.tsx`
- Modify: `components/admin/Sconti.tsx` (classi `pm-`, stessa logica)
- Create: `lib/dispositivo.ts` (puro, testato), `lib/push-client.ts` (browser)
- Create: `public/admin-sw.js`
- Test: `lib/dispositivo.test.ts`

**Interfaces:**
- Consumes: `pannelloApi.guadagni`, `chiavePush`, `iscriviPush`; `adminApi.salvaImpostazioni`; `AdminLogout`; `creaPdfEtichette({ prova: true })`, `leggiSposta`, `salvaSposta` (Task 10); `euro` da `lib/api.ts`.
- Produces (`lib/dispositivo.ts`):
  - `tipoDispositivo(userAgent: string, maxTouchPoints: number): "iphone" | "android" | "computer"`. iPhone e iPad (anche l'iPadOS che si presenta come "Macintosh" con `maxTouchPoints > 1`) danno `"iphone"`;
  - `eInstallata(standalone: boolean, navigatorStandalone: boolean | undefined): boolean`.
- Produces (`lib/push-client.ts`):
  - `type StatoNotifiche = "non-supportate" | "da-installare" | "da-attivare" | "negate" | "attive"`;
  - `statoNotifiche(): Promise<StatoNotifiche>`. Su iPhone non installato dà `"da-installare"`. Senza `PushManager` dà `"non-supportate"`. Poi guarda `Notification.permission` e `registration.pushManager.getSubscription()`;
  - `attivaNotifiche(): Promise<StatoNotifiche>`:
    1. `navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin" })`;
    2. `Notification.requestPermission()`;
    3. `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` con la chiave da `chiavePush()`;
    4. `iscriviPush(sub.toJSON())`.
- Produces (`public/admin-sw.js`):
  - `push`: mostra una notifica con il JSON `{ title, body, url }`, oppure, se manca, "FUEL LAB" / "Nuovo ordine dal sito"; `icon: "/pannello-icon-192.png"`, `data: { url }`;
  - `notificationclick`: chiude la notifica e mette a fuoco una finestra già aperta nello scope, navigandola a `url`, oppure fa `clients.openWindow(url)`;
  - nessun gestore `fetch`.
- Produces (`Altro`, come `etichetta-a-e-altro.html`):
  - **Guadagni:** il totale del mese in corso grande (`euro`), `ottobre · N pasti · M clienti`, poi `mese prima: X`;
  - **Codici sconto:** `Sconti`;
  - **I miei clienti:** l'elenco, che porta alla settimana del cliente;
  - **Piatti sul sito**;
  - **Allinea le etichette:** `Stampa pagina di prova`, poi `Su`, `Giù`, `Sinistra`, `Destra` a passi di 0,5 mm, con lo spostamento attuale scritto;
  - **Installa l'app e le notifiche:** porta alla guida;
  - **Esci:** `AdminLogout`.
- Produces (`GuidaInstallazione`):
  - i passi per tipo di dispositivo, con disegni SVG in linea semplici (l'icona Condividi di iOS, il menu ⋮):
    - **iPhone:** "Tocca Condividi" → "Aggiungi alla schermata Home" → "Apri FUEL LAB dall'icona" → `Attiva notifiche` → "Consenti";
    - **Android:** "Menu ⋮" → "Installa app" o "Aggiungi a schermata Home" → "Apri dall'icona" → `Attiva notifiche` → "Consenti";
    - **computer:** "Le notifiche si attivano sul telefono: apri fuelchef.it/admin dal telefono di Matteo.";
  - stato `"negate"`: iPhone "Impostazioni → Notifiche → FUEL LAB → Consenti notifiche"; Android "Tieni premuta l'icona → Info app → Notifiche";
  - stato `"attive"`: "Notifiche attive ✓".
  - `VistaGiorno` mostra in alto una scheda corta "Ricevi gli ordini sul telefono → Come fare", che porta alla guida, finché `statoNotifiche()` è `"da-installare"` o `"da-attivare"`.

- [ ] **Step 1: Write the failing tests** in `lib/dispositivo.test.ts`

```ts
it("riconosce iPhone, iPad, Android e computer", () => {
  expect(tipoDispositivo("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1", 5)).toBe("iphone");
  expect(tipoDispositivo("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15", 5)).toBe("iphone"); // iPadOS
  expect(tipoDispositivo("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15", 0)).toBe("computer");
  expect(tipoDispositivo("Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36", 5)).toBe("android");
  expect(tipoDispositivo("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36", 0)).toBe("computer");
});
it("installata se aperta come app", () => {
  expect(eInstallata(true, undefined)).toBe(true);
  expect(eInstallata(false, true)).toBe(true);
  expect(eInstallata(false, undefined)).toBe(false);
});
```

- [ ] **Step 2:** Run `npx vitest run lib/dispositivo.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implementare tutto quanto sopra.
- [ ] **Step 4:** Run `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`. Expected: verde.
- [ ] **Step 5: Verifica a mano.** In locale con `node scripts/genera-vapid.mjs` e le tre variabili in `.dev.vars`, in Chrome desktop:
  - in Altro compaiono i guadagni del mese;
  - creare un codice sconto funziona;
  - togliere un piatto dal sito funziona;
  - la pagina di prova delle etichette si apre;
  - `Attiva notifiche` chiede il permesso;
  - creando un ordine da `cliente@test.local` arriva la notifica, e toccandola si apre `/admin?vista=nuovi`;
  - con la finestra a 390 px e un UA da iPhone la guida mostra i passi per iPhone.
- [ ] **Step 6:** `git commit -m "feat(pannello): Altro con guadagni, sconti e clienti; notifiche e guida all'installazione"`

### Task 12: Pulizia e collaudo finale

**Files:**
- Delete: `components/admin/SimpleAdmin.tsx`, `components/admin/admin-model.ts`, `lib/admin-model.test.ts` (dopo aver controllato con grep che nessuno li importi)

- [ ] **Step 1:** Run `grep -rn "SimpleAdmin\|admin-model" app components lib`. Expected: nessun risultato dopo la cancellazione.
- [ ] **Step 2:** Run `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`. Expected: tutto verde.
- [ ] **Step 3: Collaudo completo in locale**, al telefono emulato (390 × 844), lato client: rifare in fila il percorso dello spec.
  - Cliente del foglio nuovo → tre pasti, di cui uno scritto a mano.
  - Ordine dal sito → notifica → WhatsApp e Chiama visibili → Accetta con prezzo → è nella settimana.
  - Abbonamento dal sito → Accetta → si apre la sua settimana vuota → riempita → `Copia la settimana scorsa` la settimana dopo.
  - Stampa etichette del giorno.
  - Guadagni giusti in Altro.
  - Il vecchio `/dashboard` porta a `/admin`.
  - `/account` del cliente mostra l'ordine confermato.
- [ ] **Step 4:** `git commit -m "chore(pannello): via il vecchio SimpleAdmin"`

---

## Dopo il piano (solo su richiesta esplicita dell'utente)

**Pubblicazione:**
1. backup: `npx wrangler d1 export fuelchef --remote --output ../backup-fuelchef/fuelchef-<data>-prima-di-0010.sql`;
2. conteggio in sola lettura degli ordini che la conversione toccherà: `npx wrangler d1 execute fuelchef --remote --command "SELECT status, service, COUNT(*) FROM orders WHERE status IN ('confirmed','preparing','ready') GROUP BY 1,2"`, da riferire all'utente;
3. `npx wrangler d1 migrations list fuelchef --remote`, poi `apply` (0010);
4. le tre variabili VAPID come secret del progetto Pages `fuelchef`;
5. `npm run deploy:cloudflare`;
6. verifica online di `/admin`, `/api/admin/push` (401 senza accesso), `/account`.

**Prova con Matteo:**
- sul suo telefono: installare l'app con la guida e attivare le notifiche;
- un ordine di prova dal sito, per vedere la notifica;
- stampare la pagina di prova delle etichette sulla sua stampante e regolare "Allinea le etichette";
- stampare un foglio vero.

Il lavoro sulle etichette si considera finito solo dopo questa prova.
