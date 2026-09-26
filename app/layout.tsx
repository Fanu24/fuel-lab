import type { Metadata, Viewport } from "next";
import { Archivo, Martian_Mono, Oxanium } from "next/font/google";
import "./globals.css";

/* Oxanium per titoli ed etichette: lettere squadrate con gli spigoli tagliati a
   45 gradi, la stessa geometria del logo FUEL LAB. E' variabile (200-800) e ha
   latin-ext, quindi gli accenti italiani non cadono su un font di ripiego.
   Archivo resta per il testo corrente, Martian Mono solo per i numeri: macro,
   grammi, conteggi. */
const oxanium = Oxanium({
  subsets: ["latin", "latin-ext"],
  variable: "--f-disp",
  display: "swap",
});
const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--f-ui",
  display: "swap",
});
const martian = Martian_Mono({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--f-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FUEL LAB · Allenati. Al cibo ci pensa Matteo.",
    template: "%s · FUEL LAB",
  },
  description:
    "Meal prep fresco a Pescara, mai surgelato. Dici come ti alleni, la settimana si compone da sola: piatti pensati per il cardio e per i pesi, cucinati il lunedì e il giovedì.",
};

export const viewport: Viewport = {
  themeColor: "#0e100f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="it"
      className={`${oxanium.variable} ${archivo.variable} ${martian.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Marca la pagina come "JS vivo" prima del primo paint: le rivelazioni in
            scroll partono da opacity:0 solo sotto .js, cosi' senza JavaScript il
            sito resta statico invece che bianco. */}
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add('js')` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
