"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import DishCard from "@/components/DishCard";
import { MacroBar } from "@/components/MacroBar";
import Reveal from "@/components/Reveal";
import { useCart } from "@/lib/cart";
import type { Composizione } from "@/lib/matcher";
import { euro, preventivo } from "@/lib/pricing";
import type { CartLine, Dish, Target } from "@/lib/types";
import { DISHES } from "@/lib/dishes";

/**
 * STATO 4 — il box composto.
 *
 * Qui il giudizio deve essere onesto: con piatti interi e nessuna bilancia
 * di mezzo, certi target non si centrano. Se un macro e' fuori si dice quale e
 * di quanto, invece di mostrare tre barre piene e sperare che nessuno guardi.
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
  composizione,
  target,
  giro,
  maxRipetizioni,
  onRigenera,
  onModifica,
}: {
  composizione: Composizione;
  target: Target;
  giro: number;
  maxRipetizioni: number;
  onRigenera: () => void;
  onModifica: () => void;
}) {
  const router = useRouter();
  const { sostituisci, pasti, pronto } = useCart();

  // Il matcher restituisce la lista dei pasti, uno per riga: per la griglia
  // serve il contrario, un piatto per riga con quante volte si ripete.
  const righe = useMemo(() => {
    const mappa = new Map<string, { dish: Dish; qta: number }>();
    for (const d of composizione.piatti) {
      const r = mappa.get(d.id);
      if (r) r.qta += 1;
      else mappa.set(d.id, { dish: d, qta: 1 });
    }
    return Array.from(mappa.values());
  }, [composizione]);

  const totalePasti = composizione.piatti.length;
  const conto = useMemo(() => preventivo(totalePasti, "singolo"), [totalePasti]);

  // I macro fuori tiro. Se aCentro e' falso deve esserci sempre qualcosa da
  // mostrare: nel caso limite (bersagli a zero, scarti non finiti) il filtro
  // tornerebbe vuoto e il pannello annuncerebbe "0 macro fuori tiro" sopra una
  // lista vuota. Allora ripiego sul macro piu lontano e la riga resta vera.
  const fuori = useMemo(() => {
    const oltre = CHIAVI.filter((k) => Math.abs(composizione.scarti[k]) > 10);
    if (oltre.length > 0) return oltre;
    return [
      CHIAVI.reduce((a, b) =>
        Math.abs(composizione.scarti[a]) >= Math.abs(composizione.scarti[b]) ? a : b,
      ),
    ];
  }, [composizione]);

  const metti = () => {
    const linee: CartLine[] = righe.map((r) => ({ dishId: r.dish.id, qta: r.qta }));
    sostituisci(linee);
    router.push("/box");
  };

  if (totalePasti === 0) {
    return (
      <div className="shell">
        <div className="core p-10">
          <h2 className="h3">Nessun piatto disponibile</h2>
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
          <h2 className="h2 mt-4 !text-[clamp(32px,4.8vw,52px)]">Il tuo box.</h2>

          {composizione.aCentro ? (
            <div
              className="mt-8 rounded-[var(--shell)] bg-lime px-7 py-8 text-ink md:-rotate-[1.2deg]"
              role="status"
            >
              <p className="font-disp text-[clamp(28px,3.6vw,40px)] leading-[.94] uppercase">
                Il box centra i tuoi macro
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
                        {conSegno(composizione.scarti[k], "%")}
                        <em className="ml-2 not-italic text-muted">
                          ({conSegno(composizione.totali[k] - composizione.bersaglio[k], " " + UNITA[k])}{" "}
                          sul bersaglio)
                        </em>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 max-w-[52ch] text-[14px] leading-relaxed text-muted">
                  I piatti sono interi e il catalogo ne ha {DISHES.length}: piu vicino di cosi, con questi
                  vincoli, non si arriva. Rigenera per un&apos;altra combinazione oppure allarga i
                  valori.
                </p>
              </div>
            </div>
          )}

          {/* ---------- azioni ---------- */}
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button type="button" className="btn btn-p" onClick={metti} disabled={!pronto}>
              Metti nel box
              <span className="dot" aria-hidden="true">
                &#8594;
              </span>
            </button>
            <button type="button" className="btn btn-s" onClick={onRigenera}>
              Rigenera con altri piatti
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
                Nel box hai gia {pasti} pasti: questa azione li sostituisce
              </p>
            ) : null}
            {giro > 0 ? (
              <p className="note">
                Giro {giro + 1} — al massimo {maxRipetizioni}{" "}
                {maxRipetizioni === 1 ? "porzione" : "porzioni"} per piatto
              </p>
            ) : null}
          </div>
        </div>

        {/* ================= pannello dei macro ================= */}
        <aside className="shell h-max lg:rotate-[1.1deg]">
          <div className="core p-7">
            <div className="mb-7 flex items-baseline justify-between gap-4">
              <p className="bar-l">Totale del box</p>
              <p className="note">{totalePasti} pasti</p>
            </div>

            <MacroBar
              etichetta="Proteine"
              valore={composizione.totali.proteine}
              target={composizione.bersaglio.proteine}
            />
            <MacroBar
              etichetta="Carboidrati"
              valore={composizione.totali.carboidrati}
              target={composizione.bersaglio.carboidrati}
            />
            <MacroBar
              etichetta="Grassi"
              valore={composizione.totali.grassi}
              target={composizione.bersaglio.grassi}
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
                {numero(composizione.totali.kcal)}
                <span className="ml-2 text-[13px] text-muted">
                  / {numero(composizione.bersaglio.kcal)} kcal
                </span>
              </p>
            </div>

            <p className="note mt-4">
              bersaglio: {target.pastiAlGiorno} pasti al giorno per {target.giorni} giorni
            </p>

            <div
              className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-[14px] px-5 py-4"
              style={{ background: "rgba(223,255,62,.06)", border: "1px solid var(--hair)" }}
            >
              <span className="note text-ink">Prezzo indicativo</span>
              <span
                className="font-mono text-[15px] text-ink"
                style={{ fontVariationSettings: '"wdth" 84' }}
              >
                {euro(conto.totale)}
              </span>
            </div>
            <p className="note mt-3 px-1">
              formula singola, {euro(conto.prezzoPasto)} a pasto
              {conto.consegna === 0 ? " — consegna inclusa" : ""}
            </p>
          </div>
        </aside>
      </div>

      {/* ================= i piatti scelti ================= */}
      <div className="mt-[86px]">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
          <h3 className="h3">Cosa mangi</h3>
          <p className="note">
            {righe.length} piatti diversi — {totalePasti} schiscette
          </p>
        </div>

        <div className="grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
          {righe.map((r, i) => (
            <Reveal
              key={r.dish.id}
              delay={i * 60}
              className={"group" + (i % 3 === 1 ? " lg:mt-10" : "")}
            >
              {/* La pastiglia sta dentro la rotazione, non fuori: agganciata al
                  riquadro dritto si staccherebbe dall'angolo della card inclinata. */}
              <div className={"relative h-full " + ROTAZIONI[i % ROTAZIONI.length]}>
                <DishCard dish={r.dish} />
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
                    <span className="sr-only">{r.qta} porzioni nel box proposto</span>
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
