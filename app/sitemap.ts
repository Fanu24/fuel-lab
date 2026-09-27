import type { MetadataRoute } from "next";
import { PIATTI } from "@/lib/catalogo";
import { URL_SITO } from "@/lib/sito";
import { ARTICOLI } from "@/lib/blog";

// Export statico: il file si genera una volta, al build.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pagine = ["", "/menu", "/settimana", "/scheda", "/servizi", "/come-funziona", "/chi-e-matteo", "/richiesta", "/blog", "/privacy"];
  return [
    ...pagine.map((p) => ({ url: `${URL_SITO}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...PIATTI.map((p) => ({ url: `${URL_SITO}/menu/${p.id}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...ARTICOLI.map((a) => ({ url: `${URL_SITO}/blog/${a.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
