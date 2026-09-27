import Link from "next/link";
import { articoloPerSlug } from "@/lib/blog";

/**
 * "Per approfondire": le guide del blog collegate a una pagina locale. Le
 * pagine locali vendono il servizio, il blog spiega: i link vanno dalla prima
 * al secondo, cosi' le due famiglie non si contendono le stesse ricerche.
 * Uno slug che non esiste piu' sparisce da solo invece di diventare un 404.
 */
export default function LinkBlog({ slug, titolo = "Per approfondire" }: { slug: string[]; titolo?: string }) {
  const articoli = slug.map(articoloPerSlug).filter((a) => a !== undefined);
  if (articoli.length === 0) return null;
  return (
    <section className="sezione carta-2">
      <div className="wrap grid gap-10 lg:grid-cols-[1fr_2fr]">
        <div>
          <p className="occhiello">Dal blog</p>
          <h2 className="titolo-s mt-5">{titolo}</h2>
        </div>
        <ul className="border-t-[3px] border-ink">
          {articoli.map((a) => (
            <li key={a.slug} className="border-b border-ink/15 py-5">
              <Link href={`/blog/${a.slug}`} className="group block">
                <span className="block font-disp text-lg font-semibold tracking-[.02em] uppercase group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
                  {a.titolo}
                </span>
                <span className="mt-2 block max-w-[64ch] text-muted">{a.descrizione}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
