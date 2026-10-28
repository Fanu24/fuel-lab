"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";

async function sessionRequest(method: "GET" | "POST" | "DELETE", password?: string, signal?: AbortSignal) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 20_000);
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  else signal?.addEventListener("abort", abort, { once: true });
  try {
    const response = await fetch("/api/admin/session", {
      method, credentials: "same-origin", cache: "no-store", signal: controller.signal,
      ...(password !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) } : {}),
    });
    const result = await response.json() as { authenticated?: boolean; error?: string };
    if (!response.ok) throw new Error(result.error || "Accesso non disponibile. Riprova.");
    return result;
  } catch (cause) {
    if (timedOut) throw new Error("La connessione è lenta. Riprova tra poco.");
    throw cause;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

export default function AdminAccess({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    sessionRequest("GET", undefined, controller.signal)
      .then((session) => setAuthenticated(!!session.authenticated))
      .catch((cause) => {
        if (controller.signal.aborted) return;
        setAuthenticated(false);
        setError(cause instanceof Error ? cause.message : "Connessione non disponibile.");
      });
    return () => controller.abort();
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await sessionRequest("POST", password);
      setPassword("");
      setAuthenticated(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Connessione non disponibile. Riprova.");
    } finally { setPending(false); }
  }

  if (authenticated) return children;
  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: "24px 20px", background: "#f3efe6", color: "#18352a" }}>
      <section style={{ width: "100%", maxWidth: 400 }} aria-labelledby="admin-access-title">
        <p style={{ marginBottom: 8, fontWeight: 800, letterSpacing: ".12em", fontSize: 14 }}>FUEL LAB</p>
        <h1 id="admin-access-title" style={{ fontSize: 32, lineHeight: 1.15, marginBottom: 28, fontWeight: 800 }}>Ciao, Matteo.</h1>
        {authenticated === null ? <p role="status">Verifico l’accesso…</p> : (
          <form onSubmit={login} style={{ display: "grid", gap: 16 }}>
            <label htmlFor="admin-password" style={{ fontSize: 16, fontWeight: 700 }}>Password</label>
            <input id="admin-password" type="password" autoComplete="current-password" required maxLength={128}
              value={password} onChange={(event) => setPassword(event.target.value)} aria-describedby={error ? "admin-access-error" : undefined}
              style={{ minHeight: 56, width: "100%", padding: "12px 14px", border: "1px solid #849287", borderRadius: 8, background: "#fff", color: "#18352a", fontSize: 18 }} />
            {error && <p id="admin-access-error" role="alert" style={{ color: "#9d2424", fontSize: 16 }}>{error}</p>}
            <button type="submit" disabled={pending} style={{ minHeight: 56, borderRadius: 8, background: "#18352a", color: "white", fontSize: 18, fontWeight: 700, padding: "12px 18px", opacity: pending ? .7 : 1 }}>
              {pending ? "Accesso…" : "Entra"}
            </button>
            <Link href="/" style={{ minHeight: 44, display: "grid", placeItems: "center", textDecoration: "underline", fontSize: 15 }}>Torna al sito</Link>
          </form>
        )}
      </section>
    </main>
  );
}

export function AdminLogout({ className }: { className?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setPending(true);
    setError("");
    try {
      await sessionRequest("DELETE");
      window.location.reload();
    } catch {
      setError("Non riesco a uscire. Riprova.");
      setPending(false);
    }
  }
  return <div>
    <button type="button" className={className} disabled={pending} onClick={logout}>{pending ? "Uscita…" : "Esci"}</button>
    {error && <p role="alert">{error}</p>}
  </div>;
}
