import { creaRepoLocale } from "./locale";
import type { RepositoryRichieste } from "./tipi";

export * from "./tipi";

/* =========================================================================
   Il punto unico da cui le pagine prendono le richieste.

   Oggi c'e' solo il backend "locale" (localStorage di questo browser). Quando
   arrivera' Supabase si aggiunge un ramo qui e NEXT_PUBLIC_DATA_BACKEND lo
   accende: le pagine non cambiano, parlano gia' con RepositoryRichieste.
   ========================================================================= */

let istanza: RepositoryRichieste | null = null;

export function getRepository(): RepositoryRichieste {
  if (istanza) return istanza;

  // Letta qui e non in una costante di modulo: i test la cambiano fra una chiamata e l'altra.
  const backend = process.env.NEXT_PUBLIC_DATA_BACKEND || "locale";
  if (backend !== "locale") {
    throw new Error(
      `backend non ancora collegato: NEXT_PUBLIC_DATA_BACKEND="${backend}". Per ora esiste solo "locale".`,
    );
  }
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    throw new Error(
      "getRepository() con il backend locale gira solo nel browser: chiamala da un Client Component, dentro un effetto o un gestore di evento, non durante il render sul server.",
    );
  }

  istanza = creaRepoLocale(window.localStorage);
  return istanza;
}
