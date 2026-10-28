import Link from "next/link";
import Reveal from "@/components/Reveal";
import {
  FORMULE,
  NOMI_FASCIA,
  NOTE_FASCIA,
  PREZZO_DA,
  getFormula,
  linkRichiediAbbonamento,
  linkScriviAbbonamento,
  type FormulaId,
} from "@/lib/abbonamento";
import { CIRCA_A_PASTO, CIRCA_A_PASTO_FRASE, PASTI_SETTIMANA_MAX, PASTI_SETTIMANA_MIN, ZONA_A_PAROLE } from "./righe";

/* I riquadri di notte col prezzo: e' la prima cosa da leggere, e il lime come
   testo e' legale solo sulla notte (vedi app/styles/tokens.css). */

const RIGA = { borderColor: "var(--line)" } as const;

/** La cifra grande: niente spazio prima del "€", nel carattere monospaziato diventerebbe una casella vuota. */
function Cifra({ euro, className = "" }: { euro: number; className?: string }) {
  return (
    <span className={`abb-cifra text-lime ${className}`}>
      {euro}
      <span className="ml-[.08em]">€</span>
    </span>
  );
}

/** Nella scheda di una formula: il prezzo Standard grande, "circa 8 € a pasto" e la fascia Plus. */
export function RiquadroPrezzi({ formula, delay = 0 }: { formula: FormulaId; delay?: number }) {
  const f = getFormula(formula);
  return (
    <Reveal delay={delay} className="notte smusso p-7 md:p-10">
      <p className="occhiello">Il prezzo</p>
      <p className="mt-6 font-disp text-sm font-semibold tracking-[.16em] uppercase">{NOMI_FASCIA.standard}</p>
      <p className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-2">
        <Cifra euro={f.prezzo.standard} className="text-[clamp(64px,9vw,112px)]" />
        <span className="font-disp text-lg font-semibold tracking-[.12em] uppercase">al mese</span>
      </p>
      <p className="mt-4 text-steel">
        {CIRCA_A_PASTO_FRASE} {NOTE_FASCIA.standard}
      </p>
      <p className="mt-6 border-t pt-6" style={RIGA}>
        Fascia <strong className="font-semibold">Plus</strong> a{" "}
        <strong className="font-semibold text-lime">{f.prezzo.plus} € al mese</strong>, con porzioni e proteine
        maggiorate per chi si allena.
      </p>
      {/* Il prezzo qui sopra e' il listino: il modulo si apre sulla consegna a casa, che e' il listino senza sconti. */}
      <Link
        href={linkRichiediAbbonamento({ formula, ritiro: false })}
        className="btn btn-lime mt-8 w-full justify-between whitespace-normal py-3 text-left"
      >
        <span>Richiedi l&apos;abbonamento</span>
        <span aria-hidden="true" className="freccia">→</span>
      </Link>
      <p className="mt-5 text-sm text-steel">
        Nessun pagamento online: inizio, consegna o ritiro e pagamento si concordano con Matteo.{" "}
        <Link href={linkScriviAbbonamento({ formula })} className="link text-paper">
          Oppure scrivi a Matteo, senza account.
        </Link>
      </p>
    </Reveal>
  );
}

/** In cima alla pagina degli abbonamenti: "da 173 €" e le tre cose che valgono per tutti. */
export function RiquadroDa({ delay = 0 }: { delay?: number }) {
  const piuLeggera = FORMULE.find((f) => f.prezzo.standard === PREZZO_DA);
  return (
    <Reveal delay={delay} className="notte smusso p-7 md:p-10">
      <p className="occhiello">I prezzi</p>
      <p className="mt-6 flex flex-wrap items-end gap-x-4 gap-y-2">
        <span className="font-disp text-lg font-semibold tracking-[.12em] uppercase">Da</span>
        <Cifra euro={PREZZO_DA} className="text-[clamp(64px,9vw,112px)]" />
        <span className="font-disp text-lg font-semibold tracking-[.12em] uppercase">al mese</span>
      </p>
      {piuLeggera ? (
        <p className="mt-4 text-steel">
          {piuLeggera.nome} in fascia Standard, {CIRCA_A_PASTO}.
        </p>
      ) : null}
      <ul className="mt-8 grid gap-3 border-t pt-6" style={RIGA}>
        {[
          `Cinque formule, da ${PASTI_SETTIMANA_MIN} a ${PASTI_SETTIMANA_MAX} pasti a settimana, in Standard o Plus`,
          `Consegna o ritiro, con giorno e orario concordati. ${ZONA_A_PAROLE}`,
        ].map((voce) => (
          <li key={voce} className="flex gap-3">
            <span aria-hidden="true" className="mt-2.5 h-2 w-2 shrink-0 bg-lime" />
            <span>{voce}</span>
          </li>
        ))}
      </ul>
      <Link
        href={linkRichiediAbbonamento()}
        className="btn btn-lime mt-8 w-full justify-between whitespace-normal py-3 text-left"
      >
        <span>Richiedi l&apos;abbonamento</span>
        <span aria-hidden="true" className="freccia">→</span>
      </Link>
      <p className="mt-5 text-sm text-steel">
        Nessun pagamento online: inizio, consegna o ritiro e pagamento si concordano con Matteo.{" "}
        <Link href={linkScriviAbbonamento()} className="link text-paper">
          Oppure scrivi a Matteo, senza account.
        </Link>
      </p>
    </Reveal>
  );
}
