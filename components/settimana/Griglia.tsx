"use client";

import { Fragment } from "react";
import { MacroSplit } from "@/components/MacroBar";
import { usePiano } from "@/lib/piano";
import { GIORNI, NOMI_GIORNO, PASTI } from "@/lib/settimana";
import CasellaBottone, { NOMI_PASTO } from "./CasellaBottone";
import type { ApriCasella, CasellaAperta } from "./CasellaBottone";

/* =========================================================================
   La griglia: sette colonne per due righe, da lg in su.

   E' la vista che rende la settimana una scheda di allenamento invece di un
   carrello: i giorni stanno uno accanto all'altro e sotto ogni colonna ci sono
   i macro DI QUEL GIORNO, cosi si vede a colpo d'occhio quale giornata e'
   scarica e quale e' carica. Un elenco di quattordici righe direbbe le stesse
   cose e non farebbe vedere nessuna di queste.

   L'interruttore sta a lg e non a md perche' la larghezza di colonna e' l'unica
   misura che conta: a 768px le sette colonne fanno 77,7px l'una, e sotto i 100px
   una griglia settimanale non si legge - i nomi dei piatti vanno a capo quattro
   volte e la riga dei macro sotto e' illeggibile a qualunque corpo. A 1024px la
   colonna vale 107px, a 1280 ne vale 140: da li' in poi la griglia funziona.

   Sotto lg questo componente non esiste: non si comprime e non scorre di lato,
   sparisce e al suo posto va ColonnaGiorno. Vedi il commento la' dentro.
   ========================================================================= */

export default function Griglia({
  apri,
  aperta,
}: {
  apri: ApriCasella;
  aperta: CasellaAperta | null;
}) {
  const { casella, macroGiorno } = usePiano();

  return (
    <div className="shell hidden lg:block">
      <div className="core p-4 xl:p-6">
        {/* Una sola griglia CSS per intestazioni, caselle e macro: le colonne
            restano allineate perche' sono le stesse, non tre griglie diverse
            che si somigliano. */}
        <div className="grid grid-cols-[54px_repeat(7,minmax(0,1fr))] gap-1.5 xl:grid-cols-[76px_repeat(7,minmax(0,1fr))] xl:gap-2">
          <span aria-hidden="true" />
          {/* Nome per esteso e basta: l'abbreviazione serviva alla fascia stretta,
              che adesso non vede piu' la griglia. "MERCOLEDI", il piu' lungo, misura
              ~72px a 10.5px di Martian Mono stretto, e la colonna piu' stretta in cui
              questa griglia esiste ne vale 107. */}
          {GIORNI.map((g) => (
            <span key={g} className="dayhead">
              {NOMI_GIORNO[g]}
            </span>
          ))}

          {PASTI.map((m) => (
            <Fragment key={m}>
              <span className="rowlab">{NOMI_PASTO[m]}</span>
              {GIORNI.map((g) => (
                <CasellaBottone
                  key={g}
                  giorno={g}
                  pasto={m}
                  casella={casella(g, m)}
                  variante="griglia"
                  aperta={aperta?.giorno === g && aperta?.pasto === m}
                  onApri={apri}
                />
              ))}
            </Fragment>
          ))}

          {/* I macro del giorno, sulla stessa colonna delle sue due caselle. */}
          <span className="rowlab mt-2 border-t pt-3" style={{ borderColor: "var(--hair-soft)" }}>
            Giorno
          </span>
          {GIORNI.map((g) => {
            const macro = macroGiorno(g);
            return (
              <div
                key={g}
                className="mt-2 border-t px-1 pt-3"
                style={{ borderColor: "var(--hair-soft)" }}
              >
                <p className="mono text-[12px] leading-none font-bold">
                  {Math.round(macro.kcal)}
                  <span className="font-medium text-muted"> kcal</span>
                </p>
                <MacroSplit
                  className="mt-2"
                  proteine={macro.proteine}
                  carboidrati={macro.carboidrati}
                  grassi={macro.grassi}
                />
                <p className="mono mt-2 text-[12px] leading-none font-medium text-muted">
                  P{macro.proteine} C{macro.carboidrati} G{macro.grassi}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
