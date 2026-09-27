import type { Metadata } from "next";
import ProductionLive from "@/components/dashboard/ProductionLive";

export const metadata: Metadata = { title: "Produzione" };

export default function PaginaProduzione() {
  return <ProductionLive />;
}
