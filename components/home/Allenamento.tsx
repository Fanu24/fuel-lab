import Link from "next/link";
import Reveal from "@/components/Reveal";
import FotoPiena from "@/components/ui/FotoPiena";
import { CONSIGLI } from "@/lib/consigli";

/* La richiesta piu' precisa del committente: dire come abbinare il pasto al
   tipo di allenamento. Due metà, due foto, una regola ciascuna. */
export default function Allenamento() {
  const due = [CONSIGLI.cardio, CONSIGLI.pesi];
  return (
    <section className="notte">
      <div className="wrap pt-[var(--sezione)] pb-12">
        <Reveal>
          <p className="occhiello">I consigli di Matteo</p>
          <h2 className="titolo mt-5 max-w-[16ch]">Mangia come ti alleni.</h2>
        </Reveal>
      </div>
      <div className="grid md:grid-cols-2">
        {due.map((c) => (
          <article key={c.id} className="relative flex min-h-[520px] flex-col justify-end overflow-hidden md:min-h-[640px]">
            <FotoPiena foto={c.foto} sizes="(min-width: 768px) 50vw, 100vw" />
            <Reveal className="relative p-6 md:p-12">
              <p className="occhiello">{c.nome}</p>
              {/* A meta' pagina (da 768 px) il titolo grande non entra nella colonna: "L'ALLENAMENTO." sconfinava nell'altra. */}
              <h3 className="titolo mt-4 text-lime md:text-[clamp(28px,3.6vw,56px)]">{c.regola}</h3>
              <p className="mt-4 max-w-[42ch]" style={{ color: "rgb(243 239 230 / .88)" }}>
                {c.perche}
              </p>
            </Reveal>
          </article>
        ))}
      </div>
      <div className="wrap flex flex-wrap items-center justify-between gap-6 py-10">
        <p className="max-w-[52ch] text-steel">
          Il compositore parte da questi consigli: scegli l&apos;allenamento di ogni giorno e ti propone i piatti.
        </p>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link href="/pasti-proteici-pescara" className="link">
            Pasti proteici, i numeri
          </Link>
          <Link href="/settimana" className="btn btn-linea">
            Prova il compositore <span className="freccia">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
