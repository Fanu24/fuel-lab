import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Senza questo Turbopack risale la gerarchia in cerca di un lockfile e trova
    // quello in C:\Users\dotat, prendendo la home come radice del progetto.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
