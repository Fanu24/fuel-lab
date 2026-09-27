"use client";

import Link from "next/link";
import { useState } from "react";
import {
  contaPiatti,
  formattaMomento,
  messaggioDa,
  piattiNonPiuDisponibili,
  righePiano,
} from "@/lib/account";
import { api } from "@/lib/api";
import { NOMI_GIORNATA, potaPiano, usePiano } from "@/lib/piano";
import { useSostituisciSettimana } from "../settimanaLocale";
import { Caricamento, EsitoAzione, TitoloSezione, useConferma, useDati } from "../ui";
import type { Esito } from "./tipi";

/* La settimana che il cliente sta componendo vive nel browser (localStorage):
   qui la vede per intero, la salva nell'account e, su un altro dispositivo, la
   ripristina. Ripristinare sovrascrive il piano locale: si chiede prima. */

const caricaSalvato = () => api.piano();
const erroreSalvato = (e: unknown) => messaggioDa(e, "Non riesco a leggere la settimana salvata.");

const NOMI_PASTO = { pranzo: "Pranzo", cena: "Cena" } as const;

export default function Settimana() {
  const { piano, allenamenti, pronto, macroSettimana } = usePiano();
  const sostituisci = useSostituisciSettimana();
  const salvato = useDati(caricaSalvato, erroreSalvato);
  const [chiedi, dialogo] = useConferma();
  const [azione, setAzione] = useState<null | "salva">(null);
  const [esito, setEsito] = useState<Esito | null>(null);

  const righe = righePiano(piano, true);
  const piatti = contaPiatti(piano);
  const caselle = righePiano(piano).length;
  const salvataggio = salvato.stato === "pronto" && salvato.dati.plan ? salvato.dati : null;
  const piattiSalvati = salvataggio ? contaPiatti(potaPiano(salvataggio.plan)) : 0;

  async function salva() {
    setAzione("salva");
    setEsito(null);
    try {
      await api.salvaPiano(piano, allenamenti);
      await salvato.ricarica();
      setEsito({ ok: true, testo: "Settimana salvata nel tuo account: la ritrovi su ogni dispositivo." });
    } catch (e) {
      setEsito({ ok: false, testo: messaggioDa(e, "Non riesco a salvare la settimana. Riprova tra poco.") });
    }
    setAzione(null);
  }

  async function ripristina() {
    if (!salvataggio) return;
    setEsito(null);
    const persi = piattiNonPiuDisponibili(salvataggio.plan);
    if (caselle > 0 || persi > 0) {
      const ok = await chiedi({
        titolo: "Ripristinare la versione salvata?",
        testo: (
          <>
            {caselle > 0 ? (
              <p>
                La settimana che stai componendo su questo dispositivo ({piatti} {piatti === 1 ? "piatto" : "piatti"}) viene
                sostituita da quella salvata il {formattaMomento(salvataggio.updatedAt)} ({piattiSalvati}{" "}
                {piattiSalvati === 1 ? "piatto" : "piatti"}).
              </p>
            ) : null}
            {persi > 0 ? (
              <p>
                {persi === 1 ? "Un piatto salvato non è" : `${persi} piatti salvati non sono`} più nel menu:{" "}
                {persi === 1 ? "lo togliamo" : "li togliamo"}.
              </p>
            ) : null}
          </>
        ),
        conferma: "Ripristina",
      });
      if (!ok) return;
    }
    sostituisci(salvataggio.plan, salvataggio.training);
    setEsito({ ok: true, testo: "Versione salvata ripristinata. Puoi ritoccarla nel compositore." });
  }

  return (
    <section aria-labelledby="t-settimana" className="grid gap-8">
      <div>
        <TitoloSezione id="t-settimana">La mia settimana.</TitoloSezione>
        <p className="lead mt-4">
          È la settimana che stai componendo su questo dispositivo. Salvala nell’account per ritrovarla ovunque.
        </p>
      </div>

      {!pronto ? (
        <Caricamento testo="Carico la settimana…" />
      ) : (
        <>
          {piatti > 0 ? (
            <dl className="acc-macro" aria-label="Totali della settimana">
              <div><dt>Pasti</dt><dd className="num">{piatti}<span className="text-muted">/14</span></dd></div>
              <div><dt>Kcal</dt><dd className="num">{Math.round(macroSettimana.kcal).toLocaleString("it-IT")}</dd></div>
              <div><dt>Proteine</dt><dd className="num">{Math.round(macroSettimana.proteine)} g</dd></div>
              <div><dt>Carboidrati</dt><dd className="num">{Math.round(macroSettimana.carboidrati)} g</dd></div>
              <div><dt>Grassi</dt><dd className="num">{Math.round(macroSettimana.grassi)} g</dd></div>
            </dl>
          ) : null}

          {caselle === 0 ? (
            <div className="acc-card">
              <h3 className="acc-card-titolo">Ancora nessun piatto</h3>
              <p className="mt-3 text-muted">
                Nel compositore dici come ti alleni e la settimana si riempie da sola; poi la ritocchi.
                {salvataggio ? " Oppure riprendi quella che hai salvato nell’account." : ""}
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
                  const tipo = allenamenti[r.giorno];
                  return (
                    <tr key={r.giorno}>
                      <th scope="row">
                        <span className="block">{r.nome}</span>
                        {tipo ? <span className={`tag tag-${tipo} mt-2`}>{NOMI_GIORNATA[tipo]}</span> : null}
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
              <p className="mt-2 text-muted" aria-live="polite">
                {salvato.stato === "attesa"
                  ? "Controllo la versione salvata…"
                  : salvato.stato === "errore"
                    ? salvato.messaggio
                    : salvataggio
                      ? `Ultimo salvataggio: ${formattaMomento(salvataggio.updatedAt)} · ${piattiSalvati} ${piattiSalvati === 1 ? "piatto" : "piatti"}.`
                      : "Non hai ancora salvato una settimana nell’account."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/settimana" className="btn btn-ink btn-sm">
                Modifica nel compositore
              </Link>
              <button
                type="button"
                className="btn btn-lime btn-sm"
                disabled={caselle === 0 || azione !== null}
                onClick={() => void salva()}
              >
                {azione === "salva" ? "Salvo…" : "Salva nel mio account"}
              </button>
              {salvato.stato === "errore" ? (
                <button type="button" className="btn btn-linea btn-sm" onClick={() => void salvato.ricarica()}>
                  Riprova a leggere
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-linea btn-sm"
                  disabled={!salvataggio || azione !== null}
                  onClick={() => void ripristina()}
                >
                  Ripristina la versione salvata
                </button>
              )}
            </div>
            {caselle === 0 ? <p className="text-sm text-muted">Aggiungi almeno un piatto per salvare.</p> : null}
            <EsitoAzione esito={esito} />
          </div>
        </>
      )}
      {dialogo}
    </section>
  );
}
