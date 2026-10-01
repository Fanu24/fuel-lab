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

type Chiave = "kcal" | "proteine" | "carboidrati" | "grassi";

/* I minimi servono a una cosa: un bersaglio a zero (o quasi) non e' una scheda, e il
   matcher lo leggerebbe come "qualunque piatto va bene". I valori veri li decide il
   nutrizionista: qui si scarta solo cio' che non puo' essere una giornata di cibo. */
const CAMPI: { k: Chiave; label: string; unita: string; min: number; max: number }[] = [
  { k: "kcal", label: "Calorie", unita: "kcal", min: 800, max: 6000 },
  { k: "proteine", label: "Proteine", unita: "g", min: 20, max: 400 },
  { k: "carboidrati", label: "Carboidrati", unita: "g", min: 0, max: 800 },
  { k: "grassi", label: "Grassi", unita: "g", min: 10, max: 300 },
];

/* Le ripetizioni ammesse per piatto, a turno, per "altre proposte": con sei
   piatti la varieta' si ottiene allentando o stringendo questo vincolo. */
const RIPETIZIONI = [2, 3, 4];

export default function SchedaClient() {
  const router = useRouter();
  const { sostituisciPiano, pasti } = usePiano();
  /* I campi tengono il testo, non il numero: con un numero, svuotare il campo lo
     riportava a "0" e il nuovo valore si scriveva dopo ("02500"). */
  const [testi, setTesti] = useState<Record<Chiave, string>>({
    kcal: String(TARGET_DEFAULT.kcal),
    proteine: String(TARGET_DEFAULT.proteine),
    carboidrati: String(TARGET_DEFAULT.carboidrati),
    grassi: String(TARGET_DEFAULT.grassi),
  });
  const [pastiAlGiorno, setPastiAlGiorno] = useState(TARGET_DEFAULT.pastiAlGiorno);
  const [giorni, setGiorni] = useState(TARGET_DEFAULT.giorni);
  const [esito, setEsito] = useState<{ risultato: EsitoPiano; con: string } | null>(null);
  const [giro, setGiro] = useState(0);
  const titoloRisultato = useRef<HTMLHeadingElement>(null);

  const numero = (k: Chiave) => Number(testi[k].replace(",", "."));
  const target: Target = {
    kcal: numero("kcal"),
    proteine: numero("proteine"),
    carboidrati: numero("carboidrati"),
    grassi: numero("grassi"),
    pastiAlGiorno,
    giorni,
  };
  const validi = CAMPI.every((c) => testi[c.k].trim() !== "" && numero(c.k) >= c.min && numero(c.k) <= c.max);
  const impronta = JSON.stringify(target);

  function componi(g = 0) {
    if (!validi) return;
    setGiro(g);
    setEsito({
      risultato: componiPiano(target, { ...VINCOLI_DEFAULT, maxRipetizioni: RIPETIZIONI[g % RIPETIZIONI.length] }),
      con: impronta,
    });
    // il risultato compare sotto il modulo: il fuoco ci va, e con lui lo schermo
    requestAnimationFrame(() => titoloRisultato.current?.focus());
  }

  function apriNelCompositore() {
    if (!esito) return;
    sostituisciPiano(esito.risultato.piano);
    router.push("/settimana");
  }

  const perPasto = targetPerPasto(target);
  const r = esito?.risultato;
  const invecchiato = !!esito && esito.con !== impronta;

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
                  min={c.min}
                  max={c.max}
                  required
                  value={testi[c.k]}
                  onChange={(e) => setTesti({ ...testi, [c.k]: e.target.value })}
                  className="num"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="campo">
              <label htmlFor="t-pasti">Pasti FUEL LAB al giorno</label>
              <select id="t-pasti" value={pastiAlGiorno} onChange={(e) => setPastiAlGiorno(Number(e.target.value))}>
                <option value={1}>1 · solo pranzo</option>
                <option value={2}>2 · pranzo e cena</option>
              </select>
            </div>
            <div className="campo">
              <label htmlFor="t-giorni">Giorni</label>
              <select id="t-giorni" value={giorni} onChange={(e) => setGiorni(Number(e.target.value))}>
                {[3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    {n} giorni
                  </option>
                ))}
              </select>
            </div>
          </div>

          {validi ? (
            <p className="text-sm text-muted">
              A pasto puntiamo a circa <span className="num text-ink">{Math.round(perPasto.kcal)}</span> kcal e{" "}
              <span className="num text-ink">{Math.round(perPasto.proteine)}</span> g di proteine: il resto della
              giornata lo copri tu.
            </p>
          ) : (
            <p className="text-sm text-muted">
              Scrivi tutti e quattro i numeri della scheda (calorie da {CAMPI[0].min} a {CAMPI[0].max}).
            </p>
          )}

          <button type="submit" className="btn btn-ink justify-self-start">
            {esito ? "Ricomponi la settimana" : "Componi la settimana"} <span className="freccia">→</span>
          </button>
        </form>

        <div aria-live="polite">
          {r ? (
            <div className="border-t-[3px] border-ink pt-6">
              <h2 ref={titoloRisultato} tabIndex={-1} className="titolo-s outline-none focus-visible:shadow-none">
                {r.aCentro ? "Ecco la tua settimana. I numeri tornano." : "La più vicina ai tuoi numeri."}
              </h2>
              {invecchiato ? (
                <p className="mt-4 bg-paper-2 p-3 text-sm">
                  Hai cambiato i numeri dopo questa proposta: premi «Ricomponi la settimana» per aggiornarla.
                </p>
              ) : null}
              <ul className="mt-6">
                {GIORNI.filter((g) => r.piano[g]).map((g) => (
                  <li key={g} className="grid grid-cols-[110px_1fr] gap-4 border-b border-ink/15 py-3">
                    <span className="font-disp text-sm font-semibold tracking-[.14em] uppercase">
                      {NOMI_GIORNO[g]}
                    </span>
                    <span className="grid gap-1">
                      {PASTI.map((m) => {
                        const id = r.piano[g]?.[m]?.piatto;
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
                      {r.scarti[c.k] > 0 ? "+" : ""}
                      {Math.round(r.scarti[c.k])}%
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-sm text-muted">Scarto dal tuo bersaglio sulla settimana.</p>
              {pasti > 0 ? (
                <p className="mt-6 max-w-[56ch] border-l-4 border-ink bg-paper-2 p-3 text-sm">
                  Nel compositore hai già {pasti} {pasti === 1 ? "pasto" : "pasti"}: aprendo questa proposta li sostituisce.
                </p>
              ) : null}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <button type="button" className="btn btn-lime" onClick={apriNelCompositore}>
                  {pasti > 0 ? "Sostituisci la mia settimana" : "Apri nel compositore"} <span className="freccia">→</span>
                </button>
                <button type="button" className="link" onClick={() => componi(giro + 1)} disabled={!validi}>
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
