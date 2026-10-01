"use client";

import Image from "next/image";
import type { KeyboardEvent, PointerEvent as PointerEventReact } from "react";
import { getPiatto } from "@/lib/catalogo";
import type { Casella, Slot as TSlot } from "@/lib/settimana";
import { chiaveSlot, type Presa, type Stato } from "./useTrascina";

const PASTO: Record<string, string> = { pranzo: "Pranzo", cena: "Cena" };

/* Un doppio tocco su "×" (succede) toglie il piatto col primo e, col secondo, cadrebbe sulla
   casella appena svuotata: aprirebbe la scelta di un piatto che nessuno ha chiesto. */
const ATTESA_DOPO_TOGLI_MS = 450;
let appenaTolta: { k: string; quando: number } | null = null;

/**
 * Una casella della settimana. E' un bersaglio (data-slot) e, se piena, anche
 * una cosa da prendere: la si trascina su un'altra casella per spostarla (o
 * scambiarla), sul banco per toglierla.
 *
 * Ogni casella dice da sola se e' il pranzo o la cena: senza, chi guarda la
 * griglia deve contare le colonne per capire che mattone e' quello.
 *
 * I due bottoni piccoli (aggiunte e togli) sono fratelli del bottone grande,
 * non figli: un bottone dentro un bottone non e' HTML valido e gli screen
 * reader lo leggono come un pezzo solo.
 */
export default function Slot({
  slot,
  etichetta,
  casella,
  escluso = false,
  stato,
  inizia,
  toccaSlot,
  togli,
  apriExtra,
}: {
  slot: TSlot;
  /** "Lunedì, pranzo": per chi non vede la griglia */
  etichetta: string;
  casella: Casella | undefined;
  /** Il piatto della casella non e' disponibile questa settimana (impostazioni di Matteo). */
  escluso?: boolean;
  stato: Stato;
  inizia: (p: Presa) => (e: PointerEventReact) => void;
  toccaSlot: (s: TSlot, piena: boolean) => void;
  togli: (s: TSlot) => void;
  apriExtra: (s: TSlot) => void;
}) {
  const k = chiaveSlot(slot);
  const piatto = casella?.piatto ? getPiatto(casella.piatto) : undefined;
  const nExtra = casella?.extra.length ?? 0;
  const pasto = PASTO[slot.m];

  const presa = stato.modo === "presa" ? stato.presa : null;
  const tenuta = presa?.tipo === "slot" && chiaveSlot(presa.slot) === k;
  const bersaglio = !!presa && !tenuta;
  const sopra = stato.modo === "presa" && stato.trascino && stato.sopra === k;
  const cercata = stato.modo === "cerca" && chiaveSlot(stato.slot) === k;

  function tasto(e: KeyboardEvent) {
    if ((e.key === "Delete" || e.key === "Backspace") && piatto) {
      e.preventDefault();
      rimuovi();
    }
  }

  /** Tolto il piatto la casella si svuota e il bottone che si e' premuto sparisce: il fuoco passa alla casella, non al nulla. */
  function rimuovi() {
    appenaTolta = { k, quando: performance.now() };
    togli(slot);
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-slot="${k}"] .slot-corpo`)?.focus());
  }

  const classi = [
    "slot",
    piatto ? "is-piena" : "is-vuota",
    bersaglio ? "is-bersaglio" : "",
    sopra ? "is-sopra" : "",
    tenuta ? "is-tenuta" : "",
    cercata ? "is-cercata" : "",
    escluso ? "is-esclusa" : "",
  ].join(" ");

  return (
    <div data-slot={k} className={classi}>
      <button
        type="button"
        className="slot-corpo"
        aria-label={
          piatto
            ? `${etichetta}: ${piatto.nome}${escluso ? ", non disponibile questa settimana" : ""}${nExtra ? `, ${nExtra} ${nExtra === 1 ? "aggiunta" : "aggiunte"}` : ""}. Invio per spostarlo, Canc per toglierlo.`
            : `${etichetta}: vuota. Invio per scegliere un piatto.`
        }
        aria-pressed={tenuta || cercata}
        onPointerDown={piatto ? inizia({ tipo: "slot", slot }) : undefined}
        onClick={() => {
          if (appenaTolta?.k === k && performance.now() - appenaTolta.quando < ATTESA_DOPO_TOGLI_MS) return;
          toccaSlot(slot, !!piatto);
        }}
        onKeyDown={tasto}
      >
        {piatto ? (
          <>
            <span className="slot-foto">
              <Image src={piatto.img} alt="" fill sizes="(min-width: 1024px) 140px, 64px" draggable={false} className="object-cover" />
            </span>
            <span className="slot-testo">
              <span className="slot-pasto">{pasto}</span>
              <span className="slot-nome">{piatto.nome}</span>
              {escluso ? (
                <span className="slot-nd">Non disponibile</span>
              ) : (
                <span className="num slot-macro">
                  {piatto.kcal} kcal · {piatto.proteine}P
                </span>
              )}
            </span>
          </>
        ) : (
          <span className="slot-vuota" aria-hidden="true">
            <span className="slot-pasto">{pasto}</span>
            <span className="slot-invito">{bersaglio ? "Posa qui" : cercata ? "Scegli dal banco" : <span className="slot-piu">+</span>}</span>
          </span>
        )}
      </button>

      {piatto ? (
        <span className="slot-azioni">
          <button type="button" onClick={() => apriExtra(slot)} aria-label={`Aggiunte per ${etichetta}`} title="Aggiunte">
            {nExtra ? <span className="num">+{nExtra}</span> : "+"}
          </button>
          <button type="button" onClick={rimuovi} aria-label={`Togli il piatto di ${etichetta}`} title="Togli">
            ×
          </button>
        </span>
      ) : null}
    </div>
  );
}
