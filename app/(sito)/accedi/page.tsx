import type { Metadata } from "next";
import { Suspense } from "react";
import AuthPanel from "@/components/account/AuthPanel";
import { AttesaAccesso } from "@/components/account/Stati";

export const metadata: Metadata = {
  title: "Accedi o crea account",
  description: "Accedi a FUEL LAB per salvare la settimana, inviare le richieste a Matteo e seguirne lo stato. Nessun pagamento online.",
  alternates: { canonical: "/accedi" },
  robots: { index: false, follow: false },
};

export default function Accedi() {
  return (
    <Suspense fallback={<AttesaAccesso />}>
      <AuthPanel />
    </Suspense>
  );
}
