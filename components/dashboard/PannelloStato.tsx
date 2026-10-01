"use client";

/* Pezzi comuni a "Oggi" e "Ordini": l'ora dell'ultimo aggiornamento con il
   bottone Aggiorna, l'errore dei dati e le azioni veloci (un tocco per
   cambiare stato o segnare pagato) con l'avviso "Annulla" in basso. */

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, type ModificaOrdine, type Ordine } from "@/lib/api";
import { Avviso } from "./ui";
import { Icona } from "./PannelloIcone";
import { usePannello } from "./PannelloDati";

const oraBreve = (d: Date) => d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

/** "Aggiornato alle 14:03" e il bottone per rifare subito il giro. */
export function Aggiornamento() {
  const { aggiornando, aggiornatoAlle, aggiorna, errore } = usePannello();
  return (
    <div className="pn-aggiornato">
      <span className="pn-aggiornato-ora num">{aggiornatoAlle ? `Aggiornato alle ${oraBreve(aggiornatoAlle)}` : errore ? "Non aggiornato" : "Carico i dati…"}</span>
      <button type="button" className="pn-tasto" onClick={() => void aggiorna()} disabled={aggiornando} aria-busy={aggiornando}>
        <Icona nome="aggiorna" className={`size-5 ${aggiornando ? "animate-spin" : ""}`} />
        Aggiorna
      </button>
    </div>
  );
}

/** L'errore dell'ultimo giro. Se la sessione e' scaduta, il link per rientrare. */
export function ErroreDati() {
  const { errore, sessioneScaduta, ordini, aggiorna, aggiornando } = usePannello();
  const percorso = usePathname();
  // Dopo l'accesso si torna dov'era, filtri e scheda compresi.
  const query = useSearchParams().toString();
  if (!errore) return null;
  if (sessioneScaduta) {
    return (
      <Avviso tipo="errore">
        La sessione è scaduta.{" "}
        <Link href={`/accedi?next=${encodeURIComponent(query ? `${percorso}?${query}` : percorso)}`} className="underline">Accedi di nuovo</Link>{" "}
        per continuare.
      </Avviso>
    );
  }
  return (
    <div className="grid gap-3">
      <Avviso tipo="errore">{errore}{ordini ? " Intanto vedi gli ultimi dati caricati." : ""}</Avviso>
      {/* Mai caricato niente: sotto restano gli scheletri, un tocco per riprovare subito. */}
      {ordini ? null : (
        <button type="button" className="pn-tasto justify-self-start" onClick={() => void aggiorna()} disabled={aggiornando}>
          Riprova
        </button>
      )}
    </div>
  );
}

/* ---------- Azioni veloci ---------- */

type Avvisino = { testo: string; errore?: boolean; annulla?: () => void; accedi?: boolean };

/** L'indirizzo per rientrare e tornare dov'era (filtri e scheda compresi). */
const indirizzoAccesso = () => `/accedi?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`;

/**
 * Il testo di un tocco veloce andato male. Il server, quando l'ordine e' cambiato in un'altra scheda, parla di "scheda"
 * ricaricata: qui non c'e' nessuna scheda aperta, c'e' l'elenco, ed e' quello che si aggiorna.
 */
function testoErrore(e: unknown, ripiego: string) {
  if (!(e instanceof ApiError)) return ripiego;
  if (e.status === 409) return e.message.replace(/Ho ricaricato la scheda, controlla e riprova\./, "Ho aggiornato l’elenco: controlla e riprova.");
  return e.message;
}

/** La modifica che rimette le cose come prima (senza email). */
function inverso(prima: Ordine, modifica: ModificaOrdine): ModificaOrdine | null {
  if (modifica.status !== undefined) return { status: prima.status, notify: false };
  if (modifica.paid !== undefined) return { paid: !!prima.paid };
  return null;
}

/**
 * Un tocco = una PATCH. L'ordine aggiornato entra subito nella lista condivisa
 * e in basso compare l'avviso con "Annulla" per 8 secondi.
 */
export function useAzioniVeloci() {
  const { sostituisciOrdine, aggiorna } = usePannello();
  const [avviso, setAvviso] = useState<Avvisino | null>(null);
  const [inCorso, setInCorso] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  // Un secondo tocco nello stesso istante non deve partire: lo stato React arriva dopo, il segnale qui subito.
  const occupato = useRef(false);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const mostra = useCallback((a: Avvisino) => {
    window.clearTimeout(timer.current);
    setAvviso(a);
    timer.current = window.setTimeout(() => setAvviso(null), 8000);
  }, []);

  const modifica = useCallback(
    async (ordine: Ordine, cambio: ModificaOrdine, fatto: string, annullabile = true) => {
      if (occupato.current) return;
      occupato.current = true;
      setInCorso(ordine.id);
      try {
        const { order } = await api.modificaOrdine(ordine.id, { ...cambio, expectedStatus: ordine.status });
        sostituisciOrdine(order);
        const indietro = annullabile ? inverso(ordine, cambio) : null;
        mostra({
          testo: fatto,
          annulla: indietro
            ? () => {
                setAvviso(null);
                void api
                  .modificaOrdine(ordine.id, { ...indietro, expectedStatus: order.status })
                  .then(({ order: ripristinato }) => {
                    sostituisciOrdine(ripristinato);
                    mostra({ testo: "Fatto: modifica annullata." });
                  })
                  .catch((e) => mostra({ testo: testoErrore(e, "Non riesco ad annullare."), errore: true, accedi: e instanceof ApiError && e.status === 401 }));
              }
            : undefined,
        });
      } catch (e) {
        mostra({ testo: testoErrore(e, "Modifica non salvata. Riprova."), errore: true, accedi: e instanceof ApiError && e.status === 401 });
        // L'ordine e' cambiato altrove (409) o la sessione e' scaduta (401): la riga sullo schermo e' vecchia, si rifa il giro subito.
        if (e instanceof ApiError && (e.status === 409 || e.status === 401)) void aggiorna();
      } finally {
        occupato.current = false;
        setInCorso(null);
      }
    },
    [aggiorna, mostra, sostituisciOrdine],
  );

  const avvisoInBasso = (
    <div role="status" aria-live="polite">
      {avviso ? (
        <div className={`pn-toast ${avviso.errore ? "pn-toast-errore" : ""}`}>
          <span>{avviso.testo}</span>
          {avviso.accedi ? <a href={indirizzoAccesso()}>Accedi</a> : null}
          {avviso.annulla ? <button type="button" onClick={avviso.annulla}>Annulla</button> : null}
          <button type="button" aria-label="Chiudi l’avviso" onClick={() => setAvviso(null)}>
            <Icona nome="chiudi" className="size-5" />
          </button>
        </div>
      ) : null}
    </div>
  );

  return { modifica, inCorso, avvisoInBasso };
}
