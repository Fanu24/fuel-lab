import { serializzaJsonLd, type Nodo } from "./schema";

/**
 * Dati strutturati schema.org in un <script type="application/ld+json">.
 *
 * Un tag <script> nativo e non next/script: non e' codice da eseguire, e'
 * testo per i motori (lo dice anche la guida json-ld di Next). Un array di
 * nodi diventa un solo @graph, cosi' i riferimenti @id restano nello stesso
 * blocco. Il "<" e' sostituito da <: un testo del catalogo con dentro
 * "</script>" non puo' chiudere il tag prima del tempo.
 */
export default function JsonLd({ dati }: { dati: Nodo | Nodo[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializzaJsonLd(dati) }} />;
}
