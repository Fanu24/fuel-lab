"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

const GA_ID = "G-DNVWYB7R0C";
const CHIAVE = "fuellab.analytics-consent.v1";
type Scelta = "granted" | "denied" | null;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function avviaAnalytics() {
  if (typeof window === "undefined") return;
  if (window.gtag) {
    window.gtag("consent", "update", { analytics_storage: "granted" });
    return;
  }

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  });
  window.gtag("consent", "update", { analytics_storage: "granted" });
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, { cookie_expires: 15552000, send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
  document.head.appendChild(script);
}

function revocaAnalytics() {
  window.gtag?.("consent", "update", { analytics_storage: "denied" });
  for (const parte of document.cookie.split(";")) {
    const nome = parte.trim().split("=")[0];
    if (nome === "_ga" || nome.startsWith("_ga_")) {
      document.cookie = nome + "=; Max-Age=0; path=/; domain=fuelchef.it; SameSite=Lax";
      document.cookie = nome + "=; Max-Age=0; path=/; domain=.fuelchef.it; SameSite=Lax";
    }
  }
}

function leggiScelta(): Scelta {
  try {
    const valore = localStorage.getItem(CHIAVE);
    return valore === "granted" || valore === "denied" ? valore : null;
  } catch {
    return null;
  }
}

function ascoltaScelta(aggiorna: () => void) {
  window.addEventListener("storage", aggiorna);
  window.addEventListener("fuellab:privacy-choice", aggiorna);
  return () => {
    window.removeEventListener("storage", aggiorna);
    window.removeEventListener("fuellab:privacy-choice", aggiorna);
  };
}

function nonAscolta() { return () => {}; }

export default function PrivacyConsent() {
  const pathname = usePathname();
  const sceltaSalvata = useSyncExternalStore(ascoltaScelta, leggiScelta, () => null);
  const pronto = useSyncExternalStore(nonAscolta, () => true, () => false);
  const [sceltaMemoria, setSceltaMemoria] = useState<Scelta>(null);
  const scelta = sceltaMemoria ?? sceltaSalvata;
  const [aperto, setAperto] = useState(false);

  useEffect(() => {
    const salvata = leggiScelta();
    if (salvata === "granted") avviaAnalytics();

    const apri = () => setAperto(true);
    window.addEventListener("fuellab:open-privacy-settings", apri);
    return () => window.removeEventListener("fuellab:open-privacy-settings", apri);
  }, []);

  useEffect(() => {
    if (scelta !== "granted") return;
    avviaAnalytics();
    window.gtag?.("event", "page_view", {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
    void fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname, scelta]);

  function scegli(valore: Exclude<Scelta, null>) {
    try {
      localStorage.setItem(CHIAVE, valore);
    } catch {
      // La scelta vale per questa visita anche se il browser blocca lo storage.
    }
    setSceltaMemoria(valore);
    window.dispatchEvent(new Event("fuellab:privacy-choice"));
    setAperto(false);
    if (valore === "granted") avviaAnalytics();
    else revocaAnalytics();
  }

  if (!pronto || (scelta !== null && !aperto)) return null;

  return (
    <aside
      aria-label="Preferenze privacy"
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl border-2 border-ink bg-paper p-5 shadow-2xl md:inset-x-6 md:bottom-6 md:p-6"
      role="dialog"
      aria-modal="false"
      aria-describedby="privacy-consent-description"
    >
      <p className="occhiello">Privacy · FUEL LAB</p>
      <p id="privacy-consent-description" className="mt-3 text-sm leading-relaxed text-muted">
        Usiamo Google Analytics solo se scegli “Accetta Analytics”, per misurare le visite. Se rifiuti, nessun tag
        Analytics viene caricato. Puoi cambiare scelta in qualsiasi momento dal footer.{" "}
        <Link href="/privacy" className="link font-semibold">Informativa completa</Link>.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className="btn btn-ink" onClick={() => scegli("denied")}>
          Rifiuta Analytics
        </button>
        <button type="button" className="btn btn-lime" onClick={() => scegli("granted")}>
          Accetta Analytics
        </button>
      </div>
    </aside>
  );
}
