import type { MetadataRoute } from "next";
import { DESCRIZIONE_ATTIVITA, NOME_ATTIVITA } from "@/lib/sito";

// Export statico: il file si genera una volta, al build.
export const dynamic = "force-static";

/* Il manifest per "Aggiungi alla schermata Home": nome, colori del sito
   (la carta come sfondo, la notte come barra, la stessa del viewport nel
   layout) e le icone che esistono gia' in app/. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${NOME_ATTIVITA} · Meal prep a Pescara`,
    short_name: NOME_ATTIVITA,
    description: DESCRIZIONE_ATTIVITA,
    lang: "it",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f3efe6",
    theme_color: "#0e100f",
    categories: ["food", "health", "lifestyle"],
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
    ],
  };
}
