"use client";

import { useEffect, useState, type ReactNode } from "react";
import { dataCorta, etichetteDelGiorno, giorniDellaSettimana, lunediDi, nomeGiornoCorto, pastiDelGiorno, type RigaGiorno } from "@/lib/pannello";
import type { Vista } from "@/lib/pannello-navigazione";
import { giornoDelPiano, oggiRoma, spostaGiorni } from "@/lib/produzione";
import { NOMI_GIORNO } from "@/lib/settimana";
import { statoNotifiche, type StatoNotifiche } from "@/lib/push-client";
import type { Condiviso } from "./PannelloMatteo";
import { usePdfPronto } from "./usePdfPronto";
import { Avviso, Bottone, Errore } from "./ui";

/* La schermata del giorno (mockup A): la settimana, i pasti del giorno scelto a pranzo e a cena,
   e in fondo le due azioni da fare. Il riquadro degli ordini nuovi e l'errore arrivano da fuori
   (`sopra`), così restano visibili anche mentre una settimana si carica o fallisce. */

export default function VistaGiorno({ pannello, sopra, senzaDati }: {
  pannello: Condiviso;
  sopra: ReactNode;
  /** Cosa mostrare al posto dei pasti finché la settimana manca. */
  senzaDati: ReactNode;
}) {
  const { giorno, dati, vai, cambiaGiorno } = pannello;
  // Finché le notifiche non sono attive, in alto c'è la scheda che porta alla guida.
  const [notifiche, setNotifiche] = useState<StatoNotifiche | null>(null);
  useEffect(() => {
    let vivo = true;
    statoNotifiche().then((s) => { if (vivo) setNotifiche(s); }, () => {});
    return () => { vivo = false; };
  }, []);
  const daAttivare = notifiche === "da-installare" || notifiche === "da-attivare";

  const giorni = giorniDellaSettimana(lunediDi(giorno));
  const pasti = dati ? pastiDelGiorno(dati.pasti, dati.clienti, giorno) : null;
  const etichette = dati ? etichetteDelGiorno(dati.pasti, dati.clienti, giorno) : [];
  const nomeDelGiorno = NOMI_GIORNO[giornoDelPiano(giorno)].toLowerCase();

  /* Il PDF si prepara in due tocchi: "Stampa etichette" lo crea (il codice per le etichette si carica a quel
     punto), poi "Apri le etichette" lo condivide o lo apre con un tocco nuovo. Il PDF vale per questo giorno e
     queste etichette (e per la data di stampa): se cambiano, sparisce. Il pannello non cambia pagina in nessun caso. */
  const chiavePdf = `${giorno}|${oggiRoma()}|${JSON.stringify(etichette.map((e) => [e.chiave, e.cliente, e.piatto, e.pasto]))}`;
  const pdf = usePdfPronto(chiavePdf);
  function stampaEtichette() {
    if (!dati || pdf.lavoro) return;
    void pdf.prepara(async () => {
      const { creaPdfEtichette, leggiSposta } = await import("@/lib/etichette-pdf");
      return creaPdfEtichette(etichette, { preparatoIl: oggiRoma(), sposta: leggiSposta() });
    }, `etichette-${giorno}.pdf`, "Non riesco a preparare le etichette. Riprova.");
  }

  return (
    <>
      <main className="pm-corpo">
        {sopra}

        {daAttivare && (
          <button type="button" className="pm-scheda-notifiche" onClick={() => vai({ tipo: "guida" })}>
            <span>Ricevi gli ordini sul telefono</span>
            <span>Come fare →</span>
          </button>
        )}

        <nav aria-label="Settimana" className="pm-settimana">
          <div className="pm-settimana-testa">
            <Bottone className="pm-icona" aria-label="Settimana precedente" onClick={() => cambiaGiorno(spostaGiorni(giorno, -7))}>‹</Bottone>
            <p>{dataCorta(giorni[0])} – {dataCorta(giorni[6])}</p>
            <Bottone className="pm-icona" aria-label="Settimana successiva" onClick={() => cambiaGiorno(spostaGiorni(giorno, 7))}>›</Bottone>
          </div>
          <div className="pm-giorni">
            {giorni.map((d) => {
              const { sigla, numero } = nomeGiornoCorto(d);
              const scelto = d === giorno;
              return (
                <button key={d} type="button" className={`pm-giorno${scelto ? " pm-giorno-on" : ""}`} aria-pressed={scelto} onClick={() => cambiaGiorno(d)}>
                  <span>{sigla}</span>
                  <strong>{numero}</strong>
                </button>
              );
            })}
          </div>
        </nav>

        {!pasti ? (
          senzaDati
        ) : pasti.pranzo.length + pasti.cena.length + pasti.evento.length === 0 ? (
          <Avviso>Niente da cucinare per questo giorno.</Avviso>
        ) : (
          <>
            <Sezione titolo="Pranzo" righe={pasti.pranzo} vai={vai} />
            <Sezione titolo="Cena" righe={pasti.cena} vai={vai} />
            <Sezione titolo="Altro" righe={pasti.evento} vai={vai} />
          </>
        )}
      </main>

      <footer className="pm-basso">
        {pdf.errore && <Errore messaggio={pdf.errore} riprova={stampaEtichette} />}
        {pdf.pronto && <p className="pm-stato" role="status">Le etichette sono pronte.</p>}
        {pdf.mostraLink && pdf.pronto && (
          <a className="pm-bottone pm-bottone-chiaro" href={pdf.pronto.url} target="_blank" rel="noopener" download={pdf.pronto.file.name}>Apri il PDF</a>
        )}
        <Bottone variante={pdf.pronto ? "chiaro" : "verde"} onClick={() => vai({ tipo: "scegli-cliente" })}>+ Aggiungi</Bottone>
        {pdf.pronto ? (
          <Bottone variante="verde" onClick={() => void pdf.apri()}>Apri le etichette</Bottone>
        ) : (
          <Bottone variante="chiaro" disabled={etichette.length === 0 || pdf.lavoro} onClick={stampaEtichette}>
            {pdf.lavoro ? "Preparo le etichette…" : `Stampa etichette di ${nomeDelGiorno}`}
          </Bottone>
        )}
      </footer>
    </>
  );
}

function Sezione({ titolo, righe, vai }: { titolo: string; righe: RigaGiorno[]; vai: (v: Vista) => void }) {
  if (righe.length === 0) return null;
  return (
    <section className="pm-sezione" aria-label={titolo}>
      <h2 className="pm-pasto">{titolo}</h2>
      {righe.map(({ pasto, cliente }) => (
        <button key={pasto.id} type="button" className="pm-riga" onClick={() => vai({ tipo: "cliente", clienteId: cliente.id })}>
          <b>{cliente.nome}</b>
          <span>
            {pasto.piatto}
            {pasto.porzioni > 1 && <span className="pm-porzioni">×{pasto.porzioni}</span>}
          </span>
        </button>
      ))}
    </section>
  );
}
