"use client";

import Image from "next/image";
import type { PointerEvent as PointerEventReact } from "react";
import { PIATTI } from "@/lib/catalogo";
import TagAllenamento from "@/components/ui/TagAllenamento";
import type { Presa, Stato } from "./useTrascina";

/**
 * Il banco: i sei piatti, da prendere e posare nella settimana.
 * E' anche il posto dove si riporta un piatto per toglierlo dalla griglia.
 */
export default function Banco({
  stato,
  inizia,
  tocca,
}: {
  stato: Stato;
  inizia: (p: Presa) => (e: PointerEventReact) => void;
  tocca: (piattoId: string) => void;
}) {
  const tengoSlot = stato.modo === "presa" && stato.presa.tipo === "slot";
  const sopra = stato.modo === "presa" && stato.trascino && stato.sopra === "banco";
  const cerca = stato.modo === "cerca";

  return (
    <div
      data-banco
      className={`banco ${tengoSlot ? "banco-togli" : ""} ${sopra ? "is-sopra" : ""} ${cerca ? "banco-cerca" : ""}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-disp text-sm font-bold tracking-[.18em] uppercase">Il banco</h2>
        <p className="text-xs text-muted">
          {tengoSlot ? "Riporta qui per togliere" : cerca ? "Tocca un piatto" : "Trascina o tocca"}
        </p>
      </div>
      <ul className="banco-lista mt-3">
        {PIATTI.map((p) => {
          const preso = stato.modo === "presa" && stato.presa.tipo === "banco" && stato.presa.piattoId === p.id;
          return (
            <li key={p.id}>
              <button
                type="button"
                className={`piatto-banco ${preso ? "is-preso" : ""}`}
                aria-pressed={preso}
                onPointerDown={inizia({ tipo: "banco", piattoId: p.id })}
                onClick={() => tocca(p.id)}
              >
                <span className="relative block aspect-square w-14 shrink-0 overflow-hidden bg-paper-2">
                  <Image src={p.img} alt="" fill sizes="56px" loading="eager" draggable={false} className="object-cover" />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block truncate text-sm font-semibold">{p.nome}</span>
                  <span className="mt-1 flex items-center gap-2">
                    <TagAllenamento tipo={p.allenamento} breve className="!h-5 !px-1.5 !text-[9px]" />
                    <span className="num text-xs text-muted">{p.kcal} kcal</span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
