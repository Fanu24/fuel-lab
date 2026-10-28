"use client";

import { useEffect } from "react";

/** Anche i link Next gia' aperti nel browser portano al nuovo pannello. */
export default function LegacyAdminRedirect() {
  useEffect(() => {
    window.location.replace("/admin");
  }, []);
  return <main className="grid min-h-svh place-items-center bg-paper p-6">
    <a href="/admin" className="btn btn-ink">Apri il pannello di Matteo</a>
  </main>;
}
