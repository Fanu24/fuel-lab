import type { Metadata } from "next";
import { Suspense } from "react";
import RichiestaClient from "./RichiestaClient";

/* La pagina vive sul piano (localStorage) e su ?servizio= (query string),
   quindi il corpo e' un client component: qui resta il metadata, che un
   client component non puo' esportare. */
export const metadata: Metadata = {
  title: "Scrivi a Matteo",
  description:
    "Nome, telefono e comune, poi WhatsApp con il messaggio già scritto: la tua settimana e il servizio che ti interessa, pronti per Matteo. Nessun pagamento online.",
};

function Attesa() {
  return <div className="wrap min-h-[60vh]" aria-busy="true" />;
}

export default function RichiestaPage() {
  return (
    <>
      <section className="testata">
        <div className="wrap">
          <p className="occhiello">Scrivi a Matteo</p>
          <h1 className="titolo-xl mt-6 max-w-[12ch]">Due minuti, poi parli con lui.</h1>
          <p className="lead mt-6">
            Nome, telefono e comune. Poi si apre WhatsApp col messaggio già pronto, settimana compresa. Nessun
            pagamento online.
          </p>
        </div>
      </section>
      <Suspense fallback={<Attesa />}>
        <RichiestaClient />
      </Suspense>
    </>
  );
}
