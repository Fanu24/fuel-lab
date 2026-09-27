import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  DESCRIZIONE_ATTIVITA,
  EMAIL,
  INDIRIZZO_RIGA,
  QUANDO_CUCINA,
  TELEFONO,
  URL_SITO,
  ZONE_SERVITE,
  elencoZone,
} from "./sito";
import { PIATTI } from "./catalogo";
import { ETICHETTE_SERVIZIO } from "./api";
import { SERVIZI } from "./servizi";
import { CONSEGNA_GRATIS_DA } from "./pricing";
import {
  ABBONAMENTO_CONSEGNA_GRATIS,
  LINK_RICHIEDI_ABBONAMENTO,
  LINK_SCRIVI_ABBONAMENTO,
  PRANZI_AL_MESE_CIRCA,
  PREZZO_ABBONAMENTO,
  PREZZO_ABBONAMENTO_TESTO,
} from "./abbonamento";
import { PAGINE, descrizionePiatto, paginaPiatto, titoloCompleto } from "@/components/seo/pagine";
import {
  ID,
  assoluto,
  descrizioneEstesa,
  grafoSito,
  nodiPagina,
  nodoMenu,
  nodoPiatto,
  nodoServizio,
  serializzaJsonLd,
  type Nodo,
} from "@/components/seo/schema";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import manifest from "@/app/manifest";

const RADICE = path.resolve(__dirname, "..");

/** Tutti i valori "@id" definiti e tutti i riferimenti {"@id"} usati, a qualunque profondita'. */
function raccogliId(nodo: unknown, definiti: Set<string>, riferiti: Set<string>) {
  if (Array.isArray(nodo)) {
    nodo.forEach((n) => raccogliId(n, definiti, riferiti));
    return;
  }
  if (!nodo || typeof nodo !== "object") return;
  const o = nodo as Nodo;
  const chiavi = Object.keys(o);
  if (typeof o["@id"] === "string") {
    if (chiavi.length === 1) riferiti.add(o["@id"]);
    else definiti.add(o["@id"]);
  }
  for (const k of chiavi) raccogliId(o[k], definiti, riferiti);
}

describe("dati dell'attivita'", () => {
  it("indirizzo e zone sono quelli dati dal committente", () => {
    expect(INDIRIZZO_RIGA).toBe("Via del Santuario 214, 65124 Pescara (PE)");
    expect(EMAIL).toBe("info@fuelchef.it");
    expect(ZONE_SERVITE[0].nome).toBe("Pescara");
    expect(elencoZone()).toMatch(/^Pescara, Montesilvano, .+ e Chieti Scalo$/);
  });

  it("URL del sito senza slash finale", () => {
    expect(URL_SITO.endsWith("/")).toBe(false);
    expect(assoluto("/")).toBe(URL_SITO);
    expect(assoluto("/menu")).toBe(`${URL_SITO}/menu`);
  });
});

describe("metadata delle pagine", () => {
  const pagine = [...Object.values(PAGINE), ...PIATTI.map(paginaPiatto)];

  it.each(pagine.map((p) => [p.percorso, p]))("%s: titolo entro 60 e descrizione fra 140 e 155", (_, p) => {
    expect(titoloCompleto(p).length).toBeLessThanOrEqual(60);
    expect(p.descrizione.length).toBeGreaterThanOrEqual(140);
    expect(p.descrizione.length).toBeLessThanOrEqual(155);
  });

  it("titoli e descrizioni non si ripetono", () => {
    expect(new Set(pagine.map((p) => titoloCompleto(p))).size).toBe(pagine.length);
    expect(new Set(pagine.map((p) => p.descrizione)).size).toBe(pagine.length);
  });

  it("i canonical sono percorsi puliti", () => {
    for (const p of pagine) {
      expect(p.percorso.startsWith("/")).toBe(true);
      if (p.percorso !== "/") expect(p.percorso.endsWith("/")).toBe(false);
    }
  });

  it("ogni pagina in elenco (quindi in sitemap) esiste davvero", () => {
    for (const p of Object.values(PAGINE)) {
      const file = p.percorso === "/" ? "app/(sito)/page.tsx" : `app/(sito)${p.percorso}/page.tsx`;
      expect(existsSync(path.join(RADICE, file)), file).toBe(true);
    }
  });

  it("la descrizione di ogni piatto porta kcal e proteine", () => {
    for (const p of PIATTI) {
      const d = descrizionePiatto(p);
      expect(d).toContain(`${p.kcal} kcal`);
      expect(d).toContain(`${p.proteine} g di proteine`);
    }
  });
});

describe("dati strutturati", () => {
  it("il JSON-LD neutralizza '<' e resta JSON valido", () => {
    const testo = serializzaJsonLd({ "@type": "Thing", name: "</script><script>alert(1)</script>" });
    expect(testo).not.toContain("<");
    expect(JSON.parse(testo).name).toBe("</script><script>alert(1)</script>");
  });

  it("nessun dato inventato: niente geo, orari, valutazioni; telefono solo se esiste", () => {
    const testo = JSON.stringify(grafoSito());
    for (const vietato of ["geo", "openingHours", "aggregateRating", "review", "GeoCoordinates"]) {
      expect(testo).not.toContain(`"${vietato}`);
    }
    if (!TELEFONO) expect(testo).not.toContain("telephone");
  });

  it("i riferimenti @id del grafo si risolvono", () => {
    const definiti = new Set<string>();
    const riferiti = new Set<string>();
    const pagina = nodiPagina({
      percorso: "/menu",
      nome: "Menu",
      descrizione: "x",
      briciole: [{ nome: "Menu", href: "/menu" }],
      mainEntity: { "@id": ID.menu },
    });
    raccogliId([...grafoSito(), ...pagina, nodoMenu(PIATTI, "x")], definiti, riferiti);
    for (const r of riferiti) expect(definiti.has(r), r).toBe(true);
  });

  it("il menu contiene ogni piatto con i suoi valori per porzione", () => {
    const menu = JSON.stringify(nodoMenu(PIATTI, "x"));
    for (const p of PIATTI) {
      expect(menu).toContain(`"calories":"${p.kcal} kcal"`);
      expect(menu).toContain(`"url":"${URL_SITO}/menu/${p.id}"`);
    }
  });

  it("la scheda del piatto porta ingredienti e allergeni nella descrizione", () => {
    const p = PIATTI[0];
    const d = nodoPiatto(p, true).description as string;
    expect(d).toContain(p.ingredienti[0].nome.toLowerCase());
    for (const a of p.allergeni) expect(d).toContain(a);
  });

  it("le briciole partono dalla home e finiscono sulla pagina", () => {
    const [, briciole] = nodiPagina({
      percorso: "/menu/x",
      nome: "x",
      descrizione: "x",
      briciole: [
        { nome: "Menu", href: "/menu" },
        { nome: "X", href: "/menu/x" },
      ],
    });
    const voci = briciole.itemListElement as { position: number; item: string }[];
    expect(voci.map((v) => v.position)).toEqual([1, 2, 3]);
    expect(voci[0].item).toBe(URL_SITO);
    expect(voci[2].item).toBe(`${URL_SITO}/menu/x`);
  });
});

describe("sitemap, robots e manifest", () => {
  const voci = sitemap();
  const url = voci.map((v) => v.url);

  it("la sitemap ha le pagine locali e i piatti con la loro foto", () => {
    for (const p of Object.values(PAGINE)) expect(url).toContain(assoluto(p.percorso));
    for (const p of PIATTI) {
      const voce = voci.find((v) => v.url === `${URL_SITO}/menu/${p.id}`);
      expect(voce?.images).toEqual([`${URL_SITO}${p.img}`]);
    }
    expect(new Set(url).size).toBe(url.length);
  });

  it("niente pagine private in sitemap, e robots le esclude", () => {
    const private_ = ["/dashboard", "/account", "/accedi", "/reimposta-password", "/api/"];
    for (const u of url) for (const p of private_) expect(u.startsWith(`${URL_SITO}${p}`)).toBe(false);
    const regole = robots().rules;
    const disallow = (Array.isArray(regole) ? regole[0] : regole).disallow;
    expect(disallow).toEqual(expect.arrayContaining(private_));
  });

  it("il manifest usa le icone che esistono in app/", () => {
    const m = manifest();
    expect(m.lang).toBe("it");
    expect(m.display).toBe("standalone");
    for (const i of m.icons ?? []) {
      expect(existsSync(path.join(RADICE, "app", i.src.replace(/^\//, ""))), i.src).toBe(true);
    }
  });
});

describe("public/llms.txt", () => {
  const testo = readFileSync(path.join(RADICE, "public/llms.txt"), "utf8");

  it("ha il formato llms.txt: titolo, citazione, sezioni", () => {
    expect(testo.startsWith("# FUEL LAB\n")).toBe(true);
    expect(testo).toMatch(/\n> .+/);
    expect(testo).toMatch(/\n## /);
  });

  it("indirizzo ed email coincidono con lib/sito.ts", () => {
    expect(testo).toContain(INDIRIZZO_RIGA);
    expect(testo).toContain(EMAIL);
    for (const z of ZONE_SERVITE) expect(testo).toContain(z.nome);
  });

  it("i piatti e i loro numeri sono quelli del catalogo", () => {
    const righe = [...testo.matchAll(/\/menu\/([a-z0-9-]+)\): (\d+) kcal, (\d+) g proteine, (\d+) g carboidrati, (\d+) g grassi per porzione da (\d+) g/g)];
    expect(righe.map((r) => r[1]).sort()).toEqual(PIATTI.map((p) => p.id).sort());
    for (const r of righe) {
      const p = PIATTI.find((x) => x.id === r[1])!;
      expect(r.slice(2).map(Number)).toEqual([p.kcal, p.proteine, p.carboidrati, p.grassi, p.grammi]);
    }
  });

  it("le pagine locali ci sono tutte", () => {
    for (const p of [PAGINE.mealPrep, PAGINE.consegna, PAGINE.proteici, PAGINE.domicilio]) {
      expect(testo).toContain(`https://fuelchef.it${p.percorso})`);
    }
  });

  it("abbonamento e chi siamo ci sono, con il prezzo di lib/abbonamento.ts", () => {
    for (const p of [PAGINE.abbonamento, PAGINE.chiSiamo]) expect(testo).toContain(`https://fuelchef.it${p.percorso})`);
    expect(testo).toContain(`${PREZZO_ABBONAMENTO_TESTO} al mese`);
  });
});

/* Le tre decisioni del committente di settembre 2026: si cucina e si consegna
   ogni giorno, l'abbonamento mensile ai pranzi, "Chi siamo" al posto di "Chi
   e' Matteo". Questi controlli tengono ferme le parti che vivono in piu' file. */
describe("decisioni del committente", () => {
  const DUE_GIORNI = /luned[iì] e (il )?gioved|lun · gio|due cotture/i;
  const llms = readFileSync(path.join(RADICE, "public/llms.txt"), "utf8");

  it("si cucina e si consegna ogni giorno: nessun testo pubblico cita i due giorni fissi", () => {
    expect(QUANDO_CUCINA).toMatch(/ogni giorno/);
    const testi = [
      DESCRIZIONE_ATTIVITA,
      llms,
      JSON.stringify(grafoSito()),
      ...Object.values(PAGINE).flatMap((p) => [p.titolo, p.descrizione]),
      ...PIATTI.flatMap((p) => [descrizionePiatto(p), descrizioneEstesa(p)]),
    ];
    for (const t of testi) expect(t).not.toMatch(DUE_GIORNI);
    // Le schede dei piatti non dicono piu' in che giorno sono cucinati.
    for (const p of PIATTI) expect(`${descrizionePiatto(p)} ${descrizioneEstesa(p)}`).not.toMatch(/luned|gioved/i);
  });

  it("nemmeno il pannello, l'area cliente o le email parlano piu' dei due giorni fissi", () => {
    // Tutti i sorgenti (pagine, componenti, logica, Functions), test esclusi: qui la regola e' scritta apposta.
    const sorgenti = (cartella: string): string[] =>
      readdirSync(path.join(RADICE, cartella), { withFileTypes: true }).flatMap((voce) => {
        const relativo = path.join(cartella, voce.name);
        if (voce.isDirectory()) return sorgenti(relativo);
        return /\.(ts|tsx)$/.test(voce.name) && !/\.test\.ts$/.test(voce.name) ? [relativo] : [];
      });
    const colpevoli = ["app", "components", "lib", "functions"]
      .flatMap(sorgenti)
      // Anche nei commenti, dove i giorni si scrivono con l'apostrofo ("lunedi' e giovedi'").
      .filter((f) => /luned[iì]'? (e|o) (il )?gioved|lun · gio|due cotture/i.test(readFileSync(path.join(RADICE, f), "utf8")));
    expect(colpevoli).toEqual([]);
  });

  it("l'abbonamento e' il secondo servizio, con il prezzo al mese di lib/abbonamento.ts", () => {
    expect(SERVIZI.map((s) => s.id)).toEqual(["menu-settimana", "abbonamento", "sui-tuoi-macro", "home-cooking"]);
    expect(SERVIZI.map((s) => s.numero)).toEqual(["01", "02", "03", "04"]);
    expect(SERVIZI[1].prezzo).toEqual({ tipo: "mese", valore: PREZZO_ABBONAMENTO });
    expect(SERVIZI[1].href).toBe(PAGINE.abbonamento.percorso);
    expect(ETICHETTE_SERVIZIO.abbonamento).toBe("Abbonamento mensile");
  });

  it("la vecchia pagina su Matteo non c'e' piu' e reindirizza in modo permanente a /chi-siamo", () => {
    expect(existsSync(path.join(RADICE, "app/(sito)/chi-e-matteo"))).toBe(false);
    const regole = readFileSync(path.join(RADICE, "public/_redirects"), "utf8")
      .split(/\r?\n/)
      .map((r) => r.trim().split(/\s+/))
      .filter((r) => r.length === 3 && !r[0].startsWith("#"));
    expect(regole).toEqual(
      expect.arrayContaining([
        ["/chi-e-matteo", "/chi-siamo", "301"],
        ["/chi-e-matteo/", "/chi-siamo", "301"],
      ]),
    );
    const url = sitemap().map((v) => v.url);
    expect(url).toContain(assoluto("/chi-siamo"));
    expect(url).toContain(assoluto("/abbonamento"));
    expect(url.some((u) => u.includes("chi-e-matteo"))).toBe(false);
    expect(JSON.stringify(grafoSito())).not.toContain("chi-e-matteo");
    expect(ID.matteo).toBe(`${URL_SITO}/chi-siamo#matteo`);
  });

  it("l'abbonamento costa 239 euro al mese e i dati strutturati lo dicono per un mese", () => {
    expect(PREZZO_ABBONAMENTO).toBe(239);
    expect(titoloCompleto(PAGINE.abbonamento)).toContain(`${PREZZO_ABBONAMENTO_TESTO} al mese`);
    const servizio = nodoServizio({
      id: "abbonamento",
      percorso: PAGINE.abbonamento.percorso,
      nome: "Abbonamento",
      descrizione: "x",
      tipoServizio: "x",
      prezzoMese: PREZZO_ABBONAMENTO,
    });
    const offerta = servizio.offers as Nodo;
    expect(offerta.price).toBe(239);
    expect(offerta.priceCurrency).toBe("EUR");
    const specifica = offerta.priceSpecification as Nodo;
    expect(specifica["@type"]).toBe("UnitPriceSpecification");
    expect(specifica.price).toBe(239);
    expect(specifica.referenceQuantity).toEqual({ "@type": "QuantitativeValue", value: 1, unitCode: "MON" });
    // Un abbonamento non e' una soglia "da X a pasto".
    expect(specifica.minPrice).toBeUndefined();
  });

  it("la consegna gratuita dell'abbonamento discende dalla soglia di lib/pricing.ts", () => {
    // Una ventina di pranzi al mese (dal lunedi' al venerdi') contro la soglia dei pasti.
    expect(PRANZI_AL_MESE_CIRCA).toBe(20);
    expect(ABBONAMENTO_CONSEGNA_GRATIS).toBe(PRANZI_AL_MESE_CIRCA >= CONSEGNA_GRATIS_DA);
  });

  it("le due strade per chiedere l'abbonamento portano all'area cliente e al modulo contatti", () => {
    expect(LINK_RICHIEDI_ABBONAMENTO).toBe("/account?sezione=richiesta&servizio=abbonamento");
    expect(LINK_SCRIVI_ABBONAMENTO).toBe("/richiesta?servizio=abbonamento#scrivi");
  });
});
