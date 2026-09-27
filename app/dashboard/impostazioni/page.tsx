import type { Metadata } from "next";
import Impostazioni from "@/components/dashboard/Impostazioni";

export const metadata: Metadata = { title: "Impostazioni" };

export default function PaginaImpostazioni() {
  return <Impostazioni />;
}
