import Link from "next/link";

export default function Footer() {
  return (
    <footer className="pb-10">
      <div className="wrap">
        <div
          className="flex flex-wrap items-end justify-between gap-10 border-t pt-10"
          style={{ borderColor: "var(--hair-soft)" }}
        >
          <Link href="/" aria-label="FUEL LAB, home" className="block transition-opacity duration-700 hover:opacity-80">
            {/* Il PNG intero (1001x704, trasparente) compare qui perche' il footer ha
                spazio: sotto i ~90px la faccia del cuoco dentro il logo diventa
                illeggibile, ed e' per questo che in nav il marchio e' a testo. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-fuellab.png"
              alt="Logo FUEL LAB"
              loading="lazy"
              width={220}
              className="h-auto w-[220px]"
            />
          </Link>

          <div className="flex flex-col items-start gap-4 pb-3 sm:items-end">
            <nav className="flex flex-wrap gap-x-7 gap-y-2">
              {[
                { href: "/menu", label: "Menu" },
                { href: "/come-funziona", label: "Come funziona" },
                { href: "/scheda", label: "La tua scheda" },
                { href: "/chi-e-matteo", label: "Chi e Matteo" },
                { href: "/settimana", label: "Componi la settimana" },
              ].map((v) => (
                <Link
                  key={v.href}
                  href={v.href}
                  className="text-[12px] tracking-[.13em] uppercase transition-colors duration-400 hover:text-ink"
                  style={{ fontVariationSettings: '"wdth" 108, "wght" 600' }}
                >
                  {v.label}
                </Link>
              ))}
            </nav>
            <p className="note">Matteo Pantan&egrave; &middot; Pescara &middot; Cucinato il luned&igrave; e il gioved&igrave;</p>
            <p className="note" style={{ letterSpacing: ".12em" }}>
              Demo dimostrativa &mdash; nessun ordine viene registrato
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
