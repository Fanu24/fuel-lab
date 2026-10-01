/* I filtri della pagina Ordini: chip per stato con i conteggi, ricerca e i due
   filtri rapidi "solo da incassare" e "solo abbonamenti" (uno alla volta, come
   chip a interruttore). Elenco/colonne e CSV stanno accanto al conteggio dei
   risultati (OrdiniVista), cosi' sul telefono i filtri occupano poco. */

import { useEffect, useRef } from "react";
import { FILTRI_SPECIALI, FILTRI_STATO, type FiltroSpeciale, type FiltroStato } from "@/lib/operazioni";
import { Icona } from "./PannelloIcone";

export type Vista = "elenco" | "colonne";

export default function OrdiniFiltri({
  stato,
  conti,
  onStato,
  ricerca,
  onRicerca,
  speciale,
  onSpeciale,
}: {
  stato: FiltroStato;
  conti: Record<FiltroStato, number> | null;
  onStato: (s: FiltroStato) => void;
  ricerca: string;
  onRicerca: (t: string) => void;
  speciale: FiltroSpeciale | null;
  onSpeciale: (s: FiltroSpeciale | null) => void;
}) {
  const alternato = (s: FiltroSpeciale) => onSpeciale(speciale === s ? null : s);

  // Sul telefono i chip scorrono di lato: quello scelto (anche da un link, ?stato=cancelled) deve stare in vista.
  const chips = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const riga = chips.current;
    const scelto = riga?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (riga && scelto && riga.scrollWidth > riga.clientWidth) {
      riga.scrollTo({ left: scelto.offsetLeft - (riga.clientWidth - scelto.offsetWidth) / 2, behavior: "auto" });
    }
  }, [stato]);

  return (
    <div className="grid gap-3">
      <div ref={chips} className="pn-chips" role="group" aria-label="Filtra per stato">
        {FILTRI_STATO.map((f) => (
          <button key={f.id} type="button" className="pn-chip" aria-pressed={stato === f.id} onClick={() => onStato(f.id)}>
            {f.label}
            <span className="pn-chip-conto num">{conti ? conti[f.id] : "·"}</span>
          </button>
        ))}
      </div>

      <div className="pn-strumenti">
        <div className="campo min-w-0">
          <label htmlFor="ordini-cerca" className="sr-only">Cerca un ordine</label>
          <div className="pn-cerca-campo">
            <Icona nome="cerca" className="size-5" />
            <input
              id="ordini-cerca"
              type="search"
              value={ricerca}
              onChange={(e) => onRicerca(e.target.value)}
              placeholder="Cerca per nome, telefono, comune…"
              autoComplete="off"
              enterKeyHint="search"
            />
          </div>
        </div>
        <div className="pn-chips-rapidi" role="group" aria-label="Filtri rapidi">
          <button type="button" className="pn-chip" aria-pressed={speciale === "incassare"} onClick={() => alternato("incassare")}>
            Solo da incassare
          </button>
          <button type="button" className="pn-chip" aria-pressed={speciale === "abbonamenti"} onClick={() => alternato("abbonamenti")}>
            Solo abbonamenti
          </button>
          {speciale && speciale !== "incassare" && speciale !== "abbonamenti" ? (
            <button type="button" className="pn-chip" aria-pressed="true" onClick={() => onSpeciale(null)} aria-label={`Togli il filtro ${FILTRI_SPECIALI[speciale]}`}>
              {FILTRI_SPECIALI[speciale]}
              <Icona nome="chiudi" className="size-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Elenco o colonne, e l'esportazione CSV dell'elenco che si vede. */
export function OrdiniVista({
  vista,
  onVista,
  onEsporta,
  esportabili,
}: {
  vista: Vista;
  onVista: (v: Vista) => void;
  onEsporta: () => void;
  esportabili: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="pn-segmenti" role="group" aria-label="Come vedere gli ordini">
        <button type="button" aria-pressed={vista === "elenco"} onClick={() => onVista("elenco")}>
          <Icona nome="elenco" className="hidden size-5 sm:block" />
          Elenco
        </button>
        <button type="button" aria-pressed={vista === "colonne"} onClick={() => onVista("colonne")}>
          <Icona nome="colonne" className="hidden size-5 sm:block" />
          Colonne
        </button>
      </div>
      <button type="button" className="pn-tasto" onClick={onEsporta} disabled={!esportabili} aria-label="Esporta CSV dell’elenco filtrato">
        <Icona nome="scarica" className="size-5" />
        <span className="sm:hidden">CSV</span>
        <span className="hidden sm:inline">Esporta CSV</span>
      </button>
    </div>
  );
}
