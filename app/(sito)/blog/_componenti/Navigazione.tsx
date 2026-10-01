import Link from "next/link";
import { CATEGORIE, articoliPerCategoria, type CategoriaId } from "@/lib/blog";

export type VoceBriciole = { nome: string; href?: string };

/** Il percorso visibile. L’ultima voce è la pagina corrente, senza link. */
export function Briciole({ voci }: { voci: VoceBriciole[] }) {
  return (
    <nav aria-label="Percorso" className="text-sm">
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted">
        {voci.map((voce, indice) => {
          const ultima = indice === voci.length - 1;
          /* Il titolo di una guida e' lungo: sul telefono non entra nella riga e finiva sotto, con una barra sola in fondo
             alla riga sopra. Sotto i 640px resta nascosto (il titolo e' l'h1 qui sotto); la barra apre ogni voce, cosi'
             non resta mai appesa. */
          const lunga = ultima && voce.nome.length > 28;
          return (
            <li key={`${voce.nome}-${indice}`} className={`${lunga ? "hidden sm:flex" : "flex"} min-w-0 items-center gap-3`}>
              {indice > 0 ? <span aria-hidden="true">/</span> : null}
              {/* py-3: l’area da toccare arriva a 44px senza spostare le righe (su un inline il padding non le muove) */}
              {voce.href && !ultima ? (
                <Link href={voce.href} className="py-3 font-semibold text-ink underline decoration-2 underline-offset-4 hover:decoration-lime">
                  {voce.nome}
                </Link>
              ) : (
                <span aria-current={ultima ? "page" : undefined} className="line-clamp-1">
                  {voce.nome}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * I filtri per categoria: link veri a pagine statiche, non bottoni che
 * nascondono card. Ogni categoria ha il suo indirizzo e i suoi metadata.
 */
export function FiltriCategorie({ attiva }: { attiva?: CategoriaId }) {
  const base =
    "inline-flex min-h-11 items-center gap-2 border-2 px-2.5 font-disp text-xs font-bold tracking-[.1em] whitespace-nowrap uppercase transition-colors sm:px-4 sm:tracking-[.14em]";
  const spenta = "border-ink/25 hover:border-ink";
  const accesa = "border-ink bg-ink text-paper";
  return (
    <nav aria-label="Categorie del blog">
      {/* Sul telefono i filtri stanno su una riga che scorre (cinque righe di bottoni riempivano il primo schermo e
          la prima guida finiva sotto); la categoria aperta passa in testa, cosi' non resta fuori vista. */}
      <ul className="-mx-[var(--gut)] flex gap-2 overflow-x-auto px-[var(--gut)] pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
        <li>
          <Link href="/blog" aria-current={attiva ? undefined : "page"} className={`${base} ${attiva ? spenta : accesa}`}>
            Tutte le guide
          </Link>
        </li>
        {CATEGORIE.map((categoria) => (
          <li key={categoria.id} className={attiva === categoria.id ? "order-first sm:order-none" : undefined}>
            <Link
              href={`/blog/categoria/${categoria.id}`}
              aria-current={attiva === categoria.id ? "page" : undefined}
              className={`${base} ${attiva === categoria.id ? accesa : spenta}`}
            >
              {categoria.nome}
              <span className="num font-normal opacity-70">{articoliPerCategoria(categoria.id).length}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
