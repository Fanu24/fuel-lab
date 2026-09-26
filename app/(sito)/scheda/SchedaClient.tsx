"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { getPiatto } from "@/lib/catalogo";
import { TARGET_DEFAULT, VINCOLI_DEFAULT, componiPiano, targetPerPasto, type EsitoPiano } from "@/lib/matcher";
import { GIORNI, NOMI_GIORNO, PASTI, usePiano } from "@/lib/piano";
import type { Target } from "@/lib/types";

/* Dalla scheda del nutrizionista alla settimana.

   La versione precedente simulava il caricamento di un PDF con un'animazione
   di "scansione": il file non veniva letto, i numeri erano di esempio. Era
   teatro, e chi carica la propria scheda si aspetta che venga letta. Adesso
   si scrivono i quattro numeri, che sono sulla prima riga di ogni scheda, e
   il matcher (vero) compone. */

const CAMPI: { k: "kcal" | "proteine" | "carboidrati" | "grassi"; label: string; unita: string; max: number }[] = [
  { k: "kcal", label: "Calorie", unita: "kcal", max: 6000 },
  { k: "proteine", label: "Proteine", unita: "g", max: 400 },
  { k: "carboidrati", label: "Carboidrati", unita: "g", max: 800 },
  { k: "grassi", label: "Grassi", unita: "g", max: 300 },
];

/* Le ripetizioni ammesse per piatto, a turno, per "altre proposte": con sei
   piatti la varieta' si ottiene allentando o stringendo questo vincolo. */
const RIPETIZIONI = [2, 3, 4];

export default function SchedaClient() {
  const router = useRouter();
  const { sostituisciPiano } = usePiano();
  const [target, setTarget] = useState<Target>(TARGET_DEFAULT);
  const [esito, setEsito] = useState<EsitoPiano | null>(null);
  const [giro, setGiro] = useState(0);
  const titoloRisultato = useRef<HTMLHeadingElement>(null);

  function componi(g = 0) {
    setGiro(g);
    setEsito(componiPiano(target, { ...VINCOLI_DEFAULT, maxRipetizioni: RIPETIZIONI[g % RIPETIZIONI.length] }));
    // il risultato compare sotto il modulo: il fuoco ci va, e con lui lo schermo
    requestAnimationFrame(() => titoloRisultato.current?.focus());
  }

  function apriNelCompositore() {
    if (!esito) return;
    sostituisciPiano(esito.piano);
    router.push("/settimana");
  }

  const perPasto = targetPerPasto(target);

  return (
    <section className="pb-[var(--sezione)]">
      <div className="wrap grid gap-16 lg:grid-cols-[1fr_1.3fr]">
        <form
          className="grid content-start gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            componi(0);
          }}
        >
          <p className="occhiello">La tua scheda, al giorno</p>
          <div className="grid grid-cols-2 gap-4">
            {CAMPI.map((c) => (
              <div className="campo" key={c.k}>
                <label htmlFor={`t-${c.k}`}>
                  {c.label} <span className="text-muted">({c.unita})</span>
                </label>
                <input
                  id={`t-${c.k}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={c.max}
                  required
                  value={target[c.k]}
                  onChange={(e) => setTarget({ ...target, [c.k]: Number(e.target.value) })}
                  className="num"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="campo">
              <label htmlFor="t-pasti">Pasti FUEL LAB al giorno</label>
              <select
                id="t-pasti"
                value={target.pastiAlGiorno}
                onChange={(e) => setTarget({ ...target, pastiAlGiorno: Number(e.target.value) })}
              >
                <option value={1}>1 · solo pranzo</option>
                <option value={2}>2 · pranzo e cena</option>
              </select>
            </div>
            <div className="campo">
              <label htmlFor="t-giorni">Giorni</label>
              <select
                id="t-giorni"
                value={target.giorni}
                onChange={(e) => setTarget({ ...target, giorni: Number(e.target.value) })}
              >
                {[3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    {n} giorni
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-sm text-muted">
            A pasto puntiamo a circa <span className="num text-ink">{Math.round(perPasto.kcal)}</span> kcal e{" "}
            <span className="num text-ink">{Math.round(perPasto.proteine)}</span> g di proteine: il resto della
            giornata lo copri tu.
          </p>

          <button type="submit" className="btn btn-ink justify-self-start">
            Componi la settimana <span className="freccia">→</span>
          </button>
        </form>

        <div aria-live="polite">
          {esito ? (
            <div className="border-t-[3px] border-ink pt-6">
              <h2 ref={titoloRisultato} tabIndex={-1} className="titolo-s outline-none">
                {esito.aCentro ? "Ecco la tua settimana. I numeri tornano." : "La più vicina ai tuoi numeri."}
              </h2>
              <ul className="mt-6">
                {GIORNI.filter((g) => esito.piano[g]).map((g) => (
                  <li key={g} className="grid grid-cols-[110px_1fr] gap-4 border-b border-ink/15 py-3">
                    <span className="font-disp text-sm font-semibold tracking-[.14em] uppercase">
                      {NOMI_GIORNO[g]}
                    </span>
                    <span className="grid gap-1">
                      {PASTI.map((m) => {
                        const id = esito.piano[g]?.[m]?.piatto;
                        return id ? <span key={m}>{getPiatto(id)?.nome}</span> : null;
                      })}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="mt-6 grid grid-cols-4 gap-2">
                {CAMPI.map((c) => (
                  <div key={c.k}>
                    <dt className="font-disp text-[11px] font-semibold tracking-[.16em] text-muted uppercase">
                      {c.label}
                    </dt>
                    <dd className="num text-lg">
                      {esito.scarti[c.k] > 0 ? "+" : ""}
                      {Math.round(esito.scarti[c.k])}%
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-sm text-muted">Scarto dal tuo bersaglio sulla settimana.</p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <button type="button" className="btn btn-lime" onClick={apriNelCompositore}>
                  Apri nel compositore <span className="freccia">→</span>
                </button>
                <button type="button" className="link" onClick={() => componi(giro + 1)}>
                  Altre proposte
                </button>
              </div>
            </div>
          ) : (
            <div className="grid min-h-[320px] place-items-center bg-paper-2 p-10 text-center">
              <p className="max-w-[34ch] text-muted">
                Scrivi i numeri della tua scheda: la settimana compare qui. Se non hai una scheda,{" "}
                <Link href="/settimana" className="link text-ink">
                  parti dal tuo allenamento
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
