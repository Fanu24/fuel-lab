import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Ticker from "@/components/Ticker";
import DishCard from "@/components/DishCard";
import { Eyebrow, SectionHead, Rise } from "@/components/ui";
import { DISHES, dishImg, getDish } from "@/lib/dishes";
import type { Dish } from "@/lib/types";
import PannelloMacro from "@/components/home/PannelloMacro";
import stili from "@/components/home/home.module.css";

export const metadata: Metadata = {
  title: "Il tuo piano alimentare, cucinato fresco",
  description:
    "Meal prep fresco e mai surgelato a Pescara e provincia. Carica la scheda del nutrizionista: Matteo cucina i tuoi macro il lunedi e il giovedi e te li porta a casa.",
};

/* React non tipa le custom property. Un'asserzione sparsa a ogni chiamata e'
   rumore che finisce per coprire gli errori veri: le variabili passano tutte da
   qui e il file resta senza asserzioni.
   Le rotazioni viaggiano su variabile e non su classe per un motivo preciso:
   home.module.css le accende solo da 768px in su, cosi sotto md la griglia resta
   dritta e niente sborda su uno schermo da 390. */
type Variabili = Record<`--${string}`, string>;
const vars = (v: Variabili): CSSProperties => v;

/* La home non conosce nessun URL di immagine: pesca dal catalogo e basta.
   Gli accessi sono dichiarati "possono mancare" apposta. Il menu cambia ogni
   settimana: se un giorno si accorcia, la sezione si accorcia con lui invece di
   esplodere su un indice che non c'e'. */
const vetrina: Dish | undefined = DISHES[0];
const righe: Dish[] = DISHES.slice(1, 3);
const polaroid: Dish | undefined = getDish("tonno-patate-viola-asparagi");

/* I quattro passi. Il secondo e' il blocco lime pieno: rompe la fila e cade
   proprio sul momento che vende il servizio, la cucina di Matteo. */
const PASSI: {
  n: string;
  titolo: string;
  testo: string;
  lime?: boolean;
  gr: string;
  su?: string;
}[] = [
  {
    n: "01",
    titolo: "Scegli o carica la scheda",
    testo:
      "Prendi i piatti dal menu della settimana, oppure carica la scheda del nutrizionista e lascia comporre il box all'algoritmo.",
    gr: "-1.2deg",
  },
  {
    n: "02",
    titolo: "Matteo cucina il lunedi e il giovedi",
    testo:
      "Materia prima comprata la mattina, cottura nel pomeriggio, porzionatura al grammo con la bilancia accesa.",
    lime: true,
    gr: "1.8deg",
    su: "lg:mt-[54px]",
  },
  {
    n: "03",
    titolo: "Consegna fresca a casa",
    testo:
      "A Pescara e provincia, in giornata. I contenitori arrivano freddi di frigo: non hanno mai visto un congelatore.",
    gr: "-0.8deg",
    su: "lg:mt-[18px]",
  },
  {
    n: "04",
    titolo: "Scaldi 3 minuti e mangi",
    testo:
      "Microonde o padella. Tre minuti e in tavola arriva esattamente quello che c'e' scritto sulla tua scheda.",
    gr: "1.4deg",
    su: "lg:mt-[72px]",
  },
];

export default function Home() {
  return (
    <>
      {/* ============================== HERO ============================== */}
      <section className="relative overflow-x-clip pt-[152px] pb-16 md:pt-[172px] md:pb-20">
        <div className="wrap">
          <div className="relative">
            <div className="relative z-[2] w-full max-w-[880px]">
              <div className={`${stili.salita} mb-9 md:mb-12`} style={{ animationDelay: "150ms" }}>
                <Eyebrow>Pescara &mdash; Consegna fresca 2 volte a settimana</Eyebrow>
              </div>

              <h1 className="h1">
                <Rise i={0}>Il tuo piano</Rise>
                <Rise i={1}>alimentare,</Rise>
                <Rise i={2}>
                  cucinato <span className={`hl ${stili.tenda}`}>fresco.</span>
                </Rise>
              </h1>

              <p
                className={`lead ${stili.salita} mt-12 md:mt-14`}
                style={{ animationDelay: "1180ms" }}
              >
                Carica la scheda del tuo nutrizionista. Matteo cucina i tuoi macro. Niente
                surgelati, niente bilancia, niente scuse.
              </p>

              <div
                className={`${stili.salita} mt-9 flex flex-wrap items-center gap-3.5`}
                style={{ animationDelay: "1320ms" }}
              >
                <Link href="/box" className="btn btn-p">
                  Componi il tuo box
                  <span className="dot" aria-hidden="true">
                    &rarr;
                  </span>
                </Link>
                <Link href="/scheda" className="btn btn-s">
                  Carica la scheda
                  <span className="dot" aria-hidden="true">
                    &rarr;
                  </span>
                </Link>
              </div>
            </div>

            {vetrina ? (
              <figure
                className={`shell ${stili.scatto} relative mt-16 w-[280px] max-w-full sm:w-[340px] lg:absolute lg:top-4 lg:right-[-10px] lg:z-[3] lg:mt-0 lg:w-[366px]`}
              >
                <div className="core aspect-[4/5]">
                  {/* Unica immagine non lazy della pagina, ed e' voluto: e' l'LCP.
                      Mandarla in lazy sposterebbe in avanti il primo contenuto
                      utile invece di alleggerire la pagina. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dishImg(vetrina, 900)}
                    alt={`${vetrina.nome}, porzionato nel contenitore della consegna`}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="h-full w-full object-cover object-[center_42%]"
                  />
                </div>

                {/* Timbro circolare: l'anello di testo gira, il marchio al centro sta fermo. */}
                <svg
                  viewBox="0 0 120 120"
                  role="img"
                  aria-label="Fresco, mai surgelato, Pescara"
                  className={`${stili.timbro} absolute right-[-20px] bottom-[-26px] h-[112px] w-[112px] lg:right-auto lg:bottom-[-42px] lg:left-[-48px] lg:h-[134px] lg:w-[134px]`}
                >
                  <defs>
                    <path
                      id="fuel-anello"
                      d="M60,60 m-43,0 a43,43 0 1,1 86,0 a43,43 0 1,1 -86,0"
                      fill="none"
                    />
                  </defs>
                  <circle cx="60" cy="60" r="55" fill="var(--color-lime)" />
                  <g className={stili.anello}>
                    <text
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "9.4px",
                        fontWeight: 600,
                        letterSpacing: "0.14em",
                        fill: "var(--color-ink)",
                      }}
                    >
                      <textPath href="#fuel-anello" startOffset="0">
                        {"FRESCO + MAI SURGELATO + PESCARA + "}
                      </textPath>
                    </text>
                  </g>
                  <text
                    x="60"
                    y="68"
                    textAnchor="middle"
                    style={{
                      fontFamily: "var(--font-disp)",
                      fontSize: "24px",
                      letterSpacing: "0.03em",
                      fill: "var(--color-ink)",
                    }}
                  >
                    FUEL
                  </text>
                </svg>
              </figure>
            ) : null}
          </div>
        </div>
      </section>

      {/* =========================== FASCIA FIDUCIA ======================= */}
      <section
        className="relative z-[4] mt-[-22px] overflow-x-clip"
        aria-label="Le tre garanzie Fuel"
      >
        <div className={`${stili.fascia} bg-lime text-ink`}>
          <div
            className={`${stili.fasciaIn} grid gap-3 py-8 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center md:gap-[26px] md:py-[34px]`}
          >
            <p className="font-disp text-[21px] leading-[1.02] uppercase md:text-[27px]">
              Fresco, mai surgelato
            </p>
            <i className="hidden h-[9px] w-[9px] rotate-45 bg-ink md:block" aria-hidden="true" />
            <p className="font-disp text-[21px] leading-[1.02] uppercase md:text-center md:text-[27px]">
              Consegnato a Pescara
              <br className="hidden md:block" /> e provincia
            </p>
            <i className="hidden h-[9px] w-[9px] rotate-45 bg-ink md:block" aria-hidden="true" />
            <p className="font-disp text-[21px] leading-[1.02] uppercase md:text-right md:text-[27px]">
              Macro certificati
              <br className="hidden md:block" /> su ogni box
            </p>
          </div>
        </div>
      </section>

      {/* ============================ COME FUNZIONA ======================= */}
      <section className="py-[110px] md:py-[150px]">
        <div className="wrap">
          <Reveal>
            <SectionHead
              occhiello="Dalla scheda al tavolo"
              titolo={
                <>
                  Quattro mosse,
                  <br />
                  zero pensieri
                </>
              }
              azione={
                <Link href="/come-funziona" className="btn btn-s">
                  Come funziona nel dettaglio
                  <span className="dot" aria-hidden="true">
                    &rarr;
                  </span>
                </Link>
              }
            />
          </Reveal>

          {/* role="list": il reset di Tailwind toglie i marcatori e con essi, su
              Safari, la semantica di lista. I quattro passi sono una sequenza,
              chi ascolta deve poterla contare. */}
          <ol role="list" className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-[22px]">
            {PASSI.map((p, i) => (
              <Reveal as="li" key={p.n} delay={i * 90} className={p.su}>
                <div className={`${stili.rotto} h-full`} style={vars({ "--gr": p.gr })}>
                  {p.lime ? (
                    <div className="h-full rounded-[26px] bg-lime p-7 text-ink sm:p-8">
                      <p
                        className="font-mono text-[42px] leading-none"
                        style={{ fontVariationSettings: '"wdth" 84' }}
                      >
                        {p.n}
                      </p>
                      <h3 className="h3 mt-6 !text-[25px] text-ink">{p.titolo}</h3>
                      <p className="mt-3.5 text-[14.5px] leading-relaxed text-ink/75">{p.testo}</p>
                    </div>
                  ) : (
                    <div className="shell h-full">
                      <div className="core h-full p-6 sm:p-7">
                        <p
                          className="font-mono text-[42px] leading-none text-lime"
                          style={{ fontVariationSettings: '"wdth" 84' }}
                        >
                          {p.n}
                        </p>
                        <h3 className="h3 mt-6 !text-[25px]">{p.titolo}</h3>
                        <p className="mt-3.5 text-[14.5px] leading-relaxed text-mist-dim">
                          {p.testo}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ======================= MENU DELLA SETTIMANA ===================== */}
      {vetrina || righe.length > 0 ? (
        <section className="overflow-x-clip pb-[110px] md:pb-[150px]">
          <div className="wrap">
            <Reveal>
              <SectionHead
                occhiello={`${DISHES.length} piatti, cucinati il lunedi e il giovedi`}
                titolo={
                  <>
                    Il menu
                    <br />
                    della settimana
                  </>
                }
                azione={
                  <Link href="/menu" className="btn btn-s">
                    Vedi tutti i {DISHES.length} piatti
                    <span className="dot" aria-hidden="true">
                      &rarr;
                    </span>
                  </Link>
                }
              />
            </Reveal>

            {/* Cascata sull asse Z: una grande a sinistra, due impilate a destra.
                La terza sborda di 26px, cosi il blocco non finisce dove finisce
                il contenitore.
                L'asimmetria parte da xl. Sotto, fra 1024 e 1279px, la colonna
                fissa da 640px lasciava alle schede-riga meno di 300px: i macro e
                il bottone "Aggiungi" non ci stavano e overflow-x-clip se li
                mangiava invece di mostrarli. */}
            <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-8 xl:grid-cols-[minmax(0,1.18fr)_minmax(0,1fr)] xl:gap-11">
              {vetrina ? (
                <Reveal delay={40}>
                  <div className={stili.rotto} style={vars({ "--gr": "-1.4deg" })}>
                    <DishCard dish={vetrina} variante="vetrina" />
                  </div>
                </Reveal>
              ) : null}

              {righe.length > 0 ? (
                <div className="grid gap-6 md:gap-[26px] lg:mt-9">
                  {righe.map((d, i) => (
                    <Reveal key={d.id} delay={160 + i * 100}>
                      <div
                        className={stili.rotto}
                        style={vars(
                          i === 0 ? { "--gr": "2.1deg" } : { "--gr": "-1.6deg", "--tx": "26px" },
                        )}
                      >
                        <DishCard dish={d} variante="riga" />
                      </div>
                    </Reveal>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* =============================== TICKER =========================== */}
      <Ticker
        parole={["FRESCO MAI SURGELATO", "PESCARA E PROVINCIA", "I TUOI MACRO", "CUCINATO OGGI"]}
      />

      {/* ======================= TEASER CONFIGURATORE ===================== */}
      <section className="overflow-x-clip py-[110px] md:py-[150px]">
        <div className="wrap">
          <div className="grid items-stretch gap-10 lg:grid-cols-[minmax(0,1fr)_442px] lg:gap-[52px] xl:grid-cols-[minmax(0,1fr)_486px]">
            <Reveal className="flex">
              <div className="flex w-full flex-col">
                <div className="mb-6">
                  <Eyebrow>Macro certificati su ogni box</Eyebrow>
                </div>
                <h2 className="h2">
                  La tua scheda
                  <br />
                  diventa il tuo menu
                </h2>

                {/* Zona di caricamento disegnata: qui e' un link, non un input
                    travestito. Il caricamento vero vive in /scheda. */}
                <div className="relative mt-10 flex flex-1">
                  {/* La foto e' appuntata sopra la zona di caricamento, quindi
                      pointer-events-none: senza, coprirebbe con un rettangolo
                      morto 174x144 l'angolo di un bersaglio cliccabile grande e
                      spegnerebbe l'hover della zona proprio mentre ci passi sopra.
                      Resta nell'albero di accessibilita: ha un alt che vale. */}
                  {polaroid ? (
                    <figure
                      className={`shell ${stili.rotto} pointer-events-none absolute top-[-30px] right-[-6px] z-[2] hidden w-[174px] sm:block`}
                      style={vars({
                        "--gr": "4.5deg",
                        "--shell": "20px",
                        "--pad": "6px",
                        "--core-r": "14px",
                      })}
                    >
                      <div className="core">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={dishImg(polaroid, 520)}
                          alt={`${polaroid.nome}, pesato al grammo e chiuso nel contenitore`}
                          loading="lazy"
                          decoding="async"
                          className="aspect-square w-full object-cover"
                        />
                      </div>
                    </figure>
                  ) : null}

                  <Link
                    href="/scheda"
                    className={`${stili.zona} relative flex flex-1 flex-col items-start justify-center rounded-[26px] border border-dashed px-7 py-11 sm:px-11 sm:py-14`}
                  >
                    <h3 className="h3 max-w-[348px] !text-[26px] sm:!text-[34px]">
                      Trascina qui la scheda del tuo nutrizionista
                    </h3>
                    <p className="note mt-3.5 text-lime">PDF, JPG o foto</p>
                    <span className="btn btn-p mt-8">
                      Carica la scheda
                      <span className="dot" aria-hidden="true">
                        &rarr;
                      </span>
                    </span>
                    <span className="note mt-5 block">Ti porta alla pagina della scheda</span>
                  </Link>
                </div>
              </div>
            </Reveal>

            <Reveal delay={140}>
              <PannelloMacro />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================== CHIUSURA ========================== */}
      <Reveal as="section" className="bg-lime text-ink">
        <div className="wrap flex flex-wrap items-end justify-between gap-9 py-[92px] md:py-[124px]">
          <div>
            <p className="note text-ink/65">
              Pescara e provincia &middot; Consegna il lunedi e il giovedi
            </p>
            <h2 className="h2 mt-6 text-ink">
              Mangia come
              <br />
              ti alleni.
            </h2>
          </div>
          <Link href="/box" className={`btn ${stili.btnScuro}`}>
            Componi il tuo box
            <span className="dot" aria-hidden="true">
              &rarr;
            </span>
          </Link>
        </div>
      </Reveal>
    </>
  );
}
