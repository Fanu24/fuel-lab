import type { Metadata } from "next";
import Link from "next/link";
import { ARTICOLI } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog · Meal prep e cucina sana a Pescara",
  description:
    "Guide pratiche su meal prep, cucina salutare da asporto a Pescara, menu settimanale e organizzazione dei pasti. Scopri il menu FUEL LAB.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <>
      <section className="testata">
        <div className="wrap">
          <p className="occhiello">FUEL LAB · Pescara</p>
          <h1 className="titolo-xl mt-6 max-w-[14ch]">Meal prep e cucina salutare a Pescara.</h1>
          <p className="lead mt-6 max-w-[58ch]">
            Guide pratiche per organizzare i pasti: cucina d’asporto, pranzi al lavoro, consegne a Pescara,
            ingredienti e menu settimanali. Scegli un argomento, poi esplora il menu FUEL LAB.
          </p>
        </div>
      </section>

      <section className="pb-[var(--sezione)]">
        <div className="wrap">
          <p className="occhiello border-t-[3px] border-ink pt-6">Guide e approfondimenti</p>
          <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {ARTICOLI.map((articolo, indice) => (
              <li key={articolo.slug} className="flex min-h-full flex-col border-t border-ink/20 pt-5">
                <p className="num text-xs text-muted">{String(indice + 1).padStart(2, "0")} · {articolo.categoria}</p>
                <h2 className="mt-4 font-disp text-2xl leading-tight font-bold">
                  <Link href={`/blog/${articolo.slug}`} className="hover:underline">
                    {articolo.titolo}
                  </Link>
                </h2>
                <p className="mt-4 flex-1 text-muted">{articolo.descrizione}</p>
                <Link href={`/blog/${articolo.slug}`} className="link mt-5 inline-flex w-fit items-center gap-2">
                  Leggi la guida <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
