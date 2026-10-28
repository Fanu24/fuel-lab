"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ApiError, api, impostazioniVuote, pannelloApi, type Impostazioni } from "@/lib/api";
import { giorniDellaSettimana, lunediDi, type DatiPannello } from "@/lib/pannello";
import { oggiRoma } from "@/lib/produzione";
import { Errore, unFoglioAperto } from "./ui";
import VistaGiorno from "./VistaGiorno";

/* Il pannello di Matteo: una sola pagina, con le viste dentro. Le viste si cambiano
   con `vai`, che lascia una voce nella storia del browser: il "indietro" del telefono
   torna alla vista di prima. La vista si legge dall'indirizzo (?vista=…&cliente=…),
   così la notifica di un ordine nuovo apre direttamente `?vista=nuovi`. */

export type Vista =
  | { tipo: "giorno" }
  | { tipo: "nuovi" }
  | { tipo: "scegli-cliente" }
  | { tipo: "cliente"; clienteId: string; modifica?: boolean }
  | { tipo: "nuovo-cliente" }
  | { tipo: "altro" }
  | { tipo: "guida" };

/** Lo stato che il pannello passa alle viste. `dati` è la settimana di `giorno`. */
export type Condiviso = {
  giorno: string;
  dati: DatiPannello;
  impostazioni: Impostazioni;
  ricarica: () => Promise<void>;
  vai: (v: Vista) => void;
  cambiaGiorno: (giorno: string) => void;
};

/** La vista scritta nell'indirizzo; un indirizzo sconosciuto o incompleto è la schermata del giorno. */
export function vistaDaUrl(search: string): Vista {
  const p = new URLSearchParams(search);
  switch (p.get("vista")) {
    case "nuovi": return { tipo: "nuovi" };
    case "scegli-cliente": return { tipo: "scegli-cliente" };
    case "nuovo-cliente": return { tipo: "nuovo-cliente" };
    case "altro": return { tipo: "altro" };
    case "guida": return { tipo: "guida" };
    case "cliente": {
      const clienteId = p.get("cliente");
      if (!clienteId) return { tipo: "giorno" };
      return p.get("modifica") === "1" ? { tipo: "cliente", clienteId, modifica: true } : { tipo: "cliente", clienteId };
    }
    default: return { tipo: "giorno" };
  }
}

function urlDiVista(v: Vista): string {
  const p = new URLSearchParams({ vista: v.tipo });
  if (v.tipo === "cliente") {
    p.set("cliente", v.clienteId);
    if (v.modifica) p.set("modifica", "1");
  }
  return `${window.location.pathname}?${p.toString()}`;
}

/* L'indirizzo come archivio esterno: si legge con useSyncExternalStore, e `vai` avvisa chi ascolta. */
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

type ErroreCaricamento = { messaggio: string; accesso: boolean };

function erroreDi(e: unknown): ErroreCaricamento {
  if (e instanceof ApiError && e.status === 401) return { messaggio: "L'accesso è scaduto.", accesso: true };
  if (e instanceof ApiError) return { messaggio: e.message, accesso: false };
  return { messaggio: "Qualcosa non va. Riprova.", accesso: false };
}

export default function PannelloMatteo() {
  // "" finché il browser non dice qual è oggi: la pagina prerenderizzata non porta una data sbagliata,
  // e all'idratazione React passa da sola al valore vero.
  const oggi = useSyncExternalStore(nessunAscolto, oggiRoma, () => "");
  const [sceltoPerData, setSceltoPerData] = useState<string | null>(null);
  const giorno = sceltoPerData ?? oggi;
  const search = useSyncExternalStore(ascoltaIndirizzo, () => window.location.search, () => "");
  const vista = vistaDaUrl(search);

  const [settimana, setSettimana] = useState<{ lunedi: string; dati: DatiPannello } | null>(null);
  const [errore, setErrore] = useState<ErroreCaricamento | null>(null);
  const [impostazioni, setImpostazioni] = useState<Impostazioni>(impostazioniVuote);
  const richiesta = useRef(0);

  const lunedi = giorno ? lunediDi(giorno) : "";

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
        setErrore(erroreDi(e));
      },
    );
  }, []);

  const ricarica = useCallback(() => (lunedi ? carica(lunedi) : Promise.resolve()), [lunedi, carica]);

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
    const url = urlDiVista(v);
    if (url === `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
    avvisaIndirizzo();
  }, []);

  const cambiaGiorno = useCallback((g: string) => setSceltoPerData(g), []);

  // I dati mostrati sono solo quelli della settimana del giorno scelto: cambiando settimana si aspetta.
  const datiDelGiorno = settimana && settimana.lunedi === lunedi ? settimana.dati : null;

  if (vista.tipo !== "giorno") {
    return (
      <div className="pm-app">
        <header className="pm-testa">
          <button type="button" className="pm-indietro" onClick={() => vai({ tipo: "giorno" })}>← Indietro</button>
        </header>
        <main className="pm-corpo">
          <p className="pm-carico">In arrivo.</p>
        </main>
      </div>
    );
  }

  if (!giorno || !datiDelGiorno) {
    return (
      <div className="pm-app">
        {errore ? (
          <Errore messaggio={errore.messaggio} riprova={errore.accesso ? undefined : () => void ricarica()} accesso={errore.accesso} />
        ) : (
          <p className="pm-carico" role="status">Carico…</p>
        )}
      </div>
    );
  }

  const condiviso: Condiviso = { giorno, dati: datiDelGiorno, impostazioni, ricarica, vai, cambiaGiorno };
  return (
    <div className="pm-app">
      {errore && <Errore messaggio={errore.messaggio} riprova={errore.accesso ? undefined : () => void ricarica()} accesso={errore.accesso} />}
      <VistaGiorno pannello={condiviso} />
    </div>
  );
}
