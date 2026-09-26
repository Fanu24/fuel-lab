"use client";

import Image from "next/image";
import type { KeyboardEvent, PointerEvent as PointerEventReact } from "react";
import { getPiatto } from "@/lib/catalogo";
import type { Casella, Slot as TSlot } from "@/lib/settimana";
import { chiaveSlot, type Presa, type Stato } from "./useTrascina";

/**
 * Una casella della settimana. E' un bersaglio (data-slot) e, se piena, anche
 * una cosa da prendere: la si trascina su un'altra casella per spostarla (o
 * scambiarla), sul banco per toglierla.
 *
 * I due bottoni piccoli (aggiunte e togli) sono fratelli del bottone grande,
 * non figli: un bottone dentro un bottone non e' HTML valido e gli screen
 * reader lo leggono come un pezzo solo.
 */
export default function Slot({
  slot,
  etichetta,
  casella,
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
  stato: Stato;
  inizia: (p: Presa) => (e: PointerEventReact) => void;
  toccaSlot: (s: TSlot, piena: boolean) => void;
  togli: (s: TSlot) => void;
  apriExtra: (s: TSlot) => void;
}) {
  const k = chiaveSlot(slot);
  const piatto = casella?.piatto ? getPiatto(casella.piatto) : undefined;
  const nExtra = casella?.extra.length ?? 0;

  const presa = stato.modo === "presa" ? stato.presa : null;
  const tenuta = presa?.tipo === "slot" && chiaveSlot(presa.slot) === k;
  const bersaglio = !!presa && !tenuta;
  const sopra = stato.modo === "presa" && stato.trascino && stato.sopra === k;
  const cercata = stato.modo === "cerca" && chiaveSlot(stato.slot) === k;

  function tasto(e: KeyboardEvent) {
    if ((e.key === "Delete" || e.key === "Backspace") && piatto) {
      e.preventDefault();
      togli(slot);
    }
  }

  const classi = [
    "slot",
    piatto ? "is-piena" : "is-vuota",
    bersaglio ? "is-bersaglio" : "",
    sopra ? "is-sopra" : "",
    tenuta ? "is-tenuta" : "",
    cercata ? "is-cercata" : "",
  ].join(" ");

  return (
    <div data-slot={k} className={classi}>
      <button
        type="button"
        className="slot-corpo"
        aria-label={
          piatto
            ? `${etichetta}: ${piatto.nome}${nExtra ? `, ${nExtra} aggiunte` : ""}. Invio per spostarlo, Canc per toglierlo.`
            : `${etichetta}: vuota. Invio per scegliere un piatto.`
        }
        aria-pressed={tenuta || cercata}
        onPointerDown={piatto ? inizia({ tipo: "slot", slot }) : undefined}
        onClick={() => toccaSlot(slot, !!piatto)}
        onKeyDown={tasto}
      >
        {piatto ? (
          <>
            <span className="slot-foto">
              <Image src={piatto.img} alt="" fill sizes="(min-width: 1024px) 140px, 96px" draggable={false} className="object-cover" />
            </span>
            <span className="slot-testo">
              <span className="slot-nome">{piatto.nome}</span>
              <span className="num text-[11px] text-muted">{piatto.kcal} kcal · {piatto.proteine}P</span>
            </span>
          </>
        ) : (
          <span className="slot-vuota" aria-hidden="true">
            {bersaglio ? "Posa qui" : cercata ? "Scegli dal banco" : "+"}
          </span>
        )}
      </button>

      {piatto ? (
        <span className="slot-azioni">
          <button type="button" onClick={() => apriExtra(slot)} aria-label={`Aggiunte per ${etichetta}`}>
            {nExtra ? <span className="num">+{nExtra}</span> : "+"}
          </button>
          <button type="button" onClick={() => togli(slot)} aria-label={`Togli il piatto di ${etichetta}`}>
            ×
          </button>
        </span>
      ) : null}
    </div>
  );
}
