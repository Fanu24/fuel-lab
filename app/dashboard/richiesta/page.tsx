import type { Metadata } from "next";
import { Suspense } from "react";
import { Caricamento } from "@/components/dashboard/ui";
import OrdiniRimando from "@/components/dashboard/OrdiniRimando";

export const metadata: Metadata = { title: "Ordini" };

/* Il vecchio indirizzo delle richieste: i link gia' mandati per email
   (/dashboard/richiesta?id=...) finiscono sulla scheda del nuovo pannello. */
export default function VecchiaRichiesta() {
  return (
    <Suspense fallback={<Caricamento testo="Apro l’ordine…" />}>
      <OrdiniRimando />
    </Suspense>
  );
}
