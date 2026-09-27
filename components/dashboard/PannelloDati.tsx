"use client";

/* I dati condivisi del pannello: gli ordini e il numero di messaggi nuovi.
   Stanno nel layout, cosi' "Oggi", "Ordini" e i numerini della navigazione
   leggono la stessa lista e passare da una scheda all'altra non ricarica
   niente. Si aggiornano ogni 60 secondi solo se la pagina e' visibile, e
   subito quando Matteo torna sulla scheda del browser. */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { adminApi, api, ApiError, type Ordine } from "@/lib/api";
import { oggiRoma } from "@/lib/operazioni";

const OGNI = 60_000;
/** Tornando sulla scheda si ricarica solo se l'ultimo giro e' piu' vecchio di cosi'. */
const AL_RITORNO = 10_000;

export type DatiPannello = {
  /** null finche' la prima risposta non e' arrivata. */
  ordini: Ordine[] | null;
  /** Quanti ordini chiusi il server manda al massimo (gli aperti arrivano tutti). */
  limiteStorico: number | null;
  /** null se l'elenco dei messaggi non e' disponibile. */
  messaggiNuovi: number | null;
  errore: string;
  /** 401/403: la sessione e' scaduta o l'account non e' piu' admin. */
  sessioneScaduta: boolean;
  aggiornando: boolean;
  aggiornatoAlle: Date | null;
  /** Oggi a Roma, "YYYY-MM-DD", ricalcolato a ogni giro (il pannello resta aperto anche a mezzanotte). */
  oggi: string;
  aggiorna: () => Promise<void>;
  /** Mette nella lista l'ordine appena salvato, senza aspettare il prossimo giro. */
  sostituisciOrdine: (ordine: Ordine) => void;
};

const Contesto = createContext<DatiPannello | null>(null);

export function usePannello() {
  const dati = useContext(Contesto);
  if (!dati) throw new Error("usePannello va usato dentro <PannelloDati>");
  return dati;
}

export default function PannelloDati({ children }: { children: ReactNode }) {
  const [ordini, setOrdini] = useState<Ordine[] | null>(null);
  const [limiteStorico, setLimiteStorico] = useState<number | null>(null);
  const [messaggiNuovi, setMessaggiNuovi] = useState<number | null>(null);
  const [errore, setErrore] = useState("");
  const [sessioneScaduta, setSessioneScaduta] = useState(false);
  const [aggiornando, setAggiornando] = useState(false);
  const [aggiornatoAlle, setAggiornatoAlle] = useState<Date | null>(null);
  const [oggi, setOggi] = useState(() => oggiRoma());
  const inCorso = useRef(false);
  const ultimoGiro = useRef(0);

  const aggiorna = useCallback(async () => {
    if (inCorso.current) return;
    inCorso.current = true;
    setAggiornando(true);
    const [risposta, messaggi] = await Promise.allSettled([api.ordini(), adminApi.messaggi()]);
    if (risposta.status === "fulfilled") {
      setOrdini(risposta.value.orders);
      setLimiteStorico(risposta.value.historyLimit ?? null);
      setErrore("");
      setSessioneScaduta(false);
      setAggiornatoAlle(new Date());
    } else {
      const e = risposta.reason;
      setErrore(e instanceof ApiError ? e.message : "Non riesco a caricare gli ordini. Riprova.");
      setSessioneScaduta(e instanceof ApiError && (e.status === 401 || e.status === 403));
    }
    if (messaggi.status === "fulfilled") setMessaggiNuovi(messaggi.value.messages.filter((m) => m.status === "new").length);
    setOggi(oggiRoma());
    ultimoGiro.current = Date.now();
    inCorso.current = false;
    setAggiornando(false);
  }, []);

  useEffect(() => {
    const primo = window.setTimeout(() => void aggiorna(), 0);
    const giro = window.setInterval(() => {
      if (!document.hidden) void aggiorna();
    }, OGNI);
    const alRitorno = () => {
      if (!document.hidden && Date.now() - ultimoGiro.current > AL_RITORNO) void aggiorna();
    };
    document.addEventListener("visibilitychange", alRitorno);
    return () => {
      window.clearTimeout(primo);
      window.clearInterval(giro);
      document.removeEventListener("visibilitychange", alRitorno);
    };
  }, [aggiorna]);

  const sostituisciOrdine = useCallback((nuovo: Ordine) => {
    setOrdini((lista) => {
      if (!lista) return [nuovo];
      const trovato = lista.some((o) => o.id === nuovo.id);
      return trovato ? lista.map((o) => (o.id === nuovo.id ? { ...o, ...nuovo } : o)) : [nuovo, ...lista];
    });
  }, []);

  const valore = useMemo<DatiPannello>(
    () => ({ ordini, limiteStorico, messaggiNuovi, errore, sessioneScaduta, aggiornando, aggiornatoAlle, oggi, aggiorna, sostituisciOrdine }),
    [ordini, limiteStorico, messaggiNuovi, errore, sessioneScaduta, aggiornando, aggiornatoAlle, oggi, aggiorna, sostituisciOrdine],
  );

  return <Contesto.Provider value={valore}>{children}</Contesto.Provider>;
}
