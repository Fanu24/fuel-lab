"use client";

import { getElemento, getExtra } from "@/lib/catalogo";
import type { Elemento, Extra } from "@/lib/catalogo";
import { NOMI_GIORNO, macroCasella } from "@/lib/settimana";
import type { Casella, GiornoSettimana, Pasto } from "@/lib/settimana";

/* =========================================================================
   La casella: lo stesso bottone nelle due viste.

   La griglia (da md in su) e la card del giorno (sotto md) sono due layout
   diversi, non lo stesso layout a due larghezze - ma la casella dentro e' lo
   stesso oggetto e deve comportarsi allo stesso modo: stesso stato pieno/vuoto,
   stessa etichetta per chi legge con lo screen reader, stesso modo di aprire il
   selettore. Tenerla in un file solo e' cio' che impedisce alle due viste di
   divergere in silenzio quando una delle due viene ritoccata.

   Cambia solo la DENSITA': nella griglia lo spazio e' quello di una colonna su
   sette, quindi gli extra sono pallini; nella card del giorno c'e' la larghezza
   piena e gli extra si leggono per nome.
   ========================================================================= */

/** I due pasti in chiaro. Il dominio ha le sigle, l'interfaccia ha le parole. */
export const NOMI_PASTO: Record<Pasto, string> = { pranzo: "Pranzo", cena: "Cena" };

export interface CasellaAperta {
  giorno: GiornoSettimana;
  pasto: Pasto;
}

/**
 * Il nodo che ha aperto il selettore viaggia insieme alle coordinate: alla
 * chiusura il focus deve tornare LI', non in cima alla pagina. Chi naviga da
 * tastiera altrimenti perde il posto a ogni casella riempita.
 */
export type ApriCasella = (giorno: GiornoSettimana, pasto: Pasto, da: HTMLElement) => void;

/** Gli oggetti veri dietro gli id. Gli id spariti dal catalogo si scartano. */
function contenutoCasella(c: Casella | undefined): {
  primo?: Elemento;
  secondo?: Elemento;
  extra: Extra[];
} {
  const primo = c?.primo ? getElemento(c.primo) : undefined;
  const secondo = c?.secondo ? getElemento(c.secondo) : undefined;
  const extra = (c?.extra ?? [])
    .map((id) => getExtra(id))
    .filter((e): e is Extra => e !== undefined);
  return { primo, secondo, extra };
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
  const { primo, secondo, extra } = contenutoCasella(casella);
  const macro = macroCasella(casella);
  const vuota = !primo && !secondo && extra.length === 0;
  const riga = variante === "riga";

  // L'etichetta racconta la casella per intero: senza, uno screen reader
  // leggerebbe quattordici bottoni chiamati tutti "piu".
  const dettaglio = vuota
    ? "casella vuota. Aggiungi un primo, un secondo o un extra"
    : [
        primo ? `primo ${primo.nome}` : null,
        secondo ? `secondo ${secondo.nome}` : null,
        extra.length > 0 ? `${extra.length} extra: ${extra.map((e) => e.nome).join(", ")}` : null,
        `${macro.kcal} kcal. Modifica`,
      ]
        .filter((x): x is string => x !== null)
        .join(", ");

  const forma = riga
    ? "min-h-[92px] p-4"
    : "min-h-[112px] p-2 lg:min-h-[132px] lg:p-3";

  return (
    <button
      type="button"
      // Il gemello dell'altra vista: serve a ritrovare dove restituire il focus
      // se nel frattempo la larghezza della finestra ha cambiato vista.
      data-casella={`${giorno}-${pasto}`}
      aria-haspopup="dialog"
      aria-expanded={aperta}
      aria-label={`${NOMI_GIORNO[giorno]}, ${NOMI_PASTO[pasto].toLowerCase()}: ${dettaglio}`}
      onClick={(e) => onApri(giorno, pasto, e.currentTarget)}
      className={`cell ${vuota ? "cell-empty" : "cell-full"} ${forma}`}
    >
      {vuota ? (
        <>
          <span aria-hidden="true" className="text-[26px] leading-none font-light">
            +
          </span>
          {riga ? (
            // Sotto md c'e' la larghezza per dire cosa fa il bottone. Il colore
            // lo eredita da .cell-empty: muted sulla casella (4.75:1) e ink sul
            // lime del passaggio del mouse (12.61:1), corretti entrambi.
            <span className="mt-2 text-[12px] font-semibold tracking-[.02em]">
              Aggiungi {NOMI_PASTO[pasto].toLowerCase()}
            </span>
          ) : null}
        </>
      ) : riga ? (
        <>
          <span className="flex w-full items-start justify-between gap-3">
            <span className="flex min-w-0 flex-col gap-1.5">
              {primo ? <span className="cell-d text-[14px]">{primo.nome}</span> : null}
              {secondo ? <span className="cell-d text-[14px]">{secondo.nome}</span> : null}
            </span>
            <span className="mono shrink-0 text-[11px] font-medium text-muted">
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
          <span className="mono mt-3 text-[10px] font-medium text-muted">
            P {macro.proteine} · C {macro.carboidrati} · G {macro.grassi}
          </span>
        </>
      ) : (
        <>
          {primo ? (
            <span className="cell-d hyphens-auto break-words text-[11px] lg:text-[12.5px]">
              {primo.nome}
            </span>
          ) : null}
          {/* Casella di soli extra: senza questa riga sarebbe una casella piena
              che sembra vuota, con un numero di kcal comparso dal niente. */}
          {!primo && !secondo ? (
            <span className="cell-d text-[11px] lg:text-[12.5px]">Solo extra</span>
          ) : null}
          {secondo ? (
            <span
              className={`cell-d hyphens-auto break-words text-[11px] lg:text-[12.5px] ${
                primo ? "mt-1.5 border-t pt-1.5" : ""
              }`}
              style={primo ? { borderColor: "var(--hair-soft)" } : undefined}
            >
              {secondo.nome}
            </span>
          ) : null}
          <span className="cell-k flex items-center justify-between gap-2">
            <span>{macro.kcal} kcal</span>
            {extra.length > 0 ? (
              // Pallini a inchiostro, non lime: il lime su carta bianca sta a
              // 1.13:1, cioe' un pallino che non si vede. Il nome degli extra
              // resta nell'aria-label del bottone.
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
