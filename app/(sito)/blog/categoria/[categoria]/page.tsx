import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORIE, articoliPerCategoria, categoriaPerId, titoloPaginaCategoria } from "@/lib/blog";
import { URL_SITO } from "@/lib/sito";
import ChiusuraBlog from "../../_componenti/ChiusuraBlog";
import JsonLd from "../../_componenti/JsonLd";
import { Briciole, FiltriCategorie } from "../../_componenti/Navigazione";
import SchedaArticolo from "../../_componenti/SchedaArticolo";

/* Una pagina statica per categoria: indirizzo proprio, metadata propri,
   elenco completo delle guide. È il "filtro" del blog, ma indicizzabile. */

type Props = { params: Promise<{ categoria: string }> };

export function generateStaticParams() {
  return CATEGORIE.map(({ id }) => ({ categoria: id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const categoria = categoriaPerId((await params).categoria);
  if (!categoria) return {};
  const percorso = `/blog/categoria/${categoria.id}`;
  return {
    title: { absolute: titoloPaginaCategoria(categoria) },
    description: categoria.descrizione,
    alternates: { canonical: percorso },
    openGraph: {
      type: "website",
      locale: "it_IT",
      siteName: "FUEL LAB",
      url: percorso,
      title: categoria.titolo,
      description: categoria.descrizione,
      images: [{ url: "/opengraph-image.jpg", width: 1200, height: 630, alt: "FUEL LAB · Meal prep a Pescara" }],
    },
  };
}

export default async function CategoriaPage({ params }: Props) {
  const categoria = categoriaPerId((await params).categoria);
  if (!categoria) notFound();
  const articoli = articoliPerCategoria(categoria.id);
  const url = `${URL_SITO}/blog/categoria/${categoria.id}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: categoria.titolo,
        description: categoria.descrizione,
        inLanguage: "it-IT",
        isPartOf: { "@type": "Blog", "@id": `${URL_SITO}/blog#blog`, name: "Blog FUEL LAB" },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: articoli.length,
          itemListElement: articoli.map((articolo, posizione) => ({
            "@type": "ListItem",
            position: posizione + 1,
            url: `${URL_SITO}/blog/${articolo.slug}`,
            name: articolo.titolo,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: URL_SITO },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${URL_SITO}/blog` },
          { "@type": "ListItem", position: 3, name: categoria.nome, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd dati={jsonLd} />
      <section className="testata">
        <div className="wrap">
          <Briciole voci={[{ nome: "Home", href: "/" }, { nome: "Blog", href: "/blog" }, { nome: categoria.nome }]} />
          <p className="occhiello mt-8">Blog FUEL LAB · {categoria.nome}</p>
          <h1 className="titolo-xl mt-6 max-w-[16ch]">{categoria.titolo}</h1>
          <p className="lead mt-6 max-w-[62ch]">{categoria.introduzione}</p>
          <div className="mt-10">
            <FiltriCategorie attiva={categoria.id} />
          </div>
        </div>
      </section>

      <section aria-labelledby="titolo-guide" className="pb-[var(--sezione)]">
        <div className="wrap">
          <h2 id="titolo-guide" className="occhiello flex border-t-[3px] border-ink pt-6">
            {articoli.length} guide in questa categoria
          </h2>
          <ul className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {articoli.map((articolo, posizione) => (
              <li key={articolo.slug}>
                <SchedaArticolo articolo={articolo} conFoto={posizione < 3} livello="h2" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ChiusuraBlog />
    </>
  );
}
