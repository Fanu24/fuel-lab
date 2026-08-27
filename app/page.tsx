import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Ticker from "@/components/Ticker";
import ElementCard from "@/components/ElementCard";
import SezioneServizi from "@/components/servizi/SezioneServizi";
import { Eyebrow, SectionHead, Rise } from "@/components/ui";
import { PRIMI, SECONDI, elementoImg } from "@/lib/catalogo";
import type { Elemento } from "@/lib/catalogo";
import stili from "@/components/home/home.module.css";

export const metadata: Metadata = {
  title: "Mangia come ti alleni",
  description:
    "Meal prep fresco a Pescara, mai surgelato. Primi, secondi ed extra con i macro dichiarati su ogni elemento, cucinati il lunedi e il giovedi. Il menu della settimana, il piano sui tuoi macro, o Matteo che cucina dentro casa tua.",
};

/* React non tipa le custom property. Un'asserzione sparsa a ogni chiamata e'
   rumore che finisce per coprire gli errori veri: le variabili passano tutte da
   qui e il file resta senza asserzioni.
   Le rotazioni viaggiano su variabile e non su classe per un motivo preciso:
   home.module.css le accende solo da 768px in su, cosi sotto md la griglia resta
   dritta e niente sborda su uno schermo da 390. */
type Variabili = Record<`--${string}`, string>;
const vars = (v: Variabili): CSSProperties => v;

/* La home non conosce nessun URL di immagine: pesca dal catalogo nuovo e basta,
   mai da lib/dishes.ts (i piatti interi). Il menu cambia ogni settimana: se un
   giorno si accorcia, la sezione si accorcia con lui invece di esplodere su un
   indice che non c'e'. */
const eroe: Elemento | undefined = SECONDI[0];
const anteprimaPrimo: Elemento | undefined = PRIMI[0];
const anteprimaSecondi: Elemento[] = SECONDI.slice(1, 3);

/* Stesso verde scuro di components/servizi/SezioneServizi.tsx, non --color-ink:
   il composito su lime va sempre giudicato dopo la miscela, mai sul colore nudo.
   rgba(18,48,31,.65) (ink base) sopra il lime compone a 4.45:1, sotto soglia -
   e' lo stesso errore documentato in quel file con alpha .62. Questo verde piu
   scuro, rgb(6,23,16), a alpha .66 compone a 5.69:1: margine vero. */
const SU_LIME = "rgba(6,23,16,.66)";

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
    titolo: "Scegli primi e secondi",
    testo:
      "Componi il pasto dal menu della settimana - un primo, un secondo, gli extra che vuoi - oppure carica la scheda del nutrizionista e lascia scegliere al matcher sui tuoi macro.",
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
      "Microonde o padella. Tre minuti e in tavola arriva esattamente il primo e il secondo che hai scelto, piu' gli extra.",
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
                <Rise i={0}>Mangia come</Rise>
                <Rise i={1}>
                  ti{" "}
                  <Reveal as="span" delay={260} className="hl">
                    <i className="hl-bar" aria-hidden="true" />
                    <span className="hl-tx">alleni.</span>
                  </Reveal>
                </Rise>
              </h1>

              <p
                className={`lead ${stili.salita} mt-12 md:mt-14`}
                style={{ animationDelay: "1180ms" }}
              >
                Scegli primi e secondi dal menu della settimana, o carica la scheda del tuo
                nutrizionista: Matteo cucina i tuoi macro e te li porta a casa freschi, mai
                surgelati.
              </p>

              <div
                className={`${stili.salita} mt-9 flex flex-wrap items-center gap-3.5`}
                style={{ animationDelay: "1320ms" }}
              >
                <Link href="/menu" className="btn btn-p">
                  Sfoglia il menu
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

            {eroe ? (
              <figure
                className={`shell ${stili.scatto} relative mt-16 w-[280px] max-w-full sm:w-[340px] lg:absolute lg:top-4 lg:right-[-10px] lg:z-[3] lg:mt-0 lg:w-[366px]`}
              >
                <div className="core aspect-[4/5]">
                  {/* Unica immagine non lazy della pagina, ed e' voluto: e' l'LCP.
                      Mandarla in lazy sposterebbe in avanti il primo contenuto
                      utile invece di alleggerire la pagina. Niente filtro di
                      luminosita': era scurita per il fondo nero, su chiaro torna
                      naturale. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={elementoImg(eroe, 900)}
                    alt={`${eroe.nome}, porzionato e pesato per la consegna`}
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

      {/* =========================== FASCIA FIDUCIA =======================
          Rimessa nel ciclo di correzione 1: era nel mockup della direzione
          scelta dal committente, subito sotto l'hero, prima di qualunque
          impegno di lettura. E' l'unico elemento fermo (non un marquee) della
          pagina, quindi il solo posto che si scansiona in due secondi. Le
          prime due affermazioni sono ridondanti con eyebrow/ticker/timbro/
          lead/passo 03: costa poco tenerle. La terza - macro certificati -
          non era coperta da nessun'altra parte in evidenza: e' il vero
          differenziale per chi si allena, a differenza di "fresco e locale"
          che dice chiunque. Testo scuro pieno su lime pieno: text-ink =
          12,607:1 (valore documentato in globals.css), nessun composito da
          calcolare perche' non c'e' alpha. */}
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
              <br className="hidden md:block" /> su primi e secondi
            </p>
          </div>
        </div>
      </section>

      {/* =============================== TICKER =========================== */}
      <Ticker
        parole={[
          "FRESCO MAI SURGELATO",
          "PESCARA E PROVINCIA",
          "I TUOI MACRO",
          "PRIMI E SECONDI",
          "CUCINATO OGGI",
        ]}
      />

      {/* =========================== I NOSTRI SERVIZI ======================
          Componente gia' pronto (Task 12): porta la propria SectionHead e il
          proprio <section>, si monta cosi' com'e'. */}
      <SezioneServizi />

      {/* ======================= ANTEPRIMA DELLA SETTIMANA =================
          Non un carrello e non i numeri live del piano: page.tsx resta un
          Server Component (esporta metadata) e non puo' chiamare usePiano().
          Quello che puo' fare e' mostrare un assaggio vero del catalogo nuovo -
          un primo, due secondi, con ElementCard che gestisce da sola lo stato
          "Aggiungi" dietro pronto (il componente e' client e legge usePiano al
          suo interno). Il link in fondo porta alla settimana vera, con la
          griglia delle 14 caselle e i macro che si aggiornano mentre scegli. */}
      {anteprimaPrimo && anteprimaSecondi.length > 0 ? (
        <section className="overflow-x-clip py-[110px] md:py-[150px]">
          <div className="wrap">
            <Reveal>
              <SectionHead
                occhiello={`${PRIMI.length} primi, ${SECONDI.length} secondi, mai un piatto gia' chiuso`}
                titolo={
                  <>
                    Anteprima
                    <br />
                    della settimana
                  </>
                }
                testo="Un primo, un secondo e gli extra che ti servono: quello che vedi qui e' quello che trovi nel catalogo completo, pronto per finire nella tua settimana."
                azione={
                  <Link href="/menu" className="btn btn-s">
                    Sfoglia tutto il catalogo
                    <span className="dot" aria-hidden="true">
                      &rarr;
                    </span>
                  </Link>
                }
              />
            </Reveal>

            {/* Stessa cascata sull'asse Z dell'impaginazione precedente: un
                primo grande a sinistra, due secondi impilati a destra. */}
            <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-8 xl:grid-cols-[minmax(0,1.18fr)_minmax(0,1fr)] xl:gap-11">
              <Reveal delay={40}>
                <div className={stili.rotto} style={vars({ "--gr": "-1.4deg" })}>
                  <ElementCard elemento={anteprimaPrimo} />
                </div>
              </Reveal>

              <div className="grid gap-6 md:gap-[26px] lg:mt-9">
                {anteprimaSecondi.map((e, i) => (
                  <Reveal key={e.id} delay={160 + i * 100}>
                    <div
                      className={stili.rotto}
                      style={vars(
                        i === 0 ? { "--gr": "2.1deg" } : { "--gr": "-1.6deg", "--tx": "26px" },
                      )}
                    >
                      <ElementCard elemento={e} variante="riga" />
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

            <Reveal delay={260} className="mt-10 flex justify-center">
              <Link href="/settimana" className="btn btn-p">
                Vai alla tua settimana
                <span className="dot" aria-hidden="true">
                  &rarr;
                </span>
              </Link>
            </Reveal>
          </div>
        </section>
      ) : null}

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
                          className="font-mono text-[42px] leading-none text-ink"
                          style={{ fontVariationSettings: '"wdth" 84' }}
                        >
                          {p.n}
                        </p>
                        <h3 className="h3 mt-6 !text-[25px]">{p.titolo}</h3>
                        <p className="mt-3.5 text-[14.5px] leading-relaxed text-muted">
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

      {/* ============================== CHIUSURA ========================== */}
      <Reveal as="section" className="bg-lime text-ink">
        <div className="wrap flex flex-wrap items-end justify-between gap-9 py-[92px] md:py-[124px]">
          <div>
            {/* .note porta di default var(--color-muted), tarato su paper/card/cell:
                sopra il lime pieno va sovrascritto. rgba(18,48,31,.65) (ink base)
                comporrebbe a 4.45:1, sotto soglia: SU_LIME e' il verde piu scuro
                gia' in uso in SezioneServizi.tsx per lo stesso identico problema. */}
            <p className="note" style={{ color: SU_LIME }}>
              Pescara e provincia &middot; Consegna il lunedi e il giovedi
            </p>
            <h2 className="h2 mt-6 text-ink">
              Mangia come
              <br />
              ti alleni.
            </h2>
          </div>
          <Link href="/settimana" className={`btn ${stili.btnScuro}`}>
            Componi la tua settimana
            <span className="dot" aria-hidden="true">
              &rarr;
            </span>
          </Link>
        </div>
      </Reveal>
    </>
  );
}
