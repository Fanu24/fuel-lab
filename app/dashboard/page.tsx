"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { STATI, getRepository, type StatoRichiesta } from "@/lib/richieste";
import { kpi, mixAllenamenti, topPiatti } from "@/lib/richieste/statistiche";
import { NOMI_GIORNATA, TIPI_GIORNATA } from "@/lib/settimana";
import { getServizio } from "@/lib/servizi";
import { useRichieste } from "@/components/dashboard/useRichieste";
import StatoBadge from "@/components/dashboard/StatoBadge";

/* La panoramica: quattro numeri, cosa piace, e l'elenco delle richieste con lo
   stato che si cambia sul posto. */

const quando = new Intl.DateTimeFormat("it-IT", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Rome",
});

export default function Panoramica() {
  const { richieste, errore, ricarica } = useRichieste();
  const [filtro, setFiltro] = useState<StatoRichiesta | "tutte">("tutte");

  const numeri = useMemo(() => (richieste ? kpi(richieste, new Date()) : null), [richieste]);
  const top = useMemo(() => (richieste ? topPiatti(richieste, 5) : []), [richieste]);
  const mix = useMemo(() => (richieste ? mixAllenamenti(richieste) : null), [richieste]);

  if (errore) return <p className="bg-lime p-4 font-semibold">{errore}</p>;
  if (!richieste || !numeri || !mix) return <p className="text-muted">Carico le richieste…</p>;

  const visibili = filtro === "tutte" ? richieste : richieste.filter((r) => r.stato === filtro);
  const maxTop = Math.max(1, ...top.map((t) => t.porzioni));
  const totMix = Math.max(1, ...Object.values(mix));

  async function cambia(id: string, s: StatoRichiesta) {
    await getRepository().aggiornaStato(id, s);
    await ricarica();
  }

  return (
    <div className="grid gap-12">
      <div>
        <p className="occhiello">Pannello</p>
        <h1 className="titolo mt-4">Richieste.</h1>
      </div>

      <dl className="grid grid-cols-2 gap-px bg-ink/15 lg:grid-cols-4">
        {[
          { k: "Da contattare", v: String(numeri.daContattare), evid: numeri.daContattare > 0 },
          { k: "Richieste questa settimana", v: String(numeri.richiesteSettimana) },
          { k: "Pasti questa settimana", v: String(numeri.pastiSettimana) },
          { k: "Conversione", v: `${Math.round(numeri.conversione * 100)}%` },
        ].map((x) => (
          <div key={x.k} className={`p-5 md:p-6 ${x.evid ? "bg-lime" : "bg-paper"}`}>
            <dt className="font-disp text-[11px] font-semibold tracking-[.16em] uppercase">{x.k}</dt>
            <dd className="num mt-3 text-4xl md:text-5xl">{x.v}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-10 md:grid-cols-2">
        <section>
          <h2 className="occhiello">I piatti più scelti</h2>
          <ul className="mt-5 grid gap-3">
            {top.map((t) => (
              <li key={t.piattoId}>
                <div className="flex justify-between gap-4 text-sm">
                  <span>{t.nome}</span>
                  <span className="num">{t.porzioni}</span>
                </div>
                <div className="mt-1 h-2 bg-paper-2">
                  <div className="h-full bg-ink" style={{ width: `${(t.porzioni / maxTop) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="occhiello">Come si allenano i clienti</h2>
          <ul className="mt-5 grid gap-3">
            {TIPI_GIORNATA.map((t) => (
              <li key={t}>
                <div className="flex justify-between gap-4 text-sm">
                  <span>{NOMI_GIORNATA[t]}</span>
                  <span className="num">{mix[t]} giorni</span>
                </div>
                <div className="mt-1 h-2 bg-paper-2">
                  <div className={`h-full ${t === "riposo" ? "bg-muted" : "bg-lime"}`} style={{ width: `${(mix[t] / totMix) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="titolo-s">Elenco</h2>
          <div className="segmenti" role="group" aria-label="Filtra per stato">
            {[{ id: "tutte" as const, label: "Tutte" }, ...STATI].map((s) => (
              <button key={s.id} type="button" aria-pressed={filtro === s.id} onClick={() => setFiltro(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <ul className="mt-6 border-t-[3px] border-ink">
          {visibili.map((r) => (
            <li key={r.id} className="grid gap-3 border-b border-ink/15 py-4 md:grid-cols-[1.4fr_1fr_1fr_16rem] md:items-center">
              <div>
                <Link href={`/dashboard/richieste/${r.id}`} className="text-lg font-semibold hover:underline">
                  {r.contatto.nome}
                </Link>
                <p className="text-sm text-muted">
                  {r.contatto.comune} · <span className="num">{r.contatto.telefono}</span>
                </p>
              </div>
              <p className="text-sm">
                {getServizio(r.servizio).nome}
                <span className="block text-muted">
                  <span className="num">{r.pasti}</span> pasti
                </span>
              </p>
              <p className="text-sm text-muted">{quando.format(new Date(r.creataIl))}</p>
              <div className="flex items-center gap-3">
                <StatoBadge stato={r.stato} />
                <label className="sr-only" htmlFor={`st-${r.id}`}>
                  Cambia stato di {r.contatto.nome}
                </label>
                <select
                  id={`st-${r.id}`}
                  value={r.stato}
                  onChange={(e) => void cambia(r.id, e.target.value as StatoRichiesta)}
                  className="min-h-11 border-2 border-ink/15 bg-paper px-2 text-sm"
                >
                  {STATI.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))}
          {visibili.length === 0 ? <li className="py-8 text-muted">Nessuna richiesta in questo stato.</li> : null}
        </ul>
      </section>
    </div>
  );
}
