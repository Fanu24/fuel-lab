import Link from "next/link";
import type { Briciola } from "./schema";

/**
 * Il percorso visibile ("Home / Menu / Il piatto"). La home si aggiunge da
 * sola; l'ultima voce e' la pagina corrente, senza link. I dati strutturati
 * BreadcrumbList li scrive nodiPagina() con le stesse voci: qui c'e' solo
 * quello che si vede.
 */
export default function Briciole({ voci, className = "" }: { voci: Briciola[]; className?: string }) {
  const tutte = [{ nome: "Home", href: "/" }, ...voci];
  return (
    <nav aria-label="Percorso" className={`text-sm ${className}`}>
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {tutte.map((v, i) => {
          const ultima = i === tutte.length - 1;
          return (
            <li key={v.href} className="flex items-center gap-x-3">
              {i > 0 ? (
                <span aria-hidden="true" className="text-muted">
                  /
                </span>
              ) : null}
              {ultima ? (
                <span aria-current="page" className="text-muted">
                  {v.nome}
                </span>
              ) : (
                <Link href={v.href} className="link">
                  {v.nome}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
