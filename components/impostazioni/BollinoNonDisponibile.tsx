"use client";

import { usePiattiNonDisponibili } from "./useImpostazioni";

/**
 * "Non disponibile questa settimana" sopra la foto di un piatto. Sta in
 * posizione assoluta dentro la foto: quando le impostazioni arrivano (dopo il
 * primo disegno) compare senza spostare niente. La foto diventa grigia da CSS
 * (.foto-piatto:has(.bollino-nd)).
 */
export default function BollinoNonDisponibile({ piattoId, className = "" }: { piattoId: string; className?: string }) {
  const esclusi = usePiattiNonDisponibili();
  if (!esclusi.includes(piattoId)) return null;
  return (
    <span className={`bollino-nd ${className}`}>
      Non disponibile <span className="whitespace-nowrap">questa settimana</span>
    </span>
  );
}
