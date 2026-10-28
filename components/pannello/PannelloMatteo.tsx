"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ApiError, api, impostazioniVuote, pannelloApi, type Impostazioni, type Ordine } from "@/lib/api";
import { giorniDellaSettimana, lunediDi, type ClienteMatteo, type DatiPannello } from "@/lib/pannello";
import { indietroDisponibile, statoDopoVai, urlDiVista, vistaDaUrl, type Vista } from "@/lib/pannello-navigazione";
import { oggiRoma } from "@/lib/produzione";
import Altro from "./Altro";
import GuidaInstallazione from "./GuidaInstallazione";
import ModuloCliente from "./ModuloCliente";
import OrdiniNuovi from "./OrdiniNuovi";
import SceltaCliente from "./SceltaCliente";
import SettimanaCliente from "./SettimanaCliente";
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
  /** Gli ordini nuovi dell'ultima settimana caricata con successo; null finche' non ce n'e' stata una. */
  nuovi: Ordine[] | null;
  /** L'errore dell'ultimo caricamento della settimana di `giorno`, se c'e'. */
  erroreCaricamento: { messaggio: string; accesso: boolean } | null;
  /** Toglie subito un ordine dagli ordini nuovi (accettato o rifiutato): nessuna ricarica lo fa tornare. */
  togliNuovo: (id: string) => void;
  impostazioni: Impostazioni;
  /** Ricarica la settimana; risolve con i dati appena arrivati, o null se non sono arrivati. */
  ricarica: () => Promise<DatiPannello | null>;
  /** Va a un'altra vista. Con `sostituisci` la voce attuale cambia indirizzo invece di aggiungerne una (dopo un salvataggio). */
  vai: (v: Vista, opzioni?: { sostituisci?: boolean }) => void;
  /** Un cliente appena salvato: resta nella rubrica anche se la ricarica che segue non arriva. */
  ricordaCliente: (cliente: ClienteMatteo) => void;
  cambiaGiorno: (giorno: string) => void;
  /** Un avviso in cima alla schermata, che resta finche' Matteo non lo chiude. */
  avvisa: (testo: string) => void;
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
  const numeroNuovi = settimana?.dati.nuovi.length ?? 0;
  // Un avviso (per esempio "Messo nella settimana") sta sopra la vista finche' non si chiude.
  const [avviso, setAvviso] = useState<string | null>(null);

  // Di richieste ne conta solo l'ultima: una risposta vecchia non sovrascrive una nuova.
  // Gli ordini già accettati o rifiutati da Matteo: una risposta del server che arriva dopo non li fa tornare.
  const tolti = useRef(new Set<string>());
  const togliNuovo = useCallback((id: string) => {
    tolti.current.add(id);
    setSettimana((s) => (s ? { ...s, dati: { ...s.dati, nuovi: s.dati.nuovi.filter((o) => o.id !== id) } } : s));
  }, []);

  const carica = useCallback((lun: string): Promise<DatiPannello | null> => {
    const id = ++richiesta.current;
    return pannelloApi.pannello(lun, giorniDellaSettimana(lun)[6]).then(
      (ricevuti) => {
        if (id !== richiesta.current) return null;
        const dati: DatiPannello = { ...ricevuti, nuovi: ricevuti.nuovi.filter((o) => !tolti.current.has(o.id)) };
        setSettimana({ lunedi: lun, dati });
        setErrore(null);
        return dati;
      },
      (e: unknown) => {
        if (id !== richiesta.current) return null;
        setErrore(erroreDi(lun, e));
        return null;
      },
    );
  }, []);

  // Un caricamento nuovo cancella l'errore di quello vecchio (la richiesta lo decide, non l'effetto).
  const ricarica = useCallback((): Promise<DatiPannello | null> => {
    if (!lunedi) return Promise.resolve(null);
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

  const vai = useCallback((v: Vista, opzioni?: { sostituisci?: boolean }) => {
    const { pathname, search: attuale } = window.location;
    const url = urlDiVista(v, pathname);
    if (url === `${pathname}${attuale}`) return;
    const stato = statoDopoVai(window.history.state, opzioni?.sostituisci === true);
    if (opzioni?.sostituisci) window.history.replaceState(stato, "", url);
    else window.history.pushState(stato, "", url);
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

  const avvisa = useCallback((testo: string) => setAvviso(testo), []);

  // Il cliente appena salvato vale solo sulla settimana in cui è stato salvato: la ricarica, quando arriva, lo sostituisce.
  const [appenaSalvato, setAppenaSalvato] = useState<{ base: DatiPannello | null; cliente: ClienteMatteo } | null>(null);
  const ricordaCliente = useCallback((cliente: ClienteMatteo) => setAppenaSalvato({ base: datiDelGiorno, cliente }), [datiDelGiorno]);
  const datiVisti = useMemo<DatiPannello | null>(() => {
    if (!datiDelGiorno || !appenaSalvato || appenaSalvato.base !== datiDelGiorno) return datiDelGiorno;
    const altri = datiDelGiorno.clienti.filter((c) => c.id !== appenaSalvato.cliente.id);
    return { ...datiDelGiorno, clienti: [...altri, appenaSalvato.cliente] };
  }, [datiDelGiorno, appenaSalvato]);

  const avvisoAperto = avviso && (
    <div className="pm-avviso-fatto" role="status">
      <p>{avviso}</p>
      <Bottone onClick={() => setAvviso(null)}>Ho capito</Bottone>
    </div>
  );

  const condiviso: Condiviso = {
    giorno,
    dati: datiVisti,
    nuovi: settimana ? settimana.dati.nuovi : null,
    erroreCaricamento: erroreDelGiorno,
    togliNuovo,
    impostazioni,
    ricarica,
    vai,
    cambiaGiorno,
    avvisa,
    ricordaCliente,
  };

  const testa = (
    <header className="pm-testa">
      <div>
        <h1>Ciao Matteo</h1>
        <p>FUEL LAB</p>
      </div>
      <Bottone onClick={() => vai({ tipo: "altro" })}>Altro</Bottone>
    </header>
  );

  // L'errore della settimana, dove c'è una settimana da mostrare (la schermata del giorno e le viste del cliente).
  const erroreBox = erroreDelGiorno && (
    <Errore
      messaggio={erroreDelGiorno.messaggio}
      riprova={erroreDelGiorno.accesso ? undefined : () => void ricarica()}
      accesso={erroreDelGiorno.accesso}
    />
  );

  if (vista.tipo === "nuovi") {
    return (
      <div className="pm-app">
        <header className="pm-testa">
          <Bottone onClick={indietro}>← Indietro</Bottone>
        </header>
        <main className="pm-corpo">
          {avvisoAperto}
          <OrdiniNuovi pannello={condiviso} />
        </main>
      </div>
    );
  }

  if (vista.tipo === "scegli-cliente" || vista.tipo === "nuovo-cliente" || vista.tipo === "cliente") {
    const sopraCliente = (
      <>
        {avvisoAperto}
        {erroreBox}
      </>
    );
    // La settimana del cliente ha il suo piè di pagina fisso: fa la sua <main> da sola.
    if (vista.tipo === "cliente" && !vista.modifica) {
      return (
        <div className="pm-app">
          <header className="pm-testa">
            <Bottone onClick={indietro}>← Indietro</Bottone>
          </header>
          <SettimanaCliente key={vista.clienteId} pannello={condiviso} clienteId={vista.clienteId} sopra={sopraCliente} />
        </div>
      );
    }
    return (
      <div className="pm-app">
        <header className="pm-testa">
          <Bottone onClick={indietro}>← Indietro</Bottone>
        </header>
        <main className="pm-corpo">
          {sopraCliente}
          {vista.tipo === "scegli-cliente" && <SceltaCliente pannello={condiviso} />}
          {vista.tipo === "nuovo-cliente" && <ModuloCliente pannello={condiviso} />}
          {vista.tipo === "cliente" && <ModuloCliente pannello={condiviso} clienteId={vista.clienteId} />}
        </main>
      </div>
    );
  }

  if (vista.tipo === "altro" || vista.tipo === "guida") {
    return (
      <div className="pm-app">
        <header className="pm-testa">
          <Bottone onClick={indietro}>← Indietro</Bottone>
        </header>
        <main className="pm-corpo">
          {avvisoAperto}
          {vista.tipo === "altro" ? <Altro pannello={condiviso} /> : <GuidaInstallazione />}
        </main>
      </div>
    );
  }

  if (vista.tipo !== "giorno") {
    return (
      <div className="pm-app">
        <header className="pm-testa">
          <Bottone onClick={indietro}>← Indietro</Bottone>
        </header>
        <main className="pm-corpo">
          {avvisoAperto}
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
      {avvisoAperto}
      {numeroNuovi > 0 && (
        <button type="button" className="pm-nuovi" onClick={() => vai({ tipo: "nuovi" })}>
          <span>{numeroNuovi === 1 ? "1 ordine nuovo dal sito" : `${numeroNuovi} ordini nuovi dal sito`}</span>
          <span>Apri →</span>
        </button>
      )}
      {erroreBox}
    </>
  );

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
