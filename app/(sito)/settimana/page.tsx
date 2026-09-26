import type { Metadata } from "next";
import { Suspense } from "react";
import SettimanaClient from "./SettimanaClient";

/* La pagina vive sul piano (localStorage, eventi, query string), quindi il corpo
   e' un client component: qui resta il metadata, che un client component non
   puo' esportare. */
export const metadata: Metadata = {
  title: "La tua settimana",
  description:
    "Sette giorni per due pasti: un piatto e le aggiunte della box in ogni casella, i macro di ogni giornata in vista, e un link da mandare al tuo nutrizionista.",
};

/**
 * Il guscio di attesa.
 *
 * Serve a due cose insieme. Al Suspense di useSearchParams, che senza un confine
 * farebbe fallire la build. E all'utente, che nel frattempo vede il posto della
 * settimana invece di un salto di layout quando i numeri arrivano.
 */
function Attesa() {
  return (
    <section className="fascia fascia-t fascia-carta">
      <div className="wrap">
        <div className="shell">
          <div className="core grid min-h-[340px] place-items-center p-10">
            <p className="note">Carico la tua settimana...</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function SettimanaPage() {
  return (
    <Suspense fallback={<Attesa />}>
      <SettimanaClient />
    </Suspense>
  );
}
