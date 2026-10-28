"use client";

import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { ApiError } from "@/lib/api";

/* Bottoni, fogli e avvisi del pannello di Matteo. Tutto da toccare: almeno 48 px di altezza. */

/** Il testo da mostrare per un errore di rete o del server. */
export function messaggioDiErrore(e: unknown): string {
  return e instanceof ApiError ? e.message : "Qualcosa non va. Riprova.";
}

export function Bottone({ variante = "tenue", className, type = "button", ...resto }: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: "verde" | "chiaro" | "rosso" | "rosso-chiaro" | "tenue" }) {
  return <button type={type} className={`pm-bottone pm-bottone-${variante}${className ? ` ${className}` : ""}`} {...resto} />;
}

/* I fogli aperti in questo momento: il pannello non si ricarica sotto le mani di chi sta scrivendo. */
let fogliAperti = 0;

export function unFoglioAperto(): boolean {
  return fogliAperti > 0;
}

/**
 * Il pannello che sale dal basso. Stesso comportamento di `Sheet` in SimpleAdmin:
 * focus dentro (e intrappolato), Escape chiude, lo scroll della pagina si blocca,
 * e alla chiusura il focus torna dov'era.
 */
/* Un foglio aperto è una voce della storia (stesso indirizzo, con `foglio: true`): il gesto "indietro"
   del telefono lo chiude e lascia la pagina com'è. Quando si chiude in altro modo, la voce si toglie con
   history.back(). Quei popstate li contiamo qui, perché non chiudano un altro foglio. */
let indietroNostri = 0;

export function Foglio({ titolo, chiudi, children }: { titolo: string; chiudi: () => void; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const chiudiRef = useRef(chiudi);
  useEffect(() => {
    chiudiRef.current = chiudi;
  });
  useEffect(() => {
    fogliAperti++;
    const precedente = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.history.pushState({ ...window.history.state, foglio: true }, "");
    const alIndietro = () => {
      if (indietroNostri > 0) {
        indietroNostri--;
        return;
      }
      chiudiRef.current();
    };
    window.addEventListener("popstate", alIndietro);
    ref.current?.querySelector<HTMLElement>("button, input, select, textarea, a[href]")?.focus();
    return () => {
      window.removeEventListener("popstate", alIndietro);
      fogliAperti--;
      document.body.style.overflow = overflow;
      // Se la voce attuale è ancora quella del foglio (chiuso da Chiudi, Escape, un salvataggio), la si toglie.
      // Se è già tornata indietro col gesto, non si fa niente.
      if (window.history.state?.foglio === true) {
        indietroNostri++;
        window.history.back();
      }
      if (precedente instanceof HTMLElement) precedente.focus();
    };
  }, []);
  return (
    <div
      className="pm-fondo"
      onKeyDown={(e) => {
        if (e.key === "Escape") chiudi();
        if (e.key !== "Tab") return;
        const campi = ref.current?.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]");
        if (!campi?.length) return;
        const primo = campi[0];
        const ultimo = campi[campi.length - 1];
        if (e.shiftKey && document.activeElement === primo) { e.preventDefault(); ultimo.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primo.focus(); }
      }}
    >
      <section ref={ref} role="dialog" aria-modal="true" aria-label={titolo} className="pm-foglio">
        <div className="pm-foglio-testa">
          <h2>{titolo}</h2>
          <Bottone onClick={chiudi}>Chiudi</Bottone>
        </div>
        <div className="pm-foglio-corpo">{children}</div>
      </section>
    </div>
  );
}

/** Un errore in italiano. `riprova` mostra il bottone "Riprova"; `accesso` il link per rientrare. */
export function Errore({ messaggio, riprova, accesso }: { messaggio: string; riprova?: () => void; accesso?: boolean }) {
  return (
    <div className="pm-errore" role="alert">
      <p>{messaggio}</p>
      {(riprova || accesso) && (
        <div className="pm-azioni">
          {riprova && <Bottone variante="verde" onClick={riprova}>Riprova</Bottone>}
          {accesso && <a className="pm-bottone pm-bottone-verde" href="/admin">Rientra</a>}
        </div>
      )}
    </div>
  );
}

/** Una nota neutra, senza azioni. */
export function Avviso({ children }: { children: ReactNode }) {
  return <div className="pm-avviso">{children}</div>;
}
