import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordPanel from "@/components/account/ResetPasswordPanel";
import { AttesaReimposta } from "@/components/account/Stati";

export const metadata: Metadata = {
  title: "Reimposta password",
  description: "Scegli una nuova password per il tuo account FUEL LAB, dal link che ti abbiamo mandato via email.",
  alternates: { canonical: "/reimposta-password" },
  robots: { index: false, follow: false },
};

export default function ReimpostaPassword() {
  return (
    <Suspense fallback={<AttesaReimposta />}>
      <ResetPasswordPanel />
    </Suspense>
  );
}
