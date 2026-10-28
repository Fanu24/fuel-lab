"use client";

import { useEffect, useRef } from "react";
import { REPARTI, etichettaPrezzo, extraPerReparto, getPiatto } from "@/lib/catalogo";
import { NOMI_GIORNO, usePiano } from "@/lib/piano";
import type { Slot } from "@/lib/settimana";

/**
 * Le aggiunte di una casella, in un <dialog> nativo: showModal() porta con se'
 * la trappola del fuoco, Esc per chiudere e il ritorno del fuoco al bottone
 * che l'ha aperto. Tre cose che il selettore precedente scriveva a mano.
 */
export default function FoglioExtra({ slot, chiudi }: { slot: Slot | null; chiudi: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { casella, alternaExtra } = usePiano();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (slot && !d.open) {
      d.showModal();
      // Il secondo tocco di un doppio tocco su "+" cadrebbe sul foglio appena aperto (e spunterebbe
      // una voce, o chiuderebbe lo sfondo): per un attimo il foglio non riceve tocchi.
      d.style.pointerEvents = "none";
      const t = window.setTimeout(() => (d.style.pointerEvents = ""), 350);
      return () => window.clearTimeout(t);
    }
    if (!slot && d.open) d.close();
  }, [slot]);

  const c = slot ? casella(slot.g, slot.m) : undefined;
  const piatto = c?.piatto ? getPiatto(c.piatto) : undefined;

  return (
    <dialog
      ref={ref}
      onClose={chiudi}
      onClick={(e) => {
        if (e.target === ref.current) chiudi(); // click sul fondo
      }}
      className="foglio"
      aria-labelledby="foglio-titolo"
    >
      {slot ? (
        <div className="flex max-h-[85svh] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-ink/15 p-5 md:p-7">
            <div>
              <p className="occhiello">
                {NOMI_GIORNO[slot.g]} · {slot.m}
              </p>
              <h2 id="foglio-titolo" className="titolo-s mt-3">
                {piatto ? `Aggiunte a ${piatto.nome}` : "Aggiunte"}
              </h2>
              <p className="mt-3 text-sm text-muted">Facoltative. Quantità e supplementi si confermano con Matteo.</p>
            </div>
            <button type="button" onClick={chiudi} className="grid h-11 w-11 shrink-0 place-items-center bg-ink text-xl text-paper" aria-label="Chiudi">
              ×
            </button>
          </header>
          <div className="grid gap-8 overflow-y-auto p-5 md:grid-cols-2 md:p-7">
            {REPARTI.map((r) => (
              <fieldset key={r.id}>
                <legend className="font-disp text-xs font-bold tracking-[.16em] uppercase">{r.label}</legend>
                <ul className="mt-2">
                  {extraPerReparto(r.id).map((e) => {
                    const acceso = !!c?.extra.includes(e.id);
                    return (
                      <li key={e.id}>
                        <label className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-ink/10 py-2">
                          <input
                            type="checkbox"
                            checked={acceso}
                            onChange={() => alternaExtra(slot.g, slot.m, e.id)}
                            className="h-5 w-5 accent-[#121412]"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block">{e.nome}{e.novita ? <span className="ml-2 text-xs font-semibold">· Novità</span> : null}</span>
                            {e.reparto === "snack" && e.novita ? <span className="mt-1 block text-xs text-muted">Porzione da concordare · contiene glutine e mandorle</span> : null}
                          </span>
                          <span className="num text-xs text-muted">{etichettaPrezzo(e, true)}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            ))}
          </div>
          <footer className="border-t border-ink/15 p-5 md:p-7">
            <button type="button" onClick={chiudi} className="btn btn-ink w-full sm:w-auto">
              Fatto
            </button>
          </footer>
        </div>
      ) : null}
    </dialog>
  );
}
