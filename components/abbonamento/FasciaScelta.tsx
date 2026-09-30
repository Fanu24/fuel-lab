"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Fascia } from "@/lib/abbonamento";

/* La fascia scelta e' una sola per tutta la pagina: l'interruttore delle
   formule e il simulatore leggono e scrivono la stessa, cosi' chi sceglie Plus
   nell'elenco non ritrova Standard nel simulatore. Fuori dal provider ognuno
   tiene la sua (per esempio una scheda che usa l'interruttore da sola). */

type Scelta = readonly [Fascia, (fascia: Fascia) => void];

const Contesto = createContext<Scelta | null>(null);

export function FasciaProvider({ children }: { children: ReactNode }) {
  const scelta = useState<Fascia>("standard");
  return <Contesto.Provider value={scelta}>{children}</Contesto.Provider>;
}

export function useFascia(): Scelta {
  const condivisa = useContext(Contesto);
  const locale = useState<Fascia>("standard");
  return condivisa ?? locale;
}
