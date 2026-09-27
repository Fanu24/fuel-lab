import Image from "next/image";
import Link from "next/link";
import { FOTO } from "@/lib/immagini";
import FotoPiena from "@/components/ui/FotoPiena";
import WhatsAppCta from "@/components/ui/WhatsAppCta";

const FATTI = ["Fresco, mai surgelato", "Macro su ogni piatto", "Consegna lunedì e giovedì"];

/* Una foto, una frase, un bottone. Chi arriva deve capire in tre secondi che
   cosa fa FUEL LAB e dove si clicca: tutto il resto sta sotto.
   La palestra e' la foto; la cucina e' il riquadro in basso a destra (da lg in
   su, dove c'e' spazio): le due meta' di FUEL LAB nella prima schermata. */
export default function Hero() {
  return (
    <section className="notte relative flex min-h-[92svh] flex-col justify-end overflow-hidden">
      <FotoPiena foto="heroAtleta" prima />
      <figure
        className="smusso absolute right-[var(--gut)] bottom-36 hidden w-[260px] bg-night-2 lg:block xl:right-[calc((100vw-var(--wrap))/2)]"
        style={{ animation: "fuel-sale 1.1s var(--e-out) both 520ms" }}
      >
        <div className="relative aspect-[4/3]">
          <Image src={FOTO.ciotola.src} alt={FOTO.ciotola.alt} fill sizes="260px" className="object-cover" />
        </div>
        <figcaption className="flex items-center justify-between gap-3 px-4 py-3 font-disp text-[11px] font-semibold tracking-[.16em] uppercase">
          <span>Cucinato stamattina</span>
          <span className="whitespace-nowrap text-lime">Lun · Gio</span>
        </figcaption>
      </figure>
      <div className="wrap relative pt-32 pb-10 md:pb-14">
        {/* L'occhiello sta dentro l'h1: il titolo della pagina dice anche che
            cosa e dove ("meal prep a Pescara"), senza toccare la frase. */}
        <h1>
          <span className="occhiello" style={{ animation: "fuel-sale .8s var(--e-out) both" }}>
            Meal prep a Pescara
          </span>
          <span
            className="titolo-xl mt-6 block max-w-[11ch]"
            style={{ animation: "fuel-sale 1s var(--e-out) both 120ms" }}
          >
            Allenati. Al cibo ci pensa <span className="text-lime">Matteo.</span>
          </span>
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
          <WhatsAppCta buttonClassName="min-w-[min(100%,340px)] justify-between" />
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
