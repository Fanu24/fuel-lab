"use client";

import { useState, type ReactNode } from "react";
import { etichetteDelGiorno, giorniDellaSettimana, lunediDi, nomeGiorno, nomeGiornoCorto, pastiDelGiorno, type RigaGiorno } from "@/lib/pannello";
import type { Vista } from "@/lib/pannello-navigazione";
import { giornoDelPiano, spostaGiorni } from "@/lib/produzione";
import { NOMI_GIORNO } from "@/lib/settimana";
import type { Condiviso } from "./PannelloMatteo";
import { Avviso, Bottone, Foglio } from "./ui";

/* La schermata del giorno (mockup A): la settimana, i pasti del giorno scelto a pranzo e a cena,
   e in fondo le due azioni da fare. Il riquadro degli ordini nuovi e l'errore arrivano da fuori
   (`sopra`), così restano visibili anche mentre una settimana si carica o fallisce. */

/** "2026-10-26" -> "26 ott". */
function dataCorta(data: string): string {
  const [anno, mese, giorno] = data.split("-").map(Number);
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", timeZone: "UTC" })
    .format(new Date(Date.UTC(anno, mese - 1, giorno, 12)))
    .replace(/\.$/, "");
}

export default function VistaGiorno({ pannello, sopra, senzaDati }: {
  pannello: Condiviso;
  sopra: ReactNode;
  /** Cosa mostrare al posto dei pasti finché la settimana manca. */
  senzaDati: ReactNode;
}) {
  const { giorno, dati, vai, cambiaGiorno } = pannello;
  const [stampa, setStampa] = useState(false);

  const giorni = giorniDellaSettimana(lunediDi(giorno));
  const pasti = dati ? pastiDelGiorno(dati.pasti, dati.clienti, giorno) : null;
  const etichette = dati ? etichetteDelGiorno(dati.pasti, dati.clienti, giorno) : [];
  const nomeDelGiorno = NOMI_GIORNO[giornoDelPiano(giorno)].toLowerCase();

  return (
    <>
      <main className="pm-corpo">
        {sopra}

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
        <Bottone variante="verde" onClick={() => vai({ tipo: "scegli-cliente" })}>+ Aggiungi</Bottone>
        <Bottone variante="chiaro" disabled={etichette.length === 0} onClick={() => setStampa(true)}>
          Stampa etichette di {nomeDelGiorno}
        </Bottone>
      </footer>

      {stampa && (
        <Foglio titolo={`Etichette · ${nomeGiorno(giorno)}`} chiudi={() => setStampa(false)}>
          <Avviso>In arrivo.</Avviso>
        </Foglio>
      )}
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
