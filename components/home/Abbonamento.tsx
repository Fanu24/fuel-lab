import Link from "next/link";
import Reveal from "@/components/Reveal";
import { PAGINE } from "@/components/seo/pagine";
import {
  ABBONAMENTO_CONSEGNA_GRATIS,
  COMPRENDE_ABBONAMENTO,
  LINK_RICHIEDI_ABBONAMENTO,
  PREZZO_ABBONAMENTO,
  SOGLIA_CONSEGNA_GRATIS,
} from "@/lib/abbonamento";

/**
 * Il riquadro del prezzo, lo stesso in home e su /abbonamento: prezzo, cosa
 * comprende, il bottone per richiederlo. Sta sulla notte perche' il prezzo e'
 * la prima cosa da leggere e il lime come testo e' legale solo li' (vedi
 * app/styles/tokens.css).
 */
export function RiquadroAbbonamento({ delay = 0, className = "" }: { delay?: number; className?: string }) {
  return (
    <Reveal delay={delay} className={`notte smusso p-7 md:p-10 ${className}`}>
      <p className="occhiello">Il prezzo</p>
      <p className="mt-6 flex flex-wrap items-end gap-x-4 gap-y-2">
        <span className="num text-[clamp(64px,9vw,120px)] leading-[.8] font-medium text-lime">
          {/* Niente spazio: nel carattere monospaziato diventa una casella vuota larga come una cifra. */}
          {PREZZO_ABBONAMENTO}
          <span className="ml-[.08em]">€</span>
        </span>
        <span className="font-disp text-lg font-semibold tracking-[.12em] uppercase">al mese</span>
      </p>
      <ul className="mt-8 grid gap-3 border-t pt-6" style={{ borderColor: "var(--line)" }}>
        {COMPRENDE_ABBONAMENTO.map((voce) => (
          <li key={voce} className="flex gap-3">
            <span aria-hidden="true" className="mt-2.5 h-2 w-2 shrink-0 bg-lime" />
            <span>{voce}</span>
          </li>
        ))}
      </ul>
      {ABBONAMENTO_CONSEGNA_GRATIS ? (
        <p className="mt-6 text-sm text-steel">
          Una ventina di pranzi al mese: sei sopra i {SOGLIA_CONSEGNA_GRATIS} pasti da cui la consegna è gratis.
        </p>
      ) : null}
      <Link href={LINK_RICHIEDI_ABBONAMENTO} className="btn btn-lime mt-8 w-full justify-between sm:w-auto sm:min-w-[300px]">
        Richiedi l&apos;abbonamento <span aria-hidden="true" className="freccia">→</span>
      </Link>
      <p className="mt-5 text-sm text-steel">
        Nessun pagamento online: inizio, consegna o ritiro e pagamento si concordano con Matteo.
      </p>
    </Reveal>
  );
}

/* Subito dopo i piatti, come ha chiesto Matteo: chi ha appena guardato il menu
   trova la strada per non pensarci piu' per un mese. Il testo sta sulla carta,
   il prezzo nel riquadro di notte. */
export default function Abbonamento() {
  return (
    <section className="sezione" aria-labelledby="abbonamento-home-titolo">
      <div className="wrap grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
        <Reveal>
          <p className="occhiello">Abbonamento mensile</p>
          <h2 id="abbonamento-home-titolo" className="titolo mt-5 max-w-[13ch]">
            Tutti i pranzi del mese. <span className="evidenzia">Un prezzo.</span>
          </h2>
          <p className="lead mt-6">
            Dal lunedì al venerdì, per tutto il mese, Matteo compone i tuoi pranzi sulla tua scheda: come ti alleni,
            cosa vuoi ottenere o i numeri del tuo nutrizionista. Niente settimana da comporre ogni volta: ci pensa lui.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link href={PAGINE.abbonamento.percorso} className="link">
              Come funziona l&apos;abbonamento
            </Link>
            <Link href="/scheda" className="link">
              Hai la scheda del nutrizionista?
            </Link>
          </div>
        </Reveal>
        <RiquadroAbbonamento delay={100} />
      </div>
    </section>
  );
}
