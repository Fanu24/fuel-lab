import type { Allenamento } from "@/lib/catalogo";

type Tipo = Allenamento | "riposo";

const ETICHETTE: Record<Tipo, string> = {
  cardio: "Cardio",
  pesi: "Pesi",
  entrambi: "Cardio e pesi",
  riposo: "Riposo",
};

/** L'etichetta di allenamento: il pallino e' il cardio, il quadrato sono i pesi. */
export default function TagAllenamento({ tipo, className = "" }: { tipo: Tipo; className?: string }) {
  return <span className={`tag tag-${tipo} ${className}`}>{ETICHETTE[tipo]}</span>;
}
