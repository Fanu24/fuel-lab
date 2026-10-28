"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  contaPiatti,
  descriviEvento,
  descrizioneInizioAbbonamento,
  eSessioneScaduta,
  formattaGiorno,
  formattaGiornoDa,
  formattaMomento,
  hrefSezione,
  messaggioDa,
  nomeServizioRichiesta,
  piattiNonPiuDisponibili,
  prossimaUscitaDi,
  quandoRichiesta,
  schedaAbbonamento,
  STATI_IN_CORSO,
} from "@/lib/account";
import { CONSEGNA_OGNI_GIORNI } from "@/lib/abbonamento";
import {
  api,
  etichettaStato,
  euro,
  type DettaglioOrdine,
  type Ordine,
  type VoceOrdine,
} from "@/lib/api";
import { NOMI_GIORNO, potaPiano, usePiano, type GiornoSettimana } from "@/lib/piano";
import { fileIcs } from "@/lib/calendario";
import { INDIRIZZO_RIGA } from "@/lib/sito";
import Passi from "../Passi";
import { useSostituisciSettimana } from "../settimanaLocale";
import {
  Avviso,
  Caricamento,
  EsitoAzione,
  TitoloSezione,
  useConferma,
  type Caricabile,
  type RichiestaConferma,
} from "../ui";
import type { Dati, Esito } from "./tipi";

/* Le richieste del cliente, in corso e concluse. Ognuna mostra le tappe, il
   messaggio di Matteo e il totale concordato; si apre per i piatti e la
   cronologia. Da qui si ripete una settimana o si annulla una richiesta che
   Matteo non ha ancora preso in carico. */

type Props = {
  ordini: Dati<Ordine[]>;
  /** id della richiesta da aprire subito (?apri=) */
  apri: string | null;
  /** id della richiesta appena inviata: mostra la conferma */
  appenaInviata: string | null;
  oggi: string;
};

/** Nell'archivio si mostrano le piu' recenti: una lista di cinquanta schede da 800 px non la scorre nessuno. */
const ARCHIVIO_VISIBILE = 5;

export default function Richieste({ ordini, apri, appenaInviata, oggi }: Props) {
  const [chiedi, dialogo] = useConferma();
  const [aperte, setAperte] = useState<string[]>(() => (apri ? [apri] : []));
  const [dettagli, setDettagli] = useState<Record<string, Caricabile<DettaglioOrdine>>>({});
  const [esiti, setEsiti] = useState<Record<string, Esito | null>>({});
  const [inCorso, setInCorso] = useState<Record<string, "ripeti" | "annulla" | undefined>>({});
  const [tuttoArchivio, setTuttoArchivio] = useState(false);
  /* La scheda che deve prendere il fuoco: dopo un annullamento la scheda cambia posto (da "In corso" all'archivio)
     e si rimonta, e il fuoco cadrebbe sul body; lo stesso per la prima delle schede appena mostrate. */
  const [fuocoSu, setFuocoSu] = useState<string | null>(null);
  const refSuccesso = useRef<HTMLDivElement>(null);
  const inviataVista = useRef<string | null>(null);

  /* La conferma di una richiesta appena inviata si porta in vista e prende il fuoco: dopo l'invio la pagina e'
     scorsa fin qui da sola e il titolo dell'avviso non deve restare fuori dallo schermo. */
  const pronte = ordini.stato === "pronto";
  useEffect(() => {
    if (!appenaInviata || !pronte || inviataVista.current === appenaInviata) return;
    inviataVista.current = appenaInviata;
    refSuccesso.current?.scrollIntoView({ block: "start" });
    refSuccesso.current?.focus({ preventScroll: true });
  }, [appenaInviata, pronte]);

  // Lo stato vive qui e non nelle schede: una richiesta annullata passa da
  // "In corso" all'archivio, e la scheda rimontata non deve perdere l'esito.
  const caricaDettaglio = useCallback(async (id: string) => {
    try {
      const r = await api.ordine(id);
      setDettagli((d) => ({ ...d, [id]: { stato: "pronto", dati: r.order } }));
      return r.order;
    } catch (e) {
      setDettagli((d) => ({ ...d, [id]: { stato: "errore", messaggio: messaggioDa(e, "Non riesco a caricare i dettagli.") } }));
      return null;
    }
  }, []);

  useEffect(() => {
    if (apri) void caricaDettaglio(apri);
  }, [apri, caricaDettaglio]);

  function alterna(id: string) {
    const aperta = aperte.includes(id);
    setAperte((a) => (aperta ? a.filter((x) => x !== id) : [...a, id]));
    if (!aperta && dettagli[id]?.stato !== "pronto") void caricaDettaglio(id);
  }

  const imposta = (id: string, esito: Esito | null) => setEsiti((e) => ({ ...e, [id]: esito }));
  const segna = (id: string, azione: "ripeti" | "annulla" | undefined) => setInCorso((a) => ({ ...a, [id]: azione }));

  async function annulla(o: Ordine) {
    if (inCorso[o.id]) return;
    const ok = await chiedi({
      titolo: "Annullare la richiesta?",
      testo: <p>Matteo non la prenderà in carico. Se cambi idea puoi sempre inviarne una nuova.</p>,
      conferma: "Annulla la richiesta",
      annulla: "Tienila",
      pericolosa: true,
    });
    if (!ok) return;
    segna(o.id, "annulla");
    imposta(o.id, null);
    try {
      await api.modificaOrdine(o.id, { status: "cancelled" });
      imposta(o.id, { ok: true, testo: "Richiesta annullata. Matteo ne riceve l’avviso." });
    } catch (e) {
      imposta(o.id, { ok: false, testo: messaggioDa(e, "Non riesco ad annullare la richiesta. Riprova tra poco."), sessione: eSessioneScaduta(e) });
    }
    await ordini.ricarica();
    segna(o.id, undefined);
    setFuocoSu(o.id);
  }

  if (ordini.stato === "attesa") {
    return (
      <section aria-labelledby="t-richieste" className="grid gap-6">
        <TitoloSezione id="t-richieste">Le tue richieste.</TitoloSezione>
        <Caricamento testo="Carico le richieste…" righe={4} />
      </section>
    );
  }

  if (ordini.stato === "errore") {
    return (
      <section aria-labelledby="t-richieste" className="grid gap-6">
        <TitoloSezione id="t-richieste">Le tue richieste.</TitoloSezione>
        <Avviso
          tipo="errore"
          azioni={<button type="button" className="btn btn-ink btn-sm" onClick={() => void ordini.ricarica()}>Riprova</button>}
        >
          {ordini.messaggio}
        </Avviso>
      </section>
    );
  }

  const attive = ordini.dati.filter((o) => STATI_IN_CORSO.includes(o.status));
  const concluse = ordini.dati.filter((o) => !STATI_IN_CORSO.includes(o.status));
  // Una richiesta da aprire (?apri=) o appena annullata, che sta oltre le prime dell'archivio, non deve restare nascosta.
  const daMostrare = concluse.some((o, i) => i >= ARCHIVIO_VISIBILE && (o.id === apri || o.id === fuocoSu || aperte.includes(o.id)));
  const archivioPieno = tuttoArchivio || daMostrare;
  const archivio = archivioPieno ? concluse : concluse.slice(0, ARCHIVIO_VISIBILE);
  const nascoste = concluse.length - archivio.length;
  const nuova = appenaInviata ? ordini.dati.find((o) => o.id === appenaInviata) : undefined;

  const scheda = (o: Ordine) => (
    <SchedaRichiesta
      key={o.id}
      ordine={o}
      oggi={oggi}
      aperta={aperte.includes(o.id)}
      evidenzia={o.id === apri}
      appenaInviata={o.id === appenaInviata}
      dettaglio={dettagli[o.id]}
      esito={esiti[o.id] ?? null}
      azione={inCorso[o.id]}
      fuoco={o.id === fuocoSu}
      onFuocoFatto={() => setFuocoSu(null)}
      onAlterna={() => alterna(o.id)}
      onAnnulla={() => void annulla(o)}
      caricaDettaglio={caricaDettaglio}
      chiedi={chiedi}
      impostaEsito={(e) => imposta(o.id, e)}
      segna={(a) => segna(o.id, a)}
    />
  );

  return (
    <section aria-labelledby="t-richieste" className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <TitoloSezione id="t-richieste">Le tue richieste.</TitoloSezione>
        <Link href={hrefSezione("richiesta")} scroll={false} className="btn btn-ink btn-sm">
          Nuova richiesta
        </Link>
      </div>

      {appenaInviata ? (
        <Avviso ref={refSuccesso} tipo="successo" titolo="Richiesta inviata a Matteo.">
          {nuova?.phone
            ? `Matteo la guarda e ti ricontatta al ${nuova.phone} per confermare ${nuova.service === "abbonamento" ? "inizio, consegna o ritiro e prezzo" : "giorno, dettagli e totale"}.`
            : `Matteo la guarda e ti conferma ${nuova?.service === "abbonamento" ? "inizio, consegna o ritiro e prezzo" : "giorno, dettagli e totale"}.`}{" "}
          Quando lo fa, lo vedi anche qui sotto. Finché non la conferma puoi ancora annullarla.
        </Avviso>
      ) : null}

      {ordini.dati.length === 0 ? (
        <div className="acc-card grid gap-4">
          <h3 className="acc-card-titolo">Nessuna richiesta, per ora</h3>
          <p className="text-muted">Componi la settimana, o scegli un abbonamento mensile, e invialo a Matteo: qui segui ogni passo, dalla conferma alla consegna.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/settimana" className="btn btn-ink btn-sm">Componi la settimana</Link>
            <Link href={hrefSezione("richiesta", { servizio: "abbonamento" })} scroll={false} className="btn btn-linea btn-sm">Chiedi un abbonamento</Link>
          </div>
        </div>
      ) : (
        <>
          {attive.length ? (
            <div className="grid gap-4">
              <h3 className="acc-gruppo">In corso <span className="num text-muted">{attive.length}</span></h3>
              <ul className="grid gap-4">{attive.map((o) => <li key={o.id}>{scheda(o)}</li>)}</ul>
            </div>
          ) : null}
          {concluse.length ? (
            <div className="grid gap-4">
              <h3 className="acc-gruppo">Archivio <span className="num text-muted">{concluse.length}</span></h3>
              <ul className="grid gap-4">{archivio.map((o) => <li key={o.id}>{scheda(o)}</li>)}</ul>
              {nascoste > 0 ? (
                <button
                  type="button"
                  className="btn btn-linea btn-sm justify-self-start"
                  onClick={() => {
                    setTuttoArchivio(true);
                    setFuocoSu(concluse[ARCHIVIO_VISIBILE].id);
                  }}
                >
                  Mostra le altre {nascoste} {nascoste === 1 ? "richiesta" : "richieste"}
                </button>
              ) : null}
            </div>
          ) : null}
        </>
      )}
      {dialogo}
    </section>
  );
}

function SchedaRichiesta({
  ordine: o,
  oggi,
  aperta,
  evidenzia,
  appenaInviata,
  dettaglio,
  esito,
  azione,
  fuoco,
  onFuocoFatto,
  onAlterna,
  onAnnulla,
  caricaDettaglio,
  chiedi,
  impostaEsito,
  segna,
}: {
  ordine: Ordine;
  oggi: string;
  aperta: boolean;
  evidenzia: boolean;
  /** E' la richiesta appena inviata: la conferma sopra l'elenco ha gia' preso il fuoco, la scheda resta solo evidenziata. */
  appenaInviata: boolean;
  dettaglio: Caricabile<DettaglioOrdine> | undefined;
  esito: Esito | null;
  azione: "ripeti" | "annulla" | undefined;
  /** La scheda deve prendere il fuoco (e portarsi in vista): dopo un annullamento, o come prima delle schede appena mostrate. */
  fuoco: boolean;
  onFuocoFatto: () => void;
  onAlterna: () => void;
  onAnnulla: () => void;
  caricaDettaglio: (id: string) => Promise<DettaglioOrdine | null>;
  chiedi: (r: RichiestaConferma) => Promise<boolean>;
  impostaEsito: (e: Esito | null) => void;
  segna: (a: "ripeti" | "annulla" | undefined) => void;
}) {
  const router = useRouter();
  const { piano } = usePiano();
  const sostituisci = useSostituisciSettimana();
  const ref = useRef<HTMLElement>(null);
  const refEsito = useRef<HTMLDivElement>(null);
  const ritiro = o.fulfillment === "pickup";
  const idDettagli = `dettagli-${o.id}`;
  const idTitolo = `richiesta-${o.id}`;

  // Arrivati con ?apri=: la scheda si porta in vista e prende il fuoco (se e' appena stata inviata, il fuoco e' sulla conferma).
  useEffect(() => {
    if (!evidenzia || appenaInviata || !ref.current) return;
    ref.current.scrollIntoView({ block: "start" });
    ref.current.focus({ preventScroll: true });
  }, [evidenzia, appenaInviata]);

  useEffect(() => {
    if (!fuoco || !ref.current) return;
    ref.current.focus({ preventScroll: true });
    // Con un esito da leggere (annullamento) si porta in vista quello: la scheda e' alta e l'esito sta in fondo.
    if (esito && refEsito.current) refEsito.current.scrollIntoView({ block: "center" });
    else ref.current.scrollIntoView({ block: "start" });
    onFuocoFatto();
  }, [fuoco, esito, onFuocoFatto]);

  async function ripeti() {
    if (azione) return;
    segna("ripeti");
    impostaEsito(null);
    const d = dettaglio?.stato === "pronto" ? dettaglio.dati : await caricaDettaglio(o.id);
    if (!d) {
      segna(undefined);
      impostaEsito({ ok: false, testo: "Non riesco a leggere i piatti di questa richiesta. Riprova tra poco." });
      return;
    }
    const persi = piattiNonPiuDisponibili(d.plan);
    const restano = contaPiatti(potaPiano(d.plan));
    if (restano === 0) {
      segna(undefined);
      impostaEsito({ ok: false, testo: "Nessuno dei piatti di questa richiesta è ancora nel menu: componi una settimana nuova." });
      return;
    }
    const locali = contaPiatti(piano);
    if (locali > 0 || persi > 0) {
      const ok = await chiedi({
        titolo: "Ripetere questa settimana?",
        testo: (
          <>
            {locali > 0 ? (
              <p>
                La settimana che stai componendo ({locali} {locali === 1 ? "piatto" : "piatti"}) viene sostituita da quella di questa
                richiesta ({restano} {restano === 1 ? "piatto" : "piatti"}).
              </p>
            ) : null}
            {persi > 0 ? (
              <p>
                {persi === 1 ? "Un piatto non è" : `${persi} piatti non sono`} più nel menu: {persi === 1 ? "lo togliamo" : "li togliamo"}.
              </p>
            ) : null}
            <p>Poi si apre il compositore, per ritoccarla prima di inviarla.</p>
          </>
        ),
        conferma: "Carica la settimana",
      });
      if (!ok) {
        segna(undefined);
        return;
      }
    }
    sostituisci(d.plan, d.training);
    router.push("/settimana");
  }

  const scheda = schedaAbbonamento(o);
  const abbonamento = !!scheda;
  // L'abbonamento confermato ha un periodo (un mese dalla data d'inizio), non un giorno di ritiro; una richiesta annullata non ha un quando.
  const quando = quandoRichiesta(o, oggi);

  const anteprima = o.items.slice(0, 3).map((v) => v.name);

  // Il giorno confermato da Matteo si puo' mettere nel calendario del telefono (per l'abbonamento, l'inizio).
  const inCalendario = !!o.fulfillment_date && ["confirmed", "preparing", "ready"].includes(o.status);
  // Per un abbonamento in corso, la prossima consegna o ritiro (una ogni 3 giorni dall'inizio).
  const prossima = abbonamento && inCalendario ? prossimaUscitaDi(o, oggi) : null;
  function scaricaCalendario() {
    if (!o.fulfillment_date) return;
    const ics = fileIcs({
      uid: `ordine-${o.id}`,
      giorno: o.fulfillment_date,
      titolo: abbonamento
        ? "Inizio dell’abbonamento FUEL LAB"
        : `${ritiro ? "Ritiro" : "Consegna"} FUEL LAB${o.meals ? `, ${o.meals} pasti` : ""}`,
      descrizione: [
        ...(abbonamento ? descrizioneInizioAbbonamento(o, oggi) : []),
        ritiro ? `Ritiro in ${INDIRIZZO_RIGA}.` : `Consegna a ${[o.address, o.comune].filter(Boolean).join(", ")}.`,
        o.customer_message ? `Messaggio di Matteo: ${o.customer_message}` : "",
        "Dettagli: https://fuelchef.it/account?sezione=richieste",
      ].filter(Boolean).join("\n"),
      luogo: ritiro ? INDIRIZZO_RIGA : [o.address, o.comune].filter(Boolean).join(", "),
    });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `fuel-lab-${o.fulfillment_date}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <article
      ref={ref}
      tabIndex={-1}
      aria-labelledby={idTitolo}
      className={`acc-richiesta ${evidenzia ? "acc-richiesta-evidenza" : ""}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="acc-etichetta">{nomeServizioRichiesta(o)}</p>
          <h4 id={idTitolo} className="acc-richiesta-titolo">Richiesta del {formattaGiornoDa(o.created_at)}</h4>
        </div>
        <span className="acc-stato" data-stato={o.status}>
          {o.status === "completed" && abbonamento ? "Concluso" : o.status === "completed" && ritiro ? "Ritirato" : etichettaStato(o.status, "cliente")}
        </span>
      </header>

      <div className="mt-5">
        <Passi stato={o.status} modalita={o.fulfillment} servizio={o.service} />
      </div>

      <dl className="acc-fatti mt-5">
        {quando ? (
          <div>
            <dt>{quando.etichetta}</dt>
            <dd>{quando.valore}</dd>
          </div>
        ) : null}
        <div>
          <dt>Modalità</dt>
          <dd>
            {ritiro ? "Ritiro a Pescara" : `Consegna${o.comune ? ` a ${o.comune}` : ""}`}
            {abbonamento ? `, ogni ${CONSEGNA_OGNI_GIORNI} giorni` : ""}
          </dd>
        </div>
        {scheda ? (
          <>
            <div>
              <dt>Formula</dt>
              <dd>{scheda.etichetta}</dd>
            </div>
            <div>
              <dt>Cosa ricevi</dt>
              <dd>{scheda.cosaRicevi}</dd>
            </div>
            <div>
              <dt>Chi si abbona</dt>
              <dd>{scheda.nucleo}</dd>
            </div>
            <div>
              <dt>Settimana di prova</dt>
              <dd>{scheda.prova ? "Sì" : "No"}</dd>
            </div>
            {prossima ? (
              <div>
                <dt>{ritiro ? "Prossimo ritiro" : "Prossima consegna"}</dt>
                <dd>{formattaGiorno(prossima, oggi)}</dd>
              </div>
            ) : null}
          </>
        ) : o.meals > 0 ? (
          // L'home cooking si concorda a parole e non ha piatti del menu: un "Pasti: —" non dice niente.
          <div>
            <dt>Pasti</dt>
            <dd>{o.meals}</dd>
          </div>
        ) : null}
        {o.discount ? <div><dt>Codice sconto</dt><dd>{o.discount.code} · −{o.discount.percent}%{o.discount.appliedPercent > o.discount.percent ? ` (applicato il ${o.discount.appliedPercent}% della promozione migliore)` : ""}<span className="block text-sm font-normal text-muted">{o.discount.baseCents === null ? "Si applicherà quando Matteo conferma il totale." : `Prima dello sconto: ${euro(o.discount.baseCents)}`}</span></dd></div> : null}
        {o.price_cents !== null && o.price_cents !== undefined ? (
          <div>
            <dt>{o.status === "requested" ? "Prezzo proposto" : "Totale concordato"}</dt>
            <dd>
              <span className="num">{euro(o.price_cents)}</span>
              {abbonamento && o.status === "requested" ? " al mese" : ""}
              {o.status === "cancelled" || (o.status === "requested" && !o.paid) ? null : (
                <span className={`acc-pagato ${o.paid ? "acc-pagato-si" : ""}`}>{o.paid ? "Pagato" : "Da pagare"}</span>
              )}
            </dd>
          </div>
        ) : null}
      </dl>

      {o.customer_message ? (
        <div className="acc-messaggio mt-5">
          <p className="acc-messaggio-chi">Messaggio di Matteo</p>
          <p className="whitespace-pre-line">{o.customer_message}</p>
        </div>
      ) : null}

      {!aperta && anteprima.length ? (
        <p className="mt-4 text-sm text-muted">
          {anteprima.join(" · ")}
          {o.items.length > anteprima.length ? ` e altri ${o.items.length - anteprima.length}` : ""}
        </p>
      ) : null}

      <div className="acc-azioni mt-5">
        <button type="button" className="btn btn-linea btn-sm" aria-expanded={aperta} aria-controls={idDettagli} onClick={onAlterna}>
          {aperta ? "Chiudi i dettagli" : "Dettagli e cronologia"}
        </button>
        {o.items.length && !abbonamento ? (
          <button type="button" className="btn btn-ink btn-sm" aria-disabled={azione ? true : undefined} onClick={() => void ripeti()}>
            {azione === "ripeti" ? "Carico…" : "Ripeti questa settimana"}
          </button>
        ) : null}
        {inCalendario ? (
          <button type="button" className="btn btn-linea btn-sm" onClick={scaricaCalendario}>
            Aggiungi al calendario
          </button>
        ) : null}
        {o.status === "requested" ? (
          <button type="button" className="btn btn-sm acc-btn-pericolo-linea" aria-disabled={azione ? true : undefined} onClick={onAnnulla}>
            {azione === "annulla" ? "Annullo…" : "Annulla richiesta"}
          </button>
        ) : null}
      </div>
      <div ref={refEsito}>
        <EsitoAzione esito={esito} className="mt-4 empty:mt-0" />
      </div>

      <div id={idDettagli} hidden={!aperta} className="acc-dettagli">
        {aperta ? <Dettagli ordine={o} dettaglio={dettaglio} onRiprova={() => void caricaDettaglio(o.id)} /> : null}
      </div>
    </article>
  );
}

function Dettagli({
  ordine: o,
  dettaglio,
  onRiprova,
}: {
  ordine: Ordine;
  dettaglio: Caricabile<DettaglioOrdine> | undefined;
  onRiprova: () => void;
}) {
  const perGiorno = raggruppa(o.items);
  const abbonamento = o.service === "abbonamento";
  return (
    <div className="grid gap-6">
      {perGiorno.length ? (
        <Blocco titolo={abbonamento ? "Piatti che hai indicato" : "Piatti"}>
          <ul className="grid gap-3">
            {perGiorno.map(([giorno, voci]) => (
              <li key={giorno}>
                <p className="font-semibold">{NOMI_GIORNO[giorno as GiornoSettimana] ?? giorno}</p>
                <ul className="mt-1 grid gap-1 text-sm">
                  {voci.map((v, i) => (
                    <li key={`${v.meal}-${i}`}>
                      <span className="text-muted capitalize">{v.meal}</span> · {v.name}
                      {v.extras.length ? <span className="text-muted"> + {v.extras.join(", ")}</span> : null}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Blocco>
      ) : null}

      {o.notes ? (
        <Blocco titolo={abbonamento ? "La tua scheda" : "Le tue note"}>
          <p className="whitespace-pre-line text-sm">{o.notes}</p>
        </Blocco>
      ) : null}

      <Blocco titolo="Recapito">
        <p className="text-sm">
          {o.customer_name}
          {o.phone ? ` · ${o.phone}` : ""}
          <br />
          {o.fulfillment === "delivery" ? [o.address, o.comune].filter(Boolean).join(", ") : `Ritiro in Via del Santuario 214 · ${o.comune}`}
        </p>
      </Blocco>

      <Blocco titolo="Cronologia">
        {!dettaglio ? (
          <Caricamento testo="Carico la cronologia…" righe={2} />
        ) : dettaglio.stato === "attesa" ? (
          <Caricamento testo="Carico la cronologia…" righe={2} />
        ) : dettaglio.stato === "errore" ? (
          <p className="text-sm text-muted">
            {dettaglio.messaggio}{" "}
            <button type="button" className="link" onClick={onRiprova}>Riprova</button>
          </p>
        ) : dettaglio.dati.events.length ? (
          <ol className="acc-cronologia">
            {[...dettaglio.dati.events].reverse().map((e) => {
              const { titolo, dettaglio: testo } = descriviEvento(e, dettaglio.dati.fulfillment);
              return (
                <li key={e.id}>
                  <time dateTime={e.created_at}>{formattaMomento(e.created_at)}</time>
                  <p className="font-semibold">{titolo}</p>
                  {testo ? <p className="whitespace-pre-line text-sm text-muted">{testo}</p> : null}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-sm text-muted">Inviata il {formattaMomento(o.created_at)}.</p>
        )}
      </Blocco>
    </div>
  );
}

function Blocco({ titolo, children }: { titolo: string; children: ReactNode }) {
  return (
    <div>
      <h5 className="acc-etichetta">{titolo}</h5>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function raggruppa(voci: VoceOrdine[]): [string, VoceOrdine[]][] {
  const mappa = new Map<string, VoceOrdine[]>();
  for (const v of voci) mappa.set(v.day, [...(mappa.get(v.day) ?? []), v]);
  return [...mappa.entries()];
}
