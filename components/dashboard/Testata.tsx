"use client";

/* La testata del pannello. Sul computer: logo e schede in alto. Sul telefono:
   logo in alto e le sei sezioni in una barra fissa in basso, sotto il pollice.
   I numerini (richieste da confermare, messaggi nuovi) vengono da
   PannelloDati, che si aggiorna da solo ogni minuto. */

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Icona, type NomeIcona } from "./PannelloIcone";
import { usePannello } from "./PannelloDati";

/* Le sezioni del pannello, nell'ordine in cui Matteo le usa durante la giornata. */
export const VOCI_PANNELLO = [
  { href: "/dashboard", label: "Oggi" },
  { href: "/dashboard/ordini", label: "Ordini" },
  { href: "/dashboard/produzione", label: "Cucina" },
  { href: "/dashboard/clienti", label: "Clienti" },
  { href: "/dashboard/messaggi", label: "Messaggi" },
  { href: "/dashboard/statistiche", label: "Numeri" },
];

const ICONE: Record<string, NomeIcona> = {
  "/dashboard": "oggi",
  "/dashboard/ordini": "ordini",
  "/dashboard/produzione": "cucina",
  "/dashboard/clienti": "clienti",
  "/dashboard/messaggi": "messaggi",
  "/dashboard/statistiche": "numeri",
};

function attiva(href: string, percorso: string) {
  const p = percorso.replace(/\/+$/, "") || "/";
  if (href === "/dashboard") return p === "/dashboard";
  if (href === "/dashboard/ordini") return p.startsWith(href) || p.startsWith("/dashboard/richiesta");
  return p.startsWith(href);
}

/** Il numerino di una voce e la frase per chi usa il lettore di schermo. */
function useNumerini(): Record<string, { n: number; frase: string } | undefined> {
  const { ordini, messaggiNuovi } = usePannello();
  const daConfermare = ordini?.filter((o) => o.status === "requested").length ?? 0;
  return {
    "/dashboard/ordini": daConfermare ? { n: daConfermare, frase: `${daConfermare} da confermare` } : undefined,
    "/dashboard/messaggi": messaggiNuovi ? { n: messaggiNuovi, frase: `${messaggiNuovi} ${messaggiNuovi === 1 ? "nuovo" : "nuovi"}` } : undefined,
  };
}

export default function Testata() {
  const percorso = usePathname();
  const router = useRouter();
  const numerini = useNumerini();
  const [uscita, setUscita] = useState(false);

  async function esci() {
    setUscita(true);
    try {
      await authClient.signOut();
    } finally {
      router.push("/");
    }
  }

  return (
    <>
      <a href="#contenuto" className="pn-salta">Vai al contenuto</a>
      <header className="notte z-30 print:hidden md:sticky md:top-0">
        <div className="wrap flex h-14 items-center gap-3 md:h-16">
          <Link href="/dashboard" aria-label="FUEL LAB, pannello di Matteo: oggi" className="flex min-h-11 shrink-0 items-center">
            <Image src="/logo-fuellab.png" alt="" width={1095} height={360} className="h-6 w-auto invert md:h-7" priority />
          </Link>
          <span className="pn-matteo">Matteo</span>
          <div className="ml-auto flex items-center">
            <Link href="/" className="pn-link-testata" aria-label="Torna al sito">
              <span className="sm:hidden">Sito</span>
              <span className="hidden sm:inline">Torna al sito</span>
            </Link>
            <button type="button" className="pn-link-testata" onClick={() => void esci()} disabled={uscita}>
              {uscita ? "Esco…" : "Esci"}
            </button>
          </div>
        </div>
        <nav aria-label="Sezioni del pannello" className="hidden border-t border-[var(--line-night)] md:block">
          <div className="wrap pn-schede">
            {VOCI_PANNELLO.map((v) => {
              const numero = numerini[v.href];
              return (
                <Link key={v.href} href={v.href} className="pn-voce" aria-current={attiva(v.href, percorso) ? "page" : undefined}>
                  <Icona nome={ICONE[v.href] ?? "freccia"} className="size-5" />
                  {v.label}
                  {numero ? (
                    <span className="pn-badge">
                      <span aria-hidden="true">{numero.n}</span>
                      <span className="sr-only">, {numero.frase}</span>
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <nav aria-label="Sezioni del pannello" className="notte pn-barra md:hidden print:hidden">
        {VOCI_PANNELLO.map((v) => {
          const numero = numerini[v.href];
          return (
            <Link key={v.href} href={v.href} className="pn-barra-voce" aria-current={attiva(v.href, percorso) ? "page" : undefined}>
              <Icona nome={ICONE[v.href] ?? "freccia"} className="size-6" />
              <span>{v.label}</span>
              {numero ? (
                <span className="pn-badge">
                  <span aria-hidden="true">{numero.n > 99 ? "99+" : numero.n}</span>
                  <span className="sr-only">, {numero.frase}</span>
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
