import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ARTICOLI,
  CATEGORIE,
  SLUG_IN_EVIDENZA,
  articoliPerCategoria,
  articoloPerSlug,
  fotoArticolo,
} from "@/lib/blog";
import { ID } from "@/components/seo/schema";
import { URL_SITO } from "@/lib/sito";
import ChiusuraBlog from "./_componenti/ChiusuraBlog";
import JsonLd from "./_componenti/JsonLd";
import { Briciole, FiltriCategorie } from "./_componenti/Navigazione";
import SchedaArticolo, { RigaMeta } from "./_componenti/SchedaArticolo";

const TITOLO = "Blog: allenamento, meal prep e cucina a Pescara";
const DESCRIZIONE =
  "Guide pratiche di FUEL LAB su cosa mangiare prima e dopo l’allenamento, meal prep, pranzo in ufficio, macro ed etichette e cucina abruzzese a Pescara.";

export const metadata: Metadata = {
  title: TITOLO,
  description: DESCRIZIONE,
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: "FUEL LAB",
    url: "/blog",
    title: `${TITOLO} · FUEL LAB`,
    description: DESCRIZIONE,
    images: [{ url: "/opengraph-image.jpg", width: 1200, height: 630, alt: "FUEL LAB · Meal prep a Pescara" }],
  },
};

export default function BlogPage() {
  const inEvidenza = articoloPerSlug(SLUG_IN_EVIDENZA) ?? ARTICOLI[0];
  const fotoEvidenza = fotoArticolo(inEvidenza);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        "@id": `${URL_SITO}/blog#blog`,
        url: `${URL_SITO}/blog`,
        name: "Blog FUEL LAB",
        description: DESCRIZIONE,
        inLanguage: "it-IT",
        publisher: { "@id": ID.organizzazione },
        blogPost: ARTICOLI.map((articolo) => ({
          "@type": "BlogPosting",
          "@id": `${URL_SITO}/blog/${articolo.slug}#articolo`,
          headline: articolo.titolo,
          author: { "@id": ID.matteo },
          url: `${URL_SITO}/blog/${articolo.slug}`,
          datePublished: articolo.data,
          dateModified: articolo.aggiornato ?? articolo.data,
          image: `${URL_SITO}/blog/${articolo.slug}/og.png`,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: URL_SITO },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${URL_SITO}/blog` },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd dati={jsonLd} />
      <section className="testata">
        <div className="wrap">
          <Briciole voci={[{ nome: "Home", href: "/" }, { nome: "Blog" }]} />
          <p className="occhiello mt-8">Blog FUEL LAB · Pescara</p>
          <h1 className="titolo-xl mt-6 max-w-[15ch]">Meal prep, allenamento e cucina a Pescara.</h1>
          <p className="lead mt-6 max-w-[60ch]">
            Guide pratiche per chi si allena e vuole organizzare i pasti: cosa mangiare prima e dopo cardio e pesi,
            meal prep, pranzo in ufficio, macro ed etichette, cucina abruzzese. Scritte da una cucina, con le fonti in
            chiaro.
          </p>
          <div className="mt-10">
            <FiltriCategorie />
          </div>
        </div>
      </section>

      <section aria-labelledby="titolo-evidenza" className="pb-[var(--sezione)]">
        <div className="wrap">
          <p className="occhiello flex border-t-[3px] border-ink pt-6">In evidenza</p>
          <article className="mt-8 grid items-center gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
            <Link href={`/blog/${inEvidenza.slug}`} tabIndex={-1} aria-hidden="true" className="group block">
              <div className="smusso relative aspect-[16/10] overflow-hidden bg-paper-2">
                <Image
                  src={fotoEvidenza.src}
                  style={{ objectPosition: fotoEvidenza.fuoco }}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  loading="eager"
                  fetchPriority="high"
                  className="object-cover transition-transform duration-[1.2s] ease-[var(--e-out)] group-hover:scale-[1.04]"
                />
                <span className="absolute right-3 bottom-3 bg-paper px-2 py-1 text-xs text-ink">{fotoEvidenza.didascalia ?? "Foto illustrativa"}</span>
              </div>
            </Link>
            <div>
              <RigaMeta articolo={inEvidenza} />
              <h2 id="titolo-evidenza" className="blog-titolo-evidenza mt-5">
                <Link href={`/blog/${inEvidenza.slug}`} className="hover:underline hover:decoration-4 hover:underline-offset-8">
                  {inEvidenza.titolo}
                </Link>
              </h2>
              <p className="lead mt-6">{inEvidenza.descrizione}</p>
              <Link href={`/blog/${inEvidenza.slug}`} className="btn btn-ink mt-8">
                Leggi la guida <span aria-hidden="true" className="freccia">→</span>
              </Link>
            </div>
          </article>
        </div>
      </section>

      {CATEGORIE.map((categoria, posizione) => {
        const articoli = articoliPerCategoria(categoria.id).filter((articolo) => articolo.slug !== inEvidenza.slug);
        if (!articoli.length) return null;
        return (
          <section
            key={categoria.id}
            aria-labelledby={`categoria-${categoria.id}`}
            className={`sezione ${posizione % 2 === 0 ? "carta-2" : ""}`}
          >
            <div className="wrap">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div className="max-w-[60ch]">
                  <p className="occhiello">{String(posizione + 1).padStart(2, "0")} · Categoria</p>
                  <h2 id={`categoria-${categoria.id}`} className="titolo-s mt-4">
                    {categoria.titolo}
                  </h2>
                  <p className="mt-4 text-muted">{categoria.descrizione}</p>
                </div>
                <Link href={`/blog/categoria/${categoria.id}`} className="link inline-flex items-center gap-2">
                  Tutte le guide · {categoria.nome} <span aria-hidden="true">→</span>
                </Link>
              </div>
              <ul className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {articoli.map((articolo) => (
                  <li key={articolo.slug}>
                    <SchedaArticolo articolo={articolo} conCategoria={false} />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}

      <ChiusuraBlog />
    </>
  );
}
