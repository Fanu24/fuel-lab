import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Ticker from "@/components/Ticker";
import { Chip, Eyebrow, Rise } from "@/components/ui";
import StrisciaCucina from "@/components/chi-e-matteo/StrisciaCucina";
import { DISHES } from "@/lib/dishes";

export const metadata: Metadata = {
  title: "Matteo Pantane, il cuoco",
  description:
    "Matteo Pantane, cuoco a Pescara. La storia di Fuel, la scelta del fresco contro il surgelato e i numeri della cucina che prepara i box.",
};

/** Le foto non legate a un piatto. Stessa firma di dishImg(), id gia verificati altrove. */
function foto(id: string, w = 1000): string {
  return `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;
}

/* -------------------------------------------------------------------------
   Blocco di racconto. La misura resta bloccata a 56ch: piu larga di cosi
   il testo smette di essere leggibile e diventa un muro.
   ------------------------------------------------------------------------- */
function Blocco({
  indice,
  occhiello,
  className = "",
  children,
}: {
  indice: string;
  occhiello: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <div className="mb-5 flex items-center gap-3">
        <span
          className="font-mono text-[11px] tracking-[.06em] text-lime"
          style={{ fontVariationSettings: '"wdth" 84' }}
        >
          {indice}
        </span>
        <span
          className="block h-px w-[38px]"
          style={{ background: "var(--hair)" }}
          aria-hidden="true"
        />
        <span className="note">{occhiello}</span>
      </div>
      <p className="max-w-[56ch] text-[17px] leading-[1.74] text-mist">{children}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Cella numerica. Quando e' lime lo sono fondo E nucleo: l'accento vive in
   blocchi pieni, mai come bordino.
   ------------------------------------------------------------------------- */
function Numero({
  cifra,
  etichetta,
  testo,
  posizione = "",
  rotazione = "",
  lime = false,
  grande = false,
  ritardo = 0,
}: {
  cifra: string;
  etichetta: string;
  testo: ReactNode;
  posizione?: string;
  rotazione?: string;
  lime?: boolean;
  grande?: boolean;
  ritardo?: number;
}) {
  return (
    <Reveal className={posizione} delay={ritardo}>
      {/* la rotazione sta qui dentro e non su Reveal: la rivelazione azzera il
          transform dell'elemento che anima, e si porterebbe via l'inclinazione */}
      <div
        className={`shell h-full transition-transform duration-700 md:hover:rotate-0 ${rotazione}`}
        style={{
          transitionTimingFunction: "var(--e-over)",
          // Sotto un blocco lime l'ombra nera del guscio sporca l'accento: in questo
          // sistema il pieno lime irradia lime (come .btn-p), non proietta buio.
          ...(lime
            ? {
                background: "var(--color-lime)",
                borderColor: "transparent",
                boxShadow: "0 38px 76px -42px rgba(223,255,62,.42)",
              }
            : null),
        }}
      >
        <div
          className="core h-full px-[26px] pt-[22px] pb-[26px] md:px-[30px] md:pt-[26px] md:pb-[30px]"
          style={lime ? { background: "var(--color-lime)" } : undefined}
        >
          {/* I numeri di questo sito stanno in mono, sempre: sono dati, non insegne.
              Anton li faceva leggere come un titolo e staccava questa pagina da tutte
              le altre. Le misure sono ricalate: il mono e' molto piu largo del display. */}
          <span
            className={`block font-mono leading-[.82] ${
              grande ? "text-[clamp(64px,9.4vw,124px)]" : "text-[clamp(52px,6.6vw,86px)]"
            }`}
            style={{
              fontVariationSettings: '"wdth" 75, "wght" 700',
              color: lime ? "var(--color-ink)" : "#fff",
            }}
          >
            {cifra}
          </span>
          <span
            className="note mt-5 block"
            style={lime ? { color: "rgba(6,23,16,.68)" } : undefined}
          >
            {etichetta}
          </span>
          <p
            className="mt-3 max-w-[34ch] text-[14.5px] leading-[1.6]"
            style={{ color: lime ? "rgba(6,23,16,.78)" : "var(--color-mist-dim)" }}
          >
            {testo}
          </p>
        </div>
      </div>
    </Reveal>
  );
}

/** Riga della lista "quello che Fuel non e'": rombo lime + misura corta. */
function Nega({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-[14px]">
      <i className="mt-[9px] block h-[7px] w-[7px] flex-none rotate-45 bg-lime" aria-hidden="true" />
      <span className="max-w-[52ch] text-[16px] leading-[1.62] text-mist">{children}</span>
    </li>
  );
}

export default function ChiEMatteo() {
  return (
    <>
      {/* ---------------- testata editoriale ---------------- */}
      <section className="relative overflow-x-clip pt-[150px] pb-[104px] lg:pt-[178px] lg:pb-[132px]">
        <div className="wrap">
          <div className="grid items-start gap-16 lg:grid-cols-[minmax(0,1fr)_386px] lg:gap-20">
            <div>
              <Eyebrow className="mb-[44px]">Il cuoco</Eyebrow>
              <h1 className="h1">
                <Rise i={0}>Matteo</Rise>
                <Rise i={1}>
                  <span className="hl">Pantane.</span>
                </Rise>
              </h1>

              {/* il lead entra dopo che le due righe del titolo sono salite, non
                  insieme: fuel-rise qui non va, perche senza la maschera di .ln
                  il paragrafo slitterebbe sopra il titolo */}
              <Reveal delay={420}>
                <p className="lead mt-12">
                  Dodici anni di cucina professionale, un furgone e due cotture a settimana. Fuel
                  &egrave; la risposta a un problema che ho visto in palestra, non un piano
                  industriale.
                </p>
                <div className="mt-9 flex flex-wrap gap-[10px]">
                  <Chip accento>Pescara e provincia</Chip>
                  <Chip>In cucina dal 2014</Chip>
                  <Chip>Cuoco, non nutrizionista</Chip>
                </div>
              </Reveal>
            </div>

            <figure className="relative mx-auto w-full max-w-[386px] lg:mt-3">
              <div
                className="shell transition-transform duration-700 md:rotate-[-2.4deg] md:hover:rotate-0 md:hover:scale-[1.015]"
                style={{ transitionTimingFunction: "var(--e-over)" }}
              >
                <div className="core aspect-[4/5]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={foto("photo-1414235077428-338989a2e8c0", 860)}
                    alt="Matteo al passo di una cucina professionale mentre impiatta"
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                    style={{ objectPosition: "center 42%" }}
                  />
                </div>
              </div>

              {/* Il cartellino esce dal guscio: e' l'elemento che rompe la griglia.
                  Il raggio e' quello del nucleo, non un 14px inventato: lo shape
                  lock vale anche per i pezzi che stanno fuori dalla scocca. */}
              <figcaption
                className="absolute -bottom-7 left-2 px-[18px] pt-[14px] pb-[12px] md:-left-9 md:rotate-[-6deg]"
                style={{ background: "var(--color-lime)", borderRadius: "var(--core-r)" }}
              >
                <span
                  className="block font-disp text-[25px] leading-none uppercase"
                  style={{ color: "var(--color-ink)" }}
                >
                  Pescara
                </span>
                <span className="note mt-[7px] block" style={{ color: "rgba(6,23,16,.66)" }}>
                  Consegna in giornata
                </span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ---------------- il racconto ----------------
          NOTA REDAZIONALE (non va in pagina): i tre blocchi qui sotto e la lista
          "quello che Fuel non e'" sono segnaposto. Vanno riscritti con Matteo,
          numeri e date compresi, prima di andare online. Un cliente che apre il
          sito non deve leggere gli appunti di lavorazione. */}
      <section className="pb-[120px] lg:pb-[150px]">
        <div className="wrap">
          <div className="grid gap-14 lg:grid-cols-[286px_minmax(0,1fr)] lg:gap-20">
            <div className="lg:sticky lg:top-[132px] lg:self-start">
              <Reveal>
                <Eyebrow className="mb-[26px]">Il racconto</Eyebrow>
                <h2 className="h2">
                  Come &egrave;
                  <br />
                  nato Fuel.
                </h2>
              </Reveal>
            </div>

            <div className="flex flex-col gap-[52px]">
              <Reveal>
                <Blocco indice="01" occhiello="Dodici anni di servizi">
                  Ho cominciato a sedici anni lavando pentole in un ristorante sul lungomare e non
                  ne sono pi&ugrave; uscito. Dodici anni tra cucina d&rsquo;albergo, bistrot e
                  banqueting: turni doppi, servizi da centocinquanta coperti, la mano che deve
                  restare identica dal primo piatto all&rsquo;ultimo. Non &egrave; un mestiere
                  romantico. Per&ograve; insegna le due cose che qui servono davvero: cucinare in
                  quantit&agrave; senza perdere il gusto e rispettare un peso al grammo,
                  perch&eacute; il piatto deve uscire sempre uguale.
                </Blocco>
              </Reveal>

              <Reveal delay={80}>
                <Blocco indice="02" occhiello="Il contenitore in palestra" className="lg:pl-[9%]">
                  L&rsquo;idea &egrave; arrivata in sala pesi, verso le sette di sera. Un amico
                  apriva il contenitore sulla panca: petto di pollo bollito, cento grammi di riso in
                  bianco, zucchine lesse. La stessa identica cosa da due mesi. La scheda del
                  nutrizionista ce l&rsquo;aveva attaccata al frigo e la seguiva alla lettera,
                  questo va detto. Solo che aveva smesso di mangiare per piacere e mangiava per
                  obbligo. Mi &egrave; sembrato uno spreco: il pezzo che gli mancava era esattamente
                  il mio mestiere.
                </Blocco>
              </Reveal>

              <Reveal delay={120}>
                <Blocco indice="03" occhiello="Fresco, e quindi locale" className="lg:pl-[4%]">
                  Cucino il luned&igrave; e il gioved&igrave; e consegno in giornata. Niente
                  abbattitore, niente magazzino, niente scorte da tre mesi: quello che esce dalla
                  cucina ha quattro giorni di frigo davanti, poi finisce. &Egrave; una scelta scomoda
                  &mdash; mi obbliga a fare la spesa due volte a settimana e a buttare quello che
                  avanza &mdash; ma &egrave; l&rsquo;unica ragione per cui un contenitore Fuel sa di
                  cibo cucinato e non di cibo scongelato. &Egrave; anche il motivo per cui non
                  spedisco: oltre i quaranta minuti di furgone il vantaggio sparisce. Quindi resto su
                  Pescara e provincia, e va bene cos&igrave;.
                </Blocco>
              </Reveal>

              {/* questo blocco toglie promesse invece di aggiungerne: e' il pezzo
                  che rende credibile tutto il resto della pagina */}
              <Reveal delay={160}>
                <div className="shell md:rotate-[1.2deg]">
                  <div className="core px-[26px] pt-[24px] pb-[28px] md:px-[34px] md:pt-[30px] md:pb-[34px]">
                    <span className="note">Quello che Fuel non &egrave;</span>
                    <ul className="mt-6 flex flex-col gap-[14px]">
                      <Nega>
                        Non &egrave; una dieta. I numeri li decide il tuo nutrizionista, io li
                        cucino.
                      </Nega>
                      <Nega>Non &egrave; un percorso, un integratore o una consulenza.</Nega>
                      <Nega>
                        Non &egrave; un servizio nazionale: fuori dalla provincia non arrivo.
                      </Nega>
                      <Nega>
                        Non &egrave; cibo da palestra triste. Se non lo mangeresti a cena, ho
                        sbagliato io.
                      </Nega>
                    </ul>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- i numeri ---------------- */}
      <section className="overflow-x-clip pb-[120px] lg:pb-[150px]">
        <div className="wrap">
          <Reveal>
            <div className="mb-12 max-w-[620px]">
              <Eyebrow className="mb-[26px]">In numeri</Eyebrow>
              <h2 className="h2">
                Quattro numeri,
                <br />
                nient&rsquo;altro.
              </h2>
            </div>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-12 md:items-start md:gap-7">
            <Numero
              cifra="12"
              etichetta="Anni in cucina"
              testo="Dal primo lavaggio pentole al pass, senza mai uscire dalla cucina vera."
              posizione="md:col-span-5"
              rotazione="md:rotate-[-1.6deg]"
              grande
            />
            <Numero
              cifra="2"
              etichetta="Cotture a settimana"
              testo={
                <>Luned&igrave; e gioved&igrave;. Il calendario non cambia mai, nemmeno ad agosto.</>
              }
              posizione="md:col-span-4 md:col-start-8 md:mt-[62px]"
              rotazione="md:rotate-[2.1deg]"
              lime
              ritardo={90}
            />
            <Numero
              cifra={String(DISHES.length)}
              etichetta="Piatti in rotazione"
              testo="Il menu si muove con la stagione, i macro della tua scheda no."
              posizione="md:col-span-4 md:col-start-2 md:-mt-[26px]"
              rotazione="md:rotate-[1.4deg]"
              ritardo={140}
            />
            <Numero
              cifra="4"
              etichetta="Giorni di freschezza"
              testo="Dal mio frigo al tuo senza passare per il congelatore. Il quinto giorno non esiste: quello che avanza lo butto io."
              posizione="md:col-span-5 md:col-start-7 md:mt-[12px]"
              rotazione="md:rotate-[-2.2deg] md:translate-x-[18px]"
              ritardo={190}
            />
          </div>
        </div>
      </section>

      <Ticker
        parole={["Fresco", "Mai surgelato", "Pescara", "Cucinato a mano", "Due volte a settimana"]}
        durata={38}
      />

      {/* ---------------- la cucina ---------------- */}
      <section className="overflow-x-clip pt-[110px] pb-[124px] lg:pt-[140px] lg:pb-[150px]">
        <div className="wrap">
          <Reveal>
            <div className="mb-14 flex flex-wrap items-end justify-between gap-8">
              <div>
                <Eyebrow className="mb-[26px]">La cucina</Eyebrow>
                <h2 className="h2">
                  Dove
                  <br />
                  succede.
                </h2>
              </div>
              <p className="note max-w-[290px] leading-[1.7]">
                Laboratorio a Pescara &middot; spesa il luned&igrave; mattina &middot; consegna nelle
                ventiquattr&rsquo;ore
              </p>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <StrisciaCucina />
          </Reveal>
        </div>
      </section>

      {/* ---------------- la citazione ---------------- */}
      <section className="overflow-x-clip pb-[124px] lg:pb-[156px]">
        <Reveal>
          {/* lastra piu larga della pagina e ruotata, con il contenuto contro-ruotato:
              inclina il blocco senza inclinare la lettura. L'alone e' lime, non nero:
              un pieno d'accento irradia il proprio colore, non proietta buio. */}
          <div
            className="w-full bg-lime md:-ml-[6%] md:w-[112%] md:rotate-[-1.15deg]"
            style={{ boxShadow: "0 40px 80px -46px rgba(223,255,62,.4)" }}
          >
            <figure className="mx-auto w-[1180px] max-w-[calc(100%-40px)] py-[62px] md:max-w-[calc(100%/1.12_-_40px)] md:rotate-[1.15deg] md:py-[88px]">
              <blockquote>
                <p
                  className="font-disp text-[clamp(38px,6.2vw,84px)] leading-[.9] uppercase"
                  style={{ color: "var(--color-ink)", letterSpacing: "-.01em" }}
                >
                  Non vendo diete. Cucino quello che il tuo nutrizionista ha gi&agrave; deciso.
                </p>
              </blockquote>
              <figcaption className="mt-9 flex items-center gap-3">
                <i
                  className="block h-[9px] w-[9px] rotate-45"
                  style={{ background: "var(--color-ink)" }}
                  aria-hidden="true"
                />
                <span className="note" style={{ color: "rgba(6,23,16,.66)" }}>
                  Matteo Pantane &middot; cuoco
                </span>
              </figcaption>
            </figure>
          </div>
        </Reveal>
      </section>

      {/* ---------------- chiusura ---------------- */}
      <section className="pb-[132px] lg:pb-[160px]">
        <div className="wrap">
          <Reveal>
            <div className="shell">
              {/* La colonna dei bottoni parte da lg, non da md, e li impila: con
                  'auto' su due pill affiancate quella traccia si prendeva meta
                  blocco e il titolo finiva tagliato dall'overflow del nucleo. */}
              <div className="core relative grid gap-12 px-[28px] py-[38px] md:px-[54px] md:py-[54px] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                {/* stessa trama a 115 gradi delle barre macro, tenuta bassissima */}
                <span
                  className="pointer-events-none absolute inset-0"
                  aria-hidden="true"
                  style={{
                    background:
                      "repeating-linear-gradient(115deg, rgba(223,255,62,.07) 0 6px, rgba(223,255,62,0) 6px 15px)",
                  }}
                />
                <div className="relative">
                  <Eyebrow className="mb-[26px]">Il passo dopo</Eyebrow>
                  <h2 className="h2">
                    La tua scheda
                    <br />
                    diventa il tuo menu.
                  </h2>
                  <p className="lead mt-6">
                    Carica il PDF del nutrizionista o scrivi i numeri a mano. Il box si compone sui
                    tuoi macro, poi lo cucino io il luned&igrave; o il gioved&igrave;.
                  </p>
                </div>
                <div className="relative flex flex-wrap gap-3 lg:flex-col lg:items-end">
                  <Link href="/scheda" className="btn btn-p">
                    Parti dalla tua scheda
                    <span className="dot" aria-hidden="true">
                      &#8599;
                    </span>
                  </Link>
                  <Link href="/menu" className="btn btn-s">
                    Guarda i {DISHES.length} piatti
                    <span className="dot" aria-hidden="true">
                      &#8599;
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
