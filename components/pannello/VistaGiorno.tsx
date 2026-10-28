"use client";

import { useState } from "react";
import { etichetteDelGiorno, giorniDellaSettimana, lunediDi, nomeGiorno, nomeGiornoCorto, pastiDelGiorno, type RigaGiorno } from "@/lib/pannello";
import { giornoDelPiano, spostaGiorni } from "@/lib/produzione";
import { NOMI_GIORNO } from "@/lib/settimana";
import type { Condiviso, Vista } from "./PannelloMatteo";
import { Avviso, Bottone, Foglio } from "./ui";

/* La schermata del giorno (mockup A): il riquadro degli ordini nuovi, la settimana,
   i pasti di oggi a pranzo e a cena, e in fondo le due azioni da fare. */

/** "2026-10-26" -> "26 ott". */
function dataCorta(data: string): string {
  const [anno, mese, giorno] = data.split("-").map(Number);
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", timeZone: "UTC" })
    .format(new Date(Date.UTC(anno, mese - 1, giorno, 12)))
    .replace(/\.$/, "");
}

export default function VistaGiorno({ pannello }: { pannello: Condiviso }) {
  const { giorno, dati, vai, cambiaGiorno } = pannello;
  const [stampa, setStampa] = useState(false);

  const giorni = giorniDellaSettimana(lunediDi(giorno));
  const { pranzo, cena, evento } = pastiDelGiorno(dati.pasti, dati.clienti, giorno);
  const etichette = etichetteDelGiorno(dati.pasti, dati.clienti, giorno);
  const nuovi = dati.nuovi.length;
  const vuoto = pranzo.length + cena.length + evento.length === 0;
  const nomeDelGiorno = NOMI_GIORNO[giornoDelPiano(giorno)].toLowerCase();

  return (
    <>
      <header className="pm-testa">
        <div>
          <h1>Ciao Matteo</h1>
          <p>FUEL LAB</p>
        </div>
        <Bottone onClick={() => vai({ tipo: "altro" })}>Altro</Bottone>
      </header>

      <main className="pm-corpo">
        {nuovi > 0 && (
          <button type="button" className="pm-nuovi" onClick={() => vai({ tipo: "nuovi" })}>
            <span>{nuovi === 1 ? "1 ordine nuovo dal sito" : `${nuovi} ordini nuovi dal sito`}</span>
            <span>Apri →</span>
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

        {vuoto ? (
          <Avviso>Niente da cucinare per questo giorno.</Avviso>
        ) : (
          <>
            <Sezione titolo="Pranzo" righe={pranzo} vai={vai} />
            <Sezione titolo="Cena" righe={cena} vai={vai} />
            <Sezione titolo="Altro" righe={evento} vai={vai} />
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
