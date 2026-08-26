"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  combinazioni,
  numeroPasti,
  quotaCoperta,
  targetPerPasto,
  type Vincoli,
} from "@/lib/matcher";
import { TAGS, type Tag, type Target } from "@/lib/types";

/**
 * STATO 3 — i macro, modificabili.
 *
 * Il pannello e' il punto in cui la demo deve essere onesta due volte: i valori
 * di partenza non arrivano dal file (lo dice a chiare lettere qui dentro) e la
 * quota coperta va spiegata, altrimenti chi prende un solo pasto al giorno si
 * aspetta 2.240 kcal dentro una schiscetta.
 */

/**
 * Quanti abbinamenti primo+secondo esistono in totale, senza vincoli.
 * Calcolato dal catalogo, non scritto a mano: se il catalogo cambia il numero
 * mostrato in pagina resta vero da solo.
 */
const TOTALE_ABBINAMENTI = combinazioni({ escludi: [], soloTag: [], maxRipetizioni: 1 }).length;

type Campo = "kcal" | "proteine" | "carboidrati" | "grassi";

const LIMITI: Record<Campo, { label: string; unita: string; min: number; max: number }> = {
  kcal: { label: "Calorie", unita: "kcal al giorno", min: 800, max: 6000 },
  proteine: { label: "Proteine", unita: "g al giorno", min: 40, max: 400 },
  carboidrati: { label: "Carboidrati", unita: "g al giorno", min: 40, max: 800 },
  grassi: { label: "Grassi", unita: "g al giorno", min: 15, max: 250 },
};
const CAMPI: Campo[] = ["kcal", "proteine", "carboidrati", "grassi"];
const PASTI = [1, 2, 3];
const GIORNI = [3, 5, 6, 7];

/** La virgola italiana e' l'errore di battitura piu probabile: la accetto. */
function numero(testo: string): number {
  const v = Number(testo.replace(",", ".").trim());
  return testo.trim() === "" || !Number.isFinite(v) ? NaN : v;
}

const FUOCO =
  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink has-[:focus-visible]:outline-offset-[3px]";

export default function Valori({
  target,
  vincoli,
  nomeFile,
  onConferma,
  onRicomincia,
}: {
  target: Target;
  vincoli: Vincoli;
  nomeFile: string | null;
  onConferma: (t: Target, v: Vincoli) => void;
  onRicomincia: () => void;
}) {
  // I campi vivono come testo, non come numeri: con lo stato numerico svuotare
  // una casella per riscriverla la riempirebbe di zeri sotto le dita.
  const [campi, setCampi] = useState<Record<Campo, string>>({
    kcal: String(target.kcal),
    proteine: String(target.proteine),
    carboidrati: String(target.carboidrati),
    grassi: String(target.grassi),
  });
  const [pasti, setPasti] = useState(target.pastiAlGiorno);
  const [giorni, setGiorni] = useState(target.giorni);
  const [escludi, setEscludi] = useState<Tag[]>(vincoli.escludi);

  const errori = useMemo(() => {
    const e: Record<Campo, string | null> = {
      kcal: null,
      proteine: null,
      carboidrati: null,
      grassi: null,
    };
    for (const c of CAMPI) {
      const { min, max } = LIMITI[c];
      const n = numero(campi[c]);
      e[c] = Number.isNaN(n)
        ? "Serve un numero."
        : n < min || n > max
          ? "Fuori scala: sta fra " + min + " e " + max + "."
          : null;
    }
    return e;
  }, [campi]);

  const numeriOk = CAMPI.every((c) => errori[c] === null);
  const valore = (c: Campo) => {
    const n = numero(campi[c]);
    return Number.isNaN(n) ? 0 : n;
  };

  const bozza: Target = {
    kcal: valore("kcal"),
    proteine: valore("proteine"),
    carboidrati: valore("carboidrati"),
    grassi: valore("grassi"),
    pastiAlGiorno: pasti,
    giorni,
  };

  // Quanti abbinamenti primo+secondo restano davvero dopo le esclusioni: se la
  // risposta e' zero il matcher non ha niente da comporre, e va detto prima
  // del click, non dopo.
  const disponibili = useMemo(
    () => combinazioni({ ...vincoli, escludi }).length,
    [vincoli, escludi],
  );

  const perPasto = targetPerPasto(bozza);
  const pastiTotali = numeroPasti(bozza);
  const quota = Math.round(quotaCoperta(pasti) * 100);

  // Controllo di coerenza della scheda: P*4 + C*4 + G*9 deve tornare con le kcal
  // dichiarate. Non blocco niente, ma se la scheda non torna e' giusto dirlo.
  const kcalDaMacro = bozza.proteine * 4 + bozza.carboidrati * 4 + bozza.grassi * 9;
  const incoerente = numeriOk && Math.abs(kcalDaMacro - bozza.kcal) / bozza.kcal > 0.08;

  const pronto = numeriOk && disponibili > 0;

  const invia = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pronto) return;
    onConferma(bozza, { ...vincoli, escludi });
  };

  const scambia = (t: Tag) =>
    setEscludi((v) => (v.includes(t) ? v.filter((x) => x !== t) : [...v, t]));

  return (
    <form onSubmit={invia} noValidate className="shell">
      <div className="core p-7 sm:p-10">
        {/* ---------- testata del pannello ---------- */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="note text-ink">Passo 3 / 4</p>
            <h2 className="h2 mt-4 !text-[clamp(32px,4.8vw,52px)]">Controlla i numeri.</h2>
          </div>
          {nomeFile !== null ? (
            <p
              className="max-w-full overflow-hidden rounded-full px-4 py-[7px] font-mono text-[11.5px] text-ellipsis whitespace-nowrap text-ink"
              style={{
                fontVariationSettings: '"wdth" 84',
                border: "1px solid var(--hair)",
                background: "rgba(223,255,62,.07)",
              }}
            >
              {nomeFile}
            </p>
          ) : null}
        </div>

        {/* ---------- la riga onesta ---------- */}
        <p
          className="mt-7 flex items-start gap-3 rounded-[var(--core-r)] px-5 py-4"
          style={{ background: "rgba(223,255,62,.06)", border: "1px solid var(--hair)" }}
        >
          <b
            className="mt-[7px] block h-[7px] w-[7px] flex-none rotate-45 bg-lime"
            aria-hidden="true"
          />
          <span className="text-[14px] leading-relaxed text-ink">
            Questi valori <b className="text-ink">non arrivano dal tuo file</b>: sono una scheda
            tipo. La demo non legge i PDF. Sostituiscili con i tuoi, ci vogliono dieci secondi.
          </span>
        </p>

        <div className="mt-10 grid gap-11 lg:grid-cols-[1fr_336px]">
          {/* ================= colonna dei controlli ================= */}
          <div>
            <div className="grid gap-5 sm:grid-cols-2">
              {CAMPI.map((c) => {
                const err = errori[c];
                return (
                  <div key={c}>
                    <label htmlFor={"campo-" + c} className="bar-l mb-[10px] block">
                      {LIMITI[c].label}{" "}
                      <span className="font-normal tracking-normal normal-case opacity-55">
                        ({LIMITI[c].unita})
                      </span>
                    </label>
                    {/* type="text" e non "number": con input[type=number] il browser
                        butta via "180,5" prima che il campo lo veda, e la tolleranza
                        alla virgola qui sotto non servirebbe a niente. inputMode
                        decimal tiene comunque il tastierino sul telefono, e la rotella
                        del mouse non cambia piu i valori per sbaglio. */}
                    <input
                      id={"campo-" + c}
                      name={c}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={campi[c]}
                      aria-invalid={err !== null}
                      aria-describedby={"aiuto-" + c}
                      onChange={(e) => setCampi((v) => ({ ...v, [c]: e.target.value }))}
                      className={"field " + (err !== null ? "field-err" : "")}
                    />
                    <p
                      id={"aiuto-" + c}
                      className="note mt-[10px] px-1"
                      style={err !== null ? { color: "#ff9d9d" } : undefined}
                    >
                      {err ?? "da " + LIMITI[c].min + " a " + LIMITI[c].max}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Niente role="status" qui: cambierebbe a ogni tasto e il lettore
                di schermo diventerebbe una radiolina. */}
            {incoerente ? (
              <p className="note mt-6 px-1 text-ink">
                Attenzione: i macro fanno {Math.round(kcalDaMacro)} kcal, la scheda ne dichiara{" "}
                {Math.round(bozza.kcal)}
              </p>
            ) : null}

            {/* ---------- pasti e giorni ---------- */}
            <div className="mt-9 grid gap-7 sm:grid-cols-2">
              <fieldset className="border-0 p-0">
                <legend className="bar-l mb-[14px] block">Pasti al giorno</legend>
                <div className="flex flex-wrap gap-2">
                  {PASTI.map((v) => (
                    <label key={v} className={"cursor-pointer rounded-full " + FUOCO}>
                      <input
                        type="radio"
                        name="pasti"
                        value={v}
                        checked={pasti === v}
                        onChange={() => setPasti(v)}
                        aria-label={v === 1 ? "1 pasto al giorno" : v + " pasti al giorno"}
                        className="sr-only"
                      />
                      <span
                        className="block rounded-full border px-[20px] py-[9px] font-mono text-[13px] transition-colors duration-400 ease-[var(--e-out)]"
                        style={{
                          fontVariationSettings: '"wdth" 84',
                          background: pasti === v ? "var(--color-lime)" : "rgba(201,224,205,.05)",
                          color: pasti === v ? "var(--color-ink)" : "var(--color-ink)",
                          borderColor: pasti === v ? "transparent" : "var(--hair-soft)",
                        }}
                      >
                        {v}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="border-0 p-0">
                <legend className="bar-l mb-[14px] block">Giorni coperti</legend>
                <div className="flex flex-wrap gap-2">
                  {GIORNI.map((v) => (
                    <label key={v} className={"cursor-pointer rounded-full " + FUOCO}>
                      <input
                        type="radio"
                        name="giorni"
                        value={v}
                        checked={giorni === v}
                        onChange={() => setGiorni(v)}
                        aria-label={v + " giorni coperti"}
                        className="sr-only"
                      />
                      <span
                        className="block rounded-full border px-[20px] py-[9px] font-mono text-[13px] transition-colors duration-400 ease-[var(--e-out)]"
                        style={{
                          fontVariationSettings: '"wdth" 84',
                          background: giorni === v ? "var(--color-lime)" : "rgba(201,224,205,.05)",
                          color: giorni === v ? "var(--color-ink)" : "var(--color-ink)",
                          borderColor: giorni === v ? "transparent" : "var(--hair-soft)",
                        }}
                      >
                        {v}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            {/* ---------- vincoli ---------- */}
            <fieldset className="mt-9 border-0 p-0">
              <legend className="bar-l mb-[6px] block">Cosa togliere dalla settimana</legend>
              <p className="note mb-[14px]">Esclude gli elementi che portano il tag</p>
              <div className="flex flex-wrap gap-2.5">
                {TAGS.map((t) => {
                  const attivo = escludi.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className={
                        "flex cursor-pointer items-center gap-3 rounded-full border px-4 py-[9px] transition-colors duration-400 ease-[var(--e-out)] " +
                        FUOCO
                      }
                      style={{
                        borderColor: attivo ? "var(--hair)" : "var(--hair-soft)",
                        background: attivo ? "rgba(223,255,62,.08)" : "transparent",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={attivo}
                        onChange={() => scambia(t.id)}
                        className="sr-only"
                      />
                      <span
                        className="relative block h-[20px] w-[34px] flex-none rounded-full transition-colors duration-400 ease-[var(--e-out)]"
                        style={{
                          background: attivo ? "var(--color-lime)" : "rgba(201,224,205,.16)",
                        }}
                        aria-hidden="true"
                      >
                        <i
                          className="absolute top-[3px] left-[3px] block h-[14px] w-[14px] rounded-full transition-transform duration-500"
                          style={{
                            background: attivo ? "var(--color-ink)" : "var(--color-ink)",
                            transform: attivo ? "translateX(14px)" : "none",
                            transitionTimingFunction: "var(--e-over)",
                          }}
                        />
                      </span>
                      <span
                        className="text-[13.5px] whitespace-nowrap"
                        style={{ color: attivo ? "var(--color-ink)" : "var(--color-muted)" }}
                      >
                        {t.label}
                      </span>
                    </label>
                  );
                })}
              </div>
              <p
                className="note mt-[14px]"
                style={disponibili === 0 ? { color: "#ff9d9d" } : undefined}
                role="status"
              >
                {disponibili === 0
                  ? "Con questi vincoli non resta nessun abbinamento"
                  : disponibili + ` abbinamenti su ${TOTALE_ABBINAMENTI} restano in gioco`}
              </p>
            </fieldset>
          </div>

          {/* ================= riepilogo del bersaglio ================= */}
          <aside>
            <div
              className="rounded-[var(--core-r)] p-6"
              style={{ background: "rgba(201,224,205,.04)", border: "1px solid var(--hair-soft)" }}
            >
              <p className="bar-l">La settimana che stai chiedendo</p>
              <p
                className="mt-4 font-mono text-[54px] leading-none text-ink"
                style={{ fontVariationSettings: '"wdth" 82' }}
              >
                {pastiTotali}
              </p>
              <p className="note mt-3">
                pasti — {pasti} al giorno per {giorni} giorni
              </p>

              <div className="mt-7 rounded-[14px] bg-lime p-5 text-ink">
                <p
                  className="font-mono text-[30px] leading-none"
                  style={{ fontVariationSettings: '"wdth" 82' }}
                >
                  {quota}%
                </p>
                <p className="mt-3 text-[13.5px] leading-relaxed">
                  della tua giornata passa da Fuel.{" "}
                  {pasti === 1
                    ? "Con un pasto solo il resto (colazione, spuntini, cena) lo fai tu: la schiscetta punta a una fetta della scheda, non a tutta."
                    : pasti === 2
                      ? "Colazione e spuntini restano tuoi: le due schiscette coprono il grosso, non tutto."
                      : "Con tre pasti copriamo quasi tutta la giornata: fuori resta poco piu' della colazione."}
                </p>
              </div>

              <p className="bar-l mt-7 block">Bersaglio per schiscetta</p>
              <ul className="mt-4 grid gap-2">
                {[
                  { l: "Calorie", v: Math.round(perPasto.kcal), u: "kcal" },
                  { l: "Proteine", v: Math.round(perPasto.proteine), u: "g" },
                  { l: "Carboidrati", v: Math.round(perPasto.carboidrati), u: "g" },
                  { l: "Grassi", v: Math.round(perPasto.grassi), u: "g" },
                ].map((r) => (
                  <li
                    key={r.l}
                    className="flex items-baseline justify-between gap-3 border-b pb-2 last:border-0"
                    style={{ borderColor: "var(--hair-soft)" }}
                  >
                    <span className="text-[13.5px] text-muted">{r.l}</span>
                    <span
                      className="font-mono text-[14px] text-ink"
                      style={{ fontVariationSettings: '"wdth" 84' }}
                    >
                      {numeriOk ? r.v : "—"} <em className="not-italic opacity-45">{r.u}</em>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        {/* ---------- barra di conferma ---------- */}
        <div
          className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 border-t pt-8"
          style={{ borderColor: "var(--hair-soft)" }}
        >
          <button type="submit" className="btn btn-p" disabled={!pronto}>
            Componi la mia settimana
            <span className="dot" aria-hidden="true">
              &#8594;
            </span>
          </button>
          <button
            type="button"
            onClick={onRicomincia}
            className="text-[14px] text-muted underline decoration-ink decoration-2 underline-offset-[6px] transition-colors duration-400 ease-[var(--e-out)] hover:text-ink"
          >
            Ricomincia dal caricamento
          </button>
          <p className="note ml-auto">Il matcher gira qui, senza attesa</p>
        </div>
      </div>
    </form>
  );
}
