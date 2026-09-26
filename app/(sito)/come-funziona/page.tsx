import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import TrePassi from "@/components/home/TrePassi";
import ChiusuraCta from "@/components/home/ChiusuraCta";
import FotoPiena from "@/components/ui/FotoPiena";
import Faq, { type Domanda } from "@/components/come-funziona/Faq";

export const metadata: Metadata = {
  title: "Come funziona",
  description:
    "Dici come ti alleni, la settimana si compone da sola, Matteo cucina il lunedì e il giovedì e consegna in giornata. Fresco, mai surgelato: quattro giorni di frigo.",
};

/* NOTA REDAZIONALE (non va in pagina): le risposte sono segnaposto da
   rivedere con Matteo, in particolare orari, zone e contenitori. */

const DOMANDE: Domanda[] = [
  {
    q: "Quanto durano in frigo?",
    a: "Quattro giorni dalla consegna. Sull'etichetta trovi data e ora di cottura: il quarto giorno è l'ultimo utile, non un margine gonfiato. Tienile tra 0 e 4 gradi, con il coperchio chiuso.",
  },
  {
    q: "Come si scaldano?",
    a: "In padella coperta, tre minuti a fuoco medio con un cucchiaio d'acqua. Al microonde, due minuti a 900 W con il coperchio appoggiato. I contenitori reggono entrambi.",
  },
  {
    q: "Quali zone servite?",
    a: "Pescara e provincia, fino a circa quaranta minuti dal laboratorio. Oltre, il vantaggio del fresco sparisce nel furgone.",
  },
  {
    q: "Posso saltare una settimana?",
    a: "Sì: basta scriverlo a Matteo entro il venerdì della settimana prima, quando parte la spesa. Nessuna penale.",
  },
  {
    q: "Ho un'allergia o un'intolleranza.",
    a: "Ogni piatto dichiara i suoi allergeni. La cucina però è una sola e lavora anche glutine, pesce e frutta a guscio: se hai un'allergia diagnosticata scrivi prima, e Matteo ti dice la verità anche quando la verità è che non fa al caso tuo.",
  },
  {
    q: "Il mio nutrizionista può parlare con Matteo?",
    a: "Volentieri. Dal compositore puoi anche mandargli la settimana con un link: la vede identica, con i macro giorno per giorno.",
  },
];

export default function ComeFunziona() {
  return (
    <>
      <section className="testata">
        <div className="wrap">
          <p className="occhiello">Come funziona</p>
          <h1 className="titolo-xl mt-6 max-w-[12ch]">Dal tuo allenamento al tuo frigo.</h1>
        </div>
      </section>

      <TrePassi />

      <section className="notte relative overflow-hidden">
        <FotoPiena foto="schiscette" />
        <div className="wrap relative grid gap-12 py-[var(--sezione)] md:grid-cols-2">
          <Reveal>
            <p className="occhiello">Fresco contro surgelato</p>
            <h2 className="titolo mt-5 max-w-[12ch]">Due giorni, non due stagioni.</h2>
          </Reveal>
          <Reveal delay={80} className="grid content-end gap-6 text-lg" >
            <p style={{ color: "rgb(243 239 230 / .9)" }}>
              Matteo cucina il lunedì e il giovedì e consegna in giornata. La schiscetta che apri mercoledì sera è
              stata in padella lunedì mattina.
            </p>
            <p style={{ color: "rgb(243 239 230 / .9)" }}>
              Niente abbattitore a meno diciotto, niente magazzino: il riso resta riso e la carne resta carne.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="sezione">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="occhiello">Domande</p>
            <h2 className="titolo mt-5">Le risposte, senza giri.</h2>
          </div>
          <Faq domande={DOMANDE} />
        </div>
      </section>

      <ChiusuraCta />
    </>
  );
}
