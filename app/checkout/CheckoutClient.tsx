"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Reveal from "@/components/Reveal";
import Ticker from "@/components/Ticker";
import { Chip, Eyebrow, Rise } from "@/components/ui";
import { useCart } from "@/lib/cart";
import { dishImg, getDish } from "@/lib/dishes";
import { euro, type Preventivo } from "@/lib/pricing";
import type { Dish, Formula, Giorno } from "@/lib/types";

/* =========================================================================
   CONSEGNA — checkout dimostrativo.
   Non esiste un backend: niente pagamento, niente ordine registrato, nessun
   dato che lascia il browser. La pagina lo dichiara in tre punti diversi
   perche un checkout credibile che finge di incassare sarebbe una bugia.
   ========================================================================= */

/* ------------------------------------------------------------- il modulo */

interface Modulo {
  nome: string;
  email: string;
  telefono: string;
  indirizzo: string;
  citta: string;
  cap: string;
  note: string;
}

type ChiaveModulo = keyof Modulo;

const MODULO_VUOTO: Modulo = {
  nome: "",
  email: "",
  telefono: "",
  indirizzo: "",
  citta: "",
  cap: "",
  note: "",
};

type Errori = Partial<Record<ChiaveModulo, string>>;

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/**
 * Messaggi in prima persona: dicono cosa manca e a cosa serve quel dato.
 * "Campo obbligatorio" non spiega perche Fuel voglia il numero di telefono.
 */
function valida(m: Modulo): Errori {
  const e: Errori = {};

  const nome = m.nome.trim();
  if (!nome) e.nome = "Serve un nome: sul citofono cerchiamo quello.";
  else if (nome.split(/\s+/).length < 2) e.nome = "Manca il cognome.";

  const email = m.email.trim();
  if (!email) e.email = "Serve la mail: e li che arriva il riepilogo.";
  else if (!RE_EMAIL.test(email)) e.email = "Questa mail non sembra valida.";

  const cifre = m.telefono.replace(/\D/g, "");
  if (!cifre) e.telefono = "Serve il telefono: chi consegna chiama dal furgone.";
  else if (cifre.length < 9) e.telefono = "Il numero sembra troppo corto.";

  const via = m.indirizzo.trim();
  if (!via) e.indirizzo = "Serve via e numero civico.";
  else if (!/\d/.test(via)) e.indirizzo = "Manca il numero civico.";

  if (m.citta.trim().length < 2) e.citta = "Serve il comune di consegna.";

  if (!m.cap) e.cap = "Serve il CAP.";
  else if (!/^\d{5}$/.test(m.cap)) e.cap = "Il CAP e fatto di cinque cifre.";

  return e;
}

/* --------------------------------------------------------- la zona servita */

type Zona = "citta" | "provincia" | "fuori";

/**
 * Zona di consegna per INTERVALLI, non per elenco: i CAP di una provincia sono
 * contigui e un elenco puntuale invecchierebbe al primo comune che ne cambia uno.
 * L'ordine conta: 65121-65129 sta dentro 65100-65199 e voglio che vinca "citta".
 */
const INTERVALLI: { zona: Zona; da: number; a: number }[] = [
  { zona: "citta", da: 65121, a: 65129 },
  { zona: "provincia", da: 65010, a: 65020 },
  { zona: "provincia", da: 65100, a: 65199 },
];

/** null = non ancora giudicabile, perche il CAP non ha ancora cinque cifre. */
function zonaCap(cap: string): Zona | null {
  if (!/^\d{5}$/.test(cap)) return null;
  const n = Number(cap);
  const trovato = INTERVALLI.find((i) => n >= i.da && n <= i.a);
  return trovato ? trovato.zona : "fuori";
}

/* -------------------------------------------------------------- gli slot */

interface Slot {
  id: string;
  giorno: Giorno;
  fascia: string;
}

const SLOT: Slot[] = [
  { id: "lun-18", giorno: "lunedi", fascia: "18:00 – 20:00" },
  { id: "lun-20", giorno: "lunedi", fascia: "20:00 – 22:00" },
  { id: "gio-18", giorno: "giovedi", fascia: "18:00 – 20:00" },
  { id: "gio-20", giorno: "giovedi", fascia: "20:00 – 22:00" },
];

const ETICHETTA_GIORNO: Record<Giorno, string> = { lunedi: "Lunedi", giovedi: "Giovedi" };

/** Prossima occorrenza di quel giorno della settimana, mai oggi: se e oggi, la cottura e gia partita. */
function prossimeDate(): Partial<Record<Giorno, string>> {
  const prossima = (giornoSettimana: number) => {
    const d = new Date();
    d.setDate(d.getDate() + ((giornoSettimana - d.getDay() + 7) % 7 || 7));
    return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
  };
  return { lunedi: prossima(1), giovedi: prossima(4) };
}

/* ------------------------------------------------------------- le foto */

/**
 * Le uniche foto della pagina sono piatti del catalogo: nessun id sciolto, cosi'
 * una foto non puo' restare appesa a un'immagine che il menu non serve piu'.
 * getDish puo' tornare undefined (l'id potrebbe sparire dal catalogo): il render
 * e' condizionato, niente asserzioni.
 */
const FOTO_TESTATA = getDish("pollo-basmati-broccoli");
const FOTO_VUOTO = getDish("salmone-quinoa-verdure");

/* -------------------------------------------------------- l'ordine finto */

interface Riga {
  dish: Dish;
  qta: number;
}

interface Ordine {
  numero: string;
  righe: Riga[];
  pasti: number;
  formula: Formula;
  conto: Preventivo;
  slot: Slot;
  consegnatario: string;
  indirizzo: string;
  email: string;
  note: string;
}

/**
 * Inclinazione e riempimento stanno NELLA riga, non in un array parallelo indicizzato
 * per posizione: aggiungere un passo non puo' piu' produrre una classe `undefined`.
 * Il primo passo e' un blocco lime pieno — e' quello che sta succedendo adesso, e
 * tre schede identiche in fila sarebbero un elenco, non un poster.
 */
const PASSI: { titolo: string; testo: string; incl: string; pieno?: boolean }[] = [
  {
    titolo: "Adesso",
    testo:
      "Parte la mail di riepilogo con piatti, macro e slot scelto. In questa demo non parte davvero: non c'e nessun server dall'altra parte.",
    incl: "md:rotate-[-1.4deg]",
    pieno: true,
  },
  {
    titolo: "La sera prima",
    testo:
      "Matteo scrive su WhatsApp l'ora esatta del passaggio. La spesa la fa il mattino della cottura, quindi fino a quel momento un piatto si puo ancora cambiare.",
    incl: "md:translate-y-4 md:rotate-[2.1deg]",
  },
  {
    titolo: "Il giorno della consegna",
    testo:
      "Il box arriva nella fascia che hai scelto, freddo di frigo e mai surgelato. I contenitori vuoti li ritiriamo alla consegna successiva.",
    incl: "md:rotate-[-1.6deg]",
  },
];

function elenco(voci: string[]): string {
  if (voci.length <= 1) return voci[0] ?? "";
  return `${voci.slice(0, -1).join(", ")} e ${voci[voci.length - 1]}`;
}

/* =========================================================================
   pezzi di pagina
   ========================================================================= */

function Campo({
  id,
  etichetta,
  valore,
  onChange,
  onBlur,
  errore,
  aiuto,
  tipo = "text",
  autoComplete,
  placeholder,
  inputMode,
  maxLength,
  className = "",
}: {
  id: ChiaveModulo;
  etichetta: string;
  valore: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  errore?: string;
  aiuto?: string;
  tipo?: string;
  autoComplete?: string;
  placeholder?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  maxLength?: number;
  className?: string;
}) {
  const idCampo = `consegna-${id}`;
  const idErr = `${idCampo}-errore`;
  const idAiuto = `${idCampo}-aiuto`;
  const descritto = [errore ? idErr : "", aiuto ? idAiuto : ""].filter(Boolean).join(" ");

  return (
    <div className={className}>
      <label htmlFor={idCampo} className="note mb-[9px] block">
        {etichetta}
      </label>
      <input
        id={idCampo}
        name={id}
        type={tipo}
        value={valore}
        onChange={(ev) => onChange(ev.target.value)}
        onBlur={onBlur}
        className={`field ${errore ? "field-err" : ""}`}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-invalid={errore ? true : undefined}
        aria-describedby={descritto || undefined}
      />
      {aiuto ? (
        <p id={idAiuto} className="mt-[9px] text-[12.5px] leading-relaxed text-muted">
          {aiuto}
        </p>
      ) : null}
      {errore ? (
        <p
          id={idErr}
          className="mt-[9px] text-[12.5px] leading-relaxed"
          style={{ color: "#ff9d9d" }}
        >
          {errore}
        </p>
      ) : null}
    </div>
  );
}

function SlotGriglia({
  scelto,
  onScegli,
  date,
}: {
  scelto: string | null;
  onScegli: (id: string) => void;
  date: Partial<Record<Giorno, string>>;
}) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="sr-only">Scegli giorno e fascia oraria della consegna</legend>
      <div className="grid gap-[14px] sm:grid-cols-2">
        {SLOT.map((s, i) => {
          const sel = scelto === s.id;
          // La card si raddrizza quando viene scelta: l'inclinazione e rumore da
          // poster, e sopra un blocco lime pieno diventerebbe solo rumore.
          const inclina = sel ? "" : i % 2 === 0 ? "md:rotate-[-1.2deg]" : "md:rotate-[1.6deg]";
          return (
            <label
              key={s.id}
              className={`block cursor-pointer transition-transform duration-700 hover:-translate-y-1 ${inclina}`}
              style={{ transitionTimingFunction: "var(--e-over)" }}
            >
              <input
                type="radio"
                name="slot"
                value={s.id}
                checked={sel}
                onChange={() => onScegli(s.id)}
                className="peer sr-only"
              />
              <span
                className="block rounded-[var(--core-r)] border p-[20px] peer-focus-visible:[outline:2px_solid_var(--color-lime)] peer-focus-visible:[outline-offset:3px]"
                style={{
                  background: sel ? "var(--color-lime)" : "rgba(201,224,205,.045)",
                  borderColor: sel ? "transparent" : "var(--hair-soft)",
                  boxShadow: sel ? "0 22px 44px -24px rgba(223,255,62,.45)" : "none",
                  // Il colore del testo si EREDITA da qui e viaggia sulla stessa
                  // transizione del fondo: scritto sui figli, l'inchiostro scattava
                  // subito e restava mezzo secondo nero su fondo ancora scuro.
                  // `transition-colors` di Tailwind, inoltre, non copre box-shadow.
                  color: sel ? "var(--color-ink)" : "#fff",
                  transition:
                    "background-color .5s var(--e-out), border-color .5s var(--e-out), color .5s var(--e-out), box-shadow .5s var(--e-out)",
                }}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="font-disp text-[27px] leading-none uppercase">
                    {ETICHETTA_GIORNO[s.giorno]}
                  </span>
                  <span
                    aria-hidden="true"
                    className="mt-1 block h-[11px] w-[11px] flex-none"
                    style={{
                      transform: `rotate(45deg) scale(${sel ? 1 : 0.55})`,
                      background: sel ? "currentColor" : "var(--hair)",
                      transition:
                        "transform .5s var(--e-over), background-color .5s var(--e-out)",
                    }}
                  />
                </span>
                <span
                  className="mt-[13px] block font-mono text-[14px]"
                  style={{ fontVariationSettings: '"wdth" 84' }}
                >
                  {s.fascia}
                </span>
                {date[s.giorno] ? (
                  <span
                    className="note mt-[9px] block"
                    style={{
                      color: sel ? "rgba(6,23,16,.62)" : "var(--color-mist-dim)",
                      transition: "color .5s var(--e-out)",
                    }}
                  >
                    prossimo {date[s.giorno]}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function RigaConto({
  etichetta,
  valore,
  accento = false,
}: {
  etichetta: string;
  valore: string;
  accento?: boolean;
}) {
  return (
    <div className="mb-[10px] flex items-baseline justify-between gap-4 last:mb-0">
      <span className="text-[13px] text-muted">{etichetta}</span>
      <span
        className={`font-mono text-[13px] whitespace-nowrap ${accento ? "text-ink" : "text-ink"}`}
        style={{ fontVariationSettings: '"wdth" 84' }}
      >
        {valore}
      </span>
    </div>
  );
}

function Riepilogo({
  righe,
  pasti,
  formula,
  conto,
  titolo,
}: {
  righe: Riga[];
  pasti: number;
  formula: Formula;
  conto: Preventivo;
  titolo: string;
}) {
  return (
    <div className="shell">
      <div className="core p-[24px] md:p-[26px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="eyebrow">
            <b aria-hidden="true" />
            {titolo}
          </h2>
          <Chip accento>{pasti} pasti</Chip>
        </div>

        <ul className="mt-[22px] flex flex-col gap-[14px]">
          {righe.map(({ dish, qta }) => (
            <li key={dish.id} className="flex items-center gap-[13px]">
              <figure className="h-[46px] w-[46px] flex-none overflow-hidden rounded-[14px] bg-tray">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dishImg(dish, 120)}
                  alt={dish.nome}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </figure>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] leading-tight text-ink">{dish.nome}</p>
                <p className="note mt-[6px]" style={{ fontSize: 10 }}>
                  {dish.giorno === "lunedi" ? "cotto lun" : "cotto gio"} / {dish.kcal} kcal
                </p>
              </div>
              <span
                className="font-mono text-[12.5px] text-ink"
                style={{ fontVariationSettings: '"wdth" 84' }}
              >
                &times;{qta}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-[22px] border-t pt-[18px]" style={{ borderColor: "var(--hair-soft)" }}>
          <RigaConto
            etichetta={`${conto.pasti} pasti × ${euro(conto.prezzoPasto)}`}
            valore={euro(conto.subtotale)}
          />
          {conto.scontoVolume > 0 ? (
            <RigaConto etichetta={`Sconto taglia -${conto.scontoVolume}%`} valore="gia incluso" />
          ) : null}
          {conto.scontoAbbonamento > 0 ? (
            <RigaConto
              etichetta="Sconto abbonamento -15%"
              valore={`- ${euro(conto.scontoAbbonamento)}`}
              accento
            />
          ) : null}
          <RigaConto
            etichetta="Consegna a domicilio"
            valore={conto.consegna === 0 ? "gratis" : euro(conto.consegna)}
          />
        </div>

        <div
          className="mt-[16px] flex items-end justify-between gap-4 border-t pt-[16px]"
          style={{ borderColor: "var(--hair)" }}
        >
          <span className="bar-l">Totale</span>
          <span
            className="font-mono text-[23px] leading-none text-ink"
            style={{ fontVariationSettings: '"wdth" 84' }}
          >
            {euro(conto.totale)}
          </span>
        </div>

        {conto.risparmio > 0 ? (
          <p className="mt-[15px]">
            <Chip accento>Risparmi {euro(conto.risparmio)}</Chip>
          </p>
        ) : null}

        <p className="mt-[15px] text-[12.5px] leading-relaxed text-muted">
          {formula === "abbonamento"
            ? "Abbonamento: il box si rinnova ogni settimana allo stesso prezzo, con il menu aggiornato. Si disdice quando vuoi dal riepilogo che ti arriva per mail, senza vincoli e senza penali."
            : "Ordine singolo: paghi questo box e basta, nessun rinnovo automatico."}
        </p>
      </div>
    </div>
  );
}

/** Scheletro mostrato finche il carrello non e stato riletto da localStorage. */
function Scheletro() {
  return (
    <section className="pb-[140px]">
      <div className="wrap">
        <p className="sr-only" role="status">
          Sto rileggendo il tuo box.
        </p>
        <div
          aria-hidden="true"
          className="grid items-start gap-[34px] lg:grid-cols-[1fr_388px] lg:gap-[42px]"
        >
          {[0, 1].map((colonna) => (
            <div key={colonna} className="shell">
              <div className="core relative overflow-hidden p-[30px]">
                {[92, 68, 80, 54].map((w, i) => (
                  <span
                    key={i}
                    className="mb-[18px] block h-[13px] rounded-full last:mb-0"
                    style={{ width: `${w}%`, background: "rgba(201,224,205,.08)" }}
                  />
                ))}
                <span
                  className="pointer-events-none absolute inset-x-0 top-0 h-[38%]"
                  style={{
                    background:
                      "linear-gradient(180deg,transparent,rgba(223,255,62,.09),transparent)",
                    animation: "fuel-scan 2s var(--e-out) infinite",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Arrivare al checkout con il box vuoto e un vicolo cieco: qui c'e l'uscita. */
function Vuoto() {
  return (
    <section className="pb-[150px]">
      <div className="wrap">
        <Reveal>
          <div className="shell mx-auto max-w-[880px]">
            <div className="core grid md:grid-cols-2">
              <div className="p-[32px] md:p-[42px]">
                <h2 className="h2">Il box e vuoto.</h2>
                <p className="mt-5 text-[15px] leading-relaxed text-muted">
                  {"Non c'e niente da consegnare: prima scegli le schiscette, poi torniamo qui a prenderti l'indirizzo. Ci vogliono due minuti."}
                </p>
                <div className="mt-9 flex flex-wrap gap-3">
                  <Link href="/menu" className="btn btn-p">
                    Vai al menu
                    <span className="dot" aria-hidden="true">
                      &rarr;
                    </span>
                  </Link>
                  <Link href="/box" className="btn btn-s">
                    Componi il box
                    <span className="dot" aria-hidden="true">
                      &#8599;
                    </span>
                  </Link>
                </div>
              </div>
              {FOTO_VUOTO ? (
                <figure className="min-h-[240px] bg-tray max-md:order-first">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dishImg(FOTO_VUOTO, 800)}
                    alt={`${FOTO_VUOTO.nome}, una delle schiscette in menu questa settimana`}
                    loading="lazy"
                    className="h-full min-h-[240px] w-full object-cover"
                  />
                </figure>
              ) : null}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Successo({ ordine }: { ordine: Ordine }) {
  return (
    <>
      <section className="pb-[110px]">
        <div className="wrap grid items-start gap-[34px] lg:grid-cols-[1fr_388px] lg:gap-[42px]">
          <div>
            <Reveal>
              <div className="shell">
                <div className="core flex flex-wrap items-end justify-between gap-7 p-[28px] md:p-[32px]">
                  <div>
                    <p className="note">{"Numero d'ordine"}</p>
                    <p
                      className="mt-[11px] font-mono text-[27px] leading-none text-ink md:text-[32px]"
                      style={{ fontVariationSettings: '"wdth" 84' }}
                    >
                      {ordine.numero}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="note">Consegna</p>
                    <p className="mt-[9px] font-disp text-[27px] leading-none text-ink uppercase">
                      {ETICHETTA_GIORNO[ordine.slot.giorno]}
                    </p>
                    <p
                      className="mt-[6px] font-mono text-[13px] text-muted"
                      style={{ fontVariationSettings: '"wdth" 84' }}
                    >
                      {ordine.slot.fascia}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={90}>
              <div className="shell mt-[18px]">
                <div className="core grid gap-7 p-[28px] sm:grid-cols-2 md:p-[32px]">
                  <div>
                    <p className="note">Consegniamo a</p>
                    <p className="mt-[10px] text-[15px] leading-tight text-ink">
                      {ordine.consegnatario}
                    </p>
                    <p className="mt-[5px] text-[14px] leading-relaxed text-muted">
                      {ordine.indirizzo}
                    </p>
                  </div>
                  <div>
                    <p className="note">Riepilogo via mail</p>
                    <p className="mt-[10px] text-[15px] leading-tight break-all text-ink">
                      {ordine.email}
                    </p>
                    <p className="mt-[5px] text-[13px] leading-relaxed text-muted">
                      Nella demo non parte nessuna mail: non esiste un server a cui mandarla.
                    </p>
                  </div>
                  {/* Le note le chiediamo nel modulo: rimandarle indietro e' il solo modo
                      che ha chi ordina di verificare che siano arrivate come le ha scritte. */}
                  {ordine.note ? (
                    <div className="sm:col-span-2">
                      <p className="note">Note per chi consegna</p>
                      <p className="mt-[10px] text-[14px] leading-relaxed text-ink">
                        {ordine.note}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </Reveal>

            <h2 className="eyebrow mt-[46px] mb-[26px]">
              <b aria-hidden="true" />
              Cosa succede adesso
            </h2>

            <div className="grid gap-[18px] md:grid-cols-3">
              {PASSI.map((p, i) => (
                <Reveal key={p.titolo} delay={i * 110} className="h-full">
                  {/* La rotazione sta sul nodo interno: .reveal.in azzera il transform
                      del proprio elemento e cancellerebbe l'inclinazione. */}
                  <div className={`shell h-full ${p.incl}`}>
                    <div className={`core h-full p-[24px] ${p.pieno ? "bg-lime" : ""}`}>
                      <span
                        className="font-disp block text-[44px] leading-none"
                        style={{ color: p.pieno ? "var(--color-ink)" : "var(--color-lime)" }}
                      >
                        {i + 1}
                      </span>
                      <h3
                        className="h3 mt-[10px]"
                        style={{ fontSize: 21, color: p.pieno ? "var(--color-ink)" : "#fff" }}
                      >
                        {p.titolo}
                      </h3>
                      <p
                        className="mt-3 text-[13.5px] leading-relaxed"
                        style={{ color: p.pieno ? "rgba(6,23,16,.72)" : "var(--color-mist-dim)" }}
                      >
                        {p.testo}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <aside>
            <Riepilogo
              righe={ordine.righe}
              pasti={ordine.pasti}
              formula={ordine.formula}
              conto={ordine.conto}
              titolo="Ordine confermato"
            />
          </aside>
        </div>
      </section>

      <Ticker parole={["Ordine ricevuto", "Demo", "Zero euro", "Fuel"]} durata={30} />

      <section className="py-[110px] md:py-[130px]">
        <div className="wrap max-w-[720px] text-center">
          <h2 className="h2">Era una demo.</h2>
          <p className="lead mx-auto mt-6">
            {"Nessun pagamento e stato richiesto, nessun ordine e stato registrato e i dati che hai scritto sono rimasti nel tuo browser. Il box e stato svuotato: quando vuoi ricominci da capo."}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/menu" className="btn btn-p">
              Torna al menu
              <span className="dot" aria-hidden="true">
                &rarr;
              </span>
            </Link>
            <Link href="/" className="btn btn-s">
              Home
              <span className="dot" aria-hidden="true">
                &#8599;
              </span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

/* =========================================================================
   pagina
   ========================================================================= */

export default function CheckoutClient() {
  const { pasti, piatti, conto, formula, svuota, pronto } = useCart();

  const [modulo, setModulo] = useState<Modulo>(MODULO_VUOTO);
  const [toccati, setToccati] = useState<Partial<Record<ChiaveModulo, boolean>>>({});
  const [slotScelto, setSlotScelto] = useState<string | null>(null);
  const [avvisato, setAvvisato] = useState(false);
  const [ordine, setOrdine] = useState<Ordine | null>(null);

  // Le date dipendono dall'orologio di chi guarda: calcolate in SSR darebbero un
  // testo diverso da quello del client. `pronto` e' gia' il segnale giusto — e'
  // false sul server E al primo render del client, e diventa true solo dopo che
  // il carrello e' stato riletto: nessun secondo meccanismo da tenere allineato.
  const date = useMemo(() => (pronto ? prossimeDate() : {}), [pronto]);

  const righe = useMemo<Riga[]>(() => {
    const m = new Map<string, Riga>();
    for (const d of piatti) {
      const r = m.get(d.id);
      if (r) r.qta += 1;
      else m.set(d.id, { dish: d, qta: 1 });
    }
    return Array.from(m.values());
  }, [piatti]);

  const errori = useMemo(() => valida(modulo), [modulo]);
  const zona = zonaCap(modulo.cap);
  const emailBuona = RE_EMAIL.test(modulo.email.trim());

  const valido =
    Object.keys(errori).length === 0 &&
    (zona === "citta" || zona === "provincia") &&
    slotScelto !== null;

  const mancano = useMemo(() => {
    const v: string[] = [];
    if (errori.nome) v.push("nome e cognome");
    if (errori.email) v.push("email");
    if (errori.telefono) v.push("telefono");
    if (errori.indirizzo) v.push("indirizzo");
    if (errori.citta) v.push("comune");
    if (errori.cap) v.push("CAP");
    else if (zona === "fuori") v.push("un indirizzo dentro la zona servita");
    if (!slotScelto) v.push("lo slot di consegna");
    return v;
  }, [errori, zona, slotScelto]);

  const iniziato = Object.keys(toccati).length > 0 || slotScelto !== null;

  function aggiorna(k: ChiaveModulo, v: string) {
    // Il CAP accetta solo cifre: cosi "formato sbagliato" resta un caso vero
    // (quattro cifre) e non il refuso di chi ha battuto una lettera.
    const pulito = k === "cap" ? v.replace(/\D/g, "").slice(0, 5) : v;
    setModulo((m) => ({ ...m, [k]: pulito }));
    if (k === "cap" || k === "email") setAvvisato(false);
  }

  function segnaToccato(k: ChiaveModulo) {
    setToccati((t) => ({ ...t, [k]: true }));
  }

  /** L'errore compare solo dopo che il campo e stato lasciato, mai mentre si scrive. */
  function mostra(k: ChiaveModulo): string | undefined {
    return toccati[k] ? errori[k] : undefined;
  }

  function conferma() {
    const slot = SLOT.find((s) => s.id === slotScelto);
    if (!valido || !slot) return;

    const d = new Date();
    const numero = `FUEL-${String(d.getDate()).padStart(2, "0")}${String(
      d.getMonth() + 1,
    ).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Fotografo il box PRIMA di svuotarlo: la schermata di conferma deve
    // continuare a raccontare l'ordine anche quando il carrello non esiste piu.
    setOrdine({
      numero,
      righe,
      pasti,
      formula,
      conto,
      slot,
      consegnatario: modulo.nome.trim(),
      indirizzo: `${modulo.indirizzo.trim()}, ${modulo.cap} ${modulo.citta.trim()}`,
      email: modulo.email.trim(),
      note: modulo.note.trim(),
    });
    svuota();
    // Senza "behavior" lo scatto segue lo scroll-behavior del CSS, che sotto
    // prefers-reduced-motion torna istantaneo.
    window.scrollTo({ top: 0 });
  }

  const successo = ordine !== null;

  return (
    <>
      {/* ---------------------------------------------------------- testata */}
      <section className="pt-[150px] pb-[54px] md:pt-[176px] md:pb-[68px]">
        <div className="wrap">
          <div className="grid items-end gap-10 md:grid-cols-[1fr_286px]">
            <div>
              <Eyebrow className="mb-[26px]">
                {successo ? "Demo confermata" : "Ultimo passo"}
              </Eyebrow>
              <h1 className="h1">
                {successo ? (
                  <>
                    <Rise i={0}>Ordine</Rise>
                    <Rise i={1}>
                      <span className="hl">in cucina.</span>
                    </Rise>
                  </>
                ) : (
                  <>
                    <Rise i={0}>Dove ti</Rise>
                    <Rise i={1}>
                      portiamo <span className="hl">il box.</span>
                    </Rise>
                  </>
                )}
              </h1>
              <p className="lead mt-7">
                {successo
                  ? "Il box e in lista per il prossimo giro. Qui sotto trovi tutto quello che succede da adesso alla consegna."
                  : "Ci vediamo sotto casa il lunedi o il giovedi sera. Tre minuti di dati, uno slot da scegliere, e la schiscetta parte con il primo furgone utile."}
              </p>
            </div>

            {/* Foto ruotata che sborda dalla colonna: la griglia si rompe qui. */}
            {FOTO_TESTATA ? (
              <figure className="shell hidden md:block md:translate-x-[26px] md:rotate-[-2.4deg]">
                <div className="core aspect-[4/3.3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dishImg(FOTO_TESTATA, 700)}
                    alt={`${FOTO_TESTATA.nome}, porzionato nella vaschetta del box`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              </figure>
            ) : null}
          </div>

          <div
            className="mt-[42px] flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[var(--shell)] border px-[22px] py-[16px]"
            style={{ borderColor: "var(--hair)", background: "rgba(223,255,62,.055)" }}
          >
            <span className="note" style={{ color: "var(--color-lime)" }}>
              Demo
            </span>
            <p className="max-w-[780px] text-[13.5px] leading-relaxed text-ink">
              {"Questo checkout e una dimostrazione: non viene chiesto nessun pagamento, non viene registrato nessun ordine e i dati che scrivi restano nel tuo browser."}
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- corpo, per stato */}
      {ordine ? (
        <Successo ordine={ordine} />
      ) : !pronto ? (
        <Scheletro />
      ) : pasti === 0 ? (
        <Vuoto />
      ) : (
        <section className="pb-[130px] md:pb-[150px]">
          <form
            className="wrap grid items-start gap-[34px] lg:grid-cols-[1fr_388px] lg:gap-[42px]"
            onSubmit={(ev) => {
              ev.preventDefault();
              conferma();
            }}
            noValidate
          >
            <div className="flex flex-col gap-[22px]">
              {/* ----------------------------------------- dati di consegna */}
              <Reveal>
                <div className="shell">
                  <div className="core p-[24px] md:p-[32px]">
                    <h2 className="eyebrow mb-[26px]">
                      <b aria-hidden="true" />
                      Dati di consegna
                    </h2>

                    <div className="grid gap-[18px] sm:grid-cols-2">
                      <Campo
                        id="nome"
                        etichetta="Nome e cognome"
                        valore={modulo.nome}
                        onChange={(v) => aggiorna("nome", v)}
                        onBlur={() => segnaToccato("nome")}
                        errore={mostra("nome")}
                        autoComplete="name"
                        placeholder="Giulia Di Marco"
                        className="sm:col-span-2"
                      />
                      <Campo
                        id="email"
                        etichetta="Email"
                        tipo="email"
                        inputMode="email"
                        valore={modulo.email}
                        onChange={(v) => aggiorna("email", v)}
                        onBlur={() => segnaToccato("email")}
                        errore={mostra("email")}
                        autoComplete="email"
                        placeholder="giulia@esempio.it"
                      />
                      <Campo
                        id="telefono"
                        etichetta="Telefono"
                        tipo="tel"
                        inputMode="tel"
                        valore={modulo.telefono}
                        onChange={(v) => aggiorna("telefono", v)}
                        onBlur={() => segnaToccato("telefono")}
                        errore={mostra("telefono")}
                        autoComplete="tel"
                        placeholder="333 123 4567"
                      />
                      <Campo
                        id="indirizzo"
                        etichetta="Indirizzo e numero civico"
                        valore={modulo.indirizzo}
                        onChange={(v) => aggiorna("indirizzo", v)}
                        onBlur={() => segnaToccato("indirizzo")}
                        errore={mostra("indirizzo")}
                        autoComplete="street-address"
                        placeholder="Via Nicola Fabrizi 12"
                        className="sm:col-span-2"
                      />
                      <Campo
                        id="citta"
                        etichetta="Comune"
                        valore={modulo.citta}
                        onChange={(v) => aggiorna("citta", v)}
                        onBlur={() => segnaToccato("citta")}
                        errore={mostra("citta")}
                        autoComplete="address-level2"
                        placeholder="Pescara"
                      />
                      <Campo
                        id="cap"
                        etichetta="CAP"
                        valore={modulo.cap}
                        onChange={(v) => aggiorna("cap", v)}
                        onBlur={() => segnaToccato("cap")}
                        errore={mostra("cap")}
                        inputMode="numeric"
                        maxLength={5}
                        autoComplete="postal-code"
                        placeholder="65121"
                        aiuto="Consegniamo a Pescara citta (65121-65129) e in provincia (65010-65020 e 65100-65199)."
                      />
                    </div>

                    {zona === "citta" || zona === "provincia" ? (
                      <p className="note mt-[18px]" style={{ color: "var(--color-lime)" }}>
                        In zona / {zona === "citta" ? "Pescara citta" : "provincia di Pescara"} /
                        consegna a mano
                      </p>
                    ) : null}

                    {/* Fuori zona non e un errore di chi compila: e un limite del
                        furgone. Il blocco lo dice e lascia una porta aperta. */}
                    {zona === "fuori" ? (
                      <div
                        className="mt-[20px] rounded-[var(--core-r)] border p-[22px]"
                        style={{ borderColor: "var(--hair)", background: "rgba(223,255,62,.06)" }}
                      >
                        <h3 className="h3" style={{ fontSize: 23 }}>
                          Qui non arriviamo. Ancora.
                        </h3>
                        <p className="mt-3 text-[14px] leading-relaxed text-ink">
                          {`Il furgone copre Pescara e provincia, e il ${modulo.cap} resta fuori dal giro del lunedi e del giovedi. Non e un errore tuo: e un limite nostro, e stiamo allargando il raggio una zona alla volta.`}
                        </p>

                        {avvisato ? (
                          <p className="note mt-[18px]" style={{ color: "var(--color-lime)" }}>
                            Segnato / ti scriviamo a {modulo.email.trim()} / anche questo, ovviamente,
                            e finto
                          </p>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn btn-s btn-sm mt-[18px]"
                              onClick={() => setAvvisato(true)}
                              disabled={!emailBuona}
                            >
                              Avvisami quando arriviamo
                              <span className="dot" aria-hidden="true">
                                &rarr;
                              </span>
                            </button>
                            {!emailBuona ? (
                              <p className="mt-[11px] text-[12.5px] leading-relaxed text-muted">
                                Scrivi prima la tua mail qui sopra: la usiamo solo per avvisarti
                                quando Fuel arriva dalle tue parti.
                              </p>
                            ) : null}
                          </>
                        )}
                      </div>
                    ) : null}

                    <div className="mt-[20px]">
                      <label htmlFor="consegna-note" className="note mb-[9px] block">
                        Note per chi consegna (facoltativo)
                      </label>
                      <textarea
                        id="consegna-note"
                        name="note"
                        value={modulo.note}
                        onChange={(ev) => aggiorna("note", ev.target.value)}
                        className="field"
                        style={{ borderRadius: 18, minHeight: 92, resize: "vertical" }}
                        placeholder="Citofono a destra, terzo piano senza ascensore"
                        maxLength={240}
                      />
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* --------------------------------------- slot di consegna */}
              <Reveal delay={90}>
                <div className="shell">
                  <div className="core p-[24px] md:p-[32px]">
                    <h2 className="eyebrow mb-[22px]">
                      <b aria-hidden="true" />
                      Slot di consegna
                    </h2>
                    <p className="mb-[24px] max-w-[560px] text-[14px] leading-relaxed text-muted">
                      {"Matteo cucina il lunedi e il giovedi mattina, e il furgone parte nel pomeriggio dello stesso giorno. Gli slot sono due sere a settimana per questo motivo: fra la padella e il tuo frigo passano meno di dodici ore."}
                    </p>

                    <SlotGriglia scelto={slotScelto} onScegli={setSlotScelto} date={date} />

                    <p className="note mt-[22px]">
                      Fasce di due ore / consegna a mano / contenitori vuoti ritirati al giro dopo
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* ------------------------------------------------- riepilogo */}
            <aside className="lg:sticky lg:top-[112px]">
              <Riepilogo
                righe={righe}
                pasti={pasti}
                formula={formula}
                conto={conto}
                titolo="Il tuo box"
              />

              <div className="mt-[18px]">
                <button
                  type="submit"
                  className="btn btn-p w-full justify-between"
                  disabled={!valido}
                  aria-describedby="stato-modulo"
                >
                  {"Conferma l'ordine"}
                  <span className="dot" aria-hidden="true">
                    &rarr;
                  </span>
                </button>

                <p
                  id="stato-modulo"
                  role="status"
                  aria-live="polite"
                  className="mt-[14px] text-[12.5px] leading-relaxed text-muted"
                >
                  {valido
                    ? "Tutto a posto. Alla conferma non paghi niente: vedi solo il riepilogo della demo."
                    : iniziato
                      ? `Manca ancora ${elenco(mancano)}.`
                      : "Compila i dati e scegli lo slot: il bottone si accende da solo."}
                </p>
              </div>
            </aside>
          </form>
        </section>
      )}
    </>
  );
}
