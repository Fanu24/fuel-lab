"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getPiatto, getExtra } from "@/lib/catalogo";
import { riempiSettimana, sostituisciEsclusi } from "@/lib/autofill";
import { caselleEscluse } from "@/lib/impostazioni";
import { GIORNI, NOMI_GIORNO, PASTI, usePiano, type GiornoSettimana, type Piano, type Slot } from "@/lib/piano";
import { riepilogoSettimana } from "@/lib/riepilogo";
import { useLinkCondiviso } from "@/components/compositore/useLinkCondiviso";
import PianificaAllenamenti from "@/components/compositore/PianificaAllenamenti";
import FoglioExtra from "@/components/compositore/FoglioExtra";
import SceltaPiatto from "@/components/compositore/SceltaPiatto";
import BarraSettimana from "@/components/compositore/BarraSettimana";
import AvvisoLink from "@/components/compositore/AvvisoLink";
import { usePiattiNonDisponibili } from "@/components/impostazioni/useImpostazioni";

export default function SettimanaClient() {
  const p = usePiano();
  const { piano, allenamenti, pronto, pasti } = p;
  const [giorno, setGiorno] = useState<GiornoSettimana>("lun");
  const [scelta, setScelta] = useState<Slot | null>(null);
  const [extraDi, setExtraDi] = useState<Slot | null>(null);
  const [pastiAlGiorno, setPastiAlGiorno] = useState<1 | 2>(2);
  const [annuncio, setAnnuncio] = useState("");
  const [precedente, setPrecedente] = useState<{ piano: Piano; testo: string } | null>(null);
  const link = useLinkCondiviso();
  const esclusi = usePiattiNonDisponibili();
  const r = useMemo(() => riepilogoSettimana(piano), [piano]);
  const fuori = useMemo(() => pronto ? caselleEscluse(piano, esclusi) : [], [pronto, piano, esclusi]);

  useEffect(() => {
    if (!precedente) return;
    const timer = window.setTimeout(() => setPrecedente(null), 12000);
    return () => window.clearTimeout(timer);
  }, [precedente]);

  function ricorda(testo: string) { setPrecedente({ piano, testo }); }
  function togli(slot: Slot) {
    ricorda(`Tolto il ${slot.m} di ${NOMI_GIORNO[slot.g].toLowerCase()}.`);
    p.svuotaCasella(slot.g, slot.m);
  }
  function scegli(id: string) {
    if (!scelta || esclusi.includes(id)) return;
    ricorda(`${NOMI_GIORNO[scelta.g]}, ${scelta.m}: piatto salvato.`);
    p.metti(scelta.g, scelta.m, id);
    setScelta(null);
  }
  function proponi() {
    const proposta = riempiSettimana(piano, allenamenti, { pastiAlGiorno, sovrascrivi: false, esclusi });
    ricorda("Proposta aggiunta. I piatti già scelti sono rimasti al loro posto.");
    p.riempi(proposta);
  }
  async function copiaLink() {
    const esito = await link.copia();
    setAnnuncio(esito === "si" ? "Link copiato." : "Copia il link qui sotto.");
  }

  return <>
    <AvvisoLink link={link} />
    <section className="pb-40">
      <div className="wrap max-w-[980px]">
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-ink/15 pb-5">
          <p className="text-sm text-muted">Puoi scegliere anche un solo pasto.</p>
          <Link href="/abbonamento" className="link shrink-0 text-sm">Vedi abbonamenti</Link>
        </div>
        {fuori.length ? <div role="status" className="mb-5 border-l-4 border-ink bg-paper-2 p-4">
          <p className="font-semibold">{fuori.length === 1 ? "Un piatto non è disponibile." : `${fuori.length} piatti non sono disponibili.`}</p>
          <p className="mt-1 text-sm">{fuori.map((c) => `${getPiatto(c.piattoId)?.nome ?? "Piatto"} (${NOMI_GIORNO[c.g]}, ${c.m})`).join("; ")}</p>
          <button type="button" className="btn btn-ink btn-sm mt-3" onClick={() => { ricorda("Piatti non disponibili sostituiti."); p.riempi(sostituisciEsclusi(piano, allenamenti, esclusi)); }}>Sostituisci con piatti disponibili</button>
        </div> : null}
        <h2 className="font-disp text-lg font-bold uppercase">1. Scegli il giorno</h2>
        <div className="mt-3 grid grid-cols-7 gap-1" role="group" aria-label="Giorno della settimana">
          {GIORNI.map((g) => {
            const numero = PASTI.filter((m) => piano[g]?.[m]).length;
            return <button key={g} type="button" aria-pressed={giorno === g} aria-label={`${NOMI_GIORNO[g]}${numero ? `, ${numero} ${numero === 1 ? "pasto" : "pasti"}` : ""}`} onClick={() => setGiorno(g)} className={`min-h-16 min-w-0 border-2 px-0.5 py-2 text-center text-sm font-semibold ${giorno === g ? "border-ink bg-ink text-paper" : "border-ink/15 hover:border-ink"}`}>
              <span className="block">{NOMI_GIORNO[g].slice(0, 3)}</span><span className="mt-1 block text-xs">{numero ? `${numero} ✓` : "—"}</span>
            </button>;
          })}
        </div>
        <div className="mt-7 flex items-baseline justify-between gap-3"><h2 className="font-disp text-lg font-bold uppercase">2. Aggiungi i piatti</h2><p className="text-sm font-semibold">{NOMI_GIORNO[giorno]}</p></div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {PASTI.map((m) => {
            const casella = piano[giorno]?.[m];
            const piatto = casella?.piatto ? getPiatto(casella.piatto) : undefined;
            const nonDisponibile = !!piatto && esclusi.includes(piatto.id);
            return <article key={`${giorno}-${m}`} className="border-2 border-ink/15 p-4">
              <h3 className="font-disp text-xl font-bold uppercase">{m === "pranzo" ? "Pranzo" : "Cena"}</h3>
              {piatto ? <>
                <div className="mt-4 flex items-start gap-3"><span className="relative block h-20 w-20 shrink-0 overflow-hidden bg-paper-2"><Image src={piatto.img} alt="" fill sizes="80px" className="object-cover" /></span><div className="min-w-0"><p className="font-semibold leading-snug">{piatto.nome}</p>{nonDisponibile ? <p className="mt-2 text-sm font-semibold">Non disponibile: scegli un altro piatto.</p> : null}</div></div>
              </> : <p className="mt-4 text-sm text-muted">{casella?.extra.length ? "Solo aggiunte. Puoi aggiungere un piatto." : "Nessun piatto scelto."}</p>}
              {casella?.extra.length ? <p className="mt-3 text-sm text-muted">Aggiunte: {casella.extra.map((id) => getExtra(id)?.nome).filter(Boolean).join(", ")}.</p> : null}
              <button type="button" className="btn btn-ink mt-4 w-full" disabled={!pronto} onClick={() => setScelta({ g: giorno, m })}>{piatto ? "Cambia piatto" : "+ Scegli il piatto"}</button>
              {casella ? <div className="mt-2 flex items-center justify-between gap-3">
                <button type="button" className="link min-h-11 text-sm" onClick={() => { setPrecedente(null); setExtraDi({ g: giorno, m }); }}>Aggiunte</button>
                <button type="button" className="link min-h-11 text-sm" onClick={() => togli({ g: giorno, m })} aria-label={`Togli ${m} di ${NOMI_GIORNO[giorno]}`}>Togli</button>
              </div> : null}
            </article>;
          })}
        </div>
        <p className="mt-4 text-sm text-muted">Le scelte si salvano automaticamente su questo dispositivo.</p>

        {pasti > 0 ? <details className="mt-7 border-y border-ink/20 py-2" open>
          <summary className="min-h-11 cursor-pointer py-3 font-semibold">La tua settimana · {pasti} {pasti === 1 ? "pasto" : "pasti"}</summary>
          <ul className="divide-y divide-ink/10">
            {GIORNI.flatMap((g) => PASTI.filter((m) => piano[g]?.[m]).map((m) => <li key={`${g}-${m}`} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="text-xs text-muted">{NOMI_GIORNO[g]} · {m}</p><p className="mt-1 text-sm font-semibold">{getPiatto(piano[g]?.[m]?.piatto ?? "")?.nome ?? "Aggiunte"}</p></div><button type="button" className="link min-h-11 shrink-0 text-sm" aria-label={`Modifica ${m} di ${NOMI_GIORNO[g]}`} onClick={() => { setGiorno(g); setScelta({ g, m }); }}>Modifica</button></li>))}
          </ul>
        </details> : null}

        <details className="mt-6 border-b border-ink/20 pb-2">
          <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">Altre opzioni</summary>
          <div className="py-4">
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <button type="button" className="link min-h-11 text-sm" onClick={copiaLink} disabled={!pasti}>{link.copiato === "si" ? "Link copiato" : "Copia il link della settimana"}</button>
              <button type="button" className="link min-h-11 text-sm" disabled={!pasti} onClick={() => { if (window.confirm("Vuoi togliere tutti i pasti della settimana?")) { ricorda("Settimana svuotata."); p.svuota(); } }}>Svuota la settimana</button>
            </div>
            {link.copiato === "manuale" ? <input readOnly value={link.url} aria-label="Link della settimana" className="mt-3 min-h-11 w-full border border-ink/20 p-3 text-sm" onFocus={(e) => e.target.select()} /> : null}
            <details className="mt-5 border-t border-ink/15 pt-2">
              <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">Proposte in base agli allenamenti</summary>
              <div className="py-4">
                <PianificaAllenamenti allenamenti={allenamenti} imposta={p.impostaAllenamento} applica={p.sostituisciAllenamenti} pastiAlGiorno={pastiAlGiorno} setPastiAlGiorno={setPastiAlGiorno} />
                <button type="button" className="btn btn-ink mt-5" onClick={proponi} disabled={!pronto || !Object.keys(allenamenti).length}>Riempi i pasti vuoti</button>
                <p className="mt-3 text-sm text-muted">È un aiuto alla scelta, non un piano nutrizionale personalizzato.</p>
              </div>
            </details>
          </div>
        </details>
      </div>
    </section>
    <BarraSettimana r={r} pronto={pronto} bloccata={fuori.length > 0} annulla={precedente ? { testo: precedente.testo, annulla: () => { p.sostituisciPiano(precedente.piano); setPrecedente(null); }, chiudi: () => setPrecedente(null) } : null} />
    <SceltaPiatto slot={scelta} esclusi={esclusi} scegli={scegli} chiudi={() => setScelta(null)} />
    <FoglioExtra slot={extraDi} chiudi={() => setExtraDi(null)} />
    <p className="sr-only" aria-live="polite">{annuncio}</p>
  </>;
}

