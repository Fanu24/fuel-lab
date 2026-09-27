import type { Metadata } from "next";
import { Suspense } from "react";
import Ordini from "@/components/dashboard/Ordini";
import { Caricamento } from "@/components/dashboard/ui";

export const metadata: Metadata = { title: "Ordini" };

/* Suspense: la pagina legge i filtri e la scheda aperta (?stato, ?solo, ?id)
   con useSearchParams, che nell'export statico va dentro un confine. */
export default function PaginaOrdini() {
  return (
    <Suspense fallback={<Caricamento testo="Carico gli ordini…" />}>
      <Ordini />
    </Suspense>
  );
}
