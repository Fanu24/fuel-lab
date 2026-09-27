import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import WhatsAppCta from "@/components/ui/WhatsAppCta";
import { ARTICOLI, articoloPerSlug } from "@/lib/blog";
import { APPROFONDIMENTI } from "@/lib/blog-approfondimenti";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return ARTICOLI.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const articolo = articoloPerSlug(slug);
  if (!articolo) return {};
  return {
    title: articolo.titolo,
    description: articolo.descrizione,
    alternates: { canonical: `/blog/${articolo.slug}` },
    openGraph: {
      type: "article",
      title: articolo.titolo,
      description: articolo.descrizione,
      images: [{ url: "/opengraph-image.jpg", width: 1200, height: 630, alt: "FUEL LAB · Meal prep a Pescara" }],
    },
  };
}

export default async function ArticoloPage({ params }: Props) {
  const { slug } = await params;
  const articolo = articoloPerSlug(slug);
  if (!articolo) notFound();
  const approfondimento = APPROFONDIMENTI[slug];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: articolo.titolo,
    description: articolo.descrizione,
    inLanguage: "it-IT",
    author: { "@type": "Organization", name: "FUEL LAB" },
    publisher: { "@type": "Organization", name: "FUEL LAB", url: "https://fuelchef.it" },
    mainEntityOfPage: `https://fuelchef.it/blog/${articolo.slug}`,
    datePublished: "2026-09-27",
    dateModified: "2026-09-27",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <article>
        <header className="testata">
          <div className="wrap">
            <nav aria-label="Percorso" className="text-sm">
              <Link href="/blog" className="link">Blog</Link>
              <span className="mx-3" aria-hidden="true">/</span>
              <span>{articolo.categoria}</span>
            </nav>
            <p className="occhiello mt-8">{articolo.categoria} · FUEL LAB</p>
            <h1 className="titolo-xl mt-5 max-w-[17ch]">{articolo.titolo}</h1>
            <p className="lead mt-6 max-w-[62ch]">{articolo.introduzione}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/menu" className="btn btn-ink">Guarda il menu <span className="freccia">→</span></Link>
              <Link href="/settimana" className="btn btn-linea">Componi la settimana</Link>
            </div>
          </div>
        </header>

        <div className="wrap grid gap-12 pb-[var(--sezione)] lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-20">
          <div className="max-w-[72ch]">
            {approfondimento ? (
              <section className="border-l-[5px] border-ink bg-paper-2 p-6 md:p-8" aria-label="Risposta in breve">
                <p className="occhiello">In breve</p>
                <p className="mt-4 text-xl leading-relaxed font-semibold">{approfondimento.risposta}</p>
              </section>
            ) : null}
            {articolo.sezioni.map((sezione) => (
              <section key={sezione.titolo} className="mt-12 first:mt-0">
                <h2 className="font-disp text-3xl leading-tight font-bold">{sezione.titolo}</h2>
                {sezione.paragrafi.map((paragrafo, indice) => (
                  <p key={indice} className="mt-5 text-lg leading-relaxed text-muted">{paragrafo}</p>
                ))}
                {sezione.punti ? (
                  <ul className="mt-5 list-disc space-y-2 pl-6 text-lg leading-relaxed text-muted">
                    {sezione.punti.map((punto) => <li key={punto}>{punto}</li>)}
                  </ul>
                ) : null}
              </section>
            ))}

            {approfondimento ? (
              <section className="mt-14 border-t-[3px] border-ink pt-8">
                <h2 className="font-disp text-3xl leading-tight font-bold">Un esempio pratico</h2>
                <p className="mt-5 text-lg leading-relaxed text-muted">{approfondimento.scenario}</p>
                <h3 className="mt-9 font-disp text-xl font-bold">Da dove cominciare</h3>
                <ol className="mt-4 list-decimal space-y-3 pl-6 text-lg leading-relaxed text-muted">
                  {approfondimento.passi.map((passo) => <li key={passo}>{passo}</li>)}
                </ol>
                <p className="mt-7 border-l-[3px] border-ink/25 pl-5 text-muted">{approfondimento.daSapere}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/settimana" className="btn btn-ink">Componi i tuoi pasti <span className="freccia">→</span></Link>
                  <Link href="/richiesta" className="btn btn-linea">Contatta Matteo</Link>
                </div>
              </section>
            ) : null}

            {articolo.faq.length > 0 ? (
              <section className="mt-14 border-t-[3px] border-ink pt-7">
                <h2 className="font-disp text-3xl font-bold">Domande frequenti</h2>
                <dl className="mt-6 space-y-7">
                  {articolo.faq.map((faq) => (
                    <div key={faq.domanda}>
                      <dt className="font-semibold">{faq.domanda}</dt>
                      <dd className="mt-2 leading-relaxed text-muted">{faq.risposta}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            {articolo.fonti?.length ? (
              <aside className="mt-12 border-t pt-6" style={{ borderColor: "var(--line)" }}>
                <h2 className="occhiello">Fonti utili</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {articolo.fonti.map((fonte) => (
                    <li key={fonte.url}><a className="link" href={fonte.url} target="_blank" rel="noopener noreferrer">{fonte.titolo} ↗</a></li>
                  ))}
                </ul>
              </aside>
            ) : null}

            {approfondimento?.correlati.length ? (
              <nav aria-label="Guide correlate" className="mt-12 border-t pt-6" style={{ borderColor: "var(--line)" }}>
                <h2 className="occhiello">Continua a leggere</h2>
                <ul className="mt-4 space-y-3">
                  {approfondimento.correlati.map((correlato) => {
                    const guida = articoloPerSlug(correlato);
                    return guida ? <li key={correlato}><Link href={`/blog/${correlato}`} className="link">{guida.titolo} →</Link></li> : null;
                  })}
                </ul>
              </nav>
            ) : null}
          </div>

          <aside className="self-start border-t-[3px] border-ink pt-6 lg:sticky lg:top-[calc(var(--nav-h)+24px)]">
            <p className="occhiello">Vuoi organizzare i pasti?</p>
            <h2 className="mt-3 font-disp text-2xl font-bold">Partiamo dal menu.</h2>
            <p className="mt-3 text-muted">Consulta i piatti e componi una proposta per la tua settimana. Per giorni e consegna, chiedi conferma a Matteo.</p>
            <div className="mt-6 grid gap-3">
              <Link href="/menu" className="btn btn-ink w-full">Apri il menu <span className="freccia">→</span></Link>
              <Link href="/settimana" className="btn btn-linea w-full">Componi la settimana</Link>
              <WhatsAppCta label="Contatta Matteo" buttonClassName="w-full !px-4 !text-sm" />
            </div>
          </aside>
        </div>
      </article>
    </>
  );
}
