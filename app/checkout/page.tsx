import type { Metadata } from "next";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Consegna",
  description:
    "Ultimo passo: indirizzo, slot di consegna del lunedi o del giovedi e riepilogo del box. Checkout dimostrativo: nessun pagamento e nessun ordine registrato.",
};

/* La pagina vive di stato e di localStorage, quindi il corpo e' un client component:
   questo guscio server esiste solo per poter esportare il metadata. */
export default function CheckoutPage() {
  return <CheckoutClient />;
}
