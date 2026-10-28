import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { FOTO } from "@/lib/immagini";

const SCATTI = [FOTO.piattoMatteo, FOTO.polpetteMatteo, FOTO.tagliataMatteo, FOTO.doratoMatteo, FOTO.dolceMatteo];

export default function GalleriaCucina() {
  return (
    <section className="sezione notte">
      <div className="wrap">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="titolo max-w-[16ch]">Dalla sua cucina.</h2>
          <Link href="/menu" className="link text-lime">Guarda il menu <span aria-hidden="true">→</span></Link>
        </Reveal>
        <div className="mt-10 grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
          {SCATTI.map((foto, index) => (
            <Reveal as="figure" key={foto.src} delay={(index % 3) * 70} className={index === 0 ? "col-span-2 lg:row-span-2" : ""}>
              <div className={`smusso relative overflow-hidden bg-night-2 ${index === 0 ? "aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[420px]" : "aspect-[4/3]"}`}>
                <Image src={foto.src} alt={foto.alt} fill sizes={index === 0 ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"} className="object-cover" style={{ objectPosition: foto.fuoco }} />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
