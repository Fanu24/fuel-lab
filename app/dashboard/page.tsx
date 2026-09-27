import type { Metadata } from "next";
import { Suspense } from "react";
import Oggi from "@/components/dashboard/Oggi";
import { Caricamento } from "@/components/dashboard/ui";

export const metadata: Metadata = { title: "Oggi" };

/* Suspense: "Oggi" legge ?id= (la scheda ordine aperta sopra la pagina) con
   useSearchParams, che nell'export statico va sempre dentro un confine. */
export default function PaginaOggi() {
  return (
    <Suspense fallback={<Caricamento testo="Apro il pannello…" />}>
      <Oggi />
    </Suspense>
  );
}
