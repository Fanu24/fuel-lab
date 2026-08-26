import type { Metadata, Viewport } from "next";
import { Anton, Archivo, Martian_Mono } from "next/font/google";
import { CartProvider } from "@/lib/cart";
import { PianoProvider } from "@/lib/piano";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import "./globals.css";

/* I tre caratteri dell'identita, che il fondo chiaro non tocca.
   Anton ha un solo peso disegnato: va chiesto con weight "400", non come
   variabile. Archivo e Martian Mono sono variabili e portano anche l'asse
   di larghezza: serve davvero, perche Martian Mono a wdth 100 e troppo largo
   per le etichette italiane e globals.css lo stringe a 84. */
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--f-disp",
  display: "swap",
});
const archivo = Archivo({
  subsets: ["latin"],
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
    default: "FUEL LAB — Mangia come ti alleni",
    template: "%s — FUEL LAB",
  },
  description:
    "Meal prep fresco a Pescara, mai surgelato. Schiscette costruite sui macro della tua scheda, cucinate il lunedi e il giovedi. Menu della settimana, piano sui tuoi macro, home cooking.",
};

/* La barra del browser prende il colore della carta: su mobile e la prima
   cosa che si vede, e una barra chiara sopra una pagina chiara evita lo
   stacco che tradirebbe il tema vecchio. */
export const viewport: Viewport = {
  themeColor: "#f4f1e8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${anton.variable} ${archivo.variable} ${martian.variable}`}>
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
        {/*
          Due provider montati insieme, non uno di troppo: il piano settimanale e'
          il modello nuovo, ma sei pagine leggono ancora il carrello e verranno
          spostate una alla volta. Togliere CartProvider adesso lascerebbe la build
          rotta per tutta la migrazione, e in quella finestra nessuna rottura vera
          si distinguerebbe piu' da quelle attese. CartProvider sparisce quando
          l'ultima pagina avra' smesso di usarlo.
        */}
        <CartProvider>
          <PianoProvider>
            <Nav />
            <main id="contenuto">{children}</main>
            <Footer />
          </PianoProvider>
        </CartProvider>
      </body>
    </html>
  );
}
