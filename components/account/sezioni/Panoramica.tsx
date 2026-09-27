"use client";

import Link from "next/link";
import { useState } from "react";
import {
  campiMancanti,
  contaPiatti,
  formattaGiorno,
  formattaGiornoDa,
  hrefSezione,
  prossimaConsegna,
  spostaGiorni,
  traduciErroreAuth,
} from "@/lib/account";
import { ETICHETTE_SERVIZIO, type Ordine } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { CASELLE_TOTALI, usePiano } from "@/lib/piano";
import Passi from "../Passi";
import { caricaUtente } from "../sessione";
import { Avviso, Caricamento, EsitoAzione, Scheletro, TitoloSezione } from "../ui";
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

  async function inviaVerifica() {
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

      {daVerificare || mancano.length ? (
        <div className="grid gap-3">
          {daVerificare ? (
            <Avviso
              tipo="info"
              titolo="Conferma la tua email"
              azioni={
                <button type="button" className="btn btn-ink btn-sm" disabled={invio} onClick={() => void inviaVerifica()}>
                  {invio ? "Invio…" : "Invia di nuovo il link"}
                </button>
              }
            >
              Così gli aggiornamenti delle tue richieste arrivano davvero a <strong className="break-all">{utente.email}</strong>.
              <EsitoAzione esito={esitoVerifica} className="mt-3" />
            </Avviso>
          ) : null}
          {mancano.length ? (
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
        <ProssimaConsegna ordini={ordini} oggi={oggi} />

        <div className="grid content-start gap-5">
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

      <nav aria-label="Scorciatoie" className="grid gap-3 sm:grid-cols-3">
        <Scorciatoia href="/settimana" numero="01" titolo="Componi la settimana" testo="Scegli i piatti giorno per giorno." />
        <Scorciatoia href={hrefSezione("richiesta")} numero="02" titolo="Nuova richiesta" testo="Invia la settimana a Matteo." />
        <Scorciatoia href={hrefSezione("profilo")} numero="03" titolo="Profilo" testo="Telefono, indirizzo, allergie." />
      </nav>
    </section>
  );
}

function ProssimaConsegna({ ordini, oggi }: Pick<PropsArea, "ordini" | "oggi">) {
  if (ordini.stato === "attesa") {
    return (
      <article className="acc-card notte" aria-label="Prossima consegna">
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
  const data = prossima.fulfillment_date;
  const quando = !data ? "Giorno da definire"
    : data === oggi ? `Oggi, ${formattaGiorno(data, oggi)}`
    : data === spostaGiorni(oggi, 1) ? `Domani, ${formattaGiorno(data, oggi)}`
    : formattaGiorno(data, oggi);

  return (
    <article className="acc-card notte" aria-labelledby="t-prossima">
      <p id="t-prossima" className="occhiello">{ritiro ? "Prossimo ritiro" : "Prossima consegna"}</p>
      <h3 className="acc-data-grande mt-5">{quando}</h3>
      <p className="mt-3 text-steel">
        {ritiro ? "Ritiro in Via del Santuario 214, Pescara" : `Consegna a ${prossima.comune || "domicilio"}`}
        {" · "}
        {prossima.meals ? `${prossima.meals} pasti` : ETICHETTE_SERVIZIO[prossima.service]}
      </p>
      <div className="mt-7">
        <Passi stato={prossima.status} modalita={prossima.fulfillment} />
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
                {o.meals ? `${o.meals} pasti` : ETICHETTE_SERVIZIO[o.service]}
                {o.requested_date ? ` · preferito ${formattaGiorno(o.requested_date, oggi)}` : ""}
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
