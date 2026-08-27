import type { Metadata } from "next";
import { Suspense } from "react";
import RichiestaClient from "./RichiestaClient";

/* La pagina vive sul piano (localStorage) e su ?servizio= (query string),
   quindi il corpo e' un client component: qui resta il metadata, che un
   client component non puo' esportare. */
export const metadata: Metadata = {
  title: "Scrivi a Matteo",
  description:
    "Nome, telefono e comune, poi WhatsApp con il messaggio gia' scritto: la tua settimana e il servizio che ti interessa, pronti per Matteo. Nessun pagamento, nessun dato salvato in questa fase.",
};

/** Il guscio di attesa per il confine di Suspense richiesto da useSearchParams. */
function Attesa() {
  return (
    <section className="pt-[152px] pb-[110px] md:pt-[190px] md:pb-[150px]">
      <div className="wrap">
        <div className="shell">
          <div className="core grid min-h-[280px] place-items-center p-10">
            <p className="note">Preparo il modulo...</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function RichiestaPage() {
  return (
    <Suspense fallback={<Attesa />}>
      <RichiestaClient />
    </Suspense>
  );
}
