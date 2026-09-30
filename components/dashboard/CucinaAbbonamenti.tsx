/* "Consegne in abbonamento": la parte del foglio cucina per gli abbonamenti che
   consegnano (o hanno il ritiro) in questo giorno. Ogni abbonamento ha una
   consegna ogni 3 giorni e porta i pasti dei tre giorni coperti: qui si vede
   per chi, quale consegna e', cosa contiene giorno per giorno con il piatto
   indicato dal cliente (se c'e'), preferenze e allergie in rosso e le note
   della scheda: sono quelle che dicono a Matteo come comporre i pasti. */

import Link from "next/link";
import type { Ordine } from "@/lib/api";
import { contaPastiAbbonamenti, nomeAbbonamento, pastiDaComporre } from "@/lib/produzione";
import { PastiConsegna, dove, fraseConsegna } from "./AbbonamentoConsegna";

export default function CucinaAbbonamenti({ abbonamenti, giorno }: { abbonamenti: Ordine[]; giorno: string }) {
  if (!abbonamenti.length) return null;
  const pasti = contaPastiAbbonamenti(abbonamenti, giorno);
  const daComporre = pastiDaComporre(abbonamenti, giorno);
  return (
    <section aria-labelledby="cu-abbonamenti" className="cu-abbonamenti grid gap-3">
      <h3 id="cu-abbonamenti" className="cu-h3">
        Consegne in abbonamento{" "}
        <span className="cu-h3-nota">
          · {abbonamenti.length} {abbonamenti.length === 1 ? "consegna" : "consegne"} · {pasti} {pasti === 1 ? "pasto" : "pasti"}
        </span>
      </h3>
      <p className="cu-riga-nota">
        {daComporre
          ? `${daComporre === pasti ? "Tutti i pasti sono da comporre" : `${daComporre} pasti su ${pasti} sono da comporre`} sulla scheda del cliente: il piatto lo scegli tu.`
          : "Ogni cliente ha indicato il piatto di ogni pasto: lo trovi anche nella spesa e nelle etichette."}
      </p>
      <ul className="cu-abbonamenti-lista">
        {abbonamenti.map((o) => (
          <li key={o.id} className="cu-abbonamento">
            <p className="cu-abbonamento-testa">
              <strong>{o.customer_name || o.email}</strong>
              <span className="cu-riga-nota">
                {dove(o)} · {nomeAbbonamento(o)}
              </span>
            </p>
            <p className="cu-riga-nota">{fraseConsegna(o, giorno)}</p>
            <PastiConsegna o={o} giorno={giorno} />
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
        ))}
      </ul>
    </section>
  );
}
