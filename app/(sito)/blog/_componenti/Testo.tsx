import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { LINK_TESTO } from "@/lib/blog";

/**
 * Un testo del blog con i suoi link interni. Nei dati un link si scrive
 * [testo](/percorso): qui diventa un <Link>, tutto il resto resta testo.
 * Niente HTML nei dati, quindi niente dangerouslySetInnerHTML.
 */
export default function Testo({ children }: { children: string }) {
  const parti: ReactNode[] = [];
  let ultimo = 0;
  for (const corrispondenza of children.matchAll(LINK_TESTO)) {
    const inizio = corrispondenza.index ?? 0;
    if (inizio > ultimo) parti.push(children.slice(ultimo, inizio));
    parti.push(
      <Link
        key={inizio}
        href={corrispondenza[2]}
        className="font-semibold text-ink underline decoration-2 underline-offset-4 hover:decoration-lime"
      >
        {corrispondenza[1]}
      </Link>,
    );
    ultimo = inizio + corrispondenza[0].length;
  }
  if (ultimo < children.length) parti.push(children.slice(ultimo));
  return <Fragment>{parti}</Fragment>;
}
