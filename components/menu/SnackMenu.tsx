import Image from "next/image";
import { extraPerReparto } from "@/lib/catalogo";
import AggiungiSnack from "./AggiungiSnack";

export default function SnackMenu() {
  const snack = extraPerReparto("snack");
  const nuovi = snack.filter((e) => e.novita);
  return <section id="snack" className="mt-20 scroll-mt-[calc(var(--nav-h)+24px)] border-t border-ink/20 pt-10" aria-labelledby="snack-titolo">
    <h2 id="snack-titolo" className="titolo">Qualcosa di buono, anche a merenda.</h2>
    {nuovi.map((e) => <article key={e.id} className="mt-8 grid gap-7 md:grid-cols-2 md:items-center md:gap-12">
      <div className="relative aspect-[4/3] overflow-hidden bg-paper-2">
        <Image src={e.img} alt="Foto illustrativa dei biscotti di avena e mandorle" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
        <span className="absolute top-3 left-3 bg-lime px-3 py-1 text-xs font-semibold text-ink">Novità</span>
        <span className="absolute right-3 bottom-3 bg-paper px-2 py-1 text-xs text-ink">Foto illustrativa</span>
      </div>
      <div>
        <h3 className="titolo-s">{e.nome}</h3>
        <p className="mt-3 text-muted">{e.descrizione}</p>
        <p className="mt-4 font-semibold">Su richiesta · porzione e prezzo da concordare</p>
        <p className="mt-3 text-sm">Allergeni: glutine, frutta a guscio (mandorle).</p>
        <AggiungiSnack snackId={e.id} />
        <details className="mt-5 border-t border-ink/15 pt-3">
          <summary className="min-h-11 cursor-pointer content-center text-sm font-semibold">Ingredienti dell’impasto</summary>
          <ul className="grid gap-2 text-sm">{e.ingredienti?.map((i) => <li key={i.nome} className="flex justify-between gap-4"><span>{i.nome}</span><span>{i.grammi} g</span></li>)}</ul>
          <p className="mt-3 text-xs text-muted">{e.notaRicetta}</p>
        </details>
      </div>
    </article>)}
    <details className="mt-8 border-y border-ink/15 py-3">
      <summary className="min-h-11 cursor-pointer content-center font-semibold">Altri snack e aggiunte</summary>
      <p className="mb-3 text-sm text-muted">Puoi sceglierli da “Aggiunte” nella tua settimana: {snack.filter((e) => !e.novita).map((e) => e.nome.toLowerCase()).join(", ")}. Disponibilità e supplementi si confermano con Matteo.</p>
    </details>
  </section>;
}
