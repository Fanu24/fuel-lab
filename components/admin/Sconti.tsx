"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { adminApi, type CodiceSconto } from "@/lib/api";
import { generaCodice, normalizzaCodice } from "@/lib/sconti";

/* I codici sconto, nel pannello di Matteo (dentro Altro): classi pm-, testi grandi, bottoni alti almeno 48 px. */
export default function Sconti() {
  const [codici, setCodici] = useState<CodiceSconto[] | null>(null);
  const [codice, setCodice] = useState("");
  const [percentuale, setPercentuale] = useState("10");
  const [errore, setErrore] = useState("");
  const [conferma, setConferma] = useState("");
  const [attesa, setAttesa] = useState(false);
  const inVolo = useRef(false);

  useEffect(() => {
    let vivo = true;
    adminApi.sconti().then((r) => { if (vivo) setCodici(r.discounts); }).catch((e) => { if (vivo) setErrore(e instanceof Error ? e.message : "Non riesco a leggere gli sconti."); });
    return () => { vivo = false; };
  }, []);

  async function crea(e: FormEvent) {
    e.preventDefault();
    if (inVolo.current) return;
    inVolo.current = true;
    setAttesa(true); setErrore(""); setConferma("");
    try {
      const risultato = await adminApi.creaSconto(Number(percentuale), codice.trim() || undefined);
      setCodici((prev) => [risultato.discount, ...(prev ?? [])]);
      setCodice("");
      setConferma(`Creato ${risultato.discount.code}: sconto ${risultato.discount.percent}%. Puoi inviarlo al cliente.`);
    } catch (e) { setErrore(e instanceof Error ? e.message : "Codice non creato."); }
    finally { inVolo.current = false; setAttesa(false); }
  }

  async function attiva(c: CodiceSconto) {
    if (inVolo.current) return;
    inVolo.current = true; setAttesa(true); setErrore(""); setConferma("");
    try {
      await adminApi.attivaSconto(c.code, !c.active);
      setCodici((prev) => prev?.map((r) => r.code === c.code ? { ...r, active: r.active ? 0 : 1 } : r) ?? []);
      setConferma(`${c.code} ${c.active ? "disattivato" : "riattivato"}.`);
    } catch (e) { setErrore(e instanceof Error ? e.message : "Codice non aggiornato."); }
    finally { inVolo.current = false; setAttesa(false); }
  }

  return <section className="pm-box" aria-labelledby="sconti-titolo">
    <div className="pm-box-testa"><h2 id="sconti-titolo" className="pm-box-titolo">Codici sconto</h2><p className="pm-muto">Scegli la percentuale, crea il codice e mandalo al cliente.</p></div>
    <form onSubmit={(e) => void crea(e)} className="pm-form">
      <label className="pm-campo" htmlFor="sconto-percentuale">Sconto %<input id="sconto-percentuale" type="number" inputMode="numeric" min="1" max="100" step="1" required value={percentuale} onChange={(e) => setPercentuale(e.target.value)} /></label>
      <label className="pm-campo" htmlFor="sconto-codice">Codice (facoltativo)<input id="sconto-codice" className="pm-maiuscolo" autoCapitalize="characters" autoComplete="off" maxLength={32} pattern="[A-Za-z0-9][A-Za-z0-9_-]{2,31}" placeholder="Es. MATTEO10" value={codice} onChange={(e) => setCodice(e.target.value)} /></label>
      <p className="pm-muto">Se lasci il campo vuoto, lo generiamo noi. Da 3 a 32 lettere, numeri, - o _.</p>
      <div className="pm-azioni"><button className="pm-bottone pm-bottone-tenue" type="button" disabled={attesa} onClick={() => setCodice(generaCodice())}>Genera nome</button><button className="pm-bottone pm-bottone-verde" disabled={attesa} type="submit">{attesa ? "Salvo…" : "Crea codice"}</button></div>
    </form>
    {errore ? <p className="pm-errore" role="alert">{errore}</p> : null}
    {conferma ? <p className="pm-conferma" role="status">{conferma}</p> : null}
    <div className="pm-sconti">
      {codici === null ? <p>Carico i codici…</p> : codici.length === 0 ? <p>Non hai ancora codici sconto.</p> : codici.map((c) => <article key={c.code} className="pm-sconto">
        <div className="pm-sconto-testa"><strong className="pm-sconto-codice">{normalizzaCodice(c.code) ?? c.code}</strong><strong className="pm-sconto-percento">−{c.percent}%</strong></div>
        <p className="pm-muto">{c.active ? "Attivo" : "Disattivato"} · {c.uses} {c.uses === 1 ? "ordine" : "ordini"}</p>
        <div className="pm-azioni"><button className="pm-bottone pm-bottone-tenue" type="button" onClick={() => void navigator.clipboard.writeText(c.code).then(() => setConferma(`${c.code} copiato.`)).catch(() => setErrore("Copia il codice selezionando il testo."))}>Copia codice</button><button className="pm-bottone pm-bottone-tenue" type="button" disabled={attesa} onClick={() => void attiva(c)}>{c.active ? "Disattiva" : "Riattiva"}</button></div>
      </article>)}
    </div>
    <p className="pm-muto">Lo sconto si applica una sola volta al totale. Il cliente può applicarlo già nella scelta dell’abbonamento. Disattivare un codice ferma i nuovi usi e conserva lo storico degli ordini.</p>
  </section>;
}
