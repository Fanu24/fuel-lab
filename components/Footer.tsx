import Image from "next/image";
import Link from "next/link";
import WhatsAppCta from "@/components/ui/WhatsAppCta";
import PrivacySettingsButton from "@/components/PrivacySettingsButton";

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
      { href: "/blog", label: "Blog · Meal prep a Pescara" },
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
              Cucina fresca per chi si allena. Via del Santuario 214, Pescara. Consegna in zona il lunedì e il
              giovedì.
            </p>
            <WhatsAppCta className="mt-8" buttonClassName="justify-between" />
            <a href="mailto:info@fuelchef.it" className="mt-5 inline-block text-steel underline underline-offset-4 hover:text-lime">info@fuelchef.it</a>
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
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <p>© FUEL LAB · Matteo Pattanè · Pescara</p>
            <p>Ragione sociale e P. IVA: in aggiornamento</p>
            <Link href="/privacy" className="underline underline-offset-4 hover:text-lime">Privacy e cookie</Link>
            <PrivacySettingsButton />
          </div>
          <p><Link href="/account" className="underline underline-offset-4">Area cliente</Link> · Nessun pagamento online: ordine e disponibilità si confermano con Matteo.</p>
        </div>
      </div>
    </footer>
  );
}
