"use client";

import { dishImg } from "@/lib/dishes";
import { useCart } from "@/lib/cart";
import type { Dish } from "@/lib/types";
import { MacroSplit } from "./MacroBar";
import { Chip } from "./ui";

function Stepper({ dish }: { dish: Dish }) {
  const { quantita, aggiungi, imposta, pronto } = useCart();
  const q = pronto ? quantita(dish.id) : 0;

  if (q === 0) {
    return (
      <button type="button" className="btn btn-s btn-sm" onClick={() => aggiungi(dish.id)}>
        Aggiungi
        <span className="dot" aria-hidden="true">
          +
        </span>
      </button>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border p-1"
      style={{ borderColor: "var(--hair)", background: "rgba(223,255,62,.08)" }}
    >
      <button
        type="button"
        onClick={() => imposta(dish.id, q - 1)}
        aria-label={`Togli una porzione di ${dish.nome}`}
        className="grid h-7 w-7 place-items-center rounded-full text-lime transition-colors duration-300 hover:bg-lime hover:text-ink"
      >
        −
      </button>
      <span
        className="min-w-6 text-center font-mono text-[13px] text-white"
        aria-live="polite"
        style={{ fontVariationSettings: '"wdth" 84' }}
      >
        {q}
      </span>
      <button
        type="button"
        onClick={() => aggiungi(dish.id)}
        aria-label={`Aggiungi una porzione di ${dish.nome}`}
        className="grid h-7 w-7 place-items-center rounded-full text-lime transition-colors duration-300 hover:bg-lime hover:text-ink"
      >
        +
      </button>
    </div>
  );
}

export default function DishCard({
  dish,
  variante = "griglia",
}: {
  dish: Dish;
  variante?: "griglia" | "riga" | "vetrina";
}) {
  const riga = variante === "riga";
  const vetrina = variante === "vetrina";

  return (
    <article className="shell group h-full transition-[transform,box-shadow] duration-700 hover:-translate-y-2.5" style={{ transitionTimingFunction: "var(--e-over)" }}>
      <div className={`core h-full ${riga ? "grid grid-cols-[132px_1fr] sm:grid-cols-[172px_1fr]" : "flex flex-col"}`}>
        <figure className={`relative overflow-hidden bg-ink-2 ${riga ? "h-full" : vetrina ? "aspect-[16/8.2]" : "aspect-[16/10]"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dishImg(dish, vetrina ? 1000 : riga ? 420 : 720)}
            alt={dish.nome}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.06]"
            style={{ transitionTimingFunction: "var(--e-out)" }}
          />
        </figure>

        <div className={`flex flex-1 flex-col ${riga ? "p-6" : vetrina ? "p-[30px]" : "p-6"}`}>
          <h3 className={`h3 ${vetrina ? "" : riga ? "!text-[25px]" : "!text-[27px]"}`}>{dish.nome}</h3>

          {!riga && <p className="mt-3 text-[14px] leading-relaxed text-mist-dim">{dish.descrizione}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <Chip>{dish.grammi} g</Chip>
            <Chip accento>{dish.kcal} kcal</Chip>
            <Chip>{dish.giorno === "lunedi" ? "cotto lun" : "cotto gio"}</Chip>
          </div>

          <div className="mt-auto pt-[18px]">
            <MacroSplit
              proteine={dish.proteine}
              carboidrati={dish.carboidrati}
              grassi={dish.grassi}
              className="mb-3"
            />
            <div
              className="flex items-center justify-between gap-3 border-t pt-[15px]"
              style={{ borderColor: "var(--hair-soft)" }}
            >
              <p
                className="font-mono text-[12.5px] tracking-[.05em] text-white"
                style={{ fontVariationSettings: '"wdth" 82' }}
              >
                P {dish.proteine} <em className="not-italic text-mist-dim">/</em> C {dish.carboidrati}{" "}
                <em className="not-italic text-mist-dim">/</em> G {dish.grassi}
              </p>
              <Stepper dish={dish} />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
