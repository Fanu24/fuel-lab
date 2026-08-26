# FUEL LAB — Fase A: fondo chiaro, primi e secondi, piano settimanale, WhatsApp

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portare il sito FUEL LAB su fondo chiaro mantenendo l'identità, ricostruire il catalogo in primi/secondi/extra, sostituire il carrello con un piano settimanale condivisibile, nascondere i prezzi dietro una soglia e spostare il contatto finale su WhatsApp, fino al deploy su Vercel.

**Architecture:** Next.js App Router, tutto statico. Lo stato del piano vive in `localStorage` letto con `useSyncExternalStore` e si codifica in un link condivisibile. Il catalogo passa da 27 piatti interi a due liste separate (primi e secondi) più gli extra, decomposti in modo che gli abbinamenti storici tornino ai valori originali. Nessun servizio esterno in questa fase.

**Tech Stack:** Next.js 16.3.3, React 19.2.8, TypeScript 5, Tailwind CSS 4, Vitest (da installare), next/font (Anton, Archivo, Martian Mono).

**Spec:** `docs/superpowers/specs/2026-08-26-fuellab-redesign-design.md`

## Global Constraints

- **Marchio:** ovunque "FUEL LAB", mai "FUEL" da solo. Nel navbar è testo, mai il PNG rimpicciolito.
- **Font:** Anton per i display, Archivo per il corpo, **Martian Mono per ogni numero**. Non sostituirli.
- **Shape lock:** interattivi a pillola (999px); contenitori guscio `26px` + nucleo `18px`; barre di misura a pillola. Le curve restano concentriche: la differenza è il padding di 8px.
- **Regola dell'accento:** il lime `#DFFF3E` su fondo chiaro ha contrasto **1.13:1**. Non è **mai** testo su chiaro. Solo superficie: blocchi pieni con testo scuro sopra, evidenziatori, riempimento barre, cifre dentro un blocco scuro.
- **Contrasto:** ogni testo ≥ 4.5:1 (≥ 3:1 se grande). Calcolato, non stimato.
- **Invariante catalogo:** per ogni elemento ed extra, `kcal === proteine*4 + carboidrati*4 + grassi*9`. Nessun arrotondamento di comodo.
- **Prezzi:** soglia unica "a partire da 8,90 € a pasto". Mai un totale, mai un listino, mai un prezzo per elemento. Home cooking: "su preventivo".
- **Commenti e testi:** italiano. Nei commenti niente accenti (`perche`, non `perché`): è la convenzione già in uso nel repo.
- **Numero WhatsApp:** da `process.env.NEXT_PUBLIC_WHATSAPP`. Non disponibile: il codice deve funzionare con segnaposto e degradare senza href rotti.
- **Reduced motion:** `prefers-reduced-motion` porta agli stati finali, mai all'assenza di contenuto.
- **Fase B (database, dashboard, auth) è fuori da questo piano.**

## File Structure

**Nuovi**
- `lib/catalogo.ts` — primi, secondi, extra, e le funzioni di accesso. Sostituisce `lib/dishes.ts`.
- `lib/catalogo.test.ts` — invarianti macro e ricomposizione degli abbinamenti storici.
- `lib/piano.tsx` — store del piano settimanale (esiste, va riscritto sul modello a casella).
- `lib/piano.test.ts` — macro per giorno e per settimana.
- `lib/condivisione.ts` — codifica e decodifica del piano nell'URL.
- `lib/condivisione.test.ts` — round-trip e limite di lunghezza.
- `lib/whatsapp.ts` — costruzione dei link `wa.me` con testo precompilato.
- `lib/whatsapp.test.ts` — messaggio e comportamento senza numero.
- `lib/servizi.ts` — i tre servizi e la soglia di prezzo.
- `components/ElementCard.tsx` — scheda di un primo o secondo con barre macro animate.
- `components/settimana/Griglia.tsx` — la griglia 7×2 desktop.
- `components/settimana/ColonnaGiorno.tsx` — la vista mobile, una colonna per giorno.
- `components/settimana/SelettoreCasella.tsx` — il pannello che riempie una casella.
- `app/settimana/page.tsx` + `SettimanaClient.tsx` — la pagina del piano.
- `app/servizi/page.tsx` — i tre servizi.
- `app/richiesta/page.tsx` + `RichiestaClient.tsx` — form breve e passaggio a WhatsApp.

**Modificati**
- `app/globals.css` — sistema chiaro con l'identità ripristinata.
- `app/layout.tsx` — font e provider.
- `components/Nav.tsx`, `components/Footer.tsx`, `components/MacroBar.tsx`, `components/ui.tsx`, `components/Ticker.tsx`.
- `app/page.tsx`, `app/menu/*`, `app/scheda/*`, `app/come-funziona/page.tsx`, `app/chi-e-matteo/page.tsx`.
- `lib/matcher.ts` — compone abbinamenti primo+secondo.
- `lib/pricing.ts` — resta la logica, esce solo la soglia.

**Rimossi**
- `lib/cart.tsx`, `lib/dishes.ts`, `app/box/`, `app/checkout/`, `components/DishCard.tsx`.

---

### Task 0: Controllo di versione e stato di partenza

**Livello modello: economico.** Solo comandi e un file di testo.

**Files:**
- Create: `.gitignore` (verificare che contenga già `node_modules`, `.next`, `.superpowers/`)
- Create: `docs/superpowers/plans/` (già esistente dopo il salvataggio di questo piano)

**Interfaces:**
- Consumes: niente.
- Produces: un repository git con un commit iniziale che fotografa lo stato attuale. Ogni task successivo termina con un commit.

- [ ] **Step 1: Verificare che non esista già un repository**

```bash
cd "C:/Users/dotat/Desktop/Siti Web/Sito Matteo"
test -d .git && echo "REPO GIA PRESENTE - FERMARSI" || echo "ok, procedere"
```

Se stampa "REPO GIA PRESENTE", fermarsi e segnalare: non inizializzare sopra un repo esistente.

- [ ] **Step 2: Verificare che .gitignore escluda il necessario**

```bash
grep -c "node_modules" .gitignore && grep -c ".next" .gitignore && grep -c ".superpowers" .gitignore
```

Attesa: tre numeri ≥ 1. Se `.superpowers` manca, aggiungerlo:

```bash
printf '\n# brainstorming visivo (mockup e screenshot di lavoro)\n.superpowers/\n' >> .gitignore
```

- [ ] **Step 3: Inizializzare e fotografare lo stato**

```bash
git init
git add -A
git commit -m "chore: stato iniziale prima del redesign chiaro"
```

- [ ] **Step 4: Verificare**

```bash
git log --oneline | head -3
git status --porcelain | head -5
```

Attesa: un commit, working tree pulito.

---

### Task 1: Sistema visivo chiaro con l'identità ripristinata

**Livello modello: costoso.** È il contratto su cui poggia tutto il resto: un errore qui si propaga in ogni pagina, e la regola dell'accento richiede giudizio, non esecuzione.

**Files:**
- Modify: `app/globals.css` (riscrittura completa)
- Modify: `app/layout.tsx` (font)

**Interfaces:**
- Consumes: niente.
- Produces: i token Tailwind `--color-ink`, `--color-paper`, `--color-card`, `--color-tray`, `--color-cell`, `--color-lime`, `--color-lime-deep`, `--color-muted`, `--color-mink`, e le variabili font `--f-disp` (Anton), `--f-ui` (Archivo), `--f-mono` (Martian Mono). Classi componente: `.wrap .mono .eyebrow .h1 .h2 .h3 .lead .label .hl .hl-bar .hl-tx .btn .btn-p .btn-s .btn-sm .dot .shell .core .chip .chip-k .chip-ink .price .price-da .price-n .price-u .bar-l .bar-v .bar-track .bar-tick .macrobar .readout .ro-n .ro-l .num .num-lime .num-ink .dayhead .rowlab .cell .cell-full .cell-empty .cell-d .cell-k .total .total-l .total-i .total-n .ticker .tk-w .tk-d .field .field-err .note .reveal .on-ink`. Keyframes: `fuel-marquee`, `fuel-rise`, `fuel-scan`.

- [ ] **Step 1: Calcolare i contrasti prima di scrivere il CSS**

Non stimare. Eseguire questo script e incollare i risultati nel commento in testa a `globals.css`.

```bash
cat > /tmp/contrasto.mjs <<'EOF'
const L = (hex) => {
  const c = hex.replace('#','').match(/../g).map(h => parseInt(h,16)/255)
    .map(v => v <= 0.03928 ? v/12.92 : ((v+0.055)/1.055)**2.4);
  return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2];
};
const R = (a,b) => { const x=L(a), y=L(b); const [hi,lo]=x>y?[x,y]:[y,x];
  return ((hi+0.05)/(lo+0.05)).toFixed(2); };
const T = {ink:'#12301F', paper:'#F4F1E8', card:'#FFFFFF', tray:'#E9E4D6',
           cell:'#EFEBDF', lime:'#DFFF3E', muted:'#5B6B5F', mink:'#A9B5AC'};
for (const [ta,ca] of [['ink','paper'],['ink','card'],['ink','lime'],['ink','tray'],
                       ['muted','paper'],['muted','card'],['mink','ink'],
                       ['lime','ink'],['lime','paper']])
  console.log(`${ta.padEnd(6)} su ${ca.padEnd(6)} = ${R(T[ta],T[ca])} : 1`);
EOF
node /tmp/contrasto.mjs
```

Attesa: tutte le coppie ≥ 4.5 **tranne** `lime su paper`, che deve risultare circa `1.13` — è la prova del vincolo, e il motivo per cui il lime non può essere testo.

- [ ] **Step 2: Riscrivere `app/globals.css`**

Partire dal file attuale (che ha già la struttura giusta) e cambiare **solo** questo:

```css
@theme {
  --color-ink: #12301f;        /* verde bosco: tutto il testo */
  --color-paper: #f4f1e8;      /* fondo pagina, carta calda */
  --color-card: #ffffff;
  --color-tray: #e9e4d6;       /* guscio esterno della doppia scocca */
  --color-cell: #efebdf;       /* caselle vuote della griglia */
  --color-lime: #dfff3e;       /* accento unico, SOLO superficie */
  --color-lime-deep: #c2e81c;
  --color-muted: #5b6b5f;
  --color-mink: #a9b5ac;       /* testo secondario dentro i blocchi scuri */

  --font-disp: var(--f-disp), "Oswald", Impact, sans-serif;
  --font-ui: var(--f-ui), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--f-mono), ui-monospace, SFMono-Regular, monospace;
}

:root {
  --hair: rgba(18, 48, 31, 0.14);
  --hair-ink: rgba(255, 255, 255, 0.16);

  /* SHAPE LOCK: identico a prima, non toccarlo */
  --shell: 26px;
  --pad: 8px;
  --core-r: 18px;

  --e-out: cubic-bezier(0.16, 1, 0.3, 1);
  --e-over: cubic-bezier(0.2, 1.3, 0.34, 1);
  --e-mech: cubic-bezier(0.65, 0, 0.35, 1);
}
```

I display tornano ad Anton:

```css
.h1, .h2, .h3 {
  font-family: var(--font-disp);
  font-weight: 400;
  text-transform: uppercase;
  color: var(--color-ink);
}
.h1 { font-size: min(102px, 8vw); line-height: 0.86; letter-spacing: -0.012em; }
.h2 { font-size: min(72px, 5.7vw); line-height: 0.88; letter-spacing: -0.01em; }
.h3 { font-size: min(38px, 4.6vw); line-height: 0.98; }
```

La doppia scocca torna al guscio/nucleo con le curve concentriche, su fondo chiaro:

```css
.shell {
  padding: var(--pad);
  border-radius: var(--shell);
  background: var(--color-tray);
  box-shadow: 0 2px 6px rgba(18,48,31,.04), 0 40px 80px -46px rgba(18,48,31,.28);
}
.core { border-radius: var(--core-r); overflow: hidden; background: var(--color-card); }
```

I bottoni: il primario diventa **inchiostro pieno** (non lime, che come superficie di un bottone con testo scuro funziona ma toglie forza all'accento dove serve davvero):

```css
.btn-p { background: var(--color-ink); color: #fff; }
.btn-p .dot { background: rgba(255,255,255,.14); color: #fff; }
.btn-p:hover:not(:disabled) .dot { background: var(--color-lime); color: var(--color-ink); }
.btn-s { background: var(--color-card); color: var(--color-ink); box-shadow: inset 0 0 0 1.5px var(--color-ink); }
.btn-s:hover:not(:disabled) { background: var(--color-lime); }
```

Le barre macro: binario chiaro, riempimento lime, **tacca del target conservata**:

```css
.bar-track { background: var(--color-tray); }
.bar-track > i { background: var(--color-lime); }
.bar-track.over > i { background: var(--color-ink); }
.bar-tick { background: var(--color-ink); opacity: .45; }
.on-ink .bar-track { background: rgba(255,255,255,.14); }
.on-ink .bar-tick { background: #fff; opacity: .5; }
```

La grana su fondo chiaro cambia modalità di fusione, altrimenti sporca invece di dare texture:

```css
.grain { mix-blend-mode: multiply; opacity: .04; }
```

Conservare invariati dal file attuale: `.reveal`/`.in` con la guardia `.js`, il blocco `prefers-reduced-motion`, i keyframes, e la regola `@media (max-width: 639px) { .btn { white-space: normal; ... } }` che impedisce alle etichette italiane lunghe di far sfondare la griglia.

- [ ] **Step 3: Rimettere i font in `app/layout.tsx`**

```tsx
import { Anton, Archivo, Martian_Mono } from "next/font/google";

const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--f-disp", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--f-ui", display: "swap" });
const martian = Martian_Mono({ subsets: ["latin"], axes: ["wdth"], variable: "--f-mono", display: "swap" });
```

E sul tag `html`: `className={`${anton.variable} ${archivo.variable} ${martian.variable}`}`.
Cambiare anche `viewport.themeColor` in `"#f4f1e8"`.

- [ ] **Step 4: Verificare che la build passi**

```bash
npx tsc --noEmit && npx next build 2>&1 | tail -5
```

Attesa: nessun errore TypeScript, build completata.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat: sistema visivo chiaro con Anton, Martian Mono e shape lock ripristinati"
```

---

### Task 2: Bonificare i token morti e le scritte lime invisibili

**Livello modello: economico.** È una sostituzione meccanica guidata da una tabella fissa. Nessuna decisione di design.

**Files:**
- Modify: tutti i file in `app/` e `components/` che contengono le classi elencate sotto.

**Interfaces:**
- Consumes: i token definiti nel Task 1.
- Produces: zero occorrenze delle classi morte, zero testi lime su fondo chiaro.

**Contesto.** Dopo il Task 1 il progetto contiene circa 148 usi di classi che non funzionano più. Due categorie, con conseguenze diverse:

- `text-mist` (12), `text-mist-dim` (34), `bg-ink-2` (8) → i token non esistono più: Tailwind non genera nulla e l'elemento eredita il colore del genitore. Silenzioso.
- `text-lime` (37) → il token esiste ancora, quindi la classe **funziona**: produce testo lime su fondo chiaro, contrasto 1.13:1. Invisibile ma presente. È il difetto più insidioso perché passa ogni controllo automatico.

- [ ] **Step 1: Contare la situazione di partenza**

```bash
cd "C:/Users/dotat/Desktop/Siti Web/Sito Matteo"
grep -roh "\b\(text\|bg\|border\|decoration\|outline\|fill\)-\(mist-dim\|mist\|ink-2\|core\|lime-deep\|lime\)\b" app components | sort | uniq -c | sort -rn
```

Annotare i numeri: serviranno per verificare che la bonifica sia completa.

- [ ] **Step 2: Applicare la tabella di sostituzione**

| Classe morta | Diventa | Perche |
|---|---|---|
| `text-mist` | `text-ink` | era il testo corrente su scuro, ora e il testo corrente su chiaro |
| `text-mist-dim` | `text-muted` | testo secondario |
| `bg-ink-2` | `bg-tray` | superficie rialzata |
| `bg-core` | `bg-card` | nucleo delle schede |
| `text-lime` | `text-ink` | **mai lime su chiaro** |
| `decoration-lime` | `decoration-ink` | idem |
| `outline-lime` | `outline-ink` | idem |
| `border-lime` | `border-ink` | idem |

**Eccezione da rispettare a mano:** dentro un contenitore scuro (elementi con classe `on-ink`, `bg-ink`, `.readout`, `.total`) il lime **resta corretto** come testo, perche il fondo e scuro. Prima di sostituire `text-lime`, controllare l'antenato: se e dentro un blocco scuro, lasciarlo.

```bash
# elenco dei punti da controllare a mano prima di sostituire
grep -rn "text-lime" app components
```

`bg-lime` **non si tocca**: e l'uso corretto dell'accento come superficie.

- [ ] **Step 3: Verificare che non resti nulla**

```bash
grep -rn "text-mist\|text-mist-dim\|bg-ink-2\|bg-core\|decoration-lime\|outline-lime\|border-lime" app components | wc -l
```

Attesa: `0`.

```bash
grep -rn "text-lime" app components
```

Attesa: solo occorrenze dentro blocchi scuri, ognuna verificata.

- [ ] **Step 4: Build**

```bash
npx tsc --noEmit && npx next build 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: rimossi i token morti e i testi lime invisibili su fondo chiaro"
```

---

### Task 3: Il catalogo in primi, secondi ed extra

**Livello modello: costoso.** La decomposizione richiede giudizio culinario e nutrizionale, e l'invariante deve reggere su ogni riga.

**Files:**
- Create: `lib/catalogo.ts`
- Create: `lib/catalogo.test.ts`
- Modify: `package.json` (aggiunta di Vitest)
- Create: `vitest.config.ts`
- **Non** cancellare `lib/dishes.ts` in questo task: serve come sorgente della decomposizione e i suoi consumatori vivono fino al Task 9. Si rimuove nel Task 13.

**Interfaces:**
- Consumes: `Macros` e i tag da `lib/types.ts`.
- Produces:
  ```ts
  export type Categoria = "primo" | "secondo";
  export interface Elemento {
    id: string; nome: string; descrizione: string; categoria: Categoria;
    grammi: number; kcal: number; proteine: number; carboidrati: number; grassi: number;
    tag: Tag[]; allergeni: string[]; img: string; giorno: "lunedi" | "giovedi";
  }
  export interface Extra {
    id: string; nome: string; grammi: number; kcal: number;
    proteine: number; carboidrati: number; grassi: number; allergeni: string[];
  }
  export const PRIMI: Elemento[];
  export const SECONDI: Elemento[];
  export const EXTRA: Extra[];
  export const ABBINAMENTI: { nome: string; primo: string; secondo: string }[];
  // `nome` e l'id del piatto originale in lib/dishes.ts (es. "pollo-basmati-broccoli"),
  // perche e la chiave con cui il test lo confronta con i valori storici.
  export function getElemento(id: string): Elemento | undefined;
  export function getExtra(id: string): Extra | undefined;
  export function elementoImg(e: Elemento, w?: number): string;
  export function kcalDa(p: number, c: number, g: number): number; // p*4 + c*4 + g*9
  export const MAX_MACRO: { proteine: number; carboidrati: number; grassi: number };
  ```

- [ ] **Step 1: Installare Vitest**

```bash
npm i -D vitest
```

Creare `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: { environment: "node", include: ["lib/**/*.test.ts"] },
});
```

Aggiungere a `package.json` in `scripts`: `"test": "vitest run"`.

- [ ] **Step 2: Scrivere il test che fallisce**

`lib/catalogo.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ABBINAMENTI, EXTRA, PRIMI, SECONDI, getElemento, kcalDa } from "./catalogo";

const tutti = [...PRIMI, ...SECONDI];

describe("catalogo", () => {
  it("ha primi e secondi", () => {
    expect(PRIMI.length).toBeGreaterThanOrEqual(12);
    expect(SECONDI.length).toBeGreaterThanOrEqual(14);
    expect(EXTRA.length).toBeGreaterThanOrEqual(8);
  });

  it("ha id univoci", () => {
    const ids = [...tutti.map((e) => e.id), ...EXTRA.map((e) => e.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("rispetta kcal = P*4 + C*4 + G*9 su ogni elemento", () => {
    for (const e of tutti)
      expect(`${e.id}:${e.kcal}`).toBe(`${e.id}:${kcalDa(e.proteine, e.carboidrati, e.grassi)}`);
  });

  it("rispetta kcal = P*4 + C*4 + G*9 su ogni extra", () => {
    for (const e of EXTRA)
      expect(`${e.id}:${e.kcal}`).toBe(`${e.id}:${kcalDa(e.proteine, e.carboidrati, e.grassi)}`);
  });

  it("dichiara gli allergeni su ogni riga", () => {
    for (const e of [...tutti, ...EXTRA]) expect(Array.isArray(e.allergeni)).toBe(true);
  });

  it("assegna la categoria giusta", () => {
    for (const p of PRIMI) expect(p.categoria).toBe("primo");
    for (const s of SECONDI) expect(s.categoria).toBe("secondo");
  });

  // Il test che protegge la decomposizione. NON basta verificare che la somma
  // soddisfi kcal = P*4+C*4+G*9: e automaticamente vero se entrambe le parti gia
  // la soddisfano, quindi non proverebbe nulla. Va confrontata con i valori
  // esatti dei 27 piatti originali, che sono la tabella qui sotto.
  const ORIGINALI: Record<string, [number, number, number, number]> = {
    // nome abbinamento: [kcal, proteine, carboidrati, grassi]
    "pollo-basmati-broccoli": [588, 52, 68, 12],
    "salmone-quinoa-verdure": [636, 44, 52, 28],
    "ragu-manzo-patate-dolci": [607, 48, 61, 19],
    "tacchino-farro-zucchine": [555, 50, 64, 11],
    "merluzzo-patate-fagiolini": [469, 42, 55, 9],
    "pollo-venere-peperoni": [597, 54, 66, 13],
    "albumi-avocado-integrale": [518, 38, 42, 22],
    "orata-couscous-broccoletti": [522, 41, 58, 14],
    "tofu-integrale-verdure": [552, 30, 72, 16],
    "ceci-bulgur-melanzane": [551, 26, 78, 15],
    "straccetti-manzo-rucola": [608, 51, 65, 16],
    "tonno-patate-viola-asparagi": [537, 46, 50, 17],
    "pollo-curry-jasmine-piselli": [602, 49, 70, 14],
    "maiale-sedano-rapa-cavolo": [486, 47, 34, 18],
    "gamberi-basmati-zucchine": [502, 40, 63, 10],
    "uova-patate-spinaci": [509, 32, 48, 21],
    "vitello-polenta-funghi": [557, 45, 56, 17],
    "salmone-integrale-cavolo-nero": [646, 43, 60, 26],
    "pollo-pasta-integrale-pomodorini": [648, 53, 82, 12],
    "seitan-quinoa-broccoli": [476, 34, 58, 12],
    "sgombro-patate-dolci-cime": [580, 39, 52, 24],
    "tacchino-basmati-carote": [586, 52, 72, 10],
    "lenticchie-riso-verdure": [565, 28, 84, 13],
    "manzo-couscous-zucca": [607, 50, 68, 15],
    "tempeh-quinoa-edamame": [594, 52, 56, 18],
    "albumi-ricotta-patate-asparagi": [518, 50, 48, 14],
    "burger-lenticchie-tofu": [567, 44, 64, 15],
  };

  it("ricompone i 27 abbinamenti storici ai valori originali esatti", () => {
    expect(ABBINAMENTI.length).toBe(27);
    expect(Object.keys(ORIGINALI).length).toBe(27);
    for (const a of ABBINAMENTI) {
      const atteso = ORIGINALI[a.nome];
      expect(atteso, `abbinamento non previsto: ${a.nome}`).toBeDefined();
      const p = getElemento(a.primo);
      const s = getElemento(a.secondo);
      expect(p, `primo mancante per ${a.nome}`).toBeDefined();
      expect(s, `secondo mancante per ${a.nome}`).toBeDefined();
      if (!p || !s || !atteso) continue;
      expect(
        [p.kcal + s.kcal, p.proteine + s.proteine, p.carboidrati + s.carboidrati, p.grassi + s.grassi],
        `${a.nome} non torna ai valori del piatto originale`,
      ).toEqual(atteso);
    }
  });

  it("non ha macro negative", () => {
    for (const e of tutti)
      for (const k of ["proteine", "carboidrati", "grassi"] as const)
        expect(e[k], `${e.id}.${k}`).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 3: Eseguire il test e verificare che fallisca**

```bash
npx vitest run lib/catalogo.test.ts
```

Attesa: FAIL con "Failed to resolve import ./catalogo".

- [ ] **Step 4: Costruire il catalogo applicando questa tabella di decomposizione**

La regola: **il secondo prende la proteina con i suoi grassi e pochi carboidrati incidentali; il primo prende tutto il resto** (base di carboidrati più la verdura di accompagnamento). Il primo si ricava per differenza dal piatto originale, quindi la somma torna per costruzione.

I 27 piatti originali sono in `lib/dishes.ts` (leggerlo prima di iniziare). Per ciascuno, il **secondo** ha questi macro; il **primo** è la differenza:

| # | Piatto originale (P/C/G) | Secondo | Secondo P/C/G | Primo (differenza) |
|---|---|---|---|---|
| 1 | pollo-basmati-broccoli 52/68/12 | Pollo alla piastra | 44/2/9 | Riso basmati e broccoli 8/66/3 |
| 2 | salmone-quinoa-verdure 44/52/28 | Salmone al forno | 35/2/22 | Quinoa e verdure di stagione 9/50/6 |
| 3 | ragu-manzo-patate-dolci 48/61/19 | Ragu di manzo | 42/2/15 | Patate dolci e spinaci 6/59/4 |
| 4 | tacchino-farro-zucchine 50/64/11 | Fesa di tacchino | 41/2/7 | Farro e zucchine grigliate 9/62/4 |
| 5 | merluzzo-patate-fagiolini 42/55/9 | Merluzzo in crosta di erbe | 35/2/6 | Patate al forno e fagiolini 7/53/3 |
| 6 | pollo-venere-peperoni 54/66/13 | Petto di pollo agli agrumi | 46/2/9 | Riso venere e peperoni 8/64/4 |
| 7 | albumi-avocado-integrale 38/42/22 | Frittata di albumi | 30/3/4 | Avocado e pane integrale 8/39/18 |
| 8 | orata-couscous-broccoletti 41/58/14 | Orata al forno | 32/2/10 | Cous cous al limone e broccoletti 9/56/4 |
| 9 | tofu-integrale-verdure 30/72/16 | Tofu marinato allo zenzero | 22/2/11 | Riso integrale e verdure croccanti 8/70/5 |
| 10 | ceci-bulgur-melanzane 26/78/15 | Ceci speziati al cumino | 18/2/8 | Bulgur e melanzane 8/76/7 |
| 11 | straccetti-manzo-rucola 51/65/16 | Straccetti di manzo | 43/1/13 | Riso basmati e rucola 8/64/3 |
| 12 | tonno-patate-viola-asparagi 46/50/17 | Tonno scottato al sesamo | 39/2/14 | Patate viola e asparagi 7/48/3 |
| 13 | pollo-curry-jasmine-piselli 49/70/14 | Pollo al curry leggero | 42/4/10 | Riso jasmine e piselli 7/66/4 |
| 14 | maiale-sedano-rapa-cavolo 47/34/18 | Filetto di maiale | 41/1/14 | Pure di sedano rapa e cavolo 6/33/4 |
| 15 | gamberi-basmati-zucchine 40/63/10 | Gamberi aglio e prezzemolo | 33/1/6 | Riso basmati e zucchine 7/62/4 |
| 16 | uova-patate-spinaci 32/48/21 | Uova biologiche | 24/2/17 | Patate rustiche e spinaci 8/46/4 |
| 17 | vitello-polenta-funghi 45/56/17 | Fettine di vitello | 37/1/12 | Polenta taragna e funghi 8/55/5 |
| 18 | salmone-integrale-cavolo-nero 43/60/26 | Salmone al vapore | 35/2/21 | Riso integrale e cavolo nero 8/58/5 |
| 19 | pollo-pasta-integrale-pomodorini 53/82/12 | Pollo a straccetti | 43/2/8 | Pasta integrale e pomodorini 10/80/4 |
| 20 | seitan-quinoa-broccoli 34/58/12 | Seitan alla piastra | 25/4/3 | Quinoa e broccoli 9/54/9 |
| 21 | sgombro-patate-dolci-cime 39/52/24 | Sgombro al forno | 32/1/20 | Patate dolci e cime di rapa 7/51/4 |
| 22 | tacchino-basmati-carote 52/72/10 | Tacchino a fette | 44/2/6 | Riso basmati e carote all'arancia 8/70/4 |
| 23 | lenticchie-riso-verdure 28/84/13 | Lenticchie di Santo Stefano | 18/32/4 | Riso e verdure al forno 10/52/9 |
| 24 | manzo-couscous-zucca 50/68/15 | Spezzatino di manzo | 43/2/11 | Cous cous integrale e zucca 7/66/4 |
| 25 | tempeh-quinoa-edamame 52/56/18 | Tempeh marinato al tamari | 34/8/13 | Quinoa e edamame 18/48/5 |
| 26 | albumi-ricotta-patate-asparagi 50/48/14 | Albumi e ricotta | 42/6/10 | Patate al forno e asparagi 8/42/4 |
| 27 | burger-lenticchie-tofu 44/64/15 | Burger di lenticchie e tofu | 32/12/10 | Riso e verdure di stagione 12/52/5 |

**Deduplicazione.** Dopo aver generato le 54 righe, unire quelle **identiche per nome e macro**. Righe con lo stesso nome ma macro diverse vanno rinominate per distinguerle (per esempio "Salmone al forno" e "Salmone al vapore" restano separati: preparazioni diverse, grassi diversi). Il conteggio finale atteso è nell'ordine di 20-26 primi e 20-26 secondi: **il numero e un risultato, non un obiettivo** — l'unico vincolo che conta e l'invariante.

**Grammature.** Ripartire i grammi del piatto originale fra primo e secondo in proporzione plausibile (indicativamente 60/40 a favore del primo), arrotondando a multipli di 10.

**Immagini.** Ogni elemento riusa l'`img` del piatto originale da cui proviene. Quando due elementi condividono la stessa foto perche vengono dallo stesso piatto, va bene: sono lo stesso piatto fotografato.

**Allergeni** (Reg. UE 1169/2011). Assegnare almeno: `glutine` (farro, bulgur, cous cous, pasta, pane, seitan), `pesce` (tutti i secondi di pesce), `crostacei` (gamberi), `uova` (albumi, uova), `latte` (ricotta, grana, polenta taragna), `soia` (tofu, tempeh, edamame, tamari), `frutta a guscio` (mandorle). Elementi senza allergeni: array vuoto, non assente.

**Extra** (almeno otto, macro coerenti con l'invariante):

| id | nome | grammi | P | C | G | kcal | allergeni |
|---|---|---|---|---|---|---|---|
| `avocado` | Mezzo avocado | 80 | 2 | 7 | 12 | 144 | — |
| `olio-evo` | Olio EVO a crudo | 10 | 0 | 0 | 10 | 90 | — |
| `grana` | Scaglie di grana | 20 | 7 | 0 | 6 | 82 | latte |
| `mandorle` | Mandorle tostate | 25 | 6 | 5 | 13 | 161 | frutta a guscio |
| `uovo-sodo` | Uovo sodo | 55 | 7 | 0 | 5 | 73 | uova |
| `proteina-extra` | Porzione proteica maggiorata | 70 | 18 | 1 | 3 | 103 | — |
| `pane-integrale` | Pane integrale | 60 | 5 | 28 | 2 | 150 | glutine |
| `hummus` | Hummus di ceci | 60 | 4 | 9 | 7 | 115 | sesamo |

`MAX_MACRO` si calcola dal catalogo, non si scrive a mano:

```ts
export const MAX_MACRO = {
  proteine: Math.max(...[...PRIMI, ...SECONDI].map((e) => e.proteine)),
  carboidrati: Math.max(...[...PRIMI, ...SECONDI].map((e) => e.carboidrati)),
  grassi: Math.max(...[...PRIMI, ...SECONDI].map((e) => e.grassi)),
};
```

- [ ] **Step 5: Eseguire i test finche passano**

```bash
npx vitest run lib/catalogo.test.ts
```

Attesa: tutti verdi. Se "ricompone i 27 abbinamenti" fallisce, l'errore e nella tabella sopra o nella differenza calcolata: **non modificare il test**, correggere i dati.

- [ ] **Step 6: Commit**

```bash
git add lib/catalogo.ts lib/catalogo.test.ts vitest.config.ts package.json package-lock.json
git commit -m "feat: catalogo in primi, secondi ed extra con allergeni e invarianti verificate"
```

---

### Task 4: Il piano settimanale a caselle

**Livello modello: costoso.** Modello dati centrale, con la trappola dell'idratazione.

**Files:**
- Modify: `lib/piano.tsx` (riscrittura: il file esiste ma usa il modello a piatto intero)
- Create: `lib/piano.test.ts`
- Modify: `app/layout.tsx` (sostituire `CartProvider` con `PianoProvider`)
- Delete: `lib/cart.tsx`

**Interfaces:**
- Consumes: `getElemento`, `getExtra` dal Task 3.
- Produces:
  ```ts
  export const GIORNI: readonly ["lun","mar","mer","gio","ven","sab","dom"];
  export const PASTI: readonly ["pranzo","cena"];
  export type GiornoSettimana = (typeof GIORNI)[number];
  export type Pasto = (typeof PASTI)[number];
  export interface Casella { primo?: string; secondo?: string; extra: string[] }
  export type Piano = Partial<Record<GiornoSettimana, Partial<Record<Pasto, Casella>>>>;
  export const NOMI_GIORNO: Record<GiornoSettimana, string>;
  export const CASELLE_TOTALI: 14;
  export function macroCasella(c: Casella | undefined): Macros;
  export function PianoProvider(p: { children: React.ReactNode }): JSX.Element;
  export function usePiano(): {
    piano: Piano; pronto: boolean; pasti: number;
    macroGiorno(g: GiornoSettimana): Macros;
    macroSettimana: Macros;
    casella(g: GiornoSettimana, m: Pasto): Casella | undefined;
    metti(g: GiornoSettimana, m: Pasto, categoria: "primo" | "secondo", id: string): void;
    togliElemento(g: GiornoSettimana, m: Pasto, categoria: "primo" | "secondo"): void;
    alternaExtra(g: GiornoSettimana, m: Pasto, extraId: string): void;
    svuotaCasella(g: GiornoSettimana, m: Pasto): void;
    primaLibera(categoria: "primo" | "secondo"): { g: GiornoSettimana; m: Pasto } | null;
    sostituisciPiano(p: Piano): void;
    svuota(): void;
  };
  ```

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/piano.test.ts` (testa le funzioni pure, non il provider React):

```ts
import { describe, expect, it } from "vitest";
import { macroCasella } from "./piano";
import { getElemento, getExtra, PRIMI, SECONDI, EXTRA } from "./catalogo";

describe("macroCasella", () => {
  it("una casella vuota vale zero", () => {
    expect(macroCasella(undefined)).toEqual({ kcal: 0, proteine: 0, carboidrati: 0, grassi: 0 });
    expect(macroCasella({ extra: [] })).toEqual({ kcal: 0, proteine: 0, carboidrati: 0, grassi: 0 });
  });

  it("somma primo e secondo", () => {
    const p = PRIMI[0], s = SECONDI[0];
    const m = macroCasella({ primo: p.id, secondo: s.id, extra: [] });
    expect(m.kcal).toBe(p.kcal + s.kcal);
    expect(m.proteine).toBe(p.proteine + s.proteine);
  });

  it("somma anche gli extra", () => {
    const p = PRIMI[0], x = EXTRA[0];
    const m = macroCasella({ primo: p.id, extra: [x.id] });
    expect(m.kcal).toBe(p.kcal + x.kcal);
    expect(m.grassi).toBe(p.grassi + x.grassi);
  });

  it("ignora gli id sconosciuti invece di esplodere", () => {
    const m = macroCasella({ primo: "non-esiste", secondo: SECONDI[0].id, extra: ["nemmeno"] });
    expect(m.kcal).toBe(SECONDI[0].kcal);
  });

  it("accetta una casella con il solo secondo", () => {
    const s = SECONDI[0];
    expect(macroCasella({ secondo: s.id, extra: [] }).kcal).toBe(s.kcal);
  });
});
```

- [ ] **Step 2: Eseguire e verificare il fallimento**

```bash
npx vitest run lib/piano.test.ts
```

Attesa: FAIL, `macroCasella` non esportata.

- [ ] **Step 3: Riscrivere `lib/piano.tsx`**

Conservare **integralmente** il meccanismo dello store gia presente nel file: `useSyncExternalStore` con `getServerSnapshot` che restituisce un oggetto congelato `VUOTO_SSR`, `pronto = corrente !== VUOTO_SSR`, riferimento stabile da `getSnapshot`, listener `storage` per la sincronia fra schede, e scarto delle righe che puntano a id non piu in catalogo. Quel meccanismo esiste perche leggere `localStorage` in un effetto e poi fare `setState` produce un mismatch di idratazione e un render a cascata segnalato da ESLint.

Cambia solo la **forma** del dato: da `{ dishId, qta }` a `Casella`.

```ts
export function macroCasella(c: Casella | undefined): Macros {
  const zero = { kcal: 0, proteine: 0, carboidrati: 0, grassi: 0 };
  if (!c) return zero;
  const pezzi = [
    c.primo ? getElemento(c.primo) : undefined,
    c.secondo ? getElemento(c.secondo) : undefined,
    ...(c.extra ?? []).map((id) => getExtra(id)),
  ].filter(Boolean);
  return pezzi.reduce(
    (a, p) => ({
      kcal: a.kcal + p!.kcal,
      proteine: a.proteine + p!.proteine,
      carboidrati: a.carboidrati + p!.carboidrati,
      grassi: a.grassi + p!.grassi,
    }),
    zero,
  );
}
```

`primaLibera(categoria)` scorre `GIORNI` × `PASTI` e restituisce la prima casella in cui quella categoria e vuota; `null` se non ce n'e nessuna. `alternaExtra` aggiunge o toglie l'extra dalla casella.

La chiave di `localStorage` e `"fuellab.piano.v1"`.

- [ ] **Step 4: Sostituire il provider nel layout**

In `app/layout.tsx`: `import { PianoProvider } from "@/lib/piano";` e sostituire `<CartProvider>` con `<PianoProvider>`.

- [ ] **Step 5: Test e build**

```bash
npx vitest run lib/piano.test.ts && npx tsc --noEmit
```

Attesa: test verdi. `tsc` segnalera errori nelle pagine che usano ancora `useCart`: e previsto, verranno sistemate nei task successivi. Annotare l'elenco.

- [ ] **Step 6: Commit**

```bash
git add lib/piano.tsx lib/piano.test.ts app/layout.tsx
git commit -m "feat: piano settimanale a caselle con primo, secondo ed extra"
```

---

### Task 5: Il matcher compone abbinamenti

**Livello modello: costoso.** L'algoritmo e il pezzo di valore del sito e va calibrato sul catalogo nuovo.

**Files:**
- Modify: `lib/matcher.ts`
- Create: `lib/matcher.test.ts`

**Interfaces:**
- Consumes: `PRIMI`, `SECONDI` dal Task 3; `Casella`, `Piano`, `GIORNI`, `PASTI` dal Task 4.
- Produces:
  ```ts
  export function componiPiano(target: Target, vincoli: Vincoli): {
    piano: Piano; totali: Macros; bersaglio: Macros;
    scarti: { kcal: number; proteine: number; carboidrati: number; grassi: number };
    aCentro: boolean;
  };
  export function quotaCoperta(pastiAlGiorno: number): number;
  export function targetPerPasto(t: Target): Macros;
  ```

- [ ] **Step 1: Scrivere il test**

`lib/matcher.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { componiPiano, TARGET_DEFAULT, VINCOLI_DEFAULT, quotaCoperta } from "./matcher";
import { macroCasella, GIORNI, PASTI } from "./piano";

const caselle = (p: ReturnType<typeof componiPiano>["piano"]) =>
  GIORNI.flatMap((g) => PASTI.map((m) => p[g]?.[m]).filter(Boolean));

describe("matcher", () => {
  it("copre un quarto di giornata per pasto", () => {
    expect(quotaCoperta(1)).toBeCloseTo(0.25);
    expect(quotaCoperta(2)).toBeCloseTo(0.5);
    expect(quotaCoperta(3)).toBeCloseTo(0.75);
  });

  it("riempie il numero di caselle richiesto", () => {
    const r = componiPiano(TARGET_DEFAULT, VINCOLI_DEFAULT);
    expect(caselle(r.piano).length).toBe(TARGET_DEFAULT.pastiAlGiorno * TARGET_DEFAULT.giorni);
  });

  it("centra il bersaglio entro il 12 per cento sullo scenario tipo", () => {
    const r = componiPiano(TARGET_DEFAULT, VINCOLI_DEFAULT);
    const peggiore = Math.max(...Object.values(r.scarti).map(Math.abs));
    expect(peggiore).toBeLessThanOrEqual(12);
  });

  it("rispetta i vincoli di esclusione", () => {
    const r = componiPiano(TARGET_DEFAULT, { ...VINCOLI_DEFAULT, escludi: ["carne", "pesce"] });
    for (const c of caselle(r.piano)) expect(macroCasella(c).kcal).toBeGreaterThan(0);
    expect(Math.max(...Object.values(r.scarti).map(Math.abs))).toBeLessThanOrEqual(12);
  });

  it("dichiara lo scarto quando il bersaglio e fuori portata invece di consegnare in silenzio", () => {
    const impossibile = { kcal: 3000, proteine: 200, carboidrati: 360, grassi: 85, pastiAlGiorno: 3, giorni: 5 };
    const r = componiPiano(impossibile, VINCOLI_DEFAULT);
    expect(caselle(r.piano).length).toBe(15);
    expect(r.aCentro).toBe(false);
  });

  it("non esplode se i vincoli svuotano il catalogo", () => {
    const r = componiPiano(TARGET_DEFAULT, { ...VINCOLI_DEFAULT, escludi: ["carne", "pesce", "veg"] });
    expect(r.piano).toBeDefined();
  });
});
```

- [ ] **Step 2: Verificare il fallimento**

```bash
npx vitest run lib/matcher.test.ts
```

Attesa: FAIL, `componiPiano` non esiste.

- [ ] **Step 3: Adattare l'algoritmo**

Conservare la struttura attuale — costruzione greedy con proiezione sul totale, poi passate di scambi locali, pesi `{kcal:1, proteine:1.6, carboidrati:1, grassi:0.7}`, funzione `errore` con scarto quadratico normalizzato — e cambiare **l'unita di scelta**: non piu un piatto intero, ma una **coppia (primo, secondo)**.

```ts
// Le combinazioni sono ~n*m: con il catalogo attuale restano nell'ordine delle
// centinaia, quindi si possono enumerare tutte a ogni passo senza euristiche.
function combinazioni(vincoli: Vincoli): Casella[] {
  const primi = PRIMI.filter((e) => ammesso(e, vincoli));
  const secondi = SECONDI.filter((e) => ammesso(e, vincoli));
  const out: Casella[] = [];
  for (const p of primi) for (const s of secondi) out.push({ primo: p.id, secondo: s.id, extra: [] });
  // Casella con il solo secondo: serve per le cene a basso contenuto di carboidrati,
  // altrimenti il matcher non ha modo di scendere sotto un certo tetto glucidico.
  for (const s of secondi) out.push({ secondo: s.id, extra: [] });
  return out;
}
```

`quotaCoperta` resta `pastiAlGiorno * 0.25`, gia calibrata: con il fabbisogno tipo chiede a ogni pasto 560 kcal e 45/62/16 g. **Verificare che regga sul catalogo nuovo** stampando la media degli abbinamenti; se il baricentro si e spostato di piu del 5%, ricalibrare la costante e aggiornare il commento che la spiega.

Il risultato si riversa nelle caselle in ordine: `lun/pranzo`, `lun/cena`, `mar/pranzo`, e cosi via.

- [ ] **Step 4: Test verdi**

```bash
npx vitest run
```

- [ ] **Step 5: Commit**

```bash
git add lib/matcher.ts lib/matcher.test.ts
git commit -m "feat: il matcher compone abbinamenti primo piu secondo"
```

---

### Task 6: Link condivisibile col nutrizionista

**Livello modello: costoso.** Codifica compatta con un vincolo di lunghezza e un round-trip da garantire.

**Files:**
- Create: `lib/condivisione.ts`
- Create: `lib/condivisione.test.ts`

**Interfaces:**
- Consumes: `Piano`, `GIORNI`, `PASTI` dal Task 4; `getElemento`, `getExtra` dal Task 3.
- Produces:
  ```ts
  export function codificaPiano(p: Piano): string;      // stringa per la query string
  export function decodificaPiano(s: string): Piano | null;  // null se malformata
  export function linkPiano(p: Piano, origine: string): string; // <origine>/settimana?p=...
  ```

- [ ] **Step 1: Scrivere il test**

```ts
import { describe, expect, it } from "vitest";
import { codificaPiano, decodificaPiano, linkPiano } from "./condivisione";
import { PRIMI, SECONDI, EXTRA } from "./catalogo";
import type { Piano } from "./piano";

const pieno: Piano = {
  lun: { pranzo: { primo: PRIMI[0].id, secondo: SECONDI[0].id, extra: [EXTRA[0].id] },
         cena: { secondo: SECONDI[1].id, extra: [] } },
  gio: { pranzo: { primo: PRIMI[1].id, extra: [] } },
};

describe("condivisione", () => {
  it("fa il round trip senza perdere nulla", () => {
    expect(decodificaPiano(codificaPiano(pieno))).toEqual(pieno);
  });

  // Il piano vuoto ha bisogno di un sentinella: se codificasse nella stringa
  // vuota entrerebbe in conflitto con il test sulla stringa malformata qui sotto,
  // che pretende null. "-" significa "vuoto ma valido".
  it("gestisce il piano vuoto con il sentinella", () => {
    expect(codificaPiano({})).toBe("-");
    expect(decodificaPiano("-")).toEqual({});
  });

  it("restituisce null su stringa malformata invece di lanciare", () => {
    expect(decodificaPiano("!!!non-valido!!!")).toBeNull();
    expect(decodificaPiano("")).toBeNull();
  });

  it("scarta gli id non piu in catalogo", () => {
    const s = codificaPiano({ lun: { pranzo: { primo: "sparito", extra: [] } } });
    expect(decodificaPiano(s)).toEqual({});
  });

  it("resta sotto i 2000 caratteri con la settimana piena", () => {
    const max: Piano = {};
    for (const g of ["lun","mar","mer","gio","ven","sab","dom"] as const)
      max[g] = { pranzo: { primo: PRIMI[0].id, secondo: SECONDI[0].id, extra: EXTRA.map(e => e.id) },
                 cena:   { primo: PRIMI[1].id, secondo: SECONDI[1].id, extra: EXTRA.map(e => e.id) } };
    expect(linkPiano(max, "https://fuellab.vercel.app").length).toBeLessThan(2000);
  });
});
```

- [ ] **Step 2: Verificare il fallimento**

```bash
npx vitest run lib/condivisione.test.ts
```

- [ ] **Step 3: Implementare**

Non serializzare JSON grezzo: gli id sono lunghi e la settimana piena sfonderebbe il limite. Usare **indici** nelle liste ordinate del catalogo, separatori a un carattere e `encodeURIComponent`.

```ts
// Formato: giorni separati da "~", pasti da "|", campi da ".", extra da "-"
// Esempio: "0.3.1-4|_.7." significa lun/pranzo = primo#0 + secondo#3 + extra 1 e 4,
// lun/cena = nessun primo, secondo#7, nessun extra. "_" = assente.
```

`decodificaPiano` deve **sempre** restituire `null` invece di lanciare su input malformato, e scartare in silenzio gli indici fuori intervallo o gli id non piu presenti.

- [ ] **Step 4: Test verdi**

```bash
npx vitest run lib/condivisione.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/condivisione.ts lib/condivisione.test.ts
git commit -m "feat: piano settimanale codificato in un link condivisibile"
```

---

### Task 7: Link WhatsApp con messaggio precompilato

**Livello modello: medio.** Logica semplice, ma il comportamento senza numero va gestito con cura.

**Files:**
- Create: `lib/whatsapp.ts`
- Create: `lib/whatsapp.test.ts`
- Create: `.env.example`

**Interfaces:**
- Produces:
  ```ts
  export function numeroConfigurato(): boolean;
  export function linkWhatsApp(testo: string): string | null;   // null se il numero manca
  export function messaggioServizio(servizioId: string): string;
  export function messaggioPiano(p: Piano, macro: Macros, nome?: string): string;
  ```

- [ ] **Step 1: Scrivere il test**

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("whatsapp", () => {
  const originale = process.env.NEXT_PUBLIC_WHATSAPP;
  afterEach(() => { process.env.NEXT_PUBLIC_WHATSAPP = originale; vi.resetModules(); });

  it("senza numero non produce un link rotto", async () => {
    process.env.NEXT_PUBLIC_WHATSAPP = "";
    vi.resetModules();
    const { linkWhatsApp, numeroConfigurato } = await import("./whatsapp");
    expect(numeroConfigurato()).toBe(false);
    expect(linkWhatsApp("ciao")).toBeNull();
  });

  it("con il numero costruisce un wa.me valido", async () => {
    process.env.NEXT_PUBLIC_WHATSAPP = "+39 333 123 4567";
    vi.resetModules();
    const { linkWhatsApp } = await import("./whatsapp");
    const l = linkWhatsApp("ciao mondo")!;
    expect(l).toContain("https://wa.me/393331234567");
    expect(l).toContain(encodeURIComponent("ciao mondo"));
  });

  it("ogni servizio ha un testo diverso, cosi si capisce da dove arriva il contatto", async () => {
    const { messaggioServizio } = await import("./whatsapp");
    const a = messaggioServizio("menu-settimana");
    const b = messaggioServizio("home-cooking");
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(20);
  });
});
```

- [ ] **Step 2: Verificare il fallimento**

```bash
npx vitest run lib/whatsapp.test.ts
```

- [ ] **Step 3: Implementare**

`linkWhatsApp` normalizza il numero togliendo spazi, `+` e trattini. Se dopo la normalizzazione la stringa e vuota o non e tutta numerica, restituisce `null`. Chi consuma deve rendere il bottone disabilitato con una spiegazione, **mai** un `href` verso `wa.me/` senza numero.

`messaggioPiano` produce un testo leggibile: servizio, giorni con primo e secondo, e la riga finale dei macro settimanali.

`.env.example`:

```
# Numero WhatsApp di destinazione, con prefisso internazionale.
# Senza questa variabile i bottoni restano disabilitati invece di produrre link rotti.
NEXT_PUBLIC_WHATSAPP=
```

- [ ] **Step 4: Test verdi e commit**

```bash
npx vitest run lib/whatsapp.test.ts
git add lib/whatsapp.ts lib/whatsapp.test.ts .env.example
git commit -m "feat: link WhatsApp con messaggio precompilato e degrado pulito senza numero"
```

---

### Task 8: Componenti condivisi

**Livello modello: medio.** Il contratto visivo esiste gia dal Task 1; qui si applica.

**Files:**
- Modify: `components/MacroBar.tsx`, `components/Nav.tsx`, `components/Footer.tsx`, `components/ui.tsx`, `components/Ticker.tsx`
- Create: `components/ElementCard.tsx`
- Delete: `components/DishCard.tsx`

**Interfaces:**
- Consumes: `Elemento`, `MAX_MACRO`, `elementoImg` dal Task 3; `usePiano` dal Task 4.
- Produces:
  ```ts
  export function MacroBar(p: { etichetta: string; valore: number; target: number; unita?: string }): JSX.Element;
  export function MacroSplit(p: { proteine: number; carboidrati: number; grassi: number; className?: string }): JSX.Element;
  export function MacroAnimate(p: { elemento: Elemento }): JSX.Element;  // le tre barre a scala comune
  export default function ElementCard(p: { elemento: Elemento; variante?: "griglia" | "riga" }): JSX.Element;
  ```

- [ ] **Step 1: `MacroAnimate` con la scala comune**

Il dettaglio che rende le barre utili: **il fondo scala e il massimo del catalogo per quel macro**, non il valore del singolo elemento. Altrimenti un primo da 8 g di proteine e un secondo da 46 hanno la stessa barra piena, ed e esattamente il confronto che serve fare.

```tsx
const RIGHE = [
  { k: "proteine", l: "Proteine" },
  { k: "carboidrati", l: "Carboidrati" },
  { k: "grassi", l: "Grassi" },
] as const;

// Riempimento all'ingresso nel viewport, sfalsato di 90ms per riga.
// L'osservatore si stacca al primo scatto: senza, la barra ri-anima
// a ogni passaggio di scroll ed e la cosa piu fastidiosa da guardare.
```

Usare `IntersectionObserver` con fallback: se non esiste, mettere subito le barre al valore finale.

- [ ] **Step 2: `ElementCard`**

Foto (senza filtro di luminosita: su fondo chiaro le foto vanno naturali), nome, chip con grammi e kcal, chip della categoria (`PRIMO` / `SECONDO`), `MacroAnimate`, elenco allergeni in `.note`, e un bottone "Aggiungi" che chiama `primaLibera(categoria)` e poi `metti`. Se non ci sono caselle libere per quella categoria, il bottone lo dice invece di non fare nulla.

- [ ] **Step 3: Nav e Footer**

Nel navbar il marchio e **testo**: `FUEL` in Anton piu `LAB` in Anton di dimensione minore, non il PNG. Voci: Menu, Servizi, La tua settimana, La tua scheda, Chi e Matteo. CTA: "Scrivici su WhatsApp".
Conservare il pannello mobile a schermo pieno con chiusura da `Escape` e la chiusura al click sui link (non un effetto sul pathname: produce un render a cascata segnalato da ESLint).
Nel footer il logo intero (`/logo-fuellab.png`, `width={220}`), dove ha spazio.

- [ ] **Step 4: Verifica**

```bash
npx tsc --noEmit && npx eslint components lib
```

- [ ] **Step 5: Commit**

```bash
git add components lib
git commit -m "feat: componenti condivisi con barre macro a scala comune e marchio FUEL LAB"
```

---

### Task 9: Pagina `/menu`

**Livello modello: medio.** Contratto congelato, lavoro di applicazione.

**Files:**
- Modify: `app/menu/page.tsx`, `app/menu/MenuClient.tsx`

**Interfaces:**
- Consumes: `PRIMI`, `SECONDI`, `EXTRA` dal Task 3; `ElementCard` dal Task 8.

- [ ] **Step 1: Due sezioni separate**

`PRIMI · le basi` e `SECONDI · le proteine`, ognuna con la propria griglia. Gli extra in una terza fascia compatta. Il conteggio vivo ("N primi su M") deve sempre coincidere con le schede a schermo.

- [ ] **Step 2: Filtri**

In una pill `.shell` appiccicata sotto la nav: categoria (Tutti / Primi / Secondi), tag (Carne, Pesce, Veg, Senza glutine) in multi-selezione, giorno di cottura, ordinamento (Consigliati / Piu proteine / Meno calorie / Piu calorie). Combinano in AND fra categorie e in OR dentro i tag. Stato in `useState` con `useMemo` sul filtraggio, niente URL.

- [ ] **Step 3: Stato vuoto**

Se i filtri non trovano nulla: messaggio in Anton e bottone "Azzera i filtri". Non una griglia vuota.

- [ ] **Step 4: Barra del piano**

In basso, fissa, visibile solo quando `pronto === true` e ci sono caselle piene: "N pasti nella settimana" e un link a `/settimana`. **Nessun prezzo.**

- [ ] **Step 5: Verifica e commit**

```bash
npx tsc --noEmit && npx next build 2>&1 | tail -5
git add app/menu
git commit -m "feat: menu diviso in primi, secondi ed extra con filtri"
```

---

### Task 10: Pagina `/settimana` — la griglia

**Livello modello: costoso.** E il componente piu complesso del piano e ha una vista mobile che e un layout diverso, non una griglia compressa.

**Files:**
- Create: `app/settimana/page.tsx`, `app/settimana/SettimanaClient.tsx`
- Create: `components/settimana/Griglia.tsx`, `components/settimana/ColonnaGiorno.tsx`, `components/settimana/SelettoreCasella.tsx`
- Delete: `app/box/`

**Interfaces:**
- Consumes: `usePiano`, `macroCasella` dal Task 4; `codificaPiano`, `decodificaPiano` dal Task 6; `MacroBar` dal Task 8.

- [ ] **Step 1: `Griglia` (da `md` in su)**

Sette colonne per i giorni, due righe per pranzo e cena, piu una riga di macro sotto ogni colonna. Casella piena: nomi di primo e secondo, kcal combinate, pallini degli extra. Casella vuota: `+` centrato che al passaggio del mouse diventa lime.

- [ ] **Step 2: `ColonnaGiorno` (sotto `md`)**

Una card per giorno impilata verticalmente: intestazione con il nome del giorno e i suoi macro, poi pranzo e cena. **Non e la griglia con overflow orizzontale.** Una 7×2 a 390px non e leggibile in nessun modo.

- [ ] **Step 3: `SelettoreCasella`**

Pannello che si apre al click su una casella: tre schede (Primi / Secondi / Extra), ricerca testuale, e i macro della casella che si aggiornano **mentre** selezioni. Chiusura con `Escape` e con click fuori. `aria-modal`, focus intrappolato, focus restituito alla casella alla chiusura.

- [ ] **Step 4: Totali della settimana**

Barra scura in fondo (`.total`): pasti riempiti su 14, kcal, P/C/G in Martian Mono lime. **Nessun prezzo.**

- [ ] **Step 5: Condivisione**

Bottone "Condividi col tuo nutrizionista" che copia negli appunti `linkPiano(piano, location.origin)` e conferma. All'apertura, se `?p=` e presente **e** il piano locale non e vuoto, chiedere conferma prima di sovrascrivere: un link aperto per curiosita non deve cancellare il lavoro di qualcun altro.

- [ ] **Step 6: Stato vuoto**

Due strade: "Sfoglia il menu" e "Parti dalla tua scheda".

- [ ] **Step 7: Verifica e commit**

```bash
npx tsc --noEmit && npx next build 2>&1 | tail -5
git add app/settimana components/settimana && git rm -r app/box
git commit -m "feat: griglia settimanale con vista mobile, selettore e condivisione"
```

---

### Task 11: Pagina `/servizi` e sezione servizi in home

**Livello modello: medio.**

**Files:**
- Create: `lib/servizi.ts`, `app/servizi/page.tsx`, `components/servizi/SezioneServizi.tsx`
- **Non toccare `app/page.tsx`**: appartiene al Task 12, che importera `SezioneServizi`.
  (Ruling della scansione pre-volo: due task che scrivono lo stesso file si pestano i piedi.)

**Interfaces:**
- Produces:
  ```ts
  export interface Servizio {
    id: "menu-settimana" | "sui-tuoi-macro" | "home-cooking";
    numero: string; nome: string; descrizione: string;
    prezzo: { tipo: "soglia"; valore: number; unita: string } | { tipo: "preventivo" };
    img: string; href: string;
  }
  export const SERVIZI: Servizio[];
  export const SOGLIA_PREZZO = 8.9;
  ```

- [ ] **Step 1: I dati**

Tre servizi come da spec §12. I primi due con `{ tipo: "soglia", valore: 8.9, unita: "a pasto" }`, il terzo `{ tipo: "preventivo" }`.

- [ ] **Step 2: Il componente `SezioneServizi`**

Esportato da `components/servizi/SezioneServizi.tsx`, usato sia dalla pagina `/servizi` sia
dalla home (che lo importera nel Task 12). **Non tre card identiche in fila.** Il secondo servizio e un blocco lime pieno con testo scuro; gli altri due sono card bianche di dimensioni diverse. Numeri `01/02/03` in `.num`.

- [ ] **Step 3: Il prezzo**

Sempre `.price`: occhiello "A PARTIRE DA" in `.price-da`, cifra in `.price-n` (Martian Mono), unita in `.price-u`. Per l'home cooking la sola parola "Su preventivo". **Mai un totale.**

- [ ] **Step 4: CTA**

Ogni servizio chiude con "Scrivici su WhatsApp" usando `messaggioServizio(servizio.id)`, testo diverso per ognuno. Se il numero manca, bottone disabilitato con spiegazione.

- [ ] **Step 5: Verifica e commit**

```bash
npx tsc --noEmit && npx next build 2>&1 | tail -5
git add lib/servizi.ts app/servizi components/servizi
git commit -m "feat: sezione e pagina servizi con home cooking e prezzi a soglia"
```

---

### Task 12: Home, scheda, richiesta

**Livello modello: medio.**

**Files:**
- Modify: `app/page.tsx`, `app/scheda/SchedaClient.tsx`, `app/scheda/Risultato.tsx`, `app/scheda/Valori.tsx`
- Create: `app/richiesta/page.tsx`, `app/richiesta/RichiestaClient.tsx`
- Delete: `app/checkout/`

- [ ] **Step 1: Home**

Importare `SezioneServizi` da `components/servizi/SezioneServizi` (creato nel Task 11).
Hero con `MANGIA COME TI ALLENI.` e l'evidenziatore lime che si apre da sinistra, ticker, sezione servizi (Task 11), anteprima della settimana, come funziona, chiusura. **Nessun prezzo oltre la soglia.**

- [ ] **Step 2: `/scheda`**

Conservare i quattro stati e **soprattutto la microcopy onesta**: la pagina dichiara che il PDF non viene letto e che il file non lascia il computer. Cambia solo l'esito: `componiPiano` riempie la griglia, e "Metti nella settimana" chiama `sostituisciPiano` e porta a `/settimana`.

- [ ] **Step 3: `/richiesta`**

Form breve: nome, telefono, comune, servizio, note, e il riepilogo della settimana con i macro. Alla conferma **non si salva nulla in Fase A**: si apre `linkWhatsApp(messaggioPiano(...))`. Dirlo in pagina.

- [ ] **Step 4: Verifica e commit**

```bash
npx tsc --noEmit && npx next build 2>&1 | tail -5
git add app && git rm -r app/checkout
git commit -m "feat: home, scheda e richiesta WhatsApp"
```

---

### Task 13: Rinomina, link e pagine editoriali

**Livello modello: economico.** Sostituzioni guidate e testo. Nessuna decisione.

**Files:**
- Modify: tutti i file con "FUEL" da solo o link a `/box` e `/checkout`; `app/come-funziona/page.tsx`; `app/chi-e-matteo/page.tsx`

- [ ] **Step 1: Trovare le occorrenze**

```bash
grep -rn 'href="/box"\|href="/checkout"' app components
grep -rn '>FUEL<\|"FUEL"\|FUEL —\|Fuel ' app components lib | grep -v "FUEL LAB"
```

- [ ] **Step 2: Sostituire**

`/box` → `/settimana`, `/checkout` → `/richiesta`, "FUEL" → "FUEL LAB" ovunque sia il marchio (non dentro parole come "fuellab.piano.v1").

- [ ] **Step 3: Pagine editoriali**

`come-funziona` e `chi-e-matteo`: adattare i testi a primi e secondi, aggiungere due voci FAQ (allergeni; come funziona il link per il nutrizionista). Aggiungere una nota che i testi sono segnaposto da rivedere con Matteo.

- [ ] **Step 4: Rimuovere il vecchio catalogo**

`lib/dishes.ts` non ha piu consumatori: il catalogo vive in `lib/catalogo.ts` dal Task 3.

```bash
grep -rn "lib/dishes\|from \"./dishes\"" app components lib | grep -v catalogo.ts
```

Attesa: nessun risultato. Solo allora:

```bash
git rm lib/dishes.ts
```

- [ ] **Step 5: Verifica**

```bash
grep -rn 'href="/box"\|href="/checkout"' app components | wc -l   # atteso: 0
npx tsc --noEmit && npx vitest run && npx next build 2>&1 | tail -5
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: rinomina FUEL LAB, rotte aggiornate, rimosso il vecchio catalogo"
```

---

### Task 14: Verifica nel browser

**Livello modello: costoso.** Interpretare cosa e un difetto vero richiede giudizio, e i contrasti vanno calcolati sul rendering reale.

**Files:**
- Create: `scripts/verifica.mjs`

- [ ] **Step 1: Installare il driver**

```bash
npm i -D puppeteer-core
```

Chrome e gia presente in `C:/Program Files/Google/Chrome/Application/chrome.exe`.

- [ ] **Step 2: Scrivere lo script**

Deve controllare, per ogni rotta (`/`, `/menu`, `/settimana`, `/servizi`, `/scheda`, `/richiesta`, `/come-funziona`, `/chi-e-matteo`):

1. status 200, zero `pageerror`, zero errori di console, zero richieste fallite;
2. esattamente un `h1`;
3. nessuno scroll orizzontale a 1440px **e** a 390px;
4. tutte le `img` caricate (`naturalWidth > 0`);
5. **contrasto reale**: per ogni nodo di testo visibile, calcolare il rapporto fra `color` e il `background-color` effettivo risalendo gli antenati, e segnalare tutto cio che sta sotto 4.5:1 (sotto 3:1 se `font-size >= 24px` o `>= 18.66px` in grassetto). E il controllo piu importante di tutto il piano: **e una pagina chiara nata da una scura, ed e li che si nascondono i testi illeggibili.**

**Attenzione al metodo di cattura.** Per gli screenshot: i reveal sono legati allo scroll, quindi un `fullPage` li fotografa tutti al fotogramma iniziale, cioe invisibili. Serve scorrere davvero la pagina e catturare una schermata per posizione. Inoltre in Puppeteer le coordinate di `clip` sono **di pagina, non di viewport**: un clip a `y:0` ricattura sempre la testata. E se il mockup dichiara `scroll-behavior: smooth`, leggere `window.scrollY` subito dopo lo scroll restituisce la posizione vecchia — va disattivato con `page.addStyleTag`.

- [ ] **Step 3: Eseguire**

```bash
npx next build && npx next start -p 4311 &
node scripts/verifica.mjs
```

Attesa: tutti i controlli verdi. Ogni contrasto sotto soglia e un difetto da correggere, non da annotare.

- [ ] **Step 4: Correggere e ripetere finche pulito**

- [ ] **Step 5: Commit**

```bash
git add scripts/verifica.mjs
git commit -m "test: verifica end-to-end con controllo dei contrasti reali"
```

---

### Task 15: Deploy su Vercel

**Livello modello: medio.**

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Verificare che la CLI ci sia**

```bash
npx vercel --version || npm i -g vercel
```

- [ ] **Step 2: Collegare e pubblicare in anteprima**

```bash
npx vercel link
npx vercel
```

- [ ] **Step 3: Impostare la variabile**

```bash
npx vercel env add NEXT_PUBLIC_WHATSAPP
```

Il numero non e ancora disponibile: inserire un segnaposto vuoto e verificare che i bottoni WhatsApp risultino disabilitati con la spiegazione, **senza href rotti**.

- [ ] **Step 4: Produzione**

```bash
npx vercel --prod
```

- [ ] **Step 5: Verificare l'URL pubblico**

Rieseguire `scripts/verifica.mjs` puntandolo all'URL di produzione invece che a `localhost:4311`.

- [ ] **Step 6: Aggiornare il README**

Cosa e vero e cosa e scenografia, come far girare i test, l'URL pubblico, e le cose da rivedere con il cliente: testi segnaposto, foto Unsplash da sostituire con scatti veri, soglia di prezzo da confermare, numero WhatsApp da inserire, logo vettoriale con la tagline corretta.

- [ ] **Step 7: Commit**

```bash
git add README.md
git commit -m "docs: istruzioni, stato della demo e cose da rivedere col cliente"
```

---

## Riepilogo dei livelli di modello

| Task | Livello | Motivo |
|---|---|---|
| 0 Git | economico | comandi |
| 1 Design system | **costoso** | contratto: un errore si propaga ovunque |
| 2 Bonifica token | economico | tabella di sostituzione fissa |
| 3 Catalogo | **costoso** | giudizio culinario e invarianti |
| 4 Piano a caselle | **costoso** | modello dati centrale, trappola idratazione |
| 5 Matcher | **costoso** | algoritmo, da ricalibrare |
| 6 Link condivisibile | **costoso** | codifica compatta con vincolo di lunghezza |
| 7 WhatsApp | medio | logica semplice |
| 8 Componenti | medio | contratto gia fissato |
| 9 Menu | medio | applicazione |
| 10 Griglia settimanale | **costoso** | componente piu complesso, vista mobile diversa |
| 11 Servizi | medio | applicazione |
| 12 Home/scheda/richiesta | medio | applicazione |
| 13 Rinomina e testi | economico | sostituzioni guidate |
| 14 Verifica browser | **costoso** | interpretare i difetti |
| 15 Deploy | medio | procedura |

Sei task su sedici richiedono il modello costoso. Gli altri dieci vanno su modelli economici o medi.
