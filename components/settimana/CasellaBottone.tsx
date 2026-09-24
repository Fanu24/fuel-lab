"use client";

import { getPiatto, getExtra } from "@/lib/catalogo";
import type { Extra, Piatto } from "@/lib/catalogo";
import { NOMI_GIORNO, macroCasella } from "@/lib/settimana";
import type { Casella, GiornoSettimana, Pasto } from "@/lib/settimana";

export const NOMI_PASTO: Record<Pasto, string> = {
  pranzo: "Pranzo",
  cena: "Cena",
};

export interface CasellaAperta {
  giorno: GiornoSettimana;
  pasto: Pasto;
}

export type ApriCasella = (
  giorno: GiornoSettimana,
  pasto: Pasto,
  da: HTMLElement,
) => void;

function contenutoCasella(c: Casella | undefined): {
  piatto?: Piatto;
  extra: Extra[];
} {
  const piatto = c?.piatto ? getPiatto(c.piatto) : undefined;
  const extra = (c?.extra ?? [])
    .map((id) => getExtra(id))
    .filter((e): e is Extra => e !== undefined);
  return { piatto, extra };
}

export default function CasellaBottone({
  giorno,
  pasto,
  casella,
  variante,
  aperta,
  onApri,
}: {
  giorno: GiornoSettimana;
  pasto: Pasto;
  casella: Casella | undefined;
  variante: "griglia" | "riga";
  aperta: boolean;
  onApri: ApriCasella;
}) {
  const { piatto, extra } = contenutoCasella(casella);
  const macro = macroCasella(casella);
  const vuota = !piatto && extra.length === 0;
  const riga = variante === "riga";

  const dettaglio = vuota
    ? "casella vuota. Aggiungi un piatto o un'aggiunta"
    : [
        piatto ? piatto.nome : null,
        extra.length > 0
          ? `${extra.length} aggiunte: ${extra.map((e) => e.nome).join(", ")}`
          : null,
        `${macro.kcal} kcal. Modifica`,
      ]
        .filter((x): x is string => x !== null)
        .join(", ");

  const forma = riga
    ? "min-h-[72px] p-3.5 sm:p-5"
    : "min-h-[112px] p-2 xl:min-h-[132px] xl:p-3";

  return (
    <button
      type="button"
      data-casella={`${giorno}-${pasto}`}
      aria-haspopup="dialog"
      aria-expanded={aperta}
      aria-label={`${NOMI_GIORNO[giorno]}, ${NOMI_PASTO[pasto].toLowerCase()}: ${dettaglio}`}
      onClick={(e) => onApri(giorno, pasto, e.currentTarget)}
      className={`cell ${vuota ? "cell-empty" : "cell-full"} ${forma}`}
    >
      {vuota ? (
        <>
          <span aria-hidden="true" className="text-[26px] leading-none font-medium">
            +
          </span>
          {riga ? (
            <span className="mt-2 text-[12px] font-semibold tracking-[.02em]">
              Aggiungi {NOMI_PASTO[pasto].toLowerCase()}
            </span>
          ) : null}
        </>
      ) : riga ? (
        <>
          <span className="flex w-full items-start justify-between gap-3 sm:justify-start sm:gap-8">
            <span className="flex min-w-0 flex-col gap-1.5">
              {piatto ? <span className="cell-d text-[14px]">{piatto.nome}</span> : null}
              {!piatto ? <span className="cell-d text-[14px]">Solo aggiunte</span> : null}
            </span>
            <span className="mono shrink-0 text-[12px] font-medium text-muted">
              {macro.kcal} kcal
            </span>
          </span>
          {extra.length > 0 ? (
            <span className="mt-3 flex flex-wrap gap-1.5">
              {extra.map((e) => (
                <span key={e.id} className="chip">
                  {e.nome}
                </span>
              ))}
            </span>
          ) : null}
          <span className="mono mt-3 text-[12px] font-medium text-muted">
            P {macro.proteine} · C {macro.carboidrati} · G {macro.grassi}
          </span>
        </>
      ) : (
        <>
          {piatto ? (
            <span className="cell-d hyphens-auto break-words text-[13px] xl:text-[14px]">
              {piatto.nome}
            </span>
          ) : (
            <span className="cell-d text-[13px] xl:text-[14px]">Solo aggiunte</span>
          )}
          <span className="cell-k flex items-center justify-between gap-2">
            <span>{macro.kcal} kcal</span>
            {extra.length > 0 ? (
              <span
                className="flex shrink-0 gap-[3px]"
                aria-hidden="true"
                title={extra.map((e) => e.nome).join(", ")}
              >
                {extra.map((e) => (
                  <i key={e.id} className="block h-[6px] w-[6px] rounded-full bg-ink" />
                ))}
              </span>
            ) : null}
          </span>
        </>
      )}
    </button>
  );
}
