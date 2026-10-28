"use client";

import Link from "next/link";
import { useState } from "react";
import { GIORNI, PASTI, NOMI_GIORNO, usePiano } from "@/lib/piano";

export default function AggiungiSnack({ snackId }: { snackId: string }) {
  const { piano, pronto, alternaExtra } = usePiano();
  const [selezione, setSelezione] = useState("");
  const pasti = GIORNI.flatMap((g) => PASTI.map((m) => ({ g, m, c: piano[g]?.[m], id: `${g}.${m}` }))).filter((p) => p.c?.piatto);
  const scelto = pasti.find((p) => p.id === selezione) ?? pasti[0];
  const aggiunto = scelto?.c?.extra.includes(snackId);

  if (!pronto) return <p className="mt-5 text-sm text-muted">Caricamento della settimana…</p>;
  if (!scelto) return <Link href="/settimana" className="btn btn-ink mt-5">Scegli un pasto e aggiungi lo snack <span aria-hidden="true">→</span></Link>;

  return <div className="mt-5 grid gap-3">
    <label className="grid gap-2 text-sm font-semibold">
      A quale pasto lo aggiungiamo?
      <select className="min-h-12 w-full border border-ink/25 bg-paper px-3 text-base font-normal" value={scelto.id} onChange={(e) => setSelezione(e.target.value)}>
        {pasti.map((p) => <option key={p.id} value={p.id}>{NOMI_GIORNO[p.g]} · {p.m}</option>)}
      </select>
    </label>
    <button type="button" className={`btn ${aggiunto ? "btn-linea" : "btn-ink"} w-full`} onClick={() => alternaExtra(scelto.g, scelto.m, snackId)}>{aggiunto ? "Rimuovi i biscotti" : "Aggiungi i biscotti"}</button>
    <p role="status" className="text-sm">{aggiunto ? <>Aggiunti a {NOMI_GIORNO[scelto.g].toLowerCase()}, {scelto.m}. </> : null}<Link href="/settimana" className="link">Vedi la settimana</Link></p>
  </div>;
}
