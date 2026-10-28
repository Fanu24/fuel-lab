"use client";

import Link from "next/link";
import {
  FASCE,
  FORMULE,
  NOMI_FASCIA,
  NOTE_FASCIA,
  linkRichiediAbbonamento,
  percorsoFormula,
} from "@/lib/abbonamento";
import { useFascia } from "./FasciaScelta";
import { CIRCA_A_PASTO_FRASE } from "./righe";

/**
 * Le cinque formule in fila, come il retro del volantino: nome, cosa copre,
 * pasti a settimana, prezzo al mese. L'interruttore Standard/Plus cambia i
 * prezzi di tutte le righe e la fascia del bottone "Richiedi": chi clicca
 * arriva alla richiesta con formula e fascia gia' scelte.
 *
 * Client component solo per l'interruttore. L'HTML statico e' quello della
 * fascia Standard, che e' anche l'unica con "circa 8 euro a pasto".
 */
export default function Formule() {
  const [fascia, setFascia] = useFascia();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
        <div className="abb-gruppo" role="group" aria-labelledby="abb-fascia-titolo">
          <p id="abb-fascia-titolo" className="abb-legenda">
            Fascia
          </p>
          <div className="segmenti">
            {FASCE.map((f) => (
              <button key={f} type="button" aria-pressed={fascia === f} onClick={() => setFascia(f)}>
                {NOMI_FASCIA[f]}
              </button>
            ))}
          </div>
        </div>
        <p className="max-w-[46ch] text-muted">
          <strong className="font-semibold text-ink">{NOMI_FASCIA[fascia]}.</strong> {NOTE_FASCIA[fascia]}
          {fascia === "standard" ? ` ${CIRCA_A_PASTO_FRASE}` : ""}
        </p>
      </div>

      {/* Chi usa uno screen reader sente cosa e' cambiato: i prezzi delle righe non si annunciano da soli. */}
      <p className="sr-only" role="status">
        Prezzi al mese in fascia {NOMI_FASCIA[fascia]}.
      </p>

      <ul className="abb-righe mt-8">
        {FORMULE.map((f) => (
          <li key={f.id} className={f.consigliato ? "abb-riga abb-riga-consigliata" : "abb-riga"}>
            <div className="abb-nome">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <h3 className="font-disp text-3xl leading-none font-bold tracking-[.02em] uppercase md:text-4xl">
                  {f.consigliato ? <span className="evidenzia">{f.nome}</span> : f.nome}
                </h3>
                {f.consigliato ? <span className="abb-consigliato">Consigliato</span> : null}
              </div>
              <p className="mt-3 max-w-[40ch] text-muted">{f.slogan}</p>
            </div>

            <p className="abb-pasti num text-sm text-muted">{f.pastiSettimana} pasti a settimana</p>

            <p className="abb-prezzo">
              <span className="abb-cifra text-[32px] md:text-[40px]">
                {f.prezzo[fascia]}
                <span className="ml-[.08em]">€</span>
              </span>
              <span className="mt-1 block text-sm text-muted">al mese</span>
            </p>

            <div className="abb-azioni">
              {/* Il modulo riprende la formula e la modalità scelta. */}
              <Link
                href={linkRichiediAbbonamento({ formula: f.id, fascia, ritiro: false })}
                className="btn btn-ink btn-sm"
                aria-label={`Richiedi ${f.nome}, fascia ${NOMI_FASCIA[fascia]}`}
              >
                Richiedi <span aria-hidden="true" className="freccia">→</span>
              </Link>
              <Link href={percorsoFormula(f.id)} className="link" aria-label={`La scheda di ${f.nome}`}>
                La scheda
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
