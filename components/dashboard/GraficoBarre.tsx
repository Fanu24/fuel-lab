"use client";

/* Barre orizzontali per confrontare quantita' fra voci con un nome (stati
   degli ordini, piatti). Una serie sola: tutte le barre dello stesso colore,
   niente colore per "chi e' piu' grande" (lo dice gia' la lunghezza). Nome
   sopra la barra, cosi' anche i nomi lunghi dei piatti stanno su un telefono
   da 360 px; il valore e' sempre scritto alla punta, quindi non serve un
   suggerimento al passaggio e l'elenco stesso e' la tabella dei dati. */

import { useId, type ReactNode } from "react";
import { useLarghezza } from "./GraficoGiorni";

export type Barra = { chiave: string; etichetta: ReactNode; valore: number };

const SPESSORE = 16;
const RISERVA_VALORE = 56;

const numero = (n: number) => new Intl.NumberFormat("it-IT").format(n);

/** Barra con la punta arrotondata a destra e la base dritta a sinistra. */
function barra(w: number, h: number) {
  const r = Math.min(4, w / 2, h / 2);
  if (w < 6) return `M0,0H${w}V${h}H0Z`;
  return `M0,0H${w - r}Q${w},0 ${w},${r}V${h - r}Q${w},${h} ${w - r},${h}H0Z`;
}

export default function GraficoBarre({
  titolo,
  sotto,
  dati,
  unita,
  vuoto = "Nessun dato in questo periodo.",
}: {
  titolo: string;
  sotto?: string;
  dati: Barra[];
  unita: [string, string];
  vuoto?: string;
}) {
  const id = useId();
  // La misura sta sulla figura, che c'e' sempre: l'elenco compare e sparisce con i dati.
  const [ref, larghezza] = useLarghezza<HTMLElement>();
  const massimo = Math.max(0, ...dati.map((d) => d.valore));
  const pista = Math.max(0, larghezza - RISERVA_VALORE);

  return (
    <figure ref={ref} className="gr" aria-labelledby={`${id}-t`}>
      <figcaption className="gr-testa">
        <h3 id={`${id}-t`} className="gr-titolo">
          {titolo}
        </h3>
        {sotto ? <p className="gr-totale gr-sotto">{sotto}</p> : null}
      </figcaption>
      {dati.length && massimo > 0 ? (
        <ul className="gr-barre">
          {dati.map((d) => {
            const w = massimo ? (d.valore / massimo) * pista : 0;
            return (
              <li key={d.chiave} className="gr-barra">
                <span className="gr-barra-nome">{d.etichetta}</span>
                <span className="gr-barra-riga">
                  {w > 0 && larghezza > 0 ? (
                    <svg width={Math.max(1, w)} height={SPESSORE} className="gr-barra-svg" aria-hidden="true" focusable="false">
                      <path d={barra(Math.max(1, w), SPESSORE)} className="gr-segno" />
                    </svg>
                  ) : null}
                  <span className="gr-barra-valore num">
                    {numero(d.valore)}
                    <span className="sr-only"> {d.valore === 1 ? unita[0] : unita[1]}</span>
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="pn-vuoto">{vuoto}</p>
      )}
    </figure>
  );
}
