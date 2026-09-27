import Link from "next/link";
import Reveal from "@/components/Reveal";
import FotoPiena from "@/components/ui/FotoPiena";
import WhatsAppCta from "@/components/ui/WhatsAppCta";

export default function ChiusuraCta({
  titolo = "Ti risponde Matteo. Non un call center.",
  testo = "Componi la settimana e scrivi a Matteo per confermare disponibilità, ritiro o consegna. Se hai una scheda del nutrizionista, parti da quella.",
}: {
  titolo?: string;
  testo?: string;
}) {
  return (
    <section className="notte relative overflow-hidden">
      <FotoPiena foto="cuoco" velo="forte" />
      <div className="wrap relative py-[calc(var(--sezione)*1.2)]">
        <Reveal>
          <h2 className="titolo max-w-[15ch]">{titolo}</h2>
          <p className="mt-6 max-w-[48ch]" style={{ color: "rgb(243 239 230 / .88)" }}>
            {testo}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <WhatsAppCta buttonClassName="min-w-[min(100%,340px)] justify-between" />
            <Link href="/richiesta" className="link">Scrivi via email</Link>
            <Link href="/scheda" className="link">
              Parto dalla mia scheda
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
