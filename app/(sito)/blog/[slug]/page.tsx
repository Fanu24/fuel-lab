import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ID } from "@/components/seo/schema";
import WhatsAppCta from "@/components/ui/WhatsAppCta";
import {
  ARTICOLI,
  articoloPerSlug,
  categoriaPerId,
  correlatiDi,
  dataLeggibile,
  fotoArticolo,
  idSezione,
  minutiLettura,
  paroleArticolo,
  testoSemplice,
  titoloPagina,
} from "@/lib/blog";
import { APPROFONDIMENTI } from "@/lib/blog-approfondimenti";
import { TITOLARE, URL_SITO } from "@/lib/sito";
import ChiusuraBlog from "../_componenti/ChiusuraBlog";
import Condividi from "../_componenti/Condividi";
import JsonLd from "../_componenti/JsonLd";
import { Briciole } from "../_componenti/Navigazione";
import { PiattiCollegati, TabellaPiatti } from "../_componenti/Piatti";
import SchedaArticolo from "../_componenti/SchedaArticolo";
import Tabella from "../_componenti/Tabella";
import Testo from "../_componenti/Testo";

/* La pagina di una guida. Next 16: params è una Promise; export statico,
   quindi ogni slug nasce da generateStaticParams al build. */

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return ARTICOLI.map(({ slug }) => ({ slug }));
}

/** L’anteprima social di ogni guida: la genera ./og.png/route.tsx al build. */
const immagineOg = (slug: string) => `/blog/${slug}/og.png`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const articolo = articoloPerSlug(slug);
  if (!articolo) return {};
  const categoria = categoriaPerId(articolo.categoria);
  const percorso = `/blog/${articolo.slug}`;
  return {
    title: { absolute: titoloPagina(articolo) },
    description: articolo.descrizione,
    alternates: { canonical: percorso },
    openGraph: {
      type: "article",
      locale: "it_IT",
      siteName: "FUEL LAB",
      url: percorso,
      title: articolo.titolo,
      description: articolo.descrizione,
      publishedTime: articolo.data,
      modifiedTime: articolo.aggiornato ?? articolo.data,
      section: categoria?.nome,
      authors: [TITOLARE.nome],
      images: [{ url: immagineOg(articolo.slug), width: 1200, height: 630, alt: articolo.titolo }],
    },
    twitter: {
      card: "summary_large_image",
      title: articolo.titolo,
      description: articolo.descrizione,
      images: [immagineOg(articolo.slug)],
    },
  };
}

export default async function ArticoloPage({ params }: Props) {
  const { slug } = await params;
  const articolo = articoloPerSlug(slug);
  if (!articolo) notFound();

  const approfondimento = APPROFONDIMENTI[slug];
  const categoria = categoriaPerId(articolo.categoria);
  const foto = fotoArticolo(articolo);
  const url = `${URL_SITO}/blog/${articolo.slug}`;
  const minuti = minutiLettura(articolo);
  const correlati = correlatiDi(articolo);
  const modificato = articolo.aggiornato ?? articolo.data;
  // "aggiornato il" solo se è davvero un altro giorno: lo stesso giorno sarebbe ripetere la data
  const aggiornata = modificato > articolo.data;

  const indice = [
    ...(approfondimento ? [{ id: "in-breve", titolo: "In breve" }] : []),
    ...articolo.sezioni.map((sezione) => ({ id: idSezione(sezione.titolo), titolo: sezione.titolo })),
    ...(approfondimento ? [{ id: "esempio-pratico", titolo: "Un esempio pratico" }] : []),
    ...(articolo.faq.length ? [{ id: "domande-frequenti", titolo: "Domande frequenti" }] : []),
    ...(articolo.fonti?.length ? [{ id: "fonti", titolo: "Fonti" }] : []),
    ...(articolo.piatti?.length ? [{ id: "piatti-collegati", titolo: "Piatti collegati" }] : []),
  ];

  const briciole = [
    { nome: "Home", href: "/" },
    { nome: "Blog", href: "/blog" },
    ...(categoria ? [{ nome: categoria.nome, href: `/blog/categoria/${categoria.id}` }] : []),
    { nome: articolo.titolo },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#articolo`,
        headline: articolo.titolo,
        description: articolo.descrizione,
        image: [`${URL_SITO}${immagineOg(articolo.slug)}`, `${URL_SITO}${foto.src}`],
        datePublished: articolo.data,
        dateModified: modificato,
        inLanguage: "it-IT",
        articleSection: categoria?.nome,
        keywords: articolo.parolaChiave,
        wordCount: paroleArticolo(articolo),
        timeRequired: `PT${minuti}M`,
        // Matteo e l’attività sono nodi del grafo del sito (components/seo/schema.ts): qui solo il riferimento.
        author: { "@id": ID.matteo },
        publisher: { "@id": ID.organizzazione },
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        isPartOf: { "@type": "Blog", "@id": `${URL_SITO}/blog#blog`, name: "Blog FUEL LAB" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: briciole.map((voce, indiceVoce) => ({
          "@type": "ListItem",
          position: indiceVoce + 1,
          name: voce.nome,
          item: voce.href ? `${URL_SITO}${voce.href === "/" ? "" : voce.href}` : url,
        })),
      },
      ...(articolo.faq.length
        ? [
            {
              "@type": "FAQPage",
              "@id": `${url}#domande-frequenti`,
              mainEntity: articolo.faq.map((faq) => ({
                "@type": "Question",
                name: faq.domanda,
                acceptedAnswer: { "@type": "Answer", text: testoSemplice(faq.risposta) },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <JsonLd dati={jsonLd} />
      <article>
        <header className="testata">
          <div className="wrap">
            <Briciole voci={briciole} />
            {categoria ? (
              <p className="mt-8">
                <Link href={`/blog/categoria/${categoria.id}`} className="occhiello -my-4 py-4 hover:underline">
                  {categoria.nome}
                </Link>
              </p>
            ) : null}
            {/* I titoli lunghi scendono di una taglia: a titolo-xl andrebbero su cinque righe. */}
            <h1 className={articolo.titolo.length > 48 ? "titolo mt-5 max-w-[22ch]" : "titolo-xl mt-5 max-w-[17ch]"}>
              {articolo.titolo}
            </h1>
            <p className="num mt-6 flex flex-wrap gap-x-2 gap-y-1 text-sm text-muted">
              <span className="whitespace-nowrap">
                Pubblicato il <time dateTime={articolo.data}>{dataLeggibile(articolo.data)}</time>
              </span>
              {aggiornata ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="whitespace-nowrap">
                    aggiornato il <time dateTime={modificato}>{dataLeggibile(modificato)}</time>
                  </span>
                </>
              ) : null}
              <span aria-hidden="true">·</span>
              <span className="whitespace-nowrap">{minuti} min di lettura</span>
            </p>
            <p className="mt-2 text-sm text-muted">
              A cura di FUEL LAB, la cucina di{" "}
              <Link href="/chi-siamo" className="font-semibold text-ink underline decoration-2 underline-offset-4 hover:decoration-lime">
                Matteo Pattanè
              </Link>
              , cuoco a Pescara.
            </p>
            <p className="lead mt-6 max-w-[62ch]">{articolo.introduzione}</p>
          </div>
        </header>

        <div className="wrap">
          <figure className="smusso relative aspect-[16/10] overflow-hidden bg-paper-2 md:aspect-[21/9]">
            <Image
              src={foto.src}
              style={{ objectPosition: foto.fuoco }}
              alt={foto.alt}
              fill
              sizes="(min-width: 1320px) 1240px, 100vw"
              loading="eager"
              fetchPriority="high"
              className="object-cover"
            />
            <figcaption className="absolute right-3 bottom-3 bg-paper px-3 py-1 text-xs text-ink">{foto.didascalia ?? "Foto illustrativa"}</figcaption>
          </figure>
        </div>

        <div className="wrap grid gap-12 py-[var(--sezione)] lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-20">
          <div className="min-w-0 max-w-[72ch]">
            {approfondimento ? (
              <section id="in-breve" className="border-l-[5px] border-ink bg-paper-2 p-6 md:p-8" aria-labelledby="titolo-in-breve">
                <h2 id="titolo-in-breve" className="occhiello">
                  In breve
                </h2>
                <p className="mt-4 text-xl leading-relaxed font-semibold">
                  <Testo>{approfondimento.risposta}</Testo>
                </p>
              </section>
            ) : null}

            <nav id="indice" aria-labelledby="titolo-indice" className="mt-10 border-t-[3px] border-ink pt-6">
              <h2 id="titolo-indice" className="occhiello">
                In questa guida
              </h2>
              <ol className="mt-2 grid sm:grid-cols-2 sm:gap-x-8">
                {indice.map((voce, posizione) => (
                  <li key={voce.id}>
                    <a href={`#${voce.id}`} className="group/voce flex min-h-11 items-center gap-3">
                      <span aria-hidden="true" className="num w-6 shrink-0 text-sm text-muted">
                        {String(posizione + 1).padStart(2, "0")}
                      </span>
                      <span className="underline decoration-ink/30 underline-offset-4 group-hover/voce:decoration-lime">{voce.titolo}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            {articolo.sezioni.map((sezione) => (
              <section key={sezione.titolo} id={idSezione(sezione.titolo)} className="mt-14">
                <h2 className="font-disp text-3xl leading-tight font-bold">
                  <Testo>{sezione.titolo}</Testo>
                </h2>
                {sezione.paragrafi.map((paragrafo, indiceParagrafo) => (
                  <p key={indiceParagrafo} className="mt-5 text-lg leading-relaxed text-muted">
                    <Testo>{paragrafo}</Testo>
                  </p>
                ))}
                {sezione.punti ? (
                  <ul className="mt-5 list-disc space-y-3 pl-6 text-lg leading-relaxed text-muted marker:text-ink">
                    {sezione.punti.map((punto) => (
                      <li key={punto}>
                        <Testo>{punto}</Testo>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {sezione.tabella ? <Tabella tabella={sezione.tabella} titolo={sezione.titolo} /> : null}
                {sezione.piatti ? <TabellaPiatti id={sezione.piatti} /> : null}
                {sezione.dopo?.map((paragrafo, indiceParagrafo) => (
                  <p key={indiceParagrafo} className="mt-5 text-lg leading-relaxed text-muted">
                    <Testo>{paragrafo}</Testo>
                  </p>
                ))}
              </section>
            ))}

            {approfondimento ? (
              <section id="esempio-pratico" className="mt-14 border-t-[3px] border-ink pt-8">
                <h2 className="font-disp text-3xl leading-tight font-bold">Un esempio pratico</h2>
                <p className="mt-5 text-lg leading-relaxed text-muted">
                  <Testo>{approfondimento.scenario}</Testo>
                </p>
                <h3 className="mt-9 font-disp text-xl font-bold">Da dove cominciare</h3>
                <ol className="mt-4 list-decimal space-y-3 pl-6 text-lg leading-relaxed text-muted marker:text-ink">
                  {approfondimento.passi.map((passo) => (
                    <li key={passo}>
                      <Testo>{passo}</Testo>
                    </li>
                  ))}
                </ol>
                <p className="mt-7 border-l-[3px] border-ink/25 pl-5 text-muted">
                  <Testo>{approfondimento.daSapere}</Testo>
                </p>
              </section>
            ) : null}

            {articolo.faq.length > 0 ? (
              <section id="domande-frequenti" className="mt-14 border-t-[3px] border-ink pt-7">
                <h2 className="font-disp text-3xl font-bold">Domande frequenti</h2>
                <dl className="mt-6 space-y-7">
                  {articolo.faq.map((faq) => (
                    <div key={faq.domanda}>
                      <dt className="text-lg font-semibold">
                        <Testo>{faq.domanda}</Testo>
                      </dt>
                      <dd className="mt-2 leading-relaxed text-muted">
                        <Testo>{faq.risposta}</Testo>
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            {articolo.fonti?.length ? (
              <aside id="fonti" aria-labelledby="titolo-fonti" className="mt-12 border-t pt-6" style={{ borderColor: "var(--line)" }}>
                <h2 id="titolo-fonti" className="occhiello">
                  Fonti
                </h2>
                <ul className="mt-4 space-y-3 text-sm">
                  {articolo.fonti.map((fonte) => (
                    <li key={fonte.url}>
                      <a className="link -my-[13px] py-[13px]" href={fonte.url} target="_blank" rel="noopener noreferrer">
                        {fonte.titolo} <span aria-hidden="true">↗</span>
                        <span className="sr-only"> (si apre in una nuova scheda)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </aside>
            ) : null}

            <p className="mt-10 border-l-[3px] border-ink/25 pl-5 text-sm leading-relaxed text-muted">
              Le guide di FUEL LAB sono scritte da una cucina, non da un nutrizionista: danno informazioni generali e
              citano le fonti da cui provengono i numeri. Per un piano alimentare personale, per allergie o condizioni
              di salute rivolgiti a un professionista abilitato.
            </p>

            <section aria-labelledby="titolo-condividi" className="mt-12 border-t-[3px] border-ink pt-7">
              <h2 id="titolo-condividi" className="occhiello">
                Condividi la guida
              </h2>
              <p className="mt-3 text-muted">Conosci qualcuno che si allena e mangia di corsa? Mandagli il link.</p>
              <div className="mt-5">
                <Condividi url={url} titolo={articolo.titolo} />
              </div>
            </section>
          </div>

          {/* Solo sul computer, accanto alla lettura: sul telefono l’invito è uno solo, in fondo (ChiusuraBlog). */}
          <aside
            aria-labelledby="titolo-invito"
            className="hidden self-start border-t-[3px] border-ink pt-6 lg:sticky lg:top-[calc(var(--nav-h)+24px)] lg:block"
          >
            <p className="occhiello">Vuoi organizzare i pasti?</p>
            <h2 id="titolo-invito" className="mt-3 font-disp text-2xl font-bold">
              Partiamo dal menu.
            </h2>
            <p className="mt-3 text-muted">
              Consulta i piatti e componi una proposta per la tua settimana. Per giorni, ritiro e consegna, chiedi
              conferma a Matteo.
            </p>
            <div className="mt-6 grid gap-3">
              <Link href="/settimana" className="btn btn-ink w-full !px-4">
                Componi la settimana <span aria-hidden="true" className="freccia">→</span>
              </Link>
              <Link href="/menu" className="btn btn-linea w-full">
                Apri il menu
              </Link>
              <WhatsAppCta label="Contatta Matteo" buttonClassName="w-full !px-4 !text-sm" />
            </div>
          </aside>
        </div>
      </article>

      {articolo.piatti?.length ? <PiattiCollegati id={articolo.piatti} /> : null}

      {correlati.length ? (
        <section aria-labelledby="titolo-correlati" className="sezione">
          <div className="wrap">
            <p className="occhiello">Continua a leggere</p>
            <h2 id="titolo-correlati" className="titolo-s mt-4">
              Articoli correlati
            </h2>
            <ul className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {correlati.map((correlato) => (
                <li key={correlato.slug}>
                  <SchedaArticolo articolo={correlato} conFoto />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <ChiusuraBlog />
    </>
  );
}
