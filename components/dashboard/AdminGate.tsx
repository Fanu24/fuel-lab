"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

export default function AdminGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"loading" | "allowed" | "denied">("loading");
  useEffect(() => {
    fetch("/api/me", { cache: "no-store", credentials: "same-origin" })
      .then((response) => response.json())
      .then((data: { user?: { role?: string } | null }) => setState(data.user?.role === "admin" ? "allowed" : "denied"))
      .catch(() => setState("denied"));
  }, []);
  if (state === "loading") return <div className="notte grid min-h-svh place-items-center text-steel">Verifico l’accesso…</div>;
  if (state === "denied") return <div className="notte grid min-h-svh place-items-center px-5"><div className="max-w-xl"><p className="occhiello">FUEL LAB · Area Matteo</p><h1 className="titolo mt-5">Accesso riservato.</h1><p className="mt-5 text-steel">Entra con l’account amministratore. Le richieste e i dati dei clienti sono protetti sul server.</p><Link href="/accedi?next=%2Fdashboard" className="btn btn-lime mt-8">Accedi →</Link></div></div>;
  return <>{children}</>;
}
