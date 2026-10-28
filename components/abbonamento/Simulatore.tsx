"use client";

import Link from "next/link";
import { useId, useState, useRef } from "react";
import {
  FASCE, FORMULA_CONSIGLIATA, FORMULE, NOMI_FASCIA, NOMI_NUCLEO, NUCLEI,
  calcolaPrezzo, etichettaFormula, getFormula,
  linkRichiediAbbonamento, linkScriviAbbonamento, percorsoFormula,
  type Nucleo, type FormulaId,
} from "@/lib/abbonamento";
import { useFascia } from "./FasciaScelta";
import { api } from "@/lib/api";
import { totaleScontato } from "@/lib/sconti";

export default function Simulatore() {
  const id = useId();
  const [formula, setFormula] = useState<FormulaId>(FORMULA_CONSIGLIATA);
  const [fascia, setFascia] = useFascia();
  const [ritiro, setRitiro] = useState(false);
  const [nucleo, setNucleo] = useState<Nucleo>("singolo");
  const [codice, setCodice] = useState("");
  const [sconto, setSconto] = useState<{ code: string; percent: number } | null>(null);
  const [verifica, setVerifica] = useState(false);
  const [errore, setErrore] = useState("");
  const richiesta = useRef(0);
  async function applicaCodice() {
    const n = ++richiesta.current;
    setVerifica(true); setErrore(""); setSconto(null);
    try {
      const risultato = await api.verificaSconto(codice);
      if (n === richiesta.current) { setSconto(risultato); setCodice(risultato.code); }
    } catch (e) { if (n === richiesta.current) setErrore(e instanceof Error ? e.message : "Non riesco a verificare il codice."); }
    finally { if (n === richiesta.current) setVerifica(false); }
  }
  const f = getFormula(formula);
  const prezzo = calcolaPrezzo({ formula, fascia, ritiro, nucleo });
  const totale = (sconto ? totaleScontato(prezzo.listinoCentesimi, sconto.percent)! : prezzo.totaleCentesimi) / 100;
  const totaleTesto = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", minimumFractionDigits: sconto ? 2 : 0 }).format(totale);
  const continua = linkRichiediAbbonamento({ formula, fascia, ritiro, nucleo, codice: sconto?.code });
  const daApplicare = !!codice.trim() && !sconto;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
      <div>
        <fieldset>
          <legend className="titolo-s mb-5">1. Quali pasti ti servono?</legend>
          <div className="grid gap-2">
            {FORMULE.map((opzione) => (
              <label key={opzione.id} className={`relative flex min-h-20 cursor-pointer items-center gap-3 border-2 p-4 transition-colors ${formula === opzione.id ? "border-lime bg-lime text-ink" : "border-steel/40 hover:border-steel"}`}>
                <input type="radio" name={`${id}-formula`} value={opzione.id} checked={formula === opzione.id} onChange={() => setFormula(opzione.id)} className="h-5 w-5 shrink-0 accent-[#121412]" />
                <span className="min-w-0 flex-1">
                  <span className="block font-disp text-xl font-bold uppercase">{opzione.nome}{opzione.consigliato ? <span className="ml-2 text-[11px] font-semibold">Consigliato</span> : null}</span>
                  <span className="mt-1 block text-sm">{opzione.slogan}</span>
                </span>
                <span className="shrink-0 text-right"><strong className="num text-xl">{opzione.prezzo[fascia]} €</strong><span className="block text-xs">al mese</span></span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="abb-gruppo mt-7">
          <legend className="abb-legenda">2. Scegli le porzioni</legend>
          <div className="abb-scelte">
            {FASCE.map((opzione) => <label key={opzione} className="abb-scelta"><input type="radio" name={`${id}-fascia`} value={opzione} checked={fascia === opzione} onChange={() => setFascia(opzione)} /><span>{NOMI_FASCIA[opzione]}</span></label>)}
          </div>
          <p className="mt-3 text-sm text-steel">{fascia === "standard" ? "Le porzioni del tuo piano." : "Porzioni e proteine maggiorate, da concordare con Matteo."}</p>
        </fieldset>
        <fieldset className="abb-gruppo mt-7">
          <legend className="abb-legenda">3. Come ricevi i pasti?</legend>
          <div className="abb-scelte">
            <label className="abb-scelta"><input type="radio" name={`${id}-ritiro`} checked={!ritiro} onChange={() => setRitiro(false)} /><span>Consegna a casa</span></label>
            <label className="abb-scelta"><input type="radio" name={`${id}-ritiro`} checked={ritiro} onChange={() => setRitiro(true)} /><span>Ritiro</span></label>
          </div>
        </fieldset>
        <details className="mt-6 border-t border-steel/30 pt-3">
          <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">Vi abbonate in coppia o in famiglia?</summary>
          <fieldset className="abb-gruppo py-3">
            <legend className="sr-only">Per chi è l’abbonamento</legend>
            <div className="abb-scelte">
              {NUCLEI.map((opzione) => <label key={opzione} className="abb-scelta"><input type="radio" name={`${id}-nucleo`} value={opzione} checked={nucleo === opzione} onChange={() => setNucleo(opzione)} /><span>{NOMI_NUCLEO[opzione]}</span></label>)}
            </div>
            <p className="mt-3 text-sm text-steel">Il prezzo mostrato è per persona.</p>
          </fieldset>
        </details>
      </div>

      <div className="abb-esito smusso lg:sticky lg:top-[calc(var(--nav-h)+20px)]">
        <p className="occhiello">Il tuo abbonamento</p>
        <h2 className="titolo-s mt-4">{etichettaFormula(formula, fascia)}</h2>
        <p className="mt-3 text-steel">{f.cosaRicevi}.</p>
        {formula === "completo" ? <p className="mt-2 text-sm text-steel">Pranzo e cena per 7 giorni; pasto aggiuntivo da concordare.</p> : null}
        <p className="mt-2 text-sm text-steel">{ritiro ? "Ritiro in laboratorio" : "Consegna a casa"}{nucleo !== "singolo" ? ` · ${NOMI_NUCLEO[nucleo].toLowerCase()}` : ""}</p>
        <p role="status" aria-atomic="true" className="mt-6"><span className="abb-cifra text-[clamp(44px,9vw,80px)] text-lime">{totaleTesto}</span><span className="ml-2 text-sm">al mese</span></p>
        {sconto ? <p className="mt-3 text-sm text-steel">Listino {f.prezzo[fascia]} € · codice {sconto.code}: −{sconto.percent}%.</p> : null}
        <div className="mt-6 border-t border-steel/30 pt-5">
          <label htmlFor={`${id}-codice`} className="block text-sm font-semibold">Codice sconto</label>
          <div className="mt-2 flex gap-2">
            <input id={`${id}-codice`} value={codice} maxLength={32} autoCapitalize="characters" autoComplete="off" placeholder="Inserisci il codice" aria-describedby={`${id}-codice-esito`} aria-invalid={errore ? true : undefined} className="min-h-12 min-w-0 flex-1 border border-steel/40 bg-paper px-3 text-base text-ink uppercase" onChange={(e) => { richiesta.current++; setCodice(e.target.value); setSconto(null); setErrore(""); setVerifica(false); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (codice.trim() && !verifica) void applicaCodice(); } }} />
            <button type="button" className="btn btn-lime !min-h-12 !px-4" disabled={verifica || !codice.trim()} onClick={() => void applicaCodice()}>{verifica ? "…" : "Applica"}</button>
          </div>
          <p id={`${id}-codice-esito`} role={errore ? "alert" : "status"} className="mt-2 text-sm text-steel">{errore || (sconto ? `Codice applicato: sconto ${sconto.percent}%.` : "Facoltativo. Se Matteo ti ha dato un codice, inseriscilo qui.")}</p>
          {codice ? <button type="button" className="link mt-2 min-h-11 text-sm" onClick={() => { richiesta.current++; setCodice(""); setSconto(null); setErrore(""); setVerifica(false); }}>Rimuovi codice</button> : null}
        </div>
        <p className="mt-5 text-sm text-steel">Prezzo da confermare con Matteo. La prima settimana è di prova, senza impegno.</p>
        {daApplicare || verifica ? <button type="button" disabled className="btn btn-lime mt-7 w-full justify-between">{verifica ? "Verifico il codice…" : "Applica o rimuovi il codice"}</button> : <Link href={continua} className="btn btn-lime mt-7 w-full justify-between">Continua <span aria-hidden="true">→</span></Link>}
        <p className="mt-3 text-center text-sm text-steel">Accedi o crea l’account. Qui non paghi nulla.</p>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <Link href={linkScriviAbbonamento({ formula, fascia, codice: sconto?.code })} className="link">Chiedi senza account</Link>
          <Link href={percorsoFormula(formula)} className="link">Dettagli della formula</Link>
        </div>
      </div>
    </div>
  );
}
