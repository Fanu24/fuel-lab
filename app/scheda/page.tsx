import type { Metadata } from "next";
import SchedaClient from "./SchedaClient";

export const metadata: Metadata = {
  title: "La tua scheda",
  description:
    "Carica la scheda del nutrizionista, controlla i macro e lascia che il matcher componga la tua settimana sui tuoi numeri. Nella demo i valori sono di esempio e si correggono a mano.",
};

export default function SchedaPage() {
  return <SchedaClient />;
}
