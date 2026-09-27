import type { Metadata } from "next";
import { Suspense } from "react";
import RichiestaClient from "./RichiestaClient";
import { numeroConfigurato } from "@/lib/whatsapp";

/* La pagina vive sul piano (localStorage) e su ?servizio= (query string),
   quindi il corpo e' un client component: qui resta il metadata, che un
   client component non puo' esportare. */
export const metadata: Metadata = {
  title: "Scrivi a Matteo",
  description:
    "Contatta Matteo Pattanè di FUEL LAB a Pescara: chiedi informazioni su menu, ritiro e consegna via email. WhatsApp sarà disponibile dopo la configurazione del numero.",
};

function Attesa() {
  return <div className="wrap min-h-[60vh]" aria-busy="true" />;
}

export default function RichiestaPage() {
  const whatsappAttivo = numeroConfigurato();
  return (
    <>
      <section className="testata">
        <div className="wrap">
          <p className="occhiello">Scrivi a Matteo</p>
          <h1 className="titolo-xl mt-6 max-w-[12ch]">Scrivi a Matteo.</h1>
          <p className="lead mt-6">
            {whatsappAttivo
              ? "Componi la tua richiesta e apri WhatsApp con il messaggio già pronto. Nessun pagamento online."
              : "WhatsApp sarà disponibile quando avremo il numero. Intanto puoi scrivere a info@fuelchef.it per menu, consegne e disponibilità."}
          </p>
        </div>
      </section>
      <Suspense fallback={<Attesa />}>
        <RichiestaClient />
      </Suspense>
    </>
  );
}
