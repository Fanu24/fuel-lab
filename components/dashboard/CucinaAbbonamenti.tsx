/* "Pranzi in abbonamento": la parte del foglio cucina per gli abbonamenti in
   corso. Quanti pranzi e per chi, con il piatto indicato dal cliente per quel
   giorno (se c'e'), preferenze e allergie in rosso e le note della scheda:
   sono quelle che dicono a Matteo come comporre il pranzo. */

import Link from "next/link";
import type { Ordine } from "@/lib/api";
import { fineAbbonamento } from "@/lib/abbonamento";
import { pranzoInAbbonamento } from "@/lib/produzione";
import { giorno as giornoCorto } from "./ui";

export default function CucinaAbbonamenti({ abbonamenti, giorno }: { abbonamenti: Ordine[]; giorno: string }) {
  if (!abbonamenti.length) return null;
  const daComporre = abbonamenti.filter((o) => !pranzoInAbbonamento(o, giorno)).length;
  return (
    <section aria-labelledby="cu-abbonamenti" className="cu-abbonamenti grid gap-3">
      <h3 id="cu-abbonamenti" className="cu-h3">
        Pranzi in abbonamento <span className="cu-h3-nota">· {abbonamenti.length}</span>
      </h3>
      <p className="cu-riga-nota">
        {daComporre
          ? `${daComporre === abbonamenti.length ? "Tutti da comporre" : `${daComporre} da comporre`} sulla scheda del cliente: il piatto lo scegli tu.`
          : "Ogni cliente ha indicato il piatto di oggi: lo trovi anche nella spesa e nelle etichette."}
      </p>
      <ul className="cu-abbonamenti-lista">
        {abbonamenti.map((o) => {
          const voce = pranzoInAbbonamento(o, giorno);
          return (
            <li key={o.id} className="cu-abbonamento">
              <p className="cu-abbonamento-testa">
                <strong>{o.customer_name || o.email}</strong>
                <span className="cu-riga-nota">
                  {o.fulfillment === "pickup" ? "Ritiro" : `Consegna${o.comune ? ` a ${o.comune}` : ""}`}
                  {o.fulfillment_date ? ` · fino a ${giornoCorto(fineAbbonamento(o.fulfillment_date))}` : ""}
                </span>
              </p>
              <p>
                <span className="cu-abbonamento-etichetta">Pranzo</span>{" "}
                {voce ? (
                  <>
                    {voce.name}
                    {voce.extras.length ? <span className="cu-voce-extra"> + {voce.extras.join(", ")}</span> : null}
                  </>
                ) : (
                  <em>da comporre sulla scheda</em>
                )}
              </p>
              {o.dietary_preferences?.trim() ? (
                <p className="cu-preferenze">
                  <strong>Preferenze e allergie:</strong> {o.dietary_preferences}
                </p>
              ) : null}
              {o.notes?.trim() ? (
                <p className="cu-nota whitespace-pre-line">
                  <strong>La scheda:</strong> {o.notes}
                </p>
              ) : (
                <p className="cu-riga-nota">Nessuna scheda scritta: senti il cliente.</p>
              )}
              <Link
                href={`/dashboard/ordini?id=${encodeURIComponent(o.id)}`}
                className="link justify-self-start text-[15px] print:hidden"
                aria-label={`Apri l’abbonamento di ${o.customer_name || o.email}`}
              >
                Apri l’abbonamento
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
