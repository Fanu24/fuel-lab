import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { INTERVALLO_NUMERICO, LINK_TESTO, unisciUnita } from "@/lib/blog";

/** Il testo semplice: unità attaccate al numero, intervalli ("20–40 g") su una riga sola. */
function testoCurato(testo: string, chiave: number): ReactNode[] {
  return unisciUnita(testo)
    .split(INTERVALLO_NUMERICO)
    .map((parte, indice) =>
      indice % 2 === 1 ? (
        <span key={`${chiave}-${indice}`} className="whitespace-nowrap">
          {parte}
        </span>
      ) : (
        parte
      ),
    );
}

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
    if (inizio > ultimo) parti.push(...testoCurato(children.slice(ultimo, inizio), ultimo));
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
  if (ultimo < children.length) parti.push(...testoCurato(children.slice(ultimo), ultimo));
  return <Fragment>{parti}</Fragment>;
}
