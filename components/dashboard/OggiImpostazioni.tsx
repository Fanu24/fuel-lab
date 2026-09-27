"use client";

/* Su "Oggi", sotto il saluto: le impostazioni che toccano questi giorni.
   Una chiusura oggi o nei prossimi sette giorni, e i piatti segnati come non
   disponibili, perche' Matteo non se ne dimentichi quando la settimana cambia.
   Niente da dire, niente riquadro. */

import Link from "next/link";
import { getPiatto } from "@/lib/catalogo";
import { chiusureVicine, durata, periodo } from "@/lib/impostazioni";
import { plurale } from "@/lib/operazioni";
import { useImpostazioni } from "@/components/impostazioni/useImpostazioni";
import { Icona } from "./PannelloIcone";

/** "tra 3 giorni", "domani", "oggi". */
function quanto(dal: string, oggi: string): string {
  const giorni = durata({ dal: oggi, al: dal }) - 1;
  return giorni <= 0 ? "oggi" : giorni === 1 ? "domani" : `tra ${giorni} giorni`;
}

export default function OggiImpostazioni({ oggi }: { oggi: string }) {
  const { stato, impostazioni } = useImpostazioni({ fresche: true });
  if (stato === "attesa") return null;
  const chiusure = chiusureVicine(impostazioni.chiusure, oggi, 7);
  const esclusi = impostazioni.piattiNonDisponibili;
  if (!chiusure.length && !esclusi.length) return null;

  return (
    <section aria-labelledby="oggi-impostazioni" className="pn-imp-promemoria">
      <h2 id="oggi-impostazioni" className="sr-only">Chiusure e piatti non disponibili</h2>
      <ul className="grid gap-2">
        {chiusure.map((c) => {
          const inCorso = c.dal <= oggi;
          return (
            <li key={`${c.dal}-${c.al}`}>
              <Link href="/dashboard/impostazioni#chiusure" className={`pn-imp-nota ${inCorso ? "pn-imp-nota-allarme" : "pn-imp-nota-attenzione"}`}>
                <Icona nome="attenzione" />
                <span className="min-w-0">
                  <strong className="block">{inCorso ? "Oggi sei chiuso" : `Chiusura ${quanto(c.dal, oggi)}`}</strong>
                  <span className="block">
                    Chiuso {periodo(c.dal, c.al, oggi)}
                    {c.motivo ? ` (${c.motivo})` : ""}: i clienti non possono scegliere questi giorni.
                  </span>
                </span>
                <Icona nome="freccia" className="size-5" />
              </Link>
            </li>
          );
        })}
        {esclusi.length ? (
          <li>
            <Link href="/dashboard/impostazioni#piatti" className="pn-imp-nota pn-imp-nota-attenzione">
              <Icona nome="cucina" />
              <span className="min-w-0">
                <strong className="block">{plurale(esclusi.length, "piatto non disponibile", "piatti non disponibili")}</strong>
                <span className="block">
                  {esclusi.map((id) => getPiatto(id)?.nome ?? id).join(", ")}: sul sito non si possono scegliere.
                </span>
              </span>
              <Icona nome="freccia" className="size-5" />
            </Link>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
