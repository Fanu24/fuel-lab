"use client";

/* /dashboard/impostazioni: le tre cose che Matteo cambia sul sito senza
   chiamare nessuno. Piatti disponibili (si salvano a ogni tocco), chiusure e
   avviso (si salvano col loro bottone). I dati si leggono sempre freschi dal
   server; dopo ogni salvataggio il resto del pannello e il sito aperto in
   questa scheda vedono subito la versione nuova. */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { adminApi, api, type Impostazioni as TImpostazioni } from "@/lib/api";
import { impostaImpostazioni } from "@/components/impostazioni/useImpostazioni";
import ImpostazioniAvviso from "./ImpostazioniAvviso";
import ImpostazioniChiusure from "./ImpostazioniChiusure";
import ImpostazioniPiatti from "./ImpostazioniPiatti";
import { messaggio } from "./ImpostazioniParti";
import { usePannello } from "./PannelloDati";
import { Avviso, Caricamento, TestaPagina } from "./ui";

export default function Impostazioni() {
  const { oggi } = usePannello();
  const [dati, setDati] = useState<TImpostazioni | null>(null);
  const [errore, setErrore] = useState("");
  const [giro, setGiro] = useState(0);

  useEffect(() => {
    let vivo = true;
    api.impostazioni(true).then(
      (r) => {
        if (!vivo) return;
        setDati(r.settings);
        setErrore("");
        impostaImpostazioni(r.settings);
      },
      (e: unknown) => vivo && setErrore(messaggio(e, "Non riesco a leggere le impostazioni.")),
    );
    return () => {
      vivo = false;
    };
  }, [giro]);

  const salva = useCallback(async (modifica: Partial<TImpostazioni>) => {
    const { settings } = await adminApi.salvaImpostazioni(modifica);
    impostaImpostazioni(settings);
    // Rinfresca anche la copia che il browser tiene per un minuto: il sito aperto in un'altra scheda la vede subito.
    void api.impostazioni(true).catch(() => {});
    return settings;
  }, []);

  return (
    <div className="pn-pagina">
      <TestaPagina
        occhiello="Pannello · Impostazioni"
        titolo="Impostazioni"
        sotto="Quello che cambi qui si vede sul sito entro un minuto."
        azioni={
          <Link href="/" className="pn-tasto">
            Guarda il sito
          </Link>
        }
      />

      {errore ? (
        <div className="grid gap-3">
          <Avviso>{errore}</Avviso>
          <button type="button" className="pn-tasto justify-self-start" onClick={() => setGiro((g) => g + 1)}>
            Riprova
          </button>
        </div>
      ) : null}

      {dati ? (
        <div className="pn-imp-griglia">
          <ImpostazioniPiatti esclusi={dati.piattiNonDisponibili} salva={salva} />
          <div className="pn-imp-colonna">
            <ImpostazioniChiusure chiusure={dati.chiusure} oggi={oggi} salva={salva} />
            <ImpostazioniAvviso avviso={dati.avviso} salva={salva} />
          </div>
        </div>
      ) : errore ? null : (
        <Caricamento testo="Carico le impostazioni…" />
      )}
    </div>
  );
}
