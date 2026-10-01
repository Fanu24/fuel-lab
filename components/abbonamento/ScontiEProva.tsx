import Link from "next/link";
import Reveal from "@/components/Reveal";
import { linkRichiediAbbonamento, type FormulaId } from "@/lib/abbonamento";
import { ELENCO_SCONTI, percentuale } from "./righe";

/* Gli sconti e la settimana di prova, dal volantino: "Ritiro in laboratorio
   -10%. In coppia -8%. In famiglia -10%. La prima settimana la provi senza
   impegno." Il volantino non dice se gli sconti si sommano, e la pagina non lo
   dice al posto suo: descrive la stima del simulatore e rimanda a Matteo.
   Sulla scheda di una formula il bottone della prova porta alla richiesta con
   quella formula gia' scelta (sulla consegna a casa, il listino della scheda). */

const DOPO_LA_RICHIESTA = [
  { titolo: "Ti risponde Matteo", testo: "Legge la tua richiesta lui, di persona." },
  { titolo: "Confermate insieme", testo: "Formula, prezzo, giorno d'inizio, ritiro o consegna." },
  { titolo: "Parti con la prova", testo: "La prima settimana la provi, senza impegno." },
];

export default function ScontiEProva({ formula }: { formula?: FormulaId }) {
  return (
    <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
      <Reveal>
        <p className="occhiello">Sconti</p>
        <h2 className="titolo mt-5 max-w-[12ch]">Ritiro, coppia, famiglia.</h2>
        <ul className="mt-10 border-t-[3px] border-ink">
          {ELENCO_SCONTI.map((s) => (
            <li key={s.chiave} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink/15 py-5">
              <span className="font-disp text-lg font-semibold tracking-[.04em] uppercase md:text-xl">{s.nome}</span>
              <span className="abb-cifra text-[32px] md:text-[40px]">{percentuale(s.valore)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-[52ch] text-muted">
          Se vi abbonate insieme, indicalo nella richiesta: Matteo conferma lo sconto. La stima del simulatore applica
          lo sconto più alto fra quelli che ti spettano; il prezzo finale lo conferma sempre Matteo.
        </p>
      </Reveal>

      <Reveal delay={80}>
        <p className="occhiello">La prima settimana</p>
        <h2 className="titolo mt-5 max-w-[12ch]">Prima la provi.</h2>
        <p className="mt-6 max-w-[48ch] text-lg leading-relaxed">
          La prima settimana è di prova, senza impegno. Prenota la tua settimana di prova: inizio, consegna o ritiro e
          pagamento si concordano con Matteo, e sul sito non si paga niente.
        </p>
        {/* Cosa succede dopo il bottone: e' il dubbio di chi sta per scrivere a uno sconosciuto. */}
        <p className="mt-10 font-disp text-xs font-semibold tracking-[.18em] uppercase">Dopo la richiesta</p>
        <ol className="mt-4 max-w-[48ch] border-t-[3px] border-ink">
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
          Prenota la tua settimana di prova <span aria-hidden="true" className="freccia">→</span>
        </Link>
      </Reveal>
    </div>
  );
}
