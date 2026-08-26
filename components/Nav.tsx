"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";

const VOCI = [
  { href: "/menu", label: "Menu" },
  { href: "/come-funziona", label: "Come funziona" },
  { href: "/scheda", label: "La tua scheda" },
  { href: "/chi-e-matteo", label: "Chi e Matteo" },
];

export default function Nav() {
  const [aperto, setAperto] = useState(false);
  const { pasti, pronto } = useCart();
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
            background: "rgba(11,33,25,.78)",
            backdropFilter: "blur(18px) saturate(140%)",
            WebkitBackdropFilter: "blur(18px) saturate(140%)",
            borderColor: "var(--hair)",
            boxShadow: "inset 0 1px 0 rgba(223,255,62,.1), 0 24px 54px -32px rgba(3,12,8,.9)",
          }}
        >
          <Link href="/" className="mr-auto flex items-center gap-[11px]" aria-label="FUEL, home">
            <i className="block h-[22px] w-[11px] bg-lime" style={{ transform: "skewX(-12deg)" }} />
            <span className="font-disp text-[27px] leading-none tracking-[.02em] text-white uppercase">
              Fuel
            </span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {VOCI.map((v) => (
              <Link
                key={v.href}
                href={v.href}
                aria-current={percorso === v.href ? "page" : undefined}
                className="group relative py-[7px] text-[12px] tracking-[.13em] uppercase transition-colors duration-400 hover:text-white"
                style={{
                  fontVariationSettings: '"wdth" 108, "wght" 600',
                  color: "#fff",
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

          <Link href="/box" className="btn btn-p btn-sm hidden sm:inline-flex">
            Componi il tuo box
            <span className="dot" aria-hidden="true">
              {pronto && pasti > 0 ? pasti : "↗"}
            </span>
          </Link>

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
              className="absolute block h-[2px] w-[18px] bg-lime transition-transform duration-500"
              style={{
                transitionTimingFunction: "var(--e-over)",
                transform: aperto ? "rotate(45deg)" : "translateY(-4px)",
              }}
            />
            <span
              className="absolute block h-[2px] w-[18px] bg-lime transition-transform duration-500"
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
          background: "rgba(6,23,16,.94)",
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
              className="h3 py-2 transition-colors duration-500 hover:text-white"
              style={{
                animation: aperto ? `fuel-rise .7s var(--e-out) both ${90 + i * 60}ms` : undefined,
              }}
            >
              {v.label}
            </Link>
          ))}
        </nav>
        <Link href="/box" onClick={chiudi} className="btn btn-p mt-10 w-max">
          Componi il tuo box
          <span className="dot" aria-hidden="true">
            {pronto && pasti > 0 ? pasti : "↗"}
          </span>
        </Link>
      </div>
    </>
  );
}
