import type { MetadataRoute } from "next";
import { PIATTI } from "@/lib/catalogo";
import { ARTICOLI, CATEGORIE, articoliPerCategoria } from "@/lib/blog";
import { AGGIORNAMENTO, IMMAGINE_OG, PAGINE, paginaPiatto, type PaginaSeo } from "@/components/seo/pagine";
import { assoluto } from "@/components/seo/schema";

// Export statico: il file si genera una volta, al build.
export const dynamic = "force-static";

/* Solo pagine pubbliche e indicizzabili: niente pannello, area cliente,
   accesso o reset password (sono noindex e fuori da robots.txt).
   lastModified e' la data dell'ultima revisione dei contenuti, non quella del
   build: una data che cambia a ogni pubblicazione insegna a Google a
   ignorarla. */

function voce(p: PaginaSeo, immagini: string[] = []): MetadataRoute.Sitemap[number] {
  return {
    url: assoluto(p.percorso),
    lastModified: AGGIORNAMENTO,
    changeFrequency: p.frequenza,
    priority: p.priorita,
    ...(immagini.length ? { images: immagini.map(assoluto) } : {}),
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const { home, ...interne } = PAGINE;
  return [
    voce(home, [IMMAGINE_OG.url]),
    ...Object.values(interne).map((p) => voce(p)),
    ...PIATTI.map((p) => voce(paginaPiatto(p), [p.img])),
    // Pagine di altri reparti del sito: pubbliche, quindi in mappa.
    { url: assoluto("/richiesta"), lastModified: AGGIORNAMENTO, changeFrequency: "yearly", priority: 0.5 },
    { url: assoluto("/blog"), lastModified: AGGIORNAMENTO, changeFrequency: "weekly", priority: 0.6 },
    ...CATEGORIE.filter((c) => articoliPerCategoria(c.id).length).map((c) => ({
      url: assoluto(`/blog/categoria/${c.id}`),
      lastModified: articoliPerCategoria(c.id).map((a) => a.aggiornato ?? a.data).sort().at(-1) ?? AGGIORNAMENTO,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...ARTICOLI.map((a) => ({
      url: assoluto(`/blog/${a.slug}`),
      lastModified: a.aggiornato ?? a.data,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
