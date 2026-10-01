"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Condividi la guida: il foglio di condivisione del telefono (Web Share) quando
 * c’è, la copia del link e WhatsApp con testo precompilato. wa.me senza numero
 * apre la scelta del contatto, quindi funziona anche finché il numero di Matteo
 * non è configurato. Se gli appunti non sono disponibili (http, permessi
 * negati) il link compare in un campo da copiare a mano: il bottone non deve
 * mai fallire in silenzio. "Link copiato" resta tre secondi e poi il bottone
 * torna com’era.
 */

const nessunaIscrizione = () => () => {};
const sullaPagina = () => typeof navigator !== "undefined" && typeof navigator.share === "function";
const sulServer = () => false;

export default function Condividi({ url, titolo }: { url: string; titolo: string }) {
  const [stato, setStato] = useState<"pronto" | "copiato" | "manuale">("pronto");
  // Il server non sa se il browser può condividere: parte da false e si corregge dopo l’idratazione.
  const puoCondividere = useSyncExternalStore(nessunaIscrizione, sullaPagina, sulServer);
  const timer = useRef<number | undefined>(undefined);
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${titolo} ${url}`)}`;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copia() {
    window.clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(url);
      setStato("copiato");
      timer.current = window.setTimeout(() => setStato("pronto"), 3000);
    } catch {
      setStato("manuale");
    }
  }

  async function condividi() {
    try {
      await navigator.share({ title: titolo, url });
    } catch (errore) {
      // Chi chiude il foglio di condivisione non ha sbagliato niente; ogni altro errore ripiega sulla copia.
      if (!(errore instanceof DOMException && errore.name === "AbortError")) await copia();
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {puoCondividere ? (
          <button type="button" onClick={condividi} className="btn btn-ink btn-sm">
            Condividi
          </button>
        ) : null}
        <button type="button" onClick={copia} className="btn btn-linea btn-sm">
          {stato === "copiato" ? "Link copiato" : "Copia il link"}
        </button>
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-sm bg-[#25d366] text-[#062b15] hover:bg-[#38e477]">
          Condividi su WhatsApp <span aria-hidden="true" className="freccia">→</span>
          <span className="sr-only"> (si apre in una nuova scheda)</span>
        </a>
      </div>
      <p className="sr-only" role="status">
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
