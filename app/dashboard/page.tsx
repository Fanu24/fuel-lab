import type { Metadata } from "next";
import { Suspense } from "react";
import Oggi from "@/components/dashboard/Oggi";
import { Caricamento } from "@/components/dashboard/ui";

/* La pagina sta nello stesso segmento del layout, che non applica il proprio modello a se stesso: il titolo completo si scrive qui. */
export const metadata: Metadata = { title: { absolute: "Oggi · Pannello FUEL LAB" } };

/* Suspense: "Oggi" legge ?id= (la scheda ordine aperta sopra la pagina) con
   useSearchParams, che nell'export statico va sempre dentro un confine. */
export default function PaginaOggi() {
  return (
    <Suspense fallback={<Caricamento testo="Apro il pannello…" />}>
      <Oggi />
    </Suspense>
  );
}
