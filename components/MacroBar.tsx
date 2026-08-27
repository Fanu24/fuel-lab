"use client";

import { useEffect, useRef } from "react";
import { MAX_MACRO } from "@/lib/catalogo";
import type { Elemento } from "@/lib/catalogo";

/**
 * Barra macro con TACCA DEL TARGET.
 *
 * La tacca e' il punto: senza, una barra piena all'88% e una al 99% sembrano
 * entrambe "piena" e il pannello smette di raccontare lo scarto dal piano,
 * diventando un punteggio. Con la tacca, "178 / 180 g" si legge a colpo d'occhio
 * come "quasi in target" invece che come "fatto".
 *
 * Scala: il fondo della barra vale il 120% del target, cosi la tacca cade
 * sempre allo stesso posto (83.3%) su tutte le righe e disegna una verticale
 * continua che attraversa il pannello. Chi sfora resta dentro la barra fino a
 * +20%, e oltre viene bloccato al fondo con il riempimento che vira al bianco.
 */

const SCALA = 1.2;
const POS_TACCA = (100 / SCALA).toFixed(4); // 83.3333%

export function MacroBar({
  etichetta,
  valore,
  target,
  unita = "g",
}: {
  etichetta: string;
  valore: number;
  target: number;
  unita?: string;
}) {
  const quota = target > 0 ? valore / target : 0;
  const riempimento = Math.max(0, Math.min(1, quota / SCALA));
  const oltre = quota > 1.02;

  return (
    <div className="mb-6 last:mb-0">
      <div className="mb-[11px] flex items-baseline justify-between gap-3">
        <span className="bar-l">{etichetta}</span>
        <span className="bar-v">
          <b>{Math.round(valore)}</b> / {Math.round(target)} {unita}
        </span>
      </div>
      <div
        className={`bar-track ${oltre ? "over" : ""}`}
        role="meter"
        aria-valuenow={Math.round(valore)}
        aria-valuemin={0}
        aria-valuemax={Math.round(target)}
        aria-label={`${etichetta}: ${Math.round(valore)} di ${Math.round(target)} ${unita}`}
      >
        <i style={{ ["--fx" as string]: riempimento }} />
        <span className="bar-tick" style={{ left: `${POS_TACCA}%` }} aria-hidden="true" />
      </div>
    </div>
  );
}

/**
 * Barra proporzionale P/C/G del singolo piatto.
 * Innesto dalla direzione "Freschezza Clinica": su una pagina da decine di piatti la
 * stringa "P 52 / C 68 / G 12" non si screma a colpo d'occhio, la forma si.
 */
export function MacroSplit({
  proteine,
  carboidrati,
  grassi,
  className = "",
}: {
  proteine: number;
  carboidrati: number;
  grassi: number;
  className?: string;
}) {
  // Peso calorico, non peso in grammi: 12 g di grassi rendono piu di 12 g di carboidrati
  // e la barra deve raccontare da dove arrivano le calorie.
  const p = proteine * 4;
  const c = carboidrati * 4;
  const g = grassi * 9;
  const tot = p + c + g || 1;
  return (
    <div
      className={`macrobar ${className}`}
      title={`Proteine ${proteine} g · Carboidrati ${carboidrati} g · Grassi ${grassi} g`}
    >
      <i style={{ flex: p / tot }} />
      <i style={{ flex: c / tot }} />
      <i style={{ flex: g / tot }} />
    </div>
  );
}

const RIGHE = [
  { k: "proteine", l: "Proteine" },
  { k: "carboidrati", l: "Carboidrati" },
  { k: "grassi", l: "Grassi" },
] as const;

/**
 * Le tre barre macro dell'elemento (primo o secondo), a SCALA COMUNE con tutto
 * il catalogo: il fondo di ogni barra e' MAX_MACRO per quel macro, non il
 * valore dell'elemento stesso. E' il dettaglio che rende le barre utili -
 * altrimenti un primo da 8 g di proteine e un secondo da 46 avrebbero la
 * stessa barra piena, ed e esattamente il confronto che l'utente deve poter
 * fare a colpo d'occhio fra un primo e un secondo.
 *
 * Si riempiono quando la scheda entra nel viewport, sfalsate di ~90ms a riga
 * (tramite la variabile CSS --bd gia' letta da .bar-track > i in globals.css).
 * L'osservatore si stacca al primo scatto: senza, la barra ri-anima a ogni
 * passaggio di scroll, ed e' la cosa piu' fastidiosa da guardare. Senza
 * IntersectionObserver le barre vanno subito al valore finale, invece di
 * restare bloccate a zero per sempre.
 *
 * Niente stato React per la visibilita': accendere una barra e' sincronizzare
 * il DOM con un sistema esterno (lo scroll), cioe' il lavoro di un effetto, e
 * chiamare setState dentro un effetto sincrono innescherebbe un render a
 * cascata (stessa ragione per cui Nav chiude il pannello mobile con onClick e
 * non con un effetto sul pathname). Il valore-bersaglio di ogni barra viaggia
 * in un data-attribute e l'effetto lo scrive sulla custom property al momento
 * giusto, esattamente come fa components/Reveal.tsx con la classe "in".
 */
export function MacroAnimate({ elemento }: { elemento: Elemento }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return;

    const accendi = () => {
      nodo.querySelectorAll<HTMLElement>("[data-fx]").forEach((barra) => {
        barra.style.setProperty("--fx", barra.dataset.fx ?? "0");
      });
    };

    if (typeof IntersectionObserver === "undefined") {
      accendi();
      return;
    }
    const osservatore = new IntersectionObserver(
      ([voce]) => {
        if (voce.isIntersecting) {
          accendi();
          osservatore.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    osservatore.observe(nodo);
    return () => osservatore.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {RIGHE.map((r, i) => {
        const valore = elemento[r.k];
        const massimo = MAX_MACRO[r.k];
        const quota = massimo > 0 ? Math.min(1, valore / massimo) : 0;
        return (
          <div key={r.k} className="mb-3 last:mb-0">
            <div className="mb-[6px] flex items-baseline justify-between gap-3">
              <span className="bar-l">{r.l}</span>
              <span className="bar-v">
                <b>{valore}</b> g
              </span>
            </div>
            <div
              className="bar-track"
              role="meter"
              aria-valuenow={valore}
              aria-valuemin={0}
              aria-valuemax={Math.round(massimo)}
              aria-label={`${r.l}: ${valore} g, su un massimo di catalogo di ${Math.round(massimo)} g`}
            >
              {/* --fx parte non impostata: .bar-track > i in globals.css ripiega su
                  var(--fx, 0), quindi la barra e' piatta finche' l'effetto sopra non
                  scrive il valore vero letto da data-fx. */}
              <i data-fx={quota} style={{ ["--bd" as string]: `${i * 90}ms` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
