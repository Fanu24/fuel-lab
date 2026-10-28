import Image from "next/image";
import Link from "next/link";
import type { Piatto } from "@/lib/catalogo";
import BollinoNonDisponibile from "@/components/impostazioni/BollinoNonDisponibile";

/**
 * La carta di un piatto: foto grande, allenamento, nome, due numeri.
 * Tutto il resto (ingredienti, perche' funziona, allergeni) sta nella scheda
 * del piatto: la carta deve far venire voglia di aprirla, non sostituirla.
 */
export default function CartaPiatto({ piatto, grande = false, priorita = false }: { piatto: Piatto; grande?: boolean; priorita?: boolean }) {
  return (
    <Link href={`/menu/${piatto.id}`} className="group block">
      <div className={`foto-piatto smusso relative overflow-hidden bg-paper-2 ${grande ? "aspect-[4/3]" : "aspect-[4/3]"}`}>
        <Image
          src={piatto.img}
          alt=""
          fill
          priority={priorita}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 85vw"
          className="object-cover transition-transform duration-[1.2s] ease-[var(--e-out)] group-hover:scale-[1.04]"
        />
        {/* Dalle impostazioni di Matteo, lette nel browser: sopra la foto, non sposta niente. */}
        <BollinoNonDisponibile piattoId={piatto.id} className="absolute top-4 right-4" />
        {piatto.novita ? <span className="absolute top-3 left-3 bg-lime px-3 py-1 text-xs font-semibold text-ink">Novità</span> : null}
        <span className="absolute right-3 bottom-3 bg-paper px-2 py-1 text-xs text-ink">Foto illustrativa</span>
      </div>
      <h3 className="titolo-s mt-5 group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
        {piatto.nome}
      </h3>
      <p className="mt-2 text-sm text-muted">Ingredienti e dettagli <span aria-hidden="true">→</span></p>
    </Link>
  );
}
