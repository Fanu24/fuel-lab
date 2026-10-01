"use client";

/* La Cucina: cosa preparare in un giorno di produzione.
   Quattro schede sullo stesso insieme di ordini (confermati o in preparazione
   con quel giorno di cucina) e di consegne in abbonamento (gli abbonamenti in
   corso che quel giorno consegnano: una consegna ogni 3 giorni, con i pasti
   dei tre giorni coperti): Piatti, Spesa, Etichette, Ordini. Giorno e
   scheda stanno nell'indirizzo (?giorno=2026-09-28&scheda=spesa), cosi' un
   link o un ricarica riaprono lo stesso foglio. Stampa solo la scheda aperta.
   Si cucina ogni giorno: le scorciatoie sono Oggi, Domani e Dopodomani, e un
   giorno di chiusura segnato in Impostazioni si vede in cima al foglio.
   Gli ordini sono quelli condivisi del pannello (PannelloDati): si aggiornano
   da soli ogni minuto, anche col telefono appoggiato in cucina tutto il giorno. */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Fragment, useMemo, useState, type KeyboardEvent } from "react";
import { chiusuraDi, periodo } from "@/lib/impostazioni";
import { scorciatoieDate } from "@/lib/operazioni";
import {
  abbonamentiDelGiorno,
  confermatiSenzaGiorno,
  contaPiatti,
  contaPorzioni,
  contaPastiAbbonamenti,
  giornoPredefinito,
  giorniDaPreparare,
  isData,
  ordiniDelGiorno,
  pastiComeOrdini,
  spostaGiorni,
} from "@/lib/produzione";
import { useImpostazioni } from "@/components/impostazioni/useImpostazioni";
import CucinaEtichette from "./CucinaEtichette";
import CucinaOrdini from "./CucinaOrdini";
import CucinaPiatti from "./CucinaPiatti";
import CucinaSpesa from "./CucinaSpesa";
import { usePannello } from "./PannelloDati";
import { ErroreDati } from "./PannelloStato";
import { Avviso, Caricamento, Kpi, TestaPagina, Vuoto, giorno as giornoCorto, giornoLungo } from "./ui";

type Scheda = "piatti" | "spesa" | "etichette" | "ordini";

const SCHEDE: { id: Scheda; label: string; stampa: string }[] = [
  { id: "piatti", label: "Piatti", stampa: "Stampa i piatti" },
  { id: "spesa", label: "Spesa", stampa: "Stampa la spesa" },
  { id: "etichette", label: "Etichette", stampa: "Stampa le etichette" },
  { id: "ordini", label: "Ordini", stampa: "Stampa gli ordini" },
];

const eScheda = (s: string | null): s is Scheda => SCHEDE.some((x) => x.id === s);

const ora = (d: Date) => new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" }).format(d);

export default function ProductionLive() {
  const parametri = useSearchParams();
  const { ordini, errore, aggiornando, aggiornatoAlle, oggi, aggiorna } = usePannello();
  const [giornoScelto, setGiornoScelto] = useState<string | null>(() => {
    const g = parametri.get("giorno");
    return isData(g) ? g : null;
  });
  const [scheda, setScheda] = useState<Scheda>(() => {
    const s = parametri.get("scheda");
    return eScheda(s) ? s : "piatti";
  });
  const [anchePronti, setAnchePronti] = useState(false);
  const [bozzaData, setBozzaData] = useState<string | null>(null);
  const { stato: statoImpostazioni, impostazioni } = useImpostazioni({ fresche: true });
  const { chiusure } = impostazioni;

  /* Il giorno che si apre da solo si decide una volta (e di nuovo a mezzanotte): se un ordine di oggi
     arriva mentre guardi domani, la pagina non ti cambia giorno sotto le dita. */
  const [automatico, setAutomatico] = useState<{ oggi: string; giorno: string } | null>(null);
  if (ordini && statoImpostazioni !== "attesa" && !giornoScelto && automatico?.oggi !== oggi) {
    setAutomatico({ oggi, giorno: giornoPredefinito(ordini, oggi, chiusure) });
  }
  const giorno = giornoScelto ?? automatico?.giorno ?? giornoPredefinito(ordini ?? [], oggi, chiusure);

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
  const abbonamenti = useMemo(() => (ordini ? abbonamentiDelGiorno(ordini, giorno) : []), [ordini, giorno]);
  // Ordini e pasti in abbonamento con un piatto indicato insieme, per contare piatti, spesa e allergeni.
  const perContare = useMemo(() => [...delGiorno, ...pastiComeOrdini(abbonamenti, giorno)], [delGiorno, abbonamenti, giorno]);
  // Ogni pasto delle consegne e' una porzione, indicato o no.
  const pastiAbbonamenti = contaPastiAbbonamenti(abbonamenti, giorno);
  const porzioni = contaPorzioni(delGiorno) + pastiAbbonamenti;
  const piattiDiversi = useMemo(() => contaPiatti(perContare).length, [perContare]);
  const prossimi = useMemo(() => (ordini ? giorniDaPreparare(ordini, oggi, anchePronti) : []), [ordini, oggi, anchePronti]);
  const senzaGiorno = useMemo(() => (ordini ? confermatiSenzaGiorno(ordini) : []), [ordini]);
  const chiusura = chiusuraDi(giorno, chiusure);
  const qualcosa = delGiorno.length + abbonamenti.length > 0;

  const scorciatoie = scorciatoieDate(oggi);

  const conteggi: Partial<Record<Scheda, number>> = {
    piatti: piattiDiversi,
    etichette: porzioni,
    ordini: delGiorno.length + abbonamenti.length,
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
              {aggiornatoAlle ? <> Dati delle {ora(aggiornatoAlle)}.</> : null}
            </>
          }
          azioni={
            <>
              <button type="button" className="btn btn-linea btn-sm" onClick={() => void aggiorna()} disabled={aggiornando || ordini === null}>
                {aggiornando ? "Aggiorno…" : "Aggiorna"}
              </button>
              <button type="button" className="btn btn-ink btn-sm" onClick={() => window.print()} disabled={!qualcosa || (scheda === "etichette" && porzioni === 0)}>
                {schedaAttiva.stampa}
              </button>
            </>
          }
        />
      </div>

      {errore ? (
        <div className="grid gap-3 print:hidden">
          <ErroreDati />
          {ordini === null ? (
            <button type="button" className="btn btn-ink btn-sm justify-self-start" onClick={() => void aggiorna()} disabled={aggiornando}>
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
                  {/* "chiuso" va a capo da solo: nella casella stretta di un telefono "ven 2 ott · chiuso" uscirebbe dal bordo. */}
                  <span className="cu-scorciatoia-data">
                    <span className="whitespace-nowrap">{giornoCorto(s.data)}</span>
                    {chiusuraDi(s.data, chiusure) ? <span className="cu-scorciatoia-chiuso"> · chiuso</span> : null}
                  </span>
                </button>
              ))}
              <div className="campo cu-altra-data">
                <label htmlFor="cu-data">Altra data</label>
                {/* Scrivendo l'anno cifra per cifra il campo passa da date non valide ("0002-10-02"): finche' non c'e'
                    una data vera resta quello che hai scritto, invece di tornare di scatto al giorno scelto. */}
                <input
                  id="cu-data"
                  type="date"
                  value={bozzaData ?? giorno}
                  onChange={(e) => {
                    if (isData(e.target.value)) {
                      setBozzaData(null);
                      scegliGiorno(e.target.value);
                    } else setBozzaData(e.target.value);
                  }}
                  onBlur={() => setBozzaData(null)}
                />
              </div>
            </div>
            <label className="cu-opzione">
              <input type="checkbox" checked={anchePronti} onChange={(e) => setAnchePronti(e.target.checked)} />
              <span>Includi anche gli ordini già pronti (per ristampare etichette o schede)</span>
            </label>
            {prossimi.length ? (
              <div className="cu-prossimi">
                <p className="cu-prossimi-titolo">Prossimi giorni con qualcosa da preparare</p>
                <ul className="cu-prossimi-lista">
                  {prossimi.slice(0, 6).map((p) => (
                    <li key={p.giorno}>
                      <button
                        type="button"
                        className="cu-prossimo cu-prossimo-giorno"
                        aria-pressed={giorno === p.giorno}
                        onClick={() => scegliGiorno(p.giorno)}
                      >
                        <strong>{giornoCorto(p.giorno)}</strong>
                        <span>
                          {[
                            p.ordini ? `${p.ordini} ${p.ordini === 1 ? "ordine" : "ordini"}` : "",
                            p.abbonamenti ? `${p.abbonamenti} ${p.abbonamenti === 1 ? "abbonamento" : "abbonamenti"}` : "",
                            `${p.porzioni} porz.`,
                          ]
                            .filter(Boolean)
                            .map((parte, i) => (
                              <Fragment key={parte}>
                                {i ? " · " : ""}
                                <span className="whitespace-nowrap">{parte}</span>
                              </Fragment>
                            ))}
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
                  ? "1 ordine confermato non ha ancora le date (o l’inizio, se è un abbonamento) e non compare qui. "
                  : `${senzaGiorno.length} ordini confermati non hanno ancora le date (o l’inizio, se sono abbonamenti) e non compaiono qui. `}
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

            {chiusura ? (
              <div className="print:hidden">
                <Avviso tipo="info">
                  Questo giorno sei chiuso ({periodo(chiusura.dal, chiusura.al, oggi)}
                  {chiusura.motivo ? `, ${chiusura.motivo}` : ""}): i clienti non possono sceglierlo.
                  {qualcosa ? " Quello che vedi qui sotto è già confermato: sposta le date (o l’inizio, per gli abbonamenti) o avvisa i clienti." : ""}
                </Avviso>
              </div>
            ) : null}

            {!qualcosa ? (
              <div className="cu-vuoto print:hidden">
                <Vuoto>
                  Niente da preparare per {giornoLungo(giorno)}. Qui arrivano gli ordini confermati con questo giorno di
                  cucina e le consegne degli abbonamenti in corso (una ogni 3 giorni).
                </Vuoto>
                <Link href="/dashboard/ordini" className="btn btn-linea btn-sm">
                  Vai agli ordini
                </Link>
              </div>
            ) : (
              <>
                <div className={`grid gap-3 print:hidden ${abbonamenti.length ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
                  <Kpi label="Ordini" valore={delGiorno.length} />
                  {abbonamenti.length ? (
                    <Kpi
                      label="In abbonamento"
                      valore={abbonamenti.length}
                      nota={`${abbonamenti.length === 1 ? "consegna" : "consegne"} · ${pastiAbbonamenti} ${pastiAbbonamenti === 1 ? "pasto" : "pasti"}`}
                    />
                  ) : null}
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
                      FUEL LAB · Cucina di {giornoLungo(giorno)} · {schedaAttiva.label} · {delGiorno.length} ordini
                      {abbonamenti.length ? `, ${abbonamenti.length} ${abbonamenti.length === 1 ? "consegna" : "consegne"} in abbonamento (${pastiAbbonamenti} pasti)` : ""}, {porzioni} porzioni
                    </p>
                  ) : null}
                  {scheda === "piatti" ? <CucinaPiatti ordini={perContare} abbonamenti={abbonamenti} giorno={giorno} /> : null}
                  {scheda === "spesa" ? (
                    <CucinaSpesa ordini={perContare} giorno={giorno} porzioni={porzioni} abbonamenti={abbonamenti} />
                  ) : null}
                  {scheda === "etichette" ? <CucinaEtichette ordini={delGiorno} abbonamenti={abbonamenti} giorno={giorno} /> : null}
                  {scheda === "ordini" ? <CucinaOrdini ordini={delGiorno} abbonamenti={abbonamenti} giorno={giorno} /> : null}
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
