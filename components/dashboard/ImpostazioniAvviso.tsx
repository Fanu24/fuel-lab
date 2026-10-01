"use client";

/* Riquadro "Avviso sul sito": la striscia che compare in cima a tutte le
   pagine pubbliche. Interruttore, testo con il contatore, link facoltativo a
   una pagina del sito e l'anteprima com'e' davvero; si salva con "Salva
   l'avviso", cosi' un testo a meta' non finisce sul sito. */

import { useRef, useState } from "react";
import type { AvvisoSito } from "@/lib/api";
import { linkInterno, MAX_LINK, MAX_TESTO_AVVISO } from "@/lib/impostazioni";
import {
  alle,
  BozzaRipresa,
  EsitoSalvataggio,
  leggiBozza,
  messaggio,
  Riquadro,
  useAvvisoUscita,
  useConservaBozza,
  useFuocoSullEsito,
  type Esito,
  type Salva,
} from "./ImpostazioniParti";

/** Come lo salvera' il server: spazi e a capo diventano uno spazio. */
const pulito = (a: AvvisoSito): AvvisoSito => ({ attivo: a.attivo, testo: a.testo.replace(/\s+/g, " ").trim(), link: a.link.trim() });

export default function ImpostazioniAvviso({ avviso, salva }: { avviso: AvvisoSito; salva: Salva }) {
  const [salvato, setSalvato] = useState<AvvisoSito>(avviso);
  // Se Matteo e' uscito dalla pagina a meta', la bozza torna com'era.
  const [ripresa, setRipresa] = useState(() => leggiBozza<AvvisoSito>("avviso", avviso));
  const [bozza, setBozza] = useState<AvvisoSito>(ripresa ?? avviso);
  const [provato, setProvato] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [esito, setEsito] = useState<Esito>(null);
  const areaEsito = useRef<HTMLDivElement>(null);
  useFuocoSullEsito(esito, areaEsito);

  const pronto = pulito(bozza);
  const nonSalvato = JSON.stringify(pronto) !== JSON.stringify(pulito(salvato));
  useAvvisoUscita(nonSalvato);
  useConservaBozza("avviso", salvato, bozza, nonSalvato);

  const erroreTesto = pronto.attivo && !pronto.testo ? "Scrivi il testo prima di accendere l’avviso." : "";
  const erroreLink = pronto.link && !linkInterno(pronto.link)
    ? "Metti una pagina di questo sito: comincia con / (per esempio /menu), senza https:// davanti."
    : "";
  const testoVisibile = provato ? erroreTesto : "";

  function cambia<K extends keyof AvvisoSito>(campo: K, valore: AvvisoSito[K]) {
    setBozza((b) => ({ ...b, [campo]: valore }));
  }

  async function salvaAvviso() {
    if (salvando) return;
    setProvato(true);
    if (erroreTesto || erroreLink) {
      setEsito({ tipo: "errore", testo: `Non ancora salvato: ${(erroreTesto || erroreLink).charAt(0).toLowerCase()}${(erroreTesto || erroreLink).slice(1)}` });
      document.getElementById(erroreTesto ? "av-testo" : "av-link")?.focus();
      return;
    }
    setSalvando(true);
    try {
      const nuovo = (await salva({ avviso: pronto })).avviso;
      setSalvato(nuovo);
      setRipresa(null);
      setBozza(nuovo);
      setProvato(false);
      setEsito({
        tipo: "ok",
        testo: nuovo.attivo
          ? `Avviso acceso alle ${alle()}: compare in cima a tutte le pagine entro un minuto.`
          : `Salvato alle ${alle()}: l’avviso è spento, il sito non lo mostra.`,
      });
    } catch (e) {
      const motivo = messaggio(e);
      setEsito({ tipo: "errore", testo: `Non ho salvato l’avviso: ${motivo}${/[.!?]$/.test(motivo) ? "" : "."}` });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Riquadro
      id="avviso"
      titolo="Avviso sul sito"
      sotto="Una riga in cima a tutte le pagine del sito: ferie, un piatto nuovo, un cambio d’orario. Chi la chiude non la rivede fino alla visita dopo."
      piede={
        <>
          <p className={`pn-imp-stato ${nonSalvato ? "is-da-salvare" : ""}`}>
            {nonSalvato ? "Modifiche da salvare" : salvato.attivo ? "Acceso sul sito" : "Spento"}
          </p>
          <button type="button" className="pn-tasto pn-tasto-pieno" onClick={() => void salvaAvviso()} aria-disabled={salvando || undefined}>
            {salvando ? "Salvo…" : "Salva l’avviso"}
          </button>
        </>
      }
    >
      {ripresa ? (
        <BozzaRipresa
          onScarta={() => {
            setRipresa(null);
            setBozza(salvato);
            setProvato(false);
            setEsito(null);
          }}
        />
      ) : null}
      <button
        type="button"
        role="switch"
        aria-checked={bozza.attivo}
        aria-describedby="av-interruttore-nota"
        className="pn-switch pn-imp-interruttore"
        onClick={() => cambia("attivo", !bozza.attivo)}
      >
        <span className="pn-switch-binario" aria-hidden="true" />
        Mostra l’avviso sul sito
      </button>
      <p id="av-interruttore-nota" className="pn-aiuto -mt-2">
        {bozza.attivo ? "Acceso: dopo il salvataggio si vede su tutte le pagine." : "Spento: il testo resta qui pronto per la prossima volta."}
      </p>

      <div className="campo">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="av-testo">Testo</label>
          <span className={`num text-xs ${bozza.testo.length > MAX_TESTO_AVVISO - 20 ? "font-bold text-ink" : "text-muted"}`} aria-hidden="true">
            {bozza.testo.length}/{MAX_TESTO_AVVISO}
          </span>
        </div>
        <textarea
          id="av-testo"
          rows={3}
          maxLength={MAX_TESTO_AVVISO}
          value={bozza.testo}
          onChange={(e) => cambia("testo", e.target.value)}
          // Una riga sola sul sito: Invio non va a capo.
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          placeholder="Es. Chiusi per ferie dal 10 al 20 agosto: le richieste ripartono il 21."
          aria-invalid={testoVisibile ? true : undefined}
          aria-describedby={testoVisibile ? "av-testo-errore av-testo-aiuto" : "av-testo-aiuto"}
        />
        <p id="av-testo-aiuto" className="pn-aiuto">
          Al massimo {MAX_TESTO_AVVISO} caratteri, ne restano {Math.max(0, MAX_TESTO_AVVISO - bozza.testo.length)}. Sul telefono si leggono
          due righe, circa 80 caratteri: guarda l’anteprima qui sotto.
        </p>
        {testoVisibile ? <p id="av-testo-errore" className="pn-errore-campo">{testoVisibile}</p> : null}
      </div>

      <div className="campo">
        <label htmlFor="av-link">Link (facoltativo)</label>
        <input
          id="av-link"
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          maxLength={MAX_LINK}
          value={bozza.link}
          onChange={(e) => cambia("link", e.target.value)}
          placeholder="/menu"
          aria-invalid={erroreLink ? true : undefined}
          aria-describedby={erroreLink ? "av-link-errore" : "av-link-aiuto"}
        />
        {erroreLink ? (
          <p id="av-link-errore" className="pn-errore-campo">{erroreLink}</p>
        ) : (
          <p id="av-link-aiuto" className="pn-aiuto">Una pagina del sito da aprire toccando l’avviso, per esempio /menu o /settimana.</p>
        )}
      </div>

      <figure className="pn-imp-anteprima">
        <figcaption className="pn-occhiello !mb-2">
          Anteprima{pronto.attivo ? "" : " · spento, il sito non lo mostra"}
        </figcaption>
        {pronto.testo ? (
          <div className="pn-imp-anteprime">
            <div>
              <p className="pn-imp-anteprima-etichetta">Computer</p>
              <Striscia avviso={pronto} conLink={!!pronto.link && !erroreLink} />
            </div>
            <div className="pn-imp-anteprima-telefono">
              <p className="pn-imp-anteprima-etichetta">Telefono: al massimo due righe, il resto si taglia</p>
              <Striscia avviso={pronto} conLink={!!pronto.link && !erroreLink} />
            </div>
          </div>
        ) : (
          <p className="pn-vuoto !py-2">Scrivi il testo per vedere l’anteprima.</p>
        )}
      </figure>

      <EsitoSalvataggio ref={areaEsito} esito={esito} />
    </Riquadro>
  );
}

/** La striscia com'e' sul sito, ferma dentro il riquadro. */
function Striscia({ avviso, conLink }: { avviso: AvvisoSito; conLink: boolean }) {
  return (
    <div className={`avviso-sito avviso-sito-anteprima ${avviso.attivo ? "" : "is-spento"}`}>
      <div className="avviso-sito-riga">
        <p className={`avviso-sito-testo ${conLink ? "avviso-sito-link" : ""}`}>
          {avviso.testo} {conLink ? <span aria-hidden="true">→</span> : null}
        </p>
        <span className="avviso-sito-chiudi" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false" className="size-5">
            <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </span>
      </div>
    </div>
  );
}
