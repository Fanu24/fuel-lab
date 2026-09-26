import type { Metadata } from "next";
import { Suspense } from "react";
import DettaglioRichiesta from "@/components/dashboard/DettaglioRichiesta";

export const metadata: Metadata = { title: "Richiesta" };

/* L'id sta nella query (?id=) e non nel percorso: il sito si pubblica come
   export statico (Cloudflare), dove una rotta dinamica senza elenco di id noti
   al build non esiste. Tanto la richiesta vive nel browser: e' il client che la
   legge. Il confine di Suspense lo pretende useSearchParams. */
export default function PaginaRichiesta() {
  return (
    <Suspense fallback={<p className="text-muted">Carico…</p>}>
      <DettaglioRichiesta />
    </Suspense>
  );
}
