import type { Metadata } from "next";
import DettaglioRichiesta from "@/components/dashboard/DettaglioRichiesta";

export const metadata: Metadata = { title: "Richiesta" };

/* Next 16: params e' una Promise. La richiesta vive nel browser (demo su
   localStorage), quindi il server passa solo l'id e il resto lo legge il client. */
export default async function PaginaRichiesta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DettaglioRichiesta id={id} />;
}
