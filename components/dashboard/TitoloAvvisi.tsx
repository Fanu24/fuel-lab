"use client";

/* Gli avvisi di cio' che arriva mentre il pannello e' aperto.

   Il numerino nel titolo della scheda del browser: "(3) Oggi · Pannello".
   Conta le richieste da confermare e i messaggi nuovi, cosi' Matteo vede che
   e' arrivato qualcosa anche con il pannello aperto in un'altra scheda. Next
   riscrive il titolo a ogni cambio pagina: un osservatore lo rimette.

   E quando, fra un aggiornamento e l'altro, entra una richiesta nuova o un
   messaggio nuovo, compare un avviso in cima con il link per aprirlo (e una
   frase per il lettore di schermo). Non si annuncia mai quello che c'era gia'
   all'apertura, ne' una richiesta che Matteo ha rimesso lui fra quelle da
   confermare. */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { daSqlite } from "@/lib/api";
import { plurale } from "@/lib/operazioni";
import { Icona } from "./PannelloIcone";
import { usePannello } from "./PannelloDati";

const PREFISSO = /^\(\d+\+?\) /;
/** Quanto resta in vista l'avviso di una novita'. */
const DURATA = 12_000;

type Novita = { testo: string; href: string };

export default function TitoloAvvisi() {
  const { ordini, messaggiNuovi } = usePannello();
  const n = (ordini?.filter((o) => o.status === "requested").length ?? 0) + (messaggiNuovi ?? 0);
  const [novita, setNovita] = useState<Novita | null>(null);

  // L'apertura del pannello: una richiesta arrivata prima non e' una novita'. Un minuto di tolleranza per gli orologi.
  const apertoAlle = useRef<number | null>(null);
  const richiesteViste = useRef<Set<string> | null>(null);
  const messaggiVisti = useRef<number | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const applica = () => {
      const base = document.title.replace(PREFISSO, "");
      const voluto = n > 0 ? `(${n > 99 ? "99+" : n}) ${base}` : base;
      if (document.title !== voluto) document.title = voluto;
    };
    applica();
    const osserva = new MutationObserver(applica);
    osserva.observe(document.head, { childList: true, characterData: true, subtree: true });
    return () => {
      osserva.disconnect();
      document.title = document.title.replace(PREFISSO, "");
    };
  }, [n]);

  useEffect(() => {
    if (!ordini) return;
    apertoAlle.current ??= Date.now() - 60_000;
    const limite = apertoAlle.current;
    const richieste = ordini.filter((o) => o.status === "requested");
    const prima = richiesteViste.current;
    const nuove = prima
      ? richieste.filter((o) => !prima.has(o.id) && o.source !== "manual" && daSqlite(o.created_at).getTime() >= limite)
      : [];
    richiesteViste.current = new Set(richieste.map((o) => o.id));

    const messaggiPrima = messaggiVisti.current;
    const nuoviMessaggi = messaggiNuovi !== null && messaggiPrima !== null && messaggiNuovi > messaggiPrima ? messaggiNuovi - messaggiPrima : 0;
    if (messaggiNuovi !== null) messaggiVisti.current = messaggiNuovi;

    if (!nuove.length && !nuoviMessaggi) return;
    const testo = [
      nuove.length ? (nuove.length === 1 ? "È arrivata una nuova richiesta" : `Sono arrivate ${nuove.length} nuove richieste`) : "",
      nuoviMessaggi ? plurale(nuoviMessaggi, "nuovo messaggio", "nuovi messaggi") : "",
    ]
      .filter(Boolean)
      .join(" · ");
    const href = nuove.length === 1 ? `/dashboard/ordini?id=${encodeURIComponent(nuove[0].id)}` : nuove.length ? "/dashboard/ordini?stato=requested" : "/dashboard/messaggi";
    // Come altrove nel pannello: lo stato si aggiorna fuori dal corpo dell'effetto.
    const t = window.setTimeout(() => {
      setNovita({ testo, href });
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setNovita(null), DURATA);
    }, 0);
    return () => window.clearTimeout(t);
  }, [ordini, messaggiNuovi]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div role="status" aria-live="polite" className="print:hidden">
      {novita ? (
        <div className="pn-novita">
          <span className="pn-novita-testo">{novita.testo}</span>
          <Link href={novita.href} onClick={() => setNovita(null)}>
            Apri
          </Link>
          <button type="button" aria-label="Chiudi l’avviso" onClick={() => setNovita(null)}>
            <Icona nome="chiudi" className="size-5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
