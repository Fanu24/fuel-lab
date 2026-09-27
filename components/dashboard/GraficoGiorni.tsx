"use client";

/* Un grafico "un valore al giorno", in SVG scritto a mano: colonne per i
   conteggi piccoli (richieste, pasti, iscrizioni), linea con velo per le
   visite. Una serie sola, quindi nessuna legenda: il titolo dice cosa c'e'.

   Regole (dallo skill dataviz): segni sottili (colonne <= 24 px, 2 px di
   carta fra una e l'altra, angoli tondi solo in cima), griglia a filo, un
   solo valore scritto sul grafico (il massimo, o l'ultimo sulla linea), il
   resto nel mirino al passaggio del dito o del mouse, con le frecce da
   tastiera, e sempre nella tabella sotto. Il colore della serie e' #2a78d6,
   validato su carta #fbf9f4 (contrasto >= 3:1). */

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { somma, tacche } from "@/lib/produzione";

export function useLarghezza<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [larghezza, setLarghezza] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const osservatore = new ResizeObserver((voci) => {
      const w = voci[0]?.contentRect.width ?? 0;
      setLarghezza(Math.round(w));
    });
    osservatore.observe(el);
    return () => osservatore.disconnect();
  }, []);
  return [ref, larghezza] as const;
}

export type PuntoGiorno = { giorno: string; valore: number };

const ALTEZZA = 190;
const MARGINE = { alto: 26, destra: 10, basso: 30 };

const numero = (n: number) => new Intl.NumberFormat("it-IT").format(n);

function data(d: string, opzioni: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("it-IT", { ...opzioni, timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`)).replace(".", "");
}

/** Colonna con la cima arrotondata e la base dritta sulla linea dello zero. */
function colonna(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h);
  if (w < 6 || h < 3) return `M${x},${y + h}V${y}H${x + w}V${y + h}Z`;
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/** Quali giorni scrivere sotto l'asse: tutti se sono pochi, altrimenti a passo regolare, primo e ultimo sempre. */
function indiciEtichette(n: number, larghezzaUtile: number) {
  if (n <= 8 && larghezzaUtile / n >= 40) return Array.from({ length: n }, (_, i) => i);
  const quante = Math.max(2, Math.floor(larghezzaUtile / 76));
  const passo = Math.max(1, Math.ceil((n - 1) / (quante - 1)));
  const out: number[] = [];
  for (let i = 0; i < n; i += passo) out.push(i);
  const ultimo = out[out.length - 1];
  if (ultimo !== n - 1) {
    if (n - 1 - ultimo < passo / 2) out[out.length - 1] = n - 1;
    else out.push(n - 1);
  }
  return out;
}

export default function GraficoGiorni({
  titolo,
  sotto,
  dati,
  forma = "colonne",
  unita,
}: {
  titolo: string;
  sotto?: string;
  dati: PuntoGiorno[];
  forma?: "colonne" | "linea";
  /** [singolare, plurale]: "richiesta", "richieste". */
  unita: [string, string];
}) {
  const id = useId();
  const [ref, larghezza] = useLarghezza<HTMLDivElement>();
  const [attivo, setAttivo] = useState<number | null>(null);

  const n = dati.length;
  const totale = somma(dati, (d) => d.valore);
  const massimo = Math.max(0, ...dati.map((d) => d.valore));
  const iMassimo = dati.findIndex((d) => d.valore === massimo);
  const assi = tacche(massimo);
  const cima = assi[assi.length - 1];
  const sinistra = Math.max(26, numero(cima).length * 8 + 12);
  // Sulla linea l'ultimo valore sta a destra del punto finale: gli serve spazio.
  const destra = forma === "linea" ? Math.max(24, numero(dati[n - 1]?.valore ?? 0).length * 8 + 14) : MARGINE.destra;
  const larghezzaUtile = Math.max(0, larghezza - sinistra - destra);
  const altezzaUtile = ALTEZZA - MARGINE.alto - MARGINE.basso;
  const banda = n ? larghezzaUtile / n : 0;
  const base = MARGINE.alto + altezzaUtile;
  const x = (i: number) => sinistra + banda * i + banda / 2;
  const y = (v: number) => base - (v / cima) * altezzaUtile;
  const conUnita = (v: number) => `${numero(v)} ${v === 1 ? unita[0] : unita[1]}`;
  const lungo = (d: string) => data(d, { weekday: "long", day: "numeric", month: "long" });
  const corto = (d: string) => (n <= 8 ? data(d, { weekday: "short", day: "numeric" }) : data(d, { day: "numeric", month: "short" }));

  const primo = dati[0]?.giorno;
  const ultimoGiorno = dati[n - 1]?.giorno;
  const riassunto =
    n && primo && ultimoGiorno
      ? `Dal ${lungo(primo)} al ${lungo(ultimoGiorno)}: ${conUnita(totale)} in tutto` +
        (massimo > 0 ? `, il giorno con più ${unita[1]} è ${lungo(dati[iMassimo].giorno)} con ${numero(massimo)}.` : ".")
      : "Nessun dato.";

  function daPuntatore(e: PointerEvent<SVGSVGElement>) {
    if (!n || banda <= 0) return;
    const rett = e.currentTarget.getBoundingClientRect();
    const i = Math.floor((e.clientX - rett.left - sinistra) / banda);
    setAttivo(Math.min(n - 1, Math.max(0, i)));
  }

  function daTastiera(e: KeyboardEvent<HTMLDivElement>) {
    if (!n) return;
    const ora = attivo ?? n - 1;
    const vai =
      e.key === "ArrowRight" ? Math.min(n - 1, ora + 1)
      : e.key === "ArrowLeft" ? Math.max(0, ora - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? n - 1
      : e.key === "Escape" ? null
      : undefined;
    if (vai === undefined) return;
    e.preventDefault();
    setAttivo(vai);
  }

  const puntoAttivo = attivo !== null ? dati[attivo] : null;
  const percorsoLinea = dati.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.valore)}`).join("");
  const etichette = larghezza ? indiciEtichette(n, larghezzaUtile) : [];
  const larghezzaColonna = Math.max(1, Math.min(24, banda - 2));

  return (
    <figure className="gr" aria-labelledby={`${id}-t`}>
      <figcaption className="gr-testa">
        <h3 id={`${id}-t`} className="gr-titolo">
          {titolo}
        </h3>
        <p className="gr-totale">
          <span className="num">{numero(totale)}</span> in tutto
          {sotto ? <span className="gr-sotto"> · {sotto}</span> : null}
        </p>
      </figcaption>

      <div
        ref={ref}
        className="gr-area"
        tabIndex={n ? 0 : -1}
        role="group"
        aria-label={`${titolo}. Usa le frecce sinistra e destra per leggere i giorni.`}
        onKeyDown={daTastiera}
        onFocus={() => setAttivo((a) => a ?? (n ? n - 1 : null))}
        onBlur={() => setAttivo(null)}
      >
        {larghezza > 0 ? (
          <svg
            width={larghezza}
            height={ALTEZZA}
            viewBox={`0 0 ${larghezza} ${ALTEZZA}`}
            role="img"
            aria-labelledby={`${id}-st ${id}-sd`}
            className="gr-svg"
            onPointerMove={daPuntatore}
            onPointerDown={daPuntatore}
            onPointerLeave={(e) => {
              if (e.pointerType === "mouse") setAttivo(null);
            }}
          >
            <title id={`${id}-st`}>{titolo}</title>
            <desc id={`${id}-sd`}>{riassunto}</desc>

            {assi.map((t) => (
              <g key={t}>
                <line x1={sinistra} x2={larghezza - destra} y1={y(t)} y2={y(t)} className={t === 0 ? "gr-base" : "gr-griglia"} />
                <text x={sinistra - 8} y={y(t)} dy="0.32em" textAnchor="end" className="gr-tacca">
                  {numero(t)}
                </text>
              </g>
            ))}

            {forma === "colonne"
              ? dati.map((d, i) => {
                  if (d.valore <= 0) return null;
                  const h = base - y(d.valore);
                  return (
                    <path
                      key={d.giorno}
                      d={colonna(x(i) - larghezzaColonna / 2, y(d.valore), larghezzaColonna, h)}
                      className={attivo === i ? "gr-segno gr-segno-attivo" : "gr-segno"}
                    />
                  );
                })
              : n ? (
                  <>
                    <path d={`${percorsoLinea}L${x(n - 1)},${base}L${x(0)},${base}Z`} className="gr-velo" />
                    <path d={percorsoLinea} className="gr-linea" />
                    <circle cx={x(n - 1)} cy={y(dati[n - 1].valore)} r={4} className="gr-punto" />
                  </>
                ) : null}

            {/* Un solo valore scritto: il massimo sulle colonne, l'ultimo sulla linea. */}
            {forma === "colonne" && massimo > 0 && attivo === null ? (
              <text
                x={Math.min(Math.max(x(iMassimo), sinistra + 12), larghezza - destra - 12)}
                y={y(massimo) - 8}
                textAnchor="middle"
                className="gr-valore"
              >
                {numero(massimo)}
              </text>
            ) : null}
            {forma === "linea" && n && attivo === null ? (
              <text x={x(n - 1) + 8} y={y(dati[n - 1].valore)} dy="0.32em" textAnchor="start" className="gr-valore">
                {numero(dati[n - 1].valore)}
              </text>
            ) : null}

            {totale === 0 ? (
              <text x={sinistra + larghezzaUtile / 2} y={MARGINE.alto + altezzaUtile / 2} textAnchor="middle" className="gr-vuoto">
                Nessun dato in questo periodo
              </text>
            ) : null}

            {etichette.map((i) => (
              <text
                key={dati[i].giorno}
                x={i === 0 ? sinistra : i === n - 1 ? larghezza - destra : x(i)}
                y={ALTEZZA - 8}
                textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
                className="gr-tacca"
              >
                {corto(dati[i].giorno)}
              </text>
            ))}

            {puntoAttivo && attivo !== null ? (
              <g className="gr-mirino" aria-hidden="true">
                <line x1={x(attivo)} x2={x(attivo)} y1={MARGINE.alto - 6} y2={base} />
                {forma === "linea" ? <circle cx={x(attivo)} cy={y(puntoAttivo.valore)} r={5} className="gr-punto" /> : null}
              </g>
            ) : null}
          </svg>
        ) : (
          <div style={{ height: ALTEZZA }} />
        )}

        {puntoAttivo && attivo !== null && larghezza > 0 ? (
          <div
            className="gr-suggerimento"
            style={{ left: Math.min(Math.max(x(attivo), 70), larghezza - 70) }}
            aria-hidden="true"
          >
            <strong className="num">{numero(puntoAttivo.valore)}</strong>
            <span>{data(puntoAttivo.giorno, { weekday: "short", day: "numeric", month: "short" })}</span>
          </div>
        ) : null}
        <p className="sr-only" aria-live="polite">
          {puntoAttivo ? `${lungo(puntoAttivo.giorno)}: ${conUnita(puntoAttivo.valore)}` : ""}
        </p>
      </div>

      <details className="gr-dati">
        <summary>Vedi i numeri giorno per giorno</summary>
        <div className="gr-tabella-scorri">
          <table className="gr-tabella">
            <caption className="sr-only">{titolo}, giorno per giorno</caption>
            <thead>
              <tr>
                <th scope="col">Giorno</th>
                <th scope="col" className="text-right">
                  {unita[1].charAt(0).toUpperCase() + unita[1].slice(1)}
                </th>
              </tr>
            </thead>
            <tbody>
              {[...dati].reverse().map((d) => (
                <tr key={d.giorno}>
                  <th scope="row">{data(d.giorno, { weekday: "short", day: "numeric", month: "short" })}</th>
                  <td className="num text-right">{numero(d.valore)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
