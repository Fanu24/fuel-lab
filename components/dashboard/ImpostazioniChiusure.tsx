"use client";

/* Riquadro "Chiusure e ferie": i giorni in cui Matteo non cucina. Qui si
   scrive una bozza (aggiungi, cambia, togli) e si salva tutto insieme con
   "Salva le chiusure": una data a meta' non deve arrivare sul sito. Il sito
   non fa scegliere quei giorni ai clienti, e anche il server li rifiuta. */

import { useRef, useState } from "react";
import type { Chiusura } from "@/lib/api";
import { durata, MAX_CHIUSURE, MAX_MOTIVO, periodo, settimanaProssima } from "@/lib/impostazioni";
import {
  alle,
  EsitoSalvataggio,
  messaggio,
  Riquadro,
  useAvvisoUscita,
  useFuocoSullEsito,
  type Esito,
  type Salva,
} from "./ImpostazioniParti";

type Riga = Chiusura & { chiave: number };

let prossimaChiave = 1;
const conChiave = (c: Chiusura): Riga => ({ ...c, chiave: prossimaChiave++ });
const senzaChiave = (righe: Riga[]): Chiusura[] => righe.map(({ dal, al, motivo }) => ({ dal, al, motivo: motivo.trim() }));

/** L'errore di una riga, con le stesse regole del server. */
function erroreRiga(r: Riga): string {
  if (!r.dal) return "Scegli il primo giorno di chiusura.";
  if (!r.al) return "Scegli l’ultimo giorno di chiusura.";
  if (r.dal > r.al) return "L’ultimo giorno viene prima del primo: controlla le date.";
  if (r.motivo.trim().length > MAX_MOTIVO) return `Il motivo può avere al massimo ${MAX_MOTIVO} caratteri.`;
  return "";
}

export default function ImpostazioniChiusure({ chiusure, oggi, salva }: { chiusure: Chiusura[]; oggi: string; salva: Salva }) {
  const [salvate, setSalvate] = useState<Chiusura[]>(chiusure);
  const [righe, setRighe] = useState<Riga[]>(() => chiusure.map(conChiave));
  const [provato, setProvato] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [esito, setEsito] = useState<Esito>(null);
  const areaEsito = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  useFuocoSullEsito(esito, areaEsito);

  const nonSalvato = JSON.stringify(senzaChiave(righe)) !== JSON.stringify(salvate);
  useAvvisoUscita(nonSalvato);
  const piena = righe.length >= MAX_CHIUSURE;
  const passate = righe.filter((r) => r.al && r.al < oggi);

  function cambia(chiave: number, campo: keyof Chiusura, valore: string) {
    setRighe((rr) =>
      rr.map((r) => {
        if (r.chiave !== chiave) return r;
        const nuova = { ...r, [campo]: valore };
        // Il primo giorno che scavalca l'ultimo se lo porta dietro: niente errore da correggere a mano.
        if (campo === "dal" && valore && (!nuova.al || nuova.al < valore)) nuova.al = valore;
        return nuova;
      }),
    );
  }

  /** Aggiunge una riga e porta il fuoco su un suo campo (dopo il disegno). */
  function aggiungi(c: Chiusura, campo: "dal" | "motivo") {
    const riga = conChiave(c);
    setRighe((rr) => [...rr, riga]);
    requestAnimationFrame(() => document.getElementById(`ch-${riga.chiave}-${campo}`)?.focus());
    return riga;
  }

  function chiudiProssimaSettimana() {
    const settimana = settimanaProssima(oggi);
    if (righe.some((r) => r.dal <= settimana.dal && r.al >= settimana.al)) {
      setEsito({ tipo: "info", testo: `La settimana ${periodo(settimana.dal, settimana.al, oggi)} è già chiusa.` });
      return;
    }
    aggiungi({ ...settimana, motivo: "" }, "motivo");
    setEsito({
      tipo: "info",
      testo: `Aggiunta la chiusura ${periodo(settimana.dal, settimana.al, oggi)}. Scrivi il motivo se vuoi, poi premi «Salva le chiusure».`,
    });
  }

  function togli(r: Riga, n: number) {
    setRighe((rr) => rr.filter((x) => x.chiave !== r.chiave));
    setEsito({ tipo: "info", testo: `Tolta la chiusura ${n}. Premi «Salva le chiusure» per confermare.` });
    // Il bottone premuto sparisce: il fuoco va sulla riga che prende il suo posto, o sull'aggiunta.
    requestAnimationFrame(() => {
      // Il primo campo ("Dal") di ogni riga rimasta, nell'ordine.
      const primi = lista.current?.querySelectorAll<HTMLInputElement>("input[id$='-dal']") ?? [];
      const dopo = primi.length ? primi[Math.min(n - 1, primi.length - 1)] : null;
      (dopo ?? document.getElementById("ch-aggiungi"))?.focus();
    });
  }

  function togliPassate() {
    setRighe((rr) => rr.filter((r) => !(r.al && r.al < oggi)));
    setEsito({ tipo: "info", testo: `Tolte ${passate.length === 1 ? "la chiusura passata" : `${passate.length} chiusure passate`}. Premi «Salva le chiusure» per confermare.` });
    requestAnimationFrame(() => document.getElementById("ch-aggiungi")?.focus());
  }

  async function salvaTutto() {
    if (salvando) return;
    setProvato(true);
    const sbagliata = righe.findIndex((r) => erroreRiga(r));
    if (sbagliata >= 0) {
      setEsito({ tipo: "errore", testo: `Controlla la chiusura ${sbagliata + 1}: ${erroreRiga(righe[sbagliata]).toLowerCase()}` });
      document.getElementById(`ch-${righe[sbagliata].chiave}-dal`)?.focus();
      return;
    }
    setSalvando(true);
    try {
      const nuove = (await salva({ chiusure: senzaChiave(righe) })).chiusure;
      setSalvate(nuove);
      setRighe(nuove.map(conChiave));
      setProvato(false);
      setEsito({
        tipo: "ok",
        testo: nuove.length
          ? `Chiusure salvate alle ${alle()}: i clienti non possono scegliere quei giorni.`
          : `Salvato alle ${alle()}: nessuna chiusura, i clienti possono scegliere qualunque giorno.`,
      });
    } catch (e) {
      const motivo = messaggio(e);
      setEsito({ tipo: "errore", testo: `Non ho salvato le chiusure: ${motivo}${/[.!?]$/.test(motivo) ? "" : "."}` });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Riquadro
      id="chiusure"
      titolo="Chiusure e ferie"
      sotto="I giorni in cui non cucini. Nel modulo di richiesta i clienti li vedono in anticipo e non li possono scegliere come giorno preferito."
      piede={
        <>
          <p className={`pn-imp-stato ${nonSalvato ? "is-da-salvare" : ""}`}>
            {nonSalvato ? "Modifiche da salvare" : righe.length ? "Tutto salvato" : "Nessuna chiusura"}
          </p>
          <button type="button" className="pn-tasto pn-tasto-pieno" onClick={() => void salvaTutto()} aria-disabled={salvando || undefined}>
            {salvando ? "Salvo…" : "Salva le chiusure"}
          </button>
        </>
      }
    >
      <div className="pn-imp-scorciatoie">
        <button type="button" className="pn-tasto pn-tasto-lime" onClick={chiudiProssimaSettimana} disabled={piena}>
          Chiudi la prossima settimana
        </button>
        <button
          type="button"
          id="ch-aggiungi"
          className="pn-tasto"
          disabled={piena}
          onClick={() => aggiungi({ dal: "", al: "", motivo: "" }, "dal")}
        >
          <span aria-hidden="true" className="text-[20px] leading-none">+</span> Aggiungi una chiusura
        </button>
        {passate.length ? (
          <button type="button" className="pn-tasto pn-tasto-piatto" onClick={togliPassate}>
            Togli le passate ({passate.length})
          </button>
        ) : null}
      </div>
      {piena ? <p className="pn-aiuto">Hai {MAX_CHIUSURE} chiusure, il massimo: togli quelle che non servono più.</p> : null}

      {righe.length ? (
        <ul ref={lista} className="pn-imp-chiusure">
          {righe.map((r, i) => {
            const n = i + 1;
            const errore = erroreRiga(r);
            // L'errore delle date si vede subito (e' un'informazione), gli altri dopo "Salva".
            const mostra = errore && (provato || (r.dal && r.al && r.dal > r.al)) ? errore : "";
            const passata = !!r.al && r.al < oggi;
            const inCorso = !!r.dal && !!r.al && r.dal <= oggi && oggi <= r.al;
            const idAiuto = `ch-${r.chiave}-aiuto`;
            return (
              <li key={r.chiave}>
                <fieldset className={`pn-imp-chiusura ${passata ? "is-passata" : ""}`}>
                  <legend className="pn-imp-chiusura-titolo">
                    Chiusura {n}
                    {passata ? <span className="pn-segno pn-segno-neutro">Passata</span> : null}
                    {inCorso ? <span className="pn-segno pn-segno-attenzione">In corso</span> : null}
                  </legend>
                  <div className="pn-imp-chiusura-campi">
                    <div className="campo">
                      <label htmlFor={`ch-${r.chiave}-dal`}>Dal</label>
                      <input
                        id={`ch-${r.chiave}-dal`}
                        type="date"
                        value={r.dal}
                        onChange={(e) => cambia(r.chiave, "dal", e.target.value)}
                        aria-invalid={mostra && (!r.dal || r.dal > r.al) ? true : undefined}
                        aria-describedby={idAiuto}
                      />
                    </div>
                    <div className="campo">
                      <label htmlFor={`ch-${r.chiave}-al`}>Al (compreso)</label>
                      <input
                        id={`ch-${r.chiave}-al`}
                        type="date"
                        value={r.al}
                        min={r.dal || undefined}
                        onChange={(e) => cambia(r.chiave, "al", e.target.value)}
                        aria-invalid={mostra && (!r.al || r.dal > r.al) ? true : undefined}
                        aria-describedby={idAiuto}
                      />
                    </div>
                    <div className="campo pn-imp-motivo">
                      <label htmlFor={`ch-${r.chiave}-motivo`}>Motivo (facoltativo)</label>
                      <input
                        id={`ch-${r.chiave}-motivo`}
                        type="text"
                        value={r.motivo}
                        maxLength={MAX_MOTIVO}
                        placeholder="Ferie, fiera, inventario…"
                        onChange={(e) => cambia(r.chiave, "motivo", e.target.value)}
                        aria-describedby={idAiuto}
                      />
                    </div>
                    <button type="button" className="pn-tasto pn-tasto-pericolo pn-imp-togli" onClick={() => togli(r, n)}>
                      Togli<span className="sr-only"> la chiusura {n}</span>
                    </button>
                  </div>
                  <p id={idAiuto} className={mostra ? "pn-errore-campo" : "pn-aiuto"}>
                    {mostra
                      ? mostra
                      : r.dal && r.al
                        ? `Chiuso ${periodo(r.dal, r.al, oggi)} · ${durata(r) === 1 ? "1 giorno" : `${durata(r)} giorni`}${r.motivo.trim() ? ` · il cliente legge «${r.motivo.trim()}»` : ""}`
                        : "Scegli il primo e l’ultimo giorno: sono compresi tutti e due."}
                  </p>
                </fieldset>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="pn-vuoto">Nessuna chiusura in programma: i clienti possono chiedere qualunque giorno.</p>
      )}
      <EsitoSalvataggio ref={areaEsito} esito={esito} />
    </Riquadro>
  );
}
