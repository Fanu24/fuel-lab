import type { Ordine, Profilo, Providers, Utente } from "@/lib/api";
import type { Caricabile } from "../ui";

/* Cosa l'area cliente passa alle sue sezioni. Profilo e richieste si caricano
   una volta sola nel guscio (CustomerDashboard) e le sezioni li condividono. */

export type Dati<T> = Caricabile<T> & { ricarica: () => Promise<void>; imposta: (dati: T) => void };

export type PropsArea = {
  utente: Utente;
  profilo: Dati<Profilo>;
  ordini: Dati<Ordine[]>;
  providers: Providers | null;
  /** "YYYY-MM-DD" a Pescara, fissato all'apertura della pagina */
  oggi: string;
};

/**
 * L'esito di un'azione, mostrato accanto al bottone che l'ha avviata.
 * `sessione`: il server ha risposto 401, serve un link per rientrare.
 */
export type Esito = { ok: boolean; testo: string; sessione?: boolean };
