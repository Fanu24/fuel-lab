"use client";

import { useEffect, useRef, useState } from "react";
import { MacroBar } from "@/components/MacroBar";
import { TARGET_DEFAULT } from "@/lib/matcher";
import Contatore from "./Contatore";
import stili from "./home.module.css";

/**
 * Il pannello di esempio del teaser: tre barre e il totale della giornata.
 *
 * I numeri non sono inventati due volte: i target sono quelli di TARGET_DEFAULT,
 * la stessa scheda che il configuratore vero usa come punto di partenza. Cosi la
 * home mostra esattamente il pannello che l'utente ritrova in /scheda.
 *
 * Il riempimento non e' governato da React ma da un attributo: le barre restano
 * a zero finche data-acceso="no", poi la transizione di globals.css fa il resto.
 */

const ESEMPIO = [
  { etichetta: "Proteine", valore: 178, target: TARGET_DEFAULT.proteine },
  { etichetta: "Carboidrati", valore: 241, target: TARGET_DEFAULT.carboidrati },
  { etichetta: "Grassi", valore: 61, target: TARGET_DEFAULT.grassi },
];

export default function PannelloMacro() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [acceso, setAcceso] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setAcceso(true); // senza osservatore le barre si mostrano piene invece di restare vuote
      return;
    }
    const io = new IntersectionObserver(
      (voci) => {
        for (const v of voci) {
          if (v.isIntersecting) {
            setAcceso(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.25, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} data-acceso={acceso ? "si" : "no"} className={`shell ${stili.pannello}`}>
      <div className="core p-[26px] sm:p-[30px]">
        <p className="note mb-7">Esempio &middot; 2 pasti al giorno, 5 giorni</p>

        <div className={stili.barre}>
          {ESEMPIO.map((r) => (
            <MacroBar key={r.etichetta} etichetta={r.etichetta} valore={r.valore} target={r.target} />
          ))}
        </div>

        <div
          className="mt-[30px] flex flex-wrap items-end justify-between gap-4 border-t pt-[26px]"
          style={{ borderColor: "var(--hair-soft)" }}
        >
          <span className="bar-l pb-1">Totale scheda</span>
          <p className="font-disp text-[clamp(46px,11vw,62px)] leading-[.8] text-lime">
            <Contatore a={TARGET_DEFAULT.kcal} separatore />
            <span className="note ml-[9px] align-baseline">kcal</span>
          </p>
        </div>
      </div>
    </div>
  );
}
