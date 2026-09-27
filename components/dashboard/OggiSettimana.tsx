/* "Prossimi 7 giorni": per ogni giorno le porzioni da cucinare, i pranzi in
   abbonamento e i ritiri o le consegne. Si cucina e si consegna ogni giorno:
   in evidenza restano solo i giorni di chiusura segnati in Impostazioni. */

import type { GiornoCalendario } from "@/lib/operazioni";
import { Sezione, giorno } from "./ui";

const iniziale = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export default function OggiSettimana({ giorni }: { giorni: GiornoCalendario[] | null }) {
  const chiusi = giorni?.filter((g) => g.chiusura).length ?? 0;
  const abbonamenti = giorni?.reduce((n, g) => n + g.abbonamenti, 0) ?? 0;
  const sotto = [
    "Si cucina e si consegna ogni giorno.",
    chiusi ? `${chiusi === 1 ? "Un giorno di chiusura" : `${chiusi} giorni di chiusura`} in vista.` : "",
    abbonamenti
      ? `Porzioni dagli ordini confermati, più ${abbonamenti} ${abbonamenti === 1 ? "pranzo" : "pranzi"} in abbonamento.`
      : "Porzioni dagli ordini confermati.",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <Sezione titolo="Prossimi 7 giorni" id="oggi-settimana" sotto={sotto}>
      {giorni ? (
        <ol className="pn-settimana mt-4">
          {giorni.map((g) => (
            <li
              key={g.data}
              className={`pn-giorno ${g.chiusura ? "pn-giorno-chiuso" : ""}`}
              title={g.chiusura ? `Chiuso${g.chiusura.motivo ? `: ${g.chiusura.motivo}` : ""}` : undefined}
            >
              <div>
                <p className="pn-giorno-nome">{iniziale(giorno(g.data))}</p>
                {g.oggi ? <span className="pn-giorno-etichetta pn-giorno-etichetta-oggi">Oggi</span> : null}
                {g.chiusura ? (
                  <span className="pn-giorno-etichetta pn-giorno-etichetta-chiuso">
                    Chiuso<span className="sr-only">{g.chiusura.motivo ? `: ${g.chiusura.motivo}` : ""}</span>
                  </span>
                ) : null}
              </div>
              <p className="pn-giorno-dato">
                <strong className="num">{g.porzioni + g.abbonamenti}</strong>
                {g.porzioni + g.abbonamenti === 1 ? "porzione" : "porzioni"}
                {g.ordiniInCucina ? ` · ${g.ordiniInCucina} ${g.ordiniInCucina === 1 ? "ordine" : "ordini"}` : ""}
                {g.abbonamenti ? ` · ${g.abbonamenti} in abbonamento` : ""}
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
