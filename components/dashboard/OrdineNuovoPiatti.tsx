"use client";

/* "Nuovo ordine a mano": i piatti.

   In alto il modo rapido per chi ordina "cinque noodles": piatto, quante
   porzioni, da che giorno, e le caselle libere si riempiono in ordine (pranzo
   poi cena, giorno dopo giorno). Sotto la griglia vera, sette giorni per
   pranzo e cena, con una select nativa per casella: sul telefono apre il
   selettore di sistema, che e' il piu' veloce da usare con il pollice. */

import { useState } from "react";
import type { Servizio } from "@/lib/api";
import { getPiatto, PIATTI } from "@/lib/catalogo";
import { plurale } from "@/lib/operazioni";
import { giornoSettimanaDi, piattiScelti, riempiCaselle, type ErroriNuovoOrdine } from "@/lib/ordine-manuale";
import { CASELLE_TOTALI, conCasella, GIORNI, NOMI_GIORNO, PASTI, type GiornoSettimana, type Piano } from "@/lib/settimana";
import { Campo } from "./OrdineNuovoParti";

const NOMI_PASTO = { pranzo: "Pranzo", cena: "Cena" } as const;

export default function OrdineNuovoPiatti({
  piano,
  onPiano,
  servizio,
  porzioni,
  onPorzioni,
  uscita,
  errori,
}: {
  piano: Piano;
  onPiano: (piano: Piano) => void;
  servizio: Servizio;
  porzioni: string;
  onPorzioni: (testo: string) => void;
  /** Il giorno di ritiro o consegna: da li' parte il riempimento rapido, finche' Matteo non sceglie un altro giorno. */
  uscita: string;
  errori: ErroriNuovoOrdine;
}) {
  const [rapidoPiatto, setRapidoPiatto] = useState("");
  const [rapidoQuanti, setRapidoQuanti] = useState("5");
  const [rapidoDa, setRapidoDa] = useState<GiornoSettimana | "">("");
  const [esito, setEsito] = useState<{ testo: string; errore?: boolean } | null>(null);

  const scelti = piattiScelti(piano);
  const liberi = CASELLE_TOTALI - scelti;
  const da: GiornoSettimana = rapidoDa || giornoSettimanaDi(uscita) || "lun";
  const homeCooking = servizio === "home-cooking";
  const erroreGriglia = errori.piatti ? "nuovo-piatti-errore" : undefined;

  function riempi() {
    const quanti = Number(rapidoQuanti);
    if (!rapidoPiatto) {
      setEsito({ testo: "Scegli prima il piatto.", errore: true });
      document.getElementById("nuovo-rapido-piatto")?.focus();
      return;
    }
    if (!Number.isInteger(quanti) || quanti < 1 || quanti > CASELLE_TOTALI) {
      setEsito({ testo: `Scrivi quante porzioni, da 1 a ${CASELLE_TOTALI}.`, errore: true });
      document.getElementById("nuovo-rapido-quanti")?.focus();
      return;
    }
    const { piano: nuovo, messe } = riempiCaselle(piano, rapidoPiatto, quanti, da);
    if (!messe) {
      setEsito({ testo: "Tutte le caselle sono già piene: svuotane qualcuna o cambia i piatti nella griglia.", errore: true });
      return;
    }
    onPiano(nuovo);
    const nome = getPiatto(rapidoPiatto)?.nome ?? "piatto";
    setEsito({
      testo:
        messe < quanti
          ? `C’erano solo ${plurale(messe, "casella libera", "caselle libere")}: ho messo ${plurale(messe, "porzione", "porzioni")} di ${nome}.`
          : `Fatto: ${plurale(messe, "porzione", "porzioni")} di ${nome} da ${NOMI_GIORNO[da].toLowerCase()}.`,
    });
  }

  function svuota() {
    if (scelti > 2 && !window.confirm(`Togliere tutti i ${scelti} piatti dalla griglia?`)) return;
    onPiano({});
    setEsito({ testo: "Griglia svuotata." });
  }

  function cambiaCasella(g: GiornoSettimana, m: (typeof PASTI)[number], piatto: string) {
    onPiano(conCasella(piano, g, m, piatto ? { piatto, extra: piano[g]?.[m]?.extra ?? [] } : undefined));
    setEsito(null);
  }

  return (
    <section aria-labelledby="nuovo-piatti" className="grid gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id="nuovo-piatti" className="pn-h3 mb-0">Piatti</h3>
        <p className="text-[15px] font-bold">
          <span className="num">{scelti}</span> di {CASELLE_TOTALI} caselle piene
        </p>
      </div>
      <p className="pn-aiuto -mt-2">
        {homeCooking
          ? "Home cooking: i piatti sono facoltativi. Se ne scegli, arrivano anche nel foglio cucina."
          : "Una casella è una porzione: arriva così nel foglio cucina, nella spesa e nelle etichette."}
      </p>

      {homeCooking ? (
        <Campo
          id="nuovo-porzioni"
          etichetta="Porzioni concordate"
          errore={errori.porzioni}
          aiuto="Facoltativo. Se scegli piatti nella griglia, conta il numero più alto."
          className="max-w-xs"
        >
          {(aria) => (
            <input {...aria} type="text" inputMode="numeric" autoComplete="off" placeholder="0" value={porzioni} onChange={(e) => onPorzioni(e.target.value)} />
          )}
        </Campo>
      ) : null}

      <fieldset className="pn-carta min-w-0 gap-3 p-4">
        <legend className="sr-only">Stesso piatto per più porzioni</legend>
        <p className="text-[16px] font-bold" aria-hidden="true">Stesso piatto per più porzioni</p>
        <Campo id="nuovo-rapido-piatto" etichetta="Piatto">
          {(aria) => (
            <select {...aria} className="w-full min-w-0" value={rapidoPiatto} onChange={(e) => { setRapidoPiatto(e.target.value); setEsito(null); }}>
              <option value="">Scegli il piatto…</option>
              {PIATTI.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          )}
        </Campo>
        <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3">
          <Campo id="nuovo-rapido-quanti" etichetta="Porzioni">
            {(aria) => (
              <input
                {...aria}
                className="w-full min-w-0"
                type="number"
                inputMode="numeric"
                min={1}
                max={CASELLE_TOTALI}
                value={rapidoQuanti}
                onChange={(e) => { setRapidoQuanti(e.target.value); setEsito(null); }}
                onKeyDown={(e) => {
                  // Invio qui riempie la griglia, non invia tutto l'ordine.
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  riempi();
                }}
              />
            )}
          </Campo>
          <Campo id="nuovo-rapido-da" etichetta="Da">
            {(aria) => (
              <select {...aria} className="w-full min-w-0" value={da} onChange={(e) => { setRapidoDa(e.target.value as GiornoSettimana); setEsito(null); }}>
                {GIORNI.map((g) => (
                  <option key={g} value={g}>{NOMI_GIORNO[g]}</option>
                ))}
              </select>
            )}
          </Campo>
        </div>
        <button type="button" className="pn-tasto pn-tasto-lime w-full sm:w-auto sm:justify-self-start" onClick={riempi} disabled={!liberi}>
          {liberi ? "Riempi le caselle libere" : "Griglia piena"}
        </button>
        <p role="status" aria-live="polite" className={esito?.errore ? "pn-errore-campo" : "text-[15px] font-semibold"}>
          {esito?.testo ?? ""}
        </p>
      </fieldset>

      {errori.piatti ? <p id="nuovo-piatti-errore" className="pn-errore-campo">{errori.piatti}</p> : null}

      <ul className="grid" aria-label="Piatti giorno per giorno">
        {GIORNI.map((g) => (
          <li key={g} className="grid gap-2 border-t border-ink/15 py-3">
            <p className="text-[16px] font-bold" aria-hidden="true">{NOMI_GIORNO[g]}</p>
            <div className="grid grid-cols-2 gap-2">
              {PASTI.map((m) => {
                const id = `nuovo-${g}-${m}`;
                const valore = piano[g]?.[m]?.piatto ?? "";
                return (
                  <div key={m} className="campo min-w-0">
                    <label htmlFor={id}>
                      <span className="sr-only">{NOMI_GIORNO[g]}, </span>
                      {NOMI_PASTO[m]}
                    </label>
                    <select
                      id={id}
                      value={valore}
                      onChange={(e) => cambiaCasella(g, m, e.target.value)}
                      className={`w-full min-w-0 px-3 text-[15px] ${valore ? "border-ink bg-white font-semibold" : ""}`}
                      aria-invalid={errori.piatti ? true : undefined}
                      aria-describedby={erroreGriglia}
                    >
                      <option value="">Nessun piatto</option>
                      {PIATTI.map((p) => (
                        <option key={p.id} value={p.id}>{p.nome}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ul>

      {scelti ? (
        <button type="button" className="pn-tasto pn-tasto-piatto min-h-11 justify-self-start px-1" onClick={svuota}>
          Svuota tutte le caselle
        </button>
      ) : null}
    </section>
  );
}
