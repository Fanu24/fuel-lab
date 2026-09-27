"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { aggregateItems, operationalQueues, STATES, statusLabel, todayRome, type Order } from "@/lib/operazioni";

export async function getAdminOrders(): Promise<Order[]> {
  const response = await fetch("/api/orders", { cache: "no-store", credentials: "same-origin" });
  if (!response.ok) throw new Error("Non riesco a caricare gli ordini. Riprova.");
  return (await response.json()).orders as Order[];
}

function formatDay(day: string | null) {
  return day ? new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`)) : "Da assegnare";
}

function OrderLine({ order, open, updateStatus, busy, today }: { order: Order; open: (order: Order) => void; updateStatus: (order: Order, status: string) => void; busy: boolean; today: string }) {
  const late = (order.production_date && order.production_date < today && ["confirmed", "preparing"].includes(order.status)) || (order.fulfillment_date && order.fulfillment_date < today && order.status === "ready");
  return <li className="grid gap-2 border-b border-ink/15 py-3 text-sm md:grid-cols-[minmax(0,1.5fr)_minmax(0,.7fr)_minmax(0,.9fr)_minmax(0,.9fr)_auto] md:items-center md:gap-4">
    <div><button type="button" className="min-h-11 text-left font-semibold hover:underline" onClick={() => open(order)}>{order.customer_name}</button><p className="text-xs text-muted">{order.phone} · {order.comune}</p></div>
    <div>{order.meals} pasti · {order.fulfillment === "pickup" ? "Ritiro" : "Consegna"}</div>
    <div><span className="block text-xs text-muted">Produzione</span><strong className={late ? "text-red-700" : "font-medium"}>{formatDay(order.production_date)}</strong></div>
    <div><span className="block text-xs text-muted">Ritiro/consegna</span><strong className={late ? "text-red-700" : "font-medium"}>{formatDay(order.fulfillment_date)}</strong></div>
    <select aria-label={`Stato ordine di ${order.customer_name}`} className="min-h-11 border border-ink/25 bg-paper px-2 text-sm" value={order.status} disabled={busy} onChange={(event) => updateStatus(order, event.target.value)}>{STATES.map((state) => <option key={state.id} value={state.id}>{state.label}</option>)}</select>
  </li>;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [productionDate, setProductionDate] = useState("");
  const [fulfillmentDate, setFulfillmentDate] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("requested");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("active");
  const [today, setToday] = useState(todayRome());

  const load = useCallback(async () => {
    setRefreshing(true);
    try { setOrders(await getAdminOrders()); setSyncedAt(new Date()); setToday(todayRome()); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Errore temporaneo."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => {
    const first = window.setTimeout(() => { void load(); }, 0);
    const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 60000);
    const visible = () => { if (!document.hidden) void load(); };
    document.addEventListener("visibilitychange", visible);
    return () => { window.clearTimeout(first); window.clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, [load]);

  const queues = useMemo(() => operationalQueues(orders, today), [orders, today]);
  const dishes = useMemo(() => aggregateItems(queues.productionToday, "dishes"), [queues.productionToday]);
  const selected = orders.find((order) => order.id === selectedId);
  const visible = orders.filter((order) => {
    if (filter === "active" && ["completed", "cancelled"].includes(order.status)) return false;
    if (filter !== "active" && filter !== "all" && order.status !== filter) return false;
    const query = search.trim().toLocaleLowerCase("it");
    return !query || [order.customer_name, order.email, order.phone, order.id].some((value) => value.toLocaleLowerCase("it").includes(query));
  });

  function open(order: Order) {
    setSelectedId(order.id); setProductionDate(order.production_date ?? ""); setFulfillmentDate(order.fulfillment_date ?? ""); setNote(order.internal_note ?? ""); setStatus(order.status);
    window.setTimeout(() => document.getElementById("dettaglio-ordine")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }
  async function patch(id: string, data: Record<string, unknown>) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(id)}`, { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Modifica non salvata");
      if (selectedId === id && typeof data.status === "string") setStatus(data.status);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Modifica non salvata"); }
    finally { setBusy(false); }
  }
  function quickStatus(order: Order, next: string) {
    if (!["requested", "cancelled"].includes(next) && (!order.production_date || !order.fulfillment_date)) { open(order); setStatus(next); setError("Assegna le date di produzione e ritiro o consegna, poi salva il dettaglio."); return; }
    void patch(order.id, { status: next });
  }

  if (loading) return <p className="py-12 text-muted">Carico gli ordini…</p>;
  return <div className="grid gap-8 text-ink">
    <header className="flex flex-wrap items-start justify-between gap-4 border-b-[3px] border-ink pb-5"><div><p className="occhiello">FUEL LAB · Operazioni</p><h1 className="mt-2 font-disp text-3xl font-bold uppercase md:text-4xl">Pannello Matteo</h1><p className="mt-2 text-sm text-muted">{new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Rome" }).format(new Date())} · {queues.active.length} ordini aperti</p></div><div className="flex flex-wrap items-center gap-3"><span className="text-xs text-muted">{syncedAt ? `Aggiornato ${syncedAt.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}` : "Non aggiornato"}</span><button type="button" className="btn btn-linea btn-sm" disabled={refreshing} onClick={() => void load()}>{refreshing ? "Aggiorno…" : "Aggiorna"}</button><Link href="/dashboard/produzione" className="btn btn-ink btn-sm">Foglio cucina →</Link></div></header>
    {error ? <p className="border-l-4 border-red-700 bg-red-50 p-4 text-sm font-semibold text-red-900" role="alert">{error}</p> : null}
    <dl className="grid grid-cols-2 gap-px border border-ink/20 bg-ink/20 md:grid-cols-3 xl:grid-cols-6">{[
      ["Nuove richieste", queues.newRequests.length], ["Senza programmazione", queues.unscheduled.length], ["In ritardo", queues.overdue.length],
      ["Porzioni da fare oggi", queues.portionsToday], ["Ritiri/consegne oggi", queues.fulfillmentToday.length], ["Pronti da affidare", queues.ready.length],
    ].map(([label, count]) => <div key={label} className="bg-paper p-3 md:p-4"><dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</dt><dd className="num mt-2 text-3xl font-bold">{count}</dd></div>)}</dl>
    <section aria-labelledby="priorita-title"><div className="flex items-baseline justify-between gap-3 border-b-2 border-ink pb-2"><h2 id="priorita-title" className="font-disp text-xl font-bold uppercase">Da gestire adesso</h2><span className="text-xs text-muted">{queues.attention.length} ordini</span></div>{queues.attention.length ? <ul className="divide-y divide-ink/15">{queues.attention.map((order) => <li key={order.id} className="grid gap-2 py-3 text-sm md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto] md:items-center"><div><button type="button" className="min-h-11 text-left font-semibold hover:underline" onClick={() => open(order)}>{order.customer_name}</button><p className="text-xs text-muted">{order.phone} · {order.meals} pasti · {order.fulfillment === "pickup" ? "Ritiro" : "Consegna"}</p></div><span className="font-semibold">{statusLabel(order.status)}</span><span className="text-muted">{queues.overdue.some((item) => item.id === order.id) ? "Data superata · " : ""}{order.status === "requested" ? `Preferenza cliente: ${formatDay(order.requested_date)}` : `Produzione: ${formatDay(order.production_date)} · Ritiro/consegna: ${formatDay(order.fulfillment_date)}`}</span><button type="button" className="min-h-11 border border-ink px-3 font-semibold hover:bg-ink hover:text-paper" onClick={() => open(order)}>Gestisci</button></li>)}</ul> : <p className="py-5 text-sm text-muted">Nessuna richiesta nuova, senza date o in ritardo.</p>}</section>
    <div className="grid gap-8 xl:grid-cols-2"><section aria-labelledby="cucina-title"><div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-ink pb-2"><h2 id="cucina-title" className="font-disp text-xl font-bold uppercase">Produzione oggi</h2><Link href="/dashboard/produzione" className="text-sm font-semibold underline">Foglio completo →</Link></div><p className="mt-3 text-sm">{queues.productionToday.length} ordini · <strong>{queues.portionsToday} porzioni</strong> · {dishes.length} piatti diversi</p>{dishes.length ? <ul className="mt-3">{dishes.slice(0, 8).map(([name, count]) => <li key={name} className="flex justify-between gap-3 border-b border-ink/10 py-2 text-sm"><span>{name}</span><strong>{count}</strong></li>)}</ul> : <p className="mt-3 text-sm text-muted">Nessun piatto programmato per oggi.</p>}</section><section aria-labelledby="uscite-title"><h2 id="uscite-title" className="border-b-2 border-ink pb-2 font-disp text-xl font-bold uppercase">Ritiri e consegne oggi</h2>{queues.fulfillmentToday.length ? <ul className="mt-2">{queues.fulfillmentToday.map((order) => <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 py-2 text-sm"><div><button type="button" className="min-h-11 font-semibold hover:underline" onClick={() => open(order)}>{order.customer_name}</button><p className="text-xs text-muted">{order.fulfillment === "pickup" ? "Ritiro" : `Consegna · ${order.address || order.comune}`} · {order.meals} pasti</p></div><strong>{statusLabel(order.status)}</strong></li>)}</ul> : <p className="mt-3 text-sm text-muted">Nessun ritiro o consegna programmato per oggi.</p>}</section></div>
    <section aria-labelledby="ordini-title"><div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-3"><div><h2 id="ordini-title" className="font-disp text-xl font-bold uppercase">Ordini</h2><p className="mt-1 text-xs text-muted">Tutti gli ordini aperti e gli ultimi 100 chiusi.</p></div><div className="flex flex-wrap gap-2"><label className="sr-only" htmlFor="order-search">Cerca cliente, email, telefono o ID</label><input id="order-search" type="search" placeholder="Cerca cliente, telefono…" value={search} onChange={(event) => setSearch(event.target.value)} className="min-h-11 max-w-full border border-ink/25 bg-paper px-3 text-sm" /><label className="sr-only" htmlFor="order-filter">Filtra ordini</label><select id="order-filter" value={filter} onChange={(event) => setFilter(event.target.value)} className="min-h-11 border border-ink/25 bg-paper px-3 text-sm"><option value="active">Aperti</option><option value="all">Tutti caricati</option>{STATES.map((state) => <option key={state.id} value={state.id}>{state.label}</option>)}</select></div></div><ul className="mt-1">{visible.map((order) => <OrderLine key={order.id} order={order} open={open} updateStatus={quickStatus} busy={busy} today={today} />)}{visible.length === 0 ? <li className="py-6 text-sm text-muted">Nessun ordine corrisponde al filtro.</li> : null}</ul></section>
    {selected ? <section id="dettaglio-ordine" aria-labelledby="detail-title" className="scroll-mt-20 border-2 border-ink bg-paper-2 p-4 md:p-6"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/20 pb-4"><div><p className="occhiello">Scheda ordine · {selected.id.slice(0, 8)}</p><h2 id="detail-title" className="mt-2 font-disp text-2xl font-bold uppercase">{selected.customer_name}</h2><p className="mt-2 text-sm">{selected.service === "home-cooking" ? "Home cooking" : selected.service === "sui-tuoi-macro" ? "Sui tuoi macro" : "Menu settimana"} · {selected.meals} pasti · {selected.fulfillment === "pickup" ? "Ritiro" : "Consegna"}</p></div><button type="button" className="min-h-11 border border-ink px-4 text-sm font-semibold" onClick={() => setSelectedId(null)}>Chiudi</button></div>{error ? <p className="mt-4 border-l-4 border-red-700 bg-red-50 p-3 text-sm font-semibold text-red-900">{error}</p> : null}<div className="mt-5 grid gap-5 lg:grid-cols-2"><div><h3 className="text-sm font-bold uppercase">Contatto e richiesta</h3><p className="mt-2 text-sm"><a className="underline" href={`tel:${selected.phone}`}>{selected.phone}</a> · <a className="break-all underline" href={`mailto:${selected.email}`}>{selected.email}</a></p><p className="mt-1 text-sm">{selected.comune}{selected.address ? ` · ${selected.address}` : ""}</p><p className="mt-2 text-sm">Data preferita dal cliente: <strong>{formatDay(selected.requested_date)}</strong></p>{selected.dietary_preferences ? <p className="mt-3 border-l-4 border-red-700 bg-paper p-3 text-sm"><strong>Preferenze alimentari dal profilo:</strong> {selected.dietary_preferences}</p> : null}{selected.notes ? <p className="mt-3 border-l-4 border-ink bg-paper p-3 text-sm">Note cliente: {selected.notes}</p> : null}</div><div><h3 className="text-sm font-bold uppercase">Piatti richiesti</h3>{selected.items.length ? <ul className="mt-2 max-h-64 overflow-auto">{selected.items.map((item, index) => <li key={`${item.id}-${index}`} className="border-b border-ink/10 py-1.5 text-sm"><span className="text-muted">{item.day} · {item.meal}</span> · <strong>{item.name}</strong>{item.extras.length ? ` + ${item.extras.join(", ")}` : ""}</li>)}</ul> : <p className="mt-2 text-sm text-muted">Servizio senza piatti selezionati.</p>}</div></div><div className="mt-6 grid gap-4 border-t border-ink/20 pt-5 md:grid-cols-3"><div className="campo"><label htmlFor="production-date">Data produzione</label><input id="production-date" type="date" value={productionDate} onChange={(event) => setProductionDate(event.target.value)} /></div><div className="campo"><label htmlFor="fulfillment-date">Data ritiro/consegna</label><input id="fulfillment-date" type="date" value={fulfillmentDate} onChange={(event) => setFulfillmentDate(event.target.value)} /></div><div className="campo"><label htmlFor="order-status">Stato</label><select id="order-status" value={status} onChange={(event) => setStatus(event.target.value)}>{STATES.map((state) => <option key={state.id} value={state.id}>{state.label}</option>)}</select></div></div><p className="mt-2 text-xs text-muted">Per confermare o avanzare un ordine servono entrambe le date. La data preferita del cliente resta separata.</p><div className="campo mt-4"><label htmlFor="internal-note">Nota interna · visibile solo a Matteo</label><textarea id="internal-note" rows={3} maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} /></div><div className="mt-4 flex flex-wrap items-center gap-4"><button type="button" className="btn btn-ink btn-sm" disabled={busy || refreshing} onClick={() => void patch(selected.id, { productionDate: productionDate || null, fulfillmentDate: fulfillmentDate || null, internalNote: note, status })}>Salva ordine</button><p className="text-xs text-muted">Ultimo aggiornamento: {selected.updated_at}</p></div></section> : null}
  </div>;
}
