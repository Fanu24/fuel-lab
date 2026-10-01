import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FATTO_PAGAMENTO, FATTO_PREZZO, FATTO_RITIRO } from "../components/ui/Fatti";
import { SOGLIA_PREZZO } from "./servizi";
import { INDIRIZZO } from "./sito";

/* Le pagine informative (servizi, come funziona, le quattro pagine locali): sono
   JSX e CSS, quindi si controllano i sorgenti. Ogni regola qui sotto e' un
   difetto trovato guardando le pagine dal telefono, e il test impedisce che torni. */

const RADICE = path.resolve(__dirname, "..");
const leggi = (p: string) => readFileSync(path.join(RADICE, p), "utf8");

const PAGINE_LOCALI = [
  "app/(sito)/meal-prep-pescara/page.tsx",
  "app/(sito)/consegna-pasti-pescara/page.tsx",
  "app/(sito)/pasti-proteici-pescara/page.tsx",
  "app/(sito)/cuoco-a-domicilio-pescara/page.tsx",
];

describe("i fatti sotto il titolo", () => {
  it("prezzo e indirizzo si leggono dalle costanti del sito, non sono scritti a mano", () => {
    expect(FATTO_PREZZO).toBe(`Da ${SOGLIA_PREZZO.toFixed(2).replace(".", ",")} € a pasto`);
    expect(FATTO_RITIRO).toBe(`Ritiro in ${INDIRIZZO.via}`);
    expect(FATTO_PAGAMENTO).toBe("Nessun pagamento online");
  });

  it("lo stile esiste ed e' importato in globals.css", () => {
    expect(leggi("app/globals.css")).toContain('@import "./styles/pagine.css"');
    const css = leggi("app/styles/pagine.css");
    expect(css).toMatch(/\.fatti\s*\{/);
    expect(css).toMatch(/\.titolo-pagina\s*\{/);
  });
});

describe("le tabelle non nascondono colonne sul telefono", () => {
  it("nessuna pagina del sito chiede di scorrere una tabella di lato", () => {
    const cartelle = readdirSync(path.join(RADICE, "app/(sito)"), { withFileTypes: true }).filter((d) => d.isDirectory());
    for (const cartella of cartelle) {
      const file = `app/(sito)/${cartella.name}/page.tsx`;
      let testo = "";
      try {
        testo = leggi(file);
      } catch {
        continue;
      }
      expect(testo, file).not.toContain("Scorri la tabella di lato");
    }
  });

  it("pasti proteici e cuoco a domicilio hanno la versione a schede per il telefono", () => {
    const proteici = leggi("app/(sito)/pasti-proteici-pescara/page.tsx");
    expect(proteici).toMatch(/<ul className="[^"]*lg:hidden">/);
    const cuoco = leggi("app/(sito)/cuoco-a-domicilio-pescara/page.tsx");
    expect(cuoco).toMatch(/<dl className="[^"]*md:hidden">/);
  });
});

describe("i titoli delle pagine informative", () => {
  it("le pagine locali usano il titolo di pagina, piu' basso di quello della home", () => {
    for (const file of PAGINE_LOCALI) {
      const testo = leggi(file);
      expect(testo, file).toMatch(/<h1 className="titolo-pagina /);
      expect(testo, file).not.toMatch(/<h1 className="titolo-xl /);
    }
  });
});
