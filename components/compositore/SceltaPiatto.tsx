"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { PIATTI_MENU } from "@/lib/catalogo";
import { NOMI_GIORNO, type Slot } from "@/lib/settimana";

export default function SceltaPiatto({ slot, esclusi, scegli, chiudi }: {
  slot: Slot | null;
  esclusi: readonly string[];
  scegli: (id: string) => void;
  chiudi: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (slot && !dialog.open) dialog.showModal();
    if (!slot && dialog.open) dialog.close();
  }, [slot]);
  useEffect(() => {
    if (!slot) return;
    const prima = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prima; };
  }, [slot]);

  return (
    <dialog ref={ref} className="foglio" aria-labelledby="scegli-piatto-titolo" onClose={chiudi} onClick={(event) => { if (event.target === ref.current) chiudi(); }}>
      {slot ? <div className="flex max-h-[85svh] flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-ink/15 p-5">
          <div><p className="occhiello">{NOMI_GIORNO[slot.g]} · {slot.m}</p><h2 id="scegli-piatto-titolo" className="titolo-s mt-2">Scegli il piatto</h2></div>
          <button type="button" onClick={chiudi} className="grid h-11 w-11 shrink-0 place-items-center bg-ink text-xl text-paper" aria-label="Chiudi scelta piatto">×</button>
        </header>
        <div className="overflow-y-auto p-4 md:p-5">
          <ul className="grid gap-3">
            {PIATTI_MENU.map((piatto) => {
              const nonDisponibile = esclusi.includes(piatto.id);
              return <li key={piatto.id} className={`border border-ink/15 p-3 ${nonDisponibile ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-3">
                  <span className="relative block h-16 w-16 shrink-0 overflow-hidden bg-paper-2"><Image src={piatto.img} alt="" fill sizes="64px" className="object-cover" /></span>
                  <div className="min-w-0 flex-1">{piatto.novita ? <span className="text-xs font-semibold text-muted">Novità</span> : null}<h3 className="font-semibold leading-snug">{piatto.nome}</h3><p className="mt-1 text-xs text-muted">Allergeni: {piatto.allergeniDaConfermare ? "da confermare con Matteo" : piatto.allergeni.length ? piatto.allergeni.join(", ") : "chiedi a Matteo"}.</p></div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <Link href={`/menu/${piatto.id}`} target="_blank" rel="noopener noreferrer" className="link min-h-11 content-center text-sm" aria-label={`Ingredienti di ${piatto.nome}, nuova scheda`}>Ingredienti</Link>
                  <button type="button" className="btn btn-ink btn-sm" disabled={nonDisponibile} onClick={() => scegli(piatto.id)} aria-label={nonDisponibile ? `${piatto.nome} non disponibile` : `Scegli ${piatto.nome}`}>{nonDisponibile ? "Non disponibile" : "Scegli"}</button>
                </div>
              </li>;
            })}
          </ul>
        </div>
      </div> : null}
    </dialog>
  );
}
