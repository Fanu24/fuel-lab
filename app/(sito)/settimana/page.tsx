import type { Metadata } from "next";
import { Suspense } from "react";
import SettimanaClient from "./SettimanaClient";

/* La pagina vive sul piano (localStorage, eventi, query string), quindi il corpo
   e' un client component: qui resta il metadata, che un client component non
   puo' esportare. */
export const metadata: Metadata = {
  title: "La tua settimana",
  description:
    "Scegli come ti alleni giorno per giorno: la settimana si riempie con i piatti giusti. Poi la sistemi trascinando, e la mandi a Matteo.",
};

/* Il confine di Suspense serve a useSearchParams (il link condiviso): senza,
   la build fallisce. Il segnaposto tiene il posto e non fa saltare il layout. */
function Attesa() {
  return <div className="testata wrap min-h-[80vh]" aria-busy="true" />;
}

export default function SettimanaPage() {
  return (
    <Suspense fallback={<Attesa />}>
      <SettimanaClient />
    </Suspense>
  );
}
