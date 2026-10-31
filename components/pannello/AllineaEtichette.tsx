"use client";

import { useEffect, useState } from "react";
import { pulisciSposta } from "@/lib/etichette-layout";
import { oggiRoma } from "@/lib/produzione";
import { usePdfPronto } from "./usePdfPronto";
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
  // La correzione salvata si è letta? Finché non si legge, o se la lettura fallisce, i tasti sono spenti:
  // altrimenti si salverebbe uno spostamento zero sopra quello vero.
  const [letta, setLetta] = useState(false);
  const [erroreLettura, setErroreLettura] = useState(false);

  useEffect(() => {
    let vivo = true;
    import("@/lib/etichette-pdf").then(
      (m) => { if (vivo) { setSposta(m.leggiSposta()); setLetta(true); } },
      () => { if (vivo) setErroreLettura(true); },
    );
    return () => { vivo = false; };
  }, []);

  async function muovi(asse: keyof Sposta, passo: number) {
    if (!letta) return;
    const prossimo = { ...sposta, [asse]: pulisciSposta(Math.round((sposta[asse] + passo) * 10) / 10) };
    setSposta(prossimo);
    const { salvaSposta } = await import("@/lib/etichette-pdf");
    salvaSposta(prossimo);
  }

  /* Due tocchi, come per le etichette del giorno (vedi VistaGiorno): prima si prepara la pagina di prova, poi
     "Apri la pagina di prova" la condivide o la apre. Se si sposta l'allineamento, la pagina pronta non vale più. */
  const pdf = usePdfPronto(`${sposta.x}|${sposta.y}|${oggiRoma()}`);
  function stampaProva() {
    if (pdf.lavoro) return;
    void pdf.prepara(async () => {
      const { creaPdfEtichette } = await import("@/lib/etichette-pdf");
      return creaPdfEtichette([], { preparatoIl: oggiRoma(), sposta, prova: true });
    }, "prova-etichette.pdf", "Non riesco a preparare la pagina di prova. Riprova.");
  }

  return (
    <section className="pm-box" aria-labelledby="allinea-titolo">
      <div className="pm-box-testa">
        <h2 id="allinea-titolo" className="pm-box-titolo">Allinea le etichette</h2>
        <p className="pm-muto">Stampa la pagina su carta, senza adattare alla pagina. Se le caselle non coincidono con il foglio, sposta le etichette con i tasti: ogni tocco fa mezzo millimetro.</p>
      </div>
      {pdf.pronto ? (
        <Bottone variante="verde" className="pm-pieno" onClick={() => void pdf.apri()}>Apri la pagina di prova</Bottone>
      ) : (
        <Bottone variante="verde" className="pm-pieno" disabled={pdf.lavoro} onClick={stampaProva}>
          {pdf.lavoro ? "Preparo la pagina…" : "Stampa pagina di prova"}
        </Bottone>
      )}
      {pdf.pronto && <p className="pm-muto" role="status">La pagina di prova è pronta.</p>}
      {pdf.errore && <p className="pm-errore" role="alert">{pdf.errore}</p>}
      {pdf.mostraLink && pdf.pronto && (
        <a className="pm-bottone pm-bottone-chiaro pm-pieno" href={pdf.pronto.url} target="_blank" rel="noopener" download={pdf.pronto.file.name}>Apri il PDF</a>
      )}
      {erroreLettura && <p className="pm-errore" role="alert">Non riesco a leggere la correzione salvata.</p>}
      <div className="pm-spostamenti" role="group" aria-label="Sposta le etichette">
        <Bottone variante="tenue" disabled={!letta} onClick={() => void muovi("y", -PASSO_MM)}><span aria-hidden="true">↑ </span>Su</Bottone>
        <Bottone variante="tenue" disabled={!letta} onClick={() => void muovi("y", PASSO_MM)}><span aria-hidden="true">↓ </span>Giù</Bottone>
        <Bottone variante="tenue" disabled={!letta} onClick={() => void muovi("x", -PASSO_MM)}><span aria-hidden="true">← </span>Sinistra</Bottone>
        <Bottone variante="tenue" disabled={!letta} onClick={() => void muovi("x", PASSO_MM)}><span aria-hidden="true">→ </span>Destra</Bottone>
      </div>
      <p className="pm-muto" role="status">{descrivi(sposta)}</p>
    </section>
  );
}
