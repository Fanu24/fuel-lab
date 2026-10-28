"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { adminApi, type CodiceSconto } from "@/lib/api";
import { generaCodice, normalizzaCodice } from "@/lib/sconti";

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

  return <section className="grid gap-6" aria-labelledby="sconti-titolo">
    <div><h2 id="sconti-titolo" className="text-2xl font-bold">Codici sconto</h2><p className="sa-note mt-2">Scegli la percentuale, crea il codice e mandalo al cliente.</p></div>
    <form onSubmit={(e) => void crea(e)} className="sa-form grid gap-4">
      <label className="sa-field grid gap-2" htmlFor="sconto-percentuale">Sconto %<input id="sconto-percentuale" className="min-h-11 w-full rounded-lg border p-3 text-base" type="number" min="1" max="100" step="1" required value={percentuale} onChange={(e) => setPercentuale(e.target.value)} /></label>
      <label className="sa-field grid gap-2" htmlFor="sconto-codice">Codice (facoltativo)<input id="sconto-codice" className="min-h-11 w-full rounded-lg border p-3 text-base uppercase" autoCapitalize="characters" autoComplete="off" maxLength={32} pattern="[A-Za-z0-9][A-Za-z0-9_-]{2,31}" placeholder="Es. MATTEO10" value={codice} onChange={(e) => setCodice(e.target.value)} /></label>
      <p className="sa-note">Se lasci il campo vuoto, lo generiamo noi. Da 3 a 32 lettere, numeri, - o _.</p>
      <div className="sa-actions flex flex-wrap gap-2"><button className="sa-button min-h-11 rounded-lg border px-4" type="button" disabled={attesa} onClick={() => setCodice(generaCodice())}>Genera nome</button><button className="sa-button sa-button-primary min-h-11 rounded-lg px-4" disabled={attesa} type="submit">{attesa ? "Salvo…" : "Crea codice"}</button></div>
    </form>
    {errore ? <p className="sa-error" role="alert">{errore}</p> : null}
    {conferma ? <p className="sa-note" role="status">{conferma}</p> : null}
    <div className="grid gap-3">
      {codici === null ? <p>Carico i codici…</p> : codici.length === 0 ? <p>Non hai ancora codici sconto.</p> : codici.map((c) => <article key={c.code} className="sa-card grid gap-3 rounded-xl border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><strong className="break-all text-lg">{normalizzaCodice(c.code) ?? c.code}</strong><strong className="text-xl">−{c.percent}%</strong></div>
        <p className="sa-note">{c.active ? "Attivo" : "Disattivato"} · {c.uses} {c.uses === 1 ? "ordine" : "ordini"}</p>
        <div className="sa-actions flex flex-wrap gap-2"><button className="sa-button min-h-11 rounded-lg border px-4" type="button" onClick={() => void navigator.clipboard.writeText(c.code).then(() => setConferma(`${c.code} copiato.`)).catch(() => setErrore("Copia il codice selezionando il testo."))}>Copia codice</button><button className="sa-button min-h-11 rounded-lg border px-4" type="button" disabled={attesa} onClick={() => void attiva(c)}>{c.active ? "Disattiva" : "Riattiva"}</button></div>
      </article>)}
    </div>
    <p className="sa-note">Lo sconto si applica una sola volta al totale. Il cliente può applicarlo già nella scelta dell’abbonamento. Disattivare un codice ferma i nuovi usi e conserva lo storico degli ordini.</p>
  </section>;
}
