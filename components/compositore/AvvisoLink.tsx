"use client";

import { useEffect, useRef } from "react";
import type { useLinkCondiviso } from "./useLinkCondiviso";

/** Cosa e' successo con il link in arrivo, e la domanda quando serve. */
export default function AvvisoLink({ link }: { link: ReturnType<typeof useLinkCondiviso> }) {
  const titolo = useRef<HTMLParagraphElement>(null);
  // la domanda va trovata anche col fuoco, non solo con gli occhi
  useEffect(() => {
    if (link.esito === "chiede") titolo.current?.focus();
  }, [link.esito]);

  if (link.esito === "nessuno") return null;

  const testi: Record<string, string> = {
    importato: "Settimana caricata dal link. Adesso puoi cambiarla come vuoi.",
    accettato: "Fatto: vedi la settimana del link.",
    rifiutato: "Ho tenuto la tua settimana. Il link non ha cambiato niente.",
    rotto: "Questo link non si legge più: il menu è cambiato da quando è stato creato. Componi la settimana da capo.",
    chiede: "Ti hanno mandato una settimana. Vuoi sostituire la tua con quella del link?",
  };

  return (
    <div className="wrap pb-8">
      <div role="status" className="flex flex-wrap items-center gap-4 bg-lime p-4 text-ink">
        <p ref={titolo} tabIndex={-1} className="flex-1 font-semibold outline-none">
          {testi[link.esito]}
        </p>
        {link.esito === "chiede" ? (
          <span className="flex gap-3">
            <button type="button" className="btn btn-ink btn-sm" onClick={link.accetta}>
              Sostituisci
            </button>
            <button type="button" className="btn btn-linea btn-sm" onClick={link.rifiuta}>
              Tieni la mia
            </button>
          </span>
        ) : (
          <button type="button" className="link" onClick={link.chiudi}>
            Chiudi
          </button>
        )}
      </div>
    </div>
  );
}
