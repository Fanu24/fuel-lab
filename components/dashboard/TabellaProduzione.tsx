"use client";

import { useMemo } from "react";
import { produzione } from "@/lib/richieste/statistiche";
import { useRichieste } from "./useRichieste";

/* Cosa cucinare: porzioni per piatto, divise per giorno di cottura, dalle
   richieste ancora aperte. E' il foglio che Matteo attacca al frigo, quindi si
   stampa pulito (la testata sparisce con print:hidden). */

const GIORNI_COTTURA = [
  { id: "lunedi", label: "Lunedì" },
  { id: "giovedi", label: "Giovedì" },
] as const;

export default function TabellaProduzione() {
  const { richieste, errore } = useRichieste();
  const p = useMemo(() => (richieste ? produzione(richieste) : null), [richieste]);

  if (errore) return <p className="bg-lime p-4 font-semibold">{errore}</p>;
  if (!p) return <p className="text-muted">Carico…</p>;

  return (
    <div className="grid gap-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="occhiello">Pannello</p>
          <h1 className="titolo mt-4">Produzione.</h1>
          <p className="mt-3 max-w-[56ch] text-muted">
            Porzioni da preparare per le richieste nuove e contattate. Le chiuse sono già servite, le perse non
            contano.
          </p>
        </div>
        <button type="button" className="btn btn-ink btn-sm print:hidden" onClick={() => window.print()}>
          Stampa
        </button>
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        {GIORNI_COTTURA.map((g) => {
          const righe = p[g.id];
          const tot = righe.reduce((a, r) => a + r.porzioni, 0);
          return (
            <section key={g.id}>
              <div className="flex items-baseline justify-between border-b-[3px] border-ink pb-3">
                <h2 className="titolo-s">{g.label}</h2>
                <p className="num text-sm">{tot} porzioni</p>
              </div>
              {righe.length ? (
                <ul>
                  {righe.map((r) => (
                    <li key={r.piattoId} className="flex items-baseline justify-between gap-4 border-b border-ink/15 py-3">
                      <span>{r.nome}</span>
                      <span className="num text-2xl">{r.porzioni}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-muted">Niente da cucinare.</p>
              )}
            </section>
          );
        })}
      </div>

      {p.extra.length ? (
        <section>
          <h2 className="occhiello">Aggiunte da preparare</h2>
          <ul className="mt-4 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
            {p.extra.map((e) => (
              <li key={e.extraId} className="flex justify-between gap-4 border-b border-ink/15 py-2.5 text-sm">
                <span>{e.nome}</span>
                <span className="num">{e.porzioni}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
