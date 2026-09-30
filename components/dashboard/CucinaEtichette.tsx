"use client";

/* Scheda Etichette: una etichetta per porzione, su fogli A4 adesivi da
   3 colonne x 7 righe (70 x 42,3 mm, 21 per foglio, senza margini: il formato
   piu' comune in cartoleria). L'anteprima e' lo stesso foglio della stampa, in
   scala: le misure sono in millimetri del foglio (vedi .cu-foglio in
   app/styles/cucina.css). Dopo gli ordini, una etichetta per ogni pasto delle
   consegne in abbonamento (ne servono 9 per un Full 7): il piatto indicato
   dal cliente o "Colazione/Pranzo/Cena in abbonamento". */

import { useMemo, useState } from "react";
import type { Ordine } from "@/lib/api";
import {
  ETICHETTE_PER_FOGLIO,
  FOGLIO_ETICHETTE,
  dataBreve,
  etichette,
  etichetteAbbonamenti,
  inFogli,
  spostaGiorni,
  type Etichetta,
} from "@/lib/produzione";
import { useMemoria } from "./CucinaMemoria";
import { Avviso } from "./ui";

const GIORNI_SCADENZA = [1, 2, 3, 4, 5, 6, 7];
const SCADENZA_PREDEFINITA = 3;

export default function CucinaEtichette({ ordini, abbonamenti = [], giorno }: { ordini: Ordine[]; abbonamenti?: Ordine[]; giorno: string }) {
  const lista = useMemo(() => [...etichette(ordini), ...etichetteAbbonamenti(abbonamenti, giorno)], [ordini, abbonamenti, giorno]);
  const [scadenzaSalvata, salvaScadenza] = useMemoria("fuellab:cucina:scadenza");
  const giorniScadenza = GIORNI_SCADENZA.includes(Number(scadenzaSalvata)) ? Number(scadenzaSalvata) : SCADENZA_PREDEFINITA;
  const [salta, setSalta] = useState(0);

  const fogli = inFogli(lista, salta);
  const preparato = dataBreve(giorno);
  const entro = dataBreve(spostaGiorni(giorno, giorniScadenza));
  const senzaAllergeni = lista.filter((e) => e.allergeni === null).length;

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 print:hidden">
        <div className="flex flex-wrap items-end gap-4">
          <div className="campo">
            <label htmlFor="cu-scadenza">Consumare entro</label>
            <select
              id="cu-scadenza"
              value={giorniScadenza}
              onChange={(e) => salvaScadenza(e.target.value === String(SCADENZA_PREDEFINITA) ? null : e.target.value)}
              aria-describedby="cu-scadenza-nota"
            >
              {GIORNI_SCADENZA.map((g) => (
                <option key={g} value={g}>
                  {g} {g === 1 ? "giorno" : "giorni"} dalla preparazione
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="cu-salta">Caselle già usate sul primo foglio</label>
            <select id="cu-salta" value={salta} onChange={(e) => setSalta(Number(e.target.value))}>
              {Array.from({ length: ETICHETTE_PER_FOGLIO }, (_, i) => (
                <option key={i} value={i}>
                  {i === 0 ? "Nessuna, foglio nuovo" : `${i} (parto dalla ${i + 1}ª)`}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p id="cu-scadenza-nota" className="cu-riga-nota">
          Preparato il {preparato}, consumare entro {entro}. La scelta dei giorni resta salvata su questo dispositivo.
        </p>
        <p className="cu-conto">
          <strong className="num">{lista.length}</strong> {lista.length === 1 ? "etichetta" : "etichette"} su{" "}
          <strong className="num">{fogli.length}</strong> {fogli.length === 1 ? "foglio" : "fogli"} A4 ·{" "}
          {FOGLIO_ETICHETTE.colonne} × {FOGLIO_ETICHETTE.righe} da {FOGLIO_ETICHETTE.larghezzaMm} × 42,3 mm ({ETICHETTE_PER_FOGLIO} per foglio)
        </p>
        {senzaAllergeni ? (
          <Avviso>
            {senzaAllergeni === 1 ? "1 etichetta non ha" : `${senzaAllergeni} etichette non hanno`} un piatto del catalogo (piatto
            fuori catalogo o pasto in abbonamento da comporre): gli allergeni risultano “da verificare”. Controllali e scrivili
            prima di consegnare.
          </Avviso>
        ) : null}
        <Avviso tipo="info">
          Per stampare: Chrome o Edge dal computer, scala 100% (non “Adatta alla pagina”), margini “Predefiniti”. Prova prima su un
          foglio di carta normale e sovrapponilo al foglio di etichette controluce.
        </Avviso>
      </div>

      <div className="cu-fogli">
        {fogli.map((foglio, i) => (
          <section key={i} className="cu-foglio" aria-label={`Foglio ${i + 1} di ${fogli.length}`}>
            <div className="cu-foglio-griglia">
              {Array.from({ length: ETICHETTE_PER_FOGLIO }, (_, j) => foglio[j] ?? null).map((e, j) =>
                e ? (
                  <EtichettaPorzione key={e.chiave} e={e} preparato={preparato} entro={entro} />
                ) : (
                  <div key={`vuota-${j}`} className="cu-et cu-et-vuota" aria-hidden="true" />
                ),
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function EtichettaPorzione({ e, preparato, entro }: { e: Etichetta; preparato: string; entro: string }) {
  const allergeni = e.allergeni === null ? "da verificare" : e.allergeni.length ? e.allergeni.join(", ") : "nessuno";
  return (
    <div className="cu-et">
      <p className="cu-et-testa">
        <span className="cu-et-cliente">{e.cliente}</span>
        <span className="cu-et-marchio">FUEL LAB</span>
      </p>
      <p className="cu-et-piatto">{e.piatto}</p>
      {e.extra.length ? <p className="cu-et-extra">+ {e.extra.join(", ")}</p> : null}
      <p className="cu-et-quando">{e.quando}</p>
      <p className="cu-et-allergeni">
        <b>Allergeni:</b> <span className="cu-et-allergeni-lista">{allergeni}</span>
      </p>
      <p className="cu-et-date">
        Preparato il {preparato}
        <br />
        Consumare entro {entro}
      </p>
    </div>
  );
}
