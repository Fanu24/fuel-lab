"use client";

import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";

/* Bottoni, fogli e avvisi del pannello di Matteo. Tutto da toccare: almeno 48 px di altezza. */

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
export function Foglio({ titolo, chiudi, children }: { titolo: string; chiudi: () => void; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    fogliAperti++;
    const precedente = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>("button, input, select, textarea, a[href]")?.focus();
    return () => {
      fogliAperti--;
      document.body.style.overflow = overflow;
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
