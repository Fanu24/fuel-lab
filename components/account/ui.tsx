"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { eSessioneScaduta, hrefAccedi, PASSWORD_MAX, requisitiPassword } from "@/lib/account";

/* I pezzi che accesso, recupero e area cliente condividono: avvisi, campo
   password, finestra di conferma, scheletri di caricamento, icone. */

/* ---------- Avvisi ---------- */

type TipoAvviso = "errore" | "info" | "successo";

/**
 * Un riquadro di messaggio. Gli errori sono `role="alert"` e si possono mettere
 * a fuoco (tabIndex -1): chi ha appena premuto un bottone viene portato li'.
 */
export const Avviso = forwardRef(function Avviso(
  { tipo = "info", titolo, children, azioni, className = "" }: {
    tipo?: TipoAvviso;
    titolo?: string;
    children: ReactNode;
    azioni?: ReactNode;
    className?: string;
  },
  ref: Ref<HTMLDivElement>,
) {
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role={tipo === "errore" ? "alert" : undefined}
      className={`acc-avviso acc-avviso-${tipo} ${className}`}
    >
      {titolo ? <p className="acc-avviso-titolo">{titolo}</p> : null}
      <div>{children}</div>
      {azioni ? <div className="acc-avviso-azioni">{azioni}</div> : null}
    </div>
  );
});

/**
 * Una regione `aria-live` sempre presente: i lettori di schermo annunciano cio'
 * che ci compare dentro. Un nodo live aggiunto insieme al testo spesso non
 * viene letto, per questo il contenitore resta anche quando e' vuoto.
 */
export function Stato({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <div aria-live="polite" aria-atomic="true" className={className}>
      {children}
    </div>
  );
}

/**
 * "Accedi di nuovo", per quando la sessione e' finita a meta' di un'azione: si
 * rientra e si torna esattamente qui, query compresa (la richiesta a meta' si
 * ritrova, vedi lib/account.ts: leggiBozza).
 */
export function LinkAccediDiNuovo({ className = "btn btn-ink btn-sm" }: { className?: string }) {
  const parametri = useSearchParams();
  const q = parametri.toString();
  return (
    <Link href={hrefAccedi(q ? `/account?${q}` : "/account")} className={className}>
      Accedi di nuovo
    </Link>
  );
}

/**
 * L'esito di un'azione dentro una regione live: verde lime se e' andata, rosso
 * se no. Con `sessione` (il server ha risposto 401) c'e' anche il modo di rientrare.
 */
export function EsitoAzione({
  esito,
  className = "",
}: {
  esito: { ok: boolean; testo: string; sessione?: boolean } | null;
  className?: string;
}) {
  return (
    <Stato className={className}>
      {esito ? (
        <div className={`acc-avviso ${esito.ok ? "acc-avviso-successo" : "acc-avviso-errore"}`}>
          <p>{esito.testo}</p>
          {esito.sessione ? (
            <div className="acc-avviso-azioni">
              <LinkAccediDiNuovo />
            </div>
          ) : null}
        </div>
      ) : null}
    </Stato>
  );
}

/* ---------- Titolo di sezione ---------- */

/** L'h2 di ogni sezione: riceve il fuoco quando si cambia scheda. */
export function TitoloSezione({ id, children, className = "" }: { id: string; children: ReactNode; className?: string }) {
  return (
    <h2 id={id} tabIndex={-1} data-titolo-sezione className={`titolo-s acc-titolo ${className}`}>
      {children}
    </h2>
  );
}

/* ---------- Caricamento ---------- */

export function Scheletro({ righe = 3, className = "" }: { righe?: number; className?: string }) {
  return (
    <div className={`grid gap-3 ${className}`} aria-hidden="true">
      {Array.from({ length: righe }, (_, i) => (
        <div key={i} className="acc-scheletro" style={{ width: `${92 - i * 14}%` }} />
      ))}
    </div>
  );
}

export function Caricamento({ testo = "Carico…", righe = 3 }: { testo?: string; righe?: number }) {
  return (
    <div aria-busy="true" className="grid gap-4">
      <p className="sr-only" role="status">{testo}</p>
      <Scheletro righe={righe} />
    </div>
  );
}

/* ---------- Dati da un'API ---------- */

export type Caricabile<T> =
  | { stato: "attesa" }
  | { stato: "pronto"; dati: T }
  /** `sessione`: il server ha risposto 401, la sessione e' finita (l'area cliente lo verifica e rimanda all'accesso). */
  | { stato: "errore"; messaggio: string; sessione?: boolean };

/**
 * Carica una volta al montaggio (e quando `carica` cambia). `carica` deve essere
 * stabile: una funzione del modulo o un useCallback. `ricarica` non svuota i
 * dati gia' mostrati, li sostituisce quando arrivano i nuovi.
 */
export function useDati<T>(carica: () => Promise<T>, errore: (e: unknown) => string) {
  const [stato, setStato] = useState<Caricabile<T>>({ stato: "attesa" });

  useEffect(() => {
    let vivo = true;
    carica().then(
      (dati) => { if (vivo) setStato({ stato: "pronto", dati }); },
      (e: unknown) => { if (vivo) setStato({ stato: "errore", messaggio: errore(e), sessione: eSessioneScaduta(e) }); },
    );
    return () => {
      vivo = false;
    };
  }, [carica, errore]);

  const ricarica = useCallback(
    () =>
      carica().then(
        (dati) => setStato({ stato: "pronto", dati }),
        (e: unknown) => setStato({ stato: "errore", messaggio: errore(e), sessione: eSessioneScaduta(e) }),
      ),
    [carica, errore],
  );
  const imposta = useCallback((dati: T) => setStato({ stato: "pronto", dati }), []);

  return { ...stato, ricarica, imposta } as Caricabile<T> & { ricarica: () => Promise<void>; imposta: (dati: T) => void };
}

/* ---------- Password ---------- */

export function RequisitiPassword({ id, password, conferma }: { id: string; password: string; conferma?: string }) {
  const requisiti = requisitiPassword(password, conferma);
  return (
    <ul id={id} className="acc-requisiti" aria-live="polite">
      {requisiti.map((r) => (
        <li key={r.id} data-ok={r.ok}>
          <IconaSpunta ok={r.ok} />
          <span>{r.testo}</span>
          <span className="sr-only">{r.ok ? ": fatto" : ": ancora da fare"}</span>
          {r.id === "lunghezza" ? (
            <span className="num acc-requisiti-conta" aria-hidden="true">
              {Math.min(password.length, 99)}/12
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * Campo password con "mostra": il bottone ha sempre la stessa etichetta e dice
 * lo stato con aria-pressed, come chiede il pattern dei toggle.
 */
export function CampoPassword({
  id,
  etichetta,
  valore,
  onCambia,
  autoComplete,
  descrittaDa,
  errore,
  inputRef,
  nota,
}: {
  id: string;
  etichetta: string;
  valore: string;
  onCambia: (v: string) => void;
  autoComplete: "current-password" | "new-password";
  /** id di elementi che descrivono il campo (i requisiti, per esempio) */
  descrittaDa?: string;
  errore?: string;
  inputRef?: Ref<HTMLInputElement>;
  nota?: ReactNode;
}) {
  const [visibile, setVisibile] = useState(false);
  const idErrore = `${id}-errore`;
  const descrizione = [descrittaDa, errore ? idErrore : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="campo">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id}>{etichetta}</label>
        {nota}
      </div>
      <div className="acc-password">
        <input
          id={id}
          ref={inputRef}
          type={visibile ? "text" : "password"}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={PASSWORD_MAX + 20}
          value={valore}
          onChange={(e) => onCambia(e.target.value)}
          aria-invalid={errore ? true : undefined}
          aria-describedby={descrizione}
        />
        <button
          type="button"
          className="acc-occhio"
          aria-pressed={visibile}
          aria-controls={id}
          onClick={() => setVisibile((v) => !v)}
        >
          <IconaOcchio aperto={!visibile} />
          <span className="sr-only">Mostra password</span>
        </button>
      </div>
      {errore ? (
        <p id={idErrore} className="errore">
          {errore}
        </p>
      ) : null}
    </div>
  );
}

/* ---------- Conferma ---------- */

export type RichiestaConferma = {
  titolo: string;
  testo: ReactNode;
  conferma: string;
  annulla?: string;
  pericolosa?: boolean;
};

/**
 * Una finestra di conferma su <dialog> nativo: fuoco intrappolato, Esc per
 * chiudere e fuoco restituito al bottone di partenza li fa il browser.
 * Uso: `const [chiedi, dialogo] = useConferma();` poi `if (await chiedi({...}))`.
 */
export function useConferma(): [(r: RichiestaConferma) => Promise<boolean>, ReactNode] {
  const [richiesta, setRichiesta] = useState<RichiestaConferma | null>(null);
  const risolvi = useRef<((esito: boolean) => void) | null>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const idTitolo = useId();
  const idTesto = useId();

  const chiedi = useCallback(
    (r: RichiestaConferma) =>
      new Promise<boolean>((resolve) => {
        risolvi.current?.(false);
        risolvi.current = resolve;
        setRichiesta(r);
      }),
    [],
  );

  useEffect(() => {
    const d = dialogo.current;
    if (richiesta && d && !d.open) d.showModal();
  }, [richiesta]);

  const chiudi = useCallback((esito: boolean) => {
    const r = risolvi.current;
    risolvi.current = null;
    if (dialogo.current?.open) dialogo.current.close();
    setRichiesta(null);
    r?.(esito);
  }, []);

  const nodo = (
    <dialog
      ref={dialogo}
      className="acc-dialogo"
      aria-labelledby={idTitolo}
      aria-describedby={idTesto}
      onClose={() => {
        if (risolvi.current) chiudi(false);
      }}
    >
      {richiesta ? (
        <div className="grid gap-5">
          <h2 id={idTitolo} className="titolo-s">
            {richiesta.titolo}
          </h2>
          <div id={idTesto} className="grid gap-3 text-[15px] leading-relaxed">
            {richiesta.testo}
          </div>
          <div className="acc-dialogo-azioni">
            <button type="button" className="btn btn-linea btn-sm" autoFocus onClick={() => chiudi(false)}>
              {richiesta.annulla ?? "Annulla"}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${richiesta.pericolosa ? "acc-btn-pericolo" : "btn-ink"}`}
              onClick={() => chiudi(true)}
            >
              {richiesta.conferma}
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  );

  return [chiedi, nodo];
}

/* ---------- Icone ---------- */

export function IconaSpunta({ ok }: { ok: boolean }) {
  return (
    <svg className="acc-requisiti-segno" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      {ok ? (
        <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" />
      ) : (
        <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      )}
    </svg>
  );
}

export function IconaOcchio({ aperto }: { aperto: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {aperto ? null : <path d="M4 4l16 16" strokeLinecap="square" />}
    </svg>
  );
}

export function IconaPersona({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.2-4.2 4.3-6.5 8-6.5s6.8 2.3 8 6.5" strokeLinecap="square" />
    </svg>
  );
}

/** La "G" a colori: le linee guida di Google la vogliono cosi' nei bottoni di accesso. */
export function IconaGoogle() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export function IconaApple() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
      <path d="M16.37 12.62c-.03-2.66 2.17-3.94 2.27-4-1.24-1.81-3.16-2.06-3.84-2.09-1.63-.17-3.19.96-4.02.96-.83 0-2.1-.94-3.46-.91-1.78.03-3.42 1.03-4.34 2.62-1.85 3.21-.47 7.96 1.33 10.56.88 1.27 1.93 2.7 3.3 2.65 1.33-.05 1.83-.86 3.43-.86 1.6 0 2.05.86 3.45.83 1.43-.02 2.33-1.29 3.2-2.57 1.01-1.47 1.42-2.9 1.45-2.97-.03-.01-2.78-1.07-2.77-4.22zM13.73 4.8c.73-.89 1.22-2.12 1.09-3.35-1.05.04-2.33.7-3.08 1.59-.68.78-1.27 2.03-1.11 3.24 1.17.09 2.37-.6 3.1-1.48z" />
    </svg>
  );
}
