/* Icone semplici a tratto, 24x24, colore del testo. Decorative: accanto c'e'
   sempre un'etichetta scritta, quindi aria-hidden. */

import type { ReactNode } from "react";

export type NomeIcona =
  | "oggi"
  | "ordini"
  | "cucina"
  | "clienti"
  | "messaggi"
  | "numeri"
  | "telefono"
  | "whatsapp"
  | "email"
  | "mappa"
  | "chiudi"
  | "freccia"
  | "aggiorna"
  | "scarica"
  | "attenzione"
  | "spunta"
  | "lucchetto"
  | "elenco"
  | "colonne"
  | "cerca"
  | "impostazioni";

const TRATTI: Record<NomeIcona, ReactNode> = {
  oggi: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  ordini: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="1" />
      <path d="M9 4V2.5h6V4M8.5 10h7M8.5 14h7M8.5 18h4" />
    </>
  ),
  cucina: (
    <>
      <path d="M3 11h18v3a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6z" />
      <path d="M1 11h2M21 11h2M9 7c0-1.5 1-1.5 1-3M14 7c0-1.5 1-1.5 1-3" />
    </>
  ),
  clienti: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" />
      <path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.8.7 3 2.4 3.5 5.2" />
    </>
  ),
  messaggi: (
    <path d="M4 5h16v11H9l-5 4z" />
  ),
  numeri: (
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  ),
  telefono: (
    <path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z" />
  ),
  whatsapp: (
    <>
      <path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.3z" />
      <path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.8-2.2-1-1 1a4 4 0 0 1-2.5-2.5l1-1-1-2.2z" />
    </>
  ),
  email: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="M3.5 6l8.5 7 8.5-7" />
    </>
  ),
  mappa: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  chiudi: <path d="M6 6l12 12M18 6L6 18" />,
  freccia: <path d="M5 12h14M13 6l6 6-6 6" />,
  aggiorna: (
    <>
      <path d="M20 12a8 8 0 1 1-2.3-5.7" />
      <path d="M20 4v5h-5" />
    </>
  ),
  scarica: <path d="M12 3v12M7 10l5 5 5-5M4 20h16" />,
  attenzione: (
    <>
      <path d="M12 3l10 18H2z" />
      <path d="M12 10v5M12 18v.5" />
    </>
  ),
  spunta: <path d="M4 12.5l5 5L20 6.5" />,
  lucchetto: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="1" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  elenco: <path d="M4 6h16M4 12h16M4 18h16" />,
  colonne: (
    <>
      <rect x="3" y="4" width="5" height="16" />
      <rect x="10" y="4" width="5" height="11" />
      <rect x="17" y="4" width="4" height="7" />
    </>
  ),
  cerca: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5L21 21" />
    </>
  ),
  impostazioni: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>
  ),
};

export function Icona({ nome, className = "size-6" }: { nome: NomeIcona; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      {TRATTI[nome]}
    </svg>
  );
}
