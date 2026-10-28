"use client";

import Link from "next/link";
import { useState } from "react";
import { contaPiatti, hrefSezione, righePiano } from "@/lib/account";
import { usePiano } from "@/lib/piano";
import { descrizioneSincronia } from "@/lib/sincronizzaPiano";
import { SceltaVersione, Segno, useSceltaInPagina, useSincronia } from "../SincronizzaPiano";
import { Caricamento, LinkAccediDiNuovo, TitoloSezione } from "../ui";

/* La settimana che il cliente sta componendo: vive nel browser e, con
   l'accesso fatto, si salva da sola nell'account (components/account/
   SincronizzaPiano). Qui la si vede per intero, si legge a che punto e' il
   salvataggio e, se nell'account ce n'e' una diversa, si sceglie quale tenere. */

const NOMI_PASTO = { pranzo: "Pranzo", cena: "Cena" } as const;
const ID_STATO = "sincronia-account";

export default function Settimana() {
  const { piano, pronto } = usePiano();
  const { stato, riprovaOra } = useSincronia();
  // la scelta del conflitto sta qui dentro: quella che galleggia sulla pagina si fa da parte
  useSceltaInPagina();
  const [adesso] = useState(() => new Date());

  const righe = righePiano(piano, true);
  const piatti = contaPiatti(piano);
  const caselle = righePiano(piano).length;

  return (
    <section aria-labelledby="t-settimana" className="grid gap-8">
      <div>
        <TitoloSezione id="t-settimana">La mia settimana.</TitoloSezione>
        <p className="lead mt-4">
          Controlla i piatti e invia la richiesta a Matteo.
        </p>
      </div>

      {stato.fase === "conflitto" ? <SceltaVersione account={stato.account} fuocoDopo={ID_STATO} /> : null}

      {!pronto ? (
        <Caricamento testo="Carico la settimana…" />
      ) : (
        <>
          {piatti > 0 ? (
            <p className="text-lg"><strong className="num">{piatti}</strong> {piatti === 1 ? "pasto scelto" : "pasti scelti"}</p>
          ) : null}

          {caselle === 0 ? (
            <div className="acc-card">
              <h3 className="acc-card-titolo">Ancora nessun piatto</h3>
              <p className="mt-3 text-muted">
                Scegli i piatti che vuoi ricevere. Puoi lasciare liberi i giorni che non ti servono.
              </p>
            </div>
          ) : (
            <table className="acc-tabella">
              <caption className="sr-only">Pranzi e cene della settimana</caption>
              <thead>
                <tr>
                  <th scope="col">Giorno</th>
                  <th scope="col">Pranzo</th>
                  <th scope="col">Cena</th>
                </tr>
              </thead>
              <tbody>
                {righe.map((r) => {
                  return (
                    <tr key={r.giorno}>
                      <th scope="row">
                        <span className="block">{r.nome}</span>
                      </th>
                      {r.pasti.every((p) => !p.piatto && !p.extra.length) ? (
                        <td colSpan={2} className="acc-tabella-vuoto">Nessun pasto</td>
                      ) : r.pasti.map((p) => (
                        <td key={p.pasto} data-pasto={NOMI_PASTO[p.pasto]}>
                          {p.piatto ? (
                            <>
                              <span className="font-semibold">{p.piatto}</span>
                              {p.extra.length ? <span className="block text-sm text-muted">+ {p.extra.join(", ")}</span> : null}
                            </>
                          ) : p.extra.length ? (
                            <span className="text-sm text-muted">Solo aggiunte: {p.extra.join(", ")}</span>
                          ) : (
                            <span className="text-muted">
                              <span aria-hidden="true">—</span>
                              <span className="sr-only">vuoto</span>
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <div className="acc-card grid gap-5">
            <div>
              <h3 className="acc-card-titolo">Nel tuo account</h3>
              <p
                id={ID_STATO}
                tabIndex={-1}
                className="mt-2 flex items-baseline gap-2 text-muted outline-none"
                aria-live="polite"
                aria-atomic="true"
              >
                <span className="translate-y-[-1px]"><Segno fase={stato.fase} /></span>
                <span>{descrizioneSincronia(stato, adesso)}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {piatti ? <Link href={hrefSezione("richiesta", { servizio: "menu-settimana" })} scroll={false} className="btn btn-lime btn-sm">Invia la settimana</Link> : null}
              <Link href="/settimana" className="btn btn-ink btn-sm">
                {piatti ? "Cambia i piatti" : "Scegli i piatti"}
              </Link>
              {stato.fase === "errore" && stato.motivo === "rete" ? (
                <button type="button" className="btn btn-linea btn-sm" onClick={riprovaOra}>
                  Riprova ora
                </button>
              ) : null}
              {stato.fase === "errore" && stato.motivo === "accesso" ? <LinkAccediDiNuovo className="btn btn-linea btn-sm" /> : null}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
