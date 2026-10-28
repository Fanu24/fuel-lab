"use client";

/* Scheda Ordini: una scheda per ogni ordine da preparare, in ordine di uscita,
   poi una per ogni consegna in abbonamento del giorno. Allergie e preferenze
   in evidenza, i piatti giorno per giorno (per l'abbonamento, i pasti dei tre
   giorni che la consegna copre e la scheda del cliente), e la spunta
   "Imballato" che resta sul telefono (una lista per giorno). */

import Link from "next/link";
import { fineAbbonamento } from "@/lib/abbonamento";
import { euro, ETICHETTE_SERVIZIO, type Ordine } from "@/lib/api";
import { dettaglioAbbonamento, nomeGiornoPasto, pastiInConsegna, vociInOrdine } from "@/lib/produzione";
import { fraseConsegna } from "./AbbonamentoConsegna";
import { BottoniContatto } from "./ClientiContatti";
import { useSpunte } from "./CucinaMemoria";
import { SegnoAbbonamento, Stato, giorno as giornoCorto, giornoLungo } from "./ui";

const INDIRIZZO_RITIRO = "Via del Santuario 214";

export default function CucinaOrdini({ ordini, abbonamenti = [], giorno }: { ordini: Ordine[]; abbonamenti?: Ordine[]; giorno: string }) {
  const { spunte, cambia } = useSpunte(`fuellab:cucina:imballati:${giorno}`);
  const tutti = ordini.length + abbonamenti.length;
  const imballati = [...ordini, ...abbonamenti].filter((o) => spunte.has(o.id)).length;

  return (
    <div className="cu-pagina grid gap-6">
      <p className="cu-conto print:hidden" aria-live="polite">
        <strong className="num">{imballati}</strong> di {tutti} {tutti === 1 ? "scheda imballata" : "schede imballate"}
        {abbonamenti.length ? ` (${abbonamenti.length} ${abbonamenti.length === 1 ? "consegna" : "consegne"} in abbonamento)` : ""}
      </p>
      <ul className="cu-ordini">
        {ordini.map((o) => (
          <SchedaOrdine key={o.id} o={o} imballato={spunte.has(o.id)} onImballato={(v) => cambia(o.id, v)} />
        ))}
        {abbonamenti.map((o) => (
          <SchedaAbbonamento key={o.id} o={o} giorno={giorno} imballato={spunte.has(o.id)} onImballato={(v) => cambia(o.id, v)} />
        ))}
      </ul>
    </div>
  );
}

/**
 * La scheda d'imballo di una consegna in abbonamento: chi, dove, quale consegna
 * e' e i pasti dei tre giorni coperti, con la scheda del cliente. Un Full 7
 * porta 9 pasti: una riga ciascuno, cosi' si imballa spuntando dall'alto.
 */
function SchedaAbbonamento({
  o,
  giorno,
  imballato,
  onImballato,
}: {
  o: Ordine;
  giorno: string;
  imballato: boolean;
  onImballato: (v: boolean) => void;
}) {
  const pasti = pastiInConsegna(o, giorno);
  const titoloId = `cu-abb-${o.id}`;
  const primoNome = o.customer_name.trim().split(/\s+/)[0] ?? "";
  return (
    <li className={`cu-ordine ${imballato ? "is-fatto" : ""}`} aria-labelledby={titoloId}>
      <div className="cu-ordine-testa">
        <h3 id={titoloId} className="cu-ordine-nome">
          {o.customer_name || o.email}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {imballato ? <span className="cu-bollino">Imballato</span> : null}
          <SegnoAbbonamento ordine={o} />
        </div>
      </div>

      <p className="cu-ordine-uscita">
        <strong>{o.fulfillment === "pickup" ? `Ritiro in ${INDIRIZZO_RITIRO}` : "Consegna a domicilio"}</strong>
        {" · "}
        {giornoLungo(giorno)}
      </p>
      {o.fulfillment === "delivery" ? (
        <p className="cu-ordine-indirizzo">{[o.address, o.comune].filter(Boolean).join(", ") || "Indirizzo mancante"}</p>
      ) : null}
      <p className="cu-ordine-uscita">{fraseConsegna(o, giorno)}</p>
      <p className="cu-ordine-contatti">
        {[o.phone, o.email].filter(Boolean).join(" · ")}
        {o.fulfillment_date ? ` · ${dettaglioAbbonamento(o)} · abbonamento fino a ${giornoCorto(fineAbbonamento(o.fulfillment_date))}` : ""}
      </p>
      {o.discount ? <p className="cu-ordine-contatti"><strong>{o.discount.code}: −{o.discount.appliedPercent}%</strong>{o.discount.baseCents === null ? " · Totale da concordare" : ` · Prima dello sconto ${euro(o.discount.baseCents)} · Totale ${euro(o.price_cents)}`}</p> : null}
      <BottoniContatto
        nome={o.customer_name}
        telefono={o.phone}
        email={o.email}
        testoWhatsApp={`Ciao ${primoNome}, sono Matteo di FUEL LAB. `}
      />

      {o.dietary_preferences?.trim() ? (
        <p className="cu-preferenze">
          <strong>Preferenze e allergie:</strong> {o.dietary_preferences}
        </p>
      ) : null}

      <table className="cu-voci">
        <caption className="sr-only">Pasti in abbonamento di {o.customer_name}</caption>
        <thead>
          <tr>
            <th scope="col">Quando</th>
            <th scope="col">Pasto ({pasti.length} {pasti.length === 1 ? "porzione" : "porzioni"})</th>
          </tr>
        </thead>
        <tbody>
          {pasti.map((p) => (
            <tr key={`${p.data}-${p.pasto}`}>
              <td className="cu-voce-quando">{p.quando}</td>
              <td>
                {p.voce ? p.voce.name : "Da comporre sulla scheda"}
                {p.voce?.extras.length ? <span className="cu-voce-extra"> + {p.voce.extras.join(", ")}</span> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {o.notes?.trim() ? (
        <p className="cu-nota whitespace-pre-line">
          <strong>La scheda:</strong> {o.notes}
        </p>
      ) : null}
      {o.internal_note?.trim() ? (
        <p className="cu-nota">
          <strong>Nota interna:</strong> {o.internal_note}
        </p>
      ) : null}

      <div className="cu-ordine-piede">
        <label className="cu-opzione cu-opzione-forte">
          <input type="checkbox" checked={imballato} onChange={(e) => onImballato(e.target.checked)} />
          <span>Imballato</span>
        </label>
        <Link href={`/dashboard/ordini?id=${encodeURIComponent(o.id)}`} className="btn btn-linea btn-sm print:hidden"
          aria-label={`Apri l’abbonamento di ${o.customer_name || o.email}`}
        >
          Apri l’abbonamento
        </Link>
      </div>
    </li>
  );
}

function SchedaOrdine({ o, imballato, onImballato }: { o: Ordine; imballato: boolean; onImballato: (v: boolean) => void }) {
  const voci = vociInOrdine(o.items);
  const titoloId = `cu-ord-${o.id}`;
  const primoNome = o.customer_name.trim().split(/\s+/)[0] ?? "";
  return (
    <li className={`cu-ordine ${imballato ? "is-fatto" : ""}`}>
      <div className="cu-ordine-testa">
        <h3 id={titoloId} className="cu-ordine-nome">
          {o.customer_name || o.email}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {imballato ? <span className="cu-bollino">Imballato</span> : null}
          <Stato stato={o.status} ritiro={o.fulfillment === "pickup"} />
        </div>
      </div>

      <p className="cu-ordine-uscita">
        <strong>{o.fulfillment === "pickup" ? `Ritiro in ${INDIRIZZO_RITIRO}` : "Consegna a domicilio"}</strong>
        {" · "}
        {giornoLungo(o.fulfillment_date, "data di uscita da fissare")}
      </p>
      {o.fulfillment === "delivery" ? (
        <p className="cu-ordine-indirizzo">{[o.address, o.comune].filter(Boolean).join(", ") || "Indirizzo mancante"}</p>
      ) : null}
      <p className="cu-ordine-contatti">
        {[o.phone, o.email].filter(Boolean).join(" · ")}
      </p>
      {o.discount ? <p className="cu-ordine-contatti"><strong>{o.discount.code}: −{o.discount.appliedPercent}%</strong>{o.discount.baseCents === null ? " · Totale da concordare" : ` · Prima dello sconto ${euro(o.discount.baseCents)} · Totale ${euro(o.price_cents)}`}</p> : null}
      <BottoniContatto
        nome={o.customer_name}
        telefono={o.phone}
        email={o.email}
        testoWhatsApp={`Ciao ${primoNome}, sono Matteo di FUEL LAB. `}
      />

      {o.dietary_preferences?.trim() ? (
        <p className="cu-preferenze">
          <strong>Preferenze e allergie:</strong> {o.dietary_preferences}
        </p>
      ) : null}

      {voci.length ? (
        <table className="cu-voci">
          <caption className="sr-only">Piatti di {o.customer_name}</caption>
          <thead>
            <tr>
              <th scope="col">Quando</th>
              <th scope="col">Piatto ({voci.length} {voci.length === 1 ? "porzione" : "porzioni"})</th>
            </tr>
          </thead>
          <tbody>
            {voci.map((v, i) => (
              <tr key={`${v.id}-${i}`}>
                <td className="cu-voce-quando">{nomeGiornoPasto(v)}</td>
                <td>
                  {v.name}
                  {v.extras.length ? <span className="cu-voce-extra"> + {v.extras.join(", ")}</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="cu-riga-nota">
          Nessun piatto dal menu ({ETICHETTE_SERVIZIO[o.service] ?? o.service}): segui gli accordi presi con il cliente.
        </p>
      )}

      {o.notes?.trim() ? (
        <p className="cu-nota">
          <strong>Nota del cliente:</strong> {o.notes}
        </p>
      ) : null}
      {o.internal_note?.trim() ? (
        <p className="cu-nota">
          <strong>Nota interna:</strong> {o.internal_note}
        </p>
      ) : null}

      <div className="cu-ordine-piede">
        <label className="cu-opzione cu-opzione-forte">
          <input type="checkbox" checked={imballato} onChange={(e) => onImballato(e.target.checked)} />
          <span>Imballato</span>
        </label>
        <Link href={`/dashboard/ordini?id=${encodeURIComponent(o.id)}`} className="btn btn-linea btn-sm print:hidden"
          aria-label={`Apri l’ordine di ${o.customer_name || o.email}`}
        >
          Apri l’ordine
        </Link>
      </div>
    </li>
  );
}
