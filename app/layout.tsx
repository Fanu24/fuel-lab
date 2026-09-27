import type { Metadata, Viewport } from "next";
import { Archivo, Martian_Mono, Oxanium } from "next/font/google";
import { DESCRIZIONE_ATTIVITA, NOME_ATTIVITA, TITOLARE, URL_SITO } from "@/lib/sito";
import PrivacyConsent from "@/components/PrivacyConsent";
import JsonLd from "@/components/seo/JsonLd";
import { grafoSito } from "@/components/seo/schema";
import { IMMAGINE_OG, TEMPLATE_TITOLO } from "@/components/seo/pagine";
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

/* Il default per le pagine che non dicono nulla. L'openGraph qui NON ha titolo
   ne' descrizione apposta: Next li riempie con quelli della pagina, cosi' anche
   una pagina che dichiara solo `title` si presenta sui social col suo nome e
   non con quello della home. Le pagine del sito passano da metadatiPagina()
   (components/seo/pagine.ts), che scrive l'openGraph per intero. */
export const metadata: Metadata = {
  metadataBase: new URL(URL_SITO),
  title: {
    default: `${NOME_ATTIVITA} · Allenati. Al cibo ci pensa Matteo.`,
    template: TEMPLATE_TITOLO,
  },
  description: DESCRIZIONE_ATTIVITA,
  applicationName: NOME_ATTIVITA,
  authors: [{ name: TITOLARE.nome, url: `${URL_SITO}/chi-siamo` }],
  publisher: NOME_ATTIVITA,
  formatDetection: { telephone: false, address: false, email: false },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: NOME_ATTIVITA,
    images: [IMMAGINE_OG],
  },
  twitter: { card: "summary_large_image" },
  /* Verifica della proprieta' su Google Search Console e Bing Webmaster Tools:
     i codici arrivano dalle variabili di build, senza, nessun meta. */
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } : {}),
    ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } } : {}),
  },
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
        {/* L'attivita', la cucina, il sito e Matteo: il grafo che ogni pagina
            richiama per @id (components/seo/schema.ts). */}
        <JsonLd dati={grafoSito()} />
        {/* Marca la pagina come "JS vivo" prima del primo paint: le rivelazioni in
            scroll partono da opacity:0 solo sotto .js, cosi' senza JavaScript il
            sito resta statico invece che bianco. */}
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add('js')` }} />
      </head>
      <body>{children}<PrivacyConsent /></body>
    </html>
  );
}
