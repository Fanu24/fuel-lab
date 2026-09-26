import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import ChiusuraCta from "@/components/home/ChiusuraCta";
import { SERVIZI, type Prezzo } from "@/lib/servizi";

export const metadata: Metadata = {
  title: "Servizi",
  description:
    "Tre modi per mangiare bene con FUEL LAB: la settimana composta sul tuo allenamento, il piano sui macro della tua scheda, oppure Matteo che cucina a casa tua.",
};

/* Niente listino: il committente vuole una soglia, non prezzi in chiaro
   (vedi lib/servizi.ts). L'home cooking non ha nemmeno quella. */
function testoPrezzo(p: Prezzo): string {
  if (p.tipo === "preventivo") return "Su preventivo";
  return `Da ${p.valore.toFixed(2).replace(".", ",")} € ${p.unita}`;
}

export default function Servizi() {
  return (
    <>
      <section className="testata">
        <div className="wrap">
          <p className="occhiello">Servizi</p>
          <h1 className="titolo-xl mt-6 max-w-[11ch]">Tre modi di mangiare bene.</h1>
          <p className="lead mt-6">
            La consegna è a Pescara e provincia, il lunedì e il giovedì, gratis dai dieci pasti in su.
          </p>
        </div>
      </section>

      <section className="pb-[var(--sezione)]">
        <ol className="wrap grid gap-16">
          {SERVIZI.map((s, i) => (
            <Reveal
              as="li"
              key={s.id}
              className={`grid items-center gap-8 md:grid-cols-2 md:gap-16 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}
            >
              <div className="smusso relative aspect-[4/3] overflow-hidden bg-paper-2">
                <Image src={s.img} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
              </div>
              <div>
                <span className="num text-sm text-muted">{s.numero}</span>
                <h2 className="titolo mt-3">{s.nome}</h2>
                <p className="mt-5 max-w-[46ch] text-lg text-muted">{s.descrizione}</p>
                <p className="mt-6 font-disp text-lg font-semibold tracking-[.1em] uppercase">
                  <span className="evidenzia">{testoPrezzo(s.prezzo)}</span>
                </p>
                <Link href={s.href} className="btn btn-ink mt-8">
                  {s.id === "home-cooking" ? "Conosci Matteo" : "Inizia"} <span className="freccia">→</span>
                </Link>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      <ChiusuraCta />
    </>
  );
}
