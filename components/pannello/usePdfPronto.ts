"use client";

import { useEffect, useState } from "react";
import { consegnaPdf } from "@/lib/pdf-consegna";

/* Il PDF in due tocchi: il primo lo prepara (con il contatore "Preparo…"), il secondo lo consegna.
   La consegna ha bisogno di un tocco nuovo, perché la preparazione dura secondi e su iPhone il
   gesto scade: per questo il PDF aspetta, pronto, finché Matteo non tocca "Apri".

   `chiave` descrive da cosa dipende il PDF (il giorno e le etichette, lo spostamento di stampa):
   quando cambia, il PDF pronto non vale più e sparisce. L'indirizzo del PDF si libera solo quando il
   PDF viene sostituito, scartato o il pannello si chiude: finché si vede il link, il link funziona. */

type Pronto = { chiave: string; file: File; url: string };

export function usePdfPronto(chiave: string) {
  const [lavoro, setLavoro] = useState(false);
  const [pronto, setPronto] = useState<Pronto | null>(null);
  /* Errore e link tengono la chiave a cui si riferiscono: cambiando giorno non compaiono più. */
  const [errore, setErrore] = useState<{ chiave: string; testo: string } | null>(null);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);

  // Dati cambiati: il PDF pronto è di un altro giorno o di altre etichette (lo scarta anche se arriva a ritardo).
  if (pronto && pronto.chiave !== chiave) setPronto(null);

  const url = pronto?.url;
  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  /** Primo tocco: crea il PDF. `genera` può caricare il codice che serve; `testoErrore` è il messaggio in italiano. */
  async function prepara(genera: () => Promise<Blob>, nomeFile: string, testoErrore: string) {
    if (lavoro) return;
    setLavoro(true);
    setErrore(null);
    setPronto(null);
    setLinkUrl(null);
    try {
      const blob = await genera();
      setPronto({ chiave, file: new File([blob], nomeFile, { type: "application/pdf" }), url: URL.createObjectURL(blob) });
    } catch (e) {
      console.error("PDF: preparazione non riuscita", e);
      setErrore({ chiave, testo: testoErrore });
    } finally {
      setLavoro(false);
    }
  }

  /** Secondo tocco: condivide o apre il PDF; se il browser non apre niente, mostra il link. */
  async function apri() {
    if (!pronto) return;
    const { url: questo } = pronto;
    if ((await consegnaPdf(pronto.file, questo)) === "link") setLinkUrl(questo);
  }

  return {
    lavoro,
    pronto,
    errore: errore?.chiave === chiave ? errore.testo : null,
    /** Il link "Apri il PDF" serve solo se la scheda non si è aperta. */
    mostraLink: pronto !== null && linkUrl === pronto.url,
    prepara,
    apri,
  };
}
