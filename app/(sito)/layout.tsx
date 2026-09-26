import { PianoProvider } from "@/lib/piano";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

/* Il guscio delle pagine pubbliche. La dashboard di Matteo sta fuori da questo
   gruppo: niente nav del sito, niente footer, niente piano del cliente. */
export default function LayoutSito({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#contenuto" className="skip">
        Vai al contenuto
      </a>
      <PianoProvider>
        <Nav />
        <main id="contenuto">{children}</main>
        <Footer />
      </PianoProvider>
    </>
  );
}
