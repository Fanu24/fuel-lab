"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { linkWhatsApp, messaggioServizio } from "@/lib/whatsapp";

const VOCI = [
  { href: "/menu", label: "Menu" },
  { href: "/servizi", label: "Servizi" },
  { href: "/settimana", label: "La tua settimana" },
  { href: "/scheda", label: "La tua scheda" },
  { href: "/chi-e-matteo", label: "Chi e Matteo" },
];

/**
 * CTA "Scrivici su WhatsApp", condivisa fra la nav desktop e il pannello
 * mobile. Se il numero non e' configurato, linkWhatsApp torna null: il
 * bottone resta visibile ma disabilitato con una spiegazione, non nascosto
 * e non cliccabile a vuoto (vedi lib/whatsapp.ts).
 */
function CtaWhatsApp({
  className,
  children,
  onClick,
}: {
  className: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const href = linkWhatsApp(messaggioServizio("nav"));

  if (!href) {
    return (
      <button type="button" className={className} disabled title="Numero WhatsApp non ancora configurato">
        {children}
      </button>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
      {children}
    </a>
  );
}

export default function Nav() {
  const [aperto, setAperto] = useState(false);
  const percorso = usePathname();

  // Il menu mobile e' un pannello a schermo pieno e va chiuso quando si naviga,
  // altrimenti resta sopra la pagina nuova. Lo chiudo sul click del link e non
  // con un effetto sul pathname: e' la stessa cosa per l'utente, ma non innesca
  // un render a cascata a ogni cambio pagina.
  const chiudi = () => setAperto(false);

  useEffect(() => {
    if (!aperto) return;
    const suEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAperto(false);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", suEsc);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", suEsc);
    };
  }, [aperto]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-60 flex justify-center pt-[22px]">
        <div
          className="flex h-[68px] w-[1180px] max-w-[calc(100%-40px)] items-center gap-[38px] rounded-full border pr-3 pl-[26px]"
          style={{
            // Vetro CHIARO, non piu' scuro: il fondo del sito e' chiaro adesso,
            // e la nav a vetro si inverte insieme (spec sezione 5, punto 2).
            // Il testo dentro passa a ink nello stesso cambiamento: fondo e
            // testo si muovono insieme, altrimenti il marchio torna invisibile
            // (era gia successo, difetto Critical corretto una volta).
            background: "rgba(244, 241, 232, .82)",
            backdropFilter: "blur(18px) saturate(140%)",
            WebkitBackdropFilter: "blur(18px) saturate(140%)",
            borderColor: "var(--hair)",
            boxShadow: "var(--sh-nav)",
          }}
        >
          <Link href="/" className="mr-auto flex items-center gap-[11px]" aria-label="FUEL LAB, home">
            <i
              className="block h-[22px] w-[11px] shrink-0 bg-lime"
              style={{ transform: "skewX(-12deg)" }}
              aria-hidden="true"
            />
            <span className="flex items-baseline gap-[6px]">
              <span
                className="font-disp text-[27px] leading-none tracking-[.02em] uppercase"
                style={{ color: "var(--color-ink)" }}
              >
                Fuel
              </span>
              <span
                className="font-disp text-[14px] leading-none tracking-[.06em] uppercase"
                style={{ color: "var(--color-ink)" }}
              >
                Lab
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {VOCI.map((v) => (
              <Link
                key={v.href}
                href={v.href}
                aria-current={percorso === v.href ? "page" : undefined}
                className="group relative py-[7px] text-[12px] tracking-[.13em] uppercase transition-colors duration-400"
                style={{
                  fontVariationSettings: '"wdth" 108, "wght" 600',
                  color: "var(--color-ink)",
                }}
              >
                {v.label}
                <span
                  className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-lime transition-transform duration-500"
                  style={{
                    transform: percorso === v.href ? "scaleX(1)" : "scaleX(0)",
                    transitionTimingFunction: "var(--e-out)",
                  }}
                />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-lime transition-transform duration-500 group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>

          <CtaWhatsApp className="btn btn-p btn-sm hidden sm:inline-flex">
            Scrivici su WhatsApp
            <span className="dot" aria-hidden="true">
              ↗
            </span>
          </CtaWhatsApp>

          <button
            type="button"
            onClick={() => setAperto((a) => !a)}
            aria-expanded={aperto}
            aria-controls="menu-mobile"
            aria-label={aperto ? "Chiudi il menu" : "Apri il menu"}
            className="relative grid h-[42px] w-[42px] place-items-center rounded-full border lg:hidden"
            style={{ borderColor: "var(--hair)", background: "rgba(223,255,62,.06)" }}
          >
            <span
              className="absolute block h-[2px] w-[18px] bg-ink transition-transform duration-500"
              style={{
                transitionTimingFunction: "var(--e-over)",
                transform: aperto ? "rotate(45deg)" : "translateY(-4px)",
              }}
            />
            <span
              className="absolute block h-[2px] w-[18px] bg-ink transition-transform duration-500"
              style={{
                transitionTimingFunction: "var(--e-over)",
                transform: aperto ? "rotate(-45deg)" : "translateY(4px)",
              }}
            />
          </button>
        </div>
      </header>

      {/* Pannello a schermo pieno. Prima questa direzione, sotto i 768px, nascondeva
          i link senza mettere niente al loro posto: il sito diventava inutilizzabile. */}
      <div
        id="menu-mobile"
        hidden={!aperto}
        className="fixed inset-0 z-50 flex flex-col justify-center px-8 lg:hidden"
        style={{
          background: "rgba(244, 241, 232, .96)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
        }}
      >
        <nav className="flex flex-col gap-2">
          {VOCI.map((v, i) => (
            <Link
              key={v.href}
              href={v.href}
              onClick={chiudi}
              className="h3 py-2 transition-colors duration-500"
              style={{
                animation: aperto ? `fuel-rise .7s var(--e-out) both ${90 + i * 60}ms` : undefined,
              }}
            >
              {v.label}
            </Link>
          ))}
        </nav>
        <CtaWhatsApp className="btn btn-p mt-10 w-max" onClick={chiudi}>
          Scrivici su WhatsApp
          <span className="dot" aria-hidden="true">
            ↗
          </span>
        </CtaWhatsApp>
      </div>
    </>
  );
}
