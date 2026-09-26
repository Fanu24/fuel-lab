import Image from "next/image";
import Link from "next/link";

const COLONNE = [
  {
    titolo: "Mangia",
    voci: [
      { href: "/menu", label: "Il menu" },
      { href: "/settimana", label: "Componi la settimana" },
      { href: "/scheda", label: "Dai tuoi macro" },
    ],
  },
  {
    titolo: "Scopri",
    voci: [
      { href: "/come-funziona", label: "Come funziona" },
      { href: "/servizi", label: "Servizi e prezzi" },
      { href: "/chi-e-matteo", label: "Chi è Matteo" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="notte pt-20 pb-10 md:pt-28">
      <div className="wrap">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" aria-label="FUEL LAB, home" className="inline-block">
              <Image
                src="/logo-fuellab.png"
                alt=""
                width={1095}
                height={360}
                className="h-auto w-[220px] invert md:w-[300px]"
              />
            </Link>
            <p className="mt-8 max-w-[34ch] text-steel">
              Cucina fresca per chi si allena. Via del Santuario 14, Pescara. Consegna in zona il lunedì e il
              giovedì.
            </p>
            <Link href="/richiesta" className="btn btn-lime mt-8">
              Scrivi a Matteo <span className="freccia">→</span>
            </Link>
          </div>

          {COLONNE.map((c) => (
            <nav key={c.titolo} aria-label={c.titolo}>
              <p className="occhiello text-steel">{c.titolo}</p>
              <ul className="mt-6 grid">
                {c.voci.map((v) => (
                  <li key={v.href}>
                    <Link
                      href={v.href}
                      className="inline-flex min-h-11 items-center font-disp text-lg font-semibold uppercase tracking-[.06em] hover:text-lime"
                    >
                      {v.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div
          className="mt-20 flex flex-wrap justify-between gap-4 border-t pt-6 text-sm text-steel"
          style={{ borderColor: "var(--line)" }}
        >
          <p>© FUEL LAB · Matteo Pantanè · Pescara</p>
          <p>Sito dimostrativo: nessun ordine viene addebitato, la richiesta arriva su WhatsApp.</p>
        </div>
      </div>
    </footer>
  );
}
