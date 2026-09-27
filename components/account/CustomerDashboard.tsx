"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { getPiatto } from "@/lib/catalogo";
import { GIORNI, NOMI_GIORNO, PASTI, usePiano } from "@/lib/piano";
import type { Allenamenti, Piano } from "@/lib/settimana";

type User = { id: string; name: string; email: string; role: "customer" | "admin" };
type Profile = { phone: string; comune: string; address: string; preferences: string };
type Order = { id: string; status: string; created_at: string; requested_date: string | null; fulfillment_date: string | null; meals: number; fulfillment: string; items: Array<{ name: string; day: string; meal: string }> };
const LABELS: Record<string, string> = { requested: "In attesa", confirmed: "Confermata", preparing: "In preparazione", ready: "Pronta", completed: "Completata", cancelled: "Annullata" };

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "same-origin", cache: "no-store", ...options });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "Operazione non riuscita");
  return body as T;
}

export default function CustomerDashboard() {
  const router = useRouter();
  const { piano, allenamenti, pasti, pronto, sostituisciPiano, impostaAllenamento, svuotaAllenamenti } = usePiano();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile>({ phone: "", comune: "", address: "", preferences: "" });
  const [orders, setOrders] = useState<Order[]>([]);
  const [name, setName] = useState("");
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const me = await api<{ user: User | null }>("/api/me");
    setUser(me.user);
    if (!me.user) return;
    setName(me.user.name);
    const [p, o] = await Promise.all([
      api<{ profile: Profile }>("/api/profile"),
      api<{ orders: Order[] }>("/api/orders"),
    ]);
    setProfile(p.profile);
    setOrders(o.orders);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void reload().catch(() => setMessage("Non riesco a caricare il tuo profilo. Riprova tra poco.")); }, 0);
    return () => window.clearTimeout(timer);
  }, [reload]);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      await api("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
      setMessage("Profilo salvato.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Errore nel salvataggio."); }
    finally { setBusy(false); }
  }

  async function savePlan() {
    setBusy(true); setMessage("");
    try {
      await api("/api/plan", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: piano, training: allenamenti }) });
      setMessage("Settimana salvata nel tuo account.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Non riesco a salvare la settimana."); }
    finally { setBusy(false); }
  }

  async function loadPlan() {
    setBusy(true); setMessage("");
    try {
      const cloud = await api<{ plan: Piano | null; training: Allenamenti | null }>("/api/plan");
      if (!cloud.plan) { setMessage("Non hai ancora una settimana salvata nell’account."); return; }
      sostituisciPiano(cloud.plan);
      svuotaAllenamenti();
      for (const day of GIORNI) if (cloud.training?.[day]) impostaAllenamento(day, cloud.training[day]!);
      setMessage("Settimana caricata. Puoi modificarla nel compositore.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Non riesco a caricare la settimana."); }
    finally { setBusy(false); }
  }

  async function sendOrder(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      await api("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: profile.phone, comune: profile.comune, address: profile.address, service: "menu-settimana", fulfillment, requestedDate: date || null, notes, plan: piano, training: allenamenti }),
      });
      setMessage("Richiesta inviata. Matteo confermerà disponibilità, giorno e dettagli.");
      setNotes("");
      const response = await api<{ orders: Order[] }>("/api/orders");
      setOrders(response.orders);
    } catch (e) { setMessage(e instanceof Error ? e.message : "Richiesta non inviata."); }
    finally { setBusy(false); }
  }

  if (user === undefined) return <div className="wrap py-20 text-muted">Carico il tuo spazio…</div>;
  if (!user) return <div className="wrap py-20"><p className="occhiello">Area cliente</p><h1 className="titolo mt-4">Entra nel tuo spazio.</h1><p className="mt-5 text-muted">Accedi per salvare la settimana e seguire le richieste.</p><Link href="/accedi" className="btn btn-lime mt-7">Accedi o crea account →</Link></div>;

  return (
    <div className="wrap grid gap-12 py-14 md:py-20">
      <header className="flex flex-wrap items-end justify-between gap-5"><div><p className="occhiello">Il tuo spazio</p><h1 className="titolo mt-4">Ciao, {user.name.split(" ")[0]}.</h1><p className="mt-3 text-muted">{user.email} · Menu, richieste e preferenze in un posto solo.</p></div><div className="flex gap-3">{user.role === "admin" ? <Link href="/dashboard" className="btn btn-ink btn-sm">Pannello Matteo</Link> : null}<button className="btn btn-linea btn-sm" onClick={() => void authClient.signOut().then(() => router.push("/"))}>Esci</button></div></header>
      {message ? <p className="border-l-4 border-ink bg-lime p-4" role="status">{message}</p> : null}
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="bg-paper-2 p-6 md:p-8"><p className="occhiello">La tua settimana</p><h2 className="titolo-s mt-4">{pronto ? `${pasti} pasti scelti` : "Carico…"}</h2><ul className="mt-5 grid gap-2 border-t border-ink/15">{GIORNI.flatMap((day) => PASTI.map((meal) => { const id = piano[day]?.[meal]?.piatto; return id ? <li key={`${day}-${meal}`} className="flex justify-between gap-3 border-b border-ink/10 py-2 text-sm"><span>{NOMI_GIORNO[day]} · {meal}</span><strong className="text-right">{getPiatto(id)?.nome ?? id}</strong></li> : null; }))}</ul>{pasti === 0 ? <p className="mt-4 text-muted">Non hai ancora aggiunto piatti.</p> : null}<div className="mt-6 flex flex-wrap gap-3"><Link href="/settimana" className="btn btn-ink btn-sm">Componi il menu</Link><button className="btn btn-linea btn-sm" onClick={() => void savePlan()} disabled={busy || !pronto}>Salva nel cloud</button><button className="btn btn-linea btn-sm" onClick={() => void loadPlan()} disabled={busy}>Carica il salvato</button></div></section>
        <form onSubmit={(event) => void saveProfile(event)} className="bg-paper-2 p-6 md:p-8"><p className="occhiello">I tuoi dati</p><h2 className="titolo-s mt-4">Profilo.</h2><div className="mt-5 grid gap-4"><div className="campo"><label htmlFor="profile-phone">Telefono</label><input id="profile-phone" type="tel" autoComplete="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} maxLength={40} /></div><div className="campo"><label htmlFor="profile-city">Comune</label><input id="profile-city" autoComplete="address-level2" value={profile.comune} onChange={(e) => setProfile({ ...profile, comune: e.target.value })} maxLength={100} /></div><div className="campo"><label htmlFor="profile-address">Indirizzo per la consegna</label><input id="profile-address" autoComplete="street-address" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} maxLength={240} /></div><div className="campo"><label htmlFor="profile-preferences">Preferenze alimentari</label><textarea id="profile-preferences" rows={3} value={profile.preferences} onChange={(e) => setProfile({ ...profile, preferences: e.target.value })} maxLength={1000} /></div></div><button type="submit" className="btn btn-ink btn-sm mt-5" disabled={busy}>Salva profilo</button></form>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <form onSubmit={(event) => void sendOrder(event)} className="notte p-6 md:p-8"><p className="occhiello">Invia a Matteo</p><h2 className="titolo-s mt-4">Richiedi questa settimana.</h2><p className="mt-3 text-sm text-steel">Nessun pagamento online. Matteo ti conferma prezzi, piatti e orario prima dell’ordine.</p><div className="mt-6 grid gap-4"><div className="campo"><label htmlFor="order-name">Nome per la richiesta</label><input id="order-name" value={name} onChange={(e) => setName(e.target.value)} required /></div><div className="campo"><label htmlFor="order-fulfillment">Modalità</label><select id="order-fulfillment" value={fulfillment} onChange={(e) => setFulfillment(e.target.value as "pickup" | "delivery")}><option value="pickup">Ritiro in Via del Santuario 214</option><option value="delivery">Consegna da confermare</option></select></div><div className="campo"><label htmlFor="order-date">Giorno preferito (facoltativo)</label><input id="order-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div><div className="campo"><label htmlFor="order-notes">Note per Matteo</label><textarea id="order-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1500} /></div></div><p className="mt-5 text-xs text-steel">Per inviare servono telefono e comune nel profilo, un indirizzo se chiedi consegna e almeno un piatto nel menu. <Link href="/privacy" className="underline">Privacy</Link></p><button type="submit" className="btn btn-lime mt-5 w-full" disabled={busy || pasti === 0}>Invia richiesta →</button></form>
        <section><p className="occhiello">Cronologia</p><h2 className="titolo-s mt-4">Le tue richieste.</h2>{orders.length ? <ul className="mt-6 grid gap-4">{orders.map((o) => <li key={o.id} className="border border-ink/15 bg-paper-2 p-5"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="font-disp uppercase">{LABELS[o.status] ?? o.status}</strong><time className="text-sm text-muted" dateTime={o.created_at}>{new Date(o.created_at + "Z").toLocaleDateString("it-IT")}</time></div><p className="mt-2 text-sm text-muted">{o.meals} pasti · {o.fulfillment === "pickup" ? "Ritiro" : "Consegna"}</p>{o.fulfillment_date && !["requested", "cancelled"].includes(o.status) ? <p className="mt-1 text-sm font-semibold">Data {o.fulfillment === "pickup" ? "ritiro" : "consegna"}: {o.fulfillment_date}</p> : o.requested_date ? <p className="mt-1 text-sm text-muted">Giorno preferito: {o.requested_date} · da confermare</p> : null}<p className="mt-3 text-sm">{o.items.map((item) => item.name).join(", ") || "Richiesta di servizio"}</p></li>)}</ul> : <p className="mt-6 text-muted">Non hai ancora inviato richieste dal tuo account.</p>}</section>
      </div>
    </div>
  );
}
