import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { FOTO } from "@/lib/immagini";

/* La palestra apre la pagina, la cucina la tiene in piedi. Subito dopo i
   consigli per allenamento, questa sezione dice da dove arriva il cibo:
   ingredienti freschi, cotture vere, porzioni pesate. Tre foto a mosaico
   sulla carta, perche' il cibo si guarda meglio sul chiaro. */

const PRINCIPI = [
  { n: "01", titolo: "Spesa del mattino", testo: "Si compra il giorno della cottura. Niente magazzino, niente surgelato." },
  { n: "02", titolo: "Cotture vere", testo: "Padella, forno e bassa temperatura: il sapore resta, i valori pure." },
  { n: "03", titolo: "Pesato al grammo", testo: "Ogni porzione ha i suoi macro scritti sopra. Quelli che leggi sono quelli che mangi." },
];

export default function LaCucina() {
  return (
    <section className="sezione">
      <div className="wrap grid items-center gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <Reveal className="grid grid-cols-5 grid-rows-[auto_auto] gap-3 md:gap-4">
          <div className="smusso relative col-span-3 row-span-2 aspect-[3/4] overflow-hidden bg-paper-2">
            <Image
              src={FOTO.tagliere.src}
              alt={FOTO.tagliere.alt}
              fill
              sizes="(min-width: 1024px) 32vw, 60vw"
              className="object-cover"
            />
          </div>
          <div className="relative col-span-2 aspect-square overflow-hidden bg-night">
            <Image src={FOTO.ciotola.src} alt={FOTO.ciotola.alt} fill sizes="(min-width: 1024px) 20vw, 40vw" className="object-cover" />
          </div>
          <div className="relative col-span-2 aspect-square overflow-hidden bg-paper-2">
            <Image src={FOTO.bowl.src} alt={FOTO.bowl.alt} fill sizes="(min-width: 1024px) 20vw, 40vw" className="object-cover" />
          </div>
        </Reveal>

        <div>
          <Reveal>
            <p className="occhiello">La cucina</p>
            <h2 className="titolo mt-5 max-w-[13ch]">
              Cucina sana. <span className="evidenzia">Non triste.</span>
            </h2>
            <p className="lead mt-6">
              Dietro ogni schiscetta c&apos;è un cuoco, non una linea di produzione. Matteo cucina due volte a
              settimana, come faresti tu se avessi il tempo: è questo il meal prep a Pescara di FUEL LAB.
            </p>
          </Reveal>
          <ul className="mt-10 grid gap-6">
            {PRINCIPI.map((p, i) => (
              <Reveal as="li" key={p.n} delay={i * 80} className="grid grid-cols-[44px_1fr] gap-4 border-t border-ink/15 pt-5">
                <span className="num text-sm text-muted">{p.n}</span>
                <span>
                  <span className="block font-disp text-lg font-bold tracking-[.04em] uppercase">{p.titolo}</span>
                  <span className="mt-1 block text-muted">{p.testo}</span>
                </span>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={260} className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
            <Link href="/chi-e-matteo" className="link inline-block">
              Chi c&apos;è ai fornelli
            </Link>
            <Link href="/meal-prep-pescara" className="link inline-block">
              Il meal prep a Pescara, passo per passo
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
