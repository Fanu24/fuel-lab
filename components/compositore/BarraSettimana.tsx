"use client";

import { CASELLE_TOTALI } from "@/lib/settimana";
import { CONSEGNA_GRATIS_DA, MOSTRA_STIMA_PREZZO, euro } from "@/lib/pricing";
import type { RiepilogoSettimana } from "@/lib/riepilogo";
import { messaggioPiano } from "@/lib/whatsapp";
import type { Allenamenti, Piano } from "@/lib/settimana";
import Link from "next/link";
import { MarchioWhatsApp } from "@/components/ui/WhatsAppCta";
import { linkWhatsApp, numeroConfigurato } from "@/lib/whatsapp";

/**
 * La barra in fondo allo schermo: quanti pasti, i macro medi di un giorno,
 * e il bottone per mandare la settimana a Matteo.
 *
 * Il bottone principale porta alla richiesta dall'account: Matteo la ritrova
 * nel pannello con piatti e giorni, e il cliente ne segue lo stato. WhatsApp,
 * quando il numero c'e', resta come scorciatoia accanto.
 *
 * Il prezzo: il committente non vuole cifre in chiaro, quindi finche'
 * MOSTRA_STIMA_PREZZO e' spento compare solo la soglia d'ingresso.
 */
export default function BarraSettimana({
  r,
  pronto,
  piano,
  allenamenti,
}: {
  r: RiepilogoSettimana;
  pronto: boolean;
  piano: Piano;
  allenamenti: Allenamenti;
}) {
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
              <dt className="font-disp text-[11px] font-semibold tracking-[.12em] text-steel uppercase">{x.k}</dt>
              <dd className="num text-base">
                {vuota ? "–" : Math.round(x.v)}
                {x.u && !vuota ? <span className="text-xs text-steel">{x.u}</span> : null}
              </dd>
            </div>
          ))}
        </dl>

        <p className="hidden min-w-0 flex-1 text-xs text-steel min-[400px]:block md:flex-none md:text-sm">
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

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {numeroConfigurato() && !vuota ? (
            <a
              href={linkWhatsApp(messaggioPiano(piano, r.macroSettimana, undefined, allenamenti)) ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Invia la settimana su WhatsApp"
              title="Invia su WhatsApp"
              className="btn btn-whatsapp !min-h-11 !px-3 sm:!min-h-12"
            >
              <MarchioWhatsApp />
            </a>
          ) : null}
          {vuota ? (
            <span
              aria-disabled="true"
              className="btn btn-lime pointer-events-none !min-h-11 !gap-2 !px-3 !text-[10px] opacity-40 sm:!min-h-12 sm:!px-4 sm:!text-xs"
            >
              Invia a Matteo <span aria-hidden="true" className="freccia">→</span>
            </span>
          ) : (
            <Link
              href="/account?sezione=richiesta"
              className="btn btn-lime !min-h-11 !gap-2 !px-3 !text-[10px] sm:!min-h-12 sm:!px-4 sm:!text-xs"
            >
              Invia a Matteo <span aria-hidden="true" className="freccia">→</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
