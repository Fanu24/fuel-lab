"use client";

/* Numeri: come va FUEL LAB in un periodo (7, 30 o 90 giorni). Un solo filtro,
   in alto, che vale per tutto quello che sta sotto; mentre arrivano i dati
   nuovi i grafici vecchi restano al loro posto, sbiaditi, senza salti. */

import { useEffect, useState } from "react";
import { STATI_ORDINE, adminApi, euro, type Metriche } from "@/lib/api";
import { FORMULE } from "@/lib/abbonamento";
import { getPiatto } from "@/lib/catalogo";
import { euroTondo, somma } from "@/lib/produzione";
import { ErroreCaricamento, eSessioneScaduta } from "./ClientiErrore";
import GraficoBarre from "./GraficoBarre";
import GraficoGiorni from "./GraficoGiorni";
import { Caricamento, Kpi, Sezione, Stato, TestaPagina, Vuoto } from "./ui";

const INTERVALLI = [7, 30, 90] as const;

const numero = (n: number) => new Intl.NumberFormat("it-IT").format(n);

const PAGINE: Record<string, string> = {
  "/": "Home",
  "/menu": "Menu",
  "/settimana": "Componi la settimana",
  "/servizi": "Servizi",
  "/come-funziona": "Come funziona",
  "/chi-siamo": "Chi siamo",
  "/chi-e-matteo": "Chi è Matteo (vecchio indirizzo)",
  "/abbonamento": "Abbonamento",
  "/meal-prep-pescara": "Meal prep a Pescara",
  "/consegna-pasti-pescara": "Consegna pasti a Pescara",
  "/pasti-proteici-pescara": "Pasti proteici a Pescara",
  "/cuoco-a-domicilio-pescara": "Cuoco a domicilio a Pescara",
  "/blog": "Blog",
  "/richiesta": "Richiesta",
  "/scheda": "Scheda",
  "/account": "Area cliente",
  "/accedi": "Accedi",
  "/privacy": "Privacy",
};

/** "/menu/noodles-sesamo-maiale/" -> "Piatto: Noodles sesamo…". Null se non la conosciamo. */
function nomePagina(percorso: string) {
  const p = percorso.length > 1 ? percorso.replace(/\/+$/, "") : percorso;
  if (PAGINE[p]) return PAGINE[p];
  const piatto = p.match(/^\/menu\/([^/]+)$/);
  if (piatto) return `Piatto: ${getPiatto(piatto[1])?.nome ?? piatto[1]}`;
  // Le cinque schede degli abbonamenti: /abbonamento/completo -> "Abbonamento Completo".
  const scheda = p.match(/^\/abbonamento\/([^/]+)$/);
  const formula = scheda ? FORMULE.find((f) => f.id === scheda[1]) : undefined;
  if (formula) return `Abbonamento ${formula.nome}`;
  if (p.startsWith("/blog/")) return "Articolo del blog";
  return null;
}

export default function Statistiche() {
  const [giorni, setGiorni] = useState<(typeof INTERVALLI)[number]>(30);
  const [tentativo, setTentativo] = useState(0);
  const [dati, setDati] = useState<Metriche | null>(null);
  const [errore, setErrore] = useState("");
  const [sessione, setSessione] = useState(false);
  const [caricando, setCaricando] = useState(true);

  useEffect(() => {
    let vivo = true;
    adminApi.metriche(giorni).then(
      (r) => {
        if (!vivo) return;
        setDati(r);
        setErrore("");
        setSessione(false);
        setCaricando(false);
      },
      (e: unknown) => {
        if (!vivo) return;
        setErrore(e instanceof Error ? e.message : "Non riesco a caricare i numeri.");
        setSessione(eSessioneScaduta(e));
        // I numeri di un altro periodo non restano sotto il bottone "Ultimi 90 giorni" appena scelto: o sono questi o niente.
        setDati((corrente) => (corrente?.days === giorni ? corrente : null));
        setCaricando(false);
      },
    );
    return () => {
      vivo = false;
    };
  }, [giorni, tentativo]);

  function scegli(g: (typeof INTERVALLI)[number]) {
    if (g === giorni) return;
    setGiorni(g);
    setCaricando(true);
  }
  function riprova() {
    setTentativo((t) => t + 1);
    setCaricando(true);
  }

  return (
    <div className="grid gap-8">
      <TestaPagina occhiello="Pannello · Numeri" titolo="Numeri" sotto="Richieste, clienti, visite e soldi, giorno per giorno." />

      <fieldset className="gr-filtro">
        <legend className="cu-legenda">Periodo</legend>
        <div className="flex flex-wrap gap-2">
          {INTERVALLI.map((g) => (
            <button key={g} type="button" className="cu-prossimo" aria-pressed={giorni === g} onClick={() => scegli(g)}>
              Ultimi {g} giorni
            </button>
          ))}
        </div>
      </fieldset>

      {errore ? (
        <div className="grid gap-3">
          <ErroreCaricamento testo={errore} sessioneScaduta={sessione} />
          {sessione ? null : (
            <button type="button" className="btn btn-ink btn-sm justify-self-start" onClick={riprova} disabled={caricando}>
              Riprova
            </button>
          )}
        </div>
      ) : null}

      {dati === null ? (
        errore ? null : <Caricamento testo="Carico i numeri…" />
      ) : (
        <Cruscotto dati={dati} caricando={caricando} />
      )}
    </div>
  );
}

function Cruscotto({ dati, caricando }: { dati: Metriche; caricando: boolean }) {
  const richieste = somma(dati.ordersDaily, (d) => d.orders);
  const pasti = somma(dati.ordersDaily, (d) => d.meals);
  const visite = somma(dati.traffic, (d) => d.views);
  const periodo = `negli ultimi ${dati.days} giorni`;
  const perStato = new Map(dati.ordersByStatus.map((s) => [s.status, s.count]));

  return (
    <div className={`grid gap-12 transition-opacity ${caricando ? "opacity-50" : ""}`} aria-busy={caricando}>
      <p className="sr-only" aria-live="polite">
        {caricando ? "Aggiorno i numeri…" : `Numeri ${periodo}.`}
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Richieste" valore={numero(richieste)} nota={`${periodo}, annullate escluse`} />
        <Kpi label="Pasti richiesti" valore={numero(pasti)} nota={`${periodo}, annullate escluse`} />
        <Kpi label="Nuovi clienti" valore={numero(dati.newCustomers)} nota={`${numero(dati.customers)} ${dati.customers === 1 ? "cliente" : "clienti"} in tutto`} />
        <Kpi label="Visite" valore={numero(visite)} nota="solo chi accetta Analytics" />
        <Kpi
          label="Incassato"
          valore={<span className="cu-kpi-soldi">{euroTondo(dati.revenue.paidCents)}</span>}
          nota={`su ${euro(dati.revenue.agreedCents)} concordati`}
          tono="ok"
        />
        <Kpi
          label="Da incassare"
          valore={<span className="cu-kpi-soldi">{euroTondo(dati.revenue.unpaidCents)}</span>}
          nota="ordini del periodo non ancora pagati"
          tono={dati.revenue.unpaidCents > 0 ? "attenzione" : "neutro"}
        />
        <Kpi
          label="Messaggi nuovi"
          valore={numero(dati.messagesNew)}
          nota={dati.messagesNew ? "da leggere: apri la posta" : "posta in ordine"}
          tono={dati.messagesNew ? "attenzione" : "neutro"}
          href="/dashboard/messaggi"
        />
      </div>

      <Sezione titolo="Richieste" id="gr-richieste" sotto="Quante richieste arrivano dal sito e quanti pasti contengono. Le annullate non contano.">
        <div className="grid gap-6 pt-4 lg:grid-cols-2">
          <GraficoGiorni
            titolo="Richieste al giorno"
            dati={dati.ordersDaily.map((d) => ({ giorno: d.day, valore: d.orders }))}
            unita={["richiesta", "richieste"]}
          />
          <GraficoGiorni
            titolo="Pasti richiesti al giorno"
            dati={dati.ordersDaily.map((d) => ({ giorno: d.day, valore: d.meals }))}
            unita={["pasto", "pasti"]}
          />
        </div>
      </Sezione>

      <Sezione titolo="Visite e iscrizioni" id="gr-visite">
        <div className="grid gap-6 pt-4 lg:grid-cols-2">
          <div className="grid content-start gap-3">
            <GraficoGiorni
              titolo="Visite al giorno"
              dati={dati.traffic.map((d) => ({ giorno: d.day, valore: d.views }))}
              unita={["visita", "visite"]}
              forma="linea"
            />
            <p className="gr-nota">
              Le visite contano solo chi ha accettato i cookie di Analytics nel banner: le persone vere sul sito sono di più. Servono per
              vedere l’andamento, non il numero esatto.
            </p>
          </div>
          <GraficoGiorni
            titolo="Iscrizioni al giorno"
            dati={dati.signupsDaily.map((d) => ({ giorno: d.day, valore: d.count }))}
            unita={["iscrizione", "iscrizioni"]}
          />
        </div>
      </Sezione>

      <Sezione titolo="Ordini e piatti" id="gr-ordini">
        <div className="grid gap-6 pt-4 lg:grid-cols-2">
          <GraficoBarre
            titolo="Stati degli ordini"
            sotto="Dove sono adesso gli ordini arrivati nel periodo, nell’ordine del lavoro. Qui ci sono anche gli annullati."
            dati={STATI_ORDINE.map((s) => ({ chiave: s.id, etichetta: <Stato stato={s.id} />, valore: perStato.get(s.id) ?? 0 }))}
            unita={["ordine", "ordini"]}
            vuoto="Nessun ordine in questo periodo."
          />
          <GraficoBarre
            titolo="Piatti più richiesti"
            sotto="Porzioni richieste per piatto, annullate escluse."
            dati={[...dati.topDishes]
              .sort((a, b) => b.count - a.count)
              .slice(0, 10)
              .map((p) => ({ chiave: p.name, etichetta: p.name, valore: p.count }))}
            unita={["porzione", "porzioni"]}
            vuoto="Nessun piatto richiesto in questo periodo."
          />
        </div>
      </Sezione>

      <Sezione titolo="Pagine più viste" id="gr-pagine" sotto="Solo visitatori che hanno accettato Analytics.">
        {dati.topPages.length ? (
          <div className="overflow-x-auto pt-2">
            <table className="gr-tabella gr-tabella-grande">
              <thead>
                <tr>
                  <th scope="col">Pagina</th>
                  <th scope="col" className="text-right">
                    Visite
                  </th>
                </tr>
              </thead>
              <tbody>
                {dati.topPages.map((p) => {
                  const nome = nomePagina(p.path);
                  return (
                    <tr key={p.path}>
                      <th scope="row">
                        {nome ? <span className="gr-pagina-nome">{nome}</span> : null}
                        <span className="gr-percorso">{p.path}</span>
                      </th>
                      <td className="num text-right">{numero(p.views)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Vuoto>Nessuna visita registrata in questo periodo.</Vuoto>
        )}
      </Sezione>
    </div>
  );
}
