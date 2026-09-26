"use client";

import { useCallback, useEffect, useState } from "react";
import { getRepository, type Richiesta } from "@/lib/richieste";

/**
 * Le richieste dal repository, con caricamento ed errore. Il repository e'
 * asincrono anche in locale (vedi lib/richieste/tipi.ts): questo hook e' gia'
 * pronto per il backend vero.
 */
export function useRichieste() {
  const [richieste, setRichieste] = useState<Richiesta[] | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

  const ricarica = useCallback(async () => {
    try {
      setRichieste(await getRepository().elenca());
      setErrore(null);
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Non riesco a leggere le richieste.");
    }
  }, []);

  useEffect(() => {
    let vivo = true;
    getRepository()
      .elenca()
      .then((r) => vivo && setRichieste(r))
      .catch((e: unknown) => vivo && setErrore(e instanceof Error ? e.message : "Non riesco a leggere le richieste."));
    // una richiesta fatta nell'altra scheda (il sito) compare senza ricaricare
    const suStorage = (e: StorageEvent) => {
      if (e.key === null || e.key.startsWith("fuellab.richieste")) void ricarica();
    };
    window.addEventListener("storage", suStorage);
    return () => {
      vivo = false;
      window.removeEventListener("storage", suStorage);
    };
  }, [ricarica]);

  return { richieste, errore, ricarica };
}
