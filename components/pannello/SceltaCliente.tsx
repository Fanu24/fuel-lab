"use client";

import { useState } from "react";
import { cercaClienti, ordinaClienti } from "@/lib/pannello";
import type { Condiviso } from "./PannelloMatteo";
import { Avviso } from "./ui";

/* La rubrica (mockup "aggiungi-cliente", scelta B): una casella per cercare, poi i clienti con il
   telefono, quelli con l'ultimo pasto più recente in cima, e in fondo "+ Cliente nuovo" tratteggiato.
   Toccare un cliente apre la sua settimana. */

export default function SceltaCliente({ pannello }: { pannello: Condiviso }) {
  const { dati, erroreCaricamento, vai } = pannello;
  const [testo, setTesto] = useState("");

  // Con l'errore lo mostra già la pagina, sopra; qui non si aspetta niente.
  if (!dati) return erroreCaricamento ? null : <p className="pm-carico" role="status">Carico…</p>;

  const elenco = cercaClienti(ordinaClienti(dati.clienti), testo);

  return (
    <>
      <h1 className="pm-titolo">Scegli il cliente</h1>
      <input
        type="search"
        className="pm-cerca"
        placeholder="Cerca nome…"
        aria-label="Cerca nome"
        autoComplete="off"
        value={testo}
        onChange={(e) => setTesto(e.target.value)}
      />
      {dati.clienti.length === 0 && <Avviso>Non hai ancora clienti: aggiungine uno qui sotto.</Avviso>}
      {dati.clienti.length > 0 && elenco.length === 0 && <Avviso>Nessun cliente si chiama così.</Avviso>}
      <ul className="pm-elenco">
        {elenco.map((c) => (
          <li key={c.id}>
            <button type="button" className="pm-cliente" onClick={() => vai({ tipo: "cliente", clienteId: c.id })}>
              <b>{c.nome}</b>
              {c.telefono && <span>{c.telefono}</span>}
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="pm-nuovo-cliente" onClick={() => vai({ tipo: "nuovo-cliente" })}>
        + Cliente nuovo
      </button>
    </>
  );
}
