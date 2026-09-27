import type { Metadata } from "next";
import { Suspense } from "react";
import ProductionLive from "@/components/dashboard/ProductionLive";
import { Caricamento } from "@/components/dashboard/ui";

export const metadata: Metadata = { title: "Cucina" };

/* Giorno e scheda arrivano dalla query string (?giorno=&scheda=): con l'export
   statico useSearchParams va dentro un confine Suspense. */
export default function PaginaProduzione() {
  return (
    <Suspense fallback={<Caricamento testo="Apro la cucina…" />}>
      <ProductionLive />
    </Suspense>
  );
}
