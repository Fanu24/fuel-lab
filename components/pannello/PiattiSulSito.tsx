"use client";

import { useEffect, useState } from "react";
import { adminApi, api, type Impostazioni } from "@/lib/api";
import { PIATTI } from "@/lib/catalogo";
import { messaggioDiErrore } from "./ui";

/* I piatti sul sito: si tolgono quando Matteo non può prepararli, e si riaggiungono con un tocco.
   Spostato qui da SimpleMenu (components/admin/SimpleAdmin.tsx). Le impostazioni si rileggono all'apertura,
   così la lista da salvare parte da quella del server e non da una copia vecchia. */
export default function PiattiSulSito({ onSalvato }: { onSalvato?: (s: Impostazioni) => void }) {
  const [impostazioni, setImpostazioni] = useState<Impostazioni | null>(null);
  const [cerca, setCerca] = useState("");
  const [occupato, setOccupato] = useState("");
  const [errore, setErrore] = useState("");

  useEffect(() => {
    let vivo = true;
    api.impostazioni(true).then(
      (r) => { if (vivo) setImpostazioni(r.settings); },
      (e: unknown) => { if (vivo) setErrore(messaggioDiErrore(e)); },
    );
    return () => { vivo = false; };
  }, []);

  async function cambia(id: string) {
    if (!impostazioni || occupato) return;
    const nonDisponibili = impostazioni.piattiNonDisponibili;
    const prossimi = nonDisponibili.includes(id) ? nonDisponibili.filter((v) => v !== id) : [...nonDisponibili, id];
    setOccupato(id);
    setErrore("");
    try {
      const r = await adminApi.salvaImpostazioni({ piattiNonDisponibili: prossimi });
      setImpostazioni(r.settings);
      onSalvato?.(r.settings);
    } catch (e) {
      setErrore(messaggioDiErrore(e));
    } finally {
      setOccupato("");
    }
  }

  const ricerca = cerca.toLocaleLowerCase("it");
  const piatti = PIATTI.filter((p) => p.nome.toLocaleLowerCase("it").includes(ricerca));

  return (
    <section className="pm-box" aria-labelledby="piatti-sito-titolo">
      <div className="pm-box-testa">
        <h2 id="piatti-sito-titolo" className="pm-box-titolo">Piatti sul sito</h2>
        <p className="pm-muto">Togli un piatto quando non puoi prepararlo. Puoi riaggiungerlo con un tocco.</p>
      </div>
      <label className="pm-campo">Cerca piatto<input type="search" value={cerca} onChange={(e) => setCerca(e.target.value)} placeholder="Nome del piatto" /></label>
      {errore && <p className="pm-errore" role="alert">{errore}</p>}
      {!impostazioni ? (
        <p className="pm-muto" role="status">Carico i piatti…</p>
      ) : (
        <ul className="pm-lista">
          {piatti.map((p) => {
            const disponibile = !impostazioni.piattiNonDisponibili.includes(p.id);
            return (
              <li key={p.id} className="pm-lista-riga">
                <div>
                  <b>{p.nome}</b>
                  <small>{disponibile ? "Disponibile" : "Tolto dal menu"}</small>
                </div>
                <button
                  type="button"
                  className={`pm-bottone ${disponibile ? "pm-bottone-tenue" : "pm-bottone-verde"}`}
                  disabled={!!occupato}
                  onClick={() => void cambia(p.id)}
                  aria-label={`${disponibile ? "Togli" : "Aggiungi"} ${p.nome} dal menu`}
                >
                  {occupato === p.id ? "Salvo…" : disponibile ? "Togli" : "Aggiungi"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
