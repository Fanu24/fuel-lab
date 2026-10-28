import type { MetadataRoute } from "next";
import { URL_SITO } from "@/lib/sito";

export const dynamic = "force-static";

/* Le schermate pubbliche di accesso e account devono essere scansionabili:
   solo cosi' i motori possono leggere il loro noindex (meta e X-Robots-Tag).
   I dati dei clienti restano protetti dalle API autenticate. Dashboard e API
   restano esclusi dalla scansione. Le pagine pubbliche sono aperte anche ai
   crawler dei motori di ricerca AI. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/api/"],
    },
    sitemap: `${URL_SITO}/sitemap.xml`,
  };
}
