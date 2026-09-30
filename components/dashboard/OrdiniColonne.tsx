"use client";

/* La vista "a colonne": una colonna per stato, in ordine di lavoro. Niente
   trascinamento: ogni carta ha il bottone del passo successivo (se mancano le
   date apre la scheda, dove il pannello le propone). */

import type { Ordine, StatoOrdine } from "@/lib/api";
import { inRitardo, nomeProprio, perStato, prossimaAzioneDi, servonoDate } from "@/lib/operazioni";
import { eAbbonamento } from "@/lib/produzione";
import { DateOrdine, RiepilogoOrdine } from "./OrdiniElenco";
import { fraseAvviso, usePannello } from "./PannelloDati";
import type { useAzioniVeloci } from "./PannelloStato";
import { SegnoAbbonamento, Stato } from "./ui";

type Veloci = ReturnType<typeof useAzioniVeloci>;

export default function OrdiniColonne({
  ordini,
  stati,
  oggi,
  apri,
  veloci,
}: {
  ordini: Ordine[];
  stati: readonly StatoOrdine[];
  oggi: string;
  apri: (id: string) => void;
  veloci: Veloci;
}) {
  return (
    <div className="pn-colonne">
      {perStato(ordini, stati).map((c) => (
        <section key={c.stato} className="pn-colonna" aria-labelledby={`colonna-${c.stato}`}>
          <div className="pn-colonna-testa">
            <h2 id={`colonna-${c.stato}`} className="font-ui text-base normal-case tracking-normal">
              <Stato stato={c.stato} grande />
            </h2>
            <span className="num text-lg font-bold" aria-label={c.ordini.length === 1 ? "1 ordine" : `${c.ordini.length} ordini`}>{c.ordini.length}</span>
          </div>
          {c.ordini.length ? (
            <ul>
              {c.ordini.map((o) => (
                <li key={o.id}>
                  <Carta ordine={o} oggi={oggi} apri={apri} veloci={veloci} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-1 py-4 text-[15px] text-muted">Nessun ordine.</p>
          )}
        </section>
      ))}
    </div>
  );
}

function Carta({ ordine: o, oggi, apri, veloci }: { ordine: Ordine; oggi: string; apri: (id: string) => void; veloci: Veloci }) {
  const { emailAttiva } = usePannello();
  const azione = prossimaAzioneDi(o, oggi);
  const abbonamento = eAbbonamento(o);
  const mancanoDate = !!azione && servonoDate(azione.stato) && (!o.production_date || !o.fulfillment_date);
  const nome = nomeProprio(o.customer_name) || "Cliente";
  return (
    <article className="pn-carta" aria-label={o.customer_name || "Cliente senza nome"}>
      <button type="button" className="pn-nome text-[17px]" onClick={() => apri(o.id)}>
        {o.customer_name || "Cliente senza nome"}
      </button>
      <p className="text-[15px] text-muted">
        <RiepilogoOrdine ordine={o} />
      </p>
      <p className="text-[15px]">
        <DateOrdine ordine={o} oggi={oggi} />
      </p>
      {abbonamento || inRitardo(o, oggi) || o.dietary_preferences?.trim() ? (
        <p className="flex flex-wrap gap-2">
          {abbonamento ? <SegnoAbbonamento ordine={o} /> : null}
          {inRitardo(o, oggi) ? <span className="pn-segno pn-segno-allarme">{abbonamento && o.status !== "requested" ? "Mese finito" : "In ritardo"}</span> : null}
          {o.dietary_preferences?.trim() ? <span className="pn-segno pn-segno-allarme">Allergie</span> : null}
        </p>
      ) : null}
      {azione ? (
        <button
          type="button"
          className={`pn-tasto w-full ${mancanoDate ? "" : "pn-tasto-lime"}`}
          disabled={veloci.inCorso === o.id}
          onClick={() =>
            mancanoDate
              ? apri(o.id)
              : void veloci.modifica(o, { status: azione.stato, notify: true }, `${nome}: ${azione.fatto.toLowerCase()}. ${fraseAvviso(emailAttiva)}`)
          }
        >
          {veloci.inCorso === o.id ? "Salvo…" : mancanoDate ? (o.status === "requested" ? `${azione.verbo}…` : "Assegna le date") : azione.verbo}
        </button>
      ) : null}
    </article>
  );
}
