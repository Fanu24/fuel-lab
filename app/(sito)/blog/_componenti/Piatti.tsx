import Image from "next/image";
import Link from "next/link";
import { etichettaAllenamento, getPiatto, type Piatto } from "@/lib/catalogo";
import TagAllenamento from "@/components/ui/TagAllenamento";
import { NumeriMacro } from "@/components/ui/Macro";
import { nutrizioneDisponibile } from "@/lib/nutrizione";

/* I piatti dentro gli articoli. Numeri e foto arrivano sempre dal catalogo:
   se Matteo cambia una ricetta, l’articolo si aggiorna da solo. */

function piattiDa(id: string[]): Piatto[] {
  return id.map(getPiatto).filter((p): p is Piatto => Boolean(p));
}

/** Il riquadro "Piatti collegati": foto, allenamento, macro della porzione. */
export function PiattiCollegati({ id }: { id: string[] }) {
  const piatti = piattiDa(id);
  if (!piatti.length) return null;
  return (
    <section id="piatti-collegati" aria-labelledby="titolo-piatti-collegati" className="sezione carta-2">
      <div className="wrap">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="occhiello">Dal menu FUEL LAB</p>
            <h2 id="titolo-piatti-collegati" className="titolo-s mt-4">
              Piatti collegati
            </h2>
            <p className="mt-3 text-muted">Ingredienti e stime disponibili nelle schede. Foto illustrative.</p>
          </div>
          <Link href="/menu" className="link">
            Tutto il menu <span aria-hidden="true">→</span>
          </Link>
        </div>
        <ul className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {piatti.map((piatto) => (
            <li key={piatto.id}>
              <Link href={`/menu/${piatto.id}`} className="group block">
                <div className="smusso relative aspect-[4/3] overflow-hidden bg-paper">
                  <Image
                    src={piatto.img}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-[1.2s] ease-[var(--e-out)] group-hover:scale-[1.04]"
                  />
                  <TagAllenamento tipo={piatto.allenamento} className="absolute top-4 left-4" />
                </div>
                <h3 className="titolo-s mt-5 group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
                  {piatto.nome}
                </h3>
              </Link>
              {nutrizioneDisponibile(piatto.id) ? <NumeriMacro macro={piatto} compatti className="mt-4" /> : null}
              <p className="mt-2 text-sm text-muted">
                {nutrizioneDisponibile(piatto.id) ? "Valori stimati per una porzione." : "Valori nutrizionali da completare con Matteo."}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * La tabella di confronto dei piatti, dentro una sezione dell’articolo. Sotto i
 * 640px ogni piatto diventa una scheda (nome, allenamento, poi i quattro numeri
 * in fila con la loro etichetta): le colonne dei macro, tagliate a destra, erano
 * proprio quello che il lettore cercava. Le regole sono in app/styles/blog.css.
 */
export function TabellaPiatti({ id }: { id: string[] }) {
  const piatti = piattiDa(id);
  if (!piatti.length) return null;
  const numeri = [
    { nome: "kcal", valore: (p: Piatto) => `${p.kcal}` },
    { nome: "Prot.", valore: (p: Piatto) => `${p.proteine} g` },
    { nome: "Carbo", valore: (p: Piatto) => `${p.carboidrati} g` },
    { nome: "Grassi", valore: (p: Piatto) => `${p.grassi} g` },
  ];
  return (
    <figure className="mt-7">
      <div className="overflow-x-auto">
        <table className="blog-tabella blog-tabella-piatti" role="table">
          <caption className="sr-only">Piatti del menu con allenamento indicato e valori per porzione</caption>
          <thead>
            <tr role="row">
              <th scope="col" role="columnheader">Piatto</th>
              <th scope="col" role="columnheader">Allenamento</th>
              {numeri.map((numero) => (
                <th key={numero.nome} scope="col" role="columnheader" className="blog-numero">
                  {numero.nome}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {piatti.map((piatto) => (
              <tr key={piatto.id} role="row">
                <th scope="row" role="rowheader">
                  <Link href={`/menu/${piatto.id}`} className="underline decoration-2 underline-offset-4 hover:decoration-lime">
                    {piatto.nome}
                  </Link>
                </th>
                <td role="cell" className="blog-allenamento">
                  {etichettaAllenamento(piatto.allenamento)}
                </td>
                {numeri.map((numero) => (
                  <td key={numero.nome} role="cell" data-label={numero.nome} className="blog-numero num">
                    {nutrizioneDisponibile(piatto.id) ? numero.valore(piatto) : "Da confermare"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="mt-3 text-sm text-muted">Stime per una porzione; riso e pasta pesati cotti. Ipotesi e quantità mancanti sono indicate nelle schede.</figcaption>
    </figure>
  );
}
