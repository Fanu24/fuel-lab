import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { CartProvider } from "@/lib/cart";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import "./globals.css";

/* Archivo in peso 900 fa da display: la direzione "Palestra Bianca" non usa un
   font decorativo separato, la forza viene dal peso e dal tracking negativo. */
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--f-ui",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--f-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FUEL LAB — Mangia come ti alleni",
    template: "%s — FUEL LAB",
  },
  description:
    "Meal prep fresco a Pescara, mai surgelato. Schiscette costruite sui macro della tua scheda, cucinate il lunedi e il giovedi. Menu della settimana, piano sui tuoi macro, home cooking.",
};

export const viewport: Viewport = {
  themeColor: "#f5f6f4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${archivo.variable} ${mono.variable}`}>
      <head>
        {/*
          Marca la pagina come "JS vivo" prima del primo paint. Le rivelazioni in
          scroll partono da opacity:0 solo sotto .js: senza questa riga, con il
          JavaScript disattivato il sito resterebbe bianco invece che statico.
        */}
        <script
          dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add('js')` }}
        />
      </head>
      <body>
        <CartProvider>
          <Nav />
          <main id="contenuto">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
