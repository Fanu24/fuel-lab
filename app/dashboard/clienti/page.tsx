import type { Metadata } from "next";
import { Suspense } from "react";
import Clienti from "@/components/dashboard/Clienti";
import { Caricamento } from "@/components/dashboard/ui";

export const metadata: Metadata = { title: "Clienti" };

/* La scheda del cliente e' ?id=...: useSearchParams, quindi Suspense (export statico). */
export default function PaginaClienti() {
  return (
    <Suspense fallback={<Caricamento testo="Carico i clienti…" />}>
      <Clienti />
    </Suspense>
  );
}
