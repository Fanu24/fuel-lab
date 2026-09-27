import type { Metadata } from "next";
import { Suspense } from "react";
import AuthPanel from "@/components/account/AuthPanel";

export const metadata: Metadata = { title: "Accedi o crea account", robots: { index: false, follow: false } };

export default function Accedi() {
  return <Suspense fallback={<p className="wrap py-20">Carico l’accesso…</p>}><AuthPanel /></Suspense>;
}
