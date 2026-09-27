import Image from "next/image";
import Link from "next/link";
import { categoriaPerId, dataLeggibile, fotoArticolo, minutiLettura, type Articolo } from "@/lib/blog";

/** Categoria, data e tempo di lettura: la riga sopra ogni titolo di guida. */
export function RigaMeta({ articolo, className = "" }: { articolo: Articolo; className?: string }) {
  const categoria = categoriaPerId(articolo.categoria);
  return (
    <p className={`num text-xs text-muted ${className}`}>
      {categoria ? <span>{categoria.nome}</span> : null}
      <span aria-hidden="true"> · </span>
      <time dateTime={articolo.aggiornato ?? articolo.data}>{dataLeggibile(articolo.aggiornato ?? articolo.data)}</time>
      <span aria-hidden="true"> · </span>
      <span>{minutiLettura(articolo)} min di lettura</span>
    </p>
  );
}

/** La card di una guida negli elenchi: foto facoltativa, meta, titolo, sommario. */
export default function SchedaArticolo({
  articolo,
  conFoto = false,
  livello = "h3",
}: {
  articolo: Articolo;
  conFoto?: boolean;
  livello?: "h2" | "h3";
}) {
  const Titolo = livello;
  const foto = fotoArticolo(articolo);
  return (
    <article className="flex h-full flex-col border-t border-ink/20 pt-5">
      {conFoto ? (
        <Link href={`/blog/${articolo.slug}`} tabIndex={-1} aria-hidden="true" className="group mb-5 block">
          <div className="smusso relative aspect-[16/10] overflow-hidden bg-paper-2">
            <Image
              src={foto.src}
              alt=""
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-[1.2s] ease-[var(--e-out)] group-hover:scale-[1.04]"
            />
          </div>
        </Link>
      ) : null}
      <RigaMeta articolo={articolo} />
      <Titolo className="mt-4 font-disp text-2xl leading-tight font-bold">
        <Link href={`/blog/${articolo.slug}`} className="hover:underline hover:decoration-2 hover:underline-offset-4">
          {articolo.titolo}
        </Link>
      </Titolo>
      <p className="mt-4 flex-1 text-muted">{articolo.descrizione}</p>
      <Link href={`/blog/${articolo.slug}`} className="link mt-5 inline-flex w-fit items-center gap-2">
        Leggi la guida <span aria-hidden="true">→</span>
        <span className="sr-only">: {articolo.titolo}</span>
      </Link>
    </article>
  );
}
