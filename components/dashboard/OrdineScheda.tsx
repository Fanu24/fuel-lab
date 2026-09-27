"use client";

/* La scheda di un ordine: pannello laterale sul computer, a tutto schermo sul
   telefono. Vive nell'indirizzo (?id=...), cosi' i link delle email aprono
   direttamente l'ordine e il tasto "indietro" del telefono la chiude.

   E' un <dialog> modale: il browser tiene il focus dentro, Esc chiude, il
   resto della pagina diventa inerte. All'apertura il focus va sul nome del
   cliente, alla chiusura torna al bottone da cui era partito. */

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type MouseEvent, type SyntheticEvent } from "react";
import { api, ApiError, ETICHETTE_SERVIZIO, type DettaglioOrdine, type Ordine } from "@/lib/api";
import { Icona } from "./PannelloIcone";
import { usePannello } from "./PannelloDati";
import OrdineGestisci from "./OrdineGestisci";
import { Allergie, NoteCliente, OrdineContatti, OrdineCronologia, OrdinePiatti } from "./OrdineInfo";
import { Avviso, Caricamento, Stato, faTempo, quando } from "./ui";

/* ---------- L'indirizzo ---------- */

/**
 * Legge ?id= e lo scrive. Aprire aggiunge una voce alla cronologia del
 * browser (cosi' "indietro" chiude); chiudere torna indietro se l'abbiamo
 * aperta noi, altrimenti (link da email) toglie solo ?id.
 * Va usato dentro <Suspense>, come ogni useSearchParams.
 */
export function useSchedaUrl() {
  const parametri = useSearchParams();
  const id = parametri.get("id");
  const apertaDaQui = useRef(false);

  const apri = useCallback((nuovo: string) => {
    const p = new URLSearchParams(window.location.search);
    p.set("id", nuovo);
    window.history.pushState(null, "", `?${p.toString()}`);
    apertaDaQui.current = true;
  }, []);

  const chiudi = useCallback(() => {
    if (apertaDaQui.current) {
      apertaDaQui.current = false;
      window.history.back();
      return;
    }
    const p = new URLSearchParams(window.location.search);
    p.delete("id");
    const resto = p.toString();
    window.history.replaceState(null, "", resto ? `?${resto}` : window.location.pathname);
  }, []);

  return { id, apri, chiudi };
}

/* ---------- La scheda ---------- */

export default function OrdineScheda({ id, onChiudi }: { id: string; onChiudi: () => void }) {
  const { ordini, oggi, sostituisciOrdine } = usePannello();
  const dialogo = useRef<HTMLDialogElement>(null);
  const titolo = useRef<HTMLHeadingElement>(null);
  const sporco = useRef(false);
  const chiusaDaNoi = useRef(false);
  const [dettaglio, setDettaglio] = useState<DettaglioOrdine | null>(null);
  const [erroreDettaglio, setErroreDettaglio] = useState<ApiError | null>(null);

  const dallaLista = ordini?.find((o) => o.id === id);
  const aggiornatoLista = dallaLista?.updated_at;

  // Il dettaglio (piano, allenamenti, cronologia) si ricarica quando l'ordine cambia.
  useEffect(() => {
    let vivo = true;
    const t = window.setTimeout(() => {
      api
        .ordine(id)
        .then(({ order }) => {
          if (!vivo) return;
          setDettaglio(order);
          setErroreDettaglio(null);
        })
        .catch((e) => {
          if (vivo) setErroreDettaglio(e instanceof ApiError ? e : new ApiError("Dettagli non disponibili.", 0));
        });
    }, 0);
    return () => {
      vivo = false;
      window.clearTimeout(t);
    };
  }, [id, aggiornatoLista]);

  // Apertura modale, focus sul titolo; alla chiusura il focus torna da dove era partito.
  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    const partenza = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    chiusaDaNoi.current = false;
    if (!d.open) d.showModal();
    titolo.current?.focus();
    return () => {
      chiusaDaNoi.current = true;
      if (d.open) d.close();
      if (partenza && partenza.isConnected && partenza !== document.body) partenza.focus();
    };
  }, []);

  const chiudi = useCallback(() => {
    if (sporco.current && !window.confirm("Hai modifiche non salvate. Chiudere lo stesso?")) return;
    onChiudi();
  }, [onChiudi]);

  const segnaSporco = useCallback((v: boolean) => {
    sporco.current = v;
  }, []);

  const salvato = useCallback(
    (o: Ordine) => {
      sostituisciOrdine(o);
    },
    [sostituisciOrdine],
  );

  function suEsc(e: SyntheticEvent<HTMLDialogElement>) {
    e.preventDefault();
    chiudi();
  }

  function suChiusura() {
    // Chrome chiude comunque al secondo Esc di fila: allinea l'indirizzo.
    // (Se nel frattempo si e' riaperta, l'evento e' vecchio e non conta.)
    if (!chiusaDaNoi.current && !dialogo.current?.open) onChiudi();
  }

  function suClic(e: MouseEvent<HTMLDialogElement>) {
    // Un clic sullo sfondo scuro arriva al <dialog> stesso.
    if (e.target === e.currentTarget) chiudi();
  }

  // La versione piu' recente fra lista e dettaglio.
  const ordine: Ordine | null =
    dallaLista && (!dettaglio || dallaLista.updated_at > dettaglio.updated_at) ? dallaLista : (dettaglio ?? dallaLista ?? null);
  const nonTrovato = !ordine && erroreDettaglio && (erroreDettaglio.status === 404 || ordini !== null);

  return (
    <dialog ref={dialogo} className="pn-scheda" aria-labelledby="scheda-titolo" onCancel={suEsc} onClose={suChiusura} onClick={suClic}>
      <div className="pn-scheda-corpo">
        <header className="pn-scheda-testa">
          <div className="min-w-0 flex-1">
            <p className="pn-occhiello mb-1 hidden sm:block">Scheda ordine · {id.slice(0, 8)}</p>
            <h2 id="scheda-titolo" ref={titolo} tabIndex={-1} className="pn-scheda-titolo">
              {ordine ? ordine.customer_name || "Cliente senza nome" : "Ordine"}
            </h2>
            {ordine ? (
              <>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[16px]">
                  <Stato stato={ordine.status} grande ritiro={ordine.fulfillment === "pickup"} />
                  <span className="font-semibold">
                    {ordine.meals} {ordine.meals === 1 ? "pasto" : "pasti"} · {ordine.fulfillment === "pickup" ? "Ritiro" : "Consegna"}
                  </span>
                </div>
                <p className="mt-1 text-[14px] text-muted">
                  {ETICHETTE_SERVIZIO[ordine.service] ?? ordine.service} · ricevuto {faTempo(ordine.created_at)} ({quando(ordine.created_at)})
                  {ordine.source === "manual" ? (
                    <>
                      {" "}
                      <span className="pn-segno pn-segno-neutro ml-1">{dettaglio?.no_account ? "Inserito a mano · senza account" : "Inserito a mano"}</span>
                    </>
                  ) : null}
                </p>
              </>
            ) : null}
          </div>
          <button type="button" className="pn-chiudi" onClick={chiudi} aria-label="Chiudi la scheda">
            <Icona nome="chiudi" />
          </button>
        </header>

        {ordine ? (
          <OrdineGestisci
            key={ordine.id}
            ordine={ordine}
            oggi={oggi}
            onSalvato={salvato}
            onSporco={segnaSporco}
            senzaAccount={!!dettaglio?.no_account}
            prima={
              <>
                {erroreDettaglio && erroreDettaglio.status !== 404 ? (
                  <Avviso tipo="info">Allenamenti e cronologia non si caricano ({erroreDettaglio.message}). Il resto è aggiornato.</Avviso>
                ) : null}
                {dettaglio?.no_account ? (
                  <Avviso tipo="info">
                    Ordine inserito a mano per un cliente senza account: l’email qui sotto è la tua e non parte nessuna email al cliente. Avvisalo per telefono o WhatsApp.
                  </Avviso>
                ) : null}
                <OrdineContatti ordine={ordine} senzaAccount={!!dettaglio?.no_account} />
                <Allergie testo={ordine.dietary_preferences} />
                <NoteCliente testo={ordine.notes} />
                <OrdinePiatti ordine={ordine} allenamenti={dettaglio?.training} />
              </>
            }
            dopo={
              <OrdineCronologia
                eventi={dettaglio?.events ?? null}
                stato={dettaglio ? "pronto" : erroreDettaglio ? "assente" : "carico"}
              />
            }
          />
        ) : (
          <div className="pn-scheda-scorre">
            {nonTrovato ? (
              <>
                <Avviso tipo="errore">
                  Non trovo questo ordine. Forse il link è vecchio, oppure l’ordine è stato chiuso da molto tempo.
                </Avviso>
                <button type="button" className="pn-tasto justify-self-start" onClick={onChiudi}>
                  Torna all’elenco
                </button>
              </>
            ) : (
              <Caricamento testo="Apro l’ordine…" />
            )}
          </div>
        )}
      </div>
    </dialog>
  );
}
