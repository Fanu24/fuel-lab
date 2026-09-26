"use client";

import type { PointerEvent as PointerEventReact } from "react";
import { GIORNI, NOMI_GIORNO, PASTI, NOMI_GIORNATA, type Allenamenti, type Piano, type Slot as TSlot } from "@/lib/settimana";
import { macroCasella } from "@/lib/settimana";
import Slot from "./Slot";
import type { Presa, Stato } from "./useTrascina";

/* Una sola struttura per tutte le larghezze: sette colonne da lg in su, una
   riga per giorno sotto. La versione precedente aveva due componenti diversi
   (griglia e colonne) montati insieme e nascosti a turno: ogni casella esisteva
   due volte nel DOM, e il fuoco doveva cercare il "gemello visibile". */

const BREVE: Record<string, string> = { pranzo: "Pranzo", cena: "Cena" };

export default function Griglia({
  piano,
  allenamenti,
  pastiAlGiorno,
  stato,
  inizia,
  toccaSlot,
  togli,
  apriExtra,
}: {
  piano: Piano;
  allenamenti: Allenamenti;
  pastiAlGiorno: 1 | 2;
  stato: Stato;
  inizia: (p: Presa) => (e: PointerEventReact) => void;
  toccaSlot: (s: TSlot, piena: boolean) => void;
  togli: (s: TSlot) => void;
  apriExtra: (s: TSlot) => void;
}) {
  // con un pasto al giorno la cena resta visibile solo se qualcuno l'ha gia' riempita
  const pasti = PASTI.filter((m) => pastiAlGiorno === 2 || m === "pranzo" || GIORNI.some((g) => piano[g]?.[m]));

  return (
    <div className="griglia" style={{ ["--pasti" as string]: pasti.length }}>
      {GIORNI.map((g) => {
        const tipo = allenamenti[g];
        const kcal = pasti.reduce((a, m) => a + macroCasella(piano[g]?.[m]).kcal, 0);
        return (
          <section key={g} className="giorno" aria-label={NOMI_GIORNO[g]}>
            <header className="giorno-testa">
              <span className="font-disp text-sm font-bold tracking-[.14em] uppercase">
                <span className="lg:hidden">{NOMI_GIORNO[g]}</span>
                <span className="hidden lg:inline">{NOMI_GIORNO[g].slice(0, 3)}</span>
              </span>
              {tipo ? <span className={`tag tag-${tipo} !h-5 !px-1.5 !text-[9px]`}>{NOMI_GIORNATA[tipo]}</span> : null}
              <span className="num ml-auto text-[11px] text-muted lg:ml-0">{kcal ? `${kcal} kcal` : ""}</span>
            </header>
            <div className="giorno-caselle">
              {pasti.map((m) => (
                <Slot
                  key={m}
                  slot={{ g, m }}
                  etichetta={`${NOMI_GIORNO[g]}, ${BREVE[m].toLowerCase()}`}
                  casella={piano[g]?.[m]}
                  stato={stato}
                  inizia={inizia}
                  toccaSlot={toccaSlot}
                  togli={togli}
                  apriExtra={apriExtra}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
