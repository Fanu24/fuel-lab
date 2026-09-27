import type { Metadata } from "next";
import Statistiche from "@/components/dashboard/Statistiche";

export const metadata: Metadata = { title: "Numeri" };

export default function PaginaStatistiche() {
  return <Statistiche />;
}
