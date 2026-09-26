import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Export statico: il sito non ha bisogno di un server (tutto gira nel browser)
  // e si pubblica come file su Cloudflare. `next build` scrive tutto in out/.
  output: "export",
  turbopack: {
    // Senza questo Turbopack risale la gerarchia in cerca di un lockfile e trova
    // quello in C:\Users\dotat, prendendo la home come radice del progetto.
    root: path.resolve(__dirname),
  },
  images: {
    // Vedi lib/immagini/loader.ts: Unsplash ridimensiona da se', i file locali passano.
    loader: "custom",
    loaderFile: "./lib/immagini/loader.ts",
  },
};

export default nextConfig;
