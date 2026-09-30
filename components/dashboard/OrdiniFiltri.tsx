/* I filtri della pagina Ordini: chip per stato con i conteggi, ricerca,
   "solo da incassare" o "solo abbonamenti" (uno alla volta), scelta
   elenco/colonne ed esportazione CSV. */

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
  vista,
  onVista,
  onEsporta,
  esportabili,
}: {
  stato: FiltroStato;
  conti: Record<FiltroStato, number> | null;
  onStato: (s: FiltroStato) => void;
  ricerca: string;
  onRicerca: (t: string) => void;
  speciale: FiltroSpeciale | null;
  onSpeciale: (s: FiltroSpeciale | null) => void;
  vista: Vista;
  onVista: (v: Vista) => void;
  onEsporta: () => void;
  esportabili: number;
}) {
  return (
    <div className="grid gap-5">
      <div className="pn-chips" role="group" aria-label="Filtra per stato">
        {FILTRI_STATO.map((f) => (
          <button key={f.id} type="button" className="pn-chip" aria-pressed={stato === f.id} onClick={() => onStato(f.id)}>
            {f.label}
            <span className="pn-chip-conto num">{conti ? conti[f.id] : "·"}</span>
          </button>
        ))}
      </div>

      <div className="pn-strumenti">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div className="campo pn-cerca min-w-0 flex-1 basis-72">
            <label htmlFor="ordini-cerca">Cerca</label>
            <Icona nome="cerca" className="size-5" />
            <input
              id="ordini-cerca"
              type="search"
              value={ricerca}
              onChange={(e) => onRicerca(e.target.value)}
              placeholder="Nome, telefono, email, comune, formula…"
              autoComplete="off"
              enterKeyHint="search"
            />
          </div>
          <label className="pn-casella">
            <input type="checkbox" checked={speciale === "incassare"} onChange={(e) => onSpeciale(e.target.checked ? "incassare" : null)} />
            Solo da incassare
          </label>
          <label className="pn-casella">
            <input type="checkbox" checked={speciale === "abbonamenti"} onChange={(e) => onSpeciale(e.target.checked ? "abbonamenti" : null)} />
            Solo abbonamenti
          </label>
          {speciale && speciale !== "incassare" && speciale !== "abbonamenti" ? (
            <button type="button" className="pn-chip" aria-pressed="true" onClick={() => onSpeciale(null)} aria-label={`Togli il filtro ${FILTRI_SPECIALI[speciale]}`}>
              {FILTRI_SPECIALI[speciale]}
              <Icona nome="chiudi" className="size-4" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
      </div>
    </div>
  );
}
