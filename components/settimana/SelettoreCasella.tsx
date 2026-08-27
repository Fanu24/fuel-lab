"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as KeyboardEventReact, MouseEvent as MouseEventReact } from "react";
import { EXTRA, PRIMI, SECONDI } from "@/lib/catalogo";
import type { Elemento, Extra } from "@/lib/catalogo";
import { usePiano } from "@/lib/piano";
import { NOMI_GIORNO, macroCasella } from "@/lib/settimana";
import type { GiornoSettimana, Pasto } from "@/lib/settimana";
import { NOMI_PASTO } from "./CasellaBottone";

/* =========================================================================
   Il selettore: cosa entra in una casella.

   Tre cose lo tengono in piedi, e sono tre cose che di solito si sbagliano.

   1. I MACRO SI AGGIORNANO MENTRE SCEGLI, non alla chiusura. Il blocco scuro in
      alto legge la casella dal piano a ogni render, quindi appena si tocca un
      primo le quattro cifre cambiano. E' l'unico modo in cui la scelta diventa
      una decisione informata invece di un salto nel buio seguito da una
      verifica: si vede subito che quel secondo porta la cena a 900 kcal.

   2. IL FOCUS. Il pannello e' aria-modal, quindi per uno screen reader il resto
      della pagina non esiste piu': se il Tab potesse uscire, l'utente finirebbe
      a navigare una pagina che gli viene descritta come assente. Il giro di Tab
      e' chiuso dentro il pannello, Escape chiude, e alla chiusura il focus torna
      alla casella da cui si e' partiti - lo fa il chiamante, che sa quale nodo
      e' stato cliccato: qui dentro non lo sapremmo.

   3. NIENTE PREZZI. Da nessuna parte, nemmeno di sfuggita: la settimana si
      misura in macro, il preventivo nasce nella conversazione WhatsApp.
   ========================================================================= */

type Scheda = "primo" | "secondo" | "extra";

const SCHEDE: { id: Scheda; label: string }[] = [
  { id: "primo", label: "Primi" },
  { id: "secondo", label: "Secondi" },
  { id: "extra", label: "Extra" },
];

/**
 * Ricerca senza accenti e senza maiuscole: si cerca "pure" e si trova "pure'"
 * scritto con l'accento. NFD scompone la lettera accentata in lettera piu'
 * segno, e il segno si butta.
 */
function normalizza(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function corrispondeElemento(e: Elemento, q: string): boolean {
  if (q === "") return true;
  return normalizza(`${e.nome} ${e.descrizione} ${e.tag.join(" ")}`).includes(q);
}

/* Tutto cio' che il browser mette nel giro di Tab. Le schede non selezionate
   hanno tabIndex -1 (roving tabindex) e vanno escluse, altrimenti il giro si
   chiuderebbe su un elemento che con Tab non e' raggiungibile. */
const FOCUSABILI =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/*
 * Stesso rattoppo di app/settimana/SettimanaClient.tsx, dove sta la spiegazione
 * per esteso: il reset non stratificato `button { background: none; color:
 * inherit }` di globals.css batte .btn-p, che vive in @layer components, e lo
 * stile inline e' l'unica dichiarazione che gli sopravvive. Senza, il primario
 * di questo pannello e' testo nudo invece di una pillola. Bianco su inchiostro:
 * 14.30:1. Si cancella con l'altro, quando i reset entreranno in @layer base.
 */
const RATTOPPO_BTN_P = { background: "var(--color-ink)", color: "#fff" } as const;

export default function SelettoreCasella({
  giorno,
  pasto,
  onChiudi,
}: {
  giorno: GiornoSettimana;
  pasto: Pasto;
  onChiudi: () => void;
}) {
  const { casella, metti, togliElemento, alternaExtra, svuotaCasella } = usePiano();
  const [scheda, setScheda] = useState<Scheda>("primo");
  const [cerca, setCerca] = useState("");

  const pannello = useRef<HTMLDivElement>(null);
  const rifScheda = useRef<Partial<Record<Scheda, HTMLButtonElement | null>>>({});
  const base = useId();
  const idTitolo = `${base}-titolo`;
  const idCerca = `${base}-cerca`;

  const contenuto = casella(giorno, pasto);
  const macro = macroCasella(contenuto);
  const vuota = !contenuto;

  const q = normalizza(cerca.trim());
  const elenco: Elemento[] = useMemo(() => {
    if (scheda === "extra") return [];
    return (scheda === "primo" ? PRIMI : SECONDI).filter((e) => corrispondeElemento(e, q));
  }, [scheda, q]);
  const elencoExtra: Extra[] = useMemo(
    () =>
      scheda === "extra" ? EXTRA.filter((e) => q === "" || normalizza(e.nome).includes(q)) : [],
    [scheda, q],
  );

  const totali =
    scheda === "extra" ? EXTRA.length : scheda === "primo" ? PRIMI.length : SECONDI.length;
  const trovati = scheda === "extra" ? elencoExtra.length : elenco.length;
  const nomeScheda = scheda === "extra" ? "extra" : scheda === "primo" ? "primi" : "secondi";

  /*
   * Il focus entra nel pannello all'apertura - cosi' lo screen reader annuncia il
   * dialogo col suo titolo e il primo Tab entra dentro invece di ripartire dal
   * documento - e ci RIENTRA se qualcosa lo ha buttato fuori.
   *
   * La seconda meta' non e' teorica, e' misurata in Chrome. Due bottoni di questo
   * pannello distruggono se stessi: "Svuota la casella" si auto-disabilita (per
   * specifica HTML un elemento disabilitato perde il focus) e "Azzera la ricerca"
   * si smonta insieme allo stato vuoto che lo conteneva. In entrambi i casi il
   * focus finisce su <body>, cioe' FUORI da un pannello dichiarato aria-modal e
   * con la pagina bloccata: da li' nessun tasto premuto raggiunge piu' questo
   * componente, perche' un evento su body non attraversa un suo discendente.
   *
   * Va fatto dopo il render, non dentro gli handler: quando l'handler finisce
   * React puo' non aver ancora disabilitato o smontato niente, e un focus messo
   * troppo presto verrebbe tolto un istante dopo. Un effetto senza dipendenze
   * gira dopo ogni commit, che e' esattamente quando serve. Mentre il pannello e'
   * aperto niente fuori puo' avere legittimamente il focus, quindi la condizione
   * non ha falsi positivi.
   */
  useEffect(() => {
    const p = pannello.current;
    if (p && !p.contains(document.activeElement)) p.focus();
  });

  /*
   * Escape su document e non solo sul pannello, per la stessa ragione: se il
   * focus e' finito su body l'handler del pannello non lo vede piu' passare, e
   * l'unica uscita da un modale resterebbe il mouse. Questo listener e' l'unico
   * proprietario di Escape; il pannello si tiene solo il giro di Tab.
   */
  useEffect(() => {
    const suEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      onChiudi();
    };
    document.addEventListener("keydown", suEsc);
    return () => document.removeEventListener("keydown", suEsc);
  }, [onChiudi]);

  // La pagina sotto non deve scorrere: su mobile il pannello e' un foglio che
  // copre tutto, e lo scroll che continua dietro fa perdere il punto in cui si
  // era. Stessa tecnica del pannello mobile della nav.
  useEffect(() => {
    const prima = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prima;
    };
  }, []);

  function nodiFocusabili(): HTMLElement[] {
    const p = pannello.current;
    if (!p) return [];
    return Array.from(p.querySelectorAll<HTMLElement>(FOCUSABILI)).filter(
      (n) => n.tabIndex >= 0 && n.offsetParent !== null,
    );
  }

  // Solo Tab: Escape lo tiene il listener su document, vedi sopra.
  function suTasto(e: KeyboardEventReact<HTMLDivElement>) {
    if (e.key !== "Tab") return;

    const nodi = nodiFocusabili();
    if (nodi.length === 0) {
      e.preventDefault();
      return;
    }
    const primo = nodi[0];
    const ultimo = nodi[nodi.length - 1];
    const attivo = document.activeElement;

    // Il pannello stesso conta come "prima del primo": all'apertura il focus e'
    // su di lui, e uno Shift+Tab da li' deve girare in fondo, non uscire.
    if (e.shiftKey && (attivo === primo || attivo === pannello.current)) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && attivo === ultimo) {
      e.preventDefault();
      primo.focus();
    }
  }

  /* Frecce, Home e Fine sulle schede: e' il contratto che role="tab" promette a
     chi naviga da tastiera, e prometterlo senza mantenerlo e' peggio che non
     dichiarare le schede del tutto. */
  function suTastoScheda(e: KeyboardEventReact<HTMLButtonElement>) {
    const i = SCHEDE.findIndex((s) => s.id === scheda);
    let j = -1;
    if (e.key === "ArrowRight") j = (i + 1) % SCHEDE.length;
    else if (e.key === "ArrowLeft") j = (i - 1 + SCHEDE.length) % SCHEDE.length;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = SCHEDE.length - 1;
    if (j < 0) return;
    e.preventDefault();
    const prossima = SCHEDE[j].id;
    setScheda(prossima);
    rifScheda.current[prossima]?.focus();
  }

  function suFondo(e: MouseEventReact<HTMLDivElement>) {
    // Solo il fondo: un mousedown partito DENTRO il pannello e rilasciato fuori
    // (una selezione di testo trascinata) non deve chiudere niente.
    if (e.target === e.currentTarget) onChiudi();
  }

  function scegliElemento(e: Elemento) {
    const gia = e.categoria === "primo" ? contenuto?.primo : contenuto?.secondo;
    if (gia === e.id) togliElemento(giorno, pasto, e.categoria);
    else metti(giorno, pasto, e.categoria, e.id);
  }

  function contaScheda(s: Scheda): number {
    if (s === "extra") return contenuto?.extra.length ?? 0;
    return contenuto?.[s] ? 1 : 0;
  }

  return (
    <div
      className="fixed inset-0 z-70 flex items-end justify-center sm:items-center sm:p-6"
      style={{
        background: "rgba(18, 48, 31, .52)",
        backdropFilter: "blur(7px)",
        WebkitBackdropFilter: "blur(7px)",
      }}
      onMouseDown={suFondo}
    >
      <div
        ref={pannello}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitolo}
        tabIndex={-1}
        onKeyDown={suTasto}
        className="shell flex max-h-[94dvh] w-full max-w-[720px] flex-col outline-none sm:max-h-[86vh]"
      >
        <div className="core flex min-h-0 flex-1 flex-col">
          <header
            className="flex items-start justify-between gap-4 border-b p-4 sm:p-5"
            style={{ borderColor: "var(--hair-soft)" }}
          >
            <div>
              <span className="label">Componi la casella</span>
              <h2 id={idTitolo} className="h3 mt-2 text-[24px] sm:text-[28px]">
                {NOMI_GIORNO[giorno]} · {NOMI_PASTO[pasto]}
              </h2>
            </div>
            <button
              type="button"
              onClick={onChiudi}
              aria-label="Chiudi il selettore"
              className="grid h-[40px] w-[40px] shrink-0 place-items-center rounded-full text-[19px] leading-none transition-colors duration-300 hover:bg-lime"
              style={{ background: "rgba(18, 48, 31, .07)" }}
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>

          {/* Il blocco che cambia mentre scegli. Fondo inchiostro: e' l'unico
              posto in cui il lime puo' essere una cifra invece di una superficie. */}
          <div className="px-4 pt-4 sm:px-5">
            <div className="readout on-ink grid-cols-4 gap-2 rounded-[var(--chip-r)] px-3 py-3 sm:px-4">
              <div>
                <span className="ro-n" style={{ fontSize: 21 }}>
                  {macro.kcal}
                </span>
                <span className="ro-l">kcal</span>
              </div>
              <div>
                <span className="ro-n" style={{ fontSize: 21 }}>
                  {macro.proteine}
                </span>
                <span className="ro-l">prot g</span>
              </div>
              <div>
                <span className="ro-n" style={{ fontSize: 21 }}>
                  {macro.carboidrati}
                </span>
                <span className="ro-l">carb g</span>
              </div>
              <div>
                <span className="ro-n" style={{ fontSize: 21 }}>
                  {macro.grassi}
                </span>
                <span className="ro-l">gras g</span>
              </div>
            </div>
            {/* Una frase sola invece di quattro numeri che cambiano: chi ascolta
                sente "640 kcal, 45 g di proteine..." e non un flusso di cifre
                senza etichetta a ogni tocco. */}
            <p className="sr-only" aria-live="polite">
              {`Casella: ${macro.kcal} kcal, ${macro.proteine} g di proteine, ${macro.carboidrati} g di carboidrati, ${macro.grassi} g di grassi.`}
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Cosa mettere nella casella"
            className="flex gap-2 px-4 pt-4 sm:px-5"
          >
            {SCHEDE.map((s) => {
              const attiva = scheda === s.id;
              const n = contaScheda(s.id);
              return (
                <button
                  key={s.id}
                  ref={(nodo) => {
                    rifScheda.current[s.id] = nodo;
                  }}
                  type="button"
                  role="tab"
                  id={`${base}-tab-${s.id}`}
                  aria-selected={attiva}
                  aria-controls={`${base}-pannello`}
                  tabIndex={attiva ? 0 : -1}
                  onClick={() => setScheda(s.id)}
                  onKeyDown={suTastoScheda}
                  className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-bold tracking-[.08em] uppercase transition-colors duration-300 ${
                    attiva ? "bg-ink text-lime" : "bg-tray text-ink hover:bg-lime"
                  }`}
                >
                  {s.label}
                  {n > 0 ? (
                    <span
                      className="mono rounded-full px-1.5 py-[1px] text-[10px] font-bold"
                      style={{
                        background: attiva ? "rgba(223, 255, 62, .2)" : "rgba(18, 48, 31, .12)",
                      }}
                    >
                      {n}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div
            id={`${base}-pannello`}
            role="tabpanel"
            aria-labelledby={`${base}-tab-${scheda}`}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="px-4 pt-4 sm:px-5">
              <label htmlFor={idCerca} className="sr-only">
                Cerca fra i {nomeScheda}
              </label>
              <input
                id={idCerca}
                type="text"
                className="field"
                placeholder="Cerca per nome o ingrediente"
                value={cerca}
                onChange={(e) => setCerca(e.target.value)}
                autoComplete="off"
              />
              <p className="note mt-3">
                {trovati} su {totali} {nomeScheda}
                {scheda === "extra" ? " · si sommano" : " · tocca di nuovo per togliere"}
              </p>
            </div>

            <ul className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-4 pb-4 sm:px-5">
              {scheda !== "extra"
                ? elenco.map((e) => (
                    <li key={e.id}>
                      <RigaScelta
                        nome={e.nome}
                        dettaglio={`${e.kcal} kcal · P ${e.proteine} · C ${e.carboidrati} · G ${e.grassi} · ${e.grammi} g`}
                        allergeni={e.allergeni}
                        scelto={
                          (e.categoria === "primo" ? contenuto?.primo : contenuto?.secondo) === e.id
                        }
                        onClick={() => scegliElemento(e)}
                      />
                    </li>
                  ))
                : elencoExtra.map((e) => (
                    <li key={e.id}>
                      <RigaScelta
                        nome={e.nome}
                        dettaglio={`${e.kcal} kcal · P ${e.proteine} · C ${e.carboidrati} · G ${e.grassi} · ${e.grammi} g`}
                        allergeni={e.allergeni}
                        scelto={contenuto?.extra.includes(e.id) ?? false}
                        onClick={() => alternaExtra(giorno, pasto, e.id)}
                      />
                    </li>
                  ))}

              {trovati === 0 ? (
                <li className="py-9 text-center">
                  <p className="h3 text-[22px]">Nessuna corrispondenza.</p>
                  <button type="button" className="btn btn-s btn-sm mt-5" onClick={() => setCerca("")}>
                    Azzera la ricerca
                    <span className="dot" aria-hidden="true">
                      ×
                    </span>
                  </button>
                </li>
              ) : null}
            </ul>
          </div>

          <footer
            className="flex flex-wrap items-center justify-between gap-3 border-t p-4 sm:p-5"
            style={{ borderColor: "var(--hair-soft)" }}
          >
            <button
              type="button"
              className="btn btn-s btn-sm"
              onClick={() => svuotaCasella(giorno, pasto)}
              disabled={vuota}
            >
              Svuota la casella
              <span className="dot" aria-hidden="true">
                ×
              </span>
            </button>
            <button
              type="button"
              className="btn btn-p btn-sm"
              style={RATTOPPO_BTN_P}
              onClick={onChiudi}
            >
              Fatto
              <span className="dot" aria-hidden="true">
                ✓
              </span>
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}

/**
 * Una riga dell'elenco.
 *
 * Lo stato scelto NON e' affidato al solo colore: c'e' il pallino con la spunta,
 * c'e' aria-pressed per chi la riga non la vede, e il fondo lime e' il terzo
 * segnale, non l'unico. Al passaggio del mouse cambia il contorno e non il fondo:
 * il fondo guscio porterebbe il testo secondario a 4.45:1, sotto la soglia AA.
 */
function RigaScelta({
  nome,
  dettaglio,
  allergeni,
  scelto,
  onClick,
}: {
  nome: string;
  dettaglio: string;
  allergeni: string[];
  scelto: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={scelto}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-[var(--chip-r)] p-3 text-left transition-[background-color,box-shadow] duration-300 ${
        scelto ? "bg-lime" : "bg-cell hover:shadow-[inset_0_0_0_1.5px_var(--color-ink)]"
      }`}
      style={scelto ? { boxShadow: "inset 0 0 0 1.5px var(--color-ink)" } : undefined}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] leading-tight font-bold">{nome}</span>
        <span className="mono mt-1.5 block text-[10px] font-medium text-muted">{dettaglio}</span>
        {/* Allergeni sempre in chiaro, anche quando non ce ne sono: e' un obbligo
            di legge, e "nessuno dichiarato" e' un dato, non un buco. */}
        <span className="mono mt-1 block text-[9.5px] font-medium tracking-[.12em] text-muted uppercase">
          Allergeni: {allergeni.length > 0 ? allergeni.join(", ") : "nessuno dichiarato"}
        </span>
      </span>
      <span
        className="grid h-[28px] w-[28px] shrink-0 place-items-center rounded-full text-[14px] leading-none"
        aria-hidden="true"
        style={
          scelto
            ? { background: "var(--color-ink)", color: "var(--color-lime)" }
            : { background: "rgba(18, 48, 31, .09)" }
        }
      >
        {scelto ? "✓" : "+"}
      </span>
    </button>
  );
}
