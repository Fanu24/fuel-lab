"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { api, adminApi, ApiError, euro, STATI_ORDINE, ETICHETTE_SERVIZIO, type Ordine, type Impostazioni, type StatoOrdine, type ClienteAdmin, type Servizio, type NuovoOrdineManuale } from "@/lib/api";
import { PIATTI } from "@/lib/catalogo";
import { oggiRoma, isData, dataBreve, ordiniDelGiorno, abbonamentiDelGiorno, pastiComeOrdini, contaPastiAbbonamenti, pastiDaComporre, contaPiatti, contaExtra, etichette, etichetteAbbonamenti, inFogli, spostaGiorni, nomeAbbonamento, dettaglioAbbonamento, allergeniVoce } from "@/lib/produzione";
import { leggiEuro, centesimiInTesto } from "@/lib/operazioni";
import { FORMULE, type FormulaId } from "@/lib/abbonamento";
import { AdminLogout } from "./AdminAccess";
import Sconti from "./Sconti";
import PiattiSulSito from "@/components/pannello/PiattiSulSito";
import { MAX_PIATTI_ORDINE, pianoDaQuantita, type PiattoQuantita } from "./admin-model";
import { GIORNI, PASTI, NOMI_GIORNO, conCasella, type Piano } from "@/lib/settimana";

type Sezione = "oggi" | "ordini" | "sconti" | "menu";
type Stampa = "produzione" | "etichette" | "ordini" | null;
const SEZIONI: { id: Sezione; nome: string }[] = [{ id: "oggi", nome: "Oggi" }, { id: "ordini", nome: "Ordini" }, { id: "sconti", nome: "Sconti" }, { id: "menu", nome: "Menu" }];
const messaggioErrore = (e: unknown) => e instanceof ApiError && (e.status === 401 || e.status === 403) ? "L’accesso è scaduto. Rientra nel pannello per continuare." : e instanceof Error ? e.message : "Non riesco a completare l’operazione. Riprova.";
const quando = (data: string | null | undefined) => data && isData(data) ? dataBreve(data) : "Da fissare";
const nome = (o: Ordine) => o.customer_name || o.email;

export default function SimpleAdmin() {
  const [sezione, setSezione] = useState<Sezione>("oggi");
  const [giorno, setGiorno] = useState(oggiRoma);
  const [ordini, setOrdini] = useState<Ordine[]>([]);
  const [impostazioni, setImpostazioni] = useState<Impostazioni | null>(null);
  const [carica, setCarica] = useState(true);
  const [errore, setErrore] = useState("");
  const [avviso, setAvviso] = useState("");
  const [salva, setSalva] = useState(false);
  const [modifica, setModifica] = useState<Ordine | null>(null);
  const [nuovo, setNuovo] = useState(false);
  const [ricerca, setRicerca] = useState("");
  const [filtro, setFiltro] = useState("aperti");
  const [stampa, setStampa] = useState<Stampa>(null);
  const [giorniEtichette, setGiorniEtichette] = useState(3);
  const [saltaEtichette, setSaltaEtichette] = useState(0);
  const [ordiniStampa, setOrdiniStampa] = useState<Ordine[]>([]);
  const ultimoCaricamento = useRef(0);

  const aggiorna = useCallback(async () => {
    const n = ++ultimoCaricamento.current;
    setCarica(true); setErrore("");
    try {
      const [o, s] = await Promise.all([api.ordini(), api.impostazioni(true)]);
      if (n === ultimoCaricamento.current) { setOrdini(o.orders); setImpostazioni(s.settings); }
    } catch (e) { if (n === ultimoCaricamento.current) setErrore(messaggioErrore(e)); }
    finally { if (n === ultimoCaricamento.current) setCarica(false); }
  }, []);
  useEffect(() => {
    let vivo = true;
    Promise.all([api.ordini(), api.impostazioni(true)]).then(([o, s]) => {
      if (vivo) { setOrdini(o.orders); setImpostazioni(s.settings); }
    }).catch((e) => { if (vivo) setErrore(messaggioErrore(e)); }).finally(() => { if (vivo) setCarica(false); });
    return () => { vivo = false; };
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => { if (document.visibilityState === "visible" && !modifica && !nuovo && !salva && sezione === "oggi") void aggiorna(); }, 60_000);
    return () => window.clearInterval(timer);
  }, [aggiorna, modifica, nuovo, salva, sezione]);

  const sostituisci = (o: Ordine) => setOrdini((v) => v.some((x) => x.id === o.id) ? v.map((x) => x.id === o.id ? o : x) : [o, ...v]);
  const delGiorno = useMemo(() => ordiniDelGiorno(ordini, giorno, true), [ordini, giorno]);
  const abbonamenti = useMemo(() => abbonamentiDelGiorno(ordini, giorno), [ordini, giorno]);
  const produzione = useMemo(() => [...delGiorno, ...pastiComeOrdini(abbonamenti, giorno)], [delGiorno, abbonamenti, giorno]);
  const piatti = useMemo(() => contaPiatti(produzione), [produzione]);
  const extra = useMemo(() => contaExtra(produzione), [produzione]);
  const porzioni = delGiorno.reduce((n, o) => n + (o.meals || o.items.length), 0) + contaPastiAbbonamenti(abbonamenti, giorno);
  const senzaPiatti = pastiDaComporre(abbonamenti, giorno);
  const uscite = useMemo(() => [...ordini.filter((o) => o.service !== "abbonamento" && o.status !== "cancelled" && o.status !== "completed" && o.fulfillment_date === giorno), ...abbonamenti], [ordini, giorno, abbonamenti]);
  const daConfermare = ordini.filter((o) => o.status === "requested");
  const senzaDate = ordini.filter((o) => ["confirmed", "preparing", "ready"].includes(o.status) && (!o.production_date || !o.fulfillment_date));
  const elenco = ordini.filter((o) => {
    const passa = filtro === "tutti" || (filtro === "aperti" ? !["completed", "cancelled"].includes(o.status) : o.status === filtro);
    const testo = [nome(o), o.phone, o.id, o.notes, o.internal_note, o.address].join(" ").toLocaleLowerCase("it");
    return passa && testo.includes(ricerca.trim().toLocaleLowerCase("it"));
  });

  async function azione(o: Ordine, status: StatoOrdine) {
    if (salva) return;
    setSalva(true); setErrore(""); setAvviso("");
    try { const r = await api.modificaOrdine(o.id, { status, expectedStatus: o.status }); sostituisci(r.order); setAvviso("Ordine aggiornato."); }
    catch (e) { setErrore(messaggioErrore(e)); }
    finally { setSalva(false); }
  }
  function stampaOra(tipo: Exclude<Stampa, null>, lista: Ordine[] = elenco) {
    setOrdiniStampa(lista); setStampa(tipo);
  }
  useEffect(() => {
    if (!stampa) return;
    const reset = () => setStampa(null);
    window.addEventListener("afterprint", reset);
    const t = window.setTimeout(() => { window.print(); }, 80);
    return () => { window.clearTimeout(t); window.removeEventListener("afterprint", reset); };
  }, [stampa]);

  return (
    <div className="sa-app" data-print={stampa ?? undefined}>
      <div className="sa-screen">
        <header className="sa-header">
          <div><Link href="/" className="sa-brand">FUEL LAB</Link><p>La cucina di Matteo</p></div>
          <AdminLogout />
        </header>
        <nav className="sa-nav" aria-label="Pannello Matteo">{SEZIONI.map((s) => <button key={s.id} type="button" aria-current={sezione === s.id ? "page" : undefined} onClick={() => { setSezione(s.id); setAvviso(""); }}>{s.nome}{s.id === "ordini" && daConfermare.length > 0 ? <span aria-label={`${daConfermare.length} da confermare`}>{daConfermare.length}</span> : null}</button>)}</nav>
        <main className="sa-main" id="contenuto">
          <div className="sa-page-head"><h1>{SEZIONI.find((s) => s.id === sezione)?.nome}</h1><button type="button" className="sa-button" onClick={aggiorna} disabled={carica || salva}>{carica ? "Aggiorno…" : "Aggiorna"}</button></div>
          {errore && <div className="sa-error" role="alert"><p>{errore}</p>{errore.includes("accesso è scaduto") && <a className="sa-button" href="/admin">Rientra nel pannello</a>}</div>}
          {avviso && <p className="sa-success" role="status">{avviso}</p>}
          {carica && !impostazioni ? <p className="sa-empty" role="status">Carico gli ordini…</p> : <>
            {sezione === "oggi" && <>
              <div className="sa-actions"><label className="sa-field sa-date">Giorno<input type="date" value={giorno} onChange={(e) => { if (isData(e.target.value)) setGiorno(e.target.value); }} /></label><button type="button" className="sa-button" onClick={() => setGiorno(oggiRoma())}>Oggi</button></div>
              <div className="sa-numbers"><div><strong>{porzioni}</strong><span>pasti in cucina</span></div><div><strong>{uscite.length}</strong><span>ritiri / consegne</span></div></div>
              {daConfermare.length > 0 && <button type="button" className="sa-attention" onClick={() => { setSezione("ordini"); setFiltro("requested"); }}>{daConfermare.length} {daConfermare.length === 1 ? "ordine da confermare" : "ordini da confermare"} <span>Apri →</span></button>}
              {senzaDate.length > 0 && <div className="sa-note">{senzaDate.length} ordini confermati senza date. Apri Ordini e assegna produzione e ritiro: altrimenti non compaiono in cucina.</div>}
              <section className="sa-card"><div className="sa-card-head"><h2>Da cucinare</h2><button type="button" className="sa-button" disabled={!produzione.length} onClick={() => stampaOra("produzione")}>Stampa</button></div>
                {piatti.length ? <ul className="sa-list">{piatti.map((p) => <li className="sa-dish-row" key={p.id}><strong>{p.porzioni}×</strong><div><b>{p.nome}</b><small>{p.allergeni === null ? "Allergeni da verificare" : p.allergeni.length ? `Allergeni: ${p.allergeni.join(", ")}` : ""}</small></div></li>)}</ul> : <p className="sa-empty">Nessun piatto da preparare per questo giorno.</p>}
                {extra.length > 0 && <><h3>Aggiunte</h3><ul className="sa-list">{extra.map((e) => <li className="sa-row" key={e.nome}><b>{e.nome}</b><strong>{e.quanti}×</strong></li>)}</ul></>}
                {senzaPiatti > 0 && <p className="sa-note">{senzaPiatti} pasti in abbonamento da comporre. Controlla le note del cliente.</p>}
                {produzione.filter((o) => o.notes || o.dietary_preferences || o.internal_note).map((o) => <div className="sa-note" key={o.id}><b>{nome(o)}</b>{o.dietary_preferences && <p>Allergie / preferenze: {o.dietary_preferences}</p>}{o.notes && <p>{o.notes}</p>}{o.internal_note && <p>Nota cucina: {o.internal_note}</p>}</div>)}
              </section>
              <section className="sa-card"><div className="sa-card-head"><h2>Ordini in cucina</h2><button type="button" className="sa-button" onClick={() => { setNuovo(true); setSezione("ordini"); }}>+ Ordine</button></div>
                {delGiorno.length || abbonamenti.length ? <div className="sa-order-list">{[...delGiorno, ...abbonamenti].map((o) => <OrderCard key={o.id} o={o} busy={salva} edit={() => setModifica(o)} action={(s) => azione(o, s)} />)}</div> : <p className="sa-empty">La cucina è libera per questo giorno.</p>}
              </section>
              <section className="sa-card"><div className="sa-card-head"><h2>Ritiri e consegne</h2><button type="button" className="sa-button" disabled={!uscite.length} onClick={() => stampaOra("ordini", uscite)}>Stampa</button></div>{uscite.length ? <ul className="sa-list">{uscite.map((o) => <li className="sa-row" key={o.id}><div><b>{nome(o)}</b><small>{o.fulfillment === "pickup" ? "Ritiro" : `${o.address}, ${o.comune}`}</small></div><button type="button" className="sa-button" onClick={() => setModifica(o)}>Apri</button></li>)}</ul> : <p className="sa-empty">Nessun ritiro o consegna per questo giorno.</p>}</section>
              <section className="sa-card"><h2>Etichette</h2><div className="sa-grid"><label className="sa-field">Consumare entro<select value={giorniEtichette} onChange={(e) => setGiorniEtichette(Number(e.target.value))}>{[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n} {n === 1 ? "giorno" : "giorni"} dalla preparazione</option>)}</select></label><label className="sa-field">Caselle già usate sul foglio<select value={saltaEtichette} onChange={(e) => setSaltaEtichette(Number(e.target.value))}>{Array.from({ length: 21 }, (_, n) => <option key={n} value={n}>{n === 0 ? "Nessuna: foglio nuovo" : n}</option>)}</select></label></div><p className="sa-muted">Foglio A4 da 21 etichette (70 × 42,3 mm). Stampa al 100%, senza adattare. Controlla allergeni e conservazione prima di consegnare.</p><button type="button" className="sa-button sa-button-primary" disabled={!produzione.some((o) => o.items.length) && !abbonamenti.length} onClick={() => stampaOra("etichette")}>Stampa etichette</button></section>
            </>}
            {sezione === "ordini" && <>
              <div className="sa-actions"><button type="button" className="sa-button sa-button-primary" onClick={() => setNuovo(true)}>+ Aggiungi ordine</button><button type="button" className="sa-button" disabled={!elenco.length} onClick={() => stampaOra("ordini")}>Stampa elenco</button></div>
              <div className="sa-grid"><label className="sa-field">Cerca cliente<input type="search" value={ricerca} onChange={(e) => setRicerca(e.target.value)} placeholder="Nome o telefono" /></label><label className="sa-field">Mostra<select value={filtro} onChange={(e) => setFiltro(e.target.value)}><option value="aperti">Ordini aperti</option>{STATI_ORDINE.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}<option value="tutti">Tutti (ultimi 100 chiusi)</option></select></label></div>
              <div className="sa-order-list">{elenco.map((o) => <OrderCard key={o.id} o={o} busy={salva} edit={() => setModifica(o)} action={(s) => azione(o, s)} />)}</div>{!elenco.length && <p className="sa-empty">Nessun ordine trovato.</p>}
            </>}
            {sezione === "sconti" && <Sconti />}
            {sezione === "menu" && <PiattiSulSito onSalvato={(s) => { setImpostazioni(s); setAvviso("Menu aggiornato sul sito."); }} />}
          </>}
        </main>
        {modifica && <EditOrder key={modifica.id} o={modifica} close={() => setModifica(null)} saved={(o) => { sostituisci(o); setModifica(null); setAvviso("Ordine salvato."); }} print={() => stampaOra("ordini", [modifica])} />}
        {nuovo && <NewOrder day={giorno} unavailable={impostazioni?.piattiNonDisponibili ?? []} close={() => setNuovo(false)} saved={(o) => { sostituisci(o); setNuovo(false); setFiltro("aperti"); setAvviso("Ordine aggiunto."); }} />}
      </div>
      {stampa && <PrintArea tipo={stampa} giorno={giorno} produzione={produzione} abbonamenti={abbonamenti} normali={delGiorno} ordini={ordiniStampa} scadenza={giorniEtichette} salta={saltaEtichette} />}
    </div>
  );
}

function OrderCard({ o, edit, action, busy }: { o: Ordine; edit: () => void; action: (s: StatoOrdine) => void; busy: boolean }) {
  const label = STATI_ORDINE.find((s) => s.id === o.status)?.label;
  const prossima: StatoOrdine | null = o.service === "abbonamento" ? null : o.status === "confirmed" ? "preparing" : o.status === "preparing" ? "ready" : o.status === "ready" ? "completed" : null;
  const piatti = o.items.reduce<Record<string, number>>((a, v) => ({ ...a, [v.name]: (a[v.name] ?? 0) + 1 }), {});
  return <article className="sa-order"><div className="sa-row"><h3>{nome(o)}</h3><span className={`sa-badge sa-badge-${o.status}`}>{label}</span></div><p className="sa-muted">{o.service === "abbonamento" ? `${nomeAbbonamento(o)} · ${dettaglioAbbonamento(o)}` : `${o.meals} pasti`} · {o.fulfillment === "pickup" ? "Ritiro" : "Consegna"}</p>
    <div className="sa-order-dates"><span>Cucina <b>{quando(o.production_date)}</b></span><span>{o.service === "abbonamento" ? "Inizio" : "Uscita"} <b>{quando(o.fulfillment_date ?? o.requested_date)}</b></span></div>
    {Object.keys(piatti).length > 0 && <p>{Object.entries(piatti).map(([n, q]) => `${q}× ${n}`).join(" · ")}</p>}
    {o.dietary_preferences && <p className="sa-note">Allergie / preferenze: {o.dietary_preferences}</p>}{o.notes && <p className="sa-note">{o.notes}</p>}
    <div className="sa-row"><b>{euro(o.price_cents)}</b><span className={o.paid ? "sa-paid" : "sa-muted"}>{o.paid ? "Pagato" : "Da incassare"}</span></div>
    {o.discount && <p className="sa-muted">Codice {o.discount.code} · −{o.discount.appliedPercent}%</p>}
    <div className="sa-actions"><button type="button" className="sa-button" onClick={edit}>{o.status === "requested" ? "Conferma / modifica" : "Apri / modifica"}</button>{prossima && <button type="button" className="sa-button sa-button-primary" disabled={busy} onClick={() => action(prossima)}>{prossima === "preparing" ? "Inizia cucina" : prossima === "ready" ? "Segna pronto" : "Segna consegnato"}</button>}</div>
  </article>;
}

function Sheet({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const oldFocus = useRef<Element | null>(null);
  useEffect(() => {
    oldFocus.current = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>("button, input, select, textarea")?.focus();
    return () => { document.body.style.overflow = overflow; if (oldFocus.current instanceof HTMLElement) oldFocus.current.focus(); };
  }, []);
  return <div className="sa-overlay" onKeyDown={(e) => { if (e.key === "Escape") close(); if (e.key === "Tab") { const fields = ref.current?.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]"); if (!fields?.length) return; const first = fields[0]; const last = fields[fields.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } } }}><section ref={ref} role="dialog" aria-modal="true" aria-label={title} className="sa-sheet"><div className="sa-sheet-head"><h2>{title}</h2><button type="button" className="sa-button" onClick={close}>Chiudi</button></div>{children}</section></div>;
}

function EditOrder({ o, close, saved, print }: { o: Ordine; close: () => void; saved: (o: Ordine) => void; print: () => void }) {
  const [status, setStatus] = useState(o.status);
  const [produzione, setProduzione] = useState(o.production_date ?? o.requested_date ?? "");
  const [uscita, setUscita] = useState(o.fulfillment_date ?? o.requested_date ?? "");
  const [prezzo, setPrezzo] = useState(centesimiInTesto(o.discount?.baseCents ?? o.price_cents));
  const [pagato, setPagato] = useState(o.paid === 1);
  const [nota, setNota] = useState(o.internal_note ?? "");
  const [notifica, setNotifica] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errore, setErrore] = useState("");
  const [annulla, setAnnulla] = useState(false);
  const [piano, setPiano] = useState<Piano | null>(null);
  const [pianoCambiato, setPianoCambiato] = useState(false);
  const [caricaPiatti, setCaricaPiatti] = useState(false);
  async function apriPiatti() {
    setCaricaPiatti(true); setErrore("");
    try { const r = await api.ordine(o.id); setPiano(r.order.plan); }
    catch (e) { setErrore(messaggioErrore(e)); }
    finally { setCaricaPiatti(false); }
  }
  async function submit(e: FormEvent, annullare = false) {
    e.preventDefault(); if (busy) return;
    const cents = leggiEuro(prezzo);
    if (cents === undefined) { setErrore("Scrivi un importo valido, ad esempio 25,50."); return; }
    setBusy(true); setErrore("");
    try { const r = await api.modificaOrdine(o.id, { status: annullare ? "cancelled" : status, productionDate: produzione || null, fulfillmentDate: uscita || null, priceCents: cents, paid: pagato, internalNote: nota, notify: notifica, expectedStatus: o.status, ...(pianoCambiato && piano && !annullare ? { plan: piano } : {}) }); saved(r.order); }
    catch (e) { setErrore(messaggioErrore(e)); }
    finally { setBusy(false); }
  }
  return <Sheet title={nome(o)} close={() => { if (!busy) close(); }}><form className="sa-form" onSubmit={submit}>
    <p className="sa-muted">{ETICHETTE_SERVIZIO[o.service]} · {o.fulfillment === "pickup" ? "Ritiro" : "Consegna"}</p>
    {o.phone && <a className="sa-contact" href={`tel:${o.phone.replace(/[^+\d]/g, "")}`}>{o.phone}</a>}{o.fulfillment === "delivery" && <p>{o.address}, {o.comune}</p>}
    {o.items.length > 0 && <ul className="sa-list">{o.items.map((v, i) => <li key={`${v.id}-${i}`}><b>{v.name}</b> · {v.day} {v.meal}{v.extras.length ? <small>+ {v.extras.join(", ")}</small> : null}</li>)}</ul>}
    {(["menu-settimana", "sui-tuoi-macro"] as Servizio[]).includes(o.service) && <>{piano === null ? <button type="button" className="sa-button" disabled={busy || caricaPiatti} onClick={apriPiatti}>{caricaPiatti ? "Apro i piatti…" : "Aggiungi / togli piatti"}</button> : <EditDishes piano={piano} disabled={busy} onChange={(p) => { setPiano(p); setPianoCambiato(true); }} />}</>}
    {o.dietary_preferences && <p className="sa-note">Allergie / preferenze: {o.dietary_preferences}</p>}{o.notes && <p className="sa-note">{o.notes}</p>}
    <label className="sa-field">Stato<select value={status} disabled={busy} onChange={(e) => setStatus(e.target.value as StatoOrdine)}>{STATI_ORDINE.filter((s) => s.id !== "cancelled" || status === "cancelled").map((s) => <option value={s.id} key={s.id}>{s.label}</option>)}</select></label>
    {o.service === "abbonamento" ? <label className="sa-field">Inizio abbonamento<input type="date" value={uscita} disabled={busy} onChange={(e) => { setUscita(e.target.value); setProduzione(e.target.value); }} /></label> : <div className="sa-grid"><label className="sa-field">Giorno di cucina<input type="date" value={produzione} disabled={busy} onChange={(e) => setProduzione(e.target.value)} /></label><label className="sa-field">{o.fulfillment === "pickup" ? "Giorno di ritiro" : "Giorno di consegna"}<input type="date" value={uscita} disabled={busy} onChange={(e) => setUscita(e.target.value)} /></label></div>}
    <label className="sa-field">{o.discount ? "Totale prima dello sconto (€)" : "Totale (€)"}<input inputMode="decimal" value={prezzo} disabled={busy} onChange={(e) => setPrezzo(e.target.value)} placeholder="Da concordare" /></label>
    {o.discount && <p className="sa-note">Codice {o.discount.code}: −{o.discount.appliedPercent}%. Totale salvato: {euro(o.price_cents)}.</p>}
    <label className="sa-check"><input type="checkbox" checked={pagato} disabled={busy} onChange={(e) => setPagato(e.target.checked)} />Già pagato</label>
    <label className="sa-field">Nota per la cucina<textarea rows={3} maxLength={2000} value={nota} disabled={busy} onChange={(e) => setNota(e.target.value)} /></label>
    {o.source !== "manual" && <label className="sa-check"><input type="checkbox" checked={notifica} disabled={busy} onChange={(e) => setNotifica(e.target.checked)} />Avvisa il cliente via email del cambio di stato</label>}
    {errore && <div className="sa-error" role="alert"><p>{errore}</p>{errore.includes("accesso è scaduto") && <a className="sa-button" href="/admin">Rientra nel pannello</a>}</div>}
    <div className="sa-actions"><button type="submit" className="sa-button sa-button-primary" disabled={busy}>{busy ? "Salvo…" : "Salva ordine"}</button><button type="button" className="sa-button" onClick={print}>Stampa ordine</button></div>
    {o.status !== "cancelled" && <div className="sa-remove">{annulla ? <><p>Togliere l’ordine dalla cucina? Rimarrà nello storico come annullato.</p><div className="sa-actions"><button type="button" className="sa-button sa-button-danger" disabled={busy} onClick={(e) => submit(e, true)}>Sì, annulla ordine</button><button type="button" className="sa-button" disabled={busy} onClick={() => setAnnulla(false)}>Tieni ordine</button></div></> : <button type="button" className="sa-button sa-button-danger" disabled={busy} onClick={() => setAnnulla(true)}>Annulla ordine</button>}</div>}
  </form></Sheet>;
}

function EditDishes({ piano, disabled, onChange }: { piano: Piano; disabled: boolean; onChange: (p: Piano) => void }) {
  const [piatto, setPiatto] = useState("");
  const caselle = GIORNI.flatMap((g) => PASTI.map((m) => ({ g, m, c: piano[g]?.[m] }))).filter((v) => v.c?.piatto);
  const vuota = GIORNI.flatMap((g) => PASTI.map((m) => ({ g, m }))).find((v) => !piano[v.g]?.[v.m]?.piatto);
  return <fieldset className="sa-dishes"><legend>Modifica piatti · {caselle.length}/{MAX_PIATTI_ORDINE}</legend><div className="sa-form" style={{ padding: 0 }}>
    {caselle.map(({ g, m, c }) => <div className="sa-dish-edit" key={`${g}-${m}`}><label className="sa-field">{NOMI_GIORNO[g]} · {m}<select value={c!.piatto} disabled={disabled} onChange={(e) => onChange(conCasella(piano, g, m, { ...c!, piatto: e.target.value }))}>{PIATTI.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label><button type="button" className="sa-button" disabled={disabled || caselle.length === 1} aria-label={`Togli il piatto di ${NOMI_GIORNO[g]} ${m}`} onClick={() => onChange(conCasella(piano, g, m, undefined))}>Togli</button>{(c?.extra.length ?? 0) > 0 && <small className="sa-muted">Le aggiunte di questo pasto vengono mantenute.</small>}</div>)}
    {vuota && <div className="sa-add-dish"><label className="sa-field">Nuovo piatto · {NOMI_GIORNO[vuota.g]} {vuota.m}<select value={piatto} disabled={disabled} onChange={(e) => setPiatto(e.target.value)}><option value="">Scegli…</option>{PIATTI.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label><button type="button" className="sa-button" disabled={disabled || !piatto} onClick={() => { onChange(conCasella(piano, vuota.g, vuota.m, { piatto, extra: [] })); setPiatto(""); }}>Aggiungi</button></div>}
    <p className="sa-muted">Le modifiche si applicano quando premi Salva ordine.</p>
  </div></fieldset>;
}

function NewOrder({ day, unavailable, close, saved }: { day: string; unavailable: string[]; close: () => void; saved: (o: Ordine) => void }) {
  const [name, setName] = useState(""); const [phone, setPhone] = useState("");
  const [cliente, setCliente] = useState(""); const [clienti, setClienti] = useState<ClienteAdmin[]>([]); const [erroreClienti, setErroreClienti] = useState("");
  const [servizio, setServizio] = useState<Servizio>("menu-settimana");
  const [formula, setFormula] = useState<FormulaId>("completo"); const [fascia, setFascia] = useState<"standard" | "plus">("standard");
  const [nucleo, setNucleo] = useState<"singolo" | "coppia" | "famiglia">("singolo");
  const [modalita, setModalita] = useState<"pickup" | "delivery">("pickup");
  const [comune, setComune] = useState("Pescara"); const [address, setAddress] = useState("");
  const [date, setDate] = useState(day); const [uscita, setUscita] = useState(day);
  const [stato, setStato] = useState<"requested" | "confirmed">("confirmed");
  const [prezzo, setPrezzo] = useState(""); const [pagato, setPagato] = useState(false);
  const [notes, setNotes] = useState(""); const [discountCode, setDiscountCode] = useState("");
  const [righe, setRighe] = useState<PiattoQuantita[]>([]); const [piatto, setPiatto] = useState("");
  const [porzioni, setPorzioni] = useState("1"); const [busy, setBusy] = useState(false); const [errore, setErrore] = useState("");
  const totale = righe.reduce((n, r) => n + r.quantita, 0);
  useEffect(() => { let vivo = true; adminApi.clienti().then((r) => { if (vivo) setClienti(r.customers); }).catch((e) => { if (vivo) setErroreClienti(messaggioErrore(e)); }); return () => { vivo = false; }; }, []);
  function scegliCliente(id: string) { setCliente(id); const c = clienti.find((v) => v.id === id); if (c) { setName(c.name); setPhone(c.phone); setComune(c.comune || "Pescara"); setAddress(c.address); } }
  function aggiungi() { if (!piatto || totale >= MAX_PIATTI_ORDINE) return; setRighe((rs) => rs.some((r) => r.id === piatto) ? rs.map((r) => r.id === piatto ? { ...r, quantita: r.quantita + 1 } : r) : [...rs, { id: piatto, quantita: 1 }]); setPiatto(""); }
  function quantita(id: string, delta: number) { if (delta > 0 && totale >= MAX_PIATTI_ORDINE) return; setRighe((rs) => rs.map((r) => r.id === id ? { ...r, quantita: r.quantita + delta } : r).filter((r) => r.quantita > 0)); }
  async function submit(e: FormEvent) {
    e.preventDefault(); if (busy) return;
    setErrore("");
    const cents = leggiEuro(prezzo);
    if (cents === undefined) { setErrore("Scrivi un importo valido, ad esempio 25,50."); return; }
    if (!name.trim() || phone.replace(/\D/g, "").length < 9) { setErrore("Scrivi nome e telefono del cliente (almeno 9 cifre)."); return; }
    if (servizio !== "abbonamento" && servizio !== "home-cooking" && !totale) { setErrore("Aggiungi almeno un piatto."); return; }
    if (stato === "confirmed" && (!isData(date) || !isData(uscita))) { setErrore("Scegli il giorno di cucina e di ritiro o consegna."); return; }
    setBusy(true);
    try {
      const corpo: NuovoOrdineManuale = { customerId: cliente || null, name, phone, comune, address, service: servizio, fulfillment: modalita,
        plan: servizio === "abbonamento" ? {} : pianoDaQuantita(righe, uscita || date), status: stato, productionDate: date || null,
        fulfillmentDate: (servizio === "abbonamento" ? date : uscita) || null, paid: pagato, notes,
        ...(servizio === "abbonamento" ? { subscription: { plan: formula, tier: fascia, household: nucleo } } : {}),
        ...(servizio === "home-cooking" ? { meals: Number(porzioni) } : {}),
        ...(servizio !== "abbonamento" || cents !== null ? { priceCents: cents } : {}),
        ...(discountCode.trim() ? { discountCode: discountCode.trim() } : {}),
      };
      const r = await adminApi.nuovoOrdine(corpo); saved(r.order);
    } catch (e) { setErrore(messaggioErrore(e)); } finally { setBusy(false); }
  }
  return <Sheet title="Aggiungi ordine" close={() => { if (!busy) close(); }}><form onSubmit={submit} className="sa-form">
    <details className="sa-extra"><summary>Cliente registrato / altro servizio</summary><div className="sa-extra-body">
    <label className="sa-field">Cliente<select value={cliente} disabled={busy} onChange={(e) => scegliCliente(e.target.value)}><option value="">Nuovo / senza account</option>{clienti.map((c) => <option key={c.id} value={c.id}>{c.name || c.email} · {c.email}</option>)}</select></label>{erroreClienti && <p className="sa-note">Elenco clienti non disponibile. Puoi comunque inserire nome e telefono.</p>}
    <label className="sa-field">Tipo di ordine<select value={servizio} disabled={busy} onChange={(e) => setServizio(e.target.value as Servizio)}>{Object.entries(ETICHETTE_SERVIZIO).map(([id, n]) => <option key={id} value={id}>{n}</option>)}</select></label>
    {servizio === "abbonamento" && <><div className="sa-grid"><label className="sa-field">Formula<select value={formula} disabled={busy} onChange={(e) => setFormula(e.target.value as FormulaId)}>{FORMULE.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}</select></label><label className="sa-field">Fascia<select value={fascia} disabled={busy} onChange={(e) => setFascia(e.target.value as "standard" | "plus")}><option value="standard">Standard</option><option value="plus">Plus</option></select></label></div><label className="sa-field">Per chi<select value={nucleo} disabled={busy} onChange={(e) => setNucleo(e.target.value as typeof nucleo)}><option value="singolo">Una persona</option><option value="coppia">Coppia</option><option value="famiglia">Famiglia</option></select></label></>}
    </div></details>
    <div className="sa-grid"><label className="sa-field">Nome<input autoComplete="name" required maxLength={100} value={name} disabled={busy} onChange={(e) => setName(e.target.value)} /></label><label className="sa-field">Telefono<input type="tel" autoComplete="tel" required maxLength={40} value={phone} disabled={busy} onChange={(e) => setPhone(e.target.value)} /></label></div>
    {servizio !== "abbonamento" && <>
      <fieldset className="sa-dishes"><legend>Piatti · {totale}/{MAX_PIATTI_ORDINE}</legend><div className="sa-add-dish"><label className="sa-field">Scegli piatto<select value={piatto} disabled={busy} onChange={(e) => setPiatto(e.target.value)}><option value="">Scegli…</option>{PIATTI.filter((p) => !unavailable.includes(p.id)).map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label><button type="button" className="sa-button" disabled={!piatto || busy || totale >= MAX_PIATTI_ORDINE} onClick={aggiungi}>Aggiungi</button></div><ul className="sa-list">{righe.map((r) => <li key={r.id} className="sa-row"><b>{PIATTI.find((p) => p.id === r.id)?.nome}</b><div className="sa-quantity"><button type="button" disabled={busy} onClick={() => quantita(r.id, -1)} aria-label={`Togli una porzione di ${PIATTI.find((p) => p.id === r.id)?.nome}`}>−</button><strong>{r.quantita}</strong><button type="button" disabled={busy || totale >= MAX_PIATTI_ORDINE} onClick={() => quantita(r.id, 1)} aria-label={`Aggiungi una porzione di ${PIATTI.find((p) => p.id === r.id)?.nome}`}>+</button></div></li>)}</ul>{totale === MAX_PIATTI_ORDINE && <p className="sa-muted">Per più di 14 pasti, crea un secondo ordine.</p>}</fieldset>
      {servizio === "home-cooking" && <label className="sa-field">Porzioni concordate<input type="number" min={1} max={100} value={porzioni} disabled={busy} onChange={(e) => setPorzioni(e.target.value)} /></label>}
    </>}
    <label className="sa-field">Come lo riceve<select value={modalita} disabled={busy} onChange={(e) => setModalita(e.target.value as "pickup" | "delivery")}><option value="pickup">Ritiro in cucina</option><option value="delivery">Consegna</option></select></label>
    {modalita === "delivery" && <><label className="sa-field">Comune<input required maxLength={100} value={comune} disabled={busy} onChange={(e) => setComune(e.target.value)} /></label><label className="sa-field">Indirizzo<input required maxLength={240} value={address} disabled={busy} onChange={(e) => setAddress(e.target.value)} /></label></>}
    <div className="sa-grid"><label className="sa-field">{servizio === "abbonamento" ? "Inizio abbonamento" : "Giorno di cucina"}<input type="date" required={stato === "confirmed"} value={date} disabled={busy} onChange={(e) => { setDate(e.target.value); if (servizio === "abbonamento") setUscita(e.target.value); }} /></label>{servizio !== "abbonamento" && <label className="sa-field">Giorno di {modalita === "pickup" ? "ritiro" : "consegna"}<input type="date" required={stato === "confirmed"} value={uscita} disabled={busy} onChange={(e) => setUscita(e.target.value)} /></label>}</div>
    <label className="sa-field">Totale prima del codice (€)<input inputMode="decimal" value={prezzo} disabled={busy} onChange={(e) => setPrezzo(e.target.value)} placeholder={servizio === "abbonamento" ? "Automatico da listino" : "Da concordare"} /></label>
    <details className="sa-extra"><summary>Note, codice sconto e altre opzioni</summary><div className="sa-extra-body">
    <label className="sa-field">Codice sconto (facoltativo)<input value={discountCode} disabled={busy} maxLength={32} autoCapitalize="characters" onChange={(e) => setDiscountCode(e.target.value)} /></label>
    <label className="sa-field">Stato<select value={stato} disabled={busy} onChange={(e) => setStato(e.target.value as typeof stato)}><option value="confirmed">Già confermato</option><option value="requested">Da confermare</option></select></label>
    <label className="sa-check"><input type="checkbox" checked={pagato} disabled={busy} onChange={(e) => setPagato(e.target.checked)} />Già pagato</label><label className="sa-field">Note / allergie<textarea rows={3} maxLength={1500} value={notes} disabled={busy} onChange={(e) => setNotes(e.target.value)} /></label>
    </div></details>
    {errore && <p role="alert" className="sa-error">{errore}</p>}<button type="submit" className="sa-button sa-button-primary" disabled={busy}>{busy ? "Aggiungo…" : "Aggiungi ordine"}</button>
  </form></Sheet>;
}

function PrintArea({ tipo, giorno, produzione, normali, abbonamenti, ordini, scadenza, salta }: { tipo: Exclude<Stampa, null>; giorno: string; produzione: Ordine[]; normali: Ordine[]; abbonamenti: Ordine[]; ordini: Ordine[]; scadenza: number; salta: number }) {
  if (tipo === "etichette") {
    const lista = [...etichette(normali), ...etichetteAbbonamenti(abbonamenti, giorno)];
    return <div className="sa-print sa-print-labels">{inFogli(lista, salta).map((foglio, n) => <section className="sa-label-sheet" key={n}>{Array.from({ length: 21 }, (_, i) => { const e = foglio[i]; return <div className="sa-label" key={e?.chiave ?? i}>{e && <><div className="sa-row"><b>{e.cliente}</b><small>FUEL LAB</small></div><strong>{e.piatto}</strong>{e.extra.length > 0 && <p>+ {e.extra.join(", ")}</p>}<p>{e.quando}</p><p>Allergeni: {e.allergeni === null ? "DA VERIFICARE" : e.allergeni.length ? e.allergeni.join(", ") : "nessuno"}</p><p>Preparato: {dataBreve(giorno)}<br />Consumare entro: {dataBreve(spostaGiorni(giorno, scadenza))}</p></>}</div>; })}</section>)}</div>;
  }
  return <div className="sa-print"><h1>FUEL LAB · {tipo === "produzione" ? "Produzione" : "Ordini"}</h1><p>{dataBreve(giorno)}</p>{tipo === "produzione" && <><p><b>{produzione.reduce((n, o) => n + (o.meals || o.items.length), 0)} pasti · {produzione.length} ordini / abbonamenti</b></p><h2>Da cucinare</h2><table><tbody>{contaPiatti(produzione).map((p) => <tr key={p.id}><td><strong>{p.porzioni}×</strong></td><td>{p.nome}</td><td>{p.allergeni === null ? "Allergeni da verificare" : p.allergeni.join(", ")}</td></tr>)}</tbody></table>{contaExtra(produzione).length > 0 && <><h2>Aggiunte</h2><ul>{contaExtra(produzione).map((e) => <li key={e.nome}>{e.quanti}× {e.nome}</li>)}</ul></>}{pastiDaComporre(abbonamenti, giorno) > 0 && <p><b>{pastiDaComporre(abbonamenti, giorno)} pasti in abbonamento da comporre.</b></p>}</>}
    {(tipo === "produzione" ? produzione : ordini).map((o) => <article className="sa-print-order" key={o.id}><h2>{nome(o)} <small>· {STATI_ORDINE.find((s) => s.id === o.status)?.label}</small></h2><p>{ETICHETTE_SERVIZIO[o.service]} · {o.phone} · {o.fulfillment === "pickup" ? "Ritiro" : `Consegna: ${o.address}, ${o.comune}`}</p><p>Cucina: {quando(o.production_date)} · Uscita: {quando(o.fulfillment_date)}</p>{o.service === "abbonamento" && <p>{nomeAbbonamento(o)} · {dettaglioAbbonamento(o)}</p>}<ul>{o.items.map((v, i) => <li key={i}><b>{v.name}</b> · {v.day} {v.meal}{v.extras.length > 0 ? ` + ${v.extras.join(", ")}` : ""}<small> · Allergeni: {allergeniVoce(v)?.join(", ") || (allergeniVoce(v) === null ? "DA VERIFICARE" : "nessuno")}</small></li>)}</ul>{o.dietary_preferences && <p><b>Allergie / preferenze: {o.dietary_preferences}</b></p>}{o.notes && <p><b>Note: {o.notes}</b></p>}{o.internal_note && <p>Nota cucina: {o.internal_note}</p>}{tipo === "ordini" && <p><b>Totale {euro(o.price_cents)} · {o.paid ? "Pagato" : "Da incassare"}</b>{o.discount ? ` · Codice ${o.discount.code} −${o.discount.appliedPercent}%` : ""}</p>}</article>)}
  </div>;
}


