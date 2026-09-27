"use client";

import { useState } from "react";

/**
 * Condividi la guida: copia del link e WhatsApp con testo precompilato.
 * wa.me senza numero apre la scelta del contatto, quindi funziona anche
 * finché il numero di Matteo non è configurato. Se gli appunti non sono
 * disponibili (http, permessi negati) il link compare in un campo da copiare
 * a mano: il bottone non deve mai fallire in silenzio.
 */
export default function Condividi({ url, titolo }: { url: string; titolo: string }) {
  const [stato, setStato] = useState<"pronto" | "copiato" | "manuale">("pronto");
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${titolo} ${url}`)}`;

  async function copia() {
    try {
      await navigator.clipboard.writeText(url);
      setStato("copiato");
    } catch {
      setStato("manuale");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={copia} className="btn btn-linea btn-sm">
          {stato === "copiato" ? "Link copiato" : "Copia il link"}
        </button>
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-sm bg-[#25d366] text-[#062b15] hover:bg-[#38e477]">
          Condividi su WhatsApp <span aria-hidden="true" className="freccia">→</span>
        </a>
      </div>
      <p className="sr-only" aria-live="polite">
        {stato === "copiato" ? "Link della guida copiato negli appunti." : ""}
      </p>
      {stato === "manuale" ? (
        <label className="mt-4 block max-w-[48ch] text-sm text-muted">
          Copia il link da qui:
          <input
            readOnly
            value={url}
            onFocus={(evento) => evento.currentTarget.select()}
            className="mt-2 block w-full border border-ink/30 bg-paper px-3 py-2 text-ink"
          />
        </label>
      ) : null}
    </div>
  );
}
