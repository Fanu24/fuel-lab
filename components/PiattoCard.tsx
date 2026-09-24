"use client";

import { useEffect, useState } from "react";
import type { Piatto } from "@/lib/catalogo";
import { etichettaAllenamento, piattoImg } from "@/lib/catalogo";
import { usePiano } from "@/lib/piano";
import type { GiornoSettimana, Pasto } from "@/lib/settimana";
import { MacroAnimate } from "./MacroBar";
import ToppingPicker from "./ToppingPicker";

type Stato = "pronto" | "aggiunto" | "pieno";

export default function PiattoCard({
  piatto,
  anteprima = false,
}: {
  piatto: Piatto;
  anteprima?: boolean;
}) {
  const { metti, primaLibera, pronto, impostaExtra, casella } = usePiano();
  const [stato, setStato] = useState<Stato>("pronto");
  const [annuncio, setAnnuncio] = useState("");
  const [slot, setSlot] = useState<{ g: GiornoSettimana; m: Pasto } | null>(null);
  const [scelti, setScelti] = useState<string[]>([]);
  const [toppingAperto, setToppingAperto] = useState(false);
  const [schedaAperta, setSchedaAperta] = useState(false);

  useEffect(() => {
    if (stato !== "aggiunto") return;
    const id = setTimeout(() => setStato("pronto"), 1800);
    return () => clearTimeout(id);
  }, [stato]);

  const selezionati = slot ? (casella(slot.g, slot.m)?.extra ?? []) : scelti;

  function commutaTopping(id: string) {
    if (slot) {
      const on = !(casella(slot.g, slot.m)?.extra.includes(id) ?? false);
      impostaExtra(slot.g, slot.m, id, on);
      return;
    }
    setScelti((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  }

  const aggiungi = () => {
    const prossimo = primaLibera();
    if (!prossimo) {
      setStato("pieno");
      setAnnuncio(`Settimana piena: non c'è posto per ${piatto.nome}.`);
      return;
    }
    metti(prossimo.g, prossimo.m, piatto.id);
    for (const id of scelti) impostaExtra(prossimo.g, prossimo.m, id, true);
    setSlot(prossimo);
    setToppingAperto(true);
    setStato("aggiunto");
    setAnnuncio(`${piatto.nome} aggiunto alla settimana. Puoi aggiungere gli alimenti della box.`);
  };

  const puntinoBottone = stato === "aggiunto" ? "✓" : stato === "pieno" ? "!" : "+";
  const etichettaAccessibile =
    stato === "aggiunto"
      ? `${piatto.nome} aggiunto alla settimana`
      : stato === "pieno"
        ? `Settimana piena, non è stato possibile aggiungere ${piatto.nome}`
        : `Aggiungi ${piatto.nome} alla settimana`;

  return (
    <article
      className="shell group h-full transition-[transform,box-shadow] duration-700 hover:-translate-y-2"
      style={{ transitionTimingFunction: "var(--e-over)" }}
    >
      <div className="core flex h-full flex-col">
        <figure className="foto-profondita relative aspect-[4/3] overflow-hidden bg-tray md:aspect-[16/10]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={piattoImg(piatto, 720)}
            alt={piatto.nome}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.06]"
            style={{ transitionTimingFunction: "var(--e-out)" }}
          />
          <span className="chip chip-k absolute top-2.5 left-2.5 uppercase md:top-4 md:left-4">
            {etichettaAllenamento(piatto.allenamento)}
          </span>

          {anteprima ? null : (
            <>
              <button
                type="button"
                className="btn-tondo absolute right-2.5 bottom-2.5 md:right-4 md:bottom-4"
                onClick={aggiungi}
                disabled={!pronto}
                data-stato={stato}
                aria-label={etichettaAccessibile}
              >
                <span aria-hidden="true">{puntinoBottone}</span>
              </button>
              <span role="status" aria-live="polite" className="sr-only">
                {annuncio}
              </span>
            </>
          )}
        </figure>

        <div className="flex flex-1 flex-col p-4 sm:p-5 md:p-6">
          <h3 className="h3 !text-[17px] !leading-[1.14] sm:!text-[19px] md:!text-[22px]">
            {piatto.nome}
          </h3>

          <p className="mt-2.5 text-[15px] leading-[1.45] text-muted md:text-[16px]">
            {piatto.motivo}
          </p>

          <p className="note mt-3 md:mt-3.5">
            {piatto.grammi} g &middot; {piatto.kcal} kcal &middot;{" "}
            {piatto.giorno === "lunedi" ? "cotto lun" : "cotto gio"}
          </p>

          <div className="mt-3 md:mt-4">
            <MacroAnimate elemento={piatto} />
          </div>

          <p className="note mt-auto pt-4 leading-[1.45]">
            Allergeni: {piatto.allergeni.length > 0 ? piatto.allergeni.join(", ") : "nessuno"}
          </p>

          {stato === "pieno" ? (
            <p className="note mt-2" style={{ color: "#C02626" }}>
              Settimana piena
            </p>
          ) : null}

          <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--hair-soft)" }}>
            <button
              type="button"
              className="note flex min-h-[44px] w-full items-center justify-between gap-2"
              aria-expanded={schedaAperta}
              onClick={() => setSchedaAperta((v) => !v)}
            >
              <span>Scheda nutrizionale e ingredienti</span>
              <span aria-hidden="true">{schedaAperta ? "−" : "+"}</span>
            </button>
            {schedaAperta ? (
              <ul className="mt-2.5 flex flex-col gap-1.5">
                  {piatto.ingredienti.map((ing) => (
                    <li
                      key={ing.nome}
                      className="flex justify-between gap-3 font-mono text-[14px] leading-snug text-ink"
                    >
                      <span>{ing.nome}</span>
                      <span className="shrink-0 text-muted">
                        {ing.grammi != null ? `${ing.grammi} g` : ing.nota ?? ""}
                      </span>
                    </li>
                  ))}
                </ul>
            ) : null}
          </div>

          {anteprima ? null : (
            <div
              className={`mt-3 border-t pt-3 ${toppingAperto || slot || selezionati.length > 0 ? "" : "max-md:hidden"}`}
              style={{ borderColor: "var(--hair-soft)" }}
            >
              <button
                type="button"
                className="note flex min-h-[44px] w-full items-center justify-between gap-2"
                aria-expanded={toppingAperto}
                onClick={() => setToppingAperto((v) => !v)}
              >
                <span className="min-w-0">
                  <span className="sm:hidden">Aggiunte</span>
                  <span className="hidden sm:inline">Aggiunte di questa box</span>
                </span>
                <span aria-hidden="true">{toppingAperto ? "−" : "+"}</span>
              </button>
              {toppingAperto ? (
                <div className="mt-2.5">
                  <ToppingPicker
                    selezionati={selezionati}
                    onToggle={commutaTopping}
                    disabilitato={!pronto}
                    compatto
                  />
                  {slot ? null : (
                    <p className="note mt-2 !normal-case !tracking-normal">
                      Si aggiungono insieme al piatto, nella stessa casella.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
