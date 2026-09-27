"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { NOMI_GIORNO, usePiano } from "@/lib/piano";
import { usePiattiNonDisponibili } from "@/components/impostazioni/useImpostazioni";

/**
 * Mette il piatto nella prima casella libera della settimana e DICE DOVE.
 * La versione precedente lo faceva in silenzio: il piatto spariva in una
 * griglia che non si vedeva, e l'utente non sapeva se il click era servito.
 *
 * Se Matteo ha segnato il piatto come non disponibile (impostazioni del
 * pannello) il bottone si spegne e dice perche'. Resta raggiungibile col Tab
 * (aria-disabled, non disabled): chi usa il lettore di schermo sente la ragione.
 */
export default function AggiungiAllaSettimana({ piattoId }: { piattoId: string }) {
  const { primaLibera, metti } = usePiano();
  const esclusi = usePiattiNonDisponibili();
  const [esito, setEsito] = useState<string | null>(null);
  const idPerche = useId();
  const escluso = esclusi.includes(piattoId);

  function aggiungi() {
    if (escluso) return;
    const libera = primaLibera();
    if (!libera) {
      setEsito("La settimana è piena. Apri il compositore per sostituire un piatto.");
      return;
    }
    metti(libera.g, libera.m, piattoId);
    setEsito(`Aggiunto a ${NOMI_GIORNO[libera.g].toLowerCase()}, ${libera.m}.`);
  }

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <button
        type="button"
        className="btn btn-ink"
        onClick={aggiungi}
        aria-disabled={escluso || undefined}
        aria-describedby={escluso ? idPerche : undefined}
      >
        {escluso ? (
          "Non disponibile"
        ) : (
          <>
            <span className="hidden sm:inline">Aggiungi alla settimana</span>
            <span className="sm:hidden">Aggiungi</span>
            <span aria-hidden="true">+</span>
          </>
        )}
      </button>
      {escluso ? (
        <p id={idPerche} className="text-sm">
          Matteo non lo cucina questa settimana: scegline un altro.
        </p>
      ) : (
        <p role="status" className="text-sm">
          {esito ? (
            <>
              {esito}{" "}
              <Link href="/settimana" className="link">
                Vedi la settimana
              </Link>
            </>
          ) : null}
        </p>
      )}
    </div>
  );
}
