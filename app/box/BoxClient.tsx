"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import Reveal from "@/components/Reveal";
import { MacroBar, MacroSplit } from "@/components/MacroBar";
import { Chip, Eyebrow, Rise, SectionHead } from "@/components/ui";
import { useCart } from "@/lib/cart";
import { dishImg, getDish } from "@/lib/dishes";
import { TARGET_DEFAULT, targetPerPasto } from "@/lib/matcher";
import {
  CONSEGNA_GRATIS_DA,
  euro,
  preventivo,
  SCONTO_ABBONAMENTO,
  TAGLIE,
} from "@/lib/pricing";
import type { Dish } from "@/lib/types";

/**
 * Bersaglio di una singola schiscetta.
 * Finche il cliente non carica la sua scheda uso quella tipo: senza un riferimento
 * le barre macro sarebbero decorazione, e questo pannello deve dire "sei a posto"
 * oppure "ti manca proteina", non "ecco tre barre verdi".
 */
const PER_PASTO = targetPerPasto(TARGET_DEFAULT);

/** Rotazioni della fila rotta. Sotto md la griglia torna dritta e leggibile. */
const GIRI = [
  "md:rotate-[-2.4deg]",
  "md:rotate-[2.1deg] md:-translate-y-5",
  "md:rotate-[-1.6deg] md:translate-y-3",
  "md:rotate-[1.4deg] md:-translate-y-1",
];

/* L'input e' fuori schermo: l'anello di focus va disegnato a mano sul nucleo,
   altrimenti la selezione da tastiera diventa invisibile. */
const ANELLO =
  "peer-focus-visible:[outline:2px_solid_var(--color-lime)] peer-focus-visible:[outline-offset:5px]";

/* Zona cliccabile estesa a tutta la card: il <label> resta un vero label
   (una etichetta di testo) e il suo ::after copre il nucleo. */
const ESTESA = "after:absolute after:inset-0 after:content-['']";

const PERC_ABBONAMENTO = Math.round(SCONTO_ABBONAMENTO * 100);

/** Taglia proposta finche il cliente non ne sceglie una: la seconda, non la piu piccola. */
const TAGLIA_DEFAULT = (TAGLIE[1] ?? TAGLIE[0]).pasti;

/* Il pannello si aggancia solo dove ci sta davvero: sotto gli 880px di viewport un
   riepilogo alto ~750px agganciato a 112px si mangerebbe il bottone di consegna,
   che resterebbe irraggiungibile. Piu in basso torna a scorrere con la pagina. */
const AGGANCIO =
  "[@media(min-width:1024px)_and_(min-height:880px)]:sticky [@media(min-width:1024px)_and_(min-height:880px)]:top-[112px]";

/** Le foto non legate a un piatto. Stessa firma di dishImg(), altri id gia verificati. */
function foto(id: string, w: number): string {
  return `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;
}

function pastiLabel(n: number): string {
  return `${n} ${n === 1 ? "pasto" : "pasti"}`;
}

/* ========================================================================
   TAGLIA
   ===================================================================== */

function CardTaglia({
  pasti,
  prezzoPasto,
  scontoVolume,
  scelta,
  giro,
  onScegli,
}: {
  pasti: number;
  prezzoPasto: number;
  scontoVolume: number;
  scelta: boolean;
  giro: string;
  onScegli: () => void;
}) {
  const id = `taglia-${pasti}`;
  return (
    <div
      className={`shell relative cursor-pointer rotate-0 transition-[transform,background-color,border-color,box-shadow] duration-700 md:hover:rotate-0 md:hover:-translate-y-2 ${giro}`}
      style={{
        transitionTimingFunction: "var(--e-over)",
        background: scelta ? "var(--color-lime)" : undefined,
        borderColor: scelta ? "transparent" : undefined,
        boxShadow: scelta ? "0 34px 70px -34px rgba(223,255,62,.42)" : undefined,
      }}
    >
      <input
        id={id}
        type="radio"
        name="taglia"
        className="peer sr-only"
        checked={scelta}
        onChange={onScegli}
        /* Il nome accessibile lo costruiscono il numero e la sua etichetta visibile
           ("6" + "pasti a settimana"): un aria-label riscritto a mano direbbe una
           cosa diversa da quella stampata sulla card. */
        aria-labelledby={`${id}-n ${id}-l`}
        aria-describedby={`${id}-p`}
      />
      <div
        className={`core px-6 pt-7 pb-6 transition-colors duration-700 ease-[var(--e-out)] ${ANELLO}`}
        style={{ background: scelta ? "var(--color-lime)" : undefined }}
      >
        <p
          id={`${id}-n`}
          className="font-disp text-[64px] leading-[.76] transition-colors duration-700 ease-[var(--e-out)]"
          style={{ color: scelta ? "var(--color-ink)" : "#fff" }}
        >
          {pasti}
        </p>

        <label
          id={`${id}-l`}
          htmlFor={id}
          className={`mt-[10px] block cursor-pointer text-[10.5px] tracking-[.24em] uppercase ${ESTESA}`}
          style={{
            fontVariationSettings: '"wdth" 114, "wght" 700',
            color: scelta ? "rgba(6,23,16,.72)" : "var(--color-mist)",
          }}
        >
          pasti a settimana
        </label>

        <p
          id={`${id}-p`}
          className="mt-5 font-mono text-[13px]"
          style={{
            fontVariationSettings: '"wdth" 84',
            color: scelta ? "var(--color-ink)" : "#fff",
          }}
        >
          {euro(prezzoPasto)}
          <span
            className="ml-1.5 text-[11px]"
            style={{ color: scelta ? "rgba(6,23,16,.66)" : "var(--color-mist-dim)" }}
          >
            a pasto
          </span>
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {scontoVolume > 0 ? (
            <span
              className="chip"
              style={
                scelta
                  ? {
                      background: "var(--color-ink)",
                      color: "var(--color-lime)",
                      borderColor: "transparent",
                    }
                  : {
                      background: "rgba(223,255,62,.08)",
                      color: "var(--color-lime)",
                      borderColor: "var(--hair)",
                    }
              }
            >
              −{scontoVolume}% sul pasto
            </span>
          ) : (
            <span
              className="chip"
              style={{
                background: scelta ? "rgba(6,23,16,.1)" : undefined,
                color: scelta ? "rgba(6,23,16,.72)" : undefined,
                borderColor: scelta ? "rgba(6,23,16,.22)" : undefined,
              }}
            >
              prezzo base
            </span>
          )}
          {pasti >= CONSEGNA_GRATIS_DA ? (
            <span
              className="note"
              style={{ color: scelta ? "rgba(6,23,16,.66)" : undefined }}
            >
              consegna gratis
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================
   FORMULA
   ===================================================================== */

function CardFormula({
  id,
  occhiello,
  titolo,
  testo,
  vantaggi,
  prezzo,
  scelta,
  giro,
  onScegli,
}: {
  id: string;
  occhiello: string;
  titolo: string;
  testo: string;
  vantaggi: string[];
  prezzo: ReactNode;
  scelta: boolean;
  giro: string;
  onScegli: () => void;
}) {
  return (
    <div
      className={`shell relative h-full cursor-pointer rotate-0 transition-[transform,border-color] duration-700 md:hover:rotate-0 md:hover:-translate-y-2 ${giro}`}
      style={{
        transitionTimingFunction: "var(--e-over)",
        borderColor: scelta ? "rgba(223,255,62,.45)" : undefined,
      }}
    >
      <input
        id={id}
        type="radio"
        name="formula"
        className="peer sr-only"
        checked={scelta}
        onChange={onScegli}
        /* Niente aria-label: il <label> col titolo e' gia il nome giusto, e
           sovrascriverlo con titolo+testo darebbe una frase intera come nome. */
        aria-describedby={`${id}-d`}
      />
      <div className={`core flex h-full flex-col ${ANELLO}`}>
        {/* La barra alta e' il blocco pieno che segnala la scelta: un accento solido,
            non un bordino colorato che si perde. */}
        <div
          className="flex items-center justify-between gap-4 px-7 py-[14px] transition-colors duration-500 ease-[var(--e-out)]"
          style={{
            background: scelta ? "var(--color-lime)" : "rgba(201,224,205,.05)",
            color: scelta ? "var(--color-ink)" : "var(--color-mist-dim)",
          }}
        >
          <span
            className="font-mono text-[10.5px] tracking-[.22em] uppercase"
            style={{ fontVariationSettings: '"wdth" 84' }}
          >
            {scelta ? "formula scelta" : occhiello}
          </span>
          <span
            className="grid h-[22px] w-[22px] flex-none place-items-center rounded-full border transition-colors duration-500 ease-[var(--e-out)]"
            aria-hidden="true"
            style={{ borderColor: scelta ? "rgba(6,23,16,.5)" : "var(--hair)" }}
          >
            {scelta ? <span className="block h-[10px] w-[10px] rounded-full bg-ink" /> : null}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-7 sm:p-8">
          <label htmlFor={id} className={`h3 block cursor-pointer !text-[30px] ${ESTESA}`}>
            {titolo}
          </label>
          <p id={`${id}-d`} className="mt-3 text-[14.5px] leading-relaxed text-mist-dim">
            {testo}
          </p>

          <ul className="mt-6 flex flex-col gap-[11px]">
            {vantaggi.map((v) => (
              <li key={v} className="flex items-start gap-3 text-[14px] leading-snug">
                <i
                  aria-hidden="true"
                  className="mt-[6px] block h-[6px] w-[6px] flex-none rotate-45 bg-lime"
                />
                <span>{v}</span>
              </li>
            ))}
          </ul>

          <div
            className="mt-auto flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t pt-[18px]"
            style={{ borderColor: "var(--hair-soft)" }}
          >
            {prezzo}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================
   RIGHE DEL BOX
   ===================================================================== */

function Stepper({ dish, qta }: { dish: Dish; qta: number }) {
  const { aggiungi, imposta } = useCart();
  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border p-1"
      style={{ borderColor: "var(--hair)", background: "rgba(223,255,62,.08)" }}
    >
      <button
        type="button"
        onClick={() => imposta(dish.id, qta - 1)}
        aria-label={`Togli una porzione di ${dish.nome}`}
        className="grid h-7 w-7 place-items-center rounded-full text-lime transition-colors duration-300 ease-[var(--e-out)] hover:bg-lime hover:text-ink"
      >
        −
      </button>
      <span
        className="min-w-6 text-center font-mono text-[13px] text-white"
        aria-live="polite"
        style={{ fontVariationSettings: '"wdth" 84' }}
      >
        {qta}
        {/* Un "3" annunciato da solo non dice di cosa: la coda muta da' il contesto. */}
        <span className="sr-only"> {qta === 1 ? "porzione" : "porzioni"} di {dish.nome}</span>
      </span>
      <button
        type="button"
        onClick={() => aggiungi(dish.id)}
        disabled={qta >= 20}
        aria-label={`Aggiungi una porzione di ${dish.nome}`}
        className="grid h-7 w-7 place-items-center rounded-full text-lime transition-colors duration-300 ease-[var(--e-out)] hover:bg-lime hover:text-ink disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-lime"
      >
        +
      </button>
    </div>
  );
}

function RigaPiatto({ dish, qta }: { dish: Dish; qta: number }) {
  const { togli } = useCart();
  return (
    <li
      className="grid grid-cols-[62px_minmax(0,1fr)] items-center gap-x-4 gap-y-4 border-t px-5 py-[18px] first:border-t-0 sm:grid-cols-[74px_minmax(0,1fr)_auto] sm:gap-x-6 sm:px-7 sm:py-5"
      style={{ borderColor: "var(--hair-soft)" }}
    >
      <figure className="aspect-square overflow-hidden rounded-[14px] bg-ink-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dishImg(dish, 220)}
          alt={dish.nome}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </figure>

      <div className="min-w-0">
        <h3
          className="text-[15px] leading-snug text-white"
          style={{ fontVariationSettings: '"wdth" 104, "wght" 600' }}
        >
          {dish.nome}
        </h3>
        <p
          className="mt-[6px] font-mono text-[11.5px] text-mist-dim"
          style={{ fontVariationSettings: '"wdth" 84' }}
        >
          {dish.kcal} kcal · P {dish.proteine} / C {dish.carboidrati} / G {dish.grassi}
        </p>
        <MacroSplit
          proteine={dish.proteine}
          carboidrati={dish.carboidrati}
          grassi={dish.grassi}
          className="mt-[10px] max-w-[188px]"
        />
      </div>

      <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:justify-end">
        <Stepper dish={dish} qta={qta} />
        <button
          type="button"
          onClick={() => togli(dish.id)}
          aria-label={`Togli ${dish.nome} dal box`}
          className="grid h-[34px] w-[34px] place-items-center rounded-full border text-[15px] text-mist-dim transition-colors duration-400 ease-[var(--e-out)] hover:border-white hover:text-white"
          style={{ borderColor: "var(--hair-soft)" }}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </li>
  );
}

function StatoVuoto() {
  return (
    <div className="shell">
      <div className="core grid grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_290px]">
        <div className="p-8 sm:p-11">
          <h3 className="h3">
            Il box e ancora
            <br />
            vuoto.
          </h3>
          <p className="mt-4 max-w-[440px] text-[15px] leading-relaxed text-mist-dim">
            {
              "Due strade, stessa destinazione: scegli i piatti a mano dal menu della settimana, oppure parti dalla scheda del tuo nutrizionista e lascia che sia il matcher a comporre il box sui tuoi macro."
            }
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/menu" className="btn btn-p">
              Sfoglia il menu
              <span className="dot" aria-hidden="true">
                →
              </span>
            </Link>
            <Link href="/scheda" className="btn btn-s">
              Parti dalla tua scheda
              <span className="dot" aria-hidden="true">
                ↗
              </span>
            </Link>
          </div>
        </div>
        <figure className="relative min-h-[210px] bg-ink-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={foto("photo-1498837167922-ddd27525d352", 760)}
            alt="Contenitori di meal prep porzionati e pronti per la consegna"
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </figure>
      </div>
    </div>
  );
}

/* ========================================================================
   PANNELLO RIEPILOGO
   ===================================================================== */

function VoceConto({
  voce,
  valore,
  accento = false,
}: {
  voce: string;
  valore: string;
  accento?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[13.5px] text-mist-dim">{voce}</dt>
      <dd
        className={`font-mono text-[13px] ${accento ? "text-lime" : "text-white"}`}
        style={{ fontVariationSettings: '"wdth" 84' }}
      >
        {valore}
      </dd>
    </div>
  );
}

function ScheletroPannello() {
  return (
    <div className="shell" aria-hidden="true">
      <div className="core animate-pulse p-[30px]">
        <div className="h-[27px] w-[128px] rounded-full bg-[rgba(201,224,205,.09)]" />
        <div className="mt-8 flex flex-col gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <div className="mb-[11px] h-[11px] w-[92px] rounded-full bg-[rgba(201,224,205,.08)]" />
              <div className="h-[11px] rounded-full bg-[rgba(201,224,205,.06)]" />
            </div>
          ))}
        </div>
        <div className="mt-9 h-[52px] rounded-full bg-[rgba(201,224,205,.06)]" />
        <div className="mt-6 h-[130px] rounded-[18px] bg-[rgba(201,224,205,.05)]" />
      </div>
    </div>
  );
}

function Riepilogo() {
  const { pasti, macro, conto, pronto } = useCart();

  if (!pronto) return <ScheletroPannello />;

  const medio = (n: number) => (pasti > 0 ? n / pasti : 0);
  const vuoto = pasti === 0;

  return (
    <div className="shell">
      <div className="core p-[26px] sm:p-[30px]">
        <h2 className="sr-only">Riepilogo del box</h2>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Eyebrow>Riepilogo</Eyebrow>
          <span className="note">{pastiLabel(pasti)}</span>
        </div>

        <MacroBar etichetta="Proteine" valore={medio(macro.proteine)} target={PER_PASTO.proteine} />
        <MacroBar
          etichetta="Carboidrati"
          valore={medio(macro.carboidrati)}
          target={PER_PASTO.carboidrati}
        />
        <MacroBar etichetta="Grassi" valore={medio(macro.grassi)} target={PER_PASTO.grassi} />

        <p className="note mt-5 leading-relaxed">
          media per pasto / target scheda tipo
        </p>

        <div
          className="mt-7 flex items-end justify-between gap-5 border-t pt-6"
          style={{ borderColor: "var(--hair-soft)" }}
        >
          <span className="bar-l pb-[6px]">kcal medie</span>
          <p className="font-disp text-[50px] leading-[.78] text-lime">
            {Math.round(medio(macro.kcal))}
            <span
              className="ml-2 font-mono text-[11px] tracking-[.24em] text-mist-dim"
              style={{ fontVariationSettings: '"wdth" 84' }}
            >
              kcal
            </span>
          </p>
        </div>

        {/* A box vuoto il conto non esiste. Stampare "3,90 €" di sola consegna sarebbe
            un totale che nessuno paghera mai: meglio una lineetta onesta. */}
        {vuoto ? null : (
          <dl
            className="mt-7 flex flex-col gap-[14px] border-t pt-6"
            style={{ borderColor: "var(--hair-soft)" }}
          >
            <VoceConto
              voce={`${pastiLabel(pasti)} × ${euro(conto.prezzoPasto)}`}
              valore={euro(conto.subtotale)}
            />
            {conto.scontoAbbonamento > 0 ? (
              <VoceConto
                voce={`Abbonamento −${PERC_ABBONAMENTO}%`}
                valore={`−${euro(conto.scontoAbbonamento)}`}
                accento
              />
            ) : null}
            <VoceConto
              voce="Consegna a Pescara"
              valore={conto.consegna === 0 ? "Gratis" : euro(conto.consegna)}
            />
          </dl>
        )}

        <div
          className="mt-6 flex items-end justify-between gap-4 border-t pt-6"
          style={{ borderColor: "var(--hair)" }}
        >
          <span className="bar-l pb-[7px]">Totale</span>
          <p
            className={`font-disp text-[42px] leading-[.8] ${vuoto ? "text-mist-dim" : "text-lime"}`}
          >
            {vuoto ? (
              <>
                <span aria-hidden="true">—</span>
                <span className="sr-only">da definire</span>
              </>
            ) : (
              euro(conto.totale)
            )}
          </p>
        </div>

        {conto.risparmio > 0 ? (
          <p className="note mt-3 leading-relaxed">
            risparmi {euro(conto.risparmio)} sul prezzo base
          </p>
        ) : null}

        {vuoto ? (
          <>
            <button
              type="button"
              className="btn btn-p mt-7 w-full justify-between"
              disabled
              aria-describedby="perche-bloccato"
            >
              Vai alla consegna
              <span className="dot" aria-hidden="true">
                →
              </span>
            </button>
            <p id="perche-bloccato" className="mt-3 text-[13px] leading-relaxed text-mist-dim">
              {
                "Il box e vuoto: aggiungi almeno un pasto e il bottone si sblocca. Il minimo per una consegna e un pasto, il prezzo migliore parte da 10."
              }
            </p>
          </>
        ) : (
          <Link href="/checkout" className="btn btn-p mt-7 w-full justify-between">
            Vai alla consegna
            <span className="dot" aria-hidden="true">
              →
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}

/* ========================================================================
   PAGINA
   ===================================================================== */

export default function BoxClient() {
  const { pasti, linee, conto, formula, setFormula, svuota, pronto } = useCart();

  const [taglia, setTaglia] = useState<number | null>(null);
  const [confermaSvuota, setConfermaSvuota] = useState(false);

  // Finche il cliente non sceglie, l'obiettivo lo suggerisce il box: chi torna con
  // 12 pasti salvati vede come traguardo la taglia da 15, non un default da 10 che
  // ha gia superato. Derivato in render, non sincronizzato con un effetto.
  // Il suggerimento parte solo a carrello letto ('pronto'): prima, server e client
  // devono accendere la STESSA card, altrimenti la taglia scelta cambia sotto
  // l'idratazione e React trova checked, sfondo e chip diversi da quelli resi.
  const suggerita =
    pronto && pasti > 0
      ? (TAGLIE.find((t) => t.pasti >= pasti) ?? TAGLIE[TAGLIE.length - 1]).pasti
      : TAGLIA_DEFAULT;
  const obiettivo = taglia ?? suggerita;

  // La conferma di svuotamento scade da sola: un bottone che resta armato
  // e' una trappola per il click successivo. Si disarma anche appena svuota,
  // cosi non torna armato se il cliente rimette subito un piatto nel box.
  useEffect(() => {
    if (!confermaSvuota) return;
    const t = window.setTimeout(() => setConfermaSvuota(false), 4000);
    return () => window.clearTimeout(t);
  }, [confermaSvuota]);

  const mancano = obiettivo - pasti;
  const avanzamento = Math.max(0, Math.min(1, obiettivo > 0 ? pasti / obiettivo : 0));

  const contoSingolo = preventivo(pasti, "singolo");
  const contoAbbonamento = preventivo(pasti, "abbonamento");

  return (
    <>
      {/* ---------------- testata ---------------- */}
      <section className="pt-[168px] pb-[96px]">
        <div className="wrap">
          <Eyebrow className="mb-[30px]">Il tuo box</Eyebrow>
          <h1 className="h1">
            <Rise i={0}>Componi</Rise>
            <Rise i={1}>
              <span className="hl">il tuo box.</span>
            </Rise>
          </h1>

          <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_292px] lg:items-end lg:gap-16">
            <div>
              <p className="lead">
                Tre decisioni e hai finito: quanti pasti ti servono, se lo vuoi una volta
                sola o ogni settimana, e cosa ci metti dentro. Il prezzo cambia da solo
                mentre scegli, nessun costo compare alla fine.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-2.5">
                <Chip>Cotto lunedi e giovedi</Chip>
                <Chip accento>Consegna a Pescara</Chip>
                <Chip>Mai surgelato</Chip>
              </div>
            </div>

            {/* Esce dal contenitore verso destra: la griglia rotta comincia qui. */}
            <Reveal delay={140}>
              <figure className="shell hidden lg:block lg:translate-x-6 lg:rotate-[2.1deg]">
                <div className="core">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={foto("photo-1505576399279-565b52d4ac71", 720)}
                    alt="Vaschette di meal prep preparate e chiuse, pronte per la settimana"
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/5] w-full object-cover"
                  />
                </div>
              </figure>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- taglia ---------------- */}
      <section className="py-[118px]">
        <div className="wrap">
          <Reveal>
            <SectionHead
              occhiello="Passo 01 / taglia"
              titolo={
                <>
                  Quanti pasti
                  <br />a settimana
                </>
              }
              testo="Il prezzo lo decide la taglia, non il piatto: il salmone costa quanto il pollo. Piu pasti prendi, meno paga ognuno."
            />
          </Reveal>

          <Reveal delay={90}>
            <fieldset className="m-0 border-0 p-0">
              <legend className="sr-only">Scegli la taglia del box</legend>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
                {TAGLIE.map((t, i) => (
                  <CardTaglia
                    key={t.pasti}
                    pasti={t.pasti}
                    prezzoPasto={t.prezzoPasto}
                    scontoVolume={t.scontoVolume}
                    scelta={obiettivo === t.pasti}
                    giro={GIRI[i] ?? ""}
                    onScegli={() => setTaglia(t.pasti)}
                  />
                ))}
              </div>
            </fieldset>
          </Reveal>

          {/* La taglia e' un traguardo, non un filtro: il box resta quello che e'
              e questa riga dice solo quanto manca per arrivarci. */}
          <Reveal delay={150}>
            <div className="shell mt-12 md:mt-14">
              {/* La colonna fissa da 300px parte da md: a 640px lascerebbe 180px al
                  testo e "Ti mancano 4 pasti per la taglia da 15." andrebbe su quattro righe. */}
              <div className="core flex flex-col gap-7 p-7 md:flex-row md:items-center md:justify-between md:gap-10 md:p-8">
                {pronto ? (
                  <>
                    <div className="min-w-0">
                      <p className="text-[17px] leading-snug text-white">
                        {mancano > 0
                          ? `Ti ${mancano === 1 ? "manca" : "mancano"} ${pastiLabel(mancano)} per la taglia da ${obiettivo}.`
                          : mancano < 0
                            ? `Hai ${pastiLabel(-mancano)} in piu della taglia da ${obiettivo}.`
                            : `Taglia da ${obiettivo} raggiunta.`}
                      </p>
                      <p className="note mt-2">
                        prezzo applicato ora {euro(conto.prezzoPasto)} a pasto
                        {conto.consegna === 0 ? " / consegna gratis" : ""}
                      </p>
                    </div>
                    <div className="w-full md:w-[300px] md:flex-none">
                      <div className="mb-[10px] flex items-baseline justify-between">
                        <span className="note">nel box {pasti}</span>
                        <span className="note">obiettivo {obiettivo}</span>
                      </div>
                      {/* 'over' e' il segnale gia in sistema per lo sforo: senza, la barra
                          resta piena e 22 pasti su una taglia da 15 leggono come 15 su 15.
                          Il max segue il valore, altrimenti l'ARIA dichiara 22 su 15. */}
                      <div
                        className={`bar-track ${pasti > obiettivo ? "over" : ""}`}
                        role="meter"
                        aria-valuenow={pasti}
                        aria-valuemin={0}
                        aria-valuemax={Math.max(obiettivo, pasti)}
                        aria-label={`${pastiLabel(pasti)} su una taglia da ${obiettivo}`}
                      >
                        <i style={{ ["--fx" as string]: avanzamento }} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-[74px] w-full animate-pulse rounded-[14px] bg-[rgba(201,224,205,.05)]" />
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- formula ---------------- */}
      <section className="py-[118px]">
        <div className="wrap">
          <Reveal>
            <SectionHead
              occhiello="Passo 02 / formula"
              titolo={
                <>
                  Una volta sola
                  <br />o ogni settimana
                </>
              }
              testo="Stessa cucina, stessi piatti. Cambia solo quanto spesso il furgone passa da te e quanto paghi."
            />
          </Reveal>

          <Reveal delay={90}>
            <fieldset className="m-0 border-0 p-0">
              <legend className="sr-only">Scegli la formula</legend>
              <div className="grid items-stretch gap-6 md:grid-cols-2 md:gap-7">
                <CardFormula
                  id="formula-singolo"
                  occhiello="senza impegno"
                  titolo="Ordine singolo"
                  testo="Paghi questo box e basta. Nessun rinnovo, nessuna carta salvata: se ti trovi bene torni quando vuoi."
                  vantaggi={[
                    "Prezzo pieno della taglia, sconto volume incluso",
                    "Nessun rinnovo automatico da ricordarsi",
                    "Consegna gratis dai 10 pasti in su",
                  ]}
                  scelta={pronto && formula === "singolo"}
                  giro="md:rotate-[-1.2deg]"
                  onScegli={() => setFormula("singolo")}
                  prezzo={
                    pronto && pasti > 0 ? (
                      <>
                        <span
                          className="font-mono text-[15px] text-white"
                          style={{ fontVariationSettings: '"wdth" 84' }}
                        >
                          {euro(contoSingolo.totale)}
                        </span>
                        <span className="note">questa consegna</span>
                      </>
                    ) : (
                      <span className="note">il prezzo compare quando aggiungi i pasti</span>
                    )
                  }
                />

                <CardFormula
                  id="formula-abbonamento"
                  occhiello="ogni settimana"
                  titolo={`Abbonamento −${PERC_ABBONAMENTO}%`}
                  testo="Il box arriva ogni settimana, sempre lo stesso giorno. Lo modifichi fino a 48 ore prima della cottura."
                  vantaggi={[
                    `Sconto del ${PERC_ABBONAMENTO}% su ogni consegna, sopra allo sconto di volume`,
                    "Salti o metti in pausa una settimana quando vuoi",
                    "Disdici quando vuoi, senza penali e senza telefonate",
                    "Priorita sugli slot di consegna, anche il sabato",
                  ]}
                  scelta={pronto && formula === "abbonamento"}
                  giro="md:rotate-[1.1deg] md:-translate-y-4"
                  onScegli={() => setFormula("abbonamento")}
                  prezzo={
                    pronto && pasti > 0 ? (
                      <>
                        <span
                          className="font-mono text-[15px] text-lime"
                          style={{ fontVariationSettings: '"wdth" 84' }}
                        >
                          {euro(contoAbbonamento.totale)}
                        </span>
                        <span className="note">
                          a consegna / {euro(contoSingolo.totale - contoAbbonamento.totale)} in meno
                        </span>
                      </>
                    ) : (
                      <span className="note">il prezzo compare quando aggiungi i pasti</span>
                    )
                  }
                />
              </div>
            </fieldset>
          </Reveal>
        </div>
      </section>

      {/* ---------------- il box + riepilogo ---------------- */}
      <section className="py-[130px]">
        <div className="wrap">
          <Reveal>
            <SectionHead
              occhiello="Passo 03 / dentro il box"
              titolo={
                <>
                  Cosa mangi
                  <br />questa settimana
                </>
              }
              azione={
                pronto && pasti > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!confermaSvuota) {
                        setConfermaSvuota(true);
                        return;
                      }
                      svuota();
                      setConfermaSvuota(false);
                    }}
                    /* I margini negativi allargano l'area toccabile a ~40px senza
                       spostare di un pixel la riga: 11px di testo non sono un bersaglio. */
                    className="note -mx-4 -my-3 rounded-full px-4 py-3 transition-colors duration-400 ease-[var(--e-out)] hover:text-lime"
                    style={{ color: confermaSvuota ? "var(--color-lime)" : undefined }}
                  >
                    {confermaSvuota ? "sicuro? tocca di nuovo" : "svuota il box"}
                  </button>
                ) : undefined
              }
            />
          </Reveal>

          <div className="grid grid-cols-[minmax(0,1fr)] gap-11 lg:grid-cols-[minmax(0,1fr)_384px] lg:gap-[52px]">
            <div>
              <Reveal>
                {!pronto ? (
                  <div className="shell" aria-hidden="true">
                    <div className="core animate-pulse p-7">
                      <div className="flex flex-col gap-6">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="flex items-center gap-5">
                            <div className="h-[62px] w-[62px] flex-none rounded-[14px] bg-[rgba(201,224,205,.07)]" />
                            <div className="min-w-0 flex-1">
                              <div className="h-[13px] w-3/5 rounded-full bg-[rgba(201,224,205,.07)]" />
                              <div className="mt-3 h-[10px] w-2/5 rounded-full bg-[rgba(201,224,205,.05)]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : pasti === 0 ? (
                  <StatoVuoto />
                ) : (
                  <div className="shell">
                    <ul className="core">
                      {linee.map((l) => {
                        const d = getDish(l.dishId);
                        if (!d) return null;
                        return <RigaPiatto key={l.dishId} dish={d} qta={l.qta} />;
                      })}
                    </ul>
                  </div>
                )}
              </Reveal>

              {pronto && pasti > 0 ? (
                <Reveal delay={90}>
                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <Link href="/menu" className="btn btn-s btn-sm">
                      Aggiungi altri piatti
                      <span className="dot" aria-hidden="true">
                        +
                      </span>
                    </Link>
                    <p className="note">
                      {pastiLabel(pasti)} nel box / massimo 20 porzioni per piatto
                    </p>
                  </div>
                </Reveal>
              ) : null}
            </div>

            {/* Il pannello resta agganciato mentre la lista scorre: il conto va visto
                nello stesso momento in cui si cambia il box, non dopo. */}
            <aside>
              <div className={AGGANCIO}>
                <Reveal delay={120}>
                  <Riepilogo />
                </Reveal>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ---------------- rimando alla scheda ---------------- */}
      <section className="pb-[150px]">
        <div className="wrap">
          <Reveal>
            <div className="shell">
              <div className="core grid md:grid-cols-[268px_minmax(0,1fr)]">
                <figure className="relative min-h-[190px] bg-ink-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={foto("photo-1466637574441-749b8f19452f", 700)}
                    alt="Uova, avocado e pomodori su un tagliere, ingredienti pesati"
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </figure>
                <div className="flex flex-col justify-center p-8 sm:p-11">
                  <h2 className="h3">Non sai cosa scegliere?</h2>
                  <p className="mt-4 max-w-[520px] text-[15px] leading-relaxed text-mist-dim">
                    Carica la scheda del tuo nutrizionista: il matcher legge i tuoi
                    target e compone il box al posto tuo, piatto per piatto, restando
                    dentro il 10% su ogni macro. Poi lo correggi come vuoi.
                  </p>
                  <div className="mt-8">
                    <Link href="/scheda" className="btn btn-p">
                      Carica la tua scheda
                      <span className="dot" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
