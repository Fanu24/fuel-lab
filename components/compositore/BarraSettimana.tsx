"use client";

import { CASELLE_TOTALI } from "@/lib/settimana";
import { CONSEGNA_GRATIS_DA, MOSTRA_STIMA_PREZZO, euro } from "@/lib/pricing";
import type { RiepilogoSettimana } from "@/lib/riepilogo";
import { messaggioPiano } from "@/lib/whatsapp";
import type { Allenamenti, Piano } from "@/lib/settimana";
import Link from "next/link";
import { MarchioWhatsApp } from "@/components/ui/WhatsAppCta";
import { linkWhatsApp, numeroConfigurato } from "@/lib/whatsapp";

/** Un cambiamento grosso appena fatto, con la strada per tornare indietro (o un semplice avviso, se non c'e' niente da annullare). */
export type Annullabile = {
  testo: string;
  annulla?: () => void;
  /** per le azioni che cambiano la griglia lontano dallo schermo: porta a vederla */
  vai?: () => void;
  chiudi: () => void;
};

/**
 * La barra in fondo allo schermo: quanti pasti, i macro medi di un giorno,
 * e il bottone per mandare la settimana a Matteo.
 *
 * Il bottone principale porta alla richiesta dall'account: Matteo la ritrova
 * nel pannello con piatti e giorni, e il cliente ne segue lo stato. WhatsApp,
 * quando il numero c'e', resta come scorciatoia accanto.
 *
 * Settimana vuota ma allenamenti gia' scelti: il bottone della barra diventa
 * "Riempi la settimana", perche' sui portatili bassi quello della pagina puo'
 * restare sotto la barra.
 *
 * Sul telefono i macro medi non entrano accanto al bottone: stanno su una riga
 * propria sopra ai pasti. Dopo un cambiamento grosso (riempi, svuota, togli)
 * in cima alla barra compare la riga con "Annulla".
 *
 * Il prezzo: il committente non vuole cifre in chiaro, quindi finche'
 * MOSTRA_STIMA_PREZZO e' spento compare solo la soglia d'ingresso.
 */
export default function BarraSettimana({
  r,
  pronto,
  piano,
  allenamenti,
  onRiempi,
  annulla,
  totale = CASELLE_TOTALI,
}: {
  r: RiepilogoSettimana;
  pronto: boolean;
  piano: Piano;
  allenamenti: Allenamenti;
  onRiempi?: () => void;
  annulla?: Annullabile | null;
  /** il fondo scala dei pasti: con un pasto al giorno sono sette, non quattordici */
  totale?: number;
}) {
  const vuota = !pronto || r.pasti === 0;
  const m = r.macroMediaGiorno;
  const mancanoConsegna = CONSEGNA_GRATIS_DA - r.pasti;
  const suggerimento =
    vuota && onRiempi
      ? "Allenamenti scelti: ora riempi la settimana"
      : vuota
        ? "Scegli come ti alleni per iniziare"
        : mancanoConsegna > 0
          ? `${mancanoConsegna} ${mancanoConsegna === 1 ? "pasto" : "pasti"} alla consegna gratis`
          : "Consegna gratis";

  return (
    <div className="barra notte">
      {/* la regione "status" c'e' sempre, anche vuota: il lettore di schermo annuncia la riga quando compare */}
      <div role="status">
        {annulla ? (
          <div className="barra-annulla">
            <div className="wrap flex flex-wrap items-center gap-x-5 gap-y-1 py-1">
              <p className="min-w-0 flex-1 text-[13px] leading-tight font-semibold">{annulla.testo}</p>
              <div className="flex items-center gap-1">
                {annulla.vai ? (
                  <button type="button" className="barra-annulla-bottone" onClick={annulla.vai}>
                    Guarda
                  </button>
                ) : null}
                {annulla.annulla ? (
                  <button type="button" id="annulla-azione" className="barra-annulla-bottone" onClick={annulla.annulla}>
                    Annulla
                  </button>
                ) : null}
                <button type="button" className="barra-annulla-bottone !min-w-11 !px-0" onClick={annulla.chiudi} aria-label="Chiudi">
                  ×
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="wrap py-3">
        {/* telefono: i macro medi (o l'invito a cominciare) su una riga propria */}
        <p className="num mb-2 text-[12px] text-steel md:hidden">
          {vuota ? (
            <span className="min-[400px]:hidden">{suggerimento}</span>
          ) : (
            <>
              <span className="sr-only">Media al giorno: </span>
              Al giorno {Math.round(m.kcal)} kcal · P {Math.round(m.proteine)} · C {Math.round(m.carboidrati)} · G {Math.round(m.grassi)}
            </>
          )}
        </p>

        <div className="flex items-center gap-4 md:gap-8">
          <p className="shrink-0">
            <span className="num text-2xl md:text-3xl">{pronto ? r.pasti : 0}</span>
            <span className="num text-sm text-steel">/{totale}</span>
            <span className="ml-2 font-disp text-xs font-semibold tracking-[.16em] uppercase">pasti</span>
          </p>

          {!vuota ? (
            <dl className="hidden flex-1 grid-cols-4 gap-4 md:grid" aria-label="Media al giorno">
              {[
                { k: "kcal", lungo: "kcal / giorno", v: m.kcal },
                { k: "Proteine", v: m.proteine, u: "g" },
                { k: "Carbo", v: m.carboidrati, u: "g" },
                { k: "Grassi", v: m.grassi, u: "g" },
              ].map((x) => (
                <div key={x.k}>
                  <dt className="font-disp text-[12px] font-semibold tracking-[.12em] whitespace-nowrap text-steel uppercase">
                    {/* tra 768 e 1024 la colonna e' stretta: "kcal / giorno" arriva solo dove c'e' posto */}
                    {x.lungo ? (
                      <>
                        <span className="lg:hidden">{x.k}</span>
                        <span className="hidden lg:inline">{x.lungo}</span>
                      </>
                    ) : (
                      x.k
                    )}
                  </dt>
                  <dd className="num text-base">
                    {Math.round(x.v)}
                    {x.u ? <span className="text-xs text-steel">{x.u}</span> : null}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          {/* i prezzi e la consegna: dove c'e' posto (tra 768 e 1024 i macro occupano la barra) */}
          <p
            className={`hidden min-w-0 flex-1 text-xs text-steel min-[400px]:block md:flex-none md:text-sm ${vuota ? "" : "md:max-lg:hidden"}`}
          >
            {MOSTRA_STIMA_PREZZO && r.preventivo ? <>Stima {euro(r.preventivo.totale)}</> : <>Da {euro(r.prezzoMinimo)} a pasto</>}
            <span className="block">{suggerimento}</span>
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
            {vuota && onRiempi ? (
              <button
                type="button"
                onClick={onRiempi}
                className="btn btn-lime !min-h-11 !gap-2 !px-3 !text-[12px] sm:!min-h-12 sm:!px-4 sm:!text-xs"
              >
                Riempi la settimana <span aria-hidden="true" className="freccia">→</span>
              </button>
            ) : vuota ? (
              <span
                aria-disabled="true"
                className="btn btn-lime pointer-events-none !min-h-11 !gap-2 !px-3 !text-[12px] opacity-40 sm:!min-h-12 sm:!px-4 sm:!text-xs"
              >
                Invia a Matteo <span aria-hidden="true" className="freccia">→</span>
              </span>
            ) : (
              <Link
                href="/account?sezione=richiesta"
                className="btn btn-lime !min-h-11 !gap-2 !px-3 !text-[12px] sm:!min-h-12 sm:!px-4 sm:!text-xs"
              >
                Invia a Matteo <span aria-hidden="true" className="freccia">→</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
