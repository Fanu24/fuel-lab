"use client";

import { Fragment, useRef, useState, type ReactNode } from "react";
import { pannelloApi } from "@/lib/api";
import {
  conPasto,
  dataCorta,
  eventiSettimana,
  grigliaSettimana,
  linkChiama,
  linkWhatsAppCliente,
  lunediDi,
  nomeGiorno,
  prezzoPastoBreve,
  testoCopia,
  type DatiPannello,
  type PastoSettimana,
} from "@/lib/pannello";
import { spostaGiorni } from "@/lib/produzione";
import FoglioPiatto from "./FoglioPiatto";
import type { Condiviso } from "./PannelloMatteo";
import { Avviso, Bottone, Errore, messaggioDiErrore } from "./ui";

/* La settimana di un cliente (mockup "piatto-libero", griglia di Paolo): in testa nome, telefono e prezzo,
   con WhatsApp, Chiama e Modifica; poi la griglia 7 × pranzo/cena. Una casella vuota è un "+": toccandola
   si apre il foglio. Gli eventi stanno sotto, solo testo con Togli. In fondo "Copia la settimana scorsa"
   e "Fatto". La casella cambia subito; la settimana si ricarica in background. */

type Pasto = "pranzo" | "cena";

export default function SettimanaCliente({ pannello, clienteId, sopra }: {
  pannello: Condiviso;
  clienteId: string;
  /** L'avviso e l'errore della pagina, sopra la griglia. */
  sopra: ReactNode;
}) {
  const { giorno, dati, erroreCaricamento, impostazioni, vai, ricarica } = pannello;
  const lunedi = giorno ? lunediDi(giorno) : "";
  const chiave = `${clienteId}|${lunedi}`;

  // I pasti come li ha lasciati l'ultima azione di Matteo. Valgono finché `dati` è quello di allora:
  // quando arriva una settimana ricaricata dal server, lei vince e il ritocco non serve più.
  const [ritocco, setRitocco] = useState<{ chiave: string; dati: DatiPannello; pasti: PastoSettimana[] } | null>(null);
  const [foglio, setFoglio] = useState<{ data: string; pasto: Pasto } | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [copia, setCopia] = useState<{ testo: string } | null>(null);
  const [copiaInCorso, setCopiaInCorso] = useState(false);
  const inCorso = useRef(false);

  if (!dati || !lunedi) {
    return (
      <main className="pm-corpo">
        {sopra}
        {!erroreCaricamento && <p className="pm-carico" role="status">Carico…</p>}
      </main>
    );
  }

  const cliente = dati.clienti.find((c) => c.id === clienteId);
  if (!cliente) {
    return (
      <main className="pm-corpo">
        {sopra}
        <Avviso>Non trovo questo cliente nella rubrica.</Avviso>
      </main>
    );
  }

  // Le funzioni qui sotto usano la settimana di questo momento (dichiarate a parte, non vedono il controllo sopra).
  const settimana: DatiPannello = dati;
  const pastiServer = settimana.pasti.filter((p) => p.clienteId === clienteId);
  const pasti = ritocco && ritocco.chiave === chiave && ritocco.dati === settimana ? ritocco.pasti : pastiServer;
  const griglia = grigliaSettimana(lunedi, pasti);
  const eventi = eventiSettimana(pasti);
  const casellaAperta = foglio ? griglia.find((c) => c.data === foglio.data) : undefined;
  const attuale = foglio && casellaAperta ? casellaAperta[foglio.pasto] : null;

  const waHref = linkWhatsAppCliente(cliente.telefono, cliente.nome);
  const chiamaHref = linkChiama(cliente.telefono);
  const riga = [
    cliente.telefono,
    cliente.prezzoPastoCents !== null ? `${prezzoPastoBreve(cliente.prezzoPastoCents)} a pasto` : null,
  ].filter(Boolean).join(" · ");

  // Aggiorna la settimana sul video, poi la ricarica in background (per "Già fatti" e gli altri dati).
  function cambiaPasti(modifica: (pasti: PastoSettimana[]) => PastoSettimana[]) {
    setRitocco((r) => ({ chiave, dati: settimana, pasti: modifica(r && r.chiave === chiave && r.dati === settimana ? r.pasti : pastiServer) }));
    void ricarica();
  }

  // Cambiare settimana sostituisce la voce della storia: "Indietro" non ripercorre ogni settimana guardata.
  function vaiSettimana(nuovoLunedi: string) {
    vai({ tipo: "cliente", clienteId, settimana: nuovoLunedi }, { sostituisci: true });
  }

  function salvatoNelFoglio(p: PastoSettimana) {
    setFoglio(null);
    cambiaPasti((ps) => conPasto(ps, p));
  }

  function toltoNelFoglio(id: string) {
    setFoglio(null);
    cambiaPasti((ps) => ps.filter((p) => p.id !== id));
  }

  async function togliEvento(p: PastoSettimana) {
    if (inCorso.current) return;
    inCorso.current = true;
    setErrore(null);
    try {
      await pannelloApi.togliPasto(p.id);
      cambiaPasti((ps) => ps.filter((x) => x.id !== p.id));
    } catch (e) {
      setErrore(messaggioDiErrore(e));
    } finally {
      inCorso.current = false;
    }
  }

  async function copiaLaScorsa() {
    if (inCorso.current) return;
    inCorso.current = true;
    setCopiaInCorso(true);
    setErrore(null);
    setCopia(null);
    try {
      const r = await pannelloApi.copiaSettimana(clienteId, lunedi);
      setRitocco({ chiave, dati: settimana, pasti: r.pasti });
      setCopia({ testo: testoCopia(r.copiati, r.fonte) });
      void ricarica();
    } catch (e) {
      setErrore(messaggioDiErrore(e));
    } finally {
      inCorso.current = false;
      setCopiaInCorso(false);
    }
  }

  return (
    <>
      <main className="pm-corpo">
        {sopra}

        <header className="pm-cs-testa">
          <h1>{cliente.nome}</h1>
          {riga && <p>{riga}</p>}
          <div className="pm-cs-azioni">
            {waHref && <a className="pm-bottone pm-bottone-whatsapp" href={waHref} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
            {chiamaHref && <a className="pm-bottone pm-bottone-chiaro" href={chiamaHref}>Chiama</a>}
            <Bottone variante="tenue" onClick={() => vai({ tipo: "cliente", clienteId, modifica: true, settimana: lunedi })}>Modifica</Bottone>
          </div>
        </header>

        <nav aria-label="Settimana" className="pm-settimana">
          <div className="pm-settimana-testa">
            <Bottone className="pm-icona" aria-label="Settimana precedente" onClick={() => vaiSettimana(spostaGiorni(lunedi, -7))}>‹</Bottone>
            <p>{dataCorta(griglia[0].data)} – {dataCorta(griglia[6].data)}</p>
            <Bottone className="pm-icona" aria-label="Settimana successiva" onClick={() => vaiSettimana(spostaGiorni(lunedi, 7))}>›</Bottone>
          </div>
        </nav>

        <div className="pm-cs-griglia" role="group" aria-label="Pranzo e cena di ogni giorno">
          <span />
          <span className="pm-cs-intest">PRANZO</span>
          <span className="pm-cs-intest">CENA</span>
          {griglia.map((c) => (
            <Fragment key={c.data}>
              <span className="pm-cs-giorno">
                {c.sigla}
                <small>{c.numero}</small>
              </span>
              <Casella data={c.data} pasto="pranzo" piatto={c.pranzo} onClick={() => setFoglio({ data: c.data, pasto: "pranzo" })} />
              <Casella data={c.data} pasto="cena" piatto={c.cena} onClick={() => setFoglio({ data: c.data, pasto: "cena" })} />
            </Fragment>
          ))}
        </div>

        {eventi.length > 0 && (
          <section className="pm-cs-eventi" aria-label="Altro">
            <h2 className="pm-pasto">ALTRO</h2>
            {eventi.map((e) => (
              <div key={e.id} className="pm-cs-evento">
                <span>{nomeGiorno(e.data)} · {e.piatto}</span>
                <Bottone variante="tenue" onClick={() => void togliEvento(e)}>Togli</Bottone>
              </div>
            ))}
          </section>
        )}

        {errore && <Errore messaggio={errore} />}
        {copia && <Avviso>{copia.testo}</Avviso>}
      </main>

      <footer className="pm-basso">
        <Bottone variante="chiaro" disabled={copiaInCorso} onClick={() => void copiaLaScorsa()}>Copia la settimana scorsa</Bottone>
        <Bottone variante="verde" onClick={() => vai({ tipo: "giorno" })}>Fatto</Bottone>
      </footer>

      {foglio && (
        <FoglioPiatto
          key={`${foglio.data}-${foglio.pasto}`}
          cliente={cliente}
          data={foglio.data}
          pasto={foglio.pasto}
          attuale={attuale}
          recenti={dati.recenti[clienteId] ?? []}
          nonDisponibili={impostazioni.piattiNonDisponibili}
          chiudi={() => setFoglio(null)}
          salvato={salvatoNelFoglio}
          tolto={toltoNelFoglio}
        />
      )}
    </>
  );
}

function Casella({ data, pasto, piatto, onClick }: {
  data: string;
  pasto: Pasto;
  piatto: PastoSettimana | null;
  onClick: () => void;
}) {
  const nome = `${nomeGiorno(data)}, ${pasto}`;
  if (!piatto) {
    return (
      <button type="button" className="pm-cs-casella pm-cs-vuota" aria-label={`${nome}: vuoto`} onClick={onClick}>+</button>
    );
  }
  return (
    <button
      type="button"
      className="pm-cs-casella"
      aria-label={`${nome}: ${piatto.piatto}${piatto.porzioni > 1 ? `, ${piatto.porzioni} porzioni` : ""}`}
      onClick={onClick}
    >
      <span>{piatto.piatto}</span>
      {piatto.porzioni > 1 && <em>×{piatto.porzioni}</em>}
    </button>
  );
}
