"use client";

/* Il numerino nel titolo della scheda del browser: "(3) Oggi · Pannello".
   Conta le richieste da confermare e i messaggi nuovi, cosi' Matteo vede che
   e' arrivato qualcosa anche con il pannello aperto in un'altra scheda. Next
   riscrive il titolo a ogni cambio pagina: un osservatore lo rimette. */

import { useEffect } from "react";
import { usePannello } from "./PannelloDati";

const PREFISSO = /^\(\d+\+?\) /;

export default function TitoloAvvisi() {
  const { ordini, messaggiNuovi } = usePannello();
  const n = (ordini?.filter((o) => o.status === "requested").length ?? 0) + (messaggiNuovi ?? 0);

  useEffect(() => {
    const applica = () => {
      const base = document.title.replace(PREFISSO, "");
      const voluto = n > 0 ? `(${n > 99 ? "99+" : n}) ${base}` : base;
      if (document.title !== voluto) document.title = voluto;
    };
    applica();
    const osserva = new MutationObserver(applica);
    osserva.observe(document.head, { childList: true, characterData: true, subtree: true });
    return () => {
      osserva.disconnect();
      document.title = document.title.replace(PREFISSO, "");
    };
  }, [n]);

  return null;
}
