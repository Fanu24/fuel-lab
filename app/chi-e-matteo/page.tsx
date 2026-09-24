import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Ticker from "@/components/Ticker";
import { Chip } from "@/components/ui";
import StrisciaCucina from "@/components/chi-e-matteo/StrisciaCucina";
import { PIATTI } from "@/lib/catalogo";

export const metadata: Metadata = {
  title: "Chi siamo",
  description:
    "FUEL LAB, fondata da Matteo Pantanè a Pescara. Meal prep fresco due volte a settimana, mai surgelato, cucinato sui macro della tua scheda.",
};

function foto(id: string, w = 1200): string {
  return `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;
}

const CIFRE: { cifra: string; etichetta: string; testo: string }[] = [
  {
    cifra: "12",
    etichetta: "Anni in cucina",
    testo: "Dal lavaggio pentole al pass, senza uscire dalla cucina vera.",
  },
  {
    cifra: "2",
    etichetta: "Cotture a settimana",
    testo: "Lunedì e giovedì. Il calendario non cambia, nemmeno ad agosto.",
  },
  {
    cifra: String(PIATTI.length),
    etichetta: "Piatti in rotazione",
    testo: "Sei piatti già composti. Il menu si muove con la stagione, i macro della scheda no.",
  },
  {
    cifra: "4",
    etichetta: "Giorni di freschezza",
    testo: "Dal nostro frigo al tuo. Il quinto giorno non esiste.",
  },
];

function Cifra({
  cifra,
  etichetta,
  testo,
  lime = false,
}: {
  cifra: string;
  etichetta: string;
  testo: string;
  lime?: boolean;
}) {
  return (
    <div
      className="flex h-full flex-col p-5 md:p-7"
      style={lime ? { background: "var(--color-lime)" } : { background: "var(--color-card)" }}
    >
      <span
        className="block font-mono leading-[.82] text-[clamp(40px,8vw,64px)]"
        style={{ fontVariationSettings: '"wdth" 75, "wght" 700', color: "var(--color-ink)" }}
      >
        {cifra}
      </span>
      <span className="note mt-3 block" style={lime ? { color: "rgba(6,23,16,.68)" } : undefined}>
        {etichetta}
      </span>
      <p
        className="mt-3 max-w-[28ch] text-[16px] leading-[1.5]"
        style={{ color: lime ? "rgba(6,23,16,.78)" : "var(--color-muted)" }}
      >
        {testo}
      </p>
    </div>
  );
}

function Nega({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <i className="mt-[9px] block h-[7px] w-[7px] flex-none rotate-45 bg-lime" aria-hidden="true" />
      <span className="max-w-[52ch] text-[16px] leading-[1.5] text-ink md:text-[17px]">{children}</span>
    </li>
  );
}

export default function ChiSiamo() {
  return (
    <>
      <section className="fascia fascia-t fascia-carta">
        <div className="wrap">
          <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
            <div>
              <p className="note mb-4">Pescara e provincia</p>
              <h1 className="h1">Chi siamo</h1>
              <p className="mt-4 font-disp text-[clamp(22px,4.2vw,36px)] leading-[1.05] uppercase text-ink md:mt-5">
                Fondata da Matteo
              </p>
              <p className="lead mt-5 md:mt-7">
                Laboratorio di meal prep a Pescara. Cuciniamo freschi due volte a settimana, sui
                macro della tua scheda. Mai surgelati.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 md:mt-7">
                <Chip accento>Fondata da Matteo Pantan&egrave;</Chip>
                <Chip>In cucina dal 2014</Chip>
                <Chip>Cuochi, non nutrizionisti</Chip>
              </div>
            </div>

            <figure className="shell">
              <div className="core foto-profondita aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto("photo-1556910103-1c02745aae4d", 1100)}
                  alt="Cucina di FUEL LAB durante la preparazione dei pasti"
                  fetchPriority="high"
                  decoding="async"
                  className="h-full w-full object-cover"
                  style={{ objectPosition: "center 40%" }}
                />
              </div>
            </figure>
          </div>
        </div>
      </section>

      <section className="fascia fascia-guscio">
        <div className="wrap">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
            <Reveal>
              <h2 className="h2">
                Un laboratorio,
                <br />
                non un brand.
              </h2>
            </Reveal>
            <div className="flex flex-col gap-6 md:gap-8">
              <Reveal>
                <p className="max-w-[56ch] text-[16px] leading-[1.6] text-ink md:text-[17.5px] md:leading-[1.7]">
                  FUEL LAB nasce da Matteo Pantan&egrave;, cuoco a Pescara da dodici anni. L&rsquo;idea
                  non &egrave; arrivata da un piano industriale: &egrave; arrivata in palestra, davanti a un
                  contenitore di pollo lesso e riso in bianco seguito alla lettera. I numeri c&rsquo;erano.
                  Il mestiere no.
                </p>
              </Reveal>
              <Reveal delay={80}>
                <p className="max-w-[56ch] text-[16px] leading-[1.6] text-ink md:text-[17.5px] md:leading-[1.7]">
                  Cuciniamo il luned&igrave; e il gioved&igrave; e consegniamo in giornata. Niente
                  abbattitore, niente scorte da tre mesi: quello che esce dalla cucina ha quattro
                  giorni di frigo davanti, poi finisce. Resta su Pescara e provincia perch&eacute; oltre
                  i quaranta minuti di furgone il vantaggio sparisce.
                </p>
              </Reveal>
              <Reveal delay={120}>
                <div className="shell">
                  <div className="core px-5 py-6 md:px-8 md:py-8">
                    <p className="note">Quello che FUEL LAB non &egrave;</p>
                    <ul className="mt-4 flex flex-col gap-3 md:mt-5">
                      <Nega>
                        Non &egrave; una dieta. I numeri li decide il tuo nutrizionista, noi li cuciniamo.
                      </Nega>
                      <Nega>Non &egrave; un percorso, un integratore o una consulenza.</Nega>
                      <Nega>Non &egrave; un servizio nazionale: fuori dalla provincia non arriviamo.</Nega>
                      <Nega>
                        Non &egrave; cibo da palestra triste. Se non lo mangeresti a cena, abbiamo sbagliato
                        noi.
                      </Nega>
                    </ul>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="fascia fascia-carta">
        <div className="wrap">
          <Reveal>
            <h2 className="h2 mb-6 max-w-[16ch] md:mb-9">Quattro numeri, nient&rsquo;altro.</h2>
          </Reveal>
          <Reveal delay={60}>
            <div className="grid grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-4">
              {CIFRE.map((c, i) => (
                <div
                  key={c.etichetta}
                  className="overflow-hidden rounded-[var(--core-r)]"
                  style={{ boxShadow: "inset 0 0 0 1px var(--hair-soft)" }}
                >
                  <Cifra {...c} lime={i === 1} />
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <Ticker
        parole={["Fresco", "Mai surgelato", "Pescara", "Cucinato a mano", "Due volte a settimana"]}
        durata={38}
      />

      <section className="fascia fascia-guscio overflow-x-clip">
        <div className="wrap">
          <Reveal>
            <div className="mb-6 md:mb-10">
              <h2 className="h2">Dove succede.</h2>
              <p className="note mt-3 max-w-[42ch] leading-[1.7]">
                Laboratorio a Pescara, spesa il luned&igrave; mattina, consegna nelle ventiquattr&rsquo;ore
              </p>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <StrisciaCucina />
          </Reveal>
        </div>
      </section>

      <section className="fascia fascia-carta fascia-alta overflow-x-clip">
        <Reveal>
          <div className="w-full bg-lime" style={{ boxShadow: "0 40px 80px -46px rgba(223,255,62,.4)" }}>
            <figure className="wrap py-10 md:py-16">
              <blockquote>
                <p className="font-disp text-[clamp(26px,4.2vw,52px)] leading-[.94] uppercase text-ink">
                  Non vendiamo diete. Cuciniamo quello che il tuo nutrizionista ha gi&agrave; deciso.
                </p>
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 md:mt-7">
                <i className="block h-[9px] w-[9px] rotate-45 bg-ink" aria-hidden="true" />
                <span className="note" style={{ color: "rgba(6,23,16,.66)" }}>
                  Matteo Pantan&egrave;, fondatore
                </span>
              </figcaption>
            </figure>
          </div>
        </Reveal>
      </section>

      <section className="fascia fascia-ink">
        <div className="wrap">
          <Reveal>
            <div className="shell">
              <div className="core relative grid gap-7 px-[22px] py-[28px] md:gap-12 md:px-[54px] md:py-[54px] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div className="relative">
                  <h2 className="h2">
                    La tua scheda
                    <br />
                    diventa il tuo menu.
                  </h2>
                  <p className="lead mt-4 md:mt-6">
                    Carica il PDF del nutrizionista o scrivi i numeri a mano. La settimana si
                    compone sui tuoi macro, poi la cuciniamo il luned&igrave; o il gioved&igrave;.
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
                    Guarda il menu
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
