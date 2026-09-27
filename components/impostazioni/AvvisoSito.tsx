"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { avvisoVisibile } from "@/lib/impostazioni";
import { useImpostazioni } from "./useImpostazioni";

/* L'avviso di Matteo in cima alle pagine del sito ("Chiusi per ferie fino al
   20 agosto", "Nuovo piatto in menu").

   E' FISSO sotto la nav, non nel flusso: le pagine sono statiche e l'avviso
   arriva dopo, dal browser. Nel flusso spingerebbe giu' la pagina sotto gli
   occhi di chi legge; sopra la pagina non sposta niente. Appena si scorre si
   ritira dietro la nav, cosi' non copre il banco del compositore o un titolo
   raggiunto con un'ancora; torna in cima alla pagina.

   Chiuso con la X resta chiuso per tutta la sessione, finche' Matteo non
   cambia testo o link: un avviso nuovo si fa vedere di nuovo. */

const CHIAVE_CHIUSO = "fuellab.avviso.chiuso";
/** Oltre questo scorrimento l'avviso si ritira. */
const SOGLIA = 80;

function leggiChiuso(): string {
  try {
    return window.sessionStorage.getItem(CHIAVE_CHIUSO) ?? "";
  } catch {
    return "";
  }
}

export default function AvvisoSito() {
  const { impostazioni } = useImpostazioni();
  const avviso = avvisoVisibile(impostazioni.avviso);
  const firma = avviso ? `${avviso.testo}\n${avviso.link}` : "";
  // Lazy: al primo disegno nel browser l'avviso non c'e' ancora (le pagine sono statiche), quindi niente differenze con l'HTML.
  const [chiuso, setChiuso] = useState(() => (typeof window === "undefined" ? "" : leggiChiuso()));
  const [ritirato, setRitirato] = useState(false);

  useEffect(() => {
    if (!firma) return;
    const suScroll = () => setRitirato(window.scrollY > SOGLIA);
    suScroll();
    window.addEventListener("scroll", suScroll, { passive: true });
    return () => window.removeEventListener("scroll", suScroll);
  }, [firma]);

  if (!avviso || chiuso === firma) return null;

  function chiudi() {
    setChiuso(firma);
    try {
      window.sessionStorage.setItem(CHIAVE_CHIUSO, firma);
    } catch {
      // Senza storage si chiude solo per questa pagina.
    }
  }

  return (
    <aside aria-label="Avviso di Matteo" className={`avviso-sito ${ritirato ? "is-ritirato" : ""}`}>
      <div className="wrap avviso-sito-riga">
        {avviso.link ? (
          <Link href={avviso.link} className="avviso-sito-testo avviso-sito-link">
            {avviso.testo} <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <p className="avviso-sito-testo">{avviso.testo}</p>
        )}
        <button type="button" className="avviso-sito-chiudi" onClick={chiudi} aria-label="Chiudi l’avviso">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="size-5">
            <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
