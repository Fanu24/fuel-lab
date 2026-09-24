import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { Eyebrow, Rise } from "@/components/ui";
import { PIATTI, etichettaAllenamento, piattoImg } from "@/lib/catalogo";
import type { Piatto } from "@/lib/catalogo";
import { getServizio } from "@/lib/servizi";
import type { Prezzo, ServizioId } from "@/lib/servizi";
import { GIORNI, NOMI_GIORNO } from "@/lib/settimana";
import stili from "@/components/home/home.module.css";

export const metadata: Metadata = {
  title: "Pasti pronti tutti i giorni",
  description:
    "Meal prep fresco a Pescara. Cuciniamo noi, tu trovi i pasti in frigo tutti i giorni. Sei piatti già composti sui tuoi macro, mai surgelati. Menu della settimana, piano sulla scheda, o Matteo in casa tua.",
};

/* =========================================================================
   LA HOME, RIPENSATA.

   IL DIFETTO CHE QUESTA PAGINA CHIUDE. Prima c'erano sei sezioni e 5378px, e
   il problema non era il numero di parole: era che OGNI sezione si spiegava a
   parole prima di mostrare qualcosa. Lo stesso schema quattro volte -
   pillola-occhiello, titolone su due righe, paragrafo di tre righe, e solo
   dopo il contenuto. Chi arriva vuole vedere il cibo, non leggere
   l'introduzione al cibo.

   QUATTRO SEZIONI, ognuna su una superficie diversa dalla vicina (vedi "il
   ritmo delle superfici" in app/globals.css):

     1. hero + il cibo subito     carta, con la fascia fiducia LIME sotto
     2. i tre servizi             guscio
     3. componi la settimana      carta
     4. scrivi a Matteo           inchiostro, corta

   COSA E' USCITO, E DOVE E' FINITO.
   - "Come funziona" in quattro passi: vive per intero, con piu' dettaglio, su
     /come-funziona. In home resta il rimando breve nella chiusura. Nessuna
     riga andava salvata altrove: il solo dettaglio che qui c'era e li' no,
     "porzionatura al grammo", sta gia' su /chi-e-matteo (didascalia della
     striscia cucina) e su /scheda.
   - Il ticker: diceva le stesse tre cose della fascia fiducia, che gli stava
     due centimetri sopra. Erano anche due superfici lime attaccate, cioe' la
     regola delle fasce rotta. Il componente resta, e lo montano /menu,
     /scheda, /come-funziona e /chi-e-matteo.
   - La sezione servizi lunga (components/servizi/SezioneServizi.tsx): resta
     su /servizi, dove ha una pagina tutta per se'. Qui i tre servizi
     diventano tre carte pari: una scelta, non un racconto.
   - L'anteprima con le ElementCard intere (macro, allergeni, "Aggiungi"): era
     una scheda tecnica messa in vetrina. In home il catalogo si mostra come
     vetrina - foto, nome, macro in una riga - e la scheda intera sta su
     /menu, dove serve davvero.

   UN'AZIONE SOLA PER SEZIONE: il menu, la scelta del servizio, la settimana,
   la richiesta. Dove l'azione compare due volte (bottone piu' blocco
   cliccabile) le due portano allo stesso posto.
   ========================================================================= */

/* Stesso verde scuro di components/servizi/SezioneServizi.tsx, non
   --color-ink: il composito su lime va giudicato dopo la miscela, mai sul
   colore nudo. rgba(18,48,31,.65) sopra il lime compone a 4.45:1, sotto
   soglia. Questo verde piu' scuro, rgb(6,23,16), a alpha .66 compone a
   5.69:1: margine vero. */
const SU_LIME = "rgba(6,23,16,.66)";

/* La home non conosce nessun URL di immagine: pesca dal catalogo e basta. */
const eroe: Piatto | undefined = PIATTI[0];
const VETRINA = PIATTI;
const PIATTO_CARDIO = PIATTI.find((p) => p.allenamento === "cardio") ?? PIATTI[0];
const PIATTO_PESI = PIATTI.find((p) => p.allenamento === "pesi") ?? PIATTI[3];

function fotoSport(id: string, w = 1200): string {
  return `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;
}

const CORSIE = [
  {
    num: "01",
    titolo: "Cardio",
    testo: "Quando fai cardio, il pasto porta più carboidrati.",
    azione: "Vedi i piatti cardio",
    href: "/menu?allenamento=cardio",
    id: "photo-1461897104016-0b3b00cc81ee",
    alt: "Sprinters che esplodono dai blocchi su una pista di atletica",
    pos: "50% 58%",
    piatto: PIATTO_CARDIO,
  },
  {
    num: "02",
    titolo: "Pesistica",
    testo: "Quando fai pesi, il pasto privilegia le proteine e tiene i carboidrati ridotti.",
    azione: "Vedi i piatti pesistica",
    href: "/menu?allenamento=pesi",
    id: "photo-1541534741688-6078c6bfb5c5",
    alt: "Atleta in spinta sopra la testa con il bilanciere",
    pos: "50% 28%",
    piatto: PIATTO_PESI,
  },
] as const;

/* I tre servizi come SCELTA, non come racconto: una riga sola per servizio,
   la soglia, un'azione. Le descrizioni per esteso stanno in lib/servizi.ts e
   si leggono su /servizi: qui una carta larga un terzo di schermo ne
   mostrerebbe quattro righe, e sarebbero di nuovo parole prima del prodotto.
   L'azione e' il passo successivo VERO di quel servizio, non un generico
   "scopri": il menu si sfoglia, la scheda si carica, l'home cooking - che non
   ha una pagina propria e non ha un prezzo - si chiede a Matteo. */
const CARTE: {
  id: ServizioId;
  riga: string;
  href: string;
  azione: string;
  /** la carta lime: rompe la fila di tre e cade sul servizio che ci distingue */
  lime?: boolean;
}[] = [
  {
    id: "menu-settimana",
    riga: "Sei piatti già composti, con ingredienti e macro. Le aggiunte della box le scegli tu.",
    href: "/menu",
    azione: "Sfoglia il menu",
  },
  {
    id: "sui-tuoi-macro",
    riga: "Carichi la scheda del nutrizionista e la settimana si compone sui tuoi numeri.",
    href: "/scheda",
    azione: "Carica la scheda",
    lime: true,
  },
  {
    id: "home-cooking",
    riga: "Matteo viene a casa tua: spesa, cottura e porzionatura nella tua cucina.",
    href: "/richiesta?servizio=home-cooking",
    azione: "Scrivi a Matteo",
  },
];

/* L'inclinazione leggera e' una delle quattro cose che fanno il linguaggio di
   questo sito (con la doppia scocca, la fotografia e i dati in mono), e dalle
   tre carte era sparita. Torna solo da 768px in su: a 390 una carta ruotata
   dentro una colonna larga quanto lo schermo sporge dai bordi e apre lo scorri
   mento orizzontale, che sul telefono e' un difetto vero, non un dettaglio.
   I tre valori non sono uguali fra loro di proposito: tre carte inclinate
   dello stesso angolo sembrano una pagina storta, non tre oggetti appoggiati. */
const INCLINA = ["md:rotate-[-1.1deg]", "md:rotate-[.9deg]", "md:rotate-[-.5deg]"];

/* Il testo alternativo della foto di ogni servizio. Sta qui e non in
   lib/servizi.ts perche' descrive QUESTA immagine in QUESTO contesto: la
   stessa foto su /servizi e' incorniciata diversamente e si racconta con
   parole sue. */
const ALT_CARTA: Record<ServizioId, string> = {
  "menu-settimana": "Contenitori di meal prep pronti, il menu della settimana già composto",
  "sui-tuoi-macro": "Piatto pesato e porzionato sui macro della scheda",
  "home-cooking": "Mani che completano un piatto in cucina, il gesto di chi cucina per te",
};

/** "8,90 €": la virgola italiana e il simbolo, mai un totale. */
function soglia(valore: number): string {
  return `${valore.toFixed(2).replace(".", ",")} €`;
}

function PrezzoBreve({ prezzo, suLime = false }: { prezzo: Prezzo; suLime?: boolean }) {
  if (prezzo.tipo === "preventivo") {
    return (
      <p className="price">
        <span className="price-n">Su preventivo</span>
      </p>
    );
  }
  return (
    <p className="price">
      <span className="price-da" style={suLime ? { color: SU_LIME } : undefined}>
        A partire da
      </span>
      <span className="price-n">{soglia(prezzo.valore)}</span>
      <span className="price-u" style={suLime ? { color: SU_LIME } : undefined}>
        {prezzo.unita}
      </span>
    </p>
  );
}

/* La settimana d'esempio: due caselle piene su quattordici. Il vuoto e' il
   punto: la griglia si legge come una scheda da riempire, non come un listino. */
const CASELLE: [Piatto | undefined, Piatto | undefined][] = GIORNI.map((_, i) => {
  if (i === 0) return [PIATTI[0], undefined];
  if (i === 3) return [undefined, PIATTI[3]];
  return [undefined, undefined];
});

function CasellaEsempio({ dentro }: { dentro: Piatto | undefined }) {
  if (!dentro) {
    return (
      <div className="cell w-full items-center justify-center text-[20px] font-medium text-muted">
        <span aria-hidden="true">+</span>
        <span className="sr-only">casella libera</span>
      </div>
    );
  }
  return (
    <div className="cell cell-full w-full">
      <p className="cell-d">{dentro.nome}</p>
      <p className="cell-k">{dentro.kcal} kcal</p>
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* ==================== 1. HERO + IL CIBO SUBITO ====================
          Promessa: i pasti sono pronti tutti i giorni. Il campo da pista sta
          sotto, cosi lo hero non e' un foglio crema. Su telefono la foto
          eroe sparisce: la vetrina sotto e' gia' cibo, e una seconda scodella
          prima di quella ritardava i quattro piatti. */}
      <section className="overflow-x-clip">
        <div className={`relative pt-[80px] pb-5 md:pt-[128px] md:pb-8 ${stili.campo}`}>
        <svg
          className={stili.pista}
          viewBox="0 0 800 900"
          preserveAspectRatio="xMaxYMin slice"
          aria-hidden="true"
          focusable="false"
        >
          <g fill="none" stroke="var(--color-ink)" strokeOpacity="0.18" strokeWidth="26">
            <ellipse cx="840" cy="20" rx="430" ry="370" />
            <ellipse cx="840" cy="20" rx="368" ry="314" />
            <ellipse cx="840" cy="20" rx="306" ry="258" />
          </g>
          <ellipse
            cx="840"
            cy="20"
            rx="244"
            ry="202"
            fill="none"
            stroke="var(--color-lime)"
            strokeOpacity="1"
            strokeWidth="14"
          />
        </svg>
        <div className="relative z-[1] wrap">
          <div className="grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
            <div className={stili.col}>
              <span className={stili.maglia} aria-hidden="true" />
              <div className="relative z-[1]">
              <div className={`${stili.salita} mb-4 md:mb-7`} style={{ animationDelay: "150ms" }}>
                <Eyebrow>Il frigo &egrave; gi&agrave; fatto.</Eyebrow>
              </div>

              <h1 className={`h1 ${stili.titolo}`}>
                <Rise i={0}>Pasti pronti.</Rise>
                <Rise i={1}>
                  <Reveal as="span" delay={260} className="hl">
                    <i className="hl-bar" aria-hidden="true" />
                    <span className="hl-tx">Tutti i giorni.</span>
                  </Reveal>
                </Rise>
              </h1>

              <p
                className={`lead ${stili.salita} mt-4 max-w-[38ch] md:mt-7`}
                style={{ animationDelay: "900ms" }}
              >
                Cuciniamo noi. Tu apri il frigo e mangi, sette giorni su sette. Fresco, sui tuoi
                macro.
              </p>

              <div className={`${stili.salita} mt-5 md:mt-8`} style={{ animationDelay: "1020ms" }}>
                <Link href="/menu" className="btn btn-p">
                  Sfoglia il menu
                  <span className="dot" aria-hidden="true">
                    &rarr;
                  </span>
                </Link>
              </div>
              </div>
            </div>

            {eroe ? (
              <figure className={`shell ${stili.scatto} relative hidden w-full lg:mx-0 lg:block lg:h-[400px] lg:w-full`}>
                <div className="core foto-profondita aspect-[5/4] sm:aspect-[4/5] lg:aspect-auto lg:h-full">
                  {/* Unica immagine non lazy della pagina, ed e' voluto: e'
                      l'LCP. Mandarla in lazy sposterebbe in avanti il primo
                      contenuto utile invece di alleggerire la pagina. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={piattoImg(eroe, 900)}
                    alt={`${eroe.nome}, porzionato e pesato per la consegna`}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="h-full w-full object-cover object-[center_78%]"
                  />
                </div>

                {/* Timbro solo da md: a 390px sbordava dalla foto e copriva
                    il tasto. L'anello gira, il marchio sta fermo. */}
                <svg
                  viewBox="0 0 120 120"
                  role="img"
                  aria-label="FUEL LAB, pasti pronti tutti i giorni, Pescara"
                  className={`${stili.timbro} absolute right-[-18px] bottom-[-24px] hidden h-[104px] w-[104px] md:block lg:right-auto lg:bottom-[-32px] lg:left-[-42px] lg:h-[122px] lg:w-[122px]`}
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
                        fontSize: "8.2px",
                        fontWeight: 600,
                        letterSpacing: "0.1em",
                        fill: "var(--color-ink)",
                      }}
                    >
                      <textPath href="#fuel-anello" startOffset="0">
                        {"PASTI PRONTI + TUTTI I GIORNI + PESCARA + "}
                      </textPath>
                    </text>
                  </g>
                  {/* Il marchio sta su DUE righe, non su una: "FUEL LAB" a 24px
                      misura circa 90px, e dentro l'anello (r=43) di spazio
                      libero ce n'e' circa 74. A 20px su due righe, baseline 58
                      e 76, il blocco resta centrato sul cerchio. */}
                  <text
                    textAnchor="middle"
                    style={{
                      fontFamily: "var(--font-disp)",
                      fontSize: "20px",
                      letterSpacing: "0.03em",
                      fill: "var(--color-ink)",
                    }}
                  >
                    <tspan x="60" y="58">
                      FUEL
                    </tspan>
                    <tspan x="60" y="76">
                      LAB
                    </tspan>
                  </text>
                </svg>
              </figure>
            ) : null}
          </div>

          <span className={stili.partenza} aria-hidden="true" />
        </div>
        </div>

          {/* ---- la vetrina: quattro elementi veri, sotto lo hero ---- */}
          {VETRINA.length > 0 ? (
            <div className="wrap pb-8 md:pb-16">
            <div className="mt-5 md:mt-14">
              <Reveal>
                <p className="note">Questa settimana in cucina</p>
              </Reveal>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:grid-cols-3">
                {VETRINA.map((e, i) => (
                  <Reveal key={e.id} delay={i * 80} className="h-full">
                    <Link
                      href="/menu"
                      aria-label={`${e.nome}, ${etichettaAllenamento(e.allenamento)}, ${e.kcal} kcal: sfoglia il menu`}
                      className="shell group block h-full transition-transform duration-500 hover:-translate-y-1.5"
                      style={{ transitionTimingFunction: "var(--e-over)" }}
                    >
                      <div className="core flex h-full flex-col">
                        <figure className="foto-profondita relative aspect-[3/2] overflow-hidden bg-tray">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={piattoImg(e, 640)}
                            alt={e.nome}
                            loading={i === 0 ? "eager" : "lazy"}
                            fetchPriority={i === 0 ? "high" : undefined}
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.06]"
                            style={{ transitionTimingFunction: "var(--e-out)" }}
                          />
                          <span className="chip chip-k absolute top-2.5 left-2.5 uppercase sm:top-3 sm:left-3">
                            {etichettaAllenamento(e.allenamento)}
                          </span>
                          {/* Le calorie salgono sulla foto: nella riga sotto
                              facevano andare a capo i macro, e due righe di
                              mono per quattro card sono trenta pixel buttati. */}
                          <span className="chip absolute right-2.5 bottom-2.5 sm:right-3 sm:bottom-3">
                            {e.kcal} kcal
                          </span>
                        </figure>
                        <div className="flex flex-1 flex-col p-3.5 sm:p-5">
                          <p className="h3 !text-[17px] sm:!text-[19px]">{e.nome}</p>
                          <p className="mono mt-auto pt-3 text-[12px] text-muted sm:pt-3.5">
                            P {e.proteine} &middot; C {e.carboidrati} &middot; G {e.grassi}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
            </div>
          ) : null}
      </section>

      {/* ========================= FASCIA FIDUCIA =========================
          Resta, e resta piccola. E' l'unico elemento fermo della pagina,
          quindi il solo che si scansiona in due secondi, e la terza
          affermazione - macro certificati - e' il vero differenziale per chi
          si allena, a differenza di "fresco e locale" che dice chiunque.
          Testo scuro pieno su lime pieno: 12.61:1, nessun composito da
          calcolare perche' non c'e' nessun alpha. */}
      <section
        className="relative z-[4] mt-[-22px] overflow-x-clip"
        aria-label="Le tre garanzie FUEL LAB"
      >
        <div className={`${stili.fascia} bg-lime text-ink`}>
          <div
            className={`${stili.fasciaIn} grid gap-2 py-5 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center md:gap-[26px] md:py-8`}
          >
            <p className="font-disp text-[21px] leading-[1.02] uppercase md:text-[26px]">
              Fresco, mai surgelato
            </p>
            <i className="hidden h-[9px] w-[9px] rotate-45 bg-ink md:block" aria-hidden="true" />
            <p className="font-disp text-[21px] leading-[1.02] uppercase md:text-center md:text-[26px]">
              Consegnato a Pescara
              <br className="hidden md:block" /> e provincia
            </p>
            <i className="hidden h-[9px] w-[9px] rotate-45 bg-ink md:block" aria-hidden="true" />
            <p className="font-disp text-[21px] leading-[1.02] uppercase md:text-right md:text-[26px]">
              Macro certificati
              <br className="hidden md:block" /> su ogni piatto
            </p>
          </div>
        </div>
      </section>

      {/* ===================== ALLENAMENTO + PASTO ===================== */}
      <section
        className={`fascia fascia-carta ${stili.fit}`}
        aria-label="Allenamento e abbinamento del pasto"
      >
        <div className="wrap">
          <Reveal className="mb-5 md:mb-8">
            <h2 className="h2">Mangia come ti alleni.</h2>
          </Reveal>

          <div className={stili.corsie}>
            {CORSIE.map((c, i) => (
              <Reveal key={c.num} delay={i * 90} className="min-w-0">
                <Link
                  href={c.href}
                  aria-label={`${c.titolo}: ${c.piatto.nome}. Vedi i piatti ${c.titolo.toLowerCase()}`}
                  className={`shell ${stili.corsia}`}
                >
                  <div className={`core ${stili.corsiaCore}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={fotoSport(c.id)}
                      alt={c.alt}
                      loading="lazy"
                      decoding="async"
                      className={stili.corsiaFoto}
                      style={{ objectPosition: c.pos }}
                    />
                    <span className={stili.corsiaVelo} aria-hidden="true" />
                    <span className={stili.corsiaPartenza} aria-hidden="true" />
                    <span className={stili.corsiaNum} aria-hidden="true">
                      {c.num}
                    </span>
                    <div className={stili.corsiaCorpo}>
                      <h3 className="h3">{c.titolo}</h3>
                      <p className={stili.corsiaTesto}>{c.testo}</p>
                      <span className={`chip chip-k ${stili.corsiaPiatto}`}>{c.piatto.nome}</span>
                      <span className={`btn btn-sm ${stili.corsiaCta}`}>
                        {c.azione}
                        <span className="dot" aria-hidden="true">
                          &rarr;
                        </span>
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== 2. I TRE SERVIZI ========================
          Guscio: la superficie cambia subito dopo la fascia lime, cosi il
          confine si vede senza contare il vuoto. Tre carte pari, un'azione
          per carta, nessun paragrafo introduttivo. */}
      <section className="fascia fascia-guscio">
        <div className="wrap">
          <Reveal className="mb-5 md:mb-9">
            <h2 className="h2">Tre modi di mangiare bene.</h2>
          </Reveal>

          <div className="grid gap-4 md:grid-cols-3 md:gap-6">
            {CARTE.map((c, i) => {
              const s = getServizio(c.id);
              return (
                <Reveal key={c.id} delay={i * 90} className="h-full">
                  <Link
                    href={c.href}
                    aria-label={`${s.nome}: ${c.azione}`}
                    className={`shell group block h-full transition-transform duration-500 hover:-translate-y-1.5 ${INCLINA[i]}`}
                    style={{
                      transitionTimingFunction: "var(--e-over)",
                      ...(c.lime ? { background: "var(--color-lime)" } : null),
                    }}
                  >
                    <div
                      className="core flex h-full flex-col"
                      style={c.lime ? { background: "var(--color-lime)" } : undefined}
                    >
                      {c.lime ? (
                        /* La carta al centro non porta una foto, e non e' una
                           dimenticanza: e' la superficie lime a fare il lavoro
                           che sulle altre due fa il piatto. Al posto della
                           fascia fotografica ci sono i tre modi veri di dare a
                           Matteo la tua scheda - il PDF, la foto, i valori
                           digitati - in chip a inchiostro (lime su ink =
                           12.61:1, l'unico posto in cui il lime e' testo). */
                        <div className="flex flex-wrap items-center gap-2 px-4 pt-4 sm:px-6 sm:pt-6">
                          <span className="num num-ink">{s.numero}</span>
                          <span className="chip chip-ink uppercase">PDF</span>
                          <span className="chip chip-ink uppercase">Foto</span>
                          <span className="chip chip-ink uppercase">Valori a mano</span>
                        </div>
                      ) : (
                        /* LE FOTO SONO TORNATE. Nel giro precedente le tre
                           carte erano diventate rettangoli colorati con dentro
                           del testo: chiare, ma senza piu' niente del
                           linguaggio del sito. Qui la fascia fotografica e' la
                           stessa della vetrina qui sopra e delle schede del
                           catalogo, e il numero di servizio ci sale sopra
                           invece di occupare una riga per conto suo. */
                        <figure className="relative aspect-[16/6] overflow-hidden bg-tray md:aspect-[16/10]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={s.img}
                            alt={ALT_CARTA[c.id]}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.05]"
                            style={{ transitionTimingFunction: "var(--e-out)" }}
                          />
                          <span className="num num-lime absolute top-3 left-3">{s.numero}</span>
                        </figure>
                      )}

                      <div className="flex flex-1 flex-col p-4 sm:p-6">
                        <h3 className={`h3 !text-[20px] sm:!text-[23px] ${c.lime ? "text-ink" : ""}`}>
                          {s.nome}
                        </h3>
                        <p
                          className={`mt-3 flex-1 text-[16px] leading-[1.5] sm:text-[17px] ${c.lime ? "" : "text-muted"}`}
                          style={c.lime ? { color: SU_LIME } : undefined}
                        >
                          {c.riga}
                        </p>

                        <div className="mt-4">
                          <PrezzoBreve prezzo={s.prezzo} suLime={c.lime} />
                        </div>
                        {/* Non e' un <button>: sta dentro un link, e un
                            interattivo dentro un interattivo non e' markup
                            valido. E' la stessa pillola, disegnata. */}
                        <span className="btn btn-p btn-sm mt-4 self-start">
                          {c.azione}
                          <span className="dot" aria-hidden="true">
                            &rarr;
                          </span>
                        </span>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== 3. COMPONI LA SETTIMANA ====================
          Il meccanismo del sito in una figura sola: sette giorni per due
          pasti, due caselle piene e dodici da riempire. Si capisce guardando,
          non leggendo. Tutta l'anteprima e' cliccabile e porta dove porta il
          bottone: un'azione sola, due superfici. */}
      <section className="fascia fascia-corta fascia-carta">
        <div className="wrap">
          <Reveal className="shell">
            <div className="core p-4 sm:p-7 md:p-9">
              <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 md:gap-y-5">
                <div>
                  <h2 className="h2">Componi la tua settimana.</h2>
                </div>
                <Link href="/settimana" className="btn btn-p">
                  Vai alla tua settimana
                  <span className="dot" aria-hidden="true">
                    &rarr;
                  </span>
                </Link>
              </div>

              <Link
                href="/settimana"
                aria-label="Apri la tua settimana e riempi le caselle"
                className="mt-5 block md:mt-7"
              >
                {/* Sotto md restano due giorni, non sette: a sette colonne
                    su 390px una casella varrebbe 44px e i nomi andrebbero a
                    capo cinque volte. La colonna delle etichette invece resta
                    a ogni larghezza - senza, le due righe sono due file di
                    scatole e nessuno sa che sono pranzo e cena. */}
                <div className="grid grid-cols-[46px_repeat(2,minmax(0,1fr))] gap-2 md:grid-cols-[58px_repeat(7,minmax(0,1fr))]">
                  <span aria-hidden="true" />
                  {GIORNI.map((g, i) => (
                    <span key={g} className={`dayhead ${i > 1 ? "hidden md:block" : ""}`}>
                      {NOMI_GIORNO[g]}
                    </span>
                  ))}

                  <span className="rowlab">Pranzo</span>
                  {GIORNI.map((g, i) => (
                    <div key={g} className={i > 1 ? "hidden md:flex" : "flex"}>
                      <CasellaEsempio dentro={CASELLE[i][0]} />
                    </div>
                  ))}

                  <span className="rowlab">Cena</span>
                  {GIORNI.map((g, i) => (
                    <div key={g} className={i > 1 ? "hidden md:flex" : "flex"}>
                      <CasellaEsempio dentro={CASELLE[i][1]} />
                    </div>
                  ))}
                </div>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ======================= 4. SCRIVI A MATTEO =======================
          Chiusura su fascia INCHIOSTRO, corta: lo stacco forte prima del
          footer e l'unica azione che al committente serve davvero, perche'
          /richiesta raccoglie nome, telefono e comune prima di aprire
          WhatsApp. Il testo sta direttamente sullo scuro, quindi la sezione
          porta .on-ink: i colori li ribalta la marcatura, non il markup. Il
          bottone e' .btn-s, bianco pieno con testo inchiostro; .btn-p qui
          sarebbe inchiostro su inchiostro. */}
      <Reveal as="section" className="fascia fascia-corta fascia-ink on-ink">
        <div className="wrap flex flex-wrap items-end justify-between gap-x-10 gap-y-6 md:gap-y-8">
          <div>
            <h2 className="h2">Ti risponde Matteo.</h2>
            <p className="lead mt-3.5 max-w-[28ch] md:mt-5">
              Nome, telefono e comune. Poi si apre la chat.
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 md:gap-5">
            <Link href="/richiesta" className="btn btn-s">
              Scrivi a Matteo
              <span className="dot" aria-hidden="true">
                &rarr;
              </span>
            </Link>
            {/* Il rimando breve alle due pagine che dalla home sono uscite.
                I due link sono in linea nella frase ma portano il loro
                bersaglio: da testo puro erano alti 13px, cioe' un terzo di
                dito. min-h-[44px] con inline-flex li porta alla misura giusta
                senza toglierli dalla riga. */}
            <p className="note flex flex-wrap items-center gap-x-2">
              <span>Prima:</span>
              <Link
                href="/come-funziona"
                className="inline-flex min-h-[44px] items-center underline underline-offset-4"
              >
                come funziona
              </Link>
              <span aria-hidden="true">&middot;</span>
              <Link
                href="/chi-e-matteo"
                className="inline-flex min-h-[44px] items-center underline underline-offset-4"
              >
                chi siamo
              </Link>
            </p>
          </div>
        </div>
      </Reveal>
    </>
  );
}
