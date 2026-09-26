import type { Allenamenti, Piano } from "../settimana";
import type { ServizioId } from "../servizi";
import type { Formula, Macros } from "../types";
import type { DatiContatto } from "../whatsapp";

/* =========================================================================
   Le richieste che arrivano dal sito, viste dalla parte di Matteo.

   Il sito non vende: raccoglie una richiesta e apre WhatsApp. Salvarla serve
   alla dashboard, che oggi e' una demo su localStorage e domani parlera' con
   un backend vero. Per questo tutto passa da RepositoryRichieste, asincrona
   anche quando localStorage non ne avrebbe bisogno: chi la usa e' gia' scritto
   per la rete, e il cambio di backend non tocca le pagine.
   ========================================================================= */

export type StatoRichiesta = "nuova" | "contattata" | "chiusa" | "persa";

export const STATI: { id: StatoRichiesta; label: string }[] = [
  { id: "nuova", label: "Nuova" },
  { id: "contattata", label: "Contattata" },
  { id: "chiusa", label: "Chiusa" },
  { id: "persa", label: "Persa" },
];

/**
 * Lo stesso contatto che il modulo passa a componiMessaggio, con comune e note
 * facoltativi: una richiesta senza comune e' comunque una richiesta.
 */
export type Contatto = Pick<DatiContatto, "nome" | "telefono"> &
  Partial<Pick<DatiContatto, "comune" | "note">>;

export interface Richiesta {
  id: string;
  /** ISO 8601, UTC: il fuso lo applica chi mostra la data */
  creataIl: string;
  aggiornataIl: string;
  stato: StatoRichiesta;
  servizio: ServizioId;
  formula: Formula;
  contatto: Contatto;
  piano: Piano;
  allenamenti: Allenamenti;
  /**
   * Nomi di piatti ed extra al momento della richiesta, per id. Il menu cambia ogni
   * settimana: senza questa fotografia una richiesta vecchia mostrerebbe id muti.
   */
  nomiPiatti: Record<string, string>;
  pasti: number;
  /** macro della settimana intera, non della media giornaliera */
  macro: Macros;
  noteInterne?: string;
  origine: "sito" | "demo";
}

/** Quello che il sito conosce quando invia: id, date e stato li decide il repository. */
export type NuovaRichiesta = Omit<Richiesta, "id" | "creataIl" | "aggiornataIl" | "stato"> & {
  stato?: StatoRichiesta;
};

export interface FiltroRichieste {
  stato?: StatoRichiesta;
}

export interface RepositoryRichieste {
  /** dalla piu' recente */
  elenca(f?: FiltroRichieste): Promise<Richiesta[]>;
  /** null quando l'id non esiste: una pagina di dettaglio lo tratta come un 404 */
  leggi(id: string): Promise<Richiesta | null>;
  crea(r: NuovaRichiesta): Promise<Richiesta>;
  /** rifiuta con un Error se l'id non esiste */
  aggiornaStato(id: string, s: StatoRichiesta): Promise<Richiesta>;
  /** sostituisce le note interne; rifiuta con un Error se l'id non esiste */
  annota(id: string, nota: string): Promise<Richiesta>;
}

export function isStato(v: unknown): v is StatoRichiesta {
  return typeof v === "string" && STATI.some((s) => s.id === v);
}
