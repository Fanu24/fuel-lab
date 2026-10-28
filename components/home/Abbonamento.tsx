import Link from "next/link";
import Reveal from "@/components/Reveal";
import { CONSEGNA_CONCORDATA, PREZZO_DA_TESTO } from "@/lib/abbonamento";

export default function Abbonamento() {
  return (
    <section id="abbonamenti" className="sezione" aria-labelledby="abbonamento-home-titolo">
      <div className="wrap grid items-center gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
        <Reveal>
          <p className="occhiello">Abbonamenti</p>
          <h2 id="abbonamento-home-titolo" className="titolo mt-5 max-w-[15ch]">La settimana è servita.</h2>
          <p className="lead mt-5 max-w-[40ch]">Matteo cucina il piano del tuo nutrizionista. Scegli quanti pasti ricevere.</p>
          <p className="mt-3 text-muted">{CONSEGNA_CONCORDATA}</p>
        </Reveal>
        <Reveal delay={80} className="notte smusso p-6 md:p-9">
          <p className="text-sm text-steel">Abbonamenti da</p>
          <p className="num mt-2 text-[clamp(52px,6vw,80px)] leading-none text-lime">{PREZZO_DA_TESTO}<span className="ml-2 text-lg text-paper">/ mese</span></p>
          <p className="mt-4 text-steel">5 formule, in fascia Standard o Plus.</p>
          <Link href="/abbonamento" className="btn btn-lime mt-6 w-full justify-between">
            Scegli l&apos;abbonamento <span aria-hidden="true">→</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
