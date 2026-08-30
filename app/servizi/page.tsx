import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import { Eyebrow, Rise } from "@/components/ui";
import SezioneServizi from "@/components/servizi/SezioneServizi";

export const metadata: Metadata = {
  title: "Servizi",
  description:
    "Tre modi per mangiare bene con FUEL LAB: il menu della settimana e il piano sui macro della tua scheda a partire da 8,90 euro a pasto, oppure Matteo che cucina a casa tua, su preventivo.",
};

/**
 * Pagina /servizi: una piccola testata editoriale (coerente con le altre rotte
 * del sito, vedi app/come-funziona e app/chi-e-matteo) seguita dalla sezione
 * riusabile SezioneServizi, montata SENZA la sua intestazione: quella dice
 * "Tre modi di mangiare bene." esattamente come l'h1 qui sopra, e a video
 * le due comparivano una dopo l'altra separate solo da spazio vuoto. In
 * home la stessa sezione tiene la sua testata, perche' li' serve davvero.
 */
export default function Servizi() {
  return (
    <>
      {/* Testata sulla carta, servizi sul guscio: il confine fra le due si vede
          senza contare i pixel di vuoto (vedi "ritmo delle superfici" in
          globals.css). Le card dei servizi sono .shell, cioe' guscio: sulla
          fascia guscio la classe le porta a carta da sola, e la doppia scocca
          resta leggibile. */}
      <section className="fascia fascia-t fascia-carta relative overflow-x-clip">
        <div className="wrap">
          <Reveal>
            <Eyebrow className="mb-3 md:mb-[20px]">Come lavoriamo</Eyebrow>
          </Reveal>
          <h1 className="h1 max-w-[17ch]">
            <Rise i={0}>Tre modi</Rise>
            <Rise i={1}>
              <span className="hl hl-on"><i className="hl-bar" aria-hidden="true" /><span className="hl-tx">di mangiare bene.</span></span>
            </Rise>
          </h1>

          {/* il lead entra dopo le due righe del titolo, non insieme: fuel-rise qui
              non va, perche senza la maschera di .ln slitterebbe sopra il titolo */}
          <Reveal delay={480}>
            <p className="lead mt-4 max-w-[54ch] md:mt-7">
              Il menu gi&agrave; pronto, il piano che si costruisce sui macro della tua scheda,
              oppure Matteo che cucina dentro la tua cucina. Qui sotto trovi solo la soglia
              d&apos;ingresso: il prezzo esatto lo definiamo insieme, su WhatsApp.
            </p>
            <p className="note mt-4 md:mt-7">Menu e scheda / a partire da 8,90 &euro; a pasto</p>
          </Reveal>
        </div>
      </section>

      <SezioneServizi conTestata={false} fascia="guscio" />
    </>
  );
}
