"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent as KeyboardEventReact } from "react";
import { usePiano } from "@/lib/piano";

/* Cio' che il browser mette nel giro di Tab dentro un pannello. */
const FOCUSABILI =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const VOCI = [
  { href: "/menu", label: "Menu" },
  { href: "/settimana", label: "Componi" },
  { href: "/come-funziona", label: "Come funziona" },
  { href: "/chi-e-matteo", label: "Chi è Matteo" },
];

/* Le pagine che si aprono su una foto scura a tutta altezza: li' la barra parte
   trasparente col logo in negativo, e diventa carta appena si scorre. */
const SU_NOTTE = new Set(["/"]);

export default function Nav() {
  const [aperto, setAperto] = useState(false);
  const [scorso, setScorso] = useState(false);
  const percorso = usePathname();
  const { pasti, pronto } = usePiano();
  const pannello = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const suScroll = () => setScorso(window.scrollY > 24);
    suScroll();
    window.addEventListener("scroll", suScroll, { passive: true });
    return () => window.removeEventListener("scroll", suScroll);
  }, []);

  useEffect(() => {
    if (!aperto) return;
    const suEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAperto(false);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", suEsc);
    pannello.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", suEsc);
    };
  }, [aperto]);

  /* Trappola di Tab: senza, il fuoco scivola sulla pagina dietro l'overlay
     opaco, invisibile e con lo scroll bloccato. Esc resta l'unica uscita. */
  function suTasto(e: KeyboardEventReact<HTMLDivElement>) {
    if (e.key !== "Tab" || !pannello.current) return;
    const nodi = Array.from(pannello.current.querySelectorAll<HTMLElement>(FOCUSABILI)).filter(
      (n) => n.offsetParent !== null,
    );
    if (nodi.length === 0) return;
    const primo = nodi[0];
    const ultimo = nodi[nodi.length - 1];
    if (e.shiftKey && (document.activeElement === primo || document.activeElement === pannello.current)) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primo.focus();
    }
  }

  const trasparente = SU_NOTTE.has(percorso) && !scorso && !aperto;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-60 transition-colors duration-500 ${
          trasparente ? "bg-transparent text-paper" : "border-b bg-paper/92 text-ink backdrop-blur-md"
        }`}
        style={{ borderColor: "var(--line)" }}
      >
        <div className="wrap flex items-center gap-6" style={{ height: "var(--nav-h)" }}>
          <Link href="/" aria-label="FUEL LAB, home" className="mr-auto flex min-h-11 items-center">
            <Image
              src="/logo-fuellab.png"
              alt=""
              width={1095}
              height={360}
              loading="eager"
              fetchPriority="high"
              className={`h-8 w-auto transition-[filter] duration-500 md:h-10 ${trasparente ? "invert" : ""}`}
            />
          </Link>

          <nav aria-label="Principale" className="hidden items-center gap-8 lg:flex">
            {VOCI.map((v) => {
              const attiva = percorso === v.href || percorso.startsWith(v.href + "/");
              return (
                <Link
                  key={v.href}
                  href={v.href}
                  aria-current={attiva ? "page" : undefined}
                  className="relative py-2 font-disp text-[13px] font-semibold tracking-[.16em] uppercase"
                >
                  {v.label}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 -bottom-0.5 h-[3px] bg-lime transition-transform duration-500 ${
                      attiva ? "scale-x-100" : "scale-x-0"
                    } origin-left`}
                  />
                </Link>
              );
            })}
          </nav>

          <Link href="/settimana" className="btn btn-lime btn-sm hidden sm:inline-flex">
            {pronto && pasti > 0 ? (
              <>
                La tua settimana <span className="num">{pasti}</span>
              </>
            ) : (
              <>
                Componi <span className="freccia">→</span>
              </>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setAperto((a) => !a)}
            aria-expanded={aperto}
            aria-controls="menu-mobile"
            aria-label={aperto ? "Chiudi il menu" : "Apri il menu"}
            className="relative grid h-11 w-11 place-items-center lg:hidden"
          >
            <span
              className="absolute block h-[2px] w-6 bg-current transition-transform duration-500"
              style={{ transform: aperto ? "rotate(45deg)" : "translateY(-5px)" }}
            />
            <span
              className="absolute block h-[2px] w-6 bg-current transition-transform duration-500"
              style={{ transform: aperto ? "rotate(-45deg)" : "translateY(5px)" }}
            />
          </button>
        </div>
      </header>

      <div
        id="menu-mobile"
        ref={pannello}
        hidden={!aperto}
        tabIndex={-1}
        onKeyDown={suTasto}
        className="notte fixed inset-0 z-50 flex flex-col justify-between px-6 pt-28 pb-10 outline-none lg:hidden"
      >
        <nav aria-label="Principale" className="flex flex-col">
          {VOCI.map((v, i) => (
            <Link
              key={v.href}
              href={v.href}
              onClick={() => setAperto(false)}
              className="border-b py-4 font-disp text-[40px] leading-none font-bold uppercase"
              style={{
                borderColor: "var(--line)",
                animation: aperto ? `fuel-sale .6s var(--e-out) both ${60 + i * 50}ms` : undefined,
              }}
            >
              {v.label}
            </Link>
          ))}
        </nav>
        <Link href="/richiesta" onClick={() => setAperto(false)} className="btn btn-lime w-full">
          Scrivi a Matteo <span className="freccia">→</span>
        </Link>
      </div>
    </>
  );
}
