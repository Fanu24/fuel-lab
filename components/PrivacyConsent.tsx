"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";

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
  /* Il tag di Google legge dal dataLayer l'oggetto `arguments`, non un array:
     con gli argomenti "rest" i comandi arrivano ma non vengono eseguiti. E' la
     forma dello snippet ufficiale. */
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
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

/* Il pannello di Matteo non e' il sito pubblico: niente banner sopra i suoi dati
   e niente visualizzazioni (il server, del resto, non le conta). */
const suPannello = (percorso: string) =>
  percorso === "/dashboard" || percorso.startsWith("/dashboard/") ||
  percorso === "/admin" || percorso.startsWith("/admin/");

export default function PrivacyConsent() {
  const pathname = usePathname();
  const sceltaSalvata = useSyncExternalStore(ascoltaScelta, leggiScelta, () => null);
  const pronto = useSyncExternalStore(nonAscolta, () => true, () => false);
  const [sceltaMemoria, setSceltaMemoria] = useState<Scelta>(null);
  const scelta = sceltaMemoria ?? sceltaSalvata;
  const [aperto, setAperto] = useState(false);
  const pannello = useRef<HTMLElement>(null);
  /* Chi riapre le preferenze dal footer ritrova il fuoco dove l'aveva lasciato. */
  const chiamante = useRef<HTMLElement | null>(null);

  useEffect(() => {
    /* Segnale per lo script in <head> (app/layout.tsx): se questo non parte mai,
       il JavaScript della pagina non e' arrivato e le rivelazioni vanno spente. */
    document.documentElement.setAttribute("data-vivo", "");

    const salvata = leggiScelta();
    if (salvata === "granted") avviaAnalytics();

    const apri = () => {
      chiamante.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setAperto(true);
    };
    window.addEventListener("fuellab:open-privacy-settings", apri);
    return () => window.removeEventListener("fuellab:open-privacy-settings", apri);
  }, []);

  useEffect(() => {
    if (scelta !== "granted") return;
    avviaAnalytics();
    if (suPannello(pathname)) return;
    window.gtag?.("event", "page_view", {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
    void fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Minuscolo come lo conta il server (lib/server/analytics.ts), e mai il pannello: vedi suPannello.
      body: JSON.stringify({ path: pathname.toLowerCase() }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname, scelta]);

  /* Aperto di proposito (dal footer): il fuoco passa al riquadro, cosi' una
     persona da tastiera o con lo screen reader lo trova subito. La prima volta
     non si ruba il fuoco: il banner aspetta, la pagina resta usabile. */
  useEffect(() => {
    if (aperto) pannello.current?.focus();
  }, [aperto]);

  function chiudi() {
    setAperto(false);
    chiamante.current?.focus();
    chiamante.current = null;
  }

  function scegli(valore: Exclude<Scelta, null>) {
    try {
      localStorage.setItem(CHIAVE, valore);
    } catch {
      // La scelta vale per questa visita anche se il browser blocca lo storage.
    }
    setSceltaMemoria(valore);
    window.dispatchEvent(new Event("fuellab:privacy-choice"));
    chiudi();
    if (valore === "granted") avviaAnalytics();
    else revocaAnalytics();
  }

  function suTasto(e: KeyboardEvent<HTMLElement>) {
    if (e.key === "Escape" && scelta !== null) chiudi();
  }

  if (!pronto || (scelta !== null && !aperto)) return null;
  if (suPannello(pathname) && !aperto) return null;

  return (
    <aside
      ref={pannello}
      tabIndex={-1}
      aria-label="Preferenze privacy"
      className="consenso"
      role="dialog"
      aria-modal="false"
      aria-describedby="privacy-consent-description"
      onKeyDown={suTasto}
    >
      <div className="consenso-testo">
        <p className="occhiello consenso-occhiello">Privacy · FUEL LAB</p>
        <p id="privacy-consent-description">
          Usiamo Google Analytics solo se scegli “Accetta Analytics”, per misurare le visite. Se rifiuti, nessun tag
          Analytics viene caricato. <span className="consenso-extra">Puoi cambiare scelta in qualsiasi momento dal footer.</span>{" "}
          <Link href="/privacy" className="link font-semibold">Informativa completa</Link>.
          {scelta !== null ? (
            <>
              {" "}
              <strong className="consenso-stato">
                Scelta attuale: {scelta === "granted" ? "Analytics accettato" : "Analytics rifiutato"}.
              </strong>
            </>
          ) : null}
        </p>
      </div>
      <div className="consenso-azioni">
        <button type="button" className="btn btn-ink" onClick={() => scegli("denied")}>
          Rifiuta Analytics
        </button>
        <button type="button" className="btn btn-lime" onClick={() => scegli("granted")}>
          Accetta Analytics
        </button>
        {scelta !== null ? (
          <button type="button" className="btn btn-linea consenso-chiudi" onClick={chiudi}>
            Chiudi senza cambiare
          </button>
        ) : null}
      </div>
    </aside>
  );
}
