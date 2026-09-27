/* I mattoncini del modulo "Nuovo ordine a mano": un campo con etichetta,
   errore e aiuto collegati via aria-describedby, e un gruppo di scelte a
   pillola (radio veri, nascosti dietro l'etichetta: frecce e spazio
   funzionano come sempre). Stili .campo e .pn-scelta gia' esistenti. */

import type { ReactNode } from "react";

export type AriaCampo = { id: string; "aria-invalid": true | undefined; "aria-describedby": string | undefined };

export function Campo({
  id,
  etichetta,
  errore,
  aiuto,
  className = "",
  children,
}: {
  id: string;
  etichetta: ReactNode;
  errore?: string;
  aiuto?: ReactNode;
  className?: string;
  children: (aria: AriaCampo) => ReactNode;
}) {
  const idErrore = `${id}-errore`;
  const idAiuto = `${id}-aiuto`;
  const descritto = [errore ? idErrore : "", aiuto ? idAiuto : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`campo min-w-0 ${className}`}>
      <label htmlFor={id}>{etichetta}</label>
      {children({ id, "aria-invalid": errore ? true : undefined, "aria-describedby": descritto })}
      {errore ? <p id={idErrore} className="pn-errore-campo">{errore}</p> : null}
      {aiuto ? <p id={idAiuto} className="pn-aiuto">{aiuto}</p> : null}
    </div>
  );
}

/** Pillola scelta: di base inchiostro pieno; `classe` per i colori di stato (.pn-scelta-requested...). */
const PIENA = "has-[:checked]:bg-ink has-[:checked]:text-paper";

export function Scelte<T extends string>({
  nome,
  legenda,
  valore,
  opzioni,
  onScegli,
  aiuto,
}: {
  nome: string;
  legenda: string;
  valore: T;
  opzioni: { id: T; label: ReactNode; classe?: string }[];
  onScegli: (valore: T) => void;
  aiuto?: ReactNode;
}) {
  return (
    <fieldset className="min-w-0" aria-describedby={aiuto ? `${nome}-aiuto` : undefined}>
      <legend className="pn-legenda">{legenda}</legend>
      <div className="pn-scelte">
        {opzioni.map((o) => (
          <label key={o.id} className={`pn-scelta ${o.classe ?? PIENA}`}>
            <input type="radio" name={nome} value={o.id} checked={valore === o.id} onChange={() => onScegli(o.id)} />
            {o.label}
          </label>
        ))}
      </div>
      {aiuto ? <p id={`${nome}-aiuto`} className="pn-aiuto mt-2">{aiuto}</p> : null}
    </fieldset>
  );
}
