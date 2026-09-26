"use client";

import Link from "next/link";
import { CASELLE_TOTALI } from "@/lib/settimana";
import { CONSEGNA_GRATIS_DA, MOSTRA_STIMA_PREZZO, euro } from "@/lib/pricing";
import type { RiepilogoSettimana } from "@/lib/riepilogo";

/**
 * La barra in fondo allo schermo: quanti pasti, i macro medi di un giorno,
 * e il bottone per mandare la settimana a Matteo.
 *
 * Il prezzo: il committente non vuole cifre in chiaro, quindi finche'
 * MOSTRA_STIMA_PREZZO e' spento compare solo la soglia d'ingresso.
 */
export default function BarraSettimana({ r, pronto }: { r: RiepilogoSettimana; pronto: boolean }) {
  const vuota = !pronto || r.pasti === 0;
  const m = r.macroMediaGiorno;
  const mancanoConsegna = CONSEGNA_GRATIS_DA - r.pasti;

  return (
    <div className="barra notte">
      <div className="wrap flex items-center gap-4 py-3 md:gap-8">
        <p className="shrink-0">
          <span className="num text-2xl md:text-3xl">{pronto ? r.pasti : 0}</span>
          <span className="num text-sm text-steel">/{CASELLE_TOTALI}</span>
          <span className="ml-2 hidden font-disp text-xs font-semibold tracking-[.16em] uppercase sm:inline">pasti</span>
        </p>

        <dl className="hidden flex-1 grid-cols-4 gap-4 md:grid">
          {[
            { k: "kcal / giorno", v: m.kcal },
            { k: "Proteine", v: m.proteine, u: "g" },
            { k: "Carbo", v: m.carboidrati, u: "g" },
            { k: "Grassi", v: m.grassi, u: "g" },
          ].map((x) => (
            <div key={x.k}>
              <dt className="font-disp text-[10px] font-semibold tracking-[.16em] text-steel uppercase">{x.k}</dt>
              <dd className="num text-base">
                {vuota ? "–" : Math.round(x.v)}
                {x.u && !vuota ? <span className="text-xs text-steel">{x.u}</span> : null}
              </dd>
            </div>
          ))}
        </dl>

        <p className="min-w-0 flex-1 text-xs text-steel md:flex-none md:text-sm">
          {MOSTRA_STIMA_PREZZO && r.preventivo ? (
            <>Stima {euro(r.preventivo.totale)}</>
          ) : (
            <>Da {euro(r.prezzoMinimo)} a pasto</>
          )}
          <span className="block">
            {vuota
              ? "Scegli come ti alleni per iniziare"
              : mancanoConsegna > 0
                ? `${mancanoConsegna} ${mancanoConsegna === 1 ? "pasto" : "pasti"} alla consegna gratis`
                : "Consegna gratis"}
          </span>
        </p>

        <Link
          href="/richiesta?servizio=menu-settimana"
          className={`btn btn-lime shrink-0 ${vuota ? "pointer-events-none opacity-40" : ""}`}
          aria-disabled={vuota}
          tabIndex={vuota ? -1 : undefined}
        >
          <span className="hidden sm:inline">Invia a Matteo</span>
          <span className="sm:hidden">Invia</span>
          <span className="freccia">→</span>
        </Link>
      </div>
    </div>
  );
}
