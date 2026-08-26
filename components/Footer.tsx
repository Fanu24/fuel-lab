import Link from "next/link";

export default function Footer() {
  return (
    <footer className="pb-10">
      <div className="wrap">
        <div
          className="flex flex-wrap items-end justify-between gap-10 border-t pt-10"
          style={{ borderColor: "var(--hair-soft)" }}
        >
          <Link
            href="/"
            className="font-disp text-[clamp(64px,11vw,112px)] leading-[.74] uppercase transition-colors duration-700"
            style={{
              color: "transparent",
              WebkitTextStroke: "1.6px rgba(223,255,62,.42)",
              transitionTimingFunction: "var(--e-out)",
            }}
          >
            Fuel
          </Link>

          <div className="flex flex-col items-start gap-4 pb-3 sm:items-end">
            <nav className="flex flex-wrap gap-x-7 gap-y-2">
              {[
                { href: "/menu", label: "Menu" },
                { href: "/come-funziona", label: "Come funziona" },
                { href: "/scheda", label: "La tua scheda" },
                { href: "/chi-e-matteo", label: "Chi e Matteo" },
                { href: "/box", label: "Componi il box" },
              ].map((v) => (
                <Link
                  key={v.href}
                  href={v.href}
                  className="text-[12px] tracking-[.13em] uppercase transition-colors duration-400 hover:text-lime"
                  style={{ fontVariationSettings: '"wdth" 108, "wght" 600' }}
                >
                  {v.label}
                </Link>
              ))}
            </nav>
            <p className="note">Matteo Pantane &middot; Pescara &middot; Cucinato il lunedi e il giovedi</p>
            <p className="note" style={{ letterSpacing: ".12em" }}>
              Demo dimostrativa &mdash; nessun ordine viene registrato
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
