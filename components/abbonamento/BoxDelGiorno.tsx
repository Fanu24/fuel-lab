import Link from "next/link";
import Reveal from "@/components/Reveal";
import { BOX_DEL_GIORNO } from "@/lib/abbonamento";

/* Le box del giorno, come le racconta il volantino: ogni giorno si cucina
   qualcosa in piu', quello che avanza diventa una box pronta a prezzo piccolo.
   Sono un extra, non l'abbonamento, e la pagina non promette che ce ne sia una
   ogni giorno: cosa c'e' dipende da quello che avanza, e lo dice Matteo. */

export default function BoxDelGiorno() {
  return (
    <section className="notte" aria-labelledby="box-del-giorno-titolo">
      <div className="wrap grid items-center gap-10 py-[var(--sezione)] lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <Reveal>
          <p className="occhiello">Anche senza abbonamento</p>
          <h2 id="box-del-giorno-titolo" className="titolo mt-5 max-w-[10ch]">
            Le box del giorno.
          </h2>
          <p className="mt-8 flex flex-wrap items-end gap-x-4 gap-y-2">
            <span className="abb-cifra text-[clamp(64px,9vw,112px)] text-lime">
              {BOX_DEL_GIORNO.da}–{BOX_DEL_GIORNO.a}
              <span className="ml-[.08em]">€</span>
            </span>
            <span className="font-disp text-lg font-semibold tracking-[.12em] uppercase">a box</span>
          </p>
        </Reveal>
        <Reveal delay={80} className="grid gap-6 text-lg leading-relaxed">
          <p>
            Ogni giorno cuciniamo qualcosa in più. Quello che avanza diventa una box pronta a prezzo piccolo: mangi
            bene anche senza abbonarti, e niente si spreca.
          </p>
          <p className="text-steel">
            Cosa c&apos;è ogni giorno dipende da quello che avanza, e a dirtelo è Matteo.
          </p>
          <div>
            <Link href="/richiesta#scrivi" className="link">
              Chiedi a Matteo cosa c&apos;è
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
