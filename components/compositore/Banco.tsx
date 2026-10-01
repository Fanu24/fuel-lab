"use client";

import Image from "next/image";
import { useEffect, useState, type PointerEvent as PointerEventReact } from "react";
import { PIATTI } from "@/lib/catalogo";
import TagAllenamento from "@/components/ui/TagAllenamento";
import type { Presa, Stato } from "./useTrascina";

/**
 * Il banco: i sei piatti, da prendere e posare nella settimana.
 * E' anche il posto dove si riporta un piatto per toglierlo dalla griglia.
 *
 * I piatti che Matteo questa settimana non cucina restano al loro posto, in
 * grigio, ma non si prendono ne' si scelgono: toccarli spiega il perche'.
 * Toccarli mentre si tiene una casella la toglie comunque, come il resto del banco.
 */
export default function Banco({
  stato,
  inizia,
  tocca,
  destinazione,
  esclusi = [],
  annuncia,
}: {
  stato: Stato;
  inizia: (p: Presa) => (e: PointerEventReact) => void;
  tocca: (piattoId: string) => void;
  destinazione?: string;
  /** Id dei piatti non disponibili questa settimana. */
  esclusi?: readonly string[];
  annuncia: (testo: string) => void;
}) {
  const tengoSlot = stato.modo === "presa" && stato.presa.tipo === "slot";
  const tengoPiatto = stato.modo === "presa" && stato.presa.tipo === "banco";
  const sopra = stato.modo === "presa" && stato.trascino && stato.sopra === "banco";
  const cerca = stato.modo === "cerca";
  const [spiega, setSpiega] = useState(false);

  // La spiegazione resta qualche secondo, poi il banco torna a dire cosa fare.
  useEffect(() => {
    if (!spiega) return;
    const t = window.setTimeout(() => setSpiega(false), 4000);
    return () => window.clearTimeout(t);
  }, [spiega]);

  function toccaEscluso(id: string, nome: string) {
    if (tengoSlot) {
      tocca(id);
      return;
    }
    setSpiega(true);
    annuncia(`${nome} non è disponibile questa settimana: scegline un altro.`);
  }

  return (
    <div
      data-banco
      className={`banco ${tengoSlot ? "banco-togli" : ""} ${sopra ? "is-sopra" : ""} ${cerca ? "banco-cerca" : ""}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-disp text-sm font-bold tracking-[.18em] uppercase">Il banco</h3>
        <p className={`text-right text-xs ${spiega && !tengoSlot ? "font-semibold text-ink" : "text-muted"}`}>
          {tengoSlot ? (
            "Riporta qui per togliere"
          ) : spiega ? (
            "Non disponibile questa settimana"
          ) : cerca ? (
            `Scegli per ${destinazione ?? "questa casella"}`
          ) : tengoPiatto ? (
            stato.trascino ? "Lascialo su una casella" : "Ora tocca una casella"
          ) : (
            <>
              {/* col dito non si trascina (serve a scorrere): l'istruzione e' un'altra */}
              <span className="solo-mouse">Trascina o tocca</span>
              <span className="solo-tocco">Tocca un piatto, poi una casella</span>
            </>
          )}
        </p>
      </div>
      <ul className="banco-lista mt-3">
        {PIATTI.map((p) => {
          const escluso = esclusi.includes(p.id);
          const preso = stato.modo === "presa" && stato.presa.tipo === "banco" && stato.presa.piattoId === p.id;
          return (
            <li key={p.id}>
              <button
                type="button"
                className={`piatto-banco ${preso ? "is-preso" : ""} ${escluso ? "is-escluso" : ""}`}
                aria-pressed={escluso ? undefined : preso}
                aria-disabled={escluso || undefined}
                aria-label={escluso ? `${p.nome}: non disponibile questa settimana` : undefined}
                onPointerDown={escluso ? undefined : inizia({ tipo: "banco", piattoId: p.id })}
                onClick={() => (escluso ? toccaEscluso(p.id, p.nome) : tocca(p.id))}
              >
                <span className="relative block aspect-square w-14 shrink-0 overflow-hidden bg-paper-2">
                  <Image src={p.img} alt="" fill sizes="56px" loading="eager" draggable={false} className="object-cover" />
                </span>
                <span className="min-w-0 text-left">
                  <span className="piatto-banco-nome">{p.nome}</span>
                  <span className="mt-1 flex items-center gap-2">
                    {escluso ? (
                      <span className="piatto-banco-nd">Non disponibile</span>
                    ) : (
                      <>
                        <TagAllenamento tipo={p.allenamento} breve className="!h-5 !px-1.5 !text-[11px] !tracking-[.06em]" />
                        <span className="num whitespace-nowrap text-xs text-muted">{p.kcal} kcal</span>
                      </>
                    )}
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
