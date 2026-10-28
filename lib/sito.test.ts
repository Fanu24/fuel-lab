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
import {
  BOX_DEL_GIORNO_TESTO,
  CONSEGNA_OGNI_GIORNI,
  DIETE,
  FASCE,
  FORMULE,
  LINK_RICHIEDI_ABBONAMENTO,
  LINK_SCRIVI_ABBONAMENTO,
  PREZZO_DA,
  PREZZO_DA_TESTO,
  PREZZO_FINO_A,
  RAGGIO_CONSEGNA_KM,
  etichettaFormula,
  linkRichiediAbbonamento,
  percorsoFormula,
} from "./abbonamento";
import {
  AGGIORNAMENTO,
  PAGINE,
  PAGINE_FORMULE,
  dataLeggibile,
  descrizionePiatto,
  paginaFormula,
  paginaPiatto,
  titoloCompleto,
} from "@/components/seo/pagine";
import {
  ID,
  assoluto,
  descrizioneEstesa,
  grafoSito,
  idFormula,
  nodiPagina,
  nodoAbbonamenti,
  nodoFormula,
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

/** Tutti i sorgenti (pagine, componenti, logica, Functions) di una cartella, test esclusi: le regole sui testi si scrivono qui apposta. */
const sorgenti = (cartella: string): string[] =>
  readdirSync(path.join(RADICE, cartella), { withFileTypes: true }).flatMap((voce) => {
    const relativo = path.join(cartella, voce.name);
    if (voce.isDirectory()) return sorgenti(relativo);
    return /\.(ts|tsx)$/.test(voce.name) && !/\.test\.ts$/.test(voce.name) ? [relativo] : [];
  });

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
  const pagine = [...Object.values(PAGINE), ...PAGINE_FORMULE, ...PIATTI.map(paginaPiatto)];

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

  it("le cinque schede degli abbonamenti hanno titolo, descrizione e canonical di /abbonamento/<formula>", () => {
    expect(PAGINE_FORMULE).toHaveLength(5);
    for (const f of FORMULE) {
      const p = paginaFormula(f.id);
      expect(p.percorso).toBe(`/abbonamento/${f.id}`);
      expect(p.percorso).toBe(percorsoFormula(f.id));
      expect(p.breve).toBe(f.nome);
      // Il nome, il prezzo Standard (il piu' basso della formula) e la citta' stanno gia' nel titolo.
      expect(p.titolo).toContain(f.nome);
      expect(p.titolo).toContain(`${f.prezzo.standard} €`);
      expect(p.titolo).toContain("Pescara");
      // La descrizione dice quanti pasti sono e quanto costa, in entrambe le fasce.
      expect(p.descrizione).toContain(`${f.pastiSettimana} pasti a settimana`);
      expect(p.descrizione).toContain(`${f.prezzo.standard} € al mese`);
      expect(p.descrizione).toContain(`Plus ${f.prezzo.plus} €`);
      expect(PAGINE_FORMULE.map((x) => x.percorso)).toContain(p.percorso);
    }
  });

  it("l'elenco degli abbonamenti non parla piu' di un prezzo solo: dice 'da' e cita le cinque formule", () => {
    const { titolo, descrizione } = PAGINE.abbonamento;
    expect(titolo).toContain(`da ${PREZZO_DA_TESTO} al mese`);
    expect(descrizione).toContain(`${PREZZO_DA_TESTO} al mese`);
    expect(descrizione).toContain(`ogni ${CONSEGNA_OGNI_GIORNI} giorni`);
    expect(PAGINE.servizi.descrizione).toContain(`${PREZZO_DA_TESTO} al mese`);
  });

  it("le schede degli abbonamenti hanno la loro pagina", () => {
    // Una cartella per formula oppure una rotta dinamica [formula], con generateStaticParams.
    for (const f of FORMULE) {
      const file = [`app/(sito)/abbonamento/${f.id}/page.tsx`, "app/(sito)/abbonamento/[formula]/page.tsx"];
      expect(file.some((x) => existsSync(path.join(RADICE, x))), f.id).toBe(true);
    }
  });

  it("le descrizioni dei piatti non presentano stime come valori certi", () => {
    for (const p of PIATTI) {
      const d = descrizionePiatto(p);
      expect(d).toContain(p.nome);
      expect(d).toContain("allergeni");
      expect(d).not.toContain("kcal");
    }
  });
});

describe("dati strutturati", () => {
  it("il JSON-LD neutralizza '<' e resta JSON valido", () => {
    const testo = serializzaJsonLd({ "@type": "Thing", name: "</script><script>alert(1)</script>" });
    expect(testo).not.toContain("<");
    expect(JSON.parse(testo).name).toBe("</script><script>alert(1)</script>");
  });

  it("nessun dato inventato: niente geo o valutazioni; contatti e orari confermati", () => {
    const testo = JSON.stringify(grafoSito());
    for (const vietato of ["geo", "aggregateRating", "review", "GeoCoordinates"]) {
      expect(testo).not.toContain(`"${vietato}`);
    }
    expect(testo).toContain(TELEFONO);
    expect(grafoSito().find((n) => n["@id"] === ID.organizzazione)?.openingHoursSpecification).toEqual([{
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((g) => `https://schema.org/${g}`),
      opens: "09:30",
      closes: "19:00",
    }]);
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

  it("l'attivita' e la sua cucina sono un nodo solo: un indirizzo, un @id, nessun priceRange", () => {
    const grafo = grafoSito();
    expect(ID.cucina).toBe(ID.organizzazione);
    const id = grafo.map((n) => n["@id"]);
    expect(new Set(id).size).toBe(id.length);
    const conIndirizzo = grafo.filter((n) => n.address);
    expect(conIndirizzo).toHaveLength(1);
    expect(conIndirizzo[0]["@type"]).toEqual(["Organization", "FoodEstablishment"]);
    expect(conIndirizzo[0]["@id"]).toBe(ID.organizzazione);
    expect(conIndirizzo[0].address).toMatchObject({ streetAddress: "Via del Santuario 214", postalCode: "65124", addressLocality: "Pescara" });
    expect(JSON.stringify(grafo)).not.toContain("priceRange");
    expect(JSON.stringify(grafo)).not.toContain("parentOrganization");
  });

  it("la pagina della home ha l'@id con la barra, come gli altri nodi del sito", () => {
    const [home] = nodiPagina({ percorso: "/", nome: "Home", descrizione: "x" });
    expect(home["@id"]).toBe(`${URL_SITO}/#webpage`);
    expect(home.url).toBe(URL_SITO);
    const [menu] = nodiPagina({ percorso: "/menu", nome: "Menu", descrizione: "x" });
    expect(menu["@id"]).toBe(`${URL_SITO}/menu#webpage`);
  });

  it("il menu contiene ogni piatto e pubblica solo le stime documentate", () => {
    const menu = JSON.stringify(nodoMenu(PIATTI, "x"));
    for (const p of PIATTI) {
      const nodo = nodoPiatto(p);
      if (["riso-julien-pollo-teriyaki", "gnocchetti-sugo-ricotta"].includes(p.id)) {
        expect(nodo.nutrition).toMatchObject({ calories: `${p.kcal} kcal`, servingSize: "1 porzione (stima)" });
        expect((nodo.nutrition as Nodo).description).toContain("Stima");
      } else expect(nodo.nutrition).toBeUndefined();
      expect(menu).toContain(`"url":"${URL_SITO}/menu/${p.id}"`);
    }
  });

  it("la scheda del piatto porta ingredienti e allergeni nella descrizione", () => {
    const p = PIATTI[0];
    const d = nodoPiatto(p, true).description as string;
    expect(d).toContain(p.ingredienti[0].nome.toLowerCase());
    for (const a of p.allergeni) expect(d).toContain(a);
  });

  it("la scheda di una formula ha due offerte mensili, Standard e Plus, ai prezzi del volantino", () => {
    for (const f of FORMULE) {
      const nodo = nodoFormula(f.id);
      expect(nodo["@type"]).toBe("Service");
      expect(nodo["@id"]).toBe(idFormula(f.id));
      expect(nodo.url).toBe(`${URL_SITO}/abbonamento/${f.id}`);
      expect(nodo.provider).toEqual({ "@id": ID.cucina });
      const offerte = nodo.offers as Nodo[];
      expect(offerte).toHaveLength(2);
      expect(offerte.map((o) => o.name)).toEqual([etichettaFormula(f.id, "standard"), etichettaFormula(f.id, "plus")]);
      expect(offerte.map((o) => o.price)).toEqual([f.prezzo.standard, f.prezzo.plus]);
      for (const o of offerte) {
        expect(o["@type"]).toBe("Offer");
        expect(o.priceCurrency).toBe("EUR");
        expect(o.url).toBe(`${URL_SITO}/abbonamento/${f.id}`);
        // Un prezzo fisso al mese, non una soglia "da X a pasto", e nessuna durata minima inventata.
        const specifica = o.priceSpecification as Nodo;
        expect(specifica["@type"]).toBe("UnitPriceSpecification");
        expect(specifica.price).toBe(o.price);
        expect(specifica.priceCurrency).toBe("EUR");
        expect(specifica.unitText).toBe("mese");
        expect(specifica.referenceQuantity).toEqual({ "@type": "QuantitativeValue", value: 1, unitCode: "MON" });
        expect(specifica.minPrice).toBeUndefined();
        expect(o.billingDuration).toBeUndefined();
      }
    }
    // Il nome dell'offerta e' quello che si legge in pannello e nelle liste.
    expect((nodoFormula("completo").offers as Nodo[])[1].name).toBe("Completo · Plus");
  });

  it("gli abbonamenti insieme: da 173 a 946 euro al mese, con le cinque formule nel catalogo", () => {
    const nodo = nodoAbbonamenti();
    expect(nodo["@type"]).toBe("Service");
    expect(nodo["@id"]).toBe(ID.abbonamenti);
    expect(nodo.url).toBe(`${URL_SITO}/abbonamento`);
    expect(nodo.provider).toEqual({ "@id": ID.cucina });
    const aggregata = nodo.offers as Nodo;
    expect(aggregata["@type"]).toBe("AggregateOffer");
    expect(aggregata.priceCurrency).toBe("EUR");
    expect(aggregata.lowPrice).toBe(PREZZO_DA);
    expect(aggregata.highPrice).toBe(PREZZO_FINO_A);
    expect(aggregata.lowPrice).toBe(173);
    expect(aggregata.highPrice).toBe(946);
    expect(aggregata.offerCount).toBe(FORMULE.length * FASCE.length);

    const catalogo = nodo.hasOfferCatalog as Nodo;
    expect(catalogo["@type"]).toBe("OfferCatalog");
    const voci = catalogo.itemListElement as Nodo[];
    expect(voci.map((v) => v.url)).toEqual(FORMULE.map((f) => `${URL_SITO}/abbonamento/${f.id}`));
    for (const [i, f] of FORMULE.entries()) {
      const offerte = voci[i].itemListElement as Nodo[];
      expect(offerte.map((o) => o.price)).toEqual([f.prezzo.standard, f.prezzo.plus]);
      expect(offerte.every((o) => o.priceCurrency === "EUR")).toBe(true);
    }
    // Il prezzo minimo e massimo dell'aggregato sono davvero il minimo e il massimo delle offerte del catalogo.
    const prezzi = voci.flatMap((v) => (v.itemListElement as Nodo[]).map((o) => o.price as number));
    expect(Math.min(...prezzi)).toBe(aggregata.lowPrice);
    expect(Math.max(...prezzi)).toBe(aggregata.highPrice);
  });

  it("i nodi degli abbonamenti non inventano niente e i loro riferimenti @id si risolvono", () => {
    const nodi = [nodoAbbonamenti(), ...FORMULE.map((f) => nodoFormula(f.id))];
    const testo = JSON.stringify(nodi);
    for (const vietato of ["aggregateRating", "review", "telephone", "billingDuration", "geo", "openingHours"]) {
      expect(testo).not.toContain(`"${vietato}`);
    }
    const definiti = new Set<string>();
    const riferiti = new Set<string>();
    raccogliId([...grafoSito(), ...nodi], definiti, riferiti);
    for (const r of riferiti) expect(definiti.has(r), r).toBe(true);
    // Sopravvivono alla serializzazione: il JSON-LD e' JSON valido.
    expect(() => JSON.parse(serializzaJsonLd(nodi))).not.toThrow();
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

  it("la sitemap ha le cinque schede degli abbonamenti, con la data dell'ultima revisione", () => {
    expect(AGGIORNAMENTO).toBe("2026-10-15");
    expect(dataLeggibile(AGGIORNAMENTO)).toBe("15 ottobre 2026");
    expect(dataLeggibile("2026-09-30")).toBe("30 settembre 2026");
    for (const f of FORMULE) {
      const voce = voci.find((v) => v.url === `${URL_SITO}/abbonamento/${f.id}`);
      expect(voce, f.id).toBeDefined();
      expect(voce?.lastModified).toBe(AGGIORNAMENTO);
      expect(voce?.priority).toBeGreaterThan(0);
      expect(voce?.priority).toBeLessThanOrEqual(1);
    }
  });

  it("pagine di accesso fuori dalla sitemap ma scansionabili per leggere noindex", () => {
    const private_ = ["/dashboard", "/account", "/accedi", "/reimposta-password", "/api/"];
    for (const u of url) for (const p of private_) expect(u.startsWith(`${URL_SITO}${p}`)).toBe(false);
    const regole = robots().rules;
    const disallow = (Array.isArray(regole) ? regole[0] : regole).disallow;
    expect(disallow).toEqual(["/dashboard", "/api/"]);
    for (const percorso of ["/account", "/accedi", "/reimposta-password"]) {
      expect(disallow).not.toContain(percorso);
      const sorgente = readFileSync(path.join(RADICE, "app/(sito)", percorso.slice(1), "page.tsx"), "utf8");
      expect(sorgente).toContain("index: false");
    }
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

describe("pagine locali e contatti", () => {
  const LOCALI = [PAGINE.mealPrep, PAGINE.consegna, PAGINE.proteici, PAGINE.domicilio];
  const sorgente = (p: { percorso: string }) => readFileSync(path.join(RADICE, `app/(sito)${p.percorso}/page.tsx`), "utf8");

  it("ogni pagina locale ha un H1 solo, metadati, briciole e domande coerenti", () => {
    for (const p of LOCALI) {
      const src = sorgente(p);
      expect(src.match(/<h1[\s>]/g), p.percorso).toHaveLength(1);
      expect(src, p.percorso).toContain("metadatiPagina(PAGINA)");
      expect(src, p.percorso).toContain("<Briciole");
      expect(src, p.percorso).toContain("faq: DOMANDE");
    }
  });

  it("ogni pagina locale porta ad /abbonamento, al menu o al compositore e al modulo, e non lascia il modulo in cima alla pagina", () => {
    for (const p of LOCALI) {
      const src = sorgente(p);
      expect(src, p.percorso).toContain("PAGINE.abbonamento.percorso");
      expect(src, p.percorso).toMatch(/href="\/(menu|settimana)"/);
      // Il bottone principale porta al modulo, non in cima a /richiesta: la query preseleziona l'argomento, #scrivi scorre fino al modulo.
      const verso = [...src.matchAll(/href="(\/richiesta[^"]*)"/g)].map((m) => m[1]);
      for (const href of verso) expect(href, p.percorso).toMatch(/#scrivi$/);
    }
    // Le pagine locali che invitano a scrivere (tutte meno i pasti proteici, che chiude sulla CTA comune) lo fanno con l'argomento giusto.
    expect(sorgente(PAGINE.consegna)).toContain("/richiesta?argomento=consegna#scrivi");
    expect(sorgente(PAGINE.domicilio)).toContain("/richiesta?servizio=home-cooking#scrivi");
    expect(sorgente(PAGINE.mealPrep)).toContain("/richiesta?servizio=menu-settimana#scrivi");
  });

  it("gli indirizzi provati a mano (/contatti, /abbonamenti) reindirizzano in modo permanente a pagine che esistono e sono in mappa", () => {
    const regole = readFileSync(path.join(RADICE, "public/_redirects"), "utf8")
      .split(/\r?\n/)
      .map((r) => r.trim().split(/\s+/))
      .filter((r) => r.length === 3 && !r[0].startsWith("#") && !r[0].startsWith("/dashboard"));
    const url = sitemap().map((v) => v.url);
    for (const [da, a, codice] of regole) {
      expect(codice, da).toBe("301");
      expect(url, `${da} -> ${a}`).toContain(assoluto(a));
      // L'origine non e' una pagina viva: un redirect su una pagina esistente la renderebbe irraggiungibile.
      expect(existsSync(path.join(RADICE, `app/(sito)${da.replace(/\/$/, "")}/page.tsx`)), da).toBe(false);
    }
    const mappa = Object.fromEntries(regole.map(([da, a]) => [da, a]));
    expect(mappa["/contatti"]).toBe("/richiesta");
    expect(mappa["/contatto"]).toBe("/richiesta");
    expect(mappa["/abbonamenti"]).toBe("/abbonamento");
  });

  it("la consegna dice il raggio e le consegne in abbonamento, come il volantino", () => {
    const src = sorgente(PAGINE.consegna);
    expect(src).toContain("RAGGIO_CONSEGNA_KM");
    expect(src).toContain("CONSEGNA_OGNI_GIORNI");
    expect(RAGGIO_CONSEGNA_KM).toBe(20);
  });

  it("/richiesta e' una pagina della mappa, con titolo e descrizione nei limiti, e dice chi siamo e dove senza una seconda copia dei dati", () => {
    expect(PAGINE.richiesta.percorso).toBe("/richiesta");
    expect(sitemap().filter((v) => v.url === assoluto("/richiesta"))).toHaveLength(1);
    const src = sorgente(PAGINE.richiesta);
    expect(src.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(src).toContain("metadatiPagina(PAGINA)");
    expect(src).toContain('tipo: "ContactPage"');
    // L'attivita' sta nel grafo del layout: la pagina la richiama per @id e non la ridichiara.
    expect(src).toContain("ID.organizzazione");
    expect(src).not.toContain('"@type": "Organization"');
    expect(src).not.toContain("streetAddress");
  });

  it("i contatti dicono dove siamo con i dati veri: indirizzo, email, raggio e zone da lib/sito.ts e lib/abbonamento.ts", () => {
    const src = readFileSync(path.join(RADICE, "components/contatto/DoveSiamo.tsx"), "utf8");
    expect(src).toContain("RAGGIO_CONSEGNA_KM");
    expect(src).toContain("elencoZone()");
    expect(src).toContain("linkMappa()");
    // Niente numero o orari scritti a mano nel componente.
    expect(src).not.toMatch(/\d{3}[ .]?\d{3}[ .]?\d{4}/);
    expect(src).not.toMatch(/\b\d{1,2}[:.]\d{2}\b/);
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

  it("i piatti sono collegati alle schede e i vecchi valori non verificati non sono ripubblicati", () => {
    for (const p of PIATTI) expect(testo).toContain(`https://fuelchef.it/menu/${p.id}`);
    expect(testo).not.toMatch(/per porzione da \d+ g/);
    for (const vecchio of ["1173 kcal", "1015 kcal", "917 kcal", "1126 kcal", "587 kcal"]) expect(testo).not.toContain(vecchio);
    expect(testo).toContain("stim");
  });

  it("le pagine locali ci sono tutte", () => {
    for (const p of [PAGINE.mealPrep, PAGINE.consegna, PAGINE.proteici, PAGINE.domicilio]) {
      expect(testo).toContain(`https://fuelchef.it${p.percorso})`);
    }
  });

  it("abbonamenti e chi siamo ci sono, con il prezzo 'da' di lib/abbonamento.ts e senza il vecchio prezzo unico", () => {
    for (const p of [PAGINE.abbonamento, PAGINE.chiSiamo]) expect(testo).toContain(`https://fuelchef.it${p.percorso})`);
    expect(testo).toContain(`${PREZZO_DA_TESTO} al mese`);
    expect(testo).toContain(`${PREZZO_FINO_A} €`);
    expect(testo).not.toMatch(/\b239\b/);
  });

  it("le cinque formule ci sono, ciascuna con la sua scheda, i pasti a settimana e i due prezzi", () => {
    for (const f of FORMULE) {
      const riga = testo.split("\n").find((r) => r.includes(`(https://fuelchef.it${percorsoFormula(f.id)})`));
      expect(riga, f.id).toBeDefined();
      expect(riga).toContain(`[Abbonamento ${f.nome}]`);
      expect(riga).toContain(`${f.pastiSettimana} pasti a settimana`);
      expect(riga).toContain(`${f.prezzo.standard} € al mese in fascia Standard`);
      expect(riga).toContain(`${f.prezzo.plus} € in fascia Plus`);
    }
  });

  it("dice degli abbonamenti quello che ha detto il committente: piano del nutrizionista, ogni 3 giorni, sconti, diete, box", () => {
    expect(testo).toContain("piano scritto dal suo nutrizionista");
    expect(testo).toContain(`ogni ${CONSEGNA_OGNI_GIORNI} giorni`);
    expect(testo).toContain(`fino a ${RAGGIO_CONSEGNA_KM} km`);
    expect(testo).not.toMatch(/prova/i);
    expect(testo).toContain("Sconti solo con i codici creati da Matteo");
    expect(testo).toContain(BOX_DEL_GIORNO_TESTO);
    for (const d of DIETE) expect(testo).toContain(d);
    // Nessun pagamento online e nessuna consegna gratuita inventata per gli abbonamenti.
    expect(testo).toContain("Nessun pagamento online");
    expect(testo).not.toMatch(/abbonament[^\n]*consegna gratuit|consegna gratuit[^\n]*abbonament/i);
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
    const colpevoli = ["app", "components", "lib", "functions"]
      .flatMap(sorgenti)
      // Anche nei commenti, dove i giorni si scrivono con l'apostrofo ("lunedi' e giovedi'").
      .filter((f) => /luned[iì]'? (e|o) (il )?gioved|lun · gio|due cotture/i.test(readFileSync(path.join(RADICE, f), "utf8")));
    expect(colpevoli).toEqual([]);
  });

  it("nessun testo pubblico parla piu' della settimana di prova: ne' pagine, ne' componenti, ne' llms.txt", () => {
    // Il server rifiuta ancora trial=true di proposito (ordini.ts): quel messaggio di errore sta fuori dalla regola.
    const PROVA = /settimana di prova|prima settimana[^.\n]*\bprova|\bla provi\b|prova, senza impegno/i;
    const ESCLUSI = [path.join("lib", "server", "ordini.ts")];
    const colpevoli = ["app", "components", "lib", "functions"]
      .flatMap(sorgenti)
      .filter((f) => !ESCLUSI.includes(f))
      .filter((f) => PROVA.test(readFileSync(path.join(RADICE, f), "utf8")));
    expect(colpevoli).toEqual([]);
    expect(llms).not.toMatch(PROVA);
  });

  it("gli abbonamenti sono il secondo servizio, 'da' il prezzo piu' basso di lib/abbonamento.ts", () => {
    expect(SERVIZI.map((s) => s.id)).toEqual(["menu-settimana", "abbonamento", "sui-tuoi-macro", "home-cooking"]);
    expect(SERVIZI.map((s) => s.numero)).toEqual(["01", "02", "03", "04"]);
    expect(SERVIZI[1].prezzo).toEqual({ tipo: "mese-da", valore: PREZZO_DA });
    expect(SERVIZI[1].href).toBe(PAGINE.abbonamento.percorso);
    expect(ETICHETTE_SERVIZIO.abbonamento).toBe("Abbonamento mensile");
    // La descrizione cita le cinque formule per nome e la consegna ogni 3 giorni.
    for (const f of FORMULE) expect(SERVIZI[1].descrizione).toContain(f.nome);
    expect(SERVIZI[1].descrizione).toContain(`ogni ${CONSEGNA_OGNI_GIORNI} giorni`);
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

  it("gli abbonamenti partono da 173 euro al mese e il vecchio prezzo unico non c'e' piu'", () => {
    expect(PREZZO_DA).toBe(173);
    expect(PREZZO_DA_TESTO).toBe("173 €");
    expect(PREZZO_FINO_A).toBe(946);
    expect(titoloCompleto(PAGINE.abbonamento)).toContain(`${PREZZO_DA_TESTO} al mese`);
    // nodoServizio resta per i servizi a soglia (da X a pasto): un prezzo mensile non passa piu' di qui.
    const servizio = nodoServizio({
      id: "menu-settimana",
      percorso: PAGINE.servizi.percorso,
      nome: "Menu",
      descrizione: "x",
      tipoServizio: "x",
      prezzoDa: 8.9,
    });
    // Una soglia "da X a pasto" e' un AggregateOffer con lowPrice: un Offer senza price non passa i validatori.
    const offerta = servizio.offers as Nodo;
    expect(offerta["@type"]).toBe("AggregateOffer");
    expect(offerta.lowPrice).toBe(8.9);
    expect(offerta.priceCurrency).toBe("EUR");
    expect(offerta.description).toBe("Da 8,90 € a pasto");
    expect(offerta.price).toBeUndefined();
  });

  it("nessun sorgente, nemmeno README e llms.txt, presenta ancora 239 euro come prezzo dell'abbonamento", () => {
    // "239 €", "239 euro", "239,00" e i centesimi "23900": non i colori tipo "rgb(243 239 230)".
    const VECCHIO_PREZZO = /\b239(?:,00| ?€| euro)|\b23900\b/;
    const colpevoli = [...["app", "components", "lib", "functions"].flatMap(sorgenti), "README.md", "public/llms.txt"].filter((f) =>
      VECCHIO_PREZZO.test(readFileSync(path.join(RADICE, f), "utf8")),
    );
    expect(colpevoli).toEqual([]);
  });

  it("le strade per chiedere un abbonamento portano all'area cliente, con formula e fascia se si sanno, e al modulo contatti", () => {
    expect(LINK_RICHIEDI_ABBONAMENTO).toBe("/account?sezione=richiesta&servizio=abbonamento");
    expect(linkRichiediAbbonamento({ formula: "completo", fascia: "plus" })).toBe(
      "/account?sezione=richiesta&servizio=abbonamento&formula=completo&fascia=plus",
    );
    expect(LINK_SCRIVI_ABBONAMENTO).toBe("/richiesta?servizio=abbonamento#scrivi");
  });
});
