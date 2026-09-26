import type { Metadata } from "next";
import TabellaProduzione from "@/components/dashboard/TabellaProduzione";

export const metadata: Metadata = { title: "Produzione" };

export default function PaginaProduzione() {
  return <TabellaProduzione />;
}
