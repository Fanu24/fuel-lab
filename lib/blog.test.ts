import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ANCORE_RISERVATE,
  ARTICOLI,
  CATEGORIE,
  FOTO_BLOG,
  SLUG_IN_EVIDENZA,
  articoliPerCategoria,
  articoloPerSlug,
  categoriaPerId,
  correlatiDi,
  dataLeggibile,
  idSezione,
  linkInterni,
  minutiLettura,
  paroleArticolo,
  testiArticolo,
  testoSemplice,
  titoloPagina,
  titoloPaginaCategoria,
} from "./blog";
import { APPROFONDIMENTI } from "./blog-approfondimenti";
import { getPiatto } from "./catalogo";

/* Il blog è fatto di dati scritti a mano: questi test sono la rete sotto i
   refusi che un occhio non vede (uno slug doppio, un link a una pagina che
   non c'è, una description troppo lunga per Google). */

const RADICE = path.resolve(__dirname, "..");
const PAGINE = path.join(RADICE, "app", "(sito)");

/** true se il percorso interno porta a una pagina che il build genera davvero. */
function rottaEsiste(href: string): boolean {
  const [percorso] = href.split("#");
  if (percorso === "") return true;
  if (!percorso.startsWith("/") || percorso.includes("?")) return false;
  const segmenti = percorso.split("/").filter(Boolean);
  if (segmenti.length === 0) return fs.existsSync(path.join(PAGINE, "page.tsx"));
  if (segmenti[0] === "blog") {
    if (segmenti.length === 1) return true;
    if (segmenti.length === 2) return Boolean(articoloPerSlug(segmenti[1]));
    if (segmenti.length === 3 && segmenti[1] === "categoria") return Boolean(categoriaPerId(segmenti[2]));
    return false;
  }
  if (segmenti[0] === "menu" && segmenti.length === 2) return Boolean(getPiatto(segmenti[1]));
  return fs.existsSync(path.join(PAGINE, ...segmenti, "page.tsx"));
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const dataValida = (s: string) => ISO.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));

describe("articoli del blog", () => {
  it("ci sono almeno 24 articoli con slug unici in kebab-case", () => {
    expect(ARTICOLI.length).toBeGreaterThanOrEqual(24);
    const slug = ARTICOLI.map((a) => a.slug);
    expect(new Set(slug).size).toBe(slug.length);
    for (const s of slug) {
      expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      // /blog/categoria è una cartella statica: uno slug uguale verrebbe oscurato
      expect(s).not.toBe("categoria");
    }
  });

  it("ogni articolo ha i campi obbligatori compilati", () => {
    for (const a of ARTICOLI) {
      expect(a.titolo.trim(), a.slug).not.toBe("");
      expect(a.introduzione.length, a.slug).toBeGreaterThan(120);
      expect(a.sezioni.length, a.slug).toBeGreaterThanOrEqual(3);
      expect(a.faq.length, a.slug).toBeGreaterThanOrEqual(2);
      expect(categoriaPerId(a.categoria), a.slug).toBeDefined();
      expect(FOTO_BLOG[a.foto], a.slug).toBeDefined();
      for (const s of a.sezioni) {
        expect(s.titolo.trim(), a.slug).not.toBe("");
        expect(s.paragrafi.length, `${a.slug} · ${s.titolo}`).toBeGreaterThan(0);
        for (const riga of s.tabella?.righe ?? []) expect(riga.length).toBe(s.tabella!.intestazioni.length);
      }
      for (const f of a.faq) {
        expect(f.domanda.trim().endsWith("?"), `${a.slug} · ${f.domanda}`).toBe(true);
        expect(f.risposta.length, a.slug).toBeGreaterThan(40);
      }
    }
  });

  it("date di pubblicazione e aggiornamento sono ISO valide e coerenti", () => {
    for (const a of ARTICOLI) {
      expect(dataValida(a.data), a.slug).toBe(true);
      if (a.aggiornato) {
        expect(dataValida(a.aggiornato), a.slug).toBe(true);
        expect(a.aggiornato >= a.data, a.slug).toBe(true);
      }
    }
    expect(dataLeggibile("2026-09-27")).toBe("27 settembre 2026");
  });

  it("title entro 60 caratteri e description tra 140 e 155", () => {
    for (const a of ARTICOLI) {
      expect(titoloPagina(a).length, `${a.slug}: ${titoloPagina(a)}`).toBeLessThanOrEqual(60);
      expect(a.descrizione.length, `${a.slug}: ${a.descrizione.length}`).toBeGreaterThanOrEqual(140);
      expect(a.descrizione.length, `${a.slug}: ${a.descrizione.length}`).toBeLessThanOrEqual(155);
    }
  });

  it("ogni articolo ha una risposta breve in apertura", () => {
    for (const a of ARTICOLI) {
      const approfondimento = APPROFONDIMENTI[a.slug];
      expect(approfondimento, a.slug).toBeDefined();
      expect(approfondimento.risposta.length, a.slug).toBeGreaterThan(80);
      expect(approfondimento.passi.length, a.slug).toBeGreaterThanOrEqual(3);
    }
    for (const chiave of Object.keys(APPROFONDIMENTI)) expect(articoloPerSlug(chiave), chiave).toBeDefined();
  });

  it("tempo di lettura e lunghezza sono plausibili", () => {
    for (const a of ARTICOLI) {
      expect(minutiLettura(a), a.slug).toBeGreaterThanOrEqual(1);
      expect(paroleArticolo(a), a.slug).toBeGreaterThanOrEqual(350);
    }
    // le guide della seconda serie hanno link ai piatti: sono quelle lunghe
    for (const a of ARTICOLI.filter((x) => x.piatti?.length)) {
      expect(paroleArticolo(a), a.slug).toBeGreaterThanOrEqual(900);
      expect(paroleArticolo(a), a.slug).toBeLessThanOrEqual(1700);
    }
  });

  it("nessuna guida è contenuto sottile", () => {
    // anche la prima serie è stata portata al livello della seconda: si resta lì
    for (const a of ARTICOLI) {
      expect(paroleArticolo(a), a.slug).toBeGreaterThanOrEqual(900);
      expect(a.piatti?.length ?? 0, a.slug).toBeGreaterThan(0);
      expect(a.faq.length, a.slug).toBeGreaterThanOrEqual(4);
      expect(a.fonti?.length ?? 0, a.slug).toBeGreaterThan(0);
      expect(a.correlati?.length ?? 0, a.slug).toBeGreaterThanOrEqual(3);
    }
  });

  it("piatti e articoli correlati esistono", () => {
    for (const a of ARTICOLI) {
      for (const id of a.piatti ?? []) expect(getPiatto(id), `${a.slug} → ${id}`).toBeDefined();
      for (const s of a.sezioni) for (const id of s.piatti ?? []) expect(getPiatto(id), `${a.slug} → ${id}`).toBeDefined();
      const correlati = [...(a.correlati ?? []), ...(APPROFONDIMENTI[a.slug]?.correlati ?? [])];
      for (const slug of correlati) {
        expect(slug, a.slug).not.toBe(a.slug);
        expect(articoloPerSlug(slug), `${a.slug} → ${slug}`).toBeDefined();
      }
      expect(new Set(a.correlati ?? []).size).toBe((a.correlati ?? []).length);
      const proposti = correlatiDi(a);
      expect(proposti.length, a.slug).toBe(3);
      expect(proposti.map((x) => x.slug)).not.toContain(a.slug);
    }
  });

  it("i link interni nei testi portano a pagine che esistono", () => {
    for (const a of ARTICOLI) {
      for (const href of linkInterni(a)) expect(rottaEsiste(href), `${a.slug} → ${href}`).toBe(true);
      // niente sintassi rimasta a metà: dopo aver tolto i link non restano parentesi quadre
      for (const testo of testiArticolo(a)) expect(testoSemplice(testo), a.slug).not.toMatch(/[[\]]/);
    }
    // le guide nuove linkano almeno un piatto o il compositore e un altro articolo
    for (const a of ARTICOLI.filter((x) => x.piatti?.length)) {
      const link = linkInterni(a);
      expect(link.some((h) => h.startsWith("/menu") || h === "/settimana"), a.slug).toBe(true);
      expect(link.some((h) => h.startsWith("/blog/")), a.slug).toBe(true);
    }
  });

  it("le ancore delle sezioni sono uniche e non usano quelle della pagina", () => {
    for (const a of ARTICOLI) {
      const ancore = a.sezioni.map((s) => idSezione(s.titolo));
      expect(new Set(ancore).size, a.slug).toBe(ancore.length);
      for (const ancora of ancore) {
        expect(ancora, a.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
        expect(ANCORE_RISERVATE, a.slug).not.toContain(ancora);
      }
    }
    expect(idSezione("Perché piacciono a chi si allena")).toBe("perche-piacciono-a-chi-si-allena");
  });

  it("le fonti sono link https senza doppioni", () => {
    for (const a of ARTICOLI) {
      const url = (a.fonti ?? []).map((f) => f.url);
      expect(new Set(url).size, a.slug).toBe(url.length);
      for (const u of url) expect(u, a.slug).toMatch(/^https:\/\/[^\s]+$/);
    }
  });

  it("i testi usano apostrofi tipografici", () => {
    for (const a of ARTICOLI) {
      for (const testo of [a.titolo, a.descrizione, ...testiArticolo(a)]) {
        expect(testo, a.slug).not.toMatch(/\p{L}'\p{L}/u);
      }
    }
  });

  it("le foto esistono in /public", () => {
    for (const foto of Object.values(FOTO_BLOG)) {
      expect(fs.existsSync(path.join(RADICE, "public", foto.src)), foto.src).toBe(true);
    }
  });
});

describe("categorie del blog", () => {
  it("hanno id unici, metadata nei limiti e almeno due articoli", () => {
    const id = CATEGORIE.map((c) => c.id);
    expect(new Set(id).size).toBe(id.length);
    for (const c of CATEGORIE) {
      expect(titoloPaginaCategoria(c).length, c.id).toBeLessThanOrEqual(60);
      expect(c.descrizione.length, `${c.id}: ${c.descrizione.length}`).toBeGreaterThanOrEqual(140);
      expect(c.descrizione.length, `${c.id}: ${c.descrizione.length}`).toBeLessThanOrEqual(155);
      expect(articoliPerCategoria(c.id).length, c.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("l’articolo in evidenza esiste", () => {
    expect(articoloPerSlug(SLUG_IN_EVIDENZA)).toBeDefined();
  });
});
