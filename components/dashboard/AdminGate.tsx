"use client";

/* Il cancello del pannello: chiede /api/me e lascia passare solo Matteo.
   I dati veri sono protetti dal server (ogni /api/admin e /api/orders
   controlla il ruolo): qui si tratta solo di dire chiaramente perche' non si
   entra e come rimediare. */

import Image from "next/image";
import Link from "next/link";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiError, type Utente } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

type Esito =
  | { tipo: "verifico" }
  | { tipo: "anonimo" }
  | { tipo: "non-verificato"; utente: Utente }
  | { tipo: "non-admin"; utente: Utente }
  | { tipo: "errore"; messaggio: string }
  | { tipo: "ok"; utente: Utente };

const ContestoAdmin = createContext<Utente | null>(null);

/** L'utente amministratore, dentro il pannello. */
export function useAdmin() {
  return useContext(ContestoAdmin);
}

export default function AdminGate({ children }: { children: ReactNode }) {
  const [esito, setEsito] = useState<Esito>({ tipo: "verifico" });
  const [ritorno, setRitorno] = useState("/dashboard");

  const verifica = useCallback(async () => {
    setEsito({ tipo: "verifico" });
    setRitorno(`${window.location.pathname}${window.location.search}`);
    try {
      const { user } = await api.me();
      if (!user) setEsito({ tipo: "anonimo" });
      else if (user.role === "admin") setEsito({ tipo: "ok", utente: user });
      // Il messaggio "verifica l'email" serve solo all'account di Matteo: a un cliente si dice che il pannello non e' suo.
      else if (user.adminInAttesa) setEsito({ tipo: "non-verificato", utente: user });
      else setEsito({ tipo: "non-admin", utente: user });
    } catch (e) {
      setEsito({ tipo: "errore", messaggio: e instanceof ApiError ? e.message : "Non riesco a verificare l'accesso." });
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void verifica(), 0);
    return () => window.clearTimeout(t);
  }, [verifica]);

  if (esito.tipo === "ok") return <ContestoAdmin.Provider value={esito.utente}>{children}</ContestoAdmin.Provider>;
  if (esito.tipo === "verifico") {
    return (
      <Schermo>
        <p className="flex items-center gap-3 text-lg text-steel" role="status">
          <span className="pn-spinner pn-spinner-notte" aria-hidden="true" />
          Verifico l’accesso…
        </p>
      </Schermo>
    );
  }

  const accedi = `/accedi?next=${encodeURIComponent(ritorno)}`;
  return (
    <Schermo>
      <div className="max-w-xl">
        <p className="occhiello">FUEL LAB · Pannello di Matteo</p>
        {esito.tipo === "anonimo" ? (
          <Messaggio titolo="Accedi per entrare." testo="Il pannello è riservato a Matteo. Entra con l’account amministratore e torni qui.">
            <Link href={accedi} className="btn btn-lime">Accedi</Link>
            <Link href="/" className="btn btn-linea">Torna al sito</Link>
          </Messaggio>
        ) : esito.tipo === "non-verificato" ? (
          <NonVerificato utente={esito.utente} ritorno={ritorno} onRiprova={() => void verifica()} />
        ) : esito.tipo === "non-admin" ? (
          <Messaggio
            titolo="Questo account non è di Matteo."
            testo={<>Sei entrato come <strong className="text-paper">{esito.utente.email}</strong>. Il pannello si apre solo con l’account amministratore.</>}
          >
            {/* Ricarica vera dopo l'uscita: la sessione in memoria del sito resterebbe quella vecchia. */}
            {/* eslint-disable-next-line @next/next/no-location-assign-relative-destination */}
            <button type="button" className="btn btn-lime" onClick={() => void authClient.signOut().finally(() => window.location.assign(accedi))}>
              Cambia account
            </button>
            <Link href="/account" className="btn btn-linea">Vai al tuo account</Link>
          </Messaggio>
        ) : (
          <Messaggio titolo="Non riesco a verificare l’accesso." testo={esito.messaggio}>
            <button type="button" className="btn btn-lime" onClick={() => void verifica()}>Riprova</button>
            <Link href="/" className="btn btn-linea">Torna al sito</Link>
          </Messaggio>
        )}
      </div>
    </Schermo>
  );
}

function Schermo({ children }: { children: ReactNode }) {
  return (
    <main className="notte grid min-h-svh place-items-center px-5 py-12">
      <div className="w-full max-w-xl">
        <Image src="/logo-fuellab.png" alt="FUEL LAB" width={1095} height={360} className="mb-10 h-8 w-auto invert" priority />
        {children}
      </div>
    </main>
  );
}

function Messaggio({ titolo, testo, children }: { titolo: string; testo: ReactNode; children: ReactNode }) {
  return (
    <>
      <h1 className="titolo-s mt-5">{titolo}</h1>
      <p className="mt-5 text-lg text-steel">{testo}</p>
      <div className="mt-8 flex flex-wrap gap-3">{children}</div>
    </>
  );
}

function NonVerificato({ utente, ritorno, onRiprova }: { utente: Utente; ritorno: string; onRiprova: () => void }) {
  const [invio, setInvio] = useState<"fermo" | "invio" | "inviata" | "errore">("fermo");
  async function rimanda() {
    setInvio("invio");
    try {
      const esito = await authClient.sendVerificationEmail({ email: utente.email, callbackURL: ritorno });
      setInvio(esito.error ? "errore" : "inviata");
    } catch {
      setInvio("errore");
    }
  }
  return (
    <Messaggio
      titolo="Conferma prima la tua email."
      testo={<>Per sicurezza il pannello si apre solo con un’email confermata. Apri il link che ti abbiamo mandato a <strong className="text-paper">{utente.email}</strong>, poi torna qui.</>}
    >
      <button type="button" className="btn btn-lime" onClick={onRiprova}>Ho confermato, riprova</button>
      <button type="button" className="btn btn-linea" disabled={invio === "invio" || invio === "inviata"} onClick={() => void rimanda()}>
        {invio === "invio" ? "Invio…" : invio === "inviata" ? "Email inviata" : "Rimanda l’email"}
      </button>
      <p className="w-full text-sm text-steel" role="status" aria-live="polite">
        {invio === "inviata" ? "Fatto: controlla la posta, anche nello spam." : invio === "errore" ? "Invio non riuscito. Riprova tra qualche minuto." : ""}
      </p>
    </Messaggio>
  );
}
