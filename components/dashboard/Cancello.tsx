"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";

/* =========================================================================
   Il cancello della dashboard demo.

   NON E' SICUREZZA, e la pagina lo dice. Il PIN sta nel codice che il browser
   scarica, quindi chiunque lo puo' leggere: serve solo a non far finire un
   cliente curioso nel pannello di Matteo per errore. Con il backend vero
   (Supabase) il controllo si sposta sul server, in proxy.ts e nel livello
   dati, e questo componente sparisce.
   ========================================================================= */

const CHIAVE = "fuellab.dashboard.dentro";
const PIN = process.env.NEXT_PUBLIC_DEMO_PIN || "1234";

const ascolta = (f: () => void) => {
  window.addEventListener("storage", f);
  return () => window.removeEventListener("storage", f);
};
function leggi(): boolean {
  try {
    return sessionStorage.getItem(CHIAVE) === "1";
  } catch {
    return false;
  }
}

export default function Cancello({ children }: { children: ReactNode }) {
  const salvato = useSyncExternalStore(ascolta, leggi, () => false);
  const [aperto, setAperto] = useState(false);
  const [pin, setPin] = useState("");
  const [errore, setErrore] = useState(false);
  const idratato = useSyncExternalStore(ascolta, () => true, () => false);

  if (salvato || aperto) return <>{children}</>;
  if (!idratato) return <div className="min-h-svh bg-night" />;

  return (
    <div className="notte grid min-h-svh place-items-center px-5">
      <form
        className="w-full max-w-sm"
        onSubmit={(e) => {
          e.preventDefault();
          if (pin === PIN) {
            try {
              sessionStorage.setItem(CHIAVE, "1");
            } catch {
              /* sessione senza storage: si entra lo stesso, fino alla chiusura */
            }
            setAperto(true);
          } else {
            setErrore(true);
          }
        }}
      >
        <p className="occhiello">FUEL LAB · Pannello di Matteo</p>
        <h1 className="titolo mt-5">Entra.</h1>
        <div className="campo mt-8">
          <label htmlFor="pin">PIN</label>
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setErrore(false);
            }}
            aria-invalid={errore}
            aria-describedby="pin-nota"
            className="!bg-night-2 !text-paper"
            autoFocus
          />
          {errore ? (
            <p className="text-sm font-semibold text-lime" role="alert">
              PIN sbagliato.
            </p>
          ) : null}
        </div>
        <button type="submit" className="btn btn-lime mt-6 w-full">
          Entra <span className="freccia">→</span>
        </button>
        <p id="pin-nota" className="mt-6 text-sm text-steel">
          Demo: il PIN è <span className="num text-paper">{PIN}</span>. Non protegge niente, serve solo a separare il
          pannello dal sito. I dati sono di esempio più le richieste fatte da questo browser.
        </p>
      </form>
    </div>
  );
}
