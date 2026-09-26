import Link from "next/link";
import FotoPiena from "@/components/ui/FotoPiena";

const FATTI = ["Fresco, mai surgelato", "Macro su ogni piatto", "Consegna lunedì e giovedì"];

/* Una foto, una frase, un bottone. Chi arriva deve capire in tre secondi che
   cosa fa FUEL LAB e dove si clicca: tutto il resto sta sotto. */
export default function Hero() {
  return (
    <section className="notte relative flex min-h-[92svh] flex-col justify-end overflow-hidden">
      <FotoPiena foto="heroAtleta" prima />
      <div className="wrap relative pt-32 pb-10 md:pb-14">
        <p className="occhiello" style={{ animation: "fuel-sale .8s var(--e-out) both" }}>
          Meal prep · Pescara
        </p>
        <h1 className="titolo-xl mt-6 max-w-[11ch]" style={{ animation: "fuel-sale 1s var(--e-out) both 120ms" }}>
          Allenati. Al cibo ci pensa <span className="text-lime">Matteo.</span>
        </h1>
        <p
          className="lead mt-6"
          style={{ animation: "fuel-sale 1s var(--e-out) both 240ms", color: "rgb(243 239 230 / .86)" }}
        >
          Dici come ti alleni, la settimana si compone da sola. Piatti freschi pensati per il cardio e per i
          pesi, cucinati il lunedì e il giovedì.
        </p>
        <div
          className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4"
          style={{ animation: "fuel-sale 1s var(--e-out) both 360ms" }}
        >
          <Link href="/settimana" className="btn btn-lime">
            Componi la tua settimana <span className="freccia">→</span>
          </Link>
          <Link href="/menu" className="link">
            Guarda il menu
          </Link>
        </div>

        <ul
          className="mt-14 grid gap-3 border-t pt-6 font-disp text-[12px] font-semibold tracking-[.2em] uppercase sm:grid-cols-3"
          style={{ borderColor: "var(--line)" }}
        >
          {FATTI.map((f) => (
            <li key={f} className="flex items-center gap-3">
              <span className="h-2 w-2 bg-lime" aria-hidden="true" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
