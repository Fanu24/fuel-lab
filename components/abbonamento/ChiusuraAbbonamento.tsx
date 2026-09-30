import Link from "next/link";
import Reveal from "@/components/Reveal";
import FotoPiena from "@/components/ui/FotoPiena";
import { linkRichiediAbbonamento, linkScriviAbbonamento, type FormulaId } from "@/lib/abbonamento";
import type { ChiaveFoto } from "@/lib/immagini";
import { ZONA_A_PAROLE } from "./righe";

/* La chiusura di /abbonamento e delle cinque schede: "Prenota la tua settimana
   di prova." Sulla scheda di una formula il bottone porta alla richiesta con la
   formula gia' scelta. */

export default function ChiusuraAbbonamento({
  formula,
  foto = "schiscette",
}: {
  formula?: FormulaId;
  foto?: ChiaveFoto;
}) {
  return (
    <section className="notte relative overflow-hidden">
      <FotoPiena foto={foto} velo="forte" />
      <div className="wrap relative py-[calc(var(--sezione)*1.2)]">
        <Reveal>
          <h2 className="titolo max-w-[15ch]">Prenota la tua settimana di prova.</h2>
          <p className="mt-6 max-w-[52ch]" style={{ color: "rgb(243 239 230 / .88)" }}>
            Porti il piano del tuo nutrizionista, cuciniamo noi. La prima settimana è di prova, senza impegno: richiedi
            l&apos;abbonamento dal tuo account, oppure scrivi a Matteo. Inizio, consegna o ritiro e pagamento si
            concordano con lui. {ZONA_A_PAROLE}.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              href={linkRichiediAbbonamento({ formula })}
              className="btn btn-lime min-w-[min(100%,340px)] justify-between whitespace-normal py-3 text-left"
            >
              <span>Prenota la tua settimana di prova</span>
              <span aria-hidden="true" className="freccia">→</span>
            </Link>
            <Link href={linkScriviAbbonamento({ formula })} className="link">
              Scrivi a Matteo
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
