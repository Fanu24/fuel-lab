import Link from "next/link";
import Reveal from "@/components/Reveal";
import { PAGINE } from "@/components/seo/pagine";
import {
  CONSEGNA_OGNI_GIORNI,
  FORMULE,
  LINK_RICHIEDI_ABBONAMENTO,
  PREZZO_DA_TESTO,
  percorsoFormula,
} from "@/lib/abbonamento";
import { ZONA_A_PAROLE } from "@/components/abbonamento/righe";

/* Subito dopo i piatti, come ha chiesto Matteo: chi ha appena guardato il menu
   trova la strada per non pensarci piu'. Il testo sta sulla carta, le cinque
   formule sulla notte, perche' il prezzo e' la prima cosa da leggere e il lime
   come testo e' legale solo li' (vedi app/styles/tokens.css). Nomi, pasti e
   prezzi arrivano tutti da lib/abbonamento.ts. */
export default function Abbonamento() {
  return (
    <section className="sezione" aria-labelledby="abbonamento-home-titolo">
      <div className="wrap grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
        <Reveal>
          <p className="occhiello">Abbonamenti</p>
          <h2 id="abbonamento-home-titolo" className="titolo mt-5 max-w-[13ch]">
            Cinque abbonamenti, <span className="evidenzia">uno è il tuo.</span>
          </h2>
          <p className="lead mt-6">
            Il piano del tuo nutrizionista, cucinato. Ci lasci la dieta, noi la prepariamo ai grammi nel nostro
            laboratorio e te la portiamo pronta ogni {CONSEGNA_OGNI_GIORNI} giorni. {ZONA_A_PAROLE}.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link href={PAGINE.abbonamento.percorso} className="btn btn-ink">
              Tutti gli abbonamenti <span aria-hidden="true" className="freccia">→</span>
            </Link>
            <Link href={LINK_RICHIEDI_ABBONAMENTO} className="link">
              Prenota la tua settimana di prova
            </Link>
          </div>
        </Reveal>

        <Reveal delay={100} className="notte smusso p-7 md:p-10">
          <p className="occhiello">Da {PREZZO_DA_TESTO} al mese</p>
          <ul className="mt-6">
            {FORMULE.map((f) => (
              <li key={f.id}>
                <Link href={percorsoFormula(f.id)} className="abb-mini">
                  <span>
                    <span className="abb-mini-nome">
                      {f.nome}
                      {f.consigliato ? <span className="ml-3 align-middle text-[11px] tracking-[.16em] text-lime">Consigliato</span> : null}
                    </span>
                    <span className="mt-1 block text-sm text-steel">{f.pastiSettimana} pasti a settimana</span>
                  </span>
                  <span className="abb-cifra text-[28px] text-lime">
                    {f.prezzo.standard}
                    <span className="ml-[.08em]">€</span>
                    <span className="sr-only"> al mese, fascia Standard</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 border-t pt-6 text-sm text-steel" style={{ borderColor: "var(--line)" }}>
            Prezzi al mese in fascia Standard. Ogni formula c&apos;è anche in fascia Plus, con porzioni e proteine
            maggiorate per chi si allena. La prima settimana è di prova, senza impegno.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
