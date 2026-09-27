import type { Metadata } from "next";
import Link from "next/link";
import FotoPiena from "@/components/ui/FotoPiena";
import { PAGINE } from "@/components/seo/pagine";

/* Next mette gia' noindex sulle risposte 404; lo diciamo anche qui, e il
   titolo non finge di essere la home. Follow resta: i link sotto portano
   dove serve. */
export const metadata: Metadata = {
  title: "Pagina non trovata",
  description: "Questa pagina di FUEL LAB non esiste o è stata spostata. Il menu del meal prep a Pescara, i servizi e i contatti sono a un clic.",
  robots: { index: false, follow: true },
};

const USCITE = [
  { href: "/menu", label: "Il menu" },
  { href: PAGINE.mealPrep.percorso, label: "Meal prep a Pescara" },
  { href: PAGINE.consegna.percorso, label: "Ritiro e consegna" },
  { href: "/come-funziona", label: "Come funziona" },
  { href: "/blog", label: "Blog" },
  { href: "/richiesta", label: "Scrivi a Matteo" },
];

/* La 404 sta fuori dal gruppo (sito), quindi senza nav: e' una pagina intera,
   scura, con due uscite chiare e le pagine piu' cercate sotto. */
export default function NonTrovata() {
  return (
    <main className="notte relative grid min-h-svh place-items-center overflow-hidden px-5 py-16">
      <FotoPiena foto="presa" velo="forte" />
      <div className="relative max-w-xl text-center">
        <p className="occhiello justify-center">Errore 404</p>
        <h1 className="titolo-xl mt-6">Serie saltata.</h1>
        <p className="mt-6 text-steel">Questa pagina non esiste, o non esiste più. Il menu invece c&apos;è sempre.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-4">
          <Link href="/" className="btn btn-lime">
            Torna alla home
          </Link>
          <Link href="/menu" className="link self-center">
            Guarda il menu
          </Link>
        </div>
        <nav aria-label="Pagine utili" className="mt-12 border-t pt-6" style={{ borderColor: "var(--line)" }}>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-steel">
            {USCITE.map((u) => (
              <li key={u.href}>
                <Link href={u.href} className="underline underline-offset-4 hover:text-lime">
                  {u.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}
