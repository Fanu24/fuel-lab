"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  campiMancanti,
  contaPiatti,
  formattaGiorno,
  formattaGiornoDa,
  hrefSezione,
  nomeServizioRichiesta,
  passiDiAvvio,
  periodoRichiesta,
  prossimaConsegna,
  prossimaUscitaDi,
  schedaAbbonamento,
  spostaGiorni,
  traduciErroreAuth,
} from "@/lib/account";
import { CONSEGNA_OGNI_GIORNI } from "@/lib/abbonamento";
import { euro, type Ordine } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { CASELLE_TOTALI, usePiano } from "@/lib/piano";
import Passi from "../Passi";
import { caricaUtente } from "../sessione";
import { Avviso, Caricamento, EsitoAzione, IconaSpunta, Scheletro, TitoloSezione } from "../ui";
import type { Esito, PropsArea } from "./tipi";

/* La prima schermata: cosa sta per arrivare, cosa aspetta una risposta, a che
   punto e' la settimana, e gli avvisi che bloccano qualcosa (email da
   confermare, profilo senza telefono o comune). */

const NOMI_CAMPI = { telefono: "il telefono", comune: "il comune" } as const;

export default function Panoramica({ utente, profilo, ordini, providers, oggi }: PropsArea) {
  const { piano, pronto, macroSettimana } = usePiano();
  const [invio, setInvio] = useState(false);
  const [esitoVerifica, setEsitoVerifica] = useState<Esito | null>(null);

  const daVerificare = !utente.emailVerified && !!providers?.emailVerification;
  const mancano = profilo.stato === "pronto" ? campiMancanti(profilo.dati) : [];
  const piatti = contaPiatti(piano);
  // Nessuna richiesta mai inviata: invece di tanti riquadri vuoti, la strada fino alla prima.
  const nuovo = ordini.stato === "pronto" && ordini.dati.length === 0;

  async function inviaVerifica() {
    if (invio) return;
    setInvio(true);
    setEsitoVerifica(null);
    try {
      const r = await authClient.sendVerificationEmail({ email: utente.email, callbackURL: "/account" });
      if (r.error) {
        setEsitoVerifica({ ok: false, testo: traduciErroreAuth(r.error, "verifica").messaggio });
        if (r.error.code === "EMAIL_ALREADY_VERIFIED") void caricaUtente(true);
      } else {
        setEsitoVerifica({ ok: true, testo: `Link inviato a ${utente.email}. Aprilo e l’email è confermata.` });
      }
    } catch {
      setEsitoVerifica({ ok: false, testo: traduciErroreAuth({ status: 0 }, "verifica").messaggio });
    }
    setInvio(false);
  }

  return (
    <section aria-labelledby="t-panoramica" className="grid gap-8">
      <TitoloSezione id="t-panoramica">A colpo d’occhio.</TitoloSezione>

      {daVerificare || (mancano.length && !nuovo) ? (
        <div className="grid gap-3">
          {daVerificare ? (
            <Avviso
              tipo="info"
              titolo="Conferma la tua email"
              azioni={
                <button type="button" className="btn btn-ink btn-sm" aria-disabled={invio ? true : undefined} onClick={() => void inviaVerifica()}>
                  {invio ? "Invio…" : "Invia di nuovo il link"}
                </button>
              }
            >
              Così gli aggiornamenti delle tue richieste arrivano davvero a <strong className="[overflow-wrap:anywhere]">{utente.email}</strong>.
              <EsitoAzione esito={esitoVerifica} className="mt-3 empty:mt-0" />
            </Avviso>
          ) : null}
          {mancano.length && !nuovo ? (
            <Avviso
              tipo="info"
              titolo="Completa il profilo"
              azioni={<Link href={hrefSezione("profilo")} scroll={false} className="btn btn-ink btn-sm">Vai al profilo</Link>}
            >
              Manca {mancano.map((m) => NOMI_CAMPI[m]).join(" e ")}: con questi dati le richieste partono senza riscriverli ogni volta.
            </Avviso>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        {nuovo ? (
          <DaDoveCominciare profiloCompleto={profilo.stato === "pronto" ? mancano.length === 0 : null} piatti={piatti} />
        ) : (
          <ProssimaConsegna ordini={ordini} oggi={oggi} />
        )}

        <div className="grid content-start gap-5">
          {nuovo ? null : (
            <article className="acc-card" aria-labelledby="t-attesa">
              <h3 id="t-attesa" className="acc-card-titolo">In attesa di conferma</h3>
              {ordini.stato === "attesa" ? (
                <Scheletro righe={2} className="mt-4" />
              ) : ordini.stato === "errore" ? (
                <p className="mt-3 text-muted">Non riesco a leggere le richieste.</p>
              ) : (
                <InAttesa ordini={ordini.dati} oggi={oggi} />
              )}
            </article>
          )}

          <article className="acc-card" aria-labelledby="t-settimana-breve">
            <h3 id="t-settimana-breve" className="acc-card-titolo">La settimana in composizione</h3>
            {pronto ? (
              <>
                <p className="mt-3 flex items-baseline gap-2">
                  <span className="num text-4xl leading-none">{piatti}</span>
                  <span className="text-muted">su {CASELLE_TOTALI} pasti scelti</span>
                </p>
                <div className="acc-barra mt-3" aria-hidden="true">
                  <span style={{ width: `${Math.min(100, (piatti / CASELLE_TOTALI) * 100)}%` }} />
                </div>
                {piatti ? (
                  <p className="mt-3 text-sm text-muted">
                    <span className="num">{Math.round(macroSettimana.kcal).toLocaleString("it-IT")}</span> kcal e{" "}
                    <span className="num">{Math.round(macroSettimana.proteine)}</span> g di proteine in tutto.
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-muted">Ancora nessun piatto: parti dal compositore.</p>
                )}
              </>
            ) : (
              <Scheletro righe={2} className="mt-4" />
            )}
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
              <Link href="/settimana" className="link text-sm">Componi</Link>
              <Link href={hrefSezione("settimana")} scroll={false} className="link text-sm">Riepilogo e salvataggio</Link>
            </div>
          </article>
        </div>
      </div>

      {nuovo ? null : (
        <nav aria-label="Scorciatoie" className="grid gap-3 sm:grid-cols-3">
          <Scorciatoia href="/settimana" numero="01" titolo="Componi la settimana" testo="Scegli i piatti giorno per giorno." />
          <Scorciatoia href={hrefSezione("richiesta")} numero="02" titolo="Nuova richiesta" testo="Invia la settimana a Matteo." />
          <Scorciatoia href={hrefSezione("profilo")} numero="03" titolo="Profilo" testo="Telefono, indirizzo, allergie." />
        </nav>
      )}
    </section>
  );
}

/* Per chi non ha ancora mandato niente: i tre passi fino alla prima richiesta, con a che punto e' ciascuno.
   Il profilo non blocca: il modulo chiede comunque telefono e comune e li salva da solo. */
function DaDoveCominciare({ profiloCompleto, piatti }: { profiloCompleto: boolean | null; piatti: number }) {
  const [scelta, profilo] = passiDiAvvio({ profiloCompleto, piatti });
  const passo = (n: number, fatto: boolean, titolo: string, children: ReactNode) => (
    <li data-fatto={fatto}>
      <span className="acc-avvio-segno num" aria-hidden="true">{fatto ? <IconaSpunta ok /> : n}</span>
      <div className="grid gap-1">
        <p className="acc-avvio-titolo">
          {titolo}
          <span className="sr-only">{fatto ? ": fatto" : ": da fare"}</span>
        </p>
        {children}
      </div>
    </li>
  );
  return (
    <article className="acc-card notte" aria-labelledby="t-inizio">
      <p id="t-inizio" className="occhiello">Per cominciare</p>
      <h3 className="titolo-s mt-5">Tre passi fino alla tua prima richiesta.</h3>
      <ol className="acc-avvio mt-7">
        {passo(1, scelta.fatto, "Scegli cosa chiedere", (
          <>
            <p className="text-sm text-steel">
              {scelta.fatto
                ? `Hai scelto ${piatti} ${piatti === 1 ? "pasto" : "pasti"} nella settimana.`
                : "Componi la settimana pasto per pasto, oppure scegli un abbonamento mensile."}
            </p>
            <div className="mt-1 flex flex-wrap gap-x-6 gap-y-3">
              <Link href="/settimana" className="link text-sm text-lime">{scelta.fatto ? "Modifica la settimana" : "Componi la settimana"}</Link>
              <Link href={hrefSezione("richiesta", { servizio: "abbonamento" })} scroll={false} className="link text-sm text-lime">Chiedi un abbonamento</Link>
            </div>
          </>
        ))}
        {passo(2, profilo.fatto, "Lascia i tuoi recapiti", (
          <>
            <p className="text-sm text-steel">
              {profilo.fatto
                ? "Telefono e comune ci sono: la richiesta parte già compilata."
                : "Telefono e comune: Matteo ti ricontatta lì per confermare. Li scrivi qui una volta, o direttamente nella richiesta."}
            </p>
            {profilo.fatto ? null : (
              <Link href={hrefSezione("profilo")} scroll={false} className="link mt-1 self-start text-sm text-lime">Completa il profilo</Link>
            )}
          </>
        ))}
        {passo(3, false, "Invia a Matteo", (
          <p className="text-sm text-steel">
            La guarda e ti conferma giorno, dettagli e totale: lo vedi qui, nelle tue richieste. Nessun pagamento online.
          </p>
        ))}
      </ol>
      <Link href={hrefSezione("richiesta")} scroll={false} className="btn btn-lime mt-8">
        {scelta.fatto ? "Invia la settimana" : "Nuova richiesta"} <span className="freccia" aria-hidden="true">→</span>
      </Link>
    </article>
  );
}

function ProssimaConsegna({ ordini, oggi }: Pick<PropsArea, "ordini" | "oggi">) {
  if (ordini.stato === "attesa") {
    return (
      // Alta quanto la scheda che arriva, o quasi: il resto della pagina (le altre schede, le scorciatoie) non scende di colpo.
      <article className="acc-card acc-card-attesa notte" aria-label="Prossima consegna">
        <Caricamento testo="Carico le richieste…" />
      </article>
    );
  }
  if (ordini.stato === "errore") {
    return (
      <article className="acc-card notte" aria-labelledby="t-prossima">
        <p id="t-prossima" className="occhiello">Prossima consegna</p>
        <p className="mt-5 text-steel">{ordini.messaggio}</p>
        <button type="button" className="btn btn-linea btn-sm mt-5" onClick={() => void ordini.ricarica()}>Riprova</button>
      </article>
    );
  }

  const prossima = prossimaConsegna(ordini.dati, oggi);
  if (!prossima) {
    return (
      <article className="acc-card notte" aria-labelledby="t-prossima">
        <p id="t-prossima" className="occhiello">Prossima consegna</p>
        <h3 className="titolo-s mt-5">Nessuna consegna in programma.</h3>
        <p className="mt-4 max-w-[46ch] text-steel">
          Quando Matteo conferma una richiesta, qui trovi il giorno, lo stato della preparazione e i suoi messaggi.
        </p>
        <Link href={hrefSezione("richiesta")} scroll={false} className="btn btn-lime mt-7">
          Nuova richiesta <span className="freccia" aria-hidden="true">→</span>
        </Link>
      </article>
    );
  }

  const ritiro = prossima.fulfillment === "pickup";
  const scheda = schedaAbbonamento(prossima);
  // Per un abbonamento in corso conta la prossima consegna del periodo (una ogni 3 giorni), non il giorno d'inizio.
  const uscita = prossimaUscitaDi(prossima, oggi);
  const data = uscita ?? (scheda ? null : prossima.fulfillment_date);
  const quando = !data ? (scheda && prossima.fulfillment_date ? "Consegne concluse" : "Giorno da definire")
    : data === oggi ? `Oggi, ${formattaGiorno(data, oggi)}`
    : data === spostaGiorni(oggi, 1) ? `Domani, ${formattaGiorno(data, oggi)}`
    : formattaGiorno(data, oggi);
  const periodo = periodoRichiesta(prossima, oggi);

  return (
    <article className="acc-card notte" aria-labelledby="t-prossima">
      <p id="t-prossima" className="occhiello">{ritiro ? "Prossimo ritiro" : "Prossima consegna"}</p>
      <h3 className="acc-data-grande mt-5">{quando}</h3>
      <p className="mt-3 text-steel">
        {ritiro ? "Ritiro in Via del Santuario 214, Pescara" : `Consegna a ${prossima.comune || "domicilio"}`}
        {" · "}
        {prossima.meals && !scheda ? `${prossima.meals} pasti` : nomeServizioRichiesta(prossima)}
      </p>
      {scheda ? (
        <dl className="acc-fatti mt-6">
          <div><dt>Cosa ricevi</dt><dd>{scheda.cosaRicevi}</dd></div>
          <div><dt>{ritiro ? "Ritiro" : "Consegna"}</dt><dd>Ogni {CONSEGNA_OGNI_GIORNI} giorni</dd></div>
          {periodo ? <div><dt>Periodo</dt><dd>{periodo}</dd></div> : null}
          <div><dt>Chi si abbona</dt><dd>{scheda.nucleo}</dd></div>
          <div><dt>Settimana di prova</dt><dd>{scheda.prova ? "Sì" : "No"}</dd></div>
          {prossima.price_cents !== null && prossima.price_cents !== undefined ? (
            <div><dt>Totale concordato</dt><dd className="num">{euro(prossima.price_cents)}</dd></div>
          ) : null}
        </dl>
      ) : null}
      <div className="mt-7">
        <Passi stato={prossima.status} modalita={prossima.fulfillment} servizio={prossima.service} />
      </div>
      {prossima.customer_message ? (
        <div className="acc-messaggio mt-7">
          <p className="acc-messaggio-chi">Messaggio di Matteo</p>
          <p className="whitespace-pre-line">{prossima.customer_message}</p>
        </div>
      ) : null}
      <Link href={hrefSezione("richieste", { apri: prossima.id })} scroll={false} className="link mt-7 inline-block text-lime">
        Dettagli della richiesta <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}

function InAttesa({ ordini, oggi }: { ordini: Ordine[]; oggi: string }) {
  const inAttesa = ordini.filter((o) => o.status === "requested");
  if (!inAttesa.length) {
    return <p className="mt-3 text-muted">Nessuna richiesta in attesa.</p>;
  }
  return (
    <>
      <ul className="mt-4 grid gap-2">
        {inAttesa.slice(0, 3).map((o) => (
          <li key={o.id}>
            <Link href={hrefSezione("richieste", { apri: o.id })} scroll={false} className="acc-riga">
              <span className="font-semibold">Inviata il {formattaGiornoDa(o.created_at)}</span>
              <span className="text-sm text-muted">
                {o.meals && o.service !== "abbonamento" ? `${o.meals} pasti` : nomeServizioRichiesta(o)}
                {o.service === "abbonamento" && o.price_cents !== null && o.price_cents !== undefined ? ` · proposto ${euro(o.price_cents)} al mese` : ""}
                {o.requested_date ? ` · ${o.service === "abbonamento" ? "inizio" : "preferito"} ${formattaGiorno(o.requested_date, oggi)}` : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {inAttesa.length > 3 ? (
        <Link href={hrefSezione("richieste")} scroll={false} className="link mt-4 inline-block text-sm">
          Vedi tutte ({inAttesa.length})
        </Link>
      ) : null}
    </>
  );
}

function Scorciatoia({ href, numero, titolo, testo }: { href: string; numero: string; titolo: string; testo: string }) {
  return (
    <Link href={href} scroll={false} className="acc-scorciatoia">
      <span className="num text-sm text-muted" aria-hidden="true">{numero}</span>
      <strong className="font-disp text-[15px] font-semibold tracking-[.08em] uppercase">
        {titolo} <span className="freccia" aria-hidden="true">→</span>
      </strong>
      <span className="text-sm text-muted">{testo}</span>
    </Link>
  );
}
