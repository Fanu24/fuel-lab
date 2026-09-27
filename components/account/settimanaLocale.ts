"use client";

import { useCallback } from "react";
import { GIORNI, potaAllenamenti, potaPiano, usePiano } from "@/lib/piano";

/* Sostituisce la settimana che il cliente sta componendo su questo dispositivo
   con una arrivata dal server (la versione salvata o una richiesta passata).
   Piano e allenamenti passano dalle stesse potature della lettura da
   localStorage: un piatto uscito dal menu sparisce invece di rompere la griglia. */
export function useSostituisciSettimana() {
  const { sostituisciPiano, svuotaAllenamenti, impostaAllenamento } = usePiano();
  return useCallback(
    (piano: unknown, allenamenti: unknown) => {
      sostituisciPiano(potaPiano(piano));
      svuotaAllenamenti();
      const giorni = potaAllenamenti(allenamenti);
      for (const g of GIORNI) {
        const tipo = giorni[g];
        if (tipo) impostaAllenamento(g, tipo);
      }
    },
    [sostituisciPiano, svuotaAllenamenti, impostaAllenamento],
  );
}
