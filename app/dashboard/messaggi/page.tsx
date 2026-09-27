import type { Metadata } from "next";
import Messaggi from "@/components/dashboard/Messaggi";

export const metadata: Metadata = { title: "Messaggi" };

export default function PaginaMessaggi() {
  return <Messaggi />;
}
