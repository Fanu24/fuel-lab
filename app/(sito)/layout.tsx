import { PianoProvider } from "@/lib/piano";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AvvisoSito from "@/components/impostazioni/AvvisoSito";
import SincronizzaPiano from "@/components/account/SincronizzaPiano";

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
        {/* L'avviso di Matteo (pannello > Impostazioni): fisso sotto la nav, non sposta la pagina. */}
        <AvvisoSito />
        <main id="contenuto">
          {/* Per chi ha fatto l'accesso la settimana si salva da sola nell'account. */}
          <SincronizzaPiano />
          {children}
        </main>
        <Footer />
      </PianoProvider>
    </>
  );
}
