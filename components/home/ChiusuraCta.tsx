import Link from "next/link";
import Reveal from "@/components/Reveal";
import FotoPiena from "@/components/ui/FotoPiena";
import WhatsAppCta from "@/components/ui/WhatsAppCta";

export default function ChiusuraCta({
  titolo = "Lascia i fornelli a Matteo.",
  testo = "Scegli il menu. Con Matteo concordi giorno, ritiro o consegna.",
}: {
  titolo?: string;
  testo?: string;
}) {
  return (
    <section className="notte overflow-hidden">
      <div className="grid md:grid-cols-2">
        <div className="flex items-center px-6 py-14 sm:px-10 md:py-20 lg:px-16">
          <Reveal>
            <h2 className="titolo max-w-[15ch]">{titolo}</h2>
            <p className="mt-6 max-w-[40ch] text-steel">{testo}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
              <WhatsAppCta buttonClassName="min-w-[min(100%,340px)] justify-between" />
              <Link href="/settimana" className="link">Componi la settimana</Link>
            </div>
          </Reveal>
        </div>
        <div className="relative h-[440px] md:h-auto md:min-h-[540px]">
          <FotoPiena foto="cuocoNitido" velo={false} sizes="(min-width: 768px) 50vw, 100vw" />
        </div>
      </div>
    </section>
  );
}
