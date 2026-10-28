import Image from "next/image";
import Link from "next/link";
import { categoriaPerId, dataLeggibile, fotoArticolo, minutiLettura, type Articolo } from "@/lib/blog";

/**
 * Categoria, data e tempo di lettura: la riga sopra ogni titolo di guida.
 * Dentro una pagina di categoria il nome della categoria si toglie (sarebbe lo
 * stesso su ogni scheda). La data è quella dell’ultimo aggiornamento, e lo dice
 * solo quando è diversa da quella di pubblicazione.
 */
export function RigaMeta({
  articolo,
  className = "",
  conCategoria = true,
}: {
  articolo: Articolo;
  className?: string;
  conCategoria?: boolean;
}) {
  const categoria = conCategoria ? categoriaPerId(articolo.categoria) : undefined;
  const aggiornata = Boolean(articolo.aggiornato && articolo.aggiornato > articolo.data);
  const data = aggiornata ? (articolo.aggiornato as string) : articolo.data;
  return (
    <p className={`num flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted ${className}`}>
      {categoria ? (
        <>
          <span className="whitespace-nowrap">{categoria.nome}</span>
          <span aria-hidden="true">·</span>
        </>
      ) : null}
      <span className="whitespace-nowrap">
        {aggiornata ? "Aggiornata il " : ""}
        <time dateTime={data}>{dataLeggibile(data)}</time>
      </span>
      <span aria-hidden="true">·</span>
      <span className="whitespace-nowrap">{minutiLettura(articolo)} min di lettura</span>
    </p>
  );
}

/**
 * La card di una guida negli elenchi: foto facoltativa, meta, titolo, sommario.
 * Un solo link, quello del titolo, steso su tutta la card: chi usa la tastiera
 * o lo screen reader trova un link per guida (non due), e sul telefono si
 * tocca ovunque.
 */
export default function SchedaArticolo({
  articolo,
  conFoto = false,
  livello = "h3",
  conCategoria = true,
}: {
  articolo: Articolo;
  conFoto?: boolean;
  livello?: "h2" | "h3";
  conCategoria?: boolean;
}) {
  const Titolo = livello;
  const foto = fotoArticolo(articolo);
  return (
    <article className="group/scheda relative flex h-full flex-col border-t border-ink/20 pt-5">
      {conFoto ? (
        <div className="smusso relative mb-5 aspect-[16/10] overflow-hidden bg-paper-2">
          <Image
            src={foto.src}
            style={{ objectPosition: foto.fuoco }}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-[1.2s] ease-[var(--e-out)] group-hover/scheda:scale-[1.04]"
          />
        </div>
      ) : null}
      <RigaMeta articolo={articolo} conCategoria={conCategoria} />
      <Titolo className="mt-4 font-disp text-2xl leading-tight font-bold">
        <Link
          href={`/blog/${articolo.slug}`}
          className="after:absolute after:inset-0 group-hover/scheda:underline group-hover/scheda:decoration-2 group-hover/scheda:underline-offset-4"
        >
          {articolo.titolo}
        </Link>
      </Titolo>
      <p className="mt-4 flex-1 text-muted">{articolo.descrizione}</p>
      <span aria-hidden="true" className="link mt-5 inline-flex w-fit items-center gap-2 group-hover/scheda:decoration-lime">
        Leggi la guida <span className="freccia group-hover/scheda:translate-x-1">→</span>
      </span>
    </article>
  );
}
