"use client";

/* L'elenco dei clienti: tre numeri in alto, poi ricerca, filtro e ordinamento,
   poi una riga per cliente con i contatti a un tocco. Esporta in CSV quello
   che si sta guardando (filtro e ricerca compresi). */

import Link from "next/link";
import { useMemo, useState } from "react";
import { daSqlite, euro, type ClienteAdmin } from "@/lib/api";
import {
  clientiCsv,
  filtraClienti,
  nuoviClienti,
  oggiRoma,
  type FiltroClienti,
  type OrdineClienti,
} from "@/lib/produzione";
import { BottoniContatto } from "./ClientiContatti";
import { Avviso, Caricamento, Kpi, TestaPagina, Vuoto, faTempo } from "./ui";

const FILTRI: { id: FiltroClienti; label: string }[] = [
  { id: "tutti", label: "Tutti" },
  { id: "aperti", label: "Con ordini aperti" },
  { id: "senza-ordini", label: "Senza ordini" },
  { id: "non-verificati", label: "Email non verificata" },
];

const ORDINAMENTI: { id: OrdineClienti; label: string }[] = [
  { id: "recenti", label: "Più recenti (iscrizione o ordine)" },
  { id: "ordini", label: "Più ordini" },
  { id: "spesa", label: "Più spesa" },
  { id: "nome", label: "Nome (A-Z)" },
];

const PER_PAGINA = 60;

/** "3 giorni fa" nel primo mese, poi la data ("12 ago 2026"): l'ora non serve. */
function ultimoOrdine(ts: string | null) {
  if (!ts) return "Mai";
  const d = daSqlite(ts);
  if (Number.isNaN(d.getTime())) return "—";
  if (Date.now() - d.getTime() < 30 * 86_400_000) return faTempo(ts);
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Rome" }).format(d);
}

function scaricaCsv(nomeFile: string, testo: string) {
  const blob = new Blob([testo], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeFile;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function ClientiElenco({
  clienti,
  errore,
  caricando,
  onRicarica,
  cerca,
  onCerca,
  filtro,
  onFiltro,
  ordine,
  onOrdine,
}: {
  clienti: ClienteAdmin[] | null;
  errore: string;
  caricando: boolean;
  onRicarica: () => void;
  cerca: string;
  onCerca: (v: string) => void;
  filtro: FiltroClienti;
  onFiltro: (v: FiltroClienti) => void;
  ordine: OrdineClienti;
  onOrdine: (v: OrdineClienti) => void;
}) {
  const [quanti, setQuanti] = useState(PER_PAGINA);
  const tutti = useMemo(() => clienti ?? [], [clienti]);
  const visibili = useMemo(() => filtraClienti(tutti, { cerca, filtro, ordine }), [tutti, cerca, filtro, ordine]);
  const conteggi = useMemo(
    () => Object.fromEntries(FILTRI.map((f) => [f.id, filtraClienti(tutti, { filtro: f.id }).length])) as Record<FiltroClienti, number>,
    [tutti],
  );
  const nuovi = useMemo(() => nuoviClienti(tutti, 30), [tutti]);

  const esporta = () => scaricaCsv(`clienti-fuellab-${oggiRoma()}.csv`, clientiCsv(visibili));

  return (
    <div className="grid gap-8">
      <TestaPagina
        occhiello="Pannello · Clienti"
        titolo="Clienti"
        sotto="Chi si è iscritto al sito, come contattarlo e cosa ha ordinato."
        azioni={
          <>
            <button type="button" className="btn btn-linea btn-sm" onClick={onRicarica} disabled={caricando}>
              {caricando ? "Aggiorno…" : "Aggiorna"}
            </button>
            <button type="button" className="btn btn-ink btn-sm" onClick={esporta} disabled={!visibili.length}>
              Esporta CSV ({visibili.length})
            </button>
          </>
        }
      />

      {errore ? (
        <div className="grid gap-3">
          <Avviso>{errore}</Avviso>
          {clienti === null ? (
            <button type="button" className="btn btn-ink btn-sm justify-self-start" onClick={onRicarica} disabled={caricando}>
              Riprova
            </button>
          ) : null}
        </div>
      ) : null}

      {clienti === null ? (
        errore ? null : <Caricamento testo="Carico i clienti…" />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Kpi label="Clienti" valore={tutti.length} />
            <Kpi label="Nuovi in 30 giorni" valore={nuovi} tono={nuovi ? "ok" : "neutro"} />
            <Kpi label="Con ordini aperti" valore={conteggi.aperti} tono={conteggi.aperti ? "attenzione" : "neutro"} />
          </div>

          <div className="cl-controlli">
            <div className="campo cl-cerca">
              <label htmlFor="cl-cerca">Cerca</label>
              <input
                id="cl-cerca"
                type="search"
                value={cerca}
                onChange={(e) => {
                  onCerca(e.target.value);
                  setQuanti(PER_PAGINA);
                }}
                placeholder="Nome, email, telefono, comune…"
                autoComplete="off"
              />
            </div>
            <div className="campo">
              <label htmlFor="cl-ordina">Ordina per</label>
              <select id="cl-ordina" value={ordine} onChange={(e) => onOrdine(e.target.value as OrdineClienti)}>
                {ORDINAMENTI.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <fieldset className="cl-filtri">
              <legend className="cu-legenda">Mostra</legend>
              <div className="flex flex-wrap gap-2">
                {FILTRI.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className="cu-prossimo cl-filtro"
                    aria-pressed={filtro === f.id}
                    onClick={() => {
                      onFiltro(f.id);
                      setQuanti(PER_PAGINA);
                    }}
                  >
                    {f.label} <span className="num">{conteggi[f.id]}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <p className="cu-conto" aria-live="polite">
            {visibili.length === tutti.length
              ? `${tutti.length} ${tutti.length === 1 ? "cliente" : "clienti"}`
              : `${visibili.length} di ${tutti.length} clienti`}
          </p>

          {visibili.length ? (
            <ul className="cl-elenco">
              {visibili.slice(0, quanti).map((c) => (
                <RigaCliente key={c.id} c={c} />
              ))}
            </ul>
          ) : (
            <Vuoto>
              {tutti.length ? "Nessun cliente corrisponde a ricerca e filtro." : "Ancora nessun cliente iscritto al sito."}
            </Vuoto>
          )}
          {visibili.length > quanti ? (
            <button type="button" className="btn btn-linea btn-sm justify-self-start" onClick={() => setQuanti((n) => n + PER_PAGINA)}>
              Mostra altri {Math.min(PER_PAGINA, visibili.length - quanti)} clienti
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}

function RigaCliente({ c }: { c: ClienteAdmin }) {
  const href = `/dashboard/clienti?id=${encodeURIComponent(c.id)}`;
  const nome = c.name || c.email;
  return (
    <li className="cl-riga">
      <div className="cl-riga-chi">
        <h2 className="cl-nome">
          <Link href={href} className="cl-nome-link">
            {nome}
          </Link>
        </h2>
        <p className="cl-contatti">
          <span className="break-all">{c.email}</span>
          {!c.emailVerified ? <span className="cl-bollino">email non verificata</span> : null}
        </p>
        <p className="cl-contatti">
          {[c.phone || "Telefono non indicato", c.comune].filter(Boolean).join(" · ")}
        </p>
        {c.preferences?.trim() ? (
          <p className="cl-pref">
            <strong>Preferenze:</strong> {c.preferences}
          </p>
        ) : null}
        {/* [&>div]:contents: i bottoni di contatto scorrono nella stessa riga di "Scheda". */}
        <div className="flex flex-wrap gap-2 [&>div]:contents">
          <Link href={href} className="btn btn-ink btn-sm" aria-label={`Apri la scheda di ${nome}`}>
            Scheda
          </Link>
          <BottoniContatto nome={nome} telefono={c.phone} email={c.email} testoWhatsApp={`Ciao ${c.name.split(" ")[0] ?? ""}, sono Matteo di FUEL LAB. `} />
        </div>
      </div>
      <dl className="cl-numeri">
        <div>
          <dt>Ordini</dt>
          <dd>
            <span className="num">{c.orders}</span>
            {c.activeOrders ? <span className="cl-aperti"> · {c.activeOrders} {c.activeOrders === 1 ? "aperto" : "aperti"}</span> : null}
          </dd>
        </div>
        <div>
          <dt>Pasti</dt>
          <dd className="num">{c.meals}</dd>
        </div>
        <div>
          <dt>Ultimo ordine</dt>
          <dd>{ultimoOrdine(c.lastOrderAt)}</dd>
        </div>
        <div>
          <dt>Speso</dt>
          <dd className="num">{euro(c.spentCents)}</dd>
        </div>
      </dl>
    </li>
  );
}
