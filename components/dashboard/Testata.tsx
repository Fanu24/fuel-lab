"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const VOCI = [
  { href: "/dashboard", label: "Operazioni" },
  { href: "/dashboard/produzione", label: "Produzione" },
];

export default function Testata() {
  const percorso = usePathname();
  const router = useRouter();
  return (
    <header className="notte sticky top-0 z-30 print:hidden">
      <div className="wrap flex h-16 items-center gap-6">
        <Link href="/dashboard" aria-label="Pannello, richieste" className="flex min-h-11 shrink-0 items-center gap-3">
          <Image src="/logo-fuellab.png" alt="" width={1095} height={360} className="h-7 w-auto invert" />
        </Link>
        <span className="hidden bg-lime px-2 py-1 font-disp text-[11px] font-bold tracking-[.16em] text-ink uppercase sm:inline">Matteo</span>
        <nav aria-label="Pannello" className="ml-auto flex h-full items-stretch">
          {VOCI.map((v) => {
            const attiva = v.href === "/dashboard" ? percorso === v.href || percorso.startsWith("/dashboard/richiesta") : percorso.startsWith(v.href);
            return (
              <Link
                key={v.href}
                href={v.href}
                aria-current={attiva ? "page" : undefined}
                className={`flex items-center px-3 font-disp text-xs font-semibold tracking-[.16em] uppercase sm:px-5 ${
                  attiva ? "shadow-[inset_0_-3px_0_var(--color-lime)]" : "text-steel hover:text-paper"
                }`}
              >
                {v.label}
              </Link>
            );
          })}
        </nav>
        <Link href="/" className="hidden min-h-11 items-center text-sm text-steel hover:text-paper md:inline-flex">
          Torna al sito
        </Link>
        <button type="button" className="hidden min-h-11 text-sm text-steel hover:text-paper md:inline-flex md:items-center" onClick={() => void authClient.signOut().then(() => router.push("/"))}>Esci</button>
      </div>
    </header>
  );
}
