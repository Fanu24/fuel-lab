"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

type Providers = { email: boolean; emailVerification: boolean; google: boolean; apple: boolean };

export default function AuthPanel() {
  const search = useSearchParams();
  const next = search.get("next") === "/dashboard" ? "/dashboard" : "/account";
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [providers, setProviders] = useState<Providers>({ email: false, emailVerification: false, google: false, apple: false });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch("/api/providers", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: Providers) => setProviders(data))
      .catch(() => setError("Accesso temporaneamente non disponibile."));
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "reset") {
        const result = await authClient.requestPasswordReset({ email, redirectTo: `${window.location.origin}/reimposta-password` });
        if (result.error) setError(result.error.message ?? "Non riesco a inviare l’email. Riprova.");
        else setNotice("Se l’indirizzo è registrato, riceverai un link per reimpostare la password.");
        return;
      }
      const result = mode === "login"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ name, email, password, callbackURL: next });
      if (result.error) {
        setError(result.error.status === 403 && providers.emailVerification
          ? "Verifica l’indirizzo email tramite il link ricevuto, poi accedi."
          : result.error.message ?? "Controlla email e password.");
      } else if (mode === "signup" && providers.emailVerification) {
        setPassword("");
        setMode("login");
        setNotice("Account creato. Controlla la posta e apri il link di verifica prima di accedere.");
      } else window.location.assign(next);
    } catch {
      setError("Non riesco a completare l’accesso. Riprova tra poco.");
    } finally {
      setBusy(false);
    }
  }

  async function resendVerification() {
    if (!email) { setError("Inserisci prima il tuo indirizzo email."); return; }
    setBusy(true);
    setError("");
    const result = await authClient.sendVerificationEmail({ email, callbackURL: next });
    if (result.error) setError("Non riesco a inviare il link. Riprova tra poco.");
    else setNotice("Se l’indirizzo è registrato, riceverai un nuovo link di verifica.");
    setBusy(false);
  }

  async function social(provider: "google" | "apple") {
    setBusy(true);
    setError("");
    const result = await authClient.signIn.social({ provider, callbackURL: next });
    if (result.error) {
      setError(result.error.message ?? "Accesso non riuscito.");
      setBusy(false);
    }
  }

  return (
    <section className="wrap grid gap-10 py-14 md:grid-cols-[1.1fr_1fr] md:py-24">
      <div className="notte p-8 md:p-12">
        <p className="occhiello">Il tuo spazio FUEL LAB</p>
        <h1 className="titolo mt-5 max-w-[13ch]">La tua settimana, sempre con te.</h1>
        <p className="mt-6 max-w-[45ch] text-steel">Salva il menu, ritrova le richieste inviate e controlla le conferme di Matteo. Gli ordini restano richieste finché Matteo non ne conferma disponibilità e dettagli.</p>
        <Link href="/menu" className="link mt-8 inline-block text-lime">Esplora il menu →</Link>
      </div>
      <div className="bg-paper-2 p-8 md:p-12">
        <div className="segmenti" role="group" aria-label="Tipo di accesso">
          <button type="button" aria-pressed={mode === "login"} onClick={() => { setMode("login"); setError(""); setNotice(""); }}>Accedi</button>
          <button type="button" aria-pressed={mode === "signup"} onClick={() => { setMode("signup"); setError(""); setNotice(""); }}>Crea account</button>
        </div>
        <h2 className="titolo-s mt-7">{mode === "login" ? "Bentornato." : mode === "signup" ? "Cominciamo." : "Recupera l’accesso."}</h2>
        <form onSubmit={(event) => void submit(event)} className="mt-7 grid gap-4">
          {mode === "signup" ? <div className="campo"><label htmlFor="auth-name">Nome</label><input id="auth-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} /></div> : null}
          <div className="campo"><label htmlFor="auth-email">Email</label><input id="auth-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          {mode !== "reset" ? <div className="campo"><label htmlFor="auth-password">Password</label><input id="auth-password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={12} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} required /><p className="mt-1 text-xs text-muted">{mode === "signup" ? "Almeno 12 caratteri." : ""}</p></div> : null}
          <button type="submit" className="btn btn-lime mt-2 w-full" disabled={busy || !providers.email}>{busy ? "Attendi…" : mode === "login" ? "Accedi con email" : mode === "signup" ? "Crea account" : "Invia link di recupero"}</button>
        </form>
        {providers.emailVerification ? <div className="mt-4 flex flex-wrap gap-4 text-sm"><button type="button" className="link" onClick={() => { setMode(mode === "reset" ? "login" : "reset"); setError(""); setNotice(""); }}>{mode === "reset" ? "Torna all’accesso" : "Password dimenticata?"}</button><button type="button" className="link" onClick={() => void resendVerification()} disabled={busy}>Invia di nuovo la verifica</button></div> : null}
        {providers.google || providers.apple ? <div className="mt-6 border-t border-ink/15 pt-6"><p className="mb-4 text-sm text-muted">Oppure continua con</p><div className="grid gap-3 sm:grid-cols-2">{providers.google ? <button type="button" className="btn btn-linea" disabled={busy} onClick={() => void social("google")}>Google</button> : null}{providers.apple ? <button type="button" className="btn btn-linea" disabled={busy} onClick={() => void social("apple")}>Apple</button> : null}</div></div> : null}
        {error ? <p className="mt-5 text-sm font-semibold text-red-700" role="alert">{error}</p> : null}
        {notice ? <p className="mt-5 text-sm font-semibold text-ink" role="status">{notice}</p> : null}
        <p className="mt-6 text-xs text-muted">Creando un account accetti il trattamento dei dati necessario a gestire profilo e richieste. Leggi l’<Link href="/privacy" className="underline">informativa privacy</Link>.</p>
      </div>
    </section>
  );
}
