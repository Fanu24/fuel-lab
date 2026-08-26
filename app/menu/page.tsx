import type { Metadata } from "next";
import { DISHES } from "@/lib/dishes";
import MenuClient from "./MenuClient";

// Il conteggio lo dichiara il catalogo, non una stringa scritta a mano: il menu
// cambia ogni settimana e una description ferma su "24" mentirebbe al primo taglio.
export const metadata: Metadata = {
  title: "Menu della settimana",
  description: `I ${DISHES.length} piatti Fuel della settimana, con macro dichiarati e porzioni pesate. Filtra per obiettivo, tipo e giorno di cottura, poi componi il tuo box.`,
};

export default function PaginaMenu() {
  return <MenuClient />;
}
