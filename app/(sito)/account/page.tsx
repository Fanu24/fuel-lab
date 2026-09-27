import type { Metadata } from "next";
import { Suspense } from "react";
import CustomerDashboard from "@/components/account/CustomerDashboard";
import { AttesaAccount } from "@/components/account/Stati";

/* L'area cliente legge ?sezione= e i dati dell'utente nel browser (export
   statico): qui restano il metadata e il fallback che finisce nell'HTML. */
export const metadata: Metadata = {
  title: "Il mio account",
  description: "La tua area FUEL LAB: settimana salvata, richieste a Matteo con il loro stato, profilo e privacy.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <Suspense fallback={<AttesaAccount />}>
      <CustomerDashboard />
    </Suspense>
  );
}
