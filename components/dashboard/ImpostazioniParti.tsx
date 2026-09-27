"use client";

/* I pezzi comuni dei tre riquadri di /dashboard/impostazioni: la cornice, la
   riga dell'esito dopo un salvataggio e l'avviso del browser se si esce con
   modifiche non salvate. */

import { forwardRef, useEffect, type ReactNode, type Ref } from "react";
import type { Impostazioni } from "@/lib/api";

/** Salva una o piu' parti e restituisce tutte le impostazioni come le ha scritte il server. */
export type Salva = (modifica: Partial<Impostazioni>) => Promise<Impostazioni>;

export type Esito = { tipo: "ok" | "errore" | "info"; testo: string } | null;

/** "Salvato alle 14:03": l'ora del salvataggio, cosi' due salvataggi di fila si distinguono. */
export const alle = () =>
  new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" }).format(new Date());

export const messaggio = (e: unknown, ripiego = "errore del server") => (e instanceof Error && e.message ? e.message : ripiego);

export function Riquadro({
  id,
  titolo,
  sotto,
  children,
  piede,
}: {
  id: string;
  titolo: string;
  sotto: ReactNode;
  children: ReactNode;
  piede?: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-titolo`} className="pn-imp-riquadro">
      <header className="pn-imp-testa">
        <h2 id={`${id}-titolo`} className="pn-h2">{titolo}</h2>
        <p className="pn-sotto">{sotto}</p>
      </header>
      <div className="pn-imp-corpo">{children}</div>
      {piede ? <div className="pn-imp-piede">{piede}</div> : null}
    </section>
  );
}

/**
 * L'esito dell'ultimo salvataggio. Il contenitore e' sempre presente (una
 * regione live nata vuota viene letta davvero) e si puo' mettere a fuoco:
 * chi ha premuto "Salva" ci viene portato se il fuoco e' caduto sul body.
 */
export const EsitoSalvataggio = forwardRef(function EsitoSalvataggio({ esito }: { esito: Esito }, ref: Ref<HTMLDivElement>) {
  return (
    <div ref={ref} tabIndex={-1} aria-live="polite" className="pn-imp-esito outline-none">
      {esito ? (
        <p className={`pn-avviso pn-avviso-${esito.tipo}`} role={esito.tipo === "errore" ? "alert" : undefined}>
          {esito.testo}
        </p>
      ) : null}
    </div>
  );
});

/** Col fuoco sul body (bottone appena sparito o spento) lo porta sull'esito; se Matteo sta scrivendo altrove, lo lascia li'. */
export function useFuocoSullEsito(esito: Esito, area: { current: HTMLElement | null }) {
  useEffect(() => {
    if (!esito) return;
    const attivo = document.activeElement;
    if (!attivo || attivo === document.body) area.current?.focus();
  }, [esito, area]);
}

/** Chiudendo o ricaricando la scheda con modifiche non salvate il browser chiede conferma. */
export function useAvvisoUscita(nonSalvato: boolean) {
  useEffect(() => {
    if (!nonSalvato) return;
    const ferma = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", ferma);
    return () => window.removeEventListener("beforeunload", ferma);
  }, [nonSalvato]);
}
