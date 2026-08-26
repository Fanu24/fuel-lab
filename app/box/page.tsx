import type { Metadata } from "next";
import BoxClient from "./BoxClient";

/* La pagina vive sul carrello (stato, localStorage, eventi) quindi il corpo e'
   un client component: qui resta solo il metadata, che un client component
   non puo esportare. */
export const metadata: Metadata = {
  title: "Componi il tuo box",
  description:
    "Scegli la taglia da 6, 10, 15 o 20 pasti, decidi fra ordine singolo e abbonamento settimanale con il 15% di sconto, e rivedi i piatti del tuo box con macro e totale sempre aggiornati.",
};

export default function BoxPage() {
  return <BoxClient />;
}
