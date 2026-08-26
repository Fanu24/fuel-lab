"use client";

import Link from "next/link";
import { Fragment, useMemo, useState, type ReactNode } from "react";
import DishCard from "@/components/DishCard";
import Reveal from "@/components/Reveal";
import Ticker from "@/components/Ticker";
import { Chip, Eyebrow, Rise } from "@/components/ui";
import { useCart } from "@/lib/cart";
import { DISHES, dishImg } from "@/lib/dishes";
import { euro } from "@/lib/pricing";
import { OBIETTIVI, TAGS, type Dish, type Giorno, type Obiettivo, type Tag } from "@/lib/types";

type FiltroObiettivo = Obiettivo | "tutti";
type FiltroGiorno = Giorno | "tutti";
type Ordine = "consigliati" | "proteine" | "kcal-su" | "kcal-giu";

const GIORNI: { id: FiltroGiorno; label: string }[] = [
  { id: "tutti", label: "Tutti" },
  { id: "lunedi", label: "Lunedi" },
  { id: "giovedi", label: "Giovedi" },
];

const ORDINI: { id: Ordine; label: string }[] = [
  { id: "consigliati", label: "Consigliati" },
  { id: "proteine", label: "Piu proteine" },
  { id: "kcal-su", label: "Meno calorie" },
  { id: "kcal-giu", label: "Piu calorie" },
];

const RITMO = ["Cotto il lunedi", "Consegnato il martedi", "Cotto il giovedi", "Consegnato il venerdi"];

/**
 * Cadenza della vetrina: una scheda larga ogni CICLO, in testa al ciclo.
 *
 * Il numero non e' arbitrario. Una vetrina larga 2 piu' quattro schede normali fanno
 * SEI celle: sei e' divisibile sia per 2 (md) sia per 3 (xl), quindi il ciclo si
 * richiude sempre a fine riga e la vetrina cade sempre in colonna 1. Con il ciclo di
 * sei schede della versione precedente le celle per ciclo erano sette: dispari, quindi
 * la vetrina non entrava piu' nella riga in corso e il grid la spingeva a capo
 * lasciando una CELLA VUOTA in mezzo al catalogo. Sembrava un piatto mancante.
 */
const CICLO = 5;

/**
 * Inclinazioni della griglia, per posizione nel ciclo.
 * La posizione 0 e' la vetrina e resta dritta: larga due colonne, ruotata, toccherebbe
 * le vicine. Solo da xl in su: con due colonne la rotazione si mangia il gutter.
 */
const INCLINA = ["", "xl:rotate-[1.1deg]", "", "xl:rotate-[-1.2deg]", ""];

/**
 * La foto della testata e' un piatto vero del catalogo, non uno stock generico:
 * la pagina promette "quello che leggi qui e' quello che trovi nel box" e non puo'
 * aprirsi con una foto che nel box non c'e'. Tipizzata come opzionale di proposito,
 * cosi' una settimana senza catalogo non manda in errore la testata.
 */
const COPERTINA: Dish | undefined =
  DISHES.find((d) => d.id === "pollo-basmati-broccoli") ?? DISHES[0];

/* ------------------------------------------------------------------ filtri */

function Pill({
  attivo,
  onClick,
  multi = false,
  children,
}: {
  attivo: boolean;
  onClick: () => void;
  /** i tag sono a interruttore: il rombo dice "ne puoi accendere piu di uno" */
  multi?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={attivo}
      data-on={attivo ? "true" : "false"}
      style={{ fontVariationSettings: '"wdth" 110, "wght" 700' }}
      className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-[color:var(--hair-soft)] bg-[rgba(201,224,205,.045)] px-[15px] py-[7px] text-[11px] tracking-[.1em] whitespace-nowrap text-mist uppercase transition-[color,background-color,border-color,transform] duration-400 ease-[var(--e-out)] hover:border-[color:var(--hair)] hover:bg-[rgba(223,255,62,.11)] hover:text-white active:scale-[.96] data-[on=true]:border-transparent data-[on=true]:bg-lime data-[on=true]:text-ink data-[on=true]:hover:bg-white data-[on=true]:hover:text-ink"
    >
      {/* Il rombo ha una transizione PROPRIA: transition-timing-function non si eredita,
          quindi senza questa easing esplicita il quadratino tornava alla curva di default
          di Tailwind mentre la pill sotto viaggiava su --e-out. Si vedeva. */}
      {multi ? (
        <i
          aria-hidden="true"
          className="h-[7px] w-[7px] rotate-45 border border-current transition-colors duration-400 ease-[var(--e-out)] group-data-[on=true]:bg-current"
        />
      ) : null}
      {children}
    </button>
  );
}

function Gruppo({ etichetta, children }: { etichetta: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={etichetta} className="flex items-center gap-3">
      {/* aria-hidden: il gruppo porta gia' questo stesso testo come aria-label, senza
          la marcatura uno screen reader leggerebbe "Obiettivo" due volte di fila. */}
      <span aria-hidden="true" className="note shrink-0 text-[9.5px]">
        {etichetta}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

function Separatore() {
  return <span aria-hidden="true" className="hidden h-6 w-px bg-[var(--hair-soft)] xl:block" />;
}

/** Il numero deve coincidere sempre con le schede a video: e' l'unica prova che i filtri funzionano. */
function Contatore({ n, className = "" }: { n: number; className?: string }) {
  return (
    <p
      aria-live="polite"
      style={{ fontVariationSettings: '"wdth" 84' }}
      className={`font-mono text-[10.5px] tracking-[.14em] whitespace-nowrap text-mist-dim uppercase ${className}`}
    >
      <b className="text-[15px] font-normal text-lime">{n}</b> piatti su {DISHES.length}
    </p>
  );
}

/* ------------------------------------------------------------------ pagina */

export default function MenuClient() {
  const [obiettivo, setObiettivo] = useState<FiltroObiettivo>("tutti");
  const [giorno, setGiorno] = useState<FiltroGiorno>("tutti");
  const [tag, setTag] = useState<Tag[]>([]);
  const [ordine, setOrdine] = useState<Ordine>("consigliati");
  const [pannello, setPannello] = useState(false);
  const { pasti, conto, pronto } = useCart();

  const visibili = useMemo(() => {
    // AND fra le categorie, OR dentro i tag: chi accende Carne e Pesce vuole vedere
    // entrambi, non l'insieme vuoto dei piatti che sono carne E pesce insieme.
    const scelti = DISHES.filter(
      (d) =>
        (obiettivo === "tutti" || d.obiettivo.includes(obiettivo)) &&
        (giorno === "tutti" || d.giorno === giorno) &&
        (tag.length === 0 || tag.some((t) => d.tag.includes(t))),
    );
    if (ordine === "consigliati") return scelti;

    const ordinati = scelti.slice(); // mai in place: DISHES e' condiviso con tutto il sito
    ordinati.sort((a, b) => {
      // Il secondo criterio non e' decorativo: fra due piatti da 52 g di proteine
      // chi sta in definizione vuole vedere prima quello che costa meno calorie.
      if (ordine === "proteine") return b.proteine - a.proteine || a.kcal - b.kcal;
      if (ordine === "kcal-su") return a.kcal - b.kcal || b.proteine - a.proteine;
      return b.kcal - a.kcal || b.proteine - a.proteine;
    });
    return ordinati;
  }, [obiettivo, giorno, tag, ordine]);

  // L'ordinamento conta come filtro attivo: se ho spostato qualcosa, "Azzera" deve
  // riportarmi al catalogo com'era, non a meta strada.
  const attivi =
    (obiettivo !== "tutti" ? 1 : 0) +
    (giorno !== "tutti" ? 1 : 0) +
    tag.length +
    (ordine !== "consigliati" ? 1 : 0);

  function azzera() {
    setObiettivo("tutti");
    setGiorno("tutti");
    setTag([]);
    setOrdine("consigliati");
  }

  function commutaTag(t: Tag) {
    setTag((v) => (v.includes(t) ? v.filter((x) => x !== t) : [...v, t]));
  }

  return (
    <>
      {/* ---------------------------------------------------------- testata */}
      <section className="pt-[168px] pb-[92px]">
        <div className="wrap">
          <div className="grid items-center gap-16 lg:grid-cols-[1fr_366px]">
            <div>
              <Eyebrow className="mb-[30px]">Il menu della settimana</Eyebrow>
              <h1 className="h1">
                {/* Il numero lo conta il catalogo: il menu cambia ogni settimana e una
                    testata scritta a mano prima o poi mentirebbe. */}
                <Rise i={0}>{DISHES.length} piatti,</Rise>
                <Rise i={1}>
                  <span className="hl">due cotture.</span>
                </Rise>
              </h1>
              <p className="lead mt-9">
                Il menu cambia ogni settimana. Matteo cucina il lunedi e il giovedi e consegna il
                giorno dopo: quello che leggi qui e&apos; quello che trovi nel box, senza surgelati e
                senza scorte di magazzino.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-2.5">
                <Chip accento>Porzioni pesate</Chip>
                <Chip>Macro dichiarati</Chip>
                <Chip>Consegna a Pescara</Chip>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[366px] lg:mx-0">
              <div
                className="shell transition-transform duration-700 md:rotate-[-2.4deg] md:hover:rotate-0"
                style={{ transitionTimingFunction: "var(--e-over)" }}
              >
                <figure className="core aspect-[4/5] bg-ink-2">
                  {COPERTINA ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={dishImg(COPERTINA, 760)}
                      alt={`${COPERTINA.nome}, porzione pesata da ${COPERTINA.grammi} grammi`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </figure>
              </div>
              <div
                className="absolute -bottom-7 -left-6 hidden rotate-[4.5deg] rounded-[18px] bg-lime px-5 py-4 text-ink shadow-[0_36px_62px_-36px_rgba(2,11,7,.95)] sm:block"
                aria-hidden="true"
              >
                <p className="font-disp text-[30px] leading-none uppercase">Lun / Gio</p>
                <p className="mt-1.5 font-mono text-[9px] tracking-[.2em] uppercase">
                  le due cotture
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Ticker
        parole={["Cotto il lunedi", "Cotto il giovedi", "Mai surgelato", "Pescara e provincia"]}
        durata={38}
      />

      {/* ------------------------------------------- filtri + griglia piatti
          Barra e griglia stanno nella STESSA sezione: e' l'unico modo perche la
          sticky resti agganciata per tutta la lettura del catalogo.           */}
      <section className="pt-[86px] pb-[110px]">
        <div className="wrap">
          <h2 className="sr-only">Filtra i piatti</h2>

          {/* z-30: sotto al pannello a schermo pieno del Nav (z-50) e sotto alla barra
              del box (z-40), che deve poter scavalcare i filtri su schermi corti. */}
          <div className="shell sticky top-[100px] z-30">
            <div className="core p-3 sm:p-4">
              {/* Sotto md la barra intera mangerebbe mezzo schermo: resta una riga
                  compatta e i gruppi si aprono a richiesta. */}
              <div className="flex items-center justify-between gap-3 md:hidden">
                <button
                  type="button"
                  onClick={() => setPannello((p) => !p)}
                  aria-expanded={pannello}
                  aria-controls="pannello-filtri"
                  className="btn btn-s btn-sm"
                >
                  Filtri
                  {attivi > 0 ? (
                    <span
                      style={{ fontVariationSettings: '"wdth" 84' }}
                      className="font-mono text-[11px] text-lime"
                    >
                      {attivi}
                    </span>
                  ) : null}
                  <span className="dot" aria-hidden="true">
                    {pannello ? "−" : "+"}
                  </span>
                </button>
                <Contatore n={visibili.length} />
              </div>

              <div
                id="pannello-filtri"
                className={`${pannello ? "flex" : "hidden"} mt-3 flex-col gap-3 md:mt-0 md:flex md:flex-row md:flex-wrap md:items-center md:gap-x-6 md:gap-y-3`}
              >
                <Gruppo etichetta="Obiettivo">
                  <Pill attivo={obiettivo === "tutti"} onClick={() => setObiettivo("tutti")}>
                    Tutti
                  </Pill>
                  {OBIETTIVI.map((o) => (
                    <Pill key={o.id} attivo={obiettivo === o.id} onClick={() => setObiettivo(o.id)}>
                      {o.label}
                    </Pill>
                  ))}
                </Gruppo>

                <Separatore />

                <Gruppo etichetta="Tipo">
                  {TAGS.map((t) => (
                    <Pill
                      key={t.id}
                      multi
                      attivo={tag.includes(t.id)}
                      onClick={() => commutaTag(t.id)}
                    >
                      {t.label}
                    </Pill>
                  ))}
                </Gruppo>

                <Separatore />

                <Gruppo etichetta="Giorno">
                  {GIORNI.map((g) => (
                    <Pill key={g.id} attivo={giorno === g.id} onClick={() => setGiorno(g.id)}>
                      {g.label}
                    </Pill>
                  ))}
                </Gruppo>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-3 md:ml-auto">
                  <div className="flex items-center gap-2.5">
                    <label htmlFor="ordina" className="note text-[9.5px]">
                      Ordina
                    </label>
                    <div className="relative">
                      <select
                        id="ordina"
                        value={ordine}
                        // Niente "as Ordine": l'asserzione avrebbe zittito il compilatore
                        // su un valore che arriva dal DOM come stringa qualunque. La
                        // lista e' la sola fonte di verita', e se non c'e' non si tocca
                        // lo stato.
                        onChange={(e) => {
                          const scelto = ORDINI.find((o) => o.id === e.target.value);
                          if (scelto) setOrdine(scelto.id);
                        }}
                        style={{ fontVariationSettings: '"wdth" 84' }}
                        className="appearance-none rounded-full border border-[color:var(--hair-soft)] bg-[rgba(201,224,205,.045)] py-[7px] pr-9 pl-[15px] font-mono text-[10.5px] tracking-[.06em] text-white uppercase transition-colors duration-400 ease-[var(--e-out)] hover:border-[color:var(--hair)]"
                      >
                        {ORDINI.map((o) => (
                          <option key={o.id} value={o.id} className="bg-ink-2 text-white">
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[9px] text-lime"
                      >
                        &#9660;
                      </span>
                    </div>
                  </div>

                  <Contatore n={visibili.length} className="hidden md:block" />

                  {attivi > 0 ? (
                    <button type="button" onClick={azzera} className="btn btn-s btn-sm">
                      Azzera
                      <span className="dot" aria-hidden="true">
                        &#215;
                      </span>
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <h2 className="sr-only">Piatti del menu</h2>

          {visibili.length > 0 ? (
            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visibili.map((d, i) => {
                // La prima scheda di ogni ciclo diventa vetrina su due colonne: la
                // griglia perde il passo regolare e il catalogo smette di sembrare un
                // listino. Sotto al ciclo pieno la vetrina si spegne: con tre risultati
                // una scheda larga il doppio delle altre non e' ritmo, e' uno sbaglio.
                const largo = visibili.length >= CICLO && i % CICLO === 0;
                return (
                  // Chiave sul solo id: cosi le schede che restano non si smontano a
                  // ogni click sui filtri (niente foto che sbattono) e a entrare in
                  // cascata sono davvero solo quelle nuove.
                  <Reveal
                    key={d.id}
                    delay={(i % CICLO) * 80}
                    className={largo ? "md:col-span-2" : undefined}
                  >
                    <div
                      className={`h-full transition-transform duration-700 ${INCLINA[i % CICLO]}`}
                      style={{ transitionTimingFunction: "var(--e-over)" }}
                    >
                      <DishCard dish={d} variante={largo ? "vetrina" : "griglia"} />
                    </div>
                  </Reveal>
                );
              })}
            </div>
          ) : (
            /* ---------------------------------------------- nessun risultato */
            <Reveal className="mt-12">
              <div className="shell mx-auto max-w-[760px] md:rotate-[-1.4deg]">
                <div className="core relative overflow-hidden px-8 py-14 text-center sm:px-14 sm:py-16">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 font-mono text-[190px] leading-none text-lime opacity-[.05]"
                  >
                    0
                  </span>
                  <p className="h2 relative">
                    Nessun piatto
                    <br />
                    con questi filtri
                  </p>
                  <p className="lead relative mx-auto mt-6">
                    Hai stretto troppo la maglia. Togli un tag o cambia obiettivo: i{" "}
                    {DISHES.length} piatti sono tutti qui, nessuno e&apos; finito.
                  </p>
                  <button type="button" onClick={azzera} className="btn btn-p relative mt-9">
                    Azzera i filtri
                    <span className="dot" aria-hidden="true">
                      &#8635;
                    </span>
                  </button>
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ------------------------------------------- il ritmo della settimana */}
      <section className="relative overflow-x-clip pt-[30px] pb-[132px]">
        <div className="-ml-[6%] w-[112%] bg-lime text-ink shadow-[0_36px_74px_-48px_rgba(2,11,7,.9)] md:rotate-[-1.15deg]">
          <div className="mx-auto flex w-[1180px] max-w-[calc(100%/1.12-40px)] flex-wrap items-center justify-center gap-x-6 gap-y-2 py-8 md:rotate-[1.15deg]">
            {RITMO.map((v, i) => (
              <Fragment key={v}>
                <span className="font-disp text-[19px] leading-none uppercase sm:text-[25px]">
                  {v}
                </span>
                {i < RITMO.length - 1 ? (
                  <i aria-hidden="true" className="block h-[9px] w-[9px] rotate-45 bg-ink" />
                ) : null}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ barra del box
          Solo a carrello riletto: i numeri del box non esistono al primo render
          sul server e stamparli qui vorrebbe dire un mismatch di idratazione.  */}
      {pronto && pasti > 0 ? (
        /* z-40, non 50: il pannello a schermo pieno del Nav sta a z-50 ma viene PRIMA
           nel DOM, quindi a parita' di z-index questa barra gli restava sopra e la pill
           "Vai al box" galleggiava in mezzo al menu mobile aperto. */
        <div className="pointer-events-none fixed inset-x-0 bottom-[22px] z-40 flex justify-center px-5">
          <div
            className="shell pointer-events-auto rounded-full"
            style={{ animation: "fuel-rise .7s var(--e-over) both" }}
          >
            <div className="core flex items-center gap-3 rounded-full py-[7px] pr-[7px] pl-5 sm:gap-4 sm:pl-6">
              <p
                aria-live="polite"
                style={{ fontVariationSettings: '"wdth" 84' }}
                className="font-mono text-[10.5px] tracking-[.12em] whitespace-nowrap text-mist uppercase"
              >
                <b className="text-[15px] font-normal text-white">{pasti}</b> pasti
                <span className="hidden sm:inline"> nel box</span>
              </p>
              <span aria-hidden="true" className="block h-5 w-px bg-[var(--hair)]" />
              <p
                style={{ fontVariationSettings: '"wdth" 84' }}
                className="font-mono text-[12.5px] whitespace-nowrap text-lime"
              >
                {euro(conto.totale)}
              </p>
              <Link href="/box" className="btn btn-p btn-sm">
                Vai al box
                <span className="dot" aria-hidden="true">
                  &#8599;
                </span>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
