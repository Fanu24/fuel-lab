import type { ReactNode } from "react";

export interface Domanda {
  q: string;
  a: ReactNode;
}

/**
 * Accordion su <details>/<summary> nativi: apertura, tastiera, ruolo ARIA e la
 * ricerca del browser dentro il testo chiuso arrivano gratis dal markup.
 * Le domande non si escludono a vicenda: chi confronta due risposte vuole
 * leggerle affiancate.
 */
export default function Faq({ domande }: { domande: Domanda[] }) {
  return (
    <div className="min-w-0 border-t-[3px] border-ink">
      {domande.map((d) => (
        <details key={d.q} className="group border-b border-ink/15">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 font-disp text-lg font-semibold tracking-[.02em] [overflow-wrap:anywhere] uppercase md:text-xl">{d.q}</span>
            <span
              aria-hidden="true"
              className="grid h-9 w-9 shrink-0 place-items-center bg-ink text-xl text-paper transition-transform duration-500 group-open:rotate-45 group-open:bg-lime group-open:text-ink"
            >
              +
            </span>
          </summary>
          <div className="max-w-[64ch] pb-7 text-lg leading-relaxed text-muted">{d.a}</div>
        </details>
      ))}
    </div>
  );
}
