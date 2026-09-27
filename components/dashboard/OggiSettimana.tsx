/* "Prossimi 7 giorni": per ogni giorno le porzioni da cucinare e i ritiri o
   le consegne. Lunedi' e giovedi' (giorni di cucina) hanno il bordo pieno. */

import type { GiornoCalendario } from "@/lib/operazioni";
import { Sezione, giorno } from "./ui";

const iniziale = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export default function OggiSettimana({ giorni }: { giorni: GiornoCalendario[] | null }) {
  return (
    <Sezione titolo="Prossimi 7 giorni" id="oggi-settimana" sotto="Lunedì e giovedì si cucina. Porzioni dagli ordini confermati.">
      {giorni ? (
        <ol className="pn-settimana mt-4">
          {giorni.map((g) => (
            <li key={g.data} className={`pn-giorno ${g.cucina ? "pn-giorno-cucina" : ""}`}>
              <div>
                <p className="pn-giorno-nome">{iniziale(giorno(g.data))}</p>
                {g.oggi ? <span className="pn-giorno-etichetta pn-giorno-etichetta-oggi">Oggi</span> : null}
                {g.cucina ? <span className="pn-giorno-etichetta">Cucina</span> : null}
              </div>
              <p className="pn-giorno-dato">
                <strong className="num">{g.porzioni}</strong>
                {g.porzioni === 1 ? "porzione" : "porzioni"}
                {g.ordiniInCucina ? ` · ${g.ordiniInCucina} ${g.ordiniInCucina === 1 ? "ordine" : "ordini"}` : ""}
              </p>
              <p className="pn-giorno-dato">
                <strong className="num">{g.uscite}</strong>
                {g.uscite === 1 ? "uscita" : "uscite"}
                {g.uscite
                  ? ` · ${[
                      g.ritiri ? `${g.ritiri} ${g.ritiri === 1 ? "ritiro" : "ritiri"}` : "",
                      g.consegne ? `${g.consegne} ${g.consegne === 1 ? "consegna" : "consegne"}` : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}`
                  : ""}
              </p>
              {g.richieste ? (
                <p className="col-span-3 text-[14px] font-semibold text-[#6b3200]">
                  + {g.richieste} {g.richieste === 1 ? "richiesta chiede" : "richieste chiedono"} questo giorno
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <div className="pn-settimana mt-4" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="pn-giorno">
              <span className="pn-scheletro w-16" />
              <span className="pn-scheletro w-12" />
              <span className="pn-scheletro w-12" />
            </div>
          ))}
        </div>
      )}
    </Sezione>
  );
}
