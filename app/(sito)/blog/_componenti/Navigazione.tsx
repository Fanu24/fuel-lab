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
          return (
            <li key={`${voce.nome}-${indice}`} className="flex min-w-0 items-center gap-3">
              {voce.href && !ultima ? (
                <Link href={voce.href} className="font-semibold text-ink underline decoration-2 underline-offset-4 hover:decoration-lime">
                  {voce.nome}
                </Link>
              ) : (
                <span aria-current={ultima ? "page" : undefined} className="line-clamp-1">
                  {voce.nome}
                </span>
              )}
              {!ultima ? <span aria-hidden="true">/</span> : null}
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
    "inline-flex min-h-11 items-center gap-2 border-2 px-4 font-disp text-xs font-bold tracking-[.14em] uppercase transition-colors";
  const spenta = "border-ink/25 hover:border-ink";
  const accesa = "border-ink bg-ink text-paper";
  return (
    <nav aria-label="Categorie del blog">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link href="/blog" aria-current={attiva ? undefined : "page"} className={`${base} ${attiva ? spenta : accesa}`}>
            Tutte le guide
          </Link>
        </li>
        {CATEGORIE.map((categoria) => (
          <li key={categoria.id}>
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
