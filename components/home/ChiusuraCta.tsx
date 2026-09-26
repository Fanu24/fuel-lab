import Link from "next/link";
import Reveal from "@/components/Reveal";
import FotoPiena from "@/components/ui/FotoPiena";

export default function ChiusuraCta({
  titolo = "Ti risponde Matteo. Non un call center.",
  testo = "Componi la settimana, mandala su WhatsApp: Matteo conferma e ti dice quando arriva. Se hai una scheda del nutrizionista, parti da quella.",
}: {
  titolo?: string;
  testo?: string;
}) {
  return (
    <section className="notte relative overflow-hidden">
      <FotoPiena foto="cuoco" />
      <div className="wrap relative py-[calc(var(--sezione)*1.2)]">
        <Reveal>
          <h2 className="titolo max-w-[15ch]">{titolo}</h2>
          <p className="mt-6 max-w-[48ch]" style={{ color: "rgb(243 239 230 / .88)" }}>
            {testo}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link href="/settimana" className="btn btn-lime">
              Componi la settimana <span className="freccia">→</span>
            </Link>
            <Link href="/scheda" className="link">
              Parto dalla mia scheda
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
