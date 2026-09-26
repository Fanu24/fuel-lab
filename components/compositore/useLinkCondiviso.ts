"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { leggiLink, linkPiano } from "@/lib/condivisione";
import { usePiano, type Allenamenti, type Piano } from "@/lib/piano";

export type EsitoLink = "nessuno" | "importato" | "chiede" | "accettato" | "rifiutato" | "rotto";

/**
 * Il link della settimana: in arrivo (?p=&a=) e in uscita (copia negli appunti).
 *
 * In arrivo: se la settimana locale e' vuota il link si carica e basta, non
 * c'e' niente da proteggere; se non lo e', si chiede prima di sostituirla.
 * La decisione si prende UNA volta, appena lo store ha letto: dopo
 * l'importazione la settimana non e' piu' vuota, e senza questa memoria la
 * pagina chiederebbe conferma di un'importazione appena fatta. Il ?p= sparisce
 * dall'indirizzo appena ha fatto il suo lavoro, cosi' un F5 non ripropone la
 * domanda.
 */
export function useLinkCondiviso() {
  const { piano, allenamenti, pronto, pasti, sostituisciPiano, impostaAllenamento, svuotaAllenamenti } = usePiano();
  const params = useSearchParams();
  const haLink = params.get("p") !== null;
  const dalLink = useMemo(() => (haLink ? leggiLink(params) : null), [haLink, params]);
  const [esito, setEsito] = useState<EsitoLink>("nessuno");
  const [deciso, setDeciso] = useState(false);
  const applicato = useRef(false);

  function applica(p: Piano, a: Allenamenti) {
    sostituisciPiano(p);
    if (Object.keys(a).length) {
      svuotaAllenamenti();
      for (const [g, t] of Object.entries(a)) impostaAllenamento(g as keyof Allenamenti, t ?? null);
    }
  }
  const pulisci = () => window.history.replaceState(null, "", window.location.pathname);

  // La decisione si prende durante il render, come React documenta per lo stato
  // che dipende da un ingresso cambiato: niente giro in piu' sullo schermo.
  if (pronto && dalLink && !deciso) {
    setDeciso(true);
    setEsito(!dalLink.piano ? "rotto" : pasti === 0 ? "importato" : "chiede");
  }

  // Gli effetti fanno solo cio' che tocca il mondo fuori da React: lo store e l'indirizzo.
  useEffect(() => {
    if (esito === "rotto") pulisci();
    if (esito !== "importato" || applicato.current || !dalLink?.piano) return;
    applicato.current = true;
    applica(dalLink.piano, dalLink.allenamenti);
    pulisci();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- applica e' stabile nei fatti: usa solo azioni dello store
  }, [esito, dalLink]);

  const accetta = () => {
    if (dalLink?.piano) applica(dalLink.piano, dalLink.allenamenti);
    setEsito("accettato");
    pulisci();
  };
  const rifiuta = () => {
    setEsito("rifiutato");
    pulisci();
  };

  /* ---- in uscita ---- */
  const [copiato, setCopiato] = useState<"no" | "si" | "manuale">("no");
  const [url, setUrl] = useState("");
  async function copia() {
    const u = linkPiano(piano, window.location.origin, allenamenti);
    setUrl(u);
    try {
      await navigator.clipboard.writeText(u);
      setCopiato("si");
    } catch {
      // fuori da https o permessi negati: il link si mostra e si copia a mano
      setCopiato("manuale");
    }
  }

  return { esito, accetta, rifiuta, chiudi: () => setEsito("nessuno"), copia, copiato, url };
}
