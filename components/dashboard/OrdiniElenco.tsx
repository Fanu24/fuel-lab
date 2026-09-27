/* La vista "elenco": una riga per ordine, tutta cliccabile. Sul telefono nome
   e prezzo in alto, date sotto; sul computer tre colonne. */

import { euro, type Ordine } from "@/lib/api";
import { aperto, fineDi, inRitardo } from "@/lib/operazioni";
import { eAbbonamento } from "@/lib/produzione";
import { SegnoAbbonamento, Stato, giorno } from "./ui";

export default function OrdiniElenco({ ordini, oggi, apri }: { ordini: Ordine[]; oggi: string; apri: (id: string) => void }) {
  return (
    <ul className="pn-elenco">
      {ordini.map((o) => (
        <li key={o.id}>
          <RigaOrdine ordine={o} oggi={oggi} apri={apri} />
        </li>
      ))}
    </ul>
  );
}

export function DateOrdine({ ordine: o }: { ordine: Ordine }) {
  const uscita = o.fulfillment === "pickup" ? "Ritiro" : "Consegna";
  if (eAbbonamento(o)) {
    // L'abbonamento ha un periodo: dall'inizio confermato a un mese dopo.
    const fine = fineDi(o);
    if (o.status === "requested" || !o.fulfillment_date || !fine) {
      return (
        <>
          Inizio: <strong>{giorno(o.fulfillment_date ?? o.requested_date, o.status === "requested" ? "nessuna data" : "da assegnare")}</strong>
        </>
      );
    }
    return (
      <>
        Dal <strong>{giorno(o.fulfillment_date)}</strong> al <strong>{giorno(fine)}</strong> · {uscita.toLowerCase()}
      </>
    );
  }
  if (o.status === "requested") {
    return (
      <>
        Preferisce: <strong>{giorno(o.requested_date, "nessuna data")}</strong>
      </>
    );
  }
  return (
    <>
      Cucina <strong>{giorno(o.production_date, "da assegnare")}</strong> · {uscita} <strong>{giorno(o.fulfillment_date, "da assegnare")}</strong>
    </>
  );
}

function RigaOrdine({ ordine: o, oggi, apri }: { ordine: Ordine; oggi: string; apri: (id: string) => void }) {
  const ritardo = inRitardo(o, oggi);
  const allergie = !!o.dietary_preferences?.trim();
  const senzaDate = aperto(o) && o.status !== "requested" && (!o.production_date || !o.fulfillment_date);
  const abbonamento = eAbbonamento(o);
  return (
    <button type="button" className="pn-ordine" onClick={() => apri(o.id)}>
      <span className="min-w-0">
        <span className="pn-ordine-nome">{o.customer_name || "Cliente senza nome"}</span>
        <span className="pn-ordine-riga">
          <Stato stato={o.status} ritiro={o.fulfillment === "pickup"} abbonamento={abbonamento} />
          {abbonamento ? <SegnoAbbonamento /> : null}
          {ritardo ? <span className="pn-segno pn-segno-allarme">{abbonamento && o.status !== "requested" ? "Mese finito" : "In ritardo"}</span> : null}
          {senzaDate ? <span className="pn-segno pn-segno-attenzione">Senza date</span> : null}
          {allergie ? <span className="pn-segno pn-segno-allarme">Allergie</span> : null}
          {o.source === "manual" ? <span className="pn-segno pn-segno-neutro">Inserito a mano</span> : null}
        </span>
        <span className="pn-ordine-riga">
          {abbonamento ? "Pranzi lun–ven" : `${o.meals} ${o.meals === 1 ? "pasto" : "pasti"}`} · {o.fulfillment === "pickup" ? "Ritiro" : "Consegna"}
          {o.comune ? ` · ${o.comune}` : ""}
        </span>
      </span>
      <span className="pn-ordine-date">
        <DateOrdine ordine={o} />
      </span>
      <span className="pn-ordine-soldi">
        {o.price_cents !== null ? <strong className="num">{euro(o.price_cents)}</strong> : null}
        {o.price_cents ? (
          o.paid ? (
            <span className="pn-segno pn-segno-ok">Pagato</span>
          ) : o.status === "requested" ? (
            <span className="text-muted">Proposto</span>
          ) : o.status === "cancelled" ? (
            <span className="text-muted">Annullato</span>
          ) : (
            <span className="pn-segno pn-segno-attenzione">Da pagare</span>
          )
        ) : (
          <span className="text-muted">Senza prezzo</span>
        )}
      </span>
    </button>
  );
}
