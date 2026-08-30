import Link from "next/link";

export default function Footer() {
  return (
    <footer className="pb-6 md:pb-10">
      <div className="wrap">
        <div
          className="flex flex-wrap items-end justify-between gap-6 border-t pt-6 md:gap-10 md:pt-10"
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
              className="h-auto w-[150px] md:w-[220px]"
            />
          </Link>

          <div className="flex flex-col items-start gap-3 pb-0 sm:items-end md:gap-4 md:pb-3">
            <nav className="flex flex-wrap gap-x-6 gap-y-0.5 md:gap-x-7 md:gap-y-2">
              {[
                { href: "/menu", label: "Menu" },
                { href: "/come-funziona", label: "Come funziona" },
                { href: "/scheda", label: "La tua scheda" },
                { href: "/chi-e-matteo", label: "Chi è Matteo" },
                { href: "/settimana", label: "Componi la settimana" },
              ].map((v) => (
                <Link
                  key={v.href}
                  href={v.href}
                  className="inline-flex min-h-[44px] items-center text-[12px] tracking-[.13em] uppercase transition-colors duration-400 hover:text-ink md:min-h-0"
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
