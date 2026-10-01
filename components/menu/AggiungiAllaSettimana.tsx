"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { NOMI_GIORNO, usePiano, type Slot } from "@/lib/piano";
import { usePiattiNonDisponibili } from "@/components/impostazioni/useImpostazioni";

/**
 * Mette il piatto nella prima casella libera della settimana e DICE DOVE.
 * La versione precedente lo faceva in silenzio: il piatto spariva in una
 * griglia che non si vedeva, e l'utente non sapeva se il click era servito.
 * Un tocco di troppo (succede, sul telefono) si disfa con "Annulla".
 *
 * Se Matteo ha segnato il piatto come non disponibile (impostazioni del
 * pannello) il bottone si spegne e dice perche'. Resta raggiungibile col Tab
 * (aria-disabled, non disabled): chi usa il lettore di schermo sente la ragione.
 */
export default function AggiungiAllaSettimana({ piattoId }: { piattoId: string }) {
  const { primaLibera, metti, casella, togliPiatto } = usePiano();
  const esclusi = usePiattiNonDisponibili();
  const [dove, setDove] = useState<Slot | null>(null);
  const [piena, setPiena] = useState(false);
  const idPerche = useId();
  const bottone = useRef<HTMLButtonElement>(null);
  const escluso = esclusi.includes(piattoId);

  function aggiungi() {
    if (escluso) return;
    const libera = primaLibera();
    if (!libera) {
      setPiena(true);
      setDove(null);
      return;
    }
    setPiena(false);
    metti(libera.g, libera.m, piattoId);
    setDove(libera);
  }

  function annulla() {
    if (!dove) return;
    togliPiatto(dove.g, dove.m);
    setDove(null);
    // il bottone "Annulla" sparisce: il fuoco torna dove si era partiti
    bottone.current?.focus();
  }

  // Il messaggio vale finche' il piatto e' ancora li': se nel frattempo e' stato tolto altrove, non si racconta piu'.
  const ancoraLi = dove && casella(dove.g, dove.m)?.piatto === piattoId;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <button
        ref={bottone}
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
          {piena ? (
            <>
              La settimana è piena.{" "}
              <Link href="/settimana" className="link">
                Apri il compositore
              </Link>{" "}
              per sostituire un piatto.
            </>
          ) : ancoraLi && dove ? (
            <>
              Aggiunto a {NOMI_GIORNO[dove.g].toLowerCase()}, {dove.m}.{" "}
              <Link href="/settimana" className="link">
                Vedi la settimana
              </Link>{" "}
              <button type="button" className="link" onClick={annulla}>
                Annulla
              </button>
            </>
          ) : null}
        </p>
      )}
    </div>
  );
}
