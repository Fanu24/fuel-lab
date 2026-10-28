import Link from "next/link";
import FotoPiena from "@/components/ui/FotoPiena";
import { PREZZO_DA_TESTO } from "@/lib/abbonamento";

export default function Hero() {
  return (
    <section className="notte relative flex min-h-[92svh] flex-col justify-end overflow-hidden">
      <FotoPiena foto="heroAtleta" prima />
      <div className="wrap relative pt-32 pb-10 md:pb-14">
        <h1>
          <span className="occhiello">Meal prep a Pescara</span>
          <span className="titolo-xl mt-6 block max-w-[11ch]">
            Allenati. Al cibo ci pensa <span className="text-lime">Matteo.</span>
          </span>
        </h1>
        <p className="mt-6 max-w-[34ch] text-lg text-paper/90 md:text-xl">
          Piatti freschi, pronti per la tua settimana.
        </p>
        <div className="mt-8 flex max-w-[370px] flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-7">
          <Link href="/abbonamento" className="btn btn-lime justify-between">
            Scegli l&apos;abbonamento <span aria-hidden="true">→</span>
          </Link>
          <Link href="/settimana" className="inline-flex min-h-12 items-center justify-between gap-3 font-semibold underline underline-offset-4">
            Componi la tua settimana <span aria-hidden="true">→</span>
          </Link>
        </div>
        <p className="mt-4 text-sm text-paper/80">Abbonamenti da {PREZZO_DA_TESTO} al mese.</p>
      </div>
    </section>
  );
}
