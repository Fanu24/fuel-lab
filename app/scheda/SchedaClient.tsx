"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type Ref } from "react";
import Reveal from "@/components/Reveal";
import Ticker from "@/components/Ticker";
import { Eyebrow, Rise } from "@/components/ui";
import {
  componiPiano,
  TARGET_DEFAULT,
  VINCOLI_DEFAULT,
  type EsitoPiano,
  type Vincoli,
} from "@/lib/matcher";
import { PRIMI, SECONDI } from "@/lib/catalogo";
import { CASELLE_TOTALI } from "@/lib/settimana";
import type { Target } from "@/lib/types";
import Risultato from "./Risultato";
import Valori from "./Valori";

/**
 * LA TUA SCHEDA — quattro stati sulla stessa pagina.
 *
 * L'onesta della pagina e' anche la sua regola di scrittura: l'upload e'
 * scenografico (senza backend nessuno puo leggere davvero un PDF) e ogni stato
 * lo dice. Da qui in poi pero' lavora il matcher vero: componiPiano() gira in
 * questo browser e riempie le caselle della settimana con abbinamenti
 * primo+secondo. Quello non lo fingiamo, e infatti dopo "Componi la mia
 * settimana" non c'e' nessuna finta attesa.
 */

type Fase = "carica" | "scansione" | "valori" | "risultato";
type Origine = "scheda" | "mano";

const TAPPE: { fase: Fase; label: string }[] = [
  { fase: "carica", label: "Carica" },
  { fase: "scansione", label: "Legge" },
  { fase: "valori", label: "Correggi" },
  { fase: "risultato", label: "Componi" },
];

/**
 * Il tetto di ripetizioni, giro dopo giro.
 * E' l'unica leva onesta che ha "Rigenera": il matcher e' deterministico, a
 * parita di target e vincoli ridarebbe la stessa identica settimana. Cambiando
 * quante volte un elemento puo ripetersi cambia davvero la selezione, senza
 * toccare i numeri che l'utente ha appena confermato.
 */
const RIPETIZIONI = [2, 1, 3, 4];

const ESTENSIONI = /\.(pdf|jpe?g|png|webp|heic)$/i;

/**
 * Le due foto non legate a un piatto.
 * Stessa firma di dishImg(): gli id stanno qui, dichiarati una volta, e sono gli
 * stessi gia in uso su /menu, /box e /chi-e-matteo. Nessun id inventato in mezzo
 * al JSX, cosi la regola "o un id della lista o dishImg()" resta verificabile.
 */
const FOTO = {
  box: {
    id: "photo-1498837167922-ddd27525d352",
    alt: "Contenitori di meal prep porzionati e pronti per la consegna",
  },
  cucina: {
    id: "photo-1414235077428-338989a2e8c0",
    alt: "Impiattamento in una cucina professionale",
  },
};

const foto = (id: string, w: number) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;

/* =========================================================================
   STATO 1 — CARICAMENTO
   ====================================================================== */

function Caricamento({
  onScheda,
  onMano,
  headingRef,
}: {
  onScheda: (nome: string) => void;
  onMano: () => void;
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  const [caldo, setCaldo] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [accettato, setAccettato] = useState<string | null>(null);
  // dragleave scatta anche solo passando sopra un figlio: senza contare le
  // entrate la zona si spegne mentre il file ci sta ancora sopra.
  const profondita = useRef(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    // Un file lasciato cadere FUORI dalla zona farebbe aprire il file al posto
    // del sito: il browser naviga via e la demo muore in mano al cliente.
    const blocca = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", blocca);
    window.addEventListener("drop", blocca);
    return () => {
      window.removeEventListener("dragover", blocca);
      window.removeEventListener("drop", blocca);
    };
  }, []);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const accetta = useCallback(
    (file: File | null | undefined) => {
      if (!file || accettato) return;
      const nome = file.name.trim();
      if (!ESTENSIONI.test(nome)) {
        setAccettato(null);
        setErrore(nome + " non va bene. Servono PDF, JPG, PNG, WEBP o HEIC.");
        return;
      }
      setErrore(null);
      setAccettato(nome);
      // Una battuta di conferma: il nome del file deve farsi vedere prima che
      // la pagina cambi stato, altrimenti il lampo lime sembra un errore.
      timer.current = window.setTimeout(() => onScheda(nome), 520);
    },
    [accettato, onScheda],
  );

  return (
    <div className="grid items-start gap-12 lg:grid-cols-[1fr_368px]">
      {/* ---------- zona di rilascio ---------- */}
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          profondita.current += 1;
          setCaldo(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => {
          profondita.current = Math.max(0, profondita.current - 1);
          if (profondita.current === 0) setCaldo(false);
        }}
        onDragEnd={() => {
          profondita.current = 0;
          setCaldo(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          profondita.current = 0;
          setCaldo(false);
          accetta(e.dataTransfer.files?.[0]);
        }}
        className="relative flex flex-col items-start justify-center px-7 py-12 sm:px-11 sm:py-[54px]"
        style={{
          borderRadius: "var(--shell)",
          border: "1px dashed " + (caldo ? "var(--color-lime)" : "rgba(223,255,62,.34)"),
          background: caldo ? "rgba(223,255,62,.1)" : "rgba(223,255,62,.035)",
          transform: caldo ? "scale(1.012)" : "none",
          transition:
            "background-color .5s var(--e-out), border-color .5s var(--e-out), transform .6s var(--e-over)",
        }}
      >
        {/* trama a 115 gradi identica alle barre macro, con la riga di partenza sul bordo */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: "inherit",
            opacity: caldo ? 1 : 0.5,
            transition: "opacity .55s var(--e-out)",
            background:
              "linear-gradient(90deg, var(--color-lime) 0 6px, transparent 6px), repeating-linear-gradient(115deg, rgba(223,255,62,.1) 0 6px, rgba(223,255,62,.022) 6px 14px)",
          }}
        />

        <div className="relative z-1 w-full">
          <p className="note text-ink">Passo 1 / 4</p>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="h3 mt-4 max-w-[380px] !text-[clamp(26px,4.4vw,36px)] outline-none"
          >
            Trascina qui la scheda del tuo nutrizionista
          </h2>
          <p className="mt-4 max-w-[430px] text-[15px] leading-relaxed text-ink">
            PDF, foto, screenshot: quello che hai. Il file resta sul tuo computer, non lo
            carichiamo da nessuna parte.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <input
              id="scheda-file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
              className="peer sr-only"
              disabled={accettato !== null}
              onChange={(e) => {
                const scelto = e.target.files?.[0];
                // Svuoto il campo dopo aver preso il File: senza, riscegliere lo
                // stesso file dopo un errore di formato non farebbe scattare nulla.
                e.target.value = "";
                accetta(scelto);
              }}
            />
            {/* L'input e' il vero controllo (resta raggiungibile da tastiera), la
                label ne e' il volto: cosi il dialogo si apre senza JavaScript.
                Il fuoco lo riporta il CSS con peer-focus-visible, non uno stato
                React: l'anello resta visibile anche se l'idratazione tarda. */}
            <label
              htmlFor="scheda-file"
              className="btn btn-p cursor-pointer peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[3px] peer-focus-visible:outline-ink"
            >
              Scegli il file
              <span className="dot" aria-hidden="true">
                &#8594;
              </span>
            </label>
            <p className="note">o trascinalo qui dentro</p>
          </div>

          <div className="mt-7 min-h-[36px]">
            {accettato !== null ? (
              <p
                className="inline-block max-w-full overflow-hidden rounded-full bg-lime px-4 py-[7px] font-mono text-[12px] text-ellipsis whitespace-nowrap text-ink"
                style={{ fontVariationSettings: '"wdth" 84' }}
              >
                Scheda ricevuta: {accettato}
              </p>
            ) : null}
            {errore !== null ? (
              <p
                role="alert"
                className="inline-block max-w-full rounded-full px-4 py-[7px] font-mono text-[12px] text-ink"
                style={{
                  fontVariationSettings: '"wdth" 84',
                  border: "1px solid rgba(223,255,62,.42)",
                }}
              >
                {errore}
              </p>
            ) : null}
          </div>

          <p className="mt-8 border-t pt-6" style={{ borderColor: "var(--hair-soft)" }}>
            <button
              type="button"
              onClick={onMano}
              className="text-[14px] text-ink underline decoration-ink decoration-2 underline-offset-[6px] transition-colors duration-400 ease-[var(--e-out)] hover:text-ink"
            >
              Non ho una scheda, inserisco i valori a mano
            </button>
          </p>
        </div>
      </div>

      {/* ---------- colonna di destra ---------- */}
      <div className="lg:-mt-6">
        <figure className="shell lg:-ml-14 lg:rotate-[2.1deg]">
          <div className="core">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={foto(FOTO.box.id, 760)}
              alt={FOTO.box.alt}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
            />
            <figcaption className="p-6">
              <p className="note text-ink">Il box della settimana</p>
              <p className="mt-3 text-[14px] leading-relaxed text-ink">
                Da qui escono schiscette porzionate al grammo, non consigli generici.
              </p>
            </figcaption>
          </div>
        </figure>

        <ul className="mt-8 grid gap-3">
          {[
            "I macro giornalieri della tua scheda",
            "Quanti pasti al giorno vuoi coprire",
            "Cosa non mangi",
          ].map((v, i) => (
            <li key={v} className="flex items-start gap-3">
              <span
                className="mt-[7px] block h-[7px] w-[7px] flex-none rotate-45 bg-lime"
                aria-hidden="true"
                style={{ opacity: 1 - i * 0.24 }}
              />
              <span className="text-[14px] text-muted">{v}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* =========================================================================
   STATO 2 — SCANSIONE
   ====================================================================== */

const PASSI = [
  "lettura del documento",
  "estrazione dei macro",
  "confronto con il catalogo",
  "composizione della settimana",
];

/** Larghezze delle righe finte del documento: irregolari, come un testo vero. */
const RIGHE_DOC = [86, 64, 92, 48, 78, 88, 40, 70, 82, 56];

function Scansione({
  nomeFile,
  onFine,
  headingRef,
}: {
  nomeFile: string | null;
  onFine: () => void;
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  const [passo, setPasso] = useState(0);

  useEffect(() => {
    const ridotto =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Chi ha chiesto meno movimento non deve nemmeno aspettare la scenografia.
    const durata = ridotto ? 700 : 2600;
    const battuta = durata / (PASSI.length + 1);
    const passi = window.setInterval(() => setPasso((p) => Math.min(PASSI.length, p + 1)), battuta);
    const fine = window.setTimeout(onFine, durata);
    return () => {
      window.clearInterval(passi);
      window.clearTimeout(fine);
    };
  }, [onFine]);

  return (
    <div className="grid items-center gap-12 lg:grid-cols-[336px_1fr]">
      {/* ---------- il documento sotto la linea ---------- */}
      <div className="shell mx-auto w-full max-w-[336px] lg:-rotate-[2.4deg]">
        <div className="core relative overflow-hidden p-7" style={{ background: "#0a1f17" }}>
          {/* La linea e' alta un quarto del documento: fuel-scan la porta da
              -100% a 400%, cioe' una spazzata completa piu' l'uscita in basso. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-1/4"
            style={{
              background: "linear-gradient(180deg, rgba(223,255,62,0), rgba(223,255,62,.16))",
              borderBottom: "2px solid var(--color-lime)",
              boxShadow: "0 8px 34px rgba(223,255,62,.35)",
              animation: "fuel-scan 1.3s var(--e-mass) infinite",
            }}
          />
          <p
            className="font-mono text-[10.5px] tracking-[.2em] text-lime uppercase"
            style={{ fontVariationSettings: '"wdth" 84' }}
          >
            Scheda
          </p>
          <p className="mt-2 overflow-hidden text-[15px] text-ellipsis whitespace-nowrap text-white">
            {nomeFile ?? "valori inseriti a mano"}
          </p>
          <div className="mt-6 grid gap-[10px]">
            {RIGHE_DOC.map((w, i) => (
              <span
                key={i}
                className="block h-[7px] rounded-full"
                style={{
                  width: w + "%",
                  background: i % 4 === 1 ? "rgba(223,255,62,.34)" : "rgba(201,224,205,.16)",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ---------- telemetria ---------- */}
      <div>
        <p className="note text-ink">Passo 2 / 4</p>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="h2 mt-4 !text-[clamp(34px,5.2vw,56px)] outline-none"
        >
          Un attimo.
        </h2>

        <ol className="mt-9 grid gap-[14px]" aria-label="Avanzamento della lettura" aria-live="polite">
          {PASSI.map((p, i) => {
            const fatto = i < passo;
            const corrente = i === passo;
            const visibile = i <= passo;
            return (
              <li
                key={p}
                className="flex items-center gap-4"
                style={{
                  opacity: visibile ? 1 : 0.24,
                  transform: visibile ? "none" : "translateY(6px)",
                  transition: "opacity .6s var(--e-out), transform .6s var(--e-out)",
                }}
              >
                <span
                  aria-hidden="true"
                  className="block h-[9px] w-[9px] flex-none rotate-45"
                  style={{
                    background: fatto || corrente ? "var(--color-lime)" : "rgba(201,224,205,.28)",
                    animation: corrente ? "fuel-spin 1.6s var(--e-mass) infinite" : undefined,
                  }}
                />
                <span
                  className="font-mono text-[12.5px] tracking-[.06em] text-ink"
                  style={{ fontVariationSettings: '"wdth" 84' }}
                >
                  {p}
                </span>
                <span
                  className="ml-auto font-mono text-[11px] tracking-[.2em] uppercase"
                  style={{
                    fontVariationSettings: '"wdth" 84',
                    // Questa colonna sta su CARTA, non dentro il documento scuro qui
                    // accanto: il lime ci fa 1.00:1 (luminanza identica) e il mink 1.84:1,
                    // cioe i due divieti scritti in testa a globals.css. L'accento lime
                    // resta dov'era gia, sul rombo qui sopra, che e una SUPERFICIE.
                    // ink 12.66:1 su carta, muted 4.65:1: la gerarchia regge lo stesso.
                    color: fatto ? "var(--color-ink)" : "var(--color-muted)",
                  }}
                >
                  {fatto ? "ok" : corrente ? "..." : "in coda"}
                </span>
              </li>
            );
          })}
        </ol>

        <p className="note mt-9 border-t pt-6" style={{ borderColor: "var(--hair-soft)" }}>
          Simulazione: il file non viene aperto n&eacute; caricato
        </p>
      </div>
    </div>
  );
}

/* =========================================================================
   INDICATORE DI TAPPA
   ====================================================================== */

function Tappe({ fase }: { fase: Fase }) {
  const attuale = TAPPE.findIndex((t) => t.fase === fase);
  return (
    <ol className="flex flex-wrap items-center gap-3" aria-label="I quattro passi">
      {TAPPE.map((t, i) => {
        const fatta = i < attuale;
        const qui = i === attuale;
        return (
          <li key={t.fase} className="flex items-center gap-3">
            <span
              aria-current={qui ? "step" : undefined}
              className="flex items-center gap-[9px] rounded-full px-[14px] py-[7px] font-mono text-[11px] tracking-[.14em] uppercase"
              style={{
                fontVariationSettings: '"wdth" 84',
                background: qui ? "var(--color-lime)" : "rgba(201,224,205,.05)",
                // Testata su fondo paper, sempre chiaro: ink e muted reggono
                // qui, lime e mink no (lime su paper e 1:1, mink e riservato ai
                // blocchi scuri). Il passo fatto si distingue dal futuro per
                // FORMA (la spunta sotto), il colore e solo un rinforzo.
                color: qui ? "var(--color-ink)" : fatta ? "var(--color-ink)" : "var(--color-muted)",
                border: "1px solid " + (qui ? "transparent" : "var(--hair-soft)"),
                transition: "background-color .5s var(--e-out), color .5s var(--e-out)",
              }}
            >
              {/* Senza opacita': a .6 il numero faceva 2.36:1 sul passo futuro e
                  3.85:1 su quello corrente. Il numero della tappa e' contenuto,
                  e la gerarchia con l'etichetta la fa gia' il peso del carattere. */}
              <b className="font-normal">{fatta ? "✓" : i + 1}</b>
              {t.label}
            </span>
            {i < TAPPE.length - 1 ? (
              <i
                aria-hidden="true"
                className="hidden h-px w-6 sm:block"
                style={{ background: fatta ? "var(--color-lime)" : "var(--hair-soft)" }}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/* =========================================================================
   PAGINA
   ====================================================================== */

export default function SchedaClient() {
  const [fase, setFase] = useState<Fase>("carica");
  const [origine, setOrigine] = useState<Origine>("scheda");
  const [nomeFile, setNomeFile] = useState<string | null>(null);
  const [target, setTarget] = useState<Target>(TARGET_DEFAULT);
  const [vincoli, setVincoli] = useState<Vincoli>(VINCOLI_DEFAULT);
  const [esito, setEsito] = useState<EsitoPiano | null>(null);
  const [giro, setGiro] = useState(0);

  const ancora = useRef<HTMLDivElement | null>(null);
  const titoloPannello = useRef<HTMLHeadingElement | null>(null);
  const primoRender = useRef(true);

  // Ogni salto di stato riscrive mezza pagina: senza riportare l'occhio in cima
  // al pannello il contenuto nuovo comincerebbe sopra il bordo dello schermo.
  // Il bottone che ha innescato il passaggio viene smontato insieme al vecchio
  // pannello, quindi senza portare il fuoco sull'h2 del pannello nuovo cadrebbe
  // su <body>: chi naviga da tastiera riparte dalla cima del documento e chi
  // usa uno screen reader non riceve nessun annuncio del pannello nuovo.
  useEffect(() => {
    if (primoRender.current) {
      primoRender.current = false;
      return;
    }
    ancora.current?.scrollIntoView({ block: "start" });
    titoloPannello.current?.focus();
  }, [fase]);

  const daScheda = useCallback((nome: string) => {
    setNomeFile(nome);
    setOrigine("scheda");
    setFase("scansione");
  }, []);

  const aMano = useCallback(() => {
    setNomeFile(null);
    setOrigine("mano");
    setFase("valori");
  }, []);

  const scansioneFinita = useCallback(() => setFase("valori"), []);

  const conferma = useCallback((t: Target, v: Vincoli) => {
    setTarget(t);
    setVincoli(v);
    setEsito(componiPiano(t, { ...v, maxRipetizioni: RIPETIZIONI[0] }));
    setGiro(0);
    setFase("risultato");
  }, []);

  const rigenera = useCallback(() => {
    const prossimo = giro + 1;
    setGiro(prossimo);
    setEsito(
      componiPiano(target, {
        ...vincoli,
        maxRipetizioni: RIPETIZIONI[prossimo % RIPETIZIONI.length],
      }),
    );
  }, [giro, target, vincoli]);

  return (
    <>
      {/* ========================= TESTATA ========================= */}
      <section className="pt-[158px] pb-[56px]">
        <div className="wrap">
          <Eyebrow className="mb-8">Personalizzato sui tuoi macro</Eyebrow>
          <h1 className="h1 max-w-[15ch]">
            <Rise i={0}>La tua scheda</Rise>
            <Rise i={1}>
              diventa <span className="hl hl-on"><i className="hl-bar" aria-hidden="true" /><span className="hl-tx">il tuo menu.</span></span>
            </Rise>
          </h1>
          <div className="mt-11 flex flex-wrap items-end justify-between gap-x-12 gap-y-9">
            <p className="lead">
              Carichi la scheda, controlli i numeri, il matcher abbina primi e secondi che chiudono i
              tuoi macro dentro le {CASELLE_TOTALI} caselle della settimana. Poi cucina Matteo.
            </p>
            <Tappe fase={fase} />
          </div>
        </div>
      </section>

      {/* ========================= IL FLUSSO ========================= */}
      <section className="pb-[126px]" id="flusso">
        <div className="wrap">
          <div ref={ancora} className="scroll-mt-[118px]" />

          {/* La chiave forza il rimontaggio di Reveal a ogni salto di stato:
              e' quello che fa entrare il pannello nuovo invece di sostituirlo secco. */}
          {fase === "carica" ? (
            <Reveal key="carica">
              <Caricamento onScheda={daScheda} onMano={aMano} headingRef={titoloPannello} />
            </Reveal>
          ) : null}

          {fase === "scansione" ? (
            <Reveal key="scansione">
              <Scansione
                nomeFile={nomeFile}
                onFine={scansioneFinita}
                headingRef={titoloPannello}
              />
            </Reveal>
          ) : null}

          {fase === "valori" ? (
            <Reveal key="valori">
              <Valori
                target={target}
                vincoli={vincoli}
                nomeFile={origine === "scheda" ? nomeFile : null}
                onConferma={conferma}
                onRicomincia={() => setFase("carica")}
                headingRef={titoloPannello}
              />
            </Reveal>
          ) : null}

          {fase === "risultato" && esito !== null ? (
            <Reveal key="risultato">
              <Risultato
                esito={esito}
                target={target}
                giro={giro}
                maxRipetizioni={RIPETIZIONI[giro % RIPETIZIONI.length]}
                onRigenera={rigenera}
                onModifica={() => setFase("valori")}
                headingRef={titoloPannello}
              />
            </Reveal>
          ) : null}
        </div>
      </section>

      <Ticker
        parole={["I tuoi macro", "Non i nostri", "La scheda decide", "Matteo cucina"]}
        durata={38}
      />

      {/* ========================= ONESTA ========================= */}
      <section className="py-[124px]">
        <div className="wrap">
          <div className="grid items-start gap-14 lg:grid-cols-[1fr_388px]">
            <div>
              <Reveal>
                <Eyebrow className="mb-7">Come funziona davvero</Eyebrow>
                <h2 className="h2 max-w-[13ch]">Cosa succede al tuo file.</h2>
              </Reveal>

              <div className="mt-12 grid gap-5">
                {[
                  {
                    n: "01",
                    t: "Il file non esce dal tuo computer",
                    d: "Non c'è nessun caricamento: la pagina legge solo il nome del file per mostrartelo. Niente server, niente copie, niente scheda del nutrizionista che gira in rete.",
                    // rientro applicato solo da md in su: sotto, la colonna si raddrizza
                    sposta: "",
                  },
                  {
                    n: "02",
                    t: "I numeri li scrivi tu",
                    d: "L'animazione di lettura è scenografia. Il pannello parte da una scheda tipo e la correggi a mano in dieci secondi. Quando ordini davvero, Matteo guarda la tua scheda con te e imposta i valori insieme.",
                    sposta: "md:ml-10",
                  },
                  {
                    n: "03",
                    t: "Il matcher invece è vero",
                    d: "L'algoritmo che sceglie i piatti gira qui, adesso, su tutto il catalogo: minimizza lo scarto dai tuoi macro e pesa le proteine più di tutto. Per questo dopo non trovi nessuna finta attesa.",
                    sposta: "md:ml-5",
                  },
                ].map((b, i) => (
                  <Reveal key={b.n} delay={i * 110}>
                    <article className={"shell " + b.sposta}>
                      <div className="core flex flex-col gap-2 p-7 sm:flex-row sm:gap-7">
                        <p
                          className="font-mono text-[13px] text-ink"
                          style={{ fontVariationSettings: '"wdth" 84' }}
                        >
                          {b.n}
                        </p>
                        <div>
                          <h3 className="h3 !text-[23px]">{b.t}</h3>
                          <p className="mt-3 max-w-[54ch] text-[14.5px] leading-relaxed text-muted">
                            {b.d}
                          </p>
                        </div>
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>

            <Reveal delay={160} className="lg:pt-16">
              <figure className="shell lg:-rotate-[1.6deg]">
                <div className="core">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={foto(FOTO.cucina.id, 880)}
                    alt={FOTO.cucina.alt}
                    loading="lazy"
                    className="aspect-[4/5] w-full object-cover"
                  />
                </div>
              </figure>
              <p className="note mt-6 px-2">Pescara — cottura del luned&igrave; e del gioved&igrave;</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ========================= CHIUSURA ========================= */}
      <section className="pb-[138px]">
        <div className="wrap">
          <Reveal>
            <div className="shell">
              <div className="core flex flex-wrap items-center justify-between gap-8 p-9 sm:p-12">
                <div>
                  <h2 className="h2 !text-[clamp(30px,4.4vw,46px)]">
                    Vuoi prima vedere cosa si mangia?
                  </h2>
                  <p className="mt-4 max-w-[46ch] text-[15px] text-muted">
                    I {PRIMI.length} primi e i {SECONDI.length} secondi del catalogo, con i macro di
                    ognuno.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Link href="/menu" className="btn btn-p">
                    Guarda il menu
                    <span className="dot" aria-hidden="true">
                      &#8594;
                    </span>
                  </Link>
                  <Link href="/come-funziona" className="btn btn-s">
                    Come funziona
                    <span className="dot" aria-hidden="true">
                      &#8594;
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
