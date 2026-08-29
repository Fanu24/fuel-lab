import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { Eyebrow, Rise } from "@/components/ui";
import { PRIMI, SECONDI, elementoImg } from "@/lib/catalogo";
import type { Elemento } from "@/lib/catalogo";
import { getServizio } from "@/lib/servizi";
import type { Prezzo, ServizioId } from "@/lib/servizi";
import { GIORNI, NOMI_GIORNO } from "@/lib/settimana";
import stili from "@/components/home/home.module.css";

export const metadata: Metadata = {
  title: "Mangia come ti alleni",
  description:
    "Meal prep fresco a Pescara, mai surgelato. Primi, secondi ed extra con i macro dichiarati su ogni elemento, cucinati il lunedì e il giovedì. Il menu della settimana, il piano sui tuoi macro, o Matteo che cucina dentro casa tua.",
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

/* La home non conosce nessun URL di immagine: pesca dal catalogo e basta. Il
   menu cambia ogni settimana, quindi tutto quello che segue regge anche se il
   catalogo si accorcia. */
const eroe: Elemento | undefined = SECONDI[0];

/* LE FOTO NON SONO UNICHE PER ELEMENTO, ed e' il tranello del catalogo:
   PRIMI[i] e SECONDI[i] ereditano la stessa foto dai 27 piatti di partenza.
   L'anteprima vecchia prendeva PRIMI[0] accanto a SECONDI[0] e mostrava due
   volte la stessa scodella, una nell'eroe e una nella card grande. Qui la
   vetrina si costruisce scartando le foto gia' in pagina invece di fidarsi
   degli indici; la coda sul catalogo intero e' la rete di sicurezza per il
   giorno in cui i primi quattro nomi non bastassero piu'. */
function vetrina(quanti: number, gia: string[]): Elemento[] {
  const viste = new Set(gia);
  const scelti: Elemento[] = [];
  for (const e of [PRIMI[1], SECONDI[2], PRIMI[3], SECONDI[4], ...PRIMI, ...SECONDI]) {
    if (!e || viste.has(e.img)) continue;
    viste.add(e.img);
    scelti.push(e);
    if (scelti.length === quanti) break;
  }
  return scelti;
}
const VETRINA = vetrina(4, eroe ? [eroe.img] : []);

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
    riga: "Primi, secondi ed extra con i macro scritti sopra ognuno: il pasto lo componi tu.",
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

/** "8,90 €": la virgola italiana e il simbolo, mai un totale. */
function soglia(valore: number): string {
  return `${valore.toFixed(2).replace(".", ",")} €`;
}

/* Il prezzo nella stessa scocca .price del resto del sito. E' l'unico posto
   della home in cui compare un numero in euro, ed e' la soglia d'ingresso:
   l'home cooking non ne ha una e dice "Su preventivo", senza nessuna cifra. */
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
   punto - la griglia si legge come una scheda da riempire, non come un
   listino - e i nomi dentro le due caselle piene sono elementi veri del
   catalogo, non testo finto. */
function cella(...e: (Elemento | undefined)[]): Elemento[] {
  return e.filter((x): x is Elemento => x !== undefined);
}
const CASELLE: [Elemento[], Elemento[]][] = GIORNI.map((_, i) => {
  if (i === 0) return [cella(PRIMI[5], SECONDI[0]), []];
  if (i === 3) return [[], cella(PRIMI[3], SECONDI[2])];
  return [[], []];
});

function CasellaEsempio({ dentro }: { dentro: Elemento[] }) {
  if (dentro.length === 0) {
    /* Niente .cell-empty: quella classe accende il lime al passaggio del
       mouse, e qui prometterebbe un bottone dove c'e' un'anteprima. */
    return (
      <div className="cell w-full items-center justify-center text-[20px] font-light text-muted">
        <span aria-hidden="true">+</span>
        <span className="sr-only">casella libera</span>
      </div>
    );
  }
  const kcal = dentro.reduce((s, e) => s + e.kcal, 0);
  return (
    <div className="cell cell-full w-full">
      {dentro.map((e) => (
        <p key={e.id} className="cell-d">
          {e.nome}
        </p>
      ))}
      <p className="cell-k">{kcal} kcal</p>
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* ==================== 1. HERO + IL CIBO SUBITO ====================
          Una schermata sola per dire cosa si vende e a chi (occhiello: dove e
          ogni quanto; titolo: a chi si allena; riga sotto: cosa arriva), e
          subito sotto il cibo vero del catalogo. Nessun occhiello, nessun
          titolo e nessun paragrafo davanti alle foto: la riga in mono sopra
          la vetrina e' un'etichetta, non un'introduzione. */}
      <section className="relative overflow-x-clip pt-[122px] pb-14 md:pt-[136px] md:pb-16">
        <div className="wrap">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
            <div>
              <div className={`${stili.salita} mb-8`} style={{ animationDelay: "150ms" }}>
                <Eyebrow>Pescara e provincia &mdash; consegna fresca 2 volte a settimana</Eyebrow>
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
                className={`lead ${stili.salita} mt-8 max-w-[46ch]`}
                style={{ animationDelay: "900ms" }}
              >
                Primi e secondi cucinati freschi sui tuoi macro, a casa tua il luned&igrave; e il
                gioved&igrave;. Mai surgelati.
              </p>

              <div className={`${stili.salita} mt-8`} style={{ animationDelay: "1020ms" }}>
                <Link href="/menu" className="btn btn-p">
                  Sfoglia il menu
                  <span className="dot" aria-hidden="true">
                    &rarr;
                  </span>
                </Link>
              </div>
            </div>

            {eroe ? (
              <figure
                className={`shell ${stili.scatto} relative mx-auto w-[280px] max-w-full sm:w-[340px] lg:mx-0 lg:h-[384px] lg:w-full`}
              >
                <div className="core aspect-[4/5] lg:aspect-auto lg:h-full">
                  {/* Unica immagine non lazy della pagina, ed e' voluto: e'
                      l'LCP. Mandarla in lazy sposterebbe in avanti il primo
                      contenuto utile invece di alleggerire la pagina. */}
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
                  aria-label="FUEL LAB — fresco, mai surgelato, Pescara"
                  className={`${stili.timbro} absolute right-[-18px] bottom-[-24px] h-[104px] w-[104px] lg:right-auto lg:bottom-[-32px] lg:left-[-42px] lg:h-[122px] lg:w-[122px]`}
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

          {/* ---- la vetrina: quattro elementi veri, nella stessa schermata ---- */}
          {VETRINA.length > 0 ? (
            <div className="mt-12 md:mt-14">
              <Reveal className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <p className="note">
                  Questa settimana in cucina &middot; {PRIMI.length} primi &middot;{" "}
                  {SECONDI.length} secondi
                </p>
                <p className="note">Mai un piatto gi&agrave; chiuso</p>
              </Reveal>

              <div className="mt-5 grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-4">
                {VETRINA.map((e, i) => (
                  <Reveal key={e.id} delay={i * 80} className="h-full">
                    <Link
                      href="/menu"
                      aria-label={`${e.nome}, ${e.categoria === "primo" ? "primo" : "secondo"} da ${e.kcal} kcal: sfoglia il menu`}
                      className="shell group block h-full transition-transform duration-500 hover:-translate-y-1.5"
                      style={{ transitionTimingFunction: "var(--e-over)" }}
                    >
                      <div className="core flex h-full flex-col">
                        <figure className="relative aspect-[3/2] overflow-hidden bg-tray">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={elementoImg(e, 640)}
                            alt={e.nome}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.06]"
                            style={{ transitionTimingFunction: "var(--e-out)" }}
                          />
                          <span className="chip chip-k absolute top-3 left-3 uppercase">
                            {e.categoria === "primo" ? "Primo" : "Secondo"}
                          </span>
                        </figure>
                        <div className="flex flex-1 flex-col p-4 sm:p-5">
                          <p className="h3 !text-[17px] sm:!text-[19px]">{e.nome}</p>
                          <p className="mono mt-auto pt-3 text-[10.5px] text-muted">
                            {e.kcal} kcal &middot; P {e.proteine} &middot; C {e.carboidrati}{" "}
                            &middot; G {e.grassi}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          ) : null}
        </div>
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
            className={`${stili.fasciaIn} grid gap-3 py-7 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center md:gap-[26px] md:py-8`}
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
              <br className="hidden md:block" /> su primi e secondi
            </p>
          </div>
        </div>
      </section>

      {/* ======================== 2. I TRE SERVIZI ========================
          Guscio: la superficie cambia subito dopo la fascia lime, cosi il
          confine si vede senza contare il vuoto. Tre carte pari, un'azione
          per carta, nessun paragrafo introduttivo. */}
      <section className="fascia fascia-guscio">
        <div className="wrap">
          <Reveal className="mb-9 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <h2 className="h2">Tre modi di mangiare bene.</h2>
            <p className="note">Il prezzo esatto lo definiamo insieme su WhatsApp</p>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-3 md:gap-6">
            {CARTE.map((c, i) => {
              const s = getServizio(c.id);
              return (
                <Reveal key={c.id} delay={i * 90} className="h-full">
                  <Link
                    href={c.href}
                    aria-label={`${s.nome}: ${c.azione}`}
                    className="shell block h-full transition-transform duration-500 hover:-translate-y-1.5"
                    style={{
                      transitionTimingFunction: "var(--e-over)",
                      ...(c.lime ? { background: "var(--color-lime)" } : null),
                    }}
                  >
                    <div
                      className="core flex h-full flex-col p-6 sm:p-7"
                      style={c.lime ? { background: "var(--color-lime)" } : undefined}
                    >
                      <span className={c.lime ? "num num-ink" : "num num-lime"}>{s.numero}</span>
                      <h3 className={`h3 mt-5 !text-[23px] ${c.lime ? "text-ink" : ""}`}>
                        {s.nome}
                      </h3>
                      <p
                        className={`mt-3 flex-1 text-[14.5px] leading-[1.55] ${c.lime ? "" : "text-muted"}`}
                        style={c.lime ? { color: SU_LIME } : undefined}
                      >
                        {c.riga}
                      </p>

                      <div className="mt-6">
                        <PrezzoBreve prezzo={s.prezzo} suLime={c.lime} />
                      </div>
                      {/* Non e' un <button>: sta dentro un link, e un
                          interattivo dentro un interattivo non e' markup
                          valido. E' la stessa pillola, disegnata. */}
                      <span className="btn btn-p btn-sm mt-5 self-start">
                        {c.azione}
                        <span className="dot" aria-hidden="true">
                          &rarr;
                        </span>
                      </span>
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
            <div className="core p-5 sm:p-7 md:p-9">
              <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
                <div>
                  <h2 className="h2">Componi la tua settimana.</h2>
                  <p className="note mt-4">
                    Sette giorni, quattordici caselle: un primo, un secondo e gli extra in ognuna
                  </p>
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
                className="mt-7 block"
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
        <div className="wrap flex flex-wrap items-end justify-between gap-x-10 gap-y-8">
          <div>
            <p className="note">
              Pescara e provincia &middot; consegna il luned&igrave; e il gioved&igrave;
            </p>
            <h2 className="h2 mt-5">
              Il prezzo esatto
              <br />
              te lo dice Matteo.
            </h2>
            <p className="lead mt-5">
              Lasci nome, telefono e comune: ti risponde lui su WhatsApp, con il piano della
              settimana e il preventivo.
            </p>
          </div>

          <div className="flex flex-col items-start gap-5">
            <Link href="/richiesta" className="btn btn-s">
              Scrivi a Matteo
              <span className="dot" aria-hidden="true">
                &rarr;
              </span>
            </Link>
            {/* Il rimando breve alle due pagine che dalla home sono uscite. */}
            <p className="note">
              Prima:{" "}
              <Link href="/come-funziona" className="underline underline-offset-4">
                come funziona
              </Link>{" "}
              &middot;{" "}
              <Link href="/chi-e-matteo" className="underline underline-offset-4">
                chi &egrave; Matteo
              </Link>
            </p>
          </div>
        </div>
      </Reveal>
    </>
  );
}
