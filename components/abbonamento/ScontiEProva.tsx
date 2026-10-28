import Link from "next/link";
import Reveal from "@/components/Reveal";
import { linkRichiediAbbonamento, type FormulaId } from "@/lib/abbonamento";

/* Codici di Matteo, e cosa succede dopo la richiesta. */

const DOPO_LA_RICHIESTA = [
  { titolo: "Ti risponde Matteo", testo: "Legge la tua richiesta lui, di persona." },
  { titolo: "Confermate insieme", testo: "Formula, prezzo, giorno d'inizio, ritiro o consegna." },
];

export default function ScontiEProva({ formula }: { formula?: FormulaId }) {
  return (
    <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
      <Reveal>
        <p className="occhiello">Sconti</p>
        <h2 className="titolo mt-5 max-w-[12ch]">Hai un codice?</h2>
        <p className="mt-6 max-w-[52ch] text-muted">Applicalo nel riepilogo dell’abbonamento per vedere il prezzo aggiornato. I codici sconto li crea Matteo.</p>
      </Reveal>

      <Reveal delay={80}>
        <p className="occhiello">Dopo la richiesta</p>
        <h2 className="titolo mt-5 max-w-[12ch]">Cosa succede dopo.</h2>
        <p className="mt-6 max-w-[48ch] text-lg leading-relaxed">
          Inizio, consegna o ritiro e pagamento si concordano con Matteo, e sul sito non si paga niente.
        </p>
        {/* Cosa succede dopo il bottone: e' il dubbio di chi sta per scrivere a uno sconosciuto. */}
        <ol className="mt-10 max-w-[48ch] border-t-[3px] border-ink">
          {DOPO_LA_RICHIESTA.map((d, i) => (
            <li key={d.titolo} className="grid grid-cols-[2.5rem_1fr] border-b border-ink/15 py-4">
              <span className="num pt-1 text-sm text-muted">0{i + 1}</span>
              <span>
                <span className="block font-disp text-lg font-semibold tracking-[.04em] uppercase">{d.titolo}</span>
                <span className="block text-muted">{d.testo}</span>
              </span>
            </li>
          ))}
        </ol>
        <Link href={linkRichiediAbbonamento(formula ? { formula, ritiro: false } : {})} className="btn btn-ink mt-10 whitespace-normal py-3 text-left">
          Richiedi l&apos;abbonamento <span aria-hidden="true" className="freccia">→</span>
        </Link>
      </Reveal>
    </div>
  );
}
