"use client";

import Link from "next/link";
import { usePiano } from "@/lib/piano";
import { useUtente } from "./useUtente";

/* La strada migliore: la settimana parte dall'account, dove Matteo la riceve
   con piatti e giorni gia' in ordine e il cliente ne segue lo stato.

   Tutto cio' che dipende dal browser (piano in localStorage, accesso) sta in
   righe di altezza fissa: la scheda nasce sul server senza saperlo e non deve
   muoversi quando lo scopre. */

const ACCOUNT = "/account?sezione=richiesta";
const ACCEDI = `/accedi?next=${encodeURIComponent(ACCOUNT)}`;

export default function StradaAccount() {
  const { pasti, pronto } = usePiano();
  const utente = useUtente();
  const entrato = !!utente;

  return (
    <article className="notte smusso relative flex flex-col p-6 md:p-8" aria-labelledby="strada-account">
      {/* Il cartellino sta sull'angolo e non nella riga del titolino: cosi' le tre schede hanno il titolo alla stessa altezza a ogni larghezza. */}
      <span className="absolute top-0 right-0 bg-lime px-2.5 py-1.5 font-disp text-[11px] font-bold tracking-[.16em] text-ink uppercase">
        La strada migliore
      </span>
      <p className="occhiello">
        <span className="num">01</span> · Account
      </p>
      <h3 id="strada-account" className="titolo-s mt-6">
        Invia la tua settimana.
      </h3>
      <p className="mt-4 text-steel">
        Matteo riceve piatti e giorni già in ordine, senza doverli ricopiare. Tu segui lo stato della richiesta,
        dalla conferma al ritiro.
      </p>

      <p className="mt-5 flex min-h-11 items-center gap-3 text-sm">
        {!pronto ? null : pasti > 0 ? (
          <>
            <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 bg-lime" />
            <span>
              Hai <strong className="num text-lime">{pasti}</strong> {pasti === 1 ? "pasto pronto" : "pasti pronti"} da
              inviare.
            </span>
          </>
        ) : (
          <span className="text-steel">
            Settimana ancora vuota ·{" "}
            <Link href="/settimana" className="link text-paper">
              Componila
            </Link>
          </span>
        )}
      </p>

      <div className="mt-auto pt-4">
        <Link href={entrato ? ACCOUNT : ACCEDI} className="btn btn-lime w-full whitespace-normal text-center">
          Invia dall’account <span aria-hidden="true" className="freccia">→</span>
        </Link>
        <p className="mt-3 min-h-[1.55em] truncate text-sm text-steel">
          {utente === undefined
            ? null
            : entrato
              ? `Sei dentro come ${utente.name.split(" ")[0] || utente.email}.`
              : "Non hai un account? Si crea in un minuto."}
        </p>
      </div>
    </article>
  );
}
