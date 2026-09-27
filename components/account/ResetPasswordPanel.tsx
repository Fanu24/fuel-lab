"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordPanel() {
  const search = useSearchParams();
  const token = search.get("token");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    setError("");
    const result = await authClient.resetPassword({ newPassword: password, token });
    if (result.error) setError("Il link è scaduto o non è valido. Richiedine uno nuovo.");
    else { setDone(true); setPassword(""); }
    setBusy(false);
  }

  return <section className="wrap max-w-2xl py-16 md:py-24">
    <h1 className="titolo">Nuova password.</h1>
    {!token || search.has("error") ? <p className="mt-6">Il link non è valido o è scaduto. <Link className="link" href="/accedi">Richiedine uno nuovo</Link>.</p>
      : done ? <p className="mt-6">Password aggiornata. <Link className="link" href="/accedi">Accedi al tuo account</Link>.</p>
      : <form className="mt-8 grid gap-4" onSubmit={(event) => void submit(event)}>
        <div className="campo"><label htmlFor="new-password">Nuova password</label><input id="new-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required /><p className="mt-1 text-xs text-muted">Almeno 12 caratteri.</p></div>
        <button className="btn btn-lime" type="submit" disabled={busy}>{busy ? "Attendi…" : "Salva la nuova password"}</button>
        {error ? <p role="alert" className="text-sm font-semibold text-red-700">{error}</p> : null}
      </form>}
  </section>;
}
