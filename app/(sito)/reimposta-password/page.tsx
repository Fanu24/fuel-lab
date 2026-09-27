import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordPanel from "@/components/account/ResetPasswordPanel";

export const metadata: Metadata = { title: "Reimposta password", robots: { index: false, follow: false } };

export default function ReimpostaPassword() {
  return <Suspense fallback={<p className="wrap py-20">Carico il recupero…</p>}><ResetPasswordPanel /></Suspense>;
}
