import { lunediDi } from "@/lib/pannello";
import { isData } from "@/lib/produzione";

/**
 * La navigazione del pannello di Matteo: le viste, l'indirizzo che le rappresenta e
 * la profondità nella storia del browser. Funzioni pure, senza DOM: importano solo
 * lib/pannello e lib/produzione. Le usa il componente (components/pannello) e le
 * verifica lib/pannello-navigazione.test.ts.
 *
 * La profondità sta nello stato di ogni voce della storia che il pannello crea
 * (`{ pannello: true, profondita }`): è il numero di voci del pannello che stanno
 * sotto questa. "Indietro" nel pannello torna indietro nella storia solo se la
 * profondità è maggiore di zero; altrimenti sostituisce la voce con la schermata
 * del giorno. Così il gesto "indietro" del telefono e il bottone fanno la stessa cosa.
 */

export type Vista =
  | { tipo: "giorno" }
  | { tipo: "nuovi" }
  | { tipo: "scegli-cliente" }
  /** `settimana`: il lunedì della settimana da mostrare; senza, quella del giorno scelto (di solito oggi). */
  | { tipo: "cliente"; clienteId: string; modifica?: boolean; settimana?: string }
  | { tipo: "nuovo-cliente" }
  | { tipo: "altro" }
  | { tipo: "guida" };

/** Un lunedì scritto nell'indirizzo; altrimenti null (si mostra la settimana di oggi). */
function lunediValido(s: string | null): string | null {
  return isData(s) && lunediDi(s) === s ? s : null;
}

/** La vista scritta nell'indirizzo; un indirizzo sconosciuto o incompleto è la schermata del giorno. */
export function vistaDaUrl(search: string): Vista {
  const p = new URLSearchParams(search);
  switch (p.get("vista")) {
    case "nuovi": return { tipo: "nuovi" };
    case "scegli-cliente": return { tipo: "scegli-cliente" };
    case "nuovo-cliente": return { tipo: "nuovo-cliente" };
    case "altro": return { tipo: "altro" };
    case "guida": return { tipo: "guida" };
    case "cliente": {
      const clienteId = p.get("cliente");
      if (!clienteId) return { tipo: "giorno" };
      const modifica = p.get("modifica") === "1";
      const settimana = lunediValido(p.get("settimana"));
      return {
        tipo: "cliente",
        clienteId,
        ...(modifica ? { modifica: true } : {}),
        ...(settimana ? { settimana } : {}),
      };
    }
    default: return { tipo: "giorno" };
  }
}

/** L'indirizzo di una vista, sotto il percorso `pathname` (es. "/admin"). */
export function urlDiVista(v: Vista, pathname: string): string {
  const p = new URLSearchParams({ vista: v.tipo });
  if (v.tipo === "cliente") {
    p.set("cliente", v.clienteId);
    if (v.modifica) p.set("modifica", "1");
    if (v.settimana) p.set("settimana", v.settimana);
  }
  return `${pathname}?${p.toString()}`;
}

/** La profondità scritta nello stato di una voce della storia; 0 se la voce non è del pannello. */
export function profonditaDi(stato: unknown): number {
  if (typeof stato !== "object" || stato === null) return 0;
  const s = stato as { pannello?: unknown; profondita?: unknown };
  if (s.pannello !== true || typeof s.profondita !== "number" || !Number.isInteger(s.profondita) || s.profondita < 0) return 0;
  return s.profondita;
}

/**
 * La profondità della voce che `vai` scrive: una voce nuova (indirizzo cambiato) sta un
 * gradino sopra quella attuale; una voce sostituita (stesso indirizzo) resta dov'era.
 */
export function profonditaDopoVai(statoAttuale: unknown, indirizzoCambiato: boolean): number {
  const attuale = profonditaDi(statoAttuale);
  return indirizzoCambiato ? attuale + 1 : attuale;
}

/**
 * Lo stato della voce che `vai` scrive. Di norma una voce nuova sta un gradino sopra; con `sostituisci`
 * la voce attuale cambia indirizzo restando al suo livello (per esempio dopo "Salva" nel modulo del
 * cliente, così "Indietro" non torna al modulo).
 */
export function statoDopoVai(statoAttuale: unknown, sostituisci: boolean): { pannello: true; profondita: number } {
  return { pannello: true, profondita: profonditaDopoVai(statoAttuale, !sostituisci) };
}

/** Il bottone "Indietro" può tornare indietro nella storia solo se ci sono voci del pannello sotto. */
export function indietroDisponibile(statoAttuale: unknown): boolean {
  return profonditaDi(statoAttuale) > 0;
}
