"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { leggiLink, linkPiano } from "@/lib/condivisione";
import { usePiano, type Allenamenti, type Piano } from "@/lib/piano";

export type EsitoLink = "nessuno" | "importato" | "chiede" | "accettato" | "rifiutato" | "rotto" | "vuoto";

/* L'indirizzo letto dal browser, non da useSearchParams: quell'hook costringe la
   pagina a mostrare un guscio vuoto fino all'idratazione (niente titolo, niente
   compositore nell'HTML). Cosi' il server disegna la pagina intera, senza link, e
   il browser vi aggiunge quello che trova dopo l'idratazione. */
const ascoltaIndirizzo = (f: () => void) => {
  window.addEventListener("popstate", f);
  return () => window.removeEventListener("popstate", f);
};

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
  const { piano, allenamenti, pronto, pasti, sostituisciPiano, sostituisciAllenamenti } = usePiano();
  const ricerca = useSyncExternalStore(ascoltaIndirizzo, () => window.location.search, () => "");
  const params = useMemo(() => new URLSearchParams(ricerca), [ricerca]);
  const haLink = params.get("p") !== null;
  const dalLink = useMemo(() => (haLink ? leggiLink(params) : null), [haLink, params]);
  const [esito, setEsito] = useState<EsitoLink>("nessuno");
  const [deciso, setDeciso] = useState(false);
  const applicato = useRef(false);

  function applica(p: Piano, a: Allenamenti) {
    sostituisciPiano(p);
    if (Object.keys(a).length) sostituisciAllenamenti(a);
  }
  const pulisci = () => window.history.replaceState(null, "", window.location.pathname);

  // La decisione si prende durante il render, come React documenta per lo stato
  // che dipende da un ingresso cambiato: niente giro in piu' sullo schermo.
  if (pronto && dalLink && !deciso) {
    setDeciso(true);
    // un link senza pasti ne' allenamenti non ha niente da caricare e, a settimana piena, non deve chiedere di buttarla via
    const senzaNiente = !!dalLink.piano && Object.keys(dalLink.piano).length === 0 && Object.keys(dalLink.allenamenti).length === 0;
    setEsito(!dalLink.piano ? "rotto" : senzaNiente ? "vuoto" : pasti === 0 ? "importato" : "chiede");
  }

  // Gli effetti fanno solo cio' che tocca il mondo fuori da React: lo store e l'indirizzo.
  useEffect(() => {
    if (esito === "rotto" || esito === "vuoto") pulisci();
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
  // Il link copiato vale per la settimana di quel momento: se poi la si cambia, "Link
  // copiato" smette di essere vero. Per questo si tiene a quale settimana si riferisce.
  const [ultimaCopia, setCopia] = useState<{ url: string; esito: "si" | "manuale"; di: string } | null>(null);
  const attuale = useMemo(() => linkPiano(piano, "", allenamenti), [piano, allenamenti]);
  const valido = ultimaCopia && ultimaCopia.di === attuale ? ultimaCopia : null;

  async function copia(): Promise<"si" | "manuale"> {
    const u = linkPiano(piano, window.location.origin, allenamenti);
    try {
      await navigator.clipboard.writeText(u);
      setCopia({ url: u, esito: "si", di: attuale });
      return "si";
    } catch {
      // fuori da https o permessi negati: il link si mostra e si copia a mano
      setCopia({ url: u, esito: "manuale", di: attuale });
      return "manuale";
    }
  }

  return {
    esito,
    accetta,
    rifiuta,
    chiudi: () => setEsito("nessuno"),
    copia,
    copiato: valido?.esito ?? "no",
    url: valido?.url ?? "",
  };
}
