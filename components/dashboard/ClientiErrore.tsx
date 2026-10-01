"use client";

/* L'errore di caricamento di una pagina del pannello (Clienti, Messaggi, Numeri,
   Impostazioni). Se la sessione e' scaduta (il server risponde 401 o 403) dire
   "Riprova" non serve a niente: serve il collegamento per rientrare, e dopo
   l'accesso si torna dove si era. Per i dati della Cucina c'e' ErroreDati
   (PannelloStato), che fa lo stesso sul giro condiviso degli ordini. */

import Link from "next/link";
import { ApiError } from "@/lib/api";
import { Avviso } from "./ui";

/** 401 (nessuna sessione) o 403 (non e' piu' Matteo): la sessione non vale piu'. */
export const eSessioneScaduta = (e: unknown) => e instanceof ApiError && (e.status === 401 || e.status === 403);

/** Il testo dell'errore di una chiamata, o il ripiego se non ne ha uno. */
export const testoErrore = (e: unknown, ripiego: string) => (e instanceof Error && e.message ? e.message : ripiego);

export function ErroreCaricamento({ testo, sessioneScaduta = false }: { testo: string; sessioneScaduta?: boolean }) {
  if (!sessioneScaduta) return <Avviso>{testo}</Avviso>;
  const ritorno = `${window.location.pathname}${window.location.search}`;
  return (
    <Avviso>
      La sessione è scaduta.{" "}
      <Link href={`/accedi?next=${encodeURIComponent(ritorno)}`} className="underline">
        Accedi di nuovo
      </Link>{" "}
      per continuare.
    </Avviso>
  );
}
