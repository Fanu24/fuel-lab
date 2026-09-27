"use client";

/* Rimanda da /dashboard/richiesta?id=... a /dashboard/ordini?id=... .
   L'export statico non ha redirect lato server: lo fa il browser, con
   replace, cosi' "indietro" non ripassa da qui. */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Caricamento } from "./ui";

export default function OrdiniRimando() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const destinazione = id ? `/dashboard/ordini?id=${encodeURIComponent(id)}` : "/dashboard/ordini";

  useEffect(() => {
    router.replace(destinazione);
  }, [router, destinazione]);

  return (
    <div>
      <Caricamento testo="Le richieste ora sono in Ordini: ti porto lì…" />
      <Link href={destinazione} className="pn-tasto">Apri Ordini</Link>
    </div>
  );
}
