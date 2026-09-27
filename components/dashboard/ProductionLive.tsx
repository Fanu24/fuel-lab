"use client";

/* La Cucina: cosa preparare in un giorno di produzione.
   Quattro schede sullo stesso insieme di ordini (confermati o in preparazione
   con quel giorno di cucina): Piatti, Spesa, Etichette, Ordini. Giorno e
   scheda stanno nell'indirizzo (?giorno=2026-09-28&scheda=spesa), cosi' un
   link o un ricarica riaprono lo stesso foglio. Stampa solo la scheda aperta. */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { api, type Ordine } from "@/lib/api";
import {
  confermatiSenzaGiorno,
  contaPiatti,
  contaPorzioni,
  giornoPredefinito,
  giorniConOrdini,
  isData,
  oggiRoma,
  ordiniDelGiorno,
  prossimo,
  spostaGiorni,
} from "@/lib/produzione";
import CucinaEtichette from "./CucinaEtichette";
import CucinaOrdini from "./CucinaOrdini";
import CucinaPiatti from "./CucinaPiatti";
import CucinaSpesa from "./CucinaSpesa";
import { Avviso, Caricamento, Kpi, TestaPagina, Vuoto, giorno as giornoCorto, giornoLungo } from "./ui";

type Scheda = "piatti" | "spesa" | "etichette" | "ordini";

const SCHEDE: { id: Scheda; label: string; stampa: string }[] = [
  { id: "piatti", label: "Piatti", stampa: "Stampa i piatti" },
  { id: "spesa", label: "Spesa", stampa: "Stampa la spesa" },
  { id: "etichette", label: "Etichette", stampa: "Stampa le etichette" },
  { id: "ordini", label: "Ordini", stampa: "Stampa gli ordini" },
];

const eScheda = (s: string | null): s is Scheda => SCHEDE.some((x) => x.id === s);

const messaggio = (e: unknown) => (e instanceof Error ? e.message : "Non riesco a caricare gli ordini. Riprova tra poco.");

const ora = (d: Date) => new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" }).format(d);

export default function ProductionLive() {
  const parametri = useSearchParams();
  const [ordini, setOrdini] = useState<Ordine[] | null>(null);
  const [errore, setErrore] = useState("");
  const [aggiornando, setAggiornando] = useState(false);
  const [aggiornatoAlle, setAggiornatoAlle] = useState<string>("");
  const [giornoScelto, setGiornoScelto] = useState<string | null>(() => {
    const g = parametri.get("giorno");
    return isData(g) ? g : null;
  });
  const [scheda, setScheda] = useState<Scheda>(() => {
    const s = parametri.get("scheda");
    return eScheda(s) ? s : "piatti";
  });
  const [anchePronti, setAnchePronti] = useState(false);

  useEffect(() => {
    let vivo = true;
    api.ordini().then(
      (r) => {
        if (!vivo) return;
        setOrdini(r.orders);
        setAggiornatoAlle(ora(new Date()));
      },
      (e: unknown) => {
        if (vivo) setErrore(messaggio(e));
      },
    );
    return () => {
      vivo = false;
    };
  }, []);

  function aggiorna() {
    setAggiornando(true);
    api
      .ordini()
      .then(
        (r) => {
          setOrdini(r.orders);
          setErrore("");
          setAggiornatoAlle(ora(new Date()));
        },
        (e: unknown) => setErrore(messaggio(e)),
      )
      .finally(() => setAggiornando(false));
  }

  const oggi = oggiRoma();
  const giorno = giornoScelto ?? giornoPredefinito(ordini ?? [], oggi);

  function scriviIndirizzo(g: string | null, s: Scheda) {
    const p = new URLSearchParams();
    if (g) p.set("giorno", g);
    if (s !== "piatti") p.set("scheda", s);
    const q = p.toString();
    window.history.replaceState(null, "", q ? `?${q}` : window.location.pathname);
  }
  function scegliGiorno(g: string) {
    setGiornoScelto(g);
    scriviIndirizzo(g, scheda);
  }
  function scegliScheda(s: Scheda) {
    setScheda(s);
    scriviIndirizzo(giornoScelto, s);
  }

  const delGiorno = useMemo(() => (ordini ? ordiniDelGiorno(ordini, giorno, anchePronti) : []), [ordini, giorno, anchePronti]);
  const porzioni = contaPorzioni(delGiorno);
  const piattiDiversi = useMemo(() => contaPiatti(delGiorno).length, [delGiorno]);
  const prossimi = useMemo(() => (ordini ? giorniConOrdini(ordini, oggi, anchePronti) : []), [ordini, oggi, anchePronti]);
  const senzaGiorno = useMemo(() => (ordini ? confermatiSenzaGiorno(ordini) : []), [ordini]);

  const scorciatoie = [
    { nome: "Oggi", data: oggi },
    { nome: "Lunedì", data: prossimo(oggi, 1) },
    { nome: "Giovedì", data: prossimo(oggi, 4) },
  ];

  const conteggi: Partial<Record<Scheda, number>> = {
    piatti: piattiDiversi,
    etichette: porzioni,
    ordini: delGiorno.length,
  };

  function tastiSchede(e: KeyboardEvent<HTMLButtonElement>) {
    const i = SCHEDE.findIndex((s) => s.id === scheda);
    const vai =
      e.key === "ArrowRight" ? (i + 1) % SCHEDE.length
      : e.key === "ArrowLeft" ? (i - 1 + SCHEDE.length) % SCHEDE.length
      : e.key === "Home" ? 0
      : e.key === "End" ? SCHEDE.length - 1
      : -1;
    if (vai === -1) return;
    e.preventDefault();
    scegliScheda(SCHEDE[vai].id);
    document.getElementById(`cu-tab-${SCHEDE[vai].id}`)?.focus();
  }

  const quandoRelativo =
    giorno === oggi ? "oggi" : giorno === spostaGiorni(oggi, 1) ? "domani" : giorno === spostaGiorni(oggi, -1) ? "ieri" : "";
  const schedaAttiva = SCHEDE.find((s) => s.id === scheda) ?? SCHEDE[0];

  return (
    <div className="cu grid gap-8" data-scheda={scheda}>
      <div className="print:hidden">
        <TestaPagina
          occhiello="Pannello · Cucina"
          titolo="Cucina"
          sotto={
            <>
              Cosa preparare, cosa comprare, cosa etichettare.
              {aggiornatoAlle ? <> Dati delle {aggiornatoAlle}.</> : null}
            </>
          }
          azioni={
            <>
              <button type="button" className="btn btn-linea btn-sm" onClick={aggiorna} disabled={aggiornando || ordini === null}>
                {aggiornando ? "Aggiorno…" : "Aggiorna"}
              </button>
              <button type="button" className="btn btn-ink btn-sm" onClick={() => window.print()} disabled={!delGiorno.length}>
                {schedaAttiva.stampa}
              </button>
            </>
          }
        />
      </div>

      {errore ? (
        <div className="grid gap-3 print:hidden">
          <Avviso>{errore}</Avviso>
          {ordini === null ? (
            <button type="button" className="btn btn-ink btn-sm justify-self-start" onClick={aggiorna} disabled={aggiornando}>
              Riprova
            </button>
          ) : null}
        </div>
      ) : null}

      {ordini === null ? (
        errore ? null : <Caricamento testo="Carico gli ordini della cucina…" />
      ) : (
        <>
          <fieldset className="cu-giorni print:hidden">
            <legend className="cu-legenda">Giorno di cucina</legend>
            <div className="cu-scorciatoie">
              {scorciatoie.map((s) => (
                <button
                  key={s.nome}
                  type="button"
                  className="cu-scorciatoia"
                  aria-pressed={giorno === s.data}
                  onClick={() => scegliGiorno(s.data)}
                >
                  <span className="cu-scorciatoia-nome">{s.nome}</span>
                  <span className="cu-scorciatoia-data">{giornoCorto(s.data)}</span>
                </button>
              ))}
              <div className="campo cu-altra-data">
                <label htmlFor="cu-data">Altra data</label>
                <input
                  id="cu-data"
                  type="date"
                  value={giorno}
                  onChange={(e) => {
                    if (isData(e.target.value)) scegliGiorno(e.target.value);
                  }}
                />
              </div>
            </div>
            <label className="cu-opzione">
              <input type="checkbox" checked={anchePronti} onChange={(e) => setAnchePronti(e.target.checked)} />
              <span>Includi anche gli ordini già pronti (per ristampare etichette o schede)</span>
            </label>
            {prossimi.length ? (
              <div className="cu-prossimi">
                <p className="cu-prossimi-titolo">Giorni con ordini da preparare</p>
                <ul className="cu-prossimi-lista">
                  {prossimi.slice(0, 6).map((p) => (
                    <li key={p.giorno}>
                      <button
                        type="button"
                        className="cu-prossimo"
                        aria-pressed={giorno === p.giorno}
                        onClick={() => scegliGiorno(p.giorno)}
                      >
                        <strong>{giornoCorto(p.giorno)}</strong>
                        <span>
                          {p.ordini} {p.ordini === 1 ? "ordine" : "ordini"} · {p.porzioni} porz.
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </fieldset>

          {senzaGiorno.length ? (
            <div className="print:hidden">
              <Avviso tipo="info">
                {senzaGiorno.length === 1
                  ? "1 ordine confermato non ha ancora il giorno di cucina e non compare qui. "
                  : `${senzaGiorno.length} ordini confermati non hanno ancora il giorno di cucina e non compaiono qui. `}
                <Link href="/dashboard/ordini" className="link">
                  Assegnalo in Ordini
                </Link>
              </Avviso>
            </div>
          ) : null}

          <section aria-labelledby="cu-giorno" className="cu-sezione-giorno grid gap-6">
            <div className="print:hidden">
              <h2 id="cu-giorno" className="cu-giorno-titolo">
                {giornoLungo(giorno)}
                {quandoRelativo ? <span className="cu-giorno-relativo"> · {quandoRelativo}</span> : null}
              </h2>
            </div>

            {delGiorno.length === 0 ? (
              <div className="cu-vuoto print:hidden">
                <Vuoto>
                  Nessun ordine da preparare per {giornoLungo(giorno)}. Qui arrivano gli ordini confermati o in preparazione
                  a cui hai assegnato questo giorno di cucina.
                </Vuoto>
                <Link href="/dashboard/ordini" className="btn btn-linea btn-sm">
                  Vai agli ordini
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 print:hidden">
                  <Kpi label="Ordini" valore={delGiorno.length} />
                  <Kpi label="Porzioni" valore={porzioni} />
                  <Kpi label="Piatti diversi" valore={piattiDiversi} />
                </div>

                <div role="tablist" aria-label="Cosa vuoi vedere" className="cu-schede print:hidden">
                  {SCHEDE.map((s) => (
                    <button
                      key={s.id}
                      id={`cu-tab-${s.id}`}
                      type="button"
                      role="tab"
                      aria-selected={scheda === s.id}
                      aria-controls="cu-pannello"
                      tabIndex={scheda === s.id ? 0 : -1}
                      className="cu-scheda"
                      onClick={() => scegliScheda(s.id)}
                      onKeyDown={tastiSchede}
                    >
                      {s.label}
                      {conteggi[s.id] !== undefined ? (
                        <span className="cu-scheda-n num" aria-hidden="true">{conteggi[s.id]}</span>
                      ) : null}
                    </button>
                  ))}
                </div>

                <div id="cu-pannello" role="tabpanel" aria-labelledby={`cu-tab-${scheda}`} tabIndex={0} className="cu-pannello">
                  {scheda !== "etichette" ? (
                    <p className="cu-stampa-testa">
                      FUEL LAB · Cucina di {giornoLungo(giorno)} · {schedaAttiva.label} · {delGiorno.length} ordini, {porzioni} porzioni
                    </p>
                  ) : null}
                  {scheda === "piatti" ? <CucinaPiatti ordini={delGiorno} /> : null}
                  {scheda === "spesa" ? <CucinaSpesa ordini={delGiorno} giorno={giorno} porzioni={porzioni} /> : null}
                  {scheda === "etichette" ? <CucinaEtichette ordini={delGiorno} giorno={giorno} /> : null}
                  {scheda === "ordini" ? <CucinaOrdini ordini={delGiorno} giorno={giorno} /> : null}
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
