import type { Allenamento } from "@/lib/catalogo";

type Tipo = Allenamento | "riposo";

const ETICHETTE: Record<Tipo, string> = {
  cardio: "Cardio",
  pesi: "Pesi",
  entrambi: "Cardio e pesi",
  riposo: "Riposo",
};

/** L'etichetta di allenamento: il pallino e' il cardio, il quadrato sono i pesi.
 *  `breve` per gli spazi stretti (il banco del compositore), dove "Cardio e pesi"
 *  andrebbe a capo. */
export default function TagAllenamento({
  tipo,
  breve = false,
  className = "",
}: {
  tipo: Tipo;
  breve?: boolean;
  className?: string;
}) {
  const testo = breve && tipo === "entrambi" ? "Misto" : ETICHETTE[tipo];
  return (
    <span className={`tag tag-${tipo} ${className}`} title={ETICHETTE[tipo]}>
      {testo}
    </span>
  );
}
