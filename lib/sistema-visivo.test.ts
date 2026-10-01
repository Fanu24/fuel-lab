import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/* Il sistema visivo condiviso (token, base, controlli) e il guscio del sito
   (layout, nav, banner della privacy). Sono CSS e JSX, quindi si controllano i
   sorgenti: ogni regola qui sotto e' un difetto trovato e corretto, e il test
   impedisce che torni. */

const RADICE = path.resolve(__dirname, "..");
const leggi = (p: string) => readFileSync(path.join(RADICE, p), "utf8");

const TOKEN = leggi("app/styles/tokens.css");
const BASE = leggi("app/styles/base.css");
const SEZIONI = leggi("app/styles/sezioni.css");
const CONTROLLI = leggi("app/styles/controlli.css");
const LAYOUT = leggi("app/layout.tsx");
const CONSENSO = leggi("components/PrivacyConsent.tsx");

/* ---- contrasto WCAG 2.x ---- */

type Rgb = [number, number, number];

function esadecimale(nome: string): Rgb {
  const m = TOKEN.match(new RegExp(`--color-${nome}:\\s*#([0-9a-f]{6})`, "i"));
  if (!m) throw new Error(`token --color-${nome} non trovato`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminanza([r, g, b]: Rgb): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrasto(a: Rgb, b: Rgb): number {
  const [chiaro, scuro] = [luminanza(a), luminanza(b)].sort((x, y) => y - x);
  return (chiaro + 0.05) / (scuro + 0.05);
}

/** Un colore con trasparenza steso su uno sfondo. */
function sopra([r, g, b]: Rgb, alfa: number, sfondo: Rgb): Rgb {
  return [r, g, b].map((v, i) => Math.round(v * alfa + sfondo[i] * (1 - alfa))) as Rgb;
}

describe("contrasti dei token", () => {
  const paper = esadecimale("paper");
  const paper2 = esadecimale("paper-2");
  const ink = esadecimale("ink");
  const night = esadecimale("night");
  const night2 = esadecimale("night-2");

  it("il testo sulla carta e sulla notte arriva ad AA (4,5:1)", () => {
    expect(contrasto(ink, paper)).toBeGreaterThanOrEqual(4.5);
    expect(contrasto(esadecimale("muted"), paper)).toBeGreaterThanOrEqual(4.5);
    expect(contrasto(esadecimale("muted"), paper2)).toBeGreaterThanOrEqual(4.5);
    expect(contrasto(paper, night)).toBeGreaterThanOrEqual(4.5);
    expect(contrasto(esadecimale("steel"), night)).toBeGreaterThanOrEqual(4.5);
    expect(contrasto(esadecimale("steel"), night2)).toBeGreaterThanOrEqual(4.5);
    expect(contrasto(esadecimale("lime"), night)).toBeGreaterThanOrEqual(4.5);
    expect(contrasto(ink, esadecimale("lime"))).toBeGreaterThanOrEqual(4.5);
  });

  it("il rosso dell'errore si legge sulla carta", () => {
    expect(contrasto(esadecimale("errore"), paper)).toBeGreaterThanOrEqual(4.5);
  });

  it("il bordo dei campi si vede (WCAG 1.4.11: 3:1) e non e' piu' la filettatura del 12%", () => {
    const m = TOKEN.match(/--line-campo:\s*rgba\(18,\s*20,\s*18,\s*([0-9.]+)\)/);
    expect(m).not.toBeNull();
    const alfa = Number(m![1]);
    expect(contrasto(sopra(ink, alfa, paper), paper)).toBeGreaterThanOrEqual(3);
    expect(CONTROLLI).toMatch(/\.campo input,[^}]*border:\s*2px solid var\(--line-campo\)/);
  });

  it("il segnaposto attenuato resta sopra 4,5:1 sul campo di carta", () => {
    const m = BASE.match(/::placeholder\s*\{[^}]*currentColor\s+(\d+)%/);
    expect(m).not.toBeNull();
    const alfa = Number(m![1]) / 100;
    expect(contrasto(sopra(ink, alfa, paper), paper)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("scorrimento e movimento", () => {
  it("con scroll-behavior: smooth su <html>, Next 16 non lo sospende: serve data-scroll-behavior", () => {
    expect(BASE).toMatch(/scroll-behavior:\s*smooth/);
    expect(LAYOUT).toMatch(/data-scroll-behavior="smooth"/);
  });

  it("le rivelazioni non nascondono nulla con movimento ridotto o in stampa", () => {
    expect(SEZIONI).toMatch(/@media \(prefers-reduced-motion: reduce\), print\s*\{[^}]*\.js \.reveal/);
  });

  it("se l'hydration non parte, lo script in <head> toglie .js e il banner segna data-vivo", () => {
    expect(LAYOUT).toMatch(/classList\.remove\('js'\)/);
    expect(LAYOUT).toMatch(/hasAttribute\('data-vivo'\)/);
    expect(CONSENSO).toMatch(/setAttribute\("data-vivo"/);
  });

  it("il sito dichiara un solo tema chiaro", () => {
    expect(LAYOUT).toMatch(/colorScheme:\s*"light"/);
  });
});

describe("banner della privacy", () => {
  it("gtag mette nel dataLayer l'oggetto arguments, non un array (forma dello snippet di Google)", () => {
    expect(CONSENSO).toMatch(/dataLayer\?\.push\(arguments\)/);
  });

  it("i bottoni si chiamano come li chiama l'informativa", () => {
    const privacy = leggi("app/(sito)/privacy/page.tsx");
    expect(CONSENSO).toContain("Accetta Analytics");
    expect(CONSENSO).toContain("Rifiuta Analytics");
    expect(privacy).toContain("“Accetta Analytics”");
  });

  it("l'informativa legge indirizzo e email da lib/sito.ts (con il CAP, come il footer), non li riscrive a mano", () => {
    const privacy = leggi("app/(sito)/privacy/page.tsx");
    expect(privacy).not.toMatch(/Via del Santuario/);
    expect(privacy).not.toMatch(/privacy@fuelchef\.it/);
    expect(privacy).toContain("INDIRIZZO.cap");
  });

  it("senza numero WhatsApp il bottone porta al modulo contatti tenendo il servizio della pagina", () => {
    const cta = leggi("components/ui/WhatsAppCta.tsx");
    expect(cta).toMatch(/\?servizio=\$\{encodeURIComponent\(servizio\)\}/);
    expect(cta).toContain("#scrivi");
  });

  it("sul pannello di Matteo non compare e non conta visite", () => {
    expect(CONSENSO).toMatch(/percorso === "\/dashboard" \|\| percorso\.startsWith\("\/dashboard\/"\)/);
  });
});
