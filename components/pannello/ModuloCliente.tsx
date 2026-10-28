"use client";

import { useRef, useState, type FormEvent } from "react";
import { pannelloApi } from "@/lib/api";
import { centesimiInTesto, leggiEuro } from "@/lib/operazioni";
import type { ClienteMatteo } from "@/lib/pannello";
import type { Condiviso } from "./PannelloMatteo";
import { Avviso, Bottone, Errore, messaggioDiErrore } from "./ui";

/* Il modulo del cliente, nuovo o da modificare: Nome (obbligatorio), Telefono, Indirizzo, quanto paga a pasto.
   Salva porta alla settimana del cliente. Con `clienteId` è la modifica: i campi partono dai dati attuali. */

export default function ModuloCliente({ pannello, clienteId }: { pannello: Condiviso; clienteId?: string }) {
  const { dati, erroreCaricamento } = pannello;
  if (clienteId === undefined) return <Modulo pannello={pannello} />;
  // La modifica parte dai dati del cliente: senza, i campi resterebbero vuoti.
  if (!dati) return erroreCaricamento ? null : <p className="pm-carico" role="status">Carico…</p>;
  const cliente = dati.clienti.find((c) => c.id === clienteId);
  if (!cliente) return <Avviso>Non trovo questo cliente nella rubrica.</Avviso>;
  return <Modulo key={cliente.id} pannello={pannello} cliente={cliente} />;
}

function Modulo({ pannello, cliente }: { pannello: Condiviso; cliente?: ClienteMatteo }) {
  const { ricarica, ricordaCliente, vai } = pannello;
  const [nome, setNome] = useState(cliente?.nome ?? "");
  const [telefono, setTelefono] = useState(cliente?.telefono ?? "");
  const [indirizzo, setIndirizzo] = useState(cliente?.indirizzo ?? "");
  const [prezzo, setPrezzo] = useState(centesimiInTesto(cliente?.prezzoPastoCents));
  const [errore, setErrore] = useState<string | null>(null);
  const [occupato, setOccupato] = useState(false);
  // Un solo salvataggio alla volta: un doppio tocco non crea due clienti.
  const inCorso = useRef(false);

  async function salva(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inCorso.current) return;
    const nomePulito = nome.trim();
    if (!nomePulito) {
      setErrore("Scrivi il nome del cliente.");
      return;
    }
    const centesimi = leggiEuro(prezzo);
    if (centesimi === undefined) {
      setErrore("Scrivi un importo come 10 o 8,50");
      return;
    }
    inCorso.current = true;
    setOccupato(true);
    setErrore(null);
    try {
      const { cliente: salvato } = await pannelloApi.salvaCliente(
        { nome: nomePulito, telefono: telefono.trim(), indirizzo: indirizzo.trim(), prezzoPastoCents: centesimi },
        cliente?.id,
      );
      // Il cliente resta in rubrica anche se la ricarica che segue non arriva: niente doppioni da riscrivere.
      ricordaCliente(salvato);
      await ricarica();
      // Sostituisce il modulo nella storia: "Indietro" dalla settimana non torna al modulo.
      vai({ tipo: "cliente", clienteId: salvato.id }, { sostituisci: true });
    } catch (err) {
      setErrore(messaggioDiErrore(err));
    } finally {
      inCorso.current = false;
      setOccupato(false);
    }
  }

  return (
    <>
      <h1 className="pm-titolo">{cliente ? "Modifica cliente" : "Cliente nuovo"}</h1>
      <form className="pm-ordine-form" noValidate onSubmit={salva}>
        <label className="pm-campo">
          <span>Nome</span>
          <input type="text" autoComplete="off" required value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>
        <label className="pm-campo">
          <span>Telefono</span>
          <input type="tel" autoComplete="off" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </label>
        <label className="pm-campo">
          <span>Indirizzo</span>
          <input type="text" autoComplete="off" value={indirizzo} onChange={(e) => setIndirizzo(e.target.value)} />
        </label>
        <label className="pm-campo">
          <span>Quanto paga a pasto (€) — facoltativo</span>
          <input type="text" inputMode="decimal" autoComplete="off" placeholder="10" value={prezzo} onChange={(e) => setPrezzo(e.target.value)} />
        </label>
        {errore && <Errore messaggio={errore} />}
        <Bottone type="submit" variante="verde" className="pm-salva" disabled={occupato}>Salva</Bottone>
      </form>
    </>
  );
}
