"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  destinazioneSicura,
  hrefAccedi,
  PASSWORD_MAX,
  PASSWORD_MIN,
  traduciErroreAuth,
  type ErroreAuth,
} from "@/lib/account";
import { authClient } from "@/lib/auth-client";
import { Avviso, CampoPassword, RequisitiPassword } from "./ui";

/* /reimposta-password?token=…&next=…: better-auth ci arriva dal link nell'email
   (o con ?error=INVALID_TOKEN se il link e' scaduto). Salvata la password, le
   sessioni aperte altrove vengono chiuse (revokeSessionsOnPasswordReset). */

type Campo = "password" | "conferma";

export default function ResetPasswordPanel() {
  const parametri = useSearchParams();
  const token = parametri.get("token");
  const destinazione = destinazioneSicura(parametri.get("next"));
  const [password, setPassword] = useState("");
  const [conferma, setConferma] = useState("");
  const [erroriCampo, setErroriCampo] = useState<Partial<Record<Campo, string>>>({});
  const [errore, setErrore] = useState<ErroreAuth | null>(null);
  const [attesa, setAttesa] = useState(false);
  const [fatto, setFatto] = useState(false);
  const [scaduto, setScaduto] = useState(!token || parametri.has("error"));

  const refErrore = useRef<HTMLDivElement>(null);
  const refEsito = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!scaduto && !fatto) document.getElementById("np-password")?.focus();
    // Solo al primo arrivo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (errore) refErrore.current?.focus();
  }, [errore]);

  useEffect(() => {
    if (fatto || scaduto) refEsito.current?.focus();
  }, [fatto, scaduto]);

  async function invia(e: FormEvent) {
    e.preventDefault();
    if (!token || attesa) return;
    const campi: Partial<Record<Campo, string>> = {};
    if (password.length < PASSWORD_MIN) campi.password = `La password deve avere almeno ${PASSWORD_MIN} caratteri.`;
    else if (password.length > PASSWORD_MAX) campi.password = `La password può avere al massimo ${PASSWORD_MAX} caratteri.`;
    else if (conferma !== password) campi.conferma = "Le due password non coincidono.";
    setErroriCampo(campi);
    if (campi.password || campi.conferma) {
      document.getElementById(campi.password ? "np-password" : "np-conferma")?.focus();
      return;
    }
    setAttesa(true);
    setErrore(null);
    try {
      const r = await authClient.resetPassword({ newPassword: password, token });
      if (r.error) {
        const tradotto = traduciErroreAuth(r.error, "reimposta");
        if (tradotto.tipo === "link") setScaduto(true);
        else setErrore(tradotto);
      } else {
        setPassword("");
        setConferma("");
        setFatto(true);
      }
    } catch {
      setErrore(traduciErroreAuth({ status: 0 }, "reimposta"));
    }
    setAttesa(false);
  }

  return (
    <section className="acc-testata wrap pb-[var(--sezione)]">
      <div className="mx-auto max-w-2xl">
        <p className="occhiello">Recupero dell’accesso</p>
        <h1 className="titolo mt-5">Nuova password.</h1>

        <div className="acc-card mt-8">
          {scaduto ? (
            <div className="grid gap-5">
              <h2 ref={refEsito} tabIndex={-1} className="titolo-s">Link scaduto.</h2>
              <p>Il link non è valido, è scaduto (dura un’ora) o è già stato usato. Chiedine uno nuovo: arriva in pochi secondi.</p>
              <Link href={hrefAccedi(destinazione, "recupera")} className="btn btn-ink btn-sm self-start">
                Chiedi un nuovo link
              </Link>
            </div>
          ) : fatto ? (
            <div className="grid gap-5" role="status">
              <h2 ref={refEsito} tabIndex={-1} className="titolo-s">Password aggiornata.</h2>
              <p>Da adesso entri con la nuova password. Per sicurezza abbiamo chiuso le sessioni aperte sugli altri dispositivi.</p>
              <Link href={hrefAccedi(destinazione)} className="btn btn-lime self-start">
                Accedi <span className="freccia" aria-hidden="true">→</span>
              </Link>
            </div>
          ) : (
            <form noValidate onSubmit={(e) => void invia(e)} className="grid gap-5" aria-busy={attesa}>
              <p className="text-muted">Scegli una password che non usi su altri siti. Una frase di tre o quattro parole è facile da ricordare e difficile da indovinare.</p>
              {errore ? <Avviso ref={refErrore} tipo="errore">{errore.messaggio}</Avviso> : null}
              <CampoPassword
                id="np-password"
                etichetta="Nuova password"
                autoComplete="new-password"
                valore={password}
                onCambia={setPassword}
                errore={erroriCampo.password}
                descrittaDa="np-requisiti"
              />
              <CampoPassword
                id="np-conferma"
                etichetta="Ripeti la nuova password"
                autoComplete="new-password"
                valore={conferma}
                onCambia={setConferma}
                errore={erroriCampo.conferma}
                descrittaDa="np-requisiti"
              />
              <RequisitiPassword id="np-requisiti" password={password} conferma={conferma} />
              <button className="btn btn-lime w-full sm:w-auto sm:justify-self-start" type="submit" disabled={attesa}>
                {attesa ? "Salvo…" : "Salva la nuova password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
