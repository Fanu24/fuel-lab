"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ApiError, api, impostazioniVuote, pannelloApi, type Impostazioni } from "@/lib/api";
import { giorniDellaSettimana, lunediDi, type DatiPannello } from "@/lib/pannello";
import { indietroDisponibile, profonditaDopoVai, urlDiVista, vistaDaUrl, type Vista } from "@/lib/pannello-navigazione";
import { oggiRoma } from "@/lib/produzione";
import { Bottone, Errore, unFoglioAperto } from "./ui";
import VistaGiorno from "./VistaGiorno";

/* Il pannello di Matteo: una sola pagina, con le viste dentro. Le viste si cambiano
   con `vai`, che lascia una voce nella storia del browser; "Indietro" fa lo stesso
   effetto del gesto "indietro" del telefono (vedi lib/pannello-navigazione.ts). La vista
   si legge dall'indirizzo (?vista=…&cliente=…), così la notifica apre `?vista=nuovi`. */

export type { Vista } from "@/lib/pannello-navigazione";

/** Lo stato che il pannello passa alle viste. `dati` è la settimana di `giorno`, null mentre si carica. */
export type Condiviso = {
  giorno: string;
  dati: DatiPannello | null;
  impostazioni: Impostazioni;
  ricarica: () => Promise<void>;
  vai: (v: Vista) => void;
  cambiaGiorno: (giorno: string) => void;
};

/* L'indirizzo come archivio esterno: si legge con useSyncExternalStore; `vai` e `indietro`
   avvisano chi ascolta, e il popstate del browser fa lo stesso. */
const ascoltatoriIndirizzo = new Set<() => void>();

function ascoltaIndirizzo(avvisa: () => void): () => void {
  ascoltatoriIndirizzo.add(avvisa);
  window.addEventListener("popstate", avvisa);
  return () => {
    ascoltatoriIndirizzo.delete(avvisa);
    window.removeEventListener("popstate", avvisa);
  };
}

function avvisaIndirizzo() {
  ascoltatoriIndirizzo.forEach((avvisa) => avvisa());
}

const nessunAscolto = () => () => {};

type ErroreCaricamento = { lunedi: string; messaggio: string; accesso: boolean };

function erroreDi(lunedi: string, e: unknown): ErroreCaricamento {
  if (e instanceof ApiError && e.status === 401) return { lunedi, messaggio: "L'accesso è scaduto.", accesso: true };
  if (e instanceof ApiError) return { lunedi, messaggio: e.message, accesso: false };
  return { lunedi, messaggio: "Qualcosa non va. Riprova.", accesso: false };
}

export default function PannelloMatteo() {
  // "" finché il browser non dice qual è oggi: la pagina prerenderizzata non porta una data sbagliata,
  // e all'idratazione React passa da sola al valore vero.
  const oggi = useSyncExternalStore(nessunAscolto, oggiRoma, () => "");
  const [sceltoPerData, setSceltoPerData] = useState<string | null>(null);
  const giorno = sceltoPerData ?? oggi;
  const search = useSyncExternalStore(ascoltaIndirizzo, () => window.location.search, () => "");
  const vista = vistaDaUrl(search);

  // L'ultima settimana caricata con successo: resta mostrata (e con lei gli ordini nuovi) mentre
  // se ne carica un'altra o se il caricamento fallisce.
  const [settimana, setSettimana] = useState<{ lunedi: string; dati: DatiPannello } | null>(null);
  const [errore, setErrore] = useState<ErroreCaricamento | null>(null);
  const [impostazioni, setImpostazioni] = useState<Impostazioni>(impostazioniVuote);
  const richiesta = useRef(0);

  const lunedi = giorno ? lunediDi(giorno) : "";
  // Un errore vale solo per la settimana in cui è successo: non si mostra sopra i dati di un'altra.
  const erroreDelGiorno = errore && errore.lunedi === lunedi ? errore : null;
  const datiDelGiorno = settimana && settimana.lunedi === lunedi ? settimana.dati : null;
  const nuovi = settimana?.dati.nuovi.length ?? 0;

  // Di richieste ne conta solo l'ultima: una risposta vecchia non sovrascrive una nuova.
  const carica = useCallback((lun: string) => {
    const id = ++richiesta.current;
    return pannelloApi.pannello(lun, giorniDellaSettimana(lun)[6]).then(
      (dati) => {
        if (id !== richiesta.current) return;
        setSettimana({ lunedi: lun, dati });
        setErrore(null);
      },
      (e: unknown) => {
        if (id !== richiesta.current) return;
        setErrore(erroreDi(lun, e));
      },
    );
  }, []);

  // Un caricamento nuovo cancella l'errore di quello vecchio (la richiesta lo decide, non l'effetto).
  const ricarica = useCallback(() => {
    if (!lunedi) return Promise.resolve();
    setErrore(null);
    return carica(lunedi);
  }, [lunedi, carica]);

  // Le impostazioni del sito: servono alle schermate dei piatti; se non arrivano restano quelle vuote.
  useEffect(() => {
    let vivo = true;
    api.impostazioni(true).then((r) => { if (vivo) setImpostazioni(r.settings); }).catch(() => {});
    return () => { vivo = false; };
  }, []);

  // Si carica la settimana di `giorno`, e di nuovo quando il giorno scelto passa a un'altra settimana.
  useEffect(() => {
    if (lunedi) void carica(lunedi);
  }, [lunedi, carica]);

  // Ogni 60 secondi se la pagina è visibile e nessun foglio è aperto; subito al ritorno sulla pagina.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible" && !unFoglioAperto()) void ricarica();
    }, 60_000);
    const alRitorno = () => {
      if (document.visibilityState === "visible") void ricarica();
    };
    document.addEventListener("visibilitychange", alRitorno);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", alRitorno);
    };
  }, [ricarica]);

  const vai = useCallback((v: Vista) => {
    const { pathname, search: attuale } = window.location;
    const url = urlDiVista(v, pathname);
    if (url === `${pathname}${attuale}`) return;
    window.history.pushState({ pannello: true, profondita: profonditaDopoVai(window.history.state, true) }, "", url);
    avvisaIndirizzo();
  }, []);

  // "Indietro" è il gesto "indietro" del telefono se la storia ha voci del pannello sotto;
  // altrimenti (si è arrivati direttamente su una vista) riporta alla schermata del giorno.
  const indietro = useCallback(() => {
    if (indietroDisponibile(window.history.state)) {
      window.history.back();
      return;
    }
    const { pathname } = window.location;
    window.history.replaceState({ pannello: true, profondita: 0 }, "", urlDiVista({ tipo: "giorno" }, pathname));
    avvisaIndirizzo();
  }, []);

  const cambiaGiorno = useCallback((g: string) => {
    const nuovaSettimana = lunediDi(g);
    if (nuovaSettimana !== lunedi) setErrore(null);
    setSceltoPerData(g);
  }, [lunedi]);

  const testa = (
    <header className="pm-testa">
      <div>
        <h1>Ciao Matteo</h1>
        <p>FUEL LAB</p>
      </div>
      <Bottone onClick={() => vai({ tipo: "altro" })}>Altro</Bottone>
    </header>
  );

  if (vista.tipo !== "giorno") {
    return (
      <div className="pm-app">
        <header className="pm-testa">
          <Bottone onClick={indietro}>← Indietro</Bottone>
        </header>
        <main className="pm-corpo">
          <p className="pm-carico">In arrivo.</p>
        </main>
      </div>
    );
  }

  if (!giorno) {
    return (
      <div className="pm-app">
        {testa}
        <main className="pm-corpo">
          <p className="pm-carico" role="status">Carico…</p>
        </main>
      </div>
    );
  }

  // Sopra la settimana: il riquadro degli ordini nuovi e, se c'è, l'errore. Restano anche mentre si carica.
  const sopra = (
    <>
      {nuovi > 0 && (
        <button type="button" className="pm-nuovi" onClick={() => vai({ tipo: "nuovi" })}>
          <span>{nuovi === 1 ? "1 ordine nuovo dal sito" : `${nuovi} ordini nuovi dal sito`}</span>
          <span>Apri →</span>
        </button>
      )}
      {erroreDelGiorno && (
        <Errore
          messaggio={erroreDelGiorno.messaggio}
          riprova={erroreDelGiorno.accesso ? undefined : () => void ricarica()}
          accesso={erroreDelGiorno.accesso}
        />
      )}
    </>
  );

  const condiviso: Condiviso = { giorno, dati: datiDelGiorno, impostazioni, ricarica, vai, cambiaGiorno };
  return (
    <div className="pm-app">
      {testa}
      <VistaGiorno
        pannello={condiviso}
        sopra={sopra}
        senzaDati={erroreDelGiorno ? null : <p className="pm-carico" role="status">Carico…</p>}
      />
    </div>
  );
}
