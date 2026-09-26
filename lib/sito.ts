/**
 * L'indirizzo pubblico del sito, per i link assoluti: anteprime social,
 * sitemap, robots. Viene da NEXT_PUBLIC_SITE_URL, letta AL BUILD (il sito e'
 * un export statico): su Cloudflare va impostata nelle variabili di build.
 * Senza, si usa l'indirizzo di anteprima, che almeno non rompe niente.
 */
export const URL_SITO = (process.env.NEXT_PUBLIC_SITE_URL || "https://fuel-lab.pages.dev").replace(/\/+$/, "");
