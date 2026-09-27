"use client";

/* La scheda di un cliente (/dashboard/clienti?id=...): contatti, allergie in
   evidenza, i suoi numeri e i suoi ordini con il link a ciascuno. */

import Link from "next/link";
import { ETICHETTE_SERVIZIO, daSqlite, euro, type ClienteAdmin, type Ordine } from "@/lib/api";
import { euroTondo } from "@/lib/produzione";
import { BottoniContatto } from "./ClientiContatti";
import { Avviso, Caricamento, Kpi, Sezione, Stato, TestaPagina, Vuoto, faTempo, giorno, quando } from "./ui";

function dataLunga(ts: string | null | undefined) {
  if (!ts) return "—";
  const d = daSqlite(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Rome" }).format(d);
}

/** Meno di 30 giorni fa: allora "3 giorni fa" aggiunge qualcosa alla data. */
function recente(ts: string) {
  const t = daSqlite(ts).getTime();
  return !Number.isNaN(t) && Date.now() - t < 30 * 86_400_000;
}

export default function ClientiScheda({
  id,
  cliente,
  clientiCaricati,
  errore,
  ordini,
  erroreOrdini,
  caricando,
  onRicarica,
}: {
  id: string;
  cliente: ClienteAdmin | null;
  clientiCaricati: boolean;
  errore: string;
  ordini: Ordine[] | null;
  erroreOrdini: string;
  caricando: boolean;
  onRicarica: () => void;
}) {
  const indietro = (
    <Link href="/dashboard/clienti" className="link inline-block">
      ← Tutti i clienti
    </Link>
  );

  if (!cliente) {
    return (
      <div className="grid gap-6">
        {indietro}
        {errore ? (
          <>
            <Avviso>{errore}</Avviso>
            <button type="button" className="btn btn-ink btn-sm justify-self-start" onClick={onRicarica} disabled={caricando}>
              Riprova
            </button>
          </>
        ) : clientiCaricati ? (
          <Avviso tipo="info">
            Non trovo questo cliente (codice {id}). Forse ha cancellato l’account: torna all’elenco.
          </Avviso>
        ) : (
          <Caricamento testo="Carico la scheda del cliente…" />
        )}
      </div>
    );
  }

  const nome = cliente.name || cliente.email;
  const primoNome = cliente.name.split(" ")[0] ?? "";
  const ordinati = ordini ? [...ordini].sort((a, b) => b.created_at.localeCompare(a.created_at)) : null;
  const mancanti = ordinati ? Math.max(0, cliente.orders - ordinati.length) : 0;

  return (
    <div className="grid gap-8">
      {indietro}
      <TestaPagina
        occhiello="Scheda cliente"
        titolo={nome}
        sotto={`Cliente dal ${dataLunga(cliente.createdAt)}${recente(cliente.createdAt) ? ` (${faTempo(cliente.createdAt)})` : ""}`}
        azioni={
          <BottoniContatto nome={nome} telefono={cliente.phone} email={cliente.email} testoWhatsApp={`Ciao ${primoNome}, sono Matteo di FUEL LAB. `} />
        }
      />

      {cliente.preferences?.trim() ? (
        <section aria-labelledby="cl-pref" className="cu-attenzione">
          <h2 id="cl-pref" className="cu-h3">Preferenze e allergie</h2>
          <p className="cl-pref-testo">{cliente.preferences}</p>
        </section>
      ) : (
        <p className="cu-riga-nota">Nessuna preferenza o allergia indicata nel profilo.</p>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Ordini" valore={cliente.orders} />
        <Kpi label="Aperti" valore={cliente.activeOrders} tono={cliente.activeOrders ? "attenzione" : "neutro"} />
        <Kpi label="Pasti" valore={cliente.meals} />
        <Kpi
          label="Speso"
          valore={<span className="cu-kpi-soldi">{euroTondo(cliente.spentCents)}</span>}
          nota={`${euro(cliente.spentCents)}: ordini con prezzo, non annullati`}
        />
      </div>

      <Sezione titolo="Profilo" id="cl-profilo">
        <dl className="cl-profilo">
          <div>
            <dt>Email</dt>
            <dd>
              <span className="break-all">{cliente.email}</span>{" "}
              {cliente.emailVerified ? <span className="cl-ok">verificata</span> : <span className="cl-bollino">non verificata</span>}
            </dd>
          </div>
          <div>
            <dt>Telefono</dt>
            <dd>{cliente.phone || "Non indicato"}</dd>
          </div>
          <div>
            <dt>Comune</dt>
            <dd>{cliente.comune || "Non indicato"}</dd>
          </div>
          <div>
            <dt>Indirizzo</dt>
            <dd>{cliente.address || "Non indicato"}</dd>
          </div>
          <div>
            <dt>Ultimo ordine</dt>
            <dd>{cliente.lastOrderAt ? `${quando(cliente.lastOrderAt)} (${faTempo(cliente.lastOrderAt)})` : "Mai"}</dd>
          </div>
          <div>
            <dt>Settimana salvata</dt>
            <dd>{cliente.hasSavedPlan ? "Sì, ha un piano salvato nel suo account" : "No"}</dd>
          </div>
        </dl>
      </Sezione>

      <Sezione
        titolo="Ordini"
        id="cl-ordini"
        sotto={mancanti ? `Qui compaiono gli ordini aperti e gli ultimi chiusi del sito: ${mancanti} più vecchi non sono in elenco.` : undefined}
      >
        {erroreOrdini ? (
          <Avviso>{erroreOrdini}</Avviso>
        ) : ordinati === null ? (
          <Caricamento testo="Carico gli ordini…" />
        ) : ordinati.length ? (
          <ul className="cl-ordini">
            {ordinati.map((o) => (
              <li key={o.id} className="cl-ordine">
                <div className="grid gap-1">
                  <p className="cl-ordine-titolo">
                    {ETICHETTE_SERVIZIO[o.service] ?? o.service} · {o.meals} {o.meals === 1 ? "pasto" : "pasti"}
                  </p>
                  <p className="cu-riga-nota">
                    Richiesto {quando(o.created_at)} · {o.fulfillment === "pickup" ? "ritiro" : "consegna"} {giorno(o.fulfillment_date, "da fissare")}
                    {o.price_cents !== null ? ` · ${euro(o.price_cents)}${o.paid ? " pagato" : " da pagare"}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Stato stato={o.status} />
                  <Link
                    href={`/dashboard/ordini?id=${encodeURIComponent(o.id)}`}
                    className="btn btn-linea btn-sm"
                    aria-label={`Apri l’ordine del ${quando(o.created_at)}`}
                  >
                    Apri
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Vuoto>{cliente.orders ? "Gli ordini di questo cliente sono troppo vecchi per comparire qui." : "Non ha ancora fatto ordini."}</Vuoto>
        )}
      </Sezione>
    </div>
  );
}
