"use client";

import { useEffect, useState } from "react";
import { pulisciSposta } from "@/lib/etichette-layout";
import { oggiRoma } from "@/lib/produzione";
import { Bottone } from "./ui";

/* Allinea le etichette: si stampa una pagina di prova (21 caselle con la croce al centro), si misura
   quanto le caselle stanno fuori dal foglio e si regola con quattro tasti, a passi di mezzo millimetro.
   La correzione si salva sul telefono e vale per le etichette stampate dopo.
   Il modulo del PDF (pdf-lib) si carica solo qui, non nel primo caricamento del pannello. */

const PASSO_MM = 0.5;

type Sposta = { x: number; y: number };

function mm(valore: number): string {
  return `${valore.toLocaleString("it-IT", { maximumFractionDigits: 1 })} mm`;
}

function descrivi(sposta: Sposta): string {
  const orizzontale = sposta.x > 0 ? `${mm(sposta.x)} a destra` : sposta.x < 0 ? `${mm(-sposta.x)} a sinistra` : "nessuno";
  const verticale = sposta.y > 0 ? `${mm(sposta.y)} in basso` : sposta.y < 0 ? `${mm(-sposta.y)} in alto` : "nessuno";
  return `Spostamento attuale: orizzontale, ${orizzontale}; verticale, ${verticale}.`;
}

export default function AllineaEtichette() {
  const [sposta, setSposta] = useState<Sposta>({ x: 0, y: 0 });
  const [lavoro, setLavoro] = useState(false);
  const [errore, setErrore] = useState("");
  const [linkPdf, setLinkPdf] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    void import("@/lib/etichette-pdf").then((m) => { if (vivo) setSposta(m.leggiSposta()); }, () => {});
    return () => { vivo = false; };
  }, []);

  async function muovi(asse: keyof Sposta, passo: number) {
    const prossimo = { ...sposta, [asse]: pulisciSposta(Math.round((sposta[asse] + passo) * 10) / 10) };
    setSposta(prossimo);
    const { salvaSposta } = await import("@/lib/etichette-pdf");
    salvaSposta(prossimo);
  }

  // La scheda segnaposto si apre prima di ogni `await`, nel gesto del tocco (vedi VistaGiorno).
  async function stampaProva() {
    if (lavoro) return;
    setLavoro(true);
    setErrore("");
    setLinkPdf(null);
    const finestra = window.open("", "_blank");
    try {
      const { creaPdfEtichette, consegnaPdf } = await import("@/lib/etichette-pdf");
      const pdf = await creaPdfEtichette([], { preparatoIl: oggiRoma(), sposta, prova: true });
      const url = await consegnaPdf(pdf, "prova-etichette.pdf", finestra);
      if (url) setLinkPdf(url);
    } catch (e) {
      finestra?.close();
      console.error("Pagina di prova delle etichette non riuscita", e);
      setErrore("Non riesco a preparare la pagina di prova. Riprova.");
    } finally {
      setLavoro(false);
    }
  }

  return (
    <section className="pm-box" aria-labelledby="allinea-titolo">
      <div className="pm-box-testa">
        <h2 id="allinea-titolo" className="pm-box-titolo">Allinea le etichette</h2>
        <p className="pm-muto">Stampa la pagina su carta, senza adattare alla pagina. Se le caselle non coincidono con il foglio, sposta le etichette con i tasti: ogni tocco fa mezzo millimetro.</p>
      </div>
      <Bottone variante="verde" className="pm-pieno" disabled={lavoro} onClick={() => void stampaProva()}>
        {lavoro ? "Preparo la pagina…" : "Stampa pagina di prova"}
      </Bottone>
      {errore && <p className="pm-errore" role="alert">{errore}</p>}
      {linkPdf && <a className="pm-bottone pm-bottone-verde pm-pieno" href={linkPdf} target="_blank" rel="noopener">Apri il PDF</a>}
      <div className="pm-spostamenti" role="group" aria-label="Sposta le etichette">
        <Bottone variante="tenue" onClick={() => void muovi("y", -PASSO_MM)}><span aria-hidden="true">↑ </span>Su</Bottone>
        <Bottone variante="tenue" onClick={() => void muovi("y", PASSO_MM)}><span aria-hidden="true">↓ </span>Giù</Bottone>
        <Bottone variante="tenue" onClick={() => void muovi("x", -PASSO_MM)}><span aria-hidden="true">← </span>Sinistra</Bottone>
        <Bottone variante="tenue" onClick={() => void muovi("x", PASSO_MM)}><span aria-hidden="true">→ </span>Destra</Bottone>
      </div>
      <p className="pm-muto" role="status">{descrivi(sposta)}</p>
    </section>
  );
}
