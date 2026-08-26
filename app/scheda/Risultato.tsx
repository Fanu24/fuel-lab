"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import ElementCard from "@/components/ElementCard";
import { MacroBar } from "@/components/MacroBar";
import Reveal from "@/components/Reveal";
import { getElemento, type Elemento } from "@/lib/catalogo";
import type { EsitoPiano } from "@/lib/matcher";
import { usePiano } from "@/lib/piano";
import { CASELLE_TOTALI, GIORNI, PASTI } from "@/lib/settimana";
import type { Target } from "@/lib/types";

/**
 * STATO 4 — la settimana composta.
 *
 * Qui il giudizio deve essere onesto: anche con l'unita di scelta piu fine
 * (l'abbinamento primo+secondo al posto del piatto intero) certi target
 * restano fuori tiro. Se un macro e' fuori si dice quale e di quanto, invece
 * di mostrare tre barre piene e sperare che nessuno guardi.
 */

const CHIAVI = ["kcal", "proteine", "carboidrati", "grassi"] as const;
type Chiave = (typeof CHIAVI)[number];

const ETICHETTE: Record<Chiave, string> = {
  kcal: "Calorie",
  proteine: "Proteine",
  carboidrati: "Carboidrati",
  grassi: "Grassi",
};
const UNITA: Record<Chiave, string> = {
  kcal: "kcal",
  proteine: "g",
  carboidrati: "g",
  grassi: "g",
};

/** Rotazioni della griglia: mai tre card allineate uguali. */
const ROTAZIONI = ["lg:-rotate-[1.6deg]", "lg:rotate-[2.1deg]", "lg:-rotate-[0.7deg]"];

const numero = (n: number) => Math.round(n).toLocaleString("it-IT");
const conSegno = (n: number, suffisso: string) =>
  (n > 0 ? "+" : "−") + Math.round(Math.abs(n)) + suffisso;

export default function Risultato({
  esito,
  target,
  giro,
  maxRipetizioni,
  onRigenera,
  onModifica,
}: {
  esito: EsitoPiano;
  target: Target;
  giro: number;
  maxRipetizioni: number;
  onRigenera: () => void;
  onModifica: () => void;
}) {
  const router = useRouter();
  const { sostituisciPiano, pasti, pronto } = usePiano();

  // Il piano tiene un elemento per casella: per la griglia sotto serve il
  // contrario, un elemento per riga con quante volte compare nella settimana.
  const elementi = useMemo(() => {
    const mappa = new Map<string, { elemento: Elemento; qta: number }>();
    for (const g of GIORNI) {
      for (const m of PASTI) {
        const c = esito.piano[g]?.[m];
        if (!c) continue;
        for (const id of [c.primo, c.secondo]) {
          if (!id) continue;
          const e = getElemento(id);
          if (!e) continue;
          const r = mappa.get(id);
          if (r) r.qta += 1;
          else mappa.set(id, { elemento: e, qta: 1 });
        }
      }
    }
    return Array.from(mappa.values());
  }, [esito.piano]);

  const totalePasti = useMemo(() => {
    let n = 0;
    for (const g of GIORNI) for (const m of PASTI) if (esito.piano[g]?.[m]) n += 1;
    return n;
  }, [esito.piano]);

  // I macro fuori tiro. Se aCentro e' falso deve esserci sempre qualcosa da
  // mostrare: nel caso limite (bersagli a zero, scarti non finiti) il filtro
  // tornerebbe vuoto e il pannello annuncerebbe "0 macro fuori tiro" sopra una
  // lista vuota. Allora ripiego sul macro piu lontano e la riga resta vera.
  const fuori = useMemo(() => {
    const oltre = CHIAVI.filter((k) => Math.abs(esito.scarti[k]) > 10);
    if (oltre.length > 0) return oltre;
    return [
      CHIAVI.reduce((a, b) => (Math.abs(esito.scarti[a]) >= Math.abs(esito.scarti[b]) ? a : b)),
    ];
  }, [esito]);

  const metti = () => {
    sostituisciPiano(esito.piano);
    router.push("/settimana");
  };

  if (totalePasti === 0) {
    return (
      <div className="shell">
        <div className="core p-10">
          <h2 className="h3">Nessuna casella riempita</h2>
          <p className="mt-4 max-w-[52ch] text-[15px] text-muted">
            Con i vincoli che hai scelto il catalogo resta vuoto. Riapri i valori e togli
            un&apos;esclusione.
          </p>
          <button type="button" onClick={onModifica} className="btn btn-s mt-8">
            Modifica i valori
            <span className="dot" aria-hidden="true">
              &#8592;
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-11 lg:grid-cols-[1fr_396px]">
        {/* ================= verdetto + azioni ================= */}
        <div>
          <p className="note text-ink">Passo 4 / 4</p>
          <h2 className="h2 mt-4 !text-[clamp(32px,4.8vw,52px)]">La tua settimana.</h2>

          {esito.aCentro ? (
            <div
              className="mt-8 rounded-[var(--shell)] bg-lime px-7 py-8 text-ink md:-rotate-[1.2deg]"
              role="status"
            >
              <p className="font-disp text-[clamp(28px,3.6vw,40px)] leading-[.94] uppercase">
                La settimana centra i tuoi macro
              </p>
              <p className="mt-4 max-w-[44ch] text-[14px] leading-relaxed">
                Ogni macro sta entro il 10% del bersaglio della settimana. Sui singoli giorni
                qualcosa oscilla, sul totale no: e&apos; il modo in cui si legge una scheda.
              </p>
            </div>
          ) : (
            <div className="mt-8 shell" role="status">
              <div className="core px-7 py-8">
                <p className="font-disp text-[clamp(26px,3.4vw,36px)] leading-[.96] text-ink uppercase">
                  Ci siamo quasi: {fuori.length === 1 ? "un macro" : fuori.length + " macro"} fuori
                  tiro
                </p>
                <ul className="mt-6 grid gap-3">
                  {fuori.map((k) => (
                    <li
                      key={k}
                      className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b pb-3 last:border-0"
                      style={{ borderColor: "var(--hair-soft)" }}
                    >
                      <span className="bar-l">{ETICHETTE[k]}</span>
                      <span
                        className="font-mono text-[14px] text-ink"
                        style={{ fontVariationSettings: '"wdth" 84' }}
                      >
                        {conSegno(esito.scarti[k], "%")}
                        <em className="ml-2 not-italic text-muted">
                          ({conSegno(esito.totali[k] - esito.bersaglio[k], " " + UNITA[k])}{" "}
                          sul bersaglio)
                        </em>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 max-w-[52ch] text-[14px] leading-relaxed text-muted">
                  Le caselle si riempiono con abbinamenti primo+secondo, non piatti interi: piu
                  vicino di cosi, con questi vincoli, non si arriva. Rigenera per un&apos;altra
                  combinazione oppure allarga i valori.
                </p>
              </div>
            </div>
          )}

          {/* ---------- azioni ---------- */}
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button type="button" className="btn btn-p" onClick={metti} disabled={!pronto}>
              Metti nella settimana
              <span className="dot" aria-hidden="true">
                &#8594;
              </span>
            </button>
            <button type="button" className="btn btn-s" onClick={onRigenera}>
              Rigenera con altri abbinamenti
              <span className="dot" aria-hidden="true">
                &#8635;
              </span>
            </button>
            <button
              type="button"
              onClick={onModifica}
              className="text-[14px] text-muted underline decoration-ink decoration-2 underline-offset-[6px] transition-colors duration-400 ease-[var(--e-out)] hover:text-ink"
            >
              Modifica i valori
            </button>
          </div>

          <div className="mt-6 grid gap-2">
            {pronto && pasti > 0 ? (
              <p className="note" style={{ color: "#ff9d9d" }}>
                Nella tua settimana hai gia {pasti} pasti: questa azione li sostituisce
              </p>
            ) : null}
            {giro > 0 ? (
              <p className="note">
                Giro {giro + 1} — al massimo {maxRipetizioni}{" "}
                {maxRipetizioni === 1 ? "porzione" : "porzioni"} per elemento
              </p>
            ) : null}
          </div>
        </div>

        {/* ================= pannello dei macro ================= */}
        <aside className="shell h-max lg:rotate-[1.1deg]">
          <div className="core p-7">
            <div className="mb-7 flex items-baseline justify-between gap-4">
              <p className="bar-l">Totale della settimana</p>
              <p className="note">{totalePasti} pasti</p>
            </div>

            <MacroBar
              etichetta="Proteine"
              valore={esito.totali.proteine}
              target={esito.bersaglio.proteine}
            />
            <MacroBar
              etichetta="Carboidrati"
              valore={esito.totali.carboidrati}
              target={esito.bersaglio.carboidrati}
            />
            <MacroBar
              etichetta="Grassi"
              valore={esito.totali.grassi}
              target={esito.bersaglio.grassi}
            />

            <div
              className="mt-8 flex flex-wrap items-end justify-between gap-x-5 gap-y-2 border-t pt-7"
              style={{ borderColor: "var(--hair-soft)" }}
            >
              <span className="bar-l">Calorie</span>
              <p
                className="font-mono text-[38px] leading-none text-ink"
                style={{ fontVariationSettings: '"wdth" 82' }}
              >
                {numero(esito.totali.kcal)}
                <span className="ml-2 text-[13px] text-muted">
                  / {numero(esito.bersaglio.kcal)} kcal
                </span>
              </p>
            </div>

            <p className="note mt-4">
              bersaglio: {target.pastiAlGiorno} pasti al giorno per {target.giorni} giorni
            </p>
          </div>
        </aside>
      </div>

      {/* ================= gli elementi scelti ================= */}
      <div className="mt-[86px]">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
          <h3 className="h3">Cosa mangi</h3>
          <p className="note">
            {elementi.length} elementi diversi — {totalePasti} caselle su {CASELLE_TOTALI}
          </p>
        </div>

        <div className="grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
          {elementi.map((r, i) => (
            <Reveal
              key={r.elemento.id}
              delay={i * 60}
              className={"group" + (i % 3 === 1 ? " lg:mt-10" : "")}
            >
              {/* La pastiglia sta dentro la rotazione, non fuori: agganciata al
                  riquadro dritto si staccherebbe dall'angolo della card inclinata. */}
              <div className={"relative h-full " + ROTAZIONI[i % ROTAZIONI.length]}>
                <ElementCard elemento={r.elemento} />
                {r.qta > 1 ? (
                  <span
                    className="pointer-events-none absolute -top-3 right-4 z-10 rounded-full bg-lime px-[13px] py-[6px] font-mono text-[12px] text-ink transition-transform duration-700 group-hover:-translate-y-2.5"
                    style={{
                      fontVariationSettings: '"wdth" 84',
                      transitionTimingFunction: "var(--e-over)",
                      boxShadow: "0 14px 30px -14px rgba(223,255,62,.6)",
                    }}
                  >
                    <span aria-hidden="true">&times;{r.qta}</span>
                    <span className="sr-only">{r.qta} volte nella settimana proposta</span>
                  </span>
                ) : null}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
