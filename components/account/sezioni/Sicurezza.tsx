"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  confermaEliminazione,
  messaggioDa,
  nomeFileDati,
  PAROLA_ELIMINA,
  PASSWORD_MAX,
  PASSWORD_MIN,
  traduciErroreAuth,
} from "@/lib/account";
import { api, type Providers, type Utente } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { Avviso, CampoPassword, EsitoAzione, RequisitiPassword, TitoloSezione, useConferma } from "../ui";
import type { Esito } from "./tipi";

/* Password, sessioni, copia dei dati ed eliminazione (artt. 15, 17 e 20 GDPR).
   L'account di Matteo non si elimina da qui: il server lo rifiuta comunque. */

type Props = { utente: Utente; providers: Providers | null; onEliminato: () => void };

export default function Sicurezza({ utente, providers, onEliminato }: Props) {
  // null finche' non si sa (o se la lettura fallisce): nel dubbio si mostra il modulo della password.
  const [metodi, setMetodi] = useState<string[] | null>(null);
  const [chiedi, dialogo] = useConferma();

  useEffect(() => {
    let vivo = true;
    authClient.listAccounts().then(
      (r) => {
        if (vivo && r.data) setMetodi(r.data.map((a) => a.providerId));
      },
      () => {},
    );
    return () => {
      vivo = false;
    };
  }, []);

  const haPassword = metodi === null || metodi.includes("credential");
  const admin = utente.role === "admin";

  return (
    <section aria-labelledby="t-sicurezza" className="grid gap-8">
      <TitoloSezione id="t-sicurezza">Sicurezza e privacy.</TitoloSezione>

      <div className="grid gap-5 lg:grid-cols-2">
        <article className="acc-card" aria-labelledby="t-password">
          <h3 id="t-password" className="acc-card-titolo">Password</h3>
          {haPassword ? (
            <CambiaPassword utente={utente} />
          ) : (
            <SenzaPassword utente={utente} mailAttiva={!!providers?.emailVerification} />
          )}
        </article>

        <div className="grid content-start gap-5">
          <Sessioni chiedi={chiedi} />
          <IMieiDati />
        </div>
      </div>

      <article className="acc-card acc-card-pericolo" aria-labelledby="t-elimina">
        <h3 id="t-elimina" className="acc-card-titolo">Elimina l’account</h3>
        {admin ? (
          <p className="mt-3 max-w-[60ch] text-muted">
            Questo è l’account amministratore del sito: è protetto e non si può eliminare da qui. Se un giorno servisse
            chiuderlo, va fatto direttamente sul database, dopo aver dato l’accesso a un altro amministratore.
          </p>
        ) : (
          <Elimina haPassword={haPassword} onEliminato={onEliminato} />
        )}
      </article>

      <p className="text-sm text-muted">
        Come trattiamo i tuoi dati, per quanto li conserviamo e come esercitare i tuoi diritti:{" "}
        <Link href="/privacy" className="link text-ink">informativa privacy</Link>.
      </p>
      {dialogo}
    </section>
  );
}

function CambiaPassword({ utente }: { utente: Utente }) {
  const [attuale, setAttuale] = useState("");
  const [nuova, setNuova] = useState("");
  const [conferma, setConferma] = useState("");
  const [errori, setErrori] = useState<Partial<Record<"attuale" | "nuova" | "conferma", string>>>({});
  const [invio, setInvio] = useState(false);
  const [esito, setEsito] = useState<Esito | null>(null);

  async function invia(e: FormEvent) {
    e.preventDefault();
    if (invio) return;
    const err: typeof errori = {};
    if (!attuale) err.attuale = "Scrivi la password che usi adesso.";
    if (nuova.length < PASSWORD_MIN) err.nuova = `La nuova password deve avere almeno ${PASSWORD_MIN} caratteri.`;
    else if (nuova.length > PASSWORD_MAX) err.nuova = `Al massimo ${PASSWORD_MAX} caratteri.`;
    else if (nuova === attuale) err.nuova = "La nuova password deve essere diversa da quella attuale.";
    else if (conferma !== nuova) err.conferma = "Le due password non coincidono.";
    setErrori(err);
    const primo = (["attuale", "nuova", "conferma"] as const).find((k) => err[k]);
    if (primo) {
      document.getElementById(`cp-${primo}`)?.focus();
      return;
    }
    setInvio(true);
    setEsito(null);
    try {
      const r = await authClient.changePassword({ currentPassword: attuale, newPassword: nuova, revokeOtherSessions: true });
      if (r.error) {
        const t = traduciErroreAuth(r.error, "cambio-password");
        if (t.tipo === "password" && r.error.code === "INVALID_PASSWORD") {
          setErrori({ attuale: t.messaggio });
          document.getElementById("cp-attuale")?.focus();
        } else {
          setEsito({ ok: false, testo: t.messaggio });
        }
      } else {
        setAttuale("");
        setNuova("");
        setConferma("");
        setEsito({ ok: true, testo: "Password cambiata. Abbiamo chiuso le sessioni aperte sugli altri dispositivi." });
      }
    } catch {
      setEsito({ ok: false, testo: traduciErroreAuth({ status: 0 }, "cambio-password").messaggio });
    }
    setInvio(false);
  }

  return (
    <form noValidate onSubmit={(e) => void invia(e)} className="mt-5 grid gap-5" aria-busy={invio}>
      {/* Per i gestori di password: sanno a quale account appartiene la nuova. */}
      <input type="email" name="username" autoComplete="username" value={utente.email} readOnly hidden />
      <CampoPassword id="cp-attuale" etichetta="Password attuale" autoComplete="current-password" valore={attuale} onCambia={setAttuale} errore={errori.attuale} />
      <CampoPassword id="cp-nuova" etichetta="Nuova password" autoComplete="new-password" valore={nuova} onCambia={setNuova} errore={errori.nuova} descrittaDa="cp-requisiti" />
      <CampoPassword id="cp-conferma" etichetta="Ripeti la nuova password" autoComplete="new-password" valore={conferma} onCambia={setConferma} errore={errori.conferma} descrittaDa="cp-requisiti" />
      <RequisitiPassword id="cp-requisiti" password={nuova} conferma={conferma} />
      <p className="text-sm text-muted">Cambiandola, chiudiamo le sessioni aperte sugli altri dispositivi.</p>
      <button type="submit" className="btn btn-ink btn-sm justify-self-start" disabled={invio}>
        {invio ? "Salvo…" : "Cambia password"}
      </button>
      <EsitoAzione esito={esito} />
    </form>
  );
}

function SenzaPassword({ utente, mailAttiva }: { utente: Utente; mailAttiva: boolean }) {
  const [invio, setInvio] = useState(false);
  const [esito, setEsito] = useState<Esito | null>(null);

  async function creaPassword() {
    setInvio(true);
    setEsito(null);
    try {
      const r = await authClient.requestPasswordReset({
        email: utente.email,
        redirectTo: `${window.location.origin}/reimposta-password?next=${encodeURIComponent("/account?sezione=sicurezza")}`,
      });
      setEsito(r.error
        ? { ok: false, testo: traduciErroreAuth(r.error, "recupero").messaggio }
        : { ok: true, testo: `Ti abbiamo mandato un link a ${utente.email} per scegliere la password.` });
    } catch {
      setEsito({ ok: false, testo: traduciErroreAuth({ status: 0 }, "recupero").messaggio });
    }
    setInvio(false);
  }

  return (
    <div className="mt-4 grid gap-4">
      <p className="text-muted">Entri con Google: la password la custodisce Google, qui non ce n’è una da cambiare.</p>
      {mailAttiva ? (
        <>
          <p className="text-sm text-muted">Vuoi poter entrare anche con email e password? Ti mandiamo un link per crearne una.</p>
          <button type="button" className="btn btn-ink btn-sm justify-self-start" disabled={invio} onClick={() => void creaPassword()}>
            {invio ? "Invio…" : "Crea una password"}
          </button>
        </>
      ) : null}
      <EsitoAzione esito={esito} />
    </div>
  );
}

function Sessioni({ chiedi }: { chiedi: ReturnType<typeof useConferma>[0] }) {
  const [attesa, setAttesa] = useState<null | "esci" | "ovunque">(null);
  const [esito, setEsito] = useState<Esito | null>(null);

  async function esci() {
    setAttesa("esci");
    try {
      const r = await authClient.signOut();
      if (r.error) {
        setEsito({ ok: false, testo: traduciErroreAuth(r.error, "esci").messaggio });
        setAttesa(null);
        return;
      }
    } catch {
      setEsito({ ok: false, testo: traduciErroreAuth({ status: 0 }, "esci").messaggio });
      setAttesa(null);
      return;
    }
    // Pagina nuova (e niente "indietro" nell'area cliente): nav e sessione ripartono da zero.
    window.location.replace("/");
  }

  async function esciOvunque() {
    const ok = await chiedi({
      titolo: "Uscire da tutti i dispositivi?",
      testo: <p>Chiudiamo ogni sessione aperta, compresa questa: per rientrare servirà di nuovo la password (o Google).</p>,
      conferma: "Esci ovunque",
    });
    if (!ok) return;
    setAttesa("ovunque");
    try {
      const r = await authClient.revokeSessions();
      if (r.error) {
        setEsito({ ok: false, testo: traduciErroreAuth(r.error, "esci").messaggio });
        setAttesa(null);
        return;
      }
      await authClient.signOut().catch(() => undefined);
    } catch {
      setEsito({ ok: false, testo: traduciErroreAuth({ status: 0 }, "esci").messaggio });
      setAttesa(null);
      return;
    }
    window.location.replace("/");
  }

  return (
    <article className="acc-card" aria-labelledby="t-sessioni">
      <h3 id="t-sessioni" className="acc-card-titolo">Sessioni</h3>
      <p className="mt-3 text-muted">Hai usato un computer non tuo, o hai perso il telefono? Esci da tutti i dispositivi insieme.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className="btn btn-ink btn-sm" disabled={!!attesa} onClick={() => void esci()}>
          {attesa === "esci" ? "Esco…" : "Esci"}
        </button>
        <button type="button" className="btn btn-linea btn-sm" disabled={!!attesa} onClick={() => void esciOvunque()}>
          {attesa === "ovunque" ? "Chiudo tutto…" : "Esci da tutti i dispositivi"}
        </button>
      </div>
      <EsitoAzione esito={esito} className="mt-4" />
    </article>
  );
}

function IMieiDati() {
  const [invio, setInvio] = useState(false);
  const [esito, setEsito] = useState<Esito | null>(null);

  async function scarica() {
    setInvio(true);
    setEsito(null);
    try {
      const dati = await api.esportaDati();
      const file = new Blob([JSON.stringify(dati, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = nomeFileDati(new Date());
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      setEsito({ ok: true, testo: "File scaricato: lo trovi nella cartella dei download." });
    } catch (e) {
      setEsito({ ok: false, testo: messaggioDa(e, "Non riesco a preparare il file. Riprova tra poco.") });
    }
    setInvio(false);
  }

  return (
    <article className="acc-card" aria-labelledby="t-dati">
      <h3 id="t-dati" className="acc-card-titolo">I tuoi dati</h3>
      <p className="mt-3 text-muted">
        Una copia di tutto ciò che conserviamo su di te: profilo, settimana salvata, richieste con la loro cronologia, messaggi e accessi.
      </p>
      <button type="button" className="btn btn-ink btn-sm mt-5" disabled={invio} onClick={() => void scarica()}>
        {invio ? "Preparo il file…" : "Scarica i miei dati"}
      </button>
      <p className="mt-3 text-xs text-muted">File JSON, si apre con qualunque editor di testo.</p>
      <EsitoAzione esito={esito} className="mt-4" />
    </article>
  );
}

function Elimina({ haPassword, onEliminato }: { haPassword: boolean; onEliminato: () => void }) {
  const [aperto, setAperto] = useState(false);
  const [parola, setParola] = useState("");
  const [password, setPassword] = useState("");
  const [errori, setErrori] = useState<Partial<Record<"parola" | "password", string>>>({});
  const [invio, setInvio] = useState(false);
  const [esito, setEsito] = useState<Esito | null>(null);

  function apri() {
    setAperto(true);
    // Il campo esiste solo dopo il prossimo render.
    window.requestAnimationFrame(() => document.getElementById("el-parola")?.focus());
  }

  function chiudi() {
    setAperto(false);
    setParola("");
    setPassword("");
    setErrori({});
    setEsito(null);
    window.requestAnimationFrame(() => document.getElementById("el-apri")?.focus());
  }

  async function elimina(e: FormEvent) {
    e.preventDefault();
    if (invio) return;
    const err: typeof errori = {};
    if (!confermaEliminazione(parola)) err.parola = `Scrivi ${PAROLA_ELIMINA} per confermare.`;
    if (haPassword && !password) err.password = "Scrivi la tua password.";
    setErrori(err);
    const primo = (["parola", "password"] as const).find((k) => err[k]);
    if (primo) {
      document.getElementById(`el-${primo}`)?.focus();
      return;
    }
    setInvio(true);
    setEsito(null);
    try {
      const r = await authClient.deleteUser(haPassword ? { password } : {});
      if (r.error) {
        const t = traduciErroreAuth(r.error, "elimina");
        if (r.error.code === "INVALID_PASSWORD") {
          setErrori({ password: t.messaggio });
          document.getElementById("el-password")?.focus();
        } else {
          setEsito({ ok: false, testo: t.messaggio });
        }
        setInvio(false);
        return;
      }
      if (r.data?.message === "Verification email sent") {
        setEsito({ ok: true, testo: "Ti abbiamo mandato un’email: apri il link per confermare l’eliminazione." });
        setInvio(false);
        return;
      }
      onEliminato();
    } catch {
      setEsito({ ok: false, testo: traduciErroreAuth({ status: 0 }, "elimina").messaggio });
      setInvio(false);
    }
  }

  if (!aperto) {
    return (
      <div className="mt-3 grid gap-4">
        <p className="max-w-[60ch] text-muted">
          Cancelliamo per sempre accesso, profilo, settimana salvata e richieste con la loro cronologia. Non si torna indietro:
          se vuoi tenerne una copia, scarica prima i tuoi dati.
        </p>
        <button id="el-apri" type="button" className="btn btn-sm acc-btn-pericolo-linea justify-self-start" onClick={apri}>
          Voglio eliminare l’account
        </button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={(e) => void elimina(e)} className="mt-4 grid max-w-xl gap-5" aria-busy={invio}>
      <Avviso tipo="errore" titolo="Ultimo passaggio">
        Eliminando l’account cancelliamo tutto quello che lo riguarda, richieste comprese. Matteo non potrà più ritrovarle.
      </Avviso>
      <div className="campo">
        <label htmlFor="el-parola">Scrivi {PAROLA_ELIMINA} per confermare</label>
        <input
          id="el-parola"
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          value={parola}
          onChange={(e) => setParola(e.target.value)}
          aria-invalid={errori.parola ? true : undefined}
          aria-describedby={errori.parola ? "el-parola-errore" : undefined}
        />
        {errori.parola ? <p id="el-parola-errore" className="errore">{errori.parola}</p> : null}
      </div>
      {haPassword ? (
        <CampoPassword id="el-password" etichetta="La tua password" autoComplete="current-password" valore={password} onCambia={setPassword} errore={errori.password} />
      ) : (
        <p className="text-sm text-muted">
          Entri con Google: per sicurezza l’eliminazione funziona solo entro un giorno dall’ultimo accesso. Se ti viene chiesto, esci e rientra.
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn btn-sm acc-btn-pericolo" disabled={invio}>
          {invio ? "Elimino…" : "Elimina definitivamente"}
        </button>
        <button type="button" className="btn btn-linea btn-sm" disabled={invio} onClick={chiudi}>
          Annulla
        </button>
      </div>
      <EsitoAzione esito={esito} />
    </form>
  );
}
