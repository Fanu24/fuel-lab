import type { Metadata } from "next";
import { EXTRA, PRIMI, SECONDI } from "@/lib/catalogo";
import MenuClient from "./MenuClient";

// I conteggi li dichiara il catalogo, non una stringa scritta a mano: il menu
// cambia ogni settimana e una description ferma sui numeri vecchi mentirebbe
// al primo taglio.
export const metadata: Metadata = {
  title: "Menu della settimana",
  description: `${PRIMI.length} primi e ${SECONDI.length} secondi da comporre, più ${EXTRA.length} extra: macro dichiarati e porzioni pesate per ogni elemento. Filtra per categoria, tag e giorno di cottura, poi componi il tuo pasto.`,
};

export default function PaginaMenu() {
  return <MenuClient />;
}
