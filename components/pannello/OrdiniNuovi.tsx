"use client";

import { useRef, useState } from "react";
import { ApiError, ETICHETTE_SERVIZIO, api, pannelloApi, type Ordine } from "@/lib/api";
import { centesimiInTesto, leggiEuro } from "@/lib/operazioni";
import {
  clienteDelOrdine,
  giornoDiInizioProposto,
  linkChiama,
  linkWhatsAppCliente,
  lunediDi,
  piattiRaggruppati,
  prezzoPastoProposto,
  testoAccettazione,
  type EsitoAccettazione,
} from "@/lib/pannello";
import { dataBreve, isData, nomeAbbonamento, oggiRoma } from "@/lib/produzione";
import type { Condiviso } from "./PannelloMatteo";
import { Avviso, Bottone, Errore } from "./ui";

/* Gli ordini che il sito ha mandato e che Matteo non ha ancora accettato o rifiutato (mockup
   "Ordini nuovi"): una scheda per ordine, con nome e telefono grandi, il bottone WhatsApp, Chiama,
   e Accetta / Rifiuta. Accetta apre il modulo dentro la scheda: il giorno di inizio e il prezzo. */

const MESSAGGIO_GIA_AGGIORNATO = "Questo ordine era già stato aggiornato.";

type Messaggio = { testo: string; errore: boolean };
type ErroreScheda = { id: string; testo: string };

function messaggioDi(e: unknown): string {
  return e instanceof ApiError ? e.message : "Qualcosa non va. Riprova.";
}

/**
 * Mette l'ordine nella settimana. Una rete che cade a metà si riprova una volta: la chiamata si
 * può ripetere senza danni (il server non duplica i pasti e riempie i prezzi mancanti). Un 400
 * (il giorno è passato) non si riprova: è una risposta, non un guasto.
 */
async function mettiNellaSettimana(id: string, inizio: string, centesimi: number | null): Promise<void> {
  try {
    await pannelloApi.mettiInSettimana(id, inizio, centesimi);
  } catch (e) {
    if (e instanceof ApiError && e.status === 400) throw e;
    await pannelloApi.mettiInSettimana(id, inizio, centesimi);
  }
}

export default function OrdiniNuovi({ pannello }: { pannello: Condiviso }) {
  const { nuovi, erroreCaricamento, togliNuovo, ricarica, vai, cambiaGiorno, avvisa } = pannello;
  const [messaggio, setMessaggio] = useState<Messaggio | null>(null);
  const [erroreScheda, setErroreScheda] = useState<ErroreScheda | null>(null);
  const [occupato, setOccupato] = useState(false);
  // Una richiesta alla volta: il ref blocca anche un secondo tocco prima del nuovo render.
  const inCorso = useRef(false);

  // Avvia una richiesta se non ce n'e' gia' un'altra; chiude sempre lo stato di attesa alla fine.
  async function lavora(passi: () => Promise<void>) {
    if (inCorso.current) return;
    inCorso.current = true;
    setOccupato(true);
    setErroreScheda(null);
    setMessaggio(null);
    try {
      await passi();
    } finally {
      inCorso.current = false;
      setOccupato(false);
    }
  }

  function accetta(o: Ordine, inizio: string, prezzo: string) {
    // Prima di toccare il server: un giorno passato o un prezzo illeggibile non confermano niente.
    if (!isData(inizio) || inizio < oggiRoma()) {
      setErroreScheda({ id: o.id, testo: "Scegli un giorno da oggi in poi." });
      return;
    }
    const centesimi = leggiEuro(prezzo);
    if (centesimi === undefined) {
      setErroreScheda({ id: o.id, testo: "Il prezzo non si legge: scrivi per esempio 12,50, oppure lascia il campo vuoto." });
      return;
    }
    void lavora(async () => {
      try {
        await api.modificaOrdine(o.id, {
          status: "confirmed",
          productionDate: inizio,
          fulfillmentDate: inizio,
          expectedStatus: "requested",
          notify: true,
        });
      } catch (e) {
        if (e instanceof ApiError && e.status === 409) {
          await ricarica();
          setMessaggio({ testo: MESSAGGIO_GIA_AGGIORNATO, errore: true });
        } else {
          setErroreScheda({ id: o.id, testo: messaggioDi(e) });
        }
        return;
      }

      // Da qui l'ordine e' accettato: sparisce subito dalla lista, anche se la ricarica andasse male.
      togliNuovo(o.id);
      const prezzoScritto = centesimi !== null;
      let esito: EsitoAccettazione = "in-settimana";
      try {
        await mettiNellaSettimana(o.id, inizio, centesimi);
      } catch (e) {
        esito = e instanceof ApiError && e.status === 400 ? "giorno-passato" : "da-completare";
      }

      const dati = await ricarica();
      const testo = testoAccettazione(o.service, esito, prezzoScritto);
      if (esito === "giorno-passato") {
        setMessaggio({ testo, errore: false });
        return;
      }
      if (o.service === "abbonamento") {
        const clienteId = clienteDelOrdine(dati?.clienti ?? [], o)?.id;
        if (clienteId) {
          // Si apre la settimana in cui parte l'abbonamento (il giorno d'inizio scelto), non quella di oggi.
          vai({ tipo: "cliente", clienteId, settimana: lunediDi(inizio) });
          avvisa(testo);
          return;
        }
      }
      cambiaGiorno(inizio);
      vai({ tipo: "giorno" });
      avvisa(testo);
    });
  }

  function rifiuta(o: Ordine) {
    void lavora(async () => {
      try {
        await api.modificaOrdine(o.id, { status: "cancelled", notify: true, expectedStatus: "requested" });
      } catch (e) {
        if (e instanceof ApiError && e.status === 409) {
          await ricarica();
          setMessaggio({ testo: MESSAGGIO_GIA_AGGIORNATO, errore: true });
        } else {
          setErroreScheda({ id: o.id, testo: messaggioDi(e) });
        }
        return;
      }
      togliNuovo(o.id);
      await ricarica();
      setMessaggio({ testo: "Ordine rifiutato. Il cliente riceve un'email.", errore: false });
    });
  }

  if (nuovi === null) {
    return (
      <>
        <h1 className="pm-titolo">Ordini nuovi</h1>
        {erroreCaricamento ? (
          <Errore
            messaggio={erroreCaricamento.messaggio}
            riprova={erroreCaricamento.accesso ? undefined : () => void ricarica()}
            accesso={erroreCaricamento.accesso}
          />
        ) : (
          <p className="pm-carico" role="status">Carico…</p>
        )}
      </>
    );
  }

  return (
    <>
      <h1 className="pm-titolo">
        Ordini nuovi
        {nuovi.length > 0 && <span className="pm-numero">{nuovi.length}</span>}
      </h1>
      {messaggio && (messaggio.errore ? <Errore messaggio={messaggio.testo} /> : <Avviso>{messaggio.testo}</Avviso>)}
      {nuovi.length === 0 && <Avviso>Nessun ordine nuovo.</Avviso>}
      {nuovi.map((o) => (
        <Scheda
          key={o.id}
          ordine={o}
          occupato={occupato}
          errore={erroreScheda?.id === o.id ? erroreScheda.testo : null}
          accetta={(inizio, prezzo) => accetta(o, inizio, prezzo)}
          rifiuta={() => rifiuta(o)}
        />
      ))}
    </>
  );
}

function Scheda({ ordine: o, occupato, errore, accetta, rifiuta }: {
  ordine: Ordine;
  occupato: boolean;
  errore: string | null;
  accetta: (inizio: string, prezzo: string) => void;
  rifiuta: () => void;
}) {
  const [modo, setModo] = useState<"scelta" | "accetta" | "rifiuta">("scelta");
  const [inizio, setInizio] = useState("");
  const [prezzo, setPrezzo] = useState("");

  const oggi = oggiRoma();
  // La data la chiede il modulo solo se il cliente non ne ha scelta una valida.
  const chiedeGiorno = !o.requested_date || o.requested_date < oggi;
  const waHref = linkWhatsAppCliente(o.phone, o.customer_name);
  const chiamaHref = linkChiama(o.phone);
  const piatti = piattiRaggruppati(o.items);
  const luogo = [o.address, o.comune].filter(Boolean).join(", ");

  const pillole = [
    // Dell'abbonamento Matteo deve sapere la formula (e la fascia) per cucinare: "Abbonamento mensile · Completo · Plus".
    o.service === "abbonamento" ? `${ETICHETTE_SERVIZIO[o.service]} · ${nomeAbbonamento(o)}` : ETICHETTE_SERVIZIO[o.service],
    o.meals > 0 ? (o.meals === 1 ? "1 pasto" : `${o.meals} pasti`) : null,
    o.fulfillment === "delivery" ? (luogo ? `Consegna · ${luogo}` : "Consegna") : "Ritiro",
    o.requested_date ? `da ${dataBreve(o.requested_date)}` : "data da decidere",
  ].filter((p): p is string => Boolean(p));

  function apriAccetta() {
    setInizio(giornoDiInizioProposto(o.requested_date, oggi));
    setPrezzo(centesimiInTesto(prezzoPastoProposto(o)));
    setModo("accetta");
  }

  return (
    <article className="pm-ordine" aria-label={o.customer_name}>
      <h2>{o.customer_name}</h2>
      <p className="pm-ordine-tel">{o.phone}</p>
      <ul className="pm-chips">
        {pillole.map((p) => <li key={p} className="pm-chip">{p}</li>)}
      </ul>
      {piatti.length > 0 && <p className="pm-ordine-piatti">{piatti.join(" · ")}</p>}
      {o.dietary_preferences && <p className="pm-ordine-nota">Allergie e preferenze: {o.dietary_preferences}</p>}
      {o.notes && <p className="pm-ordine-nota">Nota: “{o.notes}”</p>}

      {(waHref || chiamaHref) && (
        <div className="pm-bottoni">
          {waHref && <a className="pm-bottone pm-bottone-whatsapp" href={waHref} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
          {chiamaHref && <a className="pm-bottone pm-bottone-chiaro" href={chiamaHref}>Chiama</a>}
        </div>
      )}

      {modo === "scelta" && (
        <div className="pm-bottoni">
          <Bottone variante="verde" disabled={occupato} onClick={apriAccetta}>Accetta</Bottone>
          <Bottone variante="rosso-chiaro" disabled={occupato} onClick={() => setModo("rifiuta")}>Rifiuta</Bottone>
        </div>
      )}

      {modo === "accetta" && (
        <form
          className="pm-ordine-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            accetta(inizio, prezzo);
          }}
        >
          {chiedeGiorno && (
            <label className="pm-campo">
              <span>Da che giorno?</span>
              <input type="date" min={oggi} value={inizio} onChange={(e) => setInizio(e.target.value)} />
            </label>
          )}
          <label className="pm-campo">
            <span>Quanto paga a pasto (€) — facoltativo</span>
            <input type="text" inputMode="decimal" placeholder="12,50" value={prezzo} onChange={(e) => setPrezzo(e.target.value)} />
          </label>
          <div className="pm-bottoni">
            <Bottone type="submit" variante="verde" disabled={occupato}>Conferma</Bottone>
            <Bottone variante="tenue" disabled={occupato} onClick={() => setModo("scelta")}>Annulla</Bottone>
          </div>
        </form>
      )}

      {modo === "rifiuta" && (
        <div className="pm-ordine-form">
          <p className="pm-domanda">Sei sicuro? Il cliente riceve un&apos;email.</p>
          <div className="pm-bottoni">
            <Bottone variante="rosso" disabled={occupato} onClick={rifiuta}>Sì, rifiuta</Bottone>
            <Bottone variante="tenue" disabled={occupato} onClick={() => setModo("scelta")}>No</Bottone>
          </div>
        </div>
      )}

      {errore && <Errore messaggio={errore} />}
    </article>
  );
}
