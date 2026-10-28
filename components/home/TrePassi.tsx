import Link from "next/link";
import Reveal from "@/components/Reveal";

const PASSI = ["Scegli i piatti", "Controlla la settimana", "Invia a Matteo"];

export default function TrePassi() {
  return (
    <section className="sezione carta-2" aria-labelledby="settimana-home-titolo">
      <div className="wrap grid items-start gap-8 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <h2 id="settimana-home-titolo" className="titolo max-w-[15ch]">Componi la tua settimana.</h2>
          <p className="lead mt-5">Preferisci scegliere dal menu? Parti dai piatti che ti piacciono.</p>
        </Reveal>
        <Reveal delay={80}>
          <ol className="grid gap-4">
            {PASSI.map((passo, i) => (
              <li key={passo} className="flex items-center gap-4">
                <span className="num flex h-10 w-10 shrink-0 items-center justify-center bg-ink text-paper" aria-hidden="true">{i + 1}</span>
                <span className="text-lg font-semibold">{passo}</span>
              </li>
            ))}
          </ol>
          <Link href="/settimana" className="btn btn-ink mt-7 w-full justify-between sm:w-auto">
            Componi la tua settimana <span aria-hidden="true">→</span>
          </Link>
          <p className="mt-3 text-sm text-muted">Matteo conferma disponibilità e prezzo.</p>
        </Reveal>
      </div>
    </section>
  );
}
