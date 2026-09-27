"use client";

import { useEffect, useState } from "react";
import { api, type Utente } from "@/lib/api";

/* Chi sta guardando la pagina: `undefined` finche' /api/me non risponde,
   `null` se non ha fatto l'accesso (o se il server non risponde: in quel caso
   la pagina si comporta come per un ospite, che e' sempre una strada valida).

   La scheda dell'account e il modulo lo chiedono insieme al caricamento: la
   richiesta in volo e l'ultima risposta si condividono per qualche secondo,
   cosi' parte una chiamata sola invece di due. */

const VALIDITA_MS = 10_000;
let inVolo: { quando: number; promessa: Promise<Utente | null> } | null = null;

function caricaUtente(): Promise<Utente | null> {
  const adesso = Date.now();
  if (!inVolo || adesso - inVolo.quando > VALIDITA_MS) {
    inVolo = {
      quando: adesso,
      promessa: api.me().then((r) => r.user ?? null, () => null),
    };
  }
  return inVolo.promessa;
}

export function useUtente(): Utente | null | undefined {
  const [utente, setUtente] = useState<Utente | null | undefined>(undefined);
  useEffect(() => {
    let vivo = true;
    void caricaUtente().then((u) => {
      if (vivo) setUtente(u);
    });
    return () => {
      vivo = false;
    };
  }, []);
  return utente;
}
