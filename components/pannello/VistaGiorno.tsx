"use client";

import { useEffect, useState, type ReactNode } from "react";
import { dataCorta, etichetteDelGiorno, giorniDellaSettimana, lunediDi, nomeGiornoCorto, pastiDelGiorno, type RigaGiorno } from "@/lib/pannello";
import type { Vista } from "@/lib/pannello-navigazione";
import { giornoDelPiano, oggiRoma, spostaGiorni } from "@/lib/produzione";
import { NOMI_GIORNO } from "@/lib/settimana";
import { statoNotifiche, type StatoNotifiche } from "@/lib/push-client";
import type { Condiviso } from "./PannelloMatteo";
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
  const [lavoro, setLavoro] = useState(false);
  /* Errore e link tengono il giorno a cui si riferiscono: cambiando giorno non compaiono più. */
  const [errore, setErrore] = useState<{ giorno: string; testo: string } | null>(null);
  const [linkPdf, setLinkPdf] = useState<{ giorno: string; url: string } | null>(null);
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

  /* Il PDF si prepara solo quando serve: il codice per le etichette si carica al primo click.
     La scheda per il PDF si apre prima di ogni `await`, nel gesto del tocco: su iPhone e in molti
     browser una scheda aperta dopo viene bloccata. Il pannello non cambia pagina in nessun caso. */
  async function stampaEtichette() {
    if (!dati || lavoro) return;
    setLavoro(true);
    setErrore(null);
    setLinkPdf(null);
    // Scheda segnaposto: null se il browser la blocca comunque (si ricade sul link "Apri il PDF").
    const finestra = window.open("", "_blank");
    try {
      const { creaPdfEtichette, consegnaPdf, leggiSposta } = await import("@/lib/etichette-pdf");
      const pdf = await creaPdfEtichette(etichette, { preparatoIl: oggiRoma(), sposta: leggiSposta() });
      const url = await consegnaPdf(pdf, `etichette-${giorno}.pdf`, finestra);
      if (url) setLinkPdf({ giorno, url });
    } catch (e) {
      finestra?.close();
      console.error("Etichette in PDF: preparazione o consegna non riuscita", e);
      setErrore({ giorno, testo: "Non riesco a preparare le etichette. Riprova." });
    } finally {
      setLavoro(false);
    }
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
        {errore?.giorno === giorno && <Errore messaggio={errore.testo} riprova={stampaEtichette} />}
        {linkPdf?.giorno === giorno && (
          <a className="pm-bottone pm-bottone-verde" href={linkPdf.url} target="_blank" rel="noopener">Apri il PDF</a>
        )}
        <Bottone variante="verde" onClick={() => vai({ tipo: "scegli-cliente" })}>+ Aggiungi</Bottone>
        <Bottone variante="chiaro" disabled={etichette.length === 0 || lavoro} onClick={stampaEtichette}>
          {lavoro ? "Preparo le etichette…" : `Stampa etichette di ${nomeDelGiorno}`}
        </Bottone>
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
