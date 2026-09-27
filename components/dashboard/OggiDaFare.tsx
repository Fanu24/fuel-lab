/* "Da fare adesso": la prima cosa che Matteo vede. Una riga grande per ogni
   cosa da fare, dalla piu' urgente, con un numero colorato a sinistra e un
   verbo chiaro. Le frasi e i link li calcola lib/operazioni.ts. */

import Link from "next/link";
import type { AzioneDaFare } from "@/lib/operazioni";
import { Icona } from "./PannelloIcone";

export default function OggiDaFare({ azioni }: { azioni: AzioneDaFare[] | null }) {
  return (
    <section aria-labelledby="oggi-dafare" className="pn-dafare">
      <div className="pn-dafare-testa">
        <h2 id="oggi-dafare" className="pn-h2">Da fare adesso</h2>
        {azioni?.length ? <span className="text-[15px] text-steel">{azioni.length === 1 ? "1 cosa" : `${azioni.length} cose`}, dalla più urgente</span> : null}
      </div>

      {azioni === null ? (
        <ul aria-hidden="true">
          {[0, 1].map((i) => (
            <li key={i} className="pn-azione">
              <span className="pn-scheletro h-[52px] w-[52px]" />
              <span className="grid gap-2">
                <span className="pn-scheletro w-3/5" />
                <span className="pn-scheletro w-2/5" />
              </span>
            </li>
          ))}
        </ul>
      ) : azioni.length === 0 ? (
        <p className="pn-dafare-vuoto">
          <span className="pn-cerchio-ok" aria-hidden="true">
            <Icona nome="spunta" />
          </span>
          Tutto in ordine: niente da fare adesso.
        </p>
      ) : (
        <ol className="pn-dafare-lista">
          {azioni.map((a) => (
            <li key={a.id}>
              <Link href={a.href} className={`pn-azione pn-azione-${a.tono}`}>
                <span className="pn-azione-numero num" aria-hidden="true">{a.quanti}</span>
                <span className="min-w-0">
                  <span className="pn-azione-testo">{a.testo}</span>
                  {a.dettaglio ? <span className="pn-azione-dettaglio">{a.dettaglio}</span> : null}
                </span>
                <Icona nome="freccia" className="size-6" />
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
