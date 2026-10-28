"use client";

import { useEffect, useState } from "react";
import { euro, pannelloApi } from "@/lib/api";
import { meseDi, mesePrima, type Guadagni } from "@/lib/pannello";
import { oggiRoma } from "@/lib/produzione";
import { AdminLogout } from "@/components/admin/AdminAccess";
import Sconti from "@/components/admin/Sconti";
import AllineaEtichette from "./AllineaEtichette";
import PiattiSulSito from "./PiattiSulSito";
import type { Condiviso } from "./PannelloMatteo";
import { Bottone, messaggioDiErrore } from "./ui";

/* La schermata Altro (etichetta-a-e-altro.html): guadagni del mese, codici sconto, i clienti, i piatti sul sito,
   l'allineamento delle etichette, la guida per l'installazione e l'uscita. La vista la mette il pannello sotto
   la sua intestazione con "← Indietro". */

const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const nomeMese = (mese: string) => MESI[Number(mese.slice(5, 7)) - 1] ?? mese;

export default function Altro({ pannello }: { pannello: Condiviso }) {
  const { vai, dati } = pannello;
  const mese = meseDi(oggiRoma());
  const precedente = mesePrima(mese);
  const [guadagni, setGuadagni] = useState<{ mese: Guadagni; precedente: Guadagni } | null>(null);
  const [errore, setErrore] = useState("");

  useEffect(() => {
    let vivo = true;
    pannelloApi.guadagni(mese).then(
      (r) => { if (vivo) setGuadagni(r); },
      (e: unknown) => { if (vivo) setErrore(messaggioDiErrore(e)); },
    );
    return () => { vivo = false; };
  }, [mese]);

  const clienti = dati ? [...dati.clienti].sort((a, b) => a.nome.localeCompare(b.nome, "it")) : null;

  return (
    <div className="pm-altro">
      <h1 className="pm-titolo-vista">Altro</h1>

      <section className="pm-box" aria-labelledby="altro-guadagni">
        <h2 id="altro-guadagni" className="pm-box-titolo">Guadagni</h2>
        {errore && <p className="pm-errore" role="alert">{errore}</p>}
        {guadagni ? (
          <>
            <p className="pm-soldi">{euro(guadagni.mese.cents)}</p>
            <p className="pm-muto">{nomeMese(mese)} · {guadagni.mese.pasti} pasti · {guadagni.mese.clienti} clienti</p>
            <p className="pm-muto">{nomeMese(precedente)}: {euro(guadagni.precedente.cents)}</p>
          </>
        ) : !errore ? (
          <p className="pm-muto" role="status">Carico i guadagni…</p>
        ) : null}
      </section>

      <Sconti />

      <section className="pm-box" aria-labelledby="altro-clienti">
        <h2 id="altro-clienti" className="pm-box-titolo">I miei clienti</h2>
        {clienti === null ? (
          <p className="pm-muto" role="status">Carico i clienti…</p>
        ) : clienti.length === 0 ? (
          <p className="pm-muto">Non hai ancora clienti.</p>
        ) : (
          <ul className="pm-lista">
            {clienti.map((c) => (
              <li key={c.id}>
                <button type="button" className="pm-voce" onClick={() => vai({ tipo: "cliente", clienteId: c.id })}>
                  <span>{c.nome}</span>
                  <span aria-hidden="true">→</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PiattiSulSito />

      <AllineaEtichette />

      <div className="pm-altro-fondo">
        <Bottone variante="verde" className="pm-pieno" onClick={() => vai({ tipo: "guida" })}>Installa l&apos;app e le notifiche →</Bottone>
        <AdminLogout className="pm-bottone pm-bottone-tenue pm-pieno" />
      </div>
    </div>
  );
}
