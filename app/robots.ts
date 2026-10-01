import type { MetadataRoute } from "next";
import { URL_SITO } from "@/lib/sito";

export const dynamic = "force-static";

/* Fuori dai motori le pagine private (pannello di Matteo, area cliente,
   accesso e reset password) e le API. Le pagine hanno anche il meta robots
   noindex e l'header X-Robots-Tag in public/_headers; le API lo hanno dal
   middleware delle Functions (functions/api/_middleware.ts), perche' _headers
   non vale per le Function. Tutto il resto, llms.txt compreso, e' aperto anche
   ai crawler delle risposte AI. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/account", "/accedi", "/reimposta-password", "/api/"],
    },
    sitemap: `${URL_SITO}/sitemap.xml`,
  };
}
