"use client";

import { useEffect } from "react";

/* Se qualcosa si rompe mentre il pannello si disegna, Matteo vede questa pagina e non una pagina bianca.
   Gli stili sono scritti qui (come in AdminAccess): non dipende dal CSS del pannello, che potrebbe essere
   proprio la parte che non si è caricata. Il "Riprova" ricostruisce il pannello senza ricaricare la pagina. */
export default function ErroreAdmin({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error("Errore nel pannello", error);
  }, [error]);

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeContent: "center", gap: 20, padding: "24px 16px", textAlign: "center", background: "#f3efe6", color: "#18352a", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ margin: 0, fontSize: 24, lineHeight: 1.25 }}>Qualcosa non va</h1>
      <p style={{ margin: 0, fontSize: 18, lineHeight: 1.45, maxWidth: 340 }}>Il pannello non riesce ad aprirsi. Tocca il bottone per riprovare.</p>
      <button
        type="button"
        onClick={() => retry()}
        style={{ minHeight: 56, padding: "0 32px", border: 0, borderRadius: 14, background: "#18352a", color: "#fff", fontSize: 19, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
      >
        Riprova
      </button>
    </main>
  );
}
