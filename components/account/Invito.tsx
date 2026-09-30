import Link from "next/link";
import { hrefAccedi, type SezioneAccount } from "@/lib/account";
import { LINK_SCRIVI_ABBONAMENTO } from "@/lib/abbonamento";
import type { Servizio } from "@/lib/api";
import Vantaggi from "./Vantaggi";

/* /account senza sessione: cosa si guadagna con un account e due strade,
   accedi o crea. Si torna esattamente dove si era, query compresa (per esempio
   al modulo "Nuova richiesta" aperto dal compositore). */

export function Invito({
  qui,
  sezione,
  servizio,
  errore,
}: {
  qui: string;
  sezione: SezioneAccount;
  servizio: Servizio;
  errore: string | null;
}) {
  const perInviare = sezione === "richiesta";
  // L'abbonamento non si compone: si sceglie la formula e la si chiede. Il muro non deve parlare di piatti e settimana.
  const abbonamento = perInviare && servizio === "abbonamento";
  return (
    <section className="acc-testata wrap pb-[var(--sezione)]">
      <div className="notte acc-invito">
        <div>
          <p className="occhiello">Area cliente</p>
          <h1 className="titolo mt-5 max-w-[14ch]">
            {abbonamento ? "Accedi per chiedere l’abbonamento." : perInviare ? "Accedi per inviare la settimana." : "Entra nel tuo spazio."}
          </h1>
          <p className="mt-6 max-w-[48ch] text-steel">
            {abbonamento
              ? "La richiesta arriva a Matteo dal tuo account: così ti conferma inizio e dettagli, e tu segui ogni passo. Dopo l’accesso torni qui, con la formula già scelta."
              : perInviare
                ? "La richiesta arriva a Matteo dal tuo account: così ti conferma giorno e dettagli, e tu segui ogni passo. Dopo l’accesso torni qui, con i piatti già pronti."
                : "Con un account gratuito la settimana non resta chiusa in questo telefono, e le richieste a Matteo le segui da qui."}
          </p>
          {errore ? (
            <p role="alert" className="acc-avviso acc-avviso-errore mt-6">
              {errore}
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={hrefAccedi(qui)} className="btn btn-lime">
              Accedi <span className="freccia" aria-hidden="true">→</span>
            </Link>
            <Link href={hrefAccedi(qui, "crea")} className="btn btn-linea">
              Crea un account
            </Link>
          </div>
        </div>
        <Vantaggi abbonamento={abbonamento} />
      </div>
      {abbonamento ? (
        <p className="mt-6 max-w-[62ch] text-muted">
          Preferisci scrivere prima a Matteo? Puoi farlo anche senza account.{" "}
          <Link href={LINK_SCRIVI_ABBONAMENTO} className="link text-ink">Scrivi a Matteo</Link>
        </p>
      ) : (
        <p className="mt-6 max-w-[62ch] text-muted">
          Puoi comporre la settimana anche senza account: resta salvata su questo dispositivo.{" "}
          <Link href="/settimana" className="link text-ink">Componi la settimana</Link>
        </p>
      )}
    </section>
  );
}

export function Addio() {
  return (
    <section className="acc-testata wrap pb-[var(--sezione)]">
      <div className="notte p-6 sm:p-10 md:p-14" role="status">
        <p className="occhiello">Account eliminato</p>
        <h1 className="titolo mt-5 max-w-[16ch]">Il tuo account non c’è più.</h1>
        <p className="mt-6 max-w-[52ch] text-steel">
          Abbiamo cancellato accesso, profilo, settimana salvata e richieste. La settimana composta su questo dispositivo resta
          qui finché non la svuoti dal compositore. Se cambi idea, puoi creare un nuovo account quando vuoi.
        </p>
        <Link href="/" className="btn btn-lime mt-10">Torna alla home</Link>
      </div>
    </section>
  );
}
