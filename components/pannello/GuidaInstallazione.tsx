"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ambienteDispositivo, attivaNotifiche, statoNotifiche, type StatoNotifiche } from "@/lib/push-client";
import { Avviso, Bottone } from "./ui";

/* La guida per installare il pannello sul telefono e attivare le notifiche dei nuovi ordini.
   Le notifiche funzionano solo su un pannello installato (su iPhone: iOS 16.4 o più recente). */

const ICONA_CONDIVIDI = (
  <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
    <path d="M16 19H12v21h24V19h-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24 6v24M16 14l8-8 8 8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ICONA_MENU = (
  <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
    <circle cx="24" cy="10" r="4" fill="currentColor" />
    <circle cx="24" cy="24" r="4" fill="currentColor" />
    <circle cx="24" cy="38" r="4" fill="currentColor" />
  </svg>
);

const ICONA_AGGIUNGI = (
  <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
    <rect x="8" y="8" width="32" height="32" rx="8" fill="none" stroke="currentColor" strokeWidth="3" />
    <path d="M24 16v16M16 24h16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

function Passo({ numero, titolo, disegno, children }: { numero: number; titolo: string; disegno?: ReactNode; children?: ReactNode }) {
  return (
    <li className="pm-passo">
      <span className="pm-passo-num" aria-hidden="true">{numero}</span>
      <div className="pm-passo-corpo">
        <b>{titolo}</b>
        {disegno && <span className="pm-passo-disegno">{disegno}</span>}
        {children}
      </div>
    </li>
  );
}

export default function GuidaInstallazione() {
  const [stato, setStato] = useState<StatoNotifiche | null>(null);
  const [occupato, setOccupato] = useState(false);
  const [errore, setErrore] = useState("");
  // Il dispositivo non cambia durante la visita: si legge una volta, dopo l'idratazione (vedi PannelloMatteo).
  const { tipo } = ambienteDispositivo();

  useEffect(() => {
    let vivo = true;
    statoNotifiche().then(
      (s) => { if (vivo) setStato(s); },
      () => { if (vivo) setStato("non-supportate"); },
    );
    return () => { vivo = false; };
  }, []);

  async function attiva() {
    if (occupato) return;
    setOccupato(true);
    setErrore("");
    try {
      setStato(await attivaNotifiche());
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Non riesco ad attivare le notifiche. Riprova.");
    } finally {
      setOccupato(false);
    }
  }

  return (
    <section className="pm-guida" aria-labelledby="guida-titolo">
      <h1 id="guida-titolo" className="pm-titolo-vista">Installa l&apos;app e le notifiche</h1>
      {stato === null ? (
        <p className="pm-carico" role="status">Carico…</p>
      ) : stato === "attive" ? (
        <div className="pm-scheda-ok" role="status">
          <p>Notifiche attive ✓</p>
          <p>Ti arriva un avviso ogni volta che un cliente ordina dal sito.</p>
        </div>
      ) : tipo === "computer" ? (
        <Avviso>Le notifiche si attivano sul telefono: apri fuelchef.it/admin dal telefono di Matteo.</Avviso>
      ) : stato === "non-supportate" ? (
        <Avviso>Questo browser non può ricevere notifiche. Apri il pannello dal telefono, con Safari su iPhone o con Chrome su Android.</Avviso>
      ) : stato === "negate" ? (
        <div className="pm-guida-blocco">
          <p>Le notifiche sono bloccate. Sbloccale così:</p>
          {tipo === "iphone" ? (
            <p className="pm-guida-indicazione">Impostazioni → Notifiche → Matteo → Consenti notifiche</p>
          ) : (
            <p className="pm-guida-indicazione">Tieni premuta l&apos;icona Matteo → Info app → Notifiche</p>
          )}
        </div>
      ) : (
        <>
          <ol className="pm-passi">
            {tipo === "iphone" ? (
              <>
                <Passo numero={1} titolo="Tocca Condividi" disegno={ICONA_CONDIVIDI}>
                  <p>È l&apos;icona con la freccia in su, in fondo allo schermo di Safari.</p>
                </Passo>
                <Passo numero={2} titolo="Aggiungi alla schermata Home" />
                <Passo numero={3} titolo="Apri l'icona Matteo">
                  <p>Chiudi Safari e apri l'icona Matteo sulla schermata Home.</p>
                </Passo>
              </>
            ) : (
              <>
                <Passo numero={1} titolo="Tocca Menu ⋮" disegno={ICONA_MENU}>
                  <p>I tre puntini in alto a destra, nel browser.</p>
                </Passo>
                <Passo numero={2} titolo="Tocca Installa app" disegno={ICONA_AGGIUNGI}>
                  <p>Se non c&apos;è, tocca Aggiungi a schermata Home.</p>
                </Passo>
                <Passo numero={3} titolo="Apri l'icona Matteo">
                  <p>Apri l'icona Matteo sulla schermata Home.</p>
                </Passo>
              </>
            )}
            <Passo numero={4} titolo="Attiva notifiche">
              {stato === "da-attivare" ? (
                <Bottone variante="verde" className="pm-guida-attiva" disabled={occupato} onClick={attiva}>
                  {occupato ? "Attivo…" : "Attiva notifiche"}
                </Bottone>
              ) : (
                <p>Quando il pannello è aperto dall&apos;icona Matteo, qui compare il bottone Attiva notifiche.</p>
              )}
            </Passo>
            <Passo numero={5} titolo="Consenti">
              <p>Quando il telefono chiede il permesso, tocca Consenti.</p>
            </Passo>
          </ol>
          {errore && <p className="pm-errore" role="alert">{errore}</p>}
        </>
      )}
    </section>
  );
}
