import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import BollinoNonDisponibile from "@/components/impostazioni/BollinoNonDisponibile";
import { PIATTI_MENU } from "@/lib/catalogo";

export default function PiattiScelti() {
  return (
    <section className="sezione" aria-labelledby="piatti-home-titolo">
      <div className="wrap">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="piatti-home-titolo" className="titolo">Dal menu.</h2>
          <Link href="/menu" className="link">Tutti i piatti <span aria-hidden="true">→</span></Link>
        </Reveal>
        <ul className="mt-8 grid gap-5 md:grid-cols-3 md:gap-8">
          {PIATTI_MENU.slice(0, 3).map((piatto, i) => (
            <Reveal as="li" key={piatto.id} delay={i * 60}>
              <Link href={`/menu/${piatto.id}`} className="group grid grid-cols-[104px_1fr] items-center gap-4 border-t pt-5 md:block md:border-0 md:pt-0" style={{ borderColor: "var(--line)" }}>
                <div className="relative aspect-square overflow-hidden bg-paper-2 md:aspect-[4/3]">
                  <Image src={piatto.img} alt="" fill sizes="(min-width: 768px) 33vw, 104px" className="object-cover" />
                  <span className="absolute bottom-1 left-1 bg-paper/95 px-1 text-[10px] text-ink">Foto illustrativa</span>
                </div>
                <div className="min-w-0 md:mt-4">
                  <h3 className="titolo-s group-hover:underline group-hover:underline-offset-4">{piatto.nome}</h3>
                  <BollinoNonDisponibile piattoId={piatto.id} className="mt-2" />
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
