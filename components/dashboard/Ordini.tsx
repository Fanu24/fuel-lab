"use client";

/* La pagina "Ordini" (/dashboard/ordini): tutti gli ordini, filtrati per
   stato, cercabili, in elenco o a colonne. Un tocco apre la scheda
   (?id=...). I filtri vivono nell'indirizzo (?stato=, ?solo=, ?q=): i link di
   "Oggi" ("Conferma 2 richieste", "Incassa...") arrivano gia' filtrati e
   l'indirizzo che si vede si puo' copiare e mandare. */

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { STATI_ORDINE, type StatoOrdine } from "@/lib/api";
import {
  FILTRI_SPECIALI,
  STATI_APERTI,
  aperto,
  contaPerStato,
  filtraOrdini,
  filtriNelIndirizzo,
  leggiFiltroSpeciale,
  ordiniCsv,
  plurale,
  statoDaIndirizzo,
  type FiltroSpeciale,
  type FiltroStato,
} from "@/lib/operazioni";
import OrdineNuovo, { BottoneNuovoOrdine, useNuovoOrdineUrl } from "./OrdineNuovo";
import OrdineScheda, { useSchedaUrl } from "./OrdineScheda";
import OrdiniColonne from "./OrdiniColonne";
import OrdiniElenco from "./OrdiniElenco";
import OrdiniFiltri, { OrdiniVista, type Vista } from "./OrdiniFiltri";
import { usePannello } from "./PannelloDati";
import { Aggiornamento, ErroreDati, useAzioniVeloci } from "./PannelloStato";
import { Caricamento, TestaPagina, Vuoto } from "./ui";

const CHIAVE_VISTA = "fuellab.pannello.vista-ordini";

function leggiVista(): Vista {
  try {
    return window.localStorage.getItem(CHIAVE_VISTA) === "colonne" ? "colonne" : "elenco";
  } catch {
    return "elenco";
  }
}

const FRASE_VUOTA: Partial<Record<FiltroStato, string>> = {
  aperti: "Nessun ordine aperto. Quando arriva una richiesta la trovi qui.",
  requested: "Nessuna richiesta da confermare.",
  confirmed: "Nessun ordine confermato in attesa.",
  preparing: "Niente in preparazione.",
  ready: "Nessun ordine pronto da consegnare.",
  completed: "Nessun ordine consegnato fra quelli caricati.",
  cancelled: "Nessun ordine annullato.",
};

export default function Ordini() {
  const { ordini, oggi, limiteStorico } = usePannello();
  const parametri = useSearchParams();
  const { id, apri, chiudi } = useSchedaUrl();
  const nuovo = useNuovoOrdineUrl();
  const veloci = useAzioniVeloci();

  // Filtri dall'indirizzo, e di nuovo se un link cambia ?stato o ?solo mentre la pagina e' aperta.
  const statoUrl = parametri.get("stato");
  const soloUrl = parametri.get("solo");
  const [letti, setLetti] = useState({ stato: statoUrl, solo: soloUrl });
  const [stato, setStato] = useState<FiltroStato>(() => statoDaIndirizzo(statoUrl, soloUrl));
  const [speciale, setSpeciale] = useState<FiltroSpeciale | null>(() => leggiFiltroSpeciale(soloUrl));
  if (letti.stato !== statoUrl || letti.solo !== soloUrl) {
    setLetti({ stato: statoUrl, solo: soloUrl });
    setStato(statoDaIndirizzo(statoUrl, soloUrl));
    setSpeciale(leggiFiltroSpeciale(soloUrl));
  }

  // La ricerca si legge dall'indirizzo solo all'apertura: dopo, comanda chi scrive.
  const [ricerca, setRicerca] = useState(() => parametri.get("q") ?? "");
  const [vista, setVista] = useState<Vista>(() => (typeof window === "undefined" ? "elenco" : leggiVista()));

  // L'indirizzo segue i filtri (senza aggiungere voci alla cronologia). La ricerca aspetta che si smetta di scrivere.
  useEffect(() => {
    const t = window.setTimeout(() => {
      const prima = window.location.search;
      const p = filtriNelIndirizzo(new URLSearchParams(prima), { stato, speciale, ricerca });
      const resto = p.toString();
      if (`?${resto}` !== prima && !(resto === "" && prima === "")) {
        window.history.replaceState(null, "", resto ? `?${resto}` : window.location.pathname);
      }
    }, ricerca ? 300 : 0);
    return () => window.clearTimeout(t);
  }, [stato, speciale, ricerca]);

  const visibili = useMemo(
    () => (ordini ? filtraOrdini(ordini, { stato, speciale, ricerca }, oggi) : null),
    [ordini, stato, speciale, ricerca, oggi],
  );
  const conti = useMemo(() => (ordini ? contaPerStato(ordini, { speciale, ricerca }, oggi) : null), [ordini, speciale, ricerca, oggi]);

  const statiColonne: readonly StatoOrdine[] =
    stato === "aperti" ? STATI_APERTI : stato === "tutti" ? STATI_ORDINE.map((s) => s.id) : [stato];

  const cerca = ricerca.trim();
  const filtriAttivi = stato !== "aperti" || !!speciale || !!cerca;
  const azzera = () => {
    setRicerca("");
    setSpeciale(null);
    setStato("aperti");
  };

  function scegliVista(v: Vista) {
    setVista(v);
    try {
      window.localStorage.setItem(CHIAVE_VISTA, v);
    } catch {
      // Navigazione privata o memoria piena: la scelta vale fino alla prossima visita.
    }
  }

  function esporta() {
    if (!visibili?.length) return;
    const url = URL.createObjectURL(new Blob([ordiniCsv(visibili)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `ordini-fuellab-${oggi}.csv`;
    document.body.append(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // I numeri sotto il titolo sono quelli di tutti gli ordini, non di quelli che la ricerca lascia visibili.
  const aperti = ordini?.filter(aperto).length ?? 0;
  const daConfermare = ordini?.filter((o) => o.status === "requested").length ?? 0;

  return (
    <>
      <div className="pn-pagina gap-6 md:gap-8">
        <TestaPagina
          occhiello="Pannello di Matteo"
          titolo="Ordini"
          sotto={ordini ? `${plurale(aperti, "aperto", "aperti")} · ${daConfermare} da confermare` : "Carico gli ordini…"}
          azioni={
            <>
              <BottoneNuovoOrdine onClick={nuovo.apri} />
              <Aggiornamento />
            </>
          }
        />
        <ErroreDati />

        <OrdiniFiltri
          stato={stato}
          conti={conti}
          onStato={setStato}
          ricerca={ricerca}
          onRicerca={setRicerca}
          speciale={speciale}
          onSpeciale={setSpeciale}
        />

        <section aria-labelledby="ordini-risultati" className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex flex-wrap items-center gap-x-3">
              <h2 id="ordini-risultati" className="font-ui text-[16px] font-bold normal-case tracking-normal" aria-live="polite">
                {visibili ? `${plurale(visibili.length, "ordine", "ordini")}${cerca ? ` per “${cerca}”` : ""}` : "Carico…"}
              </h2>
              {filtriAttivi ? (
                <button type="button" className="pn-tasto pn-tasto-piatto min-h-11 px-1 text-[15px]" onClick={azzera}>
                  Azzera i filtri
                </button>
              ) : null}
            </div>
            <OrdiniVista vista={vista} onVista={scegliVista} onEsporta={esporta} esportabili={visibili?.length ?? 0} />
          </div>

          {!visibili ? (
            <Caricamento testo="Carico gli ordini…" />
          ) : visibili.length === 0 && vista === "elenco" ? (
            <div className="border-t-[3px] border-ink">
              <Vuoto>
                {cerca
                  ? `Nessun ordine trovato per “${cerca}”${stato !== "aperti" || speciale ? " con questi filtri" : ""}.`
                  : speciale
                    ? `Nessun ordine “${FILTRI_SPECIALI[speciale].toLowerCase()}” in questa vista.`
                    : FRASE_VUOTA[stato] ?? "Nessun ordine."}
              </Vuoto>
              {filtriAttivi ? (
                <button type="button" className="pn-tasto" onClick={azzera}>
                  Mostra tutti gli aperti
                </button>
              ) : null}
            </div>
          ) : vista === "elenco" ? (
            <OrdiniElenco ordini={visibili} oggi={oggi} apri={apri} />
          ) : (
            <OrdiniColonne ordini={visibili} stati={statiColonne} oggi={oggi} apri={apri} veloci={veloci} />
          )}

          <p className="pn-aiuto mt-2">
            Qui trovi tutti gli ordini aperti e gli ultimi {limiteStorico ?? 100} chiusi. L’esportazione CSV prende l’elenco filtrato che vedi.
          </p>
        </section>
      </div>
      {nuovo.aperto ? (
        <OrdineNuovo onChiudi={nuovo.chiudi} onSalvato={nuovo.apriScheda} />
      ) : id ? (
        <OrdineScheda key={id} id={id} onChiudi={chiudi} />
      ) : null}
      {veloci.avvisoInBasso}
    </>
  );
}
