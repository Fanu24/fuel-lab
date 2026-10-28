import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { FOTO } from "@/lib/immagini";

export default function LaCucina() {
  return (
    <section className="sezione carta-2">
      <div className="wrap grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <Reveal className="grid grid-cols-5 gap-3 md:gap-4">
          <div className="smusso relative col-span-3 row-span-2 aspect-[3/4] overflow-hidden bg-paper-2">
            <Image src={FOTO.preparazioniMatteo.src} alt={FOTO.preparazioniMatteo.alt} fill sizes="(min-width: 1024px) 32vw, 60vw" className="object-cover" style={{ objectPosition: FOTO.preparazioniMatteo.fuoco }} />
          </div>
          <div className="relative col-span-2 aspect-square overflow-hidden">
            <Image src={FOTO.polpetteMatteo.src} alt={FOTO.polpetteMatteo.alt} fill sizes="(min-width: 1024px) 20vw, 40vw" className="object-cover" />
          </div>
          <div className="relative col-span-2 aspect-square overflow-hidden">
            <Image src={FOTO.piattoMatteo.src} alt={FOTO.piattoMatteo.alt} fill sizes="(min-width: 1024px) 20vw, 40vw" className="object-cover" />
          </div>
        </Reveal>
        <Reveal>
          <h2 className="titolo max-w-[13ch]">La cucina di Matteo.</h2>
          <Link href="/chi-siamo" className="link mt-7 inline-block">Conosci Matteo <span aria-hidden="true">→</span></Link>
        </Reveal>
      </div>
    </section>
  );
}
