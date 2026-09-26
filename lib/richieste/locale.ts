import { potaAllenamenti, potaPiano } from "../settimana";
import { richiesteDemo } from "./seed";
import {
  isStato,
  type FiltroRichieste,
  type NuovaRichiesta,
  type RepositoryRichieste,
  type Richiesta,
  type StatoRichiesta,
} from "./tipi";

/* =========================================================================
   Il repository demo: le richieste vivono nel localStorage di QUESTO browser.

   Vuol dire che la dashboard vede solo le richieste inviate da qui piu' quelle
   d'esempio: va detto chiaramente a Matteo, non e' un backend. Lo storage
   arriva da fuori (Pick<Storage,...>) cosi' i test girano in node con una
   Map, e `oggi` e' iniettabile per avere date prevedibili.
   ========================================================================= */

const CHIAVE = "fuellab.richieste.v1";
/**
 * Flag separato e non "lista assente = semina": se Matteo archivia tutto e la lista
 * resta vuota, ricaricare la pagina non deve fargli ricomparire le richieste demo.
 */
const SEMINATO = "fuellab.richieste.seminato";

/** Tiene solo le voci con la forma minima di una richiesta: lo storage si modifica a mano. */
function potaRichieste(v: unknown): Richiesta[] {
  if (!Array.isArray(v)) return [];
  const out: Richiesta[] = [];
  for (const x of v as unknown[]) {
    if (!x || typeof x !== "object") continue;
    const r = x as Partial<Richiesta>;
    if (typeof r.id !== "string" || !isStato(r.stato)) continue;
    if (typeof r.creataIl !== "string" || Number.isNaN(Date.parse(r.creataIl))) continue;
    out.push({
      ...(r as Richiesta),
      piano: potaPiano(r.piano),
      allenamenti: potaAllenamenti(r.allenamenti),
      nomiPiatti: r.nomiPiatti && typeof r.nomiPiatti === "object" ? r.nomiPiatti : {},
    });
  }
  return out;
}

let contatore = 0;
function nuovoId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  // browser vecchi o contesto non sicuro (http su rete locale): basta che non collida qui
  contatore += 1;
  return `r-${Date.now().toString(36)}-${contatore.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function creaRepoLocale(
  storage: Pick<Storage, "getItem" | "setItem">,
  oggi: () => Date = () => new Date(),
): RepositoryRichieste {
  function carica(): Richiesta[] {
    if (!storage.getItem(SEMINATO)) {
      const demo = richiesteDemo(oggi());
      if (storage.getItem(CHIAVE) === null) storage.setItem(CHIAVE, JSON.stringify(demo));
      storage.setItem(SEMINATO, "1");
    }
    const raw = storage.getItem(CHIAVE);
    if (!raw) return [];
    try {
      return potaRichieste(JSON.parse(raw) as unknown);
    } catch {
      return []; // JSON rotto: meglio una dashboard vuota che una dashboard che esplode
    }
  }

  function salva(lista: Richiesta[]) {
    storage.setItem(CHIAVE, JSON.stringify(lista));
  }

  /** Legge, modifica una richiesta, salva. Un id ignoto e' un errore di chi chiama, non un no-op. */
  function modifica(id: string, cambia: (r: Richiesta) => Richiesta): Richiesta {
    const lista = carica();
    const i = lista.findIndex((r) => r.id === id);
    if (i === -1) throw new Error(`richiesta non trovata: ${id}`);
    const aggiornata = { ...cambia(lista[i]), aggiornataIl: oggi().toISOString() };
    lista[i] = aggiornata;
    salva(lista);
    return aggiornata;
  }

  return {
    async elenca(f?: FiltroRichieste) {
      const lista = carica().filter((r) => !f?.stato || r.stato === f.stato);
      return lista.sort((a, b) => Date.parse(b.creataIl) - Date.parse(a.creataIl));
    },
    async leggi(id: string) {
      return carica().find((r) => r.id === id) ?? null;
    },
    async crea(n: NuovaRichiesta) {
      const adesso = oggi().toISOString();
      const r: Richiesta = { ...n, id: nuovoId(), creataIl: adesso, aggiornataIl: adesso, stato: n.stato ?? "nuova" };
      salva([...carica(), r]);
      return r;
    },
    async aggiornaStato(id: string, s: StatoRichiesta) {
      if (!isStato(s)) throw new Error(`stato non valido: ${String(s)}`);
      return modifica(id, (r) => ({ ...r, stato: s }));
    },
    async annota(id: string, nota: string) {
      return modifica(id, (r) => ({ ...r, noteInterne: nota }));
    },
  };
}
