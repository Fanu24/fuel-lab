"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { api, type ArgomentoMessaggio } from "@/lib/api";
import {
  ARGOMENTI,
  EMAIL_CONTATTI,
  LIMITI,
  argomentoDaParam,
  bloccoSettimana,
  emailDaModulo,
  etichettaArgomento,
  preparaMessaggio,
  primoErrore,
  spazioPerMessaggio,
  spiegaErroreInvio,
  validaModulo,
  type CampoModulo,
  type DatiModulo,
  type ErroreInvio,
} from "@/lib/contatto";
import { usePiano } from "@/lib/piano";
import { useUtente } from "./useUtente";

/* Scrivi a Matteo senza account: il modulo manda il messaggio a POST
   /api/contact, e Matteo lo trova nel suo pannello. Le regole sono in
   lib/contatto.ts, le stesse del server.

   Nome ed email restano `null` finche' la persona non li tocca: in quel caso
   il campo mostra quello dell'account (se ha fatto l'accesso), senza un
   effetto che sovrascriva cio' che ha gia' iniziato a scrivere.

   I campi non hanno `name` di proposito: se qualcuno preme Invia prima che
   la pagina sia pronta, il browser ricarica la pagina senza mettere nome,
   telefono e messaggio nell'indirizzo. */

type Campi = {
  nome: string | null;
  email: string | null;
  telefono: string;
  comune: string;
  argomento: ArgomentoMessaggio;
  messaggio: string;
};

type Stato = "modifica" | "invio" | "inviato";
type Inviato = { nome: string; email: string; telefono: string };

/** L'id del controllo che prende il fuoco per ogni errore. */
const ID_CAMPO: Record<CampoModulo, string> = {
  nome: "c-nome",
  comune: "c-comune",
  recapito: "c-email",
  email: "c-email",
  telefono: "c-telefono",
  argomento: "c-argomento",
  messaggio: "c-messaggio",
};

const ACCOUNT_RICHIESTA = `/accedi?next=${encodeURIComponent("/account?sezione=richiesta")}`;

/** Unisce gli id non vuoti: aria-describedby vuole una lista separata da spazi. */
const ids = (...v: (string | false | undefined)[]) => v.filter(Boolean).join(" ") || undefined;

function Errore({ id, testo }: { id: string; testo?: string }) {
  return testo ? (
    <p id={id} className="errore">
      {testo}
    </p>
  ) : null;
}

function Esito({
  inviato,
  proponiAccount,
  titolo,
  onAltro,
}: {
  inviato: Inviato;
  proponiAccount: boolean;
  titolo: React.Ref<HTMLHeadingElement>;
  onAltro: () => void;
}) {
  const doveRisponde =
    inviato.email && inviato.telefono
      ? "all’email o al telefono che hai lasciato"
      : inviato.email
        ? `all’indirizzo ${inviato.email}`
        : `al numero ${inviato.telefono}`;
  return (
    <div className="notte p-6 md:p-12">
      <p className="occhiello">Messaggio inviato</p>
      <h3 ref={titolo} tabIndex={-1} className="titolo-s mt-5 max-w-[20ch] outline-none">
        Grazie{inviato.nome ? `, ${inviato.nome.split(" ")[0]}` : ""}. Matteo ha il tuo messaggio.
      </h3>
      <p className="mt-5 max-w-[52ch] break-words text-steel">
        Di solito risponde entro un giorno lavorativo, {doveRisponde}.
        {inviato.email ? " Se non trovi la sua email, guarda anche nella cartella spam." : ""}
      </p>
      {proponiAccount ? (
        <p className="mt-4 max-w-[52ch] text-steel">
          Vuoi seguire lo stato della richiesta? Con un account la settimana arriva a Matteo con giorni e piatti, e
          vedi quando è confermata.{" "}
          <Link href={ACCOUNT_RICHIESTA} className="link text-paper">
            Crea l’account
          </Link>
        </p>
      ) : null}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button type="button" className="btn btn-linea" onClick={onAltro}>
          Scrivi un altro messaggio
        </button>
        <Link href="/menu" className="btn btn-lime">
          Guarda il menu <span aria-hidden="true" className="freccia">→</span>
        </Link>
      </div>
    </div>
  );
}

export default function ModuloContatto({ argomentoIniziale = "info" }: { argomentoIniziale?: ArgomentoMessaggio }) {
  const utente = useUtente();
  const { piano, pasti, pronto } = usePiano();

  const [campi, setCampi] = useState<Campi>(() => ({
    nome: null,
    email: null,
    telefono: "",
    comune: "",
    argomento: argomentoIniziale,
    messaggio: "",
  }));
  const [allega, setAllega] = useState(true);
  const [esca, setEsca] = useState("");
  const [provato, setProvato] = useState(false);
  const [stato, setStato] = useState<Stato>("modifica");
  const [errore, setErrore] = useState<ErroreInvio | null>(null);
  const [inviato, setInviato] = useState<Inviato | null>(null);
  const [fuoco, setFuoco] = useState<{ id: string; n: number } | null>(null);
  const inCorso = useRef(false);
  const titoloEsito = useRef<HTMLHeadingElement>(null);

  const allegato = useMemo(() => (pronto ? bloccoSettimana(piano) : ""), [piano, pronto]);
  const haSettimana = allegato !== "";
  const allegatoInviato = allega && haSettimana ? allegato : "";
  const pastiAllegati = haSettimana ? allegato.split("\n").length - 1 : 0;

  const dati: DatiModulo = {
    nome: campi.nome ?? utente?.name ?? "",
    email: campi.email ?? utente?.email ?? "",
    telefono: campi.telefono,
    comune: campi.comune,
    argomento: campi.argomento,
    messaggio: campi.messaggio,
  };
  const errori = validaModulo(dati, allegatoInviato);
  const mostra = (c: CampoModulo) => (provato ? errori[c] : undefined);
  const massimo = spazioPerMessaggio(allegatoInviato);
  const scritti = campi.messaggio.length;
  const restano = massimo - scritti;
  const inviando = stato === "invio";

  // Il fuoco si sposta dopo il render, quando i messaggi d'errore sono gia'
  // nel DOM e aria-describedby li trova.
  useEffect(() => {
    if (fuoco) document.getElementById(fuoco.id)?.focus();
  }, [fuoco]);

  // A invio riuscito il modulo sparisce: il fuoco va sul titolo dell'esito
  // invece di cadere in fondo alla pagina.
  useEffect(() => {
    if (stato === "inviato") titoloEsito.current?.focus();
  }, [stato]);

  const aggiorna = <K extends keyof Campi>(k: K, v: Campi[K]) => setCampi((c) => ({ ...c, [k]: v }));

  async function invia(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Doppio clic o Invio ripetuto: lo stato arriva al render successivo, il ref subito.
    if (inCorso.current) return;
    setProvato(true);
    setErrore(null);
    const primo = primoErrore(errori);
    if (primo) {
      setFuoco((f) => ({ id: ID_CAMPO[primo], n: (f?.n ?? 0) + 1 }));
      return;
    }
    inCorso.current = true;
    setStato("invio");
    try {
      await api.inviaMessaggio(preparaMessaggio(dati, allegatoInviato, esca));
      setInviato({ nome: dati.nome.trim(), email: dati.email.trim(), telefono: dati.telefono.trim() });
      setStato("inviato");
    } catch (err) {
      setErrore(spiegaErroreInvio(err));
      setStato("modifica");
    } finally {
      inCorso.current = false;
    }
  }

  function unAltro() {
    // I recapiti restano: chi scrive di nuovo e' la stessa persona.
    setCampi((c) => ({ ...c, nome: dati.nome, email: dati.email, messaggio: "" }));
    setProvato(false);
    setErrore(null);
    setInviato(null);
    setStato("modifica");
    setFuoco((f) => ({ id: ID_CAMPO.messaggio, n: (f?.n ?? 0) + 1 }));
  }

  const annuncio = inviando
    ? "Invio in corso."
    : stato === "inviato"
      ? "Messaggio inviato. Matteo ti risponde di solito entro un giorno lavorativo."
      : "";

  return (
    <div>
      <p className="sr-only" aria-live="polite">
        {annuncio}
      </p>

      {stato === "inviato" && inviato ? (
        <Esito inviato={inviato} proponiAccount={!utente && pasti > 0} titolo={titoloEsito} onAltro={unAltro} />
      ) : (
        <form onSubmit={invia} noValidate aria-busy={inviando} className="relative grid content-start gap-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="campo">
              <label htmlFor="c-nome">Nome</label>
              <input
                id="c-nome"
                value={dati.nome}
                onChange={(e) => aggiorna("nome", e.target.value)}
                autoComplete="name"
                maxLength={LIMITI.nome}
                aria-invalid={!!mostra("nome")}
                aria-describedby={ids(!!mostra("nome") && "c-nome-e")}
              />
              <Errore id="c-nome-e" testo={mostra("nome")} />
            </div>
            <div className="campo">
              <label htmlFor="c-comune">Comune · facoltativo</label>
              <input
                id="c-comune"
                value={dati.comune}
                onChange={(e) => aggiorna("comune", e.target.value)}
                autoComplete="address-level2"
                maxLength={LIMITI.comune}
                placeholder="Pescara, Montesilvano…"
                aria-invalid={!!mostra("comune")}
                aria-describedby={ids(!!mostra("comune") && "c-comune-e")}
              />
              <Errore id="c-comune-e" testo={mostra("comune")} />
            </div>
          </div>

          <fieldset
            className="grid min-w-0 gap-4"
            aria-describedby={ids("c-recapito-h", !!mostra("recapito") && "c-recapito-e")}
          >
            <legend className="font-disp text-xs font-semibold tracking-[.18em] uppercase">
              Dove ti risponde Matteo
            </legend>
            <p id="c-recapito-h" className="mt-2 text-sm text-muted">
              Email o telefono: <strong className="text-ink">ne basta uno</strong>. Se li lasci entrambi, Matteo
              sceglie il più comodo.
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="campo">
                <label htmlFor="c-email">Email</label>
                <input
                  id="c-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  spellCheck={false}
                  value={dati.email}
                  onChange={(e) => aggiorna("email", e.target.value)}
                  maxLength={LIMITI.email}
                  aria-invalid={!!(mostra("email") || mostra("recapito"))}
                  aria-describedby={ids(!!mostra("email") && "c-email-e", !!mostra("recapito") && "c-recapito-e")}
                />
                <Errore id="c-email-e" testo={mostra("email")} />
              </div>
              <div className="campo">
                <label htmlFor="c-telefono">Telefono</label>
                <input
                  id="c-telefono"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={dati.telefono}
                  onChange={(e) => aggiorna("telefono", e.target.value)}
                  maxLength={LIMITI.telefono}
                  aria-invalid={!!(mostra("telefono") || mostra("recapito"))}
                  aria-describedby={ids(
                    !!mostra("telefono") && "c-telefono-e",
                    !!mostra("recapito") && "c-recapito-e",
                  )}
                />
                <Errore id="c-telefono-e" testo={mostra("telefono")} />
              </div>
            </div>
            {mostra("recapito") ? (
              <p id="c-recapito-e" className="text-sm font-semibold text-[#a3261b]">
                {mostra("recapito")}
              </p>
            ) : null}
          </fieldset>

          <div className="campo">
            <label htmlFor="c-argomento">Di cosa vuoi parlare</label>
            <select
              id="c-argomento"
              value={dati.argomento}
              onChange={(e) => aggiorna("argomento", argomentoDaParam(e.target.value))}
              aria-invalid={!!mostra("argomento")}
              aria-describedby={ids(!!mostra("argomento") && "c-argomento-e")}
            >
              {ARGOMENTI.map((a) => (
                <option key={a} value={a}>
                  {etichettaArgomento(a)}
                </option>
              ))}
            </select>
            <Errore id="c-argomento-e" testo={mostra("argomento")} />
          </div>

          <div className="campo">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <label htmlFor="c-messaggio">Messaggio</label>
              <p
                id="c-messaggio-conta"
                className={`num text-xs ${restano < 0 ? "font-bold text-[#a3261b]" : "text-muted"}`}
              >
                {scritti} / {massimo}
                <span className="sr-only"> caratteri, almeno {LIMITI.messaggioMin}</span>
              </p>
            </div>
            <textarea
              id="c-messaggio"
              rows={6}
              value={campi.messaggio}
              onChange={(e) => aggiorna("messaggio", e.target.value)}
              maxLength={Math.max(massimo, scritti)}
              placeholder="Cosa ti serve, per quanti pasti, da quando. Allergie o domande sulla consegna."
              aria-invalid={!!mostra("messaggio")}
              aria-describedby={ids("c-messaggio-conta", !!mostra("messaggio") && "c-messaggio-e")}
              className="resize-y"
            />
            <Errore id="c-messaggio-e" testo={mostra("messaggio")} />
            {/* Annuncia solo le soglie, non ogni tasto. */}
            <p className="sr-only" aria-live="polite">
              {restano <= 0
                ? "Hai raggiunto il limite di caratteri."
                : restano <= 100
                  ? "Restano meno di 100 caratteri."
                  : ""}
            </p>
          </div>

          <div className="bg-paper-2 p-4 md:p-5">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 font-semibold has-[:disabled]:cursor-default">
              <input
                type="checkbox"
                className="h-5 w-5 shrink-0 accent-[#121412]"
                checked={allega && haSettimana}
                disabled={!haSettimana}
                onChange={(e) => setAllega(e.target.checked)}
                aria-describedby="c-allega-h"
              />
              Allega la mia settimana
            </label>
            <p id="c-allega-h" className="min-h-[3.1em] text-sm text-muted sm:min-h-[1.55em]">
              {!pronto
                ? "Cerco la settimana su questo dispositivo…"
                : haSettimana
                  ? `${pastiAllegati} ${pastiAllegati === 1 ? "pasto" : "pasti"} dal compositore, in fondo al messaggio.`
                  : "Il compositore è vuoto: componi la settimana per allegarla."}
            </p>
            {haSettimana ? (
              <details className="mt-1">
                <summary className="flex min-h-11 cursor-pointer items-center text-sm font-bold underline decoration-2 underline-offset-4">
                  Vedi cosa viene allegato
                </summary>
                <pre className="mt-2 max-h-56 overflow-auto bg-paper p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                  {allegato}
                </pre>
              </details>
            ) : (
              <p className="mt-1 flex min-h-11 items-center text-sm">
                <Link href="/settimana" className="link">
                  Componi la settimana
                </Link>
              </p>
            )}
          </div>

          {/* Esca per i bot: fuori dallo schermo, fuori dal Tab, nascosta ai
              lettori di schermo. Una persona non la vede mai, un bot che
              riempie tutto si'. */}
          <div aria-hidden="true" className="absolute top-0 -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor="c-hp">Non compilare questo campo</label>
            <input
              id="c-hp"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={esca}
              onChange={(e) => setEsca(e.target.value)}
            />
          </div>

          <p className="text-sm text-muted">
            Usiamo nome e recapiti solo per risponderti su questa richiesta, niente newsletter.{" "}
            <Link href="/privacy" className="link text-ink">
              Informativa privacy
            </Link>
          </p>

          <div>
            <div role="alert">
              {errore ? (
                <div className="mb-5 border-l-4 border-[#a3261b] bg-paper-2 p-4">
                  <p className="font-semibold text-[#a3261b]">
                    {errore.troppi ? "Troppi messaggi in poco tempo." : "Il messaggio non è partito."}
                  </p>
                  <p className="mt-1 text-sm">{errore.testo}</p>
                  <p className="mt-2 text-sm">
                    Il testo resta qui.{" "}
                    <a href={emailDaModulo(dati, allegatoInviato)} className="link">
                      Invialo via email a {EMAIL_CONTATTI}
                    </a>
                  </p>
                </div>
              ) : null}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <button
                type="submit"
                className="btn btn-ink w-full whitespace-normal text-center sm:w-auto sm:min-w-[17rem]"
                disabled={inviando}
              >
                {inviando ? (
                  "Invio in corso…"
                ) : (
                  <>
                    Invia il messaggio <span aria-hidden="true" className="freccia">→</span>
                  </>
                )}
              </button>
              <p className="text-sm text-muted">Risposta di solito entro un giorno lavorativo.</p>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

/** La stessa cosa, con l'argomento preso da `?servizio=` o `?argomento=`. Va dentro <Suspense>. */
export function ModuloContattoDaQuery() {
  const p = useSearchParams();
  return <ModuloContatto argomentoIniziale={argomentoDaParam(p.get("argomento") ?? p.get("servizio"))} />;
}
