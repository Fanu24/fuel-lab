import Link from "next/link";
import Reveal from "@/components/Reveal";
import CartaPiatto from "@/components/menu/CartaPiatto";
import { PIATTI } from "@/lib/catalogo";

/* Il cibo, grande. Sul telefono le carte scorrono di lato invece di impilarsi:
   sei carte una sotto l'altra erano sei schermate prima del resto della pagina. */
export default function PiattiScelti() {
  return (
    <section className="sezione carta-2">
      <div className="wrap">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="occhiello">Il menu della settimana</p>
            <h2 className="titolo mt-5 max-w-[14ch]">Sei piatti. Già composti.</h2>
          </div>
          <Link href="/menu" className="link">
            Tutto il menu, con ingredienti e macro
          </Link>
        </Reveal>
      </div>
      <ul className="wrap mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible">
        {PIATTI.map((p, i) => (
          <Reveal as="li" key={p.id} delay={(i % 3) * 80} className="w-[82%] shrink-0 snap-start md:w-auto">
            <CartaPiatto piatto={p} />
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
