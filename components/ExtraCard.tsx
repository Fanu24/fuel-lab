"use client";

import { useEffect, useState } from "react";
import type { Extra } from "@/lib/catalogo";
import { extraImg, etichettaPrezzo } from "@/lib/catalogo";
import { usePiano } from "@/lib/piano";
import { GIORNI, PASTI } from "@/lib/settimana";
import { Chip } from "./ui";
import { MacroSplit } from "./MacroBar";

/**
 * Scheda di un alimento della box.
 *
 * Un extra non apre una casella nuova: si attacca al primo piatto gia' in
 * settimana. Se quel piatto non c'e' ancora, il bottone lo dice.
 */
export default function ExtraCard({ extra }: { extra: Extra }) {
  const { casella, pronto, impostaExtra } = usePiano();
  const [stato, setStato] = useState<"pronto" | "aggiunto" | "manca" | "gia">("pronto");
  const [annuncio, setAnnuncio] = useState("");

  useEffect(() => {
    if (stato !== "aggiunto" && stato !== "gia") return;
    const id = setTimeout(() => setStato("pronto"), 1800);
    return () => clearTimeout(id);
  }, [stato]);

  function aggiungi() {
    let qualchePiatto = false;
    for (const g of GIORNI) {
      for (const m of PASTI) {
        const c = casella(g, m);
        if (!c?.piatto) continue;
        qualchePiatto = true;
        if (c.extra.includes(extra.id)) continue;
        impostaExtra(g, m, extra.id, true);
        setStato("aggiunto");
        setAnnuncio(`${extra.nome} aggiunto alla box.`);
        return;
      }
    }
    if (qualchePiatto) {
      setStato("gia");
      setAnnuncio(`${extra.nome} è già su tutti i piatti della settimana.`);
      return;
    }
    setStato("manca");
    setAnnuncio("Aggiungi prima un piatto, poi l'aggiunta.");
  }

  return (
    <article className="shell h-full">
      <div className="core flex h-full flex-col">
        <figure className="foto-profondita relative aspect-[5/4] overflow-hidden bg-tray">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={extraImg(extra, 480)}
            alt={extra.nome}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <span className="chip chip-k absolute top-2.5 left-2.5 uppercase">
            {etichettaPrezzo(extra, extra.prezzoEuro != null)}
          </span>
          <button
            type="button"
            className="btn-tondo absolute right-2.5 bottom-2.5"
            onClick={aggiungi}
            disabled={!pronto}
            data-stato={stato === "aggiunto" || stato === "gia" ? "aggiunto" : stato === "manca" ? "pieno" : undefined}
            aria-label={`Aggiungi ${extra.nome} alla box`}
          >
            <span aria-hidden="true">
              {stato === "aggiunto" || stato === "gia" ? "✓" : stato === "manca" ? "!" : "+"}
            </span>
          </button>
          <span role="status" aria-live="polite" className="sr-only">
            {annuncio}
          </span>
        </figure>
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <h3 className="h3 !text-[17px] !leading-[1.14] sm:!text-[19px]">{extra.nome}</h3>
          <p className="mt-2 text-[15px] leading-[1.45] text-muted">{extra.descrizione}</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Chip>{extra.grammi} g</Chip>
            <Chip>{extra.kcal} kcal</Chip>
          </div>
          <div className="mt-3">
            <MacroSplit proteine={extra.proteine} carboidrati={extra.carboidrati} grassi={extra.grassi} />
          </div>
          <p className="note mt-auto pt-4 leading-relaxed">
            Allergeni: {extra.allergeni.length > 0 ? extra.allergeni.join(", ") : "nessuno"}
          </p>
          {stato === "manca" || stato === "gia" ? (
            <p
              className="note mt-2 !normal-case !tracking-normal"
              style={{ color: stato === "gia" ? "var(--color-ink)" : "#C02626" }}
            >
              {stato === "gia" ? "Già su tutti i piatti" : "Aggiungi prima un piatto"}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
