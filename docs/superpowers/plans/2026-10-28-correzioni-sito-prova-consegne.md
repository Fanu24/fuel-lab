# Correzioni al sito: via la settimana di prova e le cadenze fisse — piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Il sito pubblico e l'area cliente non propongono più la settimana di prova e non promettono più nessuna cadenza fissa di consegna, ritiro o cucina: al loro posto "Ritiro o consegna, con giorno e orario concordati."

**Architecture:** Il server smette di accettare la prova (la colonna `sub_trial` resta e viene scritta sempre a 0) e il tipo `SceltaAbbonamento` perde il campo `trial`. I testi rivolti al cliente leggono una sola costante nuova, `CONSEGNA_CONCORDATA`. `CONSEGNA_OGNI_GIORNI` resta solo nel codice del vecchio pannello (`lib/produzione.ts`, `lib/operazioni.ts`, `components/dashboard/**`), che il cliente non vede.

**Tech Stack:** Next.js 16.3.3 (`output: "export"`), Cloudflare Pages Functions, D1, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-28-pannello-matteo-semplice-design.md`, sezione "Correzioni al sito pubblico".

## Global Constraints

- Testi in italiano con gli accenti giusti; la frase fissa è esattamente: `Ritiro o consegna, con giorno e orario concordati.`
- Nessuna migrazione distruttiva: la colonna `orders.sub_trial` resta nel database.
- I consigli generici del blog a chi cucina da sé (per esempio "cucina due volte a settimana", linee guida CREA in `lib/blog.ts` e `lib/blog-approfondimenti.ts`) restano: cambiano solo le frasi che descrivono il servizio FUEL LAB.
- Niente deploy e niente migrazioni `--remote` senza una richiesta esplicita dell'utente.
- Prima di scrivere codice Next leggere la guida pertinente in `node_modules/next/dist/docs/` (vedi `AGENTS.md`).
- Verifiche di ogni task: `npm test`, `npx tsc --noEmit`, `npm run lint`.

## Review Focus

- Un cliente con una vecchia scheda del browser aperta manda ancora `trial: true`: deve ricevere un errore chiaro ("La settimana di prova non è più disponibile"), non un 500. Test nel Task 1.
- Un abbonamento vecchio salvato con `sub_trial = 1`: l'area cliente e le email lo mostrano senza nessuna riga "prova" e senza errori. Test nel Task 1 (`sceltaDaRiga` ignora `sub_trial`).
- Il riepilogo dell'area cliente per un abbonamento attivo non deve inventare una "prossima consegna" calcolata: mostra la frase concordata. Test nel Task 3.
- Il messaggio WhatsApp precompilato per l'abbonamento non deve più nominare la prova. Test nel Task 2.
- Le pagine SEO e `public/llms.txt` sono lette dai motori di ricerca e dalle AI: non devono restare frasi con "ogni 3 giorni" o "prova". Controllo con grep nel Task 3.

---

### Task 0: Checkpoint del codice che oggi è online ma non in git

Il pannello `/admin`, le migrazioni 0007–0009 e altri lavori sono online ma non sono committati.

- [ ] **Step 1:** Run `npm test` e `npx tsc --noEmit`; annotare nel messaggio di commit se qualcosa è già rosso (non correggerlo qui).
- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: checkpoint del pannello /admin, delle migrazioni 0007-0009 e dei lavori in corso, cosi' com'e' online"
```

### Task 1: Il server non accetta più la prova

**Files:**
- Modify: `lib/server/ordini.ts` (`leggiSceltaAbbonamento`, `sceltaDaRiga`), `lib/api.ts` (`SceltaAbbonamento`), `functions/api/orders.ts` (`GIA_INVIATA`, `legaUguale`, INSERT), `functions/api/admin/orders.ts` (`GIA_INSERITO`, `uguale`, INSERT), `functions/api/orders/[id].ts` (UPDATE), `lib/server/ordini-manuali.ts`, `lib/server/email.ts` (riga "Settimana di prova")
- Test: `lib/server/ordini.test.ts`, `lib/server/email.test.ts`, `lib/server/ordini-manuali.test.ts`, `lib/server/ordini-manuali-route.test.ts`

**Interfaces:**
- Produces: `type SceltaAbbonamento = { plan: FormulaId; tier: Fascia; household: Nucleo }` (senza `trial`). Le query scrivono `sub_trial` sempre a `0`; i controlli dei doppioni non confrontano più `sub_trial`.

- [ ] **Step 1: Write the failing tests** in `lib/server/ordini.test.ts`

```ts
it("rifiuta la settimana di prova, che non esiste più", () => {
  expect(leggiSceltaAbbonamento({ plan: "completo", trial: true }))
    .toEqual({ ok: false, status: 400, error: "La settimana di prova non è più disponibile" });
});
it("la scelta dell'abbonamento non ha più il campo della prova", () => {
  expect(leggiSceltaAbbonamento({ plan: "completo" }))
    .toEqual({ ok: true, value: { plan: "completo", tier: "standard", household: "singolo" } });
  expect(leggiSceltaAbbonamento({ plan: "completo", trial: false }).ok).toBe(true);
});
it("un abbonamento vecchio salvato con la prova si legge senza la prova", () => {
  expect(sceltaDaRiga({ sub_plan: "completo", sub_tier: "plus", sub_household: "coppia", sub_trial: 1 }))
    .toEqual({ plan: "completo", tier: "plus", household: "coppia" });
});
```

In `lib/server/email.test.ts`: per un abbonamento, il testo e l'HTML di `emailNuovaRichiesta` non contengono `/prova/i`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/server/ordini.test.ts lib/server/email.test.ts`
Expected: FAIL (oggi `trial: true` passa e `sceltaDaRiga` restituisce `trial`).

- [ ] **Step 3: Implement**

`leggiSceltaAbbonamento`: `trial === true` → `errore(400, "La settimana di prova non è più disponibile")`; `trial` assente o `false` è accettato e non finisce nel valore. Togliere `trial` dal tipo `SceltaAbbonamento` e correggere ogni punto segnalato da `npx tsc --noEmit`. Negli INSERT e negli UPDATE `sub_trial` diventa il letterale `0`, e da `GIA_INVIATA`/`GIA_INSERITO` si toglie `AND sub_trial=?` insieme al valore corrispondente nell'array dei binding. In `email.ts` sparisce la riga `["Settimana di prova", …]`. Aggiornare i test esistenti che si aspettano `trial` nei valori.

- [ ] **Step 4: Run all tests**

Run: `npm test` e `npx tsc --noEmit`
Expected: tutto verde, nessun errore di tipo.

- [ ] **Step 5: Commit**

```bash
git add lib/server lib/api.ts functions
git commit -m "fix: il server non accetta più la settimana di prova"
```

### Task 2: Via la prova da pagine, moduli, email e WhatsApp

**Files:**
- Modify:
  - `components/abbonamento/ScontiEProva.tsx`, `RiquadroPrezzi.tsx`, `ChiusuraAbbonamento.tsx`, `Simulatore.tsx`, `Formule.tsx`
  - `components/home/Abbonamento.tsx`, `app/(sito)/abbonamento/page.tsx`, `app/(sito)/abbonamento/[formula]/page.tsx`
  - `components/account/sezioni/NuovaRichiesta.tsx`, `Panoramica.tsx`, `Richieste.tsx`, `components/account/Vantaggi.tsx`
  - `lib/account.ts` (`SchedaAbbonamento.prova`, `schedaAbbonamento`, `corpoRichiesta`, `DatiRichiesta.prova`)
  - `lib/abbonamento.ts` (commento in testa e testi)
  - `lib/whatsapp.ts` (`messaggioAbbonamento`)
  - `components/seo/pagine.ts`, `lib/servizi.ts`, `lib/blog.ts`, `components/contatto/DoveSiamo.tsx`, `public/llms.txt`
  - `components/dashboard/OrdineNuovo.tsx`, `OrdineAbbonamento.tsx`, `OrdineGestisci.tsx`, `OrdiniElenco.tsx`, `components/admin/SimpleAdmin.tsx`: solo quanto serve perché compilino senza `trial`
- Test: `lib/whatsapp.test.ts`, `lib/account.test.ts`, `lib/sito.test.ts`, `lib/contatto.test.ts`

**Interfaces:**
- Consumes: `SceltaAbbonamento` senza `trial` (Task 1).
- Produces: `SchedaAbbonamento` senza `prova`; `DatiRichiesta` senza `prova`.

- [ ] **Step 1: Write the failing tests**

In `lib/whatsapp.test.ts`:

```ts
it("il messaggio per l'abbonamento non nomina più la prova", () => {
  for (const scelta of [{}, { formula: "completo" as const }, { fascia: "plus" as const }, { formula: "full7" as const, fascia: "standard" as const }]) {
    expect(messaggioAbbonamento(scelta)).not.toMatch(/prova/i);
  }
  expect(messaggioAbbonamento({ formula: "completo", fascia: "standard" }))
    .toBe("Ciao Matteo! Mi interessa l'abbonamento Completo (Standard) di FUEL LAB.");
});
```

In `lib/account.test.ts`, al posto dei casi con `prova`: `schedaAbbonamento(...)` non ha la chiave `prova`, e `corpoRichiesta(...)` non mette `trial` in `subscription`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/whatsapp.test.ts lib/account.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Togliere ogni proposta, casella, riga di riepilogo e frase sulla prova. Per esempio, nella scheda dell'abbonamento "Prezzo da confermare con Matteo. La prima settimana è di prova, senza impegno." diventa `Prezzo da confermare con Matteo.` Se `ScontiEProva.tsx` resta solo con gli sconti, si rinomina in `Sconti.tsx` e si aggiornano gli import. Il messaggio WhatsApp chiude con `di FUEL LAB.` invece di `… e vorrei prenotare la settimana di prova.`

- [ ] **Step 4: Verify no trial mention remains**

Run: `npm test`, `npx tsc --noEmit`, `npm run lint`, poi:

```bash
grep -rniE "settimana di prova|prima settimana|di prova|trial|\bprova\b" app components lib public --include=*.ts --include=*.tsx --include=*.txt | grep -viE "riprova|provar|provato|prova(re|ta|te|ti) |test\.ts"
```

Expected: nessuna riga che parli della settimana di prova. Restano ammesse solo le righe di `components/dashboard/**` (vecchio pannello non raggiungibile) e le parole comuni come "prova" nel senso di "tentativo" dentro i test.

- [ ] **Step 5: Commit**

```bash
git add app components lib public
git commit -m "fix: via la settimana di prova dal sito, dall'area cliente, dalle email e da WhatsApp"
```

### Task 3: Nessuna cadenza fissa di consegna

**Files:**
- Modify:
  - `lib/abbonamento.ts` (nuova costante)
  - `components/abbonamento/righe.ts` (`pastiPerConsegna`, `esempioConsegna`, `CONSEGNA_A_PAROLE`)
  - `lib/account.ts` (`frequenzaConsegne`, `prossimaUscitaDi`, `prossimaConsegna`, promemoria calendario)
  - `components/account/sezioni/NuovaRichiesta.tsx`, `Panoramica.tsx`, `Richieste.tsx`
  - `app/(sito)/come-funziona/page.tsx`, `app/(sito)/consegna-pasti-pescara/page.tsx`
  - `lib/blog-locali.ts`, `public/llms.txt`, `components/seo/pagine.ts`
- Test: `lib/abbonamento.test.ts`, `lib/account.test.ts`, `lib/sito.test.ts`

**Interfaces:**
- Produces: `export const CONSEGNA_CONCORDATA = "Ritiro o consegna, con giorno e orario concordati.";` in `lib/abbonamento.ts`.
- Produces: `frequenzaConsegne(modalita: Modalita): string`, che restituisce `"Ritiro in laboratorio, con giorno e orario concordati"` per `"pickup"` e `"Consegna a casa, con giorno e orario concordati"` per `"delivery"`.
- Produces: `prossimaUscitaDi(o, oggi)`: per un abbonamento restituisce `fulfillment_date` (l'inizio) se è oggi o dopo, altrimenti `null`; per gli altri servizi resta com'è.

- [ ] **Step 1: Write the failing tests**

In `lib/account.test.ts` (sostituiscono i casi "ogni 3 giorni"):

```ts
it("la consegna dell'abbonamento si concorda: nessuna cadenza fissa", () => {
  expect(frequenzaConsegne("pickup")).toBe("Ritiro in laboratorio, con giorno e orario concordati");
  expect(frequenzaConsegne("delivery")).toBe("Consegna a casa, con giorno e orario concordati");
});
it("per un abbonamento la prossima uscita è solo l'inizio, se non è passato", () => {
  const abb = { service: "abbonamento" as const, fulfillment_date: "2026-11-02", subscription: { plan: "completo" as const, tier: "standard" as const, household: "singolo" as const } };
  expect(prossimaUscitaDi(abb, "2026-10-28")).toBe("2026-11-02");
  expect(prossimaUscitaDi(abb, "2026-11-05")).toBeNull();
});
```

In `lib/abbonamento.test.ts`: `esempioConsegna(getFormula("completo"))` comincia con `"Ritiro o consegna, con giorno e orario concordati."`; `CONSEGNA_A_PAROLE` è `"Con giorno e orario concordati, a casa o al ritiro"`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/account.test.ts lib/abbonamento.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

I testi rivolti al cliente non usano più `CONSEGNA_OGNI_GIORNI`. `esempioConsegna(f)` diventa `CONSEGNA_CONCORDATA` seguita dalla frase sui giorni non coperti, se la formula ne ha. `pastiPerConsegna` sparisce se non la usa più nessuno. Nell'area cliente, dove oggi compare la "prossima consegna" di un abbonamento attivo senza data futura, si legge `Giorno e orario da concordare con Matteo.` Il passo 3 di `come-funziona` diventa `["3. Ritira o ricevi a casa", "I tuoi pasti arrivano pronti. Ritiro o consegna, con giorno e orario concordati."]`. Nella FAQ di `consegna-pasti-pescara` e in `llms.txt` "ogni 3 giorni" diventa "con giorno e orario concordati". In `lib/blog-locali.ts` le due frasi su "il sito indica consegna o ritiro ogni tre giorni" diventano "per gli abbonamenti giorno e orario di ritiro o consegna si concordano con Matteo". `CONSEGNA_OGNI_GIORNI` resta esportata solo per `lib/produzione.ts` e `lib/operazioni.ts`.

- [ ] **Step 4: Verify**

Run: `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, poi:

```bash
grep -rniE "ogni (3|tre) giorni|giorni successivi|consegna ogni|due volte a settimana" app components public lib --include=*.ts --include=*.tsx --include=*.txt | grep -vE "lib/(produzione|operazioni|blog|blog-approfondimenti)\.ts|components/dashboard/|\.test\.ts"
```

Expected: nessuna riga. Le righe escluse sono il vecchio pannello e i consigli generici del blog.

- [ ] **Step 5: Commit**

```bash
git add app components lib public
git commit -m "fix: consegna e ritiro con giorno e orario concordati, nessuna cadenza fissa"
```
