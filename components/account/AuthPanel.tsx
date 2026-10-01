"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import {
  DESTINAZIONE_PREDEFINITA,
  destinazioneSicura,
  emailValida,
  erroreDiRitorno,
  hrefAccedi,
  modoDa,
  PASSWORD_MAX,
  PASSWORD_MIN,
  traduciErroreAuth,
  type ErroreAuth,
  type ModoAccesso,
} from "@/lib/account";
import { api, type Providers } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { impostaUtente, useSessione } from "./sessione";
import { Avviso, CampoPassword, IconaApple, IconaGoogle, RequisitiPassword, Stato } from "./ui";
import Vantaggi from "./Vantaggi";

/* /accedi: accesso, registrazione e recupero in tre schede.

   Si torna sempre a `next` (un percorso interno qualunque, controllato da
   destinazioneSicura): dopo la password, dopo Google e dopo il link di verifica,
   che better-auth costruisce con lo stesso callbackURL. */

const MODI: { id: ModoAccesso; etichetta: string; titolo: string }[] = [
  { id: "accedi", etichetta: "Accedi", titolo: "Bentornato." },
  { id: "crea", etichetta: "Crea account", titolo: "Crea il tuo account." },
  { id: "recupera", etichetta: "Recupera", titolo: "Recupera l’accesso." },
];

type Attesa = null | "email" | "google" | "apple" | "link" | "esci";
type Campo = "nome" | "email" | "password" | "conferma";
type ErroriCampo = Partial<Record<Campo, string>>;
type Inviata = { tipo: "verifica" | "recupero"; email: string };

const ERRORE_RETE: ErroreAuth = traduciErroreAuth({ status: 0 }, "accesso");

export default function AuthPanel() {
  const parametri = useSearchParams();
  const router = useRouter();
  const destinazione = destinazioneSicura(parametri.get("next"));
  const { utente } = useSessione();

  const [modo, setModo] = useState<ModoAccesso>(() => modoDa(parametri.get("modo")));
  const [providers, setProviders] = useState<Providers | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [conferma, setConferma] = useState("");
  const [attesa, setAttesa] = useState<Attesa>(null);
  const [errore, setErrore] = useState<ErroreAuth | null>(() => {
    const m = erroreDiRitorno(parametri.get("error"));
    return m ? { tipo: "altro", messaggio: m } : null;
  });
  const [erroriCampo, setErroriCampo] = useState<ErroriCampo>({});
  const [inviata, setInviata] = useState<Inviata | null>(null);
  const [notizia, setNotizia] = useState("");

  const refErrore = useRef<HTMLDivElement>(null);
  const refTitoloInviata = useRef<HTMLHeadingElement>(null);
  const fuocoAlCampo = useRef(false);

  /* Chi e' gia' dentro va dritto a destinazione. L'unica eccezione: un cliente
     mandato qui dal pannello di Matteo, che rimbalzerebbe avanti e indietro. */
  const soloMatteo = /^\/dashboard(?:[/?#]|$)/.test(destinazione);
  const bloccato = !!utente && soloMatteo && utente.role !== "admin";
  useEffect(() => {
    if (utente && !bloccato) router.replace(destinazione);
  }, [utente, bloccato, destinazione, router]);

  useEffect(() => {
    let vivo = true;
    // Se /api/providers non risponde il modulo resta usabile: sara' better-auth a dire cosa non va.
    api.providers().then(
      (p) => { if (vivo) setProviders(p); },
      () => {},
    );
    return () => {
      vivo = false;
    };
  }, []);

  // Al primo arrivo il fuoco va sul primo campo, o sull'errore se ne arriva uno dall'URL.
  useEffect(() => {
    if (!refErrore.current) document.getElementById(primoCampo(modoDa(parametri.get("modo"))))?.focus();
    // Solo al montaggio: i cambi di scheda hanno il loro effetto qui sotto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (errore) refErrore.current?.focus();
  }, [errore]);

  useEffect(() => {
    if (!fuocoAlCampo.current) return;
    fuocoAlCampo.current = false;
    document.getElementById(primoCampo(modo))?.focus();
  }, [modo]);

  useEffect(() => {
    if (inviata) refTitoloInviata.current?.focus();
  }, [inviata]);

  /* L'errore di un campo sparisce appena lo si corregge: restare a dire "troppo
     corta" sotto una password ormai lunga a sufficienza fa dubitare del modulo. */
  function scrivi(campo: Campo, set: (v: string) => void, valore: string) {
    set(valore);
    setErroriCampo((e) => {
      if (!e[campo] && !(campo === "password" && e.conferma)) return e;
      const resto = { ...e };
      delete resto[campo];
      // Cambiare la password rende vecchio anche "non coincidono" sotto il secondo campo.
      if (campo === "password") delete resto.conferma;
      return resto;
    });
  }

  function cambiaModo(prossimo: ModoAccesso, conFuoco: boolean) {
    fuocoAlCampo.current = conFuoco;
    setModo(prossimo);
    setErrore(null);
    setErroriCampo({});
    setNotizia("");
    setInviata(null);
  }

  function suTastoSchede(e: KeyboardEvent<HTMLDivElement>) {
    const i = MODI.findIndex((m) => m.id === modo);
    const j =
      e.key === "ArrowRight" ? (i + 1) % MODI.length
      : e.key === "ArrowLeft" ? (i - 1 + MODI.length) % MODI.length
      : e.key === "Home" ? 0
      : e.key === "End" ? MODI.length - 1
      : -1;
    if (j < 0) return;
    e.preventDefault();
    cambiaModo(MODI[j].id, false);
    document.getElementById(`scheda-${MODI[j].id}`)?.focus();
  }

  function controllaCampi(): ErroriCampo {
    const e: ErroriCampo = {};
    if (modo === "crea") {
      if (!nome.trim()) e.nome = "Scrivi il tuo nome: è così che Matteo sa chi sei.";
      else if (nome.trim().length > 100) e.nome = "Il nome può avere al massimo 100 caratteri.";
    }
    if (!email.trim()) e.email = "Scrivi la tua email.";
    else if (!emailValida(email)) e.email = "L’indirizzo email non sembra valido: controlla che sia scritto bene.";
    if (modo === "accedi" && !password) e.password = "Scrivi la password.";
    if (modo === "crea") {
      if (password.length < PASSWORD_MIN) e.password = `La password deve avere almeno ${PASSWORD_MIN} caratteri.`;
      else if (password.length > PASSWORD_MAX) e.password = `La password può avere al massimo ${PASSWORD_MAX} caratteri.`;
      if (!e.password && conferma !== password) e.conferma = "Le due password non coincidono.";
    }
    return e;
  }

  async function invia(evento: FormEvent) {
    evento.preventDefault();
    if (attesa) return;
    setNotizia("");
    const campi = controllaCampi();
    setErroriCampo(campi);
    const primo = (["nome", "email", "password", "conferma"] as const).find((k) => campi[k]);
    if (primo) {
      document.getElementById(`acc-${primo}`)?.focus();
      return;
    }
    setErrore(null);
    if (modo === "accedi") await accedi();
    else if (modo === "crea") await crea();
    else await recupera();
  }

  async function accedi() {
    setAttesa("email");
    try {
      const r = await authClient.signIn.email({ email: email.trim(), password, callbackURL: destinazione, rememberMe: true });
      if (r.error) {
        setErrore(traduciErroreAuth(r.error, "accesso"));
        setAttesa(null);
        return;
      }
      // Pagina ricaricata da capo: nav, piano e sessione ripartono puliti. "replace": /accedi non resta nella cronologia,
      // altrimenti il tasto indietro riporta qui e questa pagina rimanda subito avanti (non si esce piu').
      window.location.replace(destinazione);
    } catch {
      setErrore(ERRORE_RETE);
      setAttesa(null);
    }
  }

  async function crea() {
    setAttesa("email");
    try {
      const r = await authClient.signUp.email({ name: nome.trim(), email: email.trim(), password, callbackURL: destinazione });
      if (r.error) {
        setErrore(traduciErroreAuth(r.error, "registrazione"));
        setAttesa(null);
        return;
      }
      if (r.data?.token) {
        window.location.replace(destinazione);
        return;
      }
      // Con la verifica attiva l'account aspetta il link: niente sessione finche' non si apre.
      setPassword("");
      setConferma("");
      setInviata({ tipo: "verifica", email: email.trim() });
      setAttesa(null);
    } catch {
      setErrore(ERRORE_RETE);
      setAttesa(null);
    }
  }

  async function recupera() {
    if (attesa) return;
    setAttesa("email");
    try {
      const ritorno = destinazione === DESTINAZIONE_PREDEFINITA ? "" : `?next=${encodeURIComponent(destinazione)}`;
      const r = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: `${window.location.origin}/reimposta-password${ritorno}`,
      });
      if (r.error) setErrore(traduciErroreAuth(r.error, "recupero"));
      else if (inviata) setNotizia("Ti abbiamo mandato un altro link.");
      else setInviata({ tipo: "recupero", email: email.trim() });
    } catch {
      setErrore(ERRORE_RETE);
    }
    setAttesa(null);
  }

  async function inviaLinkVerifica(indirizzo: string) {
    if (attesa) return;
    setAttesa("link");
    setNotizia("");
    try {
      const r = await authClient.sendVerificationEmail({ email: indirizzo, callbackURL: destinazione });
      if (r.error) setErrore(traduciErroreAuth(r.error, "verifica"));
      else {
        setErrore(null);
        setNotizia(`Nuovo link inviato a ${indirizzo}. Controlla anche lo spam.`);
      }
    } catch {
      setErrore(ERRORE_RETE);
    }
    setAttesa(null);
  }

  async function social(provider: "google" | "apple") {
    if (attesa) return;
    setAttesa(provider);
    setErrore(null);
    try {
      const r = await authClient.signIn.social({
        provider,
        callbackURL: destinazione,
        newUserCallbackURL: destinazione,
        // better-auth ci aggiunge ?error=…: la pagina lo legge e lo spiega.
        errorCallbackURL: hrefAccedi(destinazione),
      });
      if (r.error) {
        setErrore(traduciErroreAuth(r.error, "social"));
        setAttesa(null);
      }
      // Senza errore better-auth sta gia' aprendo la pagina del provider: si resta in attesa.
    } catch {
      setErrore(ERRORE_RETE);
      setAttesa(null);
    }
  }

  async function esci() {
    if (attesa) return;
    setAttesa("esci");
    try {
      await authClient.signOut();
    } catch {
      // Anche se il server non risponde, la pagina torna al modulo: il cookie scade da solo.
    }
    impostaUtente(null);
    setAttesa(null);
  }

  const emailAttiva = providers?.email ?? true;
  const mailAttiva = providers?.emailVerification ?? true;
  const titolo = MODI.find((m) => m.id === modo)!.titolo;

  function campoEmail(autoComplete: "username" | "email") {
    return (
      <div className="campo">
        <label htmlFor="acc-email">Email</label>
        <input
          id="acc-email"
          type="email"
          inputMode="email"
          autoComplete={autoComplete}
          autoCapitalize="none"
          spellCheck={false}
          maxLength={254}
          value={email}
          onChange={(e) => scrivi("email", setEmail, e.target.value)}
          aria-invalid={erroriCampo.email ? true : undefined}
          aria-describedby={erroriCampo.email ? "acc-email-errore" : undefined}
        />
        {erroriCampo.email ? <p id="acc-email-errore" className="errore">{erroriCampo.email}</p> : null}
      </div>
    );
  }

  const azioniErrore = errore ? (
    errore.tipo === "credenziali" ? (
      <button type="button" className="link text-sm" onClick={() => cambiaModo("recupera", true)}>
        Reimposta la password
      </button>
    ) : errore.tipo === "esiste" ? (
      <>
        <button type="button" className="btn btn-ink btn-sm" onClick={() => { setPassword(""); setConferma(""); cambiaModo("accedi", true); }}>
          Accedi con questa email
        </button>
        <button type="button" className="link text-sm" onClick={() => cambiaModo("recupera", true)}>
          Reimposta la password
        </button>
      </>
    ) : errore.tipo === "non-verificata" && emailValida(email) ? (
      <button type="button" className="btn btn-ink btn-sm" aria-disabled={attesa ? true : undefined} onClick={() => void inviaLinkVerifica(email.trim())}>
        {attesa === "link" ? "Invio…" : "Invia di nuovo il link"}
      </button>
    ) : null
  ) : null;

  let contenuto: ReactNode;

  if (utente) {
    contenuto = (
      <div className="grid gap-5">
        <h2 className="titolo-s">Sei già dentro.</h2>
        {bloccato ? (
          <>
            <p className="text-muted">
              Sei collegato come <strong className="text-ink">{utente.email}</strong>, che non è l’account di Matteo. Per aprire il pannello esci ed entra con l’account amministratore.
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn btn-ink btn-sm" aria-disabled={attesa === "esci" ? true : undefined} onClick={() => void esci()}>
                {attesa === "esci" ? "Esco…" : "Esci e cambia account"}
              </button>
              <Link href="/account" className="btn btn-linea btn-sm">Vai al tuo account</Link>
            </div>
          </>
        ) : (
          <>
            <p className="text-muted" role="status">Ti porto avanti…</p>
            <Link href={destinazione} className="link self-start">Continua <span aria-hidden="true">→</span></Link>
          </>
        )}
      </div>
    );
  } else if (inviata) {
    contenuto = (
      <div className="grid gap-5">
        <h2 ref={refTitoloInviata} tabIndex={-1} className="titolo-s">Controlla la posta.</h2>
        {inviata.tipo === "verifica" ? (
          <>
            <p>
              Ti abbiamo mandato un link a <strong className="[overflow-wrap:anywhere]">{inviata.email}</strong>. Aprilo per attivare l’account: tornerai qui già dentro.
            </p>
            <p className="text-sm text-muted">
              Non lo trovi? Guarda nello spam. Se con questa email hai già un account non ne creiamo un altro: accedi, o reimposta la password.
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn btn-ink btn-sm" aria-disabled={attesa ? true : undefined} onClick={() => void inviaLinkVerifica(inviata.email)}>
                {attesa === "link" ? "Invio…" : "Invia di nuovo il link"}
              </button>
              <button type="button" className="btn btn-linea btn-sm" onClick={() => cambiaModo("accedi", true)}>
                Ho confermato: accedi
              </button>
            </div>
            <button type="button" className="link self-start text-sm" onClick={() => cambiaModo("crea", true)}>
              Hai sbagliato indirizzo?
            </button>
          </>
        ) : (
          <>
            <p>
              Se <strong className="[overflow-wrap:anywhere]">{inviata.email}</strong> è registrata, ti arriva un link per scegliere una nuova password. Vale un’ora.
            </p>
            <p className="text-sm text-muted">Non lo trovi? Guarda nello spam, oppure chiedine un altro.</p>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn btn-ink btn-sm" aria-disabled={attesa ? true : undefined} onClick={() => void recupera()}>
                {attesa === "email" ? "Invio…" : "Invia di nuovo"}
              </button>
              <button type="button" className="btn btn-linea btn-sm" onClick={() => cambiaModo("accedi", true)}>
                Torna all’accesso
              </button>
            </div>
          </>
        )}
        {errore ? <Avviso ref={refErrore} tipo="errore">{errore.messaggio}</Avviso> : null}
        <Stato>{notizia ? <p className="acc-avviso acc-avviso-successo">{notizia}</p> : null}</Stato>
      </div>
    );
  } else {
    contenuto = (
      <>
        <div role="tablist" aria-label="Come vuoi entrare" className="acc-schede-accesso" onKeyDown={suTastoSchede}>
          {MODI.map((m) => (
            <button
              key={m.id}
              id={`scheda-${m.id}`}
              type="button"
              role="tab"
              aria-selected={modo === m.id}
              aria-controls="pannello-accesso"
              tabIndex={modo === m.id ? 0 : -1}
              onClick={() => cambiaModo(m.id, true)}
            >
              {m.etichetta}
            </button>
          ))}
        </div>

        <div id="pannello-accesso" role="tabpanel" aria-labelledby={`scheda-${modo}`} className="mt-7">
          <h2 className="titolo-s">{titolo}</h2>

          {errore ? (
            <Avviso ref={refErrore} tipo="errore" className="mt-5" azioni={azioniErrore}>
              {errore.messaggio}
            </Avviso>
          ) : null}
          <Stato className="mt-4">{notizia ? <p className="acc-avviso acc-avviso-successo">{notizia}</p> : null}</Stato>

          {!emailAttiva ? (
            <Avviso tipo="info" className="mt-5">
              L’accesso con email non è disponibile in questo momento. Riprova tra poco o scrivi a{" "}
              <a className="underline" href="mailto:info@fuelchef.it">info@fuelchef.it</a>.
            </Avviso>
          ) : null}

          {modo === "recupera" && !mailAttiva ? (
            <Avviso tipo="info" className="mt-5">
              Il recupero via email non è ancora attivo. Scrivi a{" "}
              <a className="underline" href="mailto:info@fuelchef.it?subject=Recupero%20accesso">info@fuelchef.it</a>{" "}
              dall’indirizzo del tuo account e ti aiutiamo noi.
            </Avviso>
          ) : (
            <form noValidate onSubmit={(e) => void invia(e)} className="mt-6 grid gap-5" aria-busy={attesa === "email"}>
              {modo === "recupera" ? (
                <p className="text-muted">Scrivi l’email del tuo account: ti mandiamo un link per scegliere una nuova password.</p>
              ) : null}

              {modo === "crea" ? (
                <div className="campo">
                  <label htmlFor="acc-nome">Nome e cognome</label>
                  <input
                    id="acc-nome"
                    autoComplete="name"
                    autoCapitalize="words"
                    maxLength={100}
                    value={nome}
                    onChange={(e) => scrivi("nome", setNome, e.target.value)}
                    aria-invalid={erroriCampo.nome ? true : undefined}
                    aria-describedby={erroriCampo.nome ? "acc-nome-errore" : undefined}
                  />
                  {erroriCampo.nome ? <p id="acc-nome-errore" className="errore">{erroriCampo.nome}</p> : null}
                </div>
              ) : null}

              {campoEmail(modo === "crea" ? "email" : "username")}

              {modo === "accedi" ? (
                <CampoPassword
                  id="acc-password"
                  etichetta="Password"
                  autoComplete="current-password"
                  valore={password}
                  onCambia={(v) => scrivi("password", setPassword, v)}
                  errore={erroriCampo.password}
                  nota={
                    <button type="button" className="link text-sm normal-case" onClick={() => cambiaModo("recupera", true)}>
                      Password dimenticata?
                    </button>
                  }
                />
              ) : null}

              {modo === "crea" ? (
                <>
                  <CampoPassword
                    id="acc-password"
                    etichetta="Password"
                    autoComplete="new-password"
                    valore={password}
                    onCambia={(v) => scrivi("password", setPassword, v)}
                    errore={erroriCampo.password}
                    descrittaDa="acc-requisiti"
                  />
                  <CampoPassword
                    id="acc-conferma"
                    etichetta="Ripeti la password"
                    autoComplete="new-password"
                    valore={conferma}
                    onCambia={(v) => scrivi("conferma", setConferma, v)}
                    errore={erroriCampo.conferma}
                    descrittaDa="acc-requisiti"
                  />
                  <RequisitiPassword id="acc-requisiti" password={password} conferma={conferma} />
                </>
              ) : null}

              {/* aria-disabled e non disabled durante l'attesa: un bottone che si disabilita mentre ha il fuoco lo fa
                  cadere sul body, e chi usa la tastiera ricomincia da capo la pagina. */}
              <button type="submit" className="btn btn-lime mt-1 w-full" disabled={!emailAttiva} aria-disabled={attesa ? true : undefined}>
                {attesa === "email"
                  ? modo === "accedi" ? "Accesso in corso…" : modo === "crea" ? "Creo l’account…" : "Invio…"
                  : modo === "accedi" ? "Accedi" : modo === "crea" ? "Crea l’account" : "Invia il link"}
              </button>
            </form>
          )}

          {modo !== "recupera" && (providers?.google || providers?.apple) ? (
            <div className="mt-7">
              <p className="acc-oppure"><span>oppure</span></p>
              <div className="mt-5 grid gap-3">
                {providers.google ? (
                  <button type="button" className="btn btn-linea btn-sm acc-btn-social" aria-disabled={attesa ? true : undefined} onClick={() => void social("google")}>
                    <IconaGoogle />
                    {attesa === "google" ? "Ti porto su Google…" : "Continua con Google"}
                  </button>
                ) : null}
                {providers.apple ? (
                  <button type="button" className="btn btn-linea btn-sm acc-btn-social" aria-disabled={attesa ? true : undefined} onClick={() => void social("apple")}>
                    <IconaApple />
                    {attesa === "apple" ? "Ti porto su Apple…" : "Continua con Apple"}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          <p className="mt-7 text-xs leading-relaxed text-muted">
            {modo === "crea"
              ? "Creando l’account accetti il trattamento dei dati necessario a gestire profilo e richieste. "
              : "Usiamo i tuoi dati solo per gestire profilo e richieste. "}
            Leggi l’<Link href="/privacy" className="underline underline-offset-2">informativa privacy</Link>.
          </p>
        </div>
      </>
    );
  }

  return (
    <section className="acc-testata acc-schermata wrap pb-[var(--sezione)]">
      <div className="acc-accesso">
        <div className="acc-accesso-intro notte">
          <p className="occhiello">Il tuo spazio FUEL LAB</p>
          <h1 className="titolo acc-accesso-titolo">La tua settimana, sempre con te.</h1>
          <p className="acc-accesso-lead text-steel">
            Una richiesta non è un ordine: Matteo conferma disponibilità, giorno e prezzo prima di cucinare.
          </p>
        </div>
        <div className="acc-accesso-form">{contenuto}</div>
        <div className="acc-accesso-vantaggi notte">
          <Vantaggi />
          <Link href="/menu" className="link mt-8 inline-block text-lime">Esplora il menu →</Link>
        </div>
      </div>
    </section>
  );
}

function primoCampo(modo: ModoAccesso) {
  return modo === "crea" ? "acc-nome" : "acc-email";
}
