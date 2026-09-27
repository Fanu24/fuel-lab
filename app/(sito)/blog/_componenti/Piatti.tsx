import Image from "next/image";
import Link from "next/link";
import { etichettaAllenamento, getPiatto, type Piatto } from "@/lib/catalogo";
import TagAllenamento from "@/components/ui/TagAllenamento";
import { NumeriMacro } from "@/components/ui/Macro";

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
            <p className="mt-3 text-muted">Valori della porzione intera, aggiornati dal menu. Foto illustrative.</p>
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
              <NumeriMacro macro={piatto} compatti className="mt-4" />
              <p className="mt-2 text-sm text-muted">
                Porzione da <span className="num">{piatto.grammi}</span> g
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** La tabella di confronto dei piatti, dentro una sezione dell’articolo. */
export function TabellaPiatti({ id }: { id: string[] }) {
  const piatti = piattiDa(id);
  if (!piatti.length) return null;
  return (
    <figure className="mt-7">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <caption className="sr-only">Piatti del menu con allenamento indicato e valori per porzione</caption>
          <thead>
            <tr className="border-b-[3px] border-ink">
              <th scope="col" className="py-3 pr-4 font-disp text-xs tracking-[.14em] uppercase">Piatto</th>
              <th scope="col" className="py-3 pr-4 font-disp text-xs tracking-[.14em] uppercase">Allenamento</th>
              <th scope="col" className="py-3 pr-4 text-right font-disp text-xs tracking-[.14em] uppercase">kcal</th>
              <th scope="col" className="py-3 pr-4 text-right font-disp text-xs tracking-[.14em] uppercase">Prot.</th>
              <th scope="col" className="py-3 pr-4 text-right font-disp text-xs tracking-[.14em] uppercase">Carbo</th>
              <th scope="col" className="py-3 text-right font-disp text-xs tracking-[.14em] uppercase">Grassi</th>
            </tr>
          </thead>
          <tbody>
            {piatti.map((piatto) => (
              <tr key={piatto.id} className="border-b" style={{ borderColor: "var(--line)" }}>
                <th scope="row" className="py-3 pr-4 font-semibold">
                  <Link href={`/menu/${piatto.id}`} className="underline decoration-2 underline-offset-4 hover:decoration-lime">
                    {piatto.nome}
                  </Link>
                </th>
                <td className="py-3 pr-4 text-muted">{etichettaAllenamento(piatto.allenamento)}</td>
                <td className="num py-3 pr-4 text-right">{piatto.kcal}</td>
                <td className="num py-3 pr-4 text-right">{piatto.proteine} g</td>
                <td className="num py-3 pr-4 text-right">{piatto.carboidrati} g</td>
                <td className="num py-3 text-right">{piatto.grassi} g</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="mt-3 text-sm text-muted">Valori per porzione intera, dal menu FUEL LAB.</figcaption>
    </figure>
  );
}
