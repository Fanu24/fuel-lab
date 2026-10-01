"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSessione } from "@/components/account/sessione";
import { IconaPersona } from "@/components/account/ui";
import WhatsAppCta from "@/components/ui/WhatsAppCta";
import { iniziale, nomeBreve } from "@/lib/account";
import { EMAIL } from "@/lib/sito";

/* Cio' che il browser mette nel giro di Tab dentro un pannello. */
const FOCUSABILI =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* Una voce di menu e' la pagina corrente se e' la sua rotta o una sottopagina. */
const inRotta = (percorso: string, href: string) => percorso === href || percorso.startsWith(href + "/");

/* Nella barra del computer "Contatti" non c'e': porta alla stessa pagina del
   bottone "Scrivi a Matteo" che sta accanto alla nav, e con "Abbonamento" non
   entra a 1024px (ne' a 1280 e 1440 per Matteo, che ha anche "Pannello").
   Nel menu del telefono lo spazio c'e', e Contatti torna al suo posto
   (CONTATTI, sotto).

   Le voci della barra non vanno mai a capo: fra 1024 e 1535px gli spazi e la
   spaziatura delle lettere si stringono e il logo non si rimpicciolisce; dai
   1536px tornano quelli pieni. */
const VOCI = [
  { href: "/menu", label: "Menu" },
  { href: "/abbonamento", label: "Abbonamento" },
  { href: "/settimana", label: "Componi" },
  { href: "/come-funziona", label: "Come funziona" },
  { href: "/chi-siamo", label: "Chi siamo" },
  { href: "/account", label: "Area cliente" },
];

/* Solo nel menu del telefono, prima dell'area cliente. */
const CONTATTI = { href: "/richiesta", label: "Contatti" };

/* Le pagine che si aprono su una foto scura a tutta altezza: li' la barra parte
   trasparente col logo in negativo, e diventa carta appena si scorre. */
const SU_NOTTE = new Set(["/"]);

export default function Nav() {
  const [aperto, setAperto] = useState(false);
  const [scorso, setScorso] = useState(false);
  const percorso = usePathname();
  /* Se la pagina cambia a menu aperto (l'"indietro" del browser, un link da
     tastiera) il menu si chiude: altrimenti resterebbe sopra la pagina nuova. */
  const [percorsoVisto, setPercorsoVisto] = useState(percorso);
  if (percorso !== percorsoVisto) {
    setPercorsoVisto(percorso);
    setAperto(false);
  }
  const testata = useRef<HTMLElement>(null);
  const pannello = useRef<HTMLDivElement>(null);
  const bottoneMenu = useRef<HTMLButtonElement>(null);
  /* Una sola chiamata a /api/me per pagina, condivisa con l'area cliente. Finche'
     non risponde lo spazio del bottone account resta riservato e vuoto: niente
     "Accedi" che diventa un nome sotto gli occhi. */
  const sessione = useSessione();
  const utente = sessione.utente;
  const admin = utente?.role === "admin";
  const voci = VOCI.map((v) => (v.href === "/account" && utente ? { ...v, label: "Il mio account" } : v));
  const vociMobile = [
    ...voci.filter((v) => v.href !== "/account"),
    CONTATTI,
    ...voci.filter((v) => v.href === "/account"),
    ...(admin ? [{ href: "/dashboard", label: "Pannello" }] : []),
  ];
  const suAccount = percorso === "/account" || percorso === "/accedi";
  const etichettaAccount =
    sessione.stato === "attesa" ? "Area cliente"
    : utente ? `Il mio account, ${nomeBreve(utente.name, utente.email)}`
    : "Accedi o crea un account";

  useEffect(() => {
    const suScroll = () => setScorso(window.scrollY > 24);
    suScroll();
    window.addEventListener("scroll", suScroll, { passive: true });
    return () => window.removeEventListener("scroll", suScroll);
  }, []);

  useEffect(() => {
    if (!aperto) return;
    const visibili = (radice: HTMLElement | null) =>
      radice
        ? Array.from(radice.querySelectorAll<HTMLElement>(FOCUSABILI)).filter((n) => n.getClientRects().length > 0)
        : [];
    const suTasto = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAperto(false);
        // Il fuoco torna al bottone che ha aperto il menu, non si perde sul body.
        bottoneMenu.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      /* Trappola di Tab: senza, il fuoco scivola sulla pagina dietro l'overlay
         opaco, invisibile e con lo scroll bloccato. Il giro comprende la barra
         (logo, account, la X che chiude: restano sopra il pannello) e il pannello. */
      const nodi = [...visibili(testata.current), ...visibili(pannello.current)];
      if (nodi.length === 0) return;
      const primo = nodi[0];
      const ultimo = nodi[nodi.length - 1];
      const attivo = document.activeElement as HTMLElement | null;
      const dentro = attivo === pannello.current || (attivo !== null && nodi.includes(attivo));
      if (!dentro) {
        e.preventDefault();
        primo.focus();
      } else if (e.shiftKey && attivo === primo) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && attivo === ultimo) {
        e.preventDefault();
        primo.focus();
      }
    };
    /* Girando il tablet in orizzontale la barra del computer prende il posto del
       menu: se restasse "aperto" (nascosto da lg:hidden) lo scroll sarebbe
       bloccato senza che nessun pannello lo giustifichi. Stessa soglia di lg. */
    const computer = window.matchMedia("(min-width: 1024px)");
    const suLarghezza = () => {
      if (computer.matches) setAperto(false);
    };
    computer.addEventListener("change", suLarghezza);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", suTasto);
    pannello.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", suTasto);
      computer.removeEventListener("change", suLarghezza);
    };
  }, [aperto]);

  const trasparente = SU_NOTTE.has(percorso) && !scorso && !aperto;

  return (
    <>
      <header
        ref={testata}
        className={`fixed inset-x-0 top-0 z-60 transition-colors duration-500 ${
          trasparente ? "bg-transparent text-paper" : "border-b bg-paper/92 text-ink backdrop-blur-md"
        }`}
        style={{ borderColor: "var(--line)" }}
      >
        <div className="wrap flex items-center gap-6 lg:gap-4 2xl:gap-6" style={{ height: "var(--nav-h)" }}>
          <Link href="/" aria-label="FUEL LAB, home" className="mr-auto flex min-h-11 shrink-0 items-center">
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

          <nav aria-label="Principale" className="hidden items-center gap-4 lg:flex xl:gap-6 2xl:gap-8">
            {VOCI.filter((v) => v.href !== "/account").map((v) => {
              const attiva = inRotta(percorso, v.href);
              return (
                <Link
                  key={v.href}
                  href={v.href}
                  aria-current={attiva ? "page" : undefined}
                  className="relative py-3 font-disp text-[13px] font-semibold tracking-[.12em] whitespace-nowrap uppercase 2xl:tracking-[.16em]"
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
            {admin ? (
              <Link
                href="/dashboard"
                className="hidden py-3 font-disp text-[13px] font-semibold tracking-[.12em] whitespace-nowrap uppercase xl:inline-block 2xl:tracking-[.16em]"
              >
                Pannello
              </Link>
            ) : null}
          </nav>

          <Link
            href={utente ? "/account" : "/accedi"}
            aria-label={etichettaAccount}
            title={etichettaAccount}
            aria-current={suAccount ? "page" : undefined}
            data-stato={sessione.stato === "attesa" ? "attesa" : utente ? "dentro" : "fuori"}
            className="acc-nav"
          >
            <span aria-hidden="true" className="acc-nav-segno">
              {utente ? iniziale(utente.name, utente.email) : sessione.stato === "attesa" ? null : <IconaPersona />}
            </span>
            <span aria-hidden="true" className="acc-nav-testo">
              {utente ? nomeBreve(utente.name, utente.email) : sessione.stato === "attesa" ? "" : "Accedi"}
            </span>
          </Link>

          <WhatsAppCta
            mostraAvviso={false}
            label="WhatsApp"
            buttonClassName="hidden !min-h-12 !px-4 !text-xs sm:inline-flex"
          />

          <button
            type="button"
            ref={bottoneMenu}
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
        className={`notte fixed inset-0 z-50 flex-col justify-between overflow-y-auto overscroll-contain px-[var(--gut)] pt-28 pb-8 outline-none focus:shadow-none lg:hidden ${aperto ? "flex" : "hidden"}`}
      >
        <nav aria-label="Principale" className="flex flex-col">
          {vociMobile.map((v, i) => {
            const attiva = inRotta(percorso, v.href);
            return (
              <Link
                key={v.href}
                href={v.href}
                onClick={() => setAperto(false)}
                aria-current={attiva ? "page" : undefined}
                className={`border-b py-3 font-disp text-[clamp(26px,8vw,40px)] leading-none font-bold uppercase ${attiva ? "text-lime" : ""}`}
                style={{
                  borderColor: "var(--line)",
                  animation: aperto ? `fuel-sale .6s var(--e-out) both ${60 + i * 50}ms` : undefined,
                }}
              >
                {v.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-8">
          <WhatsAppCta
            label="Contatta su WhatsApp"
            onClick={() => setAperto(false)}
            buttonClassName="w-full justify-between"
          />
          <a href={`mailto:${EMAIL}`} className="mt-4 inline-flex min-h-11 items-center text-sm underline underline-offset-4">
            Oppure scrivi a {EMAIL}
          </a>
        </div>
      </div>
    </>
  );
}
