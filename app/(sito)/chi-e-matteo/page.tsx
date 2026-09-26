import type { Metadata } from "next";
import Image from "next/image";
import Reveal from "@/components/Reveal";
import FotoPiena from "@/components/ui/FotoPiena";
import ChiusuraCta from "@/components/home/ChiusuraCta";
import { PIATTI } from "@/lib/catalogo";
import { FOTO, RITRATTO_MATTEO } from "@/lib/immagini";

export const metadata: Metadata = {
  title: "Chi è Matteo",
  description:
    "Matteo Pantanè, cuoco a Pescara dal 2014. FUEL LAB è nato in palestra, davanti a un contenitore di pollo lesso e riso in bianco.",
};

/* SEGNAPOSTO DICHIARATO: la storia e i numeri vanno confermati con Matteo, e
   la foto e' di repertorio finche' RITRATTO_MATTEO in lib/immagini e' null.
   La struttura resta: ritratto, storia, numeri, cosa FUEL LAB non e'. */

const CIFRE = [
  { cifra: "2014", etichetta: "In cucina dal" },
  { cifra: "2", etichetta: "Cotture a settimana" },
  { cifra: String(PIATTI.length), etichetta: "Piatti in rotazione" },
  { cifra: "4", etichetta: "Giorni di freschezza" },
];

const NON_E = [
  "Non è una dieta. I numeri li decide il tuo nutrizionista, Matteo li cucina.",
  "Non è un integratore, un percorso o una consulenza.",
  "Non è cibo da palestra triste. Se non lo mangeresti a cena, ha sbagliato lui.",
];

export default function ChiEMatteo() {
  const ritratto = RITRATTO_MATTEO ?? FOTO.cuoco;
  return (
    <>
      <section className="testata">
        <div className="wrap grid items-end gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <p className="occhiello">Chi è Matteo</p>
            <h1 className="titolo-xl mt-6">Matteo.</h1>
            <p className="titolo-s mt-4 text-muted">Cuoco. In cucina dal 2014.</p>
            <p className="lead mt-8">
              FUEL LAB è il laboratorio di Matteo Pantanè a Pescara: cucina fresca due volte a settimana per chi si
              allena, con i macro scritti su ogni piatto.
            </p>
          </div>
          <figure className="smusso relative aspect-[4/5] overflow-hidden bg-paper-2">
            <Image
              src={ritratto.src}
              alt={ritratto.alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              loading="eager"
              fetchPriority="high"
              className="object-cover"
            />
          </figure>
        </div>
      </section>

      <section className="sezione">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <blockquote className="titolo max-w-[12ch]">
              I numeri c&apos;erano. <span className="evidenzia">Il mestiere no.</span>
            </blockquote>
          </Reveal>
          <Reveal delay={80} className="grid gap-6 text-lg leading-relaxed">
            <p>
              L&apos;idea non è arrivata da un piano industriale. È arrivata in palestra, davanti a un contenitore di
              pollo lesso e riso in bianco, seguito alla lettera: i macro tornavano, ma mangiarlo era una punizione.
            </p>
            <p>
              Matteo cucina il lunedì e il giovedì e consegna in giornata. Niente abbattitore, niente scorte da tre
              mesi: quello che esce dalla cucina ha quattro giorni di frigo davanti, poi finisce. Per questo resta su
              Pescara e provincia.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="notte relative overflow-hidden">
        <FotoPiena foto="presa" velo="forte" />
        <div className="wrap relative py-[var(--sezione)]">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {CIFRE.map((c, i) => (
              <Reveal key={c.etichetta} delay={i * 70} className="border-t-[3px] border-lime pt-5">
                <dt className="occhiello">{c.etichetta}</dt>
                <dd className="num mt-4 text-[clamp(48px,7vw,96px)] leading-none font-medium">{c.cifra}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      <section className="sezione">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <p className="occhiello">Per essere chiari</p>
            <h2 className="titolo mt-5 max-w-[12ch]">Cosa FUEL LAB non è.</h2>
          </Reveal>
          <ul>
            {NON_E.map((t, i) => (
              <Reveal
                as="li"
                key={t}
                delay={i * 70}
                className="flex gap-5 border-b border-ink/15 py-6 text-lg"
              >
                <span className="num text-muted">0{i + 1}</span>
                <span>{t}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <ChiusuraCta titolo="Conosci Matteo. Poi assaggia." />
    </>
  );
}
