"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  FASCE,
  FORMULA_CONSIGLIATA,
  FORMULE,
  NOMI_FASCIA,
  NOMI_NUCLEO,
  NUCLEI,
  SCONTI,
  SCONTO_NUCLEO,
  calcolaPrezzo,
  etichettaFormula,
  euroInteri,
  getFormula,
  linkRichiediAbbonamento,
  linkScriviAbbonamento,
  percorsoFormula,
  type Fascia,
  type FormulaId,
  type Nucleo,
} from "@/lib/abbonamento";
import { useFascia } from "./FasciaScelta";
import { CIRCA_A_PASTO, MENO, giorniCopertiAParole, motivoSconto, percentuale } from "./righe";

/* Il simulatore di prezzo: formula, fascia, ritiro o consegna, da solo o in
   compagnia. Tutto il conto lo fa calcolaPrezzo (lib/abbonamento.ts): qui si
   scelgono i quattro valori e si mostra il risultato. E' una stima, e lo dice:
   il prezzo finale lo conferma Matteo. */

type Opzione<T extends string> = { valore: T; etichetta: string; nota?: string };

/* Radio veri dentro un fieldset: la tastiera (frecce), il gruppo e lo stato
   scelto sono quelli del browser, lo stile sta in app/styles/abbonamento.css. */
function GruppoScelte<T extends string>({
  legenda,
  nome,
  opzioni,
  valore,
  onCambia,
}: {
  legenda: string;
  nome: string;
  opzioni: Opzione<T>[];
  valore: T;
  onCambia: (v: T) => void;
}) {
  return (
    <fieldset className="abb-gruppo">
      <legend className="abb-legenda">{legenda}</legend>
      <div className="abb-scelte">
        {opzioni.map((o) => (
          <label key={o.valore} className="abb-scelta">
            <input type="radio" name={nome} value={o.valore} checked={valore === o.valore} onChange={() => onCambia(o.valore)} />
            <span>
              {o.etichetta}
              {o.nota ? <small>{o.nota}</small> : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const OPZIONI_FORMULA: Opzione<FormulaId>[] = FORMULE.map((f) => ({ valore: f.id, etichetta: f.nome, nota: f.consigliato ? "Consigliato" : undefined }));
const OPZIONI_FASCIA: Opzione<Fascia>[] = FASCE.map((f) => ({ valore: f, etichetta: NOMI_FASCIA[f] }));
const OPZIONI_NUCLEO: Opzione<Nucleo>[] = NUCLEI.map((n) => ({
  valore: n,
  etichetta: NOMI_NUCLEO[n],
  nota: SCONTO_NUCLEO[n] ? percentuale(SCONTO_NUCLEO[n]) : undefined,
}));
const OPZIONI_RITIRO: Opzione<"consegna" | "ritiro">[] = [
  { valore: "consegna", etichetta: "Consegna a casa" },
  { valore: "ritiro", etichetta: "Ritiro in laboratorio", nota: percentuale(SCONTI.ritiro) },
];

export default function Simulatore() {
  const id = useId();
  const [formula, setFormula] = useState<FormulaId>(FORMULA_CONSIGLIATA);
  const [fascia, setFascia] = useFascia();
  const [modo, setModo] = useState<"consegna" | "ritiro">("consegna");
  const [nucleo, setNucleo] = useState<Nucleo>("singolo");

  const ritiro = modo === "ritiro";
  const f = getFormula(formula);
  const prezzo = calcolaPrezzo({ formula, fascia, ritiro, nucleo });
  const listino = prezzo.listinoCentesimi / 100;
  const totale = prezzo.totaleCentesimi / 100;
  const sconto = listino - totale;

  return (
    <div>
      <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div className="grid gap-8">
          <GruppoScelte legenda="Formula" nome={`${id}-formula`} opzioni={OPZIONI_FORMULA} valore={formula} onCambia={setFormula} />
          <GruppoScelte legenda="Fascia" nome={`${id}-fascia`} opzioni={OPZIONI_FASCIA} valore={fascia} onCambia={setFascia} />
          <GruppoScelte legenda="Come li ricevi" nome={`${id}-modo`} opzioni={OPZIONI_RITIRO} valore={modo} onCambia={setModo} />
          <GruppoScelte legenda="Per chi" nome={`${id}-nucleo`} opzioni={OPZIONI_NUCLEO} valore={nucleo} onCambia={setNucleo} />
        </div>

        <div className="abb-esito smusso">
          {/* A ogni scelta lo screen reader sente solo il risultato: se la regione viva fosse l'intero riquadro
              leggerebbe anche i bottoni e i link. */}
          <p className="sr-only" role="status">
            {f.nome}, fascia {NOMI_FASCIA[fascia]}: {totale} € al mese. {motivoSconto(prezzo.scontoPercento, ritiro, nucleo)}.
          </p>
          <p className="occhiello">La tua stima</p>
          <p className="mt-5 font-disp text-xl font-semibold tracking-[.06em] uppercase">{etichettaFormula(formula, fascia)}</p>
          <p className="mt-1 text-steel">{f.cosaRicevi}</p>
          <p className="text-steel">{giorniCopertiAParole(f)}.</p>

          <p className="mt-6 flex flex-wrap items-end gap-x-4 gap-y-2">
            <span className="abb-cifra text-[clamp(56px,10vw,96px)] text-lime">
              {totale}
              <span className="ml-[.08em]">€</span>
            </span>
            <span className="font-disp text-lg font-semibold tracking-[.12em] uppercase">al mese</span>
          </p>

          <dl className="abb-conto mt-6">
            <dt>Listino {NOMI_FASCIA[fascia]}</dt>
            <dd className="num">{euroInteri(listino)}</dd>
            <dt>{motivoSconto(prezzo.scontoPercento, ritiro, nucleo)}</dt>
            <dd className="num">{sconto > 0 ? `${MENO}${euroInteri(sconto)}` : euroInteri(0)}</dd>
          </dl>

          <div className="mt-6 grid gap-2 text-sm text-steel">
            {fascia === "standard" ? <p>Il listino Standard viene a {CIRCA_A_PASTO}.</p> : null}
            <p>La stima applica lo sconto più alto fra quelli che ti spettano. Il prezzo finale lo conferma Matteo.</p>
            {nucleo !== "singolo" ? (
              <p>Se vi abbonate insieme, indicalo nella richiesta: Matteo conferma lo sconto.</p>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              href={linkRichiediAbbonamento({ formula, fascia, ritiro, nucleo })}
              className="btn btn-lime w-full justify-between whitespace-normal py-3 text-left sm:w-auto sm:min-w-[300px]"
            >
              <span>Richiedi {etichettaFormula(formula, fascia)}</span>
              <span aria-hidden="true" className="freccia">→</span>
            </Link>
            <Link href={percorsoFormula(formula)} className="link">
              La scheda del {f.nome}
            </Link>
            <Link href={linkScriviAbbonamento({ formula, fascia })} className="link">
              Scrivi a Matteo
            </Link>
          </div>
          <p className="mt-5 text-sm text-steel">La prima settimana è di prova, senza impegno.</p>
        </div>
      </div>

      {/* Sul telefono il risultato sta sotto le scelte: questa barra lo tiene in vista mentre si sceglie.
          E' solo un ripetitore (aria-hidden): a leggerlo con lo screen reader ci pensa il riquadro sopra. */}
      <p
        aria-hidden="true"
        className="sticky bottom-3 mt-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 bg-lime px-4 py-3 text-ink shadow-[0_8px_24px_rgb(0_0_0/0.5)] lg:hidden"
      >
        <span className="font-disp text-sm font-bold tracking-[.06em] uppercase">{etichettaFormula(formula, fascia)}</span>
        <span className="abb-cifra shrink-0 whitespace-nowrap text-2xl">
          {totale}
          <span className="ml-[.08em]">€</span>
          <span className="ml-1 font-disp text-xs font-semibold tracking-[.1em] uppercase">al mese</span>
        </span>
      </p>
    </div>
  );
}
